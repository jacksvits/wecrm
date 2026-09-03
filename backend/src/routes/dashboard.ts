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

  const enriched = await Promise.all(
    activities.map(async (a) => {
      let entityName: string | null = null;

      if (a.entity === 'task') {
        if (a.task?.title) {
          entityName = a.task.title;
        } else {
          const task = await prisma.task.findUnique({
            where: { id: a.entityId },
            select: { title: true },
          });
          entityName = task?.title ?? null;
        }
      } else if (a.entity === 'deal') {
        const deal = await prisma.deal.findUnique({
          where: { id: a.entityId },
          select: { title: true },
        });
        entityName = deal?.title ?? null;
      } else if (a.entity === 'contact') {
        const contact = await prisma.contact.findUnique({
          where: { id: a.entityId },
          select: { name: true },
        });
        entityName = contact?.name ?? null;
      } else if (a.entity === 'project') {
        const project = await prisma.project.findUnique({
          where: { id: a.entityId },
          select: { name: true },
        });
        entityName = project?.name ?? null;
      } else if (a.entity === 'comment') {
        const task = await prisma.task.findUnique({
          where: { id: a.entityId },
          select: { title: true },
        });
        entityName = task?.title ?? null;
      }

      return {
        ...a,
        entityName,
      };
    })
  );

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
