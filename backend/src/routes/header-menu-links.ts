import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';

const router = Router();

// Меню в шапке публичных страниц (Настройки → Системные → Шапка): новости, каталог, файлы.
// Per-tenant, как и menu_links. Дефолты дублируются на фронте (PublicNavMenu.tsx).
export const HEADER_MENU_DEFAULTS = [
  { key: 'news', title: 'Новости', url: 'https://welans.ru/news' },
  { key: 'catalog', title: 'Каталог', url: 'https://welans.cc/shop' },
  { key: 'files', title: 'Файлы', url: 'https://welans.click' },
] as const;

const KEY_RE = /^[a-z0-9][a-z0-9-_]{0,49}$/;

const adminOnly = (req: AuthRequest, res: any, next: any) => {
  if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Требуются права администратора' });
  next();
};

// Публичный GET: шапки публичных страниц неавторизованы. Сохранённые пункты поверх дефолтов
router.get('/', async (_req, res) => {
  try {
    const rows = await prisma.headerMenuLink.findMany();
    const byKey = new Map(rows.map(r => [r.key, r]));
    const items: { key: string; title: string; url: string; isActive: boolean; sortOrder: number }[] = HEADER_MENU_DEFAULTS.map((d, i) => {
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
      if (!HEADER_MENU_DEFAULTS.some(d => d.key === r.key)) {
        items.push({ key: r.key, title: r.title || r.key, url: r.url, isActive: r.isActive, sortOrder: r.sortOrder });
      }
    }
    items.sort((a, b) => a.sortOrder - b.sortOrder);
    res.json(items);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Сохранение списка целиком (только админ)
router.put('/', authMiddleware, adminOnly, async (req: AuthRequest, res) => {
  try {
    const items = Array.isArray(req.body) ? req.body : (req.body?.items ?? []);
    const valid = items.filter((i: any) => i && KEY_RE.test(String(i.key)) && typeof i.url === 'string' && String(i.url).trim());
    const keys = valid.map((i: any) => String(i.key));
    await prisma.$transaction([
      prisma.headerMenuLink.deleteMany({ where: { key: { notIn: keys } } }),
      ...valid.map((i: any) => prisma.headerMenuLink.upsert({
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
