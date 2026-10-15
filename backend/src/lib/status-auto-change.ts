import { prisma } from './prisma.js';
import { broadcast, CHANNELS } from './events.js';
import { notifyTaskAssignees } from './notifications.js';
import { sendPushToTaskAssignees } from './push.js';

/**
 * «Авто смена» статусов.
 *
 * Для каждого статуса с включённой опцией (autoChangeEnabled) раз в минуту
 * ищутся сущности, пробывшие в нём дольше autoChangeMinutes, и переводятся
 * в целевой статус (autoChangeToStatus). Время входа в текущий статус
 * фиксируется в statusChangedAt (см. middleware в lib/tenant.ts).
 *
 * Хранение статуса у сущностей разное: задачи/проекты — строковое поле
 * status (совпадает с Status.name), сделки — stage, напоминания — statusId.
 */

type AutoChangeRule = {
  id: string;
  entityType: string;
  name: string;
  label: string;
  autoChangeMinutes: number | null;
  autoChangeToStatusId: string | null;
  autoChangeToStatus: { id: string; name: string; label: string } | null;
};

/** Порог времени: сущности, попавшие в статус до этой отметки, подлежат переводу */
function deadlineFor(rule: AutoChangeRule): Date {
  return new Date(Date.now() - (rule.autoChangeMinutes || 0) * 60_000);
}

async function applyTaskRule(rule: AutoChangeRule, deadline: Date): Promise<void> {
  const tasks = await prisma.task.findMany({
    where: { status: rule.name, statusChangedAt: { lte: deadline } },
    select: { id: true, title: true },
  });
  for (const task of tasks) {
    await prisma.task.update({ where: { id: task.id }, data: { status: rule.autoChangeToStatus!.name } });
    // Запись в историю задачи: userId не задан — изменение выполнено системой
    await prisma.taskHistory.create({ data: { taskId: task.id, field: 'status', oldValue: rule.name, newValue: rule.autoChangeToStatus!.name, userId: null } });
    await prisma.taskHistory.create({ data: { taskId: task.id, field: 'task', oldValue: null, newValue: `Авто смена статуса «${rule.label}» → «${rule.autoChangeToStatus!.label}»`, userId: null } });
    const body = `Автоматически изменён статус: «${rule.label}» → «${rule.autoChangeToStatus!.label}»`;
    sendPushToTaskAssignees(task.id, { title: 'Статус задачи изменён автоматически', body, url: '/tasks' }).catch(() => {});
    await notifyTaskAssignees(task.id, { title: 'Статус задачи изменён автоматически', body, url: '/tasks/' + task.id });
    broadcast(CHANNELS.TASKS, { action: 'update', entity: 'task', id: task.id });
  }
  if (tasks.length) console.log(`[StatusAutoChange] Задач переведено: ${tasks.length} («${rule.label}» → «${rule.autoChangeToStatus!.label}»)`);
}

async function applyProjectRule(rule: AutoChangeRule, deadline: Date): Promise<void> {
  const result = await prisma.project.updateMany({
    where: { status: rule.name, statusChangedAt: { lte: deadline } },
    data: { status: rule.autoChangeToStatus!.name },
  });
  if (result.count) { broadcast(CHANNELS.PROJECTS, { action: 'update', entity: 'project' }); console.log(`[StatusAutoChange] Проектов переведено: ${result.count} («${rule.label}» → «${rule.autoChangeToStatus!.label}»)`); }
}

async function applyDealRule(rule: AutoChangeRule, deadline: Date): Promise<void> {
  const result = await prisma.deal.updateMany({
    where: { stage: rule.name, statusChangedAt: { lte: deadline } },
    data: { stage: rule.autoChangeToStatus!.name },
  });
  if (result.count) { broadcast(CHANNELS.DEALS, { action: 'update', entity: 'deal' }); console.log(`[StatusAutoChange] Сделок переведено: ${result.count} («${rule.label}» → «${rule.autoChangeToStatus!.label}»)`); }
}

async function applyReminderRule(rule: AutoChangeRule, deadline: Date): Promise<void> {
  const result = await prisma.reminder.updateMany({
    where: { statusId: rule.id, statusChangedAt: { lte: deadline } },
    data: { statusId: rule.autoChangeToStatusId },
  });
  if (result.count) { broadcast('reminders', { action: 'update', entity: 'reminder' }); console.log(`[StatusAutoChange] Напоминаний переведено: ${result.count} («${rule.label}» → «${rule.autoChangeToStatus!.label}»)`); }
}

/** Один проход авто-смены статусов для текущего tenant'а (вызывается из worker) */
export async function runStatusAutoChange(): Promise<void> {
  const rules = await prisma.status.findMany({
    where: { autoChangeEnabled: true, autoChangeMinutes: { not: null }, autoChangeToStatusId: { not: null }, isActive: true },
    include: { autoChangeToStatus: { select: { id: true, name: true, label: true } } },
  });
  for (const rule of rules) {
    if (!rule.autoChangeToStatus) continue;
    const deadline = deadlineFor(rule);
    try {
      if (rule.entityType === 'task') await applyTaskRule(rule as AutoChangeRule, deadline);
      else if (rule.entityType === 'project') await applyProjectRule(rule as AutoChangeRule, deadline);
      else if (rule.entityType === 'deal') await applyDealRule(rule as AutoChangeRule, deadline);
      else if (rule.entityType === 'reminder') await applyReminderRule(rule as AutoChangeRule, deadline);
    } catch (e: any) {
      console.error(`[StatusAutoChange] Ошибка обработки правила «${rule.label}» (${rule.entityType}):`, e.message);
    }
  }
}
