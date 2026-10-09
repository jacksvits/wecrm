import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import { prisma } from './prisma.js';
import { generateUniqueArticle } from './article.js';

const VK_API = 'https://api.vk.com/method';
const VK_API_VERSION = '5.199';
const UPLOAD_ROOT = '/app/uploads';

interface VkSettings {
  groupId: number;
  accessToken: string;
  marketToken?: string | null;
  marketRefreshToken?: string | null;
  marketDeviceId?: string | null;
  marketTokenExpiresAt?: Date | null;
}

/** Настройки первой подключённой группы ВК */
export async function getVkSettings(): Promise<VkSettings | null> {
  const settings = await prisma.vkGroupSettings.findFirst({
    orderBy: { createdAt: 'asc' },
  });
  if (!settings?.accessToken || !settings.groupId) return null;
  return {
    groupId: settings.groupId,
    accessToken: settings.accessToken,
    marketToken: settings.marketToken,
    marketRefreshToken: settings.marketRefreshToken,
    marketDeviceId: settings.marketDeviceId,
    marketTokenExpiresAt: settings.marketTokenExpiresAt,
  };
}

/** За сколько до истечения обновляем токен маркета (access_token VK ID живёт ~1 час) */
const MARKET_TOKEN_REFRESH_AHEAD_MS = 5 * 60 * 1000;

/**
 * Пользовательский токен маркета с автообновлением по refresh_token (VK ID).
 * force=true — принудительный рефреш (после VK Error 5 «User authorization failed»).
 */
async function getFreshMarketToken(force = false): Promise<string | null> {
  const settings = await prisma.vkGroupSettings.findFirst({ orderBy: { createdAt: 'asc' } });
  if (!settings?.marketToken) return null;
  const expiresAt = settings.marketTokenExpiresAt?.getTime() || 0;
  const fresh = expiresAt - MARKET_TOKEN_REFRESH_AHEAD_MS > Date.now();
  if (fresh && !force) return settings.marketToken;
  if (!settings.marketRefreshToken || !settings.marketDeviceId || !settings.marketAppId) {
    if (fresh) return settings.marketToken;
    throw new Error('Токен маркета истёк, а refresh_token отсутствует — получите токен заново (Настройки → ВКонтакте → «Получить токен маркета»)');
  }
  const res = await fetch('https://id.vk.ru/oauth2/auth', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: settings.marketRefreshToken,
      client_id: String(settings.marketAppId),
      device_id: settings.marketDeviceId,
      state: randomUUID(),
    }),
  });
  const data: any = await res.json();
  if (data.error || !data.access_token) {
    throw new Error(`VK ID refresh токена маркета: ${data.error || 'unknown'}: ${data.error_description || 'нет описания'}`);
  }
  const expiresIn = Number(data.expires_in) || 3600;
  await prisma.vkGroupSettings.update({
    where: { id: settings.id },
    data: {
      marketToken: data.access_token,
      marketRefreshToken: data.refresh_token || settings.marketRefreshToken,
      marketTokenExpiresAt: new Date(Date.now() + expiresIn * 1000),
    },
  });
  return data.access_token;
}

/** Базовый вызов VK API */
async function vkApi(method: string, params: Record<string, string | number> = {}, token?: string): Promise<any> {
  const settings = token ? null : await getVkSettings();
  // методы маркета недоступны с токеном сообщества (VK Error 27) — нужен пользовательский токен с scope market
  if (method.startsWith('market.') && !token && !settings?.marketToken) {
    throw new Error('Для работы с маркетом нужен пользовательский токен с правом market (Настройки → ВКонтакте → «Получить токен маркета»)');
  }
  let accessToken = token || (method.startsWith('market.') ? await getFreshMarketToken() : settings?.marketToken || settings?.accessToken);
  if (!accessToken) throw new Error('ВКонтакте не подключён (нет токена)');
  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
  const doCall = async (t: string): Promise<any> => {
    const url = new URL(`${VK_API}/${method}`);
    for (const [k, v] of Object.entries(params)) url.searchParams.set(k, String(v));
    url.searchParams.set('access_token', t);
    url.searchParams.set('v', VK_API_VERSION);
    let data: any;
    for (let attempt = 0; ; attempt++) {
      const res = await fetch(url.toString());
      data = await res.json();
      // VK Error 6 «Too many requests per second» — ретраим с бэкоффом (макс. 4 попытки)
      if (data.error?.error_code !== 6 || attempt >= 3) break;
      await sleep(1000 * 2 ** attempt);
    }
    return data;
  };
  let data: any = await doCall(accessToken);
  // VK Error 5 «User authorization failed» — токен отозван/просрочен: принудительный рефреш и один повтор
  if (data.error?.error_code === 5 && method.startsWith('market.') && !token) {
    const refreshed = await getFreshMarketToken(true);
    if (refreshed && refreshed !== accessToken) {
      accessToken = refreshed;
      data = await doCall(accessToken);
    }
  }
  if (data.error) {
    const e = data.error;
    throw new Error(`VK ${e.error_code}: ${e.error_msg}`);
  }
  return data.response;
}

