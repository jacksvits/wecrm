/**
 * Провижининг tenant'а: создание отдельной базы данных организации,
 * накат миграций и первичный seed (роли + администратор организации).
 */
import fs from 'fs';
import path from 'path';
import pg from 'pg';
import { execFile } from 'child_process';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { platformPrisma, tenantDbUrl } from './tenant.js';


/** Имя базы данных для поддомена (дефисы -> подчёркивания, Postgres-friendly) */
export function dbNameForSlug(slug: string): string {
  return `wecrm_t_${slug.replace(/-/g, '_')}`;
}

/** Пропускает "-" в slug: 3-32 символа, начинается/кончается на букву-цифру */
export const SLUG_PATTERN = /^[a-z0-9](?:[a-z0-9-]{1,30}[a-z0-9])$/;

export const RESERVED_SLUGS = new Set([
  'www', 'api', 'app', 'admin', 'panel', 'platform', 'support', 'help', 'mail',
  'smtp', 'webmail', 'ftp', 'ns1', 'ns2', 'static', 'assets', 'cdn', 'crm',
  'test', 'dev', 'demo', 'staging', 'beta', 'shop', 'store', 'blog', 'status',
  'pay', 'billing', 'account', 'auth', 'login', 'register', 'root', 'main',
]);

export async function slugTaken(slug: string): Promise<boolean> {
  if (RESERVED_SLUGS.has(slug)) return true;
  const existing = await (platformPrisma as any).tenant.findUnique({ where: { slug } });
  if (existing) return true;
  // Защита от осиротевших БД с таким именем
  const dbName = dbNameForSlug(slug);
  const rows: any[] = await platformPrisma.$queryRawUnsafe(
    `SELECT 1 FROM pg_database WHERE datname = $1`, dbName,
  );
  return rows.length > 0;
}

/**
 * Исторические миграции проекта неполные (часть таблиц создавалась через
 * prisma db push), поэтому чистую БД нельзя накатить с нуля через
 * migrate deploy. Вместо этого применяем baseline — снапшот схемы
 * платформенной БД вместе с историей _prisma_migrations
 * (файл генерируется scripts/gen-tenant-baseline.sh). Дальнейшие миграции
 * на БД tenant'а применяются инкрементально обычным migrate deploy.
 */
async function applyBaseline(dbName: string): Promise<void> {
  const baselinePath = path.join(process.cwd(), 'prisma', 'tenant-baseline.sql');
  // pg_dump (PG16+) добавляет psql-метакоманды \restrict/\unrestrict —
  // сервер их не принимает, отфильтровываем перед выполнением
  const sql = fs.readFileSync(baselinePath, 'utf-8')
    .split('\n')
    .filter((line) => !/^\\(restrict|unrestrict)/.test(line))
    .join('\n');
  const client = new pg.Client({ connectionString: tenantDbUrl(dbName) });
  await client.connect();
  try {
    // node-postgres выполняет многостатement-скрипт одним simple-запросом
    await client.query(sql);
  } finally {
    await client.end();
  }
}

/**
 * Применяет `prisma migrate deploy` к свежесозданной БД tenant'а
 * (CLI-процесс с подменой DATABASE_URL, как в tenant-loop.ts).
 * Baseline-снапшот отстаёт от актуальной схемы: без этого сид упадёт
 * на колонках, добавленных миграциями после снапшота (например, users.timezone).
 */
function runTenantMigrateDeploy(dbName: string): Promise<void> {
  return new Promise((resolve, reject) => {
    execFile('npx', ['prisma', 'migrate', 'deploy'], {
      cwd: process.cwd(),
      env: { ...process.env, DATABASE_URL: tenantDbUrl(dbName) },
      timeout: 120000,
      maxBuffer: 5 * 1024 * 1024,
    }, (err, _stdout, stderr) => {
      if (err) return reject(new Error(`migrate deploy (${dbName}): ${stderr || err.message}`));
      resolve();
    });
  });
}

async function seedTenant(client: PrismaClient, admin: { name: string; email: string; password: string }) {
  const adminRole = await client.role.upsert({
    where: { name: 'admin' },
    update: {},
    create: { name: 'admin', label: 'Администраторы', color: '#dcfce7', textColor: '#166534', sortOrder: 1 },
  });
  await client.role.upsert({
    where: { name: 'manager' },
    update: {},
    create: { name: 'manager', label: 'Менеджеры', color: '#fef3c7', textColor: '#92400e', sortOrder: 2 },
  });
  await client.role.upsert({
    where: { name: 'developer' },
    update: {},
    create: { name: 'developer', label: 'Разработчики', color: '#dbeafe', textColor: '#1e40af', sortOrder: 3 },
  });
  await client.role.upsert({
    where: { name: 'user' },
    update: {},
    create: { name: 'user', label: 'Пользователи', color: '#f0f0f0', textColor: '#666', sortOrder: 4 },
  });
  await client.user.upsert({
    where: { email: admin.email.toLowerCase() },
    update: {},
    create: {
      email: admin.email.toLowerCase(),
      password: await bcrypt.hash(admin.password, 10),
      name: admin.name,
      roleId: adminRole.id,
    },
  });
}

/**
 * Создаёт БД организации, накатывает миграции, сеет роли и админа.
 * Вызывается из роута регистрации (см. routes/platform.ts).
 */
export async function provisionTenantDb(
  slug: string,
  admin: { name: string; email: string; password: string },
): Promise<string> {
  const dbName = dbNameForSlug(slug);
  await platformPrisma.$executeRawUnsafe(`CREATE DATABASE "${dbName}"`);
  try {
    await applyBaseline(dbName);
    // Догоняем схему свежей БД до актуальной, иначе сид падает на колонках,
    // которых нет в baseline-снапшоте (P2022)
    await runTenantMigrateDeploy(dbName);
    const client = new PrismaClient({ datasources: { db: { url: tenantDbUrl(dbName) } } });
    try {
      await seedTenant(client, admin);
    } finally {
      await client.$disconnect();
    }
  } catch (e) {
    // Не оставляем пустую/битую БД — иначе повторная регистрация упрётся в "БД существует"
    try { await platformPrisma.$executeRawUnsafe(`DROP DATABASE IF EXISTS "${dbName}" WITH (FORCE)`); } catch { /* ignore */ }
    throw e;
  }
  return dbName;
}

/** Удаляет БД tenant'а (используется при полном удалении организации) */
export async function dropTenantDb(dbName: string): Promise<void> {
  if (!/^wecrm_t_[a-z0-9_]+$/.test(dbName)) throw new Error(`Некорректное имя БД: ${dbName}`);
  await platformPrisma.$executeRawUnsafe(`DROP DATABASE IF EXISTS "${dbName}" WITH (FORCE)`);
}
