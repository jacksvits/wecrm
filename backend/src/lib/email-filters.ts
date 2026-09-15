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
  parsed?: {               // значения, извлечённые из тела письма правилами парсинга
    title?: string;
    description?: string;
    address?: string;
    priority?: string;
    status?: string;
  };
  stopProcessing: boolean;
}

const PRIORITIES = ['low', 'medium', 'high', 'urgent'];

/**
 * Парсинг тела письма по правилам фильтра (parseRules).
 * Каждое правило: { pattern — regex, field — поле задачи, group — группа захвата (def 1) }.
 * Первое совпадение по каждому полю побеждает; в description значения добавляются по порядку правил.
 */
function applyParseRules(filter: any, bodyText: string, decision: FilterDecision) {
  const rules = Array.isArray(filter.parseRules) ? filter.parseRules : [];
  for (const rule of rules) {
    if (!rule?.pattern || !rule?.field) continue;
    let re: RegExp;
    try {
      re = new RegExp(rule.pattern, 'i');
    } catch {
      continue; // некорректный regex пропускаем (на этапе сохранения уже провалидирован)
    }
    const m = bodyText.match(re);
    if (!m) continue;
    const group = typeof rule.group === 'number' ? rule.group : 1;
    const value = (m[group] ?? m[0] ?? '').toString().trim();
    if (!value) continue;
    if (rule.field === 'title') decision.parsed = { ...decision.parsed, title: value.slice(0, 200) };
    else if (rule.field === 'description') {
      const prev = decision.parsed?.description;
      const next = value.slice(0, 4000);
      decision.parsed = { ...decision.parsed, description: prev ? `${prev}\n${next}` : next };
    } else if (rule.field === 'address') decision.parsed = { ...decision.parsed, address: value.slice(0, 500) };
    else if (rule.field === 'priority') {
      const v = value.toLowerCase();
      if (PRIORITIES.includes(v)) decision.parsed = { ...decision.parsed, priority: v };
    } else if (rule.field === 'status') {
      decision.parsed = { ...decision.parsed, status: value.slice(0, 50) };
    }
  }
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
  if (filter.bodyContains && !ctx.body.toLowerCase().includes(filter.bodyContains.toLowerCase())) return false;
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
