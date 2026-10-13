/**
 * Расписание (календарь): кабинеты, смены сотрудников, записи клиентов.
 *
 * Модель данных:
 *  - ScheduleRoom — кабинет; кабинетов несколько, работают одновременно;
 *  - ScheduleShiftTemplate — шаблон смены по дням недели (кто/где/когда принимает);
 *  - ScheduleShift — смена на конкретную дату: разовая или переопределение шаблона;
 *  - ScheduleAppointment — запись клиента: привязана к СОТРУДНИКУ, а не к кабинету.
 *
 * Кабинет записи не хранится, а вычисляется из смены сотрудника на это время —
 * поэтому при переносе смены в другой кабинет записи клиентов переезжают сами.
 *
 * Права: чтение — все авторизованные, запись — только admin.
 */
import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';

const router = Router();
router.use(authMiddleware);

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const STATUSES = ['planned', 'arrived', 'done', 'no_show', 'cancelled'] as const;

const isAdmin = (req: AuthRequest) => req.user?.role === 'admin';
const forbid = (res: any) => res.status(403).json({ error: 'Изменять расписание может только администратор' });

// ---------- helpers ----------

/** Итератор дат [from..to] включительно, формат YYYY-MM-DD */
function eachDate(from: string, to: string): string[] {
  const [y1, m1, d1] = from.split('-').map(Number);
  const [y2, m2, d2] = to.split('-').map(Number);
  const out: string[] = [];
  const cur = new Date(Date.UTC(y1, m1 - 1, d1));
  const end = new Date(Date.UTC(y2, m2 - 1, d2));
  while (cur <= end && out.length < 400) {
    out.push(cur.toISOString().slice(0, 10));
    cur.setUTCDate(cur.getUTCDate() + 1);
  }
  return out;
}

const weekdayOf = (date: string) => {
  const [y, m, d] = date.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
};

const userSelect = { select: { id: true, name: true, avatar: true } } as const;

type EffectiveShift = {
  id: string; // реальный id или gen_<templateId>_<date>
  generated: boolean;
  templateId: string | null;
  userId: string; roomId: string; date: string;
  startMin: number; endMin: number;
  user: any; room: any;
};

/**
 * Действующие смены за период: явные (ScheduleShift, кроме cancelled)
 * + сгенерированные из шаблонов, для которых нет переопределения на эту дату.
 */
async function effectiveShifts(from: string, to: string): Promise<EffectiveShift[]> {
  const [explicit, templates] = await Promise.all([
    (prisma as any).scheduleShift.findMany({
      where: { date: { gte: from, lte: to } },
      include: { user: userSelect, room: true },
    }),
    (prisma as any).scheduleShiftTemplate.findMany({ include: { user: userSelect, room: true } }),
  ]);
  // Переопределения (в т.ч. cancelled-«надгробия») подавляют генерацию шаблона на дату
  const overridden = new Set(
    explicit.filter((s: any) => s.templateId).map((s: any) => `${s.templateId}|${s.date}`),
  );
  const out: EffectiveShift[] = explicit
    .filter((s: any) => !s.cancelled)
    .map((s: any) => ({
      id: s.id, generated: false, templateId: s.templateId,
      userId: s.userId, roomId: s.roomId, date: s.date,
      startMin: s.startMin, endMin: s.endMin, user: s.user, room: s.room,
    }));
  for (const date of eachDate(from, to)) {
    const wd = weekdayOf(date);
    for (const t of templates) {
      if (t.weekday !== wd) continue;
      if (overridden.has(`${t.id}|${date}`)) continue;
      if (!t.room?.isActive && !explicit.some((s: any) => s.roomId === t.roomId)) continue;
      out.push({
        id: `gen_${t.id}_${date}`, generated: true, templateId: t.id,
        userId: t.userId, roomId: t.roomId, date,
        startMin: t.startMin, endMin: t.endMin, user: t.user, room: t.room,
      });
    }
  }
  return out;
}

/** Кабинет записи = смена сотрудника, перекрывающая время записи */
function deriveRoom(a: { userId: string; date: string; startMin: number; endMin: number }, shifts: EffectiveShift[]) {
  const s = shifts.find(
    (s) => s.userId === a.userId && s.date === a.date && s.startMin < a.endMin && s.endMin > a.startMin,
  );
  return s ? { roomId: s.roomId, room: s.room } : { roomId: null, room: null };
}

