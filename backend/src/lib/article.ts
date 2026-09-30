/**
 * Генерация внутреннего 8-значного артикула номенклатуры.
 * Случайный номер 10000000–99999999 с гарантией уникальности в БД.
 */
import { prisma } from './prisma.js';

export function randomArticle(): string {
  return String(Math.floor(10000000 + Math.random() * 90000000));
}

export async function generateUniqueArticle(): Promise<string> {
  for (let i = 0; i < 20; i++) {
    const candidate = randomArticle();
    const exists = await prisma.product.findUnique({ where: { article: candidate } });
    if (!exists) return candidate;
  }
  throw new Error('Не удалось сгенерировать уникальный артикул');
}
