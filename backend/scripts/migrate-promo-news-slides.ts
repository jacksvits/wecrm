/**
 * Миграция: промо-блоки -> shop/promo, новости -> news/<год>/<месяц>, слайдеры -> slide.
 *
 * Что делает (для главной организации и каждого tenant'а):
 *  1. promo_blocks.image_url -> shop/promo/<file>
 *  2. login_slides.image_url -> slide/<file>
 *  3. news.cover_image и картинки внутри news.content -> news/<год>/<месяц>/<file>
 *     (год/месяц из publishedAt || createdAt новости)
 * Один файл, использованный в нескольких местах (например промо + слайд),
 * переносится один раз — обе ссылки обновляются на один новый URL.
 *
 * Идемпотентен: пути нового формата пропускаются.
 * Запуск (внутри контейнера backend): npx tsx scripts/migrate-promo-news-slides.ts
 */
import fs from 'fs';
import path from 'path';
import { platformPrisma, listWorkerTenants, withTenant, uploadsRoot, tenantUploadPrefix } from '../src/lib/tenant.js';
import { prisma } from '../src/lib/prisma.js';
import { moveEntry } from '../src/lib/shop-dir.js';

interface Move {
  targetDir: string;
  newUrl: string;
}

async function migrateOrg(): Promise<{ moved: number; updated: number; missing: number; errors: number }> {
  const stats = { moved: 0, updated: 0, missing: 0, errors: 0 };
  const prefix = tenantUploadPrefix();
  const root = uploadsRoot();
  // Оригинальное имя файла -> куда перенесён (для общих файлов)
  const movedFiles = new Map<string, string>();

  const resolveTarget = async (fileName: string, kind: 'promo' | 'slide' | 'news', newsDate?: Date): Promise<Move> => {
    let relDir: string;
    if (kind === 'promo') relDir = 'shop/promo';
    else if (kind === 'slide') relDir = 'slide';
    else {
      const d = newsDate || new Date();
      const y = String(d.getFullYear());
      const m = String(d.getMonth() + 1).padStart(2, '0');
      relDir = `news/${y}/${m}`;
    }
    const targetDir = path.join(root, ...relDir.split('/'));
    if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });
    return { targetDir, newUrl: `${prefix || '/uploads'}/${relDir}/${fileName}` };
  };

  const locate = (publicPath: string, fileName: string): string | null => {
    const rels: string[] = [];
    if (publicPath.startsWith('/uploads/')) rels.push(publicPath.slice('/uploads/'.length));
    else if (publicPath.startsWith('/tenants/')) rels.push(publicPath.slice('/tenants/'.length));
    else rels.push(publicPath.replace(/^\/+/, ''));
    for (const rel of rels) {
      for (const base of [root, '/app/uploads']) {
        const c = path.join(base, rel);
        if (fs.existsSync(c) && fs.statSync(c).isFile()) return c;
      }
    }
    for (const base of [root, '/app/uploads']) {
      const c = path.join(base, fileName);
      if (fs.existsSync(c) && fs.statSync(c).isFile()) return c;
    }
    return null;
  };

  // Перенос одного файла (с учётом уже перенесённых); возвращает новый URL или null
  const moveFile = async (publicPath: string, kind: 'promo' | 'slide' | 'news', newsDate?: Date): Promise<string | null> => {
    const fileName = publicPath.split('/').pop()!;
    if (movedFiles.has(fileName)) return movedFiles.get(fileName)!;
    const { targetDir, newUrl } = await resolveTarget(fileName, kind, newsDate);
    // Уже на месте?
    const newDisk = path.join(targetDir, fileName);
    if (fs.existsSync(newDisk)) {
      movedFiles.set(fileName, newUrl);
      return newUrl;
    }
    const cur = locate(publicPath, fileName);
    if (!cur) {
      stats.missing++;
      console.log(`[pns] ${prefix || '/'}: ФАЙЛ НЕ НАЙДЕН: ${publicPath}`);
      movedFiles.set(fileName, newUrl); // путь всё равно приводим к новому формату
      return newUrl;
    }
    moveEntry(cur, newDisk);
    stats.moved++;
    movedFiles.set(fileName, newUrl);
    return newUrl;
  };

  // 1. Промо-блоки
  const promos = await prisma.promoBlock.findMany({ select: { id: true, imageUrl: true } });
  for (const pr of promos) {
    const url = pr.imageUrl || '';
    if (!url.startsWith('/') || url.includes('/shop/promo/')) continue;
    try {
      const newUrl = await moveFile(url, 'promo');
      if (newUrl && newUrl !== url) {
        await prisma.promoBlock.update({ where: { id: pr.id }, data: { imageUrl: newUrl } });
        stats.updated++;
      }
    } catch (e: any) { stats.errors++; console.error(`[pns] promo ${pr.id}:`, e.message); }
  }

  // 2. Слайдеры
  const slides = await prisma.loginSlide.findMany({ select: { id: true, imageUrl: true } });
  for (const s of slides) {
    const url = s.imageUrl || '';
    if (!url.startsWith('/') || url.includes('/slide/')) continue;
    try {
      const newUrl = await moveFile(url, 'slide');
      if (newUrl && newUrl !== url) {
        await prisma.loginSlide.update({ where: { id: s.id }, data: { imageUrl: newUrl } });
        stats.updated++;
      }
    } catch (e: any) { stats.errors++; console.error(`[pns] slide ${s.id}:`, e.message); }
  }

  // 3. Новости (обложки + контент)
  const newsItems = await prisma.news.findMany({ select: { id: true, coverImage: true, content: true, publishedAt: true, createdAt: true } });
  for (const n of newsItems) {
    try {
      const newsDate = n.publishedAt || n.createdAt;
      let changed = false;
      let cover = n.coverImage;
      if (cover && cover.startsWith('/') && !cover.includes('/news/')) {
        const newUrl = await moveFile(cover, 'news', newsDate || undefined);
        if (newUrl && newUrl !== cover) { cover = newUrl; changed = true; }
      }
      let content = n.content;
      if (content && content.includes('/uploads/')) {
        const re = /(\/uploads\/[^"'\s>]+|\/tenants\/[^"'\s>]+)/g;
        let m: RegExpExecArray | null;
        let newContent = content;
        while ((m = re.exec(content)) !== null) {
          const p = m[1];
          if (p.includes('/news/')) continue;
          const newUrl = await moveFile(p, 'news', newsDate || undefined);
          if (newUrl && newUrl !== p) newContent = newContent.split(p).join(newUrl);
        }
        if (newContent !== content) { content = newContent; changed = true; }
      }
      if (changed) {
        await prisma.news.update({ where: { id: n.id }, data: { coverImage: cover, content } });
        stats.updated++;
      }
    } catch (e: any) { stats.errors++; console.error(`[pns] news ${n.id}:`, e.message); }
  }

  return stats;
}

async function main() {
  const tenants = await listWorkerTenants();
  console.log(`[pns] Организаций: ${tenants.length}`);
  const total = { moved: 0, updated: 0, missing: 0, errors: 0 };
  for (const tenant of tenants) {
    try {
      const s = await withTenant(tenant, migrateOrg);
      console.log(`[pns] ${tenant.isMain ? 'главная' : tenant.slug}: перенесено ${s.moved}, ссылок обновлено ${s.updated}, не найдено ${s.missing}, ошибок ${s.errors}`);
      total.moved += s.moved; total.updated += s.updated; total.missing += s.missing; total.errors += s.errors;
    } catch (e: any) {
      total.errors++;
      console.error(`[pns] ОШИБКА (${tenant.isMain ? 'главная' : tenant.slug}):`, e.message);
    }
  }
  console.log(`[pns] Готово: перенесено ${total.moved}, ссылок ${total.updated}, не найдено ${total.missing}, ошибок ${total.errors}`);
}

main()
  .catch((e) => { console.error('[pns] Фатальная ошибка:', e); process.exitCode = 1; })
  .finally(async () => {
    await (platformPrisma as any).$disconnect?.().catch(() => {});
    await (prisma as any).$disconnect?.().catch(() => {});
  });
