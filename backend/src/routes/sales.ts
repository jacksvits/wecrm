import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { authMiddleware } from '../middleware/auth.js';

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

export default router;
