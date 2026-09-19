import { prisma } from './prisma.js';
import { guessDocType } from './accounting-parse.js';

/** Контекст письма для классификации правилами бухгалтерии */
export interface AccountingContext {
  from: string;            // email отправителя (lower case)
  subject: string;
  body: string;            // текст письма
  hasAttachments: boolean;
}

/** Решение классификации: сработавшее правило и параметры документа */
export interface AccountingDecision {
  rule: { id: string; name: string } | null;
  docType: string;    // receipt | invoice | act | upd | bank_notice | other
  direction: string;  // incoming | outgoing
  contactId?: string;
}

/**
 * Проверка условий правила: все заданные условия соединяются по И
 * (подстрока в lower case, как в email-filters).
 */
function matches(rule: any, ctx: AccountingContext): boolean {
  // Защита: правило без условий не срабатывает
  if (!rule.fromContains && !rule.subjectContains && !rule.bodyContains && rule.hasAttachments === null) {
    return false;
  }
  if (rule.fromContains && !ctx.from.toLowerCase().includes(rule.fromContains.toLowerCase())) return false;
  if (rule.subjectContains && !ctx.subject.toLowerCase().includes(rule.subjectContains.toLowerCase())) return false;
  if (rule.bodyContains && !ctx.body.toLowerCase().includes(rule.bodyContains.toLowerCase())) return false;
  if (rule.hasAttachments !== null && ctx.hasAttachments !== rule.hasAttachments) return false;
  return true;
}

/**
 * Применяет активные правила классификации к письму по порядку sortOrder.
 * Условия внутри правила — по И, правила — по ИЛИ (первое сработавшее
 * с stopProcessing=true завершает обход, иначе последнее сработавшее побеждает).
 *
 * Если ни одно правило не сработало — fallback: тип угадывается по тексту
 * (guessDocType), направление 'incoming': все письма ящика бухгалтерии
 * становятся документами.
 */
export async function applyAccountingRules(ctx: AccountingContext): Promise<AccountingDecision> {
  const rules = await prisma.accountingRule.findMany({
    where: { isActive: true },
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
  });

  let decision: AccountingDecision | null = null;

  for (const rule of rules) {
    if (!matches(rule, ctx)) continue;

    decision = {
      rule: { id: rule.id, name: rule.name },
      docType: rule.docType || 'other',
      direction: rule.direction || 'incoming',
      contactId: rule.contactId || undefined,
    };

    console.log(`[Accounting] Matched rule "${rule.name}" for email from ${ctx.from} (type=${decision.docType}, direction=${decision.direction})`);
    if (rule.stopProcessing) break;
  }

  if (decision) return decision;

  // Fallback: ни одно правило не сработало — классифицируем эвристикой по тексту
  const docType = guessDocType(`${ctx.subject}\n${ctx.body}`);
  console.log(`[Accounting] No rule matched for email from ${ctx.from}, guessed type=${docType}`);
  return { rule: null, docType, direction: 'incoming' };
}
