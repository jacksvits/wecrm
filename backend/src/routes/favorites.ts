import { Router } from 'express';
import crypto from 'crypto';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';

const router = Router();
router.use(authMiddleware);

// Продукт в составе избранного: только нужное для карточки в панели избранного.
// Колонки for_vitrine (price_types) и price_from (product_prices) в схеме Prisma
// отсутствуют — добавляются напрямую в БД, поэтому флаги подставляем raw-запросом
// (та же техника, что и в роуте витрины /api/products/vitrine).
const productInclude = {
  images: { orderBy: { sortOrder: 'asc' as const }, take: 1 },
  prices: { include: { priceType: { select: { label: true } } } },
  stocks: true,
};

// Флаги цен «на витрине» и «цена от» — raw-запросами (колонок for_vitrine и
// price_from нет в схеме Prisma, добавляются напрямую в БД).
async function loadPriceFlags() {
  const [vitrineRows, priceFromRows] = await Promise.all([
    prisma.$queryRawUnsafe(`SELECT id FROM price_types WHERE for_vitrine = true`) as Promise<any[]>,
    prisma.$queryRawUnsafe(`SELECT id, price_from FROM product_prices`) as Promise<any[]>,
  ]);
  return {
    vitrineIds: new Set((vitrineRows as any[]).map((r) => r.id as string)),
    priceFrom: new Map((priceFromRows as any[]).map((r) => [r.id as string, !!r.price_from])),
  };
}

// Подставляем флаги ценам товаров группы (панель избранного и просмотр по ссылке)
function annotateGroup(group: any, flags: { vitrineIds: Set<string>; priceFrom: Map<string, boolean> }) {
  return {
    ...group,
    items: group.items.map((it: any) => ({
      ...it,
      product: it.product && {
        ...it.product,
        prices: it.product.prices.map((pr: any) => ({
          ...pr,
          priceFrom: flags.priceFrom.get(pr.id) ?? false,
          priceType: { ...pr.priceType, forVitrine: flags.vitrineIds.has(pr.priceTypeId) },
        })),
      },
    })),
  };
}

// Мои группы избранного вместе с товарами
async function groupsWithItems(ownerId: string) {
  const groups = await prisma.vitrineFavoriteGroup.findMany({
    where: { ownerId },
    orderBy: { createdAt: 'asc' },
    include: { items: { orderBy: { createdAt: 'asc' }, include: { product: { include: productInclude } } } },
  });
  const flags = await loadPriceFlags();
  return groups.map((g) => annotateGroup(g, flags));
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

// Ссылка-приглашение для просмотра группы и принятия её копии
const sharedGroupInclude = {
  include: {
    owner: { select: { name: true } },
    items: { orderBy: { createdAt: 'asc' as const }, include: { product: { include: productInclude } } },
  },
} as const;

/**
 * POST /api/favorites/groups/:id/share
 * Получить (или создать) ссылку-приглашение на группу. body: { renew?: boolean }
 * renew=true — перевыпускает ссылку (старая перестаёт работать).
 */
router.post('/groups/:id/share', async (req: AuthRequest, res) => {
  try {
    const group = await prisma.vitrineFavoriteGroup.findFirst({ where: { id: req.params.id, ownerId: req.user!.id } });
    if (!group) return res.status(404).json({ error: 'Группа не найдена' });
    const renew = !!(req.body as any)?.renew;
    const shareToken = renew || !group.shareToken
      ? crypto.randomBytes(24).toString('hex')
      : group.shareToken;
    if (shareToken !== group.shareToken) {
      await prisma.vitrineFavoriteGroup.update({ where: { id: group.id }, data: { shareToken } });
    }
    res.json({ url: `/favorites/share/${shareToken}` });
  } catch (err: any) {
    console.error('[favorites:shareLink]', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/favorites/shared/:token
 * Просмотр группы по ссылке-приглашению (только для авторизованных).
 */
router.get('/shared/:token', async (req: AuthRequest, res) => {
  try {
    const group = await prisma.vitrineFavoriteGroup.findFirst({
      where: { shareToken: req.params.token },
      ...sharedGroupInclude,
    });
    if (!group) return res.status(404).json({ error: 'Ссылка недействительна или устарела' });
    const flags = await loadPriceFlags();
    res.json({ ...annotateGroup(group, flags), sharedByName: group.owner.name });
  } catch (err: any) {
    console.error('[favorites:shared]', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/favorites/shared/:token/accept
 * Принять группу по ссылке: у текущего пользователя создаётся КОПИЯ группы
 * со всеми товарами и отметкой «Передано от <имя владельца ссылки>».
 * Повторное принятие той же ссылки дополняет его копию новыми товарами.
 */
router.post('/shared/:token/accept', async (req: AuthRequest, res) => {
  try {
    const group = await prisma.vitrineFavoriteGroup.findFirst({
      where: { shareToken: req.params.token },
      include: { items: true, owner: { select: { id: true, name: true } } },
    });
    if (!group) return res.status(404).json({ error: 'Ссылка недействительна или устарела' });
    if (group.ownerId === req.user!.id) return res.status(400).json({ error: 'Это ваша собственная группа' });
    // Если у получателя уже есть копия этой группы от этого же владельца —
    // дополняем её товарами, иначе создаём новую копию
    const existing = await prisma.vitrineFavoriteGroup.findFirst({
      where: { ownerId: req.user!.id, name: group.name, sharedById: group.ownerId },
    });
    if (existing) {
      for (const i of group.items) {
        await prisma.vitrineFavoriteItem.upsert({
          where: { groupId_productId: { groupId: existing.id, productId: i.productId } },
          create: { groupId: existing.id, productId: i.productId },
          update: {},
        });
      }
    } else {
      await prisma.vitrineFavoriteGroup.create({
        data: {
          name: group.name,
          ownerId: req.user!.id,
          sharedById: group.ownerId,
          sharedByName: group.owner.name || 'пользователя',
          items: { create: group.items.map(i => ({ productId: i.productId })) },
        },
      });
    }
    res.json({ ok: true, sharedByName: group.owner.name });
  } catch (err: any) {
    console.error('[favorites:accept]', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
