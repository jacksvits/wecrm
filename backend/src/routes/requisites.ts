import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';

const router = Router();

const adminOnly = (req: AuthRequest, res: any, next: any) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Требуются права администратора' });
  }
  next();
};

// Поля реквизитов, возвращаемые/принимаемые эндпоинтами
const FIELDS = [
  'fullName', 'inn', 'ogrn', 'bankName', 'bik', 'account', 'corrAccount', 'legalAddress', 'actualAddress',
] as const;

function toPlain(row: any) {
  const out: Record<string, string> = {};
  for (const f of FIELDS) out[f] = row?.[f] || '';
  return out;
}

// Все авторизованные пользователи могут читать реквизиты (нужны для документов)
router.get('/', authMiddleware, async (_req, res) => {
  const row = await prisma.organizationRequisites.findFirst();
  res.json(toPlain(row));
});

const requisitesSchema = z.object({
  fullName: z.string().max(500).optional(),
  inn: z.string().max(20).optional(),
  ogrn: z.string().max(20).optional(),
  bankName: z.string().max(300).optional(),
  bik: z.string().max(20).optional(),
  account: z.string().max(30).optional(),
  corrAccount: z.string().max(30).optional(),
  legalAddress: z.string().max(500).optional(),
  actualAddress: z.string().max(500).optional(),
});

