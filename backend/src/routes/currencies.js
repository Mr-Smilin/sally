const router = require('express').Router();
const { PrismaClient } = require('@prisma/client');
const { requireAdmin } = require('../middleware/auth');
const { logAction, getIp } = require('../utils/audit');
const prisma = new PrismaClient();

router.get('/', async (req, res, next) => {
  try {
    const currencies = await prisma.currency.findMany({
      orderBy: [{ isDefault: 'desc' }, { code: 'asc' }],
    });
    res.json(currencies);
  } catch (err) { next(err); }
});

router.post('/', requireAdmin, async (req, res, next) => {
  try {
    const { code, name, symbol, isDefault } = req.body;
    if (!code || !name || !symbol) return res.status(400).json({ error: 'code, name, symbol required' });
    if (isDefault) {
      await prisma.currency.updateMany({ where: { isDefault: true }, data: { isDefault: false } });
    }
    const currency = await prisma.currency.create({
      data: { code: code.toUpperCase(), name, symbol, isDefault: isDefault || false },
    });
    await logAction(req.user.id, req.user.username, 'CURRENCY_CREATE', `${code} ${name}`, getIp(req));
    res.json(currency);
  } catch (err) { next(err); }
});

router.put('/:id/default', requireAdmin, async (req, res, next) => {
  try {
    await prisma.currency.updateMany({ where: { isDefault: true }, data: { isDefault: false } });
    const currency = await prisma.currency.update({
      where: { id: Number(req.params.id) },
      data: { isDefault: true },
    });
    await logAction(req.user.id, req.user.username, 'CURRENCY_SET_DEFAULT', currency.code, getIp(req));
    res.json(currency);
  } catch (err) { next(err); }
});

router.put('/:id', requireAdmin, async (req, res, next) => {
  try {
    const { name, symbol } = req.body;
    const currency = await prisma.currency.update({
      where: { id: Number(req.params.id) },
      data: { ...(name && { name }), ...(symbol && { symbol }) },
    });
    await logAction(req.user.id, req.user.username, 'CURRENCY_UPDATE', currency.code, getIp(req));
    res.json(currency);
  } catch (err) { next(err); }
});

router.delete('/:id', requireAdmin, async (req, res, next) => {
  try {
    const cur = await prisma.currency.findUnique({ where: { id: Number(req.params.id) } });
    if (cur?.isDefault) return res.status(400).json({ error: '不能刪除預設幣別' });
    await prisma.currency.delete({ where: { id: Number(req.params.id) } });
    await logAction(req.user.id, req.user.username, 'CURRENCY_DELETE', cur.code, getIp(req));
    res.json({ success: true });
  } catch (err) { next(err); }
});

module.exports = router;
