import { Router } from 'express';
import { authMiddleware, optionalAuthMiddleware } from '../middleware/auth.js';
import { prisma } from '../lib/prisma.js';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { randomBytes, randomUUID } from 'crypto';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { ZipArchive } from 'archiver';
import multer from 'multer';
import AdmZip from 'adm-zip';
import jschardet from 'jschardet';
import iconv from 'iconv-lite';
import sharp from 'sharp';
import { uploadsRoot } from '../lib/tenant.js';
import {
  initNfsRegistry,
  refreshRegistry,
  ensureMounted,
  unmount,
  removeMountPoint,
  folderStatus,
  nfsDirForTab,
  slugify,
  testMount,
  NFS_ROOT,
  NfsFolder,
} from '../lib/nfs-mounts.js';

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
// (main: /app/uploads, tenant: /app/tenants/<slug>); только для администраторов.
// Остальные вкладки — NFS-папки из реестра (монтируются в /app/nfs/<tabKey>).
const resolveTabDir = (tabKey: string): string | undefined =>
  tabKey === 'system' ? uploadsRoot() : nfsDirForTab(tabKey);

// Реестр NFS-папок: стартовая загрузка + периодический ре-маунт (внутри nfs-mounts)
initNfsRegistry();

// Чтение страницы «Файлы» публичное (welans.click без входа): роль admin по-прежнему
// решает, видна ли вкладка «Система»; запись — только под авторизацией
router.get('/tabs', optionalAuthMiddleware, async (req, res) => {
  try {
    const rows = await prisma.fileTabSetting.findMany({
      where: { host: { not: '' }, export: { not: '' } },
      orderBy: [{ sort: 'asc' }, { tabKey: 'asc' }],
    });
    const merged = rows.map((t: any) => ({
      tabKey: t.tabKey,
      label: t.label || t.tabKey,
      url: t.url || '',
      path: t.path || '',
      id: t.id,
    }));
    if ((req as any).user?.role === 'admin') {
      merged.unshift({ tabKey: 'system', label: 'Система', url: '', path: uploadsRoot(), id: null });
    }
    res.json(merged);
  } catch (e: any) {
    console.error('[Files/Tabs] Error loading tabs:', e?.message || e);
    res.status(500).json({ error: 'Ошибка загрузки настроек', detail: e?.message });
  }
});

// === Асинхронные переносы (copy/move) с прогрессом ===
// POST /api/files/transfer — единый эндпоинт для копирования/перемещения
// между любыми вкладками (sourceTab/targetTab); работает в фоне,
// клиент опрашивает GET /api/files/transfer/:jobId.
interface TransferJob {
  id: string;
  mode: 'copy' | 'move';
  name: string;
  status: 'running' | 'done' | 'error';
  totalBytes: number;
  copiedBytes: number;
  totalFiles: number;
  filesDone: number;
  error: string;
  startedAt: number;
  finishedAt?: number;
}
const transferJobs = new Map<string, TransferJob>();

// Размеры источника для прогресс-бара
const scanSizes = (src: string) => {
  let totalBytes = 0;
  let totalFiles = 0;
  const walk = (p: string) => {
    const st = fs.lstatSync(p);
    if (st.isDirectory()) {
      for (const entry of fs.readdirSync(p)) walk(path.join(p, entry));
    } else {
      totalBytes += st.size;
      totalFiles += 1;
    }
  };
  walk(src);
  return { totalBytes, totalFiles };
};

// Рекурсивное копирование с подсчётом прогресса после каждого файла
const copyWithProgress = (src: string, dest: string, job: TransferJob) => {
  const st = fs.lstatSync(src);
  if (st.isDirectory()) {
    fs.mkdirSync(dest, { recursive: true });
    for (const entry of fs.readdirSync(src)) {
      copyWithProgress(path.join(src, entry), path.join(dest, entry), job);
    }
  } else {
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(src, dest);
    job.copiedBytes += st.size;
    job.filesDone += 1;
  }
};

router.post('/transfer', authMiddleware, async (req, res) => {
  const mode = req.body?.mode === 'move' ? 'move' : 'copy';
  const sourceTab = String(req.body?.sourceTab || '');
  const sourcePath = String(req.body?.sourcePath || '');
  const targetTab = String(req.body?.targetTab || '');
  const targetPath = String(req.body?.targetPath || '');

  // Перемещение меняет и источник — значит источник тоже должен быть доступен на запись
  const src = mode === 'move'
    ? mutateTarget(req, res, sourceTab, sourcePath)
    : accessTarget(req, res, sourceTab, sourcePath);
  if (!src) return;
  const destFolder = mutateTarget(req, res, targetTab, targetPath, { allowRoot: true });
  if (!destFolder) return;

  let srcStat: fs.Stats;
  try {
    srcStat = fs.statSync(src);
  } catch {
    return res.status(404).json({ error: 'Объект не найден' });
  }
  if (srcStat.isDirectory() && !fs.statSync(destFolder).isDirectory()) {
    return res.status(400).json({ error: 'Папку можно перенести только в папку' });
  }
  const sameTab = sourceTab === targetTab;
  if (sameTab && (src === destFolder || destFolder.startsWith(src + path.sep))) {
    return res.status(400).json({ error: 'Нельзя перенести объект внутрь самого себя' });
  }
  const dest = path.join(destFolder, path.basename(src));
  if (fs.existsSync(dest)) {
    return res.status(409).json({ error: 'Объект с таким именем уже существует' });
  }

  const job: TransferJob = {
    id: randomUUID(),
    mode,
    name: path.basename(src),
    status: 'running',
    totalBytes: 0,
    copiedBytes: 0,
    totalFiles: 0,
    filesDone: 0,
    error: '',
    startedAt: Date.now(),
  };
  transferJobs.set(job.id, job);
  // Не накапливаем старые завершённые задания
  if (transferJobs.size > 50) {
    const done = [...transferJobs.values()].filter((j) => j.status !== 'running').sort((a, b) => (a.finishedAt || 0) - (b.finishedAt || 0));
    for (const old of done.slice(0, transferJobs.size - 50)) transferJobs.delete(old.id);
  }

  setImmediate(() => {
    try {
      const totals = scanSizes(src);
      job.totalBytes = totals.totalBytes;
      job.totalFiles = totals.totalFiles;
      copyWithProgress(src, dest, job);
      if (mode === 'move') fs.rmSync(src, { recursive: true });
      job.status = 'done';
    } catch (e: any) {
      job.status = 'error';
      job.error = e?.message || 'Ошибка переноса';
    } finally {
      job.finishedAt = Date.now();
    }
  });

  res.status(202).json({ jobId: job.id });
});

