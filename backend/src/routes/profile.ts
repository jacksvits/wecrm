import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { authMiddleware } from '../middleware/auth.js';
import { getLinkedContact, linkUserToContactByPhone, normalizePhone } from '../lib/contact-link.js';

const router = Router();
router.use(authMiddleware);

// Пункты нижней мобильной панели — должны совпадать с frontend/src/lib/navItems.ts
const MOBILE_NAV_PATHS = ['/', '/tasks', '/deals', '/projects', '/contacts', '/products', '/news', '/notes', '/reminders', '/calls', '/files', '/chat'];

const updateSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_]+$/, 'Username must be alphanumeric with underscores').optional().nullable(),
  emails: z.array(z.string().email()).optional(),
  hideCompletedTasks: z.boolean().optional(),
  darkTheme: z.boolean().optional(),
  calendarTimelinePos: z.enum(['bottom', 'right', 'left']).optional(),
  calendarTimelineSize: z.number().int().min(200).max(1600).optional(),
  calendarTheme: z.enum(['classic', 'ocean', 'amethyst']).optional(),
  pushEnabled: z.boolean().optional(),
  notifyTask: z.boolean().optional(),
  notifyComment: z.boolean().optional(),
  notifyChat: z.boolean().optional(),
  notifyCall: z.boolean().optional(),
  notifyDeal: z.boolean().optional(),
  notifyNews: z.boolean().optional(),
  soundEnabled: z.boolean().optional(),
  mobileNav: z.array(z.string()).optional(),
  timezone: z.string().nullable().optional(),
  // Телефон (только один). Указывается один раз: при совпадении с телефоном
  // контакта пользователь привязывается к нему. Сменить номер после привязки
  // может только администратор.
  phone: z.string().nullable().optional(),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(6),
});

router.get('/', async (req: any, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    include: { role: { select: { name: true, allowedPages: true } } },
  });
  if (!user) return res.status(404).json({ error: 'User not found' });
  const linkedContact = await getLinkedContact(user.id);
  res.json({
    id: user.id,
    email: user.email,
    username: user.username,
    name: user.name,
    avatar: user.avatar,
    emails: user.emails,
    phone: user.phone,
    linkedContact,
    role: user.role?.name || 'user',
    allowedPages: user.role?.allowedPages || [],
    mobileNav: user.mobileNav || [],
    timezone: user.timezone ?? null,
    hideCompletedTasks: user.hideCompletedTasks,
    darkTheme: user.darkTheme,
    calendarTimelinePos: user.calendarTimelinePos || 'bottom',
    calendarTimelineSize: user.calendarTimelineSize ?? 420,
    calendarTheme: user.calendarTheme || 'classic',
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

    // Мобильная панель: только страницы, доступные пользователю по роли
    if (data.mobileNav !== undefined) {
      const allowed = req.user?.role === 'admin'
        ? MOBILE_NAV_PATHS
        : [...(req.user?.allowedPages || []), '/news', '/chat'];
      data.mobileNav = [...new Set(data.mobileNav.filter(p => allowed.includes(p) && MOBILE_NAV_PATHS.includes(p)))];
    }

    // Check username uniqueness if changing
    if (data.username !== undefined && data.username !== null) {
      const existing = await prisma.user.findFirst({
        where: { username: data.username, id: { not: req.user!.id } },
      });
      if (existing) return res.status(400).json({ error: 'Username already taken' });
    }

    // Телефон: пользователь может указать номер только один раз. Если номер уже
    // привязан — сменить его может только администратор (через /api/users/:id).
    if (data.phone !== undefined) {
      const me = await prisma.user.findUnique({ where: { id: req.user!.id }, select: { phone: true } });
      const newPhone = data.phone ? normalizePhone(data.phone) : null;
      if (me?.phone && newPhone !== me.phone) {
        return res.status(403).json({ error: 'Номер телефона уже привязан. Сменить номер может только администратор.' });
      }
      if (newPhone) {
        const phoneBusy = await prisma.user.findFirst({ where: { phone: newPhone, id: { not: req.user!.id } }, select: { id: true } });
        if (phoneBusy) return res.status(400).json({ error: 'Этот номер телефона уже указан у другого пользователя' });
      }
      if (newPhone) {
        // Привязка к контакту по совпадению номера (1:1). Если контакт занят
        // другим пользователем — не сохраняем номер и сообщаем об ошибке.
        try {
          await linkUserToContactByPhone(req.user!.id, newPhone);
        } catch (linkErr: any) {
          return res.status(400).json({ error: linkErr.message });
        }
      }
      data.phone = newPhone;
    }

    const user = await prisma.user.update({
      where: { id: req.user!.id },
      data,
      include: { role: { select: { name: true, allowedPages: true } } },
    });
    const linkedContact = await getLinkedContact(user.id);
    res.json({
      id: user.id,
      email: user.email,
      username: user.username,
      name: user.name,
      avatar: user.avatar,
      emails: user.emails,
      phone: user.phone,
      linkedContact,
      role: user.role?.name || 'user',
      allowedPages: user.role?.allowedPages || [],
      mobileNav: user.mobileNav || [],
    timezone: user.timezone ?? null,
      hideCompletedTasks: user.hideCompletedTasks,
      darkTheme: user.darkTheme,
      calendarTimelinePos: user.calendarTimelinePos || 'bottom',
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
