import { Router } from 'express' ; import { z } from 'zod' ; import { prisma } from '../lib/prisma.js' ;
import { uploadsRoot, pinTenantContext } from '../lib/tenant.js' ; import { authMiddleware, AuthRequest, guestCreateGuard } from '../middleware/auth.js' ; import { sendPushToTaskAssignees, sendPushToTaskCurators, sendPushToRoleUsers } from '../lib/push.js' ; import { notifyTaskAssignees, notifyTaskCurators, notifyRoleUsers } from '../lib/notifications.js' ; import { broadcast, CHANNELS } from '../lib/events.js' ; import { syncTaskStatusToTicket } from '../lib/support-ticket-tasks.js' ;
import fs from 'fs' ;
import path from 'path' ;
import multer from 'multer' ;
import { randomUUID } from 'crypto' ; import { buildTaskPdf } from '../lib/task-pdf.js' ; import { postHandlerGreeting, postHandlerCompletion } from '../lib/handler-messages.js' ; const router = Router() ; router.use(authMiddleware) ;

// Simple in-memory cache for task lists (TTL 60s)
const taskListCache = new Map<string, { data: any; expiry: number }>();
const CACHE_TTL_MS = 60_000;
function getCacheKey(userId: string, query: any) {
  return `tasks_${userId}_${JSON.stringify(query)}`;
}

// Папка задач текущего tenant'а (для tenant'ов — с префиксом /t-<slug>, см. lib/tenant.ts)
const taskDirFor = (ticketNum: string | number) => path.join(uploadsRoot(), 'tasks', String(ticketNum)) ;

// Санитизация относительного пути внутри папки задачи (защита от path traversal)
const safeTaskFilesPath = (value: unknown) => String(value || '')
  .split('/')
  .filter((segment) => segment && segment !== '.' && segment !== '..')
  .join('/');
const taskFilesDirFor = (ticketNum: string | number, subPath = '') => {
  const safeSubPath = safeTaskFilesPath(subPath);
  return safeSubPath ? path.join(taskDirFor(ticketNum), safeSubPath) : taskDirFor(ticketNum);
};
const taskFileRelPathFor = (subPath: unknown, filename: string) => {
  const safeSubPath = safeTaskFilesPath(subPath);
  const safeFilename = safeTaskFilesPath(filename);
  return safeSubPath ? `${safeSubPath}/${safeFilename}` : safeFilename;
};

