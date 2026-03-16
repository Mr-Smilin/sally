const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const { logAction, getIp } = require('../utils/audit');
const { authenticate } = require('../middleware/auth');
const prisma = new PrismaClient();

async function getLoginSetting() {
  let setting = await prisma.loginSetting.findUnique({ where: { id: 1 } });
  if (!setting) {
    setting = await prisma.loginSetting.create({ data: { id: 1 } });
  }
  return setting;
}

router.get('/config', async (req, res, next) => {
  try {
    const setting = await getLoginSetting();
    res.json({ allowRegistration: setting.allowRegistration });
  } catch (err) { next(err); }
});

router.post('/register', async (req, res, next) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) return res.status(400).json({ error: 'All fields required' });

    const setting = await getLoginSetting();
    if (!setting.allowRegistration) return res.status(403).json({ error: '目前不開放註冊，請聯絡管理員' });

    const existing = await prisma.user.findFirst({ where: { OR: [{ email }, { username }] } });
    if (existing) return res.status(409).json({ error: 'Username or email already exists' });

    const count = await prisma.user.count();
    const hashed = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { username, email, password: hashed, role: count === 0 ? 'ADMIN' : 'USER' },
      select: { id: true, username: true, email: true, role: true },
    });

    await logAction(user.id, user.username, 'AUTH_REGISTER', null, getIp(req));
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });
    res.json({ token, user });
  } catch (err) { next(err); }
});

router.post('/login', async (req, res, next) => {
  try {
    const ip = getIp(req);
    const { login, password } = req.body;

    const setting = await getLoginSetting();
    const { maxAttempts, windowMinutes, banMinutes } = setting;

    // Check IP blacklist
    if (ip) {
      const banned = await prisma.ipBlacklist.findFirst({
        where: { ip, OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] },
      });
      if (banned) return res.status(403).json({ error: '此 IP 已被封鎖，請聯絡管理員' });
    }

    // Check recent attempt count
    if (ip) {
      const windowStart = new Date(Date.now() - windowMinutes * 60 * 1000);
      const attempts = await prisma.loginAttempt.count({
        where: { ip, createdAt: { gte: windowStart } },
      });
      if (attempts >= maxAttempts) {
        const expiresAt = banMinutes > 0 ? new Date(Date.now() + banMinutes * 60 * 1000) : null;
        await prisma.ipBlacklist.upsert({
          where: { ip },
          create: { ip, reason: `自動封鎖：${windowMinutes} 分鐘內失敗 ${attempts} 次`, bannedBy: 'system', expiresAt },
          update: { expiresAt, bannedAt: new Date() },
        });
        await logAction(null, null, 'IP_BANNED', `IP ${ip} 自動封鎖`, ip);
        return res.status(429).json({ error: '嘗試次數過多，IP 已被自動封鎖，請聯絡管理員' });
      }
    }

    const user = await prisma.user.findFirst({
      where: { OR: [{ email: login }, { username: login }] },
    });

    const valid = user && user.isActive && await bcrypt.compare(password, user.password);

    if (!valid) {
      if (ip) await prisma.loginAttempt.create({ data: { ip } });
      await logAction(user?.id || null, user?.username || login, 'AUTH_LOGIN_FAIL', `帳號: ${login}`, ip);

      // Recount after recording this attempt; auto-ban if threshold reached
      if (ip) {
        const windowStart = new Date(Date.now() - windowMinutes * 60 * 1000);
        const attempts = await prisma.loginAttempt.count({
          where: { ip, createdAt: { gte: windowStart } },
        });
        if (attempts >= maxAttempts) {
          const expiresAt = banMinutes > 0 ? new Date(Date.now() + banMinutes * 60 * 1000) : null;
          await prisma.ipBlacklist.upsert({
            where: { ip },
            create: { ip, reason: `自動封鎖：${windowMinutes} 分鐘內失敗 ${attempts} 次`, bannedBy: 'system', expiresAt },
            update: { expiresAt, bannedAt: new Date() },
          });
          await logAction(null, null, 'IP_BANNED', `IP ${ip} 自動封鎖`, ip);
          return res.status(429).json({ error: '嘗試次數過多，IP 已被自動封鎖，請聯絡管理員' });
        }
        const attemptsLeft = maxAttempts - attempts;
        return res.status(401).json({ error: '帳號或密碼錯誤', attemptsLeft });
      }
      return res.status(401).json({ error: '帳號或密碼錯誤' });
    }

    // Success — clear attempts for this IP
    if (ip) await prisma.loginAttempt.deleteMany({ where: { ip } });

    await logAction(user.id, user.username, 'AUTH_LOGIN', null, ip);
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });
    res.json({ token, user: { id: user.id, username: user.username, email: user.email, role: user.role } });
  } catch (err) { next(err); }
});

router.post('/logout', authenticate, async (req, res) => {
  await logAction(req.user.id, req.user.username, 'AUTH_LOGOUT', null, getIp(req));
  res.json({ success: true });
});

router.get('/me', authenticate, (req, res) => {
  const { id, username, email, role } = req.user;
  res.json({ id, username, email, role });
});

module.exports = router;
