const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');

const authRoutes = require('./routes/auth');
const transactionRoutes = require('./routes/transactions');
const categoryRoutes = require('./routes/categories');
const userRoutes = require('./routes/users');
const currencyRoutes = require('./routes/currencies');
const monitorRoutes = require('./routes/monitor');
const preferencesRoutes = require('./routes/preferences');
const { authenticate } = require('./middleware/auth');

const app = express();
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.use('/auth', authRoutes);
app.use('/transactions', authenticate, transactionRoutes);
app.use('/categories', authenticate, categoryRoutes);
app.use('/users', authenticate, userRoutes);
app.use('/currencies', authenticate, currencyRoutes);
app.use('/monitor', authenticate, monitorRoutes);
app.use('/preferences', authenticate, preferencesRoutes);

app.use((err, req, res, next) => {
  console.error(err);
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ error: '上傳內容太大，請縮小圖片後再試' });
  }
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  await seedDefaultCategories(prisma);
  await seedDefaultCurrencies(prisma);
});

async function seedDefaultCategories(prisma) {
  const count = await prisma.category.count({ where: { isGlobal: true } });
  if (count > 0) return;

  const defaults = [
    { name: '餐飲', icon: '🍜', color: '#f59e0b', type: 'EXPENSE', isGlobal: true },
    { name: '交通', icon: '🚌', color: '#3b82f6', type: 'EXPENSE', isGlobal: true },
    { name: '購物', icon: '🛍️', color: '#8b5cf6', type: 'EXPENSE', isGlobal: true },
    { name: '娛樂', icon: '🎮', color: '#ec4899', type: 'EXPENSE', isGlobal: true },
    { name: '住房', icon: '🏠', color: '#06b6d4', type: 'EXPENSE', isGlobal: true },
    { name: '醫療', icon: '💊', color: '#ef4444', type: 'EXPENSE', isGlobal: true },
    { name: '教育', icon: '📚', color: '#10b981', type: 'EXPENSE', isGlobal: true },
    { name: '其他支出', icon: '💸', color: '#6b7280', type: 'EXPENSE', isGlobal: true },
    { name: '薪資', icon: '💼', color: '#10b981', type: 'INCOME', isGlobal: true },
    { name: '獎金', icon: '🎁', color: '#f59e0b', type: 'INCOME', isGlobal: true },
    { name: '投資', icon: '📈', color: '#3b82f6', type: 'INCOME', isGlobal: true },
    { name: '其他收入', icon: '💰', color: '#6b7280', type: 'INCOME', isGlobal: true },
  ];

  await prisma.category.createMany({ data: defaults });
  console.log('Default categories seeded');
}

async function seedDefaultCurrencies(prisma) {
  const count = await prisma.currency.count();
  if (count > 0) return;

  await prisma.currency.createMany({
    data: [
      { code: 'TWD', name: '新台幣', symbol: 'NT$', isDefault: true },
      { code: 'USD', name: '美元', symbol: '$', isDefault: false },
      { code: 'JPY', name: '日圓', symbol: '¥', isDefault: false },
      { code: 'CNY', name: '人民幣', symbol: 'CN¥', isDefault: false },
      { code: 'EUR', name: '歐元', symbol: '€', isDefault: false },
    ],
  });
  console.log('Default currencies seeded');
}
