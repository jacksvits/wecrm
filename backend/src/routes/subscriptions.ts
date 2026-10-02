import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();
router.use(authMiddleware);

// Список подписочных заявок: на какую услугу, от кого, статус
router.get('/', async (_req, res) => {
  try {
    const list = await prisma.productSubscription.findMany({
      orderBy: { number: 'desc' },
      include: {
        product: { select: { id: true, name: true, unit: true } },
        contact: { select: { id: true, name: true } },
        user: { select: { id: true, name: true } },
      },
    });
    res.json(list);
  } catch (err: any) {
    console.error('[subscriptions:list]', err);
    res.status(500).json({ error: err.message });
  }
});

// Оформление подписочной заявки кнопкой «Подписаться» на витрине.
// Подписка доступна только для услуг с включённой опцией «Подписка».
// Цена подписки за период берётся с сервера (первая ненулевая цена для витрины,
// иначе — первая ненулевая), клиентскую цену не доверяем.
router.post('/', async (req: any, res) => {
  const { productId, contactId, period, comment } = req.body || {};
  if (!productId) return res.status(400).json({ error: 'Услуга обязательна' });
  const subscriptionPeriod = ['month', 'quarter', 'year'].includes(period) ? period : 'month';
  try {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: { prices: { include: { priceType: { select: { sortOrder: true } } } } },
    });
    if (!product || !product.isActive) return res.status(404).json({ error: 'Услуга не найдена' });
    if (product.kind !== 'service' || !product.isSubscription) {
      return res.status(400).json({ error: 'Подписка доступна только для услуг с опцией «Подписка»' });
    }
    if (contactId) {
      const contact = await prisma.contact.findUnique({ where: { id: contactId } });
      if (!contact) return res.status(400).json({ error: 'Контрагент не найден' });
    }
    // Флаги «на витрине» — как в GET /api/products/vitrine: колонка for_vitrine живёт вне Prisma-модели
    const flaggedRows = await prisma.$queryRawUnsafe(`SELECT id FROM price_types WHERE for_vitrine = true`) as any[];
    const flaggedVitrineIds = new Set((flaggedRows as any[]).map((r: any) => r.id));
    // Как на витрине: первая ненулевая цена с флагом «на витрине», иначе — первая ненулевая
    const visiblePrices = (product.prices || [])
      .filter((p: any) => Number(p.price) > 0)
      .sort((a: any, b: any) => (a.priceType?.sortOrder ?? 0) - (b.priceType?.sortOrder ?? 0));
    const price = Number((visiblePrices.find((x: any) => flaggedVitrineIds.has(x.priceTypeId)) ?? visiblePrices[0])?.price ?? 0);
    const result = await prisma.$transaction(async (tx) => {
      const last = await tx.productSubscription.findFirst({ orderBy: { number: 'desc' } });
      const number = (last?.number ?? 0) + 1;
      return tx.productSubscription.create({
        data: {
          number,
          productId: product.id,
          contactId: contactId || null,
          userId: req.user?.id || null,
          price,
          period: subscriptionPeriod,
          comment: (comment || '').trim(),
        },
      });
    });
    res.status(201).json(result);
  } catch (err: any) {
    console.error('[subscriptions:create]', err);
    res.status(500).json({ error: err.message });
  }
});

// Смена статуса / комментария заявки (new | active | paused | cancelled)
router.patch('/:id', async (req, res) => {
  const { status, comment } = req.body || {};
  try {
    const existing = await prisma.productSubscription.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ error: 'Заявка не найдена' });
    const data: any = {};
    if (status !== undefined) {
      if (!['new', 'active', 'paused', 'cancelled'].includes(status)) {
        return res.status(400).json({ error: 'Неизвестный статус' });
      }
      data.status = status;
    }
    if (comment !== undefined) data.comment = (comment || '').trim();
    const updated = await prisma.productSubscription.update({ where: { id: req.params.id }, data });
    res.json(updated);
  } catch (err: any) {
    console.error('[subscriptions:patch]', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
