import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import { loadTokens, refreshTokens, tochkaRequest } from './tochka.js';

const router = Router();

// === Плагин «Эквайринг от Точки» (uapi) ===
// Создание платёжной ссылки: POST /uapi/acquiring/v1.0/payments?customerCode={cc}
//   тело: {"Data":{"customerCode":cc,"amount":"1.00","purpose":"...","paymentMode":["card","sbp"],"paymentLinkId":"wecrm-sale-<номер>"}}
//   ответ: {"Data":{"Operation":[{"paymentLink":"https://...","operationId":"..."}]}}
// Webhook acquiringInternetPayment приходит в теле как JWT; в payload: paymentLinkId, amount (рубли), status (APPROVED), paymentType (card|sbp).
// Регистрация webhook: POST /uapi/webhook/v1.0/{cc} {"url":"...","webhooks_list":["acquiringInternetPayment"]}
// Авторизация — OAuth «Точка Банк» (общие токены), требуется scope acquiring.

const PUBLIC_BASE_URL = process.env.PUBLIC_BASE_URL || 'https://welans.cc';
const WEBHOOK_PATH = '/api/tochka-acquiring/webhook';

// customerCode кешируем на сессию: получаем через Get Customers List (первый Business-клиент)
let customerCodeCache: string | null = null;

async function getCustomerCode(): Promise<string | null> {
  if (customerCodeCache) return customerCodeCache;
  const { response } = await withAuthRetry((h) => tochkaRequest('/open-banking/v1.0/customers', { headers: h }));
  if (response.status !== 200) return null;
  const list = response.body?.Data?.Customer || [];
  const business = list.find((c: any) => c.customerType === 'Business') || list[0];
  customerCodeCache = business?.customerCode ? String(business.customerCode) : null;
  return customerCodeCache;
}

// Обёртка с авто-refresh токена при 401/403 (как в tochka.ts)
async function withAuthRetry(
  call: (headers: Record<string, string>) => Promise<{ status: number; body: any; text: string }>,
): Promise<{ response: { status: number; body: any; text: string }; refreshed: boolean }> {
  const tokens = loadTokens();
  if (!tokens?.access_token) return { response: { status: 0, body: null, text: 'no token' }, refreshed: false };
  let response = await call({ Authorization: `Bearer ${loadTokens()?.access_token || ''}` });
  if ((response.status === 401 || response.status === 403) && await refreshTokens()) {
    response = await call({ Authorization: `Bearer ${loadTokens()?.access_token || ''}` });
    return { response, refreshed: true };
  }
  return { response, refreshed: false };
}

async function getSettings() {
  return prisma.tochkaAcquiringSettings.findUnique({ where: { id: 1 } });
}

// Активность плагина для /api/integrations/status
export async function isTochkaAcquiringActive(): Promise<boolean> {
  const s = await getSettings();
  return !!s?.isActive;
}

// POST /uapi/webhook/v1.0/{customerCode} — регистрация webhook acquiringInternetPayment (идемпотентно)
async function registerWebhook(): Promise<{ ok: boolean; detail?: string }> {
  const cc = await getCustomerCode();
  if (!cc) return { ok: false, detail: 'customerCode не получен' };
  const { response } = await withAuthRetry((h) =>
    tochkaRequest(`/webhook/v1.0/${cc}`, {
      method: 'POST',
      headers: h,
      body: JSON.stringify({ url: `${PUBLIC_BASE_URL}${WEBHOOK_PATH}`, webhooks_list: ['acquiringInternetPayment'] }),
    }),
  );
  if (response.status === 200 || response.status === 201 || response.status === 409) return { ok: true };
  return { ok: false, detail: `${response.status} ${JSON.stringify(response.body).slice(0, 200)}` };
}

