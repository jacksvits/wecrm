import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import { ensureGuestUser, GUEST_EMAIL } from '../lib/guest-demo.js';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(2),
  username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_]+$/, 'Username must be alphanumeric with underscores').optional(),
});

const loginSchema = z.object({
  login: z.string().min(1),
  password: z.string(),
});

router.post('/register', async (req, res) => {
  try {
    const data = registerSchema.parse(req.body);

    const existingEmail = await prisma.user.findUnique({ where: { email: data.email } });
    if (existingEmail) return res.status(400).json({ error: 'Email already exists' });

    if (data.username) {
      const existingUsername = await prisma.user.findUnique({ where: { username: data.username } });
      if (existingUsername) return res.status(400).json({ error: 'Username already exists' });
    }

    // Роль по умолчанию для самостоятельной регистрации — обычный пользователь (роль "user")
    let defaultRole = await prisma.role.findUnique({ where: { name: 'user' } });
    if (!defaultRole) {
      defaultRole = await prisma.role.create({
        data: { name: 'user', label: 'Пользователи', color: '#f0f0f0', textColor: '#666', sortOrder: 4 },
      });
    }

    const hash = await bcrypt.hash(data.password, 10);
    const user = await prisma.user.create({
      data: {
        email: data.email,
        username: data.username || null,
        password: hash,
        name: data.name,
        roleId: defaultRole.id,
      },
      include: { role: { select: { name: true, allowedPages: true, showFinancesTab: true, stockAccess: true, canChangeTaskStatus: true, allowedTaskStatuses: true, canCreateNews: true, canEditNews: true, canHandleSpam: true } } },
    });

    const roleName = user.role?.name || 'user';
    const allowedPages = user.role?.allowedPages || [];
    const stockAccess = user.stockAccess || user.role?.stockAccess || false;
    const token = jwt.sign(
      { id: user.id, email: user.email, role: roleName, allowedPages, stockAccess },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        name: user.name,
        role: roleName,
        roleId: user.roleId,
        allowedPages,
        mobileNav: user.mobileNav || [],
        stockAccess,
      },
      token,
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const data = loginSchema.parse(req.body);

    // Try to find by email first, then by username
    let user = await prisma.user.findUnique({
      where: { email: data.login },
      include: { role: { select: { name: true, allowedPages: true, showFinancesTab: true, stockAccess: true, canChangeTaskStatus: true, allowedTaskStatuses: true, canCreateNews: true, canEditNews: true, canHandleSpam: true } } },
    });

    if (!user) {
      user = await prisma.user.findUnique({
        where: { username: data.login },
        include: { role: { select: { name: true, allowedPages: true, showFinancesTab: true, stockAccess: true, canChangeTaskStatus: true, allowedTaskStatuses: true, canCreateNews: true, canEditNews: true, canHandleSpam: true } } },
      });
    }

    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const valid = await bcrypt.compare(data.password, user.password);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    const roleName = user.role?.name || 'user';
    const allowedPages = user.role?.allowedPages || [];
    const stockAccess = user.stockAccess || user.role?.stockAccess || false;
    const token = jwt.sign(
      { id: user.id, email: user.email, role: roleName, allowedPages, stockAccess },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        name: user.name,
        role: roleName,
        roleId: user.roleId,
        allowedPages,
        mobileNav: user.mobileNav || [],
        stockAccess,
      },
      token,
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});


// Гостевой доступ: вход без регистрации с правами обычного пользователя (роль user).
// Демо-данные не создаются — гость работает с реальными данными в рамках своих прав.
router.post('/guest', async (req, res) => {
  try {
    const guest = await ensureGuestUser();

    const user = await prisma.user.findUnique({
      where: { id: guest.id },
      include: { role: { select: { name: true, allowedPages: true, showFinancesTab: true, stockAccess: true, canChangeTaskStatus: true, allowedTaskStatuses: true, canCreateNews: true, canEditNews: true, canHandleSpam: true } } },
    });
    if (!user) return res.status(500).json({ error: 'Guest user not found' });

    const { token, roleName, allowedPages } = issueToken(user);
    res.json({ user: publicUser(user, roleName, allowedPages), token });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/me', async (req, res) => {
  // приём токена как в authMiddleware: Authorization / X-Auth-Token / ?token=
  const authHeader = req.headers.authorization;
  let token: string | undefined;
  if (authHeader?.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else if (typeof req.headers['x-auth-token'] === 'string') {
    token = req.headers['x-auth-token'] as string;
  } else if (typeof req.query.token === 'string') {
    token = req.query.token;
  }
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      include: { role: { select: { name: true, allowedPages: true, showFinancesTab: true, stockAccess: true, canChangeTaskStatus: true, allowedTaskStatuses: true, canCreateNews: true, canEditNews: true, canHandleSpam: true, canAccessSupportChat: true } } },
    });
    if (!user) return res.status(401).json({ error: 'User not found' });

    let impersonatorName: string | null = null;
    if (decoded.imp) {
      const imp = await prisma.user.findUnique({ where: { id: decoded.imp }, select: { name: true } });
      impersonatorName = imp?.name || null;
    }

    res.json({
      id: user.id,
      email: user.email,
      username: user.username,
      name: user.name,
      role: user.role?.name || 'user',
      roleId: user.roleId,
      avatar: user.avatar,
      emails: user.emails,
      allowedPages: user.role?.allowedPages || [],
      mobileNav: user.mobileNav || [],
      showFinancesTab: user.role?.showFinancesTab ?? false,
      isGuest: user.email === GUEST_EMAIL,
      stockAccess: user.email === GUEST_EMAIL ? false : (user.stockAccess || user.role?.stockAccess || false),
      canChangeTaskStatus: user.role?.canChangeTaskStatus ?? true,
      allowedTaskStatuses: user.role?.allowedTaskStatuses ?? [],
      canCreateNews: user.email === GUEST_EMAIL ? false : (user.role?.canCreateNews ?? true),
    canHandleSpam: user.role?.canHandleSpam ?? false,
      canAccessSupportChat: user.role?.canAccessSupportChat ?? false,
      canEditNews: user.email === GUEST_EMAIL ? false : (user.role?.canEditNews ?? true),
      lastActiveAt: user.lastActiveAt,
      impersonatorId: decoded.imp || null,
      impersonatorName,
    });
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
});

const adminOnly = (req: AuthRequest, res: any, next: any) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Требуются права администратора' });
  }
  next();
};

