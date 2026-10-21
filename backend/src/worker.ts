import dotenv from 'dotenv';
dotenv.config();
// BigInt (vkUserId, ozonProductId) сериализуется в JSON как строка
(BigInt.prototype as any).toJSON = function () { return this.toString(); };

import { EmailWorker } from './email-worker/index.js';
import { AccountingWorker } from './accounting-worker/index.js';
import { VkCommunityWorker } from './vk-community/index.js';
import { prisma } from './lib/prisma.js';
import { runOneCSync } from './lib/onec-sync.js';
import { syncProductsToOzon } from './lib/ozon.js';
import { listWorkerTenants, withTenant, TenantInfo } from './lib/tenant.js';
import { runStatusAutoChange } from './lib/status-auto-change.js';

/**
 * Entry-point для worker-контейнера (мультитенантный).
 *
 * Запускается как отдельный процесс (не HTTP-сервер).
 * Интеграции (IMAP email, бухгалтерия, VK Long Poll, 1С, OZON) работают
 * отдельно для главной организации и каждого активного tenant'а:
 * раз в 30 секунд список организаций сверяется с набором запущенных
 * воркеров — лишние останавливаются, новые стартуют. Каждый воркер
 * запускается в контексте своего tenant'а (AsyncLocalStorage), поэтому
 * глобальный `prisma` обращается к БД нужной организации.
 */

type TimerBag = { email?: EmailWorker; accounting?: AccountingWorker; vk?: VkCommunityWorker; onecTimer?: NodeJS.Timeout; ozonTimer?: NodeJS.Timeout; statusAutoTimer?: NodeJS.Timeout };

/** Интервал проверки «Авто смены» статусов */
const STATUS_AUTO_CHANGE_MS = 60_000;

const instances = new Map<string, TimerBag>();
const SYNC_MS = 30_000;

function tenantKey(t: TenantInfo): string {
  return t.isMain ? 'main' : t.slug;
}

function stopBag(key: string, bag: TimerBag) {
  try { bag.email?.stop(); } catch { /* ignore */ }
  try { bag.accounting?.stop(); } catch { /* ignore */ }
  try { bag.vk?.stop(); } catch { /* ignore */ }
  if (bag.onecTimer) clearInterval(bag.onecTimer);
  if (bag.ozonTimer) clearInterval(bag.ozonTimer);
  if (bag.statusAutoTimer) clearInterval(bag.statusAutoTimer);
  instances.delete(key);
  console.log(`[Worker] Воркеры остановлены для tenant ${key}`);
}

