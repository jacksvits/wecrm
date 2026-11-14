// Плагин «Парсинг RSS» — сбор новостей из новостной ленты Google по ключевым словам.
// У каждого тенанта свои ключевые слова (rss_settings.google_news_keywords):
// по каждому слову обходится публичный RSS-поиск Google News
//   https://news.google.com/rss/search?q=<слово>&hl=ru&gl=RU&ceid=RU:ru
// и найденные новости публикуются в новостную ленту CRM этого тенанта
// (категория «Новости Google»). Дедупликация: по ссылке и по заголовку —
// одна и та же статья под разными ключевыми словами приходит с разными
// редирект-ссылками Google, поэтому ссылок alone недостаточно.
import crypto from 'crypto';
import sanitizeHtml from 'sanitize-html';
import Parser from 'rss-parser';
import { prisma } from './prisma.js';
import { currentTenant } from './tenant.js';
import { translitSlug } from './rss-sync.js';

const CATEGORY_SLUG = 'novosti-google';
const CATEGORY_NAME = 'Новости Google';
const FEED_USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';
const MAX_KEYWORDS = 20;        // защита от опечаток-мегасписков
const MAX_ITEMS_PER_KEYWORD = 20; // Google отдаёт до ~100; публикуем верхние N
const MAX_ITEM_AGE_DAYS = 21;   // старое не тащим — только актуальная лента
const DEDUP_WINDOW_DAYS = 90;   // окно дедупликации по ссылкам/заголовкам тенанта

/** URL RSS-поиска Google News для ключевого слова (русский, регион RU) */
function googleNewsFeedUrl(keyword: string): string {
  return `https://news.google.com/rss/search?q=${encodeURIComponent(keyword)}&hl=ru&gl=RU&ceid=RU:ru`;
}

// Флаг «уже выполняется» — по тенантам: worker обходит организации параллельно
// в общем процессе, общий флаг заблокировал бы соседние тенанты
const runningTenants = new Set<string>();

function tenantSyncKey(): string {
  const t = currentTenant();
  return t ? (t.isMain ? 'main' : t.slug) : 'default';
}

export function isGoogleNewsSyncRunning(): boolean {
  return runningTenants.has(tenantSyncKey());
}

export interface GoogleNewsSyncSummary {
  keywords: number;   // обработано слов
  items: number;      // записей просмотрено
  created: number;    // новых новостей в ленте CRM тенанта
  skipped: number;    // дубликаты (ссылка/заголовок) и устаревшие
  failed: number;     // слов с ошибкой загрузки
  errors: string[];
  startedAt: string;
  finishedAt: string;
}

// Контент новости — HTML описания из ленты Google (ссылки на источники сохраняются)
const CONTENT_SANITIZE_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [
    'a', 'p', 'br', 'img', 'figure', 'figcaption', 'div', 'span',
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'ul', 'ol', 'li', 'blockquote', 'pre', 'code',
    'strong', 'b', 'em', 'i', 'u', 's', 'sub', 'sup',
    'table', 'thead', 'tbody', 'tfoot', 'tr', 'td', 'th', 'caption',
    'hr', 'small', 'mark', 'font',
  ],
  allowedAttributes: {
    a: ['href', 'title', 'target', 'rel'],
    img: ['src', 'srcset', 'alt', 'title', 'width', 'height', 'loading'],
    '*': ['class', 'color'],
  },
  allowedSchemes: ['http', 'https', 'data'],
};

function normalizeTitle(title: string): string {
  return title.toLowerCase().replace(/\s+/g, ' ').trim();
}

/** Ссылка Google News — редирект вида news.google.com/rss/articles/...; нормализуем хвост */
function normalizeUrl(url: string): string {
  return url.trim().replace(/\/+$/, '');
}

function stripHtml(html: string): string {
  return sanitizeHtml(html, { allowedTags: [], allowedAttributes: {} });
}

/** Парсинг списка ключевых слов из настройки (через запятую, без пустых и повторов) */
export function parseGoogleNewsKeywords(raw: string | null | undefined): string[] {
  if (!raw) return [];
  const seen = new Set<string>();
  const result: string[] = [];
  for (const part of raw.split(',')) {
    const word = part.trim().replace(/\s+/g, ' ');
    const key = word.toLowerCase();
    if (!word || seen.has(key)) continue;
    seen.add(key);
    result.push(word);
    if (result.length >= MAX_KEYWORDS) break;
  }
  return result;
}

