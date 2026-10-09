import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma.js';
import fs from 'fs';
import path from 'path';
import { createHash, randomBytes, randomUUID } from 'crypto';
import { processVkMessage } from '../vk-worker/processor.js';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';
const VK_CLIENT_ID = process.env.VK_CLIENT_ID || '';
const VK_CLIENT_SECRET = process.env.VK_CLIENT_SECRET || '';
const VK_REDIRECT_URI = process.env.VK_REDIRECT_URI || 'https://welans.cc/api/vk/callback';

// ===== VK ID (вход пользователей) =====
// Серверный вариант PKCE: code_verifier хранится на сервере (привязан к state),
// поэтому вход не зависит от localStorage на устройстве (iOS Safari/PWA теряли
// verifier после редиректа на id.vk.ru — обмен кода на токен не происходил).
const vkIdSessions = new Map<string, { verifier: string; expires: number }>();
const VK_ID_SESSION_TTL = 10 * 60 * 1000; // 10 минут

// Ensure uploads dir exists
const UPLOAD_DIR = '/app/uploads';
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// ===== VK Callback API webhook =====
router.post('/webhook', async (req: Request, res: Response) => {
  try {
    const { type, object, group_id, secret } = req.body;

    // Find settings for this group
    const settings = await prisma.vkGroupSettings.findFirst({
      where: { groupId: group_id },
    });

    if (!settings) {
      console.log('[VK Webhook] No settings for group', group_id);
      return res.status(200).send('ok');
    }

    // Verify secret if configured
    if (settings.callbackSecret && secret !== settings.callbackSecret) {
      console.warn('[VK Webhook] Invalid secret for group', group_id);
      return res.status(403).send('invalid secret');
    }

    if (type === 'confirmation') {
      console.log('[VK Webhook] Confirmation request for group', group_id);
      return res.status(200).send(settings.confirmationString || 'ok');
    }

    if (type === 'message_new' || type === 'message_reply') {
      const msg = object?.message;
      if (!msg) {
        return res.status(200).send('ok');
      }

      console.log(`[VK Webhook] ${type} from peer ${msg.peer_id}, msg_id=${msg.id}`);

      // Process the message immediately
      await processVkMessage(msg, settings);
      return res.status(200).send('ok');
    }

    // Acknowledge other events
    return res.status(200).send('ok');
  } catch (err: any) {
    console.error('[VK Webhook] Error:', err);
    return res.status(200).send('ok'); // Always return 200 to VK
  }
});
// ===================================

router.get('/config', (_req, res) => {
  if (!VK_CLIENT_ID) {
    return res.status(500).json({ error: 'VK ID not configured' });
  }
  res.json({ appId: parseInt(VK_CLIENT_ID, 10), redirectUri: VK_REDIRECT_URI });
});

