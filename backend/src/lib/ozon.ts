import { prisma } from './prisma.js';

const OZON_API = 'https://api-seller.ozon.ru';
// Публичный адрес CRM — картинки товаров отдаются по нему, OZON заберёт их при импорте
const PUBLIC_BASE_URL = (process.env.PUBLIC_BASE_URL || 'https://welans.cc').replace(/\/$/, '');

export interface OzonCredentials {
  clientId: string;
  apiKey: string;
}

/** Настройки подключения OZON Seller */
export async function getOzonSettings() {
  const settings = await prisma.ozonSellerSettings.findUnique({ where: { id: 1 } });
  if (!settings?.clientId || !settings?.apiKey) return null;
  return settings;
}

/** Базовый вызов OZON Seller API (авторизация: Client-Id + Api-Key) */
async function ozonApi<T = any>(method: string, path: string, body: any, creds?: OzonCredentials): Promise<T> {
  const settings = creds || await getOzonSettings();
  if (!settings) throw new Error('OZON Seller не подключён: укажите Client-Id и API-ключ в настройках интеграции');
  const res = await fetch(`${OZON_API}${path}`, {
    method,
    headers: {
      'Client-Id': settings.clientId,
      'Api-Key': settings.apiKey,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data: any = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = data?.message || data?.error?.message || `HTTP ${res.status}`;
    throw new Error(`OZON: ${msg}`);
  }
  return data as T;
}

/** Проверка подключения: запрос списка товаров (1 шт.). Метод /v2/product/info/list удалён из API — используем /v3/product/list */
export async function testOzonConnection(creds?: OzonCredentials): Promise<{ ok: boolean; total?: number; error?: string }> {
  try {
    const data = await ozonApi('POST', '/v3/product/list', { filter: { visibility: 'ALL' }, limit: 1 }, creds);
    return { ok: true, total: data?.result?.total_items ?? data?.result?.total ?? undefined };
  } catch (e: any) {
    return { ok: false, error: e.message };
  }
}

/** Найти в дереве OZON родительскую description_category_id для листового type_id */
async function resolveOzonDescriptionCategoryId(typeId: number): Promise<number | null> {
  try {
    const tree = await fetchOzonCategoryTree();
    const walk = (nodes: any[], parentDescId: number | null): number | null => {
      for (const n of nodes) {
        const descId = n.description_category_id ?? parentDescId;
        if (n.type_id === typeId) return parentDescId;
        if (n.children?.length) {
          const f = walk(n.children, n.description_category_id != null ? n.description_category_id : parentDescId);
          if (f) return f;
        }
      }
      return null;
    };
    return walk(tree, null);
  } catch {
    return null;
  }
}

/** Создать товары в OZON (актуальный метод /v3/product/import; /v1 и /v2 удалены из API).
 *  Важно: OZON требует ОБА идентификатора — type_id (листовой тип) и description_category_id (родительская группа типа). */
export async function ozonImportProducts(items: { offer_id: string; name: string; typeId: number; descriptionCategoryId: number; barcode?: string; price?: number; quantity?: number; images?: string[] }[]): Promise<number> {
  const data = await ozonApi('POST', '/v3/product/import', {
    items: items.map((it) => ({
      offer_id: it.offer_id,
      name: it.name,
      type_id: it.typeId,
      description_category_id: it.descriptionCategoryId,
      barcode: it.barcode || undefined,
      price: it.price != null ? String(it.price) : undefined,
      quantity: it.quantity != null ? String(it.quantity) : undefined,
      images: it.images?.length ? it.images : undefined,
      currency_code: 'RUB',
      vat: '0',
      attributes: [],
    })),
  });
  return data?.result?.task_id ?? 0;
}

/** Результат задачи импорта: ошибки по товарам, если есть */
export async function ozonImportTaskResult(taskId: number): Promise<string[]> {
  try {
    const data = await ozonApi('POST', '/v1/product/import/info', { task_id: taskId });
    const items = data?.result?.items || [];
    return items
      .filter((it: any) => it.errors && it.errors.length)
      .map((it: any) => `${it.offer_id}: ${it.errors.map((e: any) => e.message).join('; ')}`);
  } catch {
    return [];
  }
}

/**
 * Дождаться завершения задачи импорта (до ~60 c) и вернуть статус + ошибки по конкретному offer_id.
 * Импорт в OZON асинхронный: сразу после вызова статус может быть pending без ошибок.
 */
export async function waitOzonImportTask(taskId: number, offerId: string): Promise<{ status: string; errors: string[] }> {
  for (let i = 0; i < 15; i++) {
    await new Promise((r) => setTimeout(r, 4000));
    try {
      const data = await ozonApi('POST', '/v1/product/import/info', { task_id: taskId });
      const items = data?.result?.items || [];
      const own = items.filter((it: any) => it.offer_id === offerId);
      if (!own.length) continue;
      if (own.every((it: any) => it.status && it.status !== 'pending')) {
        return {
          status: own[0].status,
          errors: own
            .filter((it: any) => it.errors && it.errors.length)
            .map((it: any) => `${it.offer_id}: ${it.errors.map((e: any) => e.message).join('; ')}`),
        };
      }
    } catch {
      /* задача ещё не готова — повторяем */
    }
  }
  return { status: 'timeout', errors: [] };
}

/** Обновить цены существующих товаров */
export async function ozonUpdatePrices(items: { product_id: number; price: number }[]): Promise<void> {
  await ozonApi('POST', '/v1/product/import/prices', {
    prices: items.map((it) => ({ product_id: it.product_id, price: String(it.price), old_price: '', premium_price: '', currency_code: 'RUB' })),
  });
}

let warehousesCache: { at: number; ids: number[] } | null = null;

/** Список складов продавца (кэш 1 ч); остатки в OZON обязательно привязаны к складу */
export async function getOzonWarehouseIds(): Promise<number[]> {
  if (warehousesCache && Date.now() - warehousesCache.at < 60 * 60 * 1000) return warehousesCache.ids;
  const data = await ozonApi('POST', '/v2/warehouse/list', {});
  const ids = (data?.warehouses || []).map((w: any) => Number(w.warehouse_id));
  warehousesCache = { at: Date.now(), ids };
  return ids;
}

/** Обновить остатки существующих товаров (на первом складе продавца) */
export async function ozonUpdateStocks(items: { product_id: number; stock: number }[], warehouseId: number): Promise<void> {
  await ozonApi('POST', '/v2/products/stocks', {
    stocks: items.map((it) => ({ product_id: it.product_id, stock: it.stock, warehouse_id: warehouseId })),
  });
}

let categoryTreeCache: { at: number; tree: any[] } | null = null;

/** Дерево категорий OZON (кэш 24 ч) — для выбора категории по умолчанию в настройках плагина */
export async function fetchOzonCategoryTree(): Promise<any[]> {
  if (categoryTreeCache && Date.now() - categoryTreeCache.at < 24 * 60 * 60 * 1000) return categoryTreeCache.tree;
  const data = await ozonApi('POST', '/v1/description-category/tree', { category_id: 0, language: 'RU' });
  const tree = data?.result || [];
  categoryTreeCache = { at: Date.now(), tree };
  return tree;
}

/** Найти товар в OZON по offer_id (внутренний артикул/артикул из CRM) */
export async function ozonFindProductId(offerId: string): Promise<number | null> {
  try {
    const data = await ozonApi('POST', '/v3/product/list', {
      filter: { offer_id: [offerId] },
      limit: 1,
    });
    const items = data?.result?.items || [];
    return items.length ? items[0].product_id ?? null : null;
  } catch {
    return null;
  }
}

export interface OzonSyncSummary {
  created: number;
  updated: number;
  failed: number;
  errors: string[];
}

/** Выкачать весь каталог товаров из OZON (курсорная пагинация /v3/product/list) */
export async function fetchAllOzonProducts(): Promise<any[]> {
  const all: any[] = [];
  let lastId = '';
  for (let page = 0; page < 50; page++) {
    const data = await ozonApi('POST', '/v3/product/list', {
      filter: { visibility: 'ALL' },
      limit: 100,
      last_id: lastId || undefined,
    });
    const items = data?.result?.items || [];
    all.push(...items);
    const next = data?.result?.last_id;
    if (!items.length || !next || next === lastId) break;
    lastId = next;
  }
  return all;
}

/**
 * Импорт каталога из OZON в CRM (двусторонняя синхронизация):
 * 1. Товары CRM сопоставляются с OZON по артикулу (offer_id) → привязка ozonProductId + отметка «OZON Seller».
 * 2. Товаров в CRM нет → СОЗДАЮТСЯ автоматически (название = артикул, т.к. API OZON не отдаёт названия)
 *    в категории «OZON Seller» (создаётся при первом импорте).
 * Цены и остатки после импорта обновляются обычной синхронизацией CRM → OZON.
 */
export async function importOzonProducts(): Promise<{ created: number; linked: number; skipped: number; errors: string[] }> {
  const settings = await getOzonSettings();
  if (!settings) throw new Error('OZON Seller не подключён: укажите Client-Id и API-ключ в настройках интеграции');
  const summary = { created: 0, linked: 0, skipped: 0, errors: [] as string[] };

  const items = await fetchAllOzonProducts();

  // Категория для автосозданных товаров (создаётся один раз)
  let ozonCategory = await prisma.productCategory.findFirst({ where: { name: 'OZON Seller', parentId: null } });
  if (!ozonCategory) {
    ozonCategory = await prisma.productCategory.create({ data: { name: 'OZON Seller', isGroup: false } });
  }

  for (const it of items) {
    try {
      const productId = Number(it.product_id);
      const offerId = String(it.offer_id ?? '').trim();
      if (!offerId) { summary.skipped++; continue; }

      // уже привязана?
      const byOzon = await prisma.product.findFirst({ where: { ozonProductId: BigInt(productId) } });
      if (byOzon) {
        await prisma.product.update({ where: { id: byOzon.id }, data: { syncToOzon: true } });
        summary.linked++;
        continue;
      }
      // сопоставление по артикулу / внутреннему артикулу
      const byArticle = await prisma.product.findFirst({
        where: { OR: [{ article: offerId }, { sku: offerId }] },
      });
      if (byArticle) {
        await prisma.product.update({ where: { id: byArticle.id }, data: { ozonProductId: BigInt(productId), syncToOzon: true } });
        summary.linked++;
        continue;
      }
      // товара нет в CRM — создаём автоматически
      await prisma.product.create({
        data: {
          article: offerId,
          name: offerId, // API OZON не отдаёт названий — заполните название в карточке
          kind: 'product',
          categoryId: ozonCategory.id,
          syncToOzon: true,
          ozonProductId: BigInt(productId),
        },
      });
      summary.created++;
    } catch (err: any) {
      summary.errors.push(`${it.offer_id || it.product_id}: ${err.message}`);
    }
  }
  return summary;
}

/**
 * Выгрузить все позиции с отметкой «OZON Seller» в маркетплейс OZON.
 * Новые товары создаются через импорт каталога, существующие (по ozonProductId) обновляются (цена/остаток).
 */
export async function syncProductsToOzon(): Promise<OzonSyncSummary> {
  const settings = await getOzonSettings();
  if (!settings) throw new Error('OZON Seller не подключён: укажите Client-Id и API-ключ в настройках интеграции');
  const summary: OzonSyncSummary = { created: 0, updated: 0, failed: 0, errors: [] };

  const products = await prisma.product.findMany({
    where: { syncToOzon: true, isActive: true, kind: 'product' },
    include: {
      images: { orderBy: { sortOrder: 'asc' }, take: 1, include: { attachment: true } },
      stocks: true,
      prices: true,
    },
    orderBy: { name: 'asc' },
  });

  // Розничный вид цен (как для ВК: сначала с флагом for_vk, потом 'retail', потом любой активный)
  const flaggedVkRows = await prisma.$queryRawUnsafe(`SELECT id FROM price_types WHERE for_vk = true AND is_active = true LIMIT 1`) as any[];
  let retailType = flaggedVkRows[0] ? { id: flaggedVkRows[0].id } : null;
  if (!retailType) retailType = await prisma.priceType.findFirst({ where: { name: 'retail', isActive: true } });
  if (!retailType) retailType = await prisma.priceType.findFirst({ where: { isActive: true }, orderBy: { sortOrder: 'desc' } });

  // Остатки в OZON обязательно привязаны к складу — берём первый склад продавца
  const warehouseIds = await getOzonWarehouseIds();
  const warehouseId = warehouseIds[0] ?? null;
  const requireWarehouse = () => {
    if (!warehouseId) throw new Error('В кабинете OZON нет складов — создайте склад, чтобы выгружать остатки');
    return warehouseId;
  };

  // Карта категорий для наследования привязки к OZON: вид → группа → ... → корень → настройка по умолчанию
  const allCategories = await prisma.productCategory.findMany({ select: { id: true, parentId: true, ozonTypeId: true } });
  const catById = new Map(allCategories.map((c) => [c.id, c]));
  const resolveOzonTypeId = (categoryId: string | null): number | null => {
    let cur = categoryId ? catById.get(categoryId) : undefined;
    const guard = new Set<string>();
    while (cur && !guard.has(cur.id)) {
      guard.add(cur.id);
      if (cur.ozonTypeId) return cur.ozonTypeId;
      cur = cur.parentId ? catById.get(cur.parentId) : undefined;
    }
    return settings.defaultTypeId ?? null;
  };

  for (const product of products) {
    try {
      const offerId = product.article || product.sku || product.id;
      const retail = retailType ? product.prices.find((p) => p.priceTypeId === retailType!.id) : null;
      const price = retail?.price ?? null;
      const quantity = product.stocks.reduce((sum, s) => sum + s.quantity, 0);

      if (product.ozonProductId) {
        // существующий товар в OZON — обновляем цену и остаток
        const pid = Number(product.ozonProductId);
        if (price != null) await ozonUpdatePrices([{ product_id: pid, price: Math.round(price) }]);
        await ozonUpdateStocks([{ product_id: pid, stock: Math.max(0, Math.round(quantity)) }], requireWarehouse());
        await prisma.product.update({ where: { id: product.id }, data: { ozonSyncedAt: new Date() } });
        summary.updated++;
        continue;
      }

      // пробуем найти уже созданный в OZON товар по offer_id (например, создан вручную)
      const existingId = await ozonFindProductId(offerId);
      if (existingId) {
        await prisma.product.update({ where: { id: product.id }, data: { ozonProductId: BigInt(existingId), ozonSyncedAt: new Date() } });
        if (price != null) await ozonUpdatePrices([{ product_id: existingId, price: Math.round(price) }]);
        await ozonUpdateStocks([{ product_id: existingId, stock: Math.max(0, Math.round(quantity)) }], requireWarehouse());
        summary.updated++;
        continue;
      }

      // создаём новый товар в OZON: категория из привязки категории CRM (с наследованием) либо из настроек плагина
      const typeId = resolveOzonTypeId(product.categoryId);
      if (!typeId) {
        throw new Error('Не задана категория OZON: привяжите категорию в карточке категории или задайте категорию по умолчанию в настройках плагина');
      }
      const descriptionCategoryId = await resolveOzonDescriptionCategoryId(typeId);
      if (!descriptionCategoryId) {
        throw new Error(`Не удалось определить description_category_id для категории OZON type_id=${typeId}`);
      }
      const taskId = await ozonImportProducts([{
        offer_id: offerId,
        name: product.name,
        typeId,
        descriptionCategoryId,
        barcode: product.barcode || undefined,
        price: price != null ? Math.round(price) : undefined,
        quantity: Math.max(0, Math.round(quantity)),
        // картинка из карточки CRM → OZON забирает её по публичному URL
        images: product.images?.[0]?.attachment?.path ? [`${PUBLIC_BASE_URL}${product.images[0].attachment.path}`] : undefined,
      }]);
      // результат импорта асинхронный: ждём завершения задачи; предупреждения (например, бренд) не считаем падением
      if (taskId) {
        const task = await waitOzonImportTask(taskId, offerId);
        if (task.status === 'failed' || task.status === 'timeout') {
          throw new Error(task.errors.join('; ') || `Импорт в OZON завершился со статусом ${task.status}`);
        }
        for (const w of task.errors) summary.errors.push(`⚠ ${w}`);
      }
      // product_id появится в OZON позже — пробуем найти сразу
      const newId = await ozonFindProductId(offerId);
      await prisma.product.update({
        where: { id: product.id },
        data: { ozonProductId: newId != null ? BigInt(newId) : null, ozonSyncedAt: new Date() },
      });
      summary.created++;
    } catch (err: any) {
      summary.failed++;
      summary.errors.push(`${product.name}: ${err.message}`);
    }
  }

  // сохраняем результат последней синхронизации
  await prisma.ozonSellerSettings.update({
    where: { id: 1 },
    data: { lastSyncAt: new Date(), lastSyncResult: JSON.stringify(summary) },
  }).catch(() => {});

  return summary;
}
