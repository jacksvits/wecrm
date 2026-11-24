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

// Системы налогообложения и ставки НДС — зеркало списков из RequisitesSettings.tsx
export const TAX_SYSTEMS: Record<string, string> = {
  osno: 'ОСНО',
  usn6: 'УСН 6%',
  usn15: 'УСН 15%',
  ausn8: 'АУСН 8%',
  ausn22: 'АУСН 22%',
  psn: 'ПСН',
  npd4: 'НПД 4%',
  npd6: 'НПД 6%',
  esxhn: 'ЕСХН',
};

const UNITS = ['', 'один', 'два', 'три', 'четыре', 'пять', 'шесть', 'семь', 'восемь', 'девять'];
const UNITS_F = ['', 'одна', 'две', 'три', 'четыре', 'пять', 'шесть', 'семь', 'восемь', 'девять'];
const TEENS = ['десять', 'одиннадцать', 'двенадцать', 'тринадцать', 'четырнадцать', 'пятнадцать', 'шестнадцать', 'семнадцать', 'восемнадцать', 'девятнадцать'];
const TENS = ['', '', 'двадцать', 'тридцать', 'сорок', 'пятьдесят', 'шестьдесят', 'семьдесят', 'восемьдесят', 'девяносто'];
const HUNDREDS = ['', 'сто', 'двести', 'триста', 'четыреста', 'пятьсот', 'шестьсот', 'семьсот', 'восемьсот', 'девятьсот'];

function three(n: number, feminine: boolean): string {
  const parts: string[] = [];
  const h = Math.floor(n / 100);
  const rem = n % 100;
  if (h) parts.push(HUNDREDS[h]);
  if (rem >= 10 && rem < 20) {
    parts.push(TEENS[rem - 10]);
  } else {
    const t = Math.floor(rem / 10);
    const u = rem % 10;
    if (t) parts.push(TENS[t]);
    if (u) parts.push(feminine ? UNITS_F[u] : UNITS[u]);
  }
  return parts.join(' ');
}

function plural(n: number, forms: [string, string, string]): string {
  const m10 = n % 10;
  const m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return forms[0];
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return forms[1];
  return forms[2];
}

// Сумма прописью: «Пятнадцать тысяч рублей 00 копеек»
export function amountInWords(amount: number): string {
  const rub = Math.floor(amount + 1e-9);
  const kop = Math.min(99, Math.round((amount - rub) * 100));
  const parts: string[] = [];
  const millions = Math.floor(rub / 1000000);
  const thousands = Math.floor((rub % 1000000) / 1000);
  const rest = rub % 1000;
  if (millions) parts.push(three(millions, false), plural(millions, ['миллион', 'миллиона', 'миллионов']));
  if (thousands) parts.push(three(thousands, true), plural(thousands, ['тысяча', 'тысячи', 'тысяч']));
  if (rest || parts.length === 0) parts.push(three(rest, false));
  const str =
    parts.join(' ') +
    ' ' +
    plural(rub, ['рубль', 'рубля', 'рублей']) +
    ' ' +
    String(kop).padStart(2, '0') +
    ' ' +
    plural(kop, ['копейка', 'копейки', 'копеек']);
  return str.charAt(0).toUpperCase() + str.slice(1);
}

const fmt = (n: number) => n.toFixed(2).replace('.', ',');

const dateRu = (d: Date) => `«${String(d.getDate()).padStart(2, '0')}» ${MONTHS[d.getMonth()]} ${d.getFullYear()} г.`;
const dateShort = (d: Date) => `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()}`;

