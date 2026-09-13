import { prisma } from './prisma.js';
import { OneCClient, OneCNomenclature, OneCCounterparty } from './onec.js';

export interface OneCSyncStats {
  startedAt: string;
  finishedAt?: string;
  products: { pulled: number; pushed: number; errors: number };
  contacts: { pulled: number; pushed: number; errors: number };
  pricesPulled: number;
  stockRowsUpdated: number;
  error?: string;
}

// Двусторонняя синхронизация: номенклатура и контрагенты/контакты.
// Сопоставление записей: onecId -> (sku/barcode/INN) -> name, дубли не создаются.
//
// Взаимное исключение между процессами (backend и worker работают одновременно):
// без блокировки два параллельных цикла портят данные (наблюдалось: виды товаров
// перезаписывались, услуги становились товарами). Только один процесс синхронизируется,
// второй получает ошибку «уже выполняется».

export async function runOneCSync(): Promise<OneCSyncStats> {
  // Взаимное исключение через таблицу-муьекс (advisory-функции недоступны в этой сборке Postgres).
  // Занятая блокировка считается протухшей через 30 минут (защита от зависшего процесса).
  await prisma.$executeRaw`CREATE TABLE IF NOT EXISTS onec_sync_lock (id INTEGER PRIMARY KEY, started_at TIMESTAMPTZ NOT NULL)`;
  const acquired = await prisma.$executeRaw`
    INSERT INTO onec_sync_lock (id, started_at) VALUES (1, now())
    ON CONFLICT (id) DO UPDATE SET started_at = now() WHERE onec_sync_lock.started_at < now() - interval '30 minutes'
  `;
  if (!acquired) throw new Error('Синхронизация уже выполняется другим процессом');
  try {
    return await runOneCSyncInner();
  } finally {
    try { await prisma.$executeRaw`DELETE FROM onec_sync_lock WHERE id = 1`; } catch { /* строка останется, снимется по таймауту 30 минут */ }
  }
}

