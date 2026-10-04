import { Router } from 'express';
import httpProxy from 'http-proxy';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';
import { authMiddleware } from '../middleware/auth.js';

// === VNC-браузер (по сессии на пользователя) ===
// Страница «Браузер» может работать в режиме VNC: для каждого пользователя CRM
// бэкенд поднимает отдельный контейнер wecrm-vnc:latest (настоящий Chromium на
// виртуальном дисплее + noVNC) и проксирует к нему HTTP и WebSocket трафик.
// Это обходит анти-бот защиты сайтов (Google и т.п.): для них это реальный
// браузер с реальным JS, а не проксированный HTML.
//
// Управление контейнерами — через docker-сокет (смонтирован в backend):
//   POST   /session          — создать/получить сессию текущего пользователя
//   DELETE /session          — остановить контейнер (профиль Chromium на диске
//                              сохраняется, сессии сайтов не теряются)
//   ANY    /:uid/<путь>      — прокси к noVNC (только своя сессия: uid === user.id)
// WebSocket-апгрейд обрабатывается в index.ts через handleVncUpgrade().

const router = Router();

import Docker from 'dockerode';

const docker = new Docker({ socketPath: '/var/run/docker.sock' });

const IMAGE = process.env.VNC_IMAGE || 'wecrm-vnc:latest';
const NETWORK = process.env.VNC_NETWORK || 'wecrm_default';
const DATA_BASE = process.env.VNC_DATA_BASE || '/home/crm/wecrm/vnc-data';
const START_URL = process.env.VNC_START_URL || 'https://google.com';
const SESSION_LIMIT = Number(process.env.VNC_SESSION_LIMIT || 10);
const READY_TIMEOUT = 120_000;

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

interface VncSession { id: string; ip: string }
const sessions = new Map<string, VncSession>(); // userId -> {containerId, ip}

const proxy = httpProxy.createProxyServer({ ws: true, changeOrigin: true, xfwd: false });
proxy.on('error', (err: any, _req: any, res: any) => {
  console.error('[VNC] Ошибка прокси:', err.message);
  if (res && !res.headersSent) res.status(502).json({ error: 'VNC-сессия недоступна' });
  else if (res && res.end) res.end();
});

function containerName(uid: string): string {
  return `wecrm-vnc-${uid.slice(0, 12)}`;
}

// Восстановление карты сессий при старте бэкенда: контейнеры живут со
// restart-policy unless-stopped, поэтому просто подхватываем их IP.
async function restoreSessions() {
  try {
    const list = await docker.listContainers({ all: false });
    for (const c of list) {
      const uid = c.Labels?.['wecrm-vnc-user'];
      if (!uid) continue;
      const net = c.NetworkSettings?.Networks?.[NETWORK];
      if (net?.IPAddress) sessions.set(uid, { id: c.Id, ip: net.IPAddress });
    }
    if (sessions.size) console.log(`[VNC] Восстановлено сессий: ${sessions.size}`);
  } catch (e: any) {
    console.error('[VNC] Не удалось восстановить сессии:', e.message);
  }
}

async function waitReady(container: any): Promise<string> {
  const deadline = Date.now() + READY_TIMEOUT;
  while (Date.now() < deadline) {
    const info = await container.inspect();
    if (!info.State.Running) throw new Error('Контейнер VNC-сессии остановился при запуске');
    const ip = info.NetworkSettings?.Networks?.[NETWORK]?.IPAddress;
    if (ip) {
      try {
        const res = await fetch(`http://${ip}:6080/vnc.html`, { signal: AbortSignal.timeout(3000) });
        if (res.ok) return ip;
      } catch { /* ещё поднимается */ }
    }
    await new Promise(r => setTimeout(r, 2000));
  }
  throw new Error('VNC-сессия не поднялась за отведённое время');
}

async function ensureSession(uid: string): Promise<VncSession> {
  const existing = sessions.get(uid);
  if (existing) {
    try {
      const c = docker.getContainer(existing.id);
      const info = await c.inspect();
      const ip = info.NetworkSettings?.Networks?.[NETWORK]?.IPAddress;
      if (info.State.Running && ip) return { id: existing.id, ip };
    } catch { /* контейнер исчез — пересоздаём */ }
    sessions.delete(uid);
  }

  if (sessions.size >= SESSION_LIMIT) {
    throw new Error(`Достигнут лимит VNC-сессий (${SESSION_LIMIT}). Освободите чужие сессии или увеличьте VNC_SESSION_LIMIT.`);
  }

  // Убедимся, что образ собран
  try {
    await docker.getImage(IMAGE).inspect();
  } catch {
    throw new Error(`Образ ${IMAGE} не найден — соберите: docker compose --profile manual build vnc-session`);
  }

  const dataDir = path.join(DATA_BASE, uid);
  fs.mkdirSync(dataDir, { recursive: true });

  const container = await docker.createContainer({
    Image: IMAGE,
    name: containerName(uid),
    Labels: { 'wecrm-vnc-user': uid },
    Env: [`START_URL=${START_URL}`],
    HostConfig: {
      Memory: 1_073_741_824, // 1 ГБ на сессию
      NanoCpus: 1_000_000_000, // 1 CPU
      RestartPolicy: { Name: 'unless-stopped' },
      Binds: [`${dataDir}:/data`],
    },
    NetworkingConfig: { EndpointsConfig: { [NETWORK]: {} } },
  });
  await container.start();
  const ip = await waitReady(container);
  const sess = { id: container.id, ip };
  sessions.set(uid, sess);
  console.log(`[VNC] Сессия создана: ${containerName(uid)} @ ${ip}`);
  return sess;
}

