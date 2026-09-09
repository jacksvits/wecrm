import PDFDocument from 'pdfkit';
import fs from 'fs';
import type { Response } from 'express';
import { htmlToText } from './html-to-text.js';

// Фирменная палитра WeLANS: чёрный + зелёный
const BRAND = {
  black: '#000000',
  green: '#00A651',
  greenDark: '#007A3D',
  dark: '#1A1A1A',
  gray: '#666666',
  grayLight: '#B9C4BB',
  light: '#F0F7F1',
  line: '#DDE8DF',
  white: '#FFFFFF',
};

const FONT_CANDIDATES = [
  {
    regular: '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
    bold: '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',
  },
  {
    regular: '/usr/share/fonts/dejavu/DejaVuSans.ttf',
    bold: '/usr/share/fonts/dejavu/DejaVuSans-Bold.ttf',
  },
];

function resolveFonts(): { regular: string; bold: string } | null {
  for (const c of FONT_CANDIDATES) {
    if (fs.existsSync(c.regular) && fs.existsSync(c.bold)) return c;
  }
  return null;
}

const STATUS_LABELS: Record<string, string> = {
  open: 'Открыта', in_progress: 'В работе', load: 'В работе',
  done: 'Выполнена', cancelled: 'Отменена', win: 'Завершена',
};
const PRIORITY_LABELS: Record<string, string> = {
  low: 'Низкий', medium: 'Средний', high: 'Высокий', urgent: 'Срочный',
};

const fmtDateTime = (d: Date | null | undefined) =>
  d ? new Date(d).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';
const fmtDay = (d: Date | null | undefined) =>
  d ? new Date(d).toLocaleDateString('ru-RU') : '—';

interface PdfComment { author?: { name?: string } | null; content: string; createdAt: Date }
interface PdfTask {
  id: string; title: string; description?: string | null; status: string; priority: string;
  createdAt: Date; updatedAt: Date; dueDate?: Date | null;
  creator?: { name?: string } | null;
  assignees?: Array<{ user?: { name?: string } | null }>;
  curators?: Array<{ user?: { name?: string } | null }>;
  project?: { name?: string } | null;
  contact?: { name?: string; company?: string | null } | null;
  deal?: { title?: string } | null;
  comments: PdfComment[];
}

