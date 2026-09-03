import { EventEmitter } from 'events';
import { prisma } from './prisma.js';
import { sendPushToUser } from './push.js';

export const notificationEmitter = new EventEmitter();
notificationEmitter.setMaxListeners(1000);

export interface CreateNotificationInput {
  userId: string;
  type: string;
  title: string;
  body: string;
  entityType?: string;
  entityId?: string;
  url?: string;
  sendPush?: boolean;
}

export async function createNotification(input: CreateNotificationInput) {
  const { userId, type, title, body, entityType, entityId, url, sendPush = true } = input;
  const notif = await prisma.notification.create({
    data: {
      userId,
      type,
      title,
      body,
      entityType: entityType || null,
      entityId: entityId || null,
      url: url || null,
    },
  });
  notificationEmitter.emit('notification', { userId, notification: notif });
  if (sendPush) {
    try {
      await sendPushToUser(userId, { title, body, url: url || '/' });
    } catch (e: any) {
      console.error('[Notification] Push failed:', e.message || e);
    }
  }
  return notif;
}

export async function notifyTaskAssignees(
  taskId: string,
  payload: { title: string; body: string; url?: string },
  excludeUserId?: string
) {
  const assignees = await prisma.taskAssignee.findMany({
    where: { taskId },
    select: { userId: true },
  });
  const targets = assignees.map(a => a.userId).filter(id => id !== excludeUserId);
  return Promise.all(
    targets.map(uid =>
      createNotification({
        userId: uid,
        type: 'task',
        title: payload.title,
        body: payload.body,
        entityType: 'task',
        entityId: taskId,
        url: payload.url,
      })
    )
  );
}

export async function notifyTaskCreator(
  taskId: string,
  payload: { title: string; body: string; url?: string }
) {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    select: { creatorId: true },
  });
  if (!task) return null;
  return createNotification({
    userId: task.creatorId,
    type: 'task',
    title: payload.title,
    body: payload.body,
    entityType: 'task',
    entityId: taskId,
    url: payload.url,
  });
}

export async function notifyRoleUsers(
  roleNames: string[],
  payload: { title: string; body: string; url?: string },
  excludeUserId?: string
) {
  const users = await prisma.user.findMany({
    where: {
      role: { name: { in: roleNames } },
    },
    include: { role: true },
  });
  const targets = users
    .filter(u => {
      if (!u.role) return false;
      if (u.role.notifyOnNewTask === false) return false;
      return true;
    })
    .map(u => u.id)
    .filter(id => id !== excludeUserId);
  return Promise.all(
    targets.map(uid =>
      createNotification({
        userId: uid,
        type: 'task',
        title: payload.title,
        body: payload.body,
        entityType: 'task',
        entityId: payload.url?.split('/').pop() || '',
        url: payload.url,
      })
    )
  );
}
