/**
 * Дочистка после migrate-task-folders.ts: осиротевшие вложения и папки.
 *
 * Обрабатывает записи file_attachments со старыми путями
 * (/uploads[/<t-slug>]/tasks/<тикет>/<файл> без год/месяца), у которых задача
 * уже удалена из БД, а также пустые числовые папки в tasks/<корень>.
 *
 * Логика (для главной организации и каждого tenant'а):
 *  1. Находит вложения со старым форматом пути, группирует по тикету.
 *  2. Год/месяц берётся из createdAt самого раннего вложения (задачи нет).
 *  3. Файлы переносятся из tasks/<тикет> в tasks/<год>/<месяц>/<тикет>
 *     (если целевая папка уже есть — файлы дописываются без перезаписи).
 *  4. Пути вложений обновляются под новый формат.
 *  5. Пустые числовые папки в tasks/<корень> удаляются; непустые без записей
 *     в БД переносятся по mtime файлов, чтобы корень остался чистым.
 *
 * Идемпотентен. Запуск (внутри контейнера backend):
 *   npx tsx scripts/migrate-task-folders-orphans.ts
 */
import fs from 'fs';
import path from 'path';
import { platformPrisma, listWorkerTenants, withTenant, tenantUploadPrefix, uploadsRoot } from '../src/lib/tenant.js';
import { taskYearMonth } from '../src/lib/task-dir.js';
import { prisma } from '../src/lib/prisma.js';

/** Пути вида /uploads[/<t-slug>]/tasks/<N>/<файл>, где N — НЕ год (20xx) */
const OLD_FORMAT_RE = new RegExp(`^(/uploads(?:/t-[a-z0-9-]+)?/tasks)/(?!20\\d{2}/)(\\d+)/(.+)$`);

interface OrphanGroup {
  ticket: string;
  attachments: { id: string; path: string; createdAt: Date }[];
}

async function migrateTenantOrphans(): Promise<{ moved: number; updated: number; removed: number; errors: number }> {
  const stats = { moved: 0, updated: 0, removed: 0, errors: 0 };
  const prefix = tenantUploadPrefix();
  const root = uploadsRoot();
  const tasksRoot = path.join(root, 'tasks');

  // --- 1. Собираем осиротевшие вложения (старый формат) ---
  const all = await prisma.fileAttachment.findMany({
    where: { path: { startsWith: `/uploads${prefix}/tasks/` } },
    select: { id: true, path: true, createdAt: true },
  });
  const groups = new Map<string, OrphanGroup>();
  for (const att of all) {
    const m = att.path.match(OLD_FORMAT_RE);
    if (!m) continue;
    const ticket = m[2];
    if (!groups.has(ticket)) groups.set(ticket, { ticket, attachments: [] });
    groups.get(ticket)!.attachments.push(att);
  }

  // --- 2-4. Перенос + обновление путей ---
  for (const group of groups.values()) {
    const { ticket } = group;
    // Год/месяц — по самому раннему вложению (задача удалена, createdAt задачи недоступен)
    const minDate = group.attachments.reduce((a, b) => (a.createdAt < b.createdAt ? a : b)).createdAt;
    const { year, month } = taskYearMonth(minDate);
    const oldDir = path.join(tasksRoot, ticket);
    const newDir = path.join(tasksRoot, year, month, ticket);

    try {
      if (fs.existsSync(oldDir)) {
        fs.mkdirSync(newDir, { recursive: true });
        for (const entry of fs.readdirSync(oldDir)) {
          const src = path.join(oldDir, entry);
          const dst = path.join(newDir, entry);
          if (fs.existsSync(dst)) {
            console.log(`[orphans] файл уже существует, пропуск: ${dst}`);
          } else {
            fs.renameSync(src, dst);
            stats.moved++;
          }
        }
        // Удаляем пустой остаток (ignore ошибки, если что-то осталось)
        try { fs.rmdirSync(oldDir); } catch { /* не пуст — оставим, отчёт ниже */ }
      }
      const base = `/uploads${prefix}/tasks/${year}/${month}/${ticket}/`;
      for (const att of group.attachments) {
        const rest = att.path.match(OLD_FORMAT_RE)![3];
        await prisma.fileAttachment.update({ where: { id: att.id }, data: { path: base + rest } });
        stats.updated++;
      }
      console.log(`[orphans] ${prefix || '/'}: tasks/${ticket} -> tasks/${year}/${month}/${ticket} (${group.attachments.length} путей)`);
    } catch (e: any) {
      stats.errors++;
      console.error(`[orphans] ОШИБКА тикет ${ticket}:`, e.message);
    }
  }

  // --- 5. Чистка числовых папок в корне ---
  if (fs.existsSync(tasksRoot)) {
    for (const entry of fs.readdirSync(tasksRoot)) {
      const dir = path.join(tasksRoot, entry);
      if (!/^\d+$/.test(entry) || !fs.statSync(dir).isDirectory()) continue;
      const files = fs.readdirSync(dir);
      if (files.length === 0) {
        fs.rmdirSync(dir);
        stats.removed++;
        continue;
      }
      // Папка без записей в БД — переносим по mtime, чтобы корень был чистым
      const stillOld = await prisma.fileAttachment.findFirst({
        where: { path: { startsWith: `/uploads${prefix}/tasks/${entry}/` } },
        select: { id: true },
      });
      if (!stillOld) {
        const mtimes = files.map((f) => fs.statSync(path.join(dir, f)).mtime);
        const minM = mtimes.reduce((a, b) => (a < b ? a : b));
        const { year, month } = taskYearMonth(minM);
        const newDir = path.join(tasksRoot, year, month, entry);
        try {
          fs.mkdirSync(newDir, { recursive: true });
          for (const f of files) {
            const dst = path.join(newDir, f);
            if (!fs.existsSync(dst)) fs.renameSync(path.join(dir, f), dst);
          }
          try { fs.rmdirSync(dir); } catch { /* не пуст */ }
          console.log(`[orphans] папка без записей в БД: tasks/${entry} -> tasks/${year}/${month}/${entry}`);
          stats.moved++;
        } catch (e: any) {
          stats.errors++;
          console.error(`[orphans] ОШИБКА переноса папки ${entry}:`, e.message);
        }
      }
    }
  }
  return stats;
}

async function main() {
  const tenants = await listWorkerTenants();
  console.log(`[orphans] Организаций: ${tenants.length}`);
  const total = { moved: 0, updated: 0, removed: 0, errors: 0 };
  for (const tenant of tenants) {
    try {
      const s = await withTenant(tenant, migrateTenantOrphans);
      console.log(`[orphans] ${tenant.isMain ? 'главная' : tenant.slug}: перенесено ${s.moved}, путей ${s.updated}, папок удалено ${s.removed}, ошибок ${s.errors}`);
      total.moved += s.moved; total.updated += s.updated; total.removed += s.removed; total.errors += s.errors;
    } catch (e: any) {
      total.errors++;
      console.error(`[orphans] ОШИБКА (${tenant.isMain ? 'главная' : tenant.slug}):`, e.message);
    }
  }
  console.log(`[orphans] Готово: перенесено ${total.moved}, путей ${total.updated}, папок удалено ${total.removed}, ошибок ${total.errors}`);
}

main()
  .catch((e) => {
    console.error('[orphans] Фатальная ошибка:', e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await (platformPrisma as any).$disconnect?.().catch(() => {});
    await (prisma as any).$disconnect?.().catch(() => {});
  });
