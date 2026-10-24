// Публичная форма обратной связи лендинга welans.ru: создаёт новую задачу в проекте.
// Без авторизации (роут смонтирован вне authMiddleware, но ПОСЛЕ tenantMiddleware —
// текущая организация определяется по Host, как у остальных /api-роутов).
// Антиспам: in-memory лимит по IP + honeypot-поле «company».
import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { notifyRoleUsers } from '../lib/notifications.js';
import { sendPushToRoleUsers } from '../lib/push.js';
import { broadcast, CHANNELS } from '../lib/events.js';

const router = Router();

const feedbackSchema = z.object({
  name: z.string().trim().min(1).max(200),
  phone: z.string().trim().min(3).max(50),
  message: z.string().trim().max(5000).optional().default(''),
  email: z.string().trim().max(200).optional().default(''),
  // Honeypot: боты заполняют скрытое поле, люди — нет
  company: z.string().optional(),
});

// Лимит: не более 5 заявок с одного IP за 10 минут
const RATE_LIMIT = 5;
const RATE_WINDOW_MS = 10 * 60 * 1000;
const rateHits = new Map<string, number[]>();
function rateLimited(ip: string): boolean {
  const now = Date.now();
  const hits = (rateHits.get(ip) || []).filter((t) => now - t < RATE_WINDOW_MS);
  hits.push(now);
  rateHits.set(ip, hits);
  // Раз в час чистим устаревшие записи, чтобы мапа не росла бесконечно
  if (rateHits.size > 10000) {
    for (const [key, arr] of rateHits) {
      const fresh = arr.filter((t) => now - t < RATE_WINDOW_MS);
      if (fresh.length) rateHits.set(key, fresh); else rateHits.delete(key);
    }
  }
  return hits.length > RATE_LIMIT;
}

router.post('/', async (req, res) => {
  try {
    const parsed = feedbackSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Заполните, пожалуйста, Ф.И.О и телефон' });
    }
    const data = parsed.data;
    // Honeypot сработал — притворяемся успехом, задачу не создаём
    if (data.company) return res.json({ ok: true });
    const ip = (req.headers['x-real-ip'] as string) || req.socket.remoteAddress || 'unknown';
    if (rateLimited(ip)) {
      return res.status(429).json({ error: 'Слишком много заявок. Попробуйте позже.' });
    }

    // Создатель задачи — первый админ организации (fallback — любой пользователь)
    let creator = await prisma.user.findFirst({
      where: { role: { name: 'admin' } },
      orderBy: { createdAt: 'asc' },
    });
    if (!creator) creator = await prisma.user.findFirst({ orderBy: { createdAt: 'asc' } });
    if (!creator) return res.status(500).json({ error: 'Не удалось создать заявку' });

    const contact = [
      data.phone && 'Телефон: ' + data.phone,
      data.email && 'Email: ' + data.email,
    ].filter(Boolean).join('\n');
    const description = [contact, '', data.message].filter((s, i) => s !== '' || i === 2).join('\n').trim();

    const task = await prisma.task.create({
      data: {
        title: 'Заявка с сайта: ' + data.name,
        description,
        status: 'open',
        priority: 'medium',
        startDate: new Date(),
        creatorId: creator.id,
      },
    });

    await prisma.activity.create({ data: { action: 'created', entity: 'task', entityId: task.id, userId: creator.id } });
    await prisma.taskHistory.create({ data: { taskId: task.id, field: 'task', oldValue: null, newValue: 'Создана задача: ' + task.title, userId: creator.id } });

    const payload = {
      title: 'Новая заявка с сайта',
      body: data.name + ' оставил заявку: ' + task.title,
      url: '/tasks/' + task.id,
    };
    sendPushToRoleUsers(['admin', 'manager'], payload, 'task', creator.id).catch(() => {});
    await notifyRoleUsers(['admin', 'manager'], payload, creator.id, false);

    broadcast(CHANNELS.TASKS, { action: 'create', entity: 'task', id: task.id });
    res.status(201).json({ ok: true, id: task.id });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
