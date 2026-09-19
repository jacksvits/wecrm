import sharp from 'sharp';
import jsQR from 'jsqr';

/**
 * Чистые функции парсинга содержимого писем/документов бухгалтерии.
 * Никакого IMAP и обращений к БД — только работа с текстом и буферами.
 */

/** Результат разбора фискального QR-кода чека (формат ФНС) */
export interface FiscalQrData {
  amount?: number; // s — сумма чека
  date?: Date;     // t — дата/время чека
  fn?: string;     // fn — номер фискального накопителя
  fd?: string;     // i  — номер фискального документа
  fp?: string;     // fp — фискальный признак
}

/**
 * Извлекает суммы из текста: ищет числа после ключевых слов
 * «Итого», «Всего к оплате», «Сумма», «на сумму».
 * Поддерживаемые форматы: «1 234 567,89», «1 234 567.89», «1234,56», «1234.56» (руб. опционально).
 */
export function extractAmounts(text: string): number[] {
  const amounts: number[] = [];
  // Ключевая фраза, затем необязательные служебные символы, затем число.
  // «сумма(?!\s+ндс)» — исключаем строку «СУММА НДС 22%», иначе ставка НДС
  // захватывалась как сумма документа; (?!\s*%) после числа — защита от любых
  // процентов рядом с ключевыми словами.
  // Число: либо с разделителями тысяч («1 234 567,89»), либо простое («1234.56»)
  const re = /(?:итого|всего\s+к\s+оплате|к\s+оплате|на\s+сумму|сумма(?!\s+ндс))[^\d\n]{0,30}?(\d{1,3}(?:[ \u00a0]\d{3})+(?:[.,]\d{1,2})?|\d+(?:[.,]\d{1,2})?)(?!\s*%)/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    const value = parseAmount(m[1]);
    if (value !== null && value > 0) amounts.push(value);
  }
  return amounts;
}

/** Разбирает строку суммы «1 234 567,89» / «1234.56» в число */
function parseAmount(raw: string): number | null {
  // Убираем пробелы-разделители тысяч (в т.ч. неразрывные), запятую меняем на точку
  const normalized = raw.replace(/[ \u00a0]/g, '').replace(',', '.');
  const value = Number.parseFloat(normalized);
  return Number.isFinite(value) ? value : null;
}

/**
 * Извлекает ИНН (10 или 12 цифр) из текста.
 * Сначала ищет с контекстом «ИНН», затем — любое подходящее число.
 */
export function extractInn(text: string): string | null {
  // Контекстный поиск: «ИНН 7707083893», «ИНН: 7707083893», «ИНН/КПП 7707083893»
  const ctx = text.match(/инн[^\d]{0,10}(\d{10}|\d{12})\b/i);
  if (ctx) return ctx[1];
  // Запасной вариант: первое число из 10/12 цифр, не являющееся частью более длинного
  const any = text.match(/\b(\d{10}|\d{12})\b/);
  return any ? any[1] : null;
}

/**
 * Извлекает номер документа: «Счёт № 123», «Акт № 45/6», «УПД № А-12», «№ 78 от 12.01.2026».
 */
