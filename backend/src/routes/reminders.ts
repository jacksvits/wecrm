import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { authMiddleware } from '../middleware/auth.js';
import { createNotification } from '../lib/notifications.js';

const router = Router();
router.use(authMiddleware);

const REPEATS = ['none', 'daily', 'weekly', 'monthly', 'yearly'];

// Автор и получатели напоминания — нужны списку и карточке
const includeFull = {
  status: true,
  user: { select: { id: true, name: true } },
  sharedWith: { include: { user: { select: { id: true, name: true } } } },
} as const;

// Доступ к напоминанию: владелец или получатель, с кем поделились
function canView(reminder: { userId: string; sharedWith: { userId: string }[] }, userId: string): boolean {
  return reminder.userId === userId || reminder.sharedWith.some(s => s.userId === userId);
}

// Уведомить пользователей о том, что с ними поделились напоминанием
async function notifyRecipients(
  reminderId: string,
  reminderTitle: string,
  recipientIds: string[],
  authorName: string
) {
  for (const uid of recipientIds) {
    try {
      await createNotification({
        userId: uid,
        type: 'reminder_shared',
        title: `Напоминание от ${authorName}`,
        body: reminderTitle,
        entityType: 'reminder',
        entityId: reminderId,
        url: '/reminders',
      });
    } catch (e: any) {
      console.error('[reminders:notify]', e.message || e);
    }
  }
}

async function getDefaultStatusId(): Promise<string | null> {
  const def = await prisma.status.findFirst({
    where: { entityType: 'reminder', isDefault: true, isActive: true },
  });
  if (def) return def.id;
  const first = await prisma.status.findFirst({
    where: { entityType: 'reminder', isActive: true },
    orderBy: { sortOrder: 'asc' },
  });
  return first ? first.id : null;
}

/**
 * GET /api/reminders
 * Список напоминаний текущего пользователя: свои + те, которыми поделились
 * query: q (поиск), statusId, filter (active|completed|all)
 */
