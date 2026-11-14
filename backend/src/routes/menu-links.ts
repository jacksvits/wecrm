import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';

const router = Router();

// Ссылки кнопок меню в футере страницы входа (настраиваются в Настройки → Системные → Меню).
// Дефолты дублируются на фронте (Login.tsx) — пока админ ничего не сохранял, работают прежние ссылки.
export const MENU_LINK_DEFAULTS = [
  { key: 'presentation', label: 'Презентация', url: '/presentation' },
  { key: 'catalog', label: 'Каталог', url: 'https://welans.cc/shop' },
  { key: 'files', label: 'Файлы', url: 'https://welans.click' },
  { key: 'news', label: 'Новости', url: 'https://welans.ru/news' },
  { key: 'about', label: 'О компании', url: 'https://welans.cc/welans/' },
] as const;

const adminOnly = (req: AuthRequest, res: any, next: any) => {
  if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Требуются права администратора' });
  next();
};

// Публичный GET: страница входа неавторизована. Отдаём сохранённые ссылки поверх дефолтов.
router.get('/', async (_req, res) => {
  try {
    const rows = await prisma.menuLink.findMany();
    const merged = MENU_LINK_DEFAULTS.map(d => ({ ...d, url: rows.find(r => r.key === d.key)?.url ?? d.url }));
    res.json(merged);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Сохранение набора ссылок (только админ)
router.put('/', authMiddleware, adminOnly, async (req: AuthRequest, res) => {
  try {
    const items = Array.isArray(req.body) ? req.body : (req.body?.items ?? []);
    const valid = items.filter((i: any) => MENU_LINK_DEFAULTS.some(d => d.key === i?.key) && typeof i.url === 'string');
    await prisma.$transaction(valid.map((i: any) => prisma.menuLink.upsert({
      where: { key: i.key },
      update: { url: i.url },
      create: { key: i.key, url: i.url },
    })));
    res.json({ ok: true, saved: valid.length });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

export default router;
