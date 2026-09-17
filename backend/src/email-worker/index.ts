import { ImapFlow, ImapFlowOptions, FetchMessageObject } from 'imapflow';
import { simpleParser } from 'mailparser';
import { prisma } from '../lib/prisma.js';
import { postHandlerGreeting } from '../lib/handler-messages.js';
import { normalizeEmailDescription, normalizeEmailDescriptionHtml } from '../lib/email-description.js';
import { notifyTaskAssignees, notifyTaskCurators, notifyTaskCreator, notifyRoleUsers } from '../lib/notifications.js';
import { sendPushToRoleUsers, sendPushToTaskAssignees, sendPushToTaskCurators } from '../lib/push.js';
import { getDefaultTaskAssigneeIds, getDefaultTaskCuratorIds } from '../lib/task-defaults.js';
import { broadcast, CHANNELS } from '../lib/events.js';
import { resolveContactAuto } from '../lib/contact-dedup.js';
import { applyEmailFilters } from '../lib/email-filters.js';
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
    } as ImapFlowOptions);
  }

  private async processInbox() {
    const client = this.createClient();
    await client.connect();
    const lock = await client.getMailboxLock('INBOX');

    try {
      const searchCriteria = { unseen: true };
      const uids = (await client.search(searchCriteria as Parameters<ImapFlow['search']>[0], { uid: true })) as number[] | false;

      if (!uids || uids.length === 0) {
        console.log('[EmailWorker] No new emails');
        return;
      }

      console.log(`[EmailWorker] Found ${uids.length} new email(s)`);

      for (const uid of uids) {
        const message = (await client.fetchOne(uid, { source: true }, { uid: true })) as FetchMessageObject;
        if (!message.source) {
          console.log(`[EmailWorker] Message ${uid} has no source, skipping`);
          continue;
        }

        const parsed = await simpleParser(message.source);
        const messageId = parsed.messageId || `fallback-${uid}`;
        const senderEmail = parsed.from?.value[0]?.address?.toLowerCase() || null;
        const senderName = parsed.from?.value[0]?.name || senderEmail || 'Неизвестный отправитель';
        const subject = parsed.subject || '';
        const allAttachments = parsed.attachments || [];

        // Фильтры писем: условия (отправитель/получатель/тема/тело/вложения) и действия
        const toField = parsed.to as any;
        const toAddresses = ((toField ? toField.value : []) as any[])
          .map((v: any) => (v.address || '').toLowerCase())
          .filter(Boolean);
        const decision = await applyEmailFilters({
          from: senderEmail || '',
          to: toAddresses,
          subject,
          body: parsed.text || '', // оригинальный регистр: сравнение и парсинг — внутри applyEmailFilters
          hasAttachments: allAttachments.some((a: any) => a.filename && a.content && a.content.length > 0),
        });

        const existing = await prisma.task.findUnique({
          where: { emailMessageId: messageId },
        });
        if (existing) {
          console.log(`[EmailWorker] Task already exists for message ${messageId}`);
          await this.markProcessed(client, uid, { folder: decision.moveToFolder, markSeen: decision.markRead });
          continue;
        }

        // Фильтр с действием «не создавать задачу»: письмо обрабатывается только по флагам/папке
        if (decision.matched && !decision.createTask) {
          console.log(`[EmailWorker] Filter "${decision.filterName}" ignored email from ${senderEmail}`);
          await this.markProcessed(client, uid, { folder: decision.moveToFolder, markSeen: decision.markRead });
          continue;
        }

        let priority = decision.priority || 'medium';
        if (!decision.priority) {
          if (subject.includes('#urgent')) priority = 'urgent';
          else if (subject.includes('#high')) priority = 'high';
          else if (subject.includes('#low')) priority = 'low';
        }

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
          const resolved = await resolveContactAuto(
            { email: senderEmail, name: senderName },
            {
              name: senderName,
              email: senderEmail,
              type: 'client',
              notes: `Автоматически создан из письма: ${cleanTitle}`,
            },
          );
          contactId = resolved.contactId;
          if (resolved.created) {
            console.log(`[EmailWorker] Created new contact ${contactId} for ${senderEmail}`);
          }
        }

        // Исполнители/кураторы по умолчанию из настроек пользователей (как при ручном создании задачи)
        const defaultAssignees = await getDefaultTaskAssigneeIds();
        const defaultCurators = await getDefaultTaskCuratorIds();
        // Действия фильтра: исполнители из фильтра имеют приоритет над дефолтными
        const assigneeIds = decision.assigneeIds.length ? decision.assigneeIds : defaultAssignees;
        // Статус из фильтра резолвим по справочнику статусов (как у parsed.status)
        let filterStatus: string | undefined;
        if (decision.status) {
          const statusRow = await prisma.status.findUnique({
            where: { entityType_name: { entityType: 'task', name: decision.status.toLowerCase() } },
          });
          if (statusRow) filterStatus = statusRow.name;
          else console.warn(`[EmailWorker] Filter status "${decision.status}" not found, keeping default`);
        }
        // Инлайн-картинки письма (contentId/cid): сохраняем на диск до создания
        // задачи, чтобы описание могло ссылаться на них по URL вместо cid:
        const inlineImages = (allAttachments as any[]).filter(
          (a: any) => a.contentId && a.content && a.content.length > 0
        );
        const inlineImagePaths = new Map<string, string>();
        let inlineImageRecords: { filename: string; originalName: string; mimeType: string; size: number; path: string }[] = [];
        if (inlineImages.length > 0) {
          const UPLOAD_DIR_IMAGES = '/app/uploads';
          const IMAGES_DIR = path.join(UPLOAD_DIR_IMAGES, 'comments');
          if (!fs.existsSync(IMAGES_DIR)) {
            fs.mkdirSync(IMAGES_DIR, { recursive: true });
          }
          for (const img of inlineImages) {
            const ext = path.extname(img.filename || '') || `.${(img.contentType || 'png').split('/')[1] || 'png'}`;
            const filename = `${randomUUID()}${ext}`;
            fs.writeFileSync(path.join(IMAGES_DIR, filename), img.content);
            const dbPath = `/uploads/comments/${filename}`;
            inlineImagePaths.set(String(img.contentId).replace(/^<|>$/g, ''), dbPath);
            inlineImageRecords.push({
              filename,
              originalName: img.filename || `inline-image${ext}`,
              mimeType: img.contentType || 'image/png',
              size: img.content.length,
              path: dbPath,
            });
          }
        }

        const htmlSource = typeof parsed.html === 'string' ? parsed.html : undefined;
        const description = htmlSource
          ? normalizeEmailDescriptionHtml(htmlSource, (cid) => inlineImagePaths.get(cid) || null)
          : normalizeEmailDescription(parsed.text, htmlSource);

        const task = await prisma.task.create({
          data: {
            title: cleanTitle,
            description,
            priority,
            status: filterStatus || 'open',
            projectId: decision.projectId,
            creatorId,
            contactId,
            emailMessageId: messageId,
            sourceEmail: senderEmail,
            assignees: assigneeIds.length
              ? { create: assigneeIds.map((uid) => ({ userId: uid })) }
              : undefined,
            curators: defaultCurators.length
              ? { create: defaultCurators.map((uid) => ({ userId: uid })) }
              : undefined,
          },
        });

        // Регистрируем инлайн-картинки как вложения задачи
        for (const rec of inlineImageRecords) {
          await prisma.fileAttachment.create({
            data: { ...rec, entityType: 'task', entityId: task.id, authorId: creatorId },
          });
        }

        // Применение правил парсинга тела письма (шаблон → поле задачи)
        if (decision.parsed) {
          const updateData: any = {};
          if (decision.parsed.title) updateData.title = decision.parsed.title;
          if (decision.parsed.description) {
            const current = task.description || '';
            updateData.description = current
              ? `${current}\n\n${decision.parsed.description}`
              : decision.parsed.description;
          }
          if (decision.parsed.address) updateData.address = decision.parsed.address;
          if (decision.parsed.priority) updateData.priority = decision.parsed.priority;
          if (decision.parsed.status) {
            const status = await prisma.status.findUnique({
              where: { entityType_name: { entityType: 'task', name: decision.parsed.status.toLowerCase() } },
            });
            if (status) updateData.status = status.name;
            else console.warn(`[EmailWorker] Parsed status "${decision.parsed.status}" not found, keeping default`);
          }
          if (Object.keys(updateData).length) {
            await prisma.task.update({ where: { id: task.id }, data: updateData });
            console.log(`[EmailWorker] Applied parsed fields to task ${task.id}: ${Object.keys(updateData).join(', ')}`);
          }

          // Распарсенные данные — отдельным сообщением в обсуждение задачи
          const parsedLines: string[] = [];
          if (decision.parsed.title) parsedLines.push(`Тема: ${decision.parsed.title}`);
          if (decision.parsed.address) parsedLines.push(`Адрес: ${decision.parsed.address}`);
          if (decision.parsed.priority) parsedLines.push(`Приоритет: ${decision.parsed.priority}`);
          if (decision.parsed.status) parsedLines.push(`Статус: ${decision.parsed.status}`);
          if (decision.parsed.description) parsedLines.push(decision.parsed.description);
          if (decision.parsed.discussion) parsedLines.push(decision.parsed.discussion);
          if (parsedLines.length) {
            await prisma.comment.create({
              data: {
                content: `📋 Данные из письма:\n${parsedLines.join('\n')}`,
                authorId: creatorId,
                taskId: task.id,
              },
            });
            console.log(`[EmailWorker] Posted parsed data to discussion of task ${task.id}`);
          }
        }

        postHandlerGreeting(task.id); // Обработчик: «Приветствие» в обсуждение новой задачи

        // Отправляем уведомления о новой задаче из письма (аналогично ручному созданию)
        try {
          const rolePayload = {
            title: 'Новая задача без исполнителя',
            body: `Создана задача из письма: ${cleanTitle}`,
            url: '/tasks/' + task.id,
          };
          // Push и in-app уведомления исполнителям и кураторам по умолчанию
          const assigneePayload = {
            title: 'Новая задача из письма',
            body: `Создана задача из письма: ${cleanTitle}`,
            url: '/tasks/' + task.id,
          };
          sendPushToTaskAssignees(task.id, assigneePayload, creatorId).catch(() => {});
          sendPushToTaskCurators(task.id, assigneePayload, creatorId).catch(() => {});
          await notifyTaskAssignees(task.id, assigneePayload, creatorId);
          await notifyTaskCurators(task.id, assigneePayload, creatorId);
          // Push уведомления админам и менеджерам
          sendPushToRoleUsers(['admin', 'manager'], rolePayload, 'task', creatorId).catch(() => {});
          // IN-APP уведомления админам и менеджерам (push отправлен отдельно выше)
          await notifyRoleUsers(['admin', 'manager'], rolePayload, creatorId, false);
          // Обновление списка задач в реальном времени
          broadcast(CHANNELS.TASKS, { action: 'create', entity: 'task', id: task.id });
          console.log(`[EmailWorker] Notifications sent for new task ${task.id}`);
        } catch (notifyErr) {
          console.error(`[EmailWorker] Failed to send notifications for task ${task.id}:`, notifyErr);
        }

        // Обработка вложений из письма: сохраняем на диск и создаём комментарий
        const hasRealAttachments = allAttachments.filter(
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
            const ext = path.extname(att.filename || '') || '';
            const filename = `${randomUUID()}${ext}`;
            const filePath = path.join(COMMENTS_DIR, filename);
            fs.writeFileSync(filePath, att.content);
            const dbPath = `/uploads/comments/${filename}`;

            const fileAtt = await prisma.fileAttachment.create({
              data: {
                filename,
                originalName: att.filename || 'attachment',
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

          // Отправляем уведомления о комментарии с вложениями
          try {
            const taskForNotify = await prisma.task.findUnique({
              where: { id: task.id },
              include: {
                assignees: { include: { user: true } },
                curators: { include: { user: true } },
                creator: true,
              },
            });
            if (taskForNotify) {
              const notifyPayload = {
                title: 'Новое вложение из email',
                body: `К задаче "${taskForNotify.title}" добавлено вложение из письма`,
                url: '/tasks/' + taskForNotify.id,
              };
              const excludeUserId = creatorId;
              await notifyTaskAssignees(taskForNotify.id, notifyPayload, excludeUserId);
              await notifyTaskCurators(taskForNotify.id, notifyPayload, excludeUserId);
              await notifyTaskCreator(taskForNotify.id, notifyPayload);
              await notifyRoleUsers(['admin'], notifyPayload, excludeUserId);
            }
          } catch (notifyErr) {
            console.error(`[EmailWorker] Failed to send comment notifications for task ${task.id}:`, notifyErr);
          }
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
   * Перемещает письмо в папку (folder фильтра или processedFolder по умолчанию) через messageMove.
   * markSeen: true — пометить \Seen, false — оставить непрочитанным (снять \Seen),
   * undefined — старое поведение: \Seen, если письмо осталось в INBOX после MOVE.
   */
  private async markProcessed(client: ImapFlow, uid: number, options?: { folder?: string; markSeen?: boolean }) {
    try {
      const folder = options?.folder ?? this.config.processedFolder;
      if (folder) {
        console.log(`[EmailWorker] Moving UID ${uid} to folder "${folder}"`);
        await client.messageMove(uid, folder, { uid: true });
        console.log(`[EmailWorker] UID ${uid} moved successfully`);
      }

      if (options?.markSeen === false) {
        // Оставить письмо непрочитанным
        try {
          await client.messageFlagsRemove(uid, ['\\Seen'], { uid: true });
          console.log(`[EmailWorker] UID ${uid} left unread`);
        } catch {
          // Флаг мог отсутствовать
        }
        return;
      }

      if (options?.markSeen === true) {
        try {
          await client.messageFlagsSet(uid, ['\\Seen'], { uid: true });
          console.log(`[EmailWorker] UID ${uid} marked as \\Seen`);
        } catch {
          // Игнорируем ошибки флагов
        }
        return;
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
