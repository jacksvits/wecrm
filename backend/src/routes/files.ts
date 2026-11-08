import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { prisma } from '../lib/prisma.js';
import fs from 'fs';
import path from 'path';
import * as archiver from 'archiver';
import { uploadsRoot } from '../lib/tenant.js';

const router = Router();

// Map tab keys to local directories inside Docker container
const TAB_DIRS: Record<string, string> = {
  programs: '/app/files/programs',
  drivers: '/app/files/drivers',
  documents: '/app/files/documents',
  games: '/app/files/games',
};

// Вкладка «Система» — корень хранилища текущего tenant'а
// (main: /app/uploads, tenant: /app/tenants/<slug>); только для администраторов
const resolveTabDir = (tabKey: string): string | undefined =>
  tabKey === 'system' ? uploadsRoot() : TAB_DIRS[tabKey];

router.get('/tabs', authMiddleware, async (req, res) => {
  try {
    const tabs = await prisma.fileTabSetting.findMany();
    const defaults = [
      { tabKey: 'programs', label: 'Программы', url: '', path: '/mnt/nfs/SOFT' },
      { tabKey: 'drivers', label: 'Драйвера', url: '', path: '/mnt/nfs/DRIVER' },
      { tabKey: 'documents', label: 'Документы', url: '', path: '/mnt/nfs/BOOK' },
      { tabKey: 'games', label: 'Игры', url: '', path: '/mnt/nfs/GAME' },
    ];
    const merged = defaults.map(d => {
      const found = tabs.find(t => t.tabKey === d.tabKey);
      return { ...d, url: found?.url || '', path: found?.path || d.path, id: found?.id || null };
    });
    if ((req as any).user?.role === 'admin') {
      merged.unshift({ tabKey: 'system', label: 'Система', url: '', path: uploadsRoot(), id: null });
    }
    res.json(merged);
  } catch (e: any) {
    console.error('[Files/Tabs] Error loading tabs:', e?.message || e);
    res.status(500).json({ error: 'Ошибка загрузки настроек', detail: e?.message });
  }
});

router.post('/tabs/:tabKey', authMiddleware, async (req, res) => {
  const { tabKey } = req.params;
  const { url, path: tabPath } = req.body;
  const allowed = ['programs', 'drivers', 'documents', 'games'];
  if (!allowed.includes(tabKey)) {
    return res.status(400).json({ error: 'Неверная вкладка' });
  }
  try {
    const setting = await prisma.fileTabSetting.upsert({
      where: { tabKey },
      update: { url: url || '', path: tabPath || '' },
      create: { tabKey, url: url || '', path: tabPath || '' },
    });
    res.json(setting);
  } catch (e: any) {
    console.error('[Files/Tabs] Error saving tab:', e?.message || e);
    res.status(500).json({ error: 'Ошибка сохранения', detail: e?.message });
  }
});

// Список скрываемых файлов/папок (имена через запятую) — общая настройка страницы «Файлы»
router.get('/hidden', authMiddleware, async (req, res) => {
  try {
    const row = await prisma.fileHideSetting.findFirst();
    res.json({ names: row?.names || '' });
  } catch (e: any) {
    console.error('[Files/Hidden] Error loading hidden names:', e?.message || e);
    res.status(500).json({ error: 'Ошибка загрузки настроек', detail: e?.message });
  }
});

// Сохранение списка — только для администраторов
router.post('/hidden', authMiddleware, async (req, res) => {
  if ((req as any).user?.role !== 'admin') {
    return res.status(403).json({ error: 'Доступ запрещен' });
  }
  const names = typeof req.body?.names === 'string' ? req.body.names.trim() : '';
  try {
    const existing = await prisma.fileHideSetting.findFirst();
    const row = existing
      ? await prisma.fileHideSetting.update({ where: { id: existing.id }, data: { names } })
      : await prisma.fileHideSetting.create({ data: { names } });
    res.json({ names: row.names });
  } catch (e: any) {
    console.error('[Files/Hidden] Error saving hidden names:', e?.message || e);
    res.status(500).json({ error: 'Ошибка сохранения', detail: e?.message });
  }
});

