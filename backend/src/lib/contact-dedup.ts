import { prisma } from './prisma.js';

// Нормализация телефона к единому виду +7XXXXXXXXXX (как в routes/contacts.ts)
export function normalizePhoneNumber(value: string | null | undefined): string {
  if (!value) return '';
  const digits = value.replace(/\D/g, '');
  if (digits.length === 0) return '';
  if (digits.startsWith('8')) return '+7' + digits.slice(1);
  if (digits.startsWith('7')) return '+7' + digits.slice(1);
  return '+7' + digits;
}

const phoneDigits = (value: string | null | undefined): string => normalizePhoneNumber(value).replace(/\D/g, '');

export interface ContactLookupInput {
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  emails?: (string | null | undefined)[];
  phones?: (string | null | undefined)[];
}

// Поиск существующих контактов-дубликатов по имени, телефону или email
export async function findDuplicateContacts(input: ContactLookupInput): Promise<any[]> {
  const name = (input.name || '').trim();
  const lowerName = name.toLowerCase();
  const emails = new Set(
    [input.email, ...(input.emails || [])]
      .filter(Boolean)
      .map((e) => String(e).trim().toLowerCase())
      .filter(Boolean),
  );
  const phones = new Set(
    [input.phone, ...(input.phones || [])]
      .map(phoneDigits)
      .filter(Boolean),
  );

  const or: any[] = [];
  if (name) or.push({ name: { equals: name, mode: 'insensitive' } });
  if (emails.size > 0) {
    or.push({ email: { in: Array.from(emails), mode: 'insensitive' } });
    or.push({ emails: { hasSome: Array.from(emails) } });
  }
  if (phones.size > 0) {
    // Основные варианты: нормализованный +7 и последние 10 цифр (на случай ненормализованного хранения)
    or.push({ phone: { in: Array.from(phones).map((p) => '+' + p) } });
    or.push({ phones: { hasSome: Array.from(phones).map((p) => '+' + p) } });
    for (const p of phones) or.push({ phone: { contains: p.slice(-10) } });
  }
  if (or.length === 0) return [];

  const candidates = await prisma.contact.findMany({ where: { OR: or } });
  const matched = candidates.filter((c: any) => {
    if (name && c.name && c.name.trim().toLowerCase() === lowerName) return true;
    if (c.email && emails.has(String(c.email).trim().toLowerCase())) return true;
    if ((c.emails || []).some((e: string) => emails.has(String(e).trim().toLowerCase()))) return true;
    const candidatePhones = [c.phone, ...(c.phones || [])].map(phoneDigits).filter(Boolean);
    if (candidatePhones.some((p: string) => phones.has(p))) return true;
    return false;
  });
  return matched.sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
}

