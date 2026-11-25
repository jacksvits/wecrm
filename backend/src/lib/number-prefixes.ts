import { prisma } from './prisma.js';

// ===== Префиксы номеров резервов и заказов (Каталог) =====
// Номера резервов и продаж по-прежнему хранятся как Int — префикс применяется
// только при отображении, поэтому смена префикса мгновенно "перезаписывает"
// номера всех существующих резервов и заказов (настройка администратора).
export const RESERVE_DEFAULT_PREFIX = '00We-';
export const SALE_DEFAULT_PREFIX = 'WE-';

async function getSettings() {
  try {
    return await prisma.numberPrefixSettings.findUnique({ where: { id: 1 } });
  } catch {
    // таблица ещё не создана (окно между стартом и миграцией) — префикс по умолчанию
    return null;
  }
}

export async function getReservePrefix(): Promise<string> {
  const p = (await getSettings())?.reservePrefix?.trim() ?? '';
  return p || RESERVE_DEFAULT_PREFIX;
}

export async function getSalePrefix(): Promise<string> {
  const p = (await getSettings())?.salePrefix?.trim() ?? '';
  return p || SALE_DEFAULT_PREFIX;
}

export function formatReserveNumber(prefix: string, n: number): string {
  return `${prefix || RESERVE_DEFAULT_PREFIX}${String(n).padStart(6, '0')}`;
}

export function formatSaleNumber(prefix: string, n: number): string {
  return `${prefix || SALE_DEFAULT_PREFIX}${String(n).padStart(9, '0')}`;
}
