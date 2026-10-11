/**
 * Запросы организаций (tenant'ов) в поддержку платформы.
 *
 * Запросы хранятся в ПЛАТФОРМЕННОЙ БД (главный проект welans.cc) —
 * platformPrisma, а не tenant-прокси. Организация создаёт запрос со
 * своего поддомена, администраторы платформы отвечают с welans.cc.
 */
import { Router } from 'express';
import { z } from 'zod';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import { currentTenant, platformPrisma } from '../lib/tenant.js';

const router = Router();
const db: any = platformPrisma;

const createSchema = z.object({
  subject: z.string().trim().min(3, 'Тема — минимум 3 символа').max(200),
  message: z.string().trim().min(3, 'Опишите вопрос').max(10000),
});

const replySchema = z.object({
  body: z.string().trim().min(1, 'Введите сообщение').max(10000),
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
  await db.tenantTicketMessage.create({
    data: { ticketId: ticket.id, authorRole: 'tenant', authorName: ticket.authorName, body: parsed.data.message },
  });

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
    include: { messages: { orderBy: { createdAt: 'asc' } } },
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

  await db.tenantTicketMessage.create({
    data: {
      ticketId: ticket.id,
      authorRole: 'tenant',
      authorName: user?.name || user?.email || 'Пользователь',
      body: parsed.data.body,
    },
  });
  await db.tenantTicket.update({ where: { id: ticket.id }, data: { status: 'open' } });
  const full = await db.tenantTicket.findUnique({ where: { id: ticket.id }, include: { messages: { orderBy: { createdAt: 'asc' } } } });
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
    include: { messages: { orderBy: { createdAt: 'asc' } } },
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

  await db.tenantTicketMessage.create({
    data: {
      ticketId: ticket.id,
      authorRole: 'platform',
      authorName: user?.name || 'Поддержка WeCRM',
      body: parsed.data.body,
    },
  });
  await db.tenantTicket.update({ where: { id: ticket.id }, data: { status: 'answered' } });
  const full = await db.tenantTicket.findUnique({ where: { id: ticket.id }, include: { messages: { orderBy: { createdAt: 'asc' } } } });
  res.json(ticketWithMessages(full));
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
