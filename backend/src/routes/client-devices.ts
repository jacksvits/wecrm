import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';

/**
 * Устройства клиентов (Windows-агент) — чтение/редактирование/удаление
 * из интерфейса CRM. Создание записей — только через /api/agent/*.
 */
const router = Router();
router.use(authMiddleware);

const isAdmin = (req: AuthRequest) => req.user?.role === 'admin';
const isManagerOrAdmin = (req: AuthRequest) => req.user?.role === 'admin' || req.user?.role === 'manager';

const ONLINE_THRESHOLD_MS = 5 * 60 * 1000;

function withOnline(d: any) {
  return { ...d, isOnline: d.lastSeenAt && (Date.now() - new Date(d.lastSeenAt).getTime()) < ONLINE_THRESHOLD_MS };
}

router.get('/', async (req: AuthRequest, res) => {
  try {
    const contactId = req.query.contactId as string | undefined;
    if (!contactId) return res.status(400).json({ error: 'Необходим contactId' });
    const devices = await (prisma as any).clientDevice.findMany({
      where: { contactId },
      orderBy: { hostname: 'asc' },
    });
    res.json(devices.map(withOnline));
  } catch (e: any) {
    console.error('[client-devices] list error:', e.message);
    res.status(500).json({ error: 'Ошибка загрузки устройств' });
  }
});

const updateSchema = z.object({
  comment: z.string().max(20000).optional(),
});

router.patch('/:id', async (req: AuthRequest, res) => {
  try {
    if (!isManagerOrAdmin(req)) return res.status(403).json({ error: 'Недостаточно прав' });
    const parsed = updateSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Некорректные данные' });
    const device = await (prisma as any).clientDevice.update({
      where: { id: req.params.id },
      data: parsed.data,
    });
    res.json(withOnline(device));
  } catch (e: any) {
    console.error('[client-devices] update error:', e.message);
    res.status(500).json({ error: 'Ошибка обновления устройства' });
  }
});

router.delete('/:id', async (req: AuthRequest, res) => {
  try {
    if (!isAdmin(req)) return res.status(403).json({ error: 'Недостаточно прав' });
    await (prisma as any).clientDevice.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch (e: any) {
    console.error('[client-devices] delete error:', e.message);
    res.status(500).json({ error: 'Ошибка удаления устройства' });
  }
});

export default router;
