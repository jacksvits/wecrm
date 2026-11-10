import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import { syncRssFeeds, isRssSyncRunning } from '../lib/rss-sync.js';
import { oldSitePool, ensureRssSchema } from '../lib/old-site.js';

// ===== Настройки плагина «Парсинг RSS» =====
// Механика и источники перенесены с плагина wprss_feed WordPress-сайта welans.ru.
const router = Router();
router.use(authMiddleware);

const adminOnly = (req: AuthRequest, res: any, next: any) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Требуются права администратора' });
  }
  next();
};
router.use(adminOnly);

// Источники по умолчанию — те же, что на старом сайте (wp_posts post_type='wprss_feed')
const DEFAULT_SOURCES = [
  { name: '3DNews — все новости сайта', url: 'https://3dnews.ru/news/rss/', siteUrl: 'https://3dnews.ru/', feedImage: 'https://3dnews.ru/assets/images/logo.png' },
  { name: '4pda', url: 'https://4pda.to/feed/rss/', siteUrl: 'https://4pda.to/', feedImage: null },
  { name: 'AndroidInsider', url: 'https://androidinsider.ru/feed', siteUrl: 'https://androidinsider.ru/', feedImage: 'https://androidinsider.ru/wp-content/uploads/2026/03/androidinsider-512-70x70.png' },
  { name: 'iPhones', url: 'https://www.iphones.ru/feed', siteUrl: 'https://www.iphones.ru/', feedImage: null },
];

const sourceSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Название источника обязательно'),
  url: z.string().url('Некорректный адрес ленты'),
  siteUrl: z.string().url().optional().nullable(),
  feedImage: z.string().optional().nullable(),
  isActive: z.boolean().default(true),
});

const settingsSchema = z.object({
  isActive: z.boolean(),
  autoSync: z.boolean().optional(),
  intervalMinutes: z.number().int().min(5).max(1440).optional(),
  maxItemsPerFeed: z.number().int().min(1).max(10000).optional(),
  limitPerImport: z.number().int().min(0).max(1000).optional(),
  uniqueTitles: z.boolean().optional(),
  sources: z.array(sourceSchema).max(50).optional(),
});

const CATEGORY_SLUG = 'korotko-o-svezhem';

async function collectStats(sourceIds: string[]) {
  const stats: { itemsTotal: number; perFeed: Record<string, number>; crmNews: number } = {
    itemsTotal: 0, perFeed: {}, crmNews: 0,
  };
  try {
    await ensureRssSchema();
    const db = oldSitePool();
    if (sourceIds.length) {
      const [rows] = await db.query(
        `SELECT feed_id, COUNT(*) AS n FROM rss_items WHERE feed_id IN (?) GROUP BY feed_id`,
        [sourceIds],
      );
      for (const row of rows as { feed_id: string; n: number }[]) {
        stats.perFeed[row.feed_id] = Number(row.n);
        stats.itemsTotal += Number(row.n);
      }
    }
  } catch {
    // old_site недоступна — статистика архива останется нулевой
  }
  try {
    const category = await prisma.newsCategory.findUnique({ where: { slug: CATEGORY_SLUG } });
    if (category) stats.crmNews = await prisma.news.count({ where: { categoryId: category.id } });
  } catch { /* ignore */ }
  return stats;
}

function settingsWithDefaults(s: any) {
  return {
    isActive: s?.isActive ?? false,
    autoSync: s?.autoSync ?? true,
    intervalMinutes: s?.intervalMinutes ?? 15,
    maxItemsPerFeed: s?.maxItemsPerFeed ?? 200,
    limitPerImport: s?.limitPerImport ?? 0,
    uniqueTitles: s?.uniqueTitles ?? true,
  };
}

// GET /api/rss-settings — настройки, источники и статистика
router.get('/', async (_req, res) => {
  try {
    const s = await prisma.rssSettings.findFirst({ include: { sources: { orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }] } } });
    const sources = s?.sources?.length
      ? s.sources
      : DEFAULT_SOURCES.map((d, i) => ({ id: `default_${i}`, ...d, isActive: true, sortOrder: i }));
    let lastSync: any = null;
    if (s?.lastSyncResult) {
      try { lastSync = JSON.parse(s.lastSyncResult); } catch { lastSync = null; }
    }
    const stats = await collectStats(sources.map((x: any) => x.id));
    res.json({
      ...settingsWithDefaults(s),
      sources,
      defaultsApplied: !s?.sources?.length,
      lastSyncAt: s?.lastSyncAt ?? null,
      lastSync,
      stats,
    });
  } catch (err: any) {
    console.error('[rss-settings] GET error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/rss-settings — сохранение настроек и списка источников
router.post('/', async (req: AuthRequest, res) => {
  try {
    const data = settingsSchema.parse(req.body);
    const existing = await prisma.rssSettings.findUnique({ where: { id: 1 } });
    const payload: any = {
      isActive: data.isActive,
      autoSync: data.autoSync ?? existing?.autoSync ?? true,
      intervalMinutes: data.intervalMinutes ?? existing?.intervalMinutes ?? 15,
      maxItemsPerFeed: data.maxItemsPerFeed ?? existing?.maxItemsPerFeed ?? 200,
      limitPerImport: data.limitPerImport ?? existing?.limitPerImport ?? 0,
      uniqueTitles: data.uniqueTitles ?? existing?.uniqueTitles ?? true,
    };
    const settings = await prisma.rssSettings.upsert({
      where: { id: 1 },
      update: payload,
      create: { id: 1, ...payload },
    });

    if (data.sources) {
      // Источники перезаписываются целиком (удалённых из списка больше нет)
      const incomingIds = data.sources.filter((x) => x.id && !x.id.startsWith('default_')).map((x) => x.id!);
      await prisma.rssSource.deleteMany({
        where: { settingsId: settings.id, ...(incomingIds.length ? { id: { notIn: incomingIds } } : {}) },
      });
      for (let i = 0; i < data.sources.length; i++) {
        const src = data.sources[i];
        const fields = {
          name: src.name.trim(),
          url: src.url.trim(),
          siteUrl: src.siteUrl?.trim() || null,
          feedImage: src.feedImage?.trim() || null,
          isActive: src.isActive,
          sortOrder: i,
        };
        if (src.id && !src.id.startsWith('default_')) {
          await prisma.rssSource.update({ where: { id: src.id }, data: fields });
        } else {
          await prisma.rssSource.create({ data: { ...fields, settingsId: settings.id } });
        }
      }
    }

    const full = await prisma.rssSettings.findUnique({ where: { id: 1 }, include: { sources: { orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }] } } });
    res.json({ ...settingsWithDefaults(full), sources: full?.sources ?? [] });
  } catch (err: any) {
    if (err?.code === 'P2002') return res.status(409).json({ error: 'Источник с таким адресом ленты уже существует' });
    res.status(400).json({ error: err.message });
  }
});

// DELETE /api/rss-settings — сброс настроек и источников плагина
router.delete('/', async (_req, res) => {
  await prisma.rssSource.deleteMany();
  await prisma.rssSettings.deleteMany();
  res.json({ success: true });
});

/**
 * POST /api/rss-settings/sync — обход лент прямо сейчас (как wprss_fetch_all_feeds_hook)
 */
router.post('/sync', async (_req, res) => {
  if (isRssSyncRunning()) {
    return res.status(409).json({ error: 'Синхронизация RSS уже выполняется' });
  }
  try {
    const summary = await syncRssFeeds();
    res.json(summary);
  } catch (err: any) {
    console.error('[rss-settings:sync]', err);
    res.status(400).json({ error: err.message });
  }
});

export default router;
