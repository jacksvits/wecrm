/**
 * Платформенные роуты мультитенантности:
 *  - публичная регистрация организаций (только на главном домене);
 *  - информация о текущем tenant'е (для логин-страницы);
 *  - управление организациями для админа платформы.
 */
import { Router } from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import { currentTenant, platformPrisma, invalidateTenantCache, getTenantPrisma, asMainTenant } from '../lib/tenant.js';
import { dbNameForSlug, provisionTenantDb, dropTenantDb, slugTaken, SLUG_PATTERN } from '../lib/tenant-provision.js';
import { createTenantProxyRule, deleteTenantProxyRule } from '../lib/nas-proxy.js';
import { createTenantPaymentLink } from './tochka-acquiring.js';

const router = Router();

const registerSchema = z.object({
  name: z.string().trim().min(2, 'Название организации — минимум 2 символа').max(100),
  slug: z.string().trim().toLowerCase(),
  adminName: z.string().trim().min(2, 'Укажите имя администратора').max(80),
  adminEmail: z.string().trim().toLowerCase().email('Некорректный email'),
  adminPassword: z.string().min(8, 'Пароль — минимум 8 символов').max(100),
  planId: z.string().trim().min(1, 'Выберите тариф'),
});

/** Простая защита от спама: не более 5 регистраций с IP за 10 минут */
const attempts = new Map<string, number[]>();
function rateLimitOk(ip: string): boolean {
  const now = Date.now();
  const list = (attempts.get(ip) || []).filter((t) => now - t < 10 * 60_000);
  if (list.length >= 5) { attempts.set(ip, list); return false; }
  list.push(now);
  attempts.set(ip, list);
  return true;
}

/** Публичная регистрация организации. Работает только на главном домене платформы. */
router.post('/register', async (req, res) => {
  const tenant = currentTenant();
  if (!tenant?.isMain) {
    return res.status(404).json({ error: 'Регистрация доступна только на основном сайте платформы' });
  }
  const ip = (req.headers['x-real-ip'] as string) || req.socket.remoteAddress || '';
  if (!rateLimitOk(ip)) {
    return res.status(429).json({ error: 'Слишком много попыток. Попробуйте позже.' });
  }

  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0]?.message || 'Некорректные данные' });
  }
  const { name, slug, adminName, adminEmail, adminPassword, planId } = parsed.data;
  if (!SLUG_PATTERN.test(slug)) {
    return res.status(400).json({ error: 'Поддомен: 3–32 символа, строчные латинские буквы, цифры и дефис' });
  }

  if (await slugTaken(slug)) {
    return res.status(409).json({ error: 'Этот поддомен уже занят. Выберите другой.' });
  }

  // Сериализуем провижининг, чтобы два параллельных запроса не ломали друг друга
  // Валидация тарифа: товар активен и лежит в категории с флагом Тарифы CRM
  // (relation Product -> ProductCategory называется categoryNode)
  let planProduct: any = null;
  try {
    planProduct = await (platformPrisma as any).product.findFirst({
      where: { id: planId, isActive: true, categoryNode: { isCrmTariff: true } },
      include: { prices: true },
    });
  } catch (e: any) {
    console.error('[platform] plan validation:', e.message);
    return res.status(500).json({ error: 'Ошибка проверки тарифа' });
  }
  if (!planProduct) return res.status(400).json({ error: 'Выберите тариф из списка' });
  const planPrices = (planProduct.prices || []).map((x: any) => Number(x.price)).filter((n: number) => Number.isFinite(n));
  const planPrice = planPrices.length ? Math.round(Math.min(...planPrices) * 100) : null;
  const provisioning: Promise<void> = (router as any)._provisioning || Promise.resolve();
  const run = provisioning.then(async () => {
    const dbName = await provisionTenantDb(slug, { name: adminName, email: adminEmail, password: adminPassword });
    await (platformPrisma as any).tenant.create({
      data: {
        name,
        slug,
        dbName,
        adminEmail,
        status: 'pending',
        plan: planProduct.name,
        planProductId: planProduct.id,
        pricePerMonth: planPrice,

      },
    });
    invalidateTenantCache(slug);

    // Правило Reverse Proxy на NAS: <slug>.welans.cc -> CRM-сервер.
    // Ошибки не прерывают регистрацию — правило можно добавить вручную.
    createTenantProxyRule(slug).catch((e: any) => console.error('[platform] NAS proxy rule:', e.message));

    // Уведомляем администраторов платформы о новой регистрации
    try {
      const admins = await platformPrisma.user.findMany({
        where: { role: { name: 'admin' } },
        select: { id: true },
      });
      for (const admin of admins) {
        await platformPrisma.notification.create({
          data: {
            userId: admin.id,
            title: 'Новая организация на платформе',
            body: `«${name}» (${slug}) ожидает активации после оплаты подписки`,
            type: 'system',
          },
        });
      }
    } catch (e: any) {
      console.error('[platform] notify admins:', e.message);
    }
  });
  (router as any)._provisioning = run.catch(() => {});

  try {
    await run;
    res.json({
      ok: true,
      status: 'pending',
      subdomain: slug,
      planName: planProduct.name,
      priceRub: planPrice != null ? planPrice / 100 : null,
      message: 'Организация создана. После оплаты подписки она будет активирована, и вы сможете войти по адресу https://' + slug + '.' + ((req.headers.host || 'welans.cc').split(':')[0].replace(/^www\./, '')),
    });
  } catch (e: any) {
    console.error('[platform] register error:', e);
    res.status(500).json({ error: 'Не удалось создать организацию. Попробуйте позже или обратитесь в поддержку.' });
  }
});

