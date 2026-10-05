import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import https from 'https';
import crypto from 'crypto';

const router = Router();

// Эквайринг Точки (v1, протокол как у Тинькофф): «Логин» = TerminalKey,
// «Секрет для подписи заказа» = Password для подписи Token.
// Карта: Init -> PaymentURL. СБП: Init + GetQr -> QR-код. Уведомление: webhook с подписью Token.
const PUBLIC_BASE_URL = process.env.PUBLIC_BASE_URL || 'https://welans.cc';

const httpsAgent = new https.Agent({ rejectUnauthorized: false });

// Подпись запроса (Token): SHA-256 от конкатенации значений пар «ключ-значение»
// (без Token), отсортированных по ключу, с добавленной парой Password
function signParams(params: Record<string, any>, password: string): string {
  const pairs: Array<[string, string]> = Object.entries(params)
    .filter(([k, v]) => k !== 'Token' && v !== undefined && v !== null)
    .map(([k, v]) => [k, String(v)] as [string, string]);
  pairs.push(['Password', password]);
  pairs.sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0));
  const concat = pairs.map(([, v]) => v).join('');
  return crypto.createHash('sha256').update(concat, 'utf8').digest('hex');
}

// POST-запрос к API эквайринга Точки (методы Init / GetQr)
function tochkaAcqRequest(method: string, body: Record<string, any>): Promise<{ status: number; body: any }> {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const req = https.request(
      {
        hostname: 'enter.tochka.com',
        path: `/api/v1/json/${method}`,
        method: 'POST',
        agent: httpsAgent,
        headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) },
      },
      (res) => {
        let raw = '';
        res.on('data', (chunk) => (raw += chunk));
        res.on('end', () => {
          try { resolve({ status: res.statusCode || 0, body: JSON.parse(raw || '{}') }); }
          catch { resolve({ status: res.statusCode || 0, body: raw }); }
        });
      },
    );
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function getSettings() {
  return prisma.tochkaAcquiringSettings.findUnique({ where: { id: 1 } });
}

// Активность плагина для /api/integrations/status
export async function isTochkaAcquiringActive(): Promise<boolean> {
  const s = await getSettings();
  return !!s?.isActive && !!s.terminalKey && !!s.password;
}

