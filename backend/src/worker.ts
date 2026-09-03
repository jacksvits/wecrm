import dotenv from 'dotenv';
dotenv.config();

import { EmailWorker } from './email-worker/index.js';
import { VkGroupWorker } from './vk-worker/index.js';
import { prisma } from './lib/prisma.js';

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

  try {
    // --- Email Worker ---
    const emailSettings = await prisma.emailSettings.findFirst();
    if (emailSettings && emailSettings.isActive) {
      const emailWorker = new EmailWorker({
        imapHost: emailSettings.imapHost,
        imapPort: emailSettings.imapPort,
        imapUser: emailSettings.imapUser,
        imapPass: emailSettings.imapPass,
        checkIntervalMs: emailSettings.checkIntervalMs,
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

    if (workers.length === 0) {
      console.log('[Worker] No active workers found. Exiting gracefully.');
      process.exit(0);
    }

    process.on('SIGINT', () => {
      console.log('[Worker] Shutting down gracefully...');
      workers.forEach((w) => w.stop());
      process.exit(0);
    });

    process.on('SIGTERM', () => {
      console.log('[Worker] SIGTERM received, shutting down...');
      workers.forEach((w) => w.stop());
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
