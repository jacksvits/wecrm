import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

/**
 * GET /api/login-slides
 * Публичный список активных слайдов для левой панели страницы авторизации (по sortOrder).
 * Не требует авторизации — страница входа открытая.
 */
router.get('/', async (req, res) => {
  try {
    const slides = await prisma.loginSlide.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
    res.json(slides);
  } catch (err: any) {
    console.error('[login-slides:list]', err);
    res.status(500).json({ error: err.message });
  }
});

router.use(authMiddleware);

/**
 * GET /api/login-slides/all
 * Все слайды (включая неактивные) — для админки
 */
router.get('/all', async (req, res) => {
  try {
    const slides = await prisma.loginSlide.findMany({
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
    res.json(slides);
  } catch (err: any) {
    console.error('[login-slides:list-all]', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/login-slides
 * Создать слайд
 */
router.post('/', async (req, res) => {
  try {
    const { title, description, imageUrl, sortOrder, isActive } = req.body;
    if (!title?.trim()) return res.status(400).json({ error: 'Заголовок обязателен' });
    const slide = await prisma.loginSlide.create({
      data: {
        title: title.trim(),
        description: description || null,
        imageUrl: imageUrl || null,
        sortOrder: Number.isFinite(Number(sortOrder)) ? Number(sortOrder) : 0,
        isActive: isActive !== false,
      },
    });
    res.status(201).json(slide);
  } catch (err: any) {
    console.error('[login-slides:create]', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * PATCH /api/login-slides/:id
 * Обновить слайд
 */
router.patch('/:id', async (req, res) => {
  try {
    const existing = await prisma.loginSlide.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ error: 'Слайд не найден' });
    const { title, description, imageUrl, sortOrder, isActive } = req.body;
    const data: any = {};
    if (title !== undefined) {
      if (!title.trim()) return res.status(400).json({ error: 'Заголовок не может быть пустым' });
      data.title = title.trim();
    }
    if (description !== undefined) data.description = description || null;
    if (imageUrl !== undefined) data.imageUrl = imageUrl || null;
    if (sortOrder !== undefined && Number.isFinite(Number(sortOrder))) data.sortOrder = Number(sortOrder);
    if (isActive !== undefined) data.isActive = !!isActive;
    const slide = await prisma.loginSlide.update({ where: { id: req.params.id }, data });
    res.json(slide);
  } catch (err: any) {
    console.error('[login-slides:update]', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * DELETE /api/login-slides/:id
 * Удалить слайд
 */
router.delete('/:id', async (req, res) => {
  try {
    const existing = await prisma.loginSlide.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ error: 'Слайд не найден' });
    await prisma.loginSlide.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err: any) {
    console.error('[login-slides:delete]', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
