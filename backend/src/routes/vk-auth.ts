import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../lib/jwt.js';
import { prisma } from '../lib/prisma.js';
import fs from 'fs';
import path from 'path';
import { createHash, randomBytes, randomUUID } from 'crypto';
import { uploadsRoot, tenantUploadPrefix } from '../lib/tenant.js';
import { recordAuthEvent } from '../lib/auth-events.js';
import { rateLimit } from '../lib/security.js';
import { rejectBlockedIp } from '../lib/ip-access.js';

// ===== Плагин «ВК авторизация»: вход пользователей в CRM через VK ID =====
// Публичные эндпоинты остаются на прежних путях /api/vk/* —
// redirect URI задан в настройках приложения VK ID и не должен меняться.
const router = Router();



/** Настройки плагина: из БД, с фолбэком на переменные окружения (как раньше) */
async function getAuthConfig() {
  const s = await prisma.vkAuthSettings.findFirst({ orderBy: { createdAt: 'asc' } });
  return {
    appId: String(s?.appId || process.env.VK_CLIENT_ID || ''),
    clientSecret: s?.clientSecret || process.env.VK_CLIENT_SECRET || '',
    redirectUri: s?.redirectUri || process.env.VK_REDIRECT_URI || 'https://welans.cc/api/vk/callback',
    isActive: s ? s.isActive : false,
  };
}

// Серверный вариант PKCE: code_verifier хранится на сервере (привязан к state),
// поэтому вход не зависит от localStorage на устройстве (iOS Safari/PWA теряли
// verifier после редиректа на id.vk.ru — обмен кода на токен не происходил).
// Сессии персистентны: restart бэкенда (деплой, crash) больше не убивает
// начатые входы — verifier подгружается из файла.
const VK_SESSIONS_FILE = '/app/data/vk_id_sessions.json';
function loadVkIdSessions(): Map<string, { verifier: string; expires: number }> {
  try {
    const raw = fs.readFileSync(VK_SESSIONS_FILE, 'utf-8');
    return new Map(JSON.parse(raw));
  } catch { return new Map(); }
}
function saveVkIdSessions() {
  try { fs.mkdirSync('/app/data', { recursive: true }); fs.writeFileSync(VK_SESSIONS_FILE, JSON.stringify(Array.from(vkIdSessions))); } catch { /* некритично */ }
}
const vkIdSessions = loadVkIdSessions();
const VK_ID_SESSION_TTL = 10 * 60 * 1000; // 10 минут

function setVkIdSession(state: string, verifier: string, expires: number) {
  vkIdSessions.set(state, { verifier, expires });
  saveVkIdSessions();
}
function deleteVkIdSession(state: string) {
  vkIdSessions.delete(state);
  saveVkIdSessions();
}

/**
 * fetch с ретраями для вызовов id.vk.ru: кратковременные сетевые сбои
 * (ECONNREFUSED при перезапуске сетевых сервисов сервера) не должны срывать вход.
 * 3 попытки, задержка 800/1600 мс, таймаут каждой — 20 с.
 */
