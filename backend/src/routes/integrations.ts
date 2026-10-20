import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { authMiddleware } from '../middleware/auth.js';
import { loadTokens } from './tochka.js';

const router = Router();

router.use(authMiddleware);

// GET /api/integrations/status — статус активности интеграций («плагинов»)
router.get('/status', async (_req, res) => {
  try {
    const [email, telephony, max, telegram, vkAuth, vkMarket, vkCommunity, yandex, dgis, beget, pskovline, onec, tochka, vpn, diadoc, tochkaAcquiring, ozon, hikvision] = await Promise.all([
      prisma.emailSettings.findFirst({ select: { isActive: true } }),
      prisma.telephonySettings.findFirst({ select: { isActive: true } }),
      prisma.maxSettings.findFirst({ select: { isActive: true } }),
      prisma.telegramSettings.findFirst({ select: { isActive: true } }),
      prisma.vkAuthSettings.findFirst({ select: { isActive: true } }),
      prisma.vkMarketSettings.findFirst({ select: { isActive: true } }),
      prisma.vkCommunitySettings.findFirst({ select: { isActive: true } }),
      prisma.yandexSettings.findFirst({ select: { apiKey: true } }),
      prisma.dgisSettings.findFirst({ select: { apiKey: true } }),
      prisma.begetSettings.findFirst({ select: { isActive: true } }),
      prisma.pskovlinePluginSettings.findFirst({ select: { isActive: true } }),
      prisma.oneCPluginSettings.findFirst({ select: { isActive: true } }),
      Promise.resolve(!!loadTokens()?.access_token),
      prisma.vpnSettings.findFirst({ select: { isActive: true } }),
      prisma.diadocPluginSettings.findFirst({ select: { isActive: true } }),
      prisma.tochkaAcquiringSettings.findFirst({ select: { isActive: true } }),
      prisma.ozonSellerSettings.findFirst({ select: { isActive: true } }),
      prisma.hikvisionPluginSettings.findFirst({ select: { isActive: true } }),
    ]);
    res.json({
      email: email?.isActive ?? false,
      telephony: telephony?.isActive ?? false,
      max: max?.isActive ?? false,
      telegram: telegram?.isActive ?? false,
      vkAuth: vkAuth?.isActive ?? false,
      vkMarket: vkMarket?.isActive ?? false,
      vkCommunity: vkCommunity?.isActive ?? false,
      // SMS через Novofon — зависит от телефонии
      sms: telephony?.isActive ?? false,
      yandex: !!yandex?.apiKey,
      dgis: !!dgis?.apiKey,
      beget: beget?.isActive ?? false,
      pskovline: pskovline?.isActive ?? false,
      onec: onec?.isActive ?? false,
      tochka: tochka === true,
      vpn: vpn?.isActive ?? false,
      diadoc: diadoc?.isActive ?? false,
      tochkaAcquiring: tochkaAcquiring?.isActive ?? false,
      ozon: ozon?.isActive ?? false,
      hikvision: hikvision?.isActive ?? false,
    });
  } catch (err: any) {
    console.error('[integrations] status error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

export default router;
