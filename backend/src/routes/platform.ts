/**
 * Платформенные роуты мультитенантности:
 *  - публичная регистрация организаций (только на главном домене);
 *  - информация о текущем tenant'е (для логин-страницы);
 *  - управление организациями для админа платформы.
 */
import { Router } from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import { currentTenant, platformPrisma, invalidateTenantCache, getTenantPrisma, asMainTenant } from '../lib/tenant.js';
import { dbNameForSlug, provisionTenantDb, dropTenantDb, slugTaken, SLUG_PATTERN } from '../lib/tenant-provision.js';
import { createTenantProxyRule, deleteTenantProxyRule } from '../lib/nas-proxy.js';
import { createTenantPaymentLink } from './tochka-acquiring.js';

const router = Router();

// Тот же секрет, что и в auth.ts — токен тенанта проверяется его authMiddleware на поддомене
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

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
  // Тариф без ссылки на оплату и с указанным сроком продления (мес.):
  // организация активируется сразу после регистрации, оплата не требуется.
  const renewMonths = [1, 2, 3].includes(Number(planProduct.crmRenewMonths)) ? Number(planProduct.crmRenewMonths) : null;
  const autoActivate = !planProduct.payLink && renewMonths != null;
  const renewMonthsLbl = renewMonths === 1 ? '1 месяц' : renewMonths === 2 ? '2 месяца' : '3 месяца';
  const autoPaidUntil = autoActivate ? (() => { const d = new Date(); d.setMonth(d.getMonth() + renewMonths!); return d; })() : null;
  const provisioning: Promise<void> = (router as any)._provisioning || Promise.resolve();
  const run = provisioning.then(async () => {
    const dbName = await provisionTenantDb(slug, { name: adminName, email: adminEmail, password: adminPassword });
    await (platformPrisma as any).tenant.create({
      data: {
        name,
        slug,
        dbName,
        adminEmail,
        status: autoActivate ? 'active' : 'pending',
        plan: planProduct.name,
        planProductId: planProduct.id,
        pricePerMonth: planPrice,
        ...(autoActivate ? { activatedAt: new Date(), paidUntil: autoPaidUntil } : {}),

      },
    });
    invalidateTenantCache(slug);

    // Правило Reverse Proxy на NAS (:80 -> CRM-сервер) для редиректа
    // HTTP -> HTTPS. Ошибки не прерывают регистрацию.
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
            body: autoActivate
              ? `«${name}» (${slug}) активирована автоматически на ${renewMonthsLbl} (тариф без оплаты)`
              : `«${name}» (${slug}) ожидает активации после оплаты подписки`,
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
      status: autoActivate ? 'active' : 'pending',
      subdomain: slug,
      planName: planProduct.name,
      priceRub: planPrice != null ? planPrice / 100 : null,
      renewMonths: autoActivate ? renewMonths : null,
      paidUntil: autoPaidUntil ? autoPaidUntil.toISOString() : null,
      message: autoActivate
        ? 'Организация создана и активирована на ' + renewMonthsLbl + '. Вы можете войти по адресу https://' + slug + '.' + ((req.headers.host || 'welans.cc').split(':')[0].replace(/^www\./, ''))
        : 'Организация создана. После оплаты подписки она будет активирована, и вы сможете войти по адресу https://' + slug + '.' + ((req.headers.host || 'welans.cc').split(':')[0].replace(/^www\./, '')),
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
          renewMonths: p.crmRenewMonths ?? null,
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
export function requirePlatformAdmin(req: AuthRequest, res: any, next: any) {
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
    let filesSizeBytes: number | null = null;
    try { filesSizeBytes = await getTenantFilesSize(t.slug); } catch { filesSizeBytes = null; }
    out.push({ ...t, usersCount, dbSizeBytes, filesSizeBytes });
  }
  const mainUsers = await platformPrisma.user.count();
  let mainDb: number | null = null;
  try {
    const mrows: any[] = await platformPrisma.$queryRawUnsafe('SELECT pg_database_size(current_database()) AS size');
    mainDb = Number(mrows[0]?.size ?? 0);
  } catch { mainDb = null; }
  let mainFiles: number | null = null;
  try { mainFiles = await getMainFilesSize(); } catch { mainFiles = null; }
  let system: any = null;
  try { system = await getSystemInfo(); } catch { system = null; }
  try {
    const fs2 = await import('fs/promises');
    const rep = JSON.parse(await fs2.readFile('/app/data/disk-report.json', 'utf-8'));
    if (system) system.docker = rep.docker || null;
  } catch { /* ignore */ }
  res.json({ main: { slug: 'main', name: 'Главная организация', domain: 'welans.cc', status: 'active', usersCount: mainUsers, dbSizeBytes: mainDb, filesSizeBytes: mainFiles, system }, tenants: out });
});

const TENANT_STATUSES = ['pending', 'active', 'suspended'];