// Universal browse endpoint for all tabs
router.get('/browse', authMiddleware, (req, res) => {
  const tabKey = (req.query.tab as string) || '';
  const subPath = (req.query.path as string) || '';
  const baseDir = resolveTabDir(tabKey);

  if (!baseDir) {
    return res.status(400).json({ error: 'Неверная вкладка' });
  }
  if (tabKey === 'system' && (req as any).user?.role !== 'admin') {
    return res.status(403).json({ error: 'Доступ запрещен' });
  }

  const targetDir = path.join(baseDir, path.normalize(subPath).replace(/^(..(\/|$))+/g, ''));
  if (!targetDir.startsWith(baseDir)) {
    return res.status(403).json({ error: 'Доступ запрещен' });
  }

  try {
    if (!fs.existsSync(targetDir)) {
      return res.status(404).json({ error: 'Папка не найдена' });
    }
    const items = fs.readdirSync(targetDir, { withFileTypes: true }).map(dirent => {
      const stat = fs.statSync(path.join(targetDir, dirent.name));
      return {
        name: dirent.name,
        isDirectory: dirent.isDirectory(),
        size: stat.size,
        updatedAt: stat.mtime,
      };
    }).sort((a, b) => {
      if (a.isDirectory && !b.isDirectory) return -1;
      if (!a.isDirectory && b.isDirectory) return 1;
      return a.name.localeCompare(b.name, 'ru');
    });
    res.json({ items, currentPath: subPath });
  } catch (e: any) {
    console.error('[Files/Browse] Error reading folder:', e?.message || e);
    res.status(500).json({ error: 'Ошибка чтения папки' });
  }
});

// Inline preview endpoint for images and PDF files
const PREVIEW_TYPES: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.bmp': 'image/bmp',
  '.ico': 'image/x-icon',
  '.svg': 'image/svg+xml',
  '.pdf': 'application/pdf',
};

router.get('/preview', authMiddleware, (req, res) => {
  const tabKey = (req.query.tab as string) || '';
  const filePath = (req.query.path as string) || '';
  const baseDir = resolveTabDir(tabKey);

  if (!baseDir) {
    return res.status(400).json({ error: 'Неверная вкладка' });
  }
  if (tabKey === 'system' && (req as any).user?.role !== 'admin') {
    return res.status(403).json({ error: 'Доступ запрещен' });
  }

  const targetFile = path.join(baseDir, path.normalize(filePath).replace(/^(..(\/|$))+/g, ''));
  if (!targetFile.startsWith(baseDir)) {
    return res.status(403).json({ error: 'Доступ запрещен' });
  }

  const contentType = PREVIEW_TYPES[path.extname(targetFile).toLowerCase()];
  if (!contentType) {
    return res.status(415).json({ error: 'Превью для этого типа файла не поддерживается' });
  }

  try {
    if (!fs.existsSync(targetFile) || fs.statSync(targetFile).isDirectory()) {
      return res.status(404).json({ error: 'Файл не найден' });
    }
    const filename = path.basename(targetFile);
    res.setHeader('Content-Disposition', `inline; filename*=UTF-8''${encodeURIComponent(filename)}`);
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'private, max-age=60');
    const stream = fs.createReadStream(targetFile);
    stream.on('error', (err) => {
      console.error('File preview stream error:', err);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Ошибка загрузки превью' });
      } else if (!res.writableEnded) {
        res.end();
      }
    });
    res.on('close', () => {
      stream.destroy();
    });
    stream.pipe(res);
  } catch (e: any) {
    console.error('File preview error:', e);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Ошибка загрузки превью' });
    }
  }
});

// Universal download endpoint
router.get('/download', authMiddleware, (req, res) => {
  const tabKey = (req.query.tab as string) || '';
  const filePath = (req.query.path as string) || '';
  const baseDir = resolveTabDir(tabKey);

  if (!baseDir) {
    return res.status(400).json({ error: 'Неверная вкладка' });
  }
  if (tabKey === 'system' && (req as any).user?.role !== 'admin') {
    return res.status(403).json({ error: 'Доступ запрещен' });
  }

  const targetFile = path.join(baseDir, path.normalize(filePath).replace(/^(..(\/|$))+/g, ''));
  if (!targetFile.startsWith(baseDir)) {
    return res.status(403).json({ error: 'Доступ запрещен' });
  }

  try {
    if (!fs.existsSync(targetFile) || fs.statSync(targetFile).isDirectory()) {
      return res.status(404).json({ error: 'Файл не найден' });
    }
    const filename = path.basename(targetFile);
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`);
    res.setHeader('Content-Type', 'application/octet-stream');
    const stream = fs.createReadStream(targetFile);
    stream.on('error', (err) => {
      console.error('File download stream error:', err);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Ошибка скачивания файла' });
      } else if (!res.writableEnded) {
        res.end();
      }
    });
    res.on('close', () => {
      stream.destroy();
    });
    stream.pipe(res);
  } catch (e: any) {
    console.error('File download error:', e);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Ошибка скачивания' });
    }
  }
});

// Universal folder download endpoint
router.get('/download-folder', authMiddleware, (req, res) => {
  const tabKey = (req.query.tab as string) || '';
  const folderPath = (req.query.path as string) || '';
  const baseDir = resolveTabDir(tabKey);

  if (!baseDir) {
    return res.status(400).json({ error: 'Неверная вкладка' });
  }
  if (tabKey === 'system' && (req as any).user?.role !== 'admin') {
    return res.status(403).json({ error: 'Доступ запрещен' });
  }

  const targetDir = path.join(baseDir, path.normalize(folderPath).replace(/^(..(\/|$))+/g, ''));
  if (!targetDir.startsWith(baseDir)) {
    return res.status(403).json({ error: 'Доступ запрещен' });
  }

  try {
    if (!fs.existsSync(targetDir) || !fs.statSync(targetDir).isDirectory()) {
      return res.status(404).json({ error: 'Папка не найдена' });
    }
    const folderName = path.basename(targetDir);
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(folderName)}.zip`);
    const archive = (archiver as any)('zip', { zlib: { level: 6 } });
    archive.on('error', (err: any) => {
      console.error('Archiver error:', err);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Ошибка архивации' });
      } else if (!res.writableEnded) {
        res.end();
      }
    });
    archive.on('warning', (err: any) => {
      console.warn('Archiver warning:', err);
    });
    res.on('close', () => {
      archive.abort();
    });
    archive.pipe(res);
    archive.directory(targetDir, folderName);
    archive.finalize();
  } catch (e: any) {
    console.error('Folder download error:', e);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Ошибка архивации' });
    }
  }
});

