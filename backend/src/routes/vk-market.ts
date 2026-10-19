import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { createHash, randomBytes, randomUUID } from 'crypto';

// ===== Плагин «ВК товары»: OAuth токена маркета (VK ID) =====
// Публичные пути остаются прежними (/api/vk/market-auth, /api/vk/market-callback) —
// redirect URI внесён в белый список приложения VK ID и не должен меняться.
const router = Router();

// Приложение переведено на платформу VK ID (id.vk.ru): старый oauth.vk.com
// отклоняет запросы с «invalid_request: Security Error». Флоу — серверный PKCE
// (code_verifier хранится на сервере, привязан к state).
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
    const s = await prisma.vkMarketSettings.findFirst({ orderBy: { createdAt: 'asc' } });
    if (!s?.marketAppId) {
      return res.status(400).send(marketErrorPage('Не настроено приложение маркета', 'Укажите App ID приложения в CRM: Настройки → ВК товары → «Приложение маркета».'));
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
    const s = await prisma.vkMarketSettings.findFirst({ orderBy: { createdAt: 'asc' } });
    if (!s?.marketAppId) {
      return res.status(400).send(marketErrorPage('Приложение маркета не настроено', 'Укажите App ID приложения в CRM: Настройки → ВК товары.'));
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
    await prisma.vkMarketSettings.update({
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
