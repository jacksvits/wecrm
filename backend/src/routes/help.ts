/**
 * Справочный центр платформы:
 *  - GET /articles — чтение всеми авторизованными пользователями (любой домен);
 *  - запись (создание/правка/удаление/сброс) — только главный администратор платформы.
 * Хранение — платформенная БД (platformPrisma), справка едина для всех тенантов.
 * При первом запросе пустая таблица наполняется дефолтным контентом.
 */
import { Router } from 'express';
import { z } from 'zod';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import { platformPrisma } from '../lib/tenant.js';
import { requirePlatformAdmin } from './platform.js';
import { HELP_DEFAULTS } from '../lib/help-defaults.js';

const router = Router();

const SLUG_RE = /^[a-z0-9][a-z0-9-]{1,60}$/;
const SECTIONS = ['Начало работы', 'Функции', 'Интеграции'];

const blockSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('p'), text: z.string() }),
  z.object({ type: z.literal('h'), text: z.string() }),
  z.object({ type: z.literal('steps'), items: z.array(z.string()) }),
  z.object({ type: z.literal('ul'), items: z.array(z.string()) }),
  z.object({ type: z.literal('tip'), text: z.string() }),
]);

const articleSchema = z.object({
  slug: z.string().trim().toLowerCase().regex(SLUG_RE, 'Адрес: строчные латинские буквы, цифры и дефис'),
  title: z.string().trim().min(2, 'Укажите заголовок').max(150),
  section: z.string().trim().refine((s) => SECTIONS.includes(s), 'Неизвестный раздел'),
  descr: z.string().trim().max(300).default(''),
  mascot: z.string().trim().max(120).nullable().optional(),
  blocks: z.array(blockSchema).min(1, 'Добавьте хотя бы один блок'),
  position: z.number().int().min(0).max(9999).default(0),
});

/** Первичное наполнение дефолтным контентом (id — авто, порядок — по индексу внутри раздела) */
async function seedIfEmpty() {
  const count = await (platformPrisma as any).helpArticle.count();
  if (count > 0) return;
  const positions: Record<string, number> = {};
  for (const a of HELP_DEFAULTS) {
    positions[a.group] = (positions[a.group] || 0) + 1;
    await (platformPrisma as any).helpArticle.create({
      data: {
        slug: a.slug,
        title: a.title,
        section: a.group,
        descr: a.desc,
        mascot: a.mascot || null,
        blocks: a.blocks as any,
        position: positions[a.group],
      },
    });
  }
  console.log('[help] Справка наполнена дефолтным контентом:', HELP_DEFAULTS.length, 'статей');
}

function mapOut(a: any) {
  return {
    slug: a.slug,
    title: a.title,
    group: a.section,
    desc: a.descr,
    mascot: a.mascot,
    blocks: a.blocks,
    position: a.position,
    updatedAt: a.updatedAt,
  };
}

/** Список статей справки — всем авторизованным (и главный домен, и тенанты) */
router.get('/articles', authMiddleware, async (_req, res) => {
  try {
    await seedIfEmpty();
    const rows = await (platformPrisma as any).helpArticle.findMany({
      orderBy: [{ section: 'asc' }, { position: 'asc' }, { title: 'asc' }],
    });
    // Порядок разделов фиксирован: Начало работы → Функции → Интеграции
    const rank = (s: string) => SECTIONS.indexOf(s);
    rows.sort((a: any, b: any) => rank(a.section) - rank(b.section) || a.position - b.position);
    res.json(rows.map(mapOut));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/** Создание статьи — только главный администратор платформы */
router.post('/articles', authMiddleware, requirePlatformAdmin, async (req: AuthRequest, res) => {
  try {
    const data = articleSchema.parse(req.body || {});
    const exists = await (platformPrisma as any).helpArticle.findUnique({ where: { slug: data.slug } });
    if (exists) return res.status(409).json({ error: 'Статья с таким адресом уже существует' });
    const row = await (platformPrisma as any).helpArticle.create({
      data: { slug: data.slug, title: data.title, section: data.section, descr: data.descr, mascot: data.mascot || null, blocks: data.blocks, position: data.position },
    });
    res.json(mapOut(row));
  } catch (err: any) {
    res.status(err.name === 'ZodError' ? 400 : 500).json({ error: err.errors?.[0]?.message || err.message });
  }
});

/** Обновление статьи — только главный администратор платформы */
router.put('/articles/:slug', authMiddleware, requirePlatformAdmin, async (req: AuthRequest, res) => {
  try {
    const data = articleSchema.parse(req.body || {});
    const existing = await (platformPrisma as any).helpArticle.findUnique({ where: { slug: req.params.slug } });
    if (!existing) return res.status(404).json({ error: 'Статья не найдена' });
    // Если адрес меняется — проверяем, что новый свободен
    if (data.slug !== existing.slug) {
      const clash = await (platformPrisma as any).helpArticle.findUnique({ where: { slug: data.slug } });
      if (clash) return res.status(409).json({ error: 'Статья с таким адресом уже существует' });
    }
    const row = await (platformPrisma as any).helpArticle.update({
      where: { id: existing.id },
      data: { slug: data.slug, title: data.title, section: data.section, descr: data.descr, mascot: data.mascot || null, blocks: data.blocks, position: data.position },
    });
    res.json(mapOut(row));
  } catch (err: any) {
    res.status(err.name === 'ZodError' ? 400 : 500).json({ error: err.errors?.[0]?.message || err.message });
  }
});

/** Удаление статьи — только главный администратор платформы */
router.delete('/articles/:slug', authMiddleware, requirePlatformAdmin, async (req, res) => {
  try {
    const existing = await (platformPrisma as any).helpArticle.findUnique({ where: { slug: req.params.slug } });
    if (!existing) return res.status(404).json({ error: 'Статья не найдена' });
    await (platformPrisma as any).helpArticle.delete({ where: { id: existing.id } });
    res.json({ ok: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/** Вернуть дефолтный текст статьи — только главный администратор платформы */
router.post('/articles/:slug/reset', authMiddleware, requirePlatformAdmin, async (req, res) => {
  try {
    const existing = await (platformPrisma as any).helpArticle.findUnique({ where: { slug: req.params.slug } });
    if (!existing) return res.status(404).json({ error: 'Статья не найдена' });
    const def = HELP_DEFAULTS.find((a) => a.slug === existing.slug);
    if (!def) return res.status(404).json({ error: 'Для этой статьи нет исходного текста (создана вручную)' });
    const row = await (platformPrisma as any).helpArticle.update({
      where: { id: existing.id },
      data: { title: def.title, section: def.group, descr: def.desc, mascot: def.mascot || null, blocks: def.blocks as any },
    });
    res.json(mapOut(row));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
