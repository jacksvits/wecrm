import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import { testOzonConnection, syncProductsToOzon, fetchOzonCategoryTree } from '../lib/ozon.js';

const router = Router();

// GET /api/ozon-plugin — состояние: настройки (без API-ключа), статистика по товарам
router.get('/', authMiddleware, async (_req, res) => {
  try {
    const s = await prisma.ozonSellerSettings.findUnique({ where: { id: 1 } });
    const [flagged, synced] = await Promise.all([
      prisma.product.count({ where: { syncToOzon: true, isActive: true } }),
      prisma.product.count({ where: { syncToOzon: true, ozonProductId: { not: null } } }),
    ]);
    let lastSync: any = null;
    if (s?.lastSyncResult) {
      try { lastSync = JSON.parse(s.lastSyncResult); } catch { lastSync = null; }
    }
    res.json({
      isActive: s?.isActive ?? false,
      clientId: s?.clientId ?? '',
      apiKeySet: !!s?.apiKey,
      updateIntervalMinutes: s?.updateIntervalMinutes ?? 60,
      defaultTypeId: s?.defaultTypeId ?? null,
      lastSyncAt: s?.lastSyncAt ?? null,
      lastSync,
      flagged,
      synced,
      error: null as string | null,
    });
  } catch (err: any) {
    console.error('[ozon-plugin] GET error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/ozon-plugin — сохранить подключение (admin; пустой apiKey = не менять).
// После сохранения выполняется проверка подключения к OZON API.
router.post('/', authMiddleware, async (req: AuthRequest, res) => {
  try {
    if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Только администратор' });
    const { clientId, apiKey, updateIntervalMinutes, defaultTypeId } = req.body || {};
    if (clientId !== undefined && typeof clientId !== 'string') return res.status(400).json({ error: 'Некорректный Client-Id' });

    const existing = await prisma.ozonSellerSettings.findUnique({ where: { id: 1 } });
    const data = {
      clientId: clientId !== undefined ? clientId.trim() : (existing?.clientId ?? ''),
      apiKey: apiKey ? String(apiKey) : (existing?.apiKey ?? ''),
      updateIntervalMinutes:
        updateIntervalMinutes !== undefined
          ? Math.max(5, Math.min(1440, Number(updateIntervalMinutes) || 60))
          : (existing?.updateIntervalMinutes ?? 60),
      defaultTypeId:
        defaultTypeId !== undefined
          ? (defaultTypeId === null || defaultTypeId === '' ? null : Math.max(1, Number(defaultTypeId)))
          : (existing?.defaultTypeId ?? null),
    };

    // Проверка подключения при сохранении
    let isActive = false;
    let error: string | null = null;
    if (data.clientId && data.apiKey) {
      const check = await testOzonConnection({ clientId: data.clientId, apiKey: data.apiKey });
      isActive = check.ok;
      error = check.error ?? null;
    }

    const saved = await prisma.ozonSellerSettings.upsert({
      where: { id: 1 },
      create: { id: 1, ...data, isActive },
      update: { ...data, isActive },
    });
    res.json({
      isActive: saved.isActive,
      clientId: saved.clientId,
      apiKeySet: !!saved.apiKey,
      updateIntervalMinutes: saved.updateIntervalMinutes,
      error,
    });
  } catch (err: any) {
    console.error('[ozon-plugin] POST error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/ozon-plugin/categories — дерево категорий OZON (для выбора категории по умолчанию)
router.get('/categories', authMiddleware, async (_req, res) => {
  try {
    const tree = await fetchOzonCategoryTree();
    res.json({ items: tree });
  } catch (err: any) {
    console.error('[ozon-plugin] categories error:', err.message);
    res.status(400).json({ error: err.message });
  }
});

// POST /api/ozon-plugin/sync — выгрузить товары с отметкой «OZON Seller» в маркетплейс
router.post('/sync', authMiddleware, async (_req, res) => {
  try {
    const summary = await syncProductsToOzon();
    res.json(summary);
  } catch (err: any) {
    console.error('[ozon-plugin] sync error:', err.message);
    res.status(400).json({ error: err.message });
  }
});

export default router;
