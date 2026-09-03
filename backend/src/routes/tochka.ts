import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import https from 'https';
import fs from 'fs';
import path from 'path';
import { URL } from 'url';

const router = Router();

const TOCHKA_BASE = 'https://enter.tochka.com/uapi';
const TOKEN_FILE = path.join('/app/data', 'tochka_tokens.json');
const TOCHKA_CLIENT_ID = process.env.TOCHKA_CLIENT_ID || '';
const TOCHKA_CLIENT_SECRET = process.env.TOCHKA_CLIENT_SECRET || '';
const TOCHKA_REDIRECT_URI = process.env.TOCHKA_REDIRECT_URI || 'https://welans.cc/api/tochka/callback';

const httpsAgent = new https.Agent({ rejectUnauthorized: false });

interface TochkaTokens {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  token_type: string;
}

function decodeJwtExp(token: string): number | null {
  try {
    const parts = token.split('.');
    const payload = JSON.parse(Buffer.from(parts[1] + '==', 'base64url').toString());
    return payload.exp || null;
  } catch { return null; }
}

function loadTokens(): TochkaTokens | null {
  try {
    if (fs.existsSync(TOKEN_FILE)) {
      const raw = JSON.parse(fs.readFileSync(TOKEN_FILE, 'utf-8'));
      // Проверяем реальный expiry JWT, а не expires_at из файла
      const jwtExp = decodeJwtExp(raw.access_token);
      if (jwtExp && Date.now() > jwtExp * 1000) {
        console.log('[Tochka] JWT token expired, ignoring saved token');
        return null;
      }
      return raw;
    }
  } catch (e) {
    console.error('[Tochka] Failed to load tokens:', e);
  }
  return null;
}

function saveTokens(tokens: TochkaTokens) {
  fs.mkdirSync(path.dirname(TOKEN_FILE), { recursive: true });
  fs.writeFileSync(TOKEN_FILE, JSON.stringify(tokens, null, 2));
}

function tochkaRequest(urlPath: string, options: { headers?: Record<string, string>; method?: string; body?: string } = {}): Promise<{ status: number; body: any; text: string }> {
  return new Promise((resolve, reject) => {
    const url = urlPath.startsWith('http') ? urlPath : `${TOCHKA_BASE}${urlPath}`;
    const parsed = new URL(url);
    const req = https.request({
      hostname: parsed.hostname,
      port: parsed.port || 443,
      path: parsed.pathname + parsed.search,
      method: options.method || 'GET',
      agent: httpsAgent,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({ status: res.statusCode || 0, body: json, text: data });
        } catch {
          resolve({ status: res.statusCode || 0, body: null, text: data });
        }
      });
    });
    req.on('error', (err) => reject(err));
    if (options.body) req.write(options.body);
    req.end();
  });
}

