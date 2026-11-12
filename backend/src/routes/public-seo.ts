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

// ---- Серверная подстановка метатегов в HTML публичных страниц (для поисковиков) ----
// Публичные страницы — SPA: без выполнения JS поисковый робот видел бы пустые метатеги.
// nginx welans.ru проксирует сюда страницы без расширения файла (/<slug>/, /news, /shop);
// backend забирает свежий index.html из frontend-контейнера и вписывает в <head>
// <title>, description, canonical и Open Graph конкретной страницы.

const FRONTEND_INTERNAL_URL = (process.env.FRONTEND_INTERNAL_URL || 'http://frontend').replace(/\/$/, '');

// Дефолты для welans.ru: совпадают со статической главной (снимок старого сайта)
const DEFAULT_SITE_TITLE = 'WeLANS - IT Consulting';
const DEFAULT_SITE_DESCRIPTION =
  'Мы помогаем трансформировать и использовать IT по всем направлениям. А так же сократить затраты и обеспечить безопасность вашего бизнеса';
const NEWS_LIST_TITLE = 'WeLANS - Новости';
const NEWS_LIST_DESCRIPTION =
  'Новости WeLANS — коротко о свежем: ИТ-консалтинг, инфраструктура, проекты и анонсы компании.';

// index.html фронтенда кэшируется в памяти: при деплое меняется редко,
// а запросов от роботов много. При ошибке сети используется протухший кэш.
const INDEX_HTML_TTL_MS = 60_000;
let indexHtmlCache: { html: string; at: number } | null = null;

async function loadIndexHtml(): Promise<string> {
  if (indexHtmlCache && Date.now() - indexHtmlCache.at < INDEX_HTML_TTL_MS) {
    return indexHtmlCache.html;
  }
  try {
    const r = await fetch(`${FRONTEND_INTERNAL_URL}/index.html`, { signal: AbortSignal.timeout(10000) });
    if (!r.ok) throw new Error(`frontend index.html: HTTP ${r.status}`);
    const html = await r.text();
    indexHtmlCache = { html, at: Date.now() };
    return html;
  } catch (err) {
    // Frontend недоступен (например, пересборка контейнера) — отдаём протухший кэш
    if (indexHtmlCache) {
      console.error('[seo:page] fetch index.html failed, serving stale cache', err);
      return indexHtmlCache.html;
    }
    throw err;
  }
}

// Очистка HTML-разметки без DOM (backend): скрипты/стили выбрасываем, теги — в пробелы
const stripHtml = (html: string) =>
  html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();

// Description по границе слова (рекомендация поисковиков ~150-160 символов)
const makeDescription = (text: string, max = 160) => {
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  const lastSpace = cut.lastIndexOf(' ');
  return `${cut.slice(0, lastSpace > 60 ? lastSpace : max).trimEnd()}…`;
};

const escapeHtml = (value: string) =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const absoluteUrl = (url: string) =>
  /^https?:\/\//i.test(url) ? url : `${SITE_URL}${url.startsWith('/') ? '' : '/'}${url}`;

type PageMeta = {
  title: string;
  description: string;
  canonical: string;
  ogType?: string;
  ogImage?: string | null;
};

// Вписывает метатеги в <head>: шаблонные description/canonical/og из index.html удаляются,
// чтобы не осталось дублей
function injectMeta(html: string, meta: PageMeta) {
  let out = html.replace(/<title>[\s\S]*?<\/title>/, `<title>${escapeHtml(meta.title)}</title>`);
  out = out
    .replace(/<meta\s+name="description"[^>]*\/?>/gi, '')
    .replace(/<meta\s+property="og:[^"]*"[^>]*\/?>/gi, '')
    .replace(/<link\s+rel="canonical"[^>]*\/?>/gi, '');
  const tags = [
    `<meta name="description" content="${escapeHtml(meta.description)}">`,
    `<link rel="canonical" href="${escapeHtml(meta.canonical)}">`,
    `<meta property="og:title" content="${escapeHtml(meta.title)}">`,
    `<meta property="og:description" content="${escapeHtml(meta.description)}">`,
    `<meta property="og:url" content="${escapeHtml(meta.canonical)}">`,
    `<meta property="og:type" content="${meta.ogType || 'website'}">`,
  ];
  if (meta.ogImage) tags.push(`<meta property="og:image" content="${escapeHtml(absoluteUrl(meta.ogImage))}">`);
  return out.replace('</head>', `${tags.join('\n')}\n</head>`);
}