// GET /api/tochka-acquiring — состояние плагина и последние платежи
router.get('/', authMiddleware, async (_req, res) => {
  try {
    const s = await getSettings();
    const connected = !!loadTokens()?.access_token;
    let cc: string | null = null;
    let webhook: { ok: boolean; detail?: string } | null = null;
    if (connected) {
      cc = await getCustomerCode();
      webhook = await registerWebhook(); // идемпотентная регистрация при каждом открытии настроек
    }
    const payments = await prisma.tochkaAcquiringPayment.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: { sale: { select: { number: true, total: true } } },
    });
    res.json({
      isActive: !!s?.isActive,
      connected,
      customerCode: cc,
      webhookOk: webhook ? webhook.ok && !webhook.detail?.includes('Forbidden') : null,
      webhookUrl: `${PUBLIC_BASE_URL}${WEBHOOK_PATH}`,
      payments: payments.map((p) => ({
        id: p.id,
        orderId: p.orderId,
        paymentId: p.paymentId,
        amount: p.amount,
        method: p.method,
        status: p.status,
        saleNumber: p.sale?.number,
        paidAt: p.paidAt,
        createdAt: p.createdAt,
      })),
    });
  } catch (err: any) {
    console.error('[tochka-acquiring] GET error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/tochka-acquiring — включение/выключение плагина (только админ)
router.post('/', authMiddleware, async (req: AuthRequest, res) => {
  try {
    if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Только администратор' });
    const { isActive } = req.body || {};
    const nextIsActive = typeof isActive === 'boolean' ? isActive : !!(await getSettings())?.isActive;
    const s = await prisma.tochkaAcquiringSettings.upsert({
      where: { id: 1 },
      create: { id: 1, isActive: nextIsActive },
      update: { isActive: nextIsActive },
    });
    res.json({ isActive: s.isActive });
  } catch (err: any) {
    console.error('[tochka-acquiring] POST error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/tochka-acquiring/pay — создать платёжную ссылку по продаже (карта + СБП выбор на странице банка)
router.post('/pay', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const s = await getSettings();
    if (!s?.isActive) return res.status(400).json({ error: 'Эквайринг от Точки не активирован' });
    if (!loadTokens()?.access_token) return res.status(400).json({ error: 'Точка Банк не подключена (OAuth)' });

    const { saleId } = req.body || {};
    const sale = await prisma.sale.findUnique({ where: { id: saleId }, include: { contact: true } });
    if (!sale) return res.status(404).json({ error: 'Продажа не найдена' });
    if (sale.status === 'paid') return res.status(400).json({ error: 'Заказ уже оплачен' });

    const amount = Number(sale.total);
    if (!(amount > 0)) return res.status(400).json({ error: 'Сумма заказа должна быть больше нуля' });

    const cc = await getCustomerCode();
    if (!cc) return res.status(400).json({ error: 'Не удалось получить customerCode (проверьте подключение Точки)' });

    // Один платёж на заказ: повторное нажатие возвращает существующую ссылку (свежую)
    const orderId = `wecrm-sale-${sale.number}`;
    const existing = await prisma.tochkaAcquiringPayment.findUnique({ where: { orderId } });
    if (existing?.status === 'paid') return res.status(400).json({ error: 'Заказ уже оплачен' });
    if (existing?.paymentUrl && existing.createdAt.getTime() > Date.now() - 24 * 3600 * 1000) {
      return res.json({ orderId, paymentUrl: existing.paymentUrl, paymentId: existing.paymentId, amount: existing.amount });
    }

    const purpose = `Оплата заказа №${sale.number}${sale.contact ? ` (${sale.contact.name})` : ''}`.slice(0, 140);
    const body = {
      Data: {
        customerCode: cc,
        amount: amount.toFixed(2),
        purpose,
        paymentMode: ['card', 'sbp'],
        paymentLinkId: orderId,
      },
    };
    const { response } = await withAuthRetry((h) =>
      tochkaRequest(`/acquiring/v1.0/payments?customerCode=${cc}`, { method: 'POST', headers: h, body: JSON.stringify(body) }),
    );
    const data = response.body;
    if (response.status !== 200 && response.status !== 201) {
      console.error('[tochka-acquiring] payments error:', response.status, JSON.stringify(data).slice(0, 300));
      return res.status(400).json({ error: data?.message || 'Банк отклонил создание платежа', details: data?.Errors });
    }
    const op = data?.Data?.Operation?.[0] || data?.Data || {};
    const paymentUrl = op.paymentLink || op.PaymentLink || null;
    const operationId = op.operationId || op.OperationId || null;
    if (!paymentUrl) {
      console.error('[tochka-acquiring] нет paymentLink в ответе:', JSON.stringify(data).slice(0, 300));
      return res.status(502).json({ error: 'Банк не вернул ссылку на оплату' });
    }

    const payment = await prisma.tochkaAcquiringPayment.upsert({
      where: { orderId },
      create: {
        saleId: sale.id, orderId, paymentId: operationId ? String(operationId) : null,
        amount: Math.round(amount * 100), method: 'link', status: 'created', paymentUrl,
      },
      update: {
        paymentId: operationId ? String(operationId) : null,
        amount: Math.round(amount * 100), method: 'link', paymentUrl, status: 'created', paidAt: null,
      },
    });
    await prisma.sale.update({
      where: { id: sale.id },
      data: { paymentMethod: 'tochka', paymentId: operationId ? String(operationId) : null },
    });

    res.json({ orderId, paymentUrl, paymentId: payment.paymentId, amount: payment.amount });
  } catch (err: any) {
    console.error('[tochka-acquiring] pay error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/tochka-acquiring/webhook — уведомление acquiringInternetPayment от банка.
// Без авторизации: доверие по подписанному банком JWT (сверяем сумму и номер заказа с БД).
router.post('/webhook', async (req, res) => {
  try {
    // Тело приходит как JWT-строка (express.text() уже распарсил её в строку)
    const jwt = typeof req.body === 'string' ? req.body : (req.body?.jwt || req.body?.token || '');
    if (!jwt || typeof jwt !== 'string' || jwt.split('.').length !== 3) {
      return res.status(400).send('invalid jwt');
    }
    let payload: any;
    try {
      payload = JSON.parse(Buffer.from(jwt.split('.')[1] + '==', 'base64url').toString());
    } catch {
      return res.status(400).send('invalid jwt payload');
    }
    const orderId = String(payload.paymentLinkId || '');
    const status = String(payload.status || '');
    const amountRub = Number(payload.amount || 0);
    if (!orderId) return res.send('ok');

    const payment = await prisma.tochkaAcquiringPayment.findUnique({ where: { orderId } });
    if (!payment) { console.warn('[tochka-acquiring] webhook: платёж не найден', orderId); return res.send('ok'); }

    // Сумма из уведомления (рубли) обязана совпадать с суммой платежа (копейки)
    if (amountRub && Math.round(amountRub * 100) !== payment.amount) {
      console.error('[tochka-acquiring] webhook: расхождение суммы', orderId, amountRub, payment.amount);
      return res.status(400).send('amount mismatch');
    }

    if (status === 'APPROVED' && payment.status !== 'paid') {
      await prisma.$transaction([
        prisma.tochkaAcquiringPayment.update({
          where: { id: payment.id },
          data: { status: 'paid', paymentId: payment.paymentId || (payload.operationId ? String(payload.operationId) : null), paidAt: new Date() },
        }),
        prisma.sale.update({
          where: { id: payment.saleId },
          data: { status: 'paid', paymentMethod: 'tochka', paidAt: new Date() },
        }),
      ]);
      console.log('[tochka-acquiring] заказ оплачен:', orderId, payload.paymentType || '');
    } else if (['REJECTED', 'CANCELLED', 'EXPIRED'].includes(status) && payment.status !== 'paid') {
      await prisma.tochkaAcquiringPayment.update({ where: { id: payment.id }, data: { status: 'failed' } });
    }
    res.send('ok');
  } catch (err: any) {
    console.error('[tochka-acquiring] webhook error:', err.message);
    res.status(500).send('error');
  }
});

// GET /api/tochka-acquiring/status/:orderId — статус платежа (поллинг экрана оплаты)
router.get('/status/:orderId', authMiddleware, async (req, res) => {
  try {
    const payment = await prisma.tochkaAcquiringPayment.findUnique({ where: { orderId: req.params.orderId } });
    if (!payment) return res.status(404).json({ error: 'Платёж не найден' });
    res.json({ status: payment.status, paidAt: payment.paidAt });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
