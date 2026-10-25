import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';

// ===== Настройки плагина «ВК сообщество» =====
const router = Router();
router.use(authMiddleware);

const adminOnly = (req: AuthRequest, res: any, next: any) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Требуются права администратора' });
  }
  next();
};
router.use(adminOnly);

const settingsSchema = z.object({
  groupId: z.number().int().min(1),
  // Пустая строка = «токен не меняем» (UI очищает поле после загрузки)
  accessToken: z.string().default(''),
  defaultCreatorId: z.string().optional().nullable(),
  defaultProjectId: z.string().optional().nullable(),
  assigneeIds: z.array(z.string()).default([]),
  autoCreateContact: z.boolean().default(true),
  autoReply: z.boolean().default(false),
  isActive: z.boolean().default(true),
  callbackSecret: z.string().optional().nullable(),
  confirmationString: z.string().optional().nullable(),
});

router.get('/', async (_req, res) => {
  const s = await prisma.vkCommunitySettings.findFirst();
  if (!s) return res.json(null);
  const { accessToken, ...rest } = s;
  res.json({ ...rest, hasToken: !!accessToken });
});

router.post('/', async (req: AuthRequest, res) => {
  try {
    const data = settingsSchema.parse(req.body);
    const existing = await prisma.vkCommunitySettings.findFirst();
    // При первом сохранении токен обязателен
    if (!existing && !data.accessToken) {
      return res.status(400).json({ error: 'Токен сообщества обязателен' });
    }
    let s;
    if (existing) {
      const payload: any = { ...data };
      // Пустой токен не затирает сохранённое значение (UI очищает поле после загрузки)
      if (!payload.accessToken && existing.accessToken) delete payload.accessToken;
      s = await prisma.vkCommunitySettings.update({ where: { id: existing.id }, data: payload });
    } else {
      s = await prisma.vkCommunitySettings.create({ data: data as any });
    }
    const { accessToken, ...rest } = s;
    res.json({ ...rest, hasToken: !!accessToken });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/', async (_req, res) => {
  await prisma.vkCommunitySettings.deleteMany();
  res.json({ success: true });
});

export default router;
