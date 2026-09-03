import { ImapFlow } from 'imapflow';
import { simpleParser } from 'mailparser';
import { prisma } from '../lib/prisma.js';
import { randomUUID } from 'crypto';
import fs from 'fs';
import path from 'path';

interface EmailWorkerConfig {
  imapHost: string;
  imapPort: number;
  imapUser: string;
  imapPass: string;
  checkIntervalMs: number;
  processedFolder?: string;
  defaultCreatorId?: string;
  secure?: boolean;
  rejectUnauthorized?: boolean;
  requireTLS?: boolean;
}

/**
 * EmailWorker — сервис для создания задач из входящих писем по IMAP.
 *
 * Поддерживает два режима подключения:
 * - SSL/TLS (порт 993): secure=true
 * - STARTTLS (порт 143): secure=false, requireTLS=true
 */
export class EmailWorker {
  private config: EmailWorkerConfig;
  private timer?: NodeJS.Timeout;

  constructor(config: EmailWorkerConfig) {
    this.config = config;
  }

  async start() {
    console.log('[EmailWorker] Starting...');
    console.log(`[EmailWorker] Mode: ${this.config.secure !== false ? 'SSL/TLS' : 'STARTTLS'}, Host: ${this.config.imapHost}:${this.config.imapPort}`);
    await this.tick();
    this.timer = setInterval(() => this.tick(), this.config.checkIntervalMs);
  }

  stop() {
    if (this.timer) clearInterval(this.timer);
  }

  private async tick() {
    try {
      await this.processInbox();
    } catch (err) {
      console.error('[EmailWorker] Error:', err);
    }
  }

  private createClient(): ImapFlow {
    const secure = this.config.secure !== false;
    return new ImapFlow({
      host: this.config.imapHost,
      port: this.config.imapPort,
      secure,
      requireTLS: !secure && (this.config.requireTLS !== false),
      tls: {
        rejectUnauthorized: this.config.rejectUnauthorized !== false,
      },
      auth: { user: this.config.imapUser, pass: this.config.imapPass },
      logger: false,
    });
  }