// GET /api/tochka-acquiring — состояние плагина и последние платежи (пароль наружу не отдаём)
router.get('/', authMiddleware, async (_req, res) => {
  try {
    const s = await getSettings();
    const payments = await prisma.tochkaAcquiringPayment.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: { sale: { select: { number: true, total: true } } },
    });
    res.json({
      isActive: !!s?.isActive,
      terminalKey: s?.terminalKey || '',
      hasPassword: !!s?.password,
      webhookUrl: `${PUBLIC_BASE_URL}/api/tochka-acquiring/webhook`,
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

// POST /api/tochka-acquiring — сохранение настроек (только админ); пустой пароль = не менять
router.post('/', authMiddleware, async (req: AuthRequest, res) => {
  try {
    if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Только администратор' });
    const { isActive, terminalKey, password } = req.body || {};
    const cur = await getSettings();
    const nextIsActive = typeof isActive === 'boolean' ? isActive : !!cur?.isActive;
    const nextKey = typeof terminalKey === 'string' ? terminalKey.trim() : cur?.terminalKey || '';
    const nextPassword = typeof password === 'string' && password ? password.trim() : cur?.password || '';
    if (nextIsActive && (!nextKey || !nextPassword)) {
      return res.status(400).json({ error: 'Для активации укажите логин терминала и секрет для подписи заказа' });
    }
    const s = await prisma.tochkaAcquiringSettings.upsert({
      where: { id: 1 },
      create: { id: 1, isActive: nextIsActive, terminalKey: nextKey, password: nextPassword },
      update: {
        isActive: nextIsActive,
        terminalKey: nextKey,
        ...(typeof password === 'string' && password ? { password: password.trim() } : {}),
      },
    });
    res.json({ isActive: s.isActive, terminalKey: s.terminalKey, hasPassword: !!s.password });
  } catch (err: any) {
    console.error('[tochka-acquiring] POST error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/tochka-acquiring/pay — создать платёж по продаже: card (ссылка) или sbp (QR)
router.post('/pay', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const s = await getSettings();
    if (!s?.isActive || !s.terminalKey || !s.password) {
      return res.status(400).json({ error: 'Эквайринг от Точки не активирован' });
    }
    const { saleId, method } = req.body || {};
    if (!['card', 'sbp'].includes(method)) return res.status(400).json({ error: 'Способ оплаты: card или sbp' });
    const sale = await prisma.sale.findUnique({ where: { id: saleId }, include: { contact: true } });
    if (!sale) return res.status(404).json({ error: 'Продажа не найдена' });
    if (sale.status === 'paid') return res.status(400).json({ error: 'Заказ уже оплачен' });

    const amount = Math.round(Number(sale.total) * 100); // в копейках
    if (amount <= 0) return res.status(400).json({ error: 'Сумма заказа должна быть больше нуля' });

    // Один платёж на заказ: повторное нажатие пересоздаёт ссылку/QR на той же OrderId
    const orderId = `wecrm-sale-${sale.number}`;
    const existing = await prisma.tochkaAcquiringPayment.findUnique({ where: { orderId } });
    if (existing?.status === 'paid') return res.status(400).json({ error: 'Заказ уже оплачен' });

    const initParams: Record<string, any> = {
      TerminalKey: s.terminalKey,
      Amount: amount,
      OrderId: orderId,
      Description: `Оплата заказа №${sale.number}${sale.contact ? ` (${sale.contact.name})` : ''}`.slice(0, 240),
      NotificationURL: `${PUBLIC_BASE_URL}/api/tochka-acquiring/webhook`,
    };
    if (method === 'card') {
      initParams.SuccessURL = `${PUBLIC_BASE_URL}/catalog?paid=1&order=${sale.number}`;
      initParams.FailURL = `${PUBLIC_BASE_URL}/catalog?paid=0&order=${sale.number}`;
    }
    initParams.Token = signParams(initParams, s.password);

    const initRes = await tochkaAcqRequest('Init', initParams);
    const initBody = initRes.body;
    if (!initBody?.Success) {
      console.error('[tochka-acquiring] Init error:', JSON.stringify(initBody).slice(0, 300));
      return res.status(400).json({ error: initBody?.Message || 'Банк отклонил создание платежа', details: initBody?.Details });
    }

    // СБП: QR-код для оплаты по цепочке Init -> GetQr
    let qrData: string | null = null;
    if (method === 'sbp') {
      const qrParams = { TerminalKey: s.terminalKey, PaymentId: initBody.PaymentId };
      const qrRes = await tochkaAcqRequest('GetQr', { ...qrParams, Token: signParams(qrParams, s.password) });
      if (qrRes.body?.Success && qrRes.body?.Data) qrData = String(qrRes.body.Data);
    }

    const payment = await prisma.tochkaAcquiringPayment.upsert({
      where: { orderId },
      create: {
        saleId: sale.id, orderId, paymentId: String(initBody.PaymentId), amount, method,
        status: 'created', paymentUrl: initBody.PaymentURL || null, qrData,
      },
      update: {
        paymentId: String(initBody.PaymentId), amount, method,
        paymentUrl: initBody.PaymentURL || null, qrData, status: 'created', paidAt: null,
      },
    });
    await prisma.sale.update({
      where: { id: sale.id },
      data: { paymentMethod: 'tochka', paymentId: String(initBody.PaymentId) },
    });

    res.json({ orderId, paymentId: String(initBody.PaymentId), paymentUrl: initBody.PaymentURL || null, qrData, amount });
  } catch (err: any) {
    console.error('[tochka-acquiring] pay error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/tochka-acquiring/webhook — уведомление банка об оплате.
// Без авторизации: доверие только по подписи Token (секрет «Секрет для подписи заказа»).
router.post('/webhook', async (req, res) => {
  try {
    const s = await getSettings();
    const body = req.body || {};
    if (!s?.password || !s.terminalKey) return res.status(400).send('not configured');
    const received = String(body.Token || '').toLowerCase();
    if (received !== signParams(body, s.password)) {
      console.warn('[tochka-acquiring] webhook: неверная подпись, OrderId=', body.OrderId);
      return res.status(403).send('invalid token');
    }
    const orderId = String(body.OrderId || '');
    const payment = await prisma.tochkaAcquiringPayment.findUnique({ where: { orderId } });
    if (!payment) { console.warn('[tochka-acquiring] webhook: платёж не найден', orderId); return res.send('ok'); }
    // Сумма из уведомления обязана совпадать с суммой платежа
    const amount = Number(body.Amount || 0);
    const paid = body.Success === true && ['CONFIRMED', 'AUTHORIZED'].includes(String(body.Status || ''));
    if (paid && amount && amount !== payment.amount) {
      console.error('[tochka-acquiring] webhook: расхождение суммы', orderId, amount, payment.amount);
      return res.status(400).send('amount mismatch');
    }
    if (paid && payment.status !== 'paid') {
      await prisma.$transaction([
        prisma.tochkaAcquiringPayment.update({
          where: { id: payment.id },
          data: { status: 'paid', paymentId: String(body.PaymentId || payment.paymentId || ''), paidAt: new Date() },
        }),
        prisma.sale.update({
          where: { id: payment.saleId },
          data: {
            status: 'paid',
            paymentMethod: 'tochka',
            paymentId: String(body.PaymentId || payment.paymentId || ''),
            paidAt: new Date(),
          },
        }),
      ]);
      console.log('[tochka-acquiring] заказ оплачен:', orderId);
    } else if (!paid && ['REJECTED', 'CANCELLED', 'REVERSED'].includes(String(body.Status || '')) && payment.status !== 'paid') {
      await prisma.tochkaAcquiringPayment.update({ where: { id: payment.id }, data: { status: 'failed' } });
    }
    res.send('ok');
  } catch (err: any) {
    console.error('[tochka-acquiring] webhook error:', err.message);
    res.status(500).send('error');
  }
});

// GET /api/tochka-acquiring/status/:orderId — статус платежа (поллинг экрана оплаты СБП)
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
