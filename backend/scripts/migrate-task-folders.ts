/**
 * Миграция папок вложений задач в структуру tasks/<год>/<месяц>/<номер тикета>.
 *
 * Что делает (для главной организации и каждого активного tenant'а):
 *  1. Перебирает все задачи с ticketNumber и датой создания.
 *  2. Если старая папка uploads/tasks/<тикет> существует — переносит её
 *     в uploads/tasks/<год>/<месяц>/<тикет> (rename, в т.ч. поверх NFS).
 *  3. Обновляет FileAttachment.path вида /uploads[/<t-slug>]/tasks/<тикет>/<файл>
 *     на новый с годом/месяцем.
 *
 * Идемпотентен: повторный запуск ничего не перемещает (старой папки уже нет)
 * и лишь проставляет недостающие год/месяц в путях БД.
 *
 * Запуск (внутри контейнера backend):
 *   npx tsx scripts/migrate-task-folders.ts
 */
import { platformPrisma, listWorkerTenants, withTenant, tenantUploadPrefix, uploadsRoot } from '../src/lib/tenant.js';
import { taskYearMonth } from '../src/lib/task-dir.js';
import { prisma } from '../src/lib/prisma.js';

/** Экранирование не требуется: Prisma экранирует startsWith-паттерны сам */

async function migrateTenant(): Promise<{ tasks: number; files: number; errors: number }> {
  const stats = { tasks: 0, files: 0, errors: 0 };
  const fs = await import('fs');
  const path = await import('path');

  const prefix = tenantUploadPrefix(); // '' для главной, '/t-<slug>' для tenant'а
  const root = uploadsRoot();

  // ticketNumber обязателен (autoincrement), фильтр на null не нужен
  const tasks = await prisma.task.findMany({
    select: { id: true, ticketNumber: true, createdAt: true },
    orderBy: { ticketNumber: 'asc' },
  });

  for (const task of tasks) {
    const ticket = String(task.ticketNumber);
    const { year, month } = taskYearMonth(task.createdAt);
    const oldDir = path.join(root, 'tasks', ticket);
    const newDir = path.join(root, 'tasks', year, month, ticket);

    // 1. Перенос папки на диске
    if (fs.existsSync(oldDir)) {
      if (fs.existsSync(newDir)) {
        console.log(`[migrate-task-folders] Папка уже существует, пропуск move: ${newDir}`);
      } else {
        fs.mkdirSync(path.dirname(newDir), { recursive: true });
        fs.renameSync(oldDir, newDir);
        console.log(`[migrate-task-folders] ${prefix || '/'}: tasks/${ticket} -> tasks/${year}/${month}/${ticket}`);
      }
      stats.tasks++;
    }

    // 2. Обновление путей вложений в БД: /uploads<prefix>/tasks/<тикет>/... -> /uploads<prefix>/tasks/<год>/<месяц>/<тикет>/...
    // Построчно: Prisma не умеет выражения (replace) в updateMany
    const attachments = await prisma.fileAttachment.findMany({
      where: {
        path: { startsWith: `/uploads${prefix}/tasks/${ticket}/` },
      },
      select: { id: true, path: true },
    });
    for (const att of attachments) {
      const rest = att.path.slice(`/uploads${prefix}/tasks/${ticket}/`.length);
      const newPath = `/uploads${prefix}/tasks/${year}/${month}/${ticket}/${rest}`;
      await prisma.fileAttachment.update({ where: { id: att.id }, data: { path: newPath } });
      stats.files++;
    }
  }
  return stats;
}

async function main() {
  const tenants = await listWorkerTenants();
  console.log(`[migrate-task-folders] Организаций: ${tenants.length}`);

  let totalTasks = 0;
  let totalFiles = 0;
  let totalErrors = 0;
  for (const tenant of tenants) {
    try {
      const stats = await withTenant(tenant, migrateTenant);
      console.log(`[migrate-task-folders] ${tenant.isMain ? 'главная' : tenant.slug}: папок перенесено ${stats.tasks}, путей обновлено ${stats.files}`);
      totalTasks += stats.tasks;
      totalFiles += stats.files;
      totalErrors += stats.errors;
    } catch (e: any) {
      totalErrors++;
      console.error(`[migrate-task-folders] ОШИБКА (${tenant.isMain ? 'главная' : tenant.slug}):`, e.message);
    }
  }
  console.log(`[migrate-task-folders] Готово: папок ${totalTasks}, путей ${totalFiles}, ошибок ${totalErrors}`);
}

main()
  .catch((e) => {
    console.error('[migrate-task-folders] Фатальная ошибка:', e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await (platformPrisma as any).$disconnect?.().catch(() => {});
    await (prisma as any).$disconnect?.().catch(() => {});
  });