async function runOneCSyncInner(): Promise<OneCSyncStats> {
  const s = await prisma.oneCPluginSettings.findUnique({ where: { id: 1 } });
  if (!s || !s.isActive) throw new Error('Плагин 1С не активен');
  if (!s.serviceUrl || !s.login || !s.password) throw new Error('Не заполнены ссылка, логин или пароль 1С');

  const client = new OneCClient(s.serviceUrl, s.login, s.password);
  const lastSyncWatermark = s.lastSyncAt; // для определения изменённых в CRM контактов
  const stats: OneCSyncStats = {
    startedAt: new Date().toISOString(),
    products: { pulled: 0, pushed: 0, errors: 0 },
    contacts: { pulled: 0, pushed: 0, errors: 0 },
    pricesPulled: 0,
    stockRowsUpdated: 0,
  };

  // ===== НОМЕНКЛАТУРА =====
  try {
    // Pull: 1С -> CRM
    {
      const page = await client.getNomenclature();
      // Строки CRM, занятые в этом цикле: одноимённые позиции 1С не перезаписывают чужую строку
      // (порядок строк OData не гарантирован — без этого виды «прыгали»: услуги/товары затирали друг друга)
      const claimed = new Set<string>();
      for (const n of page.items) {
        try {
          const skipIds = [...claimed];
          let existing = await prisma.product.findFirst({ where: { onecId: n.id } });
          if (!existing && n.sku) existing = await prisma.product.findFirst({ where: { sku: n.sku, id: { notIn: skipIds } } });
          if (!existing && n.barcode) existing = await prisma.product.findFirst({ where: { barcode: n.barcode, id: { notIn: skipIds } } });
          if (!existing) existing = await prisma.product.findFirst({ where: { name: n.name, id: { notIn: skipIds } } });
          const data = {
            name: n.name,
            sku: n.sku ?? existing?.sku ?? null,
            barcode: n.barcode ?? existing?.barcode ?? null,
            unit: n.unit || existing?.unit || 'шт',
            // Вид меняем только по достоверным данным 1С; если тип вида не отдан (база занята) — сохраняем вид CRM
            kind: n.kind === 'service' ? 'service' : (n.kindResolved ? 'product' : (existing?.kind ?? 'product')),
            category: n.categoryPath?.length ? n.categoryPath.join(' / ') : (existing?.category ?? null),
            subcategory: null,
            description: n.description ?? existing?.description ?? null,
            isActive: n.isActive ?? true,
            onecId: n.id,
            onecSyncedAt: new Date(),
          };
          if (existing) {
            await prisma.product.update({ where: { id: existing.id }, data });
            claimed.add(existing.id);
          } else {
            // Одноимённая позиция получает свою строку; sku/barcode уникальны — при занятости не дублируем
            let createData: any = { ...data };
            if (n.sku && (await prisma.product.findFirst({ where: { sku: n.sku }, select: { id: true } }))) {
              createData = { ...createData, sku: null };
            }
            if (n.barcode && (await prisma.product.findFirst({ where: { barcode: n.barcode }, select: { id: true } }))) {
              createData = { ...createData, barcode: null };
            }
            const created = await prisma.product.create({ data: createData });
            claimed.add(created.id);
          }
          stats.products.pulled++;
        } catch (e: any) {
          stats.products.errors++;
          console.error('[1c] nomenclature pull:', e.message);
        }
      }
      }

    // Push: CRM -> 1С (новые + изменённые после последней синхронизации)
    const newProducts = await prisma.product.findMany({ where: { onecId: null } });
    const linkedProducts = await prisma.product.findMany({ where: { onecId: { not: null } } });
    const changedProducts = linkedProducts.filter((p) => !p.onecSyncedAt || p.updatedAt > p.onecSyncedAt);
    for (const p of [...newProducts, ...changedProducts]) {
      try {
        const payload: Partial<OneCNomenclature> = {
          name: p.name,
          sku: p.sku ?? undefined,
          barcode: p.barcode ?? undefined,
          unit: p.unit,
          kind: p.kind as 'product' | 'service',
          description: p.description ?? undefined,
          categoryPath: p.category
            ? [...p.category.split(' / ').map((s) => s.trim()), ...(p.subcategory ? p.subcategory.split(' / ').map((s) => s.trim()) : [])].filter(Boolean)
            : undefined,
        };
        if (p.onecId) {
          await client.updateNomenclature(p.onecId, payload);
        } else {
          const r = await client.createNomenclature(payload);
          await prisma.product.update({ where: { id: p.id }, data: { onecId: r.id } });
        }
        await prisma.product.update({ where: { id: p.id }, data: { onecSyncedAt: new Date() } });
        stats.products.pushed++;
      } catch (e: any) {
        stats.products.errors++;
        console.error('[1c] nomenclature push:', e.message);
      }
    }
  } catch (e: any) {
    stats.error = `Номенклатура: ${e.message}`;
  }

  // ===== ЦЕНЫ (1С -> CRM) =====
  try {
    const kinds = await client.getPriceKinds();
    const prices = await client.getPrices();
    for (const pr of prices) {
      try {
        const p = await prisma.product.findFirst({ where: { onecId: pr.nomenclatureKey } });
        if (!p) continue;
        const kindName = kinds.get(pr.priceKindKey) || 'Цена 1С';
        let pt = await prisma.priceType.findFirst({ where: { name: kindName } });
        if (!pt) pt = await prisma.priceType.create({ data: { name: kindName, label: kindName } });
        await prisma.productPrice.upsert({
          where: { productId_priceTypeId: { productId: p.id, priceTypeId: pt.id } },
          create: { productId: p.id, priceTypeId: pt.id, price: pr.price, currency: 'RUB' },
          update: { price: pr.price },
        });
        stats.pricesPulled++;
      } catch (e: any) {
        stats.products.errors++;
        console.error('[1c] price pull:', e.message);
      }
    }
  } catch (e: any) {
    stats.error = stats.error ? `${stats.error}; Цены: ${e.message}` : `Цены: ${e.message}`;
  }

  // ===== ОСТАТКИ (1С -> CRM) =====
  try {
    const warehouses = await client.getWarehouses();
    const whMap = new Map<string, string>();
    for (const w of warehouses) {
      let wh = await prisma.warehouse.findFirst({ where: { name: w.name } });
      if (!wh) wh = await prisma.warehouse.create({ data: { name: w.name } });
      whMap.set(w.id, wh.id);
    }
    const stock = await client.getStock();
    for (const s of stock) {
      try {
        const whId = whMap.get(s.warehouseKey);
        if (!whId) continue;
        const p = await prisma.product.findFirst({ where: { onecId: s.nomenclatureKey } });
        if (!p) continue;
        const q = Math.round(s.quantity * 1000) / 1000;
        await prisma.stockBalance.upsert({
          where: { productId_warehouseId: { productId: p.id, warehouseId: whId } },
          create: { productId: p.id, warehouseId: whId, quantity: q },
          update: { quantity: q },
        });
        stats.stockRowsUpdated++;
      } catch (e: any) {
        stats.products.errors++;
        console.error('[1c] stock pull:', e.message);
      }
    }
  } catch (e: any) {
    stats.error = stats.error ? `${stats.error}; Остатки: ${e.message}` : `Остатки: ${e.message}`;
  }

  // ===== КОНТРАГЕНТЫ / КОНТАКТЫ =====
  const pulledContactIds = new Set<string>();
  try {
    // Pull: 1С -> CRM
    {
      const page = await client.getCounterparties();
      for (const c of page.items) {
        try {
          let target =
            (await prisma.contact.findFirst({ where: { onecId: c.id } })) ||
            (c.inn ? await prisma.contact.findFirst({ where: { inn: c.inn } }) : null) ||
            (c.phone ? await prisma.contact.findFirst({ where: { name: c.name, phone: c.phone } }) : null);
          if (!target) {
            // Защита от дублей: контакт с таким именем уже есть в CRM
            const byName = await prisma.contact.findFirst({ where: { name: c.name }, orderBy: { id: 'asc' } });
            if (byName) {
              if (byName.onecId) continue; // имя уже представлено привязанным контактом — запись 1С пропускаем
              target = byName;             // свободный одноимённый контакт CRM «усыновляем» под запись 1С
            }
          }
          const existing = target;
          // Сильное совпадение (по GUID/ИНН) — вид берём из 1С; слабое (имя/имя+телефон) — вид CRM сохраняем
          const strongMatch = !!existing && (existing.onecId === c.id || (!!c.inn && existing.inn === c.inn));
          const data = {
            name: c.name,
            kind: strongMatch ? (c.kind === 'contact' ? 'contact' : 'organization') : (existing?.kind ?? (c.kind === 'contact' ? 'contact' : 'organization')),
            company: c.kind === 'organization' ? c.name : existing?.company ?? null,
            inn: c.inn ?? existing?.inn ?? null,
            ogrn: c.ogrn ?? existing?.ogrn ?? null,
            legalAddress: c.legalAddress ?? existing?.legalAddress ?? null,
            phone: c.phone ?? existing?.phone ?? null,
            email: c.email ?? existing?.email ?? null,
            onecId: c.id,
          };
          if (existing) await prisma.contact.update({ where: { id: existing.id }, data });
          else await prisma.contact.create({ data: { ...data, type: 'client' } });
          pulledContactIds.add(c.id);
          stats.contacts.pulled++;
        } catch (e: any) {
          stats.contacts.errors++;
          console.error('[1c] counterparty pull:', e.message);
        }
      }
    }

    // Push: CRM -> 1С (новые + изменённые после прошлой синхронизации; то, что только что pulled, пропускаем)
    const newContacts = await prisma.contact.findMany({ where: { onecId: null } });
    const linkedContacts = await prisma.contact.findMany({ where: { onecId: { not: null } } });
    const changedContacts = lastSyncWatermark
      ? linkedContacts.filter((c) => c.updatedAt > lastSyncWatermark)
      : [];
    for (const c of [...newContacts, ...changedContacts]) {
      if (c.onecId && pulledContactIds.has(c.onecId)) continue; // эхо pull-фазы
      try {
        const payload: Partial<OneCCounterparty> = {
          name: c.name,
          kind: c.kind === 'organization' ? 'organization' : 'contact',
          inn: c.inn ?? undefined,
          ogrn: c.ogrn ?? undefined,
          legalAddress: c.legalAddress ?? undefined,
          phone: c.phone ?? c.phones[0] ?? undefined,
          email: c.email ?? c.emails[0] ?? undefined,
        };
        if (c.onecId) {
          await client.updateCounterparty(c.onecId, payload);
        } else {
          const r = await client.createCounterparty(payload);
          await prisma.contact.update({ where: { id: c.id }, data: { onecId: r.id } });
        }
        stats.contacts.pushed++;
      } catch (e: any) {
        stats.contacts.errors++;
        console.error('[1c] counterparty push:', e.message);
      }
    }
  } catch (e: any) {
    stats.error = stats.error ? `${stats.error}; Контрагенты: ${e.message}` : `Контрагенты: ${e.message}`;
  }

  stats.finishedAt = new Date().toISOString();
  await prisma.oneCPluginSettings.update({
    where: { id: 1 },
    data: { lastSyncAt: new Date(), lastSyncResult: stats as any },
  });
  return stats;
}
