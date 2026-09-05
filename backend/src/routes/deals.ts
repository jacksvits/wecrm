import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();
router.use(authMiddleware);

const createSchema = z.object({
  title: z.string().min(1),
  value: z.number().default(0),
  currency: z.string().default('RUB'),
  stage: z.enum(['lead', 'contact', 'proposal', 'negotiation', 'contract', 'won', 'lost']).default('lead'),
  probability: z.number().min(0).max(100).default(10),
  expectedClose: z.string().datetime().optional(),
  contactId: z.string().optional(),
  projectId: z.string().optional(),
});

router.get('/', async (req, res) => {
  const { stage, search, contactId } = req.query;
  const where: any = {};
  if (stage) {
    if (Array.isArray(stage)) {
      where.stage = { in: stage };
    } else {
      where.stage = stage;
    }
  }
  if (contactId) where.contactId = contactId as string;
  if (search) where.title = { contains: search as string, mode: 'insensitive' };

  const deals = await prisma.deal.findMany({
    where,
    include: {
      contact: { select: { id: true, name: true, company: true } },
      project: { select: { id: true, name: true } },
      _count: { select: { tasks: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
  res.json(deals);
});

router.post('/', async (req, res) => {
  try {
    const data = createSchema.parse(req.body);
    const deal = await prisma.deal.create({
      data: {
        ...data,
        expectedClose: data.expectedClose ? new Date(data.expectedClose) : undefined,
      },
      include: { contact: { select: { id: true, name: true } } },
    });
    res.status(201).json(deal);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.patch('/:id', async (req, res) => {
  const deal = await prisma.deal.update({
    where: { id: req.params.id },
    data: req.body,
    include: { contact: { select: { id: true, name: true } } },
  });
  res.json(deal);
});

router.delete('/:id', async (req, res) => {
  await prisma.deal.delete({ where: { id: req.params.id } });
  res.json({ success: true });
});

export default router;
