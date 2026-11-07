/**
 * Папки изображений товаров каталога (магазина).
 *
 * Структура (внутри uploadsRoot() текущего tenant'а):
 *   карточка создана в системе → shop/<внутренний артикул>
 *   карточка создана на Ozon   → shop/ozon/<внутренний артикул>
 *   карточка создана на WB     → shop/wb/<внутренний артикул>
 *   карточка создана во VK     → shop/vk/<внутренний артикул>
 *
 * Внутренний артикул — поле Product.article (генерируется, если пустое).
 * Главная организация: /app/uploads/shop/...; tenant'ы: /app/tenants/<slug>/shop/...
 */
import fs from 'fs';
import path from 'path';
import { uploadsRoot, tenantUploadPrefix } from './tenant.js';

export type ProductSource = 'system' | 'ozon' | 'wb' | 'vk';

/** Имя папки по артикулу: символы, недопустимые в путях (/ \ : * ? " < > |), заменяются на '-' */
export const sanitizeArticle = (article: string): string =>
  String(article).replace(/[/\\:*?"<>|]/g, '-').trim();

/** Подпапка маркетплейса внутри shop (пустая для карточек, созданных в системе) */
export const shopSourceDir = (source: string): string =>
  source === 'system' ? '' : source;

/** Абсолютный путь к папке изображений товара на диске */
export const shopDirFor = (article: string, source: string): string =>
  path.join(uploadsRoot(), 'shop', shopSourceDir(source), sanitizeArticle(article));

/** URL-префикс изображений товара (как хранится в ProductImage.url / FileAttachment.path) */
export const shopUrlPrefix = (article: string, source: string): string =>
  `${tenantUploadPrefix() || '/uploads'}/shop/${shopSourceDir(source) ? shopSourceDir(source) + '/' : ''}${sanitizeArticle(article)}`;

/** Перенос файла/папки: rename, при EXDEV (разные mount point) — copy + verify + unlink */
export function moveEntry(src: string, dst: string): void {
  try {
    fs.renameSync(src, dst);
    return;
  } catch (e: any) {
    if (e.code !== 'EXDEV') throw e;
  }
  const st = fs.statSync(src);
  if (st.isDirectory()) {
    fs.mkdirSync(dst, { recursive: true });
    for (const entry of fs.readdirSync(src)) {
      moveEntry(path.join(src, entry), path.join(dst, entry));
    }
    fs.rmdirSync(src);
  } else {
    fs.copyFileSync(src, dst);
    if (fs.statSync(dst).size !== st.size) {
      throw new Error(`размеры не совпали после копирования: ${src}`);
    }
    fs.unlinkSync(src);
  }
}
