import { Router } from 'express';
import { ProxyAgent } from 'undici';
import { Readable } from 'stream';
import crypto from 'crypto';
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
//
// Cookie внешних сайтов: сохраняются в браузере пользователя под префиксом
// wecrm_b_<hash8>_<имя> (hash — от домена целевого сайта), Path ограничен
// /api/browser/proxy. Так сессии сайтов (авторизации) работают, а имена
// не пересекаются с cookie CRM и между разными сайтами.

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
];

const JAR_PREFIX = 'wecrm_b_';

// Короткий хэш домена — изолирует cookie разных сайтов друг от друга
function hostHash(hostname: string): string {
  return crypto.createHash('sha1').update(hostname.toLowerCase()).digest('hex').slice(0, 8);
}

// Cookie целевого сайта из jar-кук запроса (имена вида wecrm_b_<hash8>_<имя>)
function jarCookiesFor(req: any, hostname: string): string | undefined {
  const raw = req.headers.cookie;
  if (!raw) return undefined;
  const prefix = JAR_PREFIX + hostHash(hostname) + '_';
  const pairs: string[] = [];
  for (const part of raw.split(';')) {
    const idx = part.indexOf('=');
    if (idx === -1) continue;
    const name = part.slice(0, idx).trim();
    if (name.startsWith(prefix)) {
      pairs.push(`${name.slice(prefix.length)}=${part.slice(idx + 1).trim()}`);
    }
  }
  return pairs.length ? pairs.join('; ') : undefined;
}

// Перезапись Set-Cookie от сайта: изолируемое имя + Path только на прокси.
// Domain убираем (cookie привязывается к домену CRM), Secure сохраняем только
// если наш origin https (в production NODE_ENV=production и https).
function rewriteSetCookie(setCookieValue: string, hostname: string): string {
  const parts = setCookieValue.split(';').map(p => p.trim()).filter(Boolean);
  if (!parts.length) return setCookieValue;
  const nv = parts[0];
  const eq = nv.indexOf('=');
  const name = eq === -1 ? nv : nv.slice(0, eq);
  const value = eq === -1 ? '' : nv.slice(eq + 1);
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  const attrs: string[] = [];
  for (const attr of parts.slice(1)) {
    const lower = attr.toLowerCase();
    // Domain/Path от сайта переносить нельзя — они относительны его домена
    if (lower.startsWith('domain') || lower.startsWith('path') || lower === 'secure') continue;
    if (lower.startsWith('samesite')) continue; // фиксируем Lax ниже
    attrs.push(attr);
  }
  return `${JAR_PREFIX}${hostHash(hostname)}_${name}=${value}; Path=/api/browser/proxy; HttpOnly; SameSite=Lax${secure}${attrs.length ? '; ' + attrs.join('; ') : ''}`;
}

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

// Общая пересылка заголовков ответа upstream → клиент: снимает запрещённые
// заголовки, перезаписывает Location и изолирует Set-Cookie
function sendUpstreamHeaders(res: any, upstream: Response) {
  const location = upstream.headers.get('location');
  const setCookies = (upstream.headers as any).getSetCookie ? (upstream.headers as any).getSetCookie() : [];
  const hostname = upstream.url ? new URL(upstream.url).hostname : '';
  const newCookies = setCookies.map((sc: string) => rewriteSetCookie(sc, hostname));

  res.status(upstream.status);
  const contentType = upstream.headers.get('content-type');
  if (contentType) res.setHeader('Content-Type', contentType);
  for (const [key, value] of upstream.headers.entries()) {
    const lower = key.toLowerCase();
    if (DROP_RESPONSE_HEADERS.includes(lower) || lower === 'location' || lower === 'set-cookie') continue;
    try { res.setHeader(key, value); } catch { /* игнорируем некорректные заголовки */ }
  }
  if (location && upstream.status >= 300 && upstream.status < 400) {
    const loc = resolveTarget(location, upstream.url);
    res.setHeader('Location', loc ? proxyUrlFor(loc) : location);
  }
  if (newCookies.length) {
    res.setHeader('Set-Cookie', newCookies);
  }
}

async function pipeUpstream(res: any, upstream: Response) {
  sendUpstreamHeaders(res, upstream);
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
  // Параметры формы/ссылки (?q=test и т.д.) дописываем в URL цели:
  // формы на сайтах отправляются на action=.../proxy?url=<цель>, и их поля
  // приходят сюда дополнительными параметрами — без слияния поиск/POST-формы
  // на сайте ломаются. Берём сырой query, чтобы сохранить кодировку значений.
  {
    const rawQuery = String(req.originalUrl || '').split('?')[1] || '';
    const extraPairs: string[] = [];
    for (const pair of rawQuery.split('&')) {
      if (!pair) continue;
      const eq = pair.indexOf('=');
      const key = eq === -1 ? pair : pair.slice(0, eq);
      if (key === 'url' || key === 'token') continue;
      extraPairs.push(pair);
    }
    if (extraPairs.length) {
      target.search = (target.search ? target.search + '&' : '?') + extraPairs.join('&');
    }
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
  // Cookie сайта из jar (изолированные wecrm_b_<hash8>_*)
  const jar = jarCookiesFor(req, target.hostname);
  if (jar) headers['Cookie'] = jar;
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
    if (contentType.includes('text/html') || contentType.includes('text/css')) {
      const buf = Buffer.from(await upstream.arrayBuffer());
      if (buf.length > MAX_HTML_SIZE) {
        // слишком большой документ — отдаём без перезаписи
        await pipeUpstreamWithBuffer(res, upstream, buf);
        return;
      }
      const text = contentType.includes('text/html')
        ? rewriteHtml(buf.toString('utf-8'), target.toString())
        : rewriteCss(buf.toString('utf-8'), target.toString());
      sendUpstreamHeaders(res, upstream);
      res.setHeader('Content-Type', contentType);
      res.send(text);
      return;
    }

    await pipeUpstream(res, upstream);
  } catch (e) {
    console.error('[Browser] Ошибка отдачи контента:', e);
    if (!res.headersSent) res.status(502).json({ error: 'Ошибка отдачи контента' });
    else res.end();
  }
});

// Отдача уже скачанного буфера, если документ не влез в лимит перезаписи
async function pipeUpstreamWithBuffer(res: any, upstream: Response, buf: Buffer) {
  sendUpstreamHeaders(res, upstream);
  res.setHeader('Content-Type', upstream.headers.get('content-type') || 'application/octet-stream');
  res.send(buf);
}

export default router;
