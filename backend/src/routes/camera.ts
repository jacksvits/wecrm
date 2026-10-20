import { Router } from 'express';
import { spawn } from 'child_process';
import { authMiddleware } from '../middleware/auth.js';
import { prisma } from '../lib/prisma.js';

const router = Router();

// GET /api/camera/settings — список всех камер
router.get('/settings', async (_req, res) => {
  try {
    const cameras = await prisma.cameraSettings.findMany({
      orderBy: { sortOrder: 'asc' }
    });
    // Ensure at least 2 default cameras exist
    if (cameras.length === 0) {
      await prisma.cameraSettings.create({
        data: { label: 'Видеокамера 1', ip: '192.168.8.10', port: 554, channel: '102', username: 'admin', password: 'W22665588e', isActive: true, sortOrder: 0 }
      });
      await prisma.cameraSettings.create({
        data: { label: 'Видеокамера 2', ip: '192.168.8.10', port: 554, channel: '101', username: 'admin', password: 'W22665588e', isActive: true, sortOrder: 1 }
      });
      const refreshed = await prisma.cameraSettings.findMany({ orderBy: { sortOrder: 'asc' } });
      res.json(refreshed);
      return;
    }
    res.json(cameras);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/camera/settings/:id — одна камера
router.get('/settings/:id', async (req, res) => {
  try {
    const camera = await prisma.cameraSettings.findUnique({ where: { id: req.params.id } });
    if (!camera) {
      res.status(404).json({ error: 'Camera not found' });
      return;
    }
    res.json(camera);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/camera/settings — создать новую камеру
router.post('/settings', authMiddleware, async (req, res) => {
  try {
    const { label, ip, port, channel, username, password, isActive, sortOrder } = req.body;
    const camera = await prisma.cameraSettings.create({
      data: {
        label: label || 'Видеокамера',
        ip: ip || '192.168.8.10',
        port: port || 554,
        channel: channel || '102',
        username: username || 'admin',
        password: password || 'W22665588e',
        isActive: isActive !== undefined ? isActive : true,
        sortOrder: sortOrder || 0,
      }
    });
    res.json(camera);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// PUT /api/camera/settings/:id — обновить камеру
router.put('/settings/:id', authMiddleware, async (req, res) => {
  try {
    const { label, ip, port, channel, username, password, isActive, sortOrder } = req.body;
    const camera = await prisma.cameraSettings.update({
      where: { id: req.params.id },
      data: {
        ...(label !== undefined && { label }),
        ...(ip !== undefined && { ip }),
        ...(port !== undefined && { port }),
        ...(channel !== undefined && { channel }),
        ...(username !== undefined && { username }),
        ...(password !== undefined && { password }),
        ...(isActive !== undefined && { isActive }),
        ...(sortOrder !== undefined && { sortOrder }),
      }
    });
    res.json(camera);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// DELETE /api/camera/settings/:id — удалить камеру
router.delete('/settings/:id', authMiddleware, async (req, res) => {
  try {
    await prisma.cameraSettings.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// --- Общий MJPEG-стрим на камеру -------------------------------------------------
// Один ffmpeg-транскод RTSP→MJPEG на всех клиентов камеры. Раньше каждый <img>
// спавнил свой ffmpeg: при нескольких зрителях и переподключениях (фронт
// пересоздаёт поток каждые 60 с) камера исчерпывала лимит RTSP-сессий и
// переставала отдавать видео. Watchdog перезапускает зависший транскод
// прозрачно для клиентов — кадры продолжают идти по уже открытым
// соединениям.
type CameraStreamState = {
  proc: import('child_process').ChildProcess | null;
  clients: Set<import('http').ServerResponse>;
  lastChunkAt: number;
  watchdog: NodeJS.Timeout | null;
  restartTimer: NodeJS.Timeout | null;
  stopping: boolean;
  rtspUrl: string | null;
};

const cameraStreams = new Map<string, CameraStreamState>();

// Нет кадров дольше 10 с — считаем транскод зависшим и перезапускаем
const CAMERA_STALL_TIMEOUT_MS = 10_000;
// Пауза перед перезапуском ffmpeg после обрыва/зависания
const CAMERA_RESTART_DELAY_MS = 3_000;

function killCameraProc(state: CameraStreamState) {
  if (state.proc && !state.proc.killed) {
    state.proc.kill('SIGKILL');
  }
  state.proc = null;
}

function stopCameraStream(id: string) {
  const state = cameraStreams.get(id);
  if (!state) return;
  state.stopping = true;
  if (state.watchdog) { clearInterval(state.watchdog); state.watchdog = null; }
  if (state.restartTimer) { clearTimeout(state.restartTimer); state.restartTimer = null; }
  killCameraProc(state);
  cameraStreams.delete(id);
}

function spawnCameraFfmpeg(id: string, rtspUrl: string, state: CameraStreamState) {
  // stimeout — таймаут RTSP-сокета: мёртвая камера падает быстро, а не висит
  const ffmpeg = spawn('ffmpeg', [
    '-rtsp_transport', 'tcp',
    '-stimeout', '10000000',
    '-i', rtspUrl,
    '-an',
    '-f', 'mpjpeg',
    '-q:v', '5',
    '-'
  ], {
    stdio: ['ignore', 'pipe', 'pipe'],
    detached: false,
  });

  state.proc = ffmpeg;
  state.lastChunkAt = Date.now();
  state.stopping = false;

  let started = false;
  ffmpeg.stdout.on('data', (chunk: Buffer) => {
    state.lastChunkAt = Date.now();
    if (!started) {
      started = true;
      console.log(`[Camera ${id}] ffmpeg stream started (${state.clients.size} client(s))`);
    }
    for (const client of state.clients) {
      try {
        if (!client.write(chunk)) {
          // Медленный клиент: снимаем его, чтобы не раздувать буфер
          state.clients.delete(client);
          try { client.end(); } catch {}
        }
      } catch {
        state.clients.delete(client);
      }
    }
  });

  ffmpeg.stderr.on('data', (data) => {
    const msg = data.toString().trim();
    if (msg.includes('error') || msg.includes('Error') || msg.includes('failed')) {
      console.error(`[Camera ${id}] ffmpeg:`, msg);
    }
  });

  ffmpeg.on('error', (err) => {
    console.error(`[Camera ${id}] ffmpeg spawn error:`, err.message);
  });

  ffmpeg.on('exit', (code) => {
    state.proc = null;
    if (state.stopping) return;
    if (code !== 0 && code !== null) {
      console.error(`[Camera ${id}] ffmpeg exited with code`, code, '- restart in', CAMERA_RESTART_DELAY_MS / 1000, 's');
    }
    scheduleCameraRestart(id, rtspUrl, state);
  });
}

function scheduleCameraRestart(id: string, rtspUrl: string, state: CameraStreamState) {
  if (state.stopping || state.restartTimer || state.proc) return;
  if (state.clients.size === 0) return;
  state.restartTimer = setTimeout(() => {
    state.restartTimer = null;
    if (state.stopping || state.proc || state.clients.size === 0) return;
    console.log(`[Camera ${id}] restarting ffmpeg stream`);
    spawnCameraFfmpeg(id, rtspUrl, state);
  }, CAMERA_RESTART_DELAY_MS);
  if (state.restartTimer.unref) state.restartTimer.unref();
}

function ensureCameraStream(id: string, rtspUrl: string): CameraStreamState {
  let state = cameraStreams.get(id);
  if (!state) {
    state = { proc: null, clients: new Set(), lastChunkAt: 0, watchdog: null, restartTimer: null, stopping: false, rtspUrl };
    cameraStreams.set(id, state);
  }
  state.rtspUrl = rtspUrl;
  if (!state.watchdog) {
    state.watchdog = setInterval(() => {
      if (state.clients.size === 0) {
        // Зрителей нет — освобождаем RTSP-сессию камеры
        stopCameraStream(id);
        return;
      }
      const stalled = state.proc !== null && Date.now() - state.lastChunkAt > CAMERA_STALL_TIMEOUT_MS;
      if (stalled) {
        console.error(`[Camera ${id}] no frames for ${CAMERA_STALL_TIMEOUT_MS / 1000}s - restarting ffmpeg`);
        killCameraProc(state);
        if (state.rtspUrl) scheduleCameraRestart(id, state.rtspUrl, state);
      } else if (!state.proc && state.rtspUrl) {
        scheduleCameraRestart(id, state.rtspUrl, state);
      }
    }, 5_000);
    if (state.watchdog.unref) state.watchdog.unref();
  }
  if (!state.proc && !state.restartTimer) {
    spawnCameraFfmpeg(id, rtspUrl, state);
  }
  return state;
}

// GET /api/camera/stream/:id - RTSP -> MJPEG via ffmpeg (общий поток для всех клиентов)
router.get('/stream/:id', async (req, res) => {
  try {
    const settings = await prisma.cameraSettings.findUnique({ where: { id: req.params.id } });
    if (!settings || !settings.isActive) {
      res.status(503).json({ error: 'Camera disabled or not configured' });
      return;
    }

    const rtspUrl = `rtsp://${settings.username}:${settings.password}@${settings.ip}:${settings.port}/Streaming/Channels/${settings.channel}`;

    res.setHeader('Content-Type', 'multipart/x-mixed-replace; boundary=ffmpeg');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    const state = ensureCameraStream(req.params.id, rtspUrl);
    state.clients.add(res);

    const dropClient = () => {
      if (!state.clients.has(res)) return;
      state.clients.delete(res);
      if (state.clients.size === 0) {
        // Последний зритель ушёл — закрываем RTSP-сессию
        stopCameraStream(req.params.id);
      }
    };
    req.on('close', dropClient);
    res.on('close', dropClient);
    res.on('error', dropClient);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
