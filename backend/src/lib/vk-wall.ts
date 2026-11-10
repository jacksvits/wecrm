import { prisma } from './prisma.js';
import { htmlToText } from './html-to-text.js';
import { uploadsRoot, tenantUploadPrefix } from './tenant.js';
import fs from 'fs';
import path from 'path';

// ===== Публикация новости постом на стену группы ВК (плагин «ВК сообщество») =====
// Ограничения токенов ВК (проверено на живом API в 2026):
// — токен сообщества (из настроек группы): wall.post (текст) РАБОТАЕТ, а загрузка
//   фото на стену (photos.getWallUploadServer) — Error 27 «method is unavailable with group auth»;
// — токен VK ID (vk2.a, OAuth входа): только чтение, писать не может (Error 15/1051);
// — классический пользовательский токен (vk1.a, implicit flow oauth.vk.com,
//   redirect_uri=https://oauth.vk.com/blank.html, scope=wall,photos,offline): работает всё —
//   и пост от имени группы (from_group=1), и загрузка фото.
// Поэтому: есть wallAccessToken (пользовательский) — пост с фото; нет — текстовый пост
// токеном сообщества, фото пропускается (признак photoSkipped).

const VK_API_VERSION = '5.199';
// Лимит ВК на текст поста ~16384 симв. — оставляем запас под ссылку
const POST_TEXT_LIMIT = 3000;

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

// Скачивает внешнюю картинку во временный файл (удаляется после загрузки во ВК)
async function downloadToTmp(url: string): Promise<string> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Не удалось скачать изображение обложки (HTTP ${res.status})`);
  const ext = path.extname(new URL(url).pathname) || '.jpg';
  const tmp = path.join('/tmp', `vk-wall-${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
  fs.writeFileSync(tmp, Buffer.from(await res.arrayBuffer()));
  return tmp;
}

// Локальный путь обложки: /uploads/... читаем с диска, http(s) — скачиваем
async function resolveCoverImage(coverImage: string): Promise<string> {
  if (/^https?:\/\//i.test(coverImage)) return downloadToTmp(coverImage);
  const tenantPfx = tenantUploadPrefix();
  if (tenantPfx && coverImage.startsWith(tenantPfx)) {
    return path.join(uploadsRoot(), coverImage.slice(tenantPfx.length).replace(/^\/+/, ''));
  }
  // Главная организация: uploads.ts хранит файлы как '/app' + path
  return '/app' + coverImage;
}

// Загрузка фото на стену (только классическим пользовательским токеном):
// photos.getWallUploadServer → multipart на upload_url → photos.saveWallPhoto
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
  // true — токен сообщества не умеет прикреплять фото, пост ушёл текстом
  photoSkipped: boolean;
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
  const message = [news.title, truncated, link].filter(Boolean).join('\n\n');

  // Фото прикрепляем только классическим пользовательским токеном;
  // с токеном сообщества загрузка фото недоступна (VK Error 27) — постим текстом
  let attachment: string | null = null;
  let photoSkipped = false;
  let tmpFile: string | null = null;
  if (news.coverImage) {
    if (settings.wallAccessToken) {
      const local = await resolveCoverImage(news.coverImage);
      tmpFile = local.startsWith('/tmp/') ? local : null;
      try {
        attachment = await uploadWallPhoto(settings.wallAccessToken, settings.groupId, local);
      } finally {
        if (tmpFile && fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile);
      }
    } else {
      photoSkipped = true;
    }
  }

  // wall.post: пользовательским токеном — полный пост, токеном сообщества — текст
  const token = settings.wallAccessToken || settings.accessToken!;
  let post: any;
  try {
    post = await api('wall.post', {
      owner_id: -settings.groupId,
      from_group: 1,
      message,
      ...(attachment ? { attachments: attachment } : {}),
    }, token);
  } catch (err: any) {
    if (err?.vkCode === 27) {
      throw new Error('Токен не позволяет публиковать на стене — добавьте пользовательский токен публикации в Настройки → ВК сообщество (как получить: подсказка под полем)');
    }
    throw err;
  }

  const postId = post.post_id as number;
  const url = `https://vk.com/wall-${settings.groupId}_${postId}`;
  const publishedAt = new Date();
  await prisma.news.update({
    where: { id: news.id },
    data: { vkPostId: postId, vkPublishedAt: publishedAt, vkPublishError: null },
  });
  return { postId, url, publishedAt, photoSkipped };
}
