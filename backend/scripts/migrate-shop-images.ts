/**
 * Миграция изображений товаров каталога в структуру shop/<source>/<артикул>.
 *
 * Что делает (для главной организации и каждого tenant'а):
 *  1. Догенерирует внутренний артикул товарам без него.
 *  2. Определяет source («где создана карточка») эвристикой и обновляет products.source:
 *       sku LIKE 'VK-%'                       → vk
 *       article ~ ^[0-9]{8}$                  → system
 *       ozon_product_id IS NOT NULL           → ozon
 *       wb_product_id IS NOT NULL             → wb
 *       vk_item_id IS NOT NULL                → vk
 *       иначе                                 → system
 *  3. Переносит файлы изображений в uploadsRoot()/shop/<source>/<article>/.
 *     Файлы ищутся в старых местах: корень uploads tenant'а, /app/uploads
 *     (старый баг wb/ozon писал туда даже для tenant'ов), uploadsRoot()/wb/.
 *  4. Обновляет product_images.url и file_attachments.path под новый формат.
 *
 * Идемпотентен: уже перенесённые файлы (путь из БД начинается с shop-префикса) пропускаются.
 *
 * Запуск (внутри контейнера backend):
 *   npx tsx scripts/migrate-shop-images.ts
 */
import fs from 'fs';
import path from 'path';
import { platformPrisma, listWorkerTenants, withTenant, uploadsRoot, tenantUploadPrefix } from '../src/lib/tenant.js';
import { prisma } from '../src/lib/prisma.js';
import { shopDirFor, shopUrlPrefix, moveEntry, sanitizeArticle, shopSourceDir } from '../src/lib/shop-dir.js';
import { generateUniqueArticle } from '../src/lib/article.js';

/** URL-путь нового формата уже указывает в shop? */
const isNewFormat = (p: string, prefix: string) =>
  p.startsWith(`${prefix || '/uploads'}/shop/`);

/** Определение «где создана карточка» для существующих товаров */
function guessSource(p: { sku: string | null; article: string | null; ozonProductId: bigint | null; wbProductId: bigint | null; vkItemId: number | null }): string {
  if (p.sku && p.sku.startsWith('VK-')) return 'vk';
  if (p.article && /^[0-9]{8}$/.test(p.article)) return 'system';
  if (p.ozonProductId != null) return 'ozon';
  if (p.wbProductId != null) return 'wb';
  if (p.vkItemId != null) return 'vk';
  return 'system';
}

/** Кандидаты расположения файла по пути из БД и имени */
function locateFile(publicPath: string | null, filename: string, prefix: string): string | null {
  const root = uploadsRoot();
  const candidates: string[] = [];
  // 1) Путь из БД разрешаем относительно всех известных корней
  if (publicPath) {
    const rels: string[] = [];
    if (publicPath.startsWith(`${prefix || '/uploads'}/`)) rels.push(publicPath.slice((prefix || '/uploads').length + 1));
    else if (publicPath.startsWith('/tenants/')) rels.push(publicPath.slice('/tenants/'.length)); // <slug>/...
    else if (publicPath.startsWith('/uploads/')) rels.push(publicPath.slice('/uploads/'.length));
    else rels.push(publicPath.replace(/^\/+/, ''));
    for (const rel of rels) {
      candidates.push(path.join(root, rel));            // корень текущего tenant'а
      candidates.push(path.join('/app/uploads', rel));  // главный uploads (старый баг)
    }
  }
  // 2) По имени файла — в корнях и wb-подпапке
  candidates.push(path.join(root, filename));
  candidates.push(path.join(root, 'wb', filename));
  candidates.push(path.join('/app/uploads', filename));
  candidates.push(path.join('/app/uploads', 'wb', filename));
  for (const c of candidates) {
    if (fs.existsSync(c) && fs.statSync(c).isFile()) return c;
  }
  return null;
}