// Поиск публичной новости по slug или id (набор — как в news.ts /public/:slug и sitemap)
async function findPublicNews(idOrSlug: string) {
  return prisma.news.findFirst({
    where: {
      AND: [
        { OR: [{ slug: idOrSlug }, { id: idOrSlug }] },
        publicNewsWhere,
      ],
    },
    select: { id: true, title: true, slug: true, summary: true, content: true, coverImage: true },
  });
}

// Кэш метатегов новостей (60 с) — роботы ходят пачками, базу на каждый запрос не дёргаем
const newsMetaCache = new Map<string, { meta: PageMeta; at: number }>();
const NEWS_META_TTL_MS = 60_000;

async function getNewsMeta(idOrSlug: string): Promise<PageMeta | null> {
  const cached = newsMetaCache.get(idOrSlug);
  if (cached && Date.now() - cached.at < NEWS_META_TTL_MS) return cached.meta;
  const news = await findPublicNews(idOrSlug);
  if (!news) return null;
  const meta: PageMeta = {
    title: `${news.title} — WeLANS`,
    description: makeDescription(stripHtml(news.summary || '') || stripHtml(news.content)),
    canonical: `${SITE_URL}/${encodeURIComponent(news.slug || news.id)}/`,
    ogType: 'article',
    ogImage: news.coverImage,
  };
  newsMetaCache.set(idOrSlug, { meta, at: Date.now() });
  return meta;
}

// Метатеги по умолчанию: из SEO-настроек тенанта, если заполнены, иначе дефолты welans.ru
async function getDefaultMeta(canonicalPath: string): Promise<PageMeta> {
  let title = '';
  let description = '';
  try {
    const settings = await prisma.seoSettings.findFirst();
    title = settings?.title || '';
    description = settings?.description || '';
  } catch (err) {
    console.error('[seo:page] seoSettings read failed', err);
  }
  return {
    title: title || DEFAULT_SITE_TITLE,
    description: description || DEFAULT_SITE_DESCRIPTION,
    canonical: `${SITE_URL}${canonicalPath === '/' ? '/' : canonicalPath}`,
  };
}

// Отдача публичной страницы с подставленными метатегами.
// nginx welans.ru: proxy_pass http://127.0.0.1:4000/api/seo/page$request_uri
router.use('/page', async (req, res) => {
  try {
    const original = req.originalUrl.replace(/^\/api\/seo\/page/, '') || '/';
    const path = original.split('?')[0];
    const segments = path.split('/').filter(Boolean);

    let meta: PageMeta | null = null;
    if (segments.length === 1 && segments[0] === 'news') {
      meta = { title: NEWS_LIST_TITLE, description: NEWS_LIST_DESCRIPTION, canonical: `${SITE_URL}/news` };
    } else if (
      segments.length === 1 ||
      (segments.length === 2 && segments[0] === 'news' && segments[1] !== 'public')
    ) {
      // /<slug>/ или /news/<id> — страница новости; нет такой — метатеги по умолчанию
      const idOrSlug = decodeURIComponent(segments.length === 1 ? segments[0] : segments[1]);
      meta = await getNewsMeta(idOrSlug);
    }
    if (!meta) meta = await getDefaultMeta(path);

    const html = await loadIndexHtml();
    res
      .type('html')
      .set('Cache-Control', 'no-cache')
      .send(injectMeta(html, meta));
  } catch (err) {
    console.error('[seo:page]', err);
    res.status(502).type('text/plain').send('Bad Gateway');
  }
});

export default router;
