import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middleware/auth.js';
import fs from 'fs';
import path from 'path';
import * as archiver from 'archiver';

const router = Router();
const prisma = new PrismaClient();

// Map tab keys to local directories inside Docker container
const TAB_DIRS: Record<string, string> = {
  programs: '/app/files/programs',
  drivers: '/app/files/drivers',
  documents: '/app/files/documents',
  games: '/app/files/games',
};

router.get('/tabs', authMiddleware, async (_req, res) => {
  try {
    const tabs = await prisma.fileTabSetting.findMany();
    const defaults = [
      { tabKey: 'programs', label: 'Программы', url: '', path: '/volume3/SOFT' },
      { tabKey: 'drivers', label: 'Драйвера', url: '', path: '/volume3/DRIVER' },
      { tabKey: 'documents', label: 'Документы', url: '', path: '/volume2/BOOK' },
      { tabKey: 'games', label: 'Игры', url: '', path: '/volume3/GAME' },
    ];
    const merged = defaults.map(d => {
      const found = tabs.find(t => t.tabKey === d.tabKey);
      return { ...d, url: found?.url || '', path: found?.path || d.path, id: found?.id || null };
    });
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

// Universal browse endpoint for all tabs
router.get('/browse', authMiddleware, (req, res) => {
  const tabKey = (req.query.tab as string) || '';
  const subPath = (req.query.path as string) || '';
  const baseDir = TAB_DIRS[tabKey];

  if (!baseDir) {
    return res.status(400).json({ error: 'Неверная вкладка' });
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

// Universal download endpoint
router.get('/download', authMiddleware, (req, res) => {
  const tabKey = (req.query.tab as string) || '';
  const filePath = (req.query.path as string) || '';
  const baseDir = TAB_DIRS[tabKey];

  if (!baseDir) {
    return res.status(400).json({ error: 'Неверная вкладка' });
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
  const baseDir = TAB_DIRS[tabKey];

  if (!baseDir) {
    return res.status(400).json({ error: 'Неверная вкладка' });
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