/** Розничная цена позиции (для ВК) */
async function getRetailPrice(productId: string): Promise<number | null> {
  const flaggedVk = await prisma.$queryRawUnsafe(`SELECT id FROM price_types WHERE for_vk = true AND is_active = true LIMIT 1`) as any[];
  let retail = flaggedVk[0] ? { id: flaggedVk[0].id } : null;
  if (!retail) retail = await prisma.priceType.findFirst({ where: { name: 'retail', isActive: true } });
  if (!retail) {
    retail = await prisma.priceType.findFirst({ where: { isActive: true }, orderBy: { sortOrder: 'desc' } });
  }
  if (!retail) return null;
  const price = await prisma.productPrice.findUnique({
    where: { productId_priceTypeId: { productId, priceTypeId: retail.id } },
  });
  return price ? price.price : null;
}

/** Скачать файл по URL в локальное хранилище, вернуть dbPath */
async function downloadToUploads(url: string): Promise<string | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const buffer = Buffer.from(await res.arrayBuffer());
    const ext = path.extname(new URL(url).pathname).split('?')[0] || '.jpg';
    const filename = `${randomUUID()}${ext}`;
    fs.writeFileSync(path.join(UPLOAD_ROOT, filename), buffer);
    return `/uploads/${filename}`;
  } catch {
    return null;
  }
}

/**
 * Загрузить фото в ВК для маркета, вернуть photo_id (owner_id_id).
 * VK удалил методы загрузки фото маркета (photos.getMarketUploadServer/saveMarketPhoto
 * → Error 3 «Unknown method passed»), поэтому грузим через upload-методы стены
 * (нужен scope photos в токене маркета).
 */
async function uploadMarketPhoto(imageUrl: string, groupId: number): Promise<string | null> {
  try {
    // 1. URL для загрузки
    const server = await vkApi('photos.getWallUploadServer', { group_id: groupId });
    if (!server.upload_url) return null;
    // 2. Скачиваем локальный файл и шлём multipart
    const fileRes = await fetch(`${process.env.BACKEND_ORIGIN || 'https://welans.cc'}${imageUrl}`);
    const arrayBuffer = await fileRes.arrayBuffer();
    const ext = path.extname(imageUrl) || '.jpg';
    const form = new FormData();
    form.append('file', new Blob([arrayBuffer], { type: 'image/jpeg' }), `photo${ext}`);
    const upRes = await fetch(server.upload_url, { method: 'POST', body: form });
    const upData: any = await upRes.json();
    if (upData.error || !upData.photo) return null;
    // 3. Сохраняем
    const saved = await vkApi('photos.saveWallPhoto', {
      group_id: groupId,
      photo: upData.photo,
      server: upData.server,
      hash: upData.hash,
    });
    const photo = Array.isArray(saved) ? saved[0] : saved;
    if (!photo?.id || !photo?.owner_id) return null;
    return `${photo.owner_id}_${photo.id}`;
  } catch (err) {
    console.error('[VK Market] photo upload failed:', err);
    return null;
  }
}

export interface ImportSummary {
  created: number;
  linked: number;
  skipped: number;
  errors: string[];
}

/**
 * Импорт всех товаров маркета группы ВК в проект (первый импорт).
 * Существующие позиции (по vkItemId или точному совпадению названия) привязываются, не дублируются.
 */
