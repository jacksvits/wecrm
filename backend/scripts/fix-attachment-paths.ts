/**
 * Починка путей вложений, чьи файлы лежат не по указанному в БД пути.
 *
 * Сценарий: файловый менеджер задачи (routes/tasks.ts) перемещает файлы по
 * подпапкам на диске, не обновляя file_attachments.path — вложение в БД
 * продолжает ссылаться на старое расположение и отдаёт 404.
 *
 * Что делает (для главной организации и каждого tenant'а):
 *  1. Берёт каждое вложение, чей путь в БД не существует на диске.
 *  2. Ищет файл с тем же именем внутри папки задачи (tasks/<год>/<месяц>/<тикет>)
 *     — в любой вложенной подпапке.
 *  3. Если найден ровно один файл — обновляет путь в БД.
 *  4. Если не найден или найдено несколько — оставляет как есть и логирует.
 *
 * Запуск (внутри контейнера backend):
 *   npx tsx scripts/fix-attachment-paths.ts
 */
import fs from 'fs';
import path from 'path';
import { platformPrisma, listWorkerTenants, withTenant, tenantUploadPrefix, uploadsRoot } from '../src/lib/tenant.js';
import { prisma } from '../src/lib/prisma.js';

const TASKS_PATH_RE = new RegExp(`^(/uploads(?:/t-[a-z0-9-]+)?/tasks/20\\d{2}/\\d{2}/\\d+)/(.*)$`);

/** Рекурсивно найти файл по имени внутри dir */
function findByName(dir: string, name: string, out: string[] = []): string[] {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir)) {
    const full = path.join(dir, entry);
    const st = fs.statSync(full);
    if (st.isDirectory()) findByName(full, name, out);
    else if (entry === name) out.push(full);
  }
  return out;
}

async function fixTenant(): Promise<{ fixed: number; unresolved: number; skipped: number }> {
  const stats = { fixed: 0, unresolved: 0, skipped: 0 };
  const prefix = tenantUploadPrefix();
  const root = uploadsRoot();

  const all = await prisma.fileAttachment.findMany({
    where: { path: { startsWith: `/uploads${prefix}/tasks/` } },
    select: { id: true, path: true },
  });

  for (const att of all) {
    const rel = att.path.slice(`/uploads${prefix}/`.length);
    if (fs.existsSync(path.join(root, rel))) continue; // файл на месте
    const m = att.path.match(TASKS_PATH_RE);
    if (!m) { stats.skipped++; continue; } // не путь задачи нового формата
    const taskDir = path.join(root, m[1].slice(`/uploads${prefix}/`.length));
    const fileName = m[2].split('/').pop()!;
    const matches = findByName(taskDir, fileName);
    if (matches.length === 1) {
      const relNew = path.relative(root, matches[0]);
      const newPath = `/uploads${prefix}/${relNew.split(path.sep).join('/')}`;
      await prisma.fileAttachment.update({ where: { id: att.id }, data: { path: newPath } });
      console.log(`[fix-paths] ${prefix || '/'}: ${rel} -> ${relNew.split(path.sep).join('/')}`);
      stats.fixed++;
    } else {
      stats.unresolved++;
      console.log(`[fix-paths] ${prefix || '/'}: НЕ НАЙДЕН (${matches.length} совпадений): ${rel}`);
    }
  }
  return stats;
}

async function main() {
  const tenants = await listWorkerTenants();
  console.log(`[fix-paths] Организаций: ${tenants.length}`);
  const total = { fixed: 0, unresolved: 0, skipped: 0 };
  for (const tenant of tenants) {
    try {
      const s = await withTenant(tenant, fixTenant);
      console.log(`[fix-paths] ${tenant.isMain ? 'главная' : tenant.slug}: исправлено ${s.fixed}, нерешённых ${s.unresolved}, пропущено ${s.skipped}`);
      total.fixed += s.fixed; total.unresolved += s.unresolved; total.skipped += s.skipped;
    } catch (e: any) {
      console.error(`[fix-paths] ОШИБКА (${tenant.isMain ? 'главная' : tenant.slug}):`, e.message);
    }
  }
  console.log(`[fix-paths] Готово: исправлено ${total.fixed}, нерешённых ${total.unresolved}, пропущено ${total.skipped}`);
}

main()
  .catch((e) => {
    console.error('[fix-paths] Фатальная ошибка:', e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await (platformPrisma as any).$disconnect?.().catch(() => {});
    await (prisma as any).$disconnect?.().catch(() => {});
  });
