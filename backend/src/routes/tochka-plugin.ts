import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import { getTochkaState, loadTokens, setTochkaCacheTtl, invalidateTochkaCache } from './tochka.js';

const router = Router();

// GET /api/tochka-plugin — состояние плагина «Точка Банк»: подключение, счета, балансы, интервал обновления
router.get('/', authMiddleware, async (_req, res) => {
  try {
    const settings = await prisma.tochkaPluginSettings.findUnique({ where: { id: 1 } });
    const interval = settings?.updateIntervalMinutes ?? 15;
    setTochkaCacheTtl(interval);
    const tokens = loadTokens();
    const state = await getTochkaState();
    res.json({
      isActive: state.connected === true,
      connected: state.connected,
      expiresAt: state.expires_at || tokens?.expires_at || null,
      accounts: state.accounts || [],
      totalBalance: state.totalBalance || 0,
      updateIntervalMinutes: interval,
      cachedAt: (state as any).__cachedAt || null,
      error: (state as any).error || null,
    });
  } catch (err: any) {
    console.error('[tochka-plugin] GET error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/tochka-plugin — интервал обновления данных (только админ)
router.post('/', authMiddleware, async (req: AuthRequest, res) => {
  try {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Только администратор' });
    }
    const { updateIntervalMinutes } = req.body || {};
    const interval = Number(updateIntervalMinutes);
    if (!Number.isInteger(interval) || interval < 1 || interval > 24 * 60) {
      return res.status(400).json({ error: 'Интервал должен быть целым числом минут от 1 до 1440' });
    }
    await prisma.tochkaPluginSettings.upsert({
      where: { id: 1 },
      create: { id: 1, updateIntervalMinutes: interval },
      update: { updateIntervalMinutes: interval, updatedAt: new Date() },
    });
    setTochkaCacheTtl(interval);
    invalidateTochkaCache(); // применить новый интервал сразу
    res.json({ updateIntervalMinutes: interval });
  } catch (err: any) {
    console.error('[tochka-plugin] POST error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

export default router;
