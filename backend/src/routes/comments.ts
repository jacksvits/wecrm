import { Router } from 'express';
import { z } from 'zod';
import fs from 'fs';
import path from 'path';
import { prisma } from '../lib/prisma.js';
import { addTaskCommentToTicket } from '../lib/support-ticket-tasks.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import { broadcast, CHANNELS } from '../lib/events.js';
import { sendPushToUser } from '../lib/push.js';
import { processAutoReply } from '../lib/auto-reply.js';
import { telegramFetch, TELEGRAM_API_BASE } from '../lib/telegram-api.js';
import { htmlToText } from '../lib/html-to-text.js';

const router = Router();
const MAX_API_BASE = 'https://platform-api2.max.ru';
const UPLOAD_DIR = '/app/uploads';

// Возвращает абсолютный путь к загруженному файлу на диске по его публичному пути (/uploads/...)
function resolveUploadDiskPath(publicPath: string): string | null {
  if (!publicPath || !publicPath.startsWith('/uploads/')) return null;
  return path.join(UPLOAD_DIR, publicPath.slice('/uploads/'.length));
}

// Загружает файл в MAX Bot API и возвращает токен вложения.
// По документации (dev.max.ru) загрузка происходит в два шага:
//  1. POST /uploads?type={type} → получаем { url, token }
//  2. multipart POST на url (поле data) с содержимым файла
// Токен ищем в трёх местах: JSON ответа загрузки, поле token из шага 1,
// plain-text тело ответа загрузки (CDN MAX может вернуть токен простым текстом)
async function uploadMaxAttachment(
  file: { path: string; originalName: string; mimeType: string },
  type: 'image' | 'file' | 'audio' | 'video',
  apiToken: string,
): Promise<string | null> {
  try {
    const diskPath = resolveUploadDiskPath(file.path);
    if (!diskPath || !fs.existsSync(diskPath)) {
      console.error('[MAX Comment Send] File not found on disk:', file.path);
      return null;
    }

    // Шаг 1: получаем URL и token для загрузки
    const uploadsRes = await fetch(`${MAX_API_BASE}/uploads?type=${type}`, {
      method: 'POST',
      headers: { Authorization: apiToken },
    });
    const uploadsBody = await uploadsRes.text();
    if (!uploadsRes.ok) {
      console.error('[MAX Comment Send] Uploads request failed:', uploadsRes.status, uploadsBody.slice(0, 300));
      return null;
    }
    let uploadsInfo: { url?: string; token?: string };
    try {
      uploadsInfo = JSON.parse(uploadsBody);
    } catch {
      console.error('[MAX Comment Send] /uploads response is not JSON:', uploadsBody.slice(0, 300));
      return null;
    }
    if (!uploadsInfo.url) {
      console.error('[MAX Comment Send] No upload URL in /uploads response:', uploadsBody.slice(0, 300));
      return null;
    }

    // Шаг 2: загружаем файл мультипартом (поле data)
    const form = new FormData();
    form.append(
      'data',
      new Blob([fs.readFileSync(diskPath)], { type: file.mimeType || 'application/octet-stream' }),
      file.originalName || 'file',
    );
    const uploadRes = await fetch(uploadsInfo.url, { method: 'POST', body: form });
    const uploadBody = await uploadRes.text();
    if (!uploadRes.ok) {
      console.error('[MAX Comment Send] File upload failed:', uploadRes.status, uploadBody.slice(0, 300));
      return null;
    }

    // Токен: 1) JSON ответа загрузки (корневой token), 2) вложенный photos.<id>.token
    // (реальный формат CDN MAX при type=image), 3) token из шага 1 (для audio/video),
    // 4) plain-text тело ответа загрузки
    let token: string | null = null;
    try {
      const uploadData = JSON.parse(uploadBody) as {
        token?: string;
        photos?: Record<string, { token?: string }>;
      };
      token = uploadData?.token || null;
      if (!token && uploadData?.photos) {
        const firstPhoto = Object.values(uploadData.photos)[0];
        token = firstPhoto?.token || null;
      }
    } catch {
      token = null; // ответ не JSON
    }
    if (!token && uploadsInfo.token) {
      token = uploadsInfo.token; // для audio/video token приходит на шаге 1
    }
    if (!token) {
      const trimmed = uploadBody.trim();
      // Токен plain-text'ом (исключаем XML/JSON-подобные тела)
      if (trimmed && trimmed.length < 500 && !/[<>{}\[\]"]/.test(trimmed)) {
        token = trimmed;
      }
    }

    if (!token) {
      console.error('[MAX Comment Send] No token extracted. /uploads:', uploadsBody.slice(0, 300), '| upload:', uploadBody.slice(0, 300));
    }
    return token;
  } catch (err: any) {
    console.error('[MAX Comment Send] uploadMaxAttachment error:', err.message);
    return null;
  }
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Отправляет сообщение с вложениями в MAX, повторяя попытки при attachment.not.ready.
// CDN MAX обрабатывает загруженные файлы асинхронно: если отправить вложение сразу
// после загрузки, API отвечает 400 attachment.not.ready. Повторная отправка безопасна —
// отклонённое сообщение не создаётся, токен вложения сохраняется.
async function sendMaxCommentMessage(
  userId: string,
  text: string,
  attachments: any[],
  apiToken: string,
): Promise<boolean> {
  const retryDelays = [1000, 2000, 4000, 8000, 8000]; // суммарно ~23 с ожидания
  for (let attempt = 0; ; attempt++) {
    const response = await fetch(`${MAX_API_BASE}/messages?user_id=${userId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': apiToken,
      },
      body: JSON.stringify({
        text,
        ...(attachments.length > 0 ? { attachments } : {}),
      }),
    });

    const responseText = await response.text();
    if (response.ok) {
      console.log('[MAX Comment Send] Sent to user', userId, 'response:', responseText.substring(0, 100));
      return true;
    }
    const notReady = response.status === 400 && responseText.includes('attachment.not.ready');
    if (!notReady || attempt >= retryDelays.length) {
      console.error('[MAX Comment Send] Failed:', response.status, responseText);
      return false;
    }
    console.log('[MAX Comment Send] Attachment not ready, retry in', retryDelays[attempt], 'ms, attempt', attempt + 2);
    await sleep(retryDelays[attempt]);
  }
}

const createSchema = z.object({
  content: z.string().min(1, 'Комментарий не может быть пустым').max(2000),
  attachmentIds: z.array(z.string()).optional(),
  isInternal: z.boolean().optional(),
});

// Проверка доступа к задаче: админ, создатель, исполнители и кураторы
// (аналог canAccessTask из routes/tasks.ts — локальная копия, чтобы не тащить весь роутер)
const canAccessTask = async (taskId: string, userId: string, role: string) => {
  if (role === 'admin' || role === 'developer') return true;
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    select: {
      creatorId: true,
      assignees: { select: { userId: true } },
      curators: { select: { userId: true } },
    },
  });
  if (!task) return false;
  if (task.creatorId === userId) return true;
  if (task.assignees.some(a => a.userId === userId)) return true;
  if (task.curators.some(c => c.userId === userId)) return true;
  return false;
};

router.post('/:taskId/comments', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { taskId } = req.params;
    const { content, attachmentIds, isInternal } = createSchema.parse(req.body);

    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        assignees: { include: { user: true } },
        curators: { include: { user: true } },
        creator: true,
      },
    });

    if (!task) {
      return res.status(404).json({ error: 'Задача не найдена' });
    }

    // Доступ к обсуждению = доступ к задаче (админ, создатель, исполнители, кураторы)
    const hasAccess = await canAccessTask(taskId, req.user!.id, req.user!.role);
    if (!hasAccess) {
      return res.status(403).json({ error: 'Доступ запрещен' });
    }

    const comment = await prisma.comment.create({
      data: {
        content,
        authorId: req.user!.id,
        taskId,
        isInternal: isInternal || false,
      },
      include: {
        author: { select: { id: true, name: true, avatar: true } },
      },
    });

    // Handle attachments
    if (attachmentIds && attachmentIds.length > 0) {
      await prisma.fileAttachment.updateMany({
        where: { id: { in: attachmentIds } },
        data: { entityId: comment.id },
      });
    }

    // Задача привязана к запросу организации — дублируем комментарий в тикет (внешним клиентам)
    if (!isInternal) {
      try {
        await addTaskCommentToTicket(taskId, req.user!.name || 'Поддержка WeCRM', content);
      } catch (e: any) {
        console.error('[comments] → ticket:', e.message);
      }
    }

    // Send push notifications to assignees, curators, creator and admins
    const notifyUserIds = new Set<string>();
    task.assignees.forEach(a => notifyUserIds.add(a.userId));
    task.curators.forEach(c => notifyUserIds.add(c.userId));
    notifyUserIds.add(task.creatorId);
    
    // Add admins to notifications
    const admins = await prisma.user.findMany({
      where: {
        role: { name: 'admin' },
      },
      select: { id: true },
    });
    admins.forEach(a => notifyUserIds.add(a.id));
    
    notifyUserIds.delete(req.user!.id);

    // Обрезаем длинный текст комментария для уведомления
    const commentPreview = content.length > 200 ? `${content.slice(0, 200)}…` : content;
    // Ссылка на обсуждение задачи с якорем к комментарию
    const commentUrl = `/tasks/${task.id}#comment-${comment.id}`;

    // Create in-app notifications
    for (const userId of notifyUserIds) {
      try {
        await prisma.notification.create({
          data: {
            userId,
            type: 'comment',
            title: 'Новый комментарий',
            body: `${req.user!.name || 'Пользователь'}: ${commentPreview}`,
            entityType: 'task',
            entityId: task.id,
            url: commentUrl,
          },
        });
      } catch (e) {
        console.error('Failed to create notification:', e);
      }
    }

    // Send push notifications to assignees, curators and creator
    for (const userId of notifyUserIds) {
      try {
        await sendPushToUser(userId, {
          title: 'Новый комментарий',
          body: `${req.user!.name || 'Пользователь'}: ${commentPreview}`,
          url: commentUrl,
        }, 'comment');
      } catch (e) {
        console.error('Failed to send push notification:', e);
      }
    }

    // Send to MAX if task has maxUserId and comment is not internal
    // Format per MAX docs: user_id as query param, body has only message (no recipient)
    if (task.maxUserId && !isInternal) {
      try {
        const maxSettings = await prisma.maxSettings.findFirst();
        if (maxSettings?.isActive && maxSettings?.apiToken) {
          const authorName = req.user!.name || 'Сотрудник';
          let messageText = `${authorName}:\n${content}`;

          // Вложения комментария
          const fileAttachments = await prisma.fileAttachment.findMany({
            where: { entityType: 'comment', entityId: comment.id },
          });

          // Загружаем файлы в MAX и отправляем настоящими вложениями — контакт получает файл, а не ссылку
          const maxAttachments: any[] = [];
          const failedFiles: typeof fileAttachments = [];
          for (const file of fileAttachments) {
            const maxType = file.mimeType?.startsWith('image/')
              ? 'image'
              : file.mimeType?.startsWith('audio/')
                ? 'audio'
                : file.mimeType?.startsWith('video/')
                  ? 'video'
                  : 'file';
            const token = await uploadMaxAttachment(file, maxType, maxSettings.apiToken);
            if (token) {
              maxAttachments.push({ type: maxType, payload: { token } });
            } else {
              // Загрузка не удалась — отправим ссылку, чтобы файл не потерялся
              failedFiles.push(file);
            }
          }

          // Ссылки добавляем только для файлов, которые не удалось загрузить как вложения
          if (failedFiles.length > 0) {
            messageText += '\n\n📎 Вложения:';
            for (const file of failedFiles) {
              const fileUrl = `https://welans.cc${file.path}`;
              messageText += `\n${file.originalName}: ${fileUrl}`;
            }
          }

          console.log('[MAX Comment Send] Sending to user_id:', task.maxUserId, 'text:', messageText.substring(0, 100), 'attachments:', maxAttachments.length);

          // Пауза после загрузки: CDN MAX обрабатывает файл асинхронно,
          // sendMaxCommentMessage дожидается готовности вложения через ретраи
          if (maxAttachments.length > 0) {
            await sleep(500);
          }
          await sendMaxCommentMessage(task.maxUserId, messageText, maxAttachments, maxSettings.apiToken);
        }
      } catch (err: any) {
        console.error('[MAX Comment Send] Error:', err.message);
      }
    }

    // ===== VK Group integration: send reply back to VK =====
    // Отправляем только если задача привязана к ВК и комментарий не внутренний
    if (task.vkPeerId && task.vkGroupId && !isInternal) {
      try {
        const vkSettings = await prisma.vkCommunitySettings.findFirst({
          where: { groupId: task.vkGroupId, isActive: true },
        });

        if (vkSettings?.accessToken) {
          const authorName = req.user!.name || 'Сотрудник';
          let vkMessageText = `${authorName}:\n${content}`;

          // Добавляем ссылки на вложения, если есть
          const fileAttachments = await prisma.fileAttachment.findMany({
            where: { entityType: 'comment', entityId: comment.id },
          });

          if (fileAttachments.length > 0) {
            vkMessageText += '\n\n📎 Вложения:';
            for (const file of fileAttachments) {
              const fileUrl = `https://welans.cc${file.path}`;
              vkMessageText += `\n${file.originalName}: ${fileUrl}`;
            }
          }

          const randomId = Date.now() + Math.floor(Math.random() * 1000);
          const vkUrl = `https://api.vk.com/method/messages.send?peer_id=${task.vkPeerId}&message=${encodeURIComponent(vkMessageText)}&random_id=${randomId}&access_token=${vkSettings.accessToken}&v=5.199`;

          console.log('[VK Community Comment Send] Sending reply to peer', task.vkPeerId, 'text:', vkMessageText.substring(0, 100));

          const vkResponse = await fetch(vkUrl, { method: 'POST' });
          const vkData: any = await vkResponse.json();

          if (vkData.error) {
            console.error('[VK Community Comment Send] VK API error:', vkData.error.error_msg, '(code', vkData.error.error_code, ')');
          } else {
            console.log('[VK Community Comment Send] Sent successfully, msg_id:', vkData.response);
            // Запоминаем id сообщения ВК: воркер импортирует исходящие (out = 1),
            // без пометки ответ продублировался бы в обсуждении
            try {
              const vkMsgId = Array.isArray(vkData.response) ? vkData.response[0] : vkData.response;
              if (typeof vkMsgId === 'number') {
                await prisma.comment.update({ where: { id: comment.id }, data: { vkMessageId: vkMsgId } });
              }
            } catch (e: any) {
              console.error('[VK Community Comment Send] Failed to store vkMessageId:', e?.message || e);
            }
          }
        } else {
          console.log('[VK Community Comment Send] No active VK settings for group', task.vkGroupId);
        }
      } catch (vkErr: any) {
        console.error('[VK Community Comment Send] Error:', vkErr.message || vkErr);
      }
    }
    // ======================================================

    // ===== Telegram integration: send reply back to the client's chat =====
    // Отправляем только если задача создана из Telegram и комментарий не внутренний
    if (task.telegramChatId && !isInternal) {
      try {
        const tgSettings = await prisma.telegramSettings.findFirst();
        if (tgSettings?.isActive && tgSettings.botToken) {
          const authorName = req.user!.name || 'Сотрудник';
          // content приходит в HTML из WYSIWYG — приводим к читаемому тексту
          let tgMessageText = `${authorName}:\n${htmlToText(content)}`;

          const fileAttachments = await prisma.fileAttachment.findMany({
            where: { entityType: 'comment', entityId: comment.id },
          });

          if (fileAttachments.length > 0) {
            tgMessageText += '\n\n📎 Вложения:';
            for (const file of fileAttachments) {
              tgMessageText += `\n${file.originalName}: https://welans.cc${file.path}`;
            }
          }

          console.log('[Telegram Comment Send] Sending to chat_id:', task.telegramChatId, 'text:', tgMessageText.substring(0, 100));

          const tgResponse = await telegramFetch(`${TELEGRAM_API_BASE}${tgSettings.botToken}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: task.telegramChatId,
              text: tgMessageText,
            }),
          });

          const tgData: any = await tgResponse.json();
          if (!tgData.ok) {
            console.error('[Telegram Comment Send] Failed:', tgData.description);
          } else {
            console.log('[Telegram Comment Send] Sent to chat', task.telegramChatId);
          }
        }
      } catch (tgErr: any) {
        console.error('[Telegram Comment Send] Error:', tgErr.message || tgErr);
      }
    }
    // ======================================================

    // Real-time broadcast for new comment
    broadcast(CHANNELS.COMMENTS, { action: 'new_comment', entity: 'task', id: taskId, comment });

    // Автоответчик: проверка триггеров по тексту комментария (не для внутренних)
    if (!comment.isInternal) {
      processAutoReply(taskId, content);
    }

    res.json(comment);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/:taskId/comments', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { taskId } = req.params;
    // Доступ к обсуждению = доступ к задаче
    const hasAccess = await canAccessTask(taskId, req.user!.id, req.user!.role);
    if (!hasAccess) {
      return res.status(403).json({ error: 'Доступ запрещен' });
    }
    const comments = await prisma.comment.findMany({
      where: { taskId },
      include: {
        author: { select: { id: true, name: true, avatar: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
    res.json(comments);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/:taskId/comments/:commentId/pin', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { taskId, commentId } = req.params;
    // Закреплять/откреплять можно участникам обсуждения (тем же, кто видит задачу)
    const hasAccess = await canAccessTask(taskId, req.user!.id, req.user!.role);
    if (!hasAccess) {
      return res.status(403).json({ error: 'Доступ запрещен' });
    }

    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      select: { id: true, taskId: true, pinnedAt: true },
    });
    if (!comment || comment.taskId !== taskId) {
      return res.status(404).json({ error: 'Комментарий не найден' });
    }

    const updated = await prisma.comment.update({
      where: { id: commentId },
      data: { pinnedAt: comment.pinnedAt ? null : new Date() },
      include: {
        author: { select: { id: true, name: true, avatar: true } },
      },
    });
    const attachments = await prisma.fileAttachment.findMany({
      where: { entityType: 'comment', entityId: commentId },
      select: { id: true, originalName: true, mimeType: true, size: true, path: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    });
    const updatedWithAttachments = { ...updated, attachments };

    // Real-time broadcast: обновляем закрепление без полной перезагрузки задачи
    broadcast(CHANNELS.COMMENTS, { action: 'update_comment', entity: 'task', id: taskId, comment: updatedWithAttachments });

    res.json(updatedWithAttachments);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:taskId/comments/:commentId', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { taskId, commentId } = req.params;
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      return res.status(404).json({ error: 'Комментарий не найден' });
    }

    if (comment.authorId !== req.user!.id) {
      return res.status(403).json({ error: 'Нет прав на удаление' });
    }

    await prisma.comment.delete({
      where: { id: commentId },
    });

    // Real-time broadcast об удалении комментария
    broadcast(CHANNELS.COMMENTS, { action: 'delete_comment', entity: 'task', id: taskId, commentId });

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