// Объединение контактов: перенос связей (задачи, сделки, звонки, SMS, проекты, сотрудники),
// слияние телефонов/email/тегов и дополнение недостающих полей (имя/телефон/email и пр.) из extraData и источников
export async function mergeContacts(targetId: string, sourceIds: string[], extraData: any = {}): Promise<any> {
  const target = await prisma.contact.findUnique({ where: { id: targetId } });
  if (!target) throw new Error('Целевой контакт не найден');
  const sources = sourceIds.length > 0
    ? await prisma.contact.findMany({ where: { id: { in: sourceIds } } })
    : [];

  // Перенос проектных связей источников (с защитой от дублирования unique constraint)
  if (sources.length > 0) {
    const sourceProjects = await prisma.contactProject.findMany({ where: { contactId: { in: sourceIds } } });
    if (sourceProjects.length > 0) {
      await prisma.contactProject.createMany({
        data: sourceProjects.map((cp) => ({ contactId: targetId, projectId: cp.projectId })),
        skipDuplicates: true,
      });
    }
  }

  for (const source of sources) {
    await prisma.deal.updateMany({ where: { contactId: source.id }, data: { contactId: targetId } });
    await prisma.task.updateMany({ where: { contactId: source.id }, data: { contactId: targetId } });
    await prisma.call.updateMany({ where: { contactId: source.id }, data: { contactId: targetId } });
    await prisma.smsMessage.updateMany({ where: { contactId: source.id }, data: { contactId: targetId } });
    await prisma.contact.updateMany({ where: { organizationId: source.id }, data: { organizationId: targetId } });
  }

  if (sources.length > 0) {
    await prisma.contact.deleteMany({ where: { id: { in: sourceIds } } });
  }

  // Слияние телефонов и email (уникальность без учёта регистра/формата)
  const allPhones = [...new Set(
    [target.phone, ...target.phones,
      ...sources.flatMap((s) => [s.phone, ...(s.phones || [])]),
      extraData.phone, ...(extraData.phones || [])]
      .map(normalizePhoneNumber)
      .filter(Boolean),
  )];
  const seenEmails = new Set<string>();
  const allEmails: string[] = [];
  for (const e of [target.email, ...target.emails,
    ...sources.flatMap((s) => [s.email, ...(s.emails || [])]),
    extraData.email, ...(extraData.emails || [])]) {
    if (!e) continue;
    const key = String(e).trim().toLowerCase();
    if (!key || seenEmails.has(key)) continue;
    seenEmails.add(key);
    allEmails.push(String(e).trim());
  }
  const allTags = [...new Set([...target.tags, ...sources.flatMap((s) => s.tags), ...(extraData.tags || [])])];
  const notesParts = [target.notes, ...sources.map((s) => s.notes), extraData.notes].filter(Boolean);
  const mergedNotes = notesParts.length > 0 ? [...new Set(notesParts)].join('\n\n---\n\n') : null;

  // Дополнение недостающих полей: данные источников, затем данные из формы (extraData)
  const pick = (current: any, ...candidates: any[]) => {
    if (current !== null && current !== undefined && current !== '') return current;
    for (const c of candidates) if (c !== null && c !== undefined && c !== '') return c;
    return current ?? null;
  };

  const updated = await prisma.contact.update({
    where: { id: targetId },
    data: {
      phones: allPhones,
      emails: allEmails,
      tags: allTags,
      notes: mergedNotes,
      phone: allPhones[0] || null,
      email: allEmails[0] || null,
      company: pick(target.company, ...sources.map((s) => s.company), extraData.company),
      position: pick(target.position, ...sources.map((s) => s.position), extraData.position),
      inn: pick(target.inn, ...sources.map((s) => s.inn), extraData.inn),
      ogrn: pick(target.ogrn, ...sources.map((s) => s.ogrn), extraData.ogrn),
      legalAddress: pick(target.legalAddress, ...sources.map((s) => s.legalAddress), extraData.legalAddress),
      avatarUrl: pick(target.avatarUrl, ...sources.map((s) => s.avatarUrl), extraData.avatarUrl),
      description: pick(target.description, ...sources.map((s) => s.description), extraData.description),
      maxChatId: pick(target.maxChatId, ...sources.map((s) => s.maxChatId), extraData.maxChatId),
      maxUserId: pick(target.maxUserId, ...sources.map((s) => s.maxUserId), extraData.maxUserId),
      vkUserId: pick(target.vkUserId, ...sources.map((s) => s.vkUserId), extraData.vkUserId),
      lastActivityTime: [target.lastActivityTime, ...sources.map((s) => s.lastActivityTime), extraData.lastActivityTime]
        .filter(Boolean)
        .sort((a: any, b: any) => new Date(b).getTime() - new Date(a).getTime())[0] ?? target.lastActivityTime,
    },
  });
  return updated;
}

// Автоматическое разрешение контакта: если дубликаты найдены — объединяет их в самый старый
// и дополняет недостающие поля; иначе создаёт новый контакт. Возвращает id контакта для привязки к задаче
export async function resolveContactAuto(
  input: ContactLookupInput,
  createData: any,
): Promise<{ contactId: string; created: boolean; mergedCount: number }> {
  const duplicates = await findDuplicateContacts(input);
  if (duplicates.length === 0) {
    const contact = await prisma.contact.create({ data: createData });
    return { contactId: contact.id, created: true, mergedCount: 0 };
  }
  const target = duplicates[0];
  const otherIds = duplicates.slice(1).map((c: any) => c.id);
  await mergeContacts(target.id, otherIds, createData);
  if (otherIds.length > 0) {
    console.log(`[ContactDedup] Объединено ${otherIds.length} дубликатов в контакт ${target.id} (${target.name})`);
  } else {
    console.log(`[ContactDedup] Контакт уже существует: ${target.id} (${target.name}), данные дополнены`);
  }
  return { contactId: target.id, created: false, mergedCount: otherIds.length };
}
