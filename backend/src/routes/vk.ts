import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma.js';
import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import { processVkMessage } from '../vk-worker/processor.js';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';
const VK_CLIENT_ID = process.env.VK_CLIENT_ID || '';
const VK_CLIENT_SECRET = process.env.VK_CLIENT_SECRET || '';
const VK_REDIRECT_URI = process.env.VK_REDIRECT_URI || 'https://welans.cc/api/vk/callback';

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

router.post('/id-auth', async (req, res) => {
  try {
    const { code, device_id, state, code_verifier } = req.body;
    if (!code || !device_id || !state || !code_verifier) {
      return res.status(400).json({ error: 'Missing code, device_id, state or code_verifier' });
    }

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
        device_id,
        state,
        redirect_uri: VK_REDIRECT_URI,
        code_verifier,
      }),
    });
    clearTimeout(tokenTimeout);
    const tokenData: any = await tokenRes.json();
    if (tokenData.error) {
      console.error('[VK ID Auth] Token exchange error:', tokenData);
      return res.status(400).json({ error: `VK ID error: ${tokenData.error_description || tokenData.error}` });
    }

    const { access_token, user_id, email } = tokenData;
    if (!access_token || !user_id) {
      return res.status(400).json({ error: 'Failed to obtain access token from VK ID' });
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
      return res.status(400).json({ error: `VK ID user info error: ${userData.error_description || userData.error}` });
    }

    const vkUser = userData.user;
    if (!vkUser) {
      return res.status(400).json({ error: 'VK ID user not found' });
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

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: roleName,
        roleId: user.roleId,
        avatar: user.avatar,
      },
    });
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
    const params = new URLSearchParams();
    if (code) params.set('code', code as string);
    if (device_id) params.set('device_id', device_id as string);
    if (state) params.set('state', state as string);
    return res.redirect(`/?${params.toString()}`);
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


// ============ OAuth для токена маркета (market) ============
// Без авторизации: вызывается редиректом из ВК и кнопкой из CRM.
// Защита — одноразовый state (10 минут жизни).
const marketOAuthStates = new Map<string, number>();
const MARKET_REDIRECT_URI = 'https://welans.cc/api/vk/market-callback';
const MARKET_SCOPE = 'market,offline';

/**
 * GET /api/vk/market-auth
 * Старт серверного OAuth: редирект на авторизацию ВК с response_type=code
 */
router.get('/market-auth', async (_req, res) => {
  try {
    const s = await prisma.vkGroupSettings.findFirst({ orderBy: { createdAt: 'asc' } });
    if (!s?.marketAppId || !s?.marketAppSecret) {
      return res.status(400).send('<h3>Не настроено приложение маркета</h3><p>Укажите App ID и Secure key в CRM: Настройки → ВКонтакте → «Приложение маркета».</p>');
    }
    const state = randomUUID();
    marketOAuthStates.set(state, Date.now());
    // чистим протухшие state (>10 мин)
    for (const [k, t] of marketOAuthStates) {
      if (Date.now() - t > 10 * 60 * 1000) marketOAuthStates.delete(k);
    }
    const url = new URL('https://oauth.vk.com/authorize');
    url.searchParams.set('client_id', String(s.marketAppId));
    url.searchParams.set('redirect_uri', MARKET_REDIRECT_URI);
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('scope', MARKET_SCOPE);
    url.searchParams.set('state', state);
    res.redirect(url.toString());
  } catch (err: any) {
    res.status(500).send(`<h3>Ошибка</h3><p>${err.message}</p>`);
  }
});

/**
 * GET /api/vk/market-callback?code=&state=
 * VK редиректит сюда после авторизации. Меняем code на токен и сохраняем.
 */
router.get('/market-callback', async (req, res) => {
  try {
    const { code, state, error, error_description } = req.query as Record<string, string>;
    if (error) {
      return res.status(400).send(`<h3>Авторизация отклонена</h3><p>${error_description || error}</p><p><a href="https://welans.cc/settings">← В настройки CRM</a></p>`);
    }
    if (!state || !marketOAuthStates.has(state)) {
      return res.status(400).send('<h3>Недействительный или просроченный state</h3><p>Повторите попытку из CRM.</p>');
    }
    marketOAuthStates.delete(state);
    const s = await prisma.vkGroupSettings.findFirst({ orderBy: { createdAt: 'asc' } });
    if (!s?.marketAppId || !s?.marketAppSecret) {
      return res.status(400).send('<h3>Приложение маркета не настроено</h3>');
    }
    const tokenUrl = new URL('https://oauth.vk.com/access_token');
    tokenUrl.searchParams.set('client_id', String(s.marketAppId));
    tokenUrl.searchParams.set('client_secret', s.marketAppSecret);
    tokenUrl.searchParams.set('redirect_uri', MARKET_REDIRECT_URI);
    tokenUrl.searchParams.set('code', code);
    const tokenRes = await fetch(tokenUrl.toString());
    const tokenData: any = await tokenRes.json();
    if (tokenData.error || !tokenData.access_token) {
      return res.status(400).send(`<h3>VK не выдал токен</h3><p>${tokenData.error_description || tokenData.error || 'unknown'}</p><p>Проверьте, что добавлен доверенный redirect URI <code>${MARKET_REDIRECT_URI}</code> в настройках приложения ВК.</p>`);
    }
    await prisma.vkGroupSettings.update({
      where: { id: s.id },
      data: { marketToken: tokenData.access_token },
    });
    res.send('<h3 style="color:#059669">Токен маркета сохранён ✓</h3><p>Теперь можно закрыть эту вкладку и запустить «Товары → Импорт из ВК».</p><p><a href="https://welans.cc/settings">← В настройки CRM</a></p>');
  } catch (err: any) {
    res.status(500).send(`<h3>Ошибка</h3><p>${err.message}</p>`);
  }
});

export default router;