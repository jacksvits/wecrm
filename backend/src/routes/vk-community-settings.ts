import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import crypto from 'crypto';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';

// ===== Настройки плагина «ВК сообщество» =====
const router = Router();
// ===== Authorization Code Flow для «Токена публикации на стене» =====
// Implicit-токены ВК привязаны к IP выдачи (Error 5 с сервера) — поэтому code flow:
// ВК возвращает код на наш сервер, сервер обменивает его на токен с Secure key.
const WALL_REDIRECT_URI = 'https://welans.cc/api/vk-community-settings/wall-callback';

router.get('/wall-callback', async (req, res) => {
  try {
    const { code, state, error, error_description } = req.query as any;
    const s = await prisma.vkCommunitySettings.findFirst();
    if (!s) return res.status(500).send('Плагин «ВК сообщество» не настроен');
    if (error) return res.status(400).send('Авторизация отменена: ' + String(error_description || error));
    if (!code || typeof code !== 'string') return res.status(400).send('Нет параметра code');
    if (!s.wallOAuthState || state !== s.wallOAuthState) return res.status(403).send('Неверный state — повторите подключение');
    const qs = new URLSearchParams({
      client_id: s.wallAppId!,
      client_secret: s.wallAppSecret!,
      redirect_uri: WALL_REDIRECT_URI,
      code,
      v: '5.199',
    });
    const r = await fetch('https://oauth.vk.com/access_token?' + qs.toString());
    const j: any = await r.json();
    if (!j.access_token) return res.status(502).send('ВК не выдал токен: ' + JSON.stringify(j).slice(0, 300));
    await prisma.vkCommunitySettings.update({
      where: { id: s.id },
      data: { wallAccessToken: j.access_token as string, wallOAuthState: null },
    });
    res.send('<!DOCTYPE html><html lang="ru"><head><meta charset="utf-8"><title>WeLANS CRM</title></head><body style="font-family:sans-serif;padding:40px"><h2>✅ Публикация на стене подключена</h2><p>Токен сохранён в CRM. Это окно можно закрыть.</p></body></html>');
  } catch (err) {
    console.error('[vk-wall-callback]', err);
    res.status(500).send('Ошибка подключения');
  }
});

router.use(authMiddleware);

const adminOnly = (req: AuthRequest, res: any, next: any) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Требуются права администратора' });
  }
  next();
};
router.use(adminOnly);

const settingsSchema = z.object({
  groupId: z.number().int().min(1),
  // Пустая строка = «токен не меняем» (UI очищает поле после загрузки)
  accessToken: z.string().default(''),
  wallAccessToken: z.string().default(''),
  wallAppId: z.string().default(''),
  wallAppSecret: z.string().default(''),
  defaultCreatorId: z.string().optional().nullable(),
  defaultProjectId: z.string().optional().nullable(),
  assigneeIds: z.array(z.string()).default([]),
  autoCreateContact: z.boolean().default(true),
  autoReply: z.boolean().default(false),
  isActive: z.boolean().default(true),
  callbackSecret: z.string().optional().nullable(),
  confirmationString: z.string().optional().nullable(),
});

router.get('/', async (_req, res) => {
  const s = await prisma.vkCommunitySettings.findFirst();
  if (!s) return res.json(null);
  const { accessToken, wallAccessToken, wallAppSecret, wallOAuthState, ...rest } = s;
  res.json({ ...rest, hasToken: !!accessToken, hasWallToken: !!wallAccessToken, hasWallAppId: !!s.wallAppId, hasWallAppSecret: !!wallAppSecret });
});

router.post('/', async (req: AuthRequest, res) => {
  try {
    const data = settingsSchema.parse(req.body);
    const existing = await prisma.vkCommunitySettings.findFirst();
    // При первом сохранении токен обязателен
    if (!existing && !data.accessToken) {
      return res.status(400).json({ error: 'Токен сообщества обязателен' });
    }
    let s;
    if (existing) {
      const payload: any = { ...data };
      // Пустой токен не затирает сохранённое значение (UI очищает поле после загрузки)
      if (!payload.accessToken && existing.accessToken) delete payload.accessToken;
      if (!payload.wallAccessToken && existing.wallAccessToken) delete payload.wallAccessToken;
      if (!payload.wallAppId && existing.wallAppId) delete payload.wallAppId;
      if (!payload.wallAppSecret && existing.wallAppSecret) delete payload.wallAppSecret;
      s = await prisma.vkCommunitySettings.update({ where: { id: existing.id }, data: payload });
    } else {
      s = await prisma.vkCommunitySettings.create({ data: data as any });
    }
    const { accessToken, wallAccessToken, wallAppSecret, wallOAuthState, ...rest } = s;
    res.json({ ...rest, hasToken: !!accessToken, hasWallToken: !!wallAccessToken, hasWallAppId: !!s.wallAppId, hasWallAppSecret: !!wallAppSecret });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/', async (_req, res) => {
  await prisma.vkCommunitySettings.deleteMany();
  res.json({ success: true });
});

router.get('/wall-auth-url', async (req, res) => {
  try {
    const s = await prisma.vkCommunitySettings.findFirst();
    if (!s?.wallAppId || !s.wallAppSecret) {
      return res.status(400).json({ error: 'Сначала укажите App ID и Secure key приложения и сохраните настройки' });
    }
    const state = crypto.randomBytes(16).toString('hex');
    await prisma.vkCommunitySettings.update({ where: { id: s.id }, data: { wallOAuthState: state } });
    const url = 'https://oauth.vk.com/authorize?' + new URLSearchParams({
      client_id: s.wallAppId,
      redirect_uri: WALL_REDIRECT_URI,
      scope: 'wall,photos',
      response_type: 'code',
      state,
      v: '5.199',
    }).toString();
    res.json({ url });
  } catch (err) {
    console.error('[vk-wall-auth]', err);
    res.status(500).json({ error: 'Не удалось построить ссылку авторизации' });
  }
});

export default router;