// Прогресс задания (опрос клиентом раз в секунду)
router.get('/transfer/:jobId', authMiddleware, (req, res) => {
  const job = transferJobs.get(req.params.jobId);
  if (!job) return res.status(404).json({ error: 'Задание не найдено' });
  res.json(job);
});

// === NFS-папки (вкладки) страницы «Файлы» ===

// === Управление NFS-папками (вкладками) страницы «Файлы» — только для администраторов ===

const toFolder = (r: any): NfsFolder => ({
  id: r.id,
  tabKey: r.tabKey,
  label: r.label || r.tabKey,
  host: r.host,
  export: r.export,
  readOnly: !!r.readOnly,
  sort: r.sort || 0,
});

// Список NFS-папок со статусом монтирования
router.get('/nfs', authMiddleware, async (req, res) => {
  if ((req as any).user?.role !== 'admin') return res.status(403).json({ error: 'Доступ запрещен' });
  try {
    const rows = await prisma.fileTabSetting.findMany({
      where: { host: { not: '' }, export: { not: '' } },
      orderBy: [{ sort: 'asc' }, { tabKey: 'asc' }],
    });
    res.json(rows.map((r: any) => ({ ...toFolder(r), status: folderStatus(toFolder(r)) })));
  } catch (e: any) {
    console.error('[Files/NFS] Error loading folders:', e?.message || e);
    res.status(500).json({ error: 'Ошибка загрузки списка', detail: e?.message });
  }
});

// Добавление NFS-папки: сначала пробное монтирование, потом запись в БД
router.post('/nfs', authMiddleware, async (req, res) => {
  if ((req as any).user?.role !== 'admin') return res.status(403).json({ error: 'Доступ запрещен' });
  const label = String(req.body?.label || '').trim().slice(0, 60);
  const host = String(req.body?.host || '').trim().slice(0, 100);
  const nfsExport = String(req.body?.export || '').trim().slice(0, 200);
  const readOnly = !!req.body?.readOnly;
  if (!label) return res.status(400).json({ error: 'Укажите название вкладки' });
  if (!host || /[\s/]/.test(host)) return res.status(400).json({ error: 'Некорректный адрес NFS-сервера' });
  if (!nfsExport.startsWith('/')) return res.status(400).json({ error: 'Экспорт должен начинаться с / (например /volume3/SHARE)' });

  // Уникальный ключ вкладки по названию
  const existing = await prisma.fileTabSetting.findMany({ select: { tabKey: true } });
  const keys = new Set(existing.map((r: any) => r.tabKey));
  const base = slugify(label, 'folder');
  let tabKey = base;
  for (let i = 2; keys.has(tabKey); i++) tabKey = `${base}-${i}`;

  const probe = await testMount(host, nfsExport, readOnly);
  if (!probe.ok) {
    return res.status(400).json({ error: `Не удалось подключить шару: ${probe.error || 'ошибка монтирования'}` });
  }
  try {
    const maxSort = await prisma.fileTabSetting.aggregate({ _max: { sort: true } });
    const row = await prisma.fileTabSetting.create({
      data: { tabKey, label, host, export: nfsExport, readOnly, sort: (maxSort._max.sort || 0) + 1 },
    });
    await refreshRegistry();
    const folder = toFolder(row);
    res.status(201).json({ ...folder, status: folderStatus(folder) });
  } catch (e: any) {
    console.error('[Files/NFS] Error creating folder:', e?.message || e);
    res.status(500).json({ error: 'Ошибка сохранения', detail: e?.message });
  }
});

// Редактирование NFS-папки: название / сервер / экспорт / только чтение.
// Ключ вкладки (tabKey) не меняется — на него ссылаются ссылки и настройки.
router.put('/nfs/:id', authMiddleware, async (req, res) => {
  if ((req as any).user?.role !== 'admin') return res.status(403).json({ error: 'Доступ запрещен' });
  const row = await prisma.fileTabSetting.findUnique({ where: { id: req.params.id } });
  if (!row || !row.host) return res.status(404).json({ error: 'Папка не найдена' });

  const label = String(req.body?.label ?? row.label).trim().slice(0, 60) || row.label;
  const host = String(req.body?.host ?? row.host).trim().slice(0, 100);
  const nfsExport = String(req.body?.export ?? row.export).trim().slice(0, 200);
  const readOnly = req.body?.readOnly === undefined ? row.readOnly : !!req.body.readOnly;
  if (!host || /[\s/]/.test(host)) return res.status(400).json({ error: 'Некорректный адрес NFS-сервера' });
  if (!nfsExport.startsWith('/')) return res.status(400).json({ error: 'Экспорт должен начинаться с /' });

  const sourceChanged = host !== row.host || nfsExport !== row.export || readOnly !== row.readOnly;
  // Проверяем новый источник пробным монтированием, если он изменился
  if (sourceChanged) {
    const probe = await testMount(host, nfsExport, readOnly);
    if (!probe.ok) {
      return res.status(400).json({ error: `Не удалось подключить шару: ${probe.error || 'ошибка монтирования'}` });
    }
  }
  try {
    const updated = await prisma.fileTabSetting.update({
      where: { id: row.id },
      data: { label, host, export: nfsExport, readOnly },
    });
    if (sourceChanged) {
      await unmount(updated.tabKey);
      await refreshRegistry();
    } else {
      await refreshRegistry();
    }
    const folder = toFolder(updated);
    res.json({ ...folder, status: folderStatus(folder) });
  } catch (e: any) {
    console.error('[Files/NFS] Error updating folder:', e?.message || e);
    res.status(500).json({ error: 'Ошибка сохранения', detail: e?.message });
  }
});

