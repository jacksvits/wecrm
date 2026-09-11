import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import { getTochkaState, loadAccountUsers } from './tochka.js';

const router = Router();
router.use(authMiddleware);

router.get('/stats', async (req: AuthRequest, res) => {
  const oneMinuteAgo = new Date(Date.now() - 1 * 60 * 1000);
  const [activeTasks, overdueTasks, dealsInProgress, totalDealValue, completedProjects, users, onlineUsersCount, onlineUsersList, totalTasks, totalContacts, totalDeals, totalProjects] = await Promise.all([
    prisma.task.count({ where: { status: { in: ['open', 'in_progress', 'load'] } } }),
    // Просрочено: активные задачи текущего пользователя с вышедшим сроком исполнения
    prisma.task.count({ where: { status: { in: ['open', 'in_progress', 'load'] }, dueDate: { lt: new Date() }, assignees: { some: { userId: req.user!.id } } } }),
    prisma.deal.count({ where: { stage: { notIn: ['won', 'lost'] } } }),
    prisma.deal.aggregate({ where: { stage: { notIn: ['won', 'lost'] } }, _sum: { value: true } }),
    prisma.project.count({ where: { status: 'completed' } }),
    prisma.user.count(),
    prisma.user.count({ where: { lastActiveAt: { gte: oneMinuteAgo } } }),
    prisma.user.findMany({
      where: { lastActiveAt: { gte: oneMinuteAgo } },
      select: { id: true, name: true, avatar: true },
      orderBy: { lastActiveAt: 'desc' },
      take: 5,
    }),
    prisma.task.count(),
    prisma.contact.count(),
    prisma.deal.count(),
    prisma.project.count(),
  ]);

  const monthlyDeals = await prisma.deal.groupBy({
    by: ['stage'],
    _sum: { value: true },
    _count: { id: true },
  });

  // Балансы счетов Точка Банк, привязанных к текущему пользователю (accountId -> userId)
  let tochkaBalances: Array<{ id: string; name: string; balance: number }> = [];
  try {
    const accountUsers = loadAccountUsers();
    const myAccountIds = Object.keys(accountUsers).filter((accId) => accountUsers[accId] === req.user!.id);
    if (myAccountIds.length > 0) {
      const state = await getTochkaState();
      const byId = new Map((state.accounts || []).map((a: any) => [a.id, a]));
      tochkaBalances = myAccountIds
        .map((accId) => byId.get(accId))
        .filter(Boolean)
        .map((a: any) => ({ id: a.id, name: a.name, balance: a.balance ?? 0 }));
    }
  } catch (e) {
    console.error('[dashboard] tochka balances error:', (e as any).message);
  }

  res.json({
    tochkaBalances,
    metrics: {
      activeTasks,
      overdueTasks,
      dealsInProgress,
      totalDealValue: totalDealValue._sum.value || 0,
      completedProjects,
      users,
      onlineUsers: onlineUsersCount,
    },
    totalTasks,
    totalContacts,
    totalDeals,
    totalProjects,
    onlineUsersList,
    pipeline: monthlyDeals,
  });
});

router.get('/activities', async (req, res) => {
  const activities = await prisma.activity.findMany({
    take: 20,
    orderBy: { createdAt: 'desc' },
    include: {
      user: { select: { id: true, name: true } },
      task: { select: { id: true, title: true } },
    },
  });

  // Batch-загрузка названий сущностей вместо N+1 запросов
  const taskIds: string[] = [];
  const dealIds: string[] = [];
  const contactIds: string[] = [];
  const projectIds: string[] = [];

  for (const a of activities) {
    if (a.entity === 'task' && !a.task?.title) taskIds.push(a.entityId);
    else if (a.entity === 'deal') dealIds.push(a.entityId);
    else if (a.entity === 'contact') contactIds.push(a.entityId);
    else if (a.entity === 'project') projectIds.push(a.entityId);
    else if (a.entity === 'comment') taskIds.push(a.entityId);
  }

  const [tasksMap, dealsMap, contactsMap, projectsMap] = await Promise.all([
    taskIds.length > 0
      ? prisma.task.findMany({
    take: 100,
    orderBy: { createdAt: 'desc' }, where: { id: { in: taskIds } }, select: { id: true, title: true } })
      : Promise.resolve([]),
    dealIds.length > 0
      ? prisma.deal.findMany({ where: { id: { in: dealIds } }, select: { id: true, title: true } })
      : Promise.resolve([]),
    contactIds.length > 0
      ? prisma.contact.findMany({ where: { id: { in: contactIds } }, select: { id: true, name: true } })
      : Promise.resolve([]),
    projectIds.length > 0
      ? prisma.project.findMany({ where: { id: { in: projectIds } }, select: { id: true, name: true } })
      : Promise.resolve([]),
  ]);

  const taskTitleMap = new Map(tasksMap.map(t => [t.id, t.title]));
  const dealTitleMap = new Map(dealsMap.map(d => [d.id, d.title]));
  const contactNameMap = new Map(contactsMap.map(c => [c.id, c.name]));
  const projectNameMap = new Map(projectsMap.map(p => [p.id, p.name]));

  const enriched = activities.map((a) => {
    let entityName: string | null = null;

    if (a.entity === 'task') {
      entityName = a.task?.title ?? taskTitleMap.get(a.entityId) ?? null;
    } else if (a.entity === 'deal') {
      entityName = dealTitleMap.get(a.entityId) ?? null;
    } else if (a.entity === 'contact') {
      entityName = contactNameMap.get(a.entityId) ?? null;
    } else if (a.entity === 'project') {
      entityName = projectNameMap.get(a.entityId) ?? null;
    } else if (a.entity === 'comment') {
      entityName = taskTitleMap.get(a.entityId) ?? null;
    }

    return { ...a, entityName };
  });

  res.json(enriched);
});

