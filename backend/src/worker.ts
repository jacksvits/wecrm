import dotenv from 'dotenv';
dotenv.config();

import { EmailWorker } from './email-worker/index.js';
import { VkGroupWorker } from './vk-worker/index.js';
import { prisma } from './lib/prisma.js';
import { runOneCSync } from './lib/onec-sync.js';

/**
 * Entry-point для worker-контейнера.
 *
 * Запускается как отдельный процесс (не HTTP-сервер).
 * Поддерживает несколько интеграций: IMAP (email) и VK Group (Long Poll).
 * Каждый воркер стартует только если есть активные настройки в БД.
 */

async function main() {
  console.log('[Worker] Starting workers...');

  const workers: any[] = [];
  const timers: NodeJS.Timeout[] = [];

  try {
    // --- Email Worker ---
    const emailSettings = await prisma.emailSettings.findFirst();
    if (emailSettings && emailSettings.isActive) {
      const emailWorker = new EmailWorker({
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
      });
      workers.push(emailWorker);
      await emailWorker.start();
      console.log('[Worker] Email worker started');
    } else {
      console.log('[Worker] Email worker disabled (no active settings)');
    }

    // --- VK Group Worker ---
    const vkSettings = await prisma.vkGroupSettings.findFirst();
    if (vkSettings && vkSettings.isActive) {
      const vkWorker = new VkGroupWorker();
      workers.push(vkWorker);
      await vkWorker.start();
      console.log('[Worker] VK Group worker started');
    } else {
      console.log('[Worker] VK Group worker disabled (no active settings)');
    }

    // --- 1С УТ 8.3 sync ---
    const onecSettings = await prisma.oneCPluginSettings.findFirst();
    let onecTimer: NodeJS.Timeout | null = null;
    if (onecSettings?.isActive && onecSettings.serviceUrl) {
      const runOneCSyncJob = async () => {
        try {
          await runOneCSync();
          console.log('[Worker] 1C sync done');
        } catch (e: any) {
          console.error('[Worker] 1C sync error:', e.message);
        }
      };
      await runOneCSyncJob();
      onecTimer = setInterval(runOneCSyncJob, Math.max(5, onecSettings.syncIntervalMinutes) * 60 * 1000);
      timers.push(onecTimer);
      console.log('[Worker] 1C sync scheduled');
    } else {
      console.log('[Worker] 1C sync disabled (no active settings)');
    }

    if (workers.length === 0 && !onecTimer) {
      console.log('[Worker] No active workers found. Exiting gracefully.');
      process.exit(0);
    }

    process.on('SIGINT', () => {
      console.log('[Worker] Shutting down gracefully...');
      workers.forEach((w) => w.stop());
      timers.forEach(clearInterval);
      process.exit(0);
    });

    process.on('SIGTERM', () => {
      console.log('[Worker] SIGTERM received, shutting down...');
      workers.forEach((w) => w.stop());
      timers.forEach(clearInterval);
      process.exit(0);
    });
  } catch (err) {
    console.error('[Worker] Fatal error during startup:', err);
    process.exit(0);
  }
}

main().catch((err) => {
  console.error('[Worker] Unhandled error:', err);
  process.exit(0);
});
