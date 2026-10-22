import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';

const router = Router();
router.use(authMiddleware);

// Продукт в составе избранного: только нужное для карточки в панели избранного
const productInclude = {
  images: { orderBy: { sortOrder: 'asc' as const }, take: 1 },
  prices: { include: { priceType: { select: { label: true, forVitrine: true } } } },
  stocks: true,
};

// Мои группы избранного вместе с товарами
async function groupsWithItems(ownerId: string) {
  return prisma.vitrineFavoriteGroup.findMany({
    where: { ownerId },
    orderBy: { createdAt: 'asc' },
    include: { items: { orderBy: { createdAt: 'asc' }, include: { product: { include: productInclude } } } },
  });
}

/**
 * GET /api/favorites
 * Мои группы избранного витрины с товарами (личные у каждого пользователя)
 */
router.get('/', async (req: AuthRequest, res) => {
  try {
    res.json(await groupsWithItems(req.user!.id));
  } catch (err: any) {
    console.error('[favorites:list]', err);
    res.status(500).json({ error: err.message });
  }
});

const createGroupSchema = z.object({ name: z.string().trim().min(1).max(100) });

/**
 * POST /api/favorites/groups
 * Создать группу избранного
 */
router.post('/groups', async (req: AuthRequest, res) => {
  const parsed = createGroupSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Укажите название группы' });
  try {
    await prisma.vitrineFavoriteGroup.create({ data: { name: parsed.data.name, ownerId: req.user!.id } });
    res.json(await groupsWithItems(req.user!.id));
  } catch (err: any) {
    console.error('[favorites:createGroup]', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * DELETE /api/favorites/groups/:id
 * Удалить свою группу вместе с товарами
 */
router.delete('/groups/:id', async (req: AuthRequest, res) => {
  try {
    const group = await prisma.vitrineFavoriteGroup.findFirst({ where: { id: req.params.id, ownerId: req.user!.id } });
    if (!group) return res.status(404).json({ error: 'Группа не найдена' });
    await prisma.vitrineFavoriteGroup.delete({ where: { id: group.id } });
    res.json(await groupsWithItems(req.user!.id));
  } catch (err: any) {
    console.error('[favorites:deleteGroup]', err);
    res.status(500).json({ error: err.message });
  }
});

const addItemSchema = z.object({ productId: z.string().min(1) });

/**
 * POST /api/favorites/groups/:id/items
 * Добавить товар в группу избранного (дубликаты в одной группе игнорируются)
 */
router.post('/groups/:id/items', async (req: AuthRequest, res) => {
  const parsed = addItemSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Не указан товар' });
  try {
    const group = await prisma.vitrineFavoriteGroup.findFirst({ where: { id: req.params.id, ownerId: req.user!.id } });
    if (!group) return res.status(404).json({ error: 'Группа не найдена' });
    const product = await prisma.product.findFirst({ where: { id: parsed.data.productId, isActive: true } });
    if (!product) return res.status(404).json({ error: 'Товар не найден' });
    await prisma.vitrineFavoriteItem.upsert({
      where: { groupId_productId: { groupId: group.id, productId: product.id } },
      create: { groupId: group.id, productId: product.id },
      update: {},
    });
    res.json(await groupsWithItems(req.user!.id));
  } catch (err: any) {
    console.error('[favorites:addItem]', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * DELETE /api/favorites/groups/:id/items/:productId
 * Убрать товар из группы избранного
 */
router.delete('/groups/:id/items/:productId', async (req: AuthRequest, res) => {
  try {
    const group = await prisma.vitrineFavoriteGroup.findFirst({ where: { id: req.params.id, ownerId: req.user!.id } });
    if (!group) return res.status(404).json({ error: 'Группа не найдена' });
    await prisma.vitrineFavoriteItem.deleteMany({ where: { groupId: group.id, productId: req.params.productId } });
    res.json(await groupsWithItems(req.user!.id));
  } catch (err: any) {
    console.error('[favorites:removeItem]', err);
    res.status(500).json({ error: err.message });
  }
});

const shareSchema = z.object({ userId: z.string().min(1) });

/**
 * POST /api/favorites/groups/:id/share
 * Передать группу другому пользователю: у получателя создаётся КОПИЯ группы
 * со всеми товарами и отметкой «Передано от <имя отправителя>».
 * Своё избранное и группа отправителя не меняются.
 */
router.post('/groups/:id/share', async (req: AuthRequest, res) => {
  const parsed = shareSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Не указан получатель' });
  try {
    const group = await prisma.vitrineFavoriteGroup.findFirst({
      where: { id: req.params.id, ownerId: req.user!.id },
      include: { items: true },
    });
    if (!group) return res.status(404).json({ error: 'Группа не найдена' });
    const target = await prisma.user.findUnique({ where: { id: parsed.data.userId } });
    if (!target) return res.status(404).json({ error: 'Пользователь не найден' });
    if (target.id === req.user!.id) return res.status(400).json({ error: 'Нельзя передать группу себе' });
    const sender = await prisma.user.findUnique({ where: { id: req.user!.id } });
    // Если у получателя уже есть копия этой группы от этого же отправителя с тем же
    // названием — дополняем её товарами, иначе создаём новую копию
    const existing = await prisma.vitrineFavoriteGroup.findFirst({
      where: { ownerId: target.id, name: group.name, sharedById: req.user!.id },
    });
    if (existing) {
      const data = group.items.map(i => ({ groupId: existing.id, productId: i.productId }));
      for (const d of data) {
        await prisma.vitrineFavoriteItem.upsert({
          where: { groupId_productId: { groupId: d.groupId, productId: d.productId } },
          create: d,
          update: {},
        });
      }
    } else {
      await prisma.vitrineFavoriteGroup.create({
        data: {
          name: group.name,
          ownerId: target.id,
          sharedById: req.user!.id,
          sharedByName: sender?.name || 'пользователя',
          items: { create: group.items.map(i => ({ productId: i.productId })) },
        },
      });
    }
    res.json({ ok: true, sharedWith: target.name });
  } catch (err: any) {
    console.error('[favorites:share]', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
