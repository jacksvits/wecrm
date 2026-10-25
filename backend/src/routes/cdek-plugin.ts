import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { authMiddleware } from '../middleware/auth.js';
import { cdekApi, cdekBaseUrl, getCdekSettings, getCdekToken, resetCdekToken } from '../lib/cdek.js';

const router = Router();

// Настройки плагина CDEK: GET — состояние без секретов, POST — сохранение, /test — проверка подключения
const saveSchema = z.object({
  isActive: z.boolean().optional(),
  environment: z.enum(['test', 'prod']).optional(),
  account: z.string().max(255).optional(),
  // Пустая строка = не менять сохранённый секрет
  securePassword: z.string().max(255).optional(),
  senderCityCode: z.number().int().nullable().optional(),
  senderCompany: z.string().max(255).optional(),
  senderName: z.string().max(255).optional(),
  senderPhone: z.string().max(50).optional(),
  senderAddress: z.string().max(500).optional(),
});

router.get('/', authMiddleware, async (_req, res) => {
  try {
    const s = await prisma.cdekSettings.findUnique({ where: { id: 1 } });
    res.json({
      isActive: s?.isActive ?? false,
      environment: s?.environment ?? 'test',
      account: s?.account ?? '',
      hasSecurePassword: !!s?.securePassword,
      senderCityCode: s?.senderCityCode ?? null,
      senderCompany: s?.senderCompany ?? '',
      senderName: s?.senderName ?? '',
      senderPhone: s?.senderPhone ?? '',
      senderAddress: s?.senderAddress ?? '',
      webhookToken: s?.webhookToken || '',
      baseUrl: cdekBaseUrl(s?.environment),
    });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/', authMiddleware, async (req, res) => {
  try {
    const parsed = saveSchema.safeParse(req.body ?? {});
    if (!parsed.success) return res.status(400).json({ error: parsed.error.errors[0]?.message ?? 'Некорректные данные' });
    const d = parsed.data;
    const existing = await prisma.cdekSettings.findUnique({ where: { id: 1 } });
    const credentialsChanged =
      (d.account !== undefined && d.account !== (existing?.account ?? '')) ||
      (d.environment !== undefined && d.environment !== (existing?.environment ?? 'test')) ||
      (!!d.securePassword && d.securePassword !== (existing?.securePassword ?? ''));
    const s = await prisma.cdekSettings.upsert({
      where: { id: 1 },
      update: {
        ...(d.isActive !== undefined ? { isActive: d.isActive } : {}),
        ...(d.environment !== undefined ? { environment: d.environment } : {}),
        ...(d.account !== undefined ? { account: d.account.trim() } : {}),
        ...(d.securePassword ? { securePassword: d.securePassword.trim() } : {}),
        ...(d.senderCityCode !== undefined ? { senderCityCode: d.senderCityCode } : {}),
        ...(d.senderCompany !== undefined ? { senderCompany: d.senderCompany } : {}),
        ...(d.senderName !== undefined ? { senderName: d.senderName } : {}),
        ...(d.senderPhone !== undefined ? { senderPhone: d.senderPhone } : {}),
        ...(d.senderAddress !== undefined ? { senderAddress: d.senderAddress } : {}),
        // При смене учётных данных/среды — сбрасываем кэш OAuth-токена
        ...(credentialsChanged ? { accessToken: '', tokenExpiresAt: null } : {}),
      },
      create: {
        id: 1,
        isActive: d.isActive ?? false,
        environment: d.environment ?? 'test',
        account: (d.account ?? '').trim(),
        securePassword: (d.securePassword ?? '').trim(),
        senderCityCode: d.senderCityCode ?? null,
        senderCompany: d.senderCompany ?? '',
        senderName: d.senderName ?? '',
        senderPhone: d.senderPhone ?? '',
        senderAddress: d.senderAddress ?? '',
      },
    });
    res.json({ ok: true, isActive: s.isActive, environment: s.environment, credentialsChanged });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// Проверка подключения: авторизация по сохранённым или переданным учётным данным
router.post('/test', authMiddleware, async (req, res) => {
  try {
    const account = String(req.body?.account ?? '').trim();
    const securePassword = String(req.body?.securePassword ?? '').trim();
    const environment = req.body?.environment === 'prod' ? 'prod' : 'test';
    let settings = await getCdekSettings();
    // Если переданы учётные данные — временно используем их, не сохраняя
    const useProvided = account && securePassword;
    if (useProvided) {
      settings = {
        ...(settings ?? {
          id: 1, isActive: false, webhookToken: '', senderCityCode: null,
          senderCompany: '', senderName: '', senderPhone: '', senderAddress: '',
        }),
        account, securePassword, environment, accessToken: '', tokenExpiresAt: null,
      } as any;
    }
    if (!settings || !settings.account || !settings.securePassword) {
      return res.status(400).json({ ok: false, error: 'Укажите Account и Secure password' });
    }
    await resetCdekToken();
    const token = await getCdekToken(settings);
    // Лёгкий проверочный запрос: список доступных тарифов
    const tariffs = await cdekApi('GET', '/v2/tariffs', undefined, settings).catch(() => null);
    const cities = await cdekApi('GET', '/v2/location/cities?size=1', undefined, settings).catch(() => null);
    if (!cities && !tariffs) throw new Error('API недоступно: нет ответа на проверочные запросы');
    res.json({ ok: true, environment: settings.environment, baseUrl: cdekBaseUrl(settings.environment) });
  } catch (e: any) {
    res.status(400).json({ ok: false, error: e.message });
  }
});

export default router;
