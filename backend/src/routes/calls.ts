import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import { sendPushToUser } from '../lib/push.js';
import { sendCallEvent, openCallRoom, closeCallRoom } from '../lib/call-hub.js';

// Аудио/видеозвонки 1-на-1 между пользователями (WebRTC peer-to-peer).
// Этот роут — управление звонками (создание/акцепт/отклонение/завершение/история)
// + уведомление вызываемого через WebSocket и Web Push (в т.ч. когда CRM
// закрыта: push показывает системное уведомление с кнопками «Принять/Отклонить»,
// клик открывает CRM с ?call=<id> и автоподключением — уровень 1, задел под
// нативный Capacitor-клиент с ответом с экрана блокировки — уровень 2).
// SDP/ICE-обмен идёт по сигнальному WebSocket /api/calls/ws (см. calls-ws.ts).

const router = Router();
router.use(authMiddleware);

const RING_TIMEOUT_MS = 45000; // сколько звонок «звонит» до перехода в missed

// Таймеры «снятия трубки»: callId -> timeout
const ringTimers = new Map<string, NodeJS.Timeout>();

function clearRingTimer(callId: string) {
  const timer = ringTimers.get(callId);
  if (timer) {
    clearTimeout(timer);
    ringTimers.delete(callId);
  }
}

// Активный (звонящий или идущий) звонок пользователя — для проверки «занят»
async function findActiveCall(userId: string) {
  return prisma.webCall.findFirst({
    where: {
      status: { in: ['ringing', 'ongoing'] },
      OR: [{ callerId: userId }, { calleeId: userId }],
    },
    orderBy: { createdAt: 'desc' },
  });
}

const userBrief = { select: { id: true, name: true, avatar: true } };

function toClient(call: any) {
  return {
    ...call,
    // длительность разговора в секундах (для истории звонков)
    duration: call.answeredAt && call.endedAt
      ? Math.round((new Date(call.endedAt).getTime() - new Date(call.answeredAt).getTime()) / 1000)
      : 0,
  };
}

const initiateSchema = z.object({
  calleeId: z.string().min(1),
  type: z.enum(['audio', 'video']).default('audio'),
});

