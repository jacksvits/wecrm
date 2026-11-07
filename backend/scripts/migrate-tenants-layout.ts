/**
 * Миграция: перенос файлов tenant'ов из /app/uploads/t-<slug> в /app/tenants/<slug>
 * и данных из /app/data/t-<slug> в /app/tenants/<slug>/data.
 *
 * Что делает (для каждого активного tenant'а):
 *  1. Создаёт /app/tenants/<slug>.
 *  2. Переносит содержимое /app/uploads/t-<slug> → /app/tenants/<slug> (rename).
 *  3. Переносит /app/data/t-<slug> → /app/tenants/<slug>/data (rename).
 *  4. Обновляет пути вложений в БД tenant'а: /uploads/t-<slug>/... → /tenants/<slug>/...
 *
 * Идемпотентен: повторный запуск ничего не перемещает (источника нет) и
 * проставляет недостающие новые пути в БД.
 *
 * Запуск (внутри контейнера backend):
 *   npx tsx scripts/migrate-tenants-layout.ts
 */
import fs from 'fs';
import path from 'path';
import { platformPrisma, listWorkerTenants, withTenant } from '../src/lib/tenant.js';
import { prisma } from '../src/lib/prisma.js';

/** Перенос файла/папки между mount point'ами: rename, при EXDEV — copy + unlink */
function moveEntry(src: string, dst: string): void {
  try {
    fs.renameSync(src, dst);
    return;
  } catch (e: any) {
    if (e.code !== 'EXDEV') throw e;
  }
  const st = fs.statSync(src);
  if (st.isDirectory()) {
    fs.mkdirSync(dst, { recursive: true });
    for (const entry of fs.readdirSync(src)) {
      moveEntry(path.join(src, entry), path.join(dst, entry));
    }
    fs.rmdirSync(src);
  } else {
    fs.copyFileSync(src, dst);
    // Проверка целостности копии перед удалением источника
    if (fs.statSync(dst).size !== st.size) {
      throw new Error(`размеры не совпали после копирования: ${src}`);
    }
    fs.unlinkSync(src);
  }
}

async function migrateTenant(tenant: { slug: string }): Promise<{ moved: number; errors: number }> {
  const stats = { moved: 0, errors: 0 };
  const { slug } = tenant;
  const oldUploads = `/app/uploads/t-${slug}`;
  const newRoot = `/app/tenants/${slug}`;
  const oldData = `/app/data/t-${slug}`;
  const newData = path.join(newRoot, 'data');

  try {
    // 1. Корень tenant'а
    if (!fs.existsSync(newRoot)) fs.mkdirSync(newRoot, { recursive: true });

    // 2. Файлы uploads
    if (fs.existsSync(oldUploads)) {
      for (const entry of fs.readdirSync(oldUploads)) {
        const src = path.join(oldUploads, entry);
        const dst = path.join(newRoot, entry);
        if (fs.existsSync(dst)) {
          console.log(`[tenants] ${slug}: уже существует, пропуск ${dst}`);
          continue;
        }
        moveEntry(src, dst);
        stats.moved++;
      }
      try { fs.rmdirSync(oldUploads); } catch { /* не пуст */ }
      console.log(`[tenants] ${slug}: uploads t-${slug} -> tenants/${slug} (${stats.moved} объектов)`);
    }

    // 3. Данные
    if (fs.existsSync(oldData)) {
      if (!fs.existsSync(newData)) {
        moveEntry(oldData, newData);
        console.log(`[tenants] ${slug}: data t-${slug} -> tenants/${slug}/data`);
      } else {
        for (const entry of fs.readdirSync(oldData)) {
          const src = path.join(oldData, entry);
          const dst = path.join(newData, entry);
          if (!fs.existsSync(dst)) moveEntry(src, dst);
        }
        try { fs.rmdirSync(oldData); } catch { /* не пуст */ }
        console.log(`[tenants] ${slug}: data слита в существующую tenants/${slug}/data`);
      }
      stats.moved++;
    }

    // 4. Обновление путей в БД
    const attachments = await prisma.fileAttachment.findMany({
      where: { path: { startsWith: `/uploads/t-${slug}/` } },
      select: { id: true, path: true },
    });
    for (const att of attachments) {
      const rest = att.path.slice(`/uploads/t-${slug}/`.length);
      await prisma.fileAttachment.update({
        where: { id: att.id },
        data: { path: `/tenants/${slug}/${rest}` },
      });
    }
    if (attachments.length) console.log(`[tenants] ${slug}: обновлено путей в БД: ${attachments.length}`);

    // Аватары пользователей (users.avatar хранит путь от корня uploads tenant'а)
    const users = await prisma.user.findMany({
      where: { avatar: { startsWith: `/uploads/t-${slug}/` } },
      select: { id: true, avatar: true },
    });
    for (const u of users) {
      const rest = u.avatar!.slice(`/uploads/t-${slug}/`.length);
      await prisma.user.update({
        where: { id: u.id },
        data: { avatar: `/tenants/${slug}/${rest}` },
      });
    }
    if (users.length) console.log(`[tenants] ${slug}: обновлено аватаров: ${users.length}`);

    // Аватары контактов
    const contacts = await prisma.contact.findMany({
      where: { avatarUrl: { startsWith: `/uploads/t-${slug}/` } },
      select: { id: true, avatarUrl: true },
    });
    for (const c of contacts) {
      const rest = c.avatarUrl!.slice(`/uploads/t-${slug}/`.length);
      await prisma.contact.update({
        where: { id: c.id },
        data: { avatarUrl: `/tenants/${slug}/${rest}` },
      });
    }
    if (contacts.length) console.log(`[tenants] ${slug}: обновлено аватаров контактов: ${contacts.length}`);

    // Подписи почтовых аккаунтов (могут содержать inline-изображения со старым префиксом)
    const mails = await prisma.mailAccount.findMany({
      where: { signature: { contains: `/uploads/t-${slug}/` } },
      select: { id: true, signature: true },
    });
    for (const m of mails) {
      await prisma.mailAccount.update({
        where: { id: m.id },
        data: { signature: m.signature!.split(`/uploads/t-${slug}/`).join(`/tenants/${slug}/`) },
      });
    }
    if (mails.length) console.log(`[tenants] ${slug}: обновлено подписей почты: ${mails.length}`);
  } catch (e: any) {
    stats.errors++;
    console.error(`[tenants] ОШИБКА (${slug}):`, e.message);
  }
  return stats;
}

async function main() {
  const tenants = await listWorkerTenants();
  const onlyTenants = tenants.filter((t: any) => !t.isMain);
  console.log(`[tenants] Tenant'ов: ${onlyTenants.length}`);

  // Корень /app/tenants (создаём и на хосте через volume — заранее)
  if (!fs.existsSync('/app/tenants')) fs.mkdirSync('/app/tenants', { recursive: true });

  const total = { moved: 0, errors: 0 };
  for (const tenant of onlyTenants) {
    const s = await withTenant(tenant, () => migrateTenant(tenant));
    total.moved += s.moved;
    total.errors += s.errors;
  }
  console.log(`[tenants] Готово: перенесено ${total.moved}, ошибок ${total.errors}`);
}

main()
  .catch((e) => {
    console.error('[tenants] Фатальная ошибка:', e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await (platformPrisma as any).$disconnect?.().catch(() => {});
    await (prisma as any).$disconnect?.().catch(() => {});
  });
