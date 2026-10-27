import { Router } from 'express';
import { z } from 'zod';
import { ImapFlow } from 'imapflow';
import { simpleParser, ParsedMail } from 'mailparser';
import nodemailer from 'nodemailer';
import multer from 'multer';
import { prisma } from '../lib/prisma.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';

/**
 * Почтовый клиент (страница «Почтовый клиент», только для админов).
 * Аккаунты почты хранятся per-user (mail_accounts), аккаунтов может быть несколько.
 * IMAP-подключения открываются на время запроса и закрываются — stateless,
 * фонового воркера нет. Отправка — через SMTP аккаунта (nodemailer).
 */

const router = Router();
router.use(authMiddleware);

// Доступ: админам всегда; остальным — если роль включает страницу /mail
// (пустой список страниц роли = полный доступ, как в RequireRole на фронте)
router.use((req: AuthRequest, res, next) => {
  const allowedPages = ((req.user as any)?.allowedPages as string[] | undefined) || [];
  if (req.user?.role !== 'admin' && allowedPages.length > 0 && !allowedPages.includes('/mail')) {
    return res.status(403).json({ error: 'Нет доступа к почтовому клиенту' });
  }
  next();
});

type MailAccountRow = {
  id: string;
  userId: string;
  label: string;
  email: string;
  imapHost: string;
  imapPort: number;
  imapUser: string;
  imapPass: string;
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpPass: string;
  secure: boolean;
  rejectUnauthorized: boolean;
  isDefault: boolean;
};

const accountSchema = z.object({
  label: z.string().default(''),
  email: z.string().email('Некорректный email'),
  imapHost: z.string().min(1, 'Укажите IMAP-сервер'),
  imapPort: z.number().int().min(1).max(65535).default(993),
  imapUser: z.string().min(1, 'Укажите логин IMAP'),
  imapPass: z.string().min(1, 'Укажите пароль IMAP'),
  smtpHost: z.string().min(1, 'Укажите SMTP-сервер'),
  smtpPort: z.number().int().min(1).max(65535).default(465),
  smtpUser: z.string().min(1, 'Укажите логин SMTP'),
  smtpPass: z.string().min(1, 'Укажите пароль SMTP'),
  secure: z.boolean().default(true),
  rejectUnauthorized: z.boolean().default(false),
  isDefault: z.boolean().default(false),
});

// Пароль в открытом виде наружу не отдаём (как в email-settings)
function toSafeAccount(a: MailAccountRow) {
  const { imapPass, smtpPass, ...safe } = a;
  return { ...safe, hasImapPassword: !!imapPass, hasSmtpPassword: !!smtpPass };
}

async function getAccount(req: AuthRequest, res: any): Promise<MailAccountRow | null> {
  const id = (req.query.accountId || req.body?.accountId || req.params.id) as string | undefined;
  if (!id) {
    res.status(400).json({ error: 'accountId обязателен' });
    return null;
  }
  const account = (await prisma.mailAccount.findUnique({ where: { id } })) as MailAccountRow | null;
  if (!account || account.userId !== req.user!.id) {
    res.status(404).json({ error: 'Аккаунт не найден' });
    return null;
  }
  return account;
}

// Открывает IMAP-подключение на время операции и гарантированно закрывает его
async function withImap<T>(account: MailAccountRow, fn: (client: ImapFlow) => Promise<T>): Promise<T> {
  const client = new ImapFlow({
    host: account.imapHost,
    port: account.imapPort,
    secure: account.secure,
    // при secure=false imapflow сам делает STARTTLS-апгрейд (порт 143), если сервер поддерживает
    auth: { user: account.imapUser, pass: account.imapPass },
    logger: false,
    tls: { rejectUnauthorized: account.rejectUnauthorized },
    connectionTimeout: 20000,
    greetingTimeout: 20000,
    socketTimeout: 30000,
  });
  await client.connect();
  try {
    return await fn(client);
  } finally {
    await client.logout().catch(() => {});
  }
}

// ---- Аккаунты ----

router.get('/accounts', async (req: AuthRequest, res) => {
  const accounts = (await prisma.mailAccount.findMany({
    where: { userId: req.user!.id },
    orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
  })) as MailAccountRow[];
  res.json(accounts.map(toSafeAccount));
});

