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
export async function runOneCSync(): Promise<OneCSyncStats> {
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
      for (const n of page.items) {
        try {
          const existing =
            (await prisma.product.findFirst({ where: { onecId: n.id } })) ||
            (n.sku ? await prisma.product.findFirst({ where: { sku: n.sku } }) : null) ||
            (n.barcode ? await prisma.product.findFirst({ where: { barcode: n.barcode } }) : null) ||
            (await prisma.product.findFirst({ where: { name: n.name } }));
          const data = {
            name: n.name,
            sku: n.sku ?? existing?.sku ?? null,
            barcode: n.barcode ?? existing?.barcode ?? null,
            unit: n.unit || existing?.unit || 'шт',
            kind: n.kind === 'service' ? 'service' : 'product',
            category: n.categoryPath?.[0] ?? existing?.category ?? null,
            subcategory: n.categoryPath && n.categoryPath.length > 1 ? n.categoryPath.slice(1).join(' / ') : (existing?.subcategory ?? null),
            description: n.description ?? existing?.description ?? null,
            isActive: n.isActive ?? true,
            onecId: n.id,
            onecSyncedAt: new Date(),
          };
          if (existing) await prisma.product.update({ where: { id: existing.id }, data });
          else await prisma.product.create({ data });
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
          const existing =
            (await prisma.contact.findFirst({ where: { onecId: c.id } })) ||
            (c.inn ? await prisma.contact.findFirst({ where: { inn: c.inn } }) : null) ||
            (await prisma.contact.findFirst({ where: { name: c.name, phone: c.phone ?? undefined } }));
          const data = {
            name: c.name,
            kind: c.kind === 'contact' ? 'contact' : 'organization',
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
