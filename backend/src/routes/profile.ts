import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();
router.use(authMiddleware);

const updateSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_]+$/, 'Username must be alphanumeric with underscores').optional().nullable(),
  emails: z.array(z.string().email()).optional(),
  hideCompletedTasks: z.boolean().optional(),
  darkTheme: z.boolean().optional(),
  pushEnabled: z.boolean().optional(),
  notifyTask: z.boolean().optional(),
  notifyComment: z.boolean().optional(),
  notifyChat: z.boolean().optional(),
  notifyCall: z.boolean().optional(),
  notifyDeal: z.boolean().optional(),
  notifyNews: z.boolean().optional(),
  soundEnabled: z.boolean().optional(),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(6),
});

router.get('/', async (req: any, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    include: { role: { select: { name: true } } },
  });
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({
    id: user.id,
    email: user.email,
    username: user.username,
    name: user.name,
    avatar: user.avatar,
    emails: user.emails,
    role: user.role?.name || 'user',
    hideCompletedTasks: user.hideCompletedTasks,
    darkTheme: user.darkTheme,
    pushEnabled: user.pushEnabled,
    notifyTask: user.notifyTask,
    notifyComment: user.notifyComment,
    notifyChat: user.notifyChat,
    notifyCall: user.notifyCall,
    notifyDeal: user.notifyDeal,
    notifyNews: user.notifyNews,
    soundEnabled: user.soundEnabled,
    createdAt: user.createdAt,
    lastActiveAt: user.lastActiveAt,
  });
});

router.patch('/', async (req: any, res) => {
  try {
    const data = updateSchema.parse(req.body);

    // Check username uniqueness if changing
    if (data.username !== undefined && data.username !== null) {
      const existing = await prisma.user.findFirst({
        where: { username: data.username, id: { not: req.user!.id } },
      });
      if (existing) return res.status(400).json({ error: 'Username already taken' });
    }

    const user = await prisma.user.update({
      where: { id: req.user!.id },
      data,
      include: { role: { select: { name: true } } },
    });
    res.json({
      id: user.id,
      email: user.email,
      username: user.username,
      name: user.name,
      avatar: user.avatar,
      emails: user.emails,
      role: user.role?.name || 'user',
      hideCompletedTasks: user.hideCompletedTasks,
      darkTheme: user.darkTheme,
      pushEnabled: user.pushEnabled,
      notifyTask: user.notifyTask,
      notifyComment: user.notifyComment,
      notifyChat: user.notifyChat,
      notifyCall: user.notifyCall,
      notifyDeal: user.notifyDeal,
      notifyNews: user.notifyNews,
      soundEnabled: user.soundEnabled,
      lastActiveAt: user.lastActiveAt,
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/change-password', async (req: any, res) => {
  try {
    const data = passwordSchema.parse(req.body);
    const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
    if (!user) return res.status(404).json({ error: 'User not found' });
    const valid = await bcrypt.compare(data.currentPassword, user.password);
    if (!valid) return res.status(401).json({ error: 'Current password is incorrect' });
    const hash = await bcrypt.hash(data.newPassword, 10);
    await prisma.user.update({ where: { id: req.user!.id }, data: { password: hash } });
    res.json({ success: true });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

export default router;
