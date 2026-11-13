import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';

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

function parseTable(data: any): { headers: string[]; rows: any[][] } {
  const query = data?.query ?? {};
  const ids: string[] = query.ids ?? [];
  const metrics: string[] = query.metrics ?? [];
  const dimensions: string[] = query.dimensions ?? [];
  const headers = [...dimensions, ...metrics].map((h) => h.replace(/^ym:[sd]:/, ''));
  const rows: any[][] = [];
  for (const item of data?.data ?? []) {
    const dims: any[] = (item.dimensions ?? []).map((d: any) =>
      typeof d === 'object' && d !== null ? d?.name ?? d?.id ?? String(d) : d
    );
    // В данных id счётчика возвращается просто числом — подставляем имя из запроса
    for (let i = 0; i < dims.length; i++) {
      if (dimensions[i] === 'ym:s:counterID' && ids.length === 1) dims[i] = ids[0];
    }
    // metrics — массив массивов, но при одной метрике может прийти [значение]
    const m0 = item.metrics?.[0];
    const vals: any[] = Array.isArray(m0) ? m0 : m0 !== undefined && m0 !== null ? [m0] : [];
    rows.push([...dims, ...vals]);
  }
  return { headers, rows };
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
    const visits = data?.totals?.[0]?.[0] ?? 0;
    res.json({ ok: true, counterId: firstCounter, visitsToday: visits });
  } catch (err: any) {
    console.error('[yandex-metrika] status error:', err.message);
    res.status(err.status ?? 502).json({ error: err.message });
  }
});

// ---------- Статистика для виджетов директора ----------

// GET /api/yandex-metrika/summary — сводка: KPI, динамика по дням, источники, возраст, география
router.get('/summary', async (_req, res) => {
  try {
    const s = await prisma.yandexMetrikaSettings.findUnique({ where: { id: 1 } });
    if (!s?.isActive || !s.token || !s.counterId) {
      return res.status(400).json({ error: 'Плагин «Яндекс Метрика» не подключён' });
    }
    const ids = s.counterId.trim();
    const counters = ids.split(',').map((c) => c.trim()).filter(Boolean);
    const cacheKey = `summary:${ids}`;
    const cached = getCached(cacheKey);
    if (cached) return res.json(cached);

    // 1. KPI за 30 дней + предыдущие 30 дней (дельта)
    const kpi = await metrikaRequest(s.token, {
      ids,
      metrics: 'ym:s:visits,ym:s:pageviews,ym:s:users',
      date1: '30daysAgo',
      date2: 'today',
    });
    const kpiPrev = await metrikaRequest(s.token, {
      ids,
      metrics: 'ym:s:visits,ym:s:pageviews,ym:s:users',
      date1: '60daysAgo',
      date2: '31daysAgo',
    });
    const num = (v: any) => Number(v ?? 0) || 0;
    const m = (d: any, i: number) => num(d?.totals?.[0]?.[i]);
    const summary = {
      visits: m(kpi, 0),
      pageviews: m(kpi, 1),
      users: m(kpi, 2),
      visitsPrev: m(kpiPrev, 0),
      pageviewsPrev: m(kpiPrev, 1),
      usersPrev: m(kpiPrev, 2),
    };

    // 2. Динамика по дням (визиты/просмотры/посетители)
    const dailyData = await metrikaRequest(s.token, {
      ids,
      metrics: 'ym:s:visits,ym:s:pageviews,ym:s:users',
      dimensions: 'ym:s:date',
      date1: '30daysAgo',
      date2: 'today',
      sort: 'ym:s:date',
      limit: 100,
    });
    const dailyTable = parseTable(dailyData);
    const daily = dailyTable.rows.map((r) => ({
      date: String(r[0] ?? ''),
      visits: num(r[1]),
      pageviews: num(r[2]),
      users: num(r[3]),
    }));

    // 3. По доменам/счётчикам (если счётчиков несколько)
    let perCounter: { name: string; visits: number }[] = [];
    if (counters.length > 1) {
      const perData = await metrikaRequest(s.token, {
        ids,
        metrics: 'ym:s:visits',
        dimensions: 'ym:s:counterID',
        date1: '30daysAgo',
        date2: 'today',
        sort: '-ym:s:visits',
        limit: 20,
      });
      perCounter = parseTable(perData).rows.map((r) => ({ name: String(r[0] ?? ''), visits: num(r[1]) }));
    }

    // 4. Источники трафика
    const srcData = await metrikaRequest(s.token, {
      ids,
      metrics: 'ym:s:visits',
      dimensions: 'ym:s:lastTrafficSource',
      date1: '30daysAgo',
      date2: 'today',
      sort: '-ym:s:visits',
      limit: 10,
    });
    const sources = parseTable(srcData).rows.map((r) => ({ name: String(r[0] ?? '—'), visits: num(r[1]) }));

    // 5. Возраст аудитории
    const ageData = await metrikaRequest(s.token, {
      ids,
      metrics: 'ym:s:visits',
      dimensions: 'ym:s:ageInterval',
      date1: '30daysAgo',
      date2: 'today',
      limit: 10,
    });
    const ageRows = parseTable(ageData).rows;
    const ageOrder = ['under 18', '18-24', '25-34', '35-44', '45-54', '55-64', 'over 64'];
    const ageLabels: Record<string, string> = {
      'under 18': '<18', '18-24': '18–24', '25-34': '25–34', '35-44': '35–44',
      '45-54': '45–54', '55-64': '55–64', 'over 64': '65+',
    };
    const ages = ageRows
      .map((r) => ({ label: ageLabels[String(r[0])] ?? String(r[0]), sort: ageOrder.indexOf(String(r[0])), visits: num(r[1]) }))
      .filter((a) => a.sort >= 0)
      .sort((a, b) => a.sort - b.sort)
      .map(({ label, visits }) => ({ label, visits }));

    // 6. География (страны)
    const geoData = await metrikaRequest(s.token, {
      ids,
      metrics: 'ym:s:visits',
      dimensions: 'ym:s:country',
      date1: '30daysAgo',
      date2: 'today',
      sort: '-ym:s:visits',
      limit: 10,
    });
    const geo = parseTable(geoData).rows.map((r) => ({ name: String(r[0] ?? '—'), visits: num(r[1]) }));

    const result = { summary, daily, perCounter, sources, ages, geo, fetchedAt: new Date().toISOString() };
    setCached(cacheKey, result);
    res.json(result);
  } catch (err: any) {
    console.error('[yandex-metrika] summary error:', err.message);
    res.status(err.status ?? 502).json({ error: err.message });
  }
});

export default router;
