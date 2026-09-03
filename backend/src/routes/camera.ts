import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { spawn } from 'child_process';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();
const prisma = new PrismaClient();

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

// GET /api/camera/stream/:id — RTSP → MJPEG via ffmpeg для конкретной камеры
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

    const ffmpeg = spawn('ffmpeg', [
      '-rtsp_transport', 'tcp',
      '-i', rtspUrl,
      '-f', 'mpjpeg',
      '-q:v', '5',
      '-'
    ], {
      stdio: ['ignore', 'pipe', 'pipe'],
      detached: false,
    });

    let started = false;
    ffmpeg.stdout.on('data', () => {
      if (!started) {
        started = true;
        console.log(`[Camera ${req.params.id}] ffmpeg stream started`);
      }
    });

    ffmpeg.stdout.pipe(res);

    ffmpeg.stderr.on('data', (data) => {
      const msg = data.toString().trim();
      if (msg.includes('error') || msg.includes('Error') || msg.includes('failed')) {
        console.error(`[Camera ${req.params.id}] ffmpeg:`, msg);
      }
    });

    ffmpeg.on('error', (err) => {
      console.error(`[Camera ${req.params.id}] ffmpeg spawn error:`, err.message);
      if (!res.headersSent) {
        res.status(502).json({ error: 'Camera unavailable', message: err.message });
      }
    });

    ffmpeg.on('exit', (code) => {
      if (code !== 0 && code !== null) {
        console.error(`[Camera ${req.params.id}] ffmpeg exited with code`, code);
      }
      if (!res.writableEnded) {
        res.end();
      }
    });

    req.on('close', () => {
      ffmpeg.kill('SIGKILL');
    });

    res.on('error', () => {
      ffmpeg.kill('SIGKILL');
    });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
