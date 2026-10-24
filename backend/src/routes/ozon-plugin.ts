import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import { testOzonConnection, runOzonFullSync, fetchOzonCategoryTree, importOzonProducts, fetchOzonPostings } from '../lib/ozon.js';

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
      // опция «Авто синхронизация»: фоновая синхронизация по расписанию (worker)
      autoSync: s?.autoSync ?? true,
      // режимы синхронизации (направление): 'to_ozon' — из CRM в кабинет (по умолчанию); 'from_ozon' — из кабинета в CRM
      productsMode: s?.productsMode ?? 'to_ozon',
      pricesMode: s?.pricesMode ?? 'to_ozon',
      stocksMode: s?.stocksMode ?? 'to_ozon',
      // расписание: независимые интервалы авто-синхронизации товаров, цен и остатков (минуты)
      productsIntervalMinutes: s?.productsIntervalMinutes ?? 60,
      pricesIntervalMinutes: s?.pricesIntervalMinutes ?? 60,
      stocksIntervalMinutes: s?.stocksIntervalMinutes ?? 60,
      // целевой склад CRM для остатков из кабинета (NULL — первый активный склад)
      stockWarehouseId: s?.stockWarehouseId ?? null,
      clientId: s?.clientId ?? '',
      apiKeySet: !!s?.apiKey,
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
    const { clientId, apiKey, defaultTypeId, autoSync, stockWarehouseId,
      productsMode, pricesMode, stocksMode,
      productsIntervalMinutes, pricesIntervalMinutes, stocksIntervalMinutes } = req.body || {};
    if (clientId !== undefined && typeof clientId !== 'string') return res.status(400).json({ error: 'Некорректный Client-Id' });
    if (stockWarehouseId !== undefined && stockWarehouseId !== null && typeof stockWarehouseId !== 'string') {
      return res.status(400).json({ error: 'Некорректный склад для остатков' });
    }
    // режимы синхронизации: только 'to_ozon' или 'from_ozon'
    for (const value of [productsMode, pricesMode, stocksMode]) {
      if (value !== undefined && value !== 'to_ozon' && value !== 'from_ozon') {
        return res.status(400).json({ error: 'Некорректный режим синхронизации' });
      }
    }
    // интервалы расписания: 5–1440 минут
    for (const value of [productsIntervalMinutes, pricesIntervalMinutes, stocksIntervalMinutes]) {
      if (value !== undefined && (!Number.isInteger(value) || value < 5 || value > 1440)) {
        return res.status(400).json({ error: 'Интервал синхронизации должен быть целым числом от 5 до 1440 минут' });
      }
    }

    const existing = await prisma.ozonSellerSettings.findUnique({ where: { id: 1 } });
    const data = {
      clientId: clientId !== undefined ? clientId.trim() : (existing?.clientId ?? ''),
      apiKey: apiKey ? String(apiKey) : (existing?.apiKey ?? ''),
      // расписание: независимые интервалы товаров/цен/остатков (минуты); не переданы — сохраняем текущие
      productsIntervalMinutes: productsIntervalMinutes !== undefined ? productsIntervalMinutes : (existing?.productsIntervalMinutes ?? 60),
      pricesIntervalMinutes: pricesIntervalMinutes !== undefined ? pricesIntervalMinutes : (existing?.pricesIntervalMinutes ?? 60),
      stocksIntervalMinutes: stocksIntervalMinutes !== undefined ? stocksIntervalMinutes : (existing?.stocksIntervalMinutes ?? 60),
      // режимы синхронизации: не переданы — сохраняем текущие
      productsMode: productsMode !== undefined ? productsMode : (existing?.productsMode ?? 'to_ozon'),
      pricesMode: pricesMode !== undefined ? pricesMode : (existing?.pricesMode ?? 'to_ozon'),
      stocksMode: stocksMode !== undefined ? stocksMode : (existing?.stocksMode ?? 'to_ozon'),
      defaultTypeId:
        defaultTypeId !== undefined
          ? (defaultTypeId === null || defaultTypeId === '' ? null : Math.max(1, Number(defaultTypeId)))
          : (existing?.defaultTypeId ?? null),
      // опция «Авто синхронизация»: не передана (старые клиенты) — сохраняем текущее значение
      autoSync: typeof autoSync === 'boolean' ? autoSync : (existing?.autoSync ?? true),
      // целевой склад для остатков из кабинета: пустая строка — сброс (первый активный склад)
      stockWarehouseId: stockWarehouseId !== undefined ? (stockWarehouseId || null) : (existing?.stockWarehouseId ?? null),
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
      autoSync: saved.autoSync,
      clientId: saved.clientId,
      apiKeySet: !!saved.apiKey,
      productsMode: saved.productsMode,
      pricesMode: saved.pricesMode,
      stocksMode: saved.stocksMode,
      productsIntervalMinutes: saved.productsIntervalMinutes,
      pricesIntervalMinutes: saved.pricesIntervalMinutes,
      stocksIntervalMinutes: saved.stocksIntervalMinutes,
      stockWarehouseId: saved.stockWarehouseId ?? null,
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

// POST /api/ozon-plugin/import — привязка каталога OZON к товарам CRM (по артикулу)
router.post('/import', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const summary = await importOzonProducts(req.user?.id);
    res.json(summary);
  } catch (err: any) {
    console.error('[ozon-plugin] import error:', err.message);
    res.status(400).json({ error: err.message });
  }
});