const overlaps = (aS: number, aE: number, bS: number, bE: number) => aS < bE && bS < aE;

const mapAppointment = (a: any, shifts: EffectiveShift[], conflictUserIds: Set<string>) => {
  const { roomId, room } = deriveRoom(a, shifts);
  return {
    id: a.id, userId: a.userId, user: a.user,
    contactId: a.contactId, contact: a.contact,
    clientName: a.clientName, clientPhone: a.clientPhone,
    date: a.date, startMin: a.startMin, endMin: a.endMin,
    status: a.status, comment: a.comment,
    roomId, room,
    conflict: conflictUserIds.has(a.id),
    createdById: a.createdById, createdAt: a.createdAt, updatedAt: a.updatedAt,
  };
};

/** Помечает записи, пересекающиеся по времени у одного сотрудника */
function markConflicts(appts: any[]): Set<string> {
  const ids = new Set<string>();
  const byUser = new Map<string, any[]>();
  for (const a of appts) {
    if (a.status === 'cancelled') continue;
    const key = `${a.userId}|${a.date}`;
    byUser.set(key, [...(byUser.get(key) || []), a]);
  }
  for (const list of byUser.values()) {
    for (let i = 0; i < list.length; i++)
      for (let j = i + 1; j < list.length; j++)
        if (overlaps(list[i].startMin, list[i].endMin, list[j].startMin, list[j].endMin)) {
          ids.add(list[i].id); ids.add(list[j].id);
        }
  }
  return ids;
}

// ---------- zod ----------

const minutes = z.number().int().min(0).max(1440);
const roomSchema = z.object({
  name: z.string().trim().min(1, 'Укажите название кабинета').max(80),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).default('#3b82f6'),
  note: z.string().max(500).default(''),
  position: z.number().int().default(0),
});
const templateSchema = z.object({
  userId: z.string().min(1),
  roomId: z.string().min(1),
  weekdays: z.array(z.number().int().min(0).max(6)).min(1, 'Выберите хотя бы один день недели'),
  startMin: minutes, endMin: minutes,
}).refine((v) => v.startMin < v.endMin, { message: 'Начало смены должно быть раньше конца' });
const shiftSchema = z.object({
  userId: z.string().min(1),
  roomId: z.string().min(1),
  date: z.string().regex(DATE_RE, 'Дата в формате ГГГГ-ММ-ДД'),
  startMin: minutes, endMin: minutes,
}).refine((v) => v.startMin < v.endMin, { message: 'Начало смены должно быть раньше конца' });
const shiftMoveSchema = z.object({
  date: z.string().regex(DATE_RE), // дата экземпляра (для gen_-смен)
  userId: z.string().min(1).optional(),
  roomId: z.string().min(1),
  startMin: minutes, endMin: minutes,
}).refine((v) => v.startMin < v.endMin, { message: 'Начало смены должно быть раньше конца' });
const appointmentBase = z.object({
  userId: z.string().min(1, 'Выберите сотрудника'),
  contactId: z.string().nullish(),
  clientName: z.string().trim().min(1, 'Укажите клиента').max(120),
  clientPhone: z.string().max(40).default(''),
  date: z.string().regex(DATE_RE),
  startMin: minutes, endMin: minutes,
  status: z.enum(STATUSES).default('planned'),
  comment: z.string().max(20000).default(''),
});
const appointmentSchema = appointmentBase.refine((v) => v.startMin < v.endMin, { message: 'Начало приёма должно быть раньше конца' });

// ---------- rooms ----------

router.get('/rooms', async (req: AuthRequest, res) => {
  const all = req.query.all === '1' && isAdmin(req);
  const rooms = await (prisma as any).scheduleRoom.findMany({
    where: all ? {} : { isActive: true },
    orderBy: [{ position: 'asc' }, { name: 'asc' }],
  });
  res.json(rooms);
});

router.post('/rooms', async (req: AuthRequest, res) => {
  if (!isAdmin(req)) return forbid(res);
  try {
    const data = roomSchema.parse(req.body || {});
    const room = await (prisma as any).scheduleRoom.create({ data });
    res.json(room);
  } catch (err: any) {
    res.status(err.name === 'ZodError' ? 400 : 500).json({ error: err.errors?.[0]?.message || err.message });
  }
});

