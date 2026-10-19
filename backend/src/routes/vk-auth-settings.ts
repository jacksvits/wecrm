import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';

// ===== Настройки плагина «ВК авторизация» =====
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
  appId: z.number().int().positive().optional().nullable(),
  clientSecret: z.string().optional().nullable(),
  redirectUri: z.string().url().optional().nullable().or(z.literal('')),
  isActive: z.boolean().default(true),
});

router.get('/', async (_req, res) => {
  const s = await prisma.vkAuthSettings.findFirst();
  if (!s) return res.json(null);
  const { clientSecret, ...rest } = s;
  res.json({ ...rest, hasSecret: !!clientSecret });
});

router.post('/', async (req: AuthRequest, res) => {
  try {
    const data = settingsSchema.parse(req.body);
    const existing = await prisma.vkAuthSettings.findFirst();
    let s;
    if (existing) {
      const payload: any = { ...data };
      // Пустые секреты не затирают сохранённые значения (UI очищает поля после загрузки)
      if (!payload.clientSecret && existing.clientSecret) delete payload.clientSecret;
      if (payload.redirectUri === '') payload.redirectUri = null;
      s = await prisma.vkAuthSettings.update({ where: { id: existing.id }, data: payload });
    } else {
      const payload: any = { ...data };
      if (payload.redirectUri === '') payload.redirectUri = null;
      s = await prisma.vkAuthSettings.create({ data: payload });
    }
    const { clientSecret, ...rest } = s;
    res.json({ ...rest, hasSecret: !!clientSecret });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/', async (_req, res) => {
  await prisma.vkAuthSettings.deleteMany();
  res.json({ success: true });
});

export default router;
