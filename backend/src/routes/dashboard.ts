import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();
router.use(authMiddleware);

router.get('/stats', async (req, res) => {
  const oneMinuteAgo = new Date(Date.now() - 1 * 60 * 1000);
  const [activeTasks, overdueTasks, dealsInProgress, totalDealValue, completedProjects, users, onlineUsersCount, onlineUsersList, totalTasks, totalContacts, totalDeals, totalProjects] = await Promise.all([
    prisma.task.count({ where: { status: { in: ['open', 'in_progress', 'load'] } } }),
    prisma.task.count({ where: { status: { notIn: ['cancelled', 'win'] }, dueDate: { lt: new Date() } } }),
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

  res.json({
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
      ? prisma.task.findMany({ where: { id: { in: taskIds } }, select: { id: true, title: true } })
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
    where: { price: { gt: 0 } },
    include: { transactions: true },
  });
  const monthlyMap = new Map<string, { month: string; budget: number; expense: number; profit: number }>();
  let totalBudget = 0;
  let totalExpense = 0;
  let totalProfit = 0;
  for (const task of tasks) {
    const expense = task.transactions.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    const profit = (task.price || 0) - expense;
    totalBudget += task.budget || 0;
    totalExpense += expense;
    totalProfit += profit;
    const month = new Date(task.createdAt).toLocaleString('ru', { year: 'numeric', month: 'long' });
    const cur = monthlyMap.get(month) || { month, budget: 0, expense: 0, profit: 0 };
    cur.budget += task.budget || 0;
    cur.expense += expense;
    cur.profit += profit;
    monthlyMap.set(month, cur);
  }
  const monthly = Array.from(monthlyMap.values()).sort((a, b) => {
    const da = new Date(a.month.split(' ').reverse().join('-'));
    const db = new Date(b.month.split(' ').reverse().join('-'));
    return db.getTime() - da.getTime();
  });
  res.json({ totalBudget, totalExpense, totalProfit, monthly });
});

export default router;
