// Плагин «Парсинг RSS» — перенос механики WP RSS Aggregator (wprss_feed) в CRM.
// Что копируем со старого сайта welans.ru:
//  - источники RSS (wprss_feed: название, адрес ленты, сайт, логотип, active/paused);
//  - расписание: обход всех лент каждые N минут (на старом сайте fifteen_min = 15);
//  - дедупликацию по permalink и уникальности заголовков (unique_titles);
//  - лимит хранимых items на источник (limit_feed_items_db = 200).
// Новости пишутся в две базы:
//  - архивная MySQL old_site (таблицы rss_feeds / rss_items);
//  - CRM (Postgres): категория «Коротко о свежем», sourceUrl = permalink оригинала
//    (wprss_item_permalink), обложка = enclosure ленты (wprss_item_enclosure),
//    контент = HTML ленты целиком, со ссылками на картинки источника.
import crypto from 'crypto';
import sanitizeHtml from 'sanitize-html';
import Parser from 'rss-parser';
import { prisma } from './prisma.js';
import { oldSitePool, ensureRssSchema } from './old-site.js';

const CATEGORY_SLUG = 'korotko-o-svezhem';
const CATEGORY_NAME = 'Коротко о свежем';
// Браузерный User-Agent: часть лент (4pda) отдаёт ошибки на «пустой» UA
const FEED_USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

let syncRunning = false;
export function isRssSyncRunning(): boolean {
  return syncRunning;
}

export interface RssSyncSummary {
  feeds: number;      // обработано лент
  items: number;      // записей просмотрено во всех лентах
  created: number;    // новых новостей (old_site + CRM)
  skipped: number;    // дубликаты (permalink/заголовок)
  failed: number;     // лент с ошибкой
  errors: string[];
  startedAt: string;
  finishedAt: string;
}

// HTML новости хранится целиком (со ссылками на картинки источника), но без
// скриптов/iframe — контент рендерится в CRM как есть.
const CONTENT_SANITIZE_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [
    'a', 'p', 'br', 'img', 'figure', 'figcaption', 'div', 'span',
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'ul', 'ol', 'li', 'blockquote', 'pre', 'code',
    'strong', 'b', 'em', 'i', 'u', 's', 'sub', 'sup',
    'table', 'thead', 'tbody', 'tfoot', 'tr', 'td', 'th', 'caption',
    'hr', 'small', 'mark',
  ],
  allowedAttributes: {
    a: ['href', 'title', 'target', 'rel'],
    img: ['src', 'srcset', 'alt', 'title', 'width', 'height', 'loading'],
    '*': ['class'],
  },
  allowedSchemes: ['http', 'https', 'data'],
};

function sha256(value: string): string {
  return crypto.createHash('sha256').update(value, 'utf8').digest('hex');
}

function stripHtml(html: string): string {
  return sanitizeHtml(html, { allowedTags: [], allowedAttributes: {} });
}

function firstImageFromHtml(html: string): string | null {
  const match = html.match(/<img[^>]+src=["']([^"']+)["']/i);
  return match ? match[1] : null;
}

function parseFeedDate(value?: string): Date | null {
  if (!value) return null;
  const ts = Date.parse(value);
  return Number.isNaN(ts) ? null : new Date(ts);
}

function normalizeTitle(title: string): string {
  return title.toLowerCase().replace(/\s+/g, ' ').trim();
}

/** Публичный адрес новости в CRM: /news/<id> */
function crmNewsUrl(id: string): string {
  const origin = (process.env.BACKEND_ORIGIN || 'https://welans.cc').replace(/\/+$/, '');
  return `${origin}/news/${id}`;
}