/** Системная информация сервера (ОС, NFS, диск, CPU, RAM) */
async function getSystemInfo(): Promise<any> {
  const os = await import('os');
  const fs = await import('fs/promises');
  let diskFree: number | null = null; let diskTotal: number | null = null;
  try {
    const st: any = await (fs as any).statfs('/');
    diskFree = Number(st.bavail) * Number(st.bsize);
    diskTotal = Number(st.blocks) * Number(st.bsize);
  } catch { /* ignore */ }
  let nfs: string[] = [];
  try {
    const mounts = await fs.readFile('/proc/mounts', 'utf-8');
    nfs = mounts.split('\n').filter(l => /\bnfs4?\b/.test(l)).map(l => l.split(' ')[1]).filter(Boolean);
  } catch { /* ignore */ }
  return {
    os: `${os.type()} ${os.release()} (${os.platform()} ${os.arch})`,
    nfsMounts: nfs,
    diskFreeBytes: diskFree,
    diskTotalBytes: diskTotal,
    loadAvg: os.loadavg(),
    cpus: os.cpus().length,
    memFreeBytes: os.freemem(),
    memTotalBytes: os.totalmem(),
  };
}

/** Размер файлов главной организации (/app/uploads без папок tenant'ов t-*) */
async function getMainFilesSize(): Promise<number> {
  const fs = await import('fs/promises');
  const path = await import('path');
  const root = '/app/uploads';
  let total = 0;
  async function walk(dir: string): Promise<void> {
    let entries: any[] = [];
    try { entries = await fs.readdir(dir, { withFileTypes: true }); } catch { return; }
    for (const e of entries) {
      if (e.isDirectory() && e.name.startsWith('t-')) continue;
      const full = path.join(dir, e.name);
      if (e.isDirectory()) await walk(full);
      else { try { total += (await fs.stat(full)).size; } catch { /* ignore */ } }
    }
  }
  await walk(root);
  return total;
}
/** Размер файлов организации в общем томе uploads (рекурсивно) */
async function getTenantFilesSize(slug: string): Promise<number> {
  const fs = await import('fs/promises');
  const path = await import('path');
  const root = `/app/uploads/t-${slug}`;
  let total = 0;
  async function walk(dir: string): Promise<void> {
    let entries: any[] = [];
    try { entries = await fs.readdir(dir, { withFileTypes: true }); } catch { return; }
    for (const e of entries) {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) await walk(full);
      else { try { total += (await fs.stat(full)).size; } catch { /* ignore */ } }
    }
  }
  await walk(root);
  return total;
}

/** Запуск очистки Docker (host-скрипт по cron раз в минуту) */
router.post('/docker-cleanup', authMiddleware, requirePlatformAdmin, async (_req, res) => {
  try {
    const fs = await import('fs/promises');
    await fs.writeFile('/app/data/cleanup-request.json', JSON.stringify({ requestedAt: new Date().toISOString() }));
    res.json({ ok: true, message: 'Очистка запущена — займёт до минуты' });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

/** Результат последней очистки */
router.get('/docker-cleanup-result', authMiddleware, requirePlatformAdmin, async (_req, res) => {
  try {
    const fs = await import('fs/promises');
    const raw = await fs.readFile('/app/data/cleanup-result.json', 'utf-8');
    res.json(JSON.parse(raw));
  } catch {
    res.status(404).json({ error: 'Результата ещё нет' });
  }
});
/** Отчёт по диску (host-скрипт пишет JSON в /app/data) */
router.get('/disk-report', authMiddleware, requirePlatformAdmin, async (_req, res) => {
  try {
    const fs = await import('fs/promises');
    const raw = await fs.readFile('/app/data/disk-report.json', 'utf-8');
    res.json(JSON.parse(raw));
  } catch {
    res.status(404).json({ error: 'Отчёт ещё не сформирован' });
  }
});

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

/**
 * Вход главного администратора платформы в организацию (кнопка «Сменить тенант»).
 * Выпускает JWT для главного администратора организации (первый по дате создания пользователь
 * с ролью admin) с меткой ghost: такая сессия не отмечает пользователя «онлайн»
 * и не меняет его «был в сети» (heartbeat для неё no-op).
 */
router.post('/tenants/:id/impersonate', authMiddleware, requirePlatformAdmin, async (req, res) => {
  try {
    const tenant = await (platformPrisma as any).tenant.findUnique({ where: { id: req.params.id } });
    if (!tenant) return res.status(404).json({ error: 'Организация не найдена' });
    const client = getTenantPrisma(tenant.dbName);
    const admin = await (client as any).user.findFirst({
      where: { role: { name: 'admin' } },
      orderBy: { createdAt: 'asc' },
      select: { id: true, name: true, email: true },
    });
    if (!admin) return res.status(404).json({ error: 'В организации нет администратора' });
    const token = jwt.sign({ id: admin.id, ghost: true }, JWT_SECRET, { expiresIn: '12h' });
    // Поддомен организации на базовом домене текущего запроса (как при регистрации)
    const baseDomain = (req.headers.host || 'welans.cc').split(':')[0].replace(/^www\./, '');
    const url = `https://${tenant.slug}.${baseDomain}`;
    res.json({ url, token, tenantName: tenant.name, adminName: admin.name || admin.email });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
