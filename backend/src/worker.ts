import dotenv from 'dotenv';
dotenv.config();
// BigInt (vkUserId, ozonProductId) сериализуется в JSON как строка
(BigInt.prototype as any).toJSON = function () { return this.toString(); };

import { EmailWorker } from './email-worker/index.js';
import { AccountingWorker } from './accounting-worker/index.js';
import { VkCommunityWorker } from './vk-community/index.js';
import { prisma } from './lib/prisma.js';
import { runOneCSync } from './lib/onec-sync.js';
import { syncProductsToOzon, syncPricesToOzon, syncPricesFromOzon, syncStocksToOzon, syncStocksFromOzon, importOzonProducts } from './lib/ozon.js';
import { syncProductsToWb, syncPricesToWb, syncPricesFromWb, syncStocksToWb, syncStocksFromWb, importWbProducts } from './lib/wb.js';
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

type TimerBag = { email?: EmailWorker; accounting?: AccountingWorker; vk?: VkCommunityWorker; onecTimer?: NodeJS.Timeout; ozonProductsTimer?: NodeJS.Timeout; ozonPricesTimer?: NodeJS.Timeout; ozonStocksTimer?: NodeJS.Timeout; wbProductsTimer?: NodeJS.Timeout; wbPricesTimer?: NodeJS.Timeout; wbStocksTimer?: NodeJS.Timeout; statusAutoTimer?: NodeJS.Timeout };

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
  if (bag.ozonProductsTimer) clearInterval(bag.ozonProductsTimer);
  if (bag.ozonPricesTimer) clearInterval(bag.ozonPricesTimer);
  if (bag.ozonStocksTimer) clearInterval(bag.ozonStocksTimer);
  if (bag.wbProductsTimer) clearInterval(bag.wbProductsTimer);
  if (bag.wbPricesTimer) clearInterval(bag.wbPricesTimer);
  if (bag.wbStocksTimer) clearInterval(bag.wbStocksTimer);
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

  // --- OZON Seller sync: три независимые задачи (товары, цены, остатки) по своим расписаниям ---
  // Каждая задача работает в направлении из настроек режима («В Озон» / «С Озона»).
  // Авто-синхронизация запускается только при включённой опции «Авто синхронизация»;
  // ручная синхронизация из настроек плагина доступна независимо от неё
  const ozonSettings = await prisma.ozonSellerSettings.findFirst();
  if (ozonSettings?.isActive && ozonSettings.autoSync) {
    const runOzonJob = (kind: 'products' | 'prices' | 'stocks', job: () => Promise<unknown>) => async () => {
      try {
        const summary = await job();
        console.log(`[Worker] OZON ${kind} sync done (${key}):`, JSON.stringify(summary).slice(0, 250));
      } catch (e: any) {
        console.error(`[Worker] OZON ${kind} sync error (${key}):`, e.message);
      }
    };
    const ozonJobFor = (kind: 'products' | 'prices' | 'stocks') =>
      kind === 'products'
        ? (ozonSettings.productsMode === 'from_ozon' ? () => importOzonProducts() : () => syncProductsToOzon())
        : kind === 'prices'
          ? (ozonSettings.pricesMode === 'from_ozon' ? () => syncPricesFromOzon() : () => syncPricesToOzon())
          : (ozonSettings.stocksMode === 'from_ozon' ? () => syncStocksFromOzon() : () => syncStocksToOzon());
    const ozonIntervalFor = (kind: 'products' | 'prices' | 'stocks') =>
      Math.max(5, (kind === 'products' ? ozonSettings.productsIntervalMinutes : kind === 'prices' ? ozonSettings.pricesIntervalMinutes : ozonSettings.stocksIntervalMinutes) || 60) * 60 * 1000;

    if (!bag.ozonProductsTimer) {
      bag.ozonProductsTimer = setInterval(runOzonJob('products', ozonJobFor('products')), ozonIntervalFor('products'));
      console.log(`[Worker] OZON products sync scheduled every ${ozonIntervalFor('products') / 60000} min, mode=${ozonSettings.productsMode} (${key})`);
    }
    if (!bag.ozonPricesTimer) {
      bag.ozonPricesTimer = setInterval(runOzonJob('prices', ozonJobFor('prices')), ozonIntervalFor('prices'));
      console.log(`[Worker] OZON prices sync scheduled every ${ozonIntervalFor('prices') / 60000} min, mode=${ozonSettings.pricesMode} (${key})`);
    }
    if (!bag.ozonStocksTimer) {
      bag.ozonStocksTimer = setInterval(runOzonJob('stocks', ozonJobFor('stocks')), ozonIntervalFor('stocks'));
      console.log(`[Worker] OZON stocks sync scheduled every ${ozonIntervalFor('stocks') / 60000} min, mode=${ozonSettings.stocksMode} (${key})`);
    }
  } else {
    if (bag.ozonProductsTimer) { clearInterval(bag.ozonProductsTimer); bag.ozonProductsTimer = undefined; }
    if (bag.ozonPricesTimer) { clearInterval(bag.ozonPricesTimer); bag.ozonPricesTimer = undefined; }
    if (bag.ozonStocksTimer) { clearInterval(bag.ozonStocksTimer); bag.ozonStocksTimer = undefined; }
  }

  // --- WB Seller sync: три независимые задачи (товары, цены, остатки) по своим расписаниям ---
  // Каждая задача работает в направлении из настроек режима («В WB» / «С WB»).
  // По умолчанию всё «С WB»: карточки, цены и остатки вытягиваются из кабинета в складской учёт CRM.
  const wbSettings = await prisma.wbSellerSettings.findFirst();
  if (wbSettings?.isActive && wbSettings.autoSync) {
    const runWbJob = (kind: 'products' | 'prices' | 'stocks', job: () => Promise<unknown>) => async () => {
      try {
        const summary = await job();
        console.log(`[Worker] WB ${kind} sync done (${key}):`, JSON.stringify(summary).slice(0, 250));
      } catch (e: any) {
        console.error(`[Worker] WB ${kind} sync error (${key}):`, e.message);
      }
    };
    const wbJobFor = (kind: 'products' | 'prices' | 'stocks') =>
      kind === 'products'
        ? (wbSettings.productsMode === 'from_wb' ? () => importWbProducts() : () => syncProductsToWb())
        : kind === 'prices'
          ? (wbSettings.pricesMode === 'from_wb' ? () => syncPricesFromWb() : () => syncPricesToWb())
          : (wbSettings.stocksMode === 'from_wb' ? () => syncStocksFromWb() : () => syncStocksToWb());
    const wbIntervalFor = (kind: 'products' | 'prices' | 'stocks') =>
      Math.max(5, (kind === 'products' ? wbSettings.productsIntervalMinutes : kind === 'prices' ? wbSettings.pricesIntervalMinutes : wbSettings.stocksIntervalMinutes) || 60) * 60 * 1000;

    if (!bag.wbProductsTimer) {
      bag.wbProductsTimer = setInterval(runWbJob('products', wbJobFor('products')), wbIntervalFor('products'));
      console.log(`[Worker] WB products sync scheduled every ${wbIntervalFor('products') / 60000} min, mode=${wbSettings.productsMode} (${key})`);
    }
    if (!bag.wbPricesTimer) {
      bag.wbPricesTimer = setInterval(runWbJob('prices', wbJobFor('prices')), wbIntervalFor('prices'));
      console.log(`[Worker] WB prices sync scheduled every ${wbIntervalFor('prices') / 60000} min, mode=${wbSettings.pricesMode} (${key})`);
    }
    if (!bag.wbStocksTimer) {
      bag.wbStocksTimer = setInterval(runWbJob('stocks', wbJobFor('stocks')), wbIntervalFor('stocks'));
      console.log(`[Worker] WB stocks sync scheduled every ${wbIntervalFor('stocks') / 60000} min, mode=${wbSettings.stocksMode} (${key})`);
    }
  } else {
    if (bag.wbProductsTimer) { clearInterval(bag.wbProductsTimer); bag.wbProductsTimer = undefined; }
    if (bag.wbPricesTimer) { clearInterval(bag.wbPricesTimer); bag.wbPricesTimer = undefined; }
    if (bag.wbStocksTimer) { clearInterval(bag.wbStocksTimer); bag.wbStocksTimer = undefined; }
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
