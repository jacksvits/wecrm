import { prisma } from './prisma.js';
import { broadcast, CHANNELS } from './events.js';
import { notifyTaskAssignees } from './notifications.js';
import { sendPushToTaskAssignees } from './push.js';
import { syncTaskStatusToTicket } from './support-ticket-tasks.js';

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
  autoChangeEnabledAt: Date | null;
  autoChangeMinutes: number | null;
  autoChangeToStatusId: string | null;
  autoChangeToStatus: { id: string; name: string; label: string } | null;
};

/** Эффективное начало отсчёта: момент входа в статус, но не раньше включения опции */
function effectiveStart(rule: AutoChangeRule, statusChangedAt: Date | null): Date | null {
  if (!statusChangedAt) return null;
  const enabledAt = rule.autoChangeEnabledAt ? new Date(rule.autoChangeEnabledAt).getTime() : 0;
  return new Date(Math.max(new Date(statusChangedAt).getTime(), enabledAt));
}

/** Порог времени: сущности, попавшие в статус до этой отметки, подлежат переводу */
function deadlineFor(rule: AutoChangeRule): Date {
  return new Date(Date.now() - (rule.autoChangeMinutes || 0) * 60_000);
}

async function applyTaskRule(rule: AutoChangeRule, deadline: Date): Promise<void> {
  const tasks = await prisma.task.findMany({
    where: { status: rule.name, statusChangedAt: { lte: deadline } },
    select: { id: true, title: true, statusChangedAt: true },
  });
  for (const task of tasks.filter(t => { const start = effectiveStart(rule, t.statusChangedAt); return start !== null && start.getTime() <= deadline.getTime(); })) {
    await prisma.task.update({ where: { id: task.id }, data: { status: rule.autoChangeToStatus!.name } });
    // Задача может быть привязана к запросу организации — синхронизируем статус тикета
    try { await syncTaskStatusToTicket(task.id); } catch { /* не прерываем авто-смену */ }
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
  const projects = await prisma.project.findMany({
    where: { status: rule.name, statusChangedAt: { lte: deadline } },
    select: { id: true, statusChangedAt: true },
  });
  let count = 0;
  for (const p of projects) {
    const start = effectiveStart(rule, p.statusChangedAt);
    if (!start || start.getTime() > deadline.getTime()) continue;
    await prisma.project.update({ where: { id: p.id }, data: { status: rule.autoChangeToStatus!.name } });
    count++;
  }
  if (count) { broadcast(CHANNELS.PROJECTS, { action: 'update', entity: 'project' }); console.log(`[StatusAutoChange] Проектов переведено: ${count} («${rule.label}» → «${rule.autoChangeToStatus!.label}»)`); }
}

async function applyDealRule(rule: AutoChangeRule, deadline: Date): Promise<void> {
  const deals = await prisma.deal.findMany({
    where: { stage: rule.name, statusChangedAt: { lte: deadline } },
    select: { id: true, statusChangedAt: true },
  });
  let count = 0;
  for (const d of deals) {
    const start = effectiveStart(rule, d.statusChangedAt);
    if (!start || start.getTime() > deadline.getTime()) continue;
    await prisma.deal.update({ where: { id: d.id }, data: { stage: rule.autoChangeToStatus!.name } });
    count++;
  }
  if (count) { broadcast(CHANNELS.DEALS, { action: 'update', entity: 'deal' }); console.log(`[StatusAutoChange] Сделок переведено: ${count} («${rule.label}» → «${rule.autoChangeToStatus!.label}»)`); }
}

async function applyReminderRule(rule: AutoChangeRule, deadline: Date): Promise<void> {
  const reminders = await prisma.reminder.findMany({
    where: { statusId: rule.id, statusChangedAt: { lte: deadline } },
    select: { id: true, statusChangedAt: true },
  });
  let count = 0;
  for (const r of reminders) {
    const start = effectiveStart(rule, r.statusChangedAt);
    if (!start || start.getTime() > deadline.getTime()) continue;
    await prisma.reminder.update({ where: { id: r.id }, data: { statusId: rule.autoChangeToStatusId } });
    count++;
  }
  if (count) { broadcast('reminders', { action: 'update', entity: 'reminder' }); console.log(`[StatusAutoChange] Напоминаний переведено: ${count} («${rule.label}» → «${rule.autoChangeToStatus!.label}»)`); }
}

/** Один проход авто-смены статусов для текущего tenant'а (вызывается из worker) */
export async function runStatusAutoChange(): Promise<void> {
  const rules = await prisma.status.findMany({
    where: { autoChangeEnabled: true, autoChangeMinutes: { not: null }, autoChangeToStatusId: { not: null }, isActive: true },
    include: { autoChangeToStatus: { select: { id: true, name: true, label: true } } },
    // autoChangeEnabledAt выбирается по умолчанию
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
