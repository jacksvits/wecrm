/**
 * Мультитенантность WeCRM.
 *
 * Платформа обслуживает несколько организаций (tenant'ов):
 *  - главная организация живёт в основной БД (DATABASE_URL, обычно "wecrm");
 *  - каждая зарегистрированная организация получает ОТДЕЛЬНУЮ базу
 *    Postgres "wecrm_t_<slug>" со своими данными и бэкапами.
 *
 * Текущий tenant определяется middleware по поддомену (Host-заголовок)
 * и кладётся в AsyncLocalStorage. Глобальный `prisma` (lib/prisma.ts) —
 * прокси, который прозрачно маршрутизирует запросы в БД текущего tenant'а,
 * поэтому существующие роуты/воркеры менять не нужно.
 */
import { AsyncLocalStorage } from 'async_hooks';
import { PrismaClient } from '@prisma/client';

/** Данные tenant'а, доступные в рамках текущего запроса/задачи */
export interface TenantInfo {
  id: string;
  slug: string;
  name: string;
  dbName: string;
  status: string; // pending | active | suspended
  isMain: boolean;
}

/** Клиент к платформенной БД (главная организация + таблица tenants) */
export const platformPrisma = new PrismaClient();

/** Контекст текущего tenant'а (заполняется middleware/worker-раннером) */
export const tenantContext = new AsyncLocalStorage<TenantInfo>();

export function currentTenant(): TenantInfo | undefined {
  return tenantContext.getStore();
}

/** Домены главной организации (платформа). Всё остальное — поддомены tenant'ов */
const MAIN_DOMAINS = new Set(
  (process.env.PLATFORM_DOMAINS || 'welans.cc,www.welans.cc,crm.welans.org,localhost,127.0.0.1')
    .split(',')
    .map((d) => d.trim().toLowerCase())
    .filter(Boolean),
);

export function isMainHost(host: string): boolean {
  return MAIN_DOMAINS.has(host.toLowerCase());
}

/**
 * Строит URL подключения к БД конкретного tenant'а на базе DATABASE_URL
 * платформенной БД (меняется только имя базы).
 */
export function tenantDbUrl(dbName: string): string {
  const base = process.env.DATABASE_URL || '';
  // postgresql://user:pass@host:5432/dbname?schema=public
  const m = base.match(/^(postgresql(?:ql)?:\/\/[^/]+)\/([^/?]+)(\?.*)?$/);
  if (!m) throw new Error(`DATABASE_URL имеет неожиданный формат`);
  return `${m[1]}/${dbName}${m[3] || '?schema=public'}`;
}

/** Кэш PrismaClient'ов по имени БД (один клиент на tenant) */
const tenantClients = new Map<string, PrismaClient>();

export function getTenantPrisma(dbName: string): PrismaClient {
  let client = tenantClients.get(dbName);
  if (!client) {
    client = new PrismaClient({ datasources: { db: { url: tenantDbUrl(dbName) } } });
    tenantClients.set(dbName, client);
  }
  return client;
}

export async function disconnectTenantClients(): Promise<void> {
  for (const [name, client] of tenantClients) {
    try { await client.$disconnect(); } catch { /* ignore */ }
    tenantClients.delete(name);
  }
}

/** Кэш соответствия поддомен -> tenant (обновляется раз в 30 секунд) */
const resolveCache = new Map<string, { tenant: TenantInfo | null; expires: number }>();
const RESOLVE_TTL_MS = 30_000;

const MAIN_TENANT: TenantInfo = {
  id: 'main',
  slug: 'main',
  name: 'WeCRM',
  dbName: (() => {
    const base = process.env.DATABASE_URL || '';
    const m = base.match(/^[a-z]+:\/\/[^/]+\/([^/?]+)/);
    return m ? m[1] : 'wecrm';
  })(),
  status: 'active',
  isMain: true,
};

function tenantToInfo(t: any): TenantInfo {
  return { id: t.id, slug: t.slug, name: t.name, dbName: t.dbName, status: t.status, isMain: false };
}

/** Определяет tenant по Host-заголовку. null — неизвестный поддомен. */
export async function resolveTenantByHost(host: string): Promise<TenantInfo | null> {
  const clean = host.split(':')[0].toLowerCase();
  if (isMainHost(clean)) return MAIN_TENANT;

  const cached = resolveCache.get(clean);
  if (cached && cached.expires > Date.now()) return cached.tenant;

  const dot = clean.indexOf('.');
  const slug = dot > 0 ? clean.slice(0, dot) : clean;

  let tenant: TenantInfo | null = null;
  const row = await (platformPrisma as any).tenant.findUnique({ where: { slug } });
  if (row && row.dbName) tenant = tenantToInfo(row);

  resolveCache.set(clean, { tenant, expires: Date.now() + RESOLVE_TTL_MS });
  return tenant;
}

/** Список активных tenant'ов (для worker-циклов). Главная БД всегда первая. */
export async function listWorkerTenants(): Promise<TenantInfo[]> {
  const out: TenantInfo[] = [MAIN_TENANT];
  try {
    const rows = await (platformPrisma as any).tenant.findMany({ where: { status: 'active' } });
    for (const row of rows) out.push(tenantToInfo(row));
  } catch (e: any) {
    // Таблицы tenants ещё нет (миграция не применена) — работаем только с главной
    if (!/does not exist|relation/i.test(e.message || '')) console.error('[tenant] listWorkerTenants:', e.message);
  }
  return out;
}

/** Инвалидирует кэш резолва (после регистрации/активации tenant'а) */
export function invalidateTenantCache(slug?: string) {
  if (slug) {
    for (const key of resolveCache.keys()) {
      if (key === slug || key.endsWith(`.${slug}`) || key.startsWith(`${slug}.`)) resolveCache.delete(key);
    }
  } else {
    resolveCache.clear();
  }
}

/** Выполняет fn в контексте tenant'а (worker-циклы, provisioning) */
export async function withTenant<T>(tenant: TenantInfo, fn: () => Promise<T>): Promise<T> {
  return tenantContext.run(tenant, fn);
}

/** Префикс папки для файлов tenant'а в общем томе uploads */
export function tenantUploadPrefix(): string {
  const t = currentTenant();
  return t && !t.isMain ? `/t-${t.slug}` : '';
}

/** Корень uploads для текущего tenant'а (изоляция файлов организаций) */
export function uploadsRoot(): string {
  return `/app/uploads${tenantUploadPrefix()}`;
}

/** Выполняет fn в контексте главной организации (независимо от текущего)
 * tenant'а — для операций платформы, вызываемых с поддоменов.
 */
export async function asMainTenant<T>(fn: () => Promise<T>): Promise<T> {
  return tenantContext.run(MAIN_TENANT, fn);
}
/** Ключ tenant'а (main для главной организации) */
export function tenantKey(): string {
  const t = currentTenant();
  return t ? (t.isMain ? 'main' : t.slug) : 'main';
}

/** Директория /app/data текущего tenant'а (изоляция файловых интеграций) */
export function tenantDataDir(): string {
  const t = currentTenant();
  return t && !t.isMain ? `/app/data/t-${t.slug}` : '/app/data';
}
