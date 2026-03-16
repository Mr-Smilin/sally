const router = require('express').Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const DEFAULTS = {
  backgroundType: 'default',
  backgroundColor: '#f9fafb',
  gradientFrom: '#667eea',
  gradientTo: '#764ba2',
  gradientAngle: 135,
  backgroundImage: null,
  customCss: '',
};

router.get('/', async (req, res, next) => {
  try {
    const pref = await prisma.userPreference.findUnique({ where: { userId: req.user.id } });
    res.json(pref || { ...DEFAULTS, userId: req.user.id });
  } catch (err) { next(err); }
});

router.put('/', async (req, res, next) => {
  try {
    const { backgroundType, backgroundColor, gradientFrom, gradientTo, gradientAngle, backgroundImage, customCss, welcomeText, avatarImage } = req.body;

    const data = {
      ...(backgroundType !== undefined && { backgroundType }),
      ...(backgroundColor !== undefined && { backgroundColor }),
      ...(gradientFrom !== undefined && { gradientFrom }),
      ...(gradientTo !== undefined && { gradientTo }),
      ...(gradientAngle !== undefined && { gradientAngle: Number(gradientAngle) }),
      ...(backgroundImage !== undefined && { backgroundImage }),
      ...(customCss !== undefined && { customCss }),
      ...(welcomeText !== undefined && { welcomeText }),
      ...(avatarImage !== undefined && { avatarImage }),
    };

    const pref = await prisma.userPreference.upsert({
      where: { userId: req.user.id },
      update: data,
      create: { userId: req.user.id, ...DEFAULTS, ...data },
    });
    res.json(pref);
  } catch (err) { next(err); }
});

module.exports = router;