router.post('/accounts', async (req: AuthRequest, res) => {
  try {
    const data = accountSchema.parse(req.body);
    // Аккаунт по умолчанию один — снимаем флаг у остальных
    if (data.isDefault) {
      await prisma.mailAccount.updateMany({ where: { userId: req.user!.id }, data: { isDefault: false } });
    }
    const account = (await prisma.mailAccount.create({ data: { ...data, userId: req.user!.id } })) as MailAccountRow;
    res.json(toSafeAccount(account));
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.patch('/accounts/:id', async (req: AuthRequest, res) => {
  try {
    const account = await getAccount(req, res);
    if (!account) return;
    // Пустой пароль в PATCH = «не менять»
    const data = accountSchema.partial().parse(req.body);
    if (data.isDefault) {
      await prisma.mailAccount.updateMany({
        where: { userId: req.user!.id, NOT: { id: account.id } },
        data: { isDefault: false },
      });
    }
    const updated = (await prisma.mailAccount.update({ where: { id: account.id }, data })) as MailAccountRow;
    res.json(toSafeAccount(updated));
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/accounts/:id', async (req: AuthRequest, res) => {
  const account = await getAccount(req, res);
  if (!account) return;
  await prisma.mailAccount.delete({ where: { id: account.id } });
  res.json({ success: true });
});

// Проверка подключения IMAP + SMTP
router.post('/accounts/:id/test', async (req: AuthRequest, res) => {
  try {
    const account = await getAccount(req, res);
    if (!account) return;
    const result: { imap: string; smtp: string } = { imap: '', smtp: '' };
    try {
      await withImap(account, async client => {
        const mailboxes = await client.list();
        if (!mailboxes.length) throw new Error('Нет доступных папок');
      });
      result.imap = 'ok';
    } catch (err: any) {
      result.imap = err.message || 'Ошибка подключения';
    }
    try {
      const transport = nodemailer.createTransport({
        host: account.smtpHost,
        port: account.smtpPort,
        secure: account.secure,
        auth: { user: account.smtpUser, pass: account.smtpPass },
        tls: { rejectUnauthorized: account.rejectUnauthorized },
        connectionTimeout: 15000,
        socketTimeout: 15000,
      });
      await transport.verify();
      result.smtp = 'ok';
      transport.close();
    } catch (err: any) {
      result.smtp = err.message || 'Ошибка подключения';
    }
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// ---- Папки ----

router.get('/folders', async (req: AuthRequest, res) => {
  try {
    const account = await getAccount(req, res);
    if (!account) return;
    // Дерево папок (listTree) + счётчики — всё в одном IMAP-подключении
    const tree = await withImap(account, async client => {
      const listed = await client.listTree();
      const build = async (node: any): Promise<any> => {
        const out: any = {
          path: node.path,
          name: node.name,
          specialUse: node.specialUse || null,
          unseen: 0,
          total: 0,
          children: [],
        };
        try {
          const s = await client.status(node.path, { unseen: true, messages: true });
          out.unseen = s.unseen ?? 0;
          out.total = s.messages ?? 0;
        } catch {
          // отдельные папки (например, недоступные по ACL) не должны ломать весь список
        }
        for (const sub of node.folders || []) {
          out.children.push(await build(sub));
        }
        return out;
      };
      const roots: any[] = [];
      for (const node of (listed as any)?.folders || []) {
        roots.push(await build(node));
      }
      return roots;
    });
    res.json(tree);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// ---- Письма ----

function structureHasAttachments(structure: any): boolean {
  if (!structure) return false;
  if (structure.disposition === 'attachment') return true;
  const type = String(structure.type || '');
  if (!type.startsWith('text/') && !type.startsWith('multipart/') && structure.disposition !== 'inline') return true;
  return Array.isArray(structure.childNodes) && structure.childNodes.some(structureHasAttachments);
}

function formatAddress(addr: any): string {
  if (!addr) return '';
  if (Array.isArray(addr)) return addr.map(formatAddress).filter(Boolean).join(', ');
  const a = addr as { name?: string; address?: string };
  return a.name ? `${a.name} <${a.address || ''}>` : (a.address || '');
}

router.get('/messages', async (req: AuthRequest, res) => {
  try {
    const account = await getAccount(req, res);
    if (!account) return;
    const folder = String(req.query.folder || 'INBOX');
    const page = Math.max(1, parseInt(String(req.query.page || '1'), 10) || 1);
    const limit = Math.min(50, Math.max(5, parseInt(String(req.query.limit || '25'), 10) || 25));
    const q = String(req.query.q || '').trim();

    const result = await withImap(account, async client => {
      const lock = await client.getMailboxLock(folder);
      try {
        // search() без опции вернул бы порядковые номера (seq), а не UID —
        // в ящиках с удалёнными письмами диапазоны UID FETCH тогда «промахиваются»
        const uids = q
          ? (await client.search({ or: [{ subject: q }, { from: q }, { to: q }] }, { uid: true })) || []
          : (await client.search({ all: true }, { uid: true })) || [];
        const total = uids.length;
        const slice = uids.slice(Math.max(0, total - page * limit), total - (page - 1) * limit).reverse();
        if (!slice.length) return { total, messages: [] };
        // uids в slice идут по возрастанию — диапазон fetch строим от меньшего к большему
        const range = `${slice[slice.length - 1]}:${slice[0]}`;
        const fetched = await client.fetchAll(range, { uid: true, envelope: true, flags: true, bodyStructure: true, size: true }, { uid: true });
        const messages = Array.from(fetched as any)
          .map((m: any) => ({
            uid: m.uid,
            subject: m.envelope?.subject || '(без темы)',
            from: formatAddress(m.envelope?.from),
            fromName: m.envelope?.from?.[0]?.name || '',
            date: m.envelope?.date ? new Date(m.envelope.date).toISOString() : null,
            seen: m.flags?.has('\\Seen') ?? false,
            hasAttachments: structureHasAttachments(m.bodyStructure),
            size: m.size || 0,
          }))
          .sort((a: any, b: any) => b.uid - a.uid);
        return { total, messages };
      } finally {
        lock.release();
      }
    });
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/message', async (req: AuthRequest, res) => {
  try {
    const account = await getAccount(req, res);
    if (!account) return;
    const folder = String(req.query.folder || 'INBOX');
    const uid = parseInt(String(req.query.uid || ''), 10);
    if (!uid) return res.status(400).json({ error: 'uid обязателен' });

    const message = await withImap(account, async client => {
      const lock = await client.getMailboxLock(folder);
      try {
        const raw = await client.fetchOne(uid, { source: true }, { uid: true });
        if (!raw || !raw.source) return null;
        // Открытие письма = прочитано
        await client.messageFlagsAdd(uid, ['\\Seen'], { uid: true }).catch(() => {});
        const parsed: ParsedMail = await simpleParser(raw.source);
        return {
          uid,
          subject: parsed.subject || '(без темы)',
          from: formatAddress(parsed.from),
          to: formatAddress(parsed.to),
          cc: formatAddress(parsed.cc),
          date: parsed.date ? parsed.date.toISOString() : null,
          html: parsed.html || null,
          text: parsed.text || null,
          messageId: parsed.messageId || null,
          attachments: (parsed.attachments || []).map((a, i) => ({
            index: i,
            filename: a.filename || `attachment-${i + 1}`,
            contentType: a.contentType,
            size: a.size || 0,
          })),
        };
      } finally {
        lock.release();
      }
    });
    if (!message) return res.status(404).json({ error: 'Письмо не найдено' });
    res.json(message);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/attachment', async (req: AuthRequest, res) => {
  try {
    const account = await getAccount(req, res);
    if (!account) return;
    const folder = String(req.query.folder || 'INBOX');
    const uid = parseInt(String(req.query.uid || ''), 10);
    const index = parseInt(String(req.query.index || ''), 10);
    if (!uid || isNaN(index)) return res.status(400).json({ error: 'uid и index обязательны' });

    const attachment = await withImap(account, async client => {
      const lock = await client.getMailboxLock(folder);
      try {
        const raw = await client.fetchOne(uid, { source: true }, { uid: true });
        if (!raw || !raw.source) return null;
        const parsed: ParsedMail = await simpleParser(raw.source);
        const att = (parsed.attachments || [])[index];
        if (!att) return null;
        return { filename: att.filename || `attachment-${index + 1}`, contentType: att.contentType, content: att.content };
      } finally {
        lock.release();
      }
    });
    if (!attachment) return res.status(404).json({ error: 'Вложение не найдено' });
    res.setHeader('Content-Type', attachment.contentType || 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(attachment.filename)}`);
    res.send(attachment.content);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/message/read', async (req: AuthRequest, res) => {
  try {
    const account = await getAccount(req, res);
    if (!account) return;
    const folder = String(req.body.folder || 'INBOX');
    const uid = parseInt(String(req.body.uid || ''), 10);
    if (!uid) return res.status(400).json({ error: 'uid обязателен' });
    await withImap(account, async client => {
      const lock = await client.getMailboxLock(folder);
      try {
        await client.messageFlagsAdd(uid, ['\\Seen'], { uid: true });
      } finally {
        lock.release();
      }
    });
    res.json({ success: true });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/message/unread', async (req: AuthRequest, res) => {
  try {
    const account = await getAccount(req, res);
    if (!account) return;
    const folder = String(req.body.folder || 'INBOX');
    const uid = parseInt(String(req.body.uid || ''), 10);
    if (!uid) return res.status(400).json({ error: 'uid обязателен' });
    await withImap(account, async client => {
      const lock = await client.getMailboxLock(folder);
      try {
        await client.messageFlagsRemove(uid, ['\\Seen'], { uid: true });
      } finally {
        lock.release();
      }
    });
    res.json({ success: true });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/message', async (req: AuthRequest, res) => {
  try {
    const account = await getAccount(req, res);
    if (!account) return;
    const folder = String(req.body.folder || 'INBOX');
    const uid = parseInt(String(req.body.uid || ''), 10);
    if (!uid) return res.status(400).json({ error: 'uid обязателен' });
    await withImap(account, async client => {
      // Корзину ищем через listTree — только там есть specialUse (list() его не возвращает)
      let trashPath: string | null = null;
      const findTrash = (nodes: any[]): string | null => {
        for (const n of nodes) {
          if (n.specialUse === '\\Trash') return n.path;
          const nested = findTrash(n.folders || []);
          if (nested) return nested;
        }
        return null;
      };
      const tree = await client.listTree();
      trashPath = findTrash((tree as any)?.folders || []);
      // UID MOVE/STORE работают только внутри выбранного ящика — берём mailbox lock
      const lock = await client.getMailboxLock(folder);
      try {
        if (trashPath && trashPath !== folder) {
          await client.messageMove(uid, trashPath, { uid: true });
        } else {
          // messageDelete = пометка \Deleted + expunge одним вызовом
          await client.messageDelete(uid, { uid: true });
        }
      } finally {
        lock.release();
      }
    });
    res.json({ success: true });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// ---- Массовые операции ----

// Перемещение нескольких писем в другую папку
router.post('/messages/move', async (req: AuthRequest, res) => {
  try {
    const account = await getAccount(req, res);
    if (!account) return;
    const folder = String(req.body.folder || 'INBOX');
    const destination = String(req.body.destination || '');
    const uids = (Array.isArray(req.body.uids) ? req.body.uids : []).map(Number).filter((n: number) => n > 0);
    if (!uids.length || !destination) {
      return res.status(400).json({ error: 'uids и destination обязательны' });
    }
    await withImap(account, async client => {
      const lock = await client.getMailboxLock(folder);
      try {
        for (const uid of uids) {
          await client.messageMove(uid, destination, { uid: true });
        }
      } finally {
        lock.release();
      }
    });
    res.json({ success: true, moved: uids.length });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Безвозвратное удаление нескольких писем (из Корзины): \Deleted + expunge
router.delete('/messages', async (req: AuthRequest, res) => {
  try {
    const account = await getAccount(req, res);
    if (!account) return;
    const folder = String(req.body.folder || 'INBOX');
    const uids = (Array.isArray(req.body.uids) ? req.body.uids : []).map(Number).filter((n: number) => n > 0);
    if (!uids.length) return res.status(400).json({ error: 'uids обязательны' });
    await withImap(account, async client => {
      const lock = await client.getMailboxLock(folder);
      try {
        for (const uid of uids) {
          await client.messageDelete(uid, { uid: true });
        }
      } finally {
        lock.release();
      }
    });
    res.json({ success: true, deleted: uids.length });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// ---- Отправка ----

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 }, // 25 МБ на файл
});

router.post('/send', upload.array('files', 10), async (req: AuthRequest, res) => {
  try {
    const accountId = String(req.body.accountId || '');
    const account = (await prisma.mailAccount.findUnique({ where: { id: accountId } })) as MailAccountRow | null;
    if (!account || account.userId !== req.user!.id) {
      return res.status(404).json({ error: 'Аккаунт не найден' });
    }
    const to = String(req.body.to || '').trim();
    const subject = String(req.body.subject || '').trim();
    const html = String(req.body.html || '');
    if (!to) return res.status(400).json({ error: 'Укажите получателя' });
    if (!subject && !html.replace(/<[^>]*>/g, '').trim()) {
      return res.status(400).json({ error: 'Пустое письмо' });
    }

    const transport = nodemailer.createTransport({
      host: account.smtpHost,
      port: account.smtpPort,
      secure: account.secure,
      auth: { user: account.smtpUser, pass: account.smtpPass },
      tls: { rejectUnauthorized: account.rejectUnauthorized },
      connectionTimeout: 30000,
      socketTimeout: 30000,
    });

    const files = (req.files as Express.Multer.File[]) || [];
    await transport.sendMail({
      from: account.label ? `"${account.label}" <${account.email}>` : account.email,
      to,
      cc: String(req.body.cc || '').trim() || undefined,
      subject,
      html,
      text: String(req.body.text || html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()),
      inReplyTo: String(req.body.inReplyTo || '').trim() || undefined,
      references: String(req.body.references || '').trim() || undefined,
      attachments: files.map(f => ({
        filename: Buffer.from(f.originalname, 'latin1').toString('utf8'),
        content: f.buffer,
        contentType: f.mimetype,
      })),
    });
    transport.close();
    res.json({ success: true });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

export default router;