/** Поднимает/гасит воркеры интеграций для одного tenant'а по его настройкам */
async function syncTenant(t: TenantInfo): Promise<void> {
  const key = tenantKey(t);
  let bag = instances.get(key);
  if (!bag) { bag = {}; instances.set(key, bag); }

  // --- «Авто смена» статусов (раз в минуту, независимо от «тяжёлых» интеграций ниже) ---
  if (!bag.statusAutoTimer) {
    const runStatusAutoChangeJob = async () => {
      try {
        await runStatusAutoChange();
      } catch (e: any) {
        console.error(`[Worker] Status auto-change error (${key}):`, e.message);
      }
    };
    await runStatusAutoChangeJob();
    bag.statusAutoTimer = setInterval(() => { withTenant(t, runStatusAutoChangeJob).catch((e: any) => console.error(`[Worker] Status auto-change error (${key}):`, e.message)); }, STATUS_AUTO_CHANGE_MS);
    console.log(`[Worker] Status auto-change scheduled (${key})`);
  }

  // --- Email Worker ---
  const emailSettings = await prisma.emailSettings.findFirst();
  if (emailSettings && emailSettings.isActive) {
    if (!bag.email) {
      bag.email = new EmailWorker({
        imapHost: emailSettings.imapHost,
        imapPort: emailSettings.imapPort,
        imapUser: emailSettings.imapUser,
        imapPass: emailSettings.imapPass,
        // Интервал валидируем: 0/отсутствие значения привело бы к busy-loop в setInterval
        checkIntervalMs: Math.max(10_000, emailSettings.checkIntervalMs || 60_000),
        processedFolder: emailSettings.processedFolder || undefined,
        defaultCreatorId: emailSettings.defaultCreatorId || undefined,
        secure: emailSettings.secure,
        rejectUnauthorized: emailSettings.rejectUnauthorized,
        requireTLS: emailSettings.requireTLS,
        markAsRead: emailSettings.markAsRead,
      });
      await bag.email.start();
      console.log(`[Worker] Email worker started (${key})`);
    }
  } else if (bag.email) {
    bag.email.stop();
    bag.email = undefined;
  }

  // --- Accounting Worker (ящик бухгалтерии) ---
  const accountingSettings = await prisma.accountingEmailSettings.findFirst();
  if (accountingSettings && accountingSettings.isActive) {
    if (!bag.accounting) {
      bag.accounting = new AccountingWorker({
        imapHost: accountingSettings.imapHost,
        imapPort: accountingSettings.imapPort,
        imapUser: accountingSettings.imapUser,
        imapPass: accountingSettings.imapPass,
        // Интервал валидируем: 0/отсутствие значения привело бы к busy-loop в setInterval
        checkIntervalMs: Math.max(10_000, accountingSettings.checkIntervalMs || 60_000),
        processedFolder: accountingSettings.processedFolder || undefined,
        secure: accountingSettings.secure,
        rejectUnauthorized: accountingSettings.rejectUnauthorized,
        requireTLS: accountingSettings.requireTLS,
      });
      await bag.accounting.start();
      console.log(`[Worker] Accounting worker started (${key})`);
    }
  } else if (bag.accounting) {
    bag.accounting.stop();
    bag.accounting = undefined;
  }

  // --- VK Community Worker ---
  const vkSettings = await prisma.vkCommunitySettings.findFirst();
  if (vkSettings && vkSettings.isActive) {
    if (!bag.vk) {
      bag.vk = new VkCommunityWorker();
      await bag.vk.start();
      console.log(`[Worker] VK Community worker started (${key})`);
    }
  } else if (bag.vk) {
    bag.vk.stop();
    bag.vk = undefined;
  }

  // --- 1С УТ 8.3 sync ---
  const onecSettings = await prisma.oneCPluginSettings.findFirst();
  if (onecSettings?.isActive && onecSettings.serviceUrl) {
    if (!bag.onecTimer) {
      const runOneCSyncJob = async () => {
        try {
          await runOneCSync();
          console.log(`[Worker] 1C sync done (${key})`);
        } catch (e: any) {
          console.error(`[Worker] 1C sync error (${key}):`, e.message);
        }
      };
      await runOneCSyncJob();
      bag.onecTimer = setInterval(runOneCSyncJob, Math.max(5, onecSettings.syncIntervalMinutes) * 60 * 1000);
      console.log(`[Worker] 1C sync scheduled (${key})`);
    }
  } else if (bag.onecTimer) {
    clearInterval(bag.onecTimer);
    bag.onecTimer = undefined;
  }

  // --- OZON Seller sync (выгрузка отмеченных товаров по расписанию) ---
  // Авто-синхронизация запускается только при включённой опции «Авто синхронизация»;
  // ручная синхронизация из настроек плагина доступна независимо от неё
  const ozonSettings = await prisma.ozonSellerSettings.findFirst();
  if (ozonSettings?.isActive && ozonSettings.autoSync) {
    if (!bag.ozonTimer) {
      const runOzonSyncJob = async () => {
        try {
          const summary = await syncProductsToOzon();
          console.log(`[Worker] OZON sync done (${key}): created=${summary.created} updated=${summary.updated} failed=${summary.failed}`);
        } catch (e: any) {
          console.error(`[Worker] OZON sync error (${key}):`, e.message);
        }
      };
      bag.ozonTimer = setInterval(runOzonSyncJob, Math.max(5, ozonSettings.updateIntervalMinutes || 60) * 60 * 1000);
      console.log(`[Worker] OZON sync scheduled every ${Math.max(5, ozonSettings.updateIntervalMinutes || 60)} min (${key})`);
    }
  } else if (bag.ozonTimer) {
    clearInterval(bag.ozonTimer);
    bag.ozonTimer = undefined;
  }

}

async function reconcile() {
  const tenants = await listWorkerTenants();
  const wanted = new Map(tenants.map((t) => [tenantKey(t), t]));
  for (const [key, bag] of [...instances]) {
    if (!wanted.has(key)) stopBag(key, bag);
  }
  for (const t of tenants) {
    const key = tenantKey(t);
    try {
      await withTenant(t, () => syncTenant(t));
    } catch (e: any) {
      console.error(`[Worker] Sync error (${key}):`, e.message);
    }
  }
}

async function main() {
  console.log('[Worker] Starting multitenancy workers...');

  // Первая синхронизация сразу, далее по расписанию
  for (;;) {
    await reconcile().catch((e: any) => console.error('[Worker] Reconcile error:', e.message));
    await new Promise((r) => setTimeout(r, SYNC_MS));
  }
}

function shutdown(signal: string) {
  console.log(`[Worker] ${signal} received, shutting down...`);
  for (const [key, bag] of [...instances]) stopBag(key, bag);
  process.exit(0);
}
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

main().catch((err) => {
  console.error('[Worker] Unhandled error:', err);
  process.exit(0);
});
