const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function logAction(userId, username, action, detail = null, ip = null) {
  try {
    await prisma.auditLog.create({
      data: { userId: userId || null, username: username || null, action, detail, ip },
    });
  } catch (e) {
    console.error('Audit log error:', e.message);
  }
}

function getIp(req) {
  return req.headers['x-real-ip'] || req.headers['x-forwarded-for']?.split(',')[0] || req.ip || null;
}

module.exports = { logAction, getIp };
