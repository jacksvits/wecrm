import { prisma } from '../lib/prisma.js';
import { uploadsRoot, tenantUploadPrefix } from '../lib/tenant.js';
import { processAutoReply } from '../lib/auto-reply.js';
import { postHandlerGreeting } from '../lib/handler-messages.js';
import { broadcast, CHANNELS } from '../lib/events.js';
import { notifyTaskAssignees, notifyTaskCurators, notifyTaskCreator, notifyRoleUsers, formatExternalMessageNotifyBody, formatExternalNewTaskNotifyBody } from '../lib/notifications.js';
import { getDefaultTaskAssigneeIds, getDefaultTaskCuratorIds } from '../lib/task-defaults.js';
import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';

// Директории текущего tenant'а (с префиксом /t-<slug>, см. lib/tenant.ts)

export interface VkMessage {
  id: number;
  date: number;
  peer_id: number;
  from_id: number;
  text: string;
  out?: number;
  attachments?: any[];
}

async function api(method: string, params: Record<string, any> = {}, accessToken: string) {
  const qs = new URLSearchParams({
    v: '5.199',
    access_token: accessToken,
    ...Object.fromEntries(Object.entries(params).map(([k, v]) => [k, String(v)])),
  });
  const url = `https://api.vk.com/method/${method}?${qs.toString()}`;
  const res = await fetch(url);
  const json: any = await res.json();
  if (json.error) {
    throw new Error(`VK API error: ${json.error.error_msg} (code ${json.error.error_code})`);
  }
  return json.response;
}

async function getUserInfo(userId: number, accessToken: string) {
  try {
    // Запрашиваем также фото профиля, чтобы сохранить аватарку контакта,
    // и дату рождения (bdate) — для автоподстановки в карточку контакта
    const res = await api('users.get', { user_ids: userId, fields: 'photo_200,bdate' }, accessToken);
    return res?.[0] || null;
  } catch {
    return null;
  }
}

// Парсит дату рождения из ВК (формат "D.M.YYYY", может приходить без года — "D.M").
// Возвращает Date (полночь UTC) только для полной даты; частичная дата — null
function parseVkBdate(bdate: string | undefined | null): Date | null {
  if (!bdate) return null;
  const parts = bdate.split('.').map((p) => parseInt(p, 10));
  if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) return null;
  const [day, month, year] = parts;
  if (day < 1 || day > 31 || month < 1 || month > 12 || year < 1900) return null;
  return new Date(Date.UTC(year, month - 1, day));
}

// Скачивает аватарку пользователя ВК на локальный сервер (в uploads),
// чтобы контакт не зависел от временных ссылок VK CDN
async function downloadVkAvatar(url: string): Promise<string | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) {
      console.error('[VK Processor] Avatar download HTTP', res.status, url);
      return null;
    }
    const buffer = await res.arrayBuffer();
    const ext = path.extname(new URL(url).pathname) || '.jpg';
    const filename = `${randomUUID()}${ext}`;
    const filepath = path.join(uploadsRoot(), filename);
    fs.writeFileSync(filepath, Buffer.from(buffer));
    console.log('[VK Processor] Avatar saved to', filepath);
    return `/uploads${tenantUploadPrefix()}/${filename}`;
  } catch (err) {
    console.error('[VK Processor] Avatar download error:', err);
    return null;
  }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// Дозапрашивает прямую ссылку на вложение через VK API, если она отсутствует
// в payload сообщения или скачивание по ней не удалось (временные ссылки ВК,
// транзиентные ошибки CDN). Используем access_key самого вложения.
async function resolveVkAttachmentUrl(attachment: any, accessToken: string): Promise<string | null> {
  try {
    const ownerId = attachment[attachment.type]?.owner_id;
    const id = attachment[attachment.type]?.id;
    const accessKey = attachment[attachment.type]?.access_key;
    if (!ownerId || !id) return null;
    const fullId = accessKey ? `${ownerId}_${id}_${accessKey}` : `${ownerId}_${id}`;

    if (attachment.type === 'photo') {
      const res = await api('photos.getById', { photos: fullId, photo_sizes: 1 }, accessToken);
      const photo = res?.[0];
      const sizes = photo?.sizes || [];
      const largest = sizes[sizes.length - 1];
      return largest?.url || photo?.max_size?.url || null;
    }
    if (attachment.type === 'doc') {
      const res = await api('docs.getById', { docs: fullId }, accessToken);
      return res?.[0]?.url || null;
    }
    if (attachment.type === 'audio') {
      const res = await api('audio.getById', { audios: fullId }, accessToken);
      return res?.[0]?.url || null;
    }
    return null;
  } catch (err) {
    console.error('[VK Processor] resolveVkAttachmentUrl error:', err);
    return null;
  }
}

