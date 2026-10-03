import { Router } from 'express';
import { ProxyAgent } from 'undici';
import { Readable } from 'stream';
import { authMiddleware } from '../middleware/auth.js';

// === Прокси-браузер ===
// Страница «Браузер» показывает произвольные сайты внутри CRM, загружая их
// через уже установленный прокси (контейнер vpn: sing-box, плагин «Прокси
// через VPN»). Адресная строка — на фронтенде, контент проксируется эндпоинтом
// /api/browser/proxy?url=<целевой URL>: ссылки и ресурсы в HTML/CSS
// перезаписываются обратно на прокси, поэтому навигация по сайту остаётся
// внутри iframe. Аутентификация — JWT из query (?token=) или из cookie
// wecrm_browser (ставится эндпоинтом /api/browser/session, т.к. iframe не
// отправляет кастомные заголовки).

const router = Router();

const PROXY_URL = process.env.BROWSER_PROXY_URL || process.env.TELEGRAM_PROXY_URL || 'http://vpn:2080';
const dispatcher = new ProxyAgent(PROXY_URL);

const COOKIE_NAME = 'wecrm_browser';
const COOKIE_MAX_AGE = 12 * 60 * 60; // 12 часов — как жизненный цикл рабочей сессии
const MAX_HTML_SIZE = 25 * 1024 * 1024; // 25 МБ — буферизуем только HTML/CSS для перезаписи
const FETCH_TIMEOUT = 45_000;

// Заголовки ответа, которые нельзя пропускать через прокси
const DROP_RESPONSE_HEADERS = [
  'content-security-policy',
  'content-security-policy-report-only',
  'x-frame-options',
  'frame-options',
  'content-length',
  'transfer-encoding',
  'connection',
  'content-encoding',
  'strict-transport-security',
  // чужие cookie не сохраняем: имена могут пересечься с cookie CRM,
  // а доменная атрибута всё равно ломается через прокси
  'set-cookie',
];

// Разбираем cookie-строку вручную (cookie-parser в проекте не подключён)
function readCookie(req: any, name: string): string | undefined {
  const raw = req.headers.cookie;
  if (!raw) return undefined;
  for (const part of raw.split(';')) {
    const idx = part.indexOf('=');
    if (idx === -1) continue;
    if (part.slice(0, idx).trim() === name) return decodeURIComponent(part.slice(idx + 1).trim());
  }
  return undefined;
}

// Авторизация: JWT из ?token= или из cookie wecrm_browser
function browserAuth(req: any, res: any, next: any) {
  if (!req.query.token) {
    const cookieToken = readCookie(req, COOKIE_NAME);
    if (cookieToken) req.query.token = cookieToken;
  }
  authMiddleware(req, res, next);
}

// Устанавливает cookie с JWT для прокси-запросов из iframe
router.get('/session', authMiddleware, (req: any, res) => {
  const token =
    (req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.slice(7) : undefined) ||
    (typeof req.headers['x-auth-token'] === 'string' ? req.headers['x-auth-token'] : undefined) ||
    (typeof req.query.token === 'string' ? req.query.token : undefined);
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  res.setHeader(
    'Set-Cookie',
    `${COOKIE_NAME}=${encodeURIComponent(token)}; Path=/api/browser; HttpOnly; SameSite=Lax; Max-Age=${COOKIE_MAX_AGE}${secure}`
  );
  res.json({ ok: true });
});

function proxyUrlFor(target: string): string {
  return `/api/browser/proxy?url=${encodeURIComponent(target)}`;
}

function resolveTarget(u: string, base: string): string | null {
  try {
    const abs = new URL(u, base);
    if (abs.protocol !== 'http:' && abs.protocol !== 'https:') return null;
    return abs.toString();
  } catch {
    return null;
  }
}

