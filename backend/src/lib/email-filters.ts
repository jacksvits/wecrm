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
    discussion?: string; // значения, направленные в обсуждение задачи
    // каждое найденное правилом значение — отдельное сообщение в обсуждении;
    // prefix — «свой текст» правила, выводится перед значением
    comments?: { field: string; value: string; prefix?: string | null }[];
  };
  stopProcessing: boolean;
}

const PRIORITIES = ['low', 'medium', 'high', 'urgent'];

/**
 * Парсинг тела письма по правилам фильтра (parseRules).
 * Каждое правило: { pattern — начальный шаблон, field — поле задачи,
 * mode — режим извлечения (regex | toEol | toWord), pattern2 — конечное слово для toWord,
 * group — группа захвата для regex (def 1) }.
 * Первое совпадение по каждому полю побеждает; в description значения добавляются по порядку правил.
 */
/**
 * Извлекает значение из текста письма по правилу в зависимости от режима:
 * - regex: первое совпадение (группа захвата rule.group, по умолчанию 1, при её отсутствии — всё совпадение);
 * - toEol: от конца совпадения pattern до конца строки;
 * - toWord: текст между совпадением pattern и последующим pattern2.
 */
function extractByMode(rule: any, bodyText: string): string | null {
  const mode = rule.mode || 'regex';
  let startRe: RegExp;
  try {
    startRe = new RegExp(rule.pattern, 'i');
  } catch {
    return null; // некорректный regex пропускаем (на этапе сохранения уже провалидирован)
  }
  const m = bodyText.match(startRe);
  if (!m) return null;

  if (mode === 'toEol') {
    const rest = bodyText.slice(m.index! + m[0].length);
    return rest.split('\n')[0].trim() || null;
  }
  if (mode === 'toWord') {
    if (!rule.pattern2) return null;
    let endRe: RegExp;
    try {
      endRe = new RegExp(rule.pattern2, 'i');
    } catch {
      return null;
    }
    const rest = bodyText.slice(m.index! + m[0].length);
    const end = rest.match(endRe);
    if (!end) return null;
    return rest.slice(0, end.index).trim() || null;
  }
  // regex
  const group = typeof rule.group === 'number' ? rule.group : 1;
  return (m[group] ?? m[0] ?? '').toString().trim() || null;
}

function applyParseRules(filter: any, bodyText: string, decision: FilterDecision) {
  const rules = Array.isArray(filter.parseRules) ? filter.parseRules : [];
  // Каждое найденное правилом значение — отдельное сообщение обсуждения
  const pushComment = (field: string, value: string, rule: any) => {
    const prev = decision.parsed?.comments || [];
    decision.parsed = {
      ...decision.parsed,
      comments: [...prev, { field, value, prefix: rule.prefix ?? null }],
    };
  };
  for (const rule of rules) {
    if (!rule?.pattern || !rule?.field) continue;
    const value = extractByMode(rule, bodyText);
    if (!value) continue;
    if (rule.field === 'title') {
      decision.parsed = { ...decision.parsed, title: value.slice(0, 200) };
      pushComment('title', value.slice(0, 200), rule);
    }
    else if (rule.field === 'description') {
      const prev = decision.parsed?.description;
      const next = value.slice(0, 4000);
      decision.parsed = { ...decision.parsed, description: prev ? `${prev}\n${next}` : next };
      pushComment('description', next, rule);
    } else if (rule.field === 'address') {
      // Отрезаем служебную метку вида «Адрес:» / «Адрес объекта:» / «Address:» — в поле задачи только сам адрес
      const cleanAddress = value.replace(/^\s*(адрес|address)((\s+[а-яёa-z]+){0,2})?\s*[:：]\s*/i, '').trim();
      if (cleanAddress) {
        decision.parsed = { ...decision.parsed, address: cleanAddress.slice(0, 500) };
        pushComment('address', cleanAddress.slice(0, 500), rule);
      }
    }
    else if (rule.field === 'priority') {
      const v = value.toLowerCase();
      if (PRIORITIES.includes(v)) {
        decision.parsed = { ...decision.parsed, priority: v };
        pushComment('priority', v, rule);
      }
    } else if (rule.field === 'status') {
      decision.parsed = { ...decision.parsed, status: value.slice(0, 50) };
      pushComment('status', value.slice(0, 50), rule);
    } else if (rule.field === 'discussion') {
      const prev = decision.parsed?.discussion;
      const next = value.slice(0, 4000);
      decision.parsed = { ...decision.parsed, discussion: prev ? `${prev}\n${next}` : next };
      pushComment('discussion', next, rule);
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
    // Правила парсинга тела письма: адрес, тема, описание и т.д. из шаблонов фильтра
    applyParseRules(filter, ctx.body, decision);
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
