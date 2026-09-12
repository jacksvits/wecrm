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

// Настройки «Автоответчика» доступны всем авторизованным пользователям (чтение)
router.get('/', authMiddleware, async (_req, res) => {
  const settings = await prisma.autoReplySettings.findFirst({
    include: {
      user: { select: { id: true, name: true } },
      triggers: { orderBy: { createdAt: 'asc' } },
    },
  });
  res.json({
    userId: settings?.userId || null,
    user: settings?.user || null,
    triggers: settings?.triggers || [],
  });
});

const triggerSchema = z.object({
  word: z.string().min(1, 'Триггер не может быть пустым').max(200),
  answer: z.string().min(1, 'Ответ не может быть пустым').max(20000),
  isActive: z.boolean().optional(),
});

// Добавление триггера
router.post('/triggers', authMiddleware, adminOnly, async (req, res) => {
  try {
    const data = triggerSchema.parse(req.body);
    let settings = await prisma.autoReplySettings.findFirst();
    if (!settings) {
      settings = await prisma.autoReplySettings.create({ data: {} });
    }
    const trigger = await prisma.autoReplyTrigger.create({
      data: {
        settingsId: settings.id,
        word: data.word.trim(),
        answer: data.answer,
        isActive: data.isActive ?? true,
      },
    });
    res.json(trigger);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Редактирование триггера
router.put('/triggers/:id', authMiddleware, adminOnly, async (req, res) => {
  try {
    const data = triggerSchema.partial().parse(req.body);
    const trigger = await prisma.autoReplyTrigger.update({
      where: { id: req.params.id },
      data: {
        ...(data.word !== undefined ? { word: data.word.trim() } : {}),
        ...(data.answer !== undefined ? { answer: data.answer } : {}),
        ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
      },
    });
    res.json(trigger);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Удаление триггера
router.delete('/triggers/:id', authMiddleware, adminOnly, async (req, res) => {
  try {
    await prisma.autoReplyTrigger.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Выбор пользователя, от имени которого публикуются ответы по триггерам
router.put('/', authMiddleware, adminOnly, async (req, res) => {
  try {
    const data = z.object({ userId: z.string().optional().nullable() }).parse(req.body);
    let settings = await prisma.autoReplySettings.findFirst();
    if (!settings) {
      settings = await prisma.autoReplySettings.create({ data: {} });
    }
    settings = await prisma.autoReplySettings.update({
      where: { id: settings.id },
      data: { userId: data.userId || null },
    });
    res.json({ userId: settings.userId });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

export default router;
