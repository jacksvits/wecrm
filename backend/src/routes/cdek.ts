import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { authMiddleware } from '../middleware/auth.js';
import {
  CDEK_FALLBACK_TARIFFS, CDEK_STATUS_NAMES, cdekApi, cdekCalcTariff, cdekCalcTariffList,
  cdekCreateOrder, cdekDeleteOrder, cdekDeliveryPoints, cdekGetOrder, cdekListWebhooks,
  cdekPrintOrderPdf, cdekSubscribeWebhook, cdekSuggestCities, cdekUnsubscribeWebhook,
  getCdekSettings, newWebhookToken,
} from '../lib/cdek.js';

const router = Router();

// ---------------------------------------------------------------------------
// Раздел «Логистика» (СДЭК): отправления, калькулятор, ПВЗ, квитанции, вебхуки
// ---------------------------------------------------------------------------

/** Обновить статус отправления из ответа СДЭК (entity заказа) */
function applyOrderEntity(shipment: any, entity: any): Record<string, any> {
  const data: Record<string, any> = {};
  if (entity?.cdek_number) data.cdekNumber = String(entity.cdek_number);
  if (entity?.status) {
    data.statusCode = String(entity.status.code ?? '');
    data.statusName = entity.status.name ?? CDEK_STATUS_NAMES[String(entity.status.code)] ?? data.statusCode;
    data.statusAt = entity.status.date_time ? new Date(entity.status.date_time) : new Date();
  }
  if (Array.isArray(entity?.statuses)) {
    data.statusHistory = JSON.stringify(entity.statuses.map((s: any) => ({
      code: String(s.code ?? ''),
      name: s.name ?? CDEK_STATUS_NAMES[String(s.code)] ?? '',
      dateTime: s.date_time ?? null,
      city: s.city ?? null,
    })));
    if (entity.statuses.length) {
      const last = entity.statuses[entity.statuses.length - 1];
      data.statusCode = String(last.code ?? '');
      data.statusName = last.name ?? CDEK_STATUS_NAMES[String(last.code)] ?? data.statusCode;
      data.statusAt = last.date_time ? new Date(last.date_time) : new Date();
    }
  }
  if (entity?.delivery_sum !== undefined) data.deliverySum = entity.delivery_sum;
  return data;
}

