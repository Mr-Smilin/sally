const router = require('express').Router();
const { PrismaClient } = require('@prisma/client');
const { logAction, getIp } = require('../utils/audit');
const prisma = new PrismaClient();

function buildWhere(req) {
  const { type, categoryId, startDate, endDate, search, userId } = req.query;
  const where = {};
  if (req.user.role === 'ADMIN' && userId) {
    where.userId = Number(userId);
  } else if (req.user.role !== 'ADMIN') {
    where.userId = req.user.id;
  }
  if (type) where.type = type;
  if (categoryId) where.categoryId = Number(categoryId);
  if (search) where.note = { contains: search, mode: 'insensitive' };
  if (startDate || endDate) {
    where.date = {};
    if (startDate) where.date.gte = new Date(startDate);
    if (endDate) where.date.lte = new Date(endDate);
  }
  return where;
}

router.get('/', async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const where = buildWhere(req);
    const isAdmin = req.user.role === 'ADMIN';
    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        include: {
          category: true,
          currency: true,
          ...(isAdmin && { user: { select: { id: true, username: true } } }),
        },
        orderBy: { date: 'desc' },
        skip: (page - 1) * Number(limit),
        take: Number(limit),
      }),
      prisma.transaction.count({ where }),
    ]);
    res.json({ transactions, total, page: Number(page), limit: Number(limit) });
  } catch (err) { next(err); }
});

router.get('/summary', async (req, res, next) => {
  try {
    const where = buildWhere(req);
    const transactions = await prisma.transaction.findMany({
      where,
      include: { category: true, currency: true },
    });
    const income = transactions.filter(t => t.type === 'INCOME').reduce((s, t) => s + Number(t.amount), 0);
    const expense = transactions.filter(t => t.type === 'EXPENSE').reduce((s, t) => s + Number(t.amount), 0);
    const byCategory = {};
    for (const t of transactions) {
      const key = t.category.name;
      if (!byCategory[key]) byCategory[key] = { name: key, icon: t.category.icon, color: t.category.color, type: t.type, total: 0 };
      byCategory[key].total += Number(t.amount);
    }
    res.json({ income, expense, balance: income - expense, byCategory: Object.values(byCategory) });
  } catch (err) { next(err); }
});

router.get('/report', async (req, res, next) => {
  try {
    const { startDate, endDate, userIds, categoryIds, currencyIds } = req.query;
    const isAdmin = req.user.role === 'ADMIN';
    const where = {};
    if (isAdmin && userIds) {
      where.userId = { in: userIds.split(',').map(Number) };
    } else if (!isAdmin) {
      where.userId = req.user.id;
    }
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) where.date.lte = new Date(endDate);
    }
    if (categoryIds) where.categoryId = { in: categoryIds.split(',').map(Number) };
    if (currencyIds) where.currencyId = { in: currencyIds.split(',').map(Number) };
    const transactions = await prisma.transaction.findMany({
      where,
      include: {
        category: true,
        currency: true,
        ...(isAdmin && { user: { select: { id: true, username: true } } }),
      },
      orderBy: { date: 'desc' },
    });
    res.json(transactions);
  } catch (err) { next(err); }
});

router.post('/', async (req, res, next) => {
  try {
    const { amount, type, note, date, categoryId, currencyId } = req.body;
    if (!amount || !type || !categoryId) return res.status(400).json({ error: 'amount, type, categoryId required' });
    const tx = await prisma.transaction.create({
      data: {
        amount: parseFloat(amount),
        type,
        note,
        date: date ? new Date(date) : new Date(),
        categoryId: Number(categoryId),
        userId: req.user.id,
        ...(currencyId && { currencyId: Number(currencyId) }),
      },
      include: { category: true, currency: true },
    });
    await logAction(req.user.id, req.user.username, 'TRANSACTION_CREATE',
      `${type === 'EXPENSE' ? '支出' : '收入'} ${tx.currency?.symbol || ''}${amount} (${tx.category.name})`, getIp(req));
    res.json(tx);
  } catch (err) { next(err); }
});

router.put('/:id', async (req, res, next) => {
  try {
    const canEdit = req.user.role === 'ADMIN'
      ? { id: Number(req.params.id) }
      : { id: Number(req.params.id), userId: req.user.id };
    const tx = await prisma.transaction.findFirst({ where: canEdit });
    if (!tx) return res.status(404).json({ error: 'Not found' });
    const { amount, type, note, date, categoryId, currencyId } = req.body;
    const updated = await prisma.transaction.update({
      where: { id: tx.id },
      data: {
        ...(amount && { amount: parseFloat(amount) }),
        ...(type && { type }),
        ...(note !== undefined && { note }),
        ...(date && { date: new Date(date) }),
        ...(categoryId && { categoryId: Number(categoryId) }),
        ...(currencyId !== undefined && { currencyId: currencyId ? Number(currencyId) : null }),
      },
      include: { category: true, currency: true },
    });
    await logAction(req.user.id, req.user.username, 'TRANSACTION_UPDATE', `ID ${tx.id}`, getIp(req));
    res.json(updated);
  } catch (err) { next(err); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const canDelete = req.user.role === 'ADMIN'
      ? { id: Number(req.params.id) }
      : { id: Number(req.params.id), userId: req.user.id };
    const tx = await prisma.transaction.findFirst({ where: canDelete, include: { category: true } });
    if (!tx) return res.status(404).json({ error: 'Not found' });
    await prisma.transaction.delete({ where: { id: tx.id } });
    await logAction(req.user.id, req.user.username, 'TRANSACTION_DELETE',
      `${tx.type === 'EXPENSE' ? '支出' : '收入'} ${tx.amount} (${tx.category.name})`, getIp(req));
    res.json({ success: true });
  } catch (err) { next(err); }
});

module.exports = router;
