import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';

const router = Router();
router.use(authMiddleware);

const filterSchema = z.object({
  name: z.string().min(1),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
  fromContains: z.string().optional().nullable(),
  toContains: z.string().optional().nullable(),
  subjectContains: z.string().optional().nullable(),
  bodyContains: z.string().optional().nullable(),
  hasAttachments: z.boolean().optional().nullable(),
  createTask: z.boolean().default(true),
  projectId: z.string().optional().nullable(),
  assigneeIds: z.array(z.string()).default([]),
  priority: z.string().optional().nullable(),
  status: z.string().optional().nullable(),
  markRead: z.boolean().optional().nullable(),
  moveToFolder: z.string().optional().nullable(),
  parseRules: z.array(z.object({
    pattern: z.string().min(1),
    field: z.enum(['title', 'description', 'priority', 'status']),
    group: z.number().int().min(0).max(9).default(1),
  })).optional().nullable(),
  stopProcessing: z.boolean().default(true),
});

// Проверка компиляции регулярных выражений правил парсинга
const validateParseRules = (rules?: { pattern: string }[] | null): string | null => {
  for (const r of rules || []) {
    try { new RegExp(r.pattern); } catch { return `Некорректное регулярное выражение: ${r.pattern}`; }
  }
  return null;
};

router.get('/', async (_req: AuthRequest, res) => {
  const filters = await prisma.emailFilter.findMany({
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    include: { project: { select: { id: true, name: true } } },
  });
  res.json(filters);
});

router.get('/logs', async (_req: AuthRequest, res) => {
  const logs = await prisma.emailFilterLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: 200,
    include: { filter: { select: { name: true } } },
  });
  res.json(logs);
});

router.post('/', async (req: AuthRequest, res) => {
  try {
    const data = filterSchema.parse(req.body);
    const regexError = validateParseRules(data.parseRules);
    if (regexError) return res.status(400).json({ error: regexError });
    const filter = await prisma.emailFilter.create({ data: data as any });
    res.json(filter);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.patch('/:id', async (req: AuthRequest, res) => {
  try {
    const data = filterSchema.partial().parse(req.body);
    const regexError = validateParseRules(data.parseRules);
    if (regexError) return res.status(400).json({ error: regexError });
    const filter = await prisma.emailFilter.update({
      where: { id: req.params.id },
      data: data as any,
    });
    res.json(filter);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/:id', async (req: AuthRequest, res) => {
  await prisma.emailFilterLog.deleteMany({ where: { filterId: req.params.id } });
  await prisma.emailFilter.delete({ where: { id: req.params.id } });
  res.json({ success: true });
});

export default router;
