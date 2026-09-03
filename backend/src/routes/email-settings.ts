import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';

const router = Router();
router.use(authMiddleware);

const settingsSchema = z.object({
  imapHost: z.string().min(1),
  imapPort: z.number().int().min(1).max(65535).default(993),
  imapUser: z.string().min(1),
  imapPass: z.string().min(1),
  checkIntervalMs: z.number().int().min(5000).default(60000),
  processedFolder: z.string().optional(),
  defaultCreatorId: z.string().optional(),
  isActive: z.boolean().default(true),
  secure: z.boolean().default(true),
  rejectUnauthorized: z.boolean().default(false),
  requireTLS: z.boolean().default(true),
});

router.get('/', async (_req: AuthRequest, res) => {
  const settings = await prisma.emailSettings.findFirst();
  if (!settings) {
    return res.json(null);
  }
  // Не возвращаем пароль в открытом виде
  const { imapPass, ...safe } = settings;
  res.json({ ...safe, hasPassword: !!imapPass });
});

router.post('/', async (req: AuthRequest, res) => {
  try {
    const data = settingsSchema.parse(req.body);
    const existing = await prisma.emailSettings.findFirst();

    let settings;
    if (existing) {
      settings = await prisma.emailSettings.update({
        where: { id: existing.id },
        data: { ...data, updatedAt: new Date() },
      });
    } else {
      settings = await prisma.emailSettings.create({ data });
    }

    const { imapPass, ...safe } = settings;
    res.json({ ...safe, hasPassword: !!imapPass });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/', async (_req: AuthRequest, res) => {
  await prisma.emailSettings.deleteMany();
  res.json({ success: true });
});

export default router;