/** Кодировка из XML-объявления ленты (\<?xml encoding="..."?\>), по умолчанию utf-8 */
function detectXmlEncoding(buf: Buffer): string {
  const head = buf.subarray(0, 300).toString('latin1');
  const m = head.match(/encoding=["']([a-zA-Z0-9._-]+)["']/i);
  return m ? m[1].toLowerCase() : 'utf-8';
}

/**
 * Скачивает ленту и возвращает её текст в UTF-8.
 * rss-parser сам кодировки XML не учитывает (4pda отдаёт windows-1251 и без
 * перекодировки кириллица превращалась в U+FFFD), поэтому качаем буфером,
 * декодируем по объявленной кодировке и только потом отдаём парсеру.
 */
async function fetchFeedXml(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: { 'User-Agent': FEED_USER_AGENT, Accept: 'application/rss+xml, application/atom+xml, application/xml, text/xml, */*' },
    signal: AbortSignal.timeout(30_000),
    redirect: 'follow',
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  const enc = detectXmlEncoding(buf);
  try {
    return new TextDecoder(enc).decode(buf);
  } catch {
    return buf.toString('utf-8');
  }
}

/**
 * Обложка (og:image) со страницы самой статьи.
 * У ленты 4pda в RSS нет ни enclosure, ни картинок в контенте — как и старый
 * сайт, берём первую картинку страницы материала. Best-effort: любая ошибка
 * (таймаут, нет meta) просто оставляет новость без обложки.
 */
async function fetchArticleOgImage(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': FEED_USER_AGENT, Accept: 'text/html,application/xhtml+xml,*/*;q=0.8' },
      signal: AbortSignal.timeout(15_000),
      redirect: 'follow',
    });
    if (!res.ok) return null;
    const html = (await res.text()).slice(0, 500_000);
    const m =
      html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i) ||
      html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i) ||
      html.match(/<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i);
    if (!m) return null;
    const src = m[1].trim();
    if (!/^https?:\/\//i.test(src)) return null;
    return src;
  } catch {
    return null;
  }
}

/** Обновляет зеркало источников в old_site.rss_feeds */
async function mirrorFeedsToArchive(feeds: { id: string; name: string; url: string; siteUrl: string | null; feedImage: string | null; isActive: boolean; sortOrder: number }[]): Promise<void> {
  const db = oldSitePool();
  for (const feed of feeds) {
    await db.query(
      `INSERT INTO rss_feeds (id, name, url, site_url, feed_image, is_active, sort_order, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
       ON DUPLICATE KEY UPDATE name = VALUES(name), url = VALUES(url), site_url = VALUES(site_url),
         feed_image = VALUES(feed_image), is_active = VALUES(is_active), sort_order = VALUES(sort_order),
         updated_at = CURRENT_TIMESTAMP`,
      [feed.id, feed.name, feed.url, feed.siteUrl, feed.feedImage, feed.isActive ? 1 : 0, feed.sortOrder],
    );
  }
}

/** Обрезает архив old_site до maxItemsPerFeed свежих items на источник (как wprss_truncate_posts_hook) */
async function truncateFeedArchive(feedId: string, maxItems: number): Promise<void> {
  const db = oldSitePool();
  await db.query(
    `DELETE FROM rss_items WHERE feed_id = ? AND id NOT IN (
       SELECT id FROM (
         SELECT id FROM rss_items WHERE feed_id = ? ORDER BY published_at DESC, id DESC LIMIT ?
       ) keep_rows
     )`,
    [feedId, feedId, maxItems],
  );
}

/**
 * Полный обход всех активных лент: old_site + публикация новостей в CRM.
 * Идемпотентен: дедупликация по (feed_id, permalink_hash) в old_site,
 * повторный запуск не создаёт дублей ни в архиве, ни в CRM.
 */
export async function syncRssFeeds(): Promise<RssSyncSummary> {
  if (syncRunning) throw new Error('Синхронизация RSS уже выполняется');
  syncRunning = true;
  const startedAt = new Date();
  const summary: RssSyncSummary = {
    feeds: 0, items: 0, created: 0, skipped: 0, failed: 0,
    errors: [], startedAt: startedAt.toISOString(), finishedAt: '',
  };
  try {
    const settings = await prisma.rssSettings.findFirst({
      include: { sources: { orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }] } },
    });
    const sources = (settings?.sources ?? []).filter((s) => s.isActive);
    if (!settings || !sources.length) {
      summary.finishedAt = new Date().toISOString();
      return summary;
    }

    await ensureRssSchema();
    await mirrorFeedsToArchive((settings.sources ?? []).map((s, i) => ({
      id: s.id, name: s.name, url: s.url, siteUrl: s.siteUrl, feedImage: s.feedImage,
      isActive: s.isActive, sortOrder: s.sortOrder || i,
    })));

    const db = oldSitePool();
    const limitPerImport = Math.max(0, settings.limitPerImport || 0);
    const maxItemsPerFeed = Math.max(1, settings.maxItemsPerFeed || 200);
    const uniqueTitles = settings.uniqueTitles !== false;

    // Загружаем уже известные permalink'ы и заголовки (дедупликация как в wprss)
    const [knownRows] = await db.query('SELECT feed_id, permalink_hash, title FROM rss_items');
    const knownHashes = new Set((knownRows as { feed_id: string; permalink_hash: string }[]).map((r) => `${r.feed_id}:${r.permalink_hash}`));
    const knownTitles = new Set((knownRows as { title: string }[]).map((r) => normalizeTitle(String(r.title ?? ''))));

    // Категория «Коротко о свежем» — создаём при первом запуске
    const category = await prisma.newsCategory.upsert({
      where: { slug: CATEGORY_SLUG },
      update: { name: CATEGORY_NAME },
      create: { name: CATEGORY_NAME, slug: CATEGORY_SLUG, color: '#007AFF', sortOrder: 50 },
    });

    // Автор новостей — первый администратор (как у импортёра WP)
    const adminRole = await prisma.role.findFirst({ where: { name: 'admin' } });
    const author = adminRole
      ? await prisma.user.findFirst({ where: { roleId: adminRole.id }, orderBy: { id: 'asc' } })
      : null;
    if (!author) throw new Error('В CRM не найден администратор — автор новостей не определён');

    const parser = new Parser({ timeout: 30_000 });

    for (const source of sources) {
      let feed;
      try {
        feed = await parser.parseString(await fetchFeedXml(source.url));
      } catch (e: any) {
        summary.failed += 1;
        summary.errors.push(`${source.name}: ${e?.message || e}`);
        continue;
      }
      summary.feeds += 1;

      const items = feed.items ?? [];
      for (const item of items) {
        if (limitPerImport > 0 && summary.created + summary.skipped >= limitPerImport) break;
        const title = (item.title || '').trim();
        const permalink = (item.link || item.guid || '').trim();
        if (!title || !permalink) continue;
        summary.items += 1;
        const permalinkHash = sha256(permalink);
        if (knownHashes.has(`${source.id}:${permalinkHash}`)) { summary.skipped += 1; continue; }
        const normTitle = normalizeTitle(title);
        if (uniqueTitles && knownTitles.has(normTitle)) { summary.skipped += 1; continue; }

        // Дедупликация против всей CRM: материал мог попасть раньше другим путём
        // (старой импорт WP переносил посты, которые wprss_feed собрал из этих же лент)
        const sourceUrlVariants = permalink.endsWith('/')
          ? [permalink, permalink.slice(0, -1)]
          : [permalink, permalink + '/'];
        const alreadyInCrm = await prisma.news.findFirst({
          where: { sourceUrl: { in: sourceUrlVariants } },
          select: { id: true },
        });
        if (alreadyInCrm) { summary.skipped += 1; continue; }

        const rawContent = String((item as any)['content:encoded'] || item.content || item.contentSnippet || '');
        const content = sanitizeHtml(rawContent, CONTENT_SANITIZE_OPTIONS);
        const firstImg = firstImageFromHtml(content);
        // Обложка: enclosure ленты → первая картинка текста → og:image страницы статьи
        let enclosureUrl = item.enclosure?.url?.trim() || firstImg || null;
        if (!enclosureUrl && permalink) {
          enclosureUrl = await fetchArticleOgImage(permalink);
        }
        const summaryText = stripHtml(content).replace(/\s+/g, ' ').trim().slice(0, 500) || null;
        const authorName = item.creator || (item as any).author || null;
        const publishedAt = parseFeedDate(item.isoDate || (item as any).pubDate || (item as any).dc?.date);

        const [insertResult] = await db.query(
          `INSERT INTO rss_items (feed_id, title, permalink, permalink_hash, enclosure_url, summary, content, author, published_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [source.id, title, permalink, permalinkHash, enclosureUrl, summaryText, content, authorName, publishedAt],
        );
        const itemId = (insertResult as { insertId: number }).insertId;
        knownHashes.add(`${source.id}:${permalinkHash}`);
        knownTitles.add(normTitle);

        // Публикация в CRM: id детерминирован от id архива — повторы невозможны
        const newsId = `rss_${itemId}`;
        const datePart = (publishedAt || new Date()).toISOString().slice(0, 10).replace(/-/g, '');
        const newsSlug = `rss-${datePart}-${permalinkHash.slice(0, 8)}`;
        try {
          await prisma.news.create({
            data: {
              id: newsId,
              title,
              slug: newsSlug,
              summary: summaryText,
              content,
              coverImage: enclosureUrl,
              sourceUrl: permalink,
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
        await db.query('UPDATE rss_items SET news_id = ?, news_slug = ? WHERE id = ?', [newsId, newsSlug, itemId]);
        summary.created += 1;
      }

      await truncateFeedArchive(source.id, maxItemsPerFeed);
    }

    summary.finishedAt = new Date().toISOString();
    await prisma.rssSettings.update({
      where: { id: settings.id },
      data: { lastSyncAt: new Date(), lastSyncResult: JSON.stringify(summary) },
    });
    return summary;
  } finally {
    syncRunning = false;
  }
}