router.get('/', async (req, res) => {
  try {
    const user = (req as any).user;
    const { q, statusId, filter } = req.query;

    const where: any = {
      OR: [
        { userId: user.id },
        { sharedWith: { some: { userId: user.id } } },
      ],
    };

    if (filter === 'completed') where.completedAt = { not: null };
    else if (filter !== 'all') where.completedAt = null;

    if (statusId) where.statusId = statusId as string;

    if (q) {
      const searchTerm = q as string;
      where.AND = [
        {
          OR: [
            { title: { contains: searchTerm, mode: 'insensitive' } },
            { content: { contains: searchTerm, mode: 'insensitive' } },
          ],
        },
      ];
    }

    const reminders = await prisma.reminder.findMany({
      where,
      include: includeFull,
      orderBy: { remindAt: 'asc' },
    });

    res.json(reminders);
  } catch (err: any) {
    console.error('[reminders:list]', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/reminders/:id
 * Просмотр: владелец или получатель, с которым поделились
 */
router.get('/:id', async (req, res) => {
  try {
    const user = (req as any).user;
    const reminder = await prisma.reminder.findUnique({
      where: { id: req.params.id },
      include: includeFull,
    });

    if (!reminder) {
      return res.status(404).json({ error: 'Напоминание не найдено' });
    }

    if (!canView(reminder, user.id)) {
      return res.status(403).json({ error: 'Нет прав на просмотр' });
    }

    res.json(reminder);
  } catch (err: any) {
    console.error('[reminders:get]', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/reminders
 * Создание. body: ..., recipientIds?: string[] — с кем поделиться
 */
router.post('/', async (req, res) => {
  try {
    const user = (req as any).user;
    const { title, content, remindAt, notifyBeforeMin, repeat, repeatEndAt, statusId, recipientIds } = req.body;

    if (!title?.trim()) {
      return res.status(400).json({ error: 'Заголовок обязателен' });
    }

    if (!remindAt || isNaN(new Date(remindAt).getTime())) {
      return res.status(400).json({ error: 'Укажите дату и время напоминания' });
    }

    let finalStatusId = statusId || null;
    if (finalStatusId) {
      const st = await prisma.status.findUnique({ where: { id: finalStatusId } });
      if (!st || st.entityType !== 'reminder') finalStatusId = null;
    }
    if (!finalStatusId) {
      finalStatusId = await getDefaultStatusId();
    }

    const recipients: string[] = Array.isArray(recipientIds)
      ? recipientIds.filter((x: any) => typeof x === 'string' && x && x !== user.id)
      : [];

    const reminder = await prisma.reminder.create({
      data: {
        title: title.trim(),
        content: content?.trim() || '',
        userId: user.id,
        statusId: finalStatusId,
        remindAt: new Date(remindAt),
        notifyBeforeMin: Math.max(0, Math.min(10080, parseInt(notifyBeforeMin) || 0)),
        repeat: REPEATS.includes(repeat) ? repeat : 'none',
        repeatEndAt: repeatEndAt ? new Date(repeatEndAt) : null,
      },
      include: includeFull,
    });

    if (recipients.length) {
      await prisma.reminderRecipient.createMany({
        data: recipients.map(uid => ({ reminderId: reminder.id, userId: uid })),
        skipDuplicates: true,
      });
      await notifyRecipients(reminder.id, reminder.title, recipients, user.name);
      reminder.sharedWith = await prisma.reminderRecipient.findMany({
        where: { reminderId: reminder.id },
        include: { user: { select: { id: true, name: true } } },
      });
    }

    res.status(201).json(reminder);
  } catch (err: any) {
    console.error('[reminders:create]', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * PATCH /api/reminders/:id
 * Редактирование: только владелец. Можно обновить recipientIds — список, с кем поделиться
 */
router.patch('/:id', async (req, res) => {
  try {
    const user = (req as any).user;
    const existing = await prisma.reminder.findUnique({
      where: { id: req.params.id },
      include: { sharedWith: true },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Напоминание не найдено' });
    }

    if (existing.userId !== user.id) {
      return res.status(403).json({ error: 'Нет прав на редактирование' });
    }

    const { title, content, remindAt, notifyBeforeMin, repeat, repeatEndAt, statusId, recipientIds } = req.body;
    const data: any = {};

    if (title !== undefined) {
      if (!title.trim()) {
        return res.status(400).json({ error: 'Заголовок обязателен' });
      }
      data.title = title.trim();
    }
    if (content !== undefined) data.content = content.trim();
    if (notifyBeforeMin !== undefined) {
      data.notifyBeforeMin = Math.max(0, Math.min(10080, parseInt(notifyBeforeMin) || 0));
    }
    if (repeat !== undefined) {
      data.repeat = REPEATS.includes(repeat) ? repeat : 'none';
    }
    if (repeatEndAt !== undefined) {
      data.repeatEndAt = repeatEndAt ? new Date(repeatEndAt) : null;
    }
    if (statusId !== undefined) {
      if (statusId) {
        const st = await prisma.status.findUnique({ where: { id: statusId } });
        data.statusId = st && st.entityType === 'reminder' ? st.id : null;
      } else {
        data.statusId = null;
      }
    }
    if (remindAt !== undefined) {
      if (!remindAt || isNaN(new Date(remindAt).getTime())) {
        return res.status(400).json({ error: 'Некорректная дата напоминания' });
      }
      data.remindAt = new Date(remindAt);
      data.lastNotifiedAt = null;
    }

    const reminder = await prisma.reminder.update({
      where: { id: req.params.id },
      data,
      include: includeFull,
    });

    // Обновляем список получателей, если он передан
    if (Array.isArray(recipientIds)) {
      const ids: string[] = recipientIds.filter((x: any) => typeof x === 'string' && x && x !== user.id);
      const toRemove = existing.sharedWith.filter(e => !ids.includes(e.userId));
      const toAdd = ids.filter(x => !existing.sharedWith.some(e => e.userId === x));

      if (toRemove.length) {
        await prisma.reminderRecipient.deleteMany({
          where: { reminderId: reminder.id, userId: { in: toRemove.map(e => e.userId) } },
        });
      }
      if (toAdd.length) {
        await prisma.reminderRecipient.createMany({
          data: toAdd.map(uid => ({ reminderId: reminder.id, userId: uid })),
          skipDuplicates: true,
        });
        await notifyRecipients(reminder.id, reminder.title, toAdd, user.name);
      }

      reminder.sharedWith = await prisma.reminderRecipient.findMany({
        where: { reminderId: reminder.id },
        include: { user: { select: { id: true, name: true } } },
      });
    }

    res.json(reminder);
  } catch (err: any) {
    console.error('[reminders:update]', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/reminders/:id/complete
 * Отметить выполненным: только владелец
 */
router.post('/:id/complete', async (req, res) => {
  try {
    const user = (req as any).user;
    const existing = await prisma.reminder.findUnique({ where: { id: req.params.id } });

    if (!existing) {
      return res.status(404).json({ error: 'Напоминание не найдено' });
    }

    if (existing.userId !== user.id) {
      return res.status(403).json({ error: 'Нет прав' });
    }

    const doneStatus = await prisma.status.findFirst({
      where: { entityType: 'reminder', name: 'done' },
    });

    const reminder = await prisma.reminder.update({
      where: { id: req.params.id },
      data: {
        completedAt: new Date(),
        statusId: doneStatus ? doneStatus.id : undefined,
      },
      include: includeFull,
    });

    res.json(reminder);
  } catch (err: any) {
    console.error('[reminders:complete]', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/reminders/:id/reopen
 * Вернуть в активные: только владелец
 */
router.post('/:id/reopen', async (req, res) => {
  try {
    const user = (req as any).user;
    const existing = await prisma.reminder.findUnique({ where: { id: req.params.id } });

    if (!existing) {
      return res.status(404).json({ error: 'Напоминание не найдено' });
    }

    if (existing.userId !== user.id) {
      return res.status(403).json({ error: 'Нет прав' });
    }

    const reminder = await prisma.reminder.update({
      where: { id: req.params.id },
      data: {
        completedAt: null,
        lastNotifiedAt: null,
        statusId: (await getDefaultStatusId()) || undefined,
      },
      include: includeFull,
    });

    res.json(reminder);
  } catch (err: any) {
    console.error('[reminders:reopen]', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * DELETE /api/reminders/:id
 * Удаление: только владелец. У получателей напоминание просто пропадёт из списка
 */
router.delete('/:id', async (req, res) => {
  try {
    const user = (req as any).user;
    const existing = await prisma.reminder.findUnique({ where: { id: req.params.id } });

    if (!existing) {
      return res.status(404).json({ error: 'Напоминание не найдено' });
    }

    if (existing.userId !== user.id) {
      return res.status(403).json({ error: 'Нет прав на удаление' });
    }

    await prisma.reminder.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err: any) {
    console.error('[reminders:delete]', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
