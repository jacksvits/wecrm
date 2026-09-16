import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { authMiddleware } from '../middleware/auth.js';
import { buildReservationPdf } from '../lib/reservation-pdf.js';

const router = Router();
router.use(authMiddleware);

// Список резервов: на чьё имя, какие товары, на какую сумму
router.get('/', async (_req, res) => {
  const list = await prisma.reservation.findMany({
    orderBy: { number: 'desc' },
    include: { contact: true, warehouse: true, user: true, items: { include: { product: true } } },
  });
  res.json(list);
});

// Создание: только по наличию (без минуса), номер автоинкремент
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
      const last = await tx.reservation.findFirst({ orderBy: { number: 'desc' } });
      const number = (last?.number ?? 0) + 1;
      let total = 0;
      const r = await tx.reservation.create({
        data: { number, contactId, warehouseId: whId, userId: req.user?.id, comment, total: 0 },
      });
      for (const it of items) {
        const sum = it.quantity * it.price;
        total += sum;
        await tx.reservationItem.create({
          data: { reservationId: r.id, productId: it.productId, quantity: it.quantity, price: it.price, sum },
        });
        await tx.stockBalance.updateMany({
          where: { productId: it.productId, warehouseId: whId },
          data: { reserved: { increment: it.quantity } },
        });
      }
      return tx.reservation.update({
        where: { id: r.id },
        data: { total },
        include: { items: { include: { product: true } }, contact: true },
      });
    });
    res.json(result);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

// Выдача: статус «Выдано» + списание штатным движением outcome
router.post('/:id/issue', async (req: any, res) => {
  try {
    const result = await prisma.$transaction(async (tx) => {
      const r = await tx.reservation.findUnique({ where: { id: req.params.id }, include: { items: true } });
      if (!r) throw new Error('Резерв не найден');
      if (r.status === 'issued') throw new Error('Резерв уже выдан');
      for (const it of r.items) {
        const stock = await tx.stockBalance.findFirst({
          where: { productId: it.productId, warehouseId: r.warehouseId },
        });
        if (it.quantity > (stock?.quantity ?? 0)) {
          const p = await tx.product.findUnique({ where: { id: it.productId } });
          throw new Error(`Недостаточно остатка для выдачи: ${p?.name}`);
        }
        await tx.stockBalance.updateMany({
          where: { productId: it.productId, warehouseId: r.warehouseId },
          data: { quantity: { decrement: it.quantity }, reserved: { decrement: it.quantity } },
        });
        await tx.stockMovement.create({
          data: {
            type: 'outcome',
            productId: it.productId,
            warehouseId: r.warehouseId,
            quantity: it.quantity,
            price: it.price,
            comment: `Резерв №${r.number}`,
            userId: req.user?.id,
          },
        });
      }
      return tx.reservation.update({
        where: { id: r.id },
        data: { status: 'issued', issuedAt: new Date() },
        include: { items: { include: { product: true } }, contact: true },
      });
    });
    res.json(result);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

// PDF документа
router.get('/:id/pdf', async (req, res) => {
  const r = await prisma.reservation.findUnique({
    where: { id: req.params.id },
    include: { items: { include: { product: true } }, contact: true, warehouse: true, user: true },
  });
  if (!r) return res.status(404).json({ error: 'Резерв не найден' });
  const doc = buildReservationPdf(r as any);
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="reservation-${r.number}.pdf"`);
  doc.pipe(res);
  doc.end();
});

// Поделиться в обсуждении задачи (модель Comment: content, authorId, taskId)
router.post('/:id/share', async (req: any, res) => {
  const { taskId } = req.body || {};
  if (!taskId) return res.status(400).json({ error: 'taskId обязателен' });
  const r = await prisma.reservation.findUnique({ where: { id: req.params.id }, include: { contact: true } });
  if (!r) return res.status(404).json({ error: 'Резерв не найден' });
  const statusLabel = r.status === 'held' ? 'Отложено' : 'Выдано';
  const text = `Резерв №${r.number} — ${r.contact.name} на сумму ${r.total.toFixed(2)} ₽ (${statusLabel}).`;
  const comment = await prisma.comment.create({
    data: { taskId, authorId: req.user?.id, content: text },
  });
  res.json(comment);
});

export default router;
