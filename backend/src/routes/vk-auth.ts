import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma.js';
import fs from 'fs';
import path from 'path';
import { createHash, randomBytes, randomUUID } from 'crypto';
import { uploadsRoot, tenantUploadPrefix } from '../lib/tenant.js';

// ===== Плагин «ВК авторизация»: вход пользователей в CRM через VK ID =====
// Публичные эндпоинты остаются на прежних путях /api/vk/* —
// redirect URI задан в настройках приложения VK ID и не должен меняться.
const router = Router();

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

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
    if (!res.ok) {
      console.error('[VK Avatar Download] HTTP', res.status, url);
      return null;
    }
    const buffer = await res.arrayBuffer();
    const ext = path.extname(new URL(url).pathname) || '.jpg';
    const filename = `${randomUUID()}${ext}`;
    const filepath = path.join(uploadsRoot(), filename);
    fs.writeFileSync(filepath, Buffer.from(buffer));
    console.log('[VK Avatar Download] saved to', filepath);
    return `/uploads${tenantUploadPrefix()}/${filename}`;
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
  const tokenController = new AbortController();
  const tokenTimeout = setTimeout(() => tokenController.abort(), 20000);
  const tokenRes = await fetch('https://id.vk.ru/oauth2/auth', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    signal: tokenController.signal,
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
    body: new URLSearchParams({ client_id: cfg.appId }),
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
router.get('/login-url', async (_req, res) => {
  try {
    const cfg = await getAuthConfig();
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
    deleteVkIdSession(state as string);

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

router.get('/status', async (_req, res) => {
  const cfg = await getAuthConfig();
  res.json({
    configured: !!(cfg.appId && cfg.clientSecret),
    clientId: cfg.appId ? `${cfg.appId.slice(0, 4)}...` : null,
  });
});

export default router;
