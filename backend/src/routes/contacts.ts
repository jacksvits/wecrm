import { Router } from 'express';
import { z } from 'zod';
import * as XLSX from 'xlsx';
import { prisma } from '../lib/prisma.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';

const router = Router();
router.use(authMiddleware);

function normalizePhone(value: string | null | undefined): string {
  if (!value) return '';
  const digits = value.replace(/\D/g, '');
  if (digits.length === 0) return '';
  if (digits.startsWith('8')) return '+7' + digits.slice(1);
  if (digits.startsWith('7')) return '+7' + digits.slice(1);
  return '+7' + digits;
}

const isAdmin = (req: AuthRequest) => req.user?.role === 'admin';
const isManagerOrAdmin = (req: AuthRequest) => req.user?.role === 'admin' || req.user?.role === 'manager';

const createSchema = z.object({
  name: z.string().min(1),
  email: z.string().email().optional().or(z.literal('')).or(z.literal(null)),
  phone: z.string().optional().or(z.literal(null)),
  emails: z.array(z.string().email()).optional().default([]),
  phones: z.array(z.string()).optional().default([]),
  company: z.string().optional(),
  type: z.string().default('client'),
  kind: z.enum(['contact', 'organization']).default('contact'),
  tags: z.array(z.string()).optional(),
  notes: z.string().optional(),
  inn: z.string().optional().nullable(),
  ogrn: z.string().optional().nullable(),
  legalAddress: z.string().optional().nullable(),
  position: z.string().optional().or(z.literal(null)),
  organizationId: z.string().optional().or(z.literal(null)),
  projectIds: z.array(z.string()).optional().default([]),
});