async function tokenRequest(body: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'enter.tochka.com',
      path: '/connect/token',
      method: 'POST',
      agent: httpsAgent,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

// GET /api/tochka/auth-url — URL для OAuth авторизации ИЛИ обработка callback (без auth — нужен для редиректа от Точки)
router.get('/auth-url', async (req, res) => {
  // Если пришел ?code= от Точки Банк — обрабатываем как callback
  const { code, state, error: oauthError } = req.query;
  if (oauthError) return res.status(400).json({ error: 'OAuth error', details: oauthError });
  if (code && typeof code === 'string') {
    try {
      const tokenBody = `grant_type=authorization_code&client_id=${encodeURIComponent(TOCHKA_CLIENT_ID)}&client_secret=${encodeURIComponent(TOCHKA_CLIENT_SECRET)}&code=${encodeURIComponent(code)}&redirect_uri=${encodeURIComponent(TOCHKA_REDIRECT_URI)}`;
      const tokenRes = await tokenRequest(tokenBody);
      if (tokenRes.status !== 200) return res.status(500).json({ error: 'Token exchange failed', details: tokenRes.body });

      const jwtExp = decodeJwtExp(tokenRes.body.access_token);
      const expiresAt = jwtExp ? jwtExp * 1000 : Date.now() + (tokenRes.body.expires_in || 86400) * 1000;
      saveTokens({
        access_token: tokenRes.body.access_token,
        refresh_token: tokenRes.body.refresh_token || '',
        expires_at: expiresAt,
        token_type: tokenRes.body.token_type || 'bearer',
      });

      // Редирект обратно в приложение с сообщением об успехе
      return res.redirect('https://welans.cc/director?tochka=connected');
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  // Иначе — генерируем URL для авторизации
  try {
    const ccBody = `grant_type=client_credentials&client_id=${encodeURIComponent(TOCHKA_CLIENT_ID)}&client_secret=${encodeURIComponent(TOCHKA_CLIENT_SECRET)}&scope=accounts+balances+customers+statements`;
    const ccRes = await tokenRequest(ccBody);
    if (ccRes.status !== 200) return res.status(500).json({ error: 'Failed to get client token', details: ccRes.body });

    const consentRes = await tochkaRequest('/v1.0/consents', {
      method: 'POST',
      headers: { Authorization: `Bearer ${ccRes.body.access_token}` },
      body: JSON.stringify({
        Data: {
          permissions: ['ReadAccountsBasic','ReadAccountsDetail','ReadBalances','ReadStatements','ReadCustomerData'],
          expirationDateTime: '2030-12-31T00:00:00+00:00'
        }
      })
    });
    if (consentRes.status !== 200 && consentRes.status !== 201) return res.status(500).json({ error: 'Failed to create consent', details: consentRes.body });

    const consentId = consentRes.body?.Data?.consentId;
    const state = Math.random().toString(36).substring(2);

    const params = new URLSearchParams({
      client_id: TOCHKA_CLIENT_ID,
      response_type: 'code',
      state,
      redirect_uri: TOCHKA_REDIRECT_URI,
      scope: 'accounts balances customers statements',
      consent_id: consentId,
    });
    const authUrl = `https://enter.tochka.com/connect/authorize?${params.toString()}`;
    res.json({ authUrl, state, consentId });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/tochka/callback — обработка OAuth callback
router.get('/callback', async (req, res) => {
  const { code, state, error: oauthError } = req.query;
  if (oauthError) return res.status(400).json({ error: 'OAuth error', details: oauthError });
  if (!code || typeof code !== 'string') return res.status(400).json({ error: 'Missing code' });

  try {
    const tokenBody = `grant_type=authorization_code&client_id=${encodeURIComponent(TOCHKA_CLIENT_ID)}&client_secret=${encodeURIComponent(TOCHKA_CLIENT_SECRET)}&code=${encodeURIComponent(code)}&redirect_uri=${encodeURIComponent(TOCHKA_REDIRECT_URI)}`;
    const tokenRes = await tokenRequest(tokenBody);
    if (tokenRes.status !== 200) return res.status(500).json({ error: 'Token exchange failed', details: tokenRes.body });

    const jwtExp = decodeJwtExp(tokenRes.body.access_token);
    const expiresAt = jwtExp ? jwtExp * 1000 : Date.now() + (tokenRes.body.expires_in || 86400) * 1000;
    saveTokens({
      access_token: tokenRes.body.access_token,
      refresh_token: tokenRes.body.refresh_token || '',
      expires_at: expiresAt,
      token_type: tokenRes.body.token_type || 'bearer',
    });

    res.json({ status: 'ok', message: 'Точка Банк подключена' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/tochka/refresh — обновление токена
router.post('/refresh', authMiddleware, async (_req, res) => {
  const tokens = loadTokens();
  if (!tokens?.refresh_token) return res.status(400).json({ error: 'No refresh token' });

  try {
    const refreshBody = `grant_type=refresh_token&client_id=${encodeURIComponent(TOCHKA_CLIENT_ID)}&client_secret=${encodeURIComponent(TOCHKA_CLIENT_SECRET)}&refresh_token=${encodeURIComponent(tokens.refresh_token)}`;
    const tokenRes = await tokenRequest(refreshBody);
    if (tokenRes.status !== 200) return res.status(500).json({ error: 'Refresh failed', details: tokenRes.body });

    const jwtExp = decodeJwtExp(tokenRes.body.access_token);
    const expiresAt = jwtExp ? jwtExp * 1000 : Date.now() + (tokenRes.body.expires_in || 86400) * 1000;
    saveTokens({
      access_token: tokenRes.body.access_token,
      refresh_token: tokenRes.body.refresh_token || tokens.refresh_token,
      expires_at: expiresAt,
      token_type: tokenRes.body.token_type || 'bearer',
    });
    res.json({ status: 'ok', expires_at: expiresAt });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/tochka/status
router.get('/status', authMiddleware, (_req, res) => {
  const tokens = loadTokens();
  res.json({ connected: !!tokens?.access_token, expires_at: tokens?.expires_at || null, expired: false });
});

// GET /api/tochka/accounts
router.get('/accounts', authMiddleware, async (_req, res) => {
  try {
    const tokens = loadTokens();
    if (!tokens?.access_token) return res.json({ accounts: [], totalBalance: 0, connected: false });

    const headers = { Authorization: `Bearer ${tokens.access_token}` };
    const dataRes = await tochkaRequest('/open-banking/v1.0/accounts', { headers });
    if (dataRes.status !== 200) return res.json({ accounts: [], totalBalance: 0, error: `API ${dataRes.status}`, connected: true });

    const accounts = (dataRes.body?.Data?.Account || []).map((a: any) => ({
      id: a.accountId, name: a.nickname || a.accountId, number: a.accountId, currency: a.currency || 'RUB'
    }));

    let totalBalance = 0;
    for (const acc of accounts) {
      try {
        const balRes = await tochkaRequest(`/open-banking/v1.0/accounts/${acc.id}/balances`, { headers });
        if (balRes.status === 200) {
          const amount = parseFloat(balRes.body?.Data?.Balance?.[0]?.Amount?.amount || 0);
          acc.balance = amount; totalBalance += amount;
        } else acc.balance = 0;
      } catch { acc.balance = 0; }
    }
    res.json({ accounts, totalBalance, currency: 'RUB', connected: true });
  } catch (err: any) {
    res.json({ accounts: [], totalBalance: 0, error: err.message, connected: false });
  }
});

// GET /api/tochka/customer
router.get('/customer', authMiddleware, async (_req, res) => {
  try {
    const tokens = loadTokens();
    if (!tokens?.access_token) return res.json({ name: '', inn: '', kpp: '', connected: false });
    const headers = { Authorization: `Bearer ${tokens.access_token}` };
    const dataRes = await tochkaRequest('/open-banking/v1.0/customers', { headers });
    if (dataRes.status !== 200) return res.json({ name: '', inn: '', kpp: '', error: `API ${dataRes.status}`, connected: true });
    const customer = dataRes.body?.Data?.Customer?.[0];
    res.json({ name: customer?.name || '', inn: customer?.inn || '', kpp: customer?.kpp || '', connected: true });
  } catch (err: any) {
    res.json({ name: '', inn: '', kpp: '', error: err.message, connected: false });
  }
});

export default router;
