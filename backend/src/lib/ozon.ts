import { prisma } from './prisma.js';
import fs from 'fs';
import path from 'path';

const OZON_API = 'https://api-seller.ozon.ru';
// Публичный адрес CRM — картинки товаров отдаются по нему, OZON заберёт их при импорте
const PUBLIC_BASE_URL = (process.env.PUBLIC_BASE_URL || 'https://welans.cc').replace(/\/$/, '');
const UPLOAD_ROOT = process.env.UPLOAD_ROOT || '/app/uploads';

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

/**
 * Атрибуты карточки CRM для передачи в OZON.
 * Бренд и ТН ВЭД — справочные атрибуты: без dictionary_value_id OZON игнорирует значение,
 * поэтому значение ищется в справочнике (/v1/description-category/attribute/values).
 * Автозаполняемые обязательные: «Название модели» = артикул, «Нужен код маркировки» = нет.
 */
async function buildOzonAttributes(product: { brand?: string | null; tnved?: string | null; article?: string | null }, typeId: number, descriptionCategoryId: number): Promise<any[]> {
  const attrs: any[] = [];
  const brand = product.brand?.trim();
  if (brand) {
    const brandAttrId = (await findOzonAttributeIdByName(descriptionCategoryId, typeId, 'бренд')) ?? 85;
    const dv = await findOzonDictionaryValueId(brandAttrId, descriptionCategoryId, typeId, brand);
    attrs.push({ id: brandAttrId, values: [{ value: brand, ...(dv ? { dictionary_value_id: dv } : {}) }] });
  }
  const tn = product.tnved?.trim();
  if (tn) {
    const tnAttrId = await findOzonAttributeIdByName(descriptionCategoryId, typeId, 'тн вэд');
    if (tnAttrId) {
      const code = tn.split(/\s+/)[0];
      const dv = await findOzonDictionaryValueId(tnAttrId, descriptionCategoryId, typeId, code);
      attrs.push({ id: tnAttrId, values: [{ value: code, ...(dv ? { dictionary_value_id: dv } : {}) }] });
    }
  }
  // Обязательные «Название модели (для объединения в одну карточку)» → артикул из CRM
  const article = product.article?.trim();
  if (article) {
    const modelAttrId = await findOzonAttributeIdByName(descriptionCategoryId, typeId, 'название модели');
    if (modelAttrId) attrs.push({ id: modelAttrId, values: [{ value: article }] });
  }
  // Обязательный булев «Нужен код маркировки» → по умолчанию «нет»
  const markingAttrId = await findOzonAttributeIdByName(descriptionCategoryId, typeId, 'код маркировки');
  if (markingAttrId) attrs.push({ id: markingAttrId, values: [{ value: 'false' }] });
  return attrs;
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
export async function ozonImportProducts(items: { offer_id: string; name: string; typeId: number; descriptionCategoryId: number; barcode?: string; price?: number; quantity?: number; images?: string[]; weight?: number | null; width?: number | null; height?: number | null; depth?: number | null; brand?: string | null; attributes?: any[] }[]): Promise<number> {
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
      // характеристики из карточки CRM: вес кг → граммы, габариты см → миллиметры
      weight: it.weight ? String(Math.round(it.weight * 1000)) : undefined,
      weight_unit: it.weight ? 'g' : undefined,
      width: it.width ? String(Math.round(it.width * 10)) : undefined,
      height: it.height ? String(Math.round(it.height * 10)) : undefined,
      depth: it.depth ? String(Math.round(it.depth * 10)) : undefined,
      dimension_unit: (it.width || it.height || it.depth) ? 'mm' : undefined,
      // атрибуты (бренд, ТН ВЭД) — с dictionary_value_id для справочных
      attributes: it.attributes ?? [],
      currency_code: 'RUB',
      vat: '0',
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

/** Розничный вид цен: флаг for_vk → retail/«розничный» → «(фз)» (прайс для физлиц) → первый активный */
export async function resolveRetailType(): Promise<{ id: string } | null> {
  const flaggedVkRows = await prisma.$queryRawUnsafe(`SELECT id FROM price_types WHERE for_vk = true AND is_active = true LIMIT 1`) as any[];
  if (flaggedVkRows[0]?.id) return { id: flaggedVkRows[0].id };
  const named = await prisma.priceType.findFirst({
    where: { isActive: true, OR: [{ name: { contains: 'retail', mode: 'insensitive' } }, { name: { contains: 'розничн', mode: 'insensitive' } }, { name: { contains: '(фз)', mode: 'insensitive' } }] },
    orderBy: { sortOrder: 'asc' },
  });
  if (named) return { id: named.id };
  const any = await prisma.priceType.findFirst({ where: { isActive: true }, orderBy: { sortOrder: 'asc' } });
  return any ? { id: any.id } : null;
}

/** ID товаров из OZON (product_id + offer_id) через /v3/product/list */
export async function fetchOzonProductIds(): Promise<{ productId: number; offerId: string }[]> {
  const out: { productId: number; offerId: string }[] = [];
  let lastId = '';
  for (let page = 0; page < 50; page++) {
    const data = await ozonApi('POST', '/v3/product/list', {
      filter: { visibility: 'ALL' },
      limit: 100,
      last_id: lastId || undefined,
    });
    const items = data?.result?.items || [];
    for (const it of items) out.push({ productId: Number(it.product_id), offerId: String(it.offer_id ?? '') });
    const next = data?.result?.last_id;
    if (!items.length || !next || next === lastId) break;
    lastId = next;
  }
  return out;
}

/**
 * Полная информация о товарах (/v3/product/info/list): название, цены, штрихкоды, архивность, SKU.
 * ВАЖНО по документации: offer_id / product_id / sku передаются на ВЕРХНЕМ уровне тела запроса.
 */
export async function fetchOzonProductInfos(productIds: number[]): Promise<any[]> {
  const all: any[] = [];
  for (let i = 0; i < productIds.length; i += 100) {
    const chunk = productIds.slice(i, i + 100);
    const data = await ozonApi('POST', '/v3/product/info/list', { product_id: chunk, limit: 100 });
    all.push(...(data?.items || []));
  }
  return all;
}

/** Характеристики товаров: вес (г), габариты (мм), штрихкод (/v4/product/info/attributes) */
export async function fetchOzonAttributes(offerIds: string[]): Promise<Map<string, any>> {
  const map = new Map<string, any>();
  for (let i = 0; i < offerIds.length; i += 100) {
    const chunk = offerIds.slice(i, i + 100);
    const data = await ozonApi('POST', '/v4/product/info/attributes', { filter: { offer_id: chunk }, limit: 100 });
    for (const it of data?.result || []) map.set(String(it.offer_id), it);
  }
  return map;
}

const catAttrCache = new Map<string, Promise<Map<number, string>>>();

/** Атрибуты категории OZON: id → название (для поиска Бренд/ТН ВЭД/Хештеги по имени) */
function fetchOzonCategoryAttributes(descriptionCategoryId: number, typeId: number): Promise<Map<number, string>> {
  const key = `${descriptionCategoryId}:${typeId}`;
  if (!catAttrCache.has(key)) {
    catAttrCache.set(key, (async () => {
      const map = new Map<number, string>();
      try {
        const data = await ozonApi('POST', '/v1/description-category/attribute', { description_category_id: descriptionCategoryId, type_id: typeId, language: 'RU' });
        for (const a of data?.result || []) map.set(Number(a.id), String(a.name ?? ''));
      } catch { /* нет доступа — определим по известным id */ }
      // резервные известные идентификаторы OZON
      if (!map.get(85)) map.set(85, 'Бренд');
      return map;
    })());
  }
  return catAttrCache.get(key)!;
}

/** ID атрибута категории по названию (регистронезависимо) */
async function findOzonAttributeIdByName(descriptionCategoryId: number, typeId: number, needle: string): Promise<number | null> {
  const map = await fetchOzonCategoryAttributes(descriptionCategoryId, typeId);
  const n = needle.toLowerCase();
  for (const [id, name] of map) {
    if (name.toLowerCase().includes(n)) return id;
  }
  return null;
}

const dictCache = new Map<string, Promise<number | null>>();

/**
 * dictionary_value_id значения справочника OZON (для бренда, ТН ВЭД и др.).
 * search_value в API не фильтрует — листаем справочник курсором last_value_id до точного совпадения.
 * Никогда не возвращает «первое попавшееся» значение — лучше отправить текст без ID, чем неверный ID.
 */
function findOzonDictionaryValueId(attributeId: number, descriptionCategoryId: number, typeId: number, search: string): Promise<number | null> {
  const key = `${attributeId}:${descriptionCategoryId}:${typeId}:${search.toLowerCase()}`;
  if (!dictCache.has(key)) {
    dictCache.set(key, (async () => {
      try {
        const target = search.toLowerCase().trim();
        let lastId = 0;
        for (let page = 0; page < 30; page++) {
          const body: any = {
            attribute_id: attributeId,
            description_category_id: descriptionCategoryId,
            type_id: typeId,
            language: 'RU',
            limit: 200,
          };
          if (lastId) body.last_value_id = lastId;
          const data = await ozonApi('POST', '/v1/description-category/attribute/values', body);
          const vals = data?.result || [];
          if (!vals.length) return null;
          // точное совпадение (для ТН ВЭД — по коду, для бренда — по названию)
          const exact = vals.find((v: any) => String(v.value).toLowerCase().trim() === target)
            || vals.find((v: any) => String(v.value).toLowerCase().startsWith(target));
          if (exact) return Number(exact.id);
          const next = Number(vals[vals.length - 1]?.id ?? 0);
          if (!next || next === lastId) return null;
          lastId = next;
        }
        return null;
      } catch {
        return null;
      }
    })());
  }
  return dictCache.get(key)!;
}

/** Извлечь значение атрибута по имени (регистронезависимо, по подстроке) */
function attrValueByName(attrs: any[], nameMap: Map<number, string>, needle: string): string | null {
  const n = needle.toLowerCase();
  for (const a of attrs || []) {
    const name = (nameMap.get(Number(a.id)) || '').toLowerCase();
    if (name.includes(n)) {
      const v = a.values?.[0]?.value;
      if (v != null && String(v).trim()) return String(v).trim();
    }
  }
  return null;
}

/** Название категории OZON по description_category_id (из кэшированного дерева) */
async function resolveOzonCategoryName(descriptionCategoryId: number): Promise<string | null> {
  try {
    const tree = await fetchOzonCategoryTree();
    const walk = (nodes: any[]): string | null => {
      for (const n of nodes) {
        if (Number(n.description_category_id) === descriptionCategoryId) return String(n.category_name ?? '') || null;
        if (n.children?.length) {
          const f = walk(n.children);
          if (f) return f;
        }
      }
      return null;
    };
    return walk(tree);
  } catch {
    return null;
  }
}

/** Аннотация (описание) товара из OZON, HTML (/v1/product/info/description) */
export async function fetchOzonDescription(productId: number): Promise<string | null> {
  try {
    const data = await ozonApi('POST', '/v1/product/info/description', { product_id: productId });
    const d = data?.result?.description;
    return d && String(d).trim() ? String(d) : null;
  } catch {
    return null;
  }
}

/**
 * Импорт каталога из OZON в CRM по документации api-seller.ozon.ru:
 * 1. /v3/product/list → список product_id + offer_id.
 * 2. /v3/product/info/list (product_id на верхнем уровне тела!) → реальные названия, цены, штрихкоды.
 * 3. /v4/product/info/attributes → вес, габариты, штрихкод.
 * 4. Товары CRM сопоставляются по артикулу/offer_id → привязка + ДОЗАПОЛНЕНИЕ пустых полей
 *    (название-заглушка → реальное, штрихкод, вес, габариты, цена).
 * 5. Товара нет в CRM → СОЗДАЁТСЯ автоматически с реальным названием и характеристиками.
 */
export async function importOzonProducts(authorId?: string): Promise<{ created: number; linked: number; skipped: number; errors: string[] }> {
  const settings = await getOzonSettings();
  if (!settings) throw new Error('OZON Seller не подключён: укажите Client-Id и API-ключ в настройках интеграции');
  const summary = { created: 0, linked: 0, skipped: 0, errors: [] as string[] };

  const ids = await fetchOzonProductIds();
  const infos = await fetchOzonProductInfos(ids.map((x) => x.productId));
  const attrs = await fetchOzonAttributes(infos.map((i) => String(i.offer_id ?? '')));

  // Розничный вид цен (цена из OZON ставится только если в CRM нет своей)
  const retailType = await resolveRetailType();

  // Категория для автосозданных товаров (создаётся один раз)
  let ozonCategory = await prisma.productCategory.findFirst({ where: { name: 'OZON Seller', parentId: null } });
  if (!ozonCategory) {
    ozonCategory = await prisma.productCategory.create({ data: { name: 'OZON Seller', isGroup: false } });
  }

  for (const info of infos) {
    try {
      const productId = Number(info.id);
      const offerId = String(info.offer_id ?? '').trim();
      if (!offerId) { summary.skipped++; continue; }

      const name = String(info.name ?? '').trim() || offerId;
      const price = parseFloat(String(info.price ?? '').replace(',', '.')) || null;
      // картинка товара из OZON (primary_image — массив массивов URL: [["..."]])
      const imageUrl: string | null =
        info.primary_image?.[0]?.[0] || info.images?.[0]?.[0] || info.primary_image?.[0] || info.images?.[0] || null;
      const a = attrs.get(offerId);
      const barcode = info.barcodes?.[0] || a?.barcode || null;

      // Бренд, ТН ВЭД, хештеги — атрибуты ищем по названию категории
      const attrNameMap = (a?.description_category_id && a?.type_id)
        ? await fetchOzonCategoryAttributes(Number(a.description_category_id), Number(a.type_id))
        : null;
      const brandVal = attrNameMap ? attrValueByName(a?.attributes || [], attrNameMap, 'бренд') : null;
      const tnvedVal = attrNameMap ? attrValueByName(a?.attributes || [], attrNameMap, 'тн вэд') : null;
      const hashtagsRaw = attrNameMap ? attrValueByName(a?.attributes || [], attrNameMap, 'хештег') : null;
      const hashtags = hashtagsRaw ? hashtagsRaw.split(/[\s,;#]+/).map((s) => s.trim()).filter(Boolean) : [];
      // аннотация (описание) из OZON
      const description = await fetchOzonDescription(productId);
      // категория OZON → категория CRM под группой «OZON Seller»
      let ozonCatId: string | null = null;
      if (a?.description_category_id) {
        const catName = await resolveOzonCategoryName(Number(a.description_category_id));
        if (catName) {
          let cat = await prisma.productCategory.findFirst({ where: { name: catName, parentId: ozonCategory.id } });
          if (!cat) cat = await prisma.productCategory.create({ data: { name: catName, isGroup: false, parentId: ozonCategory.id } });
          ozonCatId = cat.id;
        }
      }
      // OZON отдаёт вес в граммах, габариты в миллиметрах → CRM: кг и см
      const weightKg = a?.weight ? Number(a.weight) / 1000 : null;
      const widthCm = a?.width ? Number(a.width) / 10 : null;
      const heightCm = a?.height ? Number(a.height) / 10 : null;
      const depthCm = a?.depth ? Number(a.depth) / 10 : null;

      // уже привязана?
      const byOzon = await prisma.product.findFirst({ where: { ozonProductId: BigInt(productId) } });
      if (byOzon) {
        await fillFromOzon(byOzon.id, { name, placeholder: byOzon.article, barcode, weightKg, widthCm, heightCm, depthCm, price, retailTypeId: retailType?.id, brand: brandVal, tnved: tnvedVal, hashtags, description, ozonCatId });
        await prisma.product.update({ where: { id: byOzon.id }, data: { syncToOzon: true } });
        if (imageUrl && authorId) await attachOzonImage(byOzon.id, imageUrl, authorId);
        summary.linked++;
        continue;
      }
      // сопоставление по артикулу / внутреннему артикулу
      const byArticle = await prisma.product.findFirst({
        where: { OR: [{ article: offerId }, { sku: offerId }] },
      });
      if (byArticle) {
        await prisma.product.update({ where: { id: byArticle.id }, data: { ozonProductId: BigInt(productId), syncToOzon: true } });
        await fillFromOzon(byArticle.id, { name, placeholder: byArticle.article, barcode, weightKg, widthCm, heightCm, depthCm, price, retailTypeId: retailType?.id, brand: brandVal, tnved: tnvedVal, hashtags, description, ozonCatId });
        if (imageUrl && authorId) await attachOzonImage(byArticle.id, imageUrl, authorId);
        summary.linked++;
        continue;
      }
      // товара нет в CRM — создаём автоматически с реальным названием и характеристиками
      const product = await prisma.product.create({
        data: {
          article: offerId,
          name,
          kind: 'product',
          categoryId: ozonCatId || ozonCategory.id,
          barcode,
          weight: weightKg,
          width: widthCm,
          height: heightCm,
          depth: depthCm,
          brand: brandVal,
          tnved: tnvedVal,
          description: description || undefined,
          tags: hashtags.length ? hashtags : undefined,
          syncToOzon: true,
          ozonProductId: BigInt(productId),
        },
      });
      if (price != null && retailType) {
        await prisma.productPrice.create({ data: { productId: product.id, priceTypeId: retailType.id, price } }).catch(() => {});
      }
      if (imageUrl && authorId) await attachOzonImage(product.id, imageUrl, authorId);
      summary.created++;
    } catch (err: any) {
      summary.errors.push(`${info.offer_id || info.id}: ${err.message}`);
    }
  }
  return summary;
}

/** Скачать картинку товара с CDN OZON (ir.ozone.ru доступен с сервера) и прикрепить к карточке CRM */
export async function attachOzonImage(productId: string, url: string, authorId: string): Promise<boolean> {
  try {
    const has = await prisma.productImage.count({ where: { productId } });
    if (has > 0) return false; // не затираем существующие изображения
    const r = await fetch(url, { signal: AbortSignal.timeout(20000), headers: { 'User-Agent': 'Mozilla/5.0' } });
    if (!r.ok) return false;
    const mime = r.headers.get('content-type')?.split(';')[0] || '';
    if (!mime.startsWith('image/')) return false;
    const buf = Buffer.from(await r.arrayBuffer());
    if (!buf.length || buf.length > 10 * 1024 * 1024) return false;
    const ext = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif' }[mime] || 'jpg';
    const filename = `product-${productId}-${Date.now()}.${ext}`;
    fs.writeFileSync(path.join(UPLOAD_ROOT, filename), buf);
    const attachment = await prisma.fileAttachment.create({
      data: {
        entityType: 'product',
        entityId: productId,
        filename: url.split('/').pop()?.split('?')[0] || filename,
        originalName: url.split('/').pop()?.split('?')[0] || filename,
        mimeType: mime,
        size: buf.length,
        path: `/uploads/${filename}`,
        authorId,
      },
    });
    await prisma.productImage.create({
      data: { productId, attachmentId: attachment.id, url: attachment.path, sortOrder: 0 },
    });
    return true;
  } catch {
    return false;
  }
}

/** Дозаполнение пустых полей карточки CRM данными из OZON (без перезаписи заполненных пользователем) */
async function fillFromOzon(productId: string, d: {
  name: string; placeholder: string | null; barcode: string | null;
  weightKg: number | null; widthCm: number | null; heightCm: number | null; depthCm: number | null;
  price: number | null; retailTypeId: string | null | undefined;
  brand: string | null; tnved: string | null; hashtags: string[]; description: string | null; ozonCatId: string | null;
}) {
  const p = await prisma.product.findUnique({ where: { id: productId } });
  if (!p) return;
  const data: any = {};
  // переименовываем только заглушку (название = артикул)
  if (d.placeholder && p.name === d.placeholder && d.name && d.name !== p.name) data.name = d.name;
  if (!p.barcode && d.barcode) data.barcode = d.barcode;
  if (p.weight == null && d.weightKg != null) data.weight = d.weightKg;
  if (p.width == null && d.widthCm != null) data.width = d.widthCm;
  if (p.height == null && d.heightCm != null) data.height = d.heightCm;
  if (p.depth == null && d.depthCm != null) data.depth = d.depthCm;
  if (!p.brand && d.brand) data.brand = d.brand;
  if (!p.tnved && d.tnved) data.tnved = d.tnved;
  if ((!p.description || !String(p.description).trim()) && d.description) data.description = d.description;
  if (!p.categoryId && d.ozonCatId) data.categoryId = d.ozonCatId;
  if (Object.keys(data).length) await prisma.product.update({ where: { id: productId }, data });
  // хештеги OZON → теги CRM (добавляем недостающие)
  if (d.hashtags.length) {
    const existing = new Set((p.tags as string[] | null) || []);
    const merged = [...existing];
    for (const h of d.hashtags) if (!existing.has(h)) merged.push(h);
    if (merged.length !== existing.size) await prisma.product.update({ where: { id: productId }, data: { tags: merged } }).catch(() => {});
  }
  // розничная цена из OZON — только если в CRM своей нет
  if (d.price != null && d.retailTypeId) {
    const has = await prisma.productPrice.findFirst({ where: { productId, priceTypeId: d.retailTypeId } });
    if (!has) await prisma.productPrice.create({ data: { productId, priceTypeId: d.retailTypeId, price: d.price } }).catch(() => {});
  }
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

  // Пути вложений для первых картинок (relation у ProductImage к FileAttachment не объявлен)
  const attachmentIds = products.map((p) => p.images[0]?.attachmentId).filter(Boolean) as string[];
  const attachments = attachmentIds.length
    ? await prisma.fileAttachment.findMany({ where: { id: { in: attachmentIds } } })
    : [];
  const pathById = new Map(attachments.map((a) => [a.id, a.path]));

  // Розничный вид цен (как для ВК и для импорта)
  const retailType = await resolveRetailType();

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
      // публичный URL первой картинки — OZON забирает файл сам при импорте
      const firstImageUrl = (() => {
        const p0 = product.images?.[0]?.attachmentId ? pathById.get(product.images[0].attachmentId) : undefined;
        return p0 ? [`${PUBLIC_BASE_URL}${p0}`] : undefined;
      })();

      if (product.ozonProductId) {
        // существующий товар в OZON — повторный полный импорт (картинка, бренд, габариты, штрихкод, цена),
        // т.к. отдельных методов обновления атрибутов в API нет; остаток обновляем отдельно по складу
        const typeIdUpd = resolveOzonTypeId(product.categoryId);
        const descCatIdUpd = typeIdUpd ? await resolveOzonDescriptionCategoryId(typeIdUpd) : null;
        if (typeIdUpd && descCatIdUpd) {
          const taskIdUpd = await ozonImportProducts([{
            offer_id: offerId,
            name: product.name,
            typeId: typeIdUpd,
            descriptionCategoryId: descCatIdUpd,
            barcode: product.barcode || undefined,
            price: price != null ? Math.round(price) : undefined,
            images: firstImageUrl,
            weight: product.weight,
            width: product.width,
            height: product.height,
            depth: product.depth,
            brand: product.brand,
            attributes: await buildOzonAttributes(product, typeIdUpd, descCatIdUpd),
          }]);
          if (taskIdUpd) {
            const t = await waitOzonImportTask(taskIdUpd, offerId);
            for (const w of t.errors) summary.errors.push(`⚠ ${w}`);
          }
        } else if (price != null) {
          // категория не определена — старое поведение: только цена
          await ozonUpdatePrices([{ product_id: Number(product.ozonProductId), price: Math.round(price) }]);
        }
        await ozonUpdateStocks([{ product_id: Number(product.ozonProductId), stock: Math.max(0, Math.round(quantity)) }], requireWarehouse());
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
        images: firstImageUrl,
        // характеристики из карточки CRM (вес, габариты, штрихкод, бренд)
        weight: product.weight,
        width: product.width,
        height: product.height,
        depth: product.depth,
        brand: product.brand,
        attributes: await buildOzonAttributes(product, typeId, descriptionCategoryId),
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