export async function buildTaskPdf(task: PdfTask, user: { name?: string }, res: Response): Promise<void> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: 40, bottom: 60, left: 50, right: 50 },
      bufferPages: true,
      info: { Title: `WeLANS — Задача: ${task.title}`, Author: 'WeLANS CRM', Creator: 'WeLANS CRM' },
    });
    const fonts = resolveFonts();
    const F = { regular: 'Helvetica', bold: 'Helvetica-Bold' } as { regular: string; bold: string };
    if (fonts) {
      doc.registerFont('regular', fonts.regular);
      doc.registerFont('bold', fonts.bold);
      F.regular = 'regular';
      F.bold = 'bold';
    }
    doc.on('error', reject);
    doc.on('end', () => resolve());
    doc.pipe(res);

    const W = doc.page.width - 100;

    const drawPageHeader = () => {
      doc.save().rect(0, 0, doc.page.width, 74).fill(BRAND.black).restore();
      doc.fill(BRAND.white).font(F.bold).fontSize(22).text('WeLANS', 50, 18);
      doc.font(F.regular).fontSize(9).fill(BRAND.green).text('welans.ru', 50, 46);
      doc.font(F.regular).fontSize(9).fill(BRAND.grayLight)
        .text(`Отчёт сформирован: ${fmtDateTime(new Date())}${user?.name ? ` · ${user.name}` : ''}`, 50, 18, { width: W, align: 'right' });
      doc.y = 92;
    };
    drawPageHeader();

    doc.font(F.bold).fontSize(16).fill(BRAND.black).text(task.title, { width: W });
    doc.moveDown(0.4);
    doc.save().moveTo(50, doc.y).lineTo(50 + 60, doc.y).lineWidth(3).strokeColor(BRAND.green).stroke().restore();
    doc.moveDown(0.6);

    const meta: Array<[string, string]> = [
      ['Статус', STATUS_LABELS[task.status] ?? task.status],
      ['Приоритет', PRIORITY_LABELS[task.priority] ?? task.priority],
      ['Создана', fmtDay(task.createdAt)],
      ['Дедлайн', fmtDay(task.dueDate)],
      ['Постановщик', task.creator?.name ?? '—'],
      ['Исполнители', task.assignees?.length ? task.assignees.map((a) => a.user?.name).filter(Boolean).join(', ') : '—'],
      ['Кураторы', task.curators?.length ? task.curators.map((c) => c.user?.name).filter(Boolean).join(', ') : '—'],
    ];
    if (task.project?.name) meta.push(['Проект', task.project.name]);
    if (task.contact) meta.push(['Контакт', task.contact.company ? `${task.contact.name} (${task.contact.company})` : (task.contact.name ?? '—')]);
    if (task.deal?.title) meta.push(['Сделка', task.deal.title]);

    meta.forEach(([label, value]) => {
      doc.font(F.regular).fontSize(9).fill(BRAND.gray).text(`${label}: `, { continued: true });
      doc.font(F.bold).fontSize(10).fill(BRAND.dark).text(value, { width: W });
    });
    doc.moveDown(0.4);
    doc.save().moveTo(50, doc.y).lineTo(50 + W, doc.y).lineWidth(0.8).strokeColor(BRAND.line).stroke().restore();
    doc.moveDown(0.6);

    const heading = (t: string) => {
      doc.font(F.bold).fontSize(13).fill(BRAND.black).text(t, { width: W });
      doc.save().moveTo(50, doc.y + 2).lineTo(50 + 40, doc.y + 2).lineWidth(2).strokeColor(BRAND.green).stroke().restore();
      doc.moveDown(0.5);
    };
    const ensureSpace = (h: number) => { if (doc.y + h > doc.page.height - 70) doc.addPage(); };

    heading('Описание');
    const desc = htmlToText(task.description);
    if (desc) {
      ensureSpace(60);
      doc.font(F.regular).fontSize(10.5).fill(BRAND.dark).text(desc, { width: W, lineGap: 3 });
    } else {
      doc.font(F.regular).fontSize(10).fill(BRAND.gray).text('Описание отсутствует', { width: W });
    }
    doc.moveDown(0.8);

    heading(`Переписка (${task.comments.length})`);
    if (!task.comments.length) {
      doc.font(F.regular).fontSize(10).fill(BRAND.gray).text('Сообщений нет', { width: W });
    }
    task.comments.forEach((c) => {
      const body = htmlToText(c.content);
      const blockH = 34 + doc.heightOfString(body, { width: W - 26 });
      ensureSpace(blockH + 10);
      const top = doc.y;
      doc.save()
        .roundedRect(50, top, W, blockH, 6).fill(BRAND.light)
        .moveTo(50, top + 6).lineTo(50, top + blockH - 6).lineWidth(3).strokeColor(BRAND.green).stroke()
        .restore();
      doc.font(F.bold).fontSize(10).fill(BRAND.black).text(c.author?.name ?? 'Пользователь', 64, top + 8, { width: W - 160 });
      doc.font(F.regular).fontSize(8.5).fill(BRAND.gray).text(fmtDateTime(c.createdAt), 64, top + 9, { width: W - 26, align: 'right' });
      doc.font(F.regular).fontSize(10).fill(BRAND.dark).text(body, 64, top + 24, { width: W - 26, lineGap: 2 });
      doc.y = top + blockH + 8;
    });
    doc.moveDown(0.3);
    doc.font(F.regular).fontSize(8.5).fill(BRAND.gray).text('Внутренние (инкогнито) сообщения не включены в отчёт.', { width: W });

    const range = doc.bufferedPageRange();
    for (let i = range.start; i < range.start + range.count; i++) {
      doc.switchToPage(i);
      doc.save().moveTo(50, doc.page.height - 45).lineTo(50 + W, doc.page.height - 45).lineWidth(0.6).strokeColor(BRAND.line).stroke().restore();
      doc.font(F.regular).fontSize(8).fill(BRAND.gray).text('WeLANS · welans.ru', 50, doc.page.height - 38, { lineBreak: false });
      doc.text(`Страница ${i + 1} из ${range.count}`, 50, doc.page.height - 38, { width: W, align: 'right', lineBreak: false });
    }
    doc.end();
  });
}
