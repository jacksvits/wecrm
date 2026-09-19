import { ImapFlow, ImapFlowOptions, FetchMessageObject } from 'imapflow';
import { simpleParser } from 'mailparser';
import pdfParse from 'pdf-parse';
import { prisma } from '../lib/prisma.js';
import { applyAccountingRules } from '../lib/accounting-rules.js';
import {
  extractAmounts,
  extractInn,
  extractDocNumber,
  extractDocDate,
  parseFiscalQr,
  decodeQrFromImage,
} from '../lib/accounting-parse.js';
import { randomUUID } from 'crypto';
import fs from 'fs';
import path from 'path';

interface AccountingWorkerConfig {
  imapHost: string;
  imapPort: number;
  imapUser: string;
  imapPass: string;
  checkIntervalMs: number;
  processedFolder?: string;
  secure?: boolean;
  rejectUnauthorized?: boolean;
  requireTLS?: boolean;
}

/** Папка для вложений финансовых документов */
const UPLOAD_DIR = '/app/uploads/accounting';

/**
 * Простейшее преобразование HTML в текст: убираем теги, скрипты и стили,
 * схлопываем пробелы. Нужно, когда у письма нет text-части.
 */
function htmlToText(html: string): string {
  return html
    .replace(/<(script|style)\b[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|tr|li|h[1-6])>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n\s+/g, '\n')
    .trim();
}

/**
 * AccountingWorker — сервис для создания финансовых документов из писем
 * ящика бухгалтерии по IMAP. По образу EmailWorker: тот же цикл tick,
 * markProcessed, дедупликация, изоляция ошибок на письмо.
 *
 * Отличия: конфиг из AccountingEmailSettings, вместо задач создаются
 * FinanceDocument, контакты не автосоздаются, вложения складываются
 * в /app/uploads/accounting/ и регистрируются как FileAttachment
 * с entityType='finance_document'.
 */
export class AccountingWorker {
  private config: AccountingWorkerConfig;
  private timer?: NodeJS.Timeout;

  constructor(config: AccountingWorkerConfig) {
    this.config = config;
  }

  async start() {
    console.log('[AccountingWorker] Starting...');
    console.log(`[AccountingWorker] Mode: ${this.config.secure !== false ? 'SSL/TLS' : 'STARTTLS'}, Host: ${this.config.imapHost}:${this.config.imapPort}`);
    await this.tick();
    this.timer = setInterval(() => this.tick(), this.config.checkIntervalMs);
  }

  stop() {
    if (this.timer) clearInterval(this.timer);
  }

  private async tick() {
    try {
      await this.processInbox();
    } catch (err) {
      console.error('[AccountingWorker] Error:', err);
    }
  }

  private createClient(): ImapFlow {
    const secure = this.config.secure !== false;
    return new ImapFlow({
      host: this.config.imapHost,
      port: this.config.imapPort,
      secure,
      requireTLS: !secure && (this.config.requireTLS !== false),
      tls: {
        rejectUnauthorized: this.config.rejectUnauthorized !== false,
      },
      auth: { user: this.config.imapUser, pass: this.config.imapPass },
      logger: false,
    } as ImapFlowOptions);
  }

  /**
   * Поиск контакта-контрагента: по email отправителя (поле email или массив emails),
   * затем по ИНН. Автосоздание контакта НЕ выполняется (в отличие от задач).
   */
  private async findContact(senderEmail: string | null, inn: string | null): Promise<string | undefined> {
    if (senderEmail) {
      const byEmail = await prisma.contact.findFirst({
        where: { OR: [{ email: senderEmail }, { emails: { has: senderEmail } }] },
      });
      if (byEmail) return byEmail.id;
    }
    if (inn) {
      const byInn = await prisma.contact.findFirst({ where: { inn } });
      if (byInn) return byInn.id;
    }
    return undefined;
  }

