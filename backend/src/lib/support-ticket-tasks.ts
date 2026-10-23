/**
 * Интеграция запросов организаций (tenant_tickets) с задачами платформы.
 *
 * Каждый запрос организации в поддержку = задача в платформенной БД
 * (welans.cc) от системного пользователя «Поддержка WeCRM». Текст обращения
 * и вся переписка дублируются в обсуждении задачи (comments):
 *  - сообщение организации → комментарий с подписью автора и организации;
 *  - комментарий сотрудника платформы в обсуждении → сообщение в тикете.
 * Статусы тикета и задачи синхронизируются в обе стороны.
 */
import { randomBytes } from 'crypto';
import bcrypt from 'bcryptjs';
import { platformPrisma } from './tenant.js';

const SUPPORT_EMAIL = 'support@wecrm.local';

/** Системный пользователь платформы — автор задач из обращений организаций */
export async function getOrCreateSupportUser() {
  const existing = await platformPrisma.user.findUnique({ where: { email: SUPPORT_EMAIL } });
  if (existing) return existing;
  const adminRole = await platformPrisma.role.findFirst({ where: { name: 'admin' } });
  // Случайный пароль: вход через логин для этого пользователя не предусмотрен
  const password = await bcrypt.hash(randomBytes(32).toString('hex'), 10);
  return platformPrisma.user.create({
    data: {
      email: SUPPORT_EMAIL,
      password,
      name: 'Поддержка WeCRM',
      roleId: adminRole?.id || null,
    },
  });
}

/** Статус тикета (open | answered | closed) → статус задачи */
export function ticketToTaskStatus(ticketStatus: string): string {
  if (ticketStatus === 'closed') return 'win';
  if (ticketStatus === 'answered') return 'in_progress';
  return 'open';
}

/** Статус задачи (open | in_progress | load | cancelled | win) → статус тикета */
export function taskToTicketStatus(taskStatus: string): string {
  if (taskStatus === 'win' || taskStatus === 'cancelled') return 'closed';
  if (taskStatus === 'in_progress' || taskStatus === 'load') return 'answered';
  return 'open';
}

/** Текст комментария в задаче для сообщения организации — с подписью автора */
function tenantCommentBody(authorName: string, tenantName: string, body: string): string {
  return `${authorName} (${tenantName}):\n${body}`;
}

/**
 * Создать задачу платформы для тикета и перенести всю переписку в обсуждение.
 * Идемпотентно: если задача уже создана — ничего не делает.
 */
export async function createTaskForTicket(ticketId: string) {
  const ticket = await platformPrisma.tenantTicket.findUnique({
    where: { id: ticketId },
    include: { messages: { orderBy: { createdAt: 'asc' } } },
  });
  if (!ticket || ticket.taskId) return;
  const support = await getOrCreateSupportUser();

  const task = await platformPrisma.task.create({
    data: {
      title: `[${ticket.tenantName}] ${ticket.subject} (от ${ticket.authorName})`,
      description:
        `Обращение в поддержку платформы.\n` +
        `Организация: «${ticket.tenantName}» (${ticket.tenantSlug})\n` +
        `Автор: ${ticket.authorName} <${ticket.authorEmail}>`,
      status: ticketToTaskStatus(ticket.status),
      priority: 'medium',
      creatorId: support.id,
      assignees: { create: [{ userId: support.id }] },
    },
  });

  for (const m of ticket.messages) {
    await platformPrisma.comment.create({
      data: {
        taskId: task.id,
        authorId: support.id,
        content:
          m.authorRole === 'tenant'
            ? tenantCommentBody(m.authorName, ticket.tenantName, m.body)
            : m.body,
      },
    });
  }

  await platformPrisma.tenantTicket.update({ where: { id: ticket.id }, data: { taskId: task.id } });
}

/** Сообщение в тикете → комментарий в обсуждении задачи.
 *  Сообщения организации подписываются автором и организацией; ответы
 *  поддержки (из старой админки тикетов) authored от реального админа. */
export async function addTicketMessageToTask(
  ticketId: string,
  message: { authorRole: string; authorName: string; body: string },
  platformAuthorId?: string,
) {
  const ticket = await platformPrisma.tenantTicket.findUnique({ where: { id: ticketId } });
  if (!ticket?.taskId) return;
  const support = await getOrCreateSupportUser();
  const isTenant = message.authorRole === 'tenant';
  const authorId = !isTenant && platformAuthorId ? platformAuthorId : support.id;
  const content = isTenant
    ? tenantCommentBody(message.authorName, ticket.tenantName, message.body)
    : message.body;
  await platformPrisma.comment.create({
    data: { taskId: ticket.taskId, authorId, content },
  });
}

/** Комментарий сотрудника в обсуждении задачи → сообщение в тикете организации */
export async function addTaskCommentToTicket(taskId: string, authorName: string, content: string) {
  const ticket = await platformPrisma.tenantTicket.findFirst({ where: { taskId } });
  if (!ticket || ticket.status === 'closed') return;
  await platformPrisma.tenantTicketMessage.create({
    data: { ticketId: ticket.id, authorRole: 'platform', authorName, body: content },
  });
  await platformPrisma.tenantTicket.update({ where: { id: ticket.id }, data: { status: 'answered' } });
}

/** Смена статуса тикета → синхронизация статуса задачи */
export async function syncTicketStatusToTask(ticketId: string) {
  const ticket = await platformPrisma.tenantTicket.findUnique({ where: { id: ticketId } });
  if (!ticket?.taskId) return;
  const status = ticketToTaskStatus(ticket.status);
  await platformPrisma.task.update({ where: { id: ticket.taskId }, data: { status } });
}

/** Смена статуса задачи → синхронизация статуса тикета */
export async function syncTaskStatusToTicket(taskId: string) {
  const ticket = await platformPrisma.tenantTicket.findFirst({ where: { taskId } });
  if (!ticket) return;
  const task = await platformPrisma.task.findUnique({ where: { id: taskId }, select: { status: true } });
  if (!task) return;
  const status = taskToTicketStatus(task.status);
  if (status !== ticket.status) {
    await platformPrisma.tenantTicket.update({ where: { id: ticket.id }, data: { status } });
  }
}
