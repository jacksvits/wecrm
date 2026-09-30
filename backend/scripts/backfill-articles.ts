/**
 * Бэкафил внутренних артикулов:
 * 1. Всем товарам без article генерирует случайный 8-значный артикул.
 * 2. Переименовывает файлы изображений по схеме: первое (sortOrder asc) — <article>.<ext>,
 *    остальные — <article>-<n>.<ext>; обновляет FileAttachment (filename, path) и ProductImage.url.
 *
 * Запуск (внутри контейнера backend):
 *   npx tsx scripts/backfill-articles.ts
 */
import fs from 'fs';
import path from 'path';
import { prisma } from '../src/lib/prisma.js';
import { generateUniqueArticle } from '../src/lib/article.js';

const UPLOAD_ROOT = '/app/uploads';

async function main() {
  const products = await prisma.product.findMany({
    where: { article: null },
    select: { id: true, name: true },
  });
  console.log(`[backfill] Товаров без артикула: ${products.length}`);

  for (const p of products) {
    const article = await generateUniqueArticle();
    await prisma.product.update({ where: { id: p.id }, data: { article } });
    console.log(`[backfill] ${article} — ${p.name}`);
  }

  // Переименование изображений (все товары, включая только что получивших артикул)
  const withImages = await prisma.product.findMany({
    where: { article: { not: null } },
    include: {
      images: { orderBy: { sortOrder: 'asc' }, include: { attachment: true } },
    },
  });

  let renamed = 0, skipped = 0;
  for (const p of withImages) {
    for (let i = 0; i < p.images.length; i++) {
      const img = p.images[i];
      const att = img.attachment;
      const ext = path.extname(att.filename) || '';
      const baseName = i === 0 ? p.article! : `${p.article}-${i}`;
      const newFilename = `${baseName}${ext}`;

      if (att.filename === newFilename) { skipped++; continue; }

      const oldPath = path.join(UPLOAD_ROOT, att.filename);
      const newPath = path.join(UPLOAD_ROOT, newFilename);
      if (fs.existsSync(newPath) && oldPath !== newPath) fs.unlinkSync(newPath);
      if (fs.existsSync(oldPath)) fs.renameSync(oldPath, newPath);

      const newDbPath = `/uploads/${newFilename}`;
      await prisma.fileAttachment.update({
        where: { id: att.id },
        data: { filename: newFilename, path: newDbPath },
      });
      await prisma.productImage.update({
        where: { id: img.id },
        data: { url: newDbPath },
      });
      console.log(`[backfill] ${att.filename} -> ${newFilename}`);
      renamed++;
    }
  }
  console.log(`[backfill] Готово. Артикулов выдано: ${products.length}, файлов переименовано: ${renamed}, уже по схеме: ${skipped}`);
}

main()
  .catch((e) => { console.error('[backfill] ОШИБКА:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
