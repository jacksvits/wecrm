import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { runOneCSync } from '../lib/onec-sync.js';
import { OneCClient } from '../lib/onec.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';

const router = Router();

// GET /api/onec-plugin — настройки плагина (пароль не возвращается)
router.get('/', authMiddleware, async (_req, res) => {
  try {
    const s = await prisma.oneCPluginSettings.findUnique({ where: { id: 1 } });
    res.json({
      isActive: s?.isActive ?? false,
      serviceUrl: s?.serviceUrl ?? '',
      login: s?.login ?? '',
      hasPassword: !!s?.password,
      syncIntervalMinutes: s?.syncIntervalMinutes ?? 15,
      lastSyncAt: s?.lastSyncAt ?? null,
      lastSyncResult: s?.lastSyncResult ?? null,
    });
  } catch (err: any) {
    console.error('[onec-plugin] GET error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/onec-plugin — сохранение настроек (только админ; пустой пароль = не менять)
router.post('/', authMiddleware, async (req: AuthRequest, res) => {
  try {
    if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Только администратор' });
    const { isActive, serviceUrl, login, password, syncIntervalMinutes } = req.body || {};
    if (isActive !== undefined && typeof isActive !== 'boolean') {
      return res.status(400).json({ error: 'Некорректный флаг активности' });
    }
    if (serviceUrl !== undefined && typeof serviceUrl !== 'string') {
      return res.status(400).json({ error: 'Некорректная ссылка веб-версии 1С' });
    }
    const existing = await prisma.oneCPluginSettings.findUnique({ where: { id: 1 } });
    const data = {
      isActive: isActive !== undefined ? isActive : (existing?.isActive ?? false),
      serviceUrl: serviceUrl !== undefined ? serviceUrl.trim() : (existing?.serviceUrl ?? ''),
      login: login !== undefined ? login.trim() : (existing?.login ?? ''),
      password: password ? String(password) : (existing?.password ?? ''),
      syncIntervalMinutes: syncIntervalMinutes !== undefined
        ? Math.max(5, Math.min(1440, Number(syncIntervalMinutes) || 15))
        : (existing?.syncIntervalMinutes ?? 15),
      updatedAt: new Date(),
    };
    const saved = await prisma.oneCPluginSettings.upsert({
      where: { id: 1 },
      create: { id: 1, ...data },
      update: data,
    });
    res.json({
      isActive: saved.isActive,
      serviceUrl: saved.serviceUrl,
      login: saved.login,
      hasPassword: !!saved.password,
      syncIntervalMinutes: saved.syncIntervalMinutes,
      lastSyncAt: saved.lastSyncAt,
      lastSyncResult: saved.lastSyncResult,
    });
  } catch (err: any) {
    console.error('[onec-plugin] POST error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/onec-plugin/test — проверка соединения с 1С
router.post('/test', authMiddleware, async (req: AuthRequest, res) => {
  try {
    if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Только администратор' });
    const s = await prisma.oneCPluginSettings.findUnique({ where: { id: 1 } });
    const url = req.body?.serviceUrl ?? s?.serviceUrl ?? '';
    const login = req.body?.login ?? s?.login ?? '';
    const password = req.body?.password || s?.password || '';
    if (!url || !login || !password) {
      return res.status(400).json({ error: 'Заполните ссылку, логин и пароль' });
    }
    const ok = await new OneCClient(url, login, password).ping();
    res.json({ ok, message: ok ? 'Соединение с 1С установлено' : 'Не удалось подключиться к 1С' });
  } catch (err: any) {
    res.json({ ok: false, message: err.message });
  }
});

// POST /api/onec-plugin/sync — ручной запуск синхронизации
router.post('/sync', authMiddleware, async (req: AuthRequest, res) => {
  try {
    if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Только администратор' });
    const stats = await runOneCSync();
    res.json(stats);
  } catch (err: any) {
    console.error('[onec-plugin] sync error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

export default router;