router.put('/', authMiddleware, adminOnly, async (req, res) => {
  try {
    const data = requisitesSchema.parse(req.body);
    const payload: Record<string, string> = {};
    for (const f of FIELDS) payload[f] = data[f as keyof typeof data] ?? '';
    const existing = await prisma.organizationRequisites.findFirst();
    const row = existing
      ? await prisma.organizationRequisites.update({ where: { id: existing.id }, data: payload })
      : await prisma.organizationRequisites.create({ data: payload });
    res.json(toPlain(row));
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// === Подстановка по ИНН: открытый поиск ФНС (pb.nalog.ru) ===
// Банковские реквизиты в открытых данных не публикуются — заполняются вручную.

interface InnLookupResult {
  fullName?: string;
  inn?: string;
  ogrn?: string;
  kpp?: string;
  legalAddress?: string;
  management?: string;
}

// Запасной источник: официальный сервис ФНС egrul.nalog.ru.
// Возвращает наименование, ОГРН и КПП; адрес в выдаче отсутствует.
async function lookupInnEgrul(inn: string, signal: AbortSignal): Promise<InnLookupResult> {
  const search = await fetch('https://egrul.nalog.ru/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ query: inn }).toString(),
    signal,
  });
  if (!search.ok) throw new Error(`Сервис ФНС ответил ${search.status}`);
  const searchJson: any = await search.json();
  const token = searchJson?.t;
  if (!token || searchJson?.captchaRequired) throw new Error('Организация с таким ИНН не найдена');

  const res = await fetch(`https://egrul.nalog.ru/search-result/${encodeURIComponent(token)}`, { signal });
  if (!res.ok) throw new Error(`Сервис ФНС ответил ${res.status}`);
  const resJson: any = await res.json();
  const row = resJson?.rows?.[0];
  if (!row) throw new Error('Организация с таким ИНН не найдена');
  return {
    fullName: row.n || row.c || undefined,
    inn: row.i || inn,
    ogrn: row.o || undefined,
    kpp: row.p || undefined,
  };
}

async function lookupInnPb(inn: string, signal: AbortSignal): Promise<InnLookupResult> {
  // Шаг 1: поиск по ИНН → токен записи
  {
    const search = await fetch('https://pb.nalog.ru/search-proc.json', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8', 'X-Requested-With': 'XMLHttpRequest' },
      body: new URLSearchParams({
        query: inn,
        region: '',
        page: '1',
        r: String(Math.random()),
      }).toString(),
      signal,
    });
    if (!search.ok) throw new Error(`Сервис ФНС ответил ${search.status}`);
    const searchJson: any = await search.json();
    const token = searchJson?.t?.[0]?.c;
    if (!token) throw new Error('Организация с таким ИНН не найдена');

    // Шаг 2: краткая карточка организации
    const card = await fetch(`https://pb.nalog.ru/company-proc.json?id=${encodeURIComponent(token)}&r=&_=${Date.now()}`, {
      headers: { 'X-Requested-With': 'XMLHttpRequest' },
      signal,
    });
    if (!card.ok) throw new Error(`Сервис ФНС ответил ${card.status}`);
    const cardJson: any = await card.json();
    const row = cardJson?.rows?.[0];
    if (!row) throw new Error('Организация с таким ИНН не найдена');

    const result: InnLookupResult = {
      fullName: row.n || undefined,
      inn: row.i || inn,
      ogrn: row.g || undefined,
      kpp: row.k || undefined,
    };

    // Шаг 3: расширенная карточка — полное наименование и адрес
    try {
      const details = await fetch(`https://pb.nalog.ru/details-proc.json?id=${encodeURIComponent(row.c || token)}&r=${encodeURIComponent(row.r || '')}&_=${Date.now()}`, {
        headers: { 'X-Requested-With': 'XMLHttpRequest' },
        signal,
      });
      if (details.ok) {
        const d: any = await details.json();
        const info = d?.companyInfo || d?.ipInfo || d?.flInfo || {};
        if (info.fullName) result.fullName = info.fullName;
        if (!result.fullName && info.name) result.fullName = info.name;
        if (info.ogrn && !result.ogrn) result.ogrn = info.ogrn;
        if (info.inn && !result.inn) result.inn = info.inn;
        if (info.kpp && !result.kpp) result.kpp = info.kpp;
        const addr = info.address || info.legalAddress || info.adr || info.regAddress;
        if (addr) result.legalAddress = typeof addr === 'string' ? addr : (addr.value || addr.address || '');
        if (info.head?.fio) result.management = info.head.fio;
      }
    } catch {
      // Детальная карточка недоступна — возвращаем то, что есть из краткой
    }
    return result;
  }
}

// === Подстановка банка по БИК: справочник ЦБ РФ (cbr.ru, кэш 24 ч) ===
// Справочник БИК ЦБ содержит наименование и ИНН банка; корсчёт в нём отсутствует.
let bicCache: { xml: string; at: number } | null = null;

async function lookupBik(bik: string): Promise<{ bankName?: string; bankInn?: string }> {
  if (!bicCache || Date.now() - bicCache.at > 24 * 60 * 60 * 1000) {
    const res = await fetch('https://www.cbr.ru/scripts/XML_bic.asp');
    if (!res.ok) throw new Error(`Справочник ЦБ недоступен (${res.status})`);
    const buf = Buffer.from(await res.arrayBuffer());
    // Справочник отдаётся в windows-1251
    bicCache = { xml: new TextDecoder('windows-1251').decode(buf), at: Date.now() };
  }
  // Разбираем справочник по записям, ищем запись с точным совпадением БИК
  const records = bicCache.xml.match(/<Record[^>]*>[^]*?<\/Record>/g) || [];
  const rec = records.find((r) => r.includes(`<Bic>${bik}</Bic>`));
  if (!rec) throw new Error('Банк с таким БИК не найден');
  const name = rec.match(/<ShortName>([^<]*)<\/ShortName>/)?.[1]?.trim();
  const inn = rec.match(/<Inn>([^<]*)<\/Inn>/)?.[1]?.trim();
  if (!name) throw new Error('Банк с таким БИК не найден');
  return { bankName: name, bankInn: inn || undefined };
}

router.get('/bik-lookup', authMiddleware, adminOnly, async (req, res) => {
  try {
    const bik = String(req.query.bik || '').replace(/\D/g, '');
    if (bik.length !== 9) {
      return res.status(400).json({ error: 'БИК должен содержать 9 цифр' });
    }
    res.json(await lookupBik(bik));
  } catch (err: any) {
    res.status(502).json({ error: err.message || 'Не удалось получить данные из справочника ЦБ' });
  }
});

router.get('/inn-lookup', authMiddleware, adminOnly, async (req, res) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 25000);
  try {
    const inn = String(req.query.inn || '').replace(/\D/g, '');
    if (inn.length !== 10 && inn.length !== 12) {
      return res.status(400).json({ error: 'ИНН должен содержать 10 или 12 цифр' });
    }
    let lastError: any = null;
    // Основной источник — «Прозрачный бизнес» (pb.nalog.ru, с адресом), запасной — egrul.nalog.ru
    for (let attempt = 0; attempt < 2; attempt++) {
      try { res.json(await lookupInnPb(inn, controller.signal)); return; } catch (e) { lastError = e; }
    }
    try { res.json(await lookupInnEgrul(inn, controller.signal)); return; } catch (e) { lastError = e; }
    throw lastError;
  } catch (err: any) {
    res.status(502).json({ error: err.message || 'Не удалось получить данные из ФНС' });
  } finally {
    clearTimeout(timer);
  }
});

export default router;
