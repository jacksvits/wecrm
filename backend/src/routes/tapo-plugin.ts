import { Router } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import { prisma } from '../lib/prisma.js';

const router = Router();

// Плагин «Камеры Tapo» (TP-Link): онлайн-просмотр облачных камер Tapo по
// логину/паролю аккаунта TP-Link ID. По аналогии с Hik-Connect: страница
// камер и эндпоинты — только для администраторов и при включённом плагине
// (is_active). Облако (вход, список устройств) и RTSP-потоки делегированы
// Python-сервису tapo-stream — бэкенд лишь проксирует запросы с учётными
// данными из настроек. Сервис работает в host-сети (ARP/RTSP в LAN), поэтому
// адрес — через host.docker.internal (extra_hosts в docker-compose).

const TAPO_SERVICE = (process.env.TAPO_SERVICE_URL || 'http://host.docker.internal:8558').replace(/\/$/, '');

function requireAdmin(req: AuthRequest, res: any): boolean {
  if (req.user?.role !== 'admin') {
    res.status(403).json({ error: 'Требуется роль администратора' });
    return false;
  }
  return true;
}

let settingsCache: { at: number; value: any } | null = null;

async function getSettings() {
  const now = Date.now();
  if (settingsCache && now - settingsCache.at < 10_000) return settingsCache.value;
  const value = await prisma.tapoPluginSettings.findFirst();
  settingsCache = { at: now, value };
  return value;
}

function invalidateSettings() {
  settingsCache = null;
}