async function downloadVkAttachment(
  attachment: any,
  taskDir: string,
  accessToken: string
): Promise<{ filename: string; originalName: string; mimeType: string; size: number; path: string } | null> {
  try {
    let url: string | null = null;
    let originalName = 'vk_file';
    let ext = '';

    if (attachment.type === 'photo') {
      const sizes = attachment.photo?.sizes || [];
      const largest = sizes[sizes.length - 1];
      url = largest?.url || attachment.photo?.max_size?.url;
      ext = '.jpg';
      originalName = `vk_photo_${attachment.photo?.id || 'unknown'}${ext}`;
    } else if (attachment.type === 'doc') {
      url = attachment.doc?.url;
      ext = path.extname(attachment.doc?.title || '') || '.bin';
      originalName = attachment.doc?.title || `vk_doc_${attachment.doc?.id || 'unknown'}${ext}`;
    } else if (attachment.type === 'video') {
      console.log('[VK Processor] Video attachment skipped');
      return null;
    } else if (attachment.type === 'audio') {
      url = attachment.audio?.url;
      ext = '.mp3';
      originalName = `${attachment.audio?.artist || 'unknown'} - ${attachment.audio?.title || 'unknown'}${ext}`;
    } else if (attachment.type === 'sticker') {
      console.log('[VK Processor] Sticker attachment skipped');
      return null;
    } else {
      console.log('[VK Processor] Unknown attachment type:', attachment.type);
      return null;
    }

    // Скачиваем с повторами: ссылки ВК/CDN периодически отдают транзиентные
    // ошибки — файл должен доехать, а не потеряться
    const attempts = 3;
    let buffer: ArrayBuffer | null = null;
    for (let attempt = 1; attempt <= attempts; attempt++) {
      if (!url) {
        console.log(`[VK Processor] No URL for ${attachment.type}, resolving via VK API (attempt ${attempt}/${attempts})`);
        url = await resolveVkAttachmentUrl(attachment, accessToken);
        if (!url) {
          console.error('[VK Processor] Could not resolve URL via VK API for attachment type:', attachment.type);
          return null;
        }
      }
      try {
        const res = await fetch(url);
        if (!res.ok) {
          console.error(`[VK Processor] Download failed (attempt ${attempt}/${attempts}): HTTP ${res.status}, type ${attachment.type}`);
          url = null; // следующая попытка — со свежей ссылкой из VK API
          if (attempt < attempts) await sleep(1500);
          continue;
        }
        buffer = await res.arrayBuffer();
        if (attempt > 1) {
          console.log(`[VK Processor] Download succeeded on attempt ${attempt}/${attempts}, type ${attachment.type}`);
        }
        break;
      } catch (fetchErr) {
        console.error(`[VK Processor] Download error (attempt ${attempt}/${attempts}), type ${attachment.type}:`, fetchErr);
        url = null;
        if (attempt < attempts) await sleep(1500);
      }
    }

    if (!buffer) {
      console.error('[VK Processor] All download attempts failed for attachment type:', attachment.type);
      return null;
    }

    const size = buffer.byteLength;
    console.log(`[VK Processor] Attachment downloaded: type ${attachment.type}, ${size} bytes`);
    const filename = `${randomUUID()}${ext}`;
    const filepath = path.join(taskDir, filename);
    fs.writeFileSync(filepath, Buffer.from(buffer));

    let mimeType = 'application/octet-stream';
    if (ext === '.jpg' || ext === '.jpeg') mimeType = 'image/jpeg';
    else if (ext === '.png') mimeType = 'image/png';
    else if (ext === '.gif') mimeType = 'image/gif';
    else if (ext === '.mp3') mimeType = 'audio/mpeg';
    else if (ext === '.pdf') mimeType = 'application/pdf';

    return { filename, originalName, mimeType, size, path: `/uploads${tenantUploadPrefix()}/tasks/${path.basename(taskDir)}/${filename}` };
  } catch (err) {
    console.error('[VK Processor] downloadVkAttachment error:', err);
    return null;
  }
}

