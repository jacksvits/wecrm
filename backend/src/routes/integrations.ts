import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { authMiddleware } from '../middleware/auth.js';
import { loadTokens } from './tochka.js';

const router = Router();

router.use(authMiddleware);

// GET /api/integrations/status — статус активности интеграций («плагинов»)
router.get('/status', async (_req, res) => {
  try {
    const [email, telephony, max, telegram, vk, yandex, beget, pskovline, tochka] = await Promise.all([
      prisma.emailSettings.findFirst({ select: { isActive: true } }),
      prisma.telephonySettings.findFirst({ select: { isActive: true } }),
      prisma.maxSettings.findFirst({ select: { isActive: true } }),
      prisma.telegramSettings.findFirst({ select: { isActive: true } }),
      prisma.vkGroupSettings.findFirst({ select: { isActive: true } }),
      prisma.yandexSettings.findFirst({ select: { apiKey: true } }),
      prisma.begetSettings.findFirst({ select: { isActive: true } }),
      prisma.pskovlinePluginSettings.findFirst({ select: { isActive: true } }),
      Promise.resolve(!!loadTokens()?.access_token),
    ]);
    res.json({
      email: email?.isActive ?? false,
      telephony: telephony?.isActive ?? false,
      max: max?.isActive ?? false,
      telegram: telegram?.isActive ?? false,
      vk: vk?.isActive ?? false,
      // SMS через Novofon — зависит от телефонии
      sms: telephony?.isActive ?? false,
      yandex: !!yandex?.apiKey,
      beget: beget?.isActive ?? false,
      pskovline: pskovline?.isActive ?? false,
      tochka: tochka === true,
    });
  } catch (err: any) {
    console.error('[integrations] status error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

export default router;