// Список отправлений
router.get('/shipments', authMiddleware, async (req, res) => {
  try {
    const { dealId, contactId } = req.query as Record<string, string>;
    const shipments = await prisma.cdekShipment.findMany({
      where: {
        ...(dealId ? { dealId } : {}),
        ...(contactId ? { contactId } : {}),
      },
      include: {
        deal: { select: { id: true, title: true } },
        contact: { select: { id: true, name: true, phone: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 500,
    });
    res.json(shipments.map((s: any) => ({ ...s, statusHistory: undefined })));
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// Детали отправления (с историей статусов)
router.get('/shipments/:id', authMiddleware, async (req, res) => {
  try {
    const s = await prisma.cdekShipment.findUnique({
      where: { id: req.params.id },
      include: {
        deal: { select: { id: true, title: true } },
        contact: { select: { id: true, name: true, phone: true } },
      },
    });
    if (!s) return res.status(404).json({ error: 'Отправление не найдено' });
    let statusHistory: any[] = [];
    try { statusHistory = s.statusHistory ? JSON.parse(s.statusHistory) : []; } catch { statusHistory = []; }
    res.json({ ...s, statusHistory });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

const createSchema = z.object({
  imNumber: z.string().min(1).max(40),
  tariffCode: z.number().int(),
  deliveryMode: z.enum(['door', 'warehouse']),
  toCity: z.string().min(1).max(120),
  toAddress: z.string().max(500).default(''),
  deliveryPointCode: z.string().max(30).nullable().optional(),
  recipientName: z.string().min(1).max(120),
  recipientPhone: z.string().min(5).max(30),
  recipientEmail: z.string().max(120).default(''),
  weightGrams: z.number().int().min(1).max(30_000_000),
  lengthCm: z.number().int().min(0).max(1500).nullable().optional(),
  widthCm: z.number().int().min(0).max(1500).nullable().optional(),
  heightCm: z.number().int().min(0).max(1500).nullable().optional(),
  codAmount: z.number().int().min(0).default(0),
  declaredValue: z.number().int().min(0).default(0),
  itemName: z.string().max(255).default(''),
  comment: z.string().max(255).default(''),
  dealId: z.string().nullable().optional(),
  contactId: z.string().nullable().optional(),
  fromCity: z.string().max(120).default(''),
});

// Создание отправления: заказ регистрируется в СДЭК, запись сохраняется в CRM
router.post('/shipments', authMiddleware, async (req, res) => {
  try {
    const parsed = createSchema.safeParse(req.body ?? {});
    if (!parsed.success) return res.status(400).json({ error: parsed.error.errors[0]?.message ?? 'Некорректные данные' });
    const d = parsed.data;

    const settings = await getCdekSettings();
    if (!settings?.isActive) return res.status(400).json({ error: 'Интеграция CDEK не активна — включите её в настройках' });

    if (d.deliveryMode === 'warehouse' && !d.deliveryPointCode) {
      return res.status(400).json({ error: 'Для режима «до склада» укажите код пункта выдачи (ПВЗ)' });
    }
    if (d.deliveryMode === 'door' && !d.toAddress.trim()) {
      return res.status(400).json({ error: 'Укажите адрес доставки для режима «до двери»' });
    }

    const pkg: Record<string, any> = { number: '1', weight: d.weightGrams, comment: d.comment || 'Заказ из WeCRM' };
    if (d.lengthCm) pkg.length = d.lengthCm;
    if (d.widthCm) pkg.width = d.widthCm;
    if (d.heightCm) pkg.height = d.heightCm;
    // Вложения обязательны в API СДЭК (даже без постоплаты)
    pkg.items = [{
      name: d.itemName || 'Товар',
      ware_key: `wecrm-${d.imNumber}`.slice(0, 20),
      payment: { value: d.codAmount },
      cost: d.declaredValue || d.codAmount || 1,
      weight: d.weightGrams,
      amount: 1,
    }];

    const order: Record<string, any> = {
      type: 1, // договор «интернет-магазин»
      number: d.imNumber,
      tariff_code: d.tariffCode,
      recipient: { name: d.recipientName, phones: [{ number: d.recipientPhone }] },
      packages: [pkg],
    };
    if (d.deliveryMode === 'warehouse') {
      order.delivery_point = d.deliveryPointCode;
      order.to_location = { address: d.toCity };
    } else {
      order.to_location = { address: `${d.toCity}, ${d.toAddress}`.replace(/,\s*$/, '') };
    }
    // Отправитель: город (код из настроек) + адрес отгрузки
    order.from_location = {
      ...(settings.senderCityCode ? { code: settings.senderCityCode } : {}),
      address: settings.senderAddress || d.fromCity || undefined,
    };
    if (settings.senderName) order.sender = { name: settings.senderName, phones: [{ number: settings.senderPhone || '+70000000000' }] };
    if (settings.senderCompany) order.sender = { ...(order.sender ?? {}), company: settings.senderCompany };

    const created = await cdekCreateOrder(order);
    const orderUuid = created?.entity?.uuid;
    if (!orderUuid) throw new Error('CDEK: заказ не создан (пустой UUID)');
    const requestState = created?.requests?.[0]?.state ?? 'ACCEPTED';
    const requestError = created?.requests?.[0]?.errors?.map((e: any) => e.message).join('; ') || null;

    // Регистрация асинхронна: подождём обработки и заберём фактический статус/номер
    let entity: any = null;
    for (let i = 0; i < 3; i++) {
      await new Promise((r) => setTimeout(r, 2500));
      try { entity = await cdekGetOrder(orderUuid); } catch { entity = null; }
      const state = entity?.requests?.[0]?.state;
      if (state === 'SUCCESSFUL' || state === 'INVALID') break;
    }
    const finalState = entity?.requests?.[0]?.state ?? requestState;
    const finalError = entity?.requests?.[0]?.errors?.map((e: any) => e.message).join('; ') || requestError;

    const shipment = await prisma.cdekShipment.create({
      data: {
        uuid: orderUuid,
        cdekNumber: entity?.entity?.cdek_number ? String(entity.entity.cdek_number) : null,
        dealId: d.dealId ?? null,
        contactId: d.contactId ?? null,
        imNumber: d.imNumber,
        tariffCode: d.tariffCode,
        deliveryMode: d.deliveryMode,
        deliverySum: entity?.entity?.delivery_sum ?? null,
        currency: 'RUB',
        fromCity: d.fromCity,
        toCity: d.toCity,
        toAddress: d.toAddress,
        deliveryPointCode: d.deliveryPointCode ?? null,
        recipientName: d.recipientName,
        recipientPhone: d.recipientPhone,
        recipientEmail: d.recipientEmail,
        weightGrams: d.weightGrams,
        lengthCm: d.lengthCm ?? null,
        widthCm: d.widthCm ?? null,
        heightCm: d.heightCm ?? null,
        codAmount: d.codAmount,
        declaredValue: d.declaredValue,
        itemName: d.itemName,
        comment: d.comment,
        requestState: finalState,
        lastError: finalError,
        ...applyOrderEntity({}, entity?.entity ?? {}),
      },
    });
    if (finalState === 'INVALID') {
      return res.status(400).json({ error: `CDEK отклонил заказ: ${finalError ?? 'неизвестная ошибка'}`, shipment });
    }
    res.json(shipment);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// Обновить статус отправления из СДЭК (ручное обновление по кнопке)
router.post('/shipments/:id/refresh', authMiddleware, async (req, res) => {
  try {
    const s = await prisma.cdekShipment.findUnique({ where: { id: req.params.id } });
    if (!s) return res.status(404).json({ error: 'Отправление не найдено' });
    if (!s.uuid) return res.status(400).json({ error: 'У отправления нет UUID в СДЭК' });
    const data = await cdekGetOrder(s.uuid);
    const state = data?.requests?.[0]?.state;
    const err = data?.requests?.[0]?.errors?.map((e: any) => e.message).join('; ') || null;
    const updated = await prisma.cdekShipment.update({
      where: { id: s.id },
      data: { ...applyOrderEntity(s, data?.entity ?? {}), requestState: state ?? s.requestState, lastError: err },
    });
    res.json(updated);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// Удаление отправления: аннулирование в СДЭК + удаление записи в CRM
router.delete('/shipments/:id', authMiddleware, async (req, res) => {
  try {
    const s = await prisma.cdekShipment.findUnique({ where: { id: req.params.id } });
    if (!s) return res.status(404).json({ error: 'Отправление не найдено' });
    if (s.uuid && s.requestState !== 'INVALID') {
      try { await cdekDeleteOrder(s.uuid); } catch { /* заказ мог уже уйти в перевозку */ }
    }
    await prisma.cdekShipment.delete({ where: { id: s.id } });
    res.json({ ok: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// Квитанция (этикетка) в PDF: печать возможна по номеру накладной СДЭК
router.get('/shipments/:id/label', authMiddleware, async (req, res) => {
  try {
    let s = await prisma.cdekShipment.findUnique({ where: { id: req.params.id } });
    if (!s) return res.status(404).json({ error: 'Отправление не найдено' });
    // Номер накладной мог появиться после регистрации — дозапрашиваем при необходимости
    if (!s.cdekNumber && s.uuid) {
      try {
        const data = await cdekGetOrder(s.uuid);
        const upd = applyOrderEntity(s, data?.entity ?? {});
        if (upd.cdekNumber) s = await prisma.cdekShipment.update({ where: { id: s.id }, data: upd });
      } catch { /* оставляем как есть */ }
    }
    if (!s.cdekNumber) return res.status(400).json({ error: 'У отправления ещё нет номера накладной СДЭК — обновите статус позже' });
    const pdf = await cdekPrintOrderPdf(s.cdekNumber);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="cdek-label-${s.cdekNumber}.pdf"`);
    res.send(pdf);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// Калькулятор: расчёт по доступным тарифам.
// Сначала /v2/calculator/tariffList; если недоступен (нет на тестовом стенде) —
// фолбэк: попарный расчёт популярных тарифов через /v2/calculator/tariff.
router.post('/calculator/tariffList', authMiddleware, async (req, res) => {
  try {
    const data = await cdekCalcTariffList(req.body ?? {});
    res.json(data);
  } catch (e: any) {
    const body = req.body ?? {};
    const results: any[] = [];
    for (const code of CDEK_FALLBACK_TARIFFS) {
      try {
        const r = await cdekCalcTariff({ ...body, tariff_code: code });
        if (r?.result) results.push({ tariff_code: code, status: true, result: r.result });
      } catch { /* тариф недоступен по направлению */ }
    }
    if (!results.length) return res.status(400).json({ error: e.message });
    res.json({ tariff_codes: results });
  }
});

// Подбор населённых пунктов
router.get('/cities', authMiddleware, async (req, res) => {
  try {
    const name = String(req.query.name ?? '').trim();
    if (!name) return res.json([]);
    res.json(await cdekSuggestCities(name));
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

// Пункты выдачи заказов (ПВЗ) в городе
router.get('/deliverypoints', authMiddleware, async (req, res) => {
  try {
    const cityCode = Number(req.query.cityCode);
    if (!cityCode) return res.status(400).json({ error: 'Укажите cityCode' });
    const points = await cdekDeliveryPoints(cityCode);
    res.json(points.map((p: any) => ({
      code: p.code,
      name: p.name,
      address: p.location?.address_full ?? p.location?.address ?? '',
      workTime: p.work_time ?? '',
      phone: p.phones?.map((ph: any) => ph.number).join(', ') ?? '',
      latitude: p.location?.latitude,
      longitude: p.location?.longitude,
    })));
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

// --- Подписка на вебхуки (секретный URL публикуем в настройках плагина) ---

router.get('/webhooks', authMiddleware, async (req, res) => {
  try {
    let settings = await getCdekSettings();
    if (!settings?.isActive) return res.json({ items: [], webhookUrl: '' });
    // Токен публикуемого URL генерируем при первом обращении
    if (!settings.webhookToken) {
      const token = newWebhookToken();
      await prisma.cdekSettings.upsert({ where: { id: 1 }, update: { webhookToken: token }, create: { id: 1, webhookToken: token } });
      settings = { ...settings, webhookToken: token };
    }
    const items = await cdekListWebhooks();
    const proto = req.get('x-forwarded-proto') ?? req.protocol;
    const host = `${proto}://${req.get('host')}`;
    res.json({
      items,
      webhookUrl: `${host}/api/cdek/webhook/${settings.webhookToken}`,
    });
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

router.post('/webhooks/subscribe', authMiddleware, async (req, res) => {
  try {
    const settings = await getCdekSettings();
    if (!settings?.isActive) return res.status(400).json({ error: 'Интеграция CDEK не активна' });
    let token = settings.webhookToken;
    if (!token) {
      token = newWebhookToken();
      await prisma.cdekSettings.upsert({ where: { id: 1 }, update: { webhookToken: token }, create: { id: 1, webhookToken: token } });
    }
    const proto = req.get('x-forwarded-proto') ?? req.protocol;
    const host = String(req.body?.host ?? `${proto}://${req.get('host')}`);
    const url = `${host}/api/cdek/webhook/${token}`;
    const result = await cdekSubscribeWebhook(url);
    res.json({ ok: true, url, result });
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

router.delete('/webhooks/:uuid', authMiddleware, async (req, res) => {
  try {
    await cdekUnsubscribeWebhook(req.params.uuid);
    res.json({ ok: true });
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

// Публичный вебхук СДЭК (без авторизации — проверяем секретный токен в URL)
router.post('/webhook/:token', async (req, res) => {
  try {
    const settings = await getCdekSettings();
    if (!settings?.webhookToken || settings.webhookToken !== req.params.token) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const evt = req.body;
    if (evt?.type === 'ORDER_STATUS' && evt?.attributes) {
      const a = evt.attributes;
      const shipment = await prisma.cdekShipment.findFirst({
        where: {
          OR: [
            { uuid: String(evt.uuid ?? '') },
            { cdekNumber: a.cdek_number ? String(a.cdek_number) : '' },
            { imNumber: a.number ? String(a.number) : '' },
          ],
        },
      });
      if (shipment) {
        const history = (() => { try { return shipment.statusHistory ? JSON.parse(shipment.statusHistory) : []; } catch { return []; } })();
        history.push({
          code: String(a.status_code ?? ''),
          name: CDEK_STATUS_NAMES[String(a.status_code)] ?? '',
          dateTime: a.status_date_time ?? null,
          city: a.city ?? null,
        });
        await prisma.cdekShipment.update({
          where: { id: shipment.id },
          data: {
            statusCode: String(a.status_code ?? ''),
            statusName: CDEK_STATUS_NAMES[String(a.status_code)] ?? shipment.statusName,
            statusAt: a.status_date_time ? new Date(a.status_date_time) : new Date(),
            statusHistory: JSON.stringify(history),
          },
        });
      }
    }
    res.json({ ok: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
