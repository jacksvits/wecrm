import { prisma } from '../lib/prisma.js';
import { processAutoReply } from '../lib/auto-reply.js';
import { postHandlerGreeting } from '../lib/handler-messages.js';
import { broadcast, CHANNELS } from '../lib/events.js';
import { resolveContactAuto } from '../lib/contact-dedup.js';
import { notifyTaskAssignees, notifyTaskCurators, notifyTaskCreator, notifyRoleUsers, formatExternalMessageNotifyBody, formatExternalNewTaskNotifyBody } from '../lib/notifications.js';
import { getDefaultTaskAssigneeIds, getDefaultTaskCuratorIds } from '../lib/task-defaults.js';
import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';

const UPLOAD_DIR = '/app/uploads';
const TASKS_DIR = path.join(UPLOAD_DIR, 'tasks');

// MIME-типы по расширению для вложений MAX (офисные и медиа-форматы)
const MIME_BY_EXT: Record<string, string> = {
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.gif': 'image/gif',
  '.bmp': 'image/bmp', '.webp': 'image/webp', '.tiff': 'image/tiff', '.heic': 'image/heic', '.svg': 'image/svg+xml',
  '.mp3': 'audio/mpeg', '.m4a': 'audio/mp4', '.wav': 'audio/wav', '.ogg': 'audio/ogg', '.amr': 'audio/amr',
  '.mp4': 'video/mp4', '.mov': 'video/quicktime', '.mkv': 'video/x-matroska', '.webm': 'video/webm', '.avi': 'video/x-msvideo',
  '.pdf': 'application/pdf',
  '.txt': 'text/plain', '.csv': 'text/csv', '.json': 'application/json', '.xml': 'application/xml',
  '.md': 'text/markdown', '.rtf': 'application/rtf',
  '.zip': 'application/zip', '.rar': 'application/vnd.rar', '.7z': 'application/x-7z-compressed',
  '.tar': 'application/x-tar', '.gz': 'application/gzip',
  '.doc': 'application/msword',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.xls': 'application/vnd.ms-excel',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  '.ppt': 'application/vnd.ms-powerpoint',
  '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
};
const MAX_API_BASE = 'https://platform-api2.max.ru';

if (!fs.existsSync(TASKS_DIR)) {
  fs.mkdirSync(TASKS_DIR, { recursive: true });
}

// Скачивает аватарку пользователя MAX на локальный сервер (в uploads),
// чтобы контакт не зависел от внешних ссылок MAX CDN
async function downloadMaxAvatar(url: string): Promise<string | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) {
      console.error('[MAX Processor] Avatar download HTTP', res.status, url);
      return null;
    }
    const buffer = await res.arrayBuffer();
    const ext = path.extname(new URL(url).pathname) || '.jpg';
    const filename = `${randomUUID()}${ext}`;
    const filepath = path.join(UPLOAD_DIR, filename);
    fs.writeFileSync(filepath, Buffer.from(buffer));
    console.log('[MAX Processor] Avatar saved to', filepath);
    return `/uploads/${filename}`;
  } catch (err) {
    console.error('[MAX Processor] Avatar download error:', err);
    return null;
  }
}

