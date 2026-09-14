import { Router } from 'express';
import { z } from 'zod';
import fs from 'fs';
import path from 'path';
import { prisma } from '../lib/prisma.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import { broadcast, CHANNELS } from '../lib/events.js';
import { sendPushToUser } from '../lib/push.js';
import { processAutoReply } from '../lib/auto-reply.js';

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
// Для image/file токен возвращается в ответе на загрузку файла; для audio/video ответ — XML retval,
// поэтому для них берём token, полученный на первом шаге
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
    if (!uploadsRes.ok) {
      console.error('[MAX Comment Send] Uploads request failed:', uploadsRes.status, await uploadsRes.text());
      return null;
    }
    const uploadsInfo = await uploadsRes.json() as { url?: string; token?: string };
    if (!uploadsInfo.url) {
      console.error('[MAX Comment Send] No upload URL in /uploads response');
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
    if (!uploadRes.ok) {
      console.error('[MAX Comment Send] File upload failed:', uploadRes.status, await uploadRes.text());
      return null;
    }

    // Для image/file token приходит в ответе на загрузку; для audio/video — используем token из шага 1
    let token: string | null = null;
    try {
      const uploadData = await uploadRes.json() as { token?: string };
      token = uploadData?.token || null;
    } catch {
      token = null; // ответ не JSON (например, XML retval для audio/video)
    }
    return token || uploadsInfo.token || null;
  } catch (err: any) {
    console.error('[MAX Comment Send] uploadMaxAttachment error:', err.message);
    return null;
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
  if (role === 'admin') return true;
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

    // Create in-app notifications
    for (const userId of notifyUserIds) {
      try {
        await prisma.notification.create({
          data: {
            userId,
            type: 'comment',
            title: 'Новый комментарий',
            body: `${req.user!.name || 'Пользователь'} добавил комментарий к задаче "${task.title}"`,
            entityType: 'task',
            entityId: task.id,
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
          body: `${req.user!.name || 'Пользователь'} добавил комментарий к задаче "${task.title}"`,
          url: '/tasks/' + task.id,
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

          const response = await fetch(`${MAX_API_BASE}/messages?user_id=${task.maxUserId}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': maxSettings.apiToken,
            },
            body: JSON.stringify({
              text: messageText,
              ...(maxAttachments.length > 0 ? { attachments: maxAttachments } : {}),
            }),
          });

          const responseText = await response.text();
          if (!response.ok) {
            console.error('[MAX Comment Send] Failed:', response.status, responseText);
          } else {
            console.log('[MAX Comment Send] Sent to user', task.maxUserId, 'response:', responseText.substring(0, 100));
          }
        }
      } catch (err: any) {
        console.error('[MAX Comment Send] Error:', err.message);
      }
    }

    // ===== VK Group integration: send reply back to VK =====
    // Отправляем только если задача привязана к ВК и комментарий не внутренний
    if (task.vkPeerId && task.vkGroupId && !isInternal) {
      try {
        const vkSettings = await prisma.vkGroupSettings.findFirst({
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

          console.log('[VK Comment Send] Sending reply to peer', task.vkPeerId, 'text:', vkMessageText.substring(0, 100));

          const vkResponse = await fetch(vkUrl, { method: 'POST' });
          const vkData: any = await vkResponse.json();

          if (vkData.error) {
            console.error('[VK Comment Send] VK API error:', vkData.error.error_msg, '(code', vkData.error.error_code, ')');
          } else {
            console.log('[VK Comment Send] Sent successfully, msg_id:', vkData.response);
          }
        } else {
          console.log('[VK Comment Send] No active VK settings for group', task.vkGroupId);
        }
      } catch (vkErr: any) {
        console.error('[VK Comment Send] Error:', vkErr.message || vkErr);
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
