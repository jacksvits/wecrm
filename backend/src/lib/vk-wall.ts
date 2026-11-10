import { prisma } from './prisma.js';
import { htmlToText } from './html-to-text.js';
import { uploadsRoot, tenantUploadPrefix } from './tenant.js';
import fs from 'fs';
import path from 'path';

// ===== Публикация новости постом на стену группы ВК (плагин «ВК сообщество») =====
// Два режима:
// 1) Есть settings.wallAccessToken (классический пользовательский токен vk1.a из
//    Standalone-приложения, scope wall+photos) — фото обложки ПРИКРЕПЛЯЕТСЯ к посту
//    (photos.getWallUploadServer → photos.saveWallPhoto → wall.post с attachments),
//    публикация мгновенная.
// 2) Нет токена — токен сообщества: фото он прикреплять не может (VK Error 27), поэтому
//    обложка идёт ссылкой на og-страницу /api/news/:id/cover-page?v=..., а пост
//    публикуется отложенно (+2 мин), чтобы ВК прикрепил превью к моменту выхода.
// Посты этим токеном удалять программно нельзя (wall.delete → Error 27).

const VK_API_VERSION = '5.199';
const POST_TEXT_LIMIT = 3000;
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

async function downloadToTmp(url: string): Promise<string> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Не удалось скачать изображение обложки (HTTP ${res.status})`);
  const ext = path.extname(new URL(url).pathname) || '.jpg';
  const tmp = path.join('/tmp', `vk-wall-${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
  fs.writeFileSync(tmp, Buffer.from(await res.arrayBuffer()));
  return tmp;
}

async function resolveCoverImage(coverImage: string): Promise<string> {
  if (/^https?:\/\//i.test(coverImage)) return downloadToTmp(coverImage);
  const tenantPfx = tenantUploadPrefix();
  if (tenantPfx && coverImage.startsWith(tenantPfx)) {
    return path.join(uploadsRoot(), coverImage.slice(tenantPfx.length).replace(/^\/+/, ''));
  }
  return '/app' + coverImage;
}

// Загрузка фото на стену (только классическим пользовательским токеном vk1.a)
async function uploadWallPhoto(accessToken: string, groupId: number, imagePath: string): Promise<string> {
  const upload = await api('photos.getWallUploadServer', { group_id: groupId }, accessToken);
  const form = new FormData();
  form.append('photo', new Blob([fs.readFileSync(imagePath)]), path.basename(imagePath));
  const upRes = await fetch(upload.upload_url, { method: 'POST', body: form });
  const upJson: any = await upRes.json();
  if (!upRes.ok || upJson.error) {
    throw new Error(`VK upload error: ${JSON.stringify(upJson).slice(0, 300)}`);
  }
  const saved = await api('photos.saveWallPhoto', {
    group_id: groupId,
    server: upJson.server,
    photo: upJson.photo,
    hash: upJson.hash,
  }, accessToken);
  const photo = saved?.[0];
  if (!photo) throw new Error('ВК не вернул сохранённое фото');
  return `photo${photo.owner_id}_${photo.id}`;
}

export interface VkPublishResult {
  postId: number;
  url: string;
  publishedAt: Date;
  // true — пост запланирован на ~2 минуты (режим без токена: превью к моменту выхода)
  scheduled: boolean;
  // true — обложка добавлена ссылкой-превью; false — фото прикреплено к посту
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
  if (!settings.accessToken && !settings.wallAccessToken) {
    throw new Error('Нет ни токена сообщества, ни пользовательского токена публикации');
  }

  const news = await prisma.news.findUnique({
    where: { id: newsId },
    include: { category: { select: { slug: true } } },
  });
  if (!news) throw new Error('Новость не найдена');
  if (!news.isPublished) throw new Error('Сначала опубликуйте новость в CRM');

  const bodyText = htmlToText(news.summary) || htmlToText(news.content);
  const truncated = bodyText.length > POST_TEXT_LIMIT
    ? bodyText.slice(0, POST_TEXT_LIMIT).trimEnd() + '…'
    : bodyText;
  const isPublic = (news.externalId != null || news.id.startsWith('rss_'))
    && news.category?.slug === 'korotko-o-svezhem';
  const link = isPublic ? `https://welans.ru/${news.slug || news.id}/` : null;

  let attachment: string | null = null;
  let coverAsLink = false;
  let tmpFile: string | null = null;

  if (settings.wallAccessToken && news.coverImage) {
    // РЕЖИМ 1: пользовательский токен — прикрепляем фото
    const local = await resolveCoverImage(news.coverImage);
    tmpFile = local.startsWith('/tmp/') ? local : null;
    try {
      attachment = await uploadWallPhoto(settings.wallAccessToken, settings.groupId, local);
    } finally {
      if (tmpFile && fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile);
    }
  } else if (news.coverImage) {
    // РЕЖИМ 2: токен сообщества — обложка ссылкой на og-страницу (ВК рисует превью)
    coverAsLink = true;
  }
  const coverLink = coverAsLink
    ? `${SITE_ORIGIN}/api/news/${news.id}/cover-page?v=${news.updatedAt.getTime()}`
    : null;
  const message = [news.title, truncated, coverLink, link].filter(Boolean).join('\n\n');

  let post: any;
  let scheduled = false;
  if (settings.wallAccessToken) {
    // Мгновенная публикация — фото уже прикреплено, превью не нужно
    post = await api('wall.post', {
      owner_id: -settings.groupId,
      from_group: 1,
      message,
      ...(attachment ? { attachments: attachment } : {}),
    }, settings.wallAccessToken);
  } else {
    // Отложенная публикация (+2 мин): ВК обрабатывает ссылку при планировании
    try {
      post = await api('wall.post', {
        owner_id: -settings.groupId,
        from_group: 1,
        message,
        publish_date: Math.floor(Date.now() / 1000) + 120,
      }, settings.accessToken!);
      scheduled = true;
    } catch (err: any) {
      console.warn('[vk-wall] отложенная публикация недоступна, публикуем сразу:', err?.message);
      post = await api('wall.post', {
        owner_id: -settings.groupId,
        from_group: 1,
        message,
      }, settings.accessToken!);
    }
  }

  const postId = post.post_id as number;
  const url = `https://vk.com/wall-${settings.groupId}_${postId}`;
  const publishedAt = new Date();
  await prisma.news.update({
    where: { id: news.id },
    data: { vkPostId: postId, vkPublishedAt: publishedAt, vkPublishError: null },
  });
  return { postId, url, publishedAt, scheduled, coverAsLink };
}
