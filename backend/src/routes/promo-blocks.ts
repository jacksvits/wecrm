import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

const FORMATS = ['big', 'wide', 'square'];
const BUTTON_STYLES = ['green', 'blue']; // green — как кнопка «В резерв», blue — как кнопка «В корзину»

/**
 * GET /api/promo-blocks
 * Публичный список активных промо-блоков для витрины (по sortOrder)
 */
router.get('/', async (req, res) => {
  try {
    const blocks = await prisma.promoBlock.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
    res.json(blocks);
  } catch (err: any) {
    console.error('[promo-blocks:list]', err);
    res.status(500).json({ error: err.message });
  }
});

router.use(authMiddleware);

/**
 * GET /api/promo-blocks/all
 * Все блоки (включая неактивные) — для админки
 */
router.get('/all', async (req, res) => {
  try {
    const blocks = await prisma.promoBlock.findMany({
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
    res.json(blocks);
  } catch (err: any) {
    console.error('[promo-blocks:list-all]', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/promo-blocks
 * Создать промо-блок
 */
router.post('/', async (req, res) => {
  try {
    const { title, subtitle, imageUrl, buttonText, buttonStyle, categoryId, format, sortOrder, isActive } = req.body;
    if (!title?.trim()) return res.status(400).json({ error: 'Заголовок обязателен' });
    if (format && !FORMATS.includes(format)) return res.status(400).json({ error: 'Некорректный формат блока' });
    if (buttonStyle && !BUTTON_STYLES.includes(buttonStyle)) return res.status(400).json({ error: 'Некорректный стиль кнопки' });
    if (categoryId) {
      const cat = await prisma.productCategory.findUnique({ where: { id: categoryId } });
      if (!cat) return res.status(400).json({ error: 'Категория не найдена' });
    }
    const block = await prisma.promoBlock.create({
      data: {
        title: title.trim(),
        subtitle: subtitle?.trim() || null,
        imageUrl: imageUrl || null,
        buttonText: buttonText?.trim() || 'Подробнее',
        buttonStyle: BUTTON_STYLES.includes(buttonStyle) ? buttonStyle : 'blue',
        categoryId: categoryId || null,
        format: format || 'square',
        sortOrder: Number.isFinite(Number(sortOrder)) ? Number(sortOrder) : 0,
        isActive: isActive !== false,
      },
    });
    res.status(201).json(block);
  } catch (err: any) {
    console.error('[promo-blocks:create]', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * PATCH /api/promo-blocks/:id
 * Обновить промо-блок
 */
router.patch('/:id', async (req, res) => {
  try {
    const existing = await prisma.promoBlock.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ error: 'Блок не найден' });
    const { title, subtitle, imageUrl, buttonText, buttonStyle, categoryId, format, sortOrder, isActive } = req.body;
    const data: any = {};
    if (title !== undefined) {
      if (!title.trim()) return res.status(400).json({ error: 'Заголовок не может быть пустым' });
      data.title = title.trim();
    }
    if (subtitle !== undefined) data.subtitle = subtitle?.trim() || null;
    if (imageUrl !== undefined) data.imageUrl = imageUrl || null;
    if (buttonText !== undefined) data.buttonText = buttonText?.trim() || 'Подробнее';
    if (buttonStyle !== undefined) {
      if (!BUTTON_STYLES.includes(buttonStyle)) return res.status(400).json({ error: 'Некорректный стиль кнопки' });
      data.buttonStyle = buttonStyle;
    }
    if (categoryId !== undefined) {
      if (categoryId) {
        const cat = await prisma.productCategory.findUnique({ where: { id: categoryId } });
        if (!cat) return res.status(400).json({ error: 'Категория не найдена' });
      }
      data.categoryId = categoryId;
    }
    if (format !== undefined) {
      if (!FORMATS.includes(format)) return res.status(400).json({ error: 'Некорректный формат блока' });
      data.format = format;
    }
    if (sortOrder !== undefined && Number.isFinite(Number(sortOrder))) data.sortOrder = Number(sortOrder);
    if (isActive !== undefined) data.isActive = !!isActive;
    const block = await prisma.promoBlock.update({ where: { id: req.params.id }, data });
    res.json(block);
  } catch (err: any) {
    console.error('[promo-blocks:update]', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * DELETE /api/promo-blocks/:id
 * Удалить промо-блок
 */
router.delete('/:id', async (req, res) => {
  try {
    const existing = await prisma.promoBlock.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ error: 'Блок не найден' });
    await prisma.promoBlock.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err: any) {
    console.error('[promo-blocks:delete]', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
