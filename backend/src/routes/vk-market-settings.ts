import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';

// ===== Настройки плагина «ВК товары» =====
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
  marketToken: z.string().optional().nullable(),
  marketAppId: z.number().optional().nullable(),
  marketAppSecret: z.string().optional().nullable(),
  isActive: z.boolean().default(true),
});

router.get('/', async (_req, res) => {
  const s = await prisma.vkMarketSettings.findFirst();
  if (!s) return res.json(null);
  const { marketToken, marketAppSecret, marketRefreshToken, ...rest } = s;
  res.json({ ...rest, hasMarketToken: !!marketToken, hasMarketApp: !!(s.marketAppId && marketAppSecret) });
});

router.post('/', async (req: AuthRequest, res) => {
  try {
    const data = settingsSchema.parse(req.body);
    const existing = await prisma.vkMarketSettings.findFirst();
    let s;
    if (existing) {
      const payload: any = { ...data };
      // Пустые секреты не затирают сохранённые значения (UI очищает поля после загрузки)
      if (!payload.marketToken && existing.marketToken) delete payload.marketToken;
      if (!payload.marketAppSecret && existing.marketAppSecret) delete payload.marketAppSecret;
      s = await prisma.vkMarketSettings.update({ where: { id: existing.id }, data: payload });
    } else {
      s = await prisma.vkMarketSettings.create({ data: data as any });
    }
    const { marketToken, marketAppSecret, marketRefreshToken, ...rest } = s;
    res.json({ ...rest, hasMarketToken: !!marketToken, hasMarketApp: !!(s.marketAppId && marketAppSecret) });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/', async (_req, res) => {
  await prisma.vkMarketSettings.deleteMany();
  res.json({ success: true });
});

export default router;