// GET /api/ozon-plugin/postings — заказы из кабинета OZON за период + агрегированные резервы по новым заказам
// (только просмотр: на складской учёт не влияет)
router.get('/postings', authMiddleware, async (req, res) => {
  try {
    const days = Math.min(90, Math.max(1, Number(req.query.days) || 30));
    const postings = await fetchOzonPostings(days);
    // статусы «новых» заказов — резерв ещё не списан со склада OZON
    const RESERVE_STATUSES = new Set(['awaiting_registration', 'awaiting_confirm', 'assembling', 'awaiting_packaging', 'awaiting_delivering']);
    const result = postings.map((p: any) => ({
      posting_number: p.posting_number,
      order_number: p.order_number ?? null,
      status: p.status,
      substatus: p.substatus ?? null,
      created_at: p.created_at ?? p.in_process_at ?? null,
      shipment_date: p.shipment_date ?? null,
      products: (p.products || []).map((it: any) => ({
        offer_id: it.offer_id ?? '',
        name: it.name ?? '',
        quantity: Number(it.quantity) || 0,
        price: Number(it.price) || 0,
      })),
    }));
    // резервы: сумма по товарам из незавершённых заказов
    const reserves = new Map<string, { offer_id: string; name: string; quantity: number; postings: string[] }>();
    for (const p of result) {
      if (!RESERVE_STATUSES.has(p.status)) continue;
      for (const it of p.products) {
        if (!it.offer_id) continue;
        const row = reserves.get(it.offer_id) || { offer_id: it.offer_id, name: it.name, quantity: 0, postings: [] as string[] };
        row.quantity += it.quantity;
        if (!row.postings.includes(p.posting_number)) row.postings.push(p.posting_number);
        reserves.set(it.offer_id, row);
      }
    }
    res.json({ postings: result, reserves: [...reserves.values()].sort((a, b) => b.quantity - a.quantity) });
  } catch (err: any) {
    console.error('[ozon-plugin] postings error:', err.message);
    res.status(400).json({ error: err.message });
  }
});

// POST /api/ozon-plugin/sync — выгрузить товары с отметкой «OZON Seller» в маркетплейс
router.post('/sync', authMiddleware, async (req: AuthRequest, res) => {
  try {
    // Полная синхронизация по настройкам режимов: товары, цены и остатки — каждый блок в своём направлении
    const summary = await runOzonFullSync(req.user?.id);
    res.json(summary);
  } catch (err: any) {
    console.error('[ozon-plugin] sync error:', err.message);
    res.status(400).json({ error: err.message });
  }
});

export default router;