async function vkFetchWithRetry(url: string, init: RequestInit, attempt = 0): Promise<globalThis.Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } catch (err: any) {
    if (attempt < 2) {
      const delay = 800 * (attempt + 1);
      console.warn(`[VK ID Auth] fetch failed (попытка ${attempt + 1}/3):`, err?.cause?.code || err?.name || err?.message, `— повтор через ${delay} мс`);
      await new Promise((r) => setTimeout(r, delay));
      return vkFetchWithRetry(url, init, attempt + 1);
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}

// Дедупликация callback: браузеры (особенно iOS Safari/PWA) иногда запрашивают
// callback URL дважды — двойной тап, повторная навигация, восстановление вкладки.
// Раньше первый запрос гасил state, а второй получал invalid_state и выкидывал
// пользователя на страницу входа — VK-авторизация «зацикливалась». Теперь итог
// первого callback переиспользуется: параллельные дубли ждут тот же промис,
// поздние дубли получают сохранённый редирект (90 секунд).
const pendingVkCallbacks = new Map<string, Promise<string>>();
interface VkCallbackResult { redirect: string; token?: string; user?: unknown; expires: number }
const recentVkCallbacks = new Map<string, VkCallbackResult>();
const VK_CALLBACK_RESULT_TTL = 90 * 1000;

router.get('/config', async (_req, res) => {
  const cfg = await getAuthConfig();
  if (!cfg.appId) {
    return res.status(500).json({ error: 'VK ID not configured' });
  }
  res.json({ appId: parseInt(cfg.appId, 10), redirectUri: cfg.redirectUri, active: cfg.isActive });
});

async function downloadVkAvatar(url: string): Promise<string | null> {
  try {
    const res = await fetch(url);
    const declaredSize = Number(res.headers.get('content-length') || 0);
    if (!res.ok || declaredSize > 5 * 1024 * 1024 || !(res.headers.get('content-type') || '').startsWith('image/')) {
      console.error('[VK Avatar Download] HTTP', res.status, url);
      return null;
    }
    const buffer = await res.arrayBuffer();
    if (buffer.byteLength > 5 * 1024 * 1024) return null;
    const rawExt = path.extname(new URL(url).pathname).toLowerCase();
    const ext = ['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(rawExt) ? rawExt : '.jpg';
    const filename = `${randomUUID()}${ext}`;
    const avatarsDir = path.join(uploadsRoot(), 'avatars', 'users');
    fs.mkdirSync(avatarsDir, { recursive: true });
    const filepath = path.join(avatarsDir, filename);
    fs.writeFileSync(filepath, Buffer.from(buffer));
    console.log('[VK Avatar Download] saved to', filepath);
    return `${tenantUploadPrefix() || '/uploads'}/avatars/users/${filename}`;
  } catch (err) {
    console.error('[VK Avatar Download] Error:', err);
    return null;
  }
}

/**
 * Обмен кода VK ID на access token + поиск/создание пользователя CRM.
 * Общая логика для POST /id-auth (legacy, verifier с клиента) и GET /callback
 * (серверный PKCE, verifier из vkIdSessions).
 */
async function completeVkIdAuth(code: string, deviceId: string, state: string, codeVerifier: string) {
  const cfg = await getAuthConfig();
  if (!cfg.isActive) return { ok: false as const, errorKey: 'disabled' as const, message: 'Вход через VK ID отключён администратором' };
  const tokenRes = await vkFetchWithRetry('https://id.vk.ru/oauth2/auth', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      client_id: cfg.appId,
      device_id: deviceId,
      state,
      redirect_uri: cfg.redirectUri,
      code_verifier: codeVerifier,
    }),
  });
  const tokenData: any = await tokenRes.json();
  if (tokenData.error) {
    console.error('[VK ID Auth] Token exchange error:', tokenData);
    return { ok: false as const, errorKey: 'server_error' as const, message: `VK ID error: ${tokenData.error_description || tokenData.error}` };
  }

  const { access_token, user_id, email } = tokenData;
  if (!access_token || !user_id) {
    return { ok: false as const, errorKey: 'no_token' as const, message: 'Failed to obtain access token from VK ID' };
  }

  const userRes = await vkFetchWithRetry('https://id.vk.ru/oauth2/user_info', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Bearer ${access_token}`,
    },
    body: new URLSearchParams({ client_id: cfg.appId }),
  });
  const userData: any = await userRes.json();
  // Не пишем персональные данные VK в серверный журнал.

  if (userData.error) {
    console.error('[VK ID Auth] User info error:', userData);
    return { ok: false as const, errorKey: 'user_info_error' as const, message: `VK ID user info error: ${userData.error_description || userData.error}` };
  }

  const vkUser = userData.user;
  if (!vkUser) {
    return { ok: false as const, errorKey: 'user_info_error' as const, message: 'VK ID user not found' };
  }

  const vkEmail = email || `${user_id}@vk.ru`;
  const vkName = `${vkUser.first_name || ''} ${vkUser.last_name || ''}`.trim() || 'VK User';
  const vkAvatarUrl = vkUser.avatar || null;

  console.log('[VK ID Auth] vkAvatarUrl from VK:', vkAvatarUrl);

  // Download avatar to local server so it works reliably
  let localAvatarPath: string | null = null;
  if (vkAvatarUrl) {
    localAvatarPath = await downloadVkAvatar(vkAvatarUrl);
    console.log('[VK ID Auth] localAvatarPath:', localAvatarPath);
  }

  let user = await prisma.user.findFirst({ where: { email: vkEmail }, include: { role: { select: { name: true } } } });

  if (!user) {
    const bcryptMod = await import('bcryptjs');
    const bcryptLib = (bcryptMod as any).default || bcryptMod;
    const randomPassword = await bcryptLib.hash(
      Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2),
      10
    );
    user = await prisma.user.create({
      data: {
        email: vkEmail,
        password: randomPassword,
        name: vkName,
        avatar: localAvatarPath,
      },
      include: { role: { select: { name: true } } },
    });
  } else if ((!user.avatar || user.avatar.startsWith('http')) && localAvatarPath) {
    // Update avatar if missing or still using external URL
    user = await prisma.user.update({
      where: { id: user.id },
      data: { avatar: localAvatarPath },
      include: { role: { select: { name: true } } },
    });
  }

  const roleName = user.role?.name || 'user';
  const token = jwt.sign(
    { id: user.id, email: user.email, role: roleName },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  return {
    ok: true as const,
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: roleName,
      roleId: user.roleId,
      avatar: user.avatar,
    },
  };
}

/**
 * GET /api/vk/login-url
 * Старт серверного VK ID OAuth: возвращает URL для редиректа на id.vk.ru.
 * code_verifier хранится на сервере (привязан к state), на устройство не передаётся.
 */
router.get('/login-url', rejectBlockedIp, rateLimit({ prefix: 'vk-login-url', windowMs: 15 * 60_000, max: 30 }), async (_req, res) => {
  try {
    const cfg = await getAuthConfig();
    if (!cfg.isActive) return res.status(403).json({ error: 'Вход через VK ID отключён' });
    if (!cfg.appId) {
      return res.status(400).json({ error: 'VK ID not configured' });
    }
    // Чистка просроченных сессий
    const now = Date.now();
    for (const [state, session] of vkIdSessions) {
      if (session.expires < now) deleteVkIdSession(state);
    }
    const state = randomUUID();
    const deviceId = randomUUID();
    const verifier = randomBytes(32).toString('base64url');
    setVkIdSession(state, verifier, now + VK_ID_SESSION_TTL);
    const challenge = createHash('sha256').update(verifier).digest('base64url');
    const params = new URLSearchParams({
      client_id: cfg.appId,
      redirect_uri: cfg.redirectUri,
      response_type: 'code',
      state,
      device_id: deviceId,
      scope: 'email',
      code_challenge: challenge,
      code_challenge_method: 'S256',
      // принудительно показываем форму согласия: без неё VK ID в цикле редиректит
      // уже авторизованного пользователя при повторном запросе (страница бесконечно
      // обновляется) — тот же фикс, что и в market-auth
      prompt: 'consent',
    });
    res.json({ url: `https://id.vk.ru/authorize?${params.toString()}` });
  } catch (err: any) {
    console.error('[VK Login URL Error]', err);
    res.status(500).json({ error: err.message || 'Failed to build VK auth URL' });
  }
});