router.get('/task-finances', async (req, res) => {
  const tasks = await prisma.task.findMany({
    take: 100,
    orderBy: { createdAt: 'desc' },
    where: {
      OR: [
        { dealId: { not: null } },
        { transactions: { some: {} } },
      ],
    },
    include: { transactions: true, deal: { select: { value: true } } },
  });
  const monthlyMap = new Map<string, { key: string; month: string; budget: number; income: number; expense: number; profit: number }>();
  let totalBudget = 0;
  let totalIncome = 0;
  let totalExpense = 0;
  let totalProfit = 0;
  for (const task of tasks) {
    // Бюджет задачи = сумма связанной сделки, при отсутствии сделки — поле budget задачи
    const budget = (task.deal?.value ?? task.budget) || 0;
    const income = task.transactions.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const expense = task.transactions.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    const profit = income - expense;
    totalBudget += budget;
    totalIncome += income;
    totalExpense += expense;
    totalProfit += profit;
    const created = new Date(task.createdAt);
    const key = `${created.getFullYear()}-${String(created.getMonth() + 1).padStart(2, '0')}`;
    const month = created.toLocaleString('ru', { year: 'numeric', month: 'long' });
    const cur = monthlyMap.get(key) || { key, month, budget: 0, income: 0, expense: 0, profit: 0 };
    cur.budget += budget;
    cur.income += income;
    cur.expense += expense;
    cur.profit += profit;
    monthlyMap.set(key, cur);
  }
  // Новые месяцы первыми (месяц дополнен нулём до 2 цифр — строковая сортировка корректна)
  const monthly = Array.from(monthlyMap.values()).sort((a, b) => b.key.localeCompare(a.key));
  res.json({ totalBudget, totalIncome, totalExpense, totalProfit, monthly });
});

// Задачи конкретного месяца — детализация виджета «Помесячный отчёт по задачам»
router.get('/task-finances/month-tasks', async (req, res) => {
  const match = String(req.query.month || '').match(/^(\d{4})-(\d{1,2})$/);
  if (!match) return res.status(400).json({ error: 'Неверный формат месяца. Ожидается YYYY-M' });
  const year = parseInt(match[1], 10);
  const month = parseInt(match[2], 10);
  if (month < 1 || month > 12) return res.status(400).json({ error: 'Неверный месяц' });
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 1);
  // Тот же фильтр, что и в /task-finances: задача сделки или с транзакциями
  const tasks = await prisma.task.findMany({
    orderBy: { createdAt: 'desc' },
    where: {
      createdAt: { gte: start, lt: end },
      OR: [
        { dealId: { not: null } },
        { transactions: { some: {} } },
      ],
    },
    include: {
      transactions: true,
      deal: { select: { value: true } },
      assignees: { include: { user: { select: { name: true } } } },
    },
  });
  const items = tasks.map((task) => {
    const budget = (task.deal?.value ?? task.budget) || 0;
    const income = task.transactions.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const expense = task.transactions.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    return {
      id: task.id,
      title: task.title,
      status: task.status,
      createdAt: task.createdAt,
      budget,
      income,
      expense,
      profit: income - expense,
      assignees: task.assignees.map((a) => a.user?.name).filter(Boolean),
    };
  });
  res.json({ month: `${year}-${String(month).padStart(2, '0')}`, tasks: items });
});

export default router;
