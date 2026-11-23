import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import { tenantKey } from '../lib/tenant.js';

/**
 * Плагин «Яндекс Метрика».
 * Настройки: counter_id (номер счётчика, можно несколько через запятую),
 * OAuth-токен (права metrika:read), флаг активности.
 * Фронт получает статистику через прокси-эндпоинты CRM —
 * токен наружу не светится и нет CORS.
 * Reporting API v1: https://api-metrika.yandex.net/stat/v1/data
 */

const router = Router();
router.use(authMiddleware);

const API = 'https://api-metrika.yandex.net/stat/v1/data';
const CACHE_TTL_MS = 5 * 60 * 1000;
const cache = new Map<string, { at: number; data: any }>();

function getCached(key: string) {
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < CACHE_TTL_MS) return hit.data;
  cache.delete(key);
  return null;
}

function setCached(key: string, data: any) {
  cache.set(key, { at: Date.now(), data });
}

async function metrikaRequest(token: string, params: Record<string, string | number>) {
  const url = new URL(API);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, String(v)));
  const res = await fetch(url.toString(), {
    headers: { Authorization: `OAuth ${token}` },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    const err: any = new Error(`Яндекс Метрика API: HTTP ${res.status}${body ? ` — ${body.slice(0, 300)}` : ''}`);
    err.status = res.status === 403 ? 403 : 502;
    throw err;
  }
  return res.json() as Promise<any>;
}

// Русские подписи типов источников трафика (API возвращает на английском)
const SOURCE_RU: Record<string, string> = {
  'Direct traffic': 'Прямые заходы',
  'Search engine traffic': 'Поисковые системы',
  'Link traffic': 'Переходы по ссылкам',
  'Referral traffic': 'Переходы по ссылкам',
  'Internal traffic': 'Внутренние переходы',
  'Social network traffic': 'Переходы из соцсетей',
  'Ad traffic': 'Рекламный трафик',
  'Messenger traffic': 'Переходы из мессенджеров',
  'Email traffic': 'Переходы из писем',
  'Undefined': 'Не определено',
};

function sourceName(name: string): string {
  return SOURCE_RU[name] ?? name;
}

function parseTable(data: any): { headers: string[]; rows: any[][] } {
  const query = data?.query ?? {};
  const ids: string[] = query.ids ?? [];
  const metrics: string[] = query.metrics ?? [];
  const dimensions: string[] = query.dimensions ?? [];
  const headers = [...dimensions, ...metrics].map((h) => h.replace(/^ym:[sd]:/, ''));
  const rows: any[][] = [];
  for (const item of data?.data ?? []) {
    const dims: any[] = (item.dimensions ?? []).map((d: any, index: number) => {
      if (d && typeof d === 'object') {
        // Для этих справочников name локализован ('PC', 'New users'), а id стабилен.
        if (['ym:s:deviceCategory', 'ym:s:isNewUser'].includes(dimensions[index])) return d?.id ?? d?.name ?? 'other';
        return d?.name ?? d?.id ?? 'Прочие';
      }
      return d ?? 'Прочие';
    });
    // В данных id счётчика возвращается просто числом — подставляем имя из запроса
    for (let i = 0; i < dims.length; i++) {
      if (dimensions[i] === 'ym:s:counterID' && ids.length === 1) dims[i] = ids[0];
    }
    // metrics у строки — плоский массив чисел (по одному на каждую метрику)
    const vals: any[] = Array.isArray(item.metrics) ? item.metrics : [];
    rows.push([...dims, ...vals]);
  }
  return { headers, rows };
}

// Итоговая строка запроса без измерений — data[0] (dimensions пустой)
function totalsRow(data: any): number[] {
  const row = (data?.data ?? []).find((item: any) => (item?.dimensions ?? []).length === 0) ?? data?.data?.[0];
  return Array.isArray(row?.metrics) ? row.metrics : [];
}

// ---------- Настройки ----------

