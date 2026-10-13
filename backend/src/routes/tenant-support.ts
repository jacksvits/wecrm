/**
 * Запросы организаций (tenant'ов) в поддержку платформы.
 *
 * Запросы хранятся в ПЛАТФОРМЕННОЙ БД (главный проект welans.cc) —
 * platformPrisma, а не tenant-прокси. Организация создаёт запрос со
 * своего поддомена, администраторы платформы отвечают с welans.cc.
 *
 * Вложения (скриншоты, документы, видео ошибок): файл грузится
 * «черновиком» через POST /attachments и привязывается к сообщению
 * при создании запроса или ответа (attachmentIds). Скачивание — только
 * с токеном и проверкой прав: организация — свои файлы, админ — все.
 */
import { Router } from 'express';
import { z } from 'zod';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { randomUUID } from 'crypto';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import { currentTenant, platformPrisma } from '../lib/tenant.js';

const router = Router();
const db: any = platformPrisma;

const createSchema = z.object({
  subject: z.string().trim().min(3, 'Тема — минимум 3 символа').max(200),
  message: z.string().trim().min(3, 'Опишите вопрос').max(10000),
  attachmentIds: z.array(z.string()).max(10, 'Не более 10 файлов').optional(),
});

const replySchema = z.object({
  body: z.string().trim().min(1, 'Введите сообщение').max(10000),
  attachmentIds: z.array(z.string()).max(10, 'Не более 10 файлов').optional(),
});

function ticketWithMessages(t: any) {
  return { ...t, messages: t.messages?.sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) };
}

/** Только tenant-домен (не главный) */
function requireTenant(req: AuthRequest, res: any, next: any) {
  const t = currentTenant();
  if (!t || t.isMain) return res.status(403).json({ error: 'Доступно только организациям платформы' });
  next();
}

/** Только главный домен + админ платформы */
function requirePlatformAdmin(req: AuthRequest, res: any, next: any) {
  const t = currentTenant();
  if (!t?.isMain) return res.status(403).json({ error: 'Доступно только на основном домене платформы' });
  if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Требуются права администратора платформы' });
  next();
}

/** Загружать файлы могут: организация (tenant-домен) или админ платформы (главный домен) */
function requireUploader(req: AuthRequest, res: any, next: any) {
  const t = currentTenant();
  if (!t) return res.status(403).json({ error: 'Доступ запрещен' });
  if (t.isMain && req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Требуются права администратора платформы' });
  }
  next();
}

// ============ Вложения ============

const SUPPORT_UPLOAD_DIR = '/app/uploads/tenant_support';
if (!fs.existsSync(SUPPORT_UPLOAD_DIR)) fs.mkdirSync(SUPPORT_UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, SUPPORT_UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const originalName = Buffer.from(file.originalname, 'latin1').toString('utf8');
    const sanitized = originalName.replace(/[<>:"\/\\|?*\x00-\x1f]/g, '_').replace(/\s+/g, ' ').trim();
    // UUID-префикс: имя не угадывается снаружи, скачивание всё равно идёт через защищённый эндпоинт
    cb(null, `${randomUUID()}_${sanitized || 'file'}`);
  },
});
const upload = multer({ storage, limits: { fileSize: 2 * 1024 * 1024 * 1024 } }); // 2 ГБ — как в задачах

/** Ключ владельца файла: slug организации или 'platform' (файл, приложенный поддержкой) */
function ownerKey(): string {
  const t = currentTenant();
  return t?.isMain ? 'platform' : (t?.slug || '');
}

/** Загрузка файла-черновика (привяжется к сообщению при отправке запроса/ответа) */
router.post('/attachments', authMiddleware, requireUploader, upload.single('file'), async (req: AuthRequest, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Файл не загружен' });
    const user: any = req.user;
    const t = currentTenant()!;
    const attachment = await db.tenantTicketAttachment.create({
      data: {
        tenantSlug: ownerKey(),
        authorId: user?.id || null,
        authorRole: t.isMain ? 'platform' : 'tenant',
        authorName: user?.name || user?.email || 'Пользователь',
        filename: req.file.filename,
        originalName: Buffer.from(req.file.originalname, 'latin1').toString('utf8'),
        mimeType: req.file.mimetype || 'application/octet-stream',
        size: req.file.size,
        path: `/uploads/tenant_support/${req.file.filename}`,
      },
    });
    res.status(201).json(attachment);
  } catch (err: any) {
    console.error('[tenant-support] upload:', err.message);
    res.status(500).json({ error: err.message || 'Ошибка загрузки' });
  }
});

/** Скачивание вложения: организация — свои файлы и файлы из переписки своего
 *  запроса (в т.ч. приложенные поддержкой), админ платформы — любые */