async function migrateOrg(): Promise<{ moved: number; missing: number; updated: number; errors: number }> {
  const stats = { moved: 0, missing: 0, updated: 0, errors: 0 };
  const prefix = tenantUploadPrefix(); // '' или /tenants/<slug>

  const products = await prisma.product.findMany({
    select: {
      id: true, article: true, source: true, sku: true,
      ozonProductId: true, wbProductId: true, vkItemId: true,
    },
  });

  for (const p of products) {
    try {
      // 1. Артикул
      let article = p.article;
      if (!article) {
        article = await generateUniqueArticle();
        await prisma.product.update({ where: { id: p.id }, data: { article } });
        console.log(`[shop] ${prefix || '/'}: сгенерирован артикул ${article} (товар ${p.id})`);
      }

      // 2. Source
      const src = guessSource(p);
      if (src !== p.source) {
        await prisma.product.update({ where: { id: p.id }, data: { source: src } });
      }

      // 3-4. Изображения товара
      const images = await prisma.productImage.findMany({
        where: { productId: p.id },
        include: { attachment: true },
        orderBy: { sortOrder: 'asc' },
      });
      if (!images.length) continue;

      const shopDir = shopDirFor(article, src);
      if (!fs.existsSync(shopDir)) fs.mkdirSync(shopDir, { recursive: true });
      const urlBase = shopUrlPrefix(article, src);

      for (const img of images) {
        const att = img.attachment;
        const newName = att.filename || path.basename(img.url);
        const newDisk = path.join(shopDir, newName);
        const newUrl = `${urlBase}/${newName}`;

        // Уже в новом формате?
        if (isNewFormat(img.url, prefix) && fs.existsSync(newDisk)) {
          continue;
        }

        const curDisk = locateFile(att?.path ?? img.url, newName, prefix);
        if (!curDisk) {
          stats.missing++;
          console.log(`[shop] ${prefix || '/'}: ФАЙЛ НЕ НАЙДЕН (товар ${article}): ${att?.path ?? img.url}`);
          // Путь в БД всё равно приводим к новому формату — файл отсутствует и в старом месте
          await prisma.productImage.update({ where: { id: img.id }, data: { url: newUrl } });
          if (att) await prisma.fileAttachment.update({ where: { id: att.id }, data: { path: newUrl } });
          stats.updated++;
          continue;
        }

        if (curDisk !== newDisk) {
          if (fs.existsSync(newDisk)) {
            // Файл уже на месте — источник удаляем, если это другой файл
            if (fs.statSync(newDisk).size === fs.statSync(curDisk).size) {
              fs.unlinkSync(curDisk);
            } else {
              console.log(`[shop] ${prefix || '/'}: конфликт имён, пропуск ${newDisk}`);
              stats.errors++;
              continue;
            }
          } else {
            moveEntry(curDisk, newDisk);
            stats.moved++;
          }
        }
        await prisma.productImage.update({ where: { id: img.id }, data: { url: newUrl } });
        if (att) await prisma.fileAttachment.update({ where: { id: att.id }, data: { path: newUrl } });
        stats.updated++;
      }
    } catch (e: any) {
      stats.errors++;
      console.error(`[shop] ${prefix || '/'}: ОШИБКА товар ${p.article ?? p.id}:`, e.message);
    }
  }
  return stats;
}

async function main() {
  const tenants = await listWorkerTenants();
  console.log(`[shop] Организаций: ${tenants.length}`);
  const total = { moved: 0, missing: 0, updated: 0, errors: 0 };
  for (const tenant of tenants) {
    try {
      const s = await withTenant(tenant, migrateOrg);
      console.log(`[shop] ${tenant.isMain ? 'главная' : tenant.slug}: перенесено ${s.moved}, путей обновлено ${s.updated}, не найдено ${s.missing}, ошибок ${s.errors}`);
      total.moved += s.moved; total.updated += s.updated; total.missing += s.missing; total.errors += s.errors;
    } catch (e: any) {
      total.errors++;
      console.error(`[shop] ОШИБКА (${tenant.isMain ? 'главная' : tenant.slug}):`, e.message);
    }
  }
  console.log(`[shop] Готово: перенесено ${total.moved}, путей ${total.updated}, не найдено ${total.missing}, ошибок ${total.errors}`);
}

main()
  .catch((e) => {
    console.error('[shop] Фатальная ошибка:', e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await (platformPrisma as any).$disconnect?.().catch(() => {});
    await (prisma as any).$disconnect?.().catch(() => {});
  });
