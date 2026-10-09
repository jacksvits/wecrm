import { Router } from 'express';
import { z } from 'zod';
import fs from 'fs';
import path from 'path';
import { prisma } from '../lib/prisma.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import { broadcast, CHANNELS } from '../lib/events.js';
import { sendPushToRoleUsers, sendPushToUser } from '../lib/push.js';
import { notifyRoleUsers } from '../lib/notifications.js';

const router = Router();
router.use(authMiddleware);

const UPLOAD_DIR = '/app/uploads';
const TASKS_DIR = path.join(UPLOAD_DIR, 'tasks');
if (!fs.existsSync(TASKS_DIR)) { fs.mkdirSync(TASKS_DIR, { recursive: true }); }

const createMessageSchema = z.object({
  content: z.string().min(1, 'Сообщение не может быть пустым').max(10000),
  attachmentIds: z.array(z.string()).optional(),
});

// Персональный чат тех. поддержки. Первое сообщение пользователя создаёт задачу-обращение,
// все сообщения дублируются в обсуждение задачи (модель Comment) — обе стороны видят одну переписку.
// Отвечать в чат может любой, у кого есть доступ к задаче (админ/developer/исполнители/кураторы).

const isStaff = (req: AuthRequest) => ['admin', 'developer'].includes(req.user?.role || '');

// Доступ к странице поддержки: флаг роли «Чат тех. поддержки» (у admin и developer — всегда)
const canUseSupport = (req: AuthRequest) => isStaff(req) || req.user?.canAccessSupportChat === true;

// Доступ к задаче — как в routes/tasks.ts (+ владелец обращения)
const canAccessTask = async (taskId: string, userId: string, role: string) => {
  if (role === 'admin' || role === 'developer') return true;
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    select: {
      creatorId: true,
      supportOwnerId: true,
      assignees: { select: { userId: true } },
      curators: { select: { userId: true } },
      project: { select: { users: { select: { userId: true } } } },
    },
  });
  if (!task) return false;
  if (task.creatorId === userId) return true;
  if (task.supportOwnerId === userId) return true;
  if (task.assignees.some(a => a.userId === userId)) return true;
  if (task.curators.some(c => c.userId === userId)) return true;
  if (task.project?.users.some(u => u.userId === userId)) return true;
  return false;
};

// Загрузка сообщений чата = обсуждение задачи. Владелец обращения не видит внутренние
// комментарии (isInternal), staff видит всё.
const loadMessages = async (taskId: string, viewerStaff: boolean) => {
  const messages = await prisma.comment.findMany({
    where: {
      taskId,
      ...(viewerStaff ? {} : { isInternal: false }),
    },
    include: { author: { select: { id: true, name: true, avatar: true } } },
    orderBy: { createdAt: 'asc' },
  });
  const attachments = await prisma.fileAttachment.findMany({
    where: { entityType: 'comment', entityId: { in: messages.map(m => m.id) } },
    select: { id: true, originalName: true, mimeType: true, size: true, path: true, createdAt: true, entityId: true },
    orderBy: { createdAt: 'asc' },
  });
  return messages.map(m => ({ ...m, attachments: attachments.filter(a => a.entityId === m.id) }));
};

// Создание сообщения в обсуждении задачи (дублирование чата в «Обсуждение»)
const createDiscussionMessage = async (taskId: string, userId: string, name: string, content: string, attachmentIds?: string[]) => {
  const comment = await prisma.comment.create({
    data: { content, authorId: userId, taskId, isInternal: false },
    include: { author: { select: { id: true, name: true, avatar: true } } },
  });
  if (attachmentIds && attachmentIds.length > 0) {
    await prisma.fileAttachment.updateMany({
      where: { id: { in: attachmentIds } },
      data: { entityId: comment.id },
    });
  }
  const attachments = await prisma.fileAttachment.findMany({
    where: { entityType: 'comment', entityId: comment.id },
    select: { id: true, originalName: true, mimeType: true, size: true, path: true, createdAt: true, entityId: true },
    orderBy: { createdAt: 'asc' },
  });

  // Уведомляем участников задачи (кроме автора сообщения)
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    select: {
      id: true,
      supportOwnerId: true,
      creatorId: true,
      assignees: { select: { userId: true } },
      curators: { select: { userId: true } },
    },
  });
  if (task) {
    const notifyIds = new Set<string>();
    task.assignees.forEach(a => notifyIds.add(a.userId));
    task.curators.forEach(c => notifyIds.add(c.userId));
    notifyIds.add(task.creatorId);
    if (task.supportOwnerId) notifyIds.add(task.supportOwnerId);
    notifyIds.delete(userId);
    const preview = content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    const short = preview.length > 200 ? preview.slice(0, 200) + '…' : preview;
    for (const uid of notifyIds) {
      try {
        await prisma.notification.create({
          data: {
            userId: uid,
            type: 'comment',
            title: 'Тех. поддержка',
            body: `${name}: ${short}`,
            entityType: 'task',
            entityId: task.id,
            url: `/tasks/${task.id}`,
          },
        });
      } catch (e) { console.error('Failed to create notification:', e); }
      sendPushToUser(uid, { title: 'Тех. поддержка', body: `${name}: ${short}`, url: `/tasks/${task.id}` }, 'comment').catch(() => {});
    }
  }

  broadcast(CHANNELS.COMMENTS, { action: 'new_comment', entity: 'task', id: taskId, comment });
  return { ...comment, attachments };
};

