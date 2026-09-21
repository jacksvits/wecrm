import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import sharp from 'sharp';
import { prisma } from '../lib/prisma.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';

const router = Router();

const BRANDING_DIR = '/app/uploads/branding';

if (!fs.existsSync(BRANDING_DIR)) {
  fs.mkdirSync(BRANDING_DIR, { recursive: true });
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Допустимы только изображения'));
    }
    cb(null, true);
  },
});

const isAdmin = (req: AuthRequest) => req.user?.role === 'admin';

// Возвращает URL файла брендинга с версией для сброса кэша
function fileUrl(fileName: string, updatedAt: Date): string {
  return `/uploads/branding/${fileName}?v=${updatedAt.getTime()}`;
}

// GET /api/branding — публичный: текущие иконка и логотип (null — используются дефолтные)
router.get('/', async (_req, res) => {
  try {
    const branding = await prisma.branding.findUnique({ where: { id: 1 } });
    res.json({
      iconUrl: branding?.iconPath ? fileUrl('icon-192x192.png', branding.updatedAt) : null,
      iconUrl512: branding?.iconPath ? fileUrl('icon-512x512.png', branding.updatedAt) : null,
      appleTouchIconUrl: branding?.iconPath ? fileUrl('apple-touch-icon.png', branding.updatedAt) : null,
      logoUrl: branding?.logoPath ? fileUrl('logo.png', branding.updatedAt) : null,
      darkLogoUrl: branding?.darkLogoPath ? fileUrl('logo-dark.png', branding.updatedAt) : null,
      accentColor: branding?.accentColor || null,
      // Тема оформления проекта (null — классическая)
      defaultTheme: branding?.defaultTheme || null,
      // Обложка новостей по умолчанию: кастомная (с версией для сброса кэша) или внешний URL
      newsCoverUrl: branding?.newsCoverPath
        ? (branding.newsCoverPath.startsWith('/uploads/branding/')
            ? fileUrl('news-cover.jpg', branding.updatedAt)
            : branding.newsCoverPath)
        : null,
      // Заставка при запуске: опция показа и кастомное видео (null — дефолт /splash.mp4)
      splashEnabled: branding?.splashEnabled ?? true,
      splashUrl: branding?.splashPath
        ? (branding.splashPath.startsWith('/uploads/branding/')
            ? fileUrl('splash.mp4', branding.updatedAt)
            : branding.splashPath)
        : null,
      updatedAt: branding?.updatedAt || null,
    });
  } catch (err: any) {
    console.error('[branding] GET error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/branding/icon — загрузка иконки приложения (PWA, favicon, уведомления)
router.post('/icon', authMiddleware, upload.single('file'), async (req: AuthRequest, res) => {
  try {
    if (!isAdmin(req)) {
      return res.status(403).json({ error: 'Только администратор' });
    }
    if (!req.file) {
      return res.status(400).json({ error: 'Файл не загружен' });
    }

    const img = sharp(req.file.buffer);
    const meta = await img.metadata();

    // Исходное изображение — сохраняем квадратной подложкой (для maskable/any)
    const base = sharp(req.file.buffer)
      .resize(512, 512, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } });

    await Promise.all([
      base.clone().resize(192, 192).png().toFile(path.join(BRANDING_DIR, 'icon-192x192.png')),
      base.clone().resize(512, 512).png().toFile(path.join(BRANDING_DIR, 'icon-512x512.png')),
      base.clone().resize(180, 180).png().toFile(path.join(BRANDING_DIR, 'apple-touch-icon.png')),
      sharp(req.file.buffer).png().toFile(path.join(BRANDING_DIR, 'icon.png')),
    ]);

    const branding = await prisma.branding.upsert({
      where: { id: 1 },
      create: { id: 1, iconPath: '/uploads/branding/icon.png', updatedAt: new Date() },
      update: { iconPath: '/uploads/branding/icon.png', updatedAt: new Date() },
    });

    console.log(`[branding] icon updated: ${meta.width}x${meta.height}, ${req.file.size} bytes`);
    res.json({
      iconUrl: fileUrl('icon-192x192.png', branding.updatedAt),
      iconUrl512: fileUrl('icon-512x512.png', branding.updatedAt),
      appleTouchIconUrl: fileUrl('apple-touch-icon.png', branding.updatedAt),
    });
  } catch (err: any) {
    console.error('[branding] icon upload error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/branding/logo — загрузка логотипа компании (авторизация, интерфейс)
router.post('/logo', authMiddleware, upload.single('file'), async (req: AuthRequest, res) => {
  try {
    if (!isAdmin(req)) {
      return res.status(403).json({ error: 'Только администратор' });
    }
    if (!req.file) {
      return res.status(400).json({ error: 'Файл не загружен' });
    }

    // Логотип ограничиваем по ширине 1024px, формат сохраняем с прозрачностью
    await sharp(req.file.buffer)
      .resize(1024, 1024, { fit: 'inside', withoutEnlargement: true })
      .png()
      .toFile(path.join(BRANDING_DIR, 'logo.png'));

    const branding = await prisma.branding.upsert({
      where: { id: 1 },
      create: { id: 1, logoPath: '/uploads/branding/logo.png', updatedAt: new Date() },
      update: { logoPath: '/uploads/branding/logo.png', updatedAt: new Date() },
    });

    console.log(`[branding] logo updated: ${req.file.size} bytes`);
    res.json({ logoUrl: fileUrl('logo.png', branding.updatedAt) });
  } catch (err: any) {
    console.error('[branding] logo upload error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/branding/dark-logo — загрузка логотипа для тёмной темы
router.post('/dark-logo', authMiddleware, upload.single('file'), async (req: AuthRequest, res) => {
  try {
    if (!isAdmin(req)) {
      return res.status(403).json({ error: 'Только администратор' });
    }
    if (!req.file) {
      return res.status(400).json({ error: 'Файл не загружен' });
    }

    // Логотип ограничиваем по ширине 1024px, формат сохраняем с прозрачностью
    await sharp(req.file.buffer)
      .resize(1024, 1024, { fit: 'inside', withoutEnlargement: true })
      .png()
      .toFile(path.join(BRANDING_DIR, 'logo-dark.png'));

    const branding = await prisma.branding.upsert({
      where: { id: 1 },
      create: { id: 1, darkLogoPath: '/uploads/branding/logo-dark.png', updatedAt: new Date() },
      update: { darkLogoPath: '/uploads/branding/logo-dark.png', updatedAt: new Date() },
    });

    console.log(`[branding] dark logo updated: ${req.file.size} bytes`);
    res.json({ darkLogoUrl: fileUrl('logo-dark.png', branding.updatedAt) });
  } catch (err: any) {
    console.error('[branding] dark logo upload error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/branding/theme — тема оформления проекта (null — классическая)
const ALLOWED_THEMES = ['classic', 'ocean', 'forest', 'violet', 'sunset', 'graphite', 'liquid-glass'];
router.post('/theme', authMiddleware, async (req: AuthRequest, res) => {
  try {
    if (!isAdmin(req)) {
      return res.status(403).json({ error: 'Только администратор' });
    }
    const theme = req.body?.theme ?? null;
    const value = theme && ALLOWED_THEMES.includes(String(theme)) ? String(theme) : null;

    const branding = await prisma.branding.upsert({
      where: { id: 1 },
      create: { id: 1, defaultTheme: value, updatedAt: new Date() },
      update: { defaultTheme: value, updatedAt: new Date() },
    });

    console.log(`[branding] theme updated: ${value || 'classic'}`);
    res.json({ defaultTheme: branding.defaultTheme });
  } catch (err: any) {
    console.error('[branding] theme error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/branding/accent-color — кастомный цвет акцента проекта (null — сброс к дефолту)
router.post('/accent-color', authMiddleware, async (req: AuthRequest, res) => {
  try {
    if (!isAdmin(req)) {
      return res.status(403).json({ error: 'Только администратор' });
    }
    const color = req.body?.color ?? null;
    if (color !== null && !/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(String(color))) {
      return res.status(400).json({ error: 'Цвет должен быть в формате HEX, например #007AFF' });
    }

    const branding = await prisma.branding.upsert({
      where: { id: 1 },
      create: { id: 1, accentColor: color, updatedAt: new Date() },
      update: { accentColor: color, updatedAt: new Date() },
    });

    console.log(`[branding] accent color updated: ${color || 'default'}`);
    res.json({ accentColor: branding.accentColor });
  } catch (err: any) {
    console.error('[branding] accent color error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Загрузка видео-заставки: больше лимит и только видео (отдельный multer-инстанс)
const videoUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith('video/')) {
      return cb(new Error('Допустимы только видеофайлы'));
    }
    cb(null, true);
  },
});

// POST /api/branding/splash — загрузка своего видео заставки (по умолчанию — /splash.mp4)
router.post('/splash', authMiddleware, videoUpload.single('file'), async (req: AuthRequest, res) => {
  try {
    if (!isAdmin(req)) {
      return res.status(403).json({ error: 'Только администратор' });
    }
    if (!req.file) {
      return res.status(400).json({ error: 'Файл не загружен' });
    }

    await fs.promises.writeFile(path.join(BRANDING_DIR, 'splash.mp4'), req.file.buffer);

    const branding = await prisma.branding.upsert({
      where: { id: 1 },
      create: { id: 1, splashPath: '/uploads/branding/splash.mp4', updatedAt: new Date() },
      update: { splashPath: '/uploads/branding/splash.mp4', updatedAt: new Date() },
    });

    console.log(`[branding] splash video updated: ${req.file.size} bytes`);
    res.json({ splashUrl: fileUrl('splash.mp4', branding.updatedAt) });
  } catch (err: any) {
    console.error('[branding] splash upload error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/branding/splash/enabled — вкл/выкл показа заставки при запуске
router.post('/splash/enabled', authMiddleware, async (req: AuthRequest, res) => {
  try {
    if (!isAdmin(req)) {
      return res.status(403).json({ error: 'Только администратор' });
    }
    const enabled = !!req.body?.enabled;

    const branding = await prisma.branding.upsert({
      where: { id: 1 },
      create: { id: 1, splashEnabled: enabled, updatedAt: new Date() },
      update: { splashEnabled: enabled, updatedAt: new Date() },
    });

    console.log(`[branding] splash enabled: ${enabled}`);
    res.json({ splashEnabled: branding.splashEnabled });
  } catch (err: any) {
    console.error('[branding] splash enabled error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/branding/splash — сброс заставки к видео по умолчанию (/splash.mp4)
router.delete('/splash', authMiddleware, async (req: AuthRequest, res) => {
  try {
    if (!isAdmin(req)) {
      return res.status(403).json({ error: 'Только администратор' });
    }

    await fs.promises.rm(path.join(BRANDING_DIR, 'splash.mp4'), { force: true });

    const branding = await prisma.branding.upsert({
      where: { id: 1 },
      create: { id: 1, splashPath: null, updatedAt: new Date() },
      update: { splashPath: null, updatedAt: new Date() },
    });

    console.log('[branding] splash reset to default');
    res.json({ splashUrl: null, updatedAt: branding.updatedAt });
  } catch (err: any) {
    console.error('[branding] splash reset error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

export default router;