/**
 * POST /api/vk/id-auth
 * Legacy-вариант: обмен кода на токен с code_verifier с клиента.
 * Новый клиент ходит через GET /login-url → GET /callback.
 */
router.post('/id-auth', rejectBlockedIp, rateLimit({ prefix: 'vk-id-auth', windowMs: 15 * 60_000, max: 30 }), async (req, res) => {
  try {
    const { code, device_id, state, code_verifier } = req.body;
    if (!code || !device_id || !state || !code_verifier) {
      return res.status(400).json({ error: 'Missing code, device_id, state or code_verifier' });
    }

    const result = await completeVkIdAuth(code, device_id, state, code_verifier);
    if (!result.ok) {
      return res.status(400).json({ error: result.message });
    }
    await recordAuthEvent(req, { login: result.user.email, userId: result.user.id, authMethod: 'vk-id' });
    res.json({ token: result.token, user: result.user });
  } catch (err: any) {
    console.error('[VK ID Auth Error]', err);
    const isTimeout = err.name === 'AbortError' || err.name === 'ConnectTimeoutError' ||
                      err.message?.includes('timeout') || err.message?.includes('ETIMEDOUT') ||
                      err.cause?.name === 'ConnectTimeoutError' || err.cause?.code === 'ETIMEDOUT';
    if (isTimeout) {
      return res.status(503).json({ error: 'VK ID сервер временно недоступен. Попробуйте ещё раз.' });
    }
    res.status(500).json({ error: err.message || 'VK ID auth failed' });
  }
});