/** Скачивает ленту текстом в UTF-8 (см. fetchFeedXml в rss-sync: rss-parser кодировки XML не учитывает) */
async function fetchFeedXml(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: { 'User-Agent': FEED_USER_AGENT, Accept: 'application/rss+xml, application/atom+xml, application/xml, text/xml, */*' },
    signal: AbortSignal.timeout(30_000),
    redirect: 'follow',
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  const head = buf.subarray(0, 300).toString('latin1');
  const enc = (head.match(/encoding=["']([a-zA-Z0-9._-]+)["']/i)?.[1] || 'utf-8').toLowerCase();
  try {
    return new TextDecoder(enc).decode(buf);
  } catch {
    return buf.toString('utf-8');
  }
}

/**
 * Обход ключевых слов тенанта и публикация новостей в его новостную ленту.
 * Идемпотентен: id новости детерминирован хешом ссылки Google,
 * повторный запуск не создаёт дублей.
 */
export async function syncGoogleNews(): Promise<GoogleNewsSyncSummary> {
  const tKey = tenantSyncKey();
  if (runningTenants.has(tKey)) throw new Error('Сбор новостей Google News уже выполняется');
  runningTenants.add(tKey);
  const startedAt = new Date();
  const summary: GoogleNewsSyncSummary = {
    keywords: 0, items: 0, created: 0, skipped: 0, failed: 0,
    errors: [], startedAt: startedAt.toISOString(), finishedAt: '',
  };
  try {
    const settings = await prisma.rssSettings.findFirst();
    const keywords = parseGoogleNewsKeywords(settings?.googleNewsKeywords);
    if (!settings || !keywords.length) {
      summary.finishedAt = new Date().toISOString();
      return summary;
    }

    // Автор новостей — первый администратор (как в rss-sync)
    const adminRole = await prisma.role.findFirst({ where: { name: 'admin' } });
    const author = adminRole
      ? await prisma.user.findFirst({ where: { roleId: adminRole.id }, orderBy: { id: 'asc' } })
      : null;
    if (!author) throw new Error('В CRM не найден администратор — автор новостей не определён');

    // Категория «Новости Google» — создаём при первом запуске тенанта
    const category = await prisma.newsCategory.upsert({
      where: { slug: CATEGORY_SLUG },
      update: { name: CATEGORY_NAME },
      create: { name: CATEGORY_NAME, slug: CATEGORY_SLUG, color: '#EA4335', sortOrder: 51 },
    });

    // Уже известные ссылки и заголовки ленты тенанта (дедупликация в окне DEDUP_WINDOW_DAYS)
    const windowStart = new Date(Date.now() - DEDUP_WINDOW_DAYS * 24 * 60 * 60 * 1000);
    const existing = await prisma.news.findMany({
      where: { OR: [{ createdAt: { gte: windowStart } }, { publishedAt: { gte: windowStart } }], },
      select: { title: true, sourceUrl: true },
    });
    const knownTitles = new Set(existing.map((n) => normalizeTitle(n.title)));
    const knownUrls = new Set(existing.map((n) => normalizeUrl(n.sourceUrl ?? '')).filter(Boolean));

    const maxAgeMs = MAX_ITEM_AGE_DAYS * 24 * 60 * 60 * 1000;
    const parser = new Parser({ timeout: 30_000 });

    for (const keyword of keywords) {
      let feed;
      try {
        feed = await parser.parseString(await fetchFeedXml(googleNewsFeedUrl(keyword)));
      } catch (e: any) {
        summary.failed += 1;
        summary.errors.push(`${keyword}: ${e?.message || e}`);
        continue;
      }
      summary.keywords += 1;

      let createdForKeyword = 0;
      for (const item of feed.items ?? []) {
        if (createdForKeyword >= MAX_ITEMS_PER_KEYWORD) break;
        const title = (item.title || '').trim();
        const link = (item.link || item.guid || '').trim();
        if (!title || !link) continue;
        summary.items += 1;
        const publishedAt = item.isoDate ? new Date(item.isoDate) : null;
        // Устаревшие не публикуем — иначе первый обход зальёт ленту старыми новостями
        if (publishedAt && Date.now() - publishedAt.getTime() > maxAgeMs) { summary.skipped += 1; continue; }
        if (knownUrls.has(normalizeUrl(link))) { summary.skipped += 1; continue; }
        const normTitle = normalizeTitle(title);
        if (knownTitles.has(normTitle)) { summary.skipped += 1; continue; }

        const rawContent = String(item.contentSnippet || item.content || '');
        const content = sanitizeHtml(rawContent, CONTENT_SANITIZE_OPTIONS);
        const summaryText = stripHtml(content).replace(/\s+/g, ' ').trim().slice(0, 500) || null;

        // id детерминирован от ссылки Google — повторы невозможны даже при сбое флага
        const newsId = `gnews_${crypto.createHash('sha256').update(link, 'utf8').digest('hex').slice(0, 24)}`;
        const datePart = (publishedAt || new Date()).toISOString().slice(0, 10).replace(/-/g, '');
        const baseSlug = translitSlug(title) || `gnews-${datePart}-${newsId.slice(-8)}`;
        let newsSlug = baseSlug;
        for (let n = 2; await prisma.news.findFirst({ where: { slug: newsSlug }, select: { id: true } }); n += 1) {
          newsSlug = `${baseSlug}-${n}`;
        }
        try {
          await prisma.news.create({
            data: {
              id: newsId,
              title,
              slug: newsSlug,
              summary: summaryText,
              content,
              coverImage: null, // у Google News RSS нет картинок; og:image не тянем (лишние N×20 запросов)
              sourceUrl: link,
              isPublished: true,
              publishedAt: publishedAt || new Date(),
              authorId: author.id,
              categoryId: category.id,
            },
          });
        } catch (e: any) {
          // Конфликт уникальности — новость уже есть, пропускаем
          if (e?.code !== 'P2002') throw e;
        }
        knownUrls.add(normalizeUrl(link));
        knownTitles.add(normTitle);
        summary.created += 1;
        createdForKeyword += 1;
      }
    }

    summary.finishedAt = new Date().toISOString();
    await prisma.rssSettings.update({
      where: { id: settings.id },
      data: { lastGoogleNewsSyncAt: new Date(), lastGoogleNewsSyncResult: JSON.stringify(summary) },
    });
    return summary;
  } finally {
    runningTenants.delete(tKey);
  }
}
