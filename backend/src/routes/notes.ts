import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();
router.use(authMiddleware);

/**
 * GET /api/notes
 * Получить заметки текущего пользователя с поиском
 */
router.get('/', async (req, res) => {
  try {
    const user = (req as any).user;
    const { q } = req.query;

    const where: any = { userId: user.id };

    if (q) {
      const searchTerm = q as string;
      where.OR = [
        { title: { contains: searchTerm, mode: 'insensitive' } },
        { content: { contains: searchTerm, mode: 'insensitive' } },
        { tags: { hasSome: [searchTerm] } },
      ];
    }

    const notes = await prisma.note.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
    });

    res.json(notes);
  } catch (err: any) {
    console.error('[notes:list]', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/notes/:id
 * Получить заметку по ID
 */
router.get('/:id', async (req, res) => {
  try {
    const user = (req as any).user;
    const note = await prisma.note.findUnique({
      where: { id: req.params.id },
    });

    if (!note) {
      return res.status(404).json({ error: 'Заметка не найдена' });
    }

    if (note.userId !== user.id) {
      return res.status(403).json({ error: 'Нет прав на просмотр' });
    }

    res.json(note);
  } catch (err: any) {
    console.error('[notes:get]', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/notes
 * Создать заметку
 */
router.post('/', async (req, res) => {
  try {
    const user = (req as any).user;
    const { title, content, color, tags } = req.body;

    if (!title?.trim()) {
      return res.status(400).json({ error: 'Заголовок обязателен' });
    }

    const note = await prisma.note.create({
      data: {
        title: title.trim(),
        content: content?.trim() || '',
        color: color || '#f0f0f0',
        tags: tags || [],
        userId: user.id,
      },
    });

    res.status(201).json(note);
  } catch (err: any) {
    console.error('[notes:create]', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * PATCH /api/notes/:id
 * Обновить заметку
 */
router.patch('/:id', async (req, res) => {
  try {
    const user = (req as any).user;
    const { title, content, color, tags } = req.body;

    const existing = await prisma.note.findUnique({
      where: { id: req.params.id },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Заметка не найдена' });
    }

    if (existing.userId !== user.id) {
      return res.status(403).json({ error: 'Нет прав на редактирование' });
    }

    const data: any = {};
    if (title !== undefined) data.title = title.trim();
    if (content !== undefined) data.content = content.trim();
    if (color !== undefined) data.color = color;
    if (tags !== undefined) data.tags = tags;

    const note = await prisma.note.update({
      where: { id: req.params.id },
      data,
    });

    res.json(note);
  } catch (err: any) {
    console.error('[notes:update]', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * DELETE /api/notes/:id
 * Удалить заметку
 */
router.delete('/:id', async (req, res) => {
  try {
    const user = (req as any).user;
    const existing = await prisma.note.findUnique({
      where: { id: req.params.id },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Заметка не найдена' });
    }

    if (existing.userId !== user.id) {
      return res.status(403).json({ error: 'Нет прав на удаление' });
    }

    await prisma.note.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err: any) {
    console.error('[notes:delete]', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