async function stopSession(uid: string) {
  const sess = sessions.get(uid);
  if (!sess) return;
  sessions.delete(uid);
  try {
    const c = docker.getContainer(sess.id);
    await c.stop({ t: 5 });
    await c.remove();
  } catch { /* уже остановлен/удалён */ }
}

// Проверка JWT из query (?token=) — для WebSocket-апгрейда (заголовки/cookie
// в upgrade-запросе тоже бывают, но query — надёжный вариант для noVNC)
export function vncUidFromToken(url: string): string | null {
  try {
    const q = new URL(url, 'http://localhost').searchParams.get('token');
    if (!q) return null;
    const decoded = jwt.verify(q, JWT_SECRET) as any;
    return decoded?.id || null;
  } catch {
    return null;
  }
}

// WebSocket-апгрейд для /api/browser/vnc/<uid>/websockify — вызывается из
// server.on('upgrade') в index.ts (перед этим url проверяется startsWith)
export function handleVncUpgrade(req: any, socket: any, head: any) {
  (async () => {
    try {
      const m = String(req.url || '').match(/^\/api\/browser\/vnc\/([^/]+)\//);
      const uid = m?.[1];
      if (!uid) { socket.destroy(); return; }
      const tokenUid = vncUidFromToken(req.url) || readCookieUid(req);
      if (tokenUid !== uid) { socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n'); socket.destroy(); return; }
      const sess = sessions.get(uid);
      if (!sess) { socket.write('HTTP/1.1 404 Not Found\r\n\r\n'); socket.destroy(); return; }
      req.url = '/websockify';
      proxy.ws(req, socket, head, { target: `http://${sess.ip}:6080` });
    } catch (e) {
      console.error('[VNC] Ошибка upgrade:', e);
      socket.destroy();
    }
  })();
}

export function isVncUpgradePath(url: string): boolean {
  return url.startsWith('/api/browser/vnc/');
}

// uid из jar/auth-cookie (iframe-страницы noVNC ходят с cookie автоматически)
function readCookieUid(req: any): string | null {
  const raw = req.headers.cookie;
  if (!raw) return null;
  for (const part of raw.split(';')) {
    const idx = part.indexOf('=');
    if (idx === -1) continue;
    if (part.slice(0, idx).trim() === 'wecrm_browser') {
      try {
        const decoded = jwt.verify(decodeURIComponent(part.slice(idx + 1).trim()), JWT_SECRET) as any;
        return decoded?.id || null;
      } catch { return null; }
    }
  }
  return null;
}

// Авторизация прокси-маршрутов: свой uid + сессия существует
async function vncProxyAuth(req: any, res: any, next: any) {
  const uid = req.params.uid;
  if (req.user?.id !== uid) {
    return res.status(403).json({ error: 'Доступ только к собственной VNC-сессии' });
  }
  if (!sessions.has(uid)) {
    return res.status(404).json({ error: 'VNC-сессия не создана. Откройте страницу «Браузер» заново.' });
  }
  next();
}

// Создать/получить сессию
router.post('/session', authMiddleware, async (req: any, res) => {
  try {
    const uid = req.user.id as string;
    await ensureSession(uid);
    res.json({ ok: true, uid });
  } catch (e: any) {
    console.error('[VNC] Ошибка создания сессии:', e.message);
    res.status(500).json({ error: e.message || 'Ошибка создания VNC-сессии' });
  }
});

// Остановить сессию (контейнер удаляется, профиль Chromium сохраняется)
router.delete('/session', authMiddleware, async (req: any, res) => {
  await stopSession(req.user.id);
  res.json({ ok: true });
});

// Прокси noVNC (HTTP): /api/browser/vnc/<uid>/vnc.html, /app/..., и т.д.
router.all('/:uid/*', authMiddleware, vncProxyAuth, (req: any, res) => {
  const uid = req.params.uid as string;
  const sess = sessions.get(uid)!;
  // Отрезаем префикс /api/browser/vnc/<uid> — контейнер ждёт пути noVNC
  const rest = String(req.url).replace(/^\/[^/]+/, '') || '/'; // req.url уже без префикса монтирования
  req.url = rest;
  proxy.web(req, res, { target: `http://${sess.ip}:6080` });
});

restoreSessions();

export default router;
