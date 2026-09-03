import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();
router.use(authMiddleware);

/**
 * GET /api/news
 * Получить список новостей с пагинацией, фильтрацией и поиском
 * Query params: q, category, subcategory, tag, label, page, limit
 */
router.get('/', async (req, res) => {
  try {
    const {
      q,
      category,
      subcategory,
      tag,
      label,
      page = '1',
      limit = '12'
    } = req.query;

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const take = parseInt(limit as string);

    // Базовый where для опубликованных новостей
    const where: any = { isPublished: true };

    // Поиск по названию, описанию, контенту, меткам, тегам
    if (q) {
      const searchTerm = q as string;
      where.OR = [
        { title: { contains: searchTerm, mode: 'insensitive' } },
        { summary: { contains: searchTerm, mode: 'insensitive' } },
        { content: { contains: searchTerm, mode: 'insensitive' } },
        { labels: { hasSome: [searchTerm] } },
      ];
    }

    if (category) where.categoryId = category as string;
    if (subcategory) where.subcategoryId = subcategory as string;
    if (tag) where.tags = { some: { id: tag as string } };
    if (label) where.labels = { has: label as string };

    const [news, total] = await Promise.all([
      prisma.news.findMany({
        where,
        include: {
          author: { select: { id: true, name: true, avatar: true } },
          category: true,
          subcategory: true,
          tags: true,
        },
        orderBy: { publishedAt: 'desc' },
        skip,
        take,
      }),
      prisma.news.count({ where }),
    ]);

    res.json({
      news,
      total,
      pages: Math.ceil(total / take),
      page: parseInt(page as string),
    });
  } catch (err: any) {
    console.error('[news:list]', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/news/drafts
 * Получить черновики текущего пользователя
 */
router.get('/drafts', async (req, res) => {
  try {
    const user = (req as any).user;
    const news = await prisma.news.findMany({
      where: { authorId: user.id, isPublished: false },
      include: {
        author: { select: { id: true, name: true } },
        category: true,
        subcategory: true,
        tags: true,
      },
      orderBy: { updatedAt: 'desc' },
    });
    res.json(news);
  } catch (err: any) {
    console.error('[news:drafts]', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/news/:id
 * Получить новость по ID
 */
router.get('/:id', async (req, res) => {
  try {
    const news = await prisma.news.findUnique({
      where: { id: req.params.id },
      include: {
        author: { select: { id: true, name: true, avatar: true } },
        category: true,
        subcategory: true,
        tags: true,
        history: {
          orderBy: { createdAt: 'desc' },
          take: 50,
          select: {
            id: true,
            title: true,
            summary: true,
            content: true,
            labels: true,
            categoryId: true,
            subcategoryId: true,
            tagIds: true,
            coverImage: true,
            isPublished: true,
            editorName: true,
            createdAt: true,
          },
        },
      },
    });

    if (!news) {
      return res.status(404).json({ error: 'Новость не найдена' });
    }

    // Увеличиваем счётчик просмотров
    await prisma.news.update({
      where: { id: req.params.id },
      data: { views: { increment: 1 } },
    });

    res.json(news);
  } catch (err: any) {
    console.error('[news:get]', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/news
 * Создать новую новость
 */
router.post('/', async (req, res) => {
  try {
    const user = (req as any).user;
    const {
      title,
      slug,
      summary,
      content,
      coverImage,
      categoryId,
      subcategoryId,
      tagIds,
      labels,
      isPublished,
    } = req.body;

    if (!title?.trim()) {
      return res.status(400).json({ error: 'Заголовок обязателен' });
    }

    const generatedSlug = slug?.trim() || title.toLowerCase()
      .replace(/[^a-z0-9\u0400-\u04ff]+/g, '-')
      .replace(/^-|-$/g, '') + '-' + Date.now();

    const news = await prisma.news.create({
      data: {
        title: title.trim(),
        slug: generatedSlug,
        summary: summary?.trim() || null,
        content: content?.trim() || '',
        coverImage: coverImage?.trim() || null,
        isPublished: !!isPublished,
        publishedAt: isPublished ? new Date() : null,
        authorId: user.id,
        categoryId: categoryId || null,
        subcategoryId: subcategoryId || null,
        labels: labels || [],
        tags: tagIds?.length ? { connect: tagIds.map((id: string) => ({ id })) } : undefined,
      },
      include: {
        author: { select: { id: true, name: true, avatar: true } },
        category: true,
        subcategory: true,
        tags: true,
      },
    });

    // Записываем начальную версию в историю
    await prisma.newsHistory.create({
      data: {
        newsId: news.id,
        title: news.title,
        summary: news.summary,
        content: news.content,
        labels: news.labels,
        categoryId: news.categoryId,
        subcategoryId: news.subcategoryId,
        tagIds: tagIds || [],
        coverImage: news.coverImage,
        isPublished: news.isPublished,
        editorId: user.id,
        editorName: user.name || user.email,
      },
    });

    res.status(201).json(news);
  } catch (err: any) {
    console.error('[news:create]', err);
    if (err.code === 'P2002') {
      return res.status(409).json({ error: 'Новость с таким slug уже существует' });
    }
    res.status(500).json({ error: err.message });
  }
});

/**
 * PATCH /api/news/:id
 * Обновить новость + записать в историю
 */
router.patch('/:id', async (req, res) => {
  try {
    const user = (req as any).user;
    const {
      title,
      slug,
      summary,
      content,
      coverImage,
      categoryId,
      subcategoryId,
      tagIds,
      labels,
      isPublished,
    } = req.body;

    const existing = await prisma.news.findUnique({
      where: { id: req.params.id },
      include: { tags: true },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Новость не найдена' });
    }

    // Проверка прав: автор или админ
    if (existing.authorId !== user.id && user.role !== 'admin') {
      return res.status(403).json({ error: 'Нет прав на редактирование' });
    }

    const data: any = {};
    if (title !== undefined) data.title = title.trim();
    if (slug !== undefined) data.slug = slug.trim();
    if (summary !== undefined) data.summary = summary?.trim() || null;
    if (content !== undefined) data.content = content.trim();
    if (coverImage !== undefined) data.coverImage = coverImage?.trim() || null;
    if (categoryId !== undefined) data.categoryId = categoryId || null;
    if (subcategoryId !== undefined) data.subcategoryId = subcategoryId || null;
    if (labels !== undefined) data.labels = labels;
    if (isPublished !== undefined) {
      data.isPublished = !!isPublished;
      data.publishedAt = isPublished ? new Date() : null;
    }
    if (tagIds !== undefined) {
      data.tags = {
        set: tagIds.map((id: string) => ({ id })),
      };
    }

    const news = await prisma.news.update({
      where: { id: req.params.id },
      data,
      include: {
        author: { select: { id: true, name: true, avatar: true } },
        category: true,
        subcategory: true,
        tags: true,
      },
    });

    // Записываем изменение в историю
    await prisma.newsHistory.create({
      data: {
        newsId: news.id,
        title: news.title,
        summary: news.summary,
        content: news.content,
        labels: news.labels,
        categoryId: news.categoryId,
        subcategoryId: news.subcategoryId,
        tagIds: news.tags.map((t: any) => t.id),
        coverImage: news.coverImage,
        isPublished: news.isPublished,
        editorId: user.id,
        editorName: user.name || user.email,
      },
    });

    res.json(news);
  } catch (err: any) {
    console.error('[news:update]', err);
    if (err.code === 'P2002') {
      return res.status(409).json({ error: 'Новость с таким slug уже существует' });
    }
    res.status(500).json({ error: err.message });
  }
});

/**
 * DELETE /api/news/:id
 * Удалить новость
 */
router.delete('/:id', async (req, res) => {
  try {
    const user = (req as any).user;
    const existing = await prisma.news.findUnique({
      where: { id: req.params.id },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Новость не найдена' });
    }

    if (existing.authorId !== user.id && user.role !== 'admin') {
      return res.status(403).json({ error: 'Нет прав на удаление' });
    }

    await prisma.news.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err: any) {
    console.error('[news:delete]', err);
    res.status(500).json({ error: err.message });
  }
});

// ========== КАТЕГОРИИ ==========

/**
 * GET /api/news/categories/list
 * Получить все категории с подкатегориями
 */
router.get('/categories/list', async (_req, res) => {
  try {
    const categories = await prisma.newsCategory.findMany({
      include: { subcategories: { orderBy: { name: 'asc' } } },
      orderBy: { sortOrder: 'asc' },
    });
    res.json(categories);
  } catch (err: any) {
    console.error('[news:categories]', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/news/categories
 * Создать категорию
 */
router.post('/categories', async (req, res) => {
  try {
    const { name, slug, color, sortOrder } = req.body;
    if (!name?.trim() || !slug?.trim()) {
      return res.status(400).json({ error: 'Название и slug обязательны' });
    }
    const category = await prisma.newsCategory.create({
      data: {
        name: name.trim(),
        slug: slug.trim(),
        color: color || '#007AFF',
        sortOrder: sortOrder || 0,
      },
    });
    res.status(201).json(category);
  } catch (err: any) {
    console.error('[news:createCategory]', err);
    if (err.code === 'P2002') {
      return res.status(409).json({ error: 'Категория с таким slug уже существует' });
    }
    res.status(500).json({ error: err.message });
  }
});

/**
 * PATCH /api/news/categories/:id
 * Обновить категорию
 */
router.patch('/categories/:id', async (req, res) => {
  try {
    const { name, slug, color, sortOrder } = req.body;
    const category = await prisma.newsCategory.update({
      where: { id: req.params.id },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(slug !== undefined && { slug: slug.trim() }),
        ...(color !== undefined && { color }),
        ...(sortOrder !== undefined && { sortOrder }),
      },
    });
    res.json(category);
  } catch (err: any) {
    console.error('[news:updateCategory]', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * DELETE /api/news/categories/:id
 * Удалить категорию
 */
router.delete('/categories/:id', async (req, res) => {
  try {
    await prisma.newsCategory.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err: any) {
    console.error('[news:deleteCategory]', err);
    res.status(500).json({ error: err.message });
  }
});

// ========== ПОДКАТЕГОРИИ ==========

/**
 * POST /api/news/subcategories
 * Создать подкатегорию
 */
router.post('/subcategories', async (req, res) => {
  try {
    const { name, slug, categoryId } = req.body;
    if (!name?.trim() || !slug?.trim() || !categoryId) {
      return res.status(400).json({ error: 'Название, slug и категория обязательны' });
    }
    const subcategory = await prisma.newsSubcategory.create({
      data: {
        name: name.trim(),
        slug: slug.trim(),
        categoryId,
      },
    });
    res.status(201).json(subcategory);
  } catch (err: any) {
    console.error('[news:createSubcategory]', err);
    if (err.code === 'P2002') {
      return res.status(409).json({ error: 'Подкатегория с таким slug уже существует в этой категории' });
    }
    res.status(500).json({ error: err.message });
  }
});

/**
 * PATCH /api/news/subcategories/:id
 * Обновить подкатегорию
 */
router.patch('/subcategories/:id', async (req, res) => {
  try {
    const { name, slug, categoryId } = req.body;
    const subcategory = await prisma.newsSubcategory.update({
      where: { id: req.params.id },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(slug !== undefined && { slug: slug.trim() }),
        ...(categoryId !== undefined && { categoryId }),
      },
    });
    res.json(subcategory);
  } catch (err: any) {
    console.error('[news:updateSubcategory]', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * DELETE /api/news/subcategories/:id
 * Удалить подкатегорию
 */
router.delete('/subcategories/:id', async (req, res) => {
  try {
    await prisma.newsSubcategory.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err: any) {
    console.error('[news:deleteSubcategory]', err);
    res.status(500).json({ error: err.message });
  }
});

// ========== ТЕГИ ==========

/**
 * GET /api/news/tags/list
 * Получить все теги
 */
router.get('/tags/list', async (_req, res) => {
  try {
    const tags = await prisma.newsTag.findMany({
      orderBy: { name: 'asc' },
    });
    res.json(tags);
  } catch (err: any) {
    console.error('[news:tags]', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/news/tags
 * Создать тег
 */
router.post('/tags', async (req, res) => {
  try {
    const { name, slug, color } = req.body;
    if (!name?.trim() || !slug?.trim()) {
      return res.status(400).json({ error: 'Название и slug обязательны' });
    }
    const tag = await prisma.newsTag.create({
      data: {
        name: name.trim(),
        slug: slug.trim(),
        color: color || '#10b981',
      },
    });
    res.status(201).json(tag);
  } catch (err: any) {
    console.error('[news:createTag]', err);
    if (err.code === 'P2002') {
      return res.status(409).json({ error: 'Тег с таким названием или slug уже существует' });
    }
    res.status(500).json({ error: err.message });
  }
});

/**
 * PATCH /api/news/tags/:id
 * Обновить тег
 */
router.patch('/tags/:id', async (req, res) => {
  try {
    const { name, slug, color } = req.body;
    const tag = await prisma.newsTag.update({
      where: { id: req.params.id },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(slug !== undefined && { slug: slug.trim() }),
        ...(color !== undefined && { color }),
      },
    });
    res.json(tag);
  } catch (err: any) {
    console.error('[news:updateTag]', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * DELETE /api/news/tags/:id
 * Удалить тег
 */
router.delete('/tags/:id', async (req, res) => {
  try {
    await prisma.newsTag.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err: any) {
    console.error('[news:deleteTag]', err);
    res.status(500).json({ error: err.message });
  }
});

// ========== ИСТОРИЯ ==========

/**
 * GET /api/news/:id/history
 * Получить историю изменений новости
 */
router.get('/:id/history', async (req, res) => {
  try {
    const history = await prisma.newsHistory.findMany({
      where: { newsId: req.params.id },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    res.json(history);
  } catch (err: any) {
    console.error('[news:history]', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/news/:id/history/:historyId/restore
 * Восстановить версию из истории
 */
router.post('/:id/history/:historyId/restore', async (req, res) => {
  try {
    const user = (req as any).user;
    const historyEntry = await prisma.newsHistory.findUnique({
      where: { id: req.params.historyId },
    });

    if (!historyEntry || historyEntry.newsId !== req.params.id) {
      return res.status(404).json({ error: 'Версия не найдена' });
    }

    const existing = await prisma.news.findUnique({
      where: { id: req.params.id },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Новость не найдена' });
    }

    if (existing.authorId !== user.id && user.role !== 'admin') {
      return res.status(403).json({ error: 'Нет прав на восстановление' });
    }

    // Восстанавливаем данные из истории
    const news = await prisma.news.update({
      where: { id: req.params.id },
      data: {
        title: historyEntry.title,
        summary: historyEntry.summary,
        content: historyEntry.content,
        labels: historyEntry.labels,
        categoryId: historyEntry.categoryId,
        subcategoryId: historyEntry.subcategoryId,
        coverImage: historyEntry.coverImage,
        isPublished: historyEntry.isPublished,
        tags: {
          set: historyEntry.tagIds.map((id: string) => ({ id })),
        },
      },
      include: {
        author: { select: { id: true, name: true, avatar: true } },
        category: true,
        subcategory: true,
        tags: true,
      },
    });

    // Записываем факт восстановления в историю
    await prisma.newsHistory.create({
      data: {
        newsId: news.id,
        title: news.title,
        summary: news.summary,
        content: news.content,
        labels: news.labels,
        categoryId: news.categoryId,
        subcategoryId: news.subcategoryId,
        tagIds: historyEntry.tagIds,
        coverImage: news.coverImage,
        isPublished: news.isPublished,
        editorId: user.id,
        editorName: user.name || user.email,
      },
    });

    res.json(news);
  } catch (err: any) {
    console.error('[news:restore]', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
