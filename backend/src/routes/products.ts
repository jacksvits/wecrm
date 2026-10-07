import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import { prisma } from '../lib/prisma.js';
import { authMiddleware } from '../middleware/auth.js';
import { importMarketItems, syncProductsToVk, getVkSettings } from '../lib/vk-market.js';
import { syncProductsToOzon } from '../lib/ozon.js';
import { generateUniqueArticle } from '../lib/article.js';

const router = Router();

// Нормализация тегов карточки: обрезка пробелов, без дубликатов и пустых значений
function normalizeTags(input: unknown): string[] {
  if (!Array.isArray(input)) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of input) {
    const tag = String(item ?? '').trim().slice(0, 50);
    if (!tag || seen.has(tag)) continue;
    seen.add(tag);
    out.push(tag);
  }
  return out;
}

/**
 * GET /api/products/vitrine
 * Витрина магазина: активные позиции с отметкой «На витрине», с ценами, остатками и фото.
 * Публичный роут — объявлен до authMiddleware, чтобы витрину видели посетители без входа в CRM
 */
router.get('/vitrine', async (_req, res) => {
  try {
    // Флаги «на витрине» — мультивыбор: отмеченных видов цены может быть несколько
    const flaggedRows = await prisma.$queryRawUnsafe(`SELECT id, for_cashless FROM price_types WHERE for_vitrine = true`) as any[];
    const flaggedVitrineIds = new Set((flaggedRows as any[]).map((r: any) => r.id));
    const cashlessIds = new Set((flaggedRows as any[]).filter((r: any) => r.for_cashless).map((r: any) => r.id));
    const productsRaw = await prisma.product.findMany({
      where: { onVitrine: true, isActive: true },
      include: {
        stocks: { include: { warehouse: { select: { name: true } } } },
        prices: { include: { priceType: { select: { label: true, sortOrder: true } } } },
        images: { orderBy: { sortOrder: 'asc' } },
      },
      orderBy: { name: 'asc' },
    });
    const products = (productsRaw as any[]).map((prod) => ({
      ...prod,
      prices: (prod.prices || []).map((pr: any) => ({ ...pr, priceType: { ...pr.priceType, forVitrine: flaggedVitrineIds.has(pr.priceTypeId), forCashless: cashlessIds.has(pr.priceTypeId) } })),
    }));
    res.json(await withPriceFrom(products));
  } catch (err: any) {
    console.error('[products:vitrine]', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/products/vitrine/categories
 * Каталог витрины: категории, в которых есть товары на витрине, вместе с родительскими группами.
 * Плоский список — дерево строит фронтенд. Публичный роут, как и сама витрина.
 */
router.get('/vitrine/categories', async (_req, res) => {
  try {
    const vitrineProducts = await prisma.product.findMany({
      where: { onVitrine: true, isActive: true, categoryId: { not: null } },
      select: { categoryId: true },
    });
    const usedIds = [...new Set(vitrineProducts.map((p) => p.categoryId as string))];
    if (!usedIds.length) return res.json([]);
    const all = await prisma.productCategory.findMany({
      orderBy: { name: 'asc' },
      select: { id: true, name: true, isGroup: true, parentId: true },
    });
    const byId = new Map(all.map((c) => [c.id, c]));
    // поднимаемся от каждой используемой категории к корню, собирая все предки
    const include = new Set<string>();
    for (const id of usedIds) {
      let cur = byId.get(id);
      const guard = new Set<string>();
      while (cur && !guard.has(cur.id)) {
        guard.add(cur.id);
        include.add(cur.id);
        cur = cur.parentId ? byId.get(cur.parentId) : undefined;
      }
    }
    res.json(all.filter((c) => include.has(c.id)));
  } catch (err: any) {
    console.error('[products:vitrine:categories]', err);
    res.status(500).json({ error: err.message });
  }
});

router.use(authMiddleware);

// Полный путь категории «Группа / ... / Вид» — для выгрузки позиции в группу 1С
async function categoryPathString(categoryId: string): Promise<string | null> {
  const all = await prisma.productCategory.findMany({ select: { id: true, name: true, parentId: true } });
  const byId = new Map(all.map((c) => [c.id, c]));
  const path: string[] = [];
  let cur = byId.get(categoryId);
  const guard = new Set<string>();
  while (cur && !guard.has(cur.id)) {
    guard.add(cur.id);
    path.unshift(cur.name);
    cur = cur.parentId ? byId.get(cur.parentId) : undefined;
  }
  return path.length ? path.join(' / ') : null;
}

// id категории и всех её потомков (множество посещённых — защита от циклов)
async function categorySubtreeIds(rootId: string): Promise<string[]> {
  const all = await prisma.productCategory.findMany({ select: { id: true, parentId: true } });
  const childrenOf = new Map<string, string[]>();
  for (const c of all) {
    const list = childrenOf.get(c.parentId || '') ?? [];
    list.push(c.id);
    childrenOf.set(c.parentId || '', list);
  }
  const ids: string[] = [];
  const stack = [rootId];
  const seen = new Set<string>();
  while (stack.length) {
    const cur = stack.pop()!;
    if (seen.has(cur)) continue;
    seen.add(cur);
    ids.push(cur);
    for (const ch of childrenOf.get(cur) ?? []) stack.push(ch);
  }
  return ids;
}

// Обновляет строковый путь «Группа / ... / Вид» у товаров поддерева категории
// (после переименования/переноса категории пути в карточках товаров устаревают)
async function recalcCategoryPaths(rootId: string): Promise<void> {
  const ids = await categorySubtreeIds(rootId);
  const all = await prisma.productCategory.findMany({ select: { id: true, name: true, parentId: true } });
  const byId = new Map(all.map((c) => [c.id, c]));
  const pathOf = (categoryId: string): string | null => {
    const path: string[] = [];
    let cur = byId.get(categoryId);
    const guard = new Set<string>();
    while (cur && !guard.has(cur.id)) {
      guard.add(cur.id);
      path.unshift(cur.name);
      cur = cur.parentId ? byId.get(cur.parentId) : undefined;
    }
    return path.length ? path.join(' / ') : null;
  };
  const products = await prisma.product.findMany({ where: { categoryId: { in: ids } }, select: { id: true, categoryId: true } });
  for (const p of products) {
    if (!p.categoryId) continue;
    const path = pathOf(p.categoryId);
    if (path) await prisma.product.update({ where: { id: p.id }, data: { category: path } });
  }
}

// Подмешивает в цены товаров флаг «от» (колонка price_from вне схемы Prisma — как for_vitrine)
async function withPriceFrom<T extends { prices?: any[] }>(products: T[]): Promise<T[]> {
  if (!products.length) return products;
  const rows = await prisma.$queryRawUnsafe(`SELECT id, price_from FROM product_prices`) as any[];
  const flags = new Map(rows.map((r) => [r.id as string, !!r.price_from]));
  for (const p of products) {
    if (p.prices) p.prices = p.prices.map((pr: any) => ({ ...pr, priceFrom: flags.get(pr.id) ?? false }));
  }
  return products;
}

/* ============ Справочники (до /:id!) ============ */

/**
 * GET /api/products/meta/warehouses
 * Список складов
 */
router.get('/meta/warehouses', async (_req, res) => {
  try {
    const warehouses = await prisma.warehouse.findMany({ orderBy: { sortOrder: 'asc' } });
    res.json(warehouses);
  } catch (err: any) {
    console.error('[products:warehouses:list]', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/products/meta/warehouses
 * Создать склад
 */
router.post('/meta/warehouses', async (req, res) => {
  try {
    const { name, location, sortOrder } = req.body;
    if (!name?.trim()) return res.status(400).json({ error: 'Название обязательно' });
    const count = await prisma.warehouse.count();
    const warehouse = await prisma.warehouse.create({
      data: { name: name.trim(), location: location?.trim() || null, sortOrder: sortOrder ?? count + 1 },
    });
    res.status(201).json(warehouse);
  } catch (err: any) {
    console.error('[products:warehouses:create]', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * PATCH /api/products/meta/warehouses/:id
 * Обновить склад
 */
router.patch('/meta/warehouses/:id', async (req, res) => {
  try {
    const { name, location, isActive, sortOrder } = req.body;
    const existing = await prisma.warehouse.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ error: 'Склад не найден' });
    const data: any = {};
    if (name !== undefined) data.name = name.trim();
    if (location !== undefined) data.location = location?.trim() || null;
    if (isActive !== undefined) data.isActive = !!isActive;
    if (sortOrder !== undefined) data.sortOrder = Number(sortOrder);
    const warehouse = await prisma.warehouse.update({ where: { id: req.params.id }, data });
    res.json(warehouse);
  } catch (err: any) {
    console.error('[products:warehouses:update]', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * DELETE /api/products/meta/warehouses/:id
 * Удалить склад (только без движений)
 */
router.delete('/meta/warehouses/:id', async (req, res) => {
  try {
    const movements = await prisma.stockMovement.count({ where: { warehouseId: req.params.id } });
    if (movements > 0) return res.status(400).json({ error: 'Нельзя удалить склад с движениями' });
    await prisma.warehouse.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err: any) {
    console.error('[products:warehouses:delete]', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/products/meta/price-types
 * Список видов цен
 */
router.get('/meta/price-types', async (_req, res) => {
  try {
    const priceTypes = await prisma.priceType.findMany({ orderBy: { sortOrder: 'asc' } });
    const flagRows = await prisma.$queryRawUnsafe(`SELECT id, for_vitrine, for_vk, is_retail, for_cashless FROM price_types`) as any[];
    const flagMap = new Map(flagRows.map((r: any) => [r.id, r]));
    res.json(priceTypes.map((pt: any) => {
      const f = flagMap.get(pt.id);
      return { ...pt, forVitrine: !!f?.for_vitrine, forVk: !!f?.for_vk, isRetail: !!f?.is_retail, forCashless: !!f?.for_cashless };
    }));
  } catch (err: any) {
    console.error('[products:price-types:list]', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/products/meta/price-types
 * Создать вид цены
 */
router.post('/meta/price-types', async (req, res) => {
  try {
    const { name, label, color, sortOrder, forVitrine, forVk, isRetail, forCashless } = req.body;
    if (!name?.trim() || !label?.trim()) return res.status(400).json({ error: 'Название и метка обязательны' });
    const count = await prisma.priceType.count();
    const priceType = await prisma.priceType.create({
      data: { name: name.trim(), label: label.trim(), color: color || '#f0f0f0', sortOrder: sortOrder ?? count + 1 },
    });
    if (forVitrine) await prisma.$executeRawUnsafe(`UPDATE price_types SET for_vitrine = true WHERE id = '${priceType.id}'`);
    if (isRetail) await prisma.$executeRawUnsafe(`UPDATE price_types SET is_retail = true WHERE id = '${priceType.id}'`);
    if (forCashless) await prisma.$executeRawUnsafe(`UPDATE price_types SET for_cashless = true WHERE id = '${priceType.id}'`);
    if (forVk) { await prisma.$executeRawUnsafe(`UPDATE price_types SET for_vk = false`); await prisma.$executeRawUnsafe(`UPDATE price_types SET for_vk = true WHERE id = '${priceType.id}'`); }
    res.status(201).json(priceType);
  } catch (err: any) {
    if (err.code === 'P2002') return res.status(400).json({ error: 'Такой вид цены уже есть' });
    console.error('[products:price-types:create]', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * PATCH /api/products/meta/price-types/:id
 * Обновить вид цены
 */
router.patch('/meta/price-types/:id', async (req, res) => {
  try {
    const { label, color, isActive, sortOrder } = req.body;
    const existing = await prisma.priceType.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ error: 'Вид цены не найден' });
    const data: any = {};
    if (label !== undefined) data.label = label.trim();
    if (color !== undefined) data.color = color;
    if (isActive !== undefined) data.isActive = !!isActive;
    if (sortOrder !== undefined) data.sortOrder = Number(sortOrder);
    if (req.body.isRetail !== undefined) {
      await prisma.$executeRawUnsafe(`UPDATE price_types SET is_retail = ${req.body.isRetail ? 'true' : 'false'} WHERE id = '${req.params.id}'`);
    }
    if (req.body.forCashless !== undefined) {
      await prisma.$executeRawUnsafe(`UPDATE price_types SET for_cashless = ${req.body.forCashless ? 'true' : 'false'} WHERE id = '${req.params.id}'`);
    }
    if (req.body.forVitrine !== undefined) {
      if (req.body.forVitrine) await prisma.$executeRawUnsafe(`UPDATE price_types SET for_vitrine = true WHERE id = '${req.params.id}'`);
      else await prisma.$executeRawUnsafe(`UPDATE price_types SET for_vitrine = false WHERE id = '${req.params.id}'`);
    }
    if (req.body.forVk !== undefined) {
      if (req.body.forVk) { await prisma.$executeRawUnsafe(`UPDATE price_types SET for_vk = false`); await prisma.$executeRawUnsafe(`UPDATE price_types SET for_vk = true WHERE id = '${req.params.id}'`); }
      else await prisma.$executeRawUnsafe(`UPDATE price_types SET for_vk = false WHERE id = '${req.params.id}'`);
    }
    const priceType = await prisma.priceType.update({ where: { id: req.params.id }, data });
    res.json(priceType);
  } catch (err: any) {
    console.error('[products:price-types:update]', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * DELETE /api/products/meta/price-types/:id
 * Удалить вид цены (только без истории)
 */
router.delete('/meta/price-types/:id', async (req, res) => {
  try {
    const history = await prisma.priceHistory.count({ where: { priceTypeId: req.params.id } });
    if (history > 0) return res.status(400).json({ error: 'Нельзя удалить вид цены с историей' });
    await prisma.priceType.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err: any) {
    console.error('[products:price-types:delete]', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/products/meta/movements?productId=&warehouseId=
 * История складских движений
 */
router.get('/meta/movements', async (req, res) => {
  try {
    const { productId, warehouseId } = req.query;
    const where: any = {};
    if (productId) where.productId = productId as string;
    if (warehouseId) where.warehouseId = warehouseId as string;
    const movements = await prisma.stockMovement.findMany({
      where,
      include: {
        product: { select: { name: true, sku: true, unit: true } },
        warehouse: { select: { name: true } },
        user: { select: { name: true } },
      },
      orderBy: { date: 'desc' },
      take: 200,
    });
    res.json(movements);
  } catch (err: any) {
    console.error('[products:movements]', err);
    res.status(500).json({ error: err.message });
  }
});


/* ============ ВКонтакте: импорт и синхронизация ============ */

/**
 * GET /api/products/meta/vk-status
 * Статус подключения ВК (есть ли группа с токеном)
 */
router.get('/meta/vk-status', async (_req, res) => {
  try {
    const settings = await getVkSettings();
    res.json({ configured: !!settings, groupId: settings?.groupId || null, hasMarketToken: !!settings?.marketToken });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/products/meta/tags
 * Все существующие теги карточек (алфавит) — для автоподстановки при вводе
 */
router.get('/meta/tags', async (_req, res) => {
  try {
    const rows = await prisma.$queryRawUnsafe(
      `SELECT DISTINCT unnest(tags) AS tag FROM products WHERE tags IS NOT NULL ORDER BY tag`
    ) as any[];
    res.json((rows as any[]).map((r: any) => r.tag).filter(Boolean));
  } catch (err: any) {
    console.error('[products:meta:tags]', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/products/meta/vk-import
 * Первый импорт: все товары маркета группы ВК → проект
 */
router.post('/meta/vk-import', async (_req, res) => {
  try {
    const summary = await importMarketItems();
    res.json(summary);
  } catch (err: any) {
    console.error('[products:vk-import]', err);
    res.status(400).json({ error: err.message });
  }
});

/**
 * POST /api/products/meta/vk-sync
 * Синхронизация: все позиции с отметкой «ВК» → маркет группы
 */
router.post('/meta/vk-sync', async (_req, res) => {
  try {
    const summary = await syncProductsToVk();
    res.json(summary);
  } catch (err: any) {
    console.error('[products:vk-sync]', err);
    res.status(400).json({ error: err.message });
  }
});

/**
 * POST /api/products/meta/ozon-sync
 * Синхронизация: все позиции с отметкой «OZON Seller» → маркетплейс OZON
 */
router.post('/meta/ozon-sync', async (_req, res) => {
  try {
    const summary = await syncProductsToOzon();
    res.json(summary);
  } catch (err: any) {
    console.error('[products:ozon-sync]', err);
    res.status(400).json({ error: err.message });
  }
});

/**
 * GET /api/products/meta/categories
 * Дерево категорий (группы и виды номенклатуры): из 1С + созданные вручную. Плоский список — дерево строит фронтенд
 */
router.get('/meta/categories', async (_req, res) => {
  try {
    const categories = await prisma.productCategory.findMany({
      orderBy: { name: 'asc' },
      select: { id: true, onecId: true, name: true, isGroup: true, parentId: true, ozonTypeId: true },
    });
    res.json(categories);
  } catch (err: any) {
    console.error('[products:categories:list]', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/products/meta/categories
 * Создать категорию вручную (onecId пустой — синхронизация с 1С её не затрагивает)
 */
router.post('/meta/categories', async (req, res) => {
  try {
    const { name, parentId, isGroup, ozonTypeId } = req.body;
    if (!name?.trim()) return res.status(400).json({ error: 'Название обязательно' });
    if (parentId) {
      const parent = await prisma.productCategory.findUnique({ where: { id: parentId } });
      if (!parent) return res.status(400).json({ error: 'Родительская категория не найдена' });
    }
    const category = await prisma.productCategory.create({
      data: {
        name: name.trim(),
        parentId: parentId || null,
        isGroup: !!isGroup,
        ozonTypeId: ozonTypeId ? Math.max(1, Number(ozonTypeId)) : null,
      },
    });
    res.status(201).json(category);
  } catch (err: any) {
    console.error('[products:categories:create]', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * PATCH /api/products/meta/categories/:id
 * Переименовать категорию, сменить родителя или тип (папка / вид номенклатуры)
 */
router.patch('/meta/categories/:id', async (req, res) => {
  try {
    const { name, parentId, isGroup, ozonTypeId } = req.body;
    const existing = await prisma.productCategory.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ error: 'Категория не найдена' });
    const data: any = {};
    if (name !== undefined) {
      if (!name.trim()) return res.status(400).json({ error: 'Название не может быть пустым' });
      data.name = name.trim();
    }
    if (isGroup !== undefined) data.isGroup = !!isGroup;
    // Привязка к категории OZON: число или null (сброс — тогда наследуется от родителя)
    if (ozonTypeId !== undefined) data.ozonTypeId = ozonTypeId === null || ozonTypeId === '' ? null : Math.max(1, Number(ozonTypeId));
    if (parentId !== undefined) {
      if (parentId) {
        if (parentId === req.params.id) return res.status(400).json({ error: 'Категория не может быть родителем самой себя' });
        // защита от цикла: новый родитель не должен оказаться внутри самой категории
        const all = await prisma.productCategory.findMany({ select: { id: true, parentId: true } });
        const byId = new Map(all.map((c) => [c.id, c]));
        let cur = byId.get(parentId);
        const guard = new Set<string>();
        while (cur && !guard.has(cur.id)) {
          guard.add(cur.id);
          if (cur.id === req.params.id) return res.status(400).json({ error: 'Нельзя перенести категорию в её собственную подкатегорию' });
          cur = cur.parentId ? byId.get(cur.parentId) : undefined;
        }
        data.parentId = parentId;
      } else {
        data.parentId = null;
      }
    }
    const category = await prisma.productCategory.update({ where: { id: req.params.id }, data });
    // строковый путь «Группа / ... / Вид» у товаров поддерева мог измениться
    await recalcCategoryPaths(req.params.id);
    res.json(category);
  } catch (err: any) {
    console.error('[products:categories:update]', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * DELETE /api/products/meta/categories/:id?moveTo=<id|'none'>
 * Удалить категорию. Если в ней есть товары или подкатегории, без moveTo вернёт 409
 * со счётчиками; с moveTo товары и подкатегории переносятся в другую категорию
 * ('none' — товары без категории, подкатегории — на уровень удаляемой)
 */
router.delete('/meta/categories/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const moveTo = (req.query.moveTo as string) || '';
    const existing = await prisma.productCategory.findUnique({
      where: { id },
      include: { _count: { select: { products: true, children: true } } },
    });
    if (!existing) return res.status(404).json({ error: 'Категория не найдена' });
    const { products, children } = (existing as any)._count;
    if ((products > 0 || children > 0) && !moveTo) {
      return res.status(409).json({ error: 'В категории есть товары или подкатегории', products, children });
    }
    if (moveTo === 'none') {
      // товары — без категории, подкатегории — на уровень удаляемой
      const movedChildren = await prisma.productCategory.findMany({ where: { parentId: id }, select: { id: true } });
      await prisma.product.updateMany({ where: { categoryId: id }, data: { categoryId: null, category: null } });
      await prisma.productCategory.updateMany({ where: { parentId: id }, data: { parentId: existing.parentId } });
      for (const ch of movedChildren) await recalcCategoryPaths(ch.id);
    } else if (moveTo) {
      if (moveTo === id) return res.status(400).json({ error: 'Нельзя перенести категорию в саму себя' });
      const target = await prisma.productCategory.findUnique({ where: { id: moveTo } });
      if (!target) return res.status(400).json({ error: 'Категория для переноса не найдена' });
      await prisma.product.updateMany({ where: { categoryId: id }, data: { categoryId: moveTo } });
      await prisma.productCategory.updateMany({ where: { parentId: id }, data: { parentId: moveTo } });
      await recalcCategoryPaths(moveTo);
    }
    await prisma.productCategory.delete({ where: { id } });
    res.json({ success: true });
  } catch (err: any) {
    console.error('[products:categories:delete]', err);
    res.status(500).json({ error: err.message });
  }
});

/* ============ Номенклатура ============ */

/**
 * GET /api/products?q=&categoryId=&noCategory=1&kind=
 * Список товаров с остатками и ценами; categoryId — категория со всеми вложенными
 */
router.get('/', async (req, res) => {
  try {
    const { q, categoryId, noCategory, kind } = req.query;
    const where: any = {};
    if (q) {
      const s = q as string;
      where.OR = [
        { name: { contains: s, mode: 'insensitive' } },
        { sku: { contains: s, mode: 'insensitive' } },
        { category: { contains: s, mode: 'insensitive' } },
      ];
    }
    if (kind === 'product' || kind === 'service') where.kind = kind;
    if (categoryId) {
      const all = await prisma.productCategory.findMany({ select: { id: true, parentId: true } });
      const children = new Map<string | null, string[]>();
      for (const c of all) {
        const list = children.get(c.parentId) ?? [];
        list.push(c.id);
        children.set(c.parentId, list);
      }
      const ids: string[] = [];
      const stack = [categoryId as string];
      while (stack.length) {
        const id = stack.pop()!;
        ids.push(id);
        for (const ch of children.get(id) ?? []) stack.push(ch);
      }
      where.categoryId = { in: ids };
    } else if (noCategory === '1') {
      where.categoryId = null;
    }
    const products = await prisma.product.findMany({
      where,
      include: { stocks: true, prices: true, images: { orderBy: { sortOrder: 'asc' } } },
      orderBy: { name: 'asc' },
    });
    res.json(await withPriceFrom(products));
  } catch (err: any) {
    console.error('[products:list]', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/products
 * Создать товар
 */
router.post('/', async (req, res) => {
  try {
    const { name, sku, description, category, subcategory, unit, barcode, kind, syncToVk, onVitrine, isSubscription, categoryId, tags } = req.body;
    if (!name?.trim()) return res.status(400).json({ error: 'Название обязательно' });
    const productKind = kind === 'service' ? 'service' : 'product';
    // Категория из дерева 1С (группы/виды номенклатуры)
    let categoryIdValue: string | null = null;
    if (categoryId) {
      const node = await prisma.productCategory.findUnique({ where: { id: categoryId } });
      if (!node) return res.status(400).json({ error: 'Категория не найдена' });
      categoryIdValue = node.id;
    }
    // Строковый путь для выгрузки в 1С: наследуем от выбранной категории, если не задан вручную
    let categoryValue = category?.trim() || null;
    if (!categoryValue && categoryIdValue) categoryValue = await categoryPathString(categoryIdValue);
    const article = await generateUniqueArticle();
    const product = await prisma.product.create({
      data: {
        article,
        name: name.trim(),
        sku: sku?.trim() || null,
        kind: productKind,
        description: description || '',
        categoryId: categoryIdValue,
        category: categoryValue,
        subcategory: subcategory?.trim() || null,
        unit: unit?.trim() || 'шт',
        barcode: barcode?.trim() || null,
        syncToVk: !!syncToVk,
        onVitrine: !!onVitrine,
        // «Подписка» актуальна только для услуг
        isSubscription: productKind === 'service' && !!isSubscription,
        tags: normalizeTags(tags),
      },
      include: { stocks: true, prices: true, images: { orderBy: { sortOrder: 'asc' } } },
    });
    res.status(201).json(product);
  } catch (err: any) {
    if (err.code === 'P2002') return res.status(400).json({ error: 'Артикул уже занят' });
    console.error('[products:create]', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/products/:id/history
 * История изменения цен товара
 */
router.get('/:id/history', async (req, res) => {
  try {
    const history = await prisma.priceHistory.findMany({
      where: { productId: req.params.id },
      include: { priceType: { select: { label: true } }, user: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    res.json(history);
  } catch (err: any) {
    console.error('[products:history]', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/products/:id
 * Товар по ID
 */
router.get('/:id', async (req, res) => {
  try {
    const product = await prisma.product.findUnique({
      where: { id: req.params.id },
      include: { stocks: true, prices: true, images: { orderBy: { sortOrder: 'asc' } } },
    });
    if (!product) return res.status(404).json({ error: 'Товар не найден' });
    res.json((await withPriceFrom([product]))[0]);
  } catch (err: any) {
    console.error('[products:get]', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * PATCH /api/products/:id
 * Обновить товар
 */
router.patch('/:id', async (req, res) => {
  try {
    const { name, sku, description, category, subcategory, unit, barcode, isActive, kind, syncToVk, syncToOzon, onVitrine, isSubscription, categoryId, tags } = req.body;
    const existing = await prisma.product.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ error: 'Товар не найден' });
    const data: any = {};
    if (name !== undefined) data.name = name.trim();
    if (sku !== undefined) data.sku = sku?.trim() || null;
    if (description !== undefined) data.description = description;
    if (category !== undefined) data.category = category?.trim() || null;
    if (subcategory !== undefined) data.subcategory = subcategory?.trim() || null;
    if (kind !== undefined) data.kind = kind === 'service' ? 'service' : 'product';
    if (unit !== undefined) data.unit = unit?.trim() || 'шт';
    if (barcode !== undefined) data.barcode = barcode?.trim() || null;
    if (isActive !== undefined) data.isActive = !!isActive;
    if (syncToVk !== undefined) data.syncToVk = !!syncToVk;
    // «OZON Seller» актуально только для товаров, не для услуг
    if (syncToOzon !== undefined) data.syncToOzon = (data.kind ?? existing.kind) === 'product' && !!syncToOzon;
    if (onVitrine !== undefined) data.onVitrine = !!onVitrine;
    if (isSubscription !== undefined) data.isSubscription = (data.kind ?? existing.kind) === 'service' && !!isSubscription;
    if (tags !== undefined) data.tags = normalizeTags(tags);
    // Категория из дерева 1С: обновляем привязку и строковый путь (для выгрузки в 1С)
    if (categoryId !== undefined) {
      if (categoryId) {
        const node = await prisma.productCategory.findUnique({ where: { id: categoryId } });
        if (!node) return res.status(400).json({ error: 'Категория не найдена' });
        data.categoryId = node.id;
        data.category = await categoryPathString(node.id);
      } else {
        data.categoryId = null;
        data.category = null;
      }
    }
    const product = await prisma.product.update({
      where: { id: req.params.id },
      data,
      include: { stocks: true, prices: true, images: { orderBy: { sortOrder: 'asc' } } },
    });
    res.json(product);
  } catch (err: any) {
    if (err.code === 'P2002') return res.status(400).json({ error: 'Артикул уже занят' });
    console.error('[products:update]', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * DELETE /api/products/:id
 * Удалить товар (каскадно удалит остатки, цены, движения, историю)
 */
router.delete('/:id', async (req, res) => {
  try {
    const existing = await prisma.product.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ error: 'Товар не найден' });
    await prisma.product.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err: any) {
    console.error('[products:delete]', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/products/bulk-delete
 * Массовое удаление позиций { ids: string[] } (каскадно, как одиночное удаление)
 */
router.post('/bulk-delete', async (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || !ids.length) return res.status(400).json({ error: 'ids обязателен' });
    const result = await prisma.product.deleteMany({ where: { id: { in: ids } } });
    res.json({ success: true, deleted: result.count });
  } catch (err: any) {
    console.error('[products:bulk-delete]', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/products/bulk-category
 * Массовый перенос в категорию { ids: string[], categoryId: string | null }
 * (categoryId = null — снять категорию)
 */
router.post('/bulk-category', async (req, res) => {
  try {
    const { ids, categoryId } = req.body;
    if (!Array.isArray(ids) || !ids.length) return res.status(400).json({ error: 'ids обязателен' });
    if (categoryId) {
      const cat = await prisma.productCategory.findUnique({ where: { id: categoryId } });
      if (!cat) return res.status(404).json({ error: 'Категория не найдена' });
    }
    const result = await prisma.product.updateMany({
      where: { id: { in: ids } },
      data: { categoryId: categoryId || null },
    });
    res.json({ success: true, updated: result.count });
  } catch (err: any) {
    console.error('[products:bulk-category]', err);
    res.status(500).json({ error: err.message });
  }
});


/* ============ Изображения ============ */

const UPLOAD_ROOT = '/app/uploads';

/**
 * POST /api/products/:id/images
 * Привязать загруженный файл (FileAttachment с entityType='product') как изображение товара
 */
router.post('/:id/images', async (req, res) => {
  try {
    const { attachmentId } = req.body;
    if (!attachmentId) return res.status(400).json({ error: 'attachmentId обязателен' });
    const product = await prisma.product.findUnique({ where: { id: req.params.id } });
    if (!product) return res.status(404).json({ error: 'Товар не найден' });
    const attachment = await prisma.fileAttachment.findUnique({ where: { id: attachmentId } });
    if (!attachment || attachment.entityType !== 'product' || attachment.entityId !== product.id) {
      return res.status(400).json({ error: 'Вложение не найдено или не принадлежит товару' });
    }
    const count = await prisma.productImage.count({ where: { productId: product.id } });
    // Переименовываем файл во внутренний артикул: первое фото — <article>.<ext>,
    // каждое следующее — <article>-<n>.<ext> (независимо от исходного имени)
    let url = attachment.path;
    let newFilename = attachment.filename;
    if (product.article) {
      const ext = path.extname(attachment.filename) || '';
      const baseName = count === 0 ? product.article : `${product.article}-${count}`;
      newFilename = `${baseName}${ext}`;
      const oldPath = path.join(UPLOAD_ROOT, attachment.filename);
      const newPath = path.join(UPLOAD_ROOT, newFilename);
      if (oldPath !== newPath) {
        if (fs.existsSync(newPath)) fs.unlinkSync(newPath);
        if (fs.existsSync(oldPath)) fs.renameSync(oldPath, newPath);
        await prisma.fileAttachment.update({
          where: { id: attachment.id },
          data: { filename: newFilename, path: `/uploads/${newFilename}` },
        });
        url = `/uploads/${newFilename}`;
      }
    }
    const image = await prisma.productImage.create({
      data: {
        productId: product.id,
        attachmentId: attachment.id,
        url,
        sortOrder: count,
      },
    });
    res.status(201).json(image);
  } catch (err: any) {
    console.error('[products:image:add]', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/products/:id/images/url
 * Скачать изображение по внешней ссылке (например, из кабинета OZON: ir.ozone.ru) и прикрепить к товару
 */
router.post('/:id/images/url', async (req, res) => {
  try {
    const product = await prisma.product.findUnique({ where: { id: req.params.id } });
    if (!product) return res.status(404).json({ error: 'Товар не найден' });
    const { url } = req.body || {};
    if (!url || typeof url !== 'string' || !/^https:\/\//i.test(url)) {
      return res.status(400).json({ error: 'Укажите корректный URL изображения (https://)' });
    }
    const resp = await fetch(url, { redirect: 'follow', signal: AbortSignal.timeout(20000) });
    if (!resp.ok) return res.status(400).json({ error: `Не удалось скачать изображение: HTTP ${resp.status}` });
    const mime = resp.headers.get('content-type')?.split(';')[0] || '';
    if (!mime.startsWith('image/')) return res.status(400).json({ error: 'По ссылке не изображение' });
    const buf = Buffer.from(await resp.arrayBuffer());
    if (!buf.length || buf.length > 10 * 1024 * 1024) return res.status(400).json({ error: 'Изображение пустое или больше 10 МБ' });

    const ext = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif' }[mime] || 'jpg';
    const filename = `product-${product.id}-${Date.now()}.${ext}`;
    fs.writeFileSync(path.join(UPLOAD_ROOT, filename), buf);

    const attachment = await prisma.fileAttachment.create({
      data: {
        entityType: 'product',
        entityId: product.id,
        field: 'image',
        filename: url.split('/').pop()?.split('?')[0] || filename,
        originalName: url.split('/').pop()?.split('?')[0] || filename,
        mimeType: mime,
        size: buf.length,
        path: `/uploads/${filename}`,
        authorId: (req as AuthRequest).user!.id,
      },
    });
    const maxSort = await prisma.productImage.aggregate({ where: { productId: product.id }, _max: { sortOrder: true } });
    const image = await prisma.productImage.create({
      data: { productId: product.id, attachmentId: attachment.id, sortOrder: (maxSort._max.sortOrder ?? -1) + 1 },
    });
    res.json({ id: image.id, productId: product.id, attachmentId: attachment.id, sortOrder: image.sortOrder, url: attachment.path, attachment });
  } catch (err: any) {
    console.error('[products:images:url]', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * DELETE /api/products/:id/images/:imageId
 * Удалить изображение товара (вместе с файлом и вложением)
 */
router.delete('/:id/images/:imageId', async (req, res) => {
  try {
    const image = await prisma.productImage.findUnique({ where: { id: req.params.imageId } });
    if (!image || image.productId !== req.params.id) {
      return res.status(404).json({ error: 'Изображение не найдено' });
    }
    const attachment = await prisma.fileAttachment.findUnique({ where: { id: image.attachmentId } });
    if (attachment) {
      const filePath = path.join(UPLOAD_ROOT, attachment.filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      await prisma.fileAttachment.delete({ where: { id: attachment.id } });
    }
    await prisma.productImage.delete({ where: { id: image.id } });
    res.json({ success: true });
  } catch (err: any) {
    console.error('[products:image:delete]', err);
    res.status(500).json({ error: err.message });
  }
});

/* ============ Склад: движения ============ */

/**
 * POST /api/products/:id/movements
 * Создать движение (income | outcome | adjust), обновляет остаток в транзакции
 */
router.post('/:id/movements', async (req, res) => {
  try {
    const user = (req as any).user;
    const { type, warehouseId, quantity, price, comment, date } = req.body;
    if (!['income', 'outcome', 'adjust'].includes(type)) {
      return res.status(400).json({ error: 'Тип операции: income, outcome или adjust' });
    }
    const qty = Number(quantity);
    if (!Number.isFinite(qty) || qty <= 0) return res.status(400).json({ error: 'Количество должно быть больше 0' });

    const product = await prisma.product.findUnique({ where: { id: req.params.id } });
    if (!product) return res.status(404).json({ error: 'Товар не найден' });
    const warehouse = await prisma.warehouse.findUnique({ where: { id: warehouseId } });
    if (!warehouse) return res.status(400).json({ error: 'Склад не найден' });

    const movement = await prisma.$transaction(async (tx) => {
      if (type === 'outcome') {
        const balance = await tx.stockBalance.findUnique({
          where: { productId_warehouseId: { productId: product.id, warehouseId: warehouse.id } },
        });
        if (!balance || balance.quantity < qty) {
          throw new Error(`Недостаточно остатка: доступно ${balance?.quantity || 0} ${product.unit}`);
        }
      }
      const m = await tx.stockMovement.create({
        data: {
          productId: product.id,
          warehouseId: warehouse.id,
          type,
          quantity: qty,
          price: price !== undefined && price !== null && price !== '' ? Number(price) : null,
          comment: comment?.trim() || null,
          date: date ? new Date(date) : new Date(),
          userId: user.id,
        },
      });
      if (type === 'adjust') {
        await tx.stockBalance.upsert({
          where: { productId_warehouseId: { productId: product.id, warehouseId: warehouse.id } },
          create: { productId: product.id, warehouseId: warehouse.id, quantity: qty },
          update: { quantity: qty },
        });
      } else {
        const delta = type === 'income' ? qty : -qty;
        await tx.stockBalance.upsert({
          where: { productId_warehouseId: { productId: product.id, warehouseId: warehouse.id } },
          create: { productId: product.id, warehouseId: warehouse.id, quantity: Math.max(delta, 0) },
          update: { quantity: { increment: delta } },
        });
      }
      return m;
    });

    res.status(201).json(movement);
  } catch (err: any) {
    console.error('[products:movement]', err);
    res.status(400).json({ error: err.message });
  }
});

/* ============ Цены ============ */

/**
 * PUT /api/products/:id/prices
 * Установить цену товара для вида цены (с записью в историю)
 */
router.put('/:id/prices', async (req, res) => {
  try {
    const user = (req as any).user;
    const { priceTypeId, price, priceFrom } = req.body;
    const value = Number(price);
    if (!Number.isFinite(value) || value < 0) return res.status(400).json({ error: 'Некорректная цена' });

    const product = await prisma.product.findUnique({ where: { id: req.params.id } });
    if (!product) return res.status(404).json({ error: 'Товар не найден' });
    const priceType = await prisma.priceType.findUnique({ where: { id: priceTypeId } });
    if (!priceType) return res.status(400).json({ error: 'Вид цены не найден' });

    const updated = await prisma.$transaction(async (tx) => {
      const existing = await tx.productPrice.findUnique({
        where: { productId_priceTypeId: { productId: product.id, priceTypeId } },
      });
      const p = await tx.productPrice.upsert({
        where: { productId_priceTypeId: { productId: product.id, priceTypeId } },
        create: { productId: product.id, priceTypeId, price: value },
        update: { price: value },
      });
      // Отметка «от» (цена от …) — сырым запросом: колонка price_from вне схемы Prisma
      if (priceFrom !== undefined) {
        await tx.$executeRawUnsafe(`UPDATE product_prices SET price_from = ${priceFrom ? 'true' : 'false'} WHERE id = '${p.id}'`);
      }
      await tx.priceHistory.create({
        data: {
          productId: product.id,
          priceTypeId,
          oldPrice: existing?.price ?? 0,
          newPrice: value,
          userId: user.id,
        },
      });
      return { ...p, priceFrom: priceFrom !== undefined ? !!priceFrom : undefined };
    });

    res.json(updated);
  } catch (err: any) {
    console.error('[products:set-price]', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
