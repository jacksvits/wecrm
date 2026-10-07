import { prisma } from './prisma.js';

const OZON_API = 'https://api-seller.ozon.ru';

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

/** Проверка подключения: запрос списка товаров (1 шт.) */
export async function testOzonConnection(creds?: OzonCredentials): Promise<{ ok: boolean; total?: number; error?: string }> {
  try {
    const data = await ozonApi('POST', '/v2/product/info/list', { limit: 1 }, creds);
    return { ok: true, total: data?.result?.total ?? undefined };
  } catch (e: any) {
    return { ok: false, error: e.message };
  }
}

/** Создать товары в OZON (метод импорта каталога) */
export async function ozonImportProducts(items: { offer_id: string; name: string; barcode?: string; price?: number; quantity?: number }[]): Promise<number> {
  const data = await ozonApi('POST', '/v1/product/import', {
    items: items.map((it) => ({
      offer_id: it.offer_id,
      name: it.name,
      barcode: it.barcode || undefined,
      price: it.price != null ? String(it.price) : undefined,
      quantity: it.quantity != null ? String(it.quantity) : undefined,
      currency_code: 'RUB',
      vat: '0',
    })),
  });
  return data?.result?.task_id ?? 0;
}

/** Обновить цены существующих товаров */
export async function ozonUpdatePrices(items: { product_id: number; price: number }[]): Promise<void> {
  await ozonApi('POST', '/v1/product/import/prices', {
    prices: items.map((it) => ({ product_id: it.product_id, price: String(it.price), old_price: '', premium_price: '', currency_code: 'RUB' })),
  });
}

/** Обновить остатки существующих товаров */
export async function ozonUpdateStocks(items: { product_id: number; stock: number }[]): Promise<void> {
  await ozonApi('POST', '/v2/products/stocks', {
    stocks: items.map((it) => ({ product_id: it.product_id, stock: it.stock })),
  });
}

/** Найти товар в OZON по offer_id (внутренний артикул/артикул из CRM) */
export async function ozonFindProductId(offerId: string): Promise<number | null> {
  try {
    const data = await ozonApi('POST', '/v2/product/info/list', {
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
      images: { orderBy: { sortOrder: 'asc' }, take: 1 },
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

  for (const product of products) {
    try {
      const offerId = product.article || product.sku || product.id;
      const retail = retailType ? product.prices.find((p) => p.priceTypeId === retailType!.id) : null;
      const price = retail?.price ?? null;
      const quantity = product.stocks.reduce((sum, s) => sum + s.quantity, 0);

      if (product.ozonProductId) {
        // существующий товар в OZON — обновляем цену и остаток
        if (price != null) await ozonUpdatePrices([{ product_id: product.ozonProductId, price: Math.round(price) }]);
        await ozonUpdateStocks([{ product_id: product.ozonProductId, stock: Math.max(0, Math.round(quantity)) }]);
        await prisma.product.update({ where: { id: product.id }, data: { ozonSyncedAt: new Date() } });
        summary.updated++;
        continue;
      }

      // пробуем найти уже созданный в OZON товар по offer_id (например, создан вручную)
      const existingId = await ozonFindProductId(offerId);
      if (existingId) {
        await prisma.product.update({ where: { id: product.id }, data: { ozonProductId: existingId, ozonSyncedAt: new Date() } });
        if (price != null) await ozonUpdatePrices([{ product_id: existingId, price: Math.round(price) }]);
        await ozonUpdateStocks([{ product_id: existingId, stock: Math.max(0, Math.round(quantity)) }]);
        summary.updated++;
        continue;
      }

      // создаём новый товар в OZON
      await ozonImportProducts([{
        offer_id: offerId,
        name: product.name,
        barcode: product.barcode || undefined,
        price: price != null ? Math.round(price) : undefined,
        quantity: Math.max(0, Math.round(quantity)),
      }]);
      // импорт в OZON асинхронный: product_id появится позже — пробуем найти сразу
      const newId = await ozonFindProductId(offerId);
      await prisma.product.update({
        where: { id: product.id },
        data: { ozonProductId: newId, ozonSyncedAt: new Date() },
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