export function extractDocNumber(text: string): string | null {
  // Сначала ищем номер с явным типом документа
  const typed = text.match(/(?:сч[её]т(?:-фактура)?|акт|упд|универсальный\s+передаточный\s+документ|накладная|чек)\s*(?:на\s+оплату)?\s*[№#]\s*:?\s*([A-Za-zА-Яа-яЁё0-9][\w\/\\-]*)/i);
  if (typed) return typed[1];
  // Затем — обобщённый «№ … [от …]» (двоеточие после № допустимо: «Чек №: 8470»)
  const generic = text.match(/[№#]\s*:?\s*([A-Za-zА-Яа-яЁё0-9][\w\/\\-]*)/);
  return generic ? generic[1] : null;
}

const MONTHS_RU: Record<string, number> = {
  'января': 0, 'февраля': 1, 'марта': 2, 'апреля': 3, 'мая': 4, 'июня': 5,
  'июля': 6, 'августа': 7, 'сентября': 8, 'октября': 9, 'ноября': 10, 'декабря': 11,
};

/**
 * Извлекает дату документа: формат «dd.mm.yyyy» (предпочтительно после «от»)
 * или словесный «от 12 января 2026».
 */
export function extractDocDate(text: string): Date | null {
  // Словесный формат: «от 12 января 2026»
  const verbal = text.match(/от\s+(\d{1,2})\s+([а-яё]+)\s+(\d{4})/i);
  if (verbal) {
    const month = MONTHS_RU[verbal[2].toLowerCase()];
    if (month !== undefined) {
      const d = new Date(Number(verbal[3]), month, Number(verbal[1]));
      if (!Number.isNaN(d.getTime())) return d;
    }
  }
  // Числовой формат: сначала после «от», затем любой dd.mm.yyyy
  const afterOt = text.match(/от\s+(\d{1,2})[.\/](\d{1,2})[.\/](\d{4})/);
  const numeric = afterOt || text.match(/\b(\d{1,2})[.\/](\d{1,2})[.\/](\d{4})\b/);
  if (numeric) {
    const d = new Date(Number(numeric[3]), Number(numeric[2]) - 1, Number(numeric[1]));
    if (!Number.isNaN(d.getTime())) return d;
  }
  return null;
}

/**
 * Разбирает строку фискального QR-кода чека (формат ФНС):
 * «t=20260112T1530&s=1234.56&fn=9960440302956321&i=12345&fp=1234567890&n=1»
 * (i = ФД — номер фискального документа, n = тип операции).
 * Возвращает null, если строка не похожа на фискальный QR.
 */
export function parseFiscalQr(qr: string): FiscalQrData | null {
  if (!qr || !qr.includes('fn=') || !qr.includes('fp=')) return null;
  const params = new URLSearchParams(qr.startsWith('?') ? qr.slice(1) : qr);
  const result: FiscalQrData = {};

  const s = params.get('s');
  if (s) {
    const amount = Number.parseFloat(s.replace(',', '.'));
    if (Number.isFinite(amount)) result.amount = amount;
  }

  const t = params.get('t');
  if (t) {
    // Формат: yyyyMMddTHHmm или yyyyMMddTHHmmss
    const m = t.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})?$/);
    if (m) {
      const d = new Date(
        Number(m[1]), Number(m[2]) - 1, Number(m[3]),
        Number(m[4]), Number(m[5]), Number(m[6] || 0),
      );
      if (!Number.isNaN(d.getTime())) result.date = d;
    }
  }

  const fn = params.get('fn');
  if (fn) result.fn = fn;
  const fd = params.get('i'); // i — номер фискального документа (ФД)
  if (fd) result.fd = fd;
  const fp = params.get('fp');
  if (fp) result.fp = fp;

  // Хотя бы fn и fp обязаны распознаться — иначе это не фискальный QR
  if (!result.fn && !result.fp) return null;
  return result;
}

/**
 * Ищет в тексте письма фискальную ссылку/строку формата ФНС
 * («t=20260806T120800&s=1500.00&fn=...&i=...&fp=...&n=1») — такие ссылки
 * ОФД вставляют в письма с электронными чеками (1-ОФД, Такском и др.).
 * Надёжнее QR-картинки: сумма и реквизиты заданы в тексте явно.
 */
export function extractFiscalFromText(text: string): FiscalQrData | null {
  const m = text.match(/t=\d{8}T\d{4,6}&s=[\d.,]+&fn=\d+&i=\d+&fp=\d+(?:&n=\d+)?/);
  if (!m) return null;
  return parseFiscalQr(m[0]);
}

/**
 * Извлекает название контрагента-организации из текста:
 * «ООО "Ромашка"», «АО «Газпром»», «ИП Иванов И.И.»
 */
export function extractCounterparty(text: string): string | null {
  const m = text.match(/(ООО|АО|ПАО|ЗАО|ОАО|НКО|ФОНД)\s*[«"„]([^»"“\n]{2,60}?)[»"“]/);
  if (m) return `${m[1]} «${m[2].trim()}»`;
  const ip = text.match(/(ИП)\s+([А-ЯЁ][а-яё]+(?:\s+[А-ЯЁ]\.){1,2})/);
  if (ip) return `${ip[1]} ${ip[2].trim()}`;
  return null;
}

/**
 * Эвристическое определение типа документа по ключевым словам текста.
 * Порядок проверок важен: более специфичные типы — раньше.
 */
export function guessDocType(text: string): string {
  const t = text.toLowerCase();
  // NB: \b не работает с кириллицей (\w — только ASCII), поэтому границы слова
  // задаём явным классом символов
  const word = (w: string) => new RegExp(`(^|[^а-яёa-z0-9])${w}([^а-яёa-z0-9]|$)`);
  if (t.includes('универсальный передаточный документ') || word('упд').test(t)) return 'upd';
  if (t.includes('кассовый чек') || t.includes('фискальный') || t.includes('приходный кассовый ордер')) return 'receipt';
  if (t.includes('счёт на оплату') || t.includes('счет на оплату') || /сч[её]т\s*[№#]/.test(t) || t.includes('счёт-фактура') || t.includes('счет-фактура')) return 'invoice';
  if (t.includes('платёжное поручение') || t.includes('платежное поручение') || t.includes('списание') || t.includes('зачисление') || t.includes('выписка')) return 'bank_notice';
  if (word('акт').test(t) || t.includes('акт выполненных работ') || t.includes('акт оказания услуг')) return 'act';
  return 'other';
}

/**
 * Декодирует QR-код с изображения: sharp → сырые RGBA-пиксели → jsQR.
 * Возвращает текст QR-кода или null, если код не найден/не читается.
 */
export async function decodeQrFromImage(buffer: Buffer): Promise<string | null> {
  try {
    const { data, info } = await sharp(buffer)
      .raw()
      .ensureAlpha()
      .toBuffer({ resolveWithObject: true });
    const result = jsQR(new Uint8ClampedArray(data), info.width, info.height);
    return result?.data || null;
  } catch {
    // Повреждённое/неподдерживаемое изображение — не считаем ошибкой обработки письма
    return null;
  }
}