// Удаление NFS-папки: отмонтировать, убрать точку, удалить запись
router.delete('/nfs/:id', authMiddleware, async (req, res) => {
  if ((req as any).user?.role !== 'admin') return res.status(403).json({ error: 'Доступ запрещен' });
  const row = await prisma.fileTabSetting.findUnique({ where: { id: req.params.id } });
  if (!row || !row.host) return res.status(404).json({ error: 'Папка не найдена' });
  try {
    await unmount(row.tabKey);
    await prisma.fileTabSetting.delete({ where: { id: row.id } });
    removeMountPoint(row.tabKey);
    await refreshRegistry();
    res.json({ ok: true });
  } catch (e: any) {
    console.error('[Files/NFS] Error deleting folder:', e?.message || e);
    res.status(500).json({ error: 'Ошибка удаления', detail: e?.message });
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
    // Флаг записи: NFS-шары архивов могут быть read-only — фронт скроет операции записи
    res.json({ items: itemsWithCounts, currentPath: subPath, writable: isWritableDir(targetDir) });
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
  // Видео: модальный плеер на странице «Файлы» (avi/mkv/wmv — по попытке, браузер может не сыграть)
  '.mp4': 'video/mp4',
  '.m4v': 'video/mp4',
  '.webm': 'video/webm',
  '.mov': 'video/quicktime',
  '.ogv': 'video/ogg',
  '.avi': 'video/x-msvideo',
  '.mkv': 'video/x-matroska',
  '.wmv': 'video/x-ms-wmv',
  // Аудио: модальный аудиоплеер на странице «Файлы» (wma — по попытке, браузер может не сыграть)
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.ogg': 'audio/ogg',
  '.oga': 'audio/ogg',
  '.m4a': 'audio/mp4',
  '.aac': 'audio/aac',
  '.opus': 'audio/ogg',
  '.flac': 'audio/flac',
  '.wma': 'audio/x-ms-wma',
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
    setDownloadHeaders(res, filename);
    // Content-Length нужен мобильным браузерам (iOS Safari) для старта скачивания
    res.setHeader('Content-Length', String(fs.statSync(targetFile).size));
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
    res.setHeader('Cache-Control', 'no-transform');
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

// === Операции управления файлами страницы «Файлы» (вид «Две панели») ===
// Все операции изменяют файловое хранилище вкладок — только для администраторов.
// Проверка путей та же, что у чтения: resolveInside не даёт выйти за пределы вкладки.

// Имя без путей и служебных символов (как у вложений задач)
const sanitizeName = (raw: any): string | null => {
  const name = String(raw || '').trim();
  if (!name) return null;
  const cleaned = name.replace(/[<>:"\\|?*\x00-\x1f]/g, '_').replace(/\s+/g, ' ').trim();
  return cleaned || null;
};

// Доступна ли папка на запись (NFS-шары архивов могут быть read-only)
const isWritableDir = (dir: string): boolean => {
  try {
    fs.accessSync(dir, fs.constants.W_OK);
    return true;
  } catch {
    return false;
  }
};

// Базовый доступ к объекту вкладки: роль admin + валидная вкладка + путь внутри хранилища.
// Без проверки записи — подходит и для чтения (текстовый редактор, скачивание).
const accessTarget = (req: any, res: any, tabKey: string, subPath: string, opts?: { allowRoot?: boolean }): string | null => {
  if (req.user?.role !== 'admin') {
    res.status(403).json({ error: 'Доступ запрещен' });
    return null;
  }
  const baseDir = resolveTabDir(tabKey);
  if (!baseDir) {
    res.status(400).json({ error: 'Неверная вкладка' });
    return null;
  }
  if (!subPath && !opts?.allowRoot) {
    res.status(400).json({ error: 'Не указан путь' });
    return null;
  }
  const target = resolveInside(baseDir, subPath);
  if (!target) {
    res.status(403).json({ error: 'Доступ запрещен' });
    return null;
  }
  return target;
};

// Общий предохранитель мутаций: роль admin + валидная вкладка + путь внутри хранилища + вкладка доступна на запись.
// Вернёт null и ответит ошибкой, если проверка не пройдена.
const mutateTarget = (req: any, res: any, tabKey: string, subPath: string, opts?: { allowRoot?: boolean }): string | null => {
  const target = accessTarget(req, res, tabKey, subPath, opts);
  if (!target) return null;
  const baseDir = resolveTabDir(tabKey)!;
  if (!isWritableDir(baseDir)) {
    res.status(409).json({ error: 'Вкладка доступна только для чтения' });
    return null;
  }
  return target;
};

// Создание папки внутри указанной папки вкладки
router.post('/mkdir', authMiddleware, async (req, res) => {
  const tabKey = String(req.body?.tabKey || '');
  const folderPath = String(req.body?.path || '');
  const name = sanitizeName(req.body?.name);
  if (!name) return res.status(400).json({ error: 'Неверное имя папки' });
  const parent = mutateTarget(req, res, tabKey, folderPath, { allowRoot: true });
  if (!parent) return;
  try {
    if (!fs.existsSync(parent) || !fs.statSync(parent).isDirectory()) {
      return res.status(404).json({ error: 'Папка не найдена' });
    }
    // sanitizeName убирает разделители — цель гарантированно внутри parent
    const target = path.join(parent, name);
    if (fs.existsSync(target)) return res.status(409).json({ error: 'Папка уже существует' });
    fs.mkdirSync(target);
    res.status(201).json({ ok: true, name });
  } catch (e: any) {
    console.error('[Files/Mkdir] Error:', e?.message || e);
    res.status(500).json({ error: 'Ошибка создания папки', detail: e?.message });
  }
});

// Загрузка файлов в папку вкладки (?tab=&path=), поле формы — files (как у задач)
const tabFileStorage = multer.diskStorage({
  destination: (req, _file, cb) => {
    const tabKey = String((req.query.tab as string) || '');
    const subPath = String((req.query.path as string) || '');
    const baseDir = (req as any).user?.role === 'admin' ? resolveTabDir(tabKey) : undefined;
    const dir = baseDir ? resolveInside(baseDir, subPath) : null;
    if (!dir || !fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) {
      return cb(new Error('Папка не найдена'), '');
    }
    cb(null, dir);
  },
  filename: (_req, file, cb) => {
    const dir = (file as any).destination || '';
    const originalName = Buffer.from(file.originalname, 'latin1').toString('utf8');
    const sanitized = originalName.replace(/[<>:"\\|?*\x00-\x1f]/g, '_').replace(/\s+/g, ' ').trim();
    if (!sanitized) { cb(null, `${randomUUID()}${path.extname(originalName)}`); return; }
    let finalName = sanitized;
    if (dir && fs.existsSync(path.join(dir, finalName))) {
      const ext = path.extname(sanitized);
      const base = path.basename(sanitized, ext);
      let counter = 1;
      do { finalName = `${base} (${counter})${ext}`; counter++; } while (fs.existsSync(path.join(dir, finalName)));
    }
    cb(null, finalName);
  },
});
const tabFileUpload = multer({ storage: tabFileStorage, limits: { fileSize: 2 * 1024 * 1024 * 1024 } });

router.post('/upload', authMiddleware, (req, res, next) => {
  if ((req as any).user?.role !== 'admin') return res.status(403).json({ error: 'Доступ запрещен' });
  const baseDir = resolveTabDir(String((req.query.tab as string) || ''));
  const dir = baseDir ? resolveInside(baseDir, String((req.query.path as string) || '')) : null;
  if (!dir || !isWritableDir(dir)) return res.status(409).json({ error: 'Вкладка доступна только для чтения' });
  next();
}, tabFileUpload.array('files', 20), async (req, res) => {
  try {
    const files = (req.files as Express.Multer.File[]) || [];
    if (!files.length) return res.status(400).json({ error: 'Нет файлов' });
    res.status(201).json(files.map((f) => ({ name: f.filename, size: f.size })));
  } catch (e: any) {
    console.error('[Files/Upload] Error:', e?.message || e);
    res.status(500).json({ error: 'Ошибка загрузки', detail: e?.message });
  }
});

// Переименование файла/папки (path — текущий относительный путь объекта)
router.post('/rename', authMiddleware, async (req, res) => {
  const tabKey = String(req.body?.tabKey || '');
  const itemPath = String(req.body?.path || '');
  const newName = sanitizeName(req.body?.newName);
  if (!newName) return res.status(400).json({ error: 'Неверное имя' });
  const target = mutateTarget(req, res, tabKey, itemPath);
  if (!target) return;
  try {
    if (!fs.existsSync(target)) return res.status(404).json({ error: 'Объект не найден' });
    const dest = path.join(path.dirname(target), newName);
    if (fs.existsSync(dest)) return res.status(409).json({ error: 'Объект с таким именем уже существует' });
    fs.renameSync(target, dest);
    res.json({ ok: true, name: newName });
  } catch (e: any) {
    console.error('[Files/Rename] Error:', e?.message || e);
    res.status(500).json({ error: 'Ошибка переименования', detail: e?.message });
  }
});

// Удаление файла/папки (папка удаляется рекурсивно)
router.delete('/item', authMiddleware, async (req, res) => {
  const tabKey = String(req.query.tab || '');
  const itemPath = String(req.query.path || '');
  const target = mutateTarget(req, res, tabKey, itemPath);
  if (!target) return;
  try {
    if (!fs.existsSync(target)) return res.status(404).json({ error: 'Объект не найден' });
    fs.rmSync(target, { recursive: true });
    res.json({ ok: true });
  } catch (e: any) {
    console.error('[Files/Delete] Error:', e?.message || e);
    res.status(500).json({ error: 'Ошибка удаления', detail: e?.message });
  }
});

// Копирование/перемещение объекта: from — относительный путь объекта, to — папка назначения
const transferItem = (req: any, res: any, mode: 'copy' | 'move') => {
  const tabKey = String(req.body?.tabKey || '');
  const from = String(req.body?.from || '');
  const to = String(req.body?.to || '');
  const target = mutateTarget(req, res, tabKey, from);
  if (!target) return;
  const destFolder = mutateTarget(req, res, tabKey, to, { allowRoot: true });
  if (!destFolder) return;
  try {
    if (!fs.existsSync(target)) return res.status(404).json({ error: 'Объект не найден' });
    if (!fs.existsSync(destFolder) || !fs.statSync(destFolder).isDirectory()) {
      return res.status(404).json({ error: 'Папка назначения не найдена' });
    }
    const dest = path.join(destFolder, path.basename(target));
    if (dest === target) return res.status(400).json({ error: 'Источник и назначение совпадают' });
    // запрет переноса папки внутрь самой себя (рекурсивное копирование заблокирует диск)
    if ((dest + path.sep).startsWith(target + path.sep)) {
      return res.status(400).json({ error: 'Нельзя переместить папку внутрь самой себя' });
    }
    if (fs.existsSync(dest)) {
      return res.status(409).json({ error: `«${path.basename(target)}» уже существует в папке назначения` });
    }
    if (mode === 'copy') {
      fs.cpSync(target, dest, { recursive: true });
    } else {
      // rename не работает между разными точками монтирования — делаем копию+удаление
      try {
        fs.renameSync(target, dest);
      } catch (err: any) {
        if (err?.code === 'EXDEV') {
          fs.cpSync(target, dest, { recursive: true });
          fs.rmSync(target, { recursive: true });
        } else {
          throw err;
        }
      }
    }
    res.json({ ok: true });
  } catch (e: any) {
    console.error(`[Files/${mode === 'copy' ? 'Copy' : 'Move'}] Error:`, e?.message || e);
    res.status(500).json({ error: mode === 'copy' ? 'Ошибка копирования' : 'Ошибка перемещения', detail: e?.message });
  }
};

router.post('/copy', authMiddleware, async (req, res) => transferItem(req, res, 'copy'));
router.post('/move', authMiddleware, async (req, res) => transferItem(req, res, 'move'));

// === Контекстное меню вида «Две панели»: сжатие, распаковка, создание текстового файла ===

// Уникальный путь вида «имя (1).ext» / «имя (1)», если цель уже существует
const uniqueSiblingPath = (dir: string, name: string): string => {
  const target = path.join(dir, name);
  if (!fs.existsSync(target)) return target;
  const ext = path.extname(name);
  const base = path.basename(name, ext);
  let counter = 1;
  let candidate = path.join(dir, `${base} (${counter})${ext}`);
  while (fs.existsSync(candidate)) {
    counter++;
    candidate = path.join(dir, `${base} (${counter})${ext}`);
  }
  return candidate;
};

// Сжатие файла/папки: рядом с объектом создаётся <имя>.zip (автонумерация при коллизии)
router.post('/zip', authMiddleware, async (req, res) => {
  const tabKey = String(req.body?.tabKey || '');
  const itemPath = String(req.body?.path || '');
  const target = mutateTarget(req, res, tabKey, itemPath);
  if (!target) return;
  try {
    if (!fs.existsSync(target)) return res.status(404).json({ error: 'Объект не найден' });
    const destZip = uniqueSiblingPath(path.dirname(target), `${path.basename(target)}.zip`);
    const archive = new ZipArchive({ zlib: { level: 6 } });
    const output = fs.createWriteStream(destZip);
    await new Promise<void>((resolve, reject) => {
      output.on('close', () => resolve());
      output.on('error', reject);
      archive.on('error', reject);
      archive.pipe(output);
      if (fs.statSync(target).isDirectory()) {
        archive.directory(target, path.basename(target));
      } else {
        archive.file(target, { name: path.basename(target) });
      }
      archive.finalize();
    });
    res.status(201).json({ ok: true, name: path.basename(destZip) });
  } catch (e: any) {
    console.error('[Files/Zip] Error:', e?.message || e);
    try { const destZip = path.join(path.dirname(target), `${path.basename(target)}.zip`); if (fs.existsSync(destZip)) fs.rmSync(destZip, { force: true }); } catch {}
    res.status(500).json({ error: 'Ошибка сжатия в ZIP', detail: e?.message });
  }
});

// Распаковка .zip в папку с именем файла (без расширения); защита от zip-slip
router.post('/unzip', authMiddleware, async (req, res) => {
  const tabKey = String(req.body?.tabKey || '');
  const itemPath = String(req.body?.path || '');
  const target = mutateTarget(req, res, tabKey, itemPath);
  if (!target) return;
  try {
    if (!fs.existsSync(target) || !fs.statSync(target).isFile()) {
      return res.status(404).json({ error: 'Файл не найден' });
    }
    if (path.extname(target).toLowerCase() !== '.zip') {
      return res.status(400).json({ error: 'Распаковывать можно только ZIP-архивы' });
    }
    const destFolder = uniqueSiblingPath(path.dirname(target), path.basename(target, path.extname(target)));
    fs.mkdirSync(destFolder, { recursive: true });
    const zip = new AdmZip(target);
    let extracted = 0;
    let skipped = 0;
    for (const entry of zip.getEntries()) {
      if (entry.isDirectory) continue;
      // zip-slip защита: отсекаем записи, выходящие за пределы папки назначения
      const normalized = path.normalize(String(entry.entryName).replace(/\\/g, '/')).replace(/^(\.\.(\/|\\|$))+/, '');
      if (normalized.startsWith('..') || path.isAbsolute(normalized)) {
        skipped++;
        continue;
      }
      const destPath = path.join(destFolder, normalized);
      if (!destPath.startsWith(destFolder + path.sep)) {
        skipped++;
        continue;
      }
      fs.mkdirSync(path.dirname(destPath), { recursive: true });
      fs.writeFileSync(destPath, entry.getData());
      extracted++;
    }
    res.status(201).json({ ok: true, name: path.basename(destFolder), extracted, skipped });
  } catch (e: any) {
    console.error('[Files/Unzip] Error:', e?.message || e);
    res.status(500).json({ error: 'Ошибка распаковки ZIP', detail: e?.message });
  }
});

// Создание текстового файла (.txt) в папке панели
router.post('/create-file', authMiddleware, async (req, res) => {
  const tabKey = String(req.body?.tabKey || '');
  const folderPath = String(req.body?.path || '');
  let name = sanitizeName(req.body?.name);
  if (!name) return res.status(400).json({ error: 'Неверное имя файла' });
  if (!path.extname(name)) name += '.txt';
  const parent = mutateTarget(req, res, tabKey, folderPath, { allowRoot: true });
  if (!parent) return;
  try {
    if (!fs.existsSync(parent) || !fs.statSync(parent).isDirectory()) {
      return res.status(404).json({ error: 'Папка не найдена' });
    }
    const target = path.join(parent, name);
    if (fs.existsSync(target)) return res.status(409).json({ error: 'Файл с таким именем уже существует' });
    fs.writeFileSync(target, '');
    res.status(201).json({ ok: true, name });
  } catch (e: any) {
    console.error('[Files/CreateFile] Error:', e?.message || e);
    res.status(500).json({ error: 'Ошибка создания файла', detail: e?.message });
  }
});

// === Текстовый редактор TXT ===
const TEXT_FILE_LIMIT = 5 * 1024 * 1024;

// Чтение содержимого текстового файла (для редактора) — чтение разрешено и с read-only шар.
// Кодировка определяется автоматически, содержимое всегда отдаётся в UTF-8.
router.get('/text', authMiddleware, async (req, res) => {
  const tabKey = String(req.query.tab || '');
  const itemPath = String(req.query.path || '');
  const target = accessTarget(req, res, tabKey, itemPath);
  if (!target) return;
  try {
    if (!fs.existsSync(target) || !fs.statSync(target).isFile()) {
      return res.status(404).json({ error: 'Файл не найден' });
    }
    const buffer = fs.readFileSync(target);
    if (buffer.length > TEXT_FILE_LIMIT) {
      return res.status(413).json({ error: 'Файл слишком большой для редактирования (более 5 МБ)' });
    }
    // Детект кодировки: короткие файлы не детектируются надёжно — по умолчанию UTF-8
    let encoding = 'utf-8';
    if (buffer.length > 0) {
      const detected = jschardet.detect(buffer);
      const enc = String(detected?.encoding || '').toLowerCase();
      if (detected && detected.confidence >= 0.5 && iconv.encodingExists(enc) && enc !== 'ascii') {
        encoding = enc;
      }
    }
    const content = iconv.decode(buffer, encoding);
    res.json({ content, encoding });
  } catch (e: any) {
    console.error('[Files/TextRead] Error:', e?.message || e);
    res.status(500).json({ error: 'Ошибка чтения файла', detail: e?.message });
  }
});

// Сохранение содержимого текстового файла (мутирующая операция — нужна запись во вкладку).
// encoding — целевая кодировка (по умолчанию utf-8); исходную кодировку выбирает пользователь в редакторе.
router.put('/text', authMiddleware, async (req, res) => {
  const tabKey = String(req.body?.tabKey || '');
  const itemPath = String(req.body?.path || '');
  const target = mutateTarget(req, res, tabKey, itemPath);
  if (!target) return;
  const content = String(req.body?.content ?? '');
  const requestedEncoding = String(req.body?.encoding || 'utf-8').toLowerCase();
  const encoding = iconv.encodingExists(requestedEncoding) ? requestedEncoding : 'utf-8';
  if (Buffer.byteLength(content, 'utf8') > TEXT_FILE_LIMIT) {
    return res.status(413).json({ error: 'Содержимое слишком большое (более 5 МБ)' });
  }
  try {
    if (fs.existsSync(target) && fs.statSync(target).isDirectory()) {
      return res.status(400).json({ error: 'Это папка, а не файл' });
    }
    fs.writeFileSync(target, iconv.encode(content, encoding));
    res.json({ ok: true, size: Buffer.byteLength(content, 'utf8'), encoding });
  } catch (e: any) {
    console.error('[Files/TextWrite] Error:', e?.message || e);
    res.status(500).json({ error: 'Ошибка сохранения файла', detail: e?.message });
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
    setDownloadHeaders(res, filename);
    // Content-Length нужен мобильным браузерам (iOS Safari) для старта скачивания
    res.setHeader('Content-Length', String(fs.statSync(targetFile).size));
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
    res.setHeader('Cache-Control', 'no-transform');
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


// === Публичные ссылки «Поделиться» на файл/папку страницы «Файлы» ===
// Ссылка вида https://welans.click/s/<token> работает без входа, пока не истёк срок
// действия или доступ не отключён вручную. Путь на диске фиксируется на момент
// создания ссылки — файл можно перемещать между папками вкладки, ссылка не сломается,
// пока объект существует по прежнему абсолютному пути.
const SHARE_PUBLIC_BASE = 'https://welans.click/s';

const isShareActive = (share: { expiresAt: Date | null }) =>
  !share.expiresAt || share.expiresAt.getTime() > Date.now();

// Проверка прав на объект такая же, как у скачивания: вкладка «Система» — только admin
const shareTargetGuard = (req: any, tabKey: string): string | null | undefined => {
  const baseDir = resolveTabDir(tabKey);
  if (!baseDir) return null;
  if (tabKey === 'system' && req.user?.role !== 'admin') return undefined;
  return baseDir;
};

const parseExpiryHours = (raw: any): number | null => {
  if (raw === null || raw === undefined || raw === '') return null;
  const hours = Number(raw);
  return Number.isFinite(hours) && hours > 0 ? hours : null;
};

// Скачиваемые файлы уже имеют нужный размер и тип — запрещаем любое
// трансформирующее сжатие (gzip/brotli посредников и compression-мидлвари):
// оно убирает Content-Length и мешает мобильным загрузчикам
const setDownloadHeaders = (res: any, filename: string) => {
  res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`);
  res.setHeader('Content-Type', 'application/octet-stream');
  res.setHeader('Cache-Control', 'no-transform');
};

// Создание публичной ссылки (авторизованные пользователи)
// Создание публичной ссылки: авторизованные — любые вкладки; анонимы (welans.click) —
// только публичные вкладки, «Система» по-прежнему только для администраторов
router.post('/share', optionalAuthMiddleware, async (req, res) => {
  const tabKey = String(req.body?.tabKey || '');
  const filePath = String(req.body?.path || '');
  const isFolder = !!req.body?.isFolder;
  const baseDir = shareTargetGuard(req as any, tabKey);
  if (baseDir === null) return res.status(400).json({ error: 'Неверная вкладка' });
  if (baseDir === undefined) return res.status(403).json({ error: 'Доступ запрещен' });

  const target = resolveInside(baseDir, filePath);
  if (!target) return res.status(403).json({ error: 'Доступ запрещен' });

  try {
    if (!fs.existsSync(target)) return res.status(404).json({ error: 'Файл не найден' });
    if (fs.statSync(target).isDirectory() !== isFolder) {
      return res.status(400).json({ error: 'Тип объекта не совпадает' });
    }
    const hours = parseExpiryHours(req.body?.expiresInHours);
    const share = await prisma.fileShareLink.create({
      data: {
        token: randomBytes(24).toString('hex'),
        name: path.basename(target),
        diskPath: target,
        tabKey,
        filePath,
        isFolder,
        expiresAt: hours ? new Date(Date.now() + hours * 3600 * 1000) : null,
        createdById: (req as any).user?.id || null,
        createdByName: (req as any).user?.name || null,
      },
    });
    res.json({ id: share.id, url: `${SHARE_PUBLIC_BASE}/${share.token}`, expiresAt: share.expiresAt });
  } catch (e: any) {
    console.error('[Files/Share] Error creating share:', e?.message || e);
    res.status(500).json({ error: 'Ошибка создания ссылки', detail: e?.message });
  }
});

// Активная ссылка для объекта (чтобы не плодить дубликаты при повторном «Поделиться»)
router.get('/share/existing', optionalAuthMiddleware, async (req, res) => {
  const tabKey = String(req.query.tab || '');
  const filePath = String(req.query.path || '');
  const baseDir = shareTargetGuard(req as any, tabKey);
  if (baseDir === null) return res.status(400).json({ error: 'Неверная вкладка' });
  if (baseDir === undefined) return res.status(403).json({ error: 'Доступ запрещен' });

  const target = resolveInside(baseDir, filePath);
  if (!target) return res.status(403).json({ error: 'Доступ запрещен' });

  try {
    const share = await prisma.fileShareLink.findFirst({
      where: { diskPath: target, OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] },
      orderBy: { createdAt: 'desc' },
    });
    res.json(share
      ? { id: share.id, url: `${SHARE_PUBLIC_BASE}/${share.token}`, expiresAt: share.expiresAt, createdAt: share.createdAt }
      : null);
  } catch (e: any) {
    console.error('[Files/Share] Error loading share:', e?.message || e);
    res.status(500).json({ error: 'Ошибка загрузки ссылки', detail: e?.message });
  }
});

// Смена срока действия: null/0 — без ограничения, иначе — число часов от текущего момента
// Смена срока действия: создатель или admin; анонимно — только ссылки, созданные анонимно
// (welans.click: иначе посетитель не смог бы ограничить срок ссылки, которую только что сделал)
router.patch('/share/:id', optionalAuthMiddleware, async (req, res) => {
  try {
    const share = await prisma.fileShareLink.findUnique({ where: { id: req.params.id } });
    if (!share) return res.status(404).json({ error: 'Ссылка не найдена' });
    const user = (req as any).user;
    const anonymousOwns = !share.createdById && !user;
    if (!anonymousOwns && share.createdById !== user?.id && user?.role !== 'admin') {
      return res.status(403).json({ error: 'Доступ запрещен' });
    }
    const hours = parseExpiryHours(req.body?.expiresInHours);
    const updated = await prisma.fileShareLink.update({
      where: { id: share.id },
      data: { expiresAt: hours ? new Date(Date.now() + hours * 3600 * 1000) : null },
    });
    res.json({ id: updated.id, url: `${SHARE_PUBLIC_BASE}/${updated.token}`, expiresAt: updated.expiresAt });
  } catch (e: any) {
    console.error('[Files/Share] Error updating share:', e?.message || e);
    res.status(500).json({ error: 'Ошибка сохранения', detail: e?.message });
  }
});

// Отключение доступа (удаление ссылки)
router.delete('/share/:id', authMiddleware, async (req, res) => {
  try {
    const share = await prisma.fileShareLink.findUnique({ where: { id: req.params.id } });
    if (!share) return res.status(404).json({ error: 'Ссылка не найдена' });
    if (share.createdById !== (req as any).user?.id && (req as any).user?.role !== 'admin') {
      return res.status(403).json({ error: 'Доступ запрещен' });
    }
    await prisma.fileShareLink.delete({ where: { id: share.id } });
    res.json({ ok: true });
  } catch (e: any) {
    console.error('[Files/Share] Error deleting share:', e?.message || e);
    res.status(500).json({ error: 'Ошибка отключения доступа', detail: e?.message });
  }
});

// --- Публичная часть: без авторизации, только по валидному непросроченному токену ---

const loadPublicShare = async (req: any, res: any): Promise<any | null> => {
  const share = await prisma.fileShareLink.findUnique({ where: { token: req.params.token } });
  if (!share) {
    res.status(404).json({ error: 'Ссылка не найдена' });
    return null;
  }
  if (!isShareActive(share)) {
    res.status(410).json({ error: 'Срок действия ссылки истёк' });
    return null;
  }
  if (!fs.existsSync(share.diskPath)) {
    res.status(404).json({ error: 'Файл не найден' });
    return null;
  }
  return share;
};

router.get('/public-share/:token/meta', async (req, res) => {
  try {
    const share = await loadPublicShare(req, res);
    if (!share) return;
    res.json({ name: share.name, isFolder: share.isFolder, expiresAt: share.expiresAt });
  } catch (e: any) {
    console.error('[Files/Share] Error loading meta:', e?.message || e);
    res.status(500).json({ error: 'Ошибка загрузки', detail: e?.message });
  }
});

router.get('/public-share/:token/download', async (req, res) => {
  try {
    const share = await loadPublicShare(req, res);
    if (!share) return;
    // Файл по ссылке — скачивается сам; папка по ссылке — ?path= задаёт файл внутри неё
    let targetFile = share.diskPath;
    let relPath = share.filePath;
    if (share.isFolder) {
      const subPath = String(req.query.path || '');
      const resolved = resolveInside(share.diskPath, subPath);
      if (!resolved) return res.status(403).json({ error: 'Доступ запрещен' });
      targetFile = resolved;
      relPath = subPath ? `${share.filePath}/${subPath}` : share.filePath;
    }
    if (!fs.existsSync(targetFile) || fs.statSync(targetFile).isDirectory()) {
      return res.status(404).json({ error: 'Файл не найден' });
    }
    incrementDownloadCount(share.tabKey, relPath);
    setDownloadHeaders(res, path.basename(targetFile));
    // Поддержка Range (докачка) — для больших файлов на мобильных сетях
    const fileSize = fs.statSync(targetFile).size;
    res.setHeader('Accept-Ranges', 'bytes');
    const rangeHeader = String(req.headers.range || '');
    const rangeMatch = /^bytes=(\d*)-(\d*)$/.exec(rangeHeader.trim());
    let start = 0;
    let end = fileSize - 1;
    if (rangeMatch && (rangeMatch[1] || rangeMatch[2])) {
      if (rangeMatch[1]) start = parseInt(rangeMatch[1], 10);
      if (rangeMatch[2]) end = Math.min(parseInt(rangeMatch[2], 10), fileSize - 1);
      if (!rangeMatch[1] && rangeMatch[2]) start = Math.max(fileSize - parseInt(rangeMatch[2], 10), 0);
      if (start > end || start >= fileSize) {
        res.setHeader('Content-Range', `bytes */${fileSize}`);
        return res.status(416).end();
      }
      res.status(206);
      res.setHeader('Content-Range', `bytes ${start}-${end}/${fileSize}`);
    }
    // Content-Length нужен мобильным браузерам (iOS Safari) для старта скачивания
    res.setHeader('Content-Length', String(end - start + 1));
    const stream = fs.createReadStream(targetFile, { start, end });
    stream.on('error', (err) => {
      console.error('[Files/Share] Download stream error:', err);
      if (!res.headersSent) res.status(500).json({ error: 'Ошибка скачивания файла' });
      else if (!res.writableEnded) res.end();
    });
    res.on('close', () => stream.destroy());
    stream.pipe(res);
  } catch (e: any) {
    console.error('[Files/Share] Download error:', e?.message || e);
    if (!res.headersSent) res.status(500).json({ error: 'Ошибка скачивания' });
  }
});

// Содержимое расшаренной папки (subPath — относительно корня ссылки)
router.get('/public-share/:token/browse', async (req, res) => {
  try {
    const share = await loadPublicShare(req, res);
    if (!share) return;
    if (!share.isFolder) return res.status(400).json({ error: 'Это файл' });
    const subPath = String(req.query.path || '');
    const targetDir = resolveInside(share.diskPath, subPath);
    if (!targetDir) return res.status(403).json({ error: 'Доступ запрещен' });
    if (!fs.existsSync(targetDir) || !fs.statSync(targetDir).isDirectory()) {
      return res.status(404).json({ error: 'Папка не найдена' });
    }
    const items = fs.readdirSync(targetDir, { withFileTypes: true }).map(dirent => {
      const stat = fs.statSync(path.join(targetDir, dirent.name));
      return { name: dirent.name, isDirectory: dirent.isDirectory(), size: stat.size, updatedAt: stat.mtime };
    }).sort((a, b) => {
      if (a.isDirectory && !b.isDirectory) return -1;
      if (!a.isDirectory && b.isDirectory) return 1;
      return a.name.localeCompare(b.name, 'ru');
    });
    res.json({ items, currentPath: subPath });
  } catch (e: any) {
    console.error('[Files/Share] Browse error:', e?.message || e);
    res.status(500).json({ error: 'Ошибка чтения папки' });
  }
});

// Скачивание всей расшаренной папки (или подпапки внутри неё) архивом
router.get('/public-share/:token/download-folder', async (req, res) => {
  try {
    const share = await loadPublicShare(req, res);
    if (!share) return;
    if (!share.isFolder) return res.status(400).json({ error: 'Это файл' });
    const subPath = String(req.query.path || '');
    const targetDir = resolveInside(share.diskPath, subPath);
    if (!targetDir) return res.status(403).json({ error: 'Доступ запрещен' });
    if (!fs.existsSync(targetDir) || !fs.statSync(targetDir).isDirectory()) {
      return res.status(404).json({ error: 'Папка не найдена' });
    }
    const folderName = path.basename(targetDir);
    incrementDownloadCount(share.tabKey, subPath ? `${share.filePath}/${subPath}` : share.filePath);
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(folderName)}.zip`);
    res.setHeader('Cache-Control', 'no-transform');
    const archive = new ZipArchive({ zlib: { level: 6 } });
    archive.on('error', (err: any) => {
      console.error('[Files/Share] Archiver error:', err);
      if (!res.headersSent) res.status(500).json({ error: 'Ошибка архивации' });
      else if (!res.writableEnded) res.end();
    });
    archive.on('warning', (err: any) => console.warn('Archiver warning:', err));
    res.on('close', () => archive.abort());
    archive.pipe(res);
    archive.directory(targetDir, folderName);
    archive.finalize();
  } catch (e: any) {
    console.error('[Files/Share] Folder download error:', e?.message || e);
    if (!res.headersSent) res.status(500).json({ error: 'Ошибка архивации' });
  }
});

export default router;

