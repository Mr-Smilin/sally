const router = require('express').Router();
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const { requireAdmin } = require('../middleware/auth');
const { logAction, getIp } = require('../utils/audit');
const prisma = new PrismaClient();

router.post('/', requireAdmin, async (req, res, next) => {
  try {
    const { username, email, password, role = 'USER' } = req.body;
    if (!username || !email || !password) return res.status(400).json({ error: '請填寫所有必要欄位' });
    if (password.length < 6) return res.status(400).json({ error: '密碼至少 6 個字元' });

    const existing = await prisma.user.findFirst({ where: { OR: [{ email }, { username }] } });
    if (existing) return res.status(409).json({ error: '用戶名或信箱已被使用' });

    const hashed = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { username, email, password: hashed, role },
      select: { id: true, username: true, email: true, role: true, isActive: true, createdAt: true },
    });
    await logAction(req.user.id, req.user.username, 'ADMIN_CREATE_USER', username, getIp(req));
    res.json(user);
  } catch (err) { next(err); }
});

router.get('/', requireAdmin, async (req, res, next) => {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, username: true, email: true, role: true, isActive: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json(users);
  } catch (err) { next(err); }
});

router.put('/me', async (req, res, next) => {
  try {
    const { email, username } = req.body;
    if (email) {
      const dup = await prisma.user.findFirst({ where: { email, id: { not: req.user.id } } });
      if (dup) return res.status(409).json({ error: '此信箱已被使用' });
    }
    if (username) {
      const dup = await prisma.user.findFirst({ where: { username, id: { not: req.user.id } } });
      if (dup) return res.status(409).json({ error: '此用戶名已被使用' });
    }
    const updated = await prisma.user.update({
      where: { id: req.user.id },
      data: { ...(email && { email }), ...(username && { username }) },
      select: { id: true, username: true, email: true, role: true },
    });
    await logAction(req.user.id, req.user.username, 'PROFILE_UPDATE', null, getIp(req));
    res.json(updated);
  } catch (err) { next(err); }
});

router.put('/me/password', async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) return res.status(400).json({ error: '新密碼至少 6 個字元' });
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) return res.status(401).json({ error: '目前密碼不正確' });
    const hashed = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({ where: { id: req.user.id }, data: { password: hashed } });
    await logAction(req.user.id, req.user.username, 'PASSWORD_CHANGE', null, getIp(req));
    res.json({ success: true });
  } catch (err) { next(err); }
});

router.put('/:id', requireAdmin, async (req, res, next) => {
  try {
    const targetId = Number(req.params.id);
    if (targetId === req.user.id) return res.status(400).json({ error: '無法修改自己的帳號' });
    const { role, isActive, email, username, newPassword } = req.body;
    const data = {};
    if (role) data.role = role;
    if (isActive !== undefined) data.isActive = isActive;
    if (email) {
      const dup = await prisma.user.findFirst({ where: { email, id: { not: targetId } } });
      if (dup) return res.status(409).json({ error: '此信箱已被使用' });
      data.email = email;
    }
    if (username) {
      const dup = await prisma.user.findFirst({ where: { username, id: { not: targetId } } });
      if (dup) return res.status(409).json({ error: '此用戶名已被使用' });
      data.username = username;
    }
    if (newPassword) {
      if (newPassword.length < 6) return res.status(400).json({ error: '密碼至少 6 個字元' });
      data.password = await bcrypt.hash(newPassword, 10);
    }
    const updated = await prisma.user.update({
      where: { id: targetId },
      data,
      select: { id: true, username: true, email: true, role: true, isActive: true },
    });
    await logAction(req.user.id, req.user.username, 'ADMIN_UPDATE_USER', updated.username, getIp(req));
    res.json(updated);
  } catch (err) { next(err); }
});

router.delete('/:id', requireAdmin, async (req, res, next) => {
  try {
    if (Number(req.params.id) === req.user.id) return res.status(400).json({ error: '無法刪除自己的帳號' });
    const target = await prisma.user.findUnique({ where: { id: Number(req.params.id) } });
    await prisma.user.delete({ where: { id: Number(req.params.id) } });
    await logAction(req.user.id, req.user.username, 'ADMIN_DELETE_USER', target?.username, getIp(req));
    res.json({ success: true });
  } catch (err) { next(err); }
});

module.exports = router;