  private async processInbox() {
    const client = this.createClient();
    await client.connect();
    const lock = await client.getMailboxLock('INBOX');

    try {
      const searchCriteria = { unseen: true };
      const uids = await client.search(searchCriteria, { uid: true });

      if (uids.length === 0) {
        console.log('[EmailWorker] No new emails');
        return;
      }

      console.log(`[EmailWorker] Found ${uids.length} new email(s)`);

      for (const uid of uids) {
        const message = await client.fetchOne(uid, { source: true }, { uid: true });
        if (!message.source) {
          console.log(`[EmailWorker] Message ${uid} has no source, skipping`);
          continue;
        }

        const parsed = await simpleParser(message.source);
        const messageId = parsed.messageId || `fallback-${uid}`;
        const senderEmail = parsed.from?.value[0]?.address?.toLowerCase() || null;
        const senderName = parsed.from?.value[0]?.name || senderEmail || 'Неизвестный отправитель';

        const existing = await prisma.task.findUnique({
          where: { emailMessageId: messageId },
        });
        if (existing) {
          console.log(`[EmailWorker] Task already exists for message ${messageId}`);
          await this.markProcessed(client, uid);
          continue;
        }

        let priority = 'medium';
        const subject = parsed.subject || '';
        if (subject.includes('#urgent')) priority = 'urgent';
        else if (subject.includes('#high')) priority = 'high';
        else if (subject.includes('#low')) priority = 'low';

        const cleanTitle = subject.replace(/#\w+/g, '').trim() || 'Задача из email';

        let creatorId = this.config.defaultCreatorId;
        if (senderEmail) {
          const user = await prisma.user.findUnique({
            where: { email: senderEmail },
          });
          if (user) creatorId = user.id;
        }

        if (!creatorId) {
          console.warn(`[EmailWorker] No default creator configured, skipping email from ${senderEmail}`);
          await this.markProcessed(client, uid);
          continue;
        }

        let contactId: string | undefined;
        if (senderEmail) {
          const existingContact = await prisma.contact.findFirst({
            where: { email: senderEmail },
          });
          if (existingContact) {
            contactId = existingContact.id;
          } else {
            const newContact = await prisma.contact.create({
              data: {
                name: senderName,
                email: senderEmail,
                type: 'client',
                notes: `Автоматически создан из письма: ${cleanTitle}`,
              },
            });
            contactId = newContact.id;
            console.log(`[EmailWorker] Created new contact ${newContact.id} for ${senderEmail}`);
          }
        }

        const task = await prisma.task.create({
          data: {
            title: cleanTitle,
            description: parsed.text || parsed.html || '',
            priority,
            status: 'open',
            creatorId,
            contactId,
            emailMessageId: messageId,
            sourceEmail: senderEmail,
          },
        });

        // Обработка вложений из письма: сохраняем на диск и создаём комментарий
        const attachments = parsed.attachments || [];
        const hasRealAttachments = attachments.filter(
          (a: any) => a.filename && a.content && a.content.length > 0
        );
        if (hasRealAttachments.length > 0) {
          const UPLOAD_DIR = '/app/uploads';
          const COMMENTS_DIR = path.join(UPLOAD_DIR, 'comments');
          if (!fs.existsSync(COMMENTS_DIR)) {
            fs.mkdirSync(COMMENTS_DIR, { recursive: true });
          }

          const attachmentIds: string[] = [];
          for (const att of hasRealAttachments) {
            const ext = path.extname(att.filename) || '';
            const filename = `${randomUUID()}${ext}`;
            const filePath = path.join(COMMENTS_DIR, filename);
            fs.writeFileSync(filePath, att.content);
            const dbPath = `/uploads/comments/${filename}`;

            const fileAtt = await prisma.fileAttachment.create({
              data: {
                filename,
                originalName: att.filename,
                mimeType: att.contentType || 'application/octet-stream',
                size: att.content.length,
                path: dbPath,
                entityType: 'comment',
                entityId: task.id, // временно привязываем к задаче, потом обновим на comment.id
                authorId: creatorId,
              },
            });
            attachmentIds.push(fileAtt.id);
          }

          // Создаём комментарий с вложениями
          const comment = await prisma.comment.create({
            data: {
              content: '📎 Вложение из письма',
              authorId: creatorId,
              taskId: task.id,
            },
          });

          // Обновляем entityId вложений на comment.id
          await prisma.fileAttachment.updateMany({
            where: { id: { in: attachmentIds } },
            data: { entityId: comment.id },
          });

          console.log(`[EmailWorker] Created comment with ${attachmentIds.length} attachment(s) for task ${task.id}`);
        }

        await prisma.activity.create({
          data: {
            action: 'created_from_email',
            entity: 'task',
            entityId: task.id,
            userId: creatorId,
            details: `Задача создана из письма от ${senderName} <${senderEmail || 'нет email'}>`,
          },
        });

        console.log(`[EmailWorker] Created task ${task.id}: "${cleanTitle}" from ${senderEmail}`);
        await this.markProcessed(client, uid);
      }
    } finally {
      lock.release();
      await client.logout();
    }
  }

  /**
   * Перемещает письмо в указанную папку через messageMove.
   * Если сервер не удаляет письмо из INBOX — помечает \Seen, чтобы остановить зацикливание.
   * Если папка не задана — помечает \Seen (не трогает папки).
   */
  private async markProcessed(client: ImapFlow, uid: number) {
    try {
      if (this.config.processedFolder) {
        console.log(`[EmailWorker] Moving UID ${uid} to folder "${this.config.processedFolder}"`);
        await client.messageMove(uid, this.config.processedFolder, { uid: true });
        console.log(`[EmailWorker] UID ${uid} moved successfully`);
      }

      // Проверяем, осталось ли письмо в INBOX (некоторые серверы не удаляют при MOVE)
      try {
        const stillThere = await client.fetchOne(uid, { uid: true }, { uid: true });
        if (stillThere) {
          console.log(`[EmailWorker] UID ${uid} still in INBOX, marking as \\Seen`);
          await client.messageFlagsSet(uid, ['\\Seen'], { uid: true });
          console.log(`[EmailWorker] UID ${uid} marked as \\Seen`);
        }
      } catch {
        // Письмо удалено из INBOX — это нормально
      }
    } catch (err: any) {
      console.error(`[EmailWorker] Failed to process UID ${uid}:`, err.message || err);
    }
  }
}
