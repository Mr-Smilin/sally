const router = require('express').Router();
const { PrismaClient } = require('@prisma/client');
const { logAction, getIp } = require('../utils/audit');
const prisma = new PrismaClient();

router.get('/', async (req, res, next) => {
  try {
    const categories = await prisma.category.findMany({
      where: { OR: [{ isGlobal: true }, { userId: req.user.id }] },
      orderBy: [{ isGlobal: 'desc' }, { name: 'asc' }],
    });
    res.json(categories);
  } catch (err) { next(err); }
});

router.post('/', async (req, res, next) => {
  try {
    const { name, icon, color, type } = req.body;
    if (!name || !type) return res.status(400).json({ error: 'name and type required' });
    const cat = await prisma.category.create({
      data: { name, icon: icon || '💰', color: color || '#6366f1', type, userId: req.user.id, isGlobal: false },
    });
    await logAction(req.user.id, req.user.username, 'CATEGORY_CREATE', `${name} (${type})`, getIp(req));
    res.json(cat);
  } catch (err) { next(err); }
});

router.put('/:id', async (req, res, next) => {
  try {
    const cat = await prisma.category.findFirst({ where: { id: Number(req.params.id), userId: req.user.id } });
    if (!cat) return res.status(404).json({ error: 'Not found or cannot edit global category' });
    const { name, icon, color } = req.body;
    const updated = await prisma.category.update({
      where: { id: cat.id },
      data: { ...(name && { name }), ...(icon && { icon }), ...(color && { color }) },
    });
    await logAction(req.user.id, req.user.username, 'CATEGORY_UPDATE', cat.name, getIp(req));
    res.json(updated);
  } catch (err) { next(err); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const cat = await prisma.category.findFirst({ where: { id: Number(req.params.id), userId: req.user.id } });
    if (!cat) return res.status(404).json({ error: 'Not found or cannot delete global category' });
    await prisma.category.delete({ where: { id: cat.id } });
    await logAction(req.user.id, req.user.username, 'CATEGORY_DELETE', cat.name, getIp(req));
    res.json({ success: true });
  } catch (err) { next(err); }
});

module.exports = router;
