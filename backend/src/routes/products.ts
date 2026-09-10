import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();
router.use(authMiddleware);

/* ============ Справочники (до /:id!) ============ */

/**
 * GET /api/products/meta/warehouses
 * Список складов
 */
router.get('/meta/warehouses', async (_req, res) => {
  try {
    const warehouses = await prisma.warehouse.findMany({ orderBy: { sortOrder: 'asc' } });
    res.json(warehouses);
  } catch (err: any) {
    console.error('[products:warehouses:list]', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/products/meta/warehouses
 * Создать склад
 */
router.post('/meta/warehouses', async (req, res) => {
  try {
    const { name, location, sortOrder } = req.body;
    if (!name?.trim()) return res.status(400).json({ error: 'Название обязательно' });
    const count = await prisma.warehouse.count();
    const warehouse = await prisma.warehouse.create({
      data: { name: name.trim(), location: location?.trim() || null, sortOrder: sortOrder ?? count + 1 },
    });
    res.status(201).json(warehouse);
  } catch (err: any) {
    console.error('[products:warehouses:create]', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * PATCH /api/products/meta/warehouses/:id
 * Обновить склад
 */
router.patch('/meta/warehouses/:id', async (req, res) => {
  try {
    const { name, location, isActive, sortOrder } = req.body;
    const existing = await prisma.warehouse.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ error: 'Склад не найден' });
    const data: any = {};
    if (name !== undefined) data.name = name.trim();
    if (location !== undefined) data.location = location?.trim() || null;
    if (isActive !== undefined) data.isActive = !!isActive;
    if (sortOrder !== undefined) data.sortOrder = Number(sortOrder);
    const warehouse = await prisma.warehouse.update({ where: { id: req.params.id }, data });
    res.json(warehouse);
  } catch (err: any) {
    console.error('[products:warehouses:update]', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * DELETE /api/products/meta/warehouses/:id
 * Удалить склад (только без движений)
 */
router.delete('/meta/warehouses/:id', async (req, res) => {
  try {
    const movements = await prisma.stockMovement.count({ where: { warehouseId: req.params.id } });
    if (movements > 0) return res.status(400).json({ error: 'Нельзя удалить склад с движениями' });
    await prisma.warehouse.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err: any) {
    console.error('[products:warehouses:delete]', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/products/meta/price-types
 * Список видов цен
 */
router.get('/meta/price-types', async (_req, res) => {
  try {
    const priceTypes = await prisma.priceType.findMany({ orderBy: { sortOrder: 'asc' } });
    res.json(priceTypes);
  } catch (err: any) {
    console.error('[products:price-types:list]', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/products/meta/price-types
 * Создать вид цены
 */
router.post('/meta/price-types', async (req, res) => {
  try {
    const { name, label, color, sortOrder } = req.body;
    if (!name?.trim() || !label?.trim()) return res.status(400).json({ error: 'Название и метка обязательны' });
    const count = await prisma.priceType.count();
    const priceType = await prisma.priceType.create({
      data: { name: name.trim(), label: label.trim(), color: color || '#f0f0f0', sortOrder: sortOrder ?? count + 1 },
    });
    res.status(201).json(priceType);
  } catch (err: any) {
    if (err.code === 'P2002') return res.status(400).json({ error: 'Такой вид цены уже есть' });
    console.error('[products:price-types:create]', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * PATCH /api/products/meta/price-types/:id
 * Обновить вид цены
 */
router.patch('/meta/price-types/:id', async (req, res) => {
  try {
    const { label, color, isActive, sortOrder } = req.body;
    const existing = await prisma.priceType.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ error: 'Вид цены не найден' });
    const data: any = {};
    if (label !== undefined) data.label = label.trim();
    if (color !== undefined) data.color = color;
    if (isActive !== undefined) data.isActive = !!isActive;
    if (sortOrder !== undefined) data.sortOrder = Number(sortOrder);
    const priceType = await prisma.priceType.update({ where: { id: req.params.id }, data });
    res.json(priceType);
  } catch (err: any) {
    console.error('[products:price-types:update]', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * DELETE /api/products/meta/price-types/:id
 * Удалить вид цены (только без истории)
 */
router.delete('/meta/price-types/:id', async (req, res) => {
  try {
    const history = await prisma.priceHistory.count({ where: { priceTypeId: req.params.id } });
    if (history > 0) return res.status(400).json({ error: 'Нельзя удалить вид цены с историей' });
    await prisma.priceType.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err: any) {
    console.error('[products:price-types:delete]', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/products/meta/movements?productId=&warehouseId=
 * История складских движений
 */
router.get('/meta/movements', async (req, res) => {
  try {
    const { productId, warehouseId } = req.query;
    const where: any = {};
    if (productId) where.productId = productId as string;
    if (warehouseId) where.warehouseId = warehouseId as string;
    const movements = await prisma.stockMovement.findMany({
      where,
      include: {
        product: { select: { name: true, sku: true, unit: true } },
        warehouse: { select: { name: true } },
        user: { select: { name: true } },
      },
      orderBy: { date: 'desc' },
      take: 200,
    });
    res.json(movements);
  } catch (err: any) {
    console.error('[products:movements]', err);
    res.status(500).json({ error: err.message });
  }
});

/* ============ Номенклатура ============ */

/**
 * GET /api/products?q=
 * Список товаров с остатками и ценами
 */
router.get('/', async (req, res) => {
  try {
    const { q } = req.query;
    const where: any = {};
    if (q) {
      const s = q as string;
      where.OR = [
        { name: { contains: s, mode: 'insensitive' } },
        { sku: { contains: s, mode: 'insensitive' } },
        { category: { contains: s, mode: 'insensitive' } },
      ];
    }
    const products = await prisma.product.findMany({
      where,
      include: { stocks: true, prices: true },
      orderBy: { name: 'asc' },
    });
    res.json(products);
  } catch (err: any) {
    console.error('[products:list]', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/products
 * Создать товар
 */
router.post('/', async (req, res) => {
  try {
    const { name, sku, description, category, unit, barcode } = req.body;
    if (!name?.trim()) return res.status(400).json({ error: 'Название обязательно' });
    const product = await prisma.product.create({
      data: {
        name: name.trim(),
        sku: sku?.trim() || null,
        description: description || '',
        category: category?.trim() || null,
        unit: unit?.trim() || 'шт',
        barcode: barcode?.trim() || null,
      },
      include: { stocks: true, prices: true },
    });
    res.status(201).json(product);
  } catch (err: any) {
    if (err.code === 'P2002') return res.status(400).json({ error: 'Артикул уже занят' });
    console.error('[products:create]', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/products/:id/history
 * История изменения цен товара
 */
router.get('/:id/history', async (req, res) => {
  try {
    const history = await prisma.priceHistory.findMany({
      where: { productId: req.params.id },
      include: { priceType: { select: { label: true } }, user: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    res.json(history);
  } catch (err: any) {
    console.error('[products:history]', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/products/:id
 * Товар по ID
 */
router.get('/:id', async (req, res) => {
  try {
    const product = await prisma.product.findUnique({
      where: { id: req.params.id },
      include: { stocks: true, prices: true },
    });
    if (!product) return res.status(404).json({ error: 'Товар не найден' });
    res.json(product);
  } catch (err: any) {
    console.error('[products:get]', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * PATCH /api/products/:id
 * Обновить товар
 */
router.patch('/:id', async (req, res) => {
  try {
    const { name, sku, description, category, unit, barcode, isActive } = req.body;
    const existing = await prisma.product.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ error: 'Товар не найден' });
    const data: any = {};
    if (name !== undefined) data.name = name.trim();
    if (sku !== undefined) data.sku = sku?.trim() || null;
    if (description !== undefined) data.description = description;
    if (category !== undefined) data.category = category?.trim() || null;
    if (unit !== undefined) data.unit = unit?.trim() || 'шт';
    if (barcode !== undefined) data.barcode = barcode?.trim() || null;
    if (isActive !== undefined) data.isActive = !!isActive;
    const product = await prisma.product.update({
      where: { id: req.params.id },
      data,
      include: { stocks: true, prices: true },
    });
    res.json(product);
  } catch (err: any) {
    if (err.code === 'P2002') return res.status(400).json({ error: 'Артикул уже занят' });
    console.error('[products:update]', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * DELETE /api/products/:id
 * Удалить товар (каскадно удалит остатки, цены, движения, историю)
 */
router.delete('/:id', async (req, res) => {
  try {
    const existing = await prisma.product.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ error: 'Товар не найден' });
    await prisma.product.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err: any) {
    console.error('[products:delete]', err);
    res.status(500).json({ error: err.message });
  }
});

/* ============ Склад: движения ============ */

/**
 * POST /api/products/:id/movements
 * Создать движение (income | outcome | adjust), обновляет остаток в транзакции
 */
router.post('/:id/movements', async (req, res) => {
  try {
    const user = (req as any).user;
    const { type, warehouseId, quantity, price, comment, date } = req.body;
    if (!['income', 'outcome', 'adjust'].includes(type)) {
      return res.status(400).json({ error: 'Тип операции: income, outcome или adjust' });
    }
    const qty = Number(quantity);
    if (!Number.isFinite(qty) || qty <= 0) return res.status(400).json({ error: 'Количество должно быть больше 0' });

    const product = await prisma.product.findUnique({ where: { id: req.params.id } });
    if (!product) return res.status(404).json({ error: 'Товар не найден' });
    const warehouse = await prisma.warehouse.findUnique({ where: { id: warehouseId } });
    if (!warehouse) return res.status(400).json({ error: 'Склад не найден' });

    const movement = await prisma.$transaction(async (tx) => {
      if (type === 'outcome') {
        const balance = await tx.stockBalance.findUnique({
          where: { productId_warehouseId: { productId: product.id, warehouseId: warehouse.id } },
        });
        if (!balance || balance.quantity < qty) {
          throw new Error(`Недостаточно остатка: доступно ${balance?.quantity || 0} ${product.unit}`);
        }
      }
      const m = await tx.stockMovement.create({
        data: {
          productId: product.id,
          warehouseId: warehouse.id,
          type,
          quantity: qty,
          price: price !== undefined && price !== null && price !== '' ? Number(price) : null,
          comment: comment?.trim() || null,
          date: date ? new Date(date) : new Date(),
          userId: user.id,
        },
      });
      if (type === 'adjust') {
        await tx.stockBalance.upsert({
          where: { productId_warehouseId: { productId: product.id, warehouseId: warehouse.id } },
          create: { productId: product.id, warehouseId: warehouse.id, quantity: qty },
          update: { quantity: qty },
        });
      } else {
        const delta = type === 'income' ? qty : -qty;
        await tx.stockBalance.upsert({
          where: { productId_warehouseId: { productId: product.id, warehouseId: warehouse.id } },
          create: { productId: product.id, warehouseId: warehouse.id, quantity: Math.max(delta, 0) },
          update: { quantity: { increment: delta } },
        });
      }
      return m;
    });

    res.status(201).json(movement);
  } catch (err: any) {
    console.error('[products:movement]', err);
    res.status(400).json({ error: err.message });
  }
});

/* ============ Цены ============ */

/**
 * PUT /api/products/:id/prices
 * Установить цену товара для вида цены (с записью в историю)
 */
router.put('/:id/prices', async (req, res) => {
  try {
    const user = (req as any).user;
    const { priceTypeId, price } = req.body;
    const value = Number(price);
    if (!Number.isFinite(value) || value < 0) return res.status(400).json({ error: 'Некорректная цена' });

    const product = await prisma.product.findUnique({ where: { id: req.params.id } });
    if (!product) return res.status(404).json({ error: 'Товар не найден' });
    const priceType = await prisma.priceType.findUnique({ where: { id: priceTypeId } });
    if (!priceType) return res.status(400).json({ error: 'Вид цены не найден' });

    const updated = await prisma.$transaction(async (tx) => {
      const existing = await tx.productPrice.findUnique({
        where: { productId_priceTypeId: { productId: product.id, priceTypeId } },
      });
      const p = await tx.productPrice.upsert({
        where: { productId_priceTypeId: { productId: product.id, priceTypeId } },
        create: { productId: product.id, priceTypeId, price: value },
        update: { price: value },
      });
      await tx.priceHistory.create({
        data: {
          productId: product.id,
          priceTypeId,
          oldPrice: existing?.price ?? 0,
          newPrice: value,
          userId: user.id,
        },
      });
      return p;
    });

    res.json(updated);
  } catch (err: any) {
    console.error('[products:set-price]', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
