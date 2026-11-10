import { prisma } from './prisma.js';
import { htmlToText } from './html-to-text.js';
import { uploadsRoot, tenantUploadPrefix } from './tenant.js';
import fs from 'fs';
import path from 'path';

// ===== \u041f\u0443\u0431\u043b\u0438\u043a\u0430\u0446\u0438\u044f \u043d\u043e\u0432\u043e\u0441\u0442\u0438 \u043f\u043e\u0441\u0442\u043e\u043c \u043d\u0430 \u0441\u0442\u0435\u043d\u0443 \u0433\u0440\u0443\u043f\u043f\u044b \u0412\u041a (\u043f\u043b\u0430\u0433\u0438\u043d \u00ab\u0412\u041a \u0441\u043e\u043e\u0431\u0449\u0435\u0441\u0442\u0432\u043e\u00bb) =====
// \u0418\u0441\u043f\u043e\u043b\u044c\u0437\u0443\u0435\u0442 \u0442\u043e\u043a\u0435\u043d \u0441\u043e\u043e\u0431\u0449\u0435\u0441\u0442\u0432\u0430 \u0438\u0437 vk_community_settings (\u043f\u0440\u0430\u0432\u043e wall \u043f\u043e\u0434\u0442\u0432\u0435\u0440\u0436\u0434\u0435\u043d\u043e
// \u0447\u0435\u0440\u0435\u0437 groups.getTokenPermissions). \u041f\u043e\u0441\u0442 \u0432\u044b\u0445\u043e\u0434\u0438\u0442 \u043e\u0442 \u0438\u043c\u0435\u043d\u0438 \u0433\u0440\u0443\u043f\u043f\u044b (from_group=1, owner_id=-group_id).

const VK_API_VERSION = '5.199';
// \u041b\u0438\u043c\u0438\u0442 \u0412\u041a \u043d\u0430 \u0442\u0435\u043a\u0441\u0442 \u043f\u043e\u0441\u0442\u0430 ~16384 \u0441\u0438\u043c\u0432. \u2014 \u043e\u0441\u0442\u0430\u0432\u043b\u044f\u0435\u043c \u0437\u0430\u043f\u0430\u0441 \u043f\u043e\u0434 \u0441\u0441\u044b\u043b\u043a\u0443
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

