import { prisma } from './prisma.js';

export interface EmailContext {
  from: string;     // email отправителя (lower case)
  to: string[];     // все получатели (lower case)
  subject: string;
  body: string;     // текст письма (lower case)
  hasAttachments: boolean;
}

export interface FilterDecision {
  matched: boolean;
  filterId?: string;
  filterName?: string;
  createTask: boolean;
  projectId?: string;
  assigneeIds: string[];
  priority?: string;
  status?: string;
  markRead?: boolean;      // true — прочитанным, false — непрочитанным, undefined — не менять
  moveToFolder?: string;   // своя IMAP-папка фильтра
  stopProcessing: boolean;
}

const hasAnyCondition = (f: any) =>
  Boolean(f.fromContains || f.toContains || f.subjectContains || f.bodyContains || f.hasAttachments !== null);

function matches(filter: any, ctx: EmailContext): boolean {
  if (!hasAnyCondition(filter)) return false; // защита: фильтр без условий не срабатывает
  if (filter.fromContains && !ctx.from.includes(filter.fromContains.toLowerCase())) return false;
  if (filter.toContains) {
    const needle = filter.toContains.toLowerCase();
    if (!ctx.to.some((a) => a.includes(needle))) return false;
  }
  if (filter.subjectContains && !ctx.subject.toLowerCase().includes(filter.subjectContains.toLowerCase())) return false;
  if (filter.bodyContains && !ctx.body.includes(filter.bodyContains.toLowerCase())) return false;
  if (filter.hasAttachments !== null && ctx.hasAttachments !== filter.hasAttachments) return false;
  return true;
}

/**
 * Применяет активные фильтры к письму по порядку sortOrder.
 * Условия внутри фильтра соединяются по И, фильтры — по ИЛИ (первый сработавший,
 * если включён stopProcessing, иначе действия накапливаются).
 */
export async function applyEmailFilters(ctx: EmailContext): Promise<FilterDecision> {
  const decision: FilterDecision = {
    matched: false,
    createTask: true,
    assigneeIds: [],
    stopProcessing: false,
  };

  const filters = await prisma.emailFilter.findMany({
    where: { isActive: true },
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
  });

  for (const filter of filters) {
    if (!matches(filter, ctx)) continue;

    decision.matched = true;
    decision.filterId = filter.id;
    decision.filterName = filter.name;
    decision.createTask = filter.createTask;
    if (filter.projectId) decision.projectId = filter.projectId;
    if (filter.assigneeIds.length) decision.assigneeIds = filter.assigneeIds;
    if (filter.priority) decision.priority = filter.priority;
    if (filter.status) decision.status = filter.status;
    if (filter.markRead !== null) decision.markRead = filter.markRead;
    if (filter.moveToFolder) decision.moveToFolder = filter.moveToFolder;
    decision.stopProcessing = filter.stopProcessing;

    await prisma.emailFilterLog.create({
      data: {
        filterId: filter.id,
        emailFrom: ctx.from,
        emailTo: ctx.to.join(', '),
        subject: ctx.subject,
        action: filter.createTask ? 'create_task' : 'ignore',
      },
    });

    console.log(`[EmailFilters] Matched filter "${filter.name}" for email from ${ctx.from}`);
    if (filter.stopProcessing) break;
  }

  return decision;
}
