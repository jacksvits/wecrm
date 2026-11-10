import { Router } from 'express';
import { authMiddleware, optionalAuthMiddleware } from '../middleware/auth.js';
import { prisma } from '../lib/prisma.js';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { randomUUID } from 'crypto';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { ZipArchive } from 'archiver';
import sharp from 'sharp';
import { uploadsRoot } from '../lib/tenant.js';

const router = Router();

function resolveInside(baseDir: string, requestedPath: string): string | null {
  const base = path.resolve(baseDir);
  const target = path.resolve(base, requestedPath || '.');
  if (target !== base && !target.startsWith(base + path.sep)) return null;
  try {
    const realBase = fs.realpathSync(base);
    const realTarget = fs.realpathSync(target);
    if (realTarget !== realBase && !realTarget.startsWith(realBase + path.sep)) return null;
  } catch { /* отсутствие обрабатывается вызывающим маршрутом */ }
  return target;
}


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

// Чтение страницы «Файлы» публичное (welans.click без входа): роль admin по-прежнему
// решает, видна ли вкладка «Система»; запись — только под авторизацией
router.get('/tabs', optionalAuthMiddleware, async (req, res) => {
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
  if ((req as any).user?.role !== 'admin') return res.status(403).json({ error: 'Доступ запрещен' });
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

// Учёт скачивания файла/папки страницы «Файлы» (fire-and-forget)
const incrementDownloadCount = (tabKey: string, filePath: string) => {
  prisma.fileDownloadCount.upsert({
    where: { tabKey_filePath: { tabKey, filePath } },
    update: { count: { increment: 1 } },
    create: { tabKey, filePath, count: 1 },
  }).catch((e: any) => console.error('[Files/DownloadCount] Error:', e?.message || e));
};

// Список скрываемых файлов/папок (имена через запятую) — общая настройка страницы «Файлы»
router.get('/hidden', optionalAuthMiddleware, async (req, res) => {
  try {
    const row = await prisma.fileHideSetting.findFirst();
    const theme = row?.theme === 'macos' ? 'macos' : 'win7';
    const viewMode = row?.viewMode === 'table' ? 'table' : 'icons';
    res.json({ names: row?.names || '', theme, viewMode });
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
  const ALLOWED_THEMES = ['win7', 'macos'];
  const theme = ALLOWED_THEMES.includes(req.body?.theme) ? req.body.theme : 'win7';
  const viewMode = req.body?.viewMode === 'table' ? 'table' : 'icons';
  try {
    const existing = await prisma.fileHideSetting.findFirst();
    const row = existing
      ? await prisma.fileHideSetting.update({ where: { id: existing.id }, data: { names, theme, viewMode } })
      : await prisma.fileHideSetting.create({ data: { names, theme, viewMode } });
    res.json({ names: row.names, theme: row.theme, viewMode: row.viewMode });
  } catch (e: any) {
    console.error('[Files/Hidden] Error saving hidden names:', e?.message || e);
    res.status(500).json({ error: 'Ошибка сохранения', detail: e?.message });
  }
});

// Universal browse endpoint for all tabs
router.get('/browse', optionalAuthMiddleware, async (req, res) => {
  const tabKey = (req.query.tab as string) || '';
  const subPath = (req.query.path as string) || '';
  const baseDir = resolveTabDir(tabKey);

  if (!baseDir) {
    return res.status(400).json({ error: 'Неверная вкладка' });
  }
  if (tabKey === 'system' && (req as any).user?.role !== 'admin') {
    return res.status(403).json({ error: 'Доступ запрещен' });
  }

  const targetDir = resolveInside(baseDir, subPath);
  if (!targetDir) {
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
    // Количество скачиваний по каждому элементу текущей папки
    const counts = await prisma.fileDownloadCount.findMany({
      where: { tabKey, filePath: { in: items.map((it) => (subPath ? `${subPath}/${it.name}` : it.name)) } },
    });
    const countMap = new Map(counts.map((c) => [path.basename(c.filePath), c.count]));
    const itemsWithCounts = items.map((it) => ({ ...it, downloads: countMap.get(it.name) || 0 }));
    res.json({ items: itemsWithCounts, currentPath: subPath });
  } catch (e: any) {
    console.error('[Files/Browse] Error reading folder:', e?.message || e);
    res.status(500).json({ error: 'Ошибка чтения папки' });
  }
});

// Inline preview endpoint for images and PDF files
const execFileAsync = promisify(execFile);
const PREVIEW_THUMB_SIZE = 144;

const createImageThumbnail = async (targetFile: string): Promise<Buffer> =>
  sharp(targetFile)
    .rotate()
    .resize(PREVIEW_THUMB_SIZE, PREVIEW_THUMB_SIZE, { fit: 'cover', withoutEnlargement: true })
    .jpeg({ quality: 72 })
    .toBuffer();

const createPdfThumbnail = async (targetFile: string): Promise<Buffer> => {
  const outputBase = path.join(os.tmpdir(), `wecrm-file-preview-${process.pid}-${randomUUID()}`);
  try {
    await execFileAsync('pdftoppm', [
      '-f', '1',
      '-singlefile',
      '-jpeg',
      '-jpegopt', 'quality=72',
      '-scale-to', String(PREVIEW_THUMB_SIZE),
      targetFile,
      outputBase,
    ], { timeout: 15000, maxBuffer: 1024 * 1024 });
    return await fs.promises.readFile(`${outputBase}.jpg`);
  } finally {
    await fs.promises.rm(`${outputBase}.jpg`, { force: true }).catch(() => undefined);
  }
};

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

router.get('/preview', optionalAuthMiddleware, async (req, res) => {
  const tabKey = (req.query.tab as string) || '';
  const filePath = (req.query.path as string) || '';
  const baseDir = resolveTabDir(tabKey);

  if (!baseDir) {
    return res.status(400).json({ error: 'Неверная вкладка' });
  }
  if (tabKey === 'system' && (req as any).user?.role !== 'admin') {
    return res.status(403).json({ error: 'Доступ запрещен' });
  }

  const targetFile = resolveInside(baseDir, filePath);
  if (!targetFile) {
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
    const ext = path.extname(targetFile).toLowerCase();
    if (req.query.thumb === '1' && ((contentType.startsWith('image/') && ext !== '.svg') || ext === '.pdf')) {
      const thumbnail = ext === '.pdf'
        ? await createPdfThumbnail(targetFile)
        : await createImageThumbnail(targetFile);
      res.setHeader('Content-Disposition', `inline; filename*=UTF-8''${encodeURIComponent(filename)}.jpg`);
      res.setHeader('Content-Type', 'image/jpeg');
      res.setHeader('Cache-Control', 'private, max-age=300');
      return res.send(thumbnail);
    }

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
router.get('/download', optionalAuthMiddleware, (req, res) => {
  const tabKey = (req.query.tab as string) || '';
  const filePath = (req.query.path as string) || '';
  const baseDir = resolveTabDir(tabKey);

  if (!baseDir) {
    return res.status(400).json({ error: 'Неверная вкладка' });
  }
  if (tabKey === 'system' && (req as any).user?.role !== 'admin') {
    return res.status(403).json({ error: 'Доступ запрещен' });
  }

  const targetFile = resolveInside(baseDir, filePath);
  if (!targetFile) {
    return res.status(403).json({ error: 'Доступ запрещен' });
  }

  try {
    if (!fs.existsSync(targetFile) || fs.statSync(targetFile).isDirectory()) {
      return res.status(404).json({ error: 'Файл не найден' });
    }
    const filename = path.basename(targetFile);
    incrementDownloadCount(tabKey, filePath);
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
router.get('/download-folder', optionalAuthMiddleware, (req, res) => {
  const tabKey = (req.query.tab as string) || '';
  const folderPath = (req.query.path as string) || '';
  const baseDir = resolveTabDir(tabKey);

  if (!baseDir) {
    return res.status(400).json({ error: 'Неверная вкладка' });
  }
  if (tabKey === 'system' && (req as any).user?.role !== 'admin') {
    return res.status(403).json({ error: 'Доступ запрещен' });
  }

  const targetDir = resolveInside(baseDir, folderPath);
  if (!targetDir) {
    return res.status(403).json({ error: 'Доступ запрещен' });
  }

  try {
    if (!fs.existsSync(targetDir) || !fs.statSync(targetDir).isDirectory()) {
      return res.status(404).json({ error: 'Папка не найдена' });
    }
    const folderName = path.basename(targetDir);
    incrementDownloadCount(tabKey, folderPath);
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(folderName)}.zip`);
    const archive = new ZipArchive({ zlib: { level: 6 } });
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
router.get('/games', optionalAuthMiddleware, (req, res) => {
  req.query.tab = 'games';
  // Re-use browse logic manually
  const tabKey = 'games';
  const subPath = (req.query.path as string) || '';
  const baseDir = TAB_DIRS[tabKey];
  const targetDir = resolveInside(baseDir, subPath);
  if (!targetDir) {
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

router.get('/games/download', optionalAuthMiddleware, (req, res) => {
  const tabKey = 'games';
  const filePath = (req.query.path as string) || '';
  const baseDir = TAB_DIRS[tabKey];
  const targetFile = resolveInside(baseDir, filePath);
  if (!targetFile) {
    return res.status(403).json({ error: 'Доступ запрещен' });
  }
  try {
    if (!fs.existsSync(targetFile) || fs.statSync(targetFile).isDirectory()) {
      return res.status(404).json({ error: 'Файл не найден' });
    }
    const filename = path.basename(targetFile);
    incrementDownloadCount(tabKey, filePath);
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

router.get('/games/download-folder', optionalAuthMiddleware, (req, res) => {
  const tabKey = 'games';
  const folderPath = (req.query.path as string) || '';
  const baseDir = TAB_DIRS[tabKey];
  const targetDir = resolveInside(baseDir, folderPath);
  if (!targetDir) {
    return res.status(403).json({ error: 'Доступ запрещен' });
  }
  try {
    if (!fs.existsSync(targetDir) || !fs.statSync(targetDir).isDirectory()) {
      return res.status(404).json({ error: 'Папка не найдена' });
    }
    const folderName = path.basename(targetDir);
    incrementDownloadCount(tabKey, folderPath);
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(folderName)}.zip`);
    const archive = new ZipArchive({ zlib: { level: 6 } });
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

