import { prisma } from './prisma.js';
import { htmlToText } from './html-to-text.js';
import { uploadsRoot, tenantUploadPrefix } from './tenant.js';
import { getFreshMarketToken } from './vk-market.js';
import fs from 'fs';
import path from 'path';

// ===== Публикация новости постом на стену группы ВК (плагин «ВК сообщество») =====
// ВАЖНО: методы стены недоступны с токеном сообщества (VK Error 27 «method is
// unavailable with group auth») — постим пользовательским токеном VK ID
// (scope wall, выдаётся кнопкой «Получить токен маркета» в Настройки → ВК товары)
// от имени администратора группы (from_group=1, owner_id=-groupId).
// Автообновление токена — общее с маркетом (getFreshMarketToken, refresh_token).

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

// Вызывает method пользовательским токеном; при VK Error 5 («User authorization
// failed» — токен отозван/просрочен) — принудительный рефреш и один повтор
async function apiAsUser(method: string, params: Record<string, any>): Promise<any> {
  const token = await getFreshMarketToken();
  if (!token) {
    throw new Error('Для публикации на стене нужен пользовательский токен ВК с правом wall — нажмите «Получить токен маркета» в Настройки → ВК товары (выдача токена теперь включает право wall)');
  }
  try {
    return await api(method, params, token);
  } catch (err: any) {
    if (err?.vkCode === 5) {
      const fresh = await getFreshMarketToken(true);
      if (fresh && fresh !== token) return await api(method, params, fresh);
    }
    throw err;
  }
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

// Загрузка фото на стену: photos.getWallUploadServer → multipart на upload_url → photos.saveWallPhoto
async function uploadWallPhoto(groupId: number, imagePath: string): Promise<string> {
  const upload = await apiAsUser('photos.getWallUploadServer', { group_id: groupId });
  const form = new FormData();
  form.append('photo', new Blob([fs.readFileSync(imagePath)]), path.basename(imagePath));
  const upRes = await fetch(upload.upload_url, { method: 'POST', body: form });
  const upJson: any = await upRes.json();
  if (!upRes.ok || upJson.error) {
    throw new Error(`VK upload error: ${JSON.stringify(upJson).slice(0, 300)}`);
  }
  const saved = await apiAsUser('photos.saveWallPhoto', {
    group_id: groupId,
    server: upJson.server,
    photo: upJson.photo,
    hash: upJson.hash,
  });
  const photo = saved?.[0];
  if (!photo) throw new Error('ВК не вернул сохранённое фото');
  return `photo${photo.owner_id}_${photo.id}`;
}

export interface VkPublishResult {
  postId: number;
  url: string;
  publishedAt: Date;
}

export async function publishNewsToVk(newsId: string): Promise<VkPublishResult> {
  const settings = await prisma.vkCommunitySettings.findFirst();
  if (!settings) {
    throw new Error('Плагин «ВК сообщество» не настроен (Настройки)');
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

  let attachment: string | null = null;
  let tmpFile: string | null = null;
  if (news.coverImage) {
    const local = await resolveCoverImage(news.coverImage);
    tmpFile = local.startsWith('/tmp/') ? local : null;
    try {
      attachment = await uploadWallPhoto(settings.groupId, local);
    } finally {
      if (tmpFile && fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile);
    }
  }

  const post = await apiAsUser('wall.post', {
    owner_id: -settings.groupId,
    from_group: 1,
    message,
    ...(attachment ? { attachments: attachment } : {}),
  });

  const postId = post.post_id as number;
  const url = `https://vk.com/wall-${settings.groupId}_${postId}`;
  const publishedAt = new Date();
  await prisma.news.update({
    where: { id: news.id },
    data: { vkPostId: postId, vkPublishedAt: publishedAt, vkPublishError: null },
  });
  return { postId, url, publishedAt };
}