router.put('/rooms/:id', async (req: AuthRequest, res) => {
  if (!isAdmin(req)) return forbid(res);
  try {
    const data = roomSchema.partial().parse(req.body || {});
    const room = await (prisma as any).scheduleRoom.update({ where: { id: req.params.id }, data });
    res.json(room);
  } catch (err: any) {
    res.status(err.name === 'ZodError' ? 400 : 500).json({ error: err.errors?.[0]?.message || err.message });
  }
});

// Мягкое удаление: смены и история остаются
router.delete('/rooms/:id', async (req: AuthRequest, res) => {
  if (!isAdmin(req)) return forbid(res);
  try {
    await (prisma as any).scheduleRoom.update({ where: { id: req.params.id }, data: { isActive: false } });
    res.json({ ok: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ---------- shift templates ----------

router.get('/templates', async (_req: AuthRequest, res) => {
  const list = await (prisma as any).scheduleShiftTemplate.findMany({
    include: { user: userSelect, room: true },
    orderBy: [{ weekday: 'asc' }, { startMin: 'asc' }],
  });
  res.json(list);
});

router.post('/templates', async (req: AuthRequest, res) => {
  if (!isAdmin(req)) return forbid(res);
  try {
    const data = templateSchema.parse(req.body || {});
    const created = await Promise.all(
      data.weekdays.map((weekday) =>
        (prisma as any).scheduleShiftTemplate.create({
          data: { userId: data.userId, roomId: data.roomId, weekday, startMin: data.startMin, endMin: data.endMin },
          include: { user: userSelect, room: true },
        }),
      ),
    );
    res.json(created);
  } catch (err: any) {
    res.status(err.name === 'ZodError' ? 400 : 500).json({ error: err.errors?.[0]?.message || err.message });
  }
});

router.delete('/templates/:id', async (req: AuthRequest, res) => {
  if (!isAdmin(req)) return forbid(res);
  try {
    await (prisma as any).scheduleShiftTemplate.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ---------- shifts ----------

router.get('/shifts', async (req: AuthRequest, res) => {
  const from = String(req.query.from || '');
  const to = String(req.query.to || from);
  if (!DATE_RE.test(from) || !DATE_RE.test(to)) return res.status(400).json({ error: 'Параметры from/to в формате ГГГГ-ММ-ДД' });
  res.json(await effectiveShifts(from, to));
});

router.post('/shifts', async (req: AuthRequest, res) => {
  if (!isAdmin(req)) return forbid(res);
  try {
    const data = shiftSchema.parse(req.body || {});
    const shift = await (prisma as any).scheduleShift.create({
      data,
      include: { user: userSelect, room: true },
    });
    res.json({ ...shift, generated: false });
  } catch (err: any) {
    res.status(err.name === 'ZodError' ? 400 : 500).json({ error: err.errors?.[0]?.message || err.message });
  }
});

/**
 * Перенос/изменение смены. Для сгенерированной из шаблона (id = gen_<templateId>_<date>)
 * создаётся переопределение на эту дату — сам шаблон не меняется.
 * Записи клиентов переносить не нужно: их кабинет вычисляется из смены.
 */
router.put('/shifts/:id', async (req: AuthRequest, res) => {
  if (!isAdmin(req)) return forbid(res);
  try {
    const id = req.params.id;
    if (id.startsWith('gen_')) {
      const rest = id.slice(4);
      const us = rest.lastIndexOf('_');
      const templateId = rest.slice(0, us);
      const date = rest.slice(us + 1);
      const body = shiftMoveSchema.parse({ ...(req.body || {}), date });
      const tpl = await (prisma as any).scheduleShiftTemplate.findUnique({ where: { id: templateId } });
      if (!tpl) return res.status(404).json({ error: 'Шаблон смены не найден' });
      // Одно переопределение на пару шаблон+дата: обновляем существующее, иначе создаём
      const existing = await (prisma as any).scheduleShift.findFirst({ where: { templateId, date } });
      const data = {
        userId: body.userId || tpl.userId, roomId: body.roomId,
        startMin: body.startMin, endMin: body.endMin, cancelled: false,
      };
      const shift = existing
        ? await (prisma as any).scheduleShift.update({ where: { id: existing.id }, data, include: { user: userSelect, room: true } })
        : await (prisma as any).scheduleShift.create({ data: { ...data, templateId, date }, include: { user: userSelect, room: true } });
      return res.json({ ...shift, generated: false });
    }
    const body = shiftMoveSchema.parse(req.body || {});
    const shift = await (prisma as any).scheduleShift.update({
      where: { id },
      data: { userId: body.userId, roomId: body.roomId, date: body.date, startMin: body.startMin, endMin: body.endMin },
      include: { user: userSelect, room: true },
    });
    res.json({ ...shift, generated: false });
  } catch (err: any) {
    res.status(err.name === 'ZodError' ? 400 : 500).json({ error: err.errors?.[0]?.message || err.message });
  }
});

// Удаление: явную смену удаляем, сгенерированную — «гасим» cancelled-записью
router.delete('/shifts/:id', async (req: AuthRequest, res) => {
  if (!isAdmin(req)) return forbid(res);
  try {
    const id = req.params.id;
    if (id.startsWith('gen_')) {
      const rest = id.slice(4);
      const us = rest.lastIndexOf('_');
      const templateId = rest.slice(0, us);
      const date = rest.slice(us + 1);
      if (!DATE_RE.test(date)) return res.status(400).json({ error: 'Некорректный идентификатор смены' });
      const tpl = await (prisma as any).scheduleShiftTemplate.findUnique({ where: { id: templateId } });
      if (!tpl) return res.status(404).json({ error: 'Шаблон смены не найден' });
      const existing = await (prisma as any).scheduleShift.findFirst({ where: { templateId, date } });
      if (existing) await (prisma as any).scheduleShift.update({ where: { id: existing.id }, data: { cancelled: true } });
      else await (prisma as any).scheduleShift.create({
        data: { templateId, date, userId: tpl.userId, roomId: tpl.roomId, startMin: tpl.startMin, endMin: tpl.endMin, cancelled: true },
      });
      return res.json({ ok: true });
    }
    await (prisma as any).scheduleShift.delete({ where: { id } });
    res.json({ ok: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ---------- appointments ----------

async function loadAppointments(from: string, to: string, userId?: string) {
  const where: any = { date: { gte: from, lte: to } };
  if (userId) where.userId = userId;
  const appts = await (prisma as any).scheduleAppointment.findMany({
    where,
    include: { user: userSelect, contact: { select: { id: true, name: true, phone: true } } },
    orderBy: [{ date: 'asc' }, { startMin: 'asc' }],
  });
  const shifts = await effectiveShifts(from, to);
  const conflicts = markConflicts(appts);
  return appts.map((a: any) => mapAppointment(a, shifts, conflicts));
}

router.get('/appointments', async (req: AuthRequest, res) => {
  const from = String(req.query.from || '');
  const to = String(req.query.to || from);
  if (!DATE_RE.test(from) || !DATE_RE.test(to)) return res.status(400).json({ error: 'Параметры from/to в формате ГГГГ-ММ-ДД' });
  res.json(await loadAppointments(from, to, req.query.userId ? String(req.query.userId) : undefined));
});

router.post('/appointments', async (req: AuthRequest, res) => {
  if (!isAdmin(req)) return forbid(res);
  try {
    const data = appointmentSchema.parse(req.body || {});
    const appt = await (prisma as any).scheduleAppointment.create({
      data: { ...data, contactId: data.contactId || null, createdById: req.user!.id },
      include: { user: userSelect, contact: { select: { id: true, name: true, phone: true } } },
    });
    const shifts = await effectiveShifts(data.date, data.date);
    res.json(mapAppointment(appt, shifts, markConflicts([appt])));
  } catch (err: any) {
    res.status(err.name === 'ZodError' ? 400 : 500).json({ error: err.errors?.[0]?.message || err.message });
  }
});

router.put('/appointments/:id', async (req: AuthRequest, res) => {
  if (!isAdmin(req)) return forbid(res);
  try {
    const data = appointmentBase.partial().parse(req.body || {});
    if (data.startMin !== undefined && data.endMin !== undefined && data.startMin >= data.endMin) {
      return res.status(400).json({ error: 'Начало приёма должно быть раньше конца' });
    }
    const appt = await (prisma as any).scheduleAppointment.update({
      where: { id: req.params.id },
      data: { ...data, contactId: data.contactId === undefined ? undefined : data.contactId || null },
      include: { user: userSelect, contact: { select: { id: true, name: true, phone: true } } },
    });
    const shifts = await effectiveShifts(appt.date, appt.date);
    const sameDay = await (prisma as any).scheduleAppointment.findMany({ where: { date: appt.date, userId: appt.userId } });
    res.json(mapAppointment(appt, shifts, markConflicts(sameDay)));
  } catch (err: any) {
    res.status(err.name === 'ZodError' ? 400 : 500).json({ error: err.errors?.[0]?.message || err.message });
  }
});

router.delete('/appointments/:id', async (req: AuthRequest, res) => {
  if (!isAdmin(req)) return forbid(res);
  try {
    await (prisma as any).scheduleAppointment.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ---------- calendar aggregates ----------

/** День: кабинеты, сотрудники, смены, записи с вычисленным кабинетом и конфликтами */
router.get('/day', async (req: AuthRequest, res) => {
  const date = String(req.query.date || '');
  if (!DATE_RE.test(date)) return res.status(400).json({ error: 'Параметр date в формате ГГГГ-ММ-ДД' });
  const [rooms, shifts, appts] = await Promise.all([
    (prisma as any).scheduleRoom.findMany({ where: { isActive: true }, orderBy: [{ position: 'asc' }, { name: 'asc' }] }),
    effectiveShifts(date, date),
    (prisma as any).scheduleAppointment.findMany({
      where: { date },
      include: { user: userSelect, contact: { select: { id: true, name: true, phone: true } } },
      orderBy: { startMin: 'asc' },
    }),
  ]);
  const conflicts = markConflicts(appts);
  // Конфликт кабинета: две смены одновременно в одном кабинете
  const roomConflicts = new Set<string>();
  for (let i = 0; i < shifts.length; i++)
    for (let j = i + 1; j < shifts.length; j++)
      if (shifts[i].roomId === shifts[j].roomId && overlaps(shifts[i].startMin, shifts[i].endMin, shifts[j].startMin, shifts[j].endMin)) {
        roomConflicts.add(shifts[i].id); roomConflicts.add(shifts[j].id);
      }
  // Сотрудники дня: у кого есть смена или записи
  const userMap = new Map<string, any>();
  for (const s of shifts) if (s.user) userMap.set(s.user.id, s.user);
  for (const a of appts) if (a.user) userMap.set(a.user.id, a.user);
  res.json({
    date,
    rooms,
    users: [...userMap.values()],
    shifts: shifts.map((s) => ({ ...s, roomConflict: roomConflicts.has(s.id) })),
    appointments: appts.map((a: any) => mapAppointment(a, shifts, conflicts)),
  });
});

/** Месяц: агрегаты по датам для календарной сетки */
router.get('/month', async (req: AuthRequest, res) => {
  const year = parseInt(String(req.query.year), 10);
  const month = parseInt(String(req.query.month), 10); // 1..12
  if (!year || !month || month < 1 || month > 12) return res.status(400).json({ error: 'Параметры year/month' });
  const from = `${year}-${String(month).padStart(2, '0')}-01`;
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const to = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
  const [shifts, appts] = await Promise.all([
    effectiveShifts(from, to),
    (prisma as any).scheduleAppointment.findMany({ where: { date: { gte: from, lte: to } } }),
  ]);
  const days: Record<string, { shifts: number; appointments: number; rooms: Record<string, number> }> = {};
  for (const s of shifts) {
    const d = (days[s.date] = days[s.date] || { shifts: 0, appointments: 0, rooms: {} });
    d.shifts++;
  }
  for (const a of appts) {
    const d = (days[a.date] = days[a.date] || { shifts: 0, appointments: 0, rooms: {} });
    d.appointments++;
    const { roomId } = deriveRoom(a, shifts);
    if (roomId) d.rooms[roomId] = (d.rooms[roomId] || 0) + 1;
  }
  res.json({ year, month, days });
});

export default router;
