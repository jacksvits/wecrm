import { Router } from 'express';
import multer from 'multer';
import { randomUUID } from 'crypto';
import path from 'path';
import fs from 'fs';
import { prisma } from '../lib/prisma.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import { uploadsRoot, tenantUploadPrefix, pinTenantContext } from '../lib/tenant.js';

const router = Router();

const UPLOAD_DIR = '/app/uploads';
// Файлы tenant'ов изолированы префиксом /t-<slug> (см. uploadsRoot в lib/tenant.ts)

// Create directories on startup
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Multer saves all files to temp directory (uploads root),
// then in POST handler we move to subfolder by entityType
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (_req, file, cb) => {
    const originalName = Buffer.from(file.originalname, 'latin1').toString('utf8');
    const sanitized = originalName.replace(/[<>:"\/\\|?*\x00-\x1f]/g, '_').replace(/\s+/g, ' ').trim();
    cb(null, sanitized || `${randomUUID()}${path.extname(originalName)}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 * 1024 }, // 2 GB
  fileFilter: (_req, file, cb) => {
    cb(null, true);
  },
});

// Upload file
router.post('/', authMiddleware, upload.single('file'), async (req: AuthRequest, res) => {
  console.log('[uploads] POST hit — req.file:', req.file?.originalname, 'body:', req.body);
  try {
    if (!req.file) {
      console.log('[uploads] no file in request');
      return res.status(400).json({ error: 'Файл не загружен' });
    }
    const { entityType, entityId } = req.body;
    const tenantRoot = uploadsRoot();
    const tasksRoot = path.join(tenantRoot, 'tasks');
    const chatRoot = path.join(tenantRoot, 'global_chat');
    const tenantPfx = tenantUploadPrefix();
    if (!entityType || !entityId) {
      console.log('[uploads] missing entityType or entityId');
      return res.status(400).json({ error: 'entityType и entityId обязательны' });
    }

    let filename = req.file.filename;
    let dbPath: string;

    // Determine subfolder by entityType
    if (entityType === 'comment') {
      // For comments, entityId at upload time is the taskId
      // Доступ к загрузке = доступ к задаче (админ, создатель, исполнители, кураторы)
      const task = await prisma.task.findUnique({
        where: { id: entityId },
        select: {
          ticketNumber: true,
          creatorId: true,
          assignees: { select: { userId: true } },
          curators: { select: { userId: true } },
        },
      });
      const userId = req.user!.id;
      const hasAccess = req.user!.role === 'admin' ||
        !!task && (
          task.creatorId === userId ||
          task.assignees.some(a => a.userId === userId) ||
          task.curators.some(c => c.userId === userId)
        );
      if (!hasAccess) {
        // Удаляем уже принятый multer-файл, чтобы не копить мусор в /app/uploads
        const tmpPath = path.join(UPLOAD_DIR, req.file.filename);
        if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath);
        return res.status(403).json({ error: 'Доступ запрещен' });
      }
      const ticketNum = task?.ticketNumber ?? entityId;
      const taskDir = path.join(tasksRoot, String(ticketNum));
      if (!fs.existsSync(taskDir)) {
        fs.mkdirSync(taskDir, { recursive: true });
      }
      const srcPath = path.join(UPLOAD_DIR, filename);
      // Resolve duplicate name in target directory
      let finalName = filename;
      if (fs.existsSync(path.join(taskDir, finalName))) {
        const ext = path.extname(filename);
        const base = path.basename(filename, ext);
        let counter = 1;
        do { finalName = `${base} (${counter})${ext}`; counter++; } while (fs.existsSync(path.join(taskDir, finalName)));
      }
      const destPath = path.join(taskDir, finalName);
      if (fs.existsSync(srcPath)) {
        fs.renameSync(srcPath, destPath);
        console.log('[uploads] moved to tasks:', destPath);
      }
      dbPath = `/uploads${tenantPfx}/tasks/${ticketNum}/${finalName}`;
      filename = finalName;
    } else if (entityType === 'chat') {
      // Видеокружочки (как в Telegram) храним в отдельной подпапке video_notes —
      // фронтенд отличает их по path и рисует круглыми
      const isVideoNote = req.body.kind === 'video_note';
      const targetDir = isVideoNote ? path.join(chatRoot, 'video_notes') : chatRoot;
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }
      const srcPath = path.join(UPLOAD_DIR, filename);
      const destPath = path.join(targetDir, filename);
      if (fs.existsSync(srcPath)) {
        fs.renameSync(srcPath, destPath);
        console.log('[uploads] moved to', isVideoNote ? 'video_notes' : 'global_chat', ':', destPath);
      }
      dbPath = `/uploads${tenantPfx}/global_chat${isVideoNote ? '/video_notes' : ''}/${filename}`;
    } else {
      dbPath = `/uploads/${filename}`;
    }

    const attachment = await prisma.fileAttachment.create({
      data: {
        filename,
        originalName: Buffer.from(req.file.originalname, 'latin1').toString('utf8'),
        mimeType: req.file.mimetype,
        size: req.file.size,
        path: dbPath,
        entityType,
        entityId,
        authorId: req.user!.id,
      },
      include: {
        author: { select: { id: true, name: true, avatar: true } },
      },
    });
    console.log('[uploads] success:', attachment.id, 'path:', dbPath);
    res.status(201).json(attachment);
  } catch (err: any) {
    console.error('[uploads] CRASH:', err.message, err.stack);
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

// Get attachments by entity
router.get('/', async (req, res) => {
  const { entityType, entityId } = req.query;
  if (!entityType || !entityId) {
    return res.status(400).json({ error: 'entityType и entityId обязательны' });
  }
  try {
    const attachments = await prisma.fileAttachment.findMany({
      where: { entityType: entityType as string, entityId: entityId as string },
      include: {
        author: { select: { id: true, name: true, avatar: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
    res.json(attachments);
  } catch (err: any) {
    console.error('[uploads] GET error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Delete attachment
router.delete('/:id', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const attachment = await prisma.fileAttachment.findUnique({
      where: { id: req.params.id },
    });
    if (!attachment) {
      return res.status(404).json({ error: 'Вложение не найдено' });
    }
    if (attachment.authorId !== req.user!.id) {
      return res.status(403).json({ error: 'Нет прав на удаление' });
    }
    // Delete file from disk: URL-путь из БД содержит положение файла (с префиксом tenant'а)
    const filePath = '/app' + attachment.path;
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log('[uploads] deleted file:', filePath);
    }
    await prisma.fileAttachment.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err: any) {
    console.error('[uploads] DELETE error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Download file by ID
router.get('/:id/download', async (req, res) => {
  try {
    const attachment = await prisma.fileAttachment.findUnique({
      where: { id: req.params.id },
    });
    if (!attachment) {
      return res.status(404).json({ error: 'Вложение не найдено' });
    }
    // URL-путь из БД содержит положение файла (с префиксом tenant'а)
    const filePath = '/app' + attachment.path;
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Файл не найден на диске' });
    }
    const asciiName = attachment.originalName.replace(/[^\x20-\x7E]/g, '_');
    const utf8Name = encodeURIComponent(attachment.originalName);
    res.setHeader('Content-Disposition', `attachment; filename="${asciiName}"; filename*=UTF-8''${utf8Name}`);
    res.setHeader('Content-Type', attachment.mimeType || 'application/octet-stream');
    res.setHeader('Content-Length', attachment.size);
    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
  } catch (err: any) {
    console.error('[uploads] DOWNLOAD error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Update entityId (for binding to chat messages)
router.patch('/:id/entity', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const attachment = await prisma.fileAttachment.findUnique({
      where: { id: req.params.id },
    });
    if (!attachment) {
      return res.status(404).json({ error: 'Вложение не найдено' });
    }
    if (attachment.authorId !== req.user!.id) {
      return res.status(403).json({ error: 'Нет прав на изменение' });
    }
    const { entityId } = req.body;
    if (!entityId) {
      return res.status(400).json({ error: 'entityId обязателен' });
    }
    const updated = await prisma.fileAttachment.update({
      where: { id: req.params.id },
      data: { entityId },
    });
    res.json(updated);
  } catch (err: any) {
    console.error('[uploads] PATCH entity error:', err.message);
    res.status(500).json({ error: err.message });
  }
});


// Явно «прикалываем» контекст tenant'а (по Host) ко всем обработчикам роутера —
// защита от молчаливой потери AsyncLocalStorage-контекста при загрузке файлов
// (инцидент 27.10.2026: брендинг tenant'а записывался в главную организацию).
pinTenantContext(router);
export default router;
