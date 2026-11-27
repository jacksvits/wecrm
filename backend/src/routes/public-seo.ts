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

// Статические страницы: главная (снимок старого сайта), лента новостей и SEO-страницы категорий
router.get('/sitemap-static.xml', async (_req, res) => {
  try {
    const cats = await prisma.newsCategory.findMany({ select: { slug: true } });
    res
      .type('application/xml')
      .set('Cache-Control', 'no-cache')
      .send(
        urlSet([
          { loc: `${SITE_URL}/` },
          { loc: `${SITE_URL}/news` },
          ...cats.map((c) => ({ loc: `${SITE_URL}/news/category/${encodeURIComponent(c.slug)}` })),
        ])
      );
  } catch (err) {
    console.error('[seo:sitemap-static]', err);
    res
      .type('application/xml')
      .set('Cache-Control', 'no-cache')
      .send(urlSet([{ loc: `${SITE_URL}/` }, { loc: `${SITE_URL}/news` }]));
  }
});

// Яндекс.Турбо: RSS-фид новостей — https://welans.ru/turbo.xml (через nginx).
// Яндекс забирает фид и отдаёт новости в Турбо-формате; фид обязательно добавить
// в Вебмастере: «Турбо-страницы и RTF» → «Источники» → RSS-канал.
router.get('/turbo.xml', async (_req, res) => {
  try {
    const news = await prisma.news.findMany({
      where: publicNewsWhere,
      orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
      take: 100,
      select: { id: true, title: true, slug: true, summary: true, content: true, coverImage: true, publishedAt: true, createdAt: true, author: { select: { name: true } } },
    });

    // Контент Турбо-страниц: безопасная разметка, абсолютные https-ссылки и картинки
    const sanitize = (html: string) =>
      html
        .replace(/<script[\s\S]*?<\/script>/gi, '')
        .replace(/<style[\s\S]*?<\/style>/gi, '')
        .replace(/<iframe[\s\S]*?<\/iframe>/gi, '')
        .replace(/\son\w+="[^"]*"/gi, '')
        .replace(/(src|href)=("|')([^"']*)\2/gi, (_m: string, attr: string, q: string, url: string) => `${attr}=${q}${absoluteUrl(String(url)).replace(/^http:\/\//i, 'https://')}${q}`)
        .replace(/\]\]>/g, ']] >');

    const items = news.map((n) => {
      const link = `${SITE_URL}/${encodeURIComponent(n.slug || n.id)}/`;
      const body = sanitize(n.content || n.summary || '');
      const cover = n.coverImage ? absoluteUrl(n.coverImage).replace(/^http:\/\//i, 'https://') : null;
      return [
        '    <item turbo="true">',
        `      <title>${escapeHtml(n.title)}</title>`,
        `      <link>${escapeHtml(link)}</link>`,
        `      <pubDate>${(n.publishedAt || n.createdAt).toUTCString()}</pubDate>`,
        n.author?.name ? `      <author>${escapeHtml(n.author.name)}</author>` : '',
        cover ? `      <enclosure url="${escapeHtml(cover)}"/>` : '',
        `      <turbo:content><![CDATA[${cover ? `<img src="${escapeHtml(cover)}"/>` : ''}${body}]]></turbo:content>`,
        '    </item>',
      ].filter(Boolean).join('\n');
    }).join('\n');

    res
      .type('application/xml')
      .set('Cache-Control', 'no-cache')
      .send(
        `<?xml version="1.0" encoding="UTF-8"?>\n<rss xmlns:yandex="http://news.yandex.ru" xmlns:media="http://search.yahoo.com/mrss/" xmlns:turbo="http://turbo.yandex.ru" version="2.0">\n<channel>\n<title>WeLANS — новости</title>\n<link>${SITE_URL}/news</link>\n<description>Новости и статьи WeLANS — коротко о свежем</description>\n<language>ru</language>\n${items}\n</channel>\n</rss>`
      );
  } catch (err) {
    console.error('[seo:turbo]', err);
    res.status(502).type('text/plain').send('Bad Gateway');
  }
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
  // Schema.org JSON-LD (например NewsArticle для детальных страниц новостей)
  jsonLd?: Record<string, unknown>;
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
  if (meta.jsonLd) {
    tags.push(`<script type="application/ld+json">${JSON.stringify(meta.jsonLd).replace(/</g, '\\u003c')}</script>`);
  }
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
    select: { id: true, title: true, slug: true, summary: true, content: true, coverImage: true, publishedAt: true, updatedAt: true, author: { select: { name: true } } },
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
  const description = makeDescription(stripHtml(news.summary || '') || stripHtml(news.content));
  const canonical = `${SITE_URL}/${encodeURIComponent(news.slug || news.id)}/`;
  const meta: PageMeta = {
    title: `${news.title} — WeLANS`,
    description,
    canonical,
    ogType: 'article',
    ogImage: news.coverImage,
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'NewsArticle',
      headline: news.title,
      description,
      datePublished: news.publishedAt?.toISOString(),
      dateModified: (news.updatedAt || news.publishedAt)?.toISOString(),
      author: news.author?.name ? { '@type': 'Person', name: news.author.name } : { '@type': 'Organization', name: 'WeLANS' },
      publisher: { '@type': 'Organization', name: 'WeLANS', logo: { '@type': 'ImageObject', url: `${SITE_URL}/icon-512.png` } },
      mainEntityOfPage: { '@type': 'WebPage', '@id': canonical },
      ...(news.coverImage ? { image: [absoluteUrl(news.coverImage)] } : {}),
    },
  };
  newsMetaCache.set(idOrSlug, { meta, at: Date.now() });
  return meta;
}

// SEO-страницы категорий новостей: /news/category/<slug> (метатеги из категории)
const categoryMetaCache = new Map<string, { meta: PageMeta | null; at: number }>();

async function getCategoryMeta(slug: string): Promise<PageMeta | null> {
  const cached = categoryMetaCache.get(slug);
  if (cached && Date.now() - cached.at < NEWS_META_TTL_MS) return cached.meta;
  const cat = await prisma.newsCategory.findUnique({ where: { slug }, select: { name: true, slug: true } });
  const meta: PageMeta | null = cat
    ? {
        title: `${cat.name} — новости WeLANS`,
        description: `Новости и статьи раздела «${cat.name}»: кейсы внедрений, обновления сервиса и материалы для бизнеса.`,
        canonical: `${SITE_URL}/news/category/${encodeURIComponent(cat.slug)}`,
      }
    : null;
  categoryMetaCache.set(slug, { meta, at: Date.now() });
  return meta;
}

// Яндекс.Метрика: сниппет из настроек CRM (кэш 5 мин) — счётчик появляется на всех публичных страницах
let metrikaSnippet: string | null | undefined;
let metrikaSnippetAt = 0;

async function getMetrikaSnippet(): Promise<string | null> {
  if (metrikaSnippet !== undefined && Date.now() - metrikaSnippetAt < 5 * 60 * 1000) return metrikaSnippet;
  try {
    const s = await prisma.yandexMetrikaSettings.findUnique({ where: { id: 1 } });
    metrikaSnippet = s?.isActive && s.counterId
      ? [
          '<!-- Yandex.Metrika counter -->',
          '<script type="text/javascript">',
          '   (function(m,e,t,r,i,k,a){m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};',
          '   m[i].l=1*new Date();k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)})',
          '   (window, document, "script", "https://mc.yandex.ru/metrika/tag.js", "ym");',
          `   ym(${s.counterId}, "init", { clickmap: true, trackLinks: true, accurateTrackBounce: true, webvisor: true });`,
          '</script>',
          `<noscript><div><img src="https://mc.yandex.ru/watch/${s.counterId}" style="position:absolute; left:-9999px;" alt="" /></div></noscript>`,
          '<!-- /Yandex.Metrika counter -->',
        ].join('\n')
      : null;
  } catch {
    metrikaSnippet = null;
  }
  metrikaSnippetAt = Date.now();
  return metrikaSnippet;
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
// Честный 404: нераспознанный путь без расширения файла получает статус 404 и noindex —
// иначе поисковик копит «мягкие 404» (SPA-оболочка со статусом 200 на любой адрес).
router.use('/page', async (req, res) => {
  try {
    const original = req.originalUrl.replace(/^\/api\/seo\/page/, '') || '/';
    const path = original.split('?')[0];
    // Нормализация: /shop/ → /shop (кроме корня)
    const normalized = path.length > 1 && path.endsWith('/') ? path.slice(0, -1) : path;
    const segments = normalized.split('/').filter(Boolean);

    // Статические страницы SPA, существующие на welans.ru
    const staticPages = ['/shop', '/vitrine', '/offer', '/privacy', '/cookies', '/tariffs', '/register', '/presentation', '/org-login'];

    let meta: PageMeta | null = null;
    let notFound = false;
    if (segments.length === 1 && segments[0] === 'news') {
      meta = { title: NEWS_LIST_TITLE, description: NEWS_LIST_DESCRIPTION, canonical: `${SITE_URL}/news` };
    } else if (segments.length === 2 && segments[0] === 'news' && segments[1] !== 'public') {
      // /news/<id> — детальная новость; нет такой — честный 404
      meta = await getNewsMeta(decodeURIComponent(segments[1]));
      if (!meta) notFound = true;
    } else if (segments.length === 3 && segments[0] === 'news' && segments[1] === 'category') {
      // /news/category/<slug> — SEO-страница категории новостей; нет такой — честный 404
      meta = await getCategoryMeta(decodeURIComponent(segments[2]));
      if (!meta) notFound = true;
    } else if (segments.length === 1 && staticPages.includes(`/${segments[0]}`)) {
      meta = await getDefaultMeta(normalized);
    } else if (segments.length === 1) {
      // /<slug> — старые адреса новостей; нет такой новости — честный 404
      meta = await getNewsMeta(decodeURIComponent(segments[0]));
      if (!meta) notFound = true;
    } else if (normalized !== '/') {
      const lastSegment = normalized.split('/').pop() || '';
      // Файлы с расширением nginx отдаёт статикой напрямую (сюда — только страховка) — прежнее поведение;
      // многосегментный путь без расширения — таких страниц на сайте нет: 404
      if (!lastSegment.includes('.')) notFound = true;
    }

    if (notFound) {
      const html = await loadIndexHtml();
      let body = injectMeta(html, {
        title: 'Страница не найдена — WeLANS',
        description: 'Такой страницы нет на сайте WeLANS. Перейдите на главную страницу или в каталог.',
        canonical: SITE_URL,
      }).replace(
        '</head>',
        '<meta name="robots" content="noindex,follow">\n' +
          '<noscript><div style="max-width:560px;margin:80px auto;padding:0 16px;font-family:sans-serif;text-align:center"><h1>Страница не найдена</h1><p>Такой страницы нет на сайте WeLANS — возможно, ссылка устарела.</p><p><a href="/">На главную</a> · <a href="/shop">Каталог</a></p></div></noscript>\n</head>'
      );
      const metrika404 = await getMetrikaSnippet();
      if (metrika404) body = body.replace('</head>', `${metrika404}\n</head>`);
      return res.status(404).type('html').set('Cache-Control', 'no-cache').send(body);
    }

    if (!meta) meta = await getDefaultMeta(path);

    const html = await loadIndexHtml();
    let body = injectMeta(html, meta);
    const metrika = await getMetrikaSnippet();
    if (metrika) body = body.replace('</head>', `${metrika}\n</head>`);
    res
      .type('html')
      .set('Cache-Control', 'no-cache')
      .send(body);
  } catch (err) {
    console.error('[seo:page]', err);
    res.status(502).type('text/plain').send('Bad Gateway');
  }
});

export default router;