// GET /api/tapo-plugin/status — для меню и страницы интеграций
router.get('/status', authMiddleware, async (_req, res) => {
  try {
    const s = await getSettings();
    res.json({ isActive: s?.isActive ?? false });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/tapo-plugin/settings
router.get('/settings', authMiddleware, async (req: AuthRequest, res) => {
  try {
    if (!requireAdmin(req, res)) return;
    const s = await getSettings();
    res.json(s || { id: 1, login: '', password: '', isActive: false, updatedAt: null });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// PUT /api/tapo-plugin/settings
router.put('/settings', authMiddleware, async (req: AuthRequest, res) => {
  try {
    if (!requireAdmin(req, res)) return;
    const { login, password, isActive } = req.body || {};
    const s = await prisma.tapoPluginSettings.upsert({
      where: { id: 1 },
      update: { login: login ?? '', password: password ?? '', isActive: !!isActive },
      create: { id: 1, login: login ?? '', password: password ?? '', isActive: !!isActive },
    });
    invalidateSettings();
    res.json(s);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/tapo-plugin/test — проверка учётных данных облака (список камер)
router.post('/test', authMiddleware, async (req: AuthRequest, res) => {
  try {
    if (!requireAdmin(req, res)) return;
    const body = req.body || {};
    const upstream = await fetch(`${TAPO_SERVICE}/cameras`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ login: body.login || '', password: body.password || '' }),
      signal: AbortSignal.timeout(45_000),
    });
    const data: any = await upstream.json().catch(() => ({}));
    if (!upstream.ok) {
      return res.status(502).json({ ok: false, error: data.error || `Сервис Tapo вернул HTTP ${upstream.status}` });
    }
    const devices = Number(upstream.headers.get('x-devices-total') || '0');
    const cameras = Array.isArray(data) ? data : [];
    const hint = devices > 0 && cameras.length === 0
      ? 'Устройства в аккаунте есть, но ни одно не найдено в LAN сервера: камеры должны быть в одной локальной сети с сервером wecrm, RTSP включён в приложении Tapo.'
      : '';
    return res.json({ ok: true, cameras, devices, hint });
  } catch (e: any) {
    return res.status(502).json({ ok: false, error: e.message });
  }
});

// GET /api/tapo-plugin/cameras — список камер по сохранённым учётным данным
router.get('/cameras', authMiddleware, async (req: AuthRequest, res) => {
  try {
    if (!requireAdmin(req, res)) return;
    const s = await getSettings();
    if (!s?.isActive) return res.status(503).json({ error: 'Плагин выключен' });
    if (!s.login || !s.password) return res.status(400).json({ error: 'Заполните логин и пароль TP-Link ID в настройках плагина' });
    const upstream = await fetch(`${TAPO_SERVICE}/cameras`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ login: s.login, password: s.password }),
      signal: AbortSignal.timeout(45_000),
    });
    const data: any = await upstream.json().catch(() => ({}));
    if (!upstream.ok) {
      return res.status(502).json({ error: data.error || `Сервис Tapo вернул HTTP ${upstream.status}` });
    }
    return res.json(data);
  } catch (e: any) {
    return res.status(502).json({ error: e.message });
  }
});

// GET /api/tapo-plugin/snapshot/:index — JPEG-превью камеры (proxy)
router.get('/snapshot/:index', authMiddleware, async (req: AuthRequest, res) => {
  try {
    if (!requireAdmin(req, res)) return;
    const s = await getSettings();
    if (!s?.isActive) return res.status(503).json({ error: 'Плагин выключен' });
    const index = encodeURIComponent(req.params.index);
    const upstream = await fetch(`${TAPO_SERVICE}/snapshot/${index}?login=${encodeURIComponent(s.login)}&password=${encodeURIComponent(s.password)}`, { signal: AbortSignal.timeout(30_000) });
    if (!upstream.ok || !upstream.body) {
      const text = await upstream.text().catch(() => '');
      if (!res.headersSent) return res.status(502).json({ error: text || `Сервис Tapo вернул HTTP ${upstream.status}` });
    }
    res.setHeader('Content-Type', upstream.headers.get('content-type') || 'image/jpeg');
    res.setHeader('Cache-Control', 'no-store');
    const { Readable } = await import('stream');
    const readable = Readable.fromWeb(upstream.body as any);
    readable.on('error', () => { try { res.end(); } catch {} });
    readable.pipe(res);
  } catch (e: any) {
    if (!res.headersSent) res.status(502).json({ error: e.message });
  }
});

// GET /api/tapo-plugin/stream/:index — H.264 fMP4-поток для MSE-плеера (proxy)
router.get('/stream/:index', authMiddleware, async (req: AuthRequest, res) => {
  try {
    if (!requireAdmin(req, res)) return;
    const s = await getSettings();
    if (!s?.isActive) return res.status(503).json({ error: 'Плагин выключен' });
    const index = encodeURIComponent(req.params.index);
    const streamType = req.query.streamType ? `&streamType=${encodeURIComponent(String(req.query.streamType))}` : '';
    const url = `${TAPO_SERVICE}/h264/${index}?login=${encodeURIComponent(s.login)}&password=${encodeURIComponent(s.password)}${streamType}`;
    // Таймаут только на старт (получение заголовков), как у Hik-Connect:
    // после старта соединение живёт, пока его не разорвёт клиент или камера.
    const controller = new AbortController();
    const startTimer = setTimeout(() => controller.abort(), 15_000);
    let upstream: Response;
    try {
      upstream = await fetch(url, { signal: controller.signal });
    } finally {
      clearTimeout(startTimer);
    }
    if (!upstream.ok || !upstream.body) {
      const text = await upstream.text().catch(() => '');
      if (!res.headersSent) return res.status(502).json({ error: text || `Сервис Tapo вернул HTTP ${upstream.status}` });
    }
    res.setHeader('Content-Type', 'video/mp4');
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Accel-Buffering', 'no');
    const { Readable } = await import('stream');
    const readable = Readable.fromWeb(upstream.body as any);
    readable.on('error', () => { try { res.end(); } catch {} });
    readable.pipe(res);
  } catch (e: any) {
    if (!res.headersSent) res.status(502).json({ error: e.message });
  }
});

export default router;