const issueToken = (user: any, imp?: string) => {
  const roleName = user.role?.name || 'user';
  const allowedPages = user.role?.allowedPages || [];
  const token = jwt.sign(
    { id: user.id, email: user.email, role: roleName, allowedPages, ...(imp ? { imp } : {}) },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
  return { token, roleName, allowedPages };
};

const publicUser = (user: any, roleName: string, allowedPages: string[]) => {
  // Гостевая сессия: только просмотр — без склада и создания новостей
  const isGuest = user.email === GUEST_EMAIL;
  return {
    id: user.id,
    email: user.email,
    username: user.username,
    name: user.name,
    role: roleName,
    roleId: user.roleId,
    avatar: user.avatar,
    allowedPages,
    mobileNav: user.mobileNav ?? [],
    isGuest,
    stockAccess: isGuest ? false : (user.stockAccess || user.role?.stockAccess || false),
    canCreateNews: isGuest ? false : (user.role?.canCreateNews ?? true),
    canEditNews: isGuest ? false : (user.role?.canEditNews ?? true),
  };
};

// Мультиаккаунтность: администратор быстро переходит под аккаунт другого пользователя
router.post('/impersonate', authMiddleware, adminOnly, async (req: AuthRequest, res) => {
  try {
    const { userId } = z.object({ userId: z.string().min(1) }).parse(req.body);
    if (userId === req.user!.id) return res.status(400).json({ error: 'Вы уже в своём аккаунте' });
    const target = await prisma.user.findUnique({
      where: { id: userId },
      include: { role: { select: { name: true, allowedPages: true, showFinancesTab: true, stockAccess: true, canChangeTaskStatus: true, allowedTaskStatuses: true, canCreateNews: true, canEditNews: true, canHandleSpam: true } } },
    });
    if (!target) return res.status(404).json({ error: 'Пользователь не найден' });
    const { token, roleName, allowedPages } = issueToken(target, req.user!.id);
    await prisma.activity.create({
      data: {
        action: 'impersonate',
        entity: 'user',
        entityId: target.id,
        details: `Администратор ${req.user!.name} перешёл под пользователя ${target.name}`,
        userId: req.user!.id,
      },
    });
    res.json({ user: publicUser(target, roleName, allowedPages), token });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Мультиаккаунтность: возврат администратора в свой аккаунт
router.post('/stop-impersonation', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const impersonatorId = req.user?.impersonatorId;
    if (!impersonatorId) return res.status(400).json({ error: 'Нет активного переключения аккаунта' });
    const admin = await prisma.user.findUnique({
      where: { id: impersonatorId },
      include: { role: { select: { name: true, allowedPages: true, showFinancesTab: true, stockAccess: true, canChangeTaskStatus: true, allowedTaskStatuses: true, canCreateNews: true, canEditNews: true, canHandleSpam: true } } },
    });
    if (!admin) return res.status(401).json({ error: 'User not found' });
    const { token, roleName, allowedPages } = issueToken(admin);
    await prisma.activity.create({
      data: {
        action: 'impersonate-end',
        entity: 'user',
        entityId: admin.id,
        details: `Администратор ${admin.name} вернулся в свой аккаунт`,
        userId: admin.id,
      },
    });
    res.json({ user: publicUser(admin, roleName, allowedPages), token });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

export default router;