/** Проверка существования организации по поддомену (для страницы Войти в свою CRM) */
router.get('/check-slug', async (req, res) => {
  if (!currentTenant()?.isMain) return res.status(404).json({ error: 'Доступно только на основном домене' });
  const slug = String(req.query.slug || '').toLowerCase().trim();
  if (!/^[a-z0-9](?:[a-z0-9-]{1,30}[a-z0-9])$/.test(slug)) return res.json({ exists: false });
  const tenant = await (platformPrisma as any).tenant.findUnique({ where: { slug } });
  res.json(tenant
    ? { exists: true, name: tenant.name, status: tenant.status }
    : { exists: false });
});
/** Тарифы CRM: товары категорий каталога главного проекта с флагом Тарифы CRM */
router.get('/tariffs', async (_req, res) => {
  if (!currentTenant()?.isMain) return res.status(404).json({ error: 'Доступно только на основном домене' });
  try {
    const categories = await (platformPrisma as any).productCategory.findMany({
      where: { isCrmTariff: true },
      include: { products: { where: { isActive: true }, include: { prices: true } } },
    });
    const out: any[] = [];
    for (const cat of categories) {
      for (const p of cat.products) {
        const prices = (p.prices || []).map((x: any) => Number(x.price)).filter((n: number) => Number.isFinite(n));
        out.push({
          productId: p.id,
          name: p.name,
          description: p.description || '',
          price: prices.length ? Math.min(...prices) : null,
          categoryName: cat.name,
        });
      }
    }
    res.json(out);
  } catch (e: any) {
    console.error('[platform] tariffs:', e.message);
    res.json([]);
  }
});
/** Создание платёжной ссылки Точки для оплаты подписки (автоактивация по webhook) */
router.post('/pay-link', async (req, res) => {
  const cur = currentTenant();
  const slug = cur && !cur.isMain ? cur.slug : String((req.body || {}).slug || '').toLowerCase().trim();
  const tenant = await (platformPrisma as any).tenant.findUnique({ where: { slug } });
  if (!tenant) return res.status(404).json({ error: 'Организация не найдена' });
  let amount = tenant.pricePerMonth;
  if (!amount && tenant.planProductId) {
    const product = await (platformPrisma as any).product.findUnique({ where: { id: tenant.planProductId }, include: { prices: true } });
    if (product) {
      const prices = (product.prices || []).map((x: any) => Number(x.price)).filter((n: number) => Number.isFinite(n));
      if (prices.length) amount = Math.round(Math.min(...prices) * 100);
    }
  }
  if (!amount) return res.status(400).json({ error: 'Не задана сумма подписки' });
  const result = await asMainTenant(() => createTenantPaymentLink(tenant.slug, tenant.name, tenant.plan || 'standard', amount));
  if ('error' in result) return res.status(400).json({ error: result.error });
  res.json(result);
});
/** Данные для оплаты подписки (публичный: главный домен ?slug=, поддомен - своя организация) */
router.get('/pay-info', async (req, res) => {
  const cur = currentTenant();
  const slug = cur && !cur.isMain ? cur.slug : String(req.query.slug || '').toLowerCase().trim();
  const tenant = await (platformPrisma as any).tenant.findUnique({ where: { slug } });
  if (!tenant) return res.status(404).json({ error: 'Организация не найдена' });
  let planName = tenant.plan || 'standard';
  let priceRub: number | null = tenant.pricePerMonth != null ? tenant.pricePerMonth / 100 : null;
  let payLink: string | null = null;
  if (tenant.planProductId) {
    const product = await (platformPrisma as any).product.findUnique({ where: { id: tenant.planProductId } });
    if (product) {
      planName = product.name;
      payLink = product.payLink || null;
      if (priceRub == null) {
        const prices = (product.prices || []).map((x: any) => Number(x.price)).filter((n: number) => Number.isFinite(n));
        if (prices.length) priceRub = Math.min(...prices);
      }
    }
  }
  res.json({
    slug: tenant.slug,
    name: tenant.name,
    status: tenant.status,
    planName,
    priceRub,
    payLink,
    paymentInfo: tenant.paymentInfo || '',
    contactEmail: 'info@welans.ru',
  });
});