// GET /api/yandex-metrika/settings — настройки плагина (токен не возвращается)
router.get('/settings', async (_req, res) => {
  try {
    const s = await prisma.yandexMetrikaSettings.findUnique({ where: { id: 1 } });
    res.json({
      counterId: s?.counterId ?? '',
      hasToken: !!s?.token,
      isActive: s?.isActive ?? false,
    });
  } catch (err: any) {
    console.error('[yandex-metrika] GET settings error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/yandex-metrika/settings — сохранение настроек (только админ)
router.post('/settings', async (req: AuthRequest, res) => {
  try {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Только администратор' });
    }
    const { counterId, token, isActive } = req.body || {};
    if (typeof isActive !== 'boolean') {
      return res.status(400).json({ error: 'isActive обязателен' });
    }
    if (counterId !== undefined && typeof counterId !== 'string') {
      return res.status(400).json({ error: 'Некорректный номер счётчика' });
    }
    if (token !== undefined && typeof token !== 'string') {
      return res.status(400).json({ error: 'Некорректный токен' });
    }
    const existing = await prisma.yandexMetrikaSettings.findUnique({ where: { id: 1 } });
    const data = {
      counterId: (counterId ?? existing?.counterId ?? '').trim(),
      token: token !== undefined && token !== '' ? token.trim() : (existing?.token ?? ''),
      isActive,
      updatedAt: new Date(),
    };
    await prisma.yandexMetrikaSettings.upsert({
      where: { id: 1 },
      create: { id: 1, ...data },
      update: data,
    });
    cache.clear();
    console.log(`[yandex-metrika] saved: counters=${data.counterId}, isActive=${isActive}`);
    res.json({ counterId: data.counterId, hasToken: !!data.token, isActive: data.isActive });
  } catch (err: any) {
    console.error('[yandex-metrika] POST settings error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/yandex-metrika/status — проверка подключения (используется при сохранении настроек)
router.get('/status', async (_req, res) => {
  try {
    const s = await prisma.yandexMetrikaSettings.findUnique({ where: { id: 1 } });
    if (!s?.isActive || !s.token || !s.counterId) {
      return res.status(400).json({ error: 'Плагин не настроен' });
    }
    const firstCounter = s.counterId.split(',')[0].trim();
    const data = await metrikaRequest(s.token, {
      ids: firstCounter,
      metrics: 'ym:s:visits',
      date1: 'today',
      date2: 'today',
    });
    const visits = totalsRow(data)[0] ?? 0;
    res.json({ ok: true, counterId: firstCounter, visitsToday: visits });
  } catch (err: any) {
    console.error('[yandex-metrika] status error:', err.message);
    res.status(err.status ?? 502).json({ error: err.message });
  }
});

// ---------- Статистика для виджетов директора ----------

const summaryPending = new Map<string, Promise<any>>();

function isoDay(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function shiftDay(value: string, days: number): string {
  const d = new Date(`${value}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return isoDay(d);
}

function daysInclusive(date1: string, date2: string): number {
  return Math.round((new Date(`${date2}T00:00:00Z`).getTime() - new Date(`${date1}T00:00:00Z`).getTime()) / 86400000) + 1;
}

function validIsoDay(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && isoDay(parsed) === value;
}

// Несколько запросов выполняются параллельно, но без превышения лимитов API.
async function mapLimit<T>(jobs: Array<() => Promise<T>>, limit = 4): Promise<T[]> {
  const results = new Array<T>(jobs.length);
  let next = 0;
  await Promise.all(Array.from({ length: Math.min(limit, jobs.length) }, async () => {
    while (next < jobs.length) {
      const index = next++;
      results[index] = await jobs[index]();
    }
  }));
  return results;
}

function optionalReport(report: Promise<any>, name: string): Promise<any> {
  return report.catch((err) => {
    console.warn(`[yandex-metrika] optional report ${name}:`, err.message);
    return null;
  });
}

// GET /api/yandex-metrika/summary?date1=YYYY-MM-DD&date2=YYYY-MM-DD&counter=...&refresh=1
// Единая сводка для всех виджетов: выбранный период, предыдущий период и фильтр счётчика.
router.get('/summary', async (req, res) => {
  try {
    const s = await prisma.yandexMetrikaSettings.findUnique({ where: { id: 1 } });
    if (!s?.isActive || !s.token || !s.counterId) {
      return res.status(400).json({ error: 'Плагин «Яндекс Метрика» не подключён' });
    }

    const today = isoDay(new Date());
    const date2 = validIsoDay(req.query.date2) ? req.query.date2 : today;
    const date1 = validIsoDay(req.query.date1) ? req.query.date1 : shiftDay(date2, -29);
    if (date1 > date2) return res.status(400).json({ error: 'Начало периода позже его окончания' });
    const days = daysInclusive(date1, date2);
    if (days < 1) return res.status(400).json({ error: 'Некорректный диапазон дат' });
    if (days > 366) return res.status(400).json({ error: 'Максимальный период — 366 дней' });

    const counters = s.counterId.split(',').map((c) => c.trim()).filter(Boolean);
    const requestedCounter = String(req.query.counter || '').trim();
    if (requestedCounter && !counters.includes(requestedCounter)) {
      return res.status(400).json({ error: 'Неизвестный счётчик' });
    }
    const ids = requestedCounter || counters.join(',');
    const prevDate2 = shiftDay(date1, -1);
    const prevDate1 = shiftDay(prevDate2, -(days - 1));
    const cacheKey = `summary:${tenantKey()}:${requestedCounter || 'all'}:${ids}:${date1}:${date2}`;
    const refresh = req.query.refresh === '1';
    if (!refresh) {
      const cached = getCached(cacheKey);
      if (cached) return res.json(cached);
      const running = summaryPending.get(cacheKey);
      if (running) return res.json(await running);
    }

    const build = async () => {
      const num = (v: any) => Number(v ?? 0) || 0;
      const base = { ids, date1, date2 };
      const kpiMetrics = 'ym:s:visits,ym:s:pageviews,ym:s:users,ym:s:avgVisitDuration,ym:s:pageDepth,ym:s:bounceRate';

      const [
        kpi, kpiPrev, dailyData, perData, srcData, ageData, geoData, citiesData,
        srcDailyData, pagesData, titlesData, devicesData, newVisitorsData, landingData,
      ] = await mapLimit([
        () => metrikaRequest(s.token, { ...base, metrics: kpiMetrics }),
        () => metrikaRequest(s.token, { ids, metrics: kpiMetrics, date1: prevDate1, date2: prevDate2 }),
        () => metrikaRequest(s.token, { ...base, metrics: kpiMetrics, dimensions: 'ym:s:date', sort: 'ym:s:date', limit: 400 }),
        () => counters.length > 1
          ? metrikaRequest(s.token, { ...base, metrics: 'ym:s:visits', dimensions: 'ym:s:counterID', sort: '-ym:s:visits', limit: 20 })
          : Promise.resolve(null),
        () => metrikaRequest(s.token, { ...base, metrics: 'ym:s:visits', dimensions: 'ym:s:lastTrafficSource', sort: '-ym:s:visits', limit: 20 }),
        () => metrikaRequest(s.token, { ...base, metrics: 'ym:s:visits', dimensions: 'ym:s:ageInterval', limit: 10 }),
        () => metrikaRequest(s.token, { ...base, metrics: 'ym:s:visits', dimensions: 'ym:s:regionCountry', sort: '-ym:s:visits', limit: 50 }),
        () => optionalReport(metrikaRequest(s.token, { ...base, metrics: 'ym:s:visits', dimensions: 'ym:s:regionCity', sort: '-ym:s:visits', limit: 50 }), 'cities'),
        () => metrikaRequest(s.token, { ...base, metrics: 'ym:s:visits', dimensions: 'ym:s:date,ym:s:lastTrafficSource', sort: 'ym:s:date', limit: 10000 }),
        () => metrikaRequest(s.token, { ...base, metrics: 'ym:pv:pageviews', dimensions: 'ym:pv:URL', sort: '-ym:pv:pageviews', limit: 50 }),
        () => metrikaRequest(s.token, { ...base, metrics: 'ym:pv:pageviews', dimensions: 'ym:pv:title', sort: '-ym:pv:pageviews', limit: 50 }),
        () => optionalReport(metrikaRequest(s.token, { ...base, metrics: 'ym:s:visits', dimensions: 'ym:s:deviceCategory', sort: '-ym:s:visits', limit: 10 }), 'devices'),
        () => optionalReport(metrikaRequest(s.token, { ...base, metrics: 'ym:s:visits', dimensions: 'ym:s:isNewUser', sort: '-ym:s:visits', limit: 10 }), 'new-visitors'),
        () => optionalReport(metrikaRequest(s.token, { ...base, metrics: 'ym:s:visits', dimensions: 'ym:s:startURL', sort: '-ym:s:visits', limit: 50 }), 'landing-pages'),
      ], 4);

      const m = (d: any, i: number) => num(totalsRow(d)[i]);
      const summary = {
        visits: m(kpi, 0), pageviews: m(kpi, 1), users: m(kpi, 2),
        avgSessionDuration: m(kpi, 3), pageDepth: m(kpi, 4), bounceRate: m(kpi, 5),
        visitsPrev: m(kpiPrev, 0), pageviewsPrev: m(kpiPrev, 1), usersPrev: m(kpiPrev, 2),
        avgSessionDurationPrev: m(kpiPrev, 3), pageDepthPrev: m(kpiPrev, 4), bounceRatePrev: m(kpiPrev, 5),
      };
      const daily = parseTable(dailyData).rows.map((r) => ({
        date: String(r[0] ?? ''), visits: num(r[1]), pageviews: num(r[2]), users: num(r[3]),
        avgSessionDuration: num(r[4]), pageDepth: num(r[5]), bounceRate: num(r[6]),
      }));
      const perCounter = parseTable(perData).rows.map((r) => ({ name: String(r[0] ?? ''), visits: num(r[1]) }));
      const sources = parseTable(srcData).rows.map((r) => ({ name: sourceName(String(r[0] ?? '—')), visits: num(r[1]) }));

      const ageOrder = ['under 18', '18-24', '25-34', '35-44', '45-54', '55-64', 'over 64'];
      const ageLabels: Record<string, string> = {
        'under 18': '<18', '18-24': '18–24', '25-34': '25–34', '35-44': '35–44',
        '45-54': '45–54', '55-64': '55–64', 'over 64': '65+',
      };
      const ages = parseTable(ageData).rows
        .map((r) => ({ label: ageLabels[String(r[0])] ?? String(r[0]), sort: ageOrder.indexOf(String(r[0])), visits: num(r[1]) }))
        .filter((a) => a.sort >= 0).sort((a, b) => a.sort - b.sort)
        .map(({ label, visits }) => ({ label, visits }));

      const geo = parseTable(geoData).rows.map((r) => ({ name: String(r[0] ?? '—'), visits: num(r[1]) }));
      const cities = parseTable(citiesData).rows.map((r) => ({ name: String(r[0] ?? '—'), visits: num(r[1]) }));

      const srcRows = parseTable(srcDailyData).rows;
      const srcTotals = new Map<string, number>();
      for (const r of srcRows) {
        const name = sourceName(String(r[1] ?? '—'));
        srcTotals.set(name, (srcTotals.get(name) ?? 0) + num(r[2]));
      }
      const topSources = [...srcTotals.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10).map((e) => e[0]);
      const srcDates = [...new Set(srcRows.map((r) => String(r[0])))].sort();
      const srcIndex = new Map(topSources.map((name, i) => [name, i]));
      const dateIndex = new Map(srcDates.map((d, i) => [d, i]));
      const matrix = topSources.map(() => srcDates.map(() => 0));
      for (const r of srcRows) {
        const si = srcIndex.get(sourceName(String(r[1] ?? '—')));
        const di = dateIndex.get(String(r[0]));
        if (si === undefined || di === undefined) continue;
        matrix[si][di] = num(r[2]);
      }
      const sourcesDaily = { dates: srcDates, series: topSources.map((name, i) => ({ name, values: matrix[i] })) };

      const pages = parseTable(pagesData).rows.map((r) => ({ url: String(r[0] ?? '—'), views: num(r[1]) }));
      const titles = parseTable(titlesData).rows.map((r) => ({ title: String(r[0] ?? '—'), views: num(r[1]) }));
      const deviceNames: Record<string, string> = { desktop: 'Компьютеры', mobile: 'Смартфоны', tablet: 'Планшеты', tv: 'Телевизоры', other: 'Другие' };
      const devices = parseTable(devicesData).rows.map((r) => {
        const raw = String(r[0] ?? 'other');
        return { name: deviceNames[raw.toLowerCase()] ?? raw, visits: num(r[1]) };
      });
      const newVisitors = parseTable(newVisitorsData).rows.map((r) => {
        const raw = String(r[0] ?? '').toLowerCase();
        const isNew = /^(yes|true|1|нов)/.test(raw);
        const isReturning = /^(no|false|0|верн)/.test(raw);
        return { key: isNew ? 'new' : isReturning ? 'returning' : 'unknown', name: isNew ? 'Новые' : isReturning ? 'Вернувшиеся' : String(r[0] ?? 'Не определено'), visits: num(r[1]) };
      });
      const landingPages = parseTable(landingData).rows.map((r) => ({ url: String(r[0] ?? '—'), visits: num(r[1]) }));

      return {
        summary, daily, perCounter, sources, ages, geo, cities, sourcesDaily, pages, titles,
        devices, newVisitors, landingPages, counters, selectedCounter: requestedCounter || 'all',
        period: { date1, date2, days, prevDate1, prevDate2 },
        fetchedAt: new Date().toISOString(),
      };
    };

    const running = build();
    summaryPending.set(cacheKey, running);
    try {
      const result = await running;
      setCached(cacheKey, result);
      res.json(result);
    } finally {
      summaryPending.delete(cacheKey);
    }
  } catch (err: any) {
    console.error('[yandex-metrika] summary error:', err.message);
    res.status(err.status ?? 502).json({ error: err.message });
  }
});

export default router;
