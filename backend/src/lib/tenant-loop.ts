/**
 * Фоновые циклы платформы (backend-контейнер).
 *
 * Каждые SYNC_INTERVAL_MS получает список активных организаций и:
 *  - синхронизирует Telegram-поллеры (по одному на tenant'а);
 *  - выполняет тик планировщика напоминаний в контексте каждого tenant'а;
 *  - раз в TENANT_MIGRATE_INTERVAL применяет prisma migrate deploy к БД tenant'ов.
 *
 * Контекст tenant'а (AsyncLocalStorage) пронизывает все вызовы внутри тика,
 * поэтому глобальный `prisma` прозрачно работает с БД нужной организации.
 */
import { execFile } from 'child_process';
import { listWorkerTenants, withTenant, tenantDbUrl } from './tenant.js';
import { syncTelegramPollers } from '../routes/telegram.js';
import { runReminderTick } from './reminder-scheduler.js';

const SYNC_INTERVAL_MS = 30_000;

// Миграции тенантских БД: не чаще раза в 10 минут. Без этого тенанты остаются
// на схеме момента создания — новые таблицы/колонки не появляются, а код,
// использующий их, падает с ошибками SQL (миграции раньше доводили вручную).
const TENANT_MIGRATE_INTERVAL = 10 * 60 * 1000;
let lastTenantMigrateAt = 0;

function runTenantMigrations(tenants: any[]): Promise<void> {
  return new Promise((resolve) => {
    let i = 0;
    const next = () => {
      if (i >= tenants.length) return resolve();
      const t = tenants[i++];
      // CLI prisma применяет миграции из каталога приложения (/app) с подменой DATABASE_URL
      execFile('npx', ['prisma', 'migrate', 'deploy', '--skip-generate'], {
        cwd: '/app',
        env: { ...process.env, DATABASE_URL: tenantDbUrl(t.dbName) },
        timeout: 120000,
        maxBuffer: 5 * 1024 * 1024,
      }, (err, stdout, stderr) => {
        if (err) {
          console.error(`[TenantLoop] Миграции (${t.slug}):`, stderr || err.message);
        } else {
          const out = (stdout || '').trim();
          if (!out.includes('No pending migrations')) {
            console.log(`[TenantLoop] Миграции (${t.slug}):`, out.split('\n').pop());
          }
        }
        next();
      });
    };
    next();
  });
}

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
    // Синхронизация миграций всех активных тенантских БД (не чаще раза в 10 минут)
    const now = Date.now();
    if (now - lastTenantMigrateAt >= TENANT_MIGRATE_INTERVAL) {
      lastTenantMigrateAt = now;
      try {
        await runTenantMigrations(tenants);
      } catch (e: any) {
        console.error('[TenantLoop] Миграции:', e.message);
      }
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
