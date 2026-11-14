import { prisma } from './prisma.js';

/**
 * Привязка пользователя к контакту по номеру телефона.
 *
 * Правила:
 *  - у пользователя может быть указан только один телефон (unique в users.phone);
 *  - у контакта может быть привязан только один пользователь (unique в contacts.user_id);
 *  - при совпадении телефона профиля с телефоном контакта пользователь привязывается
 *    к контакту и получает доступ к его задачам;
 *  - сменить номер после привязки может только администратор (см. routes/profile.ts).
 */

// Нормализация номера: только цифры и ведущий «+» (пробелы, скобки, дефисы убираем)
export function normalizePhone(raw: string): string {
  const cleaned = raw.trim().replace(/[^\d+]/g, '');
  return cleaned.startsWith('+') ? '+' + cleaned.slice(1).replace(/\+/g, '') : cleaned.replace(/\+/g, '');
}

// Сравнение номеров по цифрам (игнорируем «+», пробелы, скобки, дефисы)
function samePhone(a: string, b: string): boolean {
  return a.replace(/\D/g, '') === b.replace(/\D/g, '');
}

export interface LinkedContact {
  id: string;
  name: string;
}

// Контакт, привязанный к пользователю (если есть)
export async function getLinkedContact(userId: string): Promise<LinkedContact | null> {
  const contact = await prisma.contact.findFirst({
    where: { userId },
    select: { id: true, name: true },
  });
  return contact;
}

/**
 * Ищет контакт с телефоном phoneRaw и привязывает его к пользователю.
 * Возвращает привязанный контакт либо null, если контакт с таким телефоном не найден.
 * Бросает Error, если контакт уже привязан к другому пользователю.
 */
export async function linkUserToContactByPhone(userId: string, phoneRaw: string): Promise<LinkedContact | null> {
  const phone = normalizePhone(phoneRaw);
  if (!phone.replace(/\D/g, '')) return null;

  // Точное совпадение нормализованного номера (phone или один из phones)
  const candidates = await prisma.contact.findMany({
    where: { OR: [{ phone: { not: null } }, { phones: { isEmpty: false } }] },
    select: { id: true, name: true, userId: true, phone: true, phones: true },
  });
  const contact = candidates.find(
    (c) => (c.phone && samePhone(c.phone, phone)) || c.phones.some((p) => samePhone(p, phone)),
  );
  if (!contact) return null;

  if (contact.userId && contact.userId !== userId) {
    throw new Error('Контакт с таким номером телефона уже привязан к другому пользователю');
  }
  if (contact.userId === userId) return { id: contact.id, name: contact.name };

  await prisma.contact.update({ where: { id: contact.id }, data: { userId } });
  return { id: contact.id, name: contact.name };
}

// Отвязывает пользователя от контакта (смена/очистка телефона администратором)
export async function unlinkUserContacts(userId: string): Promise<void> {
  await prisma.contact.updateMany({ where: { userId }, data: { userId: null } });
}
