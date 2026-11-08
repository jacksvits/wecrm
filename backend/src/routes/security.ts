import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { platformPrisma } from '../lib/tenant.js';
import { requirePlatformAdmin } from './platform.js';

const router = Router();
const PAGE_SIZE = 50;

// Журнал доступен только главному администратору на основном домене.
router.get('/auth-events', authMiddleware, requirePlatformAdmin, async (req, res) => {
  try {
    const page = Math.max(1, Math.min(1_000_000, Number.parseInt(String(req.query.page || '1'), 10) || 1));
    const [total, items] = await Promise.all([
      (platformPrisma as any).authEvent.count(),
      (platformPrisma as any).authEvent.findMany({
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
      }),
    ]);
    res.json({
      items: items.map((row: any) => ({
        id: row.id,
        tenantSlug: row.tenantSlug,
        tenantName: row.tenantName,
        login: row.login,
        ipAddress: row.ipAddress,
        device: row.device,
        clientType: row.clientType,
        authMethod: row.authMethod,
        createdAt: row.createdAt,
      })),
      total,
      page,
      pageSize: PAGE_SIZE,
      totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
    });
  } catch (err: any) {
    console.error('[security] auth-events:', err?.message || err);
    res.status(500).json({ error: 'Не удалось загрузить журнал авторизаций' });
  }
});

export default router;
