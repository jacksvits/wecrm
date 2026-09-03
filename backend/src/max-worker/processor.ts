import { prisma } from '../lib/prisma.js';
import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';

const UPLOAD_DIR = '/app/uploads';
const TASKS_DIR = path.join(UPLOAD_DIR, 'tasks');

if (!fs.existsSync(TASKS_DIR)) {
  fs.mkdirSync(TASKS_DIR, { recursive: true });
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
    if (msg.sender_avatar !== undefined && msg.sender_avatar !== null) {
      updateData.avatarUrl = msg.sender_avatar;
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
    const newContact = await prisma.contact.create({
      data: {
        name,
        maxChatId: chatId,
        maxUserId: userId,
        avatarUrl: msg.sender_avatar || null,
        description: msg.sender_description || null,
        lastActivityTime: new Date(),
        type: 'client',
        notes: 'Автоматически создан из сообщения MAX',
      },
    });
    contactId = newContact.id;
    console.log('[MAX Processor] Created contact', newContact.id, 'for MAX chat', chatId);
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
    let commentText = text;
    if (msg.attachments && msg.attachments.length > 0) {
      commentText += ' [' + msg.attachments.length + ' влож.]';
    }

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
        }
      }
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

    if (attachmentIds.length > 0) {
      await prisma.fileAttachment.updateMany({
        where: { id: { in: attachmentIds } },
        data: { entityId: comment.id },
      });
    }

    console.log('[MAX Processor] Comment added to task', latestTask.id, 'with', attachmentIds.length, 'attachments');
  } else {
    const creatorId = settings.defaultCreatorId;
    if (!creatorId) {
      console.warn('[MAX Processor] No default creator configured, skipping message', msg.id);
      return;
    }

    console.log('[MAX Processor] Creating new task for MAX chat', chatId);
    try {
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
          assignees: settings.assigneeIds?.length
            ? { create: settings.assigneeIds.map((uid: string) => ({ userId: uid })) }
            : undefined,
        },
      });

      console.log('[MAX Processor] Created task', task.id);

      const taskDir = path.join(TASKS_DIR, String(task.ticketNumber || task.id));
      if (!fs.existsSync(taskDir)) {
        fs.mkdirSync(taskDir, { recursive: true });
      }

      if (msg.attachments && msg.attachments.length > 0) {
        for (const att of msg.attachments) {
          const fileInfo = await downloadMaxAttachment(att, taskDir);
          if (fileInfo) {
            await prisma.fileAttachment.create({
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
          }
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
      ext = path.extname(attachment.name || attachment.payload?.name || '') || '.bin';
      originalName = attachment.name || attachment.payload?.name || 'max_doc_' + (attachment.id || 'unknown') + ext;
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

    let mimeType = 'application/octet-stream';
    if (ext === '.jpg' || ext === '.jpeg') mimeType = 'image/jpeg';
    else if (ext === '.png') mimeType = 'image/png';
    else if (ext === '.gif') mimeType = 'image/gif';
    else if (ext === '.mp3') mimeType = 'audio/mpeg';
    else if (ext === '.pdf') mimeType = 'application/pdf';

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