// Legacy endpoints for backward compatibility with games tab
router.get('/games', authMiddleware, (req, res) => {
  req.query.tab = 'games';
  // Re-use browse logic manually
  const tabKey = 'games';
  const subPath = (req.query.path as string) || '';
  const baseDir = TAB_DIRS[tabKey];
  const targetDir = path.join(baseDir, path.normalize(subPath).replace(/^(..(\/|$))+/g, ''));
  if (!targetDir.startsWith(baseDir)) {
    return res.status(403).json({ error: 'Доступ запрещен' });
  }
  try {
    if (!fs.existsSync(targetDir)) {
      return res.status(404).json({ error: 'Папка не найдена' });
    }
    const items = fs.readdirSync(targetDir, { withFileTypes: true }).map(dirent => {
      const stat = fs.statSync(path.join(targetDir, dirent.name));
      return {
        name: dirent.name,
        isDirectory: dirent.isDirectory(),
        size: stat.size,
        updatedAt: stat.mtime,
      };
    }).sort((a, b) => {
      if (a.isDirectory && !b.isDirectory) return -1;
      if (!a.isDirectory && b.isDirectory) return 1;
      return a.name.localeCompare(b.name, 'ru');
    });
    res.json({ items, currentPath: subPath });
  } catch (e: any) {
    console.error('[Files/Games] Error reading folder:', e?.message || e);
    res.status(500).json({ error: 'Ошибка чтения папки' });
  }
});

router.get('/games/download', authMiddleware, (req, res) => {
  const tabKey = 'games';
  const filePath = (req.query.path as string) || '';
  const baseDir = TAB_DIRS[tabKey];
  const targetFile = path.join(baseDir, path.normalize(filePath).replace(/^(..(\/|$))+/g, ''));
  if (!targetFile.startsWith(baseDir)) {
    return res.status(403).json({ error: 'Доступ запрещен' });
  }
  try {
    if (!fs.existsSync(targetFile) || fs.statSync(targetFile).isDirectory()) {
      return res.status(404).json({ error: 'Файл не найден' });
    }
    const filename = path.basename(targetFile);
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`);
    res.setHeader('Content-Type', 'application/octet-stream');
    const stream = fs.createReadStream(targetFile);
    stream.on('error', (err) => {
      console.error('File download stream error:', err);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Ошибка скачивания файла' });
      } else if (!res.writableEnded) {
        res.end();
      }
    });
    res.on('close', () => {
      stream.destroy();
    });
    stream.pipe(res);
  } catch (e: any) {
    console.error('File download error:', e);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Ошибка скачивания' });
    }
  }
});

router.get('/games/download-folder', authMiddleware, (req, res) => {
  const tabKey = 'games';
  const folderPath = (req.query.path as string) || '';
  const baseDir = TAB_DIRS[tabKey];
  const targetDir = path.join(baseDir, path.normalize(folderPath).replace(/^(..(\/|$))+/g, ''));
  if (!targetDir.startsWith(baseDir)) {
    return res.status(403).json({ error: 'Доступ запрещен' });
  }
  try {
    if (!fs.existsSync(targetDir) || !fs.statSync(targetDir).isDirectory()) {
      return res.status(404).json({ error: 'Папка не найдена' });
    }
    const folderName = path.basename(targetDir);
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(folderName)}.zip`);
    const archive = (archiver as any)('zip', { zlib: { level: 6 } });
    archive.on('error', (err: any) => {
      console.error('Archiver error:', err);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Ошибка архивации' });
      } else if (!res.writableEnded) {
        res.end();
      }
    });
    archive.on('warning', (err: any) => {
      console.warn('Archiver warning:', err);
    });
    res.on('close', () => {
      archive.abort();
    });
    archive.pipe(res);
    archive.directory(targetDir, folderName);
    archive.finalize();
  } catch (e: any) {
    console.error('Folder download error:', e);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Ошибка архивации' });
    }
  }
});

export default router;

