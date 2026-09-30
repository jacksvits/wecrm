import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';

const router = Router();
router.use(authMiddleware);

const isManagerOrAdmin = (req: AuthRequest) => req.user?.role === 'admin' || req.user?.role === 'manager';

// Направления доступа (выпадающий список на фронте)
const DIRECTIONS = ['videoregistrator', 'cloud', 'remote', 'site_admin', 'server', 'account', 'router'] as const;

const accessSchema = z.object({
  contactId: z.string().min(1),
  direction: z.enum(DIRECTIONS),
  description: z.string().optional().or(z.literal('')).or(z.literal(null)),
  comment: z.string().optional().or(z.literal('')).or(z.literal(null)),
  url: z.string().optional().or(z.literal('')).or(z.literal(null)),
  login: z.string().optional().or(z.literal('')).or(z.literal(null)),
  password: z.string().optional().or(z.literal('')).or(z.literal(null)),
});

const updateSchema = accessSchema.omit({ contactId: true }).partial();

// GET /api/contact-accesses?contactId=... — список доступов контакта
router.get('/', async (req, res) => {
  try {
    const { contactId } = req.query;
    if (!contactId || typeof contactId !== 'string') {
      return res.status(400).json({ error: 'contactId обязателен' });
    }
    const accesses = await prisma.contactAccess.findMany({
      where: { contactId },
      orderBy: { createdAt: 'desc' },
    });
    res.json(accesses);
  } catch (err: any) {
    console.error('[ContactAccesses GET] Error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/contact-accesses — создать доступ
router.post('/', async (req: AuthRequest, res) => {
  try {
    if (!isManagerOrAdmin(req)) {
      return res.status(403).json({ error: 'Нет прав на создание' });
    }
    const data = accessSchema.parse(req.body);
    const contact = await prisma.contact.findUnique({ where: { id: data.contactId }, select: { id: true } });
    if (!contact) {
      return res.status(404).json({ error: 'Контакт не найден' });
    }
    const access = await prisma.contactAccess.create({
      data: {
        contactId: data.contactId,
        direction: data.direction,
        description: data.description || null,
        comment: data.comment || null,
        url: data.url || null,
        login: data.login || null,
        password: data.password || null,
      },
    });
    res.status(201).json(access);
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: err.issues[0]?.message || 'Некорректные данные' });
    }
    console.error('[ContactAccesses POST] Error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/contact-accesses/:id — обновить доступ
router.patch('/:id', async (req: AuthRequest, res) => {
  try {
    if (!isManagerOrAdmin(req)) {
      return res.status(403).json({ error: 'Нет прав на редактирование' });
    }
    const data = updateSchema.parse(req.body);
    const existing = await prisma.contactAccess.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      return res.status(404).json({ error: 'Доступ не найден' });
    }
    const access = await prisma.contactAccess.update({
      where: { id: req.params.id },
      data: {
        ...(data.direction !== undefined ? { direction: data.direction } : {}),
        description: data.description !== undefined ? data.description || null : undefined,
        comment: data.comment !== undefined ? data.comment || null : undefined,
        url: data.url !== undefined ? data.url || null : undefined,
        login: data.login !== undefined ? data.login || null : undefined,
        password: data.password !== undefined ? data.password || null : undefined,
      },
    });
    res.json(access);
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: err.issues[0]?.message || 'Некорректные данные' });
    }
    console.error('[ContactAccesses PATCH] Error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/contact-accesses/:id — удалить доступ
router.delete('/:id', async (req: AuthRequest, res) => {
  try {
    if (!isManagerOrAdmin(req)) {
      return res.status(403).json({ error: 'Нет прав на удаление' });
    }
    const existing = await prisma.contactAccess.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      return res.status(404).json({ error: 'Доступ не найден' });
    }
    await prisma.contactAccess.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err: any) {
    console.error('[ContactAccesses DELETE] Error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

export default router;
