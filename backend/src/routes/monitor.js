const router = require('express').Router();
const { PrismaClient } = require('@prisma/client');
const { requireAdmin } = require('../middleware/auth');
const { logAction, getIp } = require('../utils/audit');
const prisma = new PrismaClient();

// ── Audit logs ───────────────────────────────────────────────────────────────

router.get('/', requireAdmin, async (req, res, next) => {
  try {
    const { userId, action, startDate, endDate, page = 1, limit = 50 } = req.query;
    const where = {};
    if (userId) where.userId = Number(userId);
    if (action) where.action = action;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate + 'T23:59:59');
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * Number(limit),
        take: Number(limit),
      }),
      prisma.auditLog.count({ where }),
    ]);

    res.json({ logs, total, page: Number(page), limit: Number(limit) });
  } catch (err) { next(err); }
});

router.get('/actions', requireAdmin, async (req, res, next) => {
  try {
    const actions = await prisma.auditLog.groupBy({
      by: ['action'],
      orderBy: { action: 'asc' },
    });
    res.json(actions.map(a => a.action));
  } catch (err) { next(err); }
});

// ── IP blacklist ─────────────────────────────────────────────────────────────

router.get('/ip-blacklist', requireAdmin, async (req, res, next) => {
  try {
    const list = await prisma.ipBlacklist.findMany({ orderBy: { bannedAt: 'desc' } });
    res.json(list);
  } catch (err) { next(err); }
});

router.post('/ip-blacklist', requireAdmin, async (req, res, next) => {
  try {
    const { ip, reason } = req.body;
    if (!ip) return res.status(400).json({ error: 'IP is required' });
    const entry = await prisma.ipBlacklist.upsert({
      where: { ip },
      create: { ip, reason, bannedBy: req.user.username, expiresAt: null },
      update: { reason, bannedBy: req.user.username, bannedAt: new Date(), expiresAt: null },
    });
    await logAction(req.user.id, req.user.username, 'IP_BANNED', `手動封鎖 ${ip}：${reason || ''}`, getIp(req));
    res.json(entry);
  } catch (err) { next(err); }
});

router.delete('/ip-blacklist/:ip', requireAdmin, async (req, res, next) => {
  try {
    const ip = decodeURIComponent(req.params.ip);
    await prisma.ipBlacklist.deleteMany({ where: { ip } });
    await logAction(req.user.id, req.user.username, 'IP_UNBAN', `解封 ${ip}`, getIp(req));
    res.json({ success: true });
  } catch (err) { next(err); }
});

// ── Login settings ────────────────────────────────────────────────────────────

router.get('/settings', requireAdmin, async (req, res, next) => {
  try {
    let setting = await prisma.loginSetting.findUnique({ where: { id: 1 } });
    if (!setting) setting = await prisma.loginSetting.create({ data: { id: 1 } });
    res.json(setting);
  } catch (err) { next(err); }
});

router.put('/settings', requireAdmin, async (req, res, next) => {
  try {
    const { maxAttempts, windowMinutes, banMinutes, allowRegistration } = req.body;
    const data = {};
    if (maxAttempts != null) data.maxAttempts = Number(maxAttempts);
    if (windowMinutes != null) data.windowMinutes = Number(windowMinutes);
    if (banMinutes != null) data.banMinutes = Number(banMinutes);
    if (allowRegistration !== undefined) data.allowRegistration = Boolean(allowRegistration);
    const setting = await prisma.loginSetting.upsert({
      where: { id: 1 },
      create: { id: 1, ...data },
      update: data,
    });
    await logAction(req.user.id, req.user.username, 'LOGIN_SETTING_UPDATE', JSON.stringify(data), getIp(req));
    res.json(setting);
  } catch (err) { next(err); }
});

module.exports = router;
