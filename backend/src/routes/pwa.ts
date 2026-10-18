/**
 * PWA-раздача с данными конкретного tenant'а.
 *
 * iOS при «Добавить на экран Домой» (и краулеры при индексации) читают
 * index.html / manifest ДО выполнения JS, поэтому клиентская подмена
 * метатегов (loadBranding/initSeo во фронтенде) до них не доходит.
 * Эти эндпоинты отдают index.html и manifest.json с подставленными
 * данными текущего tenant'а (брендинг + SEO-настройки из его БД).
 *
 * Шаблон index.html забирается из общего тома fe-dist, который
 * frontend-контейнер наполняет копией собранного dist при старте.
 */
import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import { prisma } from '../lib/prisma.js';
import { currentTenant, tenantUploadPrefix } from '../lib/tenant.js';

const router = Router();

const FE_DIST_DIR = process.env.FE_DIST_DIR || '/fe-dist';
const INDEX_HTML_PATH = path.join(FE_DIST_DIR, 'index.html');

/** TTL кэша срендеренных ответов (брендинг/SEO меняются редко) */
const RENDER_TTL_MS = 60_000;
const renderCache = new Map<string, { body: string; expires: number }>();

// Шаблон index.html: перечитываем при изменении mtime (редеплой = новый dist)
let indexTemplate: string | null = null;
let indexTemplateMtime = 0;

function getIndexTemplate(): string | null {
  try {
    const stat = fs.statSync(INDEX_HTML_PATH);
    if (!indexTemplate || stat.mtimeMs !== indexTemplateMtime) {
      indexTemplate = fs.readFileSync(INDEX_HTML_PATH, 'utf-8');
      indexTemplateMtime = stat.mtimeMs;
      renderCache.clear(); // шаблон изменился — инвалидируем весь рендер-кэш
    }
    return indexTemplate;
  } catch {
    return null;
  }
}

// Экранирование значений, вставляемых в HTML
function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/** Данные tenant'а для PWA: название из SEO-настроек, иконки из брендинга */
async function pwaData() {
  const [seo, branding] = await Promise.all([
    prisma.seoSettings.findFirst(),
    prisma.branding.findUnique({ where: { id: 1 } }),
  ]);
  const tenant = currentTenant();
  const title = seo?.title?.trim() || tenant?.name?.trim() || 'WeCRM';
  const v = branding?.updatedAt ? `?v=${branding.updatedAt.getTime()}` : '';
  const prefix = tenantUploadPrefix(); // '' для главной, '/t-<slug>' для tenant'ов
  return {
    title,
    shortName: title.length > 12 ? title.slice(0, 12).trim() : title,
    description: seo?.description?.trim() || 'CRM для управления задачами, сделками и контактами',
    appleTouchIcon: branding?.iconPath ? `/uploads${prefix}/branding/apple-touch-icon.png${v}` : null,
    icon192: branding?.iconPath ? `/uploads${prefix}/branding/icon-192x192.png${v}` : null,
    icon512: branding?.iconPath ? `/uploads${prefix}/branding/icon-512x512.png${v}` : null,
  };
}

// GET /pwa-index — index.html с метатегами текущего tenant'а.
// nginx хоста проксирует сюда location = / (до отдачи статики фронтендом).
router.get('/pwa-index', async (_req, res) => {
  // Кэш строго per tenant: иначе первый запросивший tenant закэширует свой
  // HTML для всех остальных (iOS-диалог «Добавить на экран Домой» покажет
  // чужое название/иконку)
  const key = `index:${currentTenant()?.slug || 'main'}`;
  const cached = renderCache.get(key);
  if (cached && cached.expires > Date.now()) {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    return res.send(cached.body);
  }
  const template = getIndexTemplate();
  if (!template) {
    return res.status(503).json({ error: 'Frontend dist not available' });
  }
  try {
    const d = await pwaData();
    const appleIcon = d.appleTouchIcon || '/apple-touch-icon.png';
    let html = template
      // Название ярлыка на экране «Домой» у iOS/Android
      .replace(
        /<meta name="apple-mobile-web-app-title" content="[^"]*"\s*\/>/,
        `<meta name="apple-mobile-web-app-title" content="${escapeHtml(d.title)}" />`,
      )
      // Иконка ярлыка (iOS берёт именно apple-touch-icon из HTML)
      .replace(
        /<link rel="apple-touch-icon" href="[^"]*"\s*\/>/,
        `<link rel="apple-touch-icon" href="${appleIcon}" />`,
      )
      // Заголовок вкладки до выполнения JS (краулеры, превью ссылок)
      .replace(/<title>[^<]*<\/title>/, `<title>${escapeHtml(d.title)}</title>`);
    renderCache.set(key, { body: html, expires: Date.now() + RENDER_TTL_MS });
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.send(html);
  } catch (e: any) {
    console.error('[pwa] index render error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// GET /manifest.json — динамический manifest PWA текущего tenant'а.
// nginx хоста проксирует сюда location = /manifest.json.
router.get('/manifest.json', async (_req, res) => {
  const tenantKey = currentTenant()?.slug || 'main';
  const cached = renderCache.get(`manifest:${tenantKey}`);
  if (cached && cached.expires > Date.now()) {
    res.setHeader('Content-Type', 'application/manifest+json');
    res.setHeader('Cache-Control', 'public, max-age=60');
    return res.send(cached.body);
  }
  try {
    const d = await pwaData();
    const icons = d.icon192
      ? [
          { src: d.icon192, sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: d.icon512 || d.icon192, sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: d.icon192, sizes: '192x192', type: 'image/png', purpose: 'maskable' },
          { src: d.icon512 || d.icon192, sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ]
      : [
          { src: '/icon-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: '/icon-maskable-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
          { src: '/icon-maskable-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ];
    const manifest = {
      name: d.title,
      short_name: d.shortName,
      description: d.description,
      start_url: '/',
      display: 'standalone',
      background_color: '#ffffff',
      theme_color: '#00b300',
      orientation: 'portrait-primary',
      icons,
    };
    const body = JSON.stringify(manifest, null, 2);
    renderCache.set(`manifest:${tenantKey}`, { body, expires: Date.now() + RENDER_TTL_MS });
    res.setHeader('Content-Type', 'application/manifest+json');
    res.setHeader('Cache-Control', 'public, max-age=60');
    res.send(body);
  } catch (e: any) {
    console.error('[pwa] manifest render error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

export default router;