/** Уведомление об оплате: создаёт запрос в поддержку платформы (публичный, главный домен) */
router.post('/pay-notify', async (req, res) => {
  const cur2 = currentTenant();
  const ip = (req.headers['x-real-ip'] as string) || req.socket.remoteAddress || '';
  if (!rateLimitOk(ip)) return res.status(429).json({ error: 'Слишком много попыток' });
  let slug: string;
  if (cur2 && !cur2.isMain) slug = cur2.slug;
  else slug = z.object({ slug: z.string().trim().min(1) }).parse(req.body || {}).slug;
  const tenant = await (platformPrisma as any).tenant.findUnique({ where: { slug: slug.toLowerCase() } });
  if (!tenant) return res.status(404).json({ error: 'Организация не найдена' });
  const ticket = await (platformPrisma as any).tenantTicket.create({
    data: {
      tenantId: tenant.id,
      tenantSlug: tenant.slug,
      tenantName: tenant.name,
      authorName: tenant.adminEmail,
      authorEmail: tenant.adminEmail,
      subject: `Оплата подписки: ${tenant.plan || 'standard'}`,
      status: 'open',
    },
  });
  await (platformPrisma as any).tenantTicketMessage.create({
    data: { ticketId: ticket.id, authorRole: 'tenant', authorName: tenant.adminEmail, body: 'Организация сообщает об оплате подписки. Подтвердите платёж и активируйте доступ.' },
  });
  try {
    const admins = await platformPrisma.user.findMany({ where: { role: { name: 'admin' } }, select: { id: true } });
    for (const admin of admins) {
      await platformPrisma.notification.create({
        data: { userId: admin.id, title: 'Оплата подписки', body: `«${tenant.name}» (${tenant.slug}) сообщает об оплате`, type: 'system' },
      });
    }
  } catch (e: any) { console.error('[platform] pay-notify notify:', e.message); }
  res.json({ ok: true });
});
/** Информация о текущем tenant'е — для логин-страницы (публичный) */
router.get('/me', async (_req, res) => {
  const t = currentTenant();
  if (!t) return res.status(404).json({ error: 'Организация не найдена' });
  let allowedPages: string[] | null = null;
  if (!t.isMain) {
    try {
      const tenantRow = await (platformPrisma as any).tenant.findUnique({ where: { id: t.id } });
      if (tenantRow?.planProductId) {
        const product = await (platformPrisma as any).product.findUnique({ where: { id: tenantRow.planProductId } });
        if (Array.isArray(product?.crmAllowedPages)) allowedPages = product.crmAllowedPages;
      }
    } catch { /* ignore */ }
  }
  res.json({ name: t.name, slug: t.slug, isMain: t.isMain, status: t.status, allowedPages });
});