// \u0421\u043a\u0430\u0447\u0438\u0432\u0430\u0435\u0442 \u0432\u043d\u0435\u0448\u043d\u044e\u044e \u043a\u0430\u0440\u0442\u0438\u043d\u043a\u0443 \u0432\u043e \u0432\u0440\u0435\u043c\u0435\u043d\u043d\u044b\u0439 \u0444\u0430\u0439\u043b (\u0443\u0434\u0430\u043b\u044f\u0435\u0442\u0441\u044f \u043f\u043e\u0441\u043b\u0435 \u0437\u0430\u0433\u0440\u0443\u0437\u043a\u0438 \u0432\u043e \u0412\u041a)
async function downloadToTmp(url: string): Promise<string> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`\u041d\u0435 \u0443\u0434\u0430\u043b\u043e\u0441\u044c \u0441\u043a\u0430\u0447\u0430\u0442\u044c \u0438\u0437\u043e\u0431\u0440\u0430\u0436\u0435\u043d\u0438\u0435 \u043e\u0431\u043b\u043e\u0436\u043a\u0438 (HTTP ${res.status})`);
  const ext = path.extname(new URL(url).pathname) || '.jpg';
  const tmp = path.join('/tmp', `vk-wall-${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
  fs.writeFileSync(tmp, Buffer.from(await res.arrayBuffer()));
  return tmp;
}

// \u041b\u043e\u043a\u0430\u043b\u044c\u043d\u044b\u0439 \u043f\u0443\u0442\u044c \u043e\u0431\u043b\u043e\u0436\u043a\u0438: /uploads/... \u0447\u0438\u0442\u0430\u0435\u043c \u0441 \u0434\u0438\u0441\u043a\u0430, http(s) \u2014 \u0441\u043a\u0430\u0447\u0438\u0432\u0430\u0435\u043c
async function resolveCoverImage(coverImage: string): Promise<string> {
  if (/^https?:\/\//i.test(coverImage)) return downloadToTmp(coverImage);
  const tenantPfx = tenantUploadPrefix();
  if (tenantPfx && coverImage.startsWith(tenantPfx)) {
    return path.join(uploadsRoot(), coverImage.slice(tenantPfx.length).replace(/^\/+/, ''));
  }
  // \u0413\u043b\u0430\u0432\u043d\u0430\u044f \u043e\u0440\u0433\u0430\u043d\u0438\u0437\u0430\u0446\u0438\u044f: uploads.ts \u0445\u0440\u0430\u043d\u0438\u0442 \u0444\u0430\u0439\u043b\u044b \u043a\u0430\u043a '/app' + path
  return '/app' + coverImage;
}

// \u0417\u0430\u0433\u0440\u0443\u0437\u043a\u0430 \u0444\u043e\u0442\u043e \u043d\u0430 \u0441\u0442\u0435\u043d\u0443: photos.getWallUploadServer \u2192 multipart \u043d\u0430 upload_url \u2192 photos.saveWallPhoto
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
  if (!photo) throw new Error('\u0412\u041a \u043d\u0435 \u0432\u0435\u0440\u043d\u0443\u043b \u0441\u043e\u0445\u0440\u0430\u043d\u0451\u043d\u043d\u043e\u0435 \u0444\u043e\u0442\u043e');
  return `photo${photo.owner_id}_${photo.id}`;
}

export interface VkPublishResult {
  postId: number;
  url: string;
  publishedAt: Date;
}

export async function publishNewsToVk(newsId: string): Promise<VkPublishResult> {
  const settings = await prisma.vkCommunitySettings.findFirst();
  if (!settings || !settings.accessToken) {
    throw new Error('\u041f\u043b\u0430\u0433\u0438\u043d \u00ab\u0412\u041a \u0441\u043e\u043e\u0431\u0449\u0435\u0441\u0442\u0432\u043e\u00bb \u043d\u0435 \u043d\u0430\u0441\u0442\u0440\u043e\u0435\u043d (\u043d\u0435\u0442 \u0442\u043e\u043a\u0435\u043d\u0430 \u0441\u043e\u043e\u0431\u0449\u0435\u0441\u0442\u0432\u0430)');
  }
  if (!settings.isActive) {
    throw new Error('\u041f\u043b\u0430\u0433\u0438\u043d \u00ab\u0412\u041a \u0441\u043e\u043e\u0431\u0449\u0435\u0441\u0442\u0432\u043e\u00bb \u0432\u044b\u043a\u043b\u044e\u0447\u0435\u043d');
  }

  const news = await prisma.news.findUnique({
    where: { id: newsId },
    include: { category: { select: { slug: true } } },
  });
  if (!news) throw new Error('\u041d\u043e\u0432\u043e\u0441\u0442\u044c \u043d\u0435 \u043d\u0430\u0439\u0434\u0435\u043d\u0430');
  if (!news.isPublished) throw new Error('\u0421\u043d\u0430\u0447\u0430\u043b\u0430 \u043e\u043f\u0443\u0431\u043b\u0438\u043a\u0443\u0439\u0442\u0435 \u043d\u043e\u0432\u043e\u0441\u0442\u044c \u0432 CRM');

  // \u0422\u0435\u043a\u0441\u0442 \u043f\u043e\u0441\u0442\u0430: \u0437\u0430\u0433\u043e\u043b\u043e\u0432\u043e\u043a + \u043e\u043f\u0438\u0441\u0430\u043d\u0438\u0435/\u043a\u043e\u043d\u0442\u0435\u043d\u0442 (\u0431\u0435\u0437 HTML)
  const bodyText = htmlToText(news.summary) || htmlToText(news.content);
  const truncated = bodyText.length > POST_TEXT_LIMIT
    ? bodyText.slice(0, POST_TEXT_LIMIT).trimEnd() + '\u2026'
    : bodyText;
  // \u0421\u0441\u044b\u043b\u043a\u0430 \u0434\u043e\u0431\u0430\u0432\u043b\u044f\u0435\u043c \u0442\u043e\u043b\u044c\u043a\u043e \u0434\u043b\u044f \u043f\u0443\u0431\u043b\u0438\u0447\u043d\u044b\u0445 \u043d\u043e\u0432\u043e\u0441\u0442\u0435\u0439
  // (\u0442\u043e\0442 \u0436\u0435 \u043d\u0430\u0431\u043e\u0440, \u0447\u0442\u043e \u0438 /public/:slug \u0432 routes/news.ts)
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
      attachment = await uploadWallPhoto(settings.accessToken, settings.groupId, local);
    } finally {
      if (tmpFile && fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile);
    }
  }

  const post = await api('wall.post', {
    owner_id: -settings.groupId,
    from_group: 1,
    message,
    ...(attachment ? { attachments: attachment } : {}),
  }, settings.accessToken);

  const postId = post.post_id as number;
  const url = `https://vk.com/wall-${settings.groupId}_${postId}`;
  const publishedAt = new Date();
  await prisma.news.update({
    where: { id: news.id },
    data: { vkPostId: postId, vkPublishedAt: publishedAt, vkPublishError: null },
  });
  return { postId, url, publishedAt };
}
