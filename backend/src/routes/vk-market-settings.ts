import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import { importMarketItems, syncProductsToVk } from '../lib/vk-market.js';

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
  autoSync: z.boolean().optional(),
  productsMode: z.enum(['to_vk', 'from_vk']).optional(),
  pricesMode: z.enum(['to_vk', 'from_vk']).optional(),
  stocksMode: z.enum(['to_vk']).optional(), // 'from_vk' для остатков недоступно: API ВК не возвращает остатки
  productsIntervalMinutes: z.number().int().min(5).max(1440).optional(),
  pricesIntervalMinutes: z.number().int().min(5).max(1440).optional(),
  stocksIntervalMinutes: z.number().int().min(5).max(1440).optional(),
});

router.get('/', async (_req, res) => {
  const s = await prisma.vkMarketSettings.findFirst();
  const [flagged, synced] = await Promise.all([
    prisma.product.count({ where: { syncToVk: true, isActive: true } }),
    prisma.product.count({ where: { syncToVk: true, vkItemId: { not: null } } }),
  ]);
  if (!s) {
    return res.json({
      isActive: false,
      autoSync: true,
      productsMode: 'to_vk',
      pricesMode: 'to_vk',
      stocksMode: 'to_vk',
      productsIntervalMinutes: 60,
      pricesIntervalMinutes: 60,
      stocksIntervalMinutes: 60,
      groupId: '',
      hasMarketToken: false,
      hasMarketApp: false,
      lastSyncAt: null,
      lastSync: null,
      flagged,
      synced,
    });
  }
  const { marketToken, marketAppSecret, marketRefreshToken, ...rest } = s;
  let lastSync: any = null;
  if (s.lastSyncResult) {
    try { lastSync = JSON.parse(s.lastSyncResult); } catch { lastSync = null; }
  }
  res.json({
    ...rest,
    hasMarketToken: !!marketToken,
    hasMarketApp: !!(s.marketAppId && marketAppSecret),
    lastSync,
    flagged,
    synced,
  });
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
      // необязательные поля: не переданы — сохраняем текущие
      for (const key of ['autoSync', 'productsMode', 'pricesMode', 'stocksMode',
        'productsIntervalMinutes', 'pricesIntervalMinutes', 'stocksIntervalMinutes']) {
        if (payload[key] === undefined) payload[key] = (existing as any)[key];
      }
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

/**
 * POST /api/vk-market-settings/import
 * Импорт всех товаров маркета группы ВК → CRM (связывание по vkItemId/названию, без дублей)
 */
router.post('/import', async (_req, res) => {
  try {
    const summary = await importMarketItems();
    res.json(summary);
  } catch (err: any) {
    console.error('[vk-market-settings:import]', err);
    res.status(400).json({ error: err.message });
  }
});

/**
 * POST /api/vk-market-settings/export
 * Экспорт: все позиции с отметкой «ВК» → маркет группы (создание/обновление карточек)
 */
router.post('/export', async (_req, res) => {
  try {
    const summary = await syncProductsToVk();
    res.json(summary);
  } catch (err: any) {
    console.error('[vk-market-settings:export]', err);
    res.status(400).json({ error: err.message });
  }
});

export default router;
