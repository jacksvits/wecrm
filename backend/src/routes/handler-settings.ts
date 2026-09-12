import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';

const router = Router();

const adminOnly = (req: AuthRequest, res: any, next: any) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Требуются права администратора' });
  }
  next();
};

// Настройки «Обработчика» доступны всем авторизованным пользователям (чтение)
router.get('/', authMiddleware, async (_req, res) => {
  const settings = await prisma.handlerSettings.findFirst({
    include: { user: { select: { id: true, name: true } } },
  });
  res.json({
    greeting: settings?.greeting || '',
    completion: settings?.completion || '',
    userId: settings?.userId || null,
    user: settings?.user || null,
  });
});

const settingsSchema = z.object({
  greeting: z.string().max(20000).optional(),
  completion: z.string().max(20000).optional(),
  userId: z.string().optional().nullable(),
});

router.put('/', authMiddleware, adminOnly, async (req, res) => {
  try {
    const data = settingsSchema.parse(req.body);
    const existing = await prisma.handlerSettings.findFirst();
    const payload = {
      greeting: data.greeting ?? '',
      completion: data.completion ?? '',
      userId: data.userId || null,
    };
    let settings;
    if (existing) {
      settings = await prisma.handlerSettings.update({ where: { id: existing.id }, data: payload });
    } else {
      settings = await prisma.handlerSettings.create({ data: payload });
    }
    res.json({ greeting: settings.greeting, completion: settings.completion, userId: settings.userId });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

export default router;
