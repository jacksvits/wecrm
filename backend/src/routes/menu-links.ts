import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';

const router = Router();

// Ссылки кнопок меню в футере страницы входа (Настройки → Системные → Авторизация).
// Дефолты дублируются на фронте (Login.tsx) — пока админ ничего не сохранял, работают прежние ссылки.
export const MENU_LINK_DEFAULTS = [
  { key: 'presentation', title: 'Презентация', url: '/presentation' },
  { key: 'tariffs', title: 'Тарифы', url: '/tariffs' },
  { key: 'catalog', title: 'Каталог', url: 'https://welans.cc/shop' },
  { key: 'files', title: 'Файлы', url: 'https://welans.click' },
  { key: 'news', title: 'Новости', url: 'https://welans.ru/news' },
  { key: 'about', title: 'О компании', url: 'https://welans.cc/welans/' },
] as const;

// Ключ произвольного добавленного пункта: латиница/цифры/дефис/подчёркивание
const KEY_RE = /^[a-z0-9][a-z0-9-_]{0,49}$/;

const adminOnly = (req: AuthRequest, res: any, next: any) => {
  if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Требуются права администратора' });
  next();
};

// Публичный GET: страница входа неавторизована. Отдаём сохранённые пункты поверх дефолтов:
// у дефолтных ключей меняются название/адрес/активность/порядок, плюс произвольные добавленные пункты.
router.get('/', async (_req, res) => {
  try {
    const rows = await prisma.menuLink.findMany();
    const byKey = new Map(rows.map(r => [r.key, r]));
    const items: { key: string; title: string; url: string; isActive: boolean; sortOrder: number }[] = MENU_LINK_DEFAULTS.map((d, i) => {
      const r = byKey.get(d.key);
      return {
        key: d.key,
        title: r?.title || d.title,
        url: r?.url ?? d.url,
        isActive: r?.isActive ?? true,
        sortOrder: r?.sortOrder ?? i,
      };
    });
    for (const r of rows) {
      if (!MENU_LINK_DEFAULTS.some(d => d.key === r.key)) {
        items.push({ key: r.key, title: r.title || r.key, url: r.url, isActive: r.isActive, sortOrder: r.sortOrder });
      }
    }
    items.sort((a, b) => a.sortOrder - b.sortOrder);
    res.json(items);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Сохранение списка целиком (только админ): upsert по key, отсутствующие в списке удаляются
router.put('/', authMiddleware, adminOnly, async (req: AuthRequest, res) => {
  try {
    const items = Array.isArray(req.body) ? req.body : (req.body?.items ?? []);
    const valid = items.filter((i: any) => i && KEY_RE.test(String(i.key)) && typeof i.url === 'string' && String(i.url).trim());
    const keys = valid.map((i: any) => String(i.key));
    await prisma.$transaction([
      prisma.menuLink.deleteMany({ where: { key: { notIn: keys } } }),
      ...valid.map((i: any) => prisma.menuLink.upsert({
        where: { key: String(i.key) },
        update: {
          title: String(i.title ?? ''),
          url: String(i.url).trim(),
          isActive: i.isActive !== false,
          sortOrder: Number(i.sortOrder) || 0,
        },
        create: {
          key: String(i.key),
          title: String(i.title ?? ''),
          url: String(i.url).trim(),
          isActive: i.isActive !== false,
          sortOrder: Number(i.sortOrder) || 0,
        },
      })),
    ]);
    res.json({ ok: true, saved: valid.length });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

export default router;
