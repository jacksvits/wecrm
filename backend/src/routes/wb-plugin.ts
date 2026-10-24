import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import { testWbConnection, runWbFullSync, importWbProducts, fetchWbSubjects, fetchWbSubjectCharcs } from '../lib/wb.js';

const router = Router();

// GET /api/wb-plugin — состояние: настройки (без API-ключа), статистика по товарам
router.get('/', authMiddleware, async (_req, res) => {
  try {
    const s = await prisma.wbSellerSettings.findUnique({ where: { id: 1 } });
    const [flagged, synced] = await Promise.all([
      prisma.product.count({ where: { syncToWb: true, isActive: true } }),
      prisma.product.count({ where: { syncToWb: true, wbProductId: { not: null } } }),
    ]);
    let lastSync: any = null;
    if (s?.lastSyncResult) {
      try { lastSync = JSON.parse(s.lastSyncResult); } catch { lastSync = s.lastSyncResult; }
    }
    res.json({
      isActive: s?.isActive ?? false,
      autoSync: s?.autoSync ?? true,
      // режимы синхронизации (направление): 'from_wb' — из кабинета в CRM (по умолчанию); 'to_wb' — из CRM в кабинет
      productsMode: s?.productsMode ?? 'from_wb',
      pricesMode: s?.pricesMode ?? 'from_wb',
      stocksMode: s?.stocksMode ?? 'from_wb',
      // расписание: независимые интервалы авто-синхронизации товаров, цен и остатков (минуты)
      productsIntervalMinutes: s?.productsIntervalMinutes ?? 60,
      pricesIntervalMinutes: s?.pricesIntervalMinutes ?? 60,
      stocksIntervalMinutes: s?.stocksIntervalMinutes ?? 60,
      // предмет WB по умолчанию (для создания карточек «В WB»)
      defaultSubjectId: s?.defaultSubjectId ?? null,
      // целевой склад CRM для остатков из кабинета (NULL — первый активный склад)
      stockWarehouseId: s?.stockWarehouseId ?? null,
      apiKeySet: !!s?.apiKey,
      flaggedProducts: flagged,
      syncedProducts: synced,
      lastSyncAt: s?.lastSyncAt ?? null,
      lastSync,
    });
  } catch (err: any) {
    console.error('[wb-plugin] get error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/wb-plugin — сохранить настройки
router.post('/', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { apiKey, autoSync, defaultSubjectId, stockWarehouseId,
      productsMode, pricesMode, stocksMode,
      productsIntervalMinutes, pricesIntervalMinutes, stocksIntervalMinutes } = req.body || {};
    if (apiKey !== undefined && typeof apiKey !== 'string') return res.status(400).json({ error: 'Некорректный API-ключ' });
    if (stockWarehouseId !== undefined && stockWarehouseId !== null && typeof stockWarehouseId !== 'string') {
      return res.status(400).json({ error: 'Некорректный склад для остатков' });
    }
    // режимы синхронизации: только 'to_wb' или 'from_wb'
    for (const value of [productsMode, pricesMode, stocksMode]) {
      if (value !== undefined && value !== 'to_wb' && value !== 'from_wb') {
        return res.status(400).json({ error: 'Некорректный режим синхронизации' });
      }
    }
    // интервалы расписания: 5–1440 минут
    for (const value of [productsIntervalMinutes, pricesIntervalMinutes, stocksIntervalMinutes]) {
      if (value !== undefined && (!Number.isInteger(value) || value < 5 || value > 1440)) {
        return res.status(400).json({ error: 'Интервал синхронизации должен быть целым числом от 5 до 1440 минут' });
      }
    }
    const existing = await prisma.wbSellerSettings.findUnique({ where: { id: 1 } });
    // при смене/установке ключа считаем интеграцию активной
    const becomesActive = apiKey !== undefined && apiKey.trim().length > 0;
    const data = {
      // ключ: пустая строка — сброс; маскированное значение (••••) — не меняем
      apiKey: apiKey !== undefined
        ? (apiKey.includes('•') ? (existing?.apiKey ?? '') : apiKey.trim())
        : (existing?.apiKey ?? ''),
      isActive: becomesActive ? true : (existing?.isActive ?? false),
      // опция «Авто синхронизация»: не передана (старые клиенты) — сохраняем текущее значение
      autoSync: typeof autoSync === 'boolean' ? autoSync : (existing?.autoSync ?? true),
      // предмет по умолчанию: число — установить, null/0 — сброс
      defaultSubjectId: defaultSubjectId !== undefined
        ? (Number(defaultSubjectId) > 0 ? Number(defaultSubjectId) : null)
        : (existing?.defaultSubjectId ?? null),
      // расписание: независимые интервалы товаров/цен/остатков (минуты); не переданы — сохраняем текущие
      productsIntervalMinutes: typeof productsIntervalMinutes === 'number' ? productsIntervalMinutes : (existing?.productsIntervalMinutes ?? 60),
      pricesIntervalMinutes: typeof pricesIntervalMinutes === 'number' ? pricesIntervalMinutes : (existing?.pricesIntervalMinutes ?? 60),
      stocksIntervalMinutes: typeof stocksIntervalMinutes === 'number' ? stocksIntervalMinutes : (existing?.stocksIntervalMinutes ?? 60),
      // режимы синхронизации: не переданы — сохраняем текущие
      productsMode: productsMode !== undefined ? productsMode : (existing?.productsMode ?? 'from_wb'),
      pricesMode: pricesMode !== undefined ? pricesMode : (existing?.pricesMode ?? 'from_wb'),
      stocksMode: stocksMode !== undefined ? stocksMode : (existing?.stocksMode ?? 'from_wb'),
      // целевой склад для остатков из кабинета: пустая строка — сброс (первый активный склад)
      stockWarehouseId: stockWarehouseId !== undefined ? (stockWarehouseId || null) : (existing?.stockWarehouseId ?? null),
    };
    const saved = await prisma.wbSellerSettings.upsert({ where: { id: 1 }, create: { id: 1, ...data }, update: data });
    res.json({
      success: true,
      isActive: saved.isActive,
      autoSync: saved.autoSync,
      productsMode: saved.productsMode,
      pricesMode: saved.pricesMode,
      stocksMode: saved.stocksMode,
      productsIntervalMinutes: saved.productsIntervalMinutes,
      pricesIntervalMinutes: saved.pricesIntervalMinutes,
      stocksIntervalMinutes: saved.stocksIntervalMinutes,
      defaultSubjectId: saved.defaultSubjectId,
      stockWarehouseId: saved.stockWarehouseId ?? null,
      apiKeySet: !!saved.apiKey,
    });
  } catch (err: any) {
    console.error('[wb-plugin] save error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/wb-plugin/test — проверка подключения (список складов)
router.post('/test', authMiddleware, async (_req, res) => {
  try {
    const result = await testWbConnection();
    res.json(result);
  } catch (err: any) {
    console.error('[wb-plugin] test error:', err.message);
    res.status(400).json({ error: err.message });
  }
});

// GET /api/wb-plugin/subjects — дерево предметов WB (для выбора предмета по умолчанию)
router.get('/subjects', authMiddleware, async (_req, res) => {
  try {
    const subjects = await fetchWbSubjects();
    res.json(subjects);
  } catch (err: any) {
    console.error('[wb-plugin] subjects error:', err.message);
    res.status(400).json({ error: err.message });
  }
});

// GET /api/wb-plugin/subjects/:id/charcs — характеристики предмета (предпросмотр для настроек)
router.get('/subjects/:id/charcs', authMiddleware, async (req, res) => {
  try {
    const charcs = await fetchWbSubjectCharcs(Number(req.params.id));
    res.json(charcs);
  } catch (err: any) {
    console.error('[wb-plugin] charcs error:', err.message);
    res.status(400).json({ error: err.message });
  }
});

// POST /api/wb-plugin/sync — полная синхронизация по настроенным режимам (товары, цены, остатки)
router.post('/sync', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const summary = await runWbFullSync(req.user?.id);
    res.json(summary);
  } catch (err: any) {
    console.error('[wb-plugin] sync error:', err.message);
    res.status(400).json({ error: err.message });
  }
});

// POST /api/wb-plugin/import — импорт каталога из WB в номенклатуру CRM
router.post('/import', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const summary = await importWbProducts(req.user?.id);
    res.json(summary);
  } catch (err: any) {
    console.error('[wb-plugin] import error:', err.message);
    res.status(400).json({ error: err.message });
  }
});

export default router;
