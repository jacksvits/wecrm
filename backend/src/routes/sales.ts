import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { authMiddleware } from '../middleware/auth.js';
import { buildSalePdf } from '../lib/sale-pdf.js';

const router = Router();
router.use(authMiddleware);

// Список продаж (реализаций): на чьё имя, какие товары, на какую сумму
router.get('/', async (_req, res) => {
  const list = await prisma.sale.findMany({
    orderBy: { number: 'desc' },
    include: { contact: true, warehouse: true, user: true, items: { include: { product: true } } },
  });
  res.json(list);
});

// Создание продажи из корзины витрины: проверка остатков, списание (реализация),
// номер автоинкремент. Оплата (интернет-эквайринг) подключается позже —
// поля status/paymentMethod/paymentId/paidAt зарезервированы.
router.post('/', async (req: any, res) => {
  const { contactId, warehouseId, comment, items } = req.body || {};
  if (!contactId || !Array.isArray(items) || !items.length) {
    return res.status(400).json({ error: 'Контакт и позиции обязательны' });
  }
  const whId = warehouseId || (await prisma.warehouse.findFirst())?.id;
  if (!whId) return res.status(400).json({ error: 'Склад не найден' });

  try {
    const result = await prisma.$transaction(async (tx) => {
      for (const it of items) {
        const stock = await tx.stockBalance.findFirst({
          where: { productId: it.productId, warehouseId: whId },
        });
        const free = (stock?.quantity ?? 0) - (stock?.reserved ?? 0);
        if (it.quantity > free) {
          const p = await tx.product.findUnique({ where: { id: it.productId } });
          throw new Error(`Недостаточно остатка: ${p?.name} (свободно ${free} ${p?.unit || ''})`);
        }
      }
      const last = await tx.sale.findFirst({ orderBy: { number: 'desc' } });
      const number = (last?.number ?? 0) + 1;
      let total = 0;
      const s = await tx.sale.create({
        data: { number, contactId, warehouseId: whId, userId: req.user?.id, comment, total: 0 },
      });
      for (const it of items) {
        const sum = it.quantity * it.price;
        total += sum;
        await tx.saleItem.create({
          data: { saleId: s.id, productId: it.productId, quantity: it.quantity, price: it.price, sum },
        });
        // Реализация: списываем товар со склада (в отличие от резерва, где инкремент reserved)
        await tx.stockBalance.updateMany({
          where: { productId: it.productId, warehouseId: whId },
          data: { quantity: { decrement: it.quantity } },
        });
      }
      return tx.sale.update({
        where: { id: s.id },
        data: { total },
        include: { items: { include: { product: true } }, contact: true },
      });
    });
    res.json(result);
  } catch (e: any) {
    res.status(400).json({ error: e.message || 'Ошибка создания продажи' });
  }
});

// Смена статуса: «Отменён» однократно возвращает остатки на склад
// и замораживает документ (дальнейшие изменения запрещены)
router.patch('/:id', async (req: any, res) => {
  const { status } = (req.body || {}) as { status?: string };
  if (!['new', 'paid', 'cancelled'].includes(status || '')) {
    return res.status(400).json({ error: 'Недопустимый статус' });
  }
  try {
    const result = await prisma.$transaction(async (tx) => {
      const sale = await tx.sale.findUnique({ where: { id: req.params.id }, include: { items: true } });
      if (!sale) throw new Error('Продажа не найдена');
      if (sale.status === 'cancelled') throw new Error('Отменённый документ не редактируется');
      if (status === 'cancelled') {
        for (const it of sale.items) {
          await tx.stockBalance.updateMany({
            where: { productId: it.productId, warehouseId: sale.warehouseId! },
            data: { quantity: { increment: it.quantity } },
          });
        }
      }
      return tx.sale.update({
        where: { id: sale.id },
        data: { status },
        include: { items: { include: { product: true } }, contact: true, warehouse: true, user: true },
      });
    });
    res.json(result);
  } catch (e: any) {
    res.status(400).json({ error: e.message || 'Ошибка смены статуса' });
  }
});

// Накладная по бланку (PDF)
router.get('/:id/pdf', async (req, res) => {
  const s = await prisma.sale.findUnique({
    where: { id: req.params.id },
    include: { items: { include: { product: true } }, contact: true, warehouse: true, user: true },
  });
  if (!s) return res.status(404).json({ error: 'Продажа не найдена' });
  const doc = buildSalePdf({
    number: s.number,
    createdAt: s.createdAt,
    total: Number(s.total),
    contact: s.contact,
    user: s.user,
    items: s.items.map(it => ({ quantity: Number(it.quantity), price: Number(it.price), sum: Number(it.sum), product: it.product })),
  });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="nakladnaya-${String(s.number).padStart(6, '0')}.pdf"`);
  doc.pipe(res);
  doc.end();
});

export default router;
