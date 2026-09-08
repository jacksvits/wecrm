import { prisma } from './prisma.js';
import { createNotification } from './notifications.js';

const TICK_MS = 30_000;

/**
 * Следующее время срабатывания для повторяющегося напоминания
 */
function nextOccurrence(current: Date, repeat: string): Date | null {
  const next = new Date(current);
  switch (repeat) {
    case 'daily':
      next.setDate(next.getDate() + 1);
      break;
    case 'weekly':
      next.setDate(next.getDate() + 7);
      break;
    case 'monthly':
      next.setMonth(next.getMonth() + 1);
      break;
    case 'yearly':
      next.setFullYear(next.getFullYear() + 1);
      break;
    default:
      return null;
  }
  return next;
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

async function processTick() {
  const now = new Date();

  const candidates = await prisma.reminder.findMany({
    where: {
      completedAt: null,
      lastNotifiedAt: null,
      remindAt: { lte: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) },
    },
    take: 500,
  });

  for (const reminder of candidates) {
    try {
      const notifyAt = new Date(reminder.remindAt.getTime() - reminder.notifyBeforeMin * 60_000);
      if (notifyAt > now) continue;

      const preview = stripHtml(reminder.content).slice(0, 140);

      // In-app уведомление (колокольчик) + Browser Push
      await createNotification({
        userId: reminder.userId,
        type: 'reminder',
        title: `Напоминание: ${reminder.title}`,
        body: preview || `Сработает ${reminder.remindAt.toLocaleString('ru-RU')}`,
        entityType: 'reminder',
        entityId: reminder.id,
        url: '/reminders',
        sendPush: true,
      });

      if (reminder.repeat === 'none') {
        await prisma.reminder.update({
          where: { id: reminder.id },
          data: { lastNotifiedAt: now },
        });
      } else {
        const next = nextOccurrence(reminder.remindAt, reminder.repeat);
        if (!next || (reminder.repeatEndAt && next > reminder.repeatEndAt)) {
          // Повторы закончились — больше не уведомляем
          await prisma.reminder.update({
            where: { id: reminder.id },
            data: { lastNotifiedAt: now },
          });
        } else {
          // Переносим на следующее срабатывание
          await prisma.reminder.update({
            where: { id: reminder.id },
            data: { remindAt: next, lastNotifiedAt: null },
          });
        }
      }
    } catch (err: any) {
      console.error(`[Reminders] Ошибка обработки ${reminder.id}:`, err.message || err);
    }
  }
}

export function startReminderScheduler() {
  console.log('[Reminders] Планировщик напоминаний запущен (интервал 30с)');
  setInterval(() => {
    processTick().catch(err => console.error('[Reminders] Ошибка тика:', err));
  }, TICK_MS);
}
