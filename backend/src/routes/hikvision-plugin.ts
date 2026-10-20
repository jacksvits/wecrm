import { Router } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import { prisma } from '../lib/prisma.js';

const router = Router();

// Плагин «Камеры Hik-Connect»: облачные камеры аккаунта Hik-Connect.
// Страница камер и все эндпоинты — только для администраторов и только
// при включённом плагине (is_active). Работа с облаком делегирована
// Python-сервису hikvision-stream (библиотека hikcloudstream, VTM relay) —
// бэкенд лишь проксирует запросы с учётными данными из настроек.

const HIK_SERVICE = (process.env.HIKVISION_SERVICE_URL || 'http://hikvision:8557').replace(/\/$/, '');

function requireAdmin(req: AuthRequest, res: any): boolean {
  if (req.user?.role !== 'admin') {
    res.status(403).json({ error: 'Только администратор' });
    return false;
  }
  return true;
}

async function getSettings() {
  return prisma.hikvisionPluginSettings.findUnique({ where: { id: 1 } });
}

// GET /api/hikvision-plugin/status — { isActive } для меню (любой авторизованный;
// утечки нет: видимость пункта меню всё равно ограничена админом на фронте)
router.get('/status', authMiddleware, async (_req, res) => {
  try {
    const s = await getSettings();
    res.json({ isActive: s?.isActive === true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/hikvision-plugin/settings — настройки (пароль маскируем)
router.get('/settings', authMiddleware, async (req: AuthRequest, res) => {
  try {
    if (!requireAdmin(req, res)) return;
    const s = await getSettings();
    res.json({ ...s, password: s?.password ? '••••••' : '' });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// PUT /api/hikvision-plugin/settings — сохранить настройки
// (пустой пароль или «••••••» = не менять)
router.put('/settings', authMiddleware, async (req: AuthRequest, res) => {
  try {
    if (!requireAdmin(req, res)) return;
    const { login, password, apiBaseUrl, isActive } = req.body;
    const s = await prisma.hikvisionPluginSettings.upsert({
      where: { id: 1 },
      create: {
        login: login || '',
        password: password || '',
        apiBaseUrl: apiBaseUrl || 'https://api.hik-connect.com',
        isActive: !!isActive,
      },
      update: {
        ...(login !== undefined && { login }),
        ...(password && password !== '••••••' && { password }),
        ...(apiBaseUrl !== undefined && { apiBaseUrl: apiBaseUrl || 'https://api.hik-connect.com' }),
        ...(isActive !== undefined && { isActive: !!isActive }),
      },
    });
    res.json({ ...s, password: s.password ? '••••••' : '' });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/hikvision-plugin/test — проверка учётных данных (вход в облако)
router.post('/test', authMiddleware, async (req: AuthRequest, res) => {
  try {
    if (!requireAdmin(req, res)) return;
    const s = await getSettings();
    if (!s?.login || !s.password) return res.status(400).json({ ok: false, error: 'Задайте логин и пароль' });
    const resp = await fetch(`${HIK_SERVICE}/cameras`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ login: s.login, password: s.password, apiBaseUrl: s.apiBaseUrl }),
      signal: AbortSignal.timeout(30_000),
    });
    const data: any = await resp.json().catch(() => ({}));
    if (!resp.ok) return res.status(400).json({ ok: false, error: data.error || `HTTP ${resp.status}` });
    res.json({ ok: true, count: Array.isArray(data) ? data.length : 0 });
  } catch (e: any) {
    res.status(502).json({ ok: false, error: e.message });
  }
});

// GET /api/hikvision-plugin/cameras — список камер (быстро, без снапшотов:
// облачный capture идёт 20–30+ с на камеру, превью подгружаются отдельно)
router.get('/cameras', authMiddleware, async (req: AuthRequest, res) => {
  try {
    if (!requireAdmin(req, res)) return;
    const s = await getSettings();
    if (!s?.isActive) return res.status(503).json({ error: 'Плагин выключен' });
    const resp = await fetch(`${HIK_SERVICE}/cameras`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ login: s.login, password: s.password, apiBaseUrl: s.apiBaseUrl }),
      signal: AbortSignal.timeout(60_000),
    });
    const data: any = await resp.json().catch(() => ({}));
    if (!resp.ok) return res.status(502).json({ error: data.error || `HTTP ${resp.status}` });
    res.json(data);
  } catch (e: any) {
    res.status(502).json({ error: e.message });
  }
});

// GET /api/hikvision-plugin/snapshot/:index — JPEG-снапшот одной камеры
router.get('/snapshot/:index', authMiddleware, async (req: AuthRequest, res) => {
  try {
    if (!requireAdmin(req, res)) return;
    const s = await getSettings();
    if (!s?.isActive) return res.status(503).json({ error: 'Плагин выключен' });
    const index = encodeURIComponent(req.params.index);
    const url = `${HIK_SERVICE}/snapshot/${index}?login=${encodeURIComponent(s.login)}&password=${encodeURIComponent(s.password)}&api=${encodeURIComponent(s.apiBaseUrl)}`;
    const upstream = await fetch(url, { signal: AbortSignal.timeout(90_000) });
    if (!upstream.ok || !upstream.body) {
      const text = await upstream.text().catch(() => '');
      return res.status(502).json({ error: text || `Сервис камер вернул HTTP ${upstream.status}` });
    }
    res.setHeader('Content-Type', upstream.headers.get('content-type') || 'image/jpeg');
    res.setHeader('Cache-Control', 'no-store');
    const { Readable } = await import('stream');
    Readable.fromWeb(upstream.body as any).pipe(res);
  } catch (e: any) {
    if (!res.headersSent) res.status(502).json({ error: e.message });
  }
});

// GET /api/hikvision-plugin/stream/:index — MJPEG-поток камеры (proxy от сервиса)
router.get('/stream/:index', authMiddleware, async (req: AuthRequest, res) => {
  try {
    if (!requireAdmin(req, res)) return;
    const s = await getSettings();
    if (!s?.isActive) return res.status(503).json({ error: 'Плагин выключен' });
    const index = encodeURIComponent(req.params.index);
    const streamType = req.query.streamType ? `&streamType=${encodeURIComponent(String(req.query.streamType))}` : '';
    const url = `${HIK_SERVICE}/mjpeg/${index}?login=${encodeURIComponent(s.login)}&password=${encodeURIComponent(s.password)}&api=${encodeURIComponent(s.apiBaseUrl)}${streamType}`;
    const upstream = await fetch(url, { signal: AbortSignal.timeout(15_000) });
    if (!upstream.ok || !upstream.body) {
      const text = await upstream.text().catch(() => '');
      return res.status(502).json({ error: text || `Сервис камер вернул HTTP ${upstream.status}` });
    }
    res.setHeader('Content-Type', upstream.headers.get('content-type') || 'multipart/x-mixed-replace; boundary=hikframe');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    const { Readable } = await import('stream');
    Readable.fromWeb(upstream.body as any).pipe(res);
    req.on('close', () => { try { res.end(); } catch {} });
  } catch (e: any) {
    if (!res.headersSent) res.status(502).json({ error: e.message });
  }
});

export default router;
