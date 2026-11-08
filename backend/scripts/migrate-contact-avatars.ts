/**
 * Миграция аватарок контактов в avatars/contacts.
 *
 * Что делает (для главной организации и каждого tenant'а):
 *  1. Находит контактов с avatarUrl старого формата (файл в корне uploads
 *     или в uploads/avatars/).
 *  2. Переносит файл в uploadsRoot()/avatars/contacts/.
 *     Файлы tenant'ов, попавшие в главный uploads по старому багу воркеров,
 *     ищутся и в /app/uploads, и в /app/tenants/<slug>.
 *  3. Обновляет contacts.avatarUrl под новый формат.
 *
 * Идемпотентен: уже перенесённые (путь вида <prefix>/avatars/contacts/) пропускаются.
 *
 * Запуск (внутри контейнера backend):
 *   npx tsx scripts/migrate-contact-avatars.ts
 */
import fs from 'fs';
import path from 'path';
import { platformPrisma, listWorkerTenants, withTenant, uploadsRoot, tenantUploadPrefix } from '../src/lib/tenant.js';
import { prisma } from '../src/lib/prisma.js';
import { moveEntry } from '../src/lib/shop-dir.js';

async function migrateOrg(): Promise<{ moved: number; updated: number; missing: number; errors: number }> {
  const stats = { moved: 0, updated: 0, missing: 0, errors: 0 };
  const prefix = tenantUploadPrefix(); // '' или /tenants/<slug>
  const root = uploadsRoot();

  const contacts = await prisma.contact.findMany({
    where: { avatarUrl: { startsWith: '/' } },
    select: { id: true, avatarUrl: true },
  });

  for (const c of contacts) {
    const url = c.avatarUrl!;
    // Уже новый формат?
    if (url.startsWith(`${prefix || '/uploads'}/avatars/contacts/`)) continue;
    // Не файл нашего хранилища (внешний URL) — оставляем
    if (!url.startsWith('/uploads/') && !url.startsWith('/tenants/')) continue;

    try {
      const fileName = url.split('/').pop()!;
      // Относительный путь: от корня текущего tenant'а, если путь с его префиксом
      const rel = url.startsWith(`${prefix || '/uploads'}/`)
        ? url.slice((prefix || '/uploads').length + 1)
        : url.replace(/^\/+/, '');
      const candidates = [
        path.join(root, rel),
        path.join(root, 'avatars', fileName), // старый формат telegram: avatars/<file>
        path.join('/app/uploads', rel),
        path.join('/app/uploads', 'avatars', fileName),
      ];
      const cur = candidates.find((f) => fs.existsSync(f) && fs.statSync(f).isFile());

      const dir = path.join(root, 'avatars', 'contacts');
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      const newUrl = `${prefix || '/uploads'}/avatars/contacts/${fileName}`;
      const newDisk = path.join(dir, fileName);

      if (!cur) {
        stats.missing++;
        console.log(`[avatars] ${prefix || '/'}: ФАЙЛ НЕ НАЙДЕН (контакт ${c.id}): ${url}`);
        await prisma.contact.update({ where: { id: c.id }, data: { avatarUrl: newUrl } });
        stats.updated++;
        continue;
      }
      if (cur !== newDisk) {
        if (fs.existsSync(newDisk)) {
          if (fs.statSync(newDisk).size === fs.statSync(cur).size) fs.unlinkSync(cur);
          else { console.log(`[avatars] конфликт имён, пропуск: ${newDisk}`); stats.errors++; continue; }
        } else {
          moveEntry(cur, newDisk);
          stats.moved++;
        }
      }
      await prisma.contact.update({ where: { id: c.id }, data: { avatarUrl: newUrl } });
      stats.updated++;
    } catch (e: any) {
      stats.errors++;
      console.error(`[avatars] ${prefix || '/'}: ОШИБКА контакт ${c.id}:`, e.message);
    }
  }
  return stats;
}

async function main() {
  const tenants = await listWorkerTenants();
  console.log(`[avatars] Организаций: ${tenants.length}`);
  const total = { moved: 0, updated: 0, missing: 0, errors: 0 };
  for (const tenant of tenants) {
    try {
      const s = await withTenant(tenant, migrateOrg);
      console.log(`[avatars] ${tenant.isMain ? 'главная' : tenant.slug}: перенесено ${s.moved}, путей ${s.updated}, не найдено ${s.missing}, ошибок ${s.errors}`);
      total.moved += s.moved; total.updated += s.updated; total.missing += s.missing; total.errors += s.errors;
    } catch (e: any) {
      total.errors++;
      console.error(`[avatars] ОШИБКА (${tenant.isMain ? 'главная' : tenant.slug}):`, e.message);
    }
  }
  console.log(`[avatars] Готово: перенесено ${total.moved}, путей ${total.updated}, не найдено ${total.missing}, ошибок ${total.errors}`);
}

main()
  .catch((e) => {
    console.error('[avatars] Фатальная ошибка:', e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await (platformPrisma as any).$disconnect?.().catch(() => {});
    await (prisma as any).$disconnect?.().catch(() => {});
  });
