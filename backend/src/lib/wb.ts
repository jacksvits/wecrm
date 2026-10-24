import { prisma } from './prisma.js';
import fs from 'fs';
import path from 'path';
import { resolveRetailType, writeProductPrice } from './ozon.js';

const WB_API = 'https://suppliers-api.wildberries.ru';
// Marketplace API — резервный хост для чтения остатков (зависит от типа кабинета)
const WB_MARKETPLACE_API = 'https://marketplace-api.wildberries.ru';
const UPLOAD_ROOT = process.env.UPLOAD_ROOT || '/app/uploads';

/** Настройки подключения WB Seller */
export async function getWbSettings() {
  const settings = await prisma.wbSellerSettings.findUnique({ where: { id: 1 } });
  if (!settings?.apiKey) return null;
  return settings;
}

/** Базовый вызов WB API (авторизация: заголовок Authorization) */
async function wbApi<T = any>(method: string, path: string, body?: any): Promise<T> {
  const settings = await getWbSettings();
  if (!settings) throw new Error('WB Seller не подключён: укажите API-ключ в настройках интеграции');
  const res = await fetch(`${WB_API}${path}`, {
    method,
    headers: {
      'Authorization': settings.apiKey.trim(),
      'Content-Type': 'application/json',
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data: any = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = { raw: text }; }
  if (!res.ok) throw new Error(`WB: HTTP ${res.status}${data?.message ? ` — ${data.message}` : ''}`);
  return data as T;
}

/** Список складов продавца WB */
export async function getWbWarehouses(): Promise<any[]> {
  const data = await wbApi('GET', '/api/v3/warehouses');
  return Array.isArray(data) ? data : (data?.warehouses || []);
}

/** Проверка подключения: список складов */
export async function testWbConnection() {
  const warehouses = await getWbWarehouses();
  return { ok: true, warehouses: (warehouses || []).map((w: any) => ({ id: w.id, name: w.name })) };
}

/** Дерево предметов WB (для выбора предмета по умолчанию в настройках) */
export async function fetchWbSubjects(): Promise<any[]> {
  const data = await wbApi('GET', '/content/v2/object/parent/all');
  return Array.isArray(data) ? data : [];
}

/** Характеристики предмета WB */
export async function fetchWbSubjectCharcs(subjectId: number): Promise<any[]> {
  const data = await wbApi('GET', `/content/v2/object/charcs/${subjectId}`);
  return Array.isArray(data) ? data : [];
}

/**
 * Карточки товаров из кабинета WB (постранично, до 100 за раз).
 * textSearch — поиск по артикулу/названию (для привязки и поиска nmID).
 */
export async function fetchWbCardsList(textSearch?: string): Promise<any[]> {
  const cards: any[] = [];
  let offset = 0;
  for (let page = 0; page < 200; page++) {
    const filter: any = { withPhoto: -1 };
    if (textSearch) filter.textSearch = textSearch;
    const data = await wbApi('POST', '/content/v2/get/cards/list', {
      settings: { cursor: { limit: 100, offset }, filter },
    });
    const batch = data?.cards || [];
    cards.push(...batch);
    const total = Number(data?.cursor?.total ?? 0);
    offset += batch.length;
    if (!batch.length || (total > 0 && offset >= total) || batch.length < 100) break;
  }
  return cards;
}

/** Цены из кабинета: артикул продавца (vendorCode) → базовая цена карточки */
export async function fetchWbPrices(): Promise<Map<string, number>> {
  const map = new Map<string, number>();
  for (const card of await fetchWbCardsList()) {
    const vendorCode = String(card.vendorCode ?? '');
    const price = Number(card.price) || 0;
    if (vendorCode && price > 0) map.set(vendorCode, price);
  }
  return map;
}

/**
 * Остатки из кабинета: sku (артикул продавца) → количество.
 * Эндпоинт чтения остатков зависит от кабинета: пробуем основной API,
 * при 404 — marketplace API. Проверено будет на живом ключе.
 */
export async function fetchWbStocks(): Promise<Map<string, number>> {
  const settings = await getWbSettings();
  const warehouses = await getWbWarehouses();
  const warehouseId = warehouses?.[0]?.id;
  if (warehouseId == null) throw new Error('В кабинете WB нет складов');
  const tryRead = async (base: string): Promise<any | null> => {
    const res = await fetch(`${base}/api/v3/stocks/${warehouseId}`, {
      headers: { 'Authorization': settings!.apiKey.trim() },
    });
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`WB: HTTP ${res.status}`);
    return res.json().catch(() => null);
  };
  let data = await tryRead(WB_API).catch(() => null);
  if (!data) data = await tryRead(WB_MARKETPLACE_API).catch(() => null);
  if (!data) throw new Error('WB: не найден рабочий эндпоинт чтения остатков — проверьте доступность API в кабинете WB');
  const map = new Map<string, number>();
  for (const row of data?.stocks || []) {
    const sku = String(row.sku ?? row.vendorCode ?? '');
    const amount = Number(row.amount ?? row.stock ?? row.present ?? 0) || 0;
    if (sku) map.set(sku, amount);
  }
  return map;
}

/**
 * Вид цен для WB: АКТИВНЫЙ вид цен с опцией «WB» (price_types.for_wb);
 * если опция не включена ни для одного вида цен — обычная розничная логика.
 */
export async function resolveWbPriceType(): Promise<{ id: string } | null> {
  try {
    const wbType = await prisma.priceType.findFirst({ where: { forWb: true, isActive: true } });
    if (wbType) return { id: wbType.id };
  } catch {
    // колонка for_wb ещё не применена (миграция) — работаем по прежней схеме
  }
  return resolveRetailType();
}

/** Записать остаток из кабинета WB в складской учёт CRM (склад задаётся вызовом) */
async function applyWbStockToWarehouse(productId: string, quantity: number, warehouseId: string): Promise<boolean> {
  const qty = Math.max(0, Math.round(quantity));
  const balance = await prisma.stockBalance.findUnique({
    where: { productId_warehouseId: { productId, warehouseId } },
  });
  if (balance && Math.round(balance.quantity) === qty) return false;
  await prisma.$transaction(async (tx) => {
    await tx.stockMovement.create({
      data: { productId, warehouseId, type: 'adjust', quantity: qty, comment: 'Синхронизация WB' },
    });
    await tx.stockBalance.upsert({
      where: { productId_warehouseId: { productId, warehouseId } },
      create: { productId, warehouseId, quantity: qty },
      update: { quantity: qty },
    });
  });
  return true;
}

/** Итог одной синхронизационной задачи (цены/остатки) */
export interface WbJobSummary {
  updated: number;
  skipped: number;
  failed: number;
  errors: string[];
}

/** Сохранить результат задачи в настройках плагина (время и JSON-итог с типом задачи) */
async function saveWbJobResult(kind: 'products' | 'prices' | 'stocks', summary: unknown): Promise<void> {
  await prisma.wbSellerSettings.update({
    where: { id: 1 },
    data: { lastSyncAt: new Date(), lastSyncResult: JSON.stringify({ kind, ...(summary as object) }) },
  }).catch(() => {});
}

/**
 * Загрузка фото товара в WB и привязка к артикулу (media/temp).
 * Неблокирующая: ошибки медиа не отменяют создание карточки.
 */
async function wbBindMedia(offerId: string, product: any): Promise<void> {
  const settings = await getWbSettings();
  if (!settings) return;
  // пути картинок через вложения (relation у ProductImage к FileAttachment не объявлен — читаем вручную)
  const attachmentIds = (product.images || []).map((i: any) => i.attachmentId).filter(Boolean) as string[];
  if (!attachmentIds.length) return;
  const attachments = await prisma.fileAttachment.findMany({ where: { id: { in: attachmentIds } } });
  const files = attachments
    .map((a: any) => path.join(UPLOAD_ROOT, String(a.path || '').replace(/^\/+/, '')))
    .filter((f: string) => fs.existsSync(f))
    .slice(0, 10);
  if (!files.length) return;
  const uploaded: string[] = [];
  for (const file of files) {
    try {
      const form = new FormData();
      form.append('uploadfile', new Blob([fs.readFileSync(file)]), path.basename(file));
      const res = await fetch(`${WB_API}/content/v2/media/upload`, {
        method: 'POST',
        headers: { 'Authorization': settings.apiKey.trim() },
        body: form,
      });
      if (res.ok) {
        const names = await res.json().catch(() => null);
        if (Array.isArray(names) && names[0]) uploaded.push(String(names[0]));
      }
    } catch { /* одно фото не критично */ }
  }
  if (uploaded.length) {
    await wbApi('POST', '/content/v2/media/temp', { data: [{ name: offerId, vector: uploaded }] });
  }
}

/**
 * Поиск nmID карточки по артикулу после создания (карточка обрабатывается WB асинхронно).
 */
async function wbFindCardNmId(offerId: string): Promise<number | null> {
  for (let i = 0; i < 6; i++) {
    await new Promise((r) => setTimeout(r, 5000));
    const cards = await fetchWbCardsList(offerId);
    if (cards.length) return Number(cards[0].nmID) || null;
  }
  return null;
}

/**
 * Создание карточки «В WB»: предмет по умолчанию из настроек + обязательные характеристики.
 * Обязательные характеристики, которые невозможно заполнить из карточки CRM,
 * перечисляются в ошибке (их нужно заполнить вручную в кабинете WB).
 */
async function wbCreateCard(product: any, price: number | null): Promise<number> {
  const settings = await getWbSettings();
  if (!settings?.defaultSubjectId) {
    throw new Error('Для создания карточек «В WB» выберите предмет WB по умолчанию в настройках плагина');
  }
  const offerId = product.article || product.sku || product.id;
  const charcs = await fetchWbSubjectCharcs(settings.defaultSubjectId);
  const characteristics: any[] = [];
  const missingRequired: string[] = [];
  for (const ch of charcs) {
    if (!ch.required) continue;
    const name = String(ch.name || '').toLowerCase();
    if (name.includes('наименование') || name === 'название') {
      characteristics.push({ id: ch.id, value: product.name });
    } else if (name.includes('артикул продавца')) {
      characteristics.push({ id: ch.id, value: offerId });
    } else if (name.includes('бренд')) {
      characteristics.push({ id: ch.id, value: 'Не указан' });
    } else {
      missingRequired.push(ch.name);
    }
  }
  if (missingRequired.length) {
    throw new Error(`Не заполнены обязательные характеристики WB: ${missingRequired.join(', ')}`);
  }
  const result = await wbApi('POST', '/content/v2/cards/upload', {
    cards: [{
      vendorCode: offerId,
      subjectID: settings.defaultSubjectId,
      characteristics,
      sizes: [{ price: price != null ? Math.round(price) : undefined, skus: [offerId] }],
    }],
  });
  const err = result?.error || result?.errors?.[0]?.error || result?.errors?.[0];
  if (err) throw new Error(`WB не принял карточку: ${typeof err === 'string' ? err : JSON.stringify(err)}`);
  // фото — неблокирующе, привяжутся к карточке по артикулу
  wbBindMedia(offerId, product).catch((e: any) => console.warn('[wb] media upload:', e.message));
  const nmId = await wbFindCardNmId(offerId);
  if (nmId == null) throw new Error('Карточка отправлена в WB, но nmID не найден — проверьте статус обработки в кабинете');
  return nmId;
}

/** Импорт карточек из кабинета WB в номенклатуру CRM (привязка по артикулу, создание новых) */
export async function importWbProducts(userId?: string): Promise<{ created: number; linked: number; skipped: number; errors: string[] }> {
  const settings = await getWbSettings();
  if (!settings) throw new Error('WB Seller не подключён: укажите API-ключ в настройках интеграции');
  const priceType = await resolveWbPriceType();
  const cards = await fetchWbCardsList();
  const result = { created: 0, linked: 0, skipped: 0, errors: [] as string[] };
  for (const card of cards) {
    const vendorCode = String(card.vendorCode ?? '');
    if (!vendorCode) { result.skipped++; continue; }
    try {
      const existing = await prisma.product.findFirst({ where: { OR: [{ article: vendorCode }, { sku: vendorCode }] }, include: { prices: true } });
      const price = Number(card.price) || 0;
      if (existing) {
        await prisma.product.update({
          where: { id: existing.id },
          data: { wbProductId: BigInt(Number(card.nmID)), syncToWb: true, ...(price > 0 && priceType ? {} : {}) },
        });
        if (price > 0 && priceType) await writeProductPrice(existing.id, priceType.id, price);
        result.linked++;
      } else {
        const created = await prisma.product.create({
          data: {
            name: card.title || vendorCode,
            article: vendorCode,
            wbProductId: BigInt(Number(card.nmID)),
            syncToWb: true,
            prices: price > 0 && priceType ? { create: { priceTypeId: priceType.id, price } } : undefined,
          },
        });
        if (price > 0 && priceType) {
          await prisma.priceHistory.create({ data: { productId: created.id, priceTypeId: priceType.id, oldPrice: 0, newPrice: price, userId } });
        }
        result.created++;
      }
    } catch (err: any) {
      result.errors.push(`${vendorCode}: ${err.message}`);
    }
  }
  await saveWbJobResult('products', result);
  return result;
}

/**
 * Товары «В WB»: привязка существующих карточек по артикулу (первый проход),
 * создание новых карточек (когда предмет по умолчанию задан), цены и остатки —
 * только в режимах «В WB» (в режимах «С WB» их обновляют отдельные задачи).
 */
export async function syncProductsToWb(): Promise<{ created: number; updated: number; failed: number; errors: string[] }> {
  const settings = await getWbSettings();
  if (!settings) throw new Error('WB Seller не подключён: укажите API-ключ в настройках интеграции');
  const summary = { created: 0, updated: 0, failed: 0, errors: [] as string[] };
  const priceType = await resolveWbPriceType();
  const pricesToWb = settings.pricesMode !== 'from_wb';
  const stocksToWb = settings.stocksMode !== 'from_wb';
  const products = await prisma.product.findMany({
    where: { syncToWb: true, isActive: true, kind: 'product' },
    include: { prices: true, stocks: true, images: { orderBy: { sortOrder: 'asc' }, take: 10 } },
  });
  // Индекс карточек по артикулу — один запрос на всю синхронизацию
  const cardIndex = new Map<string, number>();
  for (const card of await fetchWbCardsList()) {
    const vendorCode = String(card.vendorCode ?? '');
    if (vendorCode && card.nmID) cardIndex.set(vendorCode, Number(card.nmID));
  }
  const warehouseId = stocksToWb ? (await getWbWarehouses())[0]?.id : null;
  if (stocksToWb && warehouseId == null) {
    throw new Error('В кабинете WB нет складов — создайте склад, чтобы выгружать остатки');
  }
  const priceItems: { nmID: number; price: number }[] = [];
  const stockItems: { sku: string; amount: number }[] = [];

  for (const product of products) {
    const offerId = product.article || product.sku || product.id;
    const priceRow = priceType ? product.prices.find((p: any) => p.priceTypeId === priceType.id) : null;
    const price = priceRow?.price ?? null;
    const quantity = product.stocks.reduce((sum: number, s: any) => sum + (Number(s.quantity) || 0), 0);
    try {
      let nmId = product.wbProductId != null ? Number(product.wbProductId) : (cardIndex.get(offerId) ?? null);
      if (nmId == null) {
        // карточки нет — создаём (нужен предмет по умолчанию в настройках)
        nmId = await wbCreateCard(product, price);
        await prisma.product.update({ where: { id: product.id }, data: { wbProductId: BigInt(nmId), wbSyncedAt: new Date() } });
        summary.created++;
        continue;
      }
      if (product.wbProductId == null) {
        await prisma.product.update({ where: { id: product.id }, data: { wbProductId: BigInt(nmId), wbSyncedAt: new Date() } });
      }
      if (pricesToWb && price != null) priceItems.push({ nmID: nmId, price: Math.round(price) });
      if (stocksToWb) stockItems.push({ sku: offerId, amount: Math.max(0, Math.round(quantity)) });
      await prisma.product.update({ where: { id: product.id }, data: { wbSyncedAt: new Date() } });
      summary.updated++;
    } catch (err: any) {
      summary.failed++;
      summary.errors.push(`${offerId}: ${err.message}`);
    }
  }

  // Выгрузка цен пачками (до 1000 за запрос)
  for (let i = 0; i < priceItems.length; i += 1000) {
    const chunk = priceItems.slice(i, i + 1000);
    try { await wbApi('POST', '/api/v2/upload/prices', chunk); }
    catch (err: any) { summary.failed += chunk.length; summary.errors.push(`prices: ${err.message}`); }
  }
  // Выгрузка остатков на первый склад WB пачками (до 1000 за запрос)
  for (let i = 0; i < stockItems.length; i += 1000) {
    const chunk = stockItems.slice(i, i + 1000);
    try { await wbApi('PUT', `/api/v3/stocks/${warehouseId}`, { stocks: chunk }); }
    catch (err: any) { summary.failed += chunk.length; summary.errors.push(`stocks: ${err.message}`); }
  }
  await saveWbJobResult('products', summary);
  return summary;
}

/** Цены «В WB»: выгрузить цены (вид «WB», иначе розничный) по товарам с привязанной карточкой */
export async function syncPricesToWb(): Promise<WbJobSummary> {
  const settings = await getWbSettings();
  if (!settings) throw new Error('WB Seller не подключён: укажите API-ключ в настройках интеграции');
  const summary: WbJobSummary = { updated: 0, skipped: 0, failed: 0, errors: [] };
  const priceType = await resolveWbPriceType();
  if (!priceType) throw new Error('Не задан вид цен для WB: отметьте опцию «WB» у вида цен либо создайте активный вид цен');
  const products = await prisma.product.findMany({
    where: { syncToWb: true, isActive: true, kind: 'product', wbProductId: { not: null } },
    include: { prices: true },
  });
  const items: { nmID: number; price: number }[] = [];
  for (const product of products) {
    const row = product.prices.find((p: any) => p.priceTypeId === priceType.id);
    if (row) items.push({ nmID: Number(product.wbProductId), price: Math.round(row.price) });
    else summary.skipped++;
  }
  for (let i = 0; i < items.length; i += 1000) {
    const chunk = items.slice(i, i + 1000);
    try { await wbApi('POST', '/api/v2/upload/prices', chunk); summary.updated += chunk.length; }
    catch (err: any) { summary.failed += chunk.length; summary.errors.push(err.message); }
  }
  await saveWbJobResult('prices', summary);
  return summary;
}

/** Цены «С WB»: прочитать цены из кабинета и записать в CRM в вид цен «WB» (иначе розничный) */
export async function syncPricesFromWb(): Promise<WbJobSummary> {
  const settings = await getWbSettings();
  if (!settings) throw new Error('WB Seller не подключён: укажите API-ключ в настройках интеграции');
  const summary: WbJobSummary = { updated: 0, skipped: 0, failed: 0, errors: [] };
  const priceType = await resolveWbPriceType();
  if (!priceType) throw new Error('Не задан вид цен для WB: отметьте опцию «WB» у вида цен либо создайте активный вид цен');
  const prices = await fetchWbPrices();
  const products = await prisma.product.findMany({ where: { syncToWb: true, isActive: true, kind: 'product' } });
  for (const product of products) {
    const offerId = product.article || product.sku || product.id;
    const price = prices.get(offerId);
    if (!price) { summary.skipped++; continue; }
    try {
      if (await writeProductPrice(product.id, priceType.id, price)) summary.updated++;
      else summary.skipped++;
    } catch (err: any) {
      summary.failed++;
      summary.errors.push(`${offerId}: ${err.message}`);
    }
  }
  await saveWbJobResult('prices', summary);
  return summary;
}

/** Остатки «В WB»: выгрузить суммарные остатки складского учёта на первый склад WB */
export async function syncStocksToWb(): Promise<WbJobSummary> {
  const settings = await getWbSettings();
  if (!settings) throw new Error('WB Seller не подключён: укажите API-ключ в настройках интеграции');
  const summary: WbJobSummary = { updated: 0, skipped: 0, failed: 0, errors: [] };
  const warehouses = await getWbWarehouses();
  const warehouseId = warehouses?.[0]?.id;
  if (warehouseId == null) throw new Error('В кабинете WB нет складов — создайте склад, чтобы выгружать остатки');
  const products = await prisma.product.findMany({
    where: { syncToWb: true, isActive: true, kind: 'product' },
    include: { stocks: true },
  });
  const items: { sku: string; amount: number }[] = [];
  for (const product of products) {
    const offerId = product.article || product.sku || product.id;
    const quantity = product.stocks.reduce((sum: number, s: any) => sum + (Number(s.quantity) || 0), 0);
    items.push({ sku: offerId, amount: Math.max(0, Math.round(quantity)) });
  }
  for (let i = 0; i < items.length; i += 1000) {
    const chunk = items.slice(i, i + 1000);
    try { await wbApi('PUT', `/api/v3/stocks/${warehouseId}`, { stocks: chunk }); summary.updated += chunk.length; }
    catch (err: any) { summary.failed += chunk.length; summary.errors.push(err.message); }
  }
  await saveWbJobResult('stocks', summary);
  return summary;
}

/** Остатки «С WB»: прочитать остатки из кабинета и записать в складской учёт CRM */
export async function syncStocksFromWb(): Promise<WbJobSummary> {
  const settings = await getWbSettings();
  if (!settings) throw new Error('WB Seller не подключён: укажите API-ключ в настройках интеграции');
  const summary: WbJobSummary = { updated: 0, skipped: 0, failed: 0, errors: [] };
  const wbStocks = await fetchWbStocks();
  const warehouse = (await prisma.warehouse.findFirst({ where: { id: settings.stockWarehouseId || '', isActive: true } }))
    ?? (await prisma.warehouse.findFirst({ where: { isActive: true }, orderBy: { sortOrder: 'asc' } }));
  if (!warehouse) throw new Error('В CRM нет активного склада — создайте склад, чтобы сохранять остатки из WB');
  const products = await prisma.product.findMany({ where: { syncToWb: true, isActive: true, kind: 'product' } });
  for (const product of products) {
    const offerId = product.article || product.sku || product.id;
    try {
      if (await applyWbStockToWarehouse(product.id, wbStocks.get(offerId) ?? 0, warehouse.id)) summary.updated++;
      else summary.skipped++;
    } catch (err: any) {
      summary.failed++;
      summary.errors.push(`${offerId}: ${err.message}`);
    }
  }
  await saveWbJobResult('stocks', summary);
  return summary;
}

/**
 * Полная синхронизация по настройкам режимов: товары, цены и остатки —
 * каждый блок в своём направлении («В WB» / «С WB»). Используется ручной кнопкой.
 */
export async function runWbFullSync(userId?: string): Promise<{
  products?: unknown; prices?: unknown; stocks?: unknown;
}> {
  const settings = await getWbSettings();
  if (!settings) throw new Error('WB Seller не подключён: укажите API-ключ в настройках интеграции');
  const result: { products?: unknown; prices?: unknown; stocks?: unknown } = {};
  try {
    result.products = settings.productsMode === 'from_wb' ? await importWbProducts(userId) : await syncProductsToWb();
  } catch (err: any) {
    result.products = { error: err.message };
  }
  try {
    result.prices = settings.pricesMode === 'from_wb' ? await syncPricesFromWb() : await syncPricesToWb();
  } catch (err: any) {
    result.prices = { error: err.message };
  }
  try {
    result.stocks = settings.stocksMode === 'from_wb' ? await syncStocksFromWb() : await syncStocksToWb();
  } catch (err: any) {
    result.stocks = { error: err.message };
  }
  return result;
}