// Инициировать звонок
router.post('/', async (req: AuthRequest, res) => {
  try {
    const data = initiateSchema.parse(req.body);
    const callerId = req.user!.id;

    if (data.calleeId === callerId) {
      return res.status(400).json({ error: 'Нельзя позвонить самому себе' });
    }
    const callee = await prisma.user.findUnique({ where: { id: data.calleeId } });
    if (!callee) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }

    // Занятость: один активный звонок на пользователя
    if (await findActiveCall(callerId)) {
      return res.status(409).json({ error: 'Вы уже участвуете в звонке' });
    }
    if (await findActiveCall(data.calleeId)) {
      return res.status(409).json({ error: `${callee.name} занят(а) другим звонком` });
    }

    const call = await prisma.webCall.create({
      data: { callerId, calleeId: data.calleeId, type: data.type, status: 'ringing' },
      include: { caller: userBrief, callee: userBrief },
    });
    openCallRoom(call.id, callerId, data.calleeId);

    // Входящий вызов: сразу по WebSocket (приложение открыто)…
    sendCallEvent(data.calleeId, {
      type: 'incoming_call',
      call: toClient(call),
      from: call.caller,
    });

    // …и дублируем в Web Push (приложение закрыто): системное уведомление
    // с кнопками «Принять/Отклонить» (обрабатывает public/sw.js)
    sendPushToUser(
      data.calleeId,
      {
        title: `Входящий ${call.type === 'video' ? 'видео' : 'аудио'}звонок`,
        body: call.caller.name,
        url: '/',
        kind: 'incoming-call',
        callId: call.id,
        callType: call.type,
      },
      'call'
    ).catch(() => {});

    // Автосброс по таймауту: вызываемый не ответил
    const timer = setTimeout(async () => {
      ringTimers.delete(call.id);
      try {
        const fresh = await prisma.webCall.findUnique({ where: { id: call.id } });
        if (fresh && fresh.status === 'ringing') {
          await prisma.webCall.update({
            where: { id: call.id },
            data: { status: 'missed', endedAt: new Date() },
          });
          closeCallRoom(call.id);
          sendCallEvent(fresh.callerId, { type: 'call_missed', callId: call.id });
          sendCallEvent(fresh.calleeId, { type: 'call_cancelled', callId: call.id });
        }
      } catch (err) {
        console.error('[Calls] Ring timeout error:', err);
      }
    }, RING_TIMEOUT_MS);
    ringTimers.set(call.id, timer);

    res.json(toClient(call));
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Ответить на входящий звонок
router.post('/:id/accept', async (req: AuthRequest, res) => {
  try {
    const call = await prisma.webCall.findUnique({ where: { id: req.params.id } });
    if (!call || call.calleeId !== req.user!.id) {
      return res.status(404).json({ error: 'Звонок не найден' });
    }
    if (call.status !== 'ringing') {
      return res.status(409).json({ error: 'Звонок уже завершён' });
    }
    // Вызываемый успел принять другой звонок
    const other = await findActiveCall(req.user!.id);
    if (other && other.id !== call.id) {
      await prisma.webCall.update({
        where: { id: call.id },
        data: { status: 'busy', endedAt: new Date() },
      });
      clearRingTimer(call.id);
      closeCallRoom(call.id);
      sendCallEvent(call.callerId, { type: 'call_rejected', callId: call.id, reason: 'busy' });
      return res.status(409).json({ error: 'Вы заняты другим звонком' });
    }

    clearRingTimer(call.id);
    const updated = await prisma.webCall.update({
      where: { id: call.id },
      data: { status: 'ongoing', answeredAt: new Date() },
      include: { caller: userBrief, callee: userBrief },
    });
    sendCallEvent(call.callerId, { type: 'call_accepted', callId: call.id, call: toClient(updated) });
    res.json(toClient(updated));
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Отклонить входящий звонок
router.post('/:id/reject', async (req: AuthRequest, res) => {
  try {
    const call = await prisma.webCall.findUnique({ where: { id: req.params.id } });
    if (!call || call.calleeId !== req.user!.id) {
      return res.status(404).json({ error: 'Звонок не найден' });
    }
    if (call.status !== 'ringing') {
      return res.status(409).json({ error: 'Звонок уже завершён' });
    }
    clearRingTimer(call.id);
    await prisma.webCall.update({
      where: { id: call.id },
      data: { status: 'rejected', endedAt: new Date() },
    });
    closeCallRoom(call.id);
    sendCallEvent(call.callerId, { type: 'call_rejected', callId: call.id });
    res.json({ success: true });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Отменить исходящий звонок (до ответа)
router.post('/:id/cancel', async (req: AuthRequest, res) => {
  try {
    const call = await prisma.webCall.findUnique({ where: { id: req.params.id } });
    if (!call || call.callerId !== req.user!.id) {
      return res.status(404).json({ error: 'Звонок не найден' });
    }
    if (call.status !== 'ringing') {
      return res.status(409).json({ error: 'Звонок уже завершён' });
    }
    clearRingTimer(call.id);
    await prisma.webCall.update({
      where: { id: call.id },
      data: { status: 'cancelled', endedAt: new Date() },
    });
    closeCallRoom(call.id);
    sendCallEvent(call.calleeId, { type: 'call_cancelled', callId: call.id });
    res.json({ success: true });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Завершить идущий звонок
router.post('/:id/end', async (req: AuthRequest, res) => {
  try {
    const call = await prisma.webCall.findUnique({ where: { id: req.params.id } });
    if (!call || (call.callerId !== req.user!.id && call.calleeId !== req.user!.id)) {
      return res.status(404).json({ error: 'Звонок не найден' });
    }
    if (call.status !== 'ongoing') {
      return res.status(409).json({ error: 'Звонок уже завершён' });
    }
    const updated = await prisma.webCall.update({
      where: { id: call.id },
      data: { status: 'ended', endedAt: new Date() },
      include: { caller: userBrief, callee: userBrief },
    });
    closeCallRoom(call.id);
    const peerId = call.callerId === req.user!.id ? call.calleeId : call.callerId;
    sendCallEvent(peerId, { type: 'call_ended', callId: call.id, call: toClient(updated) });
    res.json(toClient(updated));
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Мой активный звонок (ringing|ongoing) — восстановление состояния после
// перезагрузки страницы или открытия CRM по клику из push-уведомления
router.get('/active', async (req: AuthRequest, res) => {
  const call = await findActiveCall(req.user!.id);
  if (!call) return res.json(null);
  const full = await prisma.webCall.findUnique({
    where: { id: call.id },
    include: { caller: userBrief, callee: userBrief },
  });
  res.json({
    call: toClient(full),
    role: full!.callerId === req.user!.id ? 'caller' : 'callee',
  });
});

// История звонков текущего пользователя (оба направления), свежие первыми
router.get('/', async (req: AuthRequest, res) => {
  const limit = Math.min(Number(req.query.limit) || 50, 200);
  const calls = await prisma.webCall.findMany({
    where: {
      OR: [{ callerId: req.user!.id }, { calleeId: req.user!.id }],
      status: { in: ['ended', 'rejected', 'missed', 'cancelled', 'busy'] },
    },
    include: { caller: userBrief, callee: userBrief },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
  res.json(calls.map(toClient));
});

export default router;