const taskFileStorage = multer.diskStorage({
  destination: async (_req, _file, cb) => {
    const taskId = _req.params.id;
    const task = await prisma.task.findUnique({ where: { id: taskId }, select: { ticketNumber: true } });
    const ticketNum = task?.ticketNumber ?? taskId;
    const taskDir = taskFilesDirFor(ticketNum, typeof _req.query.path === 'string' ? _req.query.path : '');
    if (!fs.existsSync(taskDir)) { fs.mkdirSync(taskDir, { recursive: true }); }
    cb(null, taskDir);
  },
  filename: (_req, file, cb) => {
    const dir = (file as any).destination || taskDirFor('');
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
 const createSchema = z.object({ title: z.string().min(1), description: z.string().optional(), status: z.enum(['open', 'in_progress', 'load', 'cancelled', 'win']).default('open'), priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'), dueDate: z.preprocess((val) => { if (val === '' || val === null || val === undefined) return undefined; const d = new Date(val as string); return isNaN(d.getTime()) ? undefined : d; }, z.date().optional()), startDate: z.preprocess((val) => { if (val === '' || val === null || val === undefined) return undefined; const d = new Date(val as string); return isNaN(d.getTime()) ? undefined : d; }, z.date().optional()), assigneeIds: z.array(z.string()).optional(), curatorIds: z.array(z.string()).optional(), projectId: z.string().optional(), contactId: z.string().optional(), dealId: z.string().optional(), parentId: z.string().optional(), }) ; const updateSchema = z.object({ title: z.string().min(1).optional(), description: z.string().optional(), status: z.enum(['open', 'in_progress', 'load', 'cancelled', 'win']).optional(), priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(), dueDate: z.preprocess((val) => { if (val === '' || val === null || val === undefined) return undefined; const d = new Date(val as string); return isNaN(d.getTime()) ? undefined : d; }, z.date().optional()), startDate: z.preprocess((val) => { if (val === '' || val === null || val === undefined) return undefined; const d = new Date(val as string); return isNaN(d.getTime()) ? undefined : d; }, z.date().optional()), assigneeIds: z.array(z.string()).optional(), curatorIds: z.array(z.string()).optional(), projectId: z.string().optional().nullable(), contactId: z.string().optional().nullable(), dealId: z.string().optional().nullable(), parentId: z.string().optional().nullable(), isFavorite: z.boolean().optional(), }) ; // Полный доступ к задачам у админа и разработчика (роль developer — внутренняя, для поддержки)
const isAdmin = (req: AuthRequest) => ['admin', 'developer'].includes(req.user?.role || '') ;
// Проверка права роли на назначение задаче указанного статуса.
// Возвращает текст ошибки или null, если смена статуса разрешена.
const checkTaskStatusPermission = async (roleName: string | undefined, newStatus: string): Promise<string | null> => {
  if (!roleName || roleName === 'admin') return null ;
  const role = await prisma.role.findUnique({ where: { name: roleName } }) ;
  if (!role) return null ;
  if (role.canChangeTaskStatus === false) return 'Ваша роль не позволяет менять статус задач' ;
  if (role.allowedTaskStatuses.length > 0 && !role.allowedTaskStatuses.includes(newStatus)) return 'Вашей роли запрещено назначать задаче этот статус' ;
  return null ;
} ;
const canAccessTask = async (taskId: string, userId: string, role: string) => { if (role === 'admin' || role === 'developer') return true ; const task = await prisma.task.findUnique({ where: { id: taskId }, select: { creatorId: true, assignees: { select: { userId: true } }, curators: { select: { userId: true } }, project: { select: { users: { select: { userId: true } } } } } }) ; if (!task) return false ; if (task.creatorId === userId) return true ; if (task.assignees.some(a => a.userId === userId)) return true ; if (task.curators.some(c => c.userId === userId)) return true ; if (task.project?.users.some(u => u.userId === userId)) return true ; return false ; } ; const canEditTask = async (taskId: string, userId: string, role: string) => { if (role === 'admin' || role === 'developer') return true ; const task = await prisma.task.findUnique({ where: { id: taskId }, select: { creatorId: true, assignees: { select: { userId: true } }, curators: { select: { userId: true } }, project: { select: { users: { select: { userId: true } } } } } }) ; if (!task) return false ; if (task.creatorId === userId) return true ; if (task.assignees.some(a => a.userId === userId)) return true ; if (task.curators.some(c => c.userId === userId)) return true ; if (task.project?.users.some(u => u.userId === userId)) return true ; return false ; } ; router.get('/:id/export/pdf', async (req: AuthRequest, res) => { try { const hasAccess = await canAccessTask(req.params.id, req.user!.id, req.user!.role) ; if (!hasAccess) return res.status(403).json({ error: 'Доступ запрещен' }) ; const task = await prisma.task.findUnique({ where: { id: req.params.id }, include: { creator: { select: { name: true } }, assignees: { include: { user: { select: { name: true } } } }, curators: { include: { user: { select: { name: true } } } }, project: { select: { name: true } }, contact: { select: { name: true } }, deal: { select: { title: true } }, comments: { where: { isInternal: false }, include: { author: { select: { name: true } } }, orderBy: { createdAt: 'asc' } }, }, }) ; if (!task) return res.status(404).json({ error: 'Задача не найдена' }) ; const filename = `wecrm-zadacha-${task.id}.pdf` ; res.setHeader('Content-Type', 'application/pdf') ; res.setHeader('Content-Disposition', `attachment; filename="${filename}"; filename*=UTF-8''${encodeURIComponent(filename)}`) ; await buildTaskPdf(task, req.user!, res) ; } catch (err: any) { if (!res.headersSent) res.status(500).json({ error: err.message }) ; else res.end() ; } }) ; router.get('/:id', async (req: AuthRequest, res) => { let task = await prisma.task.findUnique({ where: { id: req.params.id }, include: { assignees: { include: { user: { select: { id: true, name: true, avatar: true } } } }, creator: { select: { id: true, name: true, avatar: true } }, curators: { include: { user: { select: { id: true, name: true, avatar: true } } } }, project: { select: { id: true, name: true } }, contact: { select: { id: true, name: true } }, deal: { select: { id: true, title: true, value: true } }, comments: { include: { author: { select: { id: true, name: true, avatar: true } } }, orderBy: { createdAt: 'asc' } }, parent: { select: { id: true, title: true, status: true } }, children: { include: { assignees: { include: { user: { select: { id: true, name: true, avatar: true } } } }, _count: { select: { comments: true } }, }, orderBy: { createdAt: 'asc' } }, }, }) ; if (!task && /^\d+$/.test(req.params.id)) task = await prisma.task.findFirst({ where: { ticketNumber: parseInt(req.params.id, 10) }, include: { assignees: { include: { user: { select: { id: true, name: true, avatar: true } } } }, creator: { select: { id: true, name: true, avatar: true } }, curators: { include: { user: { select: { id: true, name: true, avatar: true } } } }, project: { select: { name: true } }, contact: { select: { name: true } }, deal: { select: { title: true, value: true } }, comments: { include: { author: { select: { id: true, name: true, avatar: true } } }, orderBy: { createdAt: 'asc' } }, parent: { select: { id: true, title: true, status: true } }, children: { include: { assignees: { include: { user: { select: { id: true, name: true } } } }, _count: { select: { comments: true } }, }, orderBy: { createdAt: 'asc' } }, }, }) as unknown as typeof task ; if (!task) return res.status(404).json({ error: 'Задача не найдена' }) ; const hasAccess = await canAccessTask(task.id, req.user!.id, req.user!.role) ; if (!hasAccess) return res.status(403).json({ error: 'Доступ запрещен' }) ; const attachments = await prisma.fileAttachment.findMany({ where: { entityType: 'task', entityId: task.id }, select: { id: true, originalName: true, mimeType: true, size: true, path: true, createdAt: true }, orderBy: { createdAt: 'asc' }, }) ; const commentIds = task.comments.map((c) => c.id) ; const commentAttachments = await prisma.fileAttachment.findMany({ where: { entityType: 'comment', entityId: { in: commentIds } }, select: { id: true, originalName: true, mimeType: true, size: true, path: true, createdAt: true, entityId: true }, orderBy: { createdAt: 'asc' }, }) ; const commentsWithAttachments = task.comments.map((c) => ({ ...c, attachments: commentAttachments.filter((a) => a.entityId === c.id), })) ; const favoriteRow = await prisma.taskFavorite.findUnique({ where: { taskId_userId: { taskId: task.id, userId: req.user!.id } } }) ; res.json({ ...task, isFavorite: !!favoriteRow, comments: commentsWithAttachments, attachments, assignee: task.assignees[0]?.user ?? null, assigneeId: task.assignees[0]?.userId ?? null, curators: task.curators?.map((c) => c.user) ?? [], curatorIds: task.curators?.map((c) => c.userId) ?? [], }) ; }) ; router.get('/:id/history', async (req: AuthRequest, res) => { const hasAccess = await canAccessTask(req.params.id, req.user!.id, req.user!.role) ; if (!hasAccess) return res.status(403).json({ error: 'Доступ запрещен' }) ; const history = await prisma.taskHistory.findMany({ where: { taskId: req.params.id }, include: { user: { select: { id: true, name: true, avatar: true } } }, orderBy: { createdAt: 'desc' }, }) ; res.json(history) ; }) ; router.get('/', async (req: AuthRequest, res) => { const cacheKey = getCacheKey(req.user!.id, req.query); const cached = taskListCache.get(cacheKey); if (cached && cached.expiry > Date.now()) { return res.json(cached.data); } const { status, priority, assigneeId, projectId, contactId, search, parentId, includeChildren, filter, page, limit, dueFrom, dueTo, includeNoDue } = req.query ; const where: any = {} ; const pageNum = Math.max(1, parseInt(page as string) || 1) ; const pageSize = Math.min(100, Math.max(1, parseInt(limit as string) || 50)) ; const skip = (pageNum - 1) * pageSize ; const usePagination = !!(page || limit) ; if (status) { if (Array.isArray(status)) { where.status = { in: status } ; } else { where.status = status ; } } ; if (priority) where.priority = priority ; if (projectId) where.projectId = projectId as string ; if (contactId) where.contactId = contactId as string ; if (parentId !== undefined) { where.parentId = parentId === 'null' ? null : (parentId as string) ; } else if (includeChildren !== 'true') { where.parentId = null ; } if (search) where.title = { contains: search as string, mode: 'insensitive' } ; if (assigneeId && assigneeId !== 'all') { where.assignees = { some: { userId: assigneeId as string } } ; } if (filter === 'overdue') { where.status = { in: ['open', 'in_progress', 'load'] } ; where.dueDate = { lt: new Date() } ; } if (filter === 'no_assignee') { where.assignees = { none: {} } ; } if (dueFrom || dueTo) { const range: any = {} ; if (dueFrom) { const d = new Date(String(dueFrom) + 'T00:00:00') ; if (!isNaN(d.getTime())) range.gte = d ; } if (dueTo) { const d = new Date(String(dueTo) + 'T23:59:59.999') ; if (!isNaN(d.getTime())) range.lte = d ; } if (range.gte || range.lte) { const dueRange = { ...(where.dueDate || {}), ...range } ; if (includeNoDue === 'true') { where.AND = [...(where.AND || []), { OR: [{ dueDate: dueRange }, { startDate: dueRange }, { dueDate: null }] }] ; delete where.dueDate ; } else { where.AND = [...(where.AND || []), { OR: [{ dueDate: dueRange }, { startDate: dueRange }] }] ; delete where.dueDate ; } ; } ; } if (req.query.favorite === 'true') where.favorites = { some: { userId: req.user!.id } } ;
    if (filter === 'my') { const myUserId = req.user!.id ; where.OR = [ { creatorId: myUserId }, { assignees: { some: { userId: myUserId } } }, { curators: { some: { userId: myUserId } } } ] ; } if (!isAdmin(req)) { const userId = req.user!.id ; where.OR = [ { creatorId: userId }, { assignees: { some: { userId } } }, { curators: { some: { userId } } }, { project: { users: { some: { userId } } } }, ] ; } const [tasks, totalCount] = await Promise.all([ prisma.task.findMany({ where, ...(usePagination ? { skip, take: pageSize } : {}), include: { assignees: { include: { user: { select: { id: true, name: true } } } }, creator: { select: { id: true, name: true, avatar: true } }, curators: { include: { user: { select: { id: true, name: true } } } }, project: { select: { id: true, name: true } }, contact: { select: { id: true, name: true } }, deal: { select: { id: true, title: true, value: true } }, _count: { select: { comments: true, children: true } }, children: { select: { id: true, title: true, status: true, priority: true, dueDate: true, startDate: true }, orderBy: { createdAt: 'asc' } }, }, orderBy: { createdAt: 'desc' }, }), prisma.task.count({ where }) ]) ; const taskIds = tasks.map(t => t.id) ; const attachments = await prisma.fileAttachment.findMany({ where: { entityType: 'task', entityId: { in: taskIds } }, select: { id: true, originalName: true, mimeType: true, size: true, path: true, createdAt: true, entityId: true }, orderBy: { createdAt: 'asc' }, }) ; const favoriteRows = await prisma.taskFavorite.findMany({ where: { userId: req.user!.id, taskId: { in: taskIds } }, select: { taskId: true } }) ; const favoriteIds = new Set(favoriteRows.map((f: { taskId: string }) => f.taskId)) ; const mapped = tasks.map(t => ({ ...t, isFavorite: favoriteIds.has(t.id), attachments: attachments.filter(a => a.entityId === t.id), assignee: t.assignees[0]?.user ?? null, assigneeId: t.assignees[0]?.userId ?? null, curators: t.curators?.map((c) => c.user) ?? [], curatorIds: t.curators?.map((c) => c.userId) ?? [], })) ; if (page || limit) { const result = { tasks: mapped, totalCount, page: pageNum, pageSize }; taskListCache.set(cacheKey, { data: result, expiry: Date.now() + CACHE_TTL_MS }); res.json(result); } else { taskListCache.set(cacheKey, { data: mapped, expiry: Date.now() + CACHE_TTL_MS }); res.json(mapped); } ; }) ; router.post('/', guestCreateGuard, async (req: AuthRequest, res) => { try { const data = createSchema.parse(req.body) ;
    // При создании задачи проверяем право роли на назначение указанного статуса (кроме статуса по умолчанию)
    if (data.status !== 'open') {
      const statusError = await checkTaskStatusPermission(req.user!.role, data.status) ;
      if (statusError) return res.status(403).json({ error: statusError }) ;
    }
    // Задачу можно создать только в проекте, к которому привязан пользователь (админ — в любом)
    if (data.projectId && !isAdmin(req)) {
      const membership = await prisma.projectUser.findUnique({ where: { userId_projectId: { userId: req.user!.id, projectId: data.projectId } } }) ;
      if (!membership) return res.status(403).json({ error: 'Вы не привязаны к этому проекту' }) ;
    }
    const { assigneeIds, curatorIds, ...rest } = data ; const task = await prisma.task.create({ data: { ...rest, creatorId: req.user!.id, dueDate: rest.dueDate ? new Date(rest.dueDate) : undefined, startDate: rest.startDate ? new Date(rest.startDate) : new Date(), projectId: rest.projectId || undefined, contactId: rest.contactId || undefined, dealId: rest.dealId || undefined, parentId: rest.parentId || undefined, assignees: assigneeIds?.length ? { create: assigneeIds.map(uid => ({ userId: uid })) } : undefined, curators: curatorIds?.length ? { create: curatorIds.map(uid => ({ userId: uid })) } : undefined, }, include: { assignees: { include: { user: { select: { id: true, name: true, avatar: true } } } }, curators: { include: { user: { select: { id: true, name: true, avatar: true } } } }, project: { select: { id: true, name: true } }, parent: { select: { id: true, title: true } }, }, }) ;
// Create task attachments folder named by ticket number
const taskDir = taskDirFor(task.ticketNumber);
if (!fs.existsSync(taskDir)) { fs.mkdirSync(taskDir, { recursive: true }); }
await prisma.activity.create({ data: { action: 'created', entity: 'task', entityId: task.id, userId: req.user!.id }, }) ;
// Обработчик: «Приветствие» в обсуждение новой задачи
postHandlerGreeting(task.id) ; await prisma.taskHistory.create({ data: { taskId: task.id, field: 'task', oldValue: null, newValue: 'Создана задача: ' + task.title, userId: req.user!.id }, }) ; sendPushToTaskAssignees(task.id, { title: 'Новая задача', body: ((req.user! as any).name || 'Пользователь') + ' назначил вам задачу: ' + task.title, url: '/tasks', }, req.user!.id).catch(() => {}) ; sendPushToTaskCurators(task.id, { title: 'Новая задача', body: ((req.user! as any).name || 'Пользователь') + ' назначил вас куратором задачи: ' + task.title, url: '/tasks/' + task.id, }, req.user!.id).catch(() => {}) ; await notifyTaskAssignees(task.id, { title: 'Новая задача', body: ((req.user! as any).name || 'Пользователь') + ' назначил вам задачу: ' + task.title, url: '/tasks/' + task.id, }, req.user!.id) ; await notifyTaskCurators(task.id, { title: 'Новая задача', body: ((req.user! as any).name || 'Пользователь') + ' назначил вас куратором задачи: ' + task.title, url: '/tasks/' + task.id, }, req.user!.id) ;
    // Notify admins/managers about new task (always, regardless of assignees)
    const hasAssignees = assigneeIds && assigneeIds.length > 0;
    const rolePayload = {
      title: hasAssignees ? 'Новая задача' : 'Новая задача без исполнителя',
      body: ((req.user! as any).name || 'Пользователь') + (hasAssignees ? ' создал задачу: ' : ' создал задачу без назначения: ') + task.title,
      url: '/tasks/' + task.id,
    };
    sendPushToRoleUsers(['admin', 'manager'], rolePayload, 'task', req.user!.id).catch(() => {});
    // In-app only (push is handled above to avoid duplication and grouped buffer issues)
    await notifyRoleUsers(['admin', 'manager'], rolePayload, req.user!.id, false);
    res.status(201).json({ ...task, assignee: task.assignees[0]?.user ?? null, assigneeId: task.assignees[0]?.userId ?? null, curators: task.curators?.map((c) => c.user) ?? [], curatorIds: task.curators?.map((c) => c.userId) ?? [], }) ; broadcast(CHANNELS.TASKS, { action: 'create', entity: 'task', id: task.id }) ; taskListCache.clear(); } catch (err: any) { res.status(400).json({ error: err.message }) ; } }) ; router.patch('/:id', async (req: AuthRequest, res) => { try { const hasEditRight = await canEditTask(req.params.id, req.user!.id, req.user!.role) ; // Переключение «Избранного» — личная отметка: достаточно доступа к задаче (без прав редактирования)
const favoriteOnlyToggle = Object.keys(req.body || {}).length > 0 && Object.keys(req.body || {}).every((k) => k === 'isFavorite') ;
const hasAccessRight = favoriteOnlyToggle ? await canAccessTask(req.params.id, req.user!.id, req.user!.role) : false ;
if (!hasEditRight && !hasAccessRight) return res.status(403).json({ error: 'Нет прав на редактирование задачи' }) ;
    // Проверка прав роли на смену статуса задачи
    if (req.body.status !== undefined) {
      const prevForStatus = await prisma.task.findUnique({ where: { id: req.params.id }, select: { status: true } }) ;
      if (prevForStatus && req.body.status !== prevForStatus.status) {
        const statusError = await checkTaskStatusPermission(req.user!.role, req.body.status) ;
        if (statusError) return res.status(403).json({ error: statusError }) ;
      }
    } // Only full-access roles (admin/developer) can change contact
    if ('contactId' in req.body && !isAdmin(req)) {
      return res.status(403).json({ error: 'Только администратор может менять контакт у задачи' });
    }
    const { assigneeIds, curatorIds, isFavorite, ...rest } = req.body ; if (typeof isFavorite === 'boolean') { if (isFavorite) { await prisma.taskFavorite.upsert({ where: { taskId_userId: { taskId: req.params.id, userId: req.user!.id } }, update: {}, create: { taskId: req.params.id, userId: req.user!.id } }) } else { await prisma.taskFavorite.deleteMany({ where: { taskId: req.params.id, userId: req.user!.id } }) } ; if (favoriteOnlyToggle) { taskListCache.clear() ; return res.json({ id: req.params.id, isFavorite }) ; } } if (Array.isArray(assigneeIds)) { await prisma.taskAssignee.deleteMany({ where: { taskId: req.params.id } }) ; if (assigneeIds.length) { await prisma.taskAssignee.createMany({ data: assigneeIds.map((uid: string) => ({ taskId: req.params.id, userId: uid })), }) ; } } if (Array.isArray(curatorIds)) { await prisma.taskCurator.deleteMany({ where: { taskId: req.params.id } }) ; if (curatorIds.length) { await prisma.taskCurator.createMany({ data: curatorIds.map((uid: string) => ({ taskId: req.params.id, userId: uid })), }) ; } } if (rest.parentId) { if (rest.parentId === req.params.id) { return res.status(400).json({ error: 'Task cannot be its own parent' }) ; } const isDescendant = async (parentId: string, targetId: string): Promise<boolean> => { const children = await prisma.task.findMany({ where: { parentId }, select: { id: true } }) ; for (const child of children) { if (child.id === targetId) return true ; if (await isDescendant(child.id, targetId)) return true ; } return false ; } ; if (await isDescendant(req.params.id, rest.parentId)) { return res.status(400).json({ error: 'Cannot set a descendant as parent' }) ; } } const prevTask = await prisma.task.findUnique({ where: { id: req.params.id }, include: { assignees: { include: { user: { select: { id: true, name: true } } } }, curators: { include: { user: { select: { id: true, name: true } } } }, project: { select: { id: true, name: true } }, contact: { select: { id: true, name: true } }, deal: { select: { id: true, title: true } }, parent: { select: { id: true, title: true } }, }, }) ; const task = await prisma.task.update({ where: { id: req.params.id }, data: { ...rest, dueDate: rest.dueDate ? new Date(rest.dueDate) : undefined, parentId: rest.parentId === null ? null : rest.parentId || undefined, projectId: rest.projectId === null ? null : rest.projectId || undefined, contactId: rest.contactId === null ? null : rest.contactId || undefined, dealId: rest.dealId === null ? null : rest.dealId || undefined, }, include: { assignees: { include: { user: { select: { id: true, name: true, avatar: true } } } }, curators: { include: { user: { select: { id: true, name: true, avatar: true } } } }, project: { select: { id: true, name: true } }, parent: { select: { id: true, title: true } }, contact: { select: { id: true, name: true } }, deal: { select: { id: true, title: true } }, }, }) ; await prisma.activity.create({ data: { action: 'updated', entity: 'task', entityId: task.id, userId: req.user!.id }, }) ; if (rest.status !== undefined) { try { await syncTaskStatusToTicket(task.id) ; } catch (e: any) { console.error('[tasks] status → ticket:', e.message) ; } }
// Обработчик: «Завершение задачи» при переводе в статус «Выполнена»
if (rest.status === 'win' && prevTask && prevTask.status !== 'win') { postHandlerCompletion(task.id) ; } const fieldLabels: Record<string, string> = { title: 'Название', description: 'Описание', address: 'Адрес', status: 'Статус', priority: 'Приоритет', dueDate: 'Срок', startDate: 'Начало срока', projectId: 'Проект', contactId: 'Контакт', dealId: 'Сделка', parentId: 'Родительская задача', curatorIds: 'Кураторы' } ; const historyEntries: any[] = [] ; for (const [key, newVal] of Object.entries(rest)) { if (newVal === undefined) continue ; const oldVal = (prevTask as any)?.[key] ; if (key === 'assigneeIds') { const oldIds = (prevTask?.assignees || []).map((a: any) => a.userId).sort().join(',') ; const newIds = (assigneeIds || []).sort().join(',') ; if (oldIds !== newIds) { historyEntries.push({ taskId: task.id, field: 'assignees', oldValue: (prevTask?.assignees || []).map((a: any) => a.user.name).join(', ') || null, newValue: newIds ? 'Изменены исполнители' : 'Исполнители удалены', userId: req.user!.id }) ; } continue ; } if (key === 'curatorIds') { const oldIds = (prevTask?.curators || []).map((c: any) => c.userId).sort().join(',') ; const newIds = (curatorIds || []).sort().join(',') ; if (oldIds !== newIds) { historyEntries.push({ taskId: task.id, field: 'curators', oldValue: (prevTask?.curators || []).map((c: any) => c.user.name).join(', ') || null, newValue: newIds ? 'Изменены кураторы' : 'Кураторы удалены', userId: req.user!.id }) ; } continue ; } if (key === 'dueDate' || key === 'startDate') { const oldDate = oldVal ? new Date(oldVal).toISOString().split('T')[0] : null ; const newDate = newVal ? new Date(newVal as any).toISOString().split('T')[0] : null ; if (oldDate !== newDate) { historyEntries.push({ taskId: task.id, field: key, oldValue: oldDate, newValue: newDate, userId: req.user!.id }) ; } continue ; } if (oldVal !== newVal) { historyEntries.push({ taskId: task.id, field: key, oldValue: oldVal !== null && oldVal !== undefined ? String(oldVal) : null, newValue: newVal !== null && newVal !== undefined ? String(newVal) : null, userId: req.user!.id }) ; } } if (historyEntries.length) { await prisma.taskHistory.createMany({ data: historyEntries }) ; } let pushTitle = 'Задача обновлена' ; let pushBody = (req.user! as any).name + ' обновил задачу: ' + task.title ; if (rest.status && prevTask && rest.status !== prevTask.status) { pushTitle = 'Статус задачи изменён' ; pushBody = '' + task.title + ' теперь ' + rest.status ; } if (assigneeIds !== undefined) { pushTitle = 'Исполнители изменены' ; pushBody = '' + task.title + ' обновлён список исполнителей' ; } sendPushToTaskAssignees(task.id, { title: pushTitle, body: pushBody, url: '/tasks', }, req.user!.id).catch(() => {}) ; await notifyTaskAssignees(task.id, { title: pushTitle, body: pushBody, url: '/tasks/' + task.id, }, req.user!.id) ; broadcast(CHANNELS.TASKS, { action: 'update', entity: 'task', id: task.id }) ; taskListCache.clear() ; res.json({ ...task, assignee: task.assignees[0]?.user ?? null, assigneeId: task.assignees[0]?.userId ?? null, curators: task.curators?.map((c) => c.user) ?? [], curatorIds: task.curators?.map((c) => c.userId) ?? [], }) ; } catch (err: any) { res.status(400).json({ error: err.message }) ; } }) ; // Кнопка «череп»: создать спам-фильтр по отправителю и перевести задачу в статус «Спам»
router.post('/:id/mark-spam', async (req: AuthRequest, res) => {
  try {
    if (!isAdmin(req) && !req.user?.canHandleSpam) return res.status(403).json({ error: 'Нет права на обработку СПАМА' });
    const task = await prisma.task.findUnique({ where: { id: req.params.id }, select: { id: true, title: true, status: true, sourceEmail: true, contactId: true } });
    if (!task) return res.status(404).json({ error: 'Задача не найдена' });
    if (!task.sourceEmail) return res.status(400).json({ error: 'У задачи нет адреса отправителя' });
    const existing = await prisma.emailFilter.findFirst({ where: { isSpam: true, fromContains: task.sourceEmail } });
    let filterCreated = false;
    if (!existing) {
      await prisma.emailFilter.create({ data: {
        name: `СПАМ: ${task.sourceEmail}`,
        fromContains: task.sourceEmail,
        createTask: false,
        moveToFolder: 'Junk',
        isSpam: true,
        stopProcessing: true,
      } });
      filterCreated = true;
    }
    if (task.status !== 'spam') {
      await prisma.task.update({ where: { id: task.id }, data: { status: 'spam' } });
      await prisma.taskHistory.create({ data: { taskId: task.id, field: 'status', oldValue: task.status, newValue: 'spam', userId: req.user!.id } });
      await prisma.taskHistory.create({ data: { taskId: task.id, field: 'task', oldValue: null, newValue: `Обработка СПАМА: ${filterCreated ? 'создан фильтр' : 'фильтр уже существует'} для ${task.sourceEmail}`, userId: req.user!.id } });
      broadcast(CHANNELS.TASKS, { action: 'update', entity: 'task', id: task.id });
      taskListCache.clear();
    }
    // Контакт задачи тоже становится СПАМ: тип контакта меняется на «spam» (флаг isSpam — для быстрой фильтрации/бейджа)
    let contactMarkedSpam = false;
    if (task.contactId) {
      const contact = await prisma.contact.findUnique({ where: { id: task.contactId }, select: { isSpam: true, type: true } });
      if (contact && (!contact.isSpam || contact.type !== 'spam')) {
        await prisma.contact.update({ where: { id: task.contactId }, data: { isSpam: true, type: 'spam' } });
        await prisma.activity.create({ data: { action: 'updated', entity: 'contact', entityId: task.contactId, userId: req.user!.id } });
        contactMarkedSpam = true;
      }
    }
    res.json({ filterCreated, contactMarkedSpam, message: filterCreated ? undefined : 'Адрес уже есть в списке спама' });
  } catch (err: any) { res.status(500).json({ error: err.message }) }
});

router.delete('/:id', async (req: AuthRequest, res) => { if (!isAdmin(req)) return res.status(403).json({ error: 'Только администратор может удалять задачи' }) ; await prisma.task.delete({ where: { id: req.params.id } }) ; broadcast(CHANNELS.TASKS, { action: 'delete', entity: 'task', id: req.params.id }) ; res.json({ success: true }) ; }) ; 
// === Task Files Manager ===
// Get files list from task folder
router.get('/:id/files', async (req: AuthRequest, res) => {
  try {
    const hasAccess = await canAccessTask(req.params.id, req.user!.id, req.user!.role);
    if (!hasAccess) return res.status(403).json({ error: 'Доступ запрещен' });
    const task = await prisma.task.findUnique({ where: { id: req.params.id }, select: { ticketNumber: true } });
    if (!task) return res.status(404).json({ error: 'Задача не найдена' });
    const taskDir = taskFilesDirFor(task.ticketNumber, typeof req.query.path === 'string' ? req.query.path : '');
    if (!fs.existsSync(taskDir) || !fs.statSync(taskDir).isDirectory()) return res.json([]);
    const files = fs.readdirSync(taskDir).map(name => {
      const stat = fs.statSync(path.join(taskDir, name));
      return { name, size: stat.size, createdAt: stat.ctime, isDirectory: stat.isDirectory() };
    });
    // Сортировка: папки первыми, затем по имени
    files.sort((a, b) => {
      if (a.isDirectory !== b.isDirectory) return a.isDirectory ? -1 : 1;
      return a.name.localeCompare(b.name, 'ru');
    });
    res.json(files);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Upload files to current task folder (or selected subfolder via ?path=)
router.post('/:id/files', authMiddleware, taskFileUpload.array('files', 10), async (req: AuthRequest, res) => {
  try {
    const hasAccess = await canAccessTask(req.params.id, req.user!.id, req.user!.role);
    if (!hasAccess) return res.status(403).json({ error: 'Доступ запрещен' });
    const task = await prisma.task.findUnique({ where: { id: req.params.id }, select: { ticketNumber: true } });
    if (!task) return res.status(404).json({ error: 'Задача не найдена' });
    const files = (req.files as Express.Multer.File[]) || [];
    const subPath = typeof req.query.path === 'string' ? req.query.path : '';
    const uploaded = files.map(f => {
      const relPath = taskFileRelPathFor(subPath, f.filename);
      return {
        name: f.filename,
        originalName: f.originalname,
        size: f.size,
        path: `/uploads/tasks/${task.ticketNumber}/${relPath.split('/').map(encodeURIComponent).join('/')}`,
      };
    });
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
    const relPath = taskFileRelPathFor(req.query.path, req.params.filename);
    if (!relPath) return res.status(400).json({ error: 'Некорректный путь файла' });
    const filePath = path.join(taskDirFor(task.ticketNumber), relPath);
    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) fs.unlinkSync(filePath);
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
    const relPath = taskFileRelPathFor(req.query.path, req.params.filename);
    if (!relPath) return res.status(400).json({ error: 'Некорректный путь файла' });
    const filePath = path.join(taskDirFor(task.ticketNumber), relPath);
    if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'Файл не найден' });
    const filename = relPath.split('/').pop() || relPath;
    const asciiName = filename.replace(/[^ -~]/g, '_');
    const utf8Name = encodeURIComponent(filename);
    res.setHeader('Content-Disposition', `attachment; filename="${asciiName}"; filename*=UTF-8''${utf8Name}`);
    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});


// Явно «прикалываем» контекст tenant'а (по Host) ко всем обработчикам роутера —
// защита от молчаливой потери AsyncLocalStorage-контекста при загрузке файлов
// (инцидент 27.10.2026: брендинг tenant'а записывался в главную организацию).
pinTenantContext(router);
export default router ;