// Перезапись URL в HTML: абсолютные (со схемой и протоколо-относительные) —
// глобально, относительные — в атрибутах href/src/action/poster/data-src.
// Блоки <script> защищаем от модификации, чтобы не сломать JS сайта.
function rewriteHtml(html: string, baseUrl: string): string {
  const scripts: string[] = [];
  let text = html.replace(/<script[\s\S]*?<\/script>/gi, (m) => {
    scripts.push(m);
    return `%%WECRM_SCRIPT_${scripts.length - 1}%%`;
  });

  const proxify = (u: string): string => {
    const target = resolveTarget(u, baseUrl);
    return target ? proxyUrlFor(target) : u;
  };

  // Абсолютные URL со схемой (в атрибутах, стилях, srcset и т.д.)
  text = text.replace(/(["'(])https?:\/\/[^\s"'()<>]+/gi, (m, q) => q + proxify(m.slice(q.length)));
  // Протоколо-относительные //host/path
  text = text.replace(/(["'(])\/\/[a-z0-9.-]+(?::\d+)?(?:\/[^\s"'()<>]*)?/gi, (m, q) => q + proxify('https:' + m.slice(q.length)));
  // Относительные и корневые URL в атрибутах
  text = text.replace(/((?:href|src|action|poster|data-src|data-href)\s*=\s*["'])([^"']*)(["'])/gi, (m, pre, val, post) => {
    if (/^(https?:|data:|javascript:|mailto:|tel:|blob:|#|%|%%WECRM_)/i.test(val) || val.startsWith('/api/browser/')) return m;
    return pre + proxify(val) + post;
  });

  text = text.replace(/%%WECRM_SCRIPT_(\d+)%%/g, (_m, i) => scripts[Number(i)]);
  return text;
}

// Перезапись url(...) и @import в CSS, подгружаемом через прокси
function rewriteCss(css: string, baseUrl: string): string {
  const proxify = (u: string): string => {
    const target = resolveTarget(u, baseUrl);
    return target ? proxyUrlFor(target) : u;
  };
  return css
    .replace(/url\(\s*(['"]?)(.*?)\1\s*\)/gi, (m, _q, u) => {
      if (!u || /^(data:|blob:|#|%)/i.test(u) || u.startsWith('/api/browser/')) return m;
      return `url("${proxify(u)}")`;
    })
    .replace(/@import\s+(["'])(.*?)\1/gi, (m, q, u) => `@import ${q}${proxify(u)}${q}`);
}

async function pipeUpstream(res: any, upstream: Response) {
  // Статус и редиректы
  const location = upstream.headers.get('location');
  if (location && upstream.status >= 300 && upstream.status < 400) {
    const target = resolveTarget(location, upstream.url);
    res.setHeader('Location', target ? proxyUrlFor(target) : location);
  }
  res.status(upstream.status);
  const contentType = upstream.headers.get('content-type') || 'application/octet-stream';
  res.setHeader('Content-Type', contentType);
  for (const [key, value] of upstream.headers.entries()) {
    if (DROP_RESPONSE_HEADERS.includes(key.toLowerCase())) continue;
    if (key.toLowerCase() === 'location') continue;
    try { res.setHeader(key, value); } catch { /* игнорируем некорректные заголовки */ }
  }
  if (!upstream.body) return res.end();
  Readable.fromWeb(upstream.body as any).pipe(res);
}

router.all('/proxy', browserAuth, async (req: any, res) => {
  const raw = typeof req.query.url === 'string' ? req.query.url : '';
  if (!raw) return res.status(400).json({ error: 'Не указан URL' });

  let target: URL;
  try {
    target = new URL(raw);
  } catch {
    return res.status(400).json({ error: 'Некорректный URL' });
  }
  if (target.protocol !== 'http:' && target.protocol !== 'https:') {
    return res.status(400).json({ error: 'Поддерживаются только http/https' });
  }
  // Запрет обращения к внутренней сети и localhost через прокси
  const host = target.hostname.toLowerCase();
  if (host === 'localhost' || host === '127.0.0.1' || host === '::1' || host.endsWith('.local') || /^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(host)) {
    return res.status(403).json({ error: 'Доступ к локальным адресам запрещён' });
  }

  // Тело запроса: парсеры json/urlencoded уже могли его прочитать — восстанавливаем,
  // иначе передаём поток как есть (raw-типы)
  let body: any;
  const method = req.method.toUpperCase();
  if (method !== 'GET' && method !== 'HEAD') {
    if (req.body !== undefined) {
      const ct = String(req.headers['content-type'] || '');
      if (ct.includes('application/x-www-form-urlencoded') && typeof req.body === 'object') {
        body = new URLSearchParams(req.body).toString();
      } else if (ct.includes('application/json') || typeof req.body === 'object') {
        body = JSON.stringify(req.body);
      } else {
        body = String(req.body);
      }
    } else if (req.readable) {
      body = Readable.toWeb(req);
    }
  }

  const headers: Record<string, string> = {
    'Accept': String(req.headers.accept || '*/*'),
    'Accept-Language': String(req.headers['accept-language'] || 'ru-RU,ru;q=0.9,en;q=0.8'),
    'User-Agent': String(req.headers['user-agent'] || 'Mozilla/5.0 (compatible; WeCRM-Browser/1.0)'),
    'Referer': target.toString(),
  };
  const upstreamCt = req.headers['content-type'];
  if (body !== undefined && upstreamCt) headers['Content-Type'] = String(upstreamCt);

  let upstream: Response;
  try {
    upstream = await fetch(target.toString(), {
      method: method as any,
      headers,
      body,
      redirect: 'manual',
      dispatcher,
      signal: AbortSignal.timeout(FETCH_TIMEOUT),
    } as any);
  } catch (e: any) {
    const msg = e?.cause?.code || e?.message || 'Ошибка сети';
    return res.status(502).json({ error: `Не удалось загрузить страницу через прокси: ${msg}` });
  }

  const contentType = (upstream.headers.get('content-type') || '').toLowerCase();

  try {
    if (contentType.includes('text/html')) {
      const buf = Buffer.from(await upstream.arrayBuffer());
      if (buf.length > MAX_HTML_SIZE) {
        res.status(502).json({ error: 'Страница слишком большая для отображения' });
        return;
      }
      const html = rewriteHtml(buf.toString('utf-8'), target.toString());
      res.status(upstream.status);
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      for (const [key, value] of upstream.headers.entries()) {
        if (DROP_RESPONSE_HEADERS.includes(key.toLowerCase()) || key.toLowerCase() === 'location') continue;
        try { res.setHeader(key, value); } catch { /* ignore */ }
      }
      const location = upstream.headers.get('location');
      if (location && upstream.status >= 300 && upstream.status < 400) {
        const loc = resolveTarget(location, upstream.url);
        res.setHeader('Location', loc ? proxyUrlFor(loc) : location);
      }
      res.send(html);
      return;
    }

    if (contentType.includes('text/css')) {
      const buf = Buffer.from(await upstream.arrayBuffer());
      if (buf.length <= MAX_HTML_SIZE) {
        const css = rewriteCss(buf.toString('utf-8'), target.toString());
        res.status(upstream.status);
        res.setHeader('Content-Type', contentType);
        for (const [key, value] of upstream.headers.entries()) {
          if (DROP_RESPONSE_HEADERS.includes(key.toLowerCase()) || key.toLowerCase() === 'location') continue;
          try { res.setHeader(key, value); } catch { /* ignore */ }
        }
        res.send(css);
        return;
      }
      // слишком большой CSS — отдаём как есть
    }

    await pipeUpstream(res, upstream);
  } catch (e) {
    console.error('[Browser] Ошибка отдачи контента:', e);
    if (!res.headersSent) res.status(502).json({ error: 'Ошибка отдачи контента' });
    else res.end();
  }
});

export default router;
