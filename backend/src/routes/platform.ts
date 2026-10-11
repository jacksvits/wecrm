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
import { currentTenant, platformPrisma, invalidateTenantCache } from '../lib/tenant.js';
import { dbNameForSlug, provisionTenantDb, dropTenantDb, slugTaken, SLUG_PATTERN } from '../lib/tenant-provision.js';
import { createTenantProxyRule, deleteTenantProxyRule } from '../lib/nas-proxy.js';

const router = Router();

const registerSchema = z.object({
  name: z.string().trim().min(2, 'Название организации — минимум 2 символа').max(100),
  slug: z.string().trim().toLowerCase(),
  adminName: z.string().trim().min(2, 'Укажите имя администратора').max(80),
  adminEmail: z.string().trim().toLowerCase().email('Некорректный email'),
  adminPassword: z.string().min(8, 'Пароль — минимум 8 символов').max(100),
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
  const { name, slug, adminName, adminEmail, adminPassword } = parsed.data;
  if (!SLUG_PATTERN.test(slug)) {
    return res.status(400).json({ error: 'Поддомен: 3–32 символа, строчные латинские буквы, цифры и дефис' });
  }

  if (await slugTaken(slug)) {
    return res.status(409).json({ error: 'Этот поддомен уже занят. Выберите другой.' });
  }

  // Сериализуем провижининг, чтобы два параллельных запроса не ломали друг друга
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
        plan: 'standard',
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
      message: 'Организация создана. После оплаты подписки она будет активирована, и вы сможете войти по адресу https://' + slug + '.' + ((req.headers.host || 'welans.cc').split(':')[0].replace(/^www\./, '')),
    });
  } catch (e: any) {
    console.error('[platform] register error:', e);
    res.status(500).json({ error: 'Не удалось создать организацию. Попробуйте позже или обратитесь в поддержку.' });
  }
});

/** Информация о текущем tenant'е — для логин-страницы (публичный) */
router.get('/me', (_req, res) => {
  const t = currentTenant();
  if (!t) return res.status(404).json({ error: 'Организация не найдена' });
  res.json({ name: t.name, slug: t.slug, isMain: t.isMain, status: t.status });
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
  res.json(tenants);
});

const TENANT_STATUSES = ['pending', 'active', 'suspended'];

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
