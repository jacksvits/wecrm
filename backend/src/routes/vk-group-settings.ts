import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';

const router = Router();
router.use(authMiddleware);

const adminOnly = (req: AuthRequest, res: any, next: any) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Требуются права администратора' });
  }
  next();
};
router.use(adminOnly);

const settingsSchema = z.object({
  groupId: z.number().int().min(1),
  accessToken: z.string().min(1),
  defaultCreatorId: z.string().optional().nullable(),
  assigneeIds: z.array(z.string()).default([]),
  autoCreateContact: z.boolean().default(true),
  isActive: z.boolean().default(true),
  callbackSecret: z.string().optional().nullable(),
  confirmationString: z.string().optional().nullable(),
});

router.get('/', async (_req, res) => {
  const s = await prisma.vkGroupSettings.findFirst();
  if (!s) return res.json(null);
  const { accessToken, ...rest } = s;
  res.json({ ...rest, hasToken: !!accessToken });
});

router.post('/', async (req: AuthRequest, res) => {
  try {
    const data = settingsSchema.parse(req.body);
    const existing = await prisma.vkGroupSettings.findFirst();
    let s;
    if (existing) {
      const payload: any = { ...data };
      if (!payload.accessToken && existing.accessToken) delete payload.accessToken;
      s = await prisma.vkGroupSettings.update({ where: { id: existing.id }, data: payload });
    } else {
      s = await prisma.vkGroupSettings.create({ data: data as any });
    }
    const { accessToken, ...rest } = s;
    res.json({ ...rest, hasToken: !!accessToken });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/', async (_req, res) => {
  await prisma.vkGroupSettings.deleteMany();
  res.json({ success: true });
});

export default router;
