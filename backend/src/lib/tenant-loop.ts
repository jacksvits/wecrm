/**
 * Фоновые циклы платформы (backend-контейнер).
 *
 * Каждые SYNC_INTERVAL_MS получает список активных организаций и:
 *  - синхронизирует Telegram-поллеры (по одному на tenant'а);
 *  - выполняет тик планировщика напоминаний в контексте каждого tenant'а.
 *
 * Контекст tenant'а (AsyncLocalStorage) пронизывает все вызовы внутри тика,
 * поэтому глобальный `prisma` прозрачно работает с БД нужной организации.
 */
import { listWorkerTenants, withTenant } from './tenant.js';
import { syncTelegramPollers } from '../routes/telegram.js';
import { runReminderTick } from './reminder-scheduler.js';

const SYNC_INTERVAL_MS = 30_000;

let started = false;

export function runTenantLoops(): void {
  if (started) return;
  started = true;
  console.log('[TenantLoop] Фоновые циклы платформы запущены (интервал синхронизации 30с)');

  const iteration = async () => {
    let tenants;
    try {
      tenants = await listWorkerTenants();
    } catch (e: any) {
      console.error('[TenantLoop] Не удалось получить список организаций:', e.message);
      return;
    }
    try {
      syncTelegramPollers(tenants);
    } catch (e: any) {
      console.error('[TenantLoop] Telegram-поллеры:', e.message);
    }
    for (const tenant of tenants) {
      try {
        await withTenant(tenant, () => runReminderTick());
      } catch (e: any) {
        console.error(`[TenantLoop] Напоминания (${tenant.slug}):`, e.message);
      }
    }
  };

  const loop = async () => {
    // Первая итерация сразу, далее по расписанию
    for (;;) {
      await iteration().catch((e: any) => console.error('[TenantLoop] Итерация:', e.message));
      await new Promise((r) => setTimeout(r, SYNC_INTERVAL_MS));
    }
  };
  loop();
}