export async function processVkMessage(msg: VkMessage, settings: any) {
  console.log('[VK Processor] Processing msg ' + msg.id + ' from peer ' + msg.peer_id);

  // Check if already processed as a task
  const existingTask = await prisma.task.findUnique({ where: { vkMessageId: msg.id } });
  if (existingTask) {
    console.log(`[VK Processor] Msg ${msg.id} already exists as task ${existingTask.id}`);
    return;
  }

  // Check if already processed as a comment
  const existingComment = await prisma.comment.findUnique({ where: { vkMessageId: msg.id } });
  if (existingComment) {
    console.log(`[VK Processor] Msg ${msg.id} already exists as comment ${existingComment.id}`);
    return;
  }

  const fromId = msg.peer_id;
  const text = msg.text || '';
  if (!text.trim() && (!msg.attachments || msg.attachments.length === 0)) {
    console.log(`[VK Processor] Msg ${msg.id} has no text/attachments, skipping`);
    return;
  }

  let contactId: string | undefined;
  const vkProfileUrl = `https://vk.com/id${fromId}`;
  const contact = await prisma.contact.findUnique({ where: { vkUserId: BigInt(fromId) } });
  if (contact) {
    contactId = contact.id;
    console.log(`[VK Processor] Found contact ${contactId} for VK user ${fromId}`);

    // Дозаполняем аватарку, ссылку на профиль ВК и дату рождения для ранее созданных контактов
    if (!contact.avatarUrl || !contact.vkProfileUrl || !contact.birthDate) {
      const userInfo = await getUserInfo(fromId, settings.accessToken);
      let avatarUrl = contact.avatarUrl;
      if (!avatarUrl && userInfo?.photo_200) {
        avatarUrl = await downloadVkAvatar(userInfo.photo_200);
      }
      const updated = await prisma.contact.update({
        where: { id: contact.id },
        data: {
          avatarUrl: avatarUrl || contact.avatarUrl,
          vkProfileUrl: contact.vkProfileUrl || vkProfileUrl,
          birthDate: contact.birthDate || parseVkBdate(userInfo?.bdate),
        },
      });
      console.log(`[VK Processor] Updated contact ${contactId}: avatar=${updated.avatarUrl || 'none'}, profile=${updated.vkProfileUrl}, birthDate=${updated.birthDate || 'none'}`);
    }
  } else if (settings.autoCreateContact) {
    const userInfo = await getUserInfo(fromId, settings.accessToken);
    const name = userInfo ? `${userInfo.first_name || ''} ${userInfo.last_name || ''}`.trim() : `VK ${fromId}`;
    // Скачиваем аватарку из ВК и сохраняем локально
    let avatarUrl: string | null = null;
    if (userInfo?.photo_200) {
      avatarUrl = await downloadVkAvatar(userInfo.photo_200);
    }
    const newContact = await prisma.contact.create({
      data: {
        name,
        vkUserId: BigInt(fromId),
        vkProfileUrl,
        avatarUrl,
        birthDate: parseVkBdate(userInfo?.bdate),
        type: 'client',
        notes: 'Автоматически создан из сообщения ВК группы',
      },
    });
    contactId = newContact.id;
    console.log(`[VK Processor] Created contact ${newContact.id} for VK user ${fromId}, avatar=${avatarUrl || 'none'}, birthDate=${newContact.birthDate || 'none'}`);
  } else {
    console.log(`[VK Processor] No contact found for VK user ${fromId} and autoCreateContact is disabled`);
  }

  console.log(`[VK Processor] Looking for latest task for peer ${fromId} group ${settings.groupId}`);
  const latestTask = await prisma.task.findFirst({
    where: {
      vkPeerId: BigInt(fromId),
      vkGroupId: settings.groupId,
    },
    orderBy: { createdAt: 'desc' },
  });
  const completedStatuses = ['win', 'cancelled'];
  const isCompleted = latestTask && completedStatuses.includes(latestTask.status);
  console.log(`[VK Processor] latestTask for peer ${fromId}:`, latestTask ? { id: latestTask.id, status: latestTask.status, isCompleted } : 'null');

  if (latestTask && !isCompleted) {
    // Active task exists — add comment
    console.log(`[VK Processor] Adding comment to active task ${latestTask.id}`);
    let commentText = text;
    if (msg.attachments && msg.attachments.length > 0) {
      commentText += ` [${msg.attachments.length} влож.]`;
    }

    const attachmentIds: string[] = [];
    if (msg.attachments && msg.attachments.length > 0) {
      const taskDir = path.join(uploadsRoot(), 'tasks', String(latestTask.ticketNumber || latestTask.id));
      if (!fs.existsSync(taskDir)) {
        fs.mkdirSync(taskDir, { recursive: true });
      }
      for (const att of msg.attachments) {
        const fileInfo = await downloadVkAttachment(att, taskDir, settings.accessToken);
        if (fileInfo) {
          const attachment = await prisma.fileAttachment.create({
            data: {
              filename: fileInfo.filename,
              originalName: fileInfo.originalName,
              mimeType: fileInfo.mimeType,
              size: fileInfo.size,
              path: fileInfo.path,
              entityType: 'comment',
              entityId: 'pending',
              authorId: settings.defaultCreatorId || latestTask.creatorId,
            },
          });
          attachmentIds.push(attachment.id);
        } else {
          console.error(`[VK Processor] Attachment lost for msg ${msg.id}: type ${att?.type}`);
        }
      }
    }

    const comment = await prisma.comment.create({
      data: {
        content: commentText || '📎 Вложение из ВК',
        authorId: settings.defaultCreatorId || latestTask.creatorId,
        taskId: latestTask.id,
        vkMessageId: msg.id,
      },
    });

    // Автоответчик: проверка триггеров по тексту сообщения
    processAutoReply(latestTask.id, commentText || '').catch(() => {});

    if (attachmentIds.length > 0) {
      await prisma.fileAttachment.updateMany({
        where: { id: { in: attachmentIds } },
        data: { entityId: comment.id },
      });
    }

    console.log(`[VK Processor] Comment added to task ${latestTask.id} for peer ${fromId} (msg ${msg.id}) with ${attachmentIds.length} attachments`);
    broadcast(CHANNELS.TASKS, { action: 'new_comment', entity: 'task', id: latestTask.id });
    broadcast(CHANNELS.COMMENTS, { action: 'new_comment', entity: 'task', id: latestTask.id });

    // Отправляем уведомления исполнителям, кураторам, создателю и админам
    try {
      const taskForNotify = await prisma.task.findUnique({
        where: { id: latestTask.id },
        include: {
          assignees: { include: { user: true } },
          curators: { include: { user: true } },
          creator: true,
        },
      });

      if (taskForNotify) {
        const authorName = contact?.name || `VK ${fromId}`;
        const notifyPayload = {
          title: 'Новое сообщение из ВК',
          body: formatExternalMessageNotifyBody(authorName, taskForNotify, commentText),
          url: '/tasks/' + taskForNotify.id,
        };
        const excludeUserId = settings.defaultCreatorId || latestTask.creatorId;

        await notifyTaskAssignees(taskForNotify.id, notifyPayload, excludeUserId);
        await notifyTaskCurators(taskForNotify.id, notifyPayload, excludeUserId);
        await notifyTaskCreator(taskForNotify.id, notifyPayload);
        await notifyRoleUsers(['admin'], notifyPayload, excludeUserId);
        console.log(`[VK Processor] Notifications sent for task ${latestTask.id}`);
      }
    } catch (notifyErr) {
      console.error(`[VK Processor] Failed to send notifications for task ${latestTask.id}:`, notifyErr);
    }
  } else {
    // Create new task
    const creatorId = settings.defaultCreatorId;
    if (!creatorId) {
      console.warn(`[VK Processor] No default creator configured, skipping message ${msg.id}`);
      return;
    }
    console.log(`[VK Processor] Creating new task for peer ${fromId}, contact ${contactId}, creator ${creatorId}`);
    try {
      // Исполнители/кураторы по умолчанию из настроек пользователей (как при ручном создании задачи)
      const defaultAssignees = await getDefaultTaskAssigneeIds();
      const defaultCurators = await getDefaultTaskCuratorIds();
      const mergedAssigneeIds = Array.from(new Set([...(settings.assigneeIds || []), ...defaultAssignees]));
      const task = await prisma.task.create({
        data: {
          title: text.slice(0, 100) || 'Сообщение из ВК',
          description: text,
          status: 'open',
          priority: 'medium',
          creatorId,
          projectId: settings.defaultProjectId || undefined,
          contactId,
          vkPeerId: BigInt(fromId),
          vkGroupId: settings.groupId,
          vkMessageId: msg.id,
          assignees: mergedAssigneeIds.length
            ? { create: mergedAssigneeIds.map((uid: string) => ({ userId: uid })) }
            : undefined,
          curators: defaultCurators.length
            ? { create: defaultCurators.map((uid: string) => ({ userId: uid })) }
            : undefined,
        },
      });
      console.log(`[VK Processor] Created task ${task.id} for peer ${fromId} (msg ${msg.id})`);
      postHandlerGreeting(task.id); // Обрабо «Приветствие» в обсуждение новой задачи

      // Первое сообщение клиента дублируем в обсуждение новой задачи от контакта
      const senderName = contact?.name || `VK ${fromId}`;
      const contactUrl = contactId ? `https://welans.cc/contacts/${contactId}` : null;
      const authorLink = contactUrl ? `[${senderName}](${contactUrl})` : senderName;
      const firstMessageText = text ? `${authorLink}:\n${text}` : '📎 Вложение из ВК';
      const firstComment = await prisma.comment.create({
        data: {
          content: firstMessageText,
          authorId: creatorId,
          taskId: task.id,
          vkMessageId: msg.id,
        },
      });
      console.log(`[VK Processor] First message added to discussion of task ${task.id}`);

      const taskDir = path.join(uploadsRoot(), 'tasks', String(task.ticketNumber || task.id));
      if (!fs.existsSync(taskDir)) {
        fs.mkdirSync(taskDir, { recursive: true });
      }

      if (msg.attachments && msg.attachments.length > 0) {
        const attachmentIds: string[] = [];
        for (const att of msg.attachments) {
          const fileInfo = await downloadVkAttachment(att, taskDir, settings.accessToken);
          if (fileInfo) {
            const attachment = await prisma.fileAttachment.create({
              data: {
                filename: fileInfo.filename,
                originalName: fileInfo.originalName,
                mimeType: fileInfo.mimeType,
                size: fileInfo.size,
                path: fileInfo.path,
                entityType: 'comment',
                entityId: 'pending',
                authorId: creatorId,
              },
            });
            attachmentIds.push(attachment.id);
          } else {
            console.error(`[VK Processor] Attachment lost for msg ${msg.id}: type ${att?.type}`);
          }
        }
        // Привязываем вложения к первому комментарию задачи,
        // иначе файлы остаются «pending» и не видны в обсуждении
        if (attachmentIds.length > 0) {
          await prisma.fileAttachment.updateMany({
            where: { id: { in: attachmentIds } },
            data: { entityId: firstComment.id },
          });
        }
      }

      await prisma.activity.create({
        data: {
          action: 'created_from_vk',
          entity: 'task',
          entityId: task.id,
          userId: creatorId,
          details: `Задача создана из сообщения ВК от ${fromId}`,
        },
      });
      console.log(`[VK Processor] Activity recorded for task ${task.id}`);
      broadcast(CHANNELS.TASKS, { action: 'create', entity: 'task', id: task.id });

      // Отправляем уведомления исполнителям, кураторам, создателю и админам о новой задаче
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
          const authorName = contact?.name || `VK ${fromId}`;
          const notifyPayload = {
            title: 'Новая задача из ВК',
            body: formatExternalNewTaskNotifyBody(authorName, taskForNotify),
            url: '/tasks/' + taskForNotify.id,
          };

          await notifyTaskAssignees(taskForNotify.id, notifyPayload, creatorId);
          await notifyTaskCurators(taskForNotify.id, notifyPayload, creatorId);
          await notifyTaskCreator(taskForNotify.id, notifyPayload);
          await notifyRoleUsers(['admin'], notifyPayload, creatorId);
          console.log(`[VK Processor] Notifications sent for new task ${task.id}`);
        }
      } catch (notifyErr) {
        console.error(`[VK Processor] Failed to send notifications for new task ${task.id}:`, notifyErr);
      }
    } catch (createErr) {
      console.error(`[VK Processor] FAILED to create task for peer ${fromId} msg ${msg.id}:`, createErr);
    }
  }
}