export async function importMarketItems(): Promise<ImportSummary> {
  const settings = await getVkSettings();
  if (!settings) throw new Error('ВКонтакте не подключён: нет группы с токеном');
  const summary: ImportSummary = { created: 0, linked: 0, skipped: 0, errors: [] };

  // market.get возвращает count + items; выкачиваем все страницы
  const allItems: any[] = [];
  let offset = 0;
  for (let page = 0; page < 20; page++) {
    const data = await vkApi('market.get', {
      owner_id: -settings.groupId,
      offset,
      count: 200,
      extended: 1,
    });
    const items = data.items || [];
    allItems.push(...items);
    if (allItems.length >= (data.count || 0) || items.length === 0) break;
    offset += items.length;
  }

  // Розничный вид цен (создаём, если ни одного нет)
  const flaggedVkRows = await prisma.$queryRawUnsafe(`SELECT id FROM price_types WHERE for_vk = true AND is_active = true LIMIT 1`) as any[];
  let retailType = flaggedVkRows[0] ? { id: flaggedVkRows[0].id } : null;
  if (!retailType) retailType = await prisma.priceType.findFirst({ where: { name: 'retail', isActive: true } });
  if (!retailType) {
    retailType = await prisma.priceType.findFirst({ where: { isActive: true }, orderBy: { sortOrder: 'desc' } });
  }

  for (const item of allItems) {
    try {
      const vkId: number = item.id;
      const title: string = (item.title || '').trim();
      if (!title) { summary.skipped++; continue; }

      // уже привязана?
      const byVk = await prisma.product.findFirst({ where: { vkItemId: vkId } });
      if (byVk) {
        await prisma.product.update({ where: { id: byVk.id }, data: { syncToVk: true } });
        summary.linked++;
        continue;
      }
      // совпадение по названию?
      const byName = await prisma.product.findFirst({ where: { name: title } });
      if (byName) {
        await prisma.product.update({ where: { id: byName.id }, data: { vkItemId: vkId, syncToVk: true } });
        summary.linked++;
        continue;
      }

      const description: string = item.description || '';
      const priceAmount: number = item.price?.amount != null ? item.price.amount / 100 : 0;

      const product = await prisma.product.create({
        data: {
          article: await generateUniqueArticle(),
          name: title,
          kind: 'product',
          sku: `VK-${vkId}`,
          description,
          category: item.category?.name || null,
          syncToVk: true,
          vkItemId: vkId,
        },
      });

      if (retailType && priceAmount > 0) {
        await prisma.productPrice.create({
          data: { productId: product.id, priceTypeId: retailType.id, price: priceAmount },
        });
      }

      // фото: первое → изображение позиции
      const photoUrl: string | undefined = item.thumb_photo || item.photos?.[0]?.photo_604 || item.photos?.[0]?.photo_130;
      if (photoUrl) {
        const dbPath = await downloadToUploads(photoUrl);
        if (dbPath) {
          const filename = dbPath.replace('/uploads/', '');
          const firstUser = await prisma.user.findFirst({ orderBy: { createdAt: 'asc' } });
          const attachment = await prisma.fileAttachment.create({
            data: {
              entityType: 'product',
              entityId: product.id,
              filename,
              originalName: filename,
              mimeType: 'image/jpeg',
              size: 0,
              path: dbPath,
              authorId: firstUser?.id || '',
            },
          });
          await prisma.productImage.create({
            data: { productId: product.id, attachmentId: attachment.id, url: dbPath, sortOrder: 0 },
          });
        }
      }
      summary.created++;
    } catch (err: any) {
      summary.errors.push(`${item.title || item.id}: ${err.message}`);
    }
  }
  return summary;
}

export interface SyncSummary {
  created: number;
  updated: number;
  failed: number;
  errors: string[];
}

/** Выгрузить все позиции с отметкой «ВК» в маркет группы */
export async function syncProductsToVk(): Promise<SyncSummary> {
  const settings = await getVkSettings();
  if (!settings) throw new Error('ВКонтакте не подключён: нет группы с токеном');
  const summary: SyncSummary = { created: 0, updated: 0, failed: 0, errors: [] };

  const products = await prisma.product.findMany({
    where: { syncToVk: true, isActive: true },
    include: { images: { orderBy: { sortOrder: 'asc' }, take: 1 } },
    orderBy: { name: 'asc' },
  });

  for (const product of products) {
    try {
      const price = await getRetailPrice(product.id);
      // VK требует минимум 10 букв в описании
      let description = (product.description || '').replace(/<[^>]+>/g, ' ').trim();
      if (description.replace(/[^a-zA-Zа-яА-ЯёЁ]/g, '').length < 10) {
        description = `Товар «${product.name}». Артикул: ${product.article}`;
      }
      const params: Record<string, string | number> = {
        owner_id: -settings.groupId,
        name: product.name.slice(0, 100),
        description: description.slice(0, 16384),
        price: price != null ? String(Math.round(price)) : '0',
        category_id: 1, // «Всё для дома» — обязательный параметр; уточняется вручную в ВК
      };
      const photoId = product.images[0]
        ? await uploadMarketPhoto(product.images[0].url, settings.groupId)
        : null;
      if (photoId) {
        params.main_photo_id = photoId;
      } else if (!product.vkItemId) {
        // у нового товара в маркете ВК обязательно главное фото
        throw new Error(product.images[0]
          ? 'фото не загружено в ВК (загрузка фото требует права photos у приложения VK ID — см. Настройки → ВКонтакте)'
          : 'нет изображения у товара — у маркета ВК обязательно главное фото');
      }

      if (product.vkItemId) {
        await vkApi('market.edit', { item_id: product.vkItemId, ...params });
        summary.updated++;
      } else {
        const created = await vkApi('market.add', params);
        const newId: number | undefined = created?.market_item_id || created?.item_id;
        if (newId) {
          await prisma.product.update({ where: { id: product.id }, data: { vkItemId: newId } });
        }
        summary.created++;
      }
    } catch (err: any) {
      summary.failed++;
      summary.errors.push(`${product.name}: ${err.message}`);
    }
    // пауза между товарами: у VK лимит ~3 запроса/сек на методы маркета
    await new Promise((r) => setTimeout(r, 400));
  }
  return summary;
}