// Создание задачи-обращения по первому сообщению пользователя
const createTicket = async (userId: string, name: string, content: string) => {
  const plain = content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  const title = 'Тех. поддержка: ' + (plain.length > 60 ? plain.slice(0, 60) + '…' : plain || 'Обращение');
  const task = await prisma.task.create({
    data: {
      title,
      description: content,
      status: 'open',
      priority: 'medium',
      creatorId: userId,
      supportOwnerId: userId,
    },
  });
  // Папка вложений задачи по номеру тикета (как в routes/tasks.ts)
  const taskDir = path.join(TASKS_DIR, String(task.ticketNumber));
  if (!fs.existsSync(taskDir)) { fs.mkdirSync(taskDir, { recursive: true }); }
  await prisma.activity.create({ data: { action: 'created', entity: 'task', entityId: task.id, userId } });
  await prisma.taskHistory.create({ data: { taskId: task.id, field: 'task', oldValue: null, newValue: 'Создана задача: ' + task.title, userId } });

  // Уведомляем админов/менеджеров о новом обращении в поддержку
  const payload = { title: 'Новое обращение в тех. поддержку', body: `${name}: ${title}`, url: '/support' };
  sendPushToRoleUsers(['admin', 'manager'], payload, 'task', userId).catch(() => {});
  await notifyRoleUsers(['admin', 'manager'], payload, userId, false);

  broadcast(CHANNELS.TASKS, { action: 'create', entity: 'task', id: task.id });
  return task;
};

// Мой чат поддержки (задача-обращение текущего пользователя)
router.get('/', async (req: AuthRequest, res) => {
  try {
    if (!canUseSupport(req)) return res.status(403).json({ error: 'Доступ к чату тех. поддержки запрещён' });
    const task = await prisma.task.findFirst({
      where: { supportOwnerId: req.user!.id },
      orderBy: { createdAt: 'desc' },
    });
    if (!task) return res.json({ task: null, messages: [] });
    const messages = await loadMessages(task.id, isStaff(req));
    res.json({ task, messages });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// Написать в свой чат (первое сообщение создаёт задачу-обращение)
router.post('/', async (req: AuthRequest, res) => {
  try {
    if (!canUseSupport(req)) return res.status(403).json({ error: 'Доступ к чату тех. поддержки запрещён' });
    const { content, attachmentIds } = createMessageSchema.parse(req.body);
    let task = await prisma.task.findFirst({ where: { supportOwnerId: req.user!.id }, orderBy: { createdAt: 'desc' } });
    // Закрытое обращение (win/cancelled) — начинаем новое
    if (!task || ['win', 'cancelled'].includes(task.status)) {
      task = await createTicket(req.user!.id, req.user!.name, content);
    }
    const message = await createDiscussionMessage(task.id, req.user!.id, req.user!.name, content, attachmentIds);
    res.status(201).json({ task, message });
  } catch (err: any) { res.status(400).json({ error: err.message }); }
});

// Список обращений (только для staff: admin/developer)
router.get('/tickets', async (req: AuthRequest, res) => {
  try {
    if (!isStaff(req)) return res.status(403).json({ error: 'Требуются права администратора' });
    const tickets = await prisma.task.findMany({
      where: { supportOwnerId: { not: null } },
      include: {
        supportOwner: { select: { id: true, name: true, avatar: true } },
        comments: { orderBy: { createdAt: 'desc' }, take: 1, include: { author: { select: { id: true, name: true } } } },
      },
      orderBy: { updatedAt: 'desc' },
      take: 200,
    });
    res.json(tickets);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// Открыть чат обращения по задаче (доступ = доступ к задаче)
router.get('/task/:taskId', async (req: AuthRequest, res) => {
  try {
    if (!canUseSupport(req)) return res.status(403).json({ error: 'Доступ к чату тех. поддержки запрещён' });
    const task = await prisma.task.findUnique({ where: { id: req.params.taskId } });
    if (!task || !task.supportOwnerId) return res.status(404).json({ error: 'Обращение не найдено' });
    const hasAccess = await canAccessTask(task.id, req.user!.id, req.user!.role);
    if (!hasAccess) return res.status(403).json({ error: 'Доступ запрещен' });
    const messages = await loadMessages(task.id, isStaff(req));
    res.json({ task, messages });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// Ответить в чат обращения (доступ = доступ к задаче)
router.post('/task/:taskId', async (req: AuthRequest, res) => {
  try {
    if (!canUseSupport(req)) return res.status(403).json({ error: 'Доступ к чату тех. поддержки запрещён' });
    const task = await prisma.task.findUnique({ where: { id: req.params.taskId } });
    if (!task || !task.supportOwnerId) return res.status(404).json({ error: 'Обращение не найдено' });
    const hasAccess = await canAccessTask(task.id, req.user!.id, req.user!.role);
    if (!hasAccess) return res.status(403).json({ error: 'Доступ запрещен' });
    const { content, attachmentIds } = createMessageSchema.parse(req.body);
    const message = await createDiscussionMessage(task.id, req.user!.id, req.user!.name, content, attachmentIds);
    res.status(201).json({ task, message });
  } catch (err: any) { res.status(400).json({ error: err.message }); }
});

export default router;