// Счёт на оплату по бланку из реквизитов тенанта (Настройки → Системные → Реквизиты):
// образец платёжного поручения, поставщик/покупатель, позиции, итоги с учётом
// системы налогообложения и ставки НДС; «действителен до» = дата счёта + 7 дней.
export function buildInvoicePdf(
  r: {
    number: number;
    createdAt: Date;
    total: number;
    contact: { name: string; inn?: string | null; ogrn?: string | null; legalAddress?: string | null } | null;
    user: { name: string } | null;
    items: Array<{ quantity: number; price: number; sum: number; product: { name: string; unit: string } }>;
  },
  req: {
    fullName?: string;
    inn?: string;
    ogrn?: string;
    bankName?: string;
    bik?: string;
    account?: string;
    corrAccount?: string;
    legalAddress?: string;
    taxSystem?: string;
    vatRate?: string;
  } | null,
) {
  const doc = new PDFDocument({ size: 'A4', margin: 50 });
  const fonts = resolveFonts();
  if (fonts) {
    doc.registerFont('reg', fonts.regular);
    doc.registerFont('bold', fonts.bold);
  }

  const billDate = new Date(r.createdAt);
  const validUntil = new Date(billDate);
  validUntil.setDate(validUntil.getDate() + 7);

  const taxSystem = req?.taxSystem || 'osno';
  const vatRate = req?.vatRate || 'none';
  // НДС применяется только на ОСНО с выбранной ставкой; остальные режимы — «Без налога (НДС)»
  const vatPct = taxSystem === 'osno' && vatRate !== 'none' ? Number(vatRate) : 0;
  const subtotal = r.total;
  const vatSum = vatPct ? Math.round(subtotal * vatPct) / 100 : 0;
  const grand = Math.round((subtotal + vatSum) * 100) / 100;

  // === Верхнее предупреждение ===
  doc.font('reg').fontSize(8).fillColor('#555').text(
    `Внимание! Счёт действителен до ${dateRu(validUntil).replace(/«|»/g, '"').replace(' г.', '')}. ` +
      'Оплата данного счёта означает согласие с условиями поставки товара. Уведомление об оплате обязательно, ' +
      'в противном случае не гарантируется наличие товара на складе. Товар отпускается по факту прихода денег ' +
      'на р/с Поставщика, самовывозом, при наличии доверенности и паспорта.',
    50,
    42,
    { width: 495 },
  );

  const hasReq = !!(req && (req.fullName || req.inn || req.bankName));

  // === Образец заполнения платёжного поручения ===
  let y = doc.y + 10;
  doc.font('bold').fontSize(9).fillColor('#111').text('Образец заполнения платёжного поручения', 50, y);
  y += 14;
  doc.font('reg').fontSize(8.5);
  const rowH = 26;
  const cell = (x: number, w: number, label: string, value: string, lw = 0.5) => {
    doc.lineWidth(lw).strokeColor('#111').rect(x, y, w, rowH).stroke();
    doc.font('reg').fontSize(6.5).fillColor('#555').text(label, x + 3, y + 3, { width: w - 6 });
    doc.font('reg').fontSize(9).fillColor('#111').text(value || '—', x + 3, y + 13, { width: w - 6 });
  };
  const L = 50;
  const W = 495;
  const c1 = 210;
  const c2 = 140;
  const c3 = W - c1 - c2;
  if (hasReq) {
    cell(L, c1, 'Банк получателя', req!.bankName || '');
    cell(L + c1, c2, 'БИК', req!.bik || '');
    cell(L + c1 + c2, c3, 'Сч. №', req!.corrAccount || '');
    y += rowH;
    cell(L, c1, 'ИНН', req!.inn || '');
    cell(L + c1, c2, 'КПП', '');
    cell(L + c1 + c2, c3, 'Срок плат.', '5');
    y += rowH;
    cell(L, W, 'Получатель', req!.fullName || '');
    y += rowH;
    cell(L, c1, 'Вид оп.', '01');
    cell(L + c1, W - c1, 'Назначение платежа', `Оплата заказа клиента №We-${r.number} от ${dateShort(billDate)}`);
    y += rowH;
  } else {
    cell(L, W, 'Реквизиты', 'Реквизиты организации не заполнены (Настройки → Системные → Реквизиты)');
    y += rowH;
  }

  // === Заголовок ===
  y += 16;
  doc.font('bold').fontSize(14).text(`Счёт на оплату № We-${r.number}`, L, y, { width: W, align: 'center' });
  y = doc.y + 2;
  doc.font('reg').fontSize(11).text(dateRu(billDate), L, y, { width: W, align: 'center' });
  y = doc.y + 12;

  // === Поставщик / Покупатель ===
  const joinParts = (parts: Array<string | null | undefined>) => parts.filter((x): x is string => !!x).join(', ');
  const supplier = hasReq
    ? joinParts([
        req!.fullName,
        req!.inn ? `ИНН ${req!.inn}` : '',
        req!.ogrn ? `ОГРН ${req!.ogrn}` : '',
        req!.legalAddress,
      ]) || '—'
    : '— (заполните реквизиты в настройках)';
  const buyer = joinParts([
    r.contact?.name || '—',
    r.contact?.inn ? `ИНН ${r.contact.inn}` : '',
    r.contact?.ogrn ? `ОГРН ${r.contact.ogrn}` : '',
    r.contact?.legalAddress || '',
  ]);
  doc.font('bold').fontSize(9.5).text('Поставщик:', L, y, { width: 70, continued: true });
  doc.font('reg').text(` ${supplier}`, { width: W - 70 });
  y = doc.y + 4;
  doc.font('bold').fontSize(9.5).text('Покупатель:', L, y, { width: 70, continued: true });
  doc.font('reg').text(` ${buyer}`, { width: W - 70 });
  y = doc.y + 4;
  doc.font('reg').fontSize(9).fillColor('#555')
    .text(`Система налогообложения: ${TAX_SYSTEMS[taxSystem] || taxSystem}${vatPct ? `, НДС ${vatPct}%` : ''}`);
  y = doc.y + 8;
  doc.fillColor('#111');

  // === Таблица позиций ===
  const cols = [
    { x: L, w: 25, t: '№' },
    { x: L + 25, w: 215, t: 'Товары (работы, услуги)' },
    { x: L + 240, w: 60, t: 'Количество' },
    { x: L + 300, w: 45, t: 'Ед.' },
    { x: L + 345, w: 75, t: 'Цена' },
    { x: L + 420, w: 75, t: 'Сумма' },
  ];
  const headerH = 22;
  const rowH2 = 16;
  const rows = Math.max(1, r.items.length);
  const tableBottom = y + headerH + rows * rowH2;

  // Если таблица не помещается на текущей странице — переносим
  if (tableBottom > doc.page.height - 220) {
    doc.addPage();
    y = 50;
  }

  doc.lineWidth(0.5).strokeColor('#111');
  const hline = (yy: number) => { doc.moveTo(L, yy).lineTo(L + W, yy).stroke(); };
  const vline = (x: number, yFrom: number, yTo: number) => { doc.moveTo(x, yFrom).lineTo(x, yTo).stroke(); };
  hline(y);
  hline(y + headerH);
  hline(y + headerH + rows * rowH2);
  cols.forEach((c) => vline(c.x, y, y + headerH + rows * rowH2));
  vline(L + W, y, y + headerH + rows * rowH2);

  doc.font('bold').fontSize(8.5);
  cols.forEach((c) => doc.text(c.t, c.x + 3, y + 6, { width: c.w - 6, align: c.x === L ? 'center' : c.w <= 60 ? 'center' : 'right' }));
  doc.font('reg').fontSize(9);
  r.items.forEach((it, i) => {
    const ry = y + headerH + i * rowH2;
    doc.text(String(i + 1), cols[0].x + 3, ry + 3, { width: cols[0].w - 6, align: 'center' });
    doc.text(it.product.name, cols[1].x + 3, ry + 3, { width: cols[1].w - 6 });
    doc.text(String(it.quantity), cols[2].x + 3, ry + 3, { width: cols[2].w - 6, align: 'right' });
    doc.text(it.product.unit || 'шт', cols[3].x + 3, ry + 3, { width: cols[3].w - 6, align: 'center' });
    doc.text(fmt(it.price), cols[4].x + 3, ry + 3, { width: cols[4].w - 6, align: 'right' });
    doc.text(fmt(it.sum), cols[5].x + 3, ry + 3, { width: cols[5].w - 6, align: 'right' });
  });

  // === Итоги ===
  let ty = y + headerH + rows * rowH2 + 8;
  const tline = (label: string, value: string, bold = false) => {
    doc.font(bold ? 'bold' : 'reg').fontSize(10);
    doc.text(`${label} ${value}`, L, ty, { width: W, align: 'right' });
    ty = doc.y + 3;
  };
  tline('Итого:', fmt(subtotal));
  if (vatPct) {
    tline(`В том числе НДС ${vatPct}%:`, fmt(vatSum));
    tline('Всего к оплате:', fmt(grand), true);
  } else {
    tline('Без налога (НДС):', fmt(subtotal));
    tline('Всего к оплате:', fmt(subtotal), true);
  }

  // === Сумма прописью ===
  ty += 4;
  doc.font('reg').fontSize(9.5).fillColor('#111');
  const grandForWords = vatPct ? grand : subtotal;
  doc.text(
    `Всего наименований ${r.items.length}, на сумму ${fmt(grandForWords)} руб.`,
    L,
    ty,
    { width: W },
  );
  ty = doc.y + 2;
  doc.font('bold').text(amountInWords(grandForWords));
  ty = doc.y + 16;

  // === Подписи ===
  if (ty > doc.page.height - 110) {
    doc.addPage();
    ty = 60;
  }
  doc.font('reg').fontSize(9.5);
  doc.text('Генеральный директор ____________________ / ____________________ /', L, ty, { width: W });
  ty += 18;
  doc.text('Бухгалтер ____________________ / ____________________ /', L, ty, { width: W });
  ty += 18;
  doc.text(`Менеджер: ${r.user?.name || '—'}`, L, ty, { width: W });

  return doc;
}
