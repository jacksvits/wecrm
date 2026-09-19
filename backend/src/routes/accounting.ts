import { Router } from 'express';
import { z } from 'zod';
import fs from 'fs';
import path from 'path';
import * as XLSX from 'xlsx';
import { ImapFlow, ImapFlowOptions } from 'imapflow';
import { prisma } from '../lib/prisma.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import { fetchAccountTransactions, getTochkaState } from './tochka.js';

const router = Router();
router.use(authMiddleware);

// Доступ к бухгалтерии: админ или роль с флагом showFinancesTab (как financesTabGuard в task-finances)
const accountingGuard = (req: AuthRequest, res: any, next: any) => {
  if (req.user?.role !== 'admin' && req.user?.showFinancesTab !== true) {
    return res.status(403).json({ error: 'Нет доступа к бухгалтерии' });
  }
  next();
};

// Запись настроек и правил — только администратор
const adminGuard = (req: AuthRequest, res: any, next: any) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Только администратор' });
  }
  next();
};

router.use(accountingGuard);

// Русские названия типов документов (для экспорта)
const DOC_TYPE_LABELS: Record<string, string> = {
  receipt: 'Чек',
  invoice: 'Счёт',
  act: 'Акт',
  upd: 'УПД',
  bank_notice: 'Банковское уведомление',
  other: 'Прочее',
};

const MATCH_STATUS_LABELS: Record<string, string> = {
  unmatched: 'Не свёрнут',
  auto: 'Автосверка',
  manual: 'Вручную',
  ignored: 'Игнорируется',
};

// ---------- Настройки ящика бухгалтерии ----------

const settingsSchema = z.object({
  imapHost: z.string().min(1, 'Укажите IMAP-хост'),
  imapPort: z.number().int().min(1).max(65535).default(993),
  imapUser: z.string().min(1, 'Укажите логин'),
  imapPass: z.string().min(1, 'Укажите пароль'),
  checkIntervalMs: z.number().int().min(5000).default(60000),
  processedFolder: z.string().optional().nullable(),
  isActive: z.boolean().default(true),
  secure: z.boolean().default(true),
  rejectUnauthorized: z.boolean().default(false),
  requireTLS: z.boolean().default(true),
});

// GET /api/accounting/settings — настройки ящика (только админ, пароль отдаём как есть)
router.get('/settings', adminGuard, async (_req: AuthRequest, res) => {
  const settings = await prisma.accountingEmailSettings.findFirst();
  res.json(settings);
});

