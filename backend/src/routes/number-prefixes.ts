import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';

// ===== Префиксы номеров резервов и заказов =====
// Настраиваются кнопкой-шестерёнкой справа от поиска на вкладках «Резервы» и «Заказы»
// Каталога; видна и редактируется только администраторами.
// Префикс — свободное поле до 3 символов; пустое значение = префикс по умолчанию
// (00We- для резервов, WE- для заказов). Номер хранится как Int, префикс применяется
// при отображении — новый префикс мгновенно действует и на уже созданные документы.
const router = Router();
router.use(authMiddleware);

const adminOnly = (req: AuthRequest, res: any, next: any) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Требуются права администратора' });
  }
  next();
};

const prefixSchema = z
  .string()
  .trim()
  .max(3, 'Префикс — не более 3 символов')
  .refine((v) => !/\s/.test(v), 'Пробелы в префиксе недопустимы');

// Текущие префиксы — нужны всем авторизованным пользователям (номера показываются всем ролям)
router.get('/', async (_req, res) => {
  try {
    const s = await prisma.numberPrefixSettings.findUnique({ where: { id: 1 } });
    res.json({ reservePrefix: s?.reservePrefix ?? '', salePrefix: s?.salePrefix ?? '' });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// Смена префиксов — только администратор
router.put('/', adminOnly, async (req: any, res) => {
  const parsed = z
    .object({
      reservePrefix: prefixSchema.optional(),
      salePrefix: prefixSchema.optional(),
    })
    .safeParse(req.body ?? {});
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0]?.message || 'Некорректный префикс' });
  }
  const reservePrefix = parsed.data.reservePrefix ?? '';
  const salePrefix = parsed.data.salePrefix ?? '';
  const s = await prisma.numberPrefixSettings.upsert({
    where: { id: 1 },
    update: { reservePrefix, salePrefix },
    create: { id: 1, reservePrefix, salePrefix },
  });
  res.json({ reservePrefix: s.reservePrefix, salePrefix: s.salePrefix });
});

export default router;