  /**
   * FileAttachment.authorId обязателен — для вложений из писем используем
   * первого пользователя с ролью admin. Если админа нет — null (вложения не пишем).
   */
  private async findAttachmentAuthorId(): Promise<string | null> {
    const admin = await prisma.user.findFirst({
      where: { role: { name: 'admin' } },
      orderBy: { createdAt: 'asc' },
    });
    return admin?.id || null;
  }

  private async processInbox() {
    const client = this.createClient();
    await client.connect();
    const lock = await client.getMailboxLock('INBOX');

    try {
      const uids = (await client.search({ unseen: true } as Parameters<ImapFlow['search']>[0], { uid: true })) as number[] | false;

      if (!uids || uids.length === 0) {
        console.log('[AccountingWorker] No new emails');
        return;
      }

      console.log(`[AccountingWorker] Found ${uids.length} new email(s)`);

      for (const uid of uids) {
        try {
          const message = (await client.fetchOne(uid, { source: true }, { uid: true })) as FetchMessageObject;
          if (!message.source) {
            console.log(`[AccountingWorker] Message ${uid} has no source, skipping`);
            continue;
          }

          const parsed = await simpleParser(message.source);
          // Дедупликация по emailMessageId; fallback с префиксом acc, чтобы не
          // пересекаться с fallback-идентификаторами EmailWorker
          const messageId = parsed.messageId || `fallback-acc-${uid}`;
          const senderEmail = parsed.from?.value[0]?.address?.toLowerCase() || null;
          const senderName = parsed.from?.value[0]?.name || senderEmail || 'Неизвестный отправитель';
          const subject = parsed.subject || '';
          const allAttachments = parsed.attachments || [];
          const realAttachments = (allAttachments as any[]).filter(
            (a: any) => a.filename && a.content && a.content.length > 0
          );

          // Текст письма: text-часть, иначе HTML → текст
          const htmlSource = typeof parsed.html === 'string' ? parsed.html : undefined;
          const body = parsed.text || (htmlSource ? htmlToText(htmlSource) : '');

          // Дедупликация: документ по этому письму уже создан
          const existing = await prisma.financeDocument.findUnique({
            where: { emailMessageId: messageId },
          });
          if (existing) {
            console.log(`[AccountingWorker] Document already exists for message ${messageId}`);
            await this.markProcessed(client, uid);
            continue;
          }

          // Классификация правилами бухгалтерии (fallback внутри: guessDocType + incoming)
          const decision = await applyAccountingRules({
            from: senderEmail || '',
            subject,
            body,
            hasAttachments: realAttachments.length > 0,
          });

          // Текст для извлечения данных: тема + тело + текст из PDF-вложений
          let fullText = `${subject}\n${body}`;
          for (const att of realAttachments) {
            if ((att.contentType || '').toLowerCase() === 'application/pdf') {
              try {
                const pdfData = await pdfParse(att.content);
                if (pdfData?.text) fullText += `\n${pdfData.text}`;
              } catch (pdfErr) {
                console.error(`[AccountingWorker] Failed to parse PDF "${att.filename}":`, pdfErr);
              }
            }
          }

          // Извлечение данных из текста: сумма (максимальная — эвристика «итоговая сумма»),
          // ИНН, номер и дата документа (иначе — дата письма)
          const amounts = extractAmounts(fullText);
          let amount = amounts.length ? Math.max(...amounts) : 0;
          const inn = extractInn(fullText);
          const number = extractDocNumber(fullText);
          let docDate = extractDocDate(fullText) || parsed.date || new Date();

          // Фискальные данные: QR-коды с image-вложений (чеки)
          let fiscalFn: string | undefined;
          let fiscalFd: string | undefined;
          let fiscalFp: string | undefined;
          for (const att of realAttachments) {
            if (!(att.contentType || '').toLowerCase().startsWith('image/')) continue;
            const qrText = await decodeQrFromImage(att.content);
            if (!qrText) continue;
            const fiscal = parseFiscalQr(qrText);
            if (!fiscal) continue;
            fiscalFn = fiscalFn || fiscal.fn;
            fiscalFd = fiscalFd || fiscal.fd;
            fiscalFp = fiscalFp || fiscal.fp;
            // Сумма и дата из QR дополняют текст, только если там не найдены
            if (!amount && fiscal.amount) amount = fiscal.amount;
            if (!extractDocDate(fullText) && fiscal.date) docDate = fiscal.date;
            console.log(`[AccountingWorker] Fiscal QR decoded from "${att.filename}": fn=${fiscal.fn}, fd=${fiscal.fd}, fp=${fiscal.fp}, amount=${fiscal.amount}`);
          }

          // Контрагент: контакт из правила, иначе поиск по email/ИНН; автосоздания нет
          let contactId = decision.contactId;
          if (!contactId) {
            contactId = await this.findContact(senderEmail, inn);
          }

          const doc = await prisma.financeDocument.create({
            data: {
              type: decision.docType,
              direction: decision.direction,
              number,
              date: docDate,
              amount,
              counterpartyName: contactId ? undefined : senderName,
              counterpartyInn: inn,
              contactId,
              status: 'new',
              source: 'email',
              emailMessageId: messageId,
              emailFrom: senderEmail,
              emailSubject: subject,
              fiscalFn,
              fiscalFd,
              fiscalFp,
            },
          });

          console.log(`[AccountingWorker] Created document ${doc.id}: type=${doc.type}, amount=${doc.amount}, from ${senderEmail}`);

          // Вложения: сохраняем на диск и регистрируем как FileAttachment документа
          if (realAttachments.length > 0) {
            const authorId = await this.findAttachmentAuthorId();
            if (!authorId) {
              console.warn('[AccountingWorker] No admin user found, attachments not saved');
            } else {
              if (!fs.existsSync(UPLOAD_DIR)) {
                fs.mkdirSync(UPLOAD_DIR, { recursive: true });
              }
              for (const att of realAttachments) {
                const ext = path.extname(att.filename || '') || '';
                const filename = `${randomUUID()}${ext}`;
                fs.writeFileSync(path.join(UPLOAD_DIR, filename), att.content);
                await prisma.fileAttachment.create({
                  data: {
                    filename,
                    originalName: att.filename || 'attachment',
                    mimeType: att.contentType || 'application/octet-stream',
                    size: att.content.length,
                    path: `/uploads/accounting/${filename}`,
                    entityType: 'finance_document',
                    entityId: doc.id,
                    authorId,
                  },
                });
              }
              console.log(`[AccountingWorker] Saved ${realAttachments.length} attachment(s) for document ${doc.id}`);
            }
          }

          await this.markProcessed(client, uid);
        } catch (err) {
          // Письмо остаётся непрочитанным: повтор на следующем тике, остальные письма не блокируются
          console.error(`[AccountingWorker] Failed to process UID ${uid}:`, err);
        }
      }
    } finally {
      lock.release();
      await client.logout();
    }
  }

  /**
   * Перемещает письмо в processedFolder (если настроена) через messageMove;
   * если письмо осталось в INBOX — помечает \Seen. Логика как в EmailWorker.
   */
  private async markProcessed(client: ImapFlow, uid: number) {
    try {
      if (this.config.processedFolder) {
        console.log(`[AccountingWorker] Moving UID ${uid} to folder "${this.config.processedFolder}"`);
        await client.messageMove(uid, this.config.processedFolder, { uid: true });
        console.log(`[AccountingWorker] UID ${uid} moved successfully`);
      }

      // Проверяем, осталось ли письмо в INBOX (некоторые серверы не удаляют при MOVE)
      try {
        const stillThere = await client.fetchOne(uid, { uid: true }, { uid: true });
        if (stillThere) {
          console.log(`[AccountingWorker] UID ${uid} still in INBOX, marking as \\Seen`);
          await client.messageFlagsSet(uid, ['\\Seen'], { uid: true });
          console.log(`[AccountingWorker] UID ${uid} marked as \\Seen`);
        }
      } catch {
        // Письмо удалено из INBOX — это нормально
      }
    } catch (err: any) {
      console.error(`[AccountingWorker] Failed to process UID ${uid}:`, err.message || err);
    }
  }
}