// Отправляет кнопку request_contact, чтобы клиент одним нажатием поделился номером телефона
async function sendMaxContactRequest(chatId: string, apiToken: string) {
  try {
    if (!apiToken) return;
    const response = await fetch(`${MAX_API_BASE}/messages?chat_id=${chatId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': apiToken,
      },
      body: JSON.stringify({
        text: 'Чтобы мы могли связаться с вами быстрее, отправьте, пожалуйста, свой номер телефона кнопкой ниже 👇',
        attachments: [
          {
            type: 'inline_keyboard',
            payload: {
              buttons: [[{ type: 'request_contact', text: '📱 Отправить номер телефона' }]],
            },
          },
        ],
      }),
    });
    if (!response.ok) {
      console.error('[MAX Processor] Contact request send failed:', response.status, await response.text());
    } else {
      console.log('[MAX Processor] Contact request sent to chat', chatId);
    }
  } catch (err) {
    console.error('[MAX Processor] Contact request send error:', err);
  }
}

export interface MaxMessage {
  id: string;
  chat_id: string;
  user_id: string;
  text: string;
  sender_name?: string;
  sender_username?: string;
  sender_avatar?: string;
  sender_description?: string;
  attachments?: any[];
}

export async function processMaxMessage(msg: MaxMessage, settings: any) {
  const existingTask = await prisma.task.findUnique({
    where: { maxMessageId: msg.id },
  });
  if (existingTask) {
    console.log('[MAX Processor] Msg already exists as task', existingTask.id);
    return;
  }

  const existingComment = await prisma.comment.findUnique({
    where: { maxMessageId: msg.id },
  });
  if (existingComment) {
    console.log('[MAX Processor] Msg already exists as comment', existingComment.id);
    return;
  }

  const chatId = msg.chat_id;
  const userId = msg.user_id;
  const text = msg.text || '';

  if (!text.trim() && (!msg.attachments || msg.attachments.length === 0)) {
    console.log('[MAX Processor] Msg has no text/attachments, skipping');
    return;
  }

  let contactId: string | undefined;
  const contact = await prisma.contact.findUnique({
    where: { maxChatId: chatId },
  });
  if (contact) {
    contactId = contact.id;
    console.log('[MAX Processor] Found contact', contactId, 'for MAX chat', chatId);

    // Обновляем данные контакта при каждом новом сообщении от MAX
    const updateData: any = {
      lastActivityTime: new Date(),
    };
    // Аватарку храним локально: скачиваем с CDN MAX, если её нет или она ещё внешняя
    if (msg.sender_avatar && (!contact.avatarUrl || contact.avatarUrl.startsWith('http'))) {
      const localAvatar = await downloadMaxAvatar(msg.sender_avatar);
      if (localAvatar) {
        updateData.avatarUrl = localAvatar;
      }
    }
    if (msg.sender_description !== undefined && msg.sender_description !== null) {
      updateData.description = msg.sender_description;
    }

    await prisma.contact.update({
      where: { id: contact.id },
      data: updateData,
    });
    console.log('[MAX Processor] Updated contact', contactId, 'avatar, description, lastActivityTime');
  } else if (settings.autoCreateContact) {
    const name = msg.sender_name || 'MAX ' + chatId;
    // Скачиваем аватарку из MAX и сохраняем локально
    let avatarUrl: string | null = null;
    if (msg.sender_avatar) {
      avatarUrl = await downloadMaxAvatar(msg.sender_avatar);
    }
    const resolved = await resolveContactAuto(
      { name },
      {
        name,
        maxChatId: chatId,
        maxUserId: userId,
        avatarUrl,
        description: msg.sender_description || null,
        lastActivityTime: new Date(),
        type: 'client',
        notes: 'Автоматически создан из сообщения MAX',
      },
    );
    contactId = resolved.contactId;
    console.log('[MAX Processor]', resolved.created ? 'Created contact' : 'Resolved existing contact', contactId, 'for MAX chat', chatId, ', avatar=', avatarUrl || 'none');

    // MAX не передаёт телефон в данных отправителя — просим номер кнопкой request_contact
    if (resolved.created) {
      await sendMaxContactRequest(chatId, settings.apiToken);
    }
  } else {
    console.log('[MAX Processor] No contact found for MAX chat', chatId, 'and autoCreateContact is disabled');
  }

  console.log('[MAX Processor] Looking for latest task for MAX chat', chatId);
  const latestTask = await prisma.task.findFirst({
    where: { maxChatId: chatId },
    orderBy: { createdAt: 'desc' },
  });

  const completedStatuses = ['win', 'cancelled'];
  const isCompleted = latestTask && completedStatuses.includes(latestTask.status);
  console.log('[MAX Processor] latestTask for MAX chat', chatId, ':', latestTask ? { id: latestTask.id, status: latestTask.status, isCompleted } : 'null');

  if (latestTask && !isCompleted) {
    console.log('[MAX Processor] Adding comment to active task', latestTask.id);
    const attachmentIds: string[] = [];
    if (msg.attachments && msg.attachments.length > 0) {
      const taskDir = path.join(TASKS_DIR, String(latestTask.ticketNumber || latestTask.id));
      if (!fs.existsSync(taskDir)) {
        fs.mkdirSync(taskDir, { recursive: true });
      }
      for (const att of msg.attachments) {
        const fileInfo = await downloadMaxAttachment(att, taskDir);
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
          console.error('[MAX Processor] Attachment lost for msg', msg.id, ': type', att?.type);
        }
      }
    }

    // Метку [N влож.] добавляем по факту сохранённых файлов — иначе при
    // ошибке скачивания в обсуждении остаётся «пустое» вложение
    let commentText = text;
    if (attachmentIds.length > 0) {
      commentText += ' [' + attachmentIds.length + ' влож.]';
    }

    const senderName = msg.sender_name || 'Клиент';
    const contactUrl = contactId ? `https://welans.cc/contacts/${contactId}` : null;
    const authorLink = contactUrl ? `[${senderName}](${contactUrl})` : senderName;
    const commentWithAuthor = commentText ? `${authorLink}:\n${commentText}` : '📎 Вложение из MAX';

    const comment = await prisma.comment.create({
      data: {
        content: commentWithAuthor,
        authorId: settings.defaultCreatorId || latestTask.creatorId,
        taskId: latestTask.id,
        maxMessageId: msg.id,
      },
    });

    // Автоответчик: проверка триггеров по тексту сообщения
    processAutoReply(latestTask.id, commentWithAuthor).catch(() => {});

    if (attachmentIds.length > 0) {
      await prisma.fileAttachment.updateMany({
        where: { id: { in: attachmentIds } },
        data: { entityId: comment.id },
      });
    }

    console.log('[MAX Processor] Comment added to task', latestTask.id, 'with', attachmentIds.length, 'attachments');
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
        const authorName = msg.sender_name || 'Клиент';
        const notifyPayload = {
          title: 'Новое сообщение из MAX',
          body: formatExternalMessageNotifyBody(authorName, taskForNotify, commentText),
          url: '/tasks/' + taskForNotify.id,
        };
        const excludeUserId = settings.defaultCreatorId || latestTask.creatorId;

        await notifyTaskAssignees(taskForNotify.id, notifyPayload, excludeUserId);
        await notifyTaskCurators(taskForNotify.id, notifyPayload, excludeUserId);
        await notifyTaskCreator(taskForNotify.id, notifyPayload);
        await notifyRoleUsers(['admin'], notifyPayload, excludeUserId);
        console.log('[MAX Processor] Notifications sent for task', latestTask.id);
      }
    } catch (notifyErr) {
      console.error('[MAX Processor] Failed to send notifications for task', latestTask.id, ':', notifyErr);
    }
  } else {
    const creatorId = settings.defaultCreatorId;
    if (!creatorId) {
      console.warn('[MAX Processor] No default creator configured, skipping message', msg.id);
      return;
    }

    console.log('[MAX Processor] Creating new task for MAX chat', chatId);
    try {
      // Исполнители/кураторы по умолчанию из настроек пользователей (как при ручном создании задачи)
      const defaultAssignees = await getDefaultTaskAssigneeIds();
      const defaultCurators = await getDefaultTaskCuratorIds();
      const mergedAssigneeIds = Array.from(new Set([...(settings.assigneeIds || []), ...defaultAssignees]));
      const task = await prisma.task.create({
        data: {
          title: text.slice(0, 100) || 'Сообщение из MAX',
          description: text,
          status: 'open',
          priority: 'medium',
          creatorId,
          contactId,
          maxChatId: chatId,
          maxUserId: userId,
          maxMessageId: msg.id,
          assignees: mergedAssigneeIds.length
            ? { create: mergedAssigneeIds.map((uid: string) => ({ userId: uid })) }
            : undefined,
          curators: defaultCurators.length
            ? { create: defaultCurators.map((uid: string) => ({ userId: uid })) }
            : undefined,
        },
      });

      console.log('[MAX Processor] Created task', task.id);
      postHandlerGreeting(task.id); // Обработчик: «Приветствие» в обсуждение новой задачи

      // Первое сообщение клиента дублируем в обсуждение новой задачи от контакта
      const senderName = msg.sender_name || 'Клиент';
      const contactUrl = contactId ? `https://welans.cc/contacts/${contactId}` : null;
      const authorLink = contactUrl ? `[${senderName}](${contactUrl})` : senderName;
      const firstMessageText = text ? `${authorLink}:\n${text}` : '📎 Вложение из MAX';
      const firstComment = await prisma.comment.create({
        data: {
          content: firstMessageText,
          authorId: creatorId,
          taskId: task.id,
          maxMessageId: msg.id,
        },
      });
      console.log('[MAX Processor] First message added to discussion of task', task.id);

      const taskDir = path.join(TASKS_DIR, String(task.ticketNumber || task.id));
      if (!fs.existsSync(taskDir)) {
        fs.mkdirSync(taskDir, { recursive: true });
      }

      const firstCommentAttachmentIds: string[] = [];
      if (msg.attachments && msg.attachments.length > 0) {
        for (const att of msg.attachments) {
          const fileInfo = await downloadMaxAttachment(att, taskDir);
          if (fileInfo) {
            const firstAttachment = await prisma.fileAttachment.create({
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
            firstCommentAttachmentIds.push(firstAttachment.id);
          } else {
            console.error('[MAX Processor] Attachment lost for msg', msg.id, ': type', att?.type);
          }
        }
        // Привязываем вложения к первому комментарию задачи,
        // иначе файлы остаются «pending» и не видны в обсуждении
        if (firstCommentAttachmentIds.length > 0) {
          await prisma.fileAttachment.updateMany({
            where: { id: { in: firstCommentAttachmentIds } },
            data: { entityId: firstComment.id },
          });
        }
      }

      await prisma.activity.create({
        data: {
          action: 'created_from_max',
          entity: 'task',
          entityId: task.id,
          userId: creatorId,
          details: 'Задача создана из сообщения MAX от ' + (msg.sender_name || chatId),
        },
      });

      console.log('[MAX Processor] Activity recorded for task', task.id);
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
          const authorName = msg.sender_name || 'Клиент';
          const notifyPayload = {
            title: 'Новая задача из MAX',
            body: formatExternalNewTaskNotifyBody(authorName, taskForNotify),
            url: '/tasks/' + taskForNotify.id,
          };

          await notifyTaskAssignees(taskForNotify.id, notifyPayload, creatorId);
          await notifyTaskCurators(taskForNotify.id, notifyPayload, creatorId);
          await notifyTaskCreator(taskForNotify.id, notifyPayload);
          await notifyRoleUsers(['admin'], notifyPayload, creatorId);
          console.log('[MAX Processor] Notifications sent for new task', task.id);
        }
      } catch (notifyErr) {
        console.error('[MAX Processor] Failed to send notifications for new task', task.id, ':', notifyErr);
      }
    } catch (createErr) {
      console.error('[MAX Processor] FAILED to create task:', createErr);
    }
  }
}