/** Дальше — только главный домен + админ платформы */
function requirePlatformAdmin(req: AuthRequest, res: any, next: any) {
  const t = currentTenant();
  if (!t?.isMain) return res.status(403).json({ error: 'Доступно только на основном домене платформы' });
  if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Требуются права администратора платформы' });
  next();
}

/** Список организаций платформы */
router.get('/tenants', authMiddleware, requirePlatformAdmin, async (_req, res) => {
  const tenants = await (platformPrisma as any).tenant.findMany({ orderBy: { createdAt: 'desc' } });
  // Обогащаем: число пользователей в БД организации и размер базы
  const out: any[] = [];
  for (const t of tenants) {
    let usersCount: number | null = null;
    let dbSizeBytes: number | null = null;
    try {
      const client = getTenantPrisma(t.dbName);
      usersCount = await client.user.count();
    } catch { usersCount = null; }
    try {
      const rows: any[] = await platformPrisma.$queryRawUnsafe('SELECT pg_database_size($1) AS size', t.dbName);
      dbSizeBytes = Number(rows[0]?.size ?? 0);
    } catch { dbSizeBytes = null; }
    out.push({ ...t, usersCount, dbSizeBytes });
  }
  res.json(out);
});

const TENANT_STATUSES = ['pending', 'active', 'suspended'];

/** Редактирование организации: тариф и/или дата окончания подписки */
router.put('/tenants/:id', authMiddleware, requirePlatformAdmin, async (req, res) => {
  const tenant = await (platformPrisma as any).tenant.findUnique({ where: { id: req.params.id } });
  if (!tenant) return res.status(404).json({ error: 'Организация не найдена' });
  const body = z.object({
    plan: z.string().trim().max(100).optional(),
    planProductId: z.string().trim().optional(),
    paidUntil: z.string().optional(),
    paymentInfo: z.string().max(5000).optional(),
  }).parse(req.body || {});
  const data: any = {};
  if (body.plan !== undefined) data.plan = body.plan;
  if (body.planProductId !== undefined) {
    if (body.planProductId) {
      const p = await (platformPrisma as any).product.findFirst({
        where: { id: body.planProductId, isActive: true, categoryNode: { isCrmTariff: true } },
        include: { prices: true },
      });
      if (!p) return res.status(400).json({ error: 'Тариф не найден в тарифных категориях' });
      data.plan = p.name;
      data.planProductId = p.id;
      const prices = (p.prices || []).map((x: any) => Number(x.price)).filter((n: number) => Number.isFinite(n));
      if (prices.length) data.pricePerMonth = Math.round(Math.min(...prices) * 100);
    } else {
      data.planProductId = null;
    }
  }
  if (body.paymentInfo !== undefined) data.paymentInfo = body.paymentInfo;
  if (body.paidUntil !== undefined) {
    const d = new Date(body.paidUntil);
    if (Number.isNaN(d.getTime())) return res.status(400).json({ error: 'Некорректная дата окончания подписки' });
    data.paidUntil = d;
  }
  const updated = await (platformPrisma as any).tenant.update({ where: { id: tenant.id }, data });
  invalidateTenantCache(tenant.slug);
  res.json(updated);
});
/** Активация организации после оплаты подписки (+30 дней) */
router.post('/tenants/:id/activate', authMiddleware, requirePlatformAdmin, async (req, res) => {
  const tenant = await (platformPrisma as any).tenant.findUnique({ where: { id: req.params.id } });
  if (!tenant) return res.status(404).json({ error: 'Организация не найдена' });
  const paidUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  const updated = await (platformPrisma as any).tenant.update({
    where: { id: tenant.id },
    data: { status: 'active', activatedAt: new Date(), paidUntil },
  });
  invalidateTenantCache(tenant.slug);
  res.json(updated);
});

