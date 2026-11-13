import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

const POSITIONS = ['left', 'right'];
const SIZES = ['small', 'medium', 'big'];

/**
 * GET /api/ad-blocks
 * Публичный список активных рекламных блоков для страницы новостей (по sortOrder)
 */
router.get('/', async (req, res) => {
  try {
    const blocks = await prisma.adBlock.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
    res.json(blocks);
  } catch (err: any) {
    console.error('[ad-blocks:list]', err);
    res.status(500).json({ error: err.message });
  }
});

router.use(authMiddleware);

/**
 * GET /api/ad-blocks/all
 * Все блоки (включая неактивные) — для админки
 */
router.get('/all', async (req, res) => {
  try {
    const blocks = await prisma.adBlock.findMany({
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
    res.json(blocks);
  } catch (err: any) {
    console.error('[ad-blocks:list-all]', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/ad-blocks
 * Создать рекламный блок
 */
router.post('/', async (req, res) => {
  try {
    const { title, imageUrl, linkUrl, position, size, sortOrder, isActive, images, intervalSec, isSticky } = req.body;
    if (!title?.trim()) return res.status(400).json({ error: 'Заголовок обязателен' });
    if (position && !POSITIONS.includes(position)) return res.status(400).json({ error: 'Некорректное размещение' });
    if (size && !SIZES.includes(size)) return res.status(400).json({ error: 'Некорректный размер блока' });
    // images — массив URL картинок для ротации; храним как JSON
    const imgs = Array.isArray(images) ? images.filter(u => typeof u === 'string' && u).slice(0, 20) : [];
    const block = await prisma.adBlock.create({
      data: {
        title: title.trim(),
        imageUrl: imgs[0] || imageUrl || null,
        images: imgs.length ? JSON.stringify(imgs) : null,
        linkUrl: linkUrl?.trim() || null,
        position: POSITIONS.includes(position) ? position : 'left',
        size: SIZES.includes(size) ? size : 'small',
        sortOrder: Number.isFinite(Number(sortOrder)) ? Number(sortOrder) : 0,
        isActive: isActive !== false,
        intervalSec: Number.isFinite(Number(intervalSec)) ? Math.min(120, Math.max(1, Number(intervalSec))) : 4,
        isSticky: !!isSticky,
      },
    });
    res.status(201).json(block);
  } catch (err: any) {
    console.error('[ad-blocks:create]', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * PATCH /api/ad-blocks/:id
 * Обновить рекламный блок
 */
router.patch('/:id', async (req, res) => {
  try {
    const existing = await prisma.adBlock.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ error: 'Блок не найден' });
    const { title, imageUrl, linkUrl, position, size, sortOrder, isActive, images, intervalSec, isSticky } = req.body;
    const data: any = {};
    if (title !== undefined) {
      if (!title.trim()) return res.status(400).json({ error: 'Заголовок не может быть пустым' });
      data.title = title.trim();
    }
    if (images !== undefined) {
      const imgs = Array.isArray(images) ? images.filter(u => typeof u === 'string' && u).slice(0, 20) : [];
      data.images = imgs.length ? JSON.stringify(imgs) : null;
      if (imgs.length) data.imageUrl = imgs[0];
    }
    if (imageUrl !== undefined) data.imageUrl = imageUrl || null;
    if (linkUrl !== undefined) data.linkUrl = linkUrl?.trim() || null;
    if (position !== undefined) {
      if (!POSITIONS.includes(position)) return res.status(400).json({ error: 'Некорректное размещение' });
      data.position = position;
    }
    if (size !== undefined) {
      if (!SIZES.includes(size)) return res.status(400).json({ error: 'Некорректный размер блока' });
      data.size = size;
    }
    if (sortOrder !== undefined && Number.isFinite(Number(sortOrder))) data.sortOrder = Number(sortOrder);
    if (isActive !== undefined) data.isActive = !!isActive;
    if (intervalSec !== undefined && Number.isFinite(Number(intervalSec))) data.intervalSec = Math.min(120, Math.max(1, Number(intervalSec)));
    if (isSticky !== undefined) data.isSticky = !!isSticky;
    const block = await prisma.adBlock.update({ where: { id: req.params.id }, data });
    res.json(block);
  } catch (err: any) {
    console.error('[ad-blocks:update]', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * DELETE /api/ad-blocks/:id
 * Удалить рекламный блок
 */
router.delete('/:id', async (req, res) => {
  try {
    const existing = await prisma.adBlock.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ error: 'Блок не найден' });
    await prisma.adBlock.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err: any) {
    console.error('[ad-blocks:delete]', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
