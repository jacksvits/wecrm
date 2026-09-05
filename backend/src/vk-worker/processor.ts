import { prisma } from '../lib/prisma.js';
import { broadcast, CHANNELS } from '../lib/events.js';
import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';

const UPLOAD_DIR = '/app/uploads';
const TASKS_DIR = path.join(UPLOAD_DIR, 'tasks');
if (!fs.existsSync(TASKS_DIR)) {
  fs.mkdirSync(TASKS_DIR, { recursive: true });
}

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
  const json = await res.json();
  if (json.error) {
    throw new Error(`VK API error: ${json.error.error_msg} (code ${json.error.error_code})`);
  }
  return json.response;
}

async function getUserInfo(userId: number, accessToken: string) {
  try {
    const res = await api('users.get', { user_ids: userId }, accessToken);
    return res?.[0] || null;
  } catch {
    return null;
  }
}

async function downloadVkAttachment(
  attachment: any,
  taskDir: string
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

    if (!url) {
      console.log('[VK Processor] No URL for attachment type:', attachment.type);
      return null;
    }

    const res = await fetch(url);
    if (!res.ok) {
      console.error('[VK Processor] Download failed:', res.status, url);
      return null;
    }

    const buffer = await res.arrayBuffer();
    const size = buffer.byteLength;
    const filename = `${randomUUID()}${ext}`;
    const filepath = path.join(taskDir, filename);
    fs.writeFileSync(filepath, Buffer.from(buffer));

    let mimeType = 'application/octet-stream';
    if (ext === '.jpg' || ext === '.jpeg') mimeType = 'image/jpeg';
    else if (ext === '.png') mimeType = 'image/png';
    else if (ext === '.gif') mimeType = 'image/gif';
    else if (ext === '.mp3') mimeType = 'audio/mpeg';
    else if (ext === '.pdf') mimeType = 'application/pdf';

    return { filename, originalName, mimeType, size, path: `/uploads/tasks/${path.basename(taskDir)}/${filename}` };
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
  const contact = await prisma.contact.findUnique({ where: { vkUserId: fromId } });
  if (contact) {
    contactId = contact.id;
    console.log(`[VK Processor] Found contact ${contactId} for VK user ${fromId}`);
  } else if (settings.autoCreateContact) {
    const userInfo = await getUserInfo(fromId, settings.accessToken);
    const name = userInfo ? `${userInfo.first_name || ''} ${userInfo.last_name || ''}`.trim() : `VK ${fromId}`;
    const newContact = await prisma.contact.create({
      data: {
        name,
        vkUserId: fromId,
        type: 'client',
        notes: 'Автоматически создан из сообщения ВК группы',
      },
    });
    contactId = newContact.id;
    console.log(`[VK Processor] Created contact ${newContact.id} for VK user ${fromId}`);
  } else {
    console.log(`[VK Processor] No contact found for VK user ${fromId} and autoCreateContact is disabled`);
  }

  console.log(`[VK Processor] Looking for latest task for peer ${fromId} group ${settings.groupId}`);
  const latestTask = await prisma.task.findFirst({
    where: {
      vkPeerId: fromId,
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
      const taskDir = path.join(TASKS_DIR, String(latestTask.ticketNumber || latestTask.id));
      if (!fs.existsSync(taskDir)) {
        fs.mkdirSync(taskDir, { recursive: true });
      }
      for (const att of msg.attachments) {
        const fileInfo = await downloadVkAttachment(att, taskDir);
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

    const comment = await prisma.comment.create({
      data: {
        content: commentText || '📎 Вложение из ВК',
        authorId: settings.defaultCreatorId || latestTask.creatorId,
        taskId: latestTask.id,
        vkMessageId: msg.id,
      },
    });

    if (attachmentIds.length > 0) {
      await prisma.fileAttachment.updateMany({
        where: { id: { in: attachmentIds } },
        data: { entityId: comment.id },
      });
    }

    console.log(`[VK Processor] Comment added to task ${latestTask.id} for peer ${fromId} (msg ${msg.id}) with ${attachmentIds.length} attachments`);
    broadcast(CHANNELS.TASKS, { action: 'new_comment', entity: 'task', id: latestTask.id });
  } else {
    // Create new task
    const creatorId = settings.defaultCreatorId;
    if (!creatorId) {
      console.warn(`[VK Processor] No default creator configured, skipping message ${msg.id}`);
      return;
    }
    console.log(`[VK Processor] Creating new task for peer ${fromId}, contact ${contactId}, creator ${creatorId}`);
    try {
      const task = await prisma.task.create({
        data: {
          title: text.slice(0, 100) || 'Сообщение из ВК',
          description: text,
          status: 'open',
          priority: 'medium',
          creatorId,
          contactId,
          vkPeerId: fromId,
          vkGroupId: settings.groupId,
          vkMessageId: msg.id,
          assignees: settings.assigneeIds?.length
            ? { create: settings.assigneeIds.map((uid: string) => ({ userId: uid })) }
            : undefined,
        },
      });
      console.log(`[VK Processor] Created task ${task.id} for peer ${fromId} (msg ${msg.id})`);

      const taskDir = path.join(TASKS_DIR, String(task.ticketNumber || task.id));
      if (!fs.existsSync(taskDir)) {
        fs.mkdirSync(taskDir, { recursive: true });
      }

      if (msg.attachments && msg.attachments.length > 0) {
        for (const att of msg.attachments) {
          const fileInfo = await downloadVkAttachment(att, taskDir);
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
          action: 'created_from_vk',
          entity: 'task',
          entityId: task.id,
          userId: creatorId,
          details: `Задача создана из сообщения ВК от ${fromId}`,
        },
      });
      console.log(`[VK Processor] Activity recorded for task ${task.id}`);
      broadcast(CHANNELS.TASKS, { action: 'create', entity: 'task', id: task.id });
    } catch (createErr) {
      console.error(`[VK Processor] FAILED to create task for peer ${fromId} msg ${msg.id}:`, createErr);
    }
  }
}
