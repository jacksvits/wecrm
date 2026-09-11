import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { getTochkaState, loadTokens } from './tochka.js';

const router = Router();

// GET /api/tochka-plugin — состояние плагина «Точка Банк»: подключение, счета, балансы
router.get('/', authMiddleware, async (_req, res) => {
  try {
    const tokens = loadTokens();
    const state = await getTochkaState();
    res.json({
      isActive: state.connected === true,
      connected: state.connected,
      expiresAt: state.expires_at || tokens?.expires_at || null,
      accounts: state.accounts || [],
      totalBalance: state.totalBalance || 0,
      error: (state as any).error || null,
    });
  } catch (err: any) {
    console.error('[tochka-plugin] GET error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

export default router;
