/**
 * Миграция: аватарки пользователей -> avatars/users, прочие вложения -> other.
 *
 * Что делает (для главной организации и каждого tenant'а):
 *  1. users.avatar старого формата (файл в корне uploads или в uploads/avatars/)
 *     -> avatars/users/<файл>, обновляет users.avatar.
 *  2. file_attachments с путём уровня корня (/<prefix>/<файл>, не tasks/shop/
 *     news/slide/avatars/... comments/) -> other/<файл>, обновляет path.
 *
 * Идемпотентен: пути нового формата пропускаются.
 * Запуск (внутри контейнера backend): npx tsx scripts/migrate-users-other.ts
 */
import fs from 'fs';
import path from 'path';
import { platformPrisma, listWorkerTenants, withTenant, uploadsRoot, tenantUploadPrefix } from '../src/lib/tenant.js';
import { prisma } from '../src/lib/prisma.js';
import { moveEntry } from '../src/lib/shop-dir.js';

const isStructured = (rel: string) =>
  /^(tasks|shop|news|slide|other|comments|global_chat)\//.test(rel) || rel.startsWith('avatars/');

async function migrateOrg(): Promise<{ moved: number; updated: number; missing: number; errors: number }> {
  const stats = { moved: 0, updated: 0, missing: 0, errors: 0 };
  const prefix = tenantUploadPrefix(); // '' или /tenants/<slug>
  const root = uploadsRoot();

  const locate = (publicPath: string, fileName: string): string | null => {
    const rels: string[] = [];
    if (publicPath.startsWith(`${prefix || '/uploads'}/`)) rels.push(publicPath.slice((prefix || '/uploads').length + 1));
    else if (publicPath.startsWith('/uploads/')) rels.push(publicPath.slice('/uploads/'.length));
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

  const doMove = (cur: string, targetDir: string, fileName: string): { disk: string; moved: boolean } => {
    if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });
    const newDisk = path.join(targetDir, fileName);
    if (cur === newDisk) return { disk: newDisk, moved: false };
    if (fs.existsSync(newDisk)) {
      if (fs.statSync(newDisk).size === fs.statSync(cur).size) { fs.unlinkSync(cur); return { disk: newDisk, moved: false }; }
      throw new Error(`конфликт имён: ${newDisk}`);
    }
    moveEntry(cur, newDisk);
    return { disk: newDisk, moved: true };
  };

  // 1. Аватарки пользователей -> avatars/users
  const users = await prisma.user.findMany({
    where: { avatar: { startsWith: '/' } },
    select: { id: true, avatar: true },
  });
  const avatarDir = path.join(root, 'avatars', 'users');
  for (const u of users) {
    const url = u.avatar!;
    if (url.startsWith(`${prefix || '/uploads'}/avatars/users/`)) continue;
    if (!url.startsWith('/uploads/') && !url.startsWith('/tenants/')) continue;
    try {
      const fileName = url.split('/').pop()!;
      const newUrl = `${prefix || '/uploads'}/avatars/users/${fileName}`;
      if (url === newUrl) continue;
      const cur = locate(url, fileName);
      if (!cur) {
        stats.missing++;
        console.log(`[uo] ${prefix || '/'}: аватар НЕ НАЙДЕН (user ${u.id}): ${url}`);
        await prisma.user.update({ where: { id: u.id }, data: { avatar: newUrl } });
        stats.updated++;
        continue;
      }
      const r = doMove(cur, avatarDir, fileName);
      if (r.moved) stats.moved++;
      await prisma.user.update({ where: { id: u.id }, data: { avatar: newUrl } });
      stats.updated++;
    } catch (e: any) {
      stats.errors++;
      console.error(`[uo] ${prefix || '/'}: ОШИБКА user ${u.id}:`, e.message);
    }
  }

  // 2. Корневые вложения -> other
  const attachments = await prisma.fileAttachment.findMany({
    where: { path: { startsWith: '/' } },
    select: { id: true, path: true },
  });
  const otherDir = path.join(root, 'other');
  for (const a of attachments) {
    const url = a.path;
    if (!url.startsWith('/uploads/') && !url.startsWith('/tenants/')) continue;
    // Относительный путь внутри хранилища текущего tenant'а
    let rel: string;
    if (url.startsWith(`${prefix || '/uploads'}/`)) rel = url.slice((prefix || '/uploads').length + 1);
    else if (url.startsWith('/uploads/')) rel = url.slice('/uploads/'.length);
    else rel = url.slice('/tenants/'.length); // <slug>/...
    if (isStructured(rel)) continue; // tasks/shop/news/slide/avatars/comments/global_chat/other
    const fileName = rel.split('/').pop()!;
    if (!fileName) continue;
    try {
      const newUrl = `${prefix || '/uploads'}/other/${fileName}`;
      if (url === newUrl) continue;
      const cur = locate(url, fileName);
      if (!cur) {
        stats.missing++;
        console.log(`[uo] ${prefix || '/'}: вложение НЕ НАЙДЕНО: ${url}`);
        await prisma.fileAttachment.update({ where: { id: a.id }, data: { path: newUrl } });
        stats.updated++;
        continue;
      }
      const r = doMove(cur, otherDir, fileName);
      if (r.moved) stats.moved++;
      await prisma.fileAttachment.update({ where: { id: a.id }, data: { path: newUrl } });
      stats.updated++;
    } catch (e: any) {
      stats.errors++;
      console.error(`[uo] ${prefix || '/'}: ОШИБКА attachment ${a.id}:`, e.message);
    }
  }

  return stats;
}

async function main() {
  const tenants = await listWorkerTenants();
  console.log(`[uo] Организаций: ${tenants.length}`);
  const total = { moved: 0, updated: 0, missing: 0, errors: 0 };
  for (const tenant of tenants) {
    try {
      const s = await withTenant(tenant, migrateOrg);
      console.log(`[uo] ${tenant.isMain ? 'главная' : tenant.slug}: перенесено ${s.moved}, путей ${s.updated}, не найдено ${s.missing}, ошибок ${s.errors}`);
      total.moved += s.moved; total.updated += s.updated; total.missing += s.missing; total.errors += s.errors;
    } catch (e: any) {
      total.errors++;
      console.error(`[uo] ОШИБКА (${tenant.isMain ? 'главная' : tenant.slug}):`, e.message);
    }
  }
  console.log(`[uo] Готово: перенесено ${total.moved}, путей ${total.updated}, не найдено ${total.missing}, ошибок ${total.errors}`);
}

main()
  .catch((e) => { console.error('[uo] Фатальная ошибка:', e); process.exitCode = 1; })
  .finally(async () => {
    await (platformPrisma as any).$disconnect?.().catch(() => {});
    await (prisma as any).$disconnect?.().catch(() => {});
  });
