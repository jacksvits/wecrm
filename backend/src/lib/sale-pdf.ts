import PDFDocument from 'pdfkit';
import fs from 'fs';

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

const MONTHS = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];

// Накладная по бланку: шапка «Кому/От кого», таблица позиций,
// итог, НДС, подписи «Сдал/Принял»
export function buildSalePdf(s: {
  number: number; createdAt: Date; total: number;
  contact: { name: string } | null;
  user: { name: string } | null;
  items: Array<{ quantity: number; price: number; sum: number; product: { name: string; unit: string } }>;
}) {
  const doc = new PDFDocument({ size: 'A4', margin: 50 });
  const fonts = resolveFonts();
  if (fonts) {
    doc.registerFont('reg', fonts.regular);
    doc.registerFont('bold', fonts.bold);
  }
  const d = new Date(s.createdAt);
  const dt = `от «${String(d.getDate()).padStart(2, '0')}» ${MONTHS[d.getMonth()]} ${d.getFullYear()} г.`;

  doc.font('reg').fontSize(10).text(dt, 50, 50, { width: 495, align: 'right' });
  doc.moveDown(2.2);
  doc.font('bold').fontSize(16).text(`НАКЛАДНАЯ № ${s.number}`, { align: 'center' });
  doc.moveDown(1.2);

  const fillLine = (label: string, value: string) => {
    doc.font('bold').fontSize(11).text(label + ' ', { continued: true });
    const rest = 545 - doc.x;
    const uw = Math.max(10, Math.floor(rest / doc.widthOfString('_')));
    doc.font('reg').fontSize(11).text(`${value} ${'_'.repeat(uw)}`);
    doc.moveDown(0.6);
  };
  fillLine('Кому:', s.contact?.name || '—');
  fillLine('От кого:', 'ИП Солопаев Станислав Евгеньевич, г. Псков, ул. Чехова, 6');

  // таблица позиций
  const cols = [
    { x: 50, w: 26, t: '№ п/п' },
    { x: 76, w: 165, t: 'Наименование' },
    { x: 241, w: 72, t: 'Единица измерения' },
    { x: 313, w: 66, t: 'Количество' },
    { x: 379, w: 70, t: 'Цена (руб.)' },
    { x: 449, w: 96, t: 'Сумма (руб.)' },
  ];
  const rowH = 18;
  const headerH = 26;
  const totalRows = Math.max(10, s.items.length);
  const top = doc.y + 8;
  const tableBottom = top + headerH + totalRows * rowH;

  doc.font('bold').fontSize(9);
  cols.forEach(c => doc.text(c.t, c.x + 2, top + 6, { width: c.w - 4, align: 'center' }));
  doc.font('reg').fontSize(9);
  s.items.forEach((it, i) => {
    const y = top + headerH + i * rowH;
    doc.text(String(i + 1), cols[0].x + 2, y + 4, { width: cols[0].w - 4, align: 'center' });
    doc.text(it.product.name, cols[1].x + 2, y + 4, { width: cols[1].w - 4 });
    doc.text(it.product.unit, cols[2].x + 2, y + 4, { width: cols[2].w - 4, align: 'center' });
    doc.text(String(it.quantity), cols[3].x + 2, y + 4, { width: cols[3].w - 4, align: 'right' });
    doc.text(it.price.toFixed(2), cols[4].x + 2, y + 4, { width: cols[4].w - 4, align: 'right' });
    doc.text(it.sum.toFixed(2), cols[5].x + 2, y + 4, { width: cols[5].w - 4, align: 'right' });
  });

  // сетка таблицы
  doc.lineWidth(0.5).strokeColor('#111');
  const hline = (y: number) => { doc.moveTo(50, y).lineTo(545, y).stroke(); };
  const vline = (x: number) => { doc.moveTo(x, top).lineTo(x, tableBottom).stroke(); };
  hline(top);
  hline(top + headerH);
  for (let i = 1; i <= totalRows; i++) hline(top + headerH + i * rowH);
  cols.forEach(c => vline(c.x));
  vline(545);

  doc.font('bold').fontSize(10);
  doc.text('Итого:', 379, tableBottom + 8, { width: 70, align: 'right' });
  doc.text(`${s.total.toFixed(2)}`, 449, tableBottom + 8, { width: 96, align: 'right' });
  doc.font('reg').fontSize(10);
  doc.text('В том числе НДС __________ 0 %', 50, tableBottom + 26, { width: 495, align: 'right' });

  const sy = tableBottom + 60;
  doc.fontSize(9.5);
  doc.text(`Сдал: __________ подпись __________ ${s.user?.name || 'Ф.И.О.'}`, 50, sy, { width: 250 });
  doc.text('Принял: __________ подпись __________ Ф.И.О.', 310, sy, { width: 235 });

  return doc;
}
