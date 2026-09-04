import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import { sendPushToUser } from '../lib/push.js';

const router = Router();
const MAX_API_BASE = 'https://platform-api2.max.ru';

const createSchema = z.object({
  content: z.string().min(1, 'Комментарий не может быть пустым').max(2000),
  attachmentIds: z.array(z.string()).optional(),
  isInternal: z.boolean().optional(),
});

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

          // Get file attachments for this comment
          const fileAttachments = await prisma.fileAttachment.findMany({
            where: { entityType: 'comment', entityId: comment.id },
          });

          // Append file links to message text
          if (fileAttachments.length > 0) {
            messageText += '\n\n📎 Вложения:';
            for (const file of fileAttachments) {
              const fileUrl = `https://welans.cc${file.path}`;
              messageText += `\n${file.originalName}: ${fileUrl}`;
            }
          }

          console.log('[MAX Comment Send] Sending to user_id:', task.maxUserId, 'text:', messageText.substring(0, 100));

          const response = await fetch(`${MAX_API_BASE}/messages?user_id=${task.maxUserId}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': maxSettings.apiToken,
            },
            body: JSON.stringify({
              text: messageText,
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
          const vkData = await vkResponse.json();

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

    res.json(comment);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/:taskId/comments', authMiddleware, async (req, res) => {
  try {
    const { taskId } = req.params;
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

router.delete('/:taskId/comments/:commentId', authMiddleware, async (req, res) => {
  try {
    const { commentId } = req.params;
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

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