/** Приостановка организации */
router.post('/tenants/:id/suspend', authMiddleware, requirePlatformAdmin, async (req, res) => {
  const tenant = await (platformPrisma as any).tenant.findUnique({ where: { id: req.params.id } });
  if (!tenant) return res.status(404).json({ error: 'Организация не найдена' });
  const updated = await (platformPrisma as any).tenant.update({
    where: { id: tenant.id },
    data: { status: 'suspended' },
  });
  invalidateTenantCache(tenant.slug);
  res.json(updated);
});

/** Возобновление приостановленной организации (без изменения срока оплаты) */
router.post('/tenants/:id/resume', authMiddleware, requirePlatformAdmin, async (req, res) => {
  const tenant = await (platformPrisma as any).tenant.findUnique({ where: { id: req.params.id } });
  if (!tenant) return res.status(404).json({ error: 'Организация не найдена' });
  const updated = await (platformPrisma as any).tenant.update({
    where: { id: tenant.id },
    data: { status: 'active' },
  });
  invalidateTenantCache(tenant.slug);
  res.json(updated);
});

/** Продление подписки (+30 дней от текущего срока или от сейчас) */
router.post('/tenants/:id/extend', authMiddleware, requirePlatformAdmin, async (req, res) => {
  const tenant = await (platformPrisma as any).tenant.findUnique({ where: { id: req.params.id } });
  if (!tenant) return res.status(404).json({ error: 'Организация не найдена' });
  const base = tenant.paidUntil && new Date(tenant.paidUntil) > new Date() ? new Date(tenant.paidUntil) : new Date();
  const paidUntil = new Date(base.getTime() + 30 * 24 * 60 * 60 * 1000);
  const updated = await (platformPrisma as any).tenant.update({
    where: { id: tenant.id },
    data: { status: 'active', paidUntil },
  });
  invalidateTenantCache(tenant.slug);
  res.json(updated);
});

/** Полное удаление организации вместе с базой данных */
router.delete('/tenants/:id', authMiddleware, requirePlatformAdmin, async (req, res) => {
  const tenant = await (platformPrisma as any).tenant.findUnique({ where: { id: req.params.id } });
  if (!tenant) return res.status(404).json({ error: 'Организация не найдена' });
  if (req.query.confirm !== tenant.slug) {
    return res.status(400).json({ error: `Для удаления передайте ?confirm=${tenant.slug}` });
  }
  await deleteTenantProxyRule(tenant.slug).catch((e: any) => console.error('[platform] NAS proxy delete:', e.message));
  await dropTenantDb(tenant.dbName);
  await (platformPrisma as any).tenant.delete({ where: { id: tenant.id } });
  invalidateTenantCache(tenant.slug);
  res.json({ ok: true });
});

/** Сброс пароля администратора организации */
router.post('/tenants/:id/reset-password', authMiddleware, requirePlatformAdmin, async (req, res) => {
  const tenant = await (platformPrisma as any).tenant.findUnique({ where: { id: req.params.id } });
  if (!tenant) return res.status(404).json({ error: 'Организация не найдена' });
  const { password } = z.object({ password: z.string().min(8).max(100) }).parse(req.body || {});
  const { getTenantPrisma, tenantContext } = await import('../lib/tenant.js');
  await tenantContext.run(
    { id: tenant.id, slug: tenant.slug, name: tenant.name, dbName: tenant.dbName, status: tenant.status, isMain: false },
    async () => {
      const client = getTenantPrisma(tenant.dbName);
      await client.user.updateMany({
        where: { email: tenant.adminEmail },
        data: { password: await bcrypt.hash(password, 10) },
      });
    },
  );
  res.json({ ok: true });
});

export default router;
