import { Router } from 'express' ; import { z } from 'zod' ; import { prisma } from '../lib/prisma.js' ; import { authMiddleware, AuthRequest } from '../middleware/auth.js' ; import { sendPushToTaskAssignees, sendPushToTaskCurators, sendPushToRoleUsers } from '../lib/push.js' ; import { notifyTaskAssignees, notifyTaskCurators, notifyRoleUsers } from '../lib/notifications.js' ; import { broadcast, CHANNELS } from '../lib/events.js' ;
import fs from 'fs' ;
import path from 'path' ;
import multer from 'multer' ;
import { randomUUID } from 'crypto' ; const router = Router() ; router.use(authMiddleware) ;

// Simple in-memory cache for task lists (TTL 60s)
const taskListCache = new Map<string, { data: any; expiry: number }>();
const CACHE_TTL_MS = 60_000;
function getCacheKey(userId: string, query: any) {
  return `tasks_${userId}_${JSON.stringify(query)}`;
}

const UPLOAD_DIR = '/app/uploads' ;
const TASKS_DIR = path.join(UPLOAD_DIR, 'tasks') ;
if (!fs.existsSync(TASKS_DIR)) { fs.mkdirSync(TASKS_DIR, { recursive: true }) ; }

const taskFileStorage = multer.diskStorage({
  destination: async (_req, _file, cb) => {
    const taskId = _req.params.id;
    const task = await prisma.task.findUnique({ where: { id: taskId }, select: { ticketNumber: true } });
    const ticketNum = task?.ticketNumber ?? taskId;
    const taskDir = path.join(TASKS_DIR, String(ticketNum));
    if (!fs.existsSync(taskDir)) { fs.mkdirSync(taskDir, { recursive: true }); }
    cb(null, taskDir);
  },
  filename: (_req, file, cb) => {
    const dir = (file as any).destination || TASKS_DIR;
    const originalName = Buffer.from(file.originalname, 'latin1').toString('utf8');
    const sanitized = originalName.replace(/[<>:"\/\\|?*\x00-\x1f]/g, '_').replace(/\s+/g, ' ').trim();
    if (!sanitized) { cb(null, `${randomUUID()}${path.extname(originalName)}`); return; }
    let finalName = sanitized;
    if (fs.existsSync(path.join(dir, finalName))) {
      const ext = path.extname(sanitized);
      const base = path.basename(sanitized, ext);
      let counter = 1;
      do { finalName = `${base} (${counter})${ext}`; counter++; } while (fs.existsSync(path.join(dir, finalName)));
    }
    cb(null, finalName);
  },
});

const taskFileUpload = multer({
  storage: taskFileStorage,
  limits: { fileSize: 2 * 1024 * 1024 * 1024 },
});
 const createSchema = z.object({ title: z.string().min(1), description: z.string().optional(), status: z.enum(['open', 'in_progress', 'load', 'cancelled', 'win']).default('open'), priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'), dueDate: z.preprocess((val) => { if (val === '' || val === null || val === undefined) return undefined; const d = new Date(val); return isNaN(d.getTime()) ? undefined : d; }, z.date().optional()), assigneeIds: z.array(z.string()).optional(), curatorIds: z.array(z.string()).optional(), projectId: z.string().optional(), contactId: z.string().optional(), dealId: z.string().optional(), parentId: z.string().optional(), }) ; const updateSchema = z.object({ title: z.string().min(1).optional(), description: z.string().optional(), status: z.enum(['open', 'in_progress', 'load', 'cancelled', 'win']).optional(), priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(), dueDate: z.preprocess((val) => { if (val === '' || val === null || val === undefined) return undefined; const d = new Date(val); return isNaN(d.getTime()) ? undefined : d; }, z.date().optional()), assigneeIds: z.array(z.string()).optional(), curatorIds: z.array(z.string()).optional(), projectId: z.string().optional().nullable(), contactId: z.string().optional().nullable(), dealId: z.string().optional().nullable(), parentId: z.string().optional().nullable(), }) ; const isAdmin = (req: AuthRequest) => req.user?.role === 'admin' ; const canAccessTask = async (taskId: string, userId: string, role: string) => { if (role === 'admin') return true ; const task = await prisma.task.findUnique({ where: { id: taskId }, select: { creatorId: true, assignees: { select: { userId: true } }, curators: { select: { userId: true } } } }) ; if (!task) return false ; if (task.creatorId === userId) return true ; if (task.assignees.some(a => a.userId === userId)) return true ; if (task.curators.some(c => c.userId === userId)) return true ; return false ; } ; const canEditTask = async (taskId: string, userId: string, role: string) => { if (role === 'admin') return true ; const task = await prisma.task.findUnique({ where: { id: taskId }, select: { creatorId: true, assignees: { select: { userId: true } }, curators: { select: { userId: true } } } }) ; if (!task) return false ; if (task.creatorId === userId) return true ; if (task.assignees.some(a => a.userId === userId)) return true ; if (task.curators.some(c => c.userId === userId)) return true ; return false ; } ; router.get('/:id', async (req: AuthRequest, res) => { const task = await prisma.task.findUnique({ where: { id: req.params.id }, include: { assignees: { include: { user: { select: { id: true, name: true, avatar: true } } } }, creator: { select: { id: true, name: true } }, curators: { include: { user: { select: { id: true, name: true, avatar: true } } } }, project: { select: { id: true, name: true } }, contact: { select: { id: true, name: true, company: true } }, deal: { select: { id: true, title: true, value: true } }, comments: { include: { author: { select: { id: true, name: true, avatar: true } } }, orderBy: { createdAt: 'asc' }, take: 50 }, parent: { select: { id: true, title: true, status: true } }, children: { include: { assignees: { include: { user: { select: { id: true, name: true, avatar: true } } } }, _count: { select: { comments: true } }, }, orderBy: { createdAt: 'asc' } }, }, }) ; if (!task) return res.status(404).json({ error: 'Задача не найдена' }) ; const hasAccess = await canAccessTask(req.params.id, req.user!.id, req.user!.role) ; if (!hasAccess) return res.status(403).json({ error: 'Доступ запрещен' }) ; const attachments = await prisma.fileAttachment.findMany({ where: { entityType: 'task', entityId: task.id }, select: { id: true, originalName: true, mimeType: true, size: true, path: true, createdAt: true }, orderBy: { createdAt: 'asc' }, }) ; const commentIds = task.comments.map((c) => c.id) ; const commentAttachments = await prisma.fileAttachment.findMany({ where: { entityType: 'comment', entityId: { in: commentIds } }, select: { id: true, originalName: true, mimeType: true, size: true, path: true, createdAt: true, entityId: true }, orderBy: { createdAt: 'asc' }, }) ; const commentsWithAttachments = task.comments.map((c) => ({ ...c, attachments: commentAttachments.filter((a) => a.entityId === c.id), })) ; res.json({ ...task, comments: commentsWithAttachments, attachments, assignee: task.assignees[0]?.user ?? null, assigneeId: task.assignees[0]?.userId ?? null, curators: task.curators?.map((c) => c.user) ?? [], curatorIds: task.curators?.map((c) => c.userId) ?? [], }) ; }) ; router.get('/:id/history', async (req: AuthRequest, res) => { const hasAccess = await canAccessTask(req.params.id, req.user!.id, req.user!.role) ; if (!hasAccess) return res.status(403).json({ error: 'Доступ запрещен' }) ; const history = await prisma.taskHistory.findMany({ where: { taskId: req.params.id }, include: { user: { select: { id: true, name: true, avatar: true } } }, orderBy: { createdAt: 'desc' }, }) ; res.json(history) ; }) ; router.get('/', async (req: AuthRequest, res) => { const cacheKey = getCacheKey(req.user!.id, req.query); const cached = taskListCache.get(cacheKey); if (cached && cached.expiry > Date.now()) { return res.json(cached.data); } const { status, priority, assigneeId, projectId, contactId, search, parentId, includeChildren, filter, page, limit } = req.query ; const where: any = {} ; const pageNum = Math.max(1, parseInt(page as string) || 1) ; const pageSize = Math.min(100, Math.max(1, parseInt(limit as string) || 50)) ; const skip = (pageNum - 1) * pageSize ; const usePagination = !!(page || limit) ; if (status) { if (Array.isArray(status)) { where.status = { in: status } ; } else { where.status = status ; } } ; if (priority) where.priority = priority ; if (projectId) where.projectId = projectId as string ; if (contactId) where.contactId = contactId as string ; if (parentId !== undefined) { where.parentId = parentId === 'null' ? null : (parentId as string) ; } else if (includeChildren !== 'true') { where.parentId = null ; } if (search) where.title = { contains: search as string, mode: 'insensitive' } ; if (assigneeId && assigneeId !== 'all') { where.assignees = { some: { userId: assigneeId as string } } ; } if (!isAdmin(req)) { const userId = req.user!.id ; where.OR = [ { creatorId: userId }, { assignees: { some: { userId } } }, { curators: { some: { userId } } }, ] ; } const [tasks, totalCount] = await Promise.all([ prisma.task.findMany({ where, ...(usePagination ? { skip, take: pageSize } : {}), include: { assignees: { include: { user: { select: { id: true, name: true } } } }, creator: { select: { id: true, name: true } }, curators: { include: { user: { select: { id: true, name: true } } } }, project: { select: { id: true, name: true } }, contact: { select: { id: true, name: true, company: true } }, deal: { select: { id: true, title: true, value: true } }, _count: { select: { comments: true, children: true } }, children: { select: { id: true, title: true, status: true, priority: true, dueDate: true }, orderBy: { createdAt: 'asc' } }, }, orderBy: { createdAt: 'desc' }, }), prisma.task.count({ where }) ]) ; const taskIds = tasks.map(t => t.id) ; const attachments = await prisma.fileAttachment.findMany({ where: { entityType: 'task', entityId: { in: taskIds } }, select: { id: true, originalName: true, mimeType: true, size: true, path: true, createdAt: true, entityId: true }, orderBy: { createdAt: 'asc' }, }) ; const mapped = tasks.map(t => ({ ...t, attachments: attachments.filter(a => a.entityId === t.id), assignee: t.assignees[0]?.user ?? null, assigneeId: t.assignees[0]?.userId ?? null, curators: t.curators?.map((c) => c.user) ?? [], curatorIds: t.curators?.map((c) => c.userId) ?? [], })) ; if (page || limit) { const result = { tasks: mapped, totalCount, page: pageNum, pageSize }; taskListCache.set(cacheKey, { data: result, expiry: Date.now() + CACHE_TTL_MS }); res.json(result); } else { taskListCache.set(cacheKey, { data: mapped, expiry: Date.now() + CACHE_TTL_MS }); res.json(mapped); } ; }) ; router.post('/', async (req: AuthRequest, res) => { try { const data = createSchema.parse(req.body) ; const { assigneeIds, curatorIds, ...rest } = data ; const task = await prisma.task.create({ data: { ...rest, creatorId: req.user!.id, dueDate: rest.dueDate ? new Date(rest.dueDate) : undefined, projectId: rest.projectId || undefined, contactId: rest.contactId || undefined, dealId: rest.dealId || undefined, parentId: rest.parentId || undefined, assignees: assigneeIds?.length ? { create: assigneeIds.map(uid => ({ userId: uid })) } : undefined, curators: curatorIds?.length ? { create: curatorIds.map(uid => ({ userId: uid })) } : undefined, }, include: { assignees: { include: { user: { select: { id: true, name: true, avatar: true } } } }, curators: { include: { user: { select: { id: true, name: true, avatar: true } } } }, project: { select: { id: true, name: true } }, parent: { select: { id: true, title: true } }, }, }) ;
// Create task attachments folder named by ticket number
const taskDir = path.join(TASKS_DIR, String(task.ticketNumber));
if (!fs.existsSync(taskDir)) { fs.mkdirSync(taskDir, { recursive: true }); }
await prisma.activity.create({ data: { action: 'created', entity: 'task', entityId: task.id, userId: req.user!.id }, }) ; await prisma.taskHistory.create({ data: { taskId: task.id, field: 'task', oldValue: null, newValue: 'Создана задача: ' + task.title, userId: req.user!.id }, }) ; sendPushToTaskAssignees(task.id, { title: 'Новая задача', body: ((req.user! as any).name || 'Пользователь') + ' назначил вам задачу: ' + task.title, url: '/tasks', }, req.user!.id).catch(() => {}) ; sendPushToTaskCurators(task.id, { title: 'Новая задача', body: ((req.user! as any).name || 'Пользователь') + ' назначил вас куратором задачи: ' + task.title, url: '/tasks/' + task.id, }, req.user!.id).catch(() => {}) ; await notifyTaskAssignees(task.id, { title: 'Новая задача', body: ((req.user! as any).name || 'Пользователь') + ' назначил вам задачу: ' + task.title, url: '/tasks/' + task.id, }, req.user!.id) ; await notifyTaskCurators(task.id, { title: 'Новая задача', body: ((req.user! as any).name || 'Пользователь') + ' назначил вас куратором задачи: ' + task.title, url: '/tasks/' + task.id, }, req.user!.id) ;
    // Notify admins/managers about new task (always, regardless of assignees)
    const hasAssignees = assigneeIds && assigneeIds.length > 0;
    const rolePayload = {
      title: hasAssignees ? 'Новая задача' : 'Новая задача без исполнителя',
      body: ((req.user! as any).name || 'Пользователь') + (hasAssignees ? ' создал задачу: ' : ' создал задачу без назначения: ') + task.title,
      url: '/tasks/' + task.id,
    };
    sendPushToRoleUsers(['admin', 'manager'], rolePayload, 'task', req.user!.id).catch(() => {});
    await notifyRoleUsers(['admin', 'manager'], rolePayload, req.user!.id);
    res.status(201).json({ ...task, assignee: task.assignees[0]?.user ?? null, assigneeId: task.assignees[0]?.userId ?? null, curators: task.curators?.map((c) => c.user) ?? [], curatorIds: task.curators?.map((c) => c.userId) ?? [], }) ; broadcast(CHANNELS.TASKS, { action: 'create', entity: 'task', id: task.id }) ; taskListCache.clear(); } catch (err: any) { res.status(400).json({ error: err.message }) ; } }) ; router.patch('/:id', async (req: AuthRequest, res) => { try { const hasEditRight = await canEditTask(req.params.id, req.user!.id, req.user!.role) ; if (!hasEditRight) return res.status(403).json({ error: 'Нет прав на редактирование задачи' }) ; const { assigneeIds, curatorIds, ...rest } = req.body ; if (Array.isArray(assigneeIds)) { await prisma.taskAssignee.deleteMany({ where: { taskId: req.params.id } }) ; if (assigneeIds.length) { await prisma.taskAssignee.createMany({ data: assigneeIds.map((uid: string) => ({ taskId: req.params.id, userId: uid })), }) ; } } if (Array.isArray(curatorIds)) { await prisma.taskCurator.deleteMany({ where: { taskId: req.params.id } }) ; if (curatorIds.length) { await prisma.taskCurator.createMany({ data: curatorIds.map((uid: string) => ({ taskId: req.params.id, userId: uid })), }) ; } } if (rest.parentId) { if (rest.parentId === req.params.id) { return res.status(400).json({ error: 'Task cannot be its own parent' }) ; } const isDescendant = async (parentId: string, targetId: string): Promise<boolean> => { const children = await prisma.task.findMany({ where: { parentId }, select: { id: true } }) ; for (const child of children) { if (child.id === targetId) return true ; if (await isDescendant(child.id, targetId)) return true ; } return false ; } ; if (await isDescendant(req.params.id, rest.parentId)) { return res.status(400).json({ error: 'Cannot set a descendant as parent' }) ; } } const prevTask = await prisma.task.findUnique({ where: { id: req.params.id }, include: { assignees: { include: { user: { select: { id: true, name: true } } } }, curators: { include: { user: { select: { id: true, name: true } } } }, project: { select: { id: true, name: true } }, contact: { select: { id: true, name: true } }, deal: { select: { id: true, title: true } }, parent: { select: { id: true, title: true } }, }, }) ; const task = await prisma.task.update({ where: { id: req.params.id }, data: { ...rest, dueDate: rest.dueDate ? new Date(rest.dueDate) : undefined, parentId: rest.parentId === null ? null : rest.parentId || undefined, projectId: rest.projectId === null ? null : rest.projectId || undefined, contactId: rest.contactId === null ? null : rest.contactId || undefined, dealId: rest.dealId === null ? null : rest.dealId || undefined, }, include: { assignees: { include: { user: { select: { id: true, name: true, avatar: true } } } }, curators: { include: { user: { select: { id: true, name: true, avatar: true } } } }, project: { select: { id: true, name: true } }, parent: { select: { id: true, title: true } }, contact: { select: { id: true, name: true } }, deal: { select: { id: true, title: true } }, }, }) ; await prisma.activity.create({ data: { action: 'updated', entity: 'task', entityId: task.id, userId: req.user!.id }, }) ; const fieldLabels: Record<string, string> = { title: 'Название', description: 'Описание', status: 'Статус', priority: 'Приоритет', dueDate: 'Срок', projectId: 'Проект', contactId: 'Контакт', dealId: 'Сделка', parentId: 'Родительская задача', curatorIds: 'Кураторы' } ; const historyEntries: any[] = [] ; for (const [key, newVal] of Object.entries(rest)) { if (newVal === undefined) continue ; const oldVal = (prevTask as any)?.[key] ; if (key === 'assigneeIds') { const oldIds = (prevTask?.assignees || []).map((a: any) => a.userId).sort().join(',') ; const newIds = (assigneeIds || []).sort().join(',') ; if (oldIds !== newIds) { historyEntries.push({ taskId: task.id, field: 'assignees', oldValue: (prevTask?.assignees || []).map((a: any) => a.user.name).join(', ') || null, newValue: newIds ? 'Изменены исполнители' : 'Исполнители удалены', userId: req.user!.id }) ; } continue ; } if (key === 'curatorIds') { const oldIds = (prevTask?.curators || []).map((c: any) => c.userId).sort().join(',') ; const newIds = (curatorIds || []).sort().join(',') ; if (oldIds !== newIds) { historyEntries.push({ taskId: task.id, field: 'curators', oldValue: (prevTask?.curators || []).map((c: any) => c.user.name).join(', ') || null, newValue: newIds ? 'Изменены кураторы' : 'Кураторы удалены', userId: req.user!.id }) ; } continue ; } if (key === 'dueDate') { const oldDate = oldVal ? new Date(oldVal).toISOString().split('T')[0] : null ; const newDate = newVal ? new Date(newVal as any).toISOString().split('T')[0] : null ; if (oldDate !== newDate) { historyEntries.push({ taskId: task.id, field: key, oldValue: oldDate, newValue: newDate, userId: req.user!.id }) ; } continue ; } if (oldVal !== newVal) { historyEntries.push({ taskId: task.id, field: key, oldValue: oldVal !== null && oldVal !== undefined ? String(oldVal) : null, newValue: newVal !== null && newVal !== undefined ? String(newVal) : null, userId: req.user!.id }) ; } } if (historyEntries.length) { await prisma.taskHistory.createMany({ data: historyEntries }) ; } let pushTitle = 'Задача обновлена' ; let pushBody = (req.user! as any).name + ' обновил задачу: ' + task.title ; if (rest.status && prevTask && rest.status !== prevTask.status) { pushTitle = 'Статус задачи изменён' ; pushBody = '' + task.title + ' теперь ' + rest.status ; } if (assigneeIds !== undefined) { pushTitle = 'Исполнители изменены' ; pushBody = '' + task.title + ' обновлён список исполнителей' ; } sendPushToTaskAssignees(task.id, { title: pushTitle, body: pushBody, url: '/tasks', }, req.user!.id).catch(() => {}) ; await notifyTaskAssignees(task.id, { title: pushTitle, body: pushBody, url: '/tasks/' + task.id, }, req.user!.id) ; broadcast(CHANNELS.TASKS, { action: 'update', entity: 'task', id: task.id }) ; taskListCache.clear() ; res.json({ ...task, assignee: task.assignees[0]?.user ?? null, assigneeId: task.assignees[0]?.userId ?? null, curators: task.curators?.map((c) => c.user) ?? [], curatorIds: task.curators?.map((c) => c.userId) ?? [], }) ; } catch (err: any) { res.status(400).json({ error: err.message }) ; } }) ; router.delete('/:id', async (req: AuthRequest, res) => { if (!isAdmin(req)) return res.status(403).json({ error: 'Только администратор может удалять задачи' }) ; await prisma.task.delete({ where: { id: req.params.id } }) ; broadcast(CHANNELS.TASKS, { action: 'delete', entity: 'task', id: req.params.id }) ; res.json({ success: true }) ; }) ; 
// === Task Files Manager ===
// Get files list from task folder
router.get('/:id/files', async (req: AuthRequest, res) => {
  try {
    const hasAccess = await canAccessTask(req.params.id, req.user!.id, req.user!.role);
    if (!hasAccess) return res.status(403).json({ error: 'Доступ запрещен' });
    const task = await prisma.task.findUnique({ where: { id: req.params.id }, select: { ticketNumber: true } });
    if (!task) return res.status(404).json({ error: 'Задача не найдена' });
    const taskDir = path.join(TASKS_DIR, String(task.ticketNumber));
    if (!fs.existsSync(taskDir)) return res.json([]);
    const files = fs.readdirSync(taskDir).map(name => {
      const stat = fs.statSync(path.join(taskDir, name));
      return { name, size: stat.size, createdAt: stat.ctime };
    });
    res.json(files);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Upload files to task folder
router.post('/:id/files', authMiddleware, taskFileUpload.array('files', 10), async (req: AuthRequest, res) => {
  try {
    const hasAccess = await canAccessTask(req.params.id, req.user!.id, req.user!.role);
    if (!hasAccess) return res.status(403).json({ error: 'Доступ запрещен' });
    const task = await prisma.task.findUnique({ where: { id: req.params.id }, select: { ticketNumber: true } });
    if (!task) return res.status(404).json({ error: 'Задача не найдена' });
    const files = (req.files as Express.Multer.File[]) || [];
    const uploaded = files.map(f => ({
      name: f.filename,
      originalName: f.originalname,
      size: f.size,
      path: `/uploads/tasks/${task.ticketNumber}/${f.filename}`,
    }));
    res.status(201).json(uploaded);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Delete file from task folder
router.delete('/:id/files/:filename', async (req: AuthRequest, res) => {
  try {
    const hasAccess = await canAccessTask(req.params.id, req.user!.id, req.user!.role);
    if (!hasAccess) return res.status(403).json({ error: 'Доступ запрещен' });
    const task = await prisma.task.findUnique({ where: { id: req.params.id }, select: { ticketNumber: true } });
    if (!task) return res.status(404).json({ error: 'Задача не найдена' });
    const filePath = path.join(TASKS_DIR, String(task.ticketNumber), req.params.filename);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Download file from task folder
router.get('/:id/files/:filename/download', async (req: AuthRequest, res) => {
  try {
    const hasAccess = await canAccessTask(req.params.id, req.user!.id, req.user!.role);
    if (!hasAccess) return res.status(403).json({ error: 'Доступ запрещен' });
    const task = await prisma.task.findUnique({ where: { id: req.params.id }, select: { ticketNumber: true } });
    if (!task) return res.status(404).json({ error: 'Задача не найдена' });
    const filePath = path.join(TASKS_DIR, String(task.ticketNumber), req.params.filename);
    if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'Файл не найден' });
    const asciiName = req.params.filename.replace(/[^\x20-\x7E]/g, '_');
    const utf8Name = encodeURIComponent(req.params.filename);
    res.setHeader('Content-Disposition', `attachment; filename="${asciiName}"; filename*=UTF-8''${utf8Name}`);
    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router ;