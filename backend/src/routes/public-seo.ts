import { Router } from 'express';
import { prisma } from '../lib/prisma.js';

const router = Router();

// Базовый адрес сайта: robots.txt и sitemap.xml предназначены для welans.ru
const SITE_URL = 'https://welans.ru';

// Лимиты поисковиков на один файл sitemap: 50 000 ссылок и 10 МБ.
// Берём 25 000 ссылок на часть (~6-7 МБ) — с запасом по обоим лимитам.
const NEWS_PER_SITEMAP = 25000;

// Экранирование спецсимволов XML (значения приходят из базы)
const escapeXml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

const formatDate = (date: Date) => date.toISOString().slice(0, 10);

const urlSet = (urls: { loc: string; lastmod?: Date }[]) =>
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
    .map(
      (u) =>
        `  <url>\n    <loc>${u.loc}</loc>${
          u.lastmod ? `\n    <lastmod>${formatDate(u.lastmod)}</lastmod>` : ''
        }\n  </url>`
    )
    .join('\n')}\n</urlset>\n`;

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

// Тот же набор публичных новостей, что и на страницах /<slug>/ (см. news.ts /public/:slug)
const publicNewsWhere = {
  AND: [
    { isPublished: true },
    { OR: [{ externalId: { not: null } }, { id: { startsWith: 'rss_' } }] },
    { category: { slug: 'korotko-o-svezhem' } },
  ],
};

const newsToUrl = (item: { id: string; slug: string | null; publishedAt: Date | null; updatedAt: Date; createdAt: Date }) => ({
  // Публичные новости на прежних адресах /<slug>/ (для старых записей — /<id>/, rss_<id>)
  loc: `${SITE_URL}/${escapeXml(item.slug || item.id)}/`,
  lastmod: item.publishedAt || item.updatedAt || item.createdAt,
});

// Динамические sitemap: генерируются из базы при каждом запросе,
// поэтому всегда актуальны — новые новости попадают в них сразу после публикации.
// /sitemap.xml — индекс (лимит поисковиков 50k ссылок / 10 МБ на файл превышается),
// части: /sitemap-static.xml и /sitemap/news-<N>.xml

// Индекс sitemap: статические страницы + части новостей
router.get('/sitemap.xml', async (_req, res) => {
  try {
    const newsCount = await prisma.news.count({ where: publicNewsWhere });
    const parts = Math.max(1, Math.ceil(newsCount / NEWS_PER_SITEMAP));

    const sitemaps = [
      { loc: `${SITE_URL}/sitemap-static.xml` },
      ...Array.from({ length: parts }, (_, i) => ({ loc: `${SITE_URL}/sitemap/news-${i + 1}.xml` })),
    ];

    res
      .type('application/xml')
      // Кэширование запрещено: поисковик всегда получает свежую версию
      .set('Cache-Control', 'no-cache')
      .send(
        `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sitemaps
          .map((s) => `  <sitemap>\n    <loc>${s.loc}</loc>\n  </sitemap>`)
          .join('\n')}\n</sitemapindex>\n`
      );
  } catch (err: any) {
    console.error('[seo:sitemap-index]', err);
    res.status(500).type('text/plain').send('Internal Server Error');
  }
});

// Статические страницы: главная (снимок старого сайта) и лента новостей
router.get('/sitemap-static.xml', (_req, res) => {
  res
    .type('application/xml')
    .set('Cache-Control', 'no-cache')
    .send(urlSet([{ loc: `${SITE_URL}/` }, { loc: `${SITE_URL}/news` }]));
});

// Часть новостей: /sitemap/news-<N>.xml (N с 1)
router.get('/sitemap/news-:page.xml', async (req, res) => {
  try {
    const page = Number.parseInt(req.params.page, 10);
    if (!Number.isInteger(page) || page < 1) {
      return res.status(404).type('text/plain').send('Not Found');
    }

    const news = await prisma.news.findMany({
      where: publicNewsWhere,
      select: { id: true, slug: true, publishedAt: true, updatedAt: true, createdAt: true },
      orderBy: { publishedAt: 'desc' },
      skip: (page - 1) * NEWS_PER_SITEMAP,
      take: NEWS_PER_SITEMAP,
    });

    // Часть за пределами списка — ошибка (иначе поисковик кэширует пустой файл навсегда)
    if (news.length === 0) {
      return res.status(404).type('text/plain').send('Not Found');
    }

    res
      .type('application/xml')
      .set('Cache-Control', 'no-cache')
      .send(urlSet(news.map(newsToUrl)));
  } catch (err: any) {
    console.error('[seo:sitemap-news]', err);
    res.status(500).type('text/plain').send('Internal Server Error');
  }
});

export default router;
