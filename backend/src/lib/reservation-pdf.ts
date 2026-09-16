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

export function buildReservationPdf(r: {
  number: number; createdAt: Date; status: string; total: number; comment: string | null;
  contact: { name: string }; warehouse: { name: string }; user: { name: string } | null;
  items: Array<{ quantity: number; price: number; sum: number; product: { name: string; unit: string } }>;
}) {
  const doc = new PDFDocument({ size: 'A4', margin: 50 });
  const fonts = resolveFonts();
  if (fonts) {
    doc.registerFont('reg', fonts.regular);
    doc.registerFont('bold', fonts.bold);
  }
  const BRAND = '#2563eb';

  doc.font('bold').fontSize(18).fillColor(BRAND).text('WeLANS');
  doc.font('reg').fontSize(9).fillColor('#555')
    .text('ИП Солопаев Станислав Евгеньевич, г. Псков, ул. Чехова, 6');
  doc.moveDown(0.5);
  doc.font('bold').fontSize(14).fillColor('#111').text(`Резерв товара №${r.number}`);
  doc.moveDown(0.3);
  doc.font('reg').fontSize(10).fillColor('#333');
  doc.text(`Дата: ${new Date(r.createdAt).toLocaleString('ru-RU')}`);
  doc.text(`Склад: ${r.warehouse?.name || '—'}`);
  doc.text(`Менеджер: ${r.user?.name || '—'}`);
  doc.text(`На чьё имя: ${r.contact?.name || '—'}`);
  doc.text(`Статус: ${r.status === 'held' ? 'Отложено' : 'Выдано'}`);
  if (r.comment) doc.text(`Комментарий: ${r.comment}`);
  doc.moveDown();

  const top = doc.y;
  doc.font('bold').fontSize(10);
  doc.text('№', 50, top, { width: 25 });
  doc.text('Товар', 80, top, { width: 235 });
  doc.text('Кол-во', 320, top, { width: 65, align: 'right' });
  doc.text('Цена', 390, top, { width: 70, align: 'right' });
  doc.text('Сумма', 465, top, { width: 80, align: 'right' });
  doc.moveTo(50, top + 16).lineTo(545, top + 16).lineWidth(0.5).strokeColor(BRAND).stroke();
  doc.font('reg');
  let y = top + 22;
  r.items.forEach((it, i) => {
    doc.text(String(i + 1), 50, y, { width: 25 });
    doc.text(it.product.name, 80, y, { width: 235 });
    doc.text(`${it.quantity} ${it.product.unit}`, 320, y, { width: 65, align: 'right' });
    doc.text(it.price.toFixed(2), 390, y, { width: 70, align: 'right' });
    doc.text(it.sum.toFixed(2), 465, y, { width: 80, align: 'right' });
    y = doc.y + 6;
  });
  doc.moveTo(50, y).lineTo(545, y).lineWidth(0.5).stroke();
  doc.moveDown(0.6);
  doc.font('bold').fontSize(12).text(`Итого: ${r.total.toFixed(2)} ₽`, { align: 'right' });
  return doc;
}
