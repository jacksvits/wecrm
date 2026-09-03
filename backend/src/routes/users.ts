import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';

const router = Router();
router.use(authMiddleware);

const createSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(2),
  username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_]+$/, 'Username must be alphanumeric with underscores').optional(),
  roleId: z.string().optional(),
  canBeCurator: z.boolean().optional(),
});

const updateSchema = z.object({
  name: z.string().min(2).optional(),
  roleId: z.string().optional(),
  email: z.string().email().optional(),
  username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_]+$/, 'Username must be alphanumeric with underscores').optional().nullable(),
  emails: z.array(z.string().email()).optional(),
  canBeCurator: z.boolean().optional(),
  novofonExtension: z.string().optional().nullable(),
});

const adminOnly = (req: AuthRequest, res: any, next: any) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Требуются права администратора' });
  }
  next();
};

router.get('/', async (req, res) => {
  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true, username: true, emails: true, avatar: true, roleId: true, role: true, createdAt: true, lastActiveAt: true, canBeCurator: true, novofonExtension: true },
    orderBy: { name: 'asc' },
  });
  res.json(users);
});

router.post('/', adminOnly, async (req: AuthRequest, res) => {
  try {
    const data = createSchema.parse(req.body);
    const existingEmail = await prisma.user.findUnique({ where: { email: data.email } });
    if (existingEmail) return res.status(400).json({ error: 'Пользователь с таким email уже существует' });

    if (data.username) {
      const existingUsername = await prisma.user.findUnique({ where: { username: data.username } });
      if (existingUsername) return res.status(400).json({ error: 'Пользователь с таким логином уже существует' });
    }

    const hash = await bcrypt.hash(data.password, 10);
    const user = await prisma.user.create({
      data: { email: data.email, username: data.username || null, password: hash, name: data.name, roleId: data.roleId || null, canBeCurator: data.canBeCurator ?? false },
      select: { id: true, name: true, email: true, username: true, emails: true, avatar: true, roleId: true, role: true, createdAt: true, lastActiveAt: true, canBeCurator: true, novofonExtension: true },
    });
    res.status(201).json(user);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.patch('/:id', adminOnly, async (req: AuthRequest, res) => {
  try {
    const data = updateSchema.parse(req.body);
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data,
      select: { id: true, name: true, email: true, username: true, emails: true, avatar: true, roleId: true, role: true, createdAt: true, lastActiveAt: true, canBeCurator: true, novofonExtension: true },
    });
    res.json(user);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Avatar routes must be defined BEFORE /:id to avoid "avatar" being treated as user id
router.post('/avatar', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { image } = z.object({ image: z.string().min(1) }).parse(req.body);
    if (!image.startsWith('data:image/')) {
      return res.status(400).json({ error: 'Неверный формат изображения' });
    }
    // Extract base64 data and save as file
    const match = image.match(/^data:image\/(\w+);base64,(.+)$/);
    if (!match) {
      return res.status(400).json({ error: 'Неверный формат изображения' });
    }
    const ext = match[1] === 'jpeg' ? 'jpg' : match[1];
    const base64Data = match[2];
    const avatarDir = '/app/uploads/avatars';
    if (!fs.existsSync(avatarDir)) {
      fs.mkdirSync(avatarDir, { recursive: true });
    }
    const filePath = path.join(avatarDir, `${req.user!.id}.${ext}`);
    fs.writeFileSync(filePath, Buffer.from(base64Data, 'base64'));
    const avatarUrl = `/uploads/avatars/${req.user!.id}.${ext}`;
    const user = await prisma.user.update({
      where: { id: req.user!.id },
      data: { avatar: avatarUrl },
      select: { id: true, name: true, email: true, username: true, avatar: true, role: true, allowedPages: true, darkTheme: true, emails: true },
    });
    res.json(user);
  } catch (err: any) {
    console.error('[Avatar Upload] Error:', err.message);
    res.status(400).json({ error: err.message });
  }
});

router.delete('/avatar', authMiddleware, async (req: AuthRequest, res) => {
  try {
    // Delete avatar file if exists
    const avatarDir = '/app/uploads/avatars';
    const files = fs.readdirSync(avatarDir).filter(f => f.startsWith(req.user!.id + '.'));
    for (const file of files) {
      fs.unlinkSync(path.join(avatarDir, file));
    }
    const user = await prisma.user.update({
      where: { id: req.user!.id },
      data: { avatar: null },
      select: { id: true, name: true, email: true, username: true, avatar: true, role: true, allowedPages: true, darkTheme: true, emails: true },
    });
    res.json(user);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/:id', adminOnly, async (req: AuthRequest, res) => {
  try {
    if (req.params.id === req.user?.id) {
      return res.status(400).json({ error: 'Нельзя удалить самого себя' });
    }
    await prisma.user.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/online', authMiddleware, async (_req, res) => {
  try {
    const oneMinuteAgo = new Date(Date.now() - 1 * 60 * 1000);
    const users = await prisma.user.findMany({
      where: { lastActiveAt: { gte: oneMinuteAgo } },
      select: {
        id: true, name: true, email: true, username: true, avatar: true,
        role: { select: { name: true } }, lastActiveAt: true,
      },
      orderBy: { lastActiveAt: 'desc' },
    });
    res.json(users);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/heartbeat', authMiddleware, async (req: AuthRequest, res) => {
  try {
    await prisma.user.update({
      where: { id: req.user!.id },
      data: { lastActiveAt: new Date() },
    });
    res.json({ ok: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/push-status', adminOnly, async (_req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        pushEnabled: true,
        role: { select: { name: true, label: true } },
        _count: { select: { pushSubscriptions: true } },
      },
      orderBy: { name: 'asc' },
    });
    const mapped = users.map(u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      avatar: u.avatar,
      role: u.role,
      pushEnabled: u.pushEnabled,
      hasSubscription: u._count.pushSubscriptions > 0,
      subscriptionCount: u._count.pushSubscriptions,
    }));
    res.json(mapped);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