router.get('/', async (req, res) => {
  try {
    const { type, search, kind, page, limit } = req.query;
    const where: any = {};
    if (type) where.type = type;
    if (kind) where.kind = kind;
    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { company: { contains: search as string, mode: 'insensitive' } },
        { email: { contains: search as string, mode: 'insensitive' } },
        { phone: { contains: search as string, mode: 'insensitive' } },
        { inn: { contains: search as string, mode: 'insensitive' } },
      ];
    }
    const pageNum = Math.max(1, parseInt(page as string) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(limit as string) || 50));
    const skip = (pageNum - 1) * pageSize;
    const usePagination = !!(page || limit);
    const [contacts, totalCount] = await Promise.all([
      prisma.contact.findMany({
        where,
        skip: usePagination ? skip : undefined,
        take: usePagination ? pageSize : undefined,
        include: {
          _count: { select: { deals: true, tasks: true, employees: true } },
          organization: { select: { id: true, name: true } },
          projects: { include: { project: { select: { id: true, name: true, status: true } } } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.contact.count({ where }),
    ]);
    if (page || limit) {
      res.json({ contacts, totalCount, page: pageNum, pageSize });
    } else {
      res.json(contacts);
    }
  } catch (err: any) {
    console.error('[Contacts GET] Error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const contact = await prisma.contact.findUnique({
      where: { id: req.params.id },
      include: {
        _count: { select: { deals: true, tasks: true, calls: true, employees: true } },
        deals: { orderBy: { createdAt: 'desc' } },
        tasks: { orderBy: { createdAt: 'desc' } },
        employees: { orderBy: { name: 'asc' } },
        organization: { select: { id: true, name: true, inn: true, phone: true } },
        projects: { include: { project: { select: { id: true, name: true, status: true } } } },
      },
    });
    if (!contact) {
      return res.status(404).json({ error: 'Контакт не найден' });
    }
    res.json(contact);
  } catch (err: any) {
    console.error('[Contacts GET by ID] Error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const data = createSchema.parse(req.body);
    const payload: any = {
      ...data,
      email: data.emails[0] || data.email || null,
      phone: normalizePhone(data.phones[0] || data.phone || ''),
      phones: data.phones.map(p => normalizePhone(p)).filter(Boolean),
      organizationId: data.organizationId || null,
    };
    if (data.kind === 'organization') {
      payload.position = null;
      payload.organizationId = null;
    } else {
      payload.inn = null;
      payload.ogrn = null;
      payload.legalAddress = null;
    }
    const contact = await prisma.contact.create({
      data: {
        ...payload,
        projects: data.projectIds?.length ? {
          create: data.projectIds.map(pid => ({ project: { connect: { id: pid } } })),
        } : undefined,
      },
      include: {
        projects: { include: { project: { select: { id: true, name: true, status: true } } } },
      },
    });
    res.status(201).json(contact);
  } catch (err: any) {
    console.error('[Contacts POST] Error:', err.message);
    res.status(400).json({ error: err.message });
  }
});

router.patch('/:id', async (req: AuthRequest, res) => {
  try {
    if (!isManagerOrAdmin(req)) {
      return res.status(403).json({ error: 'Недостаточно прав для редактирования контактов' });
    }
    const data = req.body;
    if (data.emails || data.email !== undefined) {
      data.email = data.emails?.[0] || data.email || null;
    }
    if (data.phones || data.phone !== undefined) {
      data.phone = normalizePhone(data.phones?.[0] || data.phone || '');
      data.phones = (data.phones || []).map((p: string) => normalizePhone(p)).filter(Boolean);
    }
    // Fix: empty string organizationId causes FK violation
    if (data.organizationId === '' || data.organizationId === undefined) {
      data.organizationId = null;
    }
    if (data.kind === 'organization') {
      data.position = null;
      data.organizationId = null;
    } else if (data.kind === 'contact') {
      data.inn = null;
      data.ogrn = null;
      data.legalAddress = null;
    }
    const { projectIds, ...restData } = data;
    const updateData: any = { ...restData };

    if (projectIds !== undefined) {
      await prisma.contactProject.deleteMany({ where: { contactId: req.params.id } });
      if (projectIds.length > 0) {
        await prisma.contactProject.createMany({
          data: projectIds.map((pid: string) => ({ contactId: req.params.id, projectId: pid })),
          skipDuplicates: true,
        });
      }
    }

    const contact = await prisma.contact.update({
      where: { id: req.params.id },
      data: updateData,
      include: {
        projects: { include: { project: { select: { id: true, name: true, status: true } } } },
      },
    });
    res.json(contact);
  } catch (err: any) {
    console.error('[Contacts PATCH] Error:', err.message);
    res.status(400).json({ error: err.message });
  }
});

router.delete('/:id', async (req: AuthRequest, res) => {
  try {
    if (!isAdmin(req)) {
      return res.status(403).json({ error: 'Недостаточно прав для удаления контактов' });
    }
    await prisma.contact.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err: any) {
    console.error('[Contacts DELETE] Error:', err.message);
    res.status(400).json({ error: err.message });
  }
});

router.post('/merge', async (req: AuthRequest, res) => {
  try {
    const { targetId, sourceIds } = z.object({
      targetId: z.string().min(1),
      sourceIds: z.array(z.string().min(1)).min(1),
    }).parse(req.body);

    const target = await prisma.contact.findUnique({
      where: { id: targetId },
      include: { _count: { select: { deals: true, tasks: true, calls: true } } },
    });
    if (!target) return res.status(404).json({ error: 'Целевой контакт не найден' });

    const sources = await prisma.contact.findMany({
      where: { id: { in: sourceIds } },
      include: { _count: { select: { deals: true, tasks: true, calls: true } } },
    });
    if (sources.length !== sourceIds.length) {
      return res.status(404).json({ error: 'Некоторые исходные контакты не найдены' });
    }

    const allPhones = [...new Set([
      ...target.phones.map(p => normalizePhone(p)),
      ...(target.phone ? [normalizePhone(target.phone)] : []),
      ...sources.flatMap(s => [...s.phones.map(p => normalizePhone(p)), ...(s.phone ? [normalizePhone(s.phone)] : [])]),
    ])].filter(Boolean);

    const allEmails = [...new Set([
      ...target.emails,
      ...(target.email ? [target.email] : []),
      ...sources.flatMap(s => [...s.emails, ...(s.email ? [s.email] : [])]),
    ])].filter(Boolean);

    const allTags = [...new Set([...target.tags, ...sources.flatMap(s => s.tags)])];
    const mergedNotes = [target.notes, ...sources.map(s => s.notes)].filter(Boolean).join('\n\n---\n\n');

    await prisma.contact.update({
      where: { id: targetId },
      data: {
        phones: allPhones,
        emails: allEmails,
        tags: allTags,
        notes: mergedNotes || null,
        phone: allPhones[0] || null,
        email: allEmails[0] || null,
      },
    });

    for (const source of sources) {
      await prisma.deal.updateMany({ where: { contactId: source.id }, data: { contactId: targetId } });
      await prisma.task.updateMany({ where: { contactId: source.id }, data: { contactId: targetId } });
      await prisma.call.updateMany({ where: { contactId: source.id }, data: { contactId: targetId } });
      await prisma.contact.updateMany({ where: { organizationId: source.id }, data: { organizationId: targetId } });
    }

    await prisma.contact.deleteMany({ where: { id: { in: sourceIds } } });

    await prisma.activity.create({
      data: {
        action: 'merged',
        entity: 'contact',
        entityId: targetId,
        userId: req.user!.id,
        details: `Объединены контакты: ${sources.map(s => s.name).join(', ')} в ${target.name}`,
      },
    });

    res.json({ success: true, targetId, mergedContacts: sources.length, phones: allPhones, emails: allEmails });
  } catch (err: any) {
    console.error('[Contacts Merge] Error:', err.message);
    res.status(400).json({ error: err.message });
  }
});

router.post('/import', async (req: AuthRequest, res) => {
  try {
    if (!isAdmin(req)) return res.status(403).json({ error: 'Недостаточно прав' });
    const { format, data } = z.object({ format: z.enum(['vcf', 'csv', 'xlsx']), data: z.string().min(1) }).parse(req.body);

    const contacts: Array<{
      name: string; phones: string[]; emails: string[]; company?: string; notes?: string; kind?: string;
      inn?: string; ogrn?: string; legalAddress?: string; position?: string; organizationId?: string;
    }> = [];

    if (format === 'vcf') {
      const cards = data.split(/BEGIN:VCARD/i).slice(1);
      for (const card of cards) {
        const lines = card.split(/\r?\n/);
        let name = '', phones: string[] = [], emails: string[] = [], company = '', notes = '';
        for (const line of lines) {
          const upper = line.toUpperCase();
          if (upper.startsWith('FN:')) name = line.substring(3).trim();
          else if (upper.startsWith('N:') && !name) {
            const parts = line.substring(2).split(';');
            name = [parts[1], parts[0]].filter(Boolean).join(' ').trim();
          } else if (upper.includes('TEL')) phones.push(normalizePhone(line.split(':').slice(1).join(':').trim()));
          else if (upper.includes('EMAIL')) emails.push(line.split(':').slice(1).join(':').trim());
          else if (upper.startsWith('ORG:')) company = line.substring(4).trim();
          else if (upper.startsWith('NOTE:')) notes = line.substring(5).trim();
        }
        if (name) contacts.push({ name, phones, emails, company, notes, kind: 'contact' });
      }
    } else if (format === 'csv') {
      const lines = data.split(/\r?\n/).filter(l => l.trim());
      if (lines.length < 2) return res.status(400).json({ error: 'CSV пуст' });
      const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
      const nameIdx = headers.findIndex(h => h.toLowerCase().includes('name') && !h.toLowerCase().includes('family') && !h.toLowerCase().includes('given'));
      const givenNameIdx = headers.findIndex(h => h.toLowerCase().includes('given name'));
      const familyNameIdx = headers.findIndex(h => h.toLowerCase().includes('family name'));
      const phoneIdx = headers.findIndex(h => h.toLowerCase().includes('phone'));
      const emailIdx = headers.findIndex(h => h.toLowerCase().includes('e-mail') || h.toLowerCase().includes('email'));
      const orgIdx = headers.findIndex(h => h.toLowerCase().includes('organization'));
      const notesIdx = headers.findIndex(h => h.toLowerCase().includes('notes'));
      const kindIdx = headers.findIndex(h => h.toLowerCase().includes('kind') || h.toLowerCase().includes('вид') || h.toLowerCase().includes('тип контакта'));

      for (let i = 1; i < lines.length; i++) {
        const values = parseCSVLine(lines[i]);
        let name = '';
        if (nameIdx >= 0 && values[nameIdx]) name = values[nameIdx];
        else if (givenNameIdx >= 0 || familyNameIdx >= 0) {
          name = [values[givenNameIdx] || '', values[familyNameIdx] || ''].filter(Boolean).join(' ');
        }
        const phones: string[] = [];
        if (phoneIdx >= 0 && values[phoneIdx]) phones.push(...values[phoneIdx].split(':::').filter(Boolean));
        for (let j = 0; j < headers.length; j++) {
          if (headers[j].toLowerCase().includes('phone') && j !== phoneIdx && values[j]) phones.push(...values[j].split(':::').filter(Boolean));
        }
        const emails: string[] = [];
        if (emailIdx >= 0 && values[emailIdx]) emails.push(...values[emailIdx].split(':::').filter(Boolean));
        for (let j = 0; j < headers.length; j++) {
          if ((headers[j].toLowerCase().includes('e-mail') || headers[j].toLowerCase().includes('email')) && j !== emailIdx && values[j]) {
            emails.push(...values[j].split(':::').filter(Boolean));
          }
        }
        const company = orgIdx >= 0 ? values[orgIdx] || '' : '';
        const notes = notesIdx >= 0 ? values[notesIdx] || '' : '';
        const kind = kindIdx >= 0 && values[kindIdx]?.toLowerCase() === 'organization' ? 'organization' : 'contact';
        if (name) contacts.push({ name, phones: [...new Set(phones)], emails: [...new Set(emails)], company, notes, kind });
      }
    } else if (format === 'xlsx') {
      const buffer = Buffer.from(data, 'base64');
      const workbook = XLSX.read(buffer, { type: 'buffer' });
      const rows = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], { header: 1, defval: '' }) as string[][];
      if (rows.length < 2) return res.status(400).json({ error: 'Excel пуст' });
      const headers = rows[0].map(h => String(h).trim().toLowerCase());
      const nameIdx = headers.findIndex(h => h.includes('имя') || h.includes('name') || h.includes('фио'));
      const phoneIdx = headers.findIndex(h => h.includes('телефон') || h.includes('phone') || h.includes('тел'));
      const emailIdx = headers.findIndex(h => h.includes('email') || h.includes('почта') || h.includes('e-mail'));
      const companyIdx = headers.findIndex(h => h.includes('компания') || h.includes('company') || h.includes('организация'));
      const notesIdx = headers.findIndex(h => h.includes('примечание') || h.includes('notes') || h.includes('комментарий'));
      const kindIdx = headers.findIndex(h => h.includes('вид') || h.includes('kind') || h.includes('тип контакта'));
      const innIdx = headers.findIndex(h => h.includes('инн') || h.includes('inn'));
      const ogrnIdx = headers.findIndex(h => h.includes('огрн') || h.includes('ogrn'));

      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        const name = nameIdx >= 0 ? String(row[nameIdx] || '').trim() : '';
        if (!name) continue;
        const phones: string[] = phoneIdx >= 0 && row[phoneIdx] ? String(row[phoneIdx]).split(/[,;\/]/).map(p => p.trim()).filter(Boolean) : [];
        const emails: string[] = emailIdx >= 0 && row[emailIdx] ? String(row[emailIdx]).split(/[,;\/]/).map(e => e.trim()).filter(Boolean) : [];
        const company = companyIdx >= 0 ? String(row[companyIdx] || '').trim() : '';
        const notes = notesIdx >= 0 ? String(row[notesIdx] || '').trim() : '';
        const kind = kindIdx >= 0 && String(row[kindIdx] || '').toLowerCase().includes('орг') ? 'organization' : 'contact';
        const inn = innIdx >= 0 ? String(row[innIdx] || '').trim() : undefined;
        const ogrn = ogrnIdx >= 0 ? String(row[ogrnIdx] || '').trim() : undefined;
        contacts.push({ name, phones: [...new Set(phones)], emails: [...new Set(emails)], company, notes, kind, inn, ogrn });
      }
    }

    const created = [];
    for (const c of contacts) {
      const payload: any = {
        name: c.name,
        phones: c.phones,
        emails: c.emails,
        phone: c.phones[0] || null,
        email: c.emails[0] || null,
        company: c.company || null,
        notes: c.notes || null,
        type: 'client',
        kind: c.kind || 'contact',
        tags: [],
      };
      if (c.kind === 'organization') {
        payload.inn = c.inn || null;
        payload.ogrn = c.ogrn || null;
      }
      const contact = await prisma.contact.create({ data: payload });
      created.push(contact);
    }

    if (created.length > 0) {
      await prisma.activity.create({
        data: {
          action: 'imported',
          entity: 'contact',
          entityId: created[0].id,
          userId: req.user!.id,
          details: `Импортировано ${created.length} контактов из ${format.toUpperCase()}`,
        },
      });
    }
    res.json({ success: true, imported: created.length, contacts: created });
  } catch (err: any) {
    console.error('[Contacts Import] Error:', err.message);
    res.status(400).json({ error: err.message });
  }
});

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
      else { inQuotes = !inQuotes; }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else { current += char; }
  }
  result.push(current.trim());
  return result.map(v => v.replace(/^"|"$/g, ''));
}

export default router;
