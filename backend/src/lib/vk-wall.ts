import { prisma } from './prisma.js';
import { htmlToText } from './html-to-text.js';

// ===== Публикация новости постом на стену группы ВК (плагин «ВК сообщество») =====
// Работает на ТОКЕНЕ СООБЩЕСТВА из vk_community_settings (проверено на живом API 2026-11-10):
// wall.post (from_group=1) с токеном сообщества РАБОТАЕТ (пост 672 прошёл),
// но загрузка вложений НЕ доступна ни ему, ни токену VK ID (vk2.a, Error 15/27 на
// photos.* и docs.*). Поэтому обложка добавляется в текст поста ССЫЛКОЙ — ВК
// сам рисует её превью. Посты этим токеном НЕЛЬЗЯ удалять программно
// (wall.delete → Error 27) — удалять вручную из интерфейса ВК.

const VK_API_VERSION = '5.199';
// Лимит ВК на текст поста ~16384 симв. — оставляем запас под ссылки
const POST_TEXT_LIMIT = 3000;
// Публичный адрес CRM, с которого отдаются /uploads/... обложки
const SITE_ORIGIN = 'https://welans.cc';

interface VkApiError extends Error {
  vkCode?: number;
}

async function api(method: string, params: Record<string, any>, accessToken: string) {
  const qs = new URLSearchParams({
    v: VK_API_VERSION,
    access_token: accessToken,
    ...Object.fromEntries(Object.entries(params).map(([k, v]) => [k, String(v)])),
  });
  const res = await fetch(`https://api.vk.com/method/${method}?${qs.toString()}`);
  const json: any = await res.json();
  if (json.error) {
    const err: VkApiError = new Error(`VK API error: ${json.error.error_msg} (code ${json.error.error_code})`);
    err.vkCode = json.error.error_code;
    throw err;
  }
  return json.response;
}

// Обложка в посте — ссылкой на og-страницу новости: ВК по ней рисует превью
// с картинкой (голая ссылка на .jpg парсером не превьюится)
function coverLink(news: { id: string; coverImage: string | null; updatedAt: Date }): string | null {
  if (!news.coverImage) return null;
  // ?v= — версия от updatedAt: для ВК это «новый» URL (краулер ходит заново, а не по кэшу)
  return `${SITE_ORIGIN}/api/news/${news.id}/cover-page?v=${news.updatedAt.getTime()}`;
}

export interface VkPublishResult {
  postId: number;
  url: string;
  publishedAt: Date;
  // true — обложка добавлена ссылкой-превью (вложить фото токен не умеет)
  coverAsLink: boolean;
}

export async function publishNewsToVk(newsId: string): Promise<VkPublishResult> {
  const settings = await prisma.vkCommunitySettings.findFirst();
  if (!settings) {
    throw new Error('Плагин «ВК сообщество» не настроен (Настройки)');
  }
  if (!settings.isActive) {
    throw new Error('Плагин «ВК сообщество» выключен');
  }
  if (!settings.accessToken) {
    throw new Error('Нет токена сообщества (Настройки → ВК сообщество)');
  }

  const news = await prisma.news.findUnique({
    where: { id: newsId },
    include: { category: { select: { slug: true } } },
  });
  if (!news) throw new Error('Новость не найдена');
  if (!news.isPublished) throw new Error('Сначала опубликуйте новость в CRM');

  // Текст поста: заголовок + описание/контент (без HTML)
  const bodyText = htmlToText(news.summary) || htmlToText(news.content);
  const truncated = bodyText.length > POST_TEXT_LIMIT
    ? bodyText.slice(0, POST_TEXT_LIMIT).trimEnd() + '…'
    : bodyText;
  // Ссылку добавляем только для публичных новостей
  // (тот же набор условий, что и /public/:slug в routes/news.ts)
  const isPublic = (news.externalId != null || news.id.startsWith('rss_'))
    && news.category?.slug === 'korotko-o-svezhem';
  const link = isPublic ? `https://welans.ru/${news.slug || news.id}/` : null;
  const cover = coverLink(news);
  const message = [news.title, truncated, cover, link].filter(Boolean).join('\n\n');

  const post = await api('wall.post', {
    owner_id: -settings.groupId,
    from_group: 1,
    message,
  }, settings.accessToken);

  const postId = post.post_id as number;
  const url = `https://vk.com/wall-${settings.groupId}_${postId}`;
  const publishedAt = new Date();
  await prisma.news.update({
    where: { id: news.id },
    data: { vkPostId: postId, vkPublishedAt: publishedAt, vkPublishError: null },
  });
  return { postId, url, publishedAt, coverAsLink: !!cover };
}