// PUT /api/accounting/settings — upsert единственной записи (только админ)
router.put('/settings', adminGuard, async (req: AuthRequest, res) => {
  try {
    const data = settingsSchema.parse(req.body);
    const existing = await prisma.accountingEmailSettings.findFirst();
    const settings = existing
      ? await prisma.accountingEmailSettings.update({ where: { id: existing.id }, data })
      : await prisma.accountingEmailSettings.create({ data });
    res.json(settings);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// POST /api/accounting/settings/test — пробное IMAP-подключение (только админ)
// Тело необязательно: если передано — проверяем его (partial поверх сохранённых), иначе — сохранённые настройки
router.post('/settings/test', adminGuard, async (req: AuthRequest, res) => {
  try {
    const saved = await prisma.accountingEmailSettings.findFirst();
    let cfg: any = saved;
    if (req.body && Object.keys(req.body).length > 0) {
      const patch = settingsSchema.partial().parse(req.body);
      cfg = { ...(saved || {}), ...patch };
    }
    if (!cfg?.imapHost || !cfg?.imapUser || !cfg?.imapPass) {
      return res.status(400).json({ error: 'Настройки почты бухгалтерии не заданы' });
    }
    const secure = cfg.secure !== false;
    const client = new ImapFlow({
      host: cfg.imapHost,
      port: cfg.imapPort || 993,
      secure,
      requireTLS: !secure && (cfg.requireTLS !== false),
      tls: { rejectUnauthorized: cfg.rejectUnauthorized === true },
      auth: { user: cfg.imapUser, pass: cfg.imapPass },
      logger: false,
    } as ImapFlowOptions);
    await client.connect();
    await client.logout();
    res.json({ ok: true });
  } catch (err: any) {
    // ImapFlow прячет детали ответа сервера в responseText/serverResponseCode,
    // а в message отдаёт только «Command failed» — вытаскиваем реальную причину
    const detail = err.responseText || err.response || err.message;
    let hint = '';
    if (err.authenticationFailed || err.serverResponseCode === 'AUTHENTICATIONFAILED') {
      hint = ' — проверьте логин и пароль ящика (и что IMAP для него включён)';
    } else if (err.code === 'ENOTFOUND' || err.code === 'EAI_AGAIN') {
      hint = ' — проверьте имя хоста';
    } else if (err.code === 'ECONNREFUSED' || err.code === 'ETIMEDOUT') {
      hint = ' — проверьте порт и тип шифрования (SSL/STARTTLS)';
    }
    res.status(400).json({ error: `Ошибка подключения: ${detail}${hint}` });
  }
});

// ---------- Правила классификации ----------

const ruleSchema = z.object({
  name: z.string().min(1, 'Укажите название правила'),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
  fromContains: z.string().optional().nullable(),
  subjectContains: z.string().optional().nullable(),
  bodyContains: z.string().optional().nullable(),
  hasAttachments: z.boolean().optional().nullable(),
  docType: z.enum(['receipt', 'invoice', 'act', 'upd', 'bank_notice', 'other']).default('other'),
  direction: z.enum(['incoming', 'outgoing']).default('incoming'),
  contactId: z.string().optional().nullable(),
  stopProcessing: z.boolean().default(true),
});

// GET /api/accounting/rules — список правил по порядку сортировки
router.get('/rules', async (_req: AuthRequest, res) => {
  const rules = await prisma.accountingRule.findMany({
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    include: { contact: { select: { id: true, name: true } } },
  });
  res.json(rules);
});

// POST /api/accounting/rules — создать правило (только админ)
router.post('/rules', adminGuard, async (req: AuthRequest, res) => {
  try {
    const data = ruleSchema.parse(req.body);
    const rule = await prisma.accountingRule.create({ data });
    res.json(rule);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// PATCH /api/accounting/rules/:id — обновить правило (только админ)
router.patch('/rules/:id', adminGuard, async (req: AuthRequest, res) => {
  try {
    const data = ruleSchema.partial().parse(req.body);
    const rule = await prisma.accountingRule.update({ where: { id: req.params.id }, data });
    res.json(rule);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE /api/accounting/rules/:id — удалить правило (только админ)
router.delete('/rules/:id', adminGuard, async (req: AuthRequest, res) => {
  try {
    await prisma.accountingRule.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// ---------- Финансовые документы ----------

const DOC_INCLUDE = {
  contact: { select: { id: true, name: true } },
  task: { select: { id: true, title: true, ticketNumber: true } },
  deal: { select: { id: true, title: true } },
} as const;

// Вложения документов через полиморфную FileAttachment (entityType='finance_document'), сгруппированные по entityId
async function loadAttachmentsGrouped(entityIds: string[]) {
  if (!entityIds.length) return new Map<string, any[]>();
  const files = await prisma.fileAttachment.findMany({
    where: { entityType: 'finance_document', entityId: { in: entityIds } },
    orderBy: { createdAt: 'asc' },
  });
  const map = new Map<string, any[]>();
  for (const f of files) {
    const list = map.get(f.entityId) || [];
    list.push(f);
    map.set(f.entityId, list);
  }
  return map;
}

// Парсинг границ периода из query (from/to — даты ISO или YYYY-MM-DD)
function parsePeriod(fromQ: any, toQ: any): { gte?: Date; lte?: Date } {
  const range: { gte?: Date; lte?: Date } = {};
  if (typeof fromQ === 'string' && fromQ) {
    const d = new Date(fromQ.length === 10 ? `${fromQ}T00:00:00.000` : fromQ);
    if (!isNaN(d.getTime())) range.gte = d;
  }
  if (typeof toQ === 'string' && toQ) {
    const d = new Date(toQ.length === 10 ? `${toQ}T23:59:59.999` : toQ);
    if (!isNaN(d.getTime())) range.lte = d;
  }
  return range;
}

// GET /api/accounting/documents — список с фильтрами и пагинацией
router.get('/documents', async (req: AuthRequest, res) => {
  try {
    const q = req.query;
    const where: any = {};
    if (typeof q.type === 'string' && q.type) where.type = q.type;
    if (typeof q.direction === 'string' && q.direction) where.direction = q.direction;
    if (typeof q.status === 'string' && q.status) where.status = q.status;
    if (typeof q.matchStatus === 'string' && q.matchStatus) where.matchStatus = q.matchStatus;
    if (typeof q.contactId === 'string' && q.contactId) where.contactId = q.contactId;
    if (typeof q.taskId === 'string' && q.taskId) where.taskId = q.taskId;
    if (typeof q.dealId === 'string' && q.dealId) where.dealId = q.dealId;
    const period = parsePeriod(q.from, q.to);
    if (period.gte || period.lte) where.date = period;
    if (typeof q.search === 'string' && q.search.trim()) {
      const s = q.search.trim();
      where.OR = [
        { number: { contains: s, mode: 'insensitive' } },
        { counterpartyName: { contains: s, mode: 'insensitive' } },
        { emailSubject: { contains: s, mode: 'insensitive' } },
      ];
    }
    const page = Math.max(1, parseInt(String(q.page || '1'), 10) || 1);
    const limit = Math.min(200, Math.max(1, parseInt(String(q.limit || '50'), 10) || 50));
    const [total, items] = await Promise.all([
      prisma.financeDocument.count({ where }),
      prisma.financeDocument.findMany({
        where,
        include: DOC_INCLUDE,
        orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);
    const attachments = await loadAttachmentsGrouped(items.map((d) => d.id));
    res.json({
      items: items.map((d) => ({ ...d, attachments: attachments.get(d.id) || [] })),
      total,
      page,
      limit,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

const documentCreateSchema = z.object({
  type: z.enum(['receipt', 'invoice', 'act', 'upd', 'bank_notice', 'other']).default('other'),
  direction: z.enum(['incoming', 'outgoing']).default('incoming'),
  number: z.string().optional().nullable(),
  date: z.string().optional(),
  amount: z.number().default(0),
  vat: z.number().optional().nullable(),
  currency: z.string().default('RUB'),
  counterpartyName: z.string().optional().nullable(),
  counterpartyInn: z.string().optional().nullable(),
  contactId: z.string().optional().nullable(),
  taskId: z.string().optional().nullable(),
  dealId: z.string().optional().nullable(),
  status: z.enum(['new', 'confirmed', 'archived']).default('new'),
  notes: z.string().optional().nullable(),
});

// POST /api/accounting/documents — ручное создание документа
router.post('/documents', async (req: AuthRequest, res) => {
  try {
    const data = documentCreateSchema.parse(req.body);
    const doc = await prisma.financeDocument.create({
      data: {
        ...data,
        date: data.date ? new Date(data.date) : new Date(),
        source: 'manual',
      },
      include: DOC_INCLUDE,
    });
    res.json({ ...doc, attachments: [] });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// GET /api/accounting/documents/:id — карточка документа с вложениями и связанным платежом
router.get('/documents/:id', async (req: AuthRequest, res) => {
  const doc = await prisma.financeDocument.findUnique({
    where: { id: req.params.id },
    include: DOC_INCLUDE,
  });
  if (!doc) return res.status(404).json({ error: 'Документ не найден' });
  const attachments = await prisma.fileAttachment.findMany({
    where: { entityType: 'finance_document', entityId: doc.id },
    orderBy: { createdAt: 'asc' },
  });
  const matchedPayment = doc.matchedPaymentId
    ? await prisma.bankPayment.findUnique({ where: { id: doc.matchedPaymentId } })
    : null;
  res.json({ ...doc, attachments, matchedPayment });
});

const documentPatchSchema = documentCreateSchema.partial().extend({
  // Ручной сброс сверки — только ignored/unmatched (auto/manual ставит механизм сверки)
  matchStatus: z.enum(['ignored', 'unmatched']).optional(),
});

// PATCH /api/accounting/documents/:id — редактирование документа
router.patch('/documents/:id', async (req: AuthRequest, res) => {
  try {
    const data = documentPatchSchema.parse(req.body);
    const existing = await prisma.financeDocument.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ error: 'Документ не найден' });
    const { date, ...rest } = data;
    const updateData = { ...rest, ...(date ? { date: new Date(date) } : {}) };
    let doc;
    // Ручной сброс сверки на 'unmatched': разрываем связь с платежом с обеих сторон
    // (атомарно, как в /reconciliation/unmatch)
    if (data.matchStatus === 'unmatched' && existing.matchedPaymentId) {
      const [, updated] = await prisma.$transaction([
        prisma.bankPayment.updateMany({
          where: { id: existing.matchedPaymentId },
          data: { matchedDocumentId: null },
        }),
        prisma.financeDocument.update({
          where: { id: req.params.id },
          data: { ...updateData, matchedPaymentId: null },
          include: DOC_INCLUDE,
        }),
      ]);
      doc = updated;
    } else {
      doc = await prisma.financeDocument.update({
        where: { id: req.params.id },
        data: updateData,
        include: DOC_INCLUDE,
      });
    }
    const attachments = await prisma.fileAttachment.findMany({
      where: { entityType: 'finance_document', entityId: doc.id },
      orderBy: { createdAt: 'asc' },
    });
    res.json({ ...doc, attachments });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE /api/accounting/documents/:id — удаление документа, записей вложений и файлов с диска (best-effort)
router.delete('/documents/:id', async (req: AuthRequest, res) => {
  try {
    const doc = await prisma.financeDocument.findUnique({ where: { id: req.params.id } });
    if (!doc) return res.status(404).json({ error: 'Документ не найден' });
    const files = await prisma.fileAttachment.findMany({
      where: { entityType: 'finance_document', entityId: doc.id },
    });
    await prisma.fileAttachment.deleteMany({
      where: { entityType: 'finance_document', entityId: doc.id },
    });
    // Если документ был связан с платежом — разрываем связь с банковской стороны
    if (doc.matchedPaymentId) {
      await prisma.bankPayment.updateMany({
        where: { id: doc.matchedPaymentId },
        data: { matchedDocumentId: null },
      });
    }
    await prisma.financeDocument.delete({ where: { id: doc.id } });
    // Файлы с диска удаляем по возможности, ошибки не роняют запрос.
    // f.path — URL-путь (/uploads/accounting/<uuid>), на диске файлы лежат в /app/uploads/accounting
    for (const f of files) {
      const diskPath = path.join('/app/uploads/accounting', f.filename);
      try {
        if (fs.existsSync(diskPath)) fs.unlinkSync(diskPath);
      } catch (e) {
        console.error('[Accounting] Не удалось удалить файл', diskPath, e);
      }
    }
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ---------- Аналитика ----------

// Выборка документов за период для агрегатов (только не в архиве)
async function loadAnalyticsDocs(fromQ: any, toQ: any) {
  const period = parsePeriod(fromQ, toQ);
  const where: any = { status: { not: 'archived' } };
  if (period.gte || period.lte) where.date = period;
  return prisma.financeDocument.findMany({
    where,
    select: {
      id: true, type: true, direction: true, number: true, date: true,
      amount: true, vat: true, counterpartyName: true, counterpartyInn: true,
      matchStatus: true, contact: { select: { name: true } },
    },
    orderBy: { date: 'asc' },
  });
}

// Агрегаты по списку документов: суммы, по типам, по месяцам, по контрагентам, несверённые
function buildAnalytics(docs: Awaited<ReturnType<typeof loadAnalyticsDocs>>) {
  let incoming = 0;
  let outgoing = 0;
  const byTypeMap = new Map<string, { type: string; direction: string; sum: number; count: number }>();
  const byMonthMap = new Map<string, { month: string; incoming: number; outgoing: number }>();
  const byCpMap = new Map<string, { name: string; sum: number; count: number }>();
  let unmatchedCount = 0;
  let unmatchedSum = 0;

  for (const d of docs) {
    const isIncoming = d.direction === 'incoming';
    if (isIncoming) incoming += d.amount; else outgoing += d.amount;

    const typeKey = `${d.type}:${d.direction}`;
    const t = byTypeMap.get(typeKey) || { type: d.type, direction: d.direction, sum: 0, count: 0 };
    t.sum += d.amount; t.count += 1;
    byTypeMap.set(typeKey, t);

    const month = d.date.toISOString().slice(0, 7); // '2026-01'
    const m = byMonthMap.get(month) || { month, incoming: 0, outgoing: 0 };
    if (isIncoming) m.incoming += d.amount; else m.outgoing += d.amount;
    byMonthMap.set(month, m);

    const cpName = d.counterpartyName || d.contact?.name || 'Без контрагента';
    const cp = byCpMap.get(cpName) || { name: cpName, sum: 0, count: 0 };
    cp.sum += d.amount; cp.count += 1;
    byCpMap.set(cpName, cp);

    if (d.matchStatus === 'unmatched') {
      unmatchedCount += 1;
      unmatchedSum += d.amount;
    }
  }

  return {
    incoming,
    outgoing,
    byType: [...byTypeMap.values()].sort((a, b) => b.sum - a.sum),
    byMonth: [...byMonthMap.values()].sort((a, b) => a.month.localeCompare(b.month)),
    byCounterparty: [...byCpMap.values()].sort((a, b) => b.sum - a.sum).slice(0, 20),
    unmatchedCount,
    unmatchedSum,
  };
}

// Выборка финансовых транзакций задач за период (фильтр по полю date транзакции, как у документов)
async function loadTaskTransactions(fromQ: any, toQ: any) {
  const period = parsePeriod(fromQ, toQ);
  const where: any = {};
  if (period.gte || period.lte) where.date = period;
  return prisma.taskTransaction.findMany({
    where,
    select: {
      id: true, taskId: true, type: true, amount: true, description: true, date: true,
      task: { select: { title: true, ticketNumber: true } },
    },
    orderBy: { date: 'asc' },
  });
}

// Агрегаты по транзакциям задач: суммы, по месяцам, топ задач по обороту
function buildTaskFinances(txs: Awaited<ReturnType<typeof loadTaskTransactions>>) {
  let totalIncome = 0;
  let totalExpense = 0;
  const byMonthMap = new Map<string, { month: string; income: number; expense: number }>();
  const byTaskMap = new Map<string, { taskId: string; title: string; ticketNumber: number; income: number; expense: number }>();

  for (const tx of txs) {
    const isIncome = tx.type === 'income';
    if (isIncome) totalIncome += tx.amount; else totalExpense += tx.amount;

    const month = tx.date.toISOString().slice(0, 7); // '2026-01'
    const m = byMonthMap.get(month) || { month, income: 0, expense: 0 };
    if (isIncome) m.income += tx.amount; else m.expense += tx.amount;
    byMonthMap.set(month, m);

    const t = byTaskMap.get(tx.taskId) || {
      taskId: tx.taskId,
      title: tx.task?.title || 'Без названия',
      ticketNumber: tx.task?.ticketNumber ?? 0,
      income: 0,
      expense: 0,
    };
    if (isIncome) t.income += tx.amount; else t.expense += tx.amount;
    byTaskMap.set(tx.taskId, t);
  }

  return {
    totalIncome,
    totalExpense,
    profit: totalIncome - totalExpense,
    count: txs.length,
    byMonth: [...byMonthMap.values()].sort((a, b) => a.month.localeCompare(b.month)),
    // Топ-20 задач по обороту (доход + расход) по убыванию, включая задачи только с расходами
    topTasks: [...byTaskMap.values()]
      .map((t) => ({ ...t, profit: t.income - t.expense }))
      .sort((a, b) => (b.income + b.expense) - (a.income + a.expense))
      .slice(0, 20),
  };
}

// GET /api/accounting/analytics?from&to — агрегаты по документам и финансам задач
router.get('/analytics', async (req: AuthRequest, res) => {
  try {
    const [docs, taskTxs] = await Promise.all([
      loadAnalyticsDocs(req.query.from, req.query.to),
      loadTaskTransactions(req.query.from, req.query.to),
    ]);
    res.json({ totals: buildAnalytics(docs), taskFinances: buildTaskFinances(taskTxs) });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/accounting/analytics/export?from&to — выгрузка xlsx (документы + сводка по месяцам + финансы задач)
router.get('/analytics/export', async (req: AuthRequest, res) => {
  try {
    const [docs, taskTxs] = await Promise.all([
      loadAnalyticsDocs(req.query.from, req.query.to),
      loadTaskTransactions(req.query.from, req.query.to),
    ]);
    const analytics = buildAnalytics(docs);

    const docRows = docs.map((d) => ({
      'Дата': d.date.toLocaleDateString('ru-RU'),
      'Тип': DOC_TYPE_LABELS[d.type] || d.type,
      'Направление': d.direction === 'incoming' ? 'Приход' : 'Расход',
      'Номер': d.number || '',
      'Контрагент': d.counterpartyName || d.contact?.name || '',
      'ИНН': d.counterpartyInn || '',
      'Сумма': d.amount,
      'НДС': d.vat ?? '',
      'Статус сверки': MATCH_STATUS_LABELS[d.matchStatus] || d.matchStatus,
    }));
    const monthRows = analytics.byMonth.map((m) => ({
      'Месяц': m.month,
      'Приход': m.incoming,
      'Расход': m.outgoing,
      'Разница': m.incoming - m.outgoing,
    }));

    // Транзакции задач за тот же период (уже отсортированы по дате в loadTaskTransactions)
    const taskRows = taskTxs.map((tx) => ({
      'Дата': tx.date.toLocaleDateString('ru-RU'),
      'Задача': tx.task ? `#${tx.task.ticketNumber} ${tx.task.title}` : '',
      'Тип': tx.type === 'income' ? 'Доход' : 'Расход',
      'Сумма': tx.amount,
      'Описание': tx.description || '',
    }));

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(docRows), 'Документы');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(monthRows), 'Сводка по месяцам');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(taskRows), 'Финансы задач');
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    const today = new Date().toISOString().slice(0, 10);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=accounting_${today}.xlsx`);
    res.send(buffer);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ---------- Банк (Точка): синхронизация и список операций ----------

// POST /api/accounting/bank/sync — подтянуть операции по всем счетам Точки и закэшировать в BankPayment
// Тело (необязательно): { from, to } — период ISO; по умолчанию последние 30 дней
router.post('/bank/sync', async (req: AuthRequest, res) => {
  try {
    const toISO = typeof req.body?.to === 'string' && req.body.to ? req.body.to : new Date().toISOString();
    const fromISO = typeof req.body?.from === 'string' && req.body.from
      ? req.body.from
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    const state = await getTochkaState();
    const accounts: Array<{ id: string }> = state?.accounts || [];
    if (!accounts.length) {
      return res.status(400).json({ error: 'Точка Банк не подключена или нет доступных счетов' });
    }

    let synced = 0;
    let created = 0;
    const errors: string[] = [];

    for (const acc of accounts) {
      let txs;
      try {
        txs = await fetchAccountTransactions(acc.id, fromISO, toISO);
      } catch (e: any) {
        errors.push(`Счёт ${acc.id}: ${e.message}`);
        continue;
      }
      for (const tx of txs) {
        synced += 1;
        const data = {
          accountId: acc.id,
          paymentId: tx.paymentId || null,
          date: new Date(tx.date),
          amount: tx.amount,
          direction: tx.direction,
          counterpartyName: tx.counterpartyName || null,
          counterpartyInn: tx.counterpartyInn || null,
          purpose: tx.purpose || null,
          raw: tx.raw ?? undefined,
        };
        if (tx.paymentId) {
          // Есть идентификатор платежа — upsert по составному уникальному ключу (accountId, paymentId)
          const existing = await prisma.bankPayment.findFirst({
            where: { accountId: acc.id, paymentId: tx.paymentId },
          });
          if (existing) {
            await prisma.bankPayment.update({ where: { id: existing.id }, data });
          } else {
            await prisma.bankPayment.create({ data });
            created += 1;
          }
        } else {
          // Без paymentId — ищем по составному ключу дата+сумма+назначение, иначе создаём
          const existing = await prisma.bankPayment.findFirst({
            where: {
              accountId: acc.id,
              paymentId: null,
              date: data.date,
              amount: data.amount,
              purpose: data.purpose,
            },
          });
          if (!existing) {
            await prisma.bankPayment.create({ data });
            created += 1;
          }
        }
      }
    }

    res.json({ synced, new: created, ...(errors.length ? { errors } : {}) });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/accounting/bank/payments?matched=all|yes|no&from&to&page&limit — кэшированные операции
router.get('/bank/payments', async (req: AuthRequest, res) => {
  try {
    const q = req.query;
    const where: any = {};
    if (q.matched === 'yes') where.matchedDocumentId = { not: null };
    else if (q.matched === 'no') where.matchedDocumentId = null;
    const period = parsePeriod(q.from, q.to);
    if (period.gte || period.lte) where.date = period;
    const page = Math.max(1, parseInt(String(q.page || '1'), 10) || 1);
    const limit = Math.min(200, Math.max(1, parseInt(String(q.limit || '50'), 10) || 50));
    const [total, items] = await Promise.all([
      prisma.bankPayment.count({ where }),
      prisma.bankPayment.findMany({
        where,
        orderBy: { date: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);
    // Подтягиваем связанные документы (связь по matchedDocumentId без FK)
    const docIds = items.map((p) => p.matchedDocumentId).filter((id): id is string => !!id);
    const docs = docIds.length
      ? await prisma.financeDocument.findMany({
          where: { id: { in: docIds } },
          select: { id: true, number: true, amount: true },
        })
      : [];
    const docMap = new Map(docs.map((d) => [d.id, d]));
    res.json({
      items: items.map((p) => ({ ...p, matchedDocument: p.matchedDocumentId ? docMap.get(p.matchedDocumentId) || null : null })),
      total,
      page,
      limit,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ---------- Сверка документов с банком ----------

const MATCH_AMOUNT_EPS = 0.01; // допуск по сумме
const MATCH_DATE_DAYS = 7; // допуск по дате ±7 дней

// Ожидаемое направление платежа для документа: приход денег → credit, расход → debit
const expectedPaymentDirection = (docDirection: string) => (docDirection === 'incoming' ? 'credit' : 'debit');

// Подходящие платежи для документа: сумма ±0.01, дата ±7 дней, направление, ещё не связаны
async function findPaymentSuggestions(doc: { date: Date; amount: number; direction: string }) {
  const from = new Date(doc.date.getTime() - MATCH_DATE_DAYS * 24 * 60 * 60 * 1000);
  const to = new Date(doc.date.getTime() + MATCH_DATE_DAYS * 24 * 60 * 60 * 1000);
  const candidates = await prisma.bankPayment.findMany({
    where: {
      matchedDocumentId: null,
      direction: expectedPaymentDirection(doc.direction),
      date: { gte: from, lte: to },
      amount: { gte: doc.amount - MATCH_AMOUNT_EPS, lte: doc.amount + MATCH_AMOUNT_EPS },
    },
    orderBy: { date: 'asc' },
    take: 20,
  });
  return candidates;
}

// GET /api/accounting/reconciliation — несверённые документы (с подсказками) и несверённые платежи
router.get('/reconciliation', async (_req: AuthRequest, res) => {
  try {
    const unmatchedDocs = await prisma.financeDocument.findMany({
      where: { matchStatus: 'unmatched', status: { not: 'archived' } },
      include: DOC_INCLUDE,
      orderBy: { date: 'desc' },
      take: 200,
    });
    // Подсказки грузим пакетно (без N+1): один запрос несвязанных платежей
    // за диапазон дат документов ±7 дней, дальше сопоставление в памяти
    const docsWithAmount = unmatchedDocs.filter((d) => d.amount > 0);
    let candidatePayments: Awaited<ReturnType<typeof findPaymentSuggestions>> = [];
    if (docsWithAmount.length) {
      const times = docsWithAmount.map((d) => d.date.getTime());
      const rangeFrom = new Date(Math.min(...times) - MATCH_DATE_DAYS * 24 * 60 * 60 * 1000);
      const rangeTo = new Date(Math.max(...times) + MATCH_DATE_DAYS * 24 * 60 * 60 * 1000);
      candidatePayments = await prisma.bankPayment.findMany({
        where: { matchedDocumentId: null, date: { gte: rangeFrom, lte: rangeTo } },
        orderBy: { date: 'asc' },
      });
    }
    const unmatchedDocuments = unmatchedDocs.map((doc) => {
      const suggestions = doc.amount > 0
        ? candidatePayments
            .filter((p) =>
              p.direction === expectedPaymentDirection(doc.direction) &&
              Math.abs(p.amount - doc.amount) <= MATCH_AMOUNT_EPS &&
              Math.abs(p.date.getTime() - doc.date.getTime()) <= MATCH_DATE_DAYS * 24 * 60 * 60 * 1000
            )
            .slice(0, 20)
        : [];
      return { ...doc, suggestions };
    });
    const unmatchedPayments = await prisma.bankPayment.findMany({
      where: { matchedDocumentId: null },
      orderBy: { date: 'desc' },
      take: 200,
    });
    res.json({ unmatchedDocuments, unmatchedPayments });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/accounting/reconciliation/auto — автосверка: ровно один подходящий платёж → связать
router.post('/reconciliation/auto', async (_req: AuthRequest, res) => {
  try {
    const docs = await prisma.financeDocument.findMany({
      where: { matchStatus: 'unmatched', status: { not: 'archived' }, amount: { gt: 0 } },
      orderBy: { date: 'asc' },
    });
    let matched = 0;
    for (const doc of docs) {
      const candidates = await findPaymentSuggestions(doc);
      // Связываем только однозначное совпадение — неоднозначность оставляем на ручную сверку
      if (candidates.length !== 1) continue;
      const payment = candidates[0];
      // Связь занимаем атомарно: updateMany с условием matchedDocumentId: null —
      // если платёж успели связать параллельно, count будет 0 и документ пропускаем
      const linked = await prisma.$transaction(async (tx) => {
        const claim = await tx.bankPayment.updateMany({
          where: { id: payment.id, matchedDocumentId: null },
          data: { matchedDocumentId: doc.id },
        });
        if (claim.count !== 1) return false;
        await tx.financeDocument.update({
          where: { id: doc.id },
          data: { matchStatus: 'auto', matchedPaymentId: payment.id },
        });
        return true;
      });
      if (linked) matched += 1;
    }
    res.json({ matched });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/accounting/reconciliation/match {documentId, paymentId} — ручная связь
router.post('/reconciliation/match', async (req: AuthRequest, res) => {
  try {
    const schema = z.object({ documentId: z.string().min(1), paymentId: z.string().min(1) });
    const { documentId, paymentId } = schema.parse(req.body);
    const doc = await prisma.financeDocument.findUnique({ where: { id: documentId } });
    if (!doc) return res.status(404).json({ error: 'Документ не найден' });
    const payment = await prisma.bankPayment.findUnique({ where: { id: paymentId } });
    if (!payment) return res.status(404).json({ error: 'Платёж не найден' });
    if (payment.matchedDocumentId && payment.matchedDocumentId !== documentId) {
      return res.status(409).json({ error: 'Платёж уже связан с другим документом' });
    }
    // Связь занимаем атомарно: updateMany с условием matchedDocumentId: null —
    // защита от гонки, когда платёж связывают параллельно (автосверка/другой запрос)
    let conflict = false;
    try {
      await prisma.$transaction(async (tx) => {
        // Если документ был связан с другим платежом — старую связь разрываем
        if (doc.matchedPaymentId && doc.matchedPaymentId !== paymentId) {
          await tx.bankPayment.updateMany({
            where: { id: doc.matchedPaymentId },
            data: { matchedDocumentId: null },
          });
        }
        const claim = await tx.bankPayment.updateMany({
          where: { id: paymentId, matchedDocumentId: null },
          data: { matchedDocumentId: documentId },
        });
        if (claim.count !== 1) {
          conflict = true;
          throw new Error('PAYMENT_ALREADY_MATCHED');
        }
        await tx.financeDocument.update({
          where: { id: documentId },
          data: { matchStatus: 'manual', matchedPaymentId: paymentId },
        });
      });
    } catch (e: any) {
      if (conflict) {
        return res.status(409).json({ error: 'Платёж уже связан с другим документом' });
      }
      throw e;
    }
    res.json({ success: true });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// POST /api/accounting/reconciliation/unmatch {documentId} — разорвать связь
router.post('/reconciliation/unmatch', async (req: AuthRequest, res) => {
  try {
    const schema = z.object({ documentId: z.string().min(1) });
    const { documentId } = schema.parse(req.body);
    const doc = await prisma.financeDocument.findUnique({ where: { id: documentId } });
    if (!doc) return res.status(404).json({ error: 'Документ не найден' });
    if (doc.matchedPaymentId) {
      await prisma.bankPayment.updateMany({
        where: { id: doc.matchedPaymentId },
        data: { matchedDocumentId: null },
      });
    }
    await prisma.financeDocument.update({
      where: { id: documentId },
      data: { matchStatus: 'unmatched', matchedPaymentId: null },
    });
    res.json({ success: true });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

export default router;
