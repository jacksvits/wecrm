import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import { sendPushToAllUsers, sendPushToUser } from '../lib/push.js';
import { broadcast, broadcastToUsers } from '../lib/events.js';

const router = Router();
router.use(authMiddleware);

const createSchema = z.object({
  content: z.string().min(1, 'Сообщение не может быть пустым').max(2000),
  replyToId: z.string().optional(),
  recipientIds: z.array(z.string()).optional(),
  attachmentIds: z.array(z.string()).optional(),
});

// Получить последние 50 сообщений (с пагинацией по курсору через afterId)
// Показываем: общие сообщения (без получателей) + личные для текущего пользователя
router.get('/', async (req: AuthRequest, res) => {
  const { afterId } = req.query;
  const userId = req.user!.id;

  const messages = await prisma.chatMessage.findMany({
    where: afterId
      ? {
          id: { gt: afterId as string },
          deletedAt: null,
          OR: [
            { recipients: { none: {} } },
            { recipients: { some: { userId } } },
            { authorId: userId, recipients: { some: {} } },
          ],
        }
      : {
          deletedAt: null,
          OR: [
            { recipients: { none: {} } },
            { recipients: { some: { userId } } },
            { authorId: userId, recipients: { some: {} } },
          ],
        },
    include: {
      author: { select: { id: true, name: true, avatar: true } },
      replyTo: { include: { author: { select: { id: true, name: true } } } },
      recipients: { include: { user: { select: { id: true, name: true } } } },
      reactions: { include: { user: { select: { id: true, name: true } } } },
    },
    orderBy: { createdAt: 'asc' },
    take: 50,
  });

  const messageIds = messages.map(m => m.id);
  const attachments = await prisma.fileAttachment.findMany({
    where: { entityType: 'chat', entityId: { in: messageIds } },
    select: { id: true, originalName: true, mimeType: true, size: true, path: true, createdAt: true, entityId: true },
    orderBy: { createdAt: 'asc' },
  });

  const withAttachments = messages.map(m => ({
    ...m,
    attachments: attachments.filter(a => a.entityId === m.id),
  }));

  res.json(withAttachments);
});

// Отправить сообщение
router.post('/', async (req: AuthRequest, res) => {
  try {
    const { content, replyToId, recipientIds, attachmentIds } = createSchema.parse(req.body);

    const message = await prisma.chatMessage.create({
      data: {
        content,
        authorId: req.user!.id,
        replyToId: replyToId || null,
        recipients: recipientIds && recipientIds.length > 0
          ? { create: recipientIds.map(uid => ({ userId: uid })) }
          : undefined,
      },
      include: {
        author: { select: { id: true, name: true, avatar: true } },
        replyTo: { include: { author: { select: { id: true, name: true } } } },
        recipients: { include: { user: { select: { id: true, name: true } } } },
        reactions: { include: { user: { select: { id: true, name: true } } } },
      },
    });

    // Привязываем вложения к сообщению чата
    if (attachmentIds && attachmentIds.length > 0) {
      await prisma.fileAttachment.updateMany({
        where: { id: { in: attachmentIds }, entityType: 'chat' },
        data: { entityId: message.id },
      });
    }

    // Получаем вложения для ответа
    const messageAttachments = await prisma.fileAttachment.findMany({
      where: { entityType: 'chat', entityId: message.id },
      include: { author: { select: { id: true, name: true, avatar: true } } },
    });

    const messageWithAttachments = { ...message, attachments: messageAttachments };

    // Отправляем push-уведомления всем для общих сообщений (без получателей)
    const isGeneralMessage = !recipientIds || recipientIds.length === 0;
    if (isGeneralMessage) {
      const authorName = message.author?.name || 'Пользователь';
      // Отправляем push всем, кроме автора
      sendPushToAllUsers(
        {
          title: `${authorName} в общем чате`,
          body: content.length > 100 ? content.slice(0, 100) + '...' : content,
          url: '/',
        },
        req.user!.id
      ).catch(err => {
        console.error('[Chat Push] Failed to send push notifications:', err);
      });
    } else {
      // Отправляем push-уведомления получателям личного сообщения
      const authorName = message.author?.name || 'Пользователь';
      for (const recipientId of recipientIds) {
        if (recipientId === req.user!.id) continue;
        sendPushToUser(
          recipientId,
          {
            title: `Личное сообщение от ${authorName}`,
            body: content.length > 100 ? content.slice(0, 100) + '...' : content,
            url: '/',
          },
          'chat'
        ).catch(err => {
          console.error(`[Chat Push] Failed to send private push to ${recipientId}:`, err);
        });
      }
    }

    // Broadcast через SSE для обновления чата
    // Для общих сообщений — всем, для личных — только автору и получателям
    if (isGeneralMessage) {
      broadcast('chat', { action: 'new_message', message });
    } else {
      const targetUserIds = [...new Set([req.user!.id, ...(recipientIds || [])])];
      broadcastToUsers('chat', targetUserIds, { action: 'new_message', message });
    }

    res.status(201).json(messageWithAttachments);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Добавить/убрать реакцию
router.post('/:id/react', async (req: AuthRequest, res) => {
  const { emoji } = z.object({ emoji: z.string().min(1).max(10) }).parse(req.body);
  const messageId = req.params.id;
  const userId = req.user!.id;

  const message = await prisma.chatMessage.findUnique({ where: { id: messageId } });
  if (!message) {
    return res.status(404).json({ error: 'Сообщение не найдено' });
  }

  const existing = await prisma.chatReaction.findFirst({
    where: { messageId, userId, emoji },
  });

  if (existing) {
    await prisma.chatReaction.delete({ where: { id: existing.id } });
  } else {
    await prisma.chatReaction.create({ data: { messageId, userId, emoji } });
  }

  const updated = await prisma.chatMessage.findUnique({
    where: { id: messageId },
    include: {
      author: { select: { id: true, name: true, avatar: true } },
      replyTo: { include: { author: { select: { id: true, name: true } } } },
      recipients: { include: { user: { select: { id: true, name: true } } } },
      reactions: { include: { user: { select: { id: true, name: true } } } },
    },
  });

  // Broadcast через SSE для обновления реакций
  // Для личных сообщений — только автору и получателям
  const isPrivateMessage = updated && updated.recipients && updated.recipients.length > 0;
  if (isPrivateMessage) {
    const targetUserIds = [...new Set([updated!.authorId, ...updated!.recipients.map(r => r.userId)])];
    broadcastToUsers('chat', targetUserIds, { action: 'update_reaction', message: updated });
  } else {
    broadcast('chat', { action: 'update_reaction', message: updated });
  }

  res.json(updated);
});

// Удалить своё сообщение (мягкое удаление)
router.delete('/:id', async (req: AuthRequest, res) => {
  const message = await prisma.chatMessage.findUnique({
    where: { id: req.params.id },
  });
  if (!message) {
    return res.status(404).json({ error: 'Сообщение не найдено' });
  }
  if (message.authorId !== req.user!.id) {
    return res.status(403).json({ error: 'Нет прав на удаление' });
  }
  await prisma.chatMessage.update({
    where: { id: req.params.id },
    data: { deletedAt: new Date(), content: '[удалено]' },
  });
  res.json({ success: true });
});

export default router;