async function downloadVkAvatar(url: string): Promise<string | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) {
      console.error('[VK Avatar Download] HTTP', res.status, url);
      return null;
    }
    const buffer = await res.arrayBuffer();
    const ext = path.extname(new URL(url).pathname) || '.jpg';
    const filename = `${randomUUID()}${ext}`;
    const filepath = path.join(UPLOAD_DIR, filename);
    fs.writeFileSync(filepath, Buffer.from(buffer));
    console.log('[VK Avatar Download] saved to', filepath);
    return `/uploads/${filename}`;
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
  const tokenController = new AbortController();
  const tokenTimeout = setTimeout(() => tokenController.abort(), 20000);
  const tokenRes = await fetch('https://id.vk.ru/oauth2/auth', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    signal: tokenController.signal,
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      client_id: VK_CLIENT_ID,
      device_id: deviceId,
      state,
      redirect_uri: VK_REDIRECT_URI,
      code_verifier: codeVerifier,
    }),
  });
  clearTimeout(tokenTimeout);
  const tokenData: any = await tokenRes.json();
  if (tokenData.error) {
    console.error('[VK ID Auth] Token exchange error:', tokenData);
    return { ok: false as const, errorKey: 'server_error' as const, message: `VK ID error: ${tokenData.error_description || tokenData.error}` };
  }

  const { access_token, user_id, email } = tokenData;
  if (!access_token || !user_id) {
    return { ok: false as const, errorKey: 'no_token' as const, message: 'Failed to obtain access token from VK ID' };
  }

  const userController = new AbortController();
  const userTimeout = setTimeout(() => userController.abort(), 20000);
  const userRes = await fetch('https://id.vk.ru/oauth2/user_info', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Bearer ${access_token}`,
    },
    signal: userController.signal,
    body: new URLSearchParams({ client_id: VK_CLIENT_ID }),
  });
  clearTimeout(userTimeout);
  const userData: any = await userRes.json();
  console.log('[VK ID Auth] userData:', JSON.stringify(userData));

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
router.get('/login-url', (_req, res) => {
  try {
    if (!VK_CLIENT_ID) {
      return res.status(400).json({ error: 'VK ID not configured' });
    }
    // Чистка просроченных сессий
    const now = Date.now();
    for (const [state, session] of vkIdSessions) {
      if (session.expires < now) vkIdSessions.delete(state);
    }
    const state = randomUUID();
    const deviceId = randomUUID();
    const verifier = randomBytes(32).toString('base64url');
    vkIdSessions.set(state, { verifier, expires: now + VK_ID_SESSION_TTL });
    const challenge = createHash('sha256').update(verifier).digest('base64url');
    const params = new URLSearchParams({
      client_id: VK_CLIENT_ID,
      redirect_uri: VK_REDIRECT_URI,
      response_type: 'code',
      state,
      device_id: deviceId,
      scope: 'email',
      code_challenge: challenge,
      code_challenge_method: 'S256',
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
router.post('/id-auth', async (req, res) => {
  try {
    const { code, device_id, state, code_verifier } = req.body;
    if (!code || !device_id || !state || !code_verifier) {
      return res.status(400).json({ error: 'Missing code, device_id, state or code_verifier' });
    }

    const result = await completeVkIdAuth(code, device_id, state, code_verifier);
    if (!result.ok) {
      return res.status(400).json({ error: result.message });
    }
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

router.get('/callback', async (req: Request, res: Response) => {
  try {
    const { code, device_id, state } = req.query;
    if (!code || !device_id || !state) {
      console.error('[VK Callback] Missing params:', req.query);
      return res.redirect('/?vk_error=missing_params');
    }
    // Серверный PKCE: сессия создана в GET /login-url, verifier не покидает сервер
    const session = vkIdSessions.get(state as string);
    if (!session || session.expires < Date.now()) {
      console.error('[VK Callback] Unknown or expired state:', state);
      return res.redirect('/?vk_error=invalid_state');
    }
    vkIdSessions.delete(state as string);

    // ВАЖНО: при type=code_v2 VK возвращает СВОЙ device_id в callback
    // (длинный base64url, ~96 символов) — обмен кода на токен требует именно его,
    // а не device_id из authorize-запроса (иначе id.vk.ru: «invalid device id provided»).
    const result = await completeVkIdAuth(code as string, device_id as string, state as string, session.verifier);
    if (!result.ok) {
      return res.redirect(`/?vk_error=${result.errorKey}`);
    }
    // JWT в fragment (#), чтобы он не попадал в access-логи nginx.
    // Fragment не отправляется на сервер — фронтенд заберёт его из location.hash.
    return res.redirect(`/#vk_token=${result.token}`);
  } catch (err: any) {
    console.error('[VK Callback Error]', err);
    res.redirect('/?vk_error=server_error');
  }
});

router.get('/status', (_req, res) => {
  res.json({
    configured: !!(VK_CLIENT_ID && VK_CLIENT_SECRET),
    clientId: VK_CLIENT_ID ? `${VK_CLIENT_ID.slice(0, 4)}...` : null,
  });
});


// ============ OAuth для токена маркета (market) через VK ID ============
// Приложение переведено на платформу VK ID (id.vk.ru): старый oauth.vk.com
// отклоняет запросы с «invalid_request: Security Error». Флоу — как у /login-url:
// серверный PKCE (code_verifier хранится на сервере, привязан к state).
// access_token VK ID живёт ~1 час, refresh_token сохраняем для автообновления.
const marketOAuthStates = new Map<string, { verifier: string; expires: number }>();
const MARKET_REDIRECT_URI = 'https://welans.cc/api/vk/market-callback';
const MARKET_SCOPE = 'market photos'; // photos — VK удалил методы загрузки фото маркета, фото грузим через upload-методы стены
const MARKET_OAUTH_TTL = 10 * 60 * 1000; // 10 минут

function marketErrorPage(title: string, detail: string): string {
  return `<h3>${title}</h3><p>${detail}</p><p><a href="https://welans.cc/settings">← В настройки CRM</a></p>`;
}