router.get('/attachments/:id/download', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const attachment = await db.tenantTicketAttachment.findUnique({ where: { id: req.params.id } });
    if (!attachment) return res.status(404).json({ error: 'Вложение не найдено' });
    const t = currentTenant();
    const isPlatformAdmin = !!t?.isMain && req.user?.role === 'admin';
    let allowed = isPlatformAdmin || attachment.tenantSlug === t?.slug;
    if (!allowed && attachment.ticketId && t) {
      const ticket = await db.tenantTicket.findUnique({ where: { id: attachment.ticketId }, select: { tenantId: true } });
      allowed = ticket?.tenantId === t.id;
    }
    if (!allowed) {
      return res.status(403).json({ error: 'Доступ запрещен' });
    }
    const filePath = '/app' + attachment.path;
    if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'Файл не найден на диске' });
    const asciiName = attachment.originalName.replace(/[^\x20-\x7E]/g, '_');
    const utf8Name = encodeURIComponent(attachment.originalName);
    res.setHeader('Content-Disposition', `inline; filename="${asciiName}"; filename*=UTF-8''${utf8Name}`);
    res.setHeader('Content-Type', attachment.mimeType || 'application/octet-stream');
    fs.createReadStream(filePath).pipe(res);
  } catch (err: any) {
    console.error('[tenant-support] download:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/** Удаление вложения: автор (своей стороны) или админ платформы */
router.delete('/attachments/:id', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const attachment = await db.tenantTicketAttachment.findUnique({ where: { id: req.params.id } });
    if (!attachment) return res.status(404).json({ error: 'Вложение не найдено' });
    const t = currentTenant();
    const isPlatformAdmin = !!t?.isMain && req.user?.role === 'admin';
    const isAuthor = attachment.tenantSlug === ownerKey() && attachment.authorId === req.user?.id;
    if (!isPlatformAdmin && !isAuthor) return res.status(403).json({ error: 'Нет прав на удаление' });
    const filePath = '/app' + attachment.path;
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    await db.tenantTicketAttachment.delete({ where: { id: attachment.id } });
    res.json({ ok: true });
  } catch (err: any) {
    console.error('[tenant-support] delete attachment:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/** Привязка черновых вложений к сообщению (только свои и ещё не привязанные) */
async function linkAttachments(ids: string[] | undefined, ticketId: string, messageId: string) {
  if (!ids || ids.length === 0) return;
  await db.tenantTicketAttachment.updateMany({
    where: { id: { in: ids.slice(0, 10) }, tenantSlug: ownerKey(), messageId: null },
    data: { ticketId, messageId },
  });
}

const messagesInclude = { orderBy: { createdAt: 'asc' as const }, include: { attachments: true } };

// ============ Сторона организации (tenant-поддомен) ============

/** Создать запрос в поддержку платформы */
router.post('/', authMiddleware, requireTenant, async (req: AuthRequest, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0]?.message || 'Некорректные данные' });
  const t = currentTenant()!;
  const user: any = req.user;

  const ticket = await db.tenantTicket.create({
    data: {
      tenantId: t.id,
      tenantSlug: t.slug,
      tenantName: t.name,
      authorId: user?.id,
      authorName: user?.name || user?.email || 'Пользователь',
      authorEmail: user?.email || '',
      subject: parsed.data.subject,
      status: 'open',
    },
  });
  const message = await db.tenantTicketMessage.create({
    data: { ticketId: ticket.id, authorRole: 'tenant', authorName: ticket.authorName, body: parsed.data.message },
  });
  await linkAttachments(parsed.data.attachmentIds, ticket.id, message.id);

  // Уведомляем администраторов платформы
  try {
    const admins = await platformPrisma.user.findMany({ where: { role: { name: 'admin' } }, select: { id: true } });
    for (const admin of admins) {
      await platformPrisma.notification.create({
        data: {
          userId: admin.id,
          title: 'Новый запрос от организации',
          body: `«${t.name}» (${t.slug}): ${parsed.data.subject}`,
          type: 'system',
        },
      });
    }
  } catch (e: any) {
    console.error('[tenant-support] notify admins:', e.message);
  }
  res.json(ticket);
});

/** Список запросов своей организации */
router.get('/', authMiddleware, requireTenant, async (_req: AuthRequest, res) => {
  const t = currentTenant()!;
  const tickets = await db.tenantTicket.findMany({
    where: { tenantId: t.id },
    orderBy: { updatedAt: 'desc' },
    include: { messages: { orderBy: { createdAt: 'asc' }, take: 1 } },
  });
  res.json(tickets);
});

/** Запрос с перепиской */
router.get('/:id', authMiddleware, requireTenant, async (req: AuthRequest, res) => {
  const t = currentTenant()!;
  const ticket = await db.tenantTicket.findFirst({
    where: { id: req.params.id, tenantId: t.id },
    include: { messages: messagesInclude },
  });
  if (!ticket) return res.status(404).json({ error: 'Запрос не найден' });
  res.json(ticketWithMessages(ticket));
});

/** Ответ организации в переписку */
router.post('/:id/reply', authMiddleware, requireTenant, async (req: AuthRequest, res) => {
  const parsed = replySchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Введите сообщение' });
  const t = currentTenant()!;
  const user: any = req.user;
  const ticket = await db.tenantTicket.findFirst({ where: { id: req.params.id, tenantId: t.id } });
  if (!ticket) return res.status(404).json({ error: 'Запрос не найден' });
  if (ticket.status === 'closed') return res.status(400).json({ error: 'Запрос закрыт' });

  const message = await db.tenantTicketMessage.create({
    data: {
      ticketId: ticket.id,
      authorRole: 'tenant',
      authorName: user?.name || user?.email || 'Пользователь',
      body: parsed.data.body,
    },
  });
  await linkAttachments(parsed.data.attachmentIds, ticket.id, message.id);
  await db.tenantTicket.update({ where: { id: ticket.id }, data: { status: 'open' } });
  const full = await db.tenantTicket.findUnique({ where: { id: ticket.id }, include: { messages: messagesInclude } });
  res.json(ticketWithMessages(full));
});

// ============ Сторона платформы (welans.cc, админ) ============

/** Все запросы всех организаций */
router.get('/admin/list', authMiddleware, requirePlatformAdmin, async (req: AuthRequest, res) => {
  const status = (req.query.status as string) || undefined;
  const tickets = await db.tenantTicket.findMany({
    where: status ? { status } : {},
    orderBy: { updatedAt: 'desc' },
    include: { messages: { orderBy: { createdAt: 'desc' }, take: 1 } },
  });
  res.json(tickets);
});

/** Запрос с перепиской (платформа) */
router.get('/admin/:id', authMiddleware, requirePlatformAdmin, async (req: AuthRequest, res) => {
  const ticket = await db.tenantTicket.findUnique({
    where: { id: req.params.id },
    include: { messages: messagesInclude },
  });
  if (!ticket) return res.status(404).json({ error: 'Запрос не найден' });
  res.json(ticketWithMessages(ticket));
});

/** Ответ поддержки платформы */
router.post('/admin/:id/reply', authMiddleware, requirePlatformAdmin, async (req: AuthRequest, res) => {
  const parsed = replySchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Введите сообщение' });
  const user: any = req.user;
  const ticket = await db.tenantTicket.findUnique({ where: { id: req.params.id } });
  if (!ticket) return res.status(404).json({ error: 'Запрос не найден' });

  const message = await db.tenantTicketMessage.create({
    data: {
      ticketId: ticket.id,
      authorRole: 'platform',
      authorName: user?.name || 'Поддержка WeCRM',
      body: parsed.data.body,
    },
  });
  await linkAttachments(parsed.data.attachmentIds, ticket.id, message.id);
  await db.tenantTicket.update({ where: { id: ticket.id }, data: { status: 'answered' } });
  const full = await db.tenantTicket.findUnique({ where: { id: ticket.id }, include: { messages: messagesInclude } });
  res.json(ticketWithMessages(full));
});

/** Удаление запроса (платформа) — вместе с файлами вложений на диске */
router.delete('/admin/:id', authMiddleware, requirePlatformAdmin, async (req, res) => {
  const ticket = await db.tenantTicket.findUnique({ where: { id: req.params.id } });
  if (!ticket) return res.status(404).json({ error: 'Запрос не найден' });
  const attachments = await db.tenantTicketAttachment.findMany({ where: { ticketId: ticket.id } });
  for (const a of attachments) {
    const filePath = '/app' + a.path;
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  }
  await db.tenantTicketMessage.deleteMany({ where: { ticketId: ticket.id } });
  await db.tenantTicket.delete({ where: { id: ticket.id } });
  res.json({ ok: true });
});

/** Смена статуса (open/answered/closed) */
router.post('/admin/:id/status', authMiddleware, requirePlatformAdmin, async (req: AuthRequest, res) => {
  const parsedStatus = z.object({ status: z.enum(['open', 'answered', 'closed']) }).safeParse(req.body || {});
  if (!parsedStatus.success) return res.status(400).json({ error: 'Некорректный статус' });
  const { status } = parsedStatus.data;
  const ticket = await db.tenantTicket.findUnique({ where: { id: req.params.id } });
  if (!ticket) return res.status(404).json({ error: 'Запрос не найден' });
  const updated = await db.tenantTicket.update({ where: { id: ticket.id }, data: { status } });
  res.json(updated);
});

export default router;
