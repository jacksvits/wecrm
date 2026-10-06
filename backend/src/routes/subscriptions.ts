import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();
router.use(authMiddleware);

// Дата окончания оплаченного периода: явное поле endsAt,
// для старых записей без него — дата последнего изменения + длительность периода
function addPaidPeriod(date: Date, period: string): Date {
  const d = new Date(date);
  if (period === 'year') d.setFullYear(d.getFullYear() + 1);
  else if (period === 'quarter') d.setMonth(d.getMonth() + 3);
  else d.setMonth(d.getMonth() + 1);
  return d;
}

// Список подписок для вкладки «Подписки» каталога.
// Администратор и менеджер видят все подписки, остальные — только свои.
// Для активных подписок вычисляется дата окончания оплаченного периода.
router.get('/', async (req: any, res) => {
  try {
    const isPrivileged = ['admin', 'manager'].includes(req.user?.role);
    const list = await prisma.productSubscription.findMany({
      where: isPrivileged ? {} : { userId: req.user?.id || undefined },
      orderBy: { number: 'desc' },
      include: {
        product: { select: { id: true, name: true, unit: true } },
        contact: { select: { id: true, name: true } },
        user: { select: { id: true, name: true } },
      },
    });
    const enriched = list.map((s: any) => ({
      ...s,
      activeUntil: s.status === 'active' ? (s.endsAt ?? addPaidPeriod(s.updatedAt, s.period)).toISOString() : null,
    }));
    res.json(enriched);
  } catch (err: any) {
    console.error('[subscriptions:list]', err);
    res.status(500).json({ error: err.message });
  }
});

// Подписки текущего пользователя (личный кабинет, кнопка «Подписки» в меню аватарки)
router.get('/my', async (req: any, res) => {
  try {
    const list = await prisma.productSubscription.findMany({
      where: { userId: req.user?.id || undefined },
      orderBy: { number: 'desc' },
      include: {
        product: { select: { id: true, name: true, unit: true } },
        contact: { select: { id: true, name: true } },
      },
    });
    res.json(list);
  } catch (err: any) {
    console.error('[subscriptions:my]', err);
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
  const subscriptionPeriod = ['month', 'year'].includes(period) ? period : 'month';
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

// Биллинг (страница директора): все подписки всех пользователей.
// Для активных подписок вычисляется окончание оплаченного периода
// (явное поле endsAt, для старых записей — дата последнего изменения + период).
router.get('/billing', async (req: any, res) => {
  try {
    if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Доступ только для директора' });
    const list = await prisma.productSubscription.findMany({
      orderBy: { number: 'desc' },
      include: {
        product: { select: { id: true, name: true, unit: true } },
        contact: { select: { id: true, name: true } },
        user: { select: { id: true, name: true } },
      },
    });
    const enriched = list.map((s: any) => ({
      ...s,
      activeUntil: s.status === 'active' ? (s.endsAt ?? addPaidPeriod(s.updatedAt, s.period)).toISOString() : null,
    }));
    res.json(enriched);
  } catch (err: any) {
    console.error('[subscriptions:billing]', err);
    res.status(500).json({ error: err.message });
  }
});

// Отказ от подписки текущим пользователем (личный кабинет).
// Пользователь может отменить только свою подписку; уже отменённую — нельзя.
router.post('/:id/cancel', async (req: any, res) => {
  try {
    const existing = await prisma.productSubscription.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ error: 'Подписка не найдена' });
    if (existing.userId !== req.user?.id) return res.status(403).json({ error: 'Нет доступа к этой подписке' });
    if (existing.status === 'cancelled') return res.status(400).json({ error: 'Подписка уже отменена' });
    const updated = await prisma.productSubscription.update({
      where: { id: existing.id },
      data: { status: 'cancelled' },
    });
    res.json(updated);
  } catch (err: any) {
    console.error('[subscriptions:cancel]', err);
    res.status(500).json({ error: err.message });
  }
});

// Редактирование заявки: статус/комментарий/цена/период — только директор,
// номер и дату окончания подписки — директор и менеджер (как у резервов).
router.patch('/:id', async (req: any, res) => {
  const isPrivileged = ['admin', 'manager'].includes(req.user?.role);
  if (!isPrivileged) return res.status(403).json({ error: 'Нет доступа к редактированию' });
  const { status, comment, price, period, number, endsAt } = req.body || {};
  try {
    const existing = await prisma.productSubscription.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ error: 'Заявка не найдена' });
    const data: any = {};
    if (status !== undefined) {
      if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Статус меняет только директор' });
      if (!['new', 'active', 'paused', 'cancelled'].includes(status)) {
        return res.status(400).json({ error: 'Неизвестный статус' });
      }
      data.status = status;
      // При активации без явной даты окончания — конец периода от текущей даты
      if (status === 'active' && endsAt === undefined && !existing.endsAt) {
        data.endsAt = addPaidPeriod(new Date(), existing.period);
      }
    }
    if (comment !== undefined) data.comment = (comment || '').trim();
    if (price !== undefined) {
      if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Цену меняет только директор' });
      const p = Number(price);
      if (!Number.isFinite(p) || p < 0) return res.status(400).json({ error: 'Некорректная цена' });
      data.price = p;
    }
    if (period !== undefined) {
      if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Период меняет только директор' });
      if (!['month', 'quarter', 'year'].includes(period)) {
        return res.status(400).json({ error: 'Неизвестный период' });
      }
      data.period = period;
    }
    if (number !== undefined) {
      const n = Number(number);
      if (!Number.isInteger(n) || n < 1) return res.status(400).json({ error: 'Некорректный номер' });
      if (n !== existing.number) {
        const clash = await prisma.productSubscription.findFirst({ where: { number: n, NOT: { id: existing.id } } });
        if (clash) return res.status(400).json({ error: `Номер ${n} уже занят` });
      }
      data.number = n;
    }
    if (endsAt !== undefined) {
      if (endsAt === null) {
        data.endsAt = null;
      } else {
        const d = new Date(endsAt);
        if (Number.isNaN(d.getTime())) return res.status(400).json({ error: 'Некорректная дата окончания' });
        data.endsAt = d;
      }
    }
    const updated = await prisma.productSubscription.update({ where: { id: existing.id }, data });
    res.json(updated);
  } catch (err: any) {
    console.error('[subscriptions:patch]', err);
    res.status(500).json({ error: err.message });
  }
});

// Продление подписки: к дате окончания (или к текущей дате, если срок прошёл)
// добавляется один оплаченный период. Администратор и менеджер — любую подписку,
// обычный пользователь — только свою.
router.post('/:id/renew', async (req: any, res) => {
  try {
    const isPrivileged = ['admin', 'manager'].includes(req.user?.role);
    const existing = await prisma.productSubscription.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ error: 'Подписка не найдена' });
    if (!isPrivileged && existing.userId !== req.user?.id) {
      return res.status(403).json({ error: 'Нет доступа к этой подписке' });
    }
    if (existing.status !== 'active') {
      return res.status(400).json({ error: 'Продлить можно только активную подписку' });
    }
    const base = existing.endsAt && existing.endsAt > new Date() ? existing.endsAt : new Date();
    const updated = await prisma.productSubscription.update({
      where: { id: existing.id },
      data: { endsAt: addPaidPeriod(base, existing.period) },
    });
    res.json(updated);
  } catch (err: any) {
    console.error('[subscriptions:renew]', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
