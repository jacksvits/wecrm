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

// SEO-настройки читаются без авторизации: метатеги применяются на странице входа
// и видны поисковым роботам, поэтому эндпоинт публичный (данные не чувствительные)
router.get('/', async (_req, res) => {
  const settings = await prisma.seoSettings.findFirst();
  res.json({
    title: settings?.title || '',
    description: settings?.description || '',
    canonical: settings?.canonical || '',
    robots: settings?.robots || '',
    lang: settings?.lang || '',
    viewport: settings?.viewport || '',
    keywords: settings?.keywords || '',
  });
});

const settingsSchema = z.object({
  title: z.string().max(300).optional(),
  description: z.string().max(2000).optional(),
  canonical: z.string().max(500).optional(),
  robots: z.string().max(200).optional(),
  lang: z.string().max(20).optional(),
  viewport: z.string().max(300).optional(),
  keywords: z.string().max(2000).optional(),
});

router.put('/', authMiddleware, adminOnly, async (req, res) => {
  try {
    const data = settingsSchema.parse(req.body);
    const existing = await prisma.seoSettings.findFirst();
    const payload = {
      title: data.title ?? '',
      description: data.description ?? '',
      canonical: data.canonical ?? '',
      robots: data.robots ?? '',
      lang: data.lang ?? '',
      viewport: data.viewport ?? '',
      keywords: data.keywords ?? '',
    };
    let settings;
    if (existing) {
      settings = await prisma.seoSettings.update({ where: { id: existing.id }, data: payload });
    } else {
      settings = await prisma.seoSettings.create({ data: payload });
    }
    res.json({
      title: settings.title,
      description: settings.description,
      canonical: settings.canonical,
      robots: settings.robots,
      lang: settings.lang,
      viewport: settings.viewport,
      keywords: settings.keywords,
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

export default router;
