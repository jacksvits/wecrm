/**
 * Миграция запросов организаций (tenant_tickets) в задачи платформы.
 *
 * Каждому тикету без task_id создаётся задача в платформенной БД (welans.cc)
 * от системного пользователя «Поддержка WeCRM»; вся переписка переносится
 * в обсуждение задачи (comments), тикет связывается с задачей.
 *
 * Идемпотентен: повторный запуск обрабатывает только тикеты без task_id.
 *
 * Запуск (внутри контейнера backend):
 *   npx tsx scripts/migrate-tenant-tickets.ts
 */
import { platformPrisma } from '../src/lib/tenant.js';
import { createTaskForTicket } from '../src/lib/support-ticket-tasks.js';

async function main() {
  const tickets = await platformPrisma.tenantTicket.findMany({
    where: { taskId: null },
    select: { id: true, tenantName: true, subject: true, status: true },
    orderBy: { createdAt: 'asc' },
  });
  console.log(`[migrate] Тикетов без задачи: ${tickets.length}`);

  let ok = 0;
  let failed = 0;
  for (const t of tickets) {
    try {
      await createTaskForTicket(t.id);
      ok++;
      console.log(`[migrate] OK [${t.tenantName}] ${t.subject}`);
    } catch (e: any) {
      failed++;
      console.error(`[migrate] FAILED [${t.tenantName}] ${t.subject}: ${e.message}`);
    }
  }

  console.log(`[migrate] Готово: создано задач ${ok}, ошибок ${failed}`);
}

main()
  .catch((e) => {
    console.error('[migrate] Фатальная ошибка:', e);
    process.exitCode = 1;
  })
  .finally(() => platformPrisma.$disconnect());
