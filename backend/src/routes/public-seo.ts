import { Router } from 'express';
import { prisma } from '../lib/prisma.js';

const router = Router();

// Базовый адрес сайта: robots.txt и sitemap.xml предназначены для welans.ru
const SITE_URL = 'https://welans.ru';

// Экранирование спецсимволов XML (значения приходят из базы)
const escapeXml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

const formatDate = (date: Date) => date.toISOString().slice(0, 10);

// Публичный robots.txt: открыты витрина и новости, закрыты служебные разделы CRM
router.get('/robots.txt', (_req, res) => {
  res.type('text/plain').send(`User-agent: *
Allow: /
Disallow: /api/
Disallow: /login
Disallow: /org-login
Disallow: /register
Disallow: /forgot-password
Disallow: /reset-password
Disallow: /dashboard
Disallow: /tasks
Disallow: /mail
Disallow: /chat
Disallow: /settings
Disallow: /admin

Sitemap: ${SITE_URL}/sitemap.xml
`);
});

// Динамический sitemap.xml: генерируется из базы при каждом запросе,
// поэтому всегда актуален — новые новости попадают в него сразу после публикации
router.get('/sitemap.xml', async (_req, res) => {
  try {
    // Тот же набор публичных новостей, что и на страницах /<slug>/ (см. news.ts /public/:slug)
    const news = await prisma.news.findMany({
      where: {
        AND: [
          { isPublished: true },
          { OR: [{ externalId: { not: null } }, { id: { startsWith: 'rss_' } }] },
          { category: { slug: 'korotko-o-svezhem' } },
        ],
      },
      select: { id: true, slug: true, publishedAt: true, updatedAt: true, createdAt: true },
      orderBy: { publishedAt: 'desc' },
    });

    const urls: { loc: string; lastmod?: Date }[] = [
      // Статические страницы: главная (снимок старого сайта) и лента новостей
      { loc: `${SITE_URL}/` },
      { loc: `${SITE_URL}/news` },
      // Публичные новости на прежних адресах /<slug>/ (для старых записей — /<id>/, rss_<id>)
      ...news.map((item) => ({
        loc: `${SITE_URL}/${escapeXml(item.slug || item.id)}/`,
        lastmod: item.publishedAt || item.updatedAt || item.createdAt,
      })),
    ];

    const body = urls
      .map(
        (u) =>
          `  <url>\n    <loc>${u.loc}</loc>${
            u.lastmod ? `\n    <lastmod>${formatDate(u.lastmod)}</lastmod>` : ''
          }\n  </url>`
      )
      .join('\n');

    res
      .type('application/xml')
      // Кэширование запрещено: поисковик всегда получает свежую версию
      .set('Cache-Control', 'no-cache')
      .send(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`);
  } catch (err: any) {
    console.error('[seo:sitemap]', err);
    res.status(500).type('text/plain').send('Internal Server Error');
  }
});

export default router;