router.get('/callback', rejectBlockedIp, rateLimit({ prefix: 'vk-callback', windowMs: 15 * 60_000, max: 60 }), async (req: Request, res: Response) => {
  try {
    const { code, device_id, state } = req.query;
    if (!code || !device_id || !state) {
      console.error('[VK Callback] Missing params:', req.query);
      return res.redirect('/?vk_error=missing_params');
    }
    const stateKey = state as string;
    // Параллельный дубль того же callback — ждём и переиспользуем итог первого запроса
    const pending = pendingVkCallbacks.get(stateKey);
    if (pending) {
      console.log('[VK Callback] Параллельный дубль state, ждём итог первого запроса:', stateKey);
      try {
        return res.redirect(await pending);
      } catch {
        return res.redirect('/?vk_error=server_error');
      }
    }
    // Серверный PKCE: сессия создана в GET /login-url, verifier не покидает сервер
    const session = vkIdSessions.get(stateKey);
    if (!session || session.expires < Date.now()) {
      // Поздний дубль (state уже погашен первым запросом) — повторяем сохранённый итог
      const recent = recentVkCallbacks.get(stateKey);
      if (recent && recent.expires > Date.now()) {
        console.log('[VK Callback] Дубль запроса, повторяем сохранённый итог для state:', stateKey);
        return res.redirect(recent.redirect);
      }
      console.error('[VK Callback] Unknown or expired state:', state);
      return res.redirect('/?vk_error=invalid_state');
    }
    deleteVkIdSession(stateKey);

    // ВАЖНО: при type=code_v2 VK возвращает СВОЙ device_id в callback
    // (длинный base64url, ~96 символов) — обмен кода на токен требует именно его,
    // а не device_id из authorize-запроса (иначе id.vk.ru: «invalid device id provided»).
    // Обмен выполняется ровно один раз: промис кладём в pendingVkCallbacks ДО await,
    // чтобы параллельный дубль получил тот же результат.
    interface VkExecOutcome { redirect: string; token?: string; user?: unknown }
    const execPromise = (async (): Promise<VkExecOutcome> => {
      const result = await completeVkIdAuth(code as string, device_id as string, stateKey, session.verifier);
      if (!result.ok) {
        return { redirect: `/?vk_error=${result.errorKey}` };
      }
      await recordAuthEvent(req, { login: result.user.email, userId: result.user.id, authMethod: 'vk-id' });
      // Основной путь: state в query (?vk_state=) — токен фронтенд обменяет через
      // POST /api/vk/exchange. Fragment #vk_token оставлен как фолбэк: iOS Safari
      // после OAuth-редиректа может потерять fragment, query — никогда.
      return { redirect: `/?vk_state=${stateKey}#vk_token=${result.token}`, token: result.token, user: result.user };
    })();
    const redirectPromise = execPromise.then((o) => o.redirect);
    pendingVkCallbacks.set(stateKey, redirectPromise);
    try {
      const outcome = await execPromise;
      const redirect = outcome.redirect;
      recentVkCallbacks.set(stateKey, {
        redirect,
        token: outcome.token,
        user: outcome.user,
        expires: Date.now() + VK_CALLBACK_RESULT_TTL,
      });
      // чистка просроченных итогов
      for (const [k, v] of recentVkCallbacks) {
        if (v.expires < Date.now()) recentVkCallbacks.delete(k);
      }
      return res.redirect(redirect);
    } finally {
      pendingVkCallbacks.delete(stateKey);
    }
  } catch (err: any) {
    console.error('[VK Callback Error]', err);
    res.redirect('/?vk_error=server_error');
  }
});

/**
 * POST /api/vk/exchange
 * Обмен state (из ?vk_state= после callback) на JWT. Фолбэк для браузеров,
 * где fragment #vk_token после OAuth-редиректа теряется (iOS Safari/PWA).
 * state — неугадываемый UUID, результат живёт 90 секунд после callback.
 */
router.post('/exchange', rejectBlockedIp, rateLimit({ prefix: 'vk-exchange', windowMs: 15 * 60_000, max: 30 }), async (req: Request, res: Response) => {
  const state = typeof req.body?.state === 'string' ? req.body.state : '';
  if (!state) return res.status(400).json({ error: 'Missing state' });
  const recent = recentVkCallbacks.get(state);
  if (!recent || recent.expires < Date.now() || !recent.token) {
    return res.status(410).json({ error: 'Сессия входа устарела. Попробуйте ещё раз.' });
  }
  res.json({ token: recent.token, user: recent.user });
});

router.get('/status', async (_req, res) => {
  const cfg = await getAuthConfig();
  res.json({
    configured: !!(cfg.appId && cfg.clientSecret),
    clientId: cfg.appId ? `${cfg.appId.slice(0, 4)}...` : null,
  });
});

export default router;