/**
 * GET /api/vk/market-auth
 * Старт серверного VK ID OAuth: редирект на id.vk.ru/authorize (PKCE, response_type=code)
 */
router.get('/market-auth', async (_req, res) => {
  try {
    const s = await prisma.vkGroupSettings.findFirst({ orderBy: { createdAt: 'asc' } });
    if (!s?.marketAppId) {
      return res.status(400).send(marketErrorPage('Не настроено приложение маркета', 'Укажите App ID приложения в CRM: Настройки → ВКонтакте → «Приложение маркета».'));
    }
    // Чистка просроченных state
    const now = Date.now();
    for (const [k, v] of marketOAuthStates) {
      if (v.expires < now) marketOAuthStates.delete(k);
    }
    const state = randomUUID();
    const deviceId = randomUUID();
    const verifier = randomBytes(32).toString('base64url');
    marketOAuthStates.set(state, { verifier, expires: now + MARKET_OAUTH_TTL });
    const challenge = createHash('sha256').update(verifier).digest('base64url');
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: String(s.marketAppId),
      redirect_uri: MARKET_REDIRECT_URI,
      state,
      device_id: deviceId,
      scope: MARKET_SCOPE,
      code_challenge: challenge,
      code_challenge_method: 'S256',
      // принудительно показываем форму согласия: без неё VK ID в цикле редиректит
      // уже авторизованного пользователя при повторном запросе (страница обновляется бесконечно)
      prompt: 'consent',
    });
    res.redirect(`https://id.vk.ru/authorize?${params.toString()}`);
  } catch (err: any) {
    res.status(500).send(marketErrorPage('Ошибка', err.message));
  }
});

/**
 * GET /api/vk/market-callback?code=&device_id=&state=
 * VK ID редиректит сюда после авторизации. Меняем code на токены и сохраняем.
 */
router.get('/market-callback', async (req, res) => {
  try {
    const { code, device_id, state, error, error_description } = req.query as Record<string, string>;
    if (error) {
      return res.status(400).send(marketErrorPage('Авторизация отклонена', error_description || error));
    }
    const session = state ? marketOAuthStates.get(state) : undefined;
    if (!code || !state || !device_id || !session || session.expires < Date.now()) {
      return res.status(400).send(marketErrorPage('Недействительный или просроченный запрос', 'Повторите попытку из CRM (кнопка «Получить токен маркета»).'));
    }
    marketOAuthStates.delete(state);
    const s = await prisma.vkGroupSettings.findFirst({ orderBy: { createdAt: 'asc' } });
    if (!s?.marketAppId) {
      return res.status(400).send(marketErrorPage('Приложение маркета не настроено', 'Укажите App ID приложения в CRM: Настройки → ВКонтакте.'));
    }
    // Обмен кода на токены. ВАЖНО: в запросе должен быть device_id, который вернул
    // VK ID в callback (свой, ~96 символов base64url), а не тот, что отправляли в authorize.
    const tokenRes = await fetch('https://id.vk.ru/oauth2/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code_verifier: session.verifier,
        redirect_uri: MARKET_REDIRECT_URI,
        code,
        client_id: String(s.marketAppId),
        device_id,
        state,
      }),
    });
    const tokenData: any = await tokenRes.json();
    if (tokenData.error || !tokenData.access_token) {
      return res.status(400).send(marketErrorPage('VK ID не выдал токен', `${tokenData.error || 'unknown'}: ${tokenData.error_description || 'нет описания'}. Проверьте, что в настройках приложения VK ID в белом списке redirect URI указан <code>${MARKET_REDIRECT_URI}</code>.`));
    }
    const expiresIn = Number(tokenData.expires_in) || 3600;
    await prisma.vkGroupSettings.update({
      where: { id: s.id },
      data: {
        marketToken: tokenData.access_token,
        marketRefreshToken: tokenData.refresh_token || null,
        marketDeviceId: device_id,
        marketTokenExpiresAt: new Date(Date.now() + expiresIn * 1000),
      },
    });
    res.send('<h3 style="color:#059669">Токен маркета сохранён ✓</h3><p>Теперь можно закрыть эту вкладку и запустить «Товары → Импорт из ВК».</p><p><a href="https://welans.cc/settings">← В настройки CRM</a></p>');
  } catch (err: any) {
    res.status(500).send(marketErrorPage('Ошибка', err.message));
  }
});

export default router;