async function downloadMaxAttachment(attachment: any, taskDir: string): Promise<{ filename: string; originalName: string; mimeType: string; size: number; path: string } | null> {
  try {
    let url: string | null = null;
    let originalName = 'max_file';
    let ext = '';

    const payloadUrl = attachment?.payload?.url || attachment?.payload?.file_url || null;

    if (attachment.type === 'image' || attachment.type === 'photo') {
      url = payloadUrl || attachment.url || attachment.file_url;
      ext = '.jpg';
      originalName = 'max_photo_' + (attachment.id || 'unknown') + ext;
    } else if (attachment.type === 'document' || attachment.type === 'file') {
      url = payloadUrl || attachment.url || attachment.file_url;
      // В webhook MAX оригинальное имя файла приходит в поле filename (верхний уровень
      // вложения), а не в name/payload.name — иначе расширение терялось и файл
      // сохранялся с расширением .bin
      const rawName: string = attachment.filename || attachment.name || attachment.payload?.name || '';
      ext = path.extname(rawName);
      originalName = rawName || 'max_doc_' + (attachment.id || attachment.payload?.fileId || 'unknown') + (ext || '.bin');
    } else if (attachment.type === 'video') {
      console.log('[MAX Processor] Video attachment skipped');
      return null;
    } else if (attachment.type === 'audio' || attachment.type === 'voice') {
      url = payloadUrl || attachment.url || attachment.file_url;
      ext = '.mp3';
      originalName = 'max_audio_' + (attachment.id || 'unknown') + ext;
    } else if (attachment.type === 'sticker') {
      console.log('[MAX Processor] Sticker attachment skipped');
      return null;
    } else {
      console.log('[MAX Processor] Unknown attachment type:', attachment.type);
      return null;
    }

    if (!url) {
      console.log('[MAX Processor] No URL for attachment type:', attachment.type);
      return null;
    }

    const res = await fetch(url);
    if (!res.ok) {
      console.error('[MAX Processor] Download failed:', res.status, url);
      return null;
    }

    const buffer = await res.arrayBuffer();
    const size = buffer.byteLength;
    const filename = randomUUID() + ext;
    const filepath = path.join(taskDir, filename);
    fs.writeFileSync(filepath, Buffer.from(buffer));

    // MIME-тип: сначала из заголовка ответа CDN, иначе по расширению из таблицы
    const headerMime = res.headers.get('content-type')?.split(';')[0]?.trim() || '';
    const mimeType = headerMime && headerMime !== 'application/octet-stream'
      ? headerMime
      : (MIME_BY_EXT[ext.toLowerCase()] || 'application/octet-stream');

    return {
      filename,
      originalName,
      mimeType,
      size,
      path: '/uploads/tasks/' + path.basename(taskDir) + '/' + filename,
    };
  } catch (err) {
    console.error('[MAX Processor] downloadMaxAttachment error:', err);
    return null;
  }
}
