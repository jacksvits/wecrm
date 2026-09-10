import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import { prisma } from './prisma.js';

const VK_API = 'https://api.vk.com/method';
const VK_API_VERSION = '5.199';
const UPLOAD_ROOT = '/app/uploads';

interface VkSettings {
  groupId: number;
  accessToken: string;
}

/** Настройки первой подключённой группы ВК */
export async function getVkSettings(): Promise<VkSettings | null> {
  const settings = await prisma.vkGroupSettings.findFirst({
    orderBy: { createdAt: 'asc' },
  });
  if (!settings?.accessToken || !settings.groupId) return null;
  return { groupId: settings.groupId, accessToken: settings.accessToken };
}

/** Базовый вызов VK API */
async function vkApi(method: string, params: Record<string, string | number> = {}, token?: string): Promise<any> {
  const settings = token ? null : await getVkSettings();
  const accessToken = token || settings?.accessToken;
  if (!accessToken) throw new Error('ВКонтакте не подключён (нет токена)');
  const url = new URL(`${VK_API}/${method}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, String(v));
  url.searchParams.set('access_token', accessToken);
  url.searchParams.set('v', VK_API_VERSION);
  const res = await fetch(url.toString());
  const data: any = await res.json();
  if (data.error) {
    const e = data.error;
    throw new Error(`VK ${e.error_code}: ${e.error_msg}`);
  }
  return data.response;
}

/** Розничная цена позиции (для ВК) */
async function getRetailPrice(productId: string): Promise<number | null> {
  let retail = await prisma.priceType.findFirst({ where: { name: 'retail', isActive: true } });
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

/** Загрузить фото в ВК для маркета, вернуть main_photo_id (owner_id_id) */
async function uploadMarketPhoto(imageUrl: string, groupId: number): Promise<string | null> {
  try {
    // 1. URL для загрузки
    const server = await vkApi('photos.getMarketUploadServer', { group_id: groupId, main_photo: 1 });
    if (!server.upload_url) return null;
    // 2. Скачиваем локальный файл и шлём multipart
    const fileRes = await fetch(`${process.env.BACKEND_ORIGIN || 'https://welans.cc'}${imageUrl}`);
    const arrayBuffer = await fileRes.arrayBuffer();
    const ext = path.extname(imageUrl) || '.jpg';
    const form = new FormData();
    form.append('file', new Blob([arrayBuffer], { type: 'image/jpeg' }), `photo${ext}`);
    const upRes = await fetch(server.upload_url, { method: 'POST', body: form });
    const upData: any = await upRes.json();
    if (upData.error) return null;
    // 3. Сохраняем
    const saved = await vkApi('photos.saveMarketPhoto', {
      group_id: groupId,
      photo: upData.photo,
      server: upData.server,
      hash: upData.hash,
      crop_data: upData.crop_data || '',
      crop_hash: upData.crop_hash || '',
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
  let retailType = await prisma.priceType.findFirst({ where: { name: 'retail', isActive: true } });
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
      const params: Record<string, string | number> = {
        owner_id: -settings.groupId,
        name: product.name.slice(0, 100),
        description: product.description?.replace(/<[^>]+>/g, ' ').slice(0, 16384) || ' ',
        price: price != null ? String(Math.round(price)) : '0',
        category_id: 1, // «Всё для дома» — обязательный параметр; уточняется вручную в ВК
      };
      const photoId = product.images[0]
        ? await uploadMarketPhoto(product.images[0].url, settings.groupId)
        : null;
      if (photoId) params.main_photo_id = photoId;

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
  }
  return summary;
}
