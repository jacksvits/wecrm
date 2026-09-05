import { Router } from 'express';
import multer from 'multer';
import { randomUUID } from 'crypto';
import path from 'path';
import fs from 'fs';
import { prisma } from '../lib/prisma.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';

const router = Router();

const UPLOAD_DIR = '/app/uploads';
const COMMENTS_DIR = path.join(UPLOAD_DIR, 'comments');
const CHAT_DIR = path.join(UPLOAD_DIR, 'global_chat');
const TASKS_DIR = path.join(UPLOAD_DIR, 'tasks');

// Create directories on startup
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}
if (!fs.existsSync(COMMENTS_DIR)) {
  fs.mkdirSync(COMMENTS_DIR, { recursive: true });
}
if (!fs.existsSync(CHAT_DIR)) {
  fs.mkdirSync(CHAT_DIR, { recursive: true });
}
if (!fs.existsSync(TASKS_DIR)) {
  fs.mkdirSync(TASKS_DIR, { recursive: true });
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
    if (!entityType || !entityId) {
      console.log('[uploads] missing entityType or entityId');
      return res.status(400).json({ error: 'entityType и entityId обязательны' });
    }

    let filename = req.file.filename;
    let dbPath: string;

    // Determine subfolder by entityType
    if (entityType === 'comment') {
      // For comments, entityId at upload time is the taskId
      const task = await prisma.task.findUnique({ where: { id: entityId }, select: { ticketNumber: true } });
      const ticketNum = task?.ticketNumber ?? entityId;
      const taskDir = path.join(TASKS_DIR, String(ticketNum));
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
      dbPath = `/uploads/tasks/${ticketNum}/${finalName}`;
      filename = finalName;
    } else if (entityType === 'chat') {
      const srcPath = path.join(UPLOAD_DIR, filename);
      const destPath = path.join(CHAT_DIR, filename);
      if (fs.existsSync(srcPath)) {
        fs.renameSync(srcPath, destPath);
        console.log('[uploads] moved to global_chat:', destPath);
      }
      dbPath = `/uploads/global_chat/${filename}`;
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
    // Delete file from disk (resolve path by entityType)
    let filePath: string;
    if (attachment.entityType === 'comment') {
      const comment = await prisma.comment.findUnique({ where: { id: attachment.entityId }, select: { taskId: true } });
      const task = comment ? await prisma.task.findUnique({ where: { id: comment.taskId }, select: { ticketNumber: true } }) : null;
      const ticketNum = task?.ticketNumber;
      if (ticketNum) {
        filePath = path.join(TASKS_DIR, String(ticketNum), attachment.filename);
      } else {
        filePath = path.join(COMMENTS_DIR, attachment.filename);
      }
    } else if (attachment.entityType === 'chat') {
      filePath = path.join(CHAT_DIR, attachment.filename);
    } else {
      filePath = path.join(UPLOAD_DIR, attachment.filename);
    }
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
    let filePath: string;
    if (attachment.entityType === 'comment') {
      const comment = await prisma.comment.findUnique({ where: { id: attachment.entityId }, select: { taskId: true } });
      const task = comment ? await prisma.task.findUnique({ where: { id: comment.taskId }, select: { ticketNumber: true } }) : null;
      const ticketNum = task?.ticketNumber;
      if (ticketNum) {
        filePath = path.join(TASKS_DIR, String(ticketNum), attachment.filename);
      } else {
        filePath = path.join(COMMENTS_DIR, attachment.filename);
      }
    } else if (attachment.entityType === 'chat') {
      filePath = path.join(CHAT_DIR, attachment.filename);
    } else {
      filePath = path.join(UPLOAD_DIR, attachment.filename);
    }
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

export default router;
