// Преобразует HTML из WYSIWYG-редактора в читаемый текст для PDF-отчёта
const BLOCK_TAGS = /<\/?(p|div|li|ul|ol|blockquote|h[1-6]|tr|table|figure)[^>]*>/gi;

const NAMED_ENTITIES: Record<string, string> = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ',
  ndash: '–', mdash: '—', hellip: '…', laquo: '«', raquo: '»',
  times: '×', bull: '•', copy: '©', reg: '®', trade: '™',
};

function stripTags(s: string): string {
  return s.replace(/<[^>]+>/g, '');
}

function decodeEntities(s: string): string {
  return s
    .replace(/&#(\d+);/g, (_m, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_m, code) => String.fromCodePoint(parseInt(code, 16)))
    .replace(/&([a-z]+);/gi, (m, name) => NAMED_ENTITIES[name.toLowerCase()] ?? m);
}

export function htmlToText(html: string | null | undefined): string {
  if (!html) return '';
  let text = String(html);
  // Медиа-элементы и скрипты убираем целиком
  text = text.replace(/<(script|style|audio|video|iframe|object|embed)[\s\S]*?<\/\1>/gi, '');
  text = text.replace(/<(img|input|br|hr)[^>]*>/gi, '\n');
  // Ссылки: текст + URL
  text = text.replace(/<a[^>]*href=["']([^"']*)["'][^>]*>([\s\S]*?)<\/a>/gi, (_m, href, label) => {
    const labelText = stripTags(label).trim();
    return href ? `${labelText} (${href})` : labelText;
  });
  // Блочные теги -> переносы строк
  text = text.replace(BLOCK_TAGS, '\n');
  text = stripTags(text);
  text = decodeEntities(text);
  // Схлопываем лишние пробелы и пустые строки
  text = text.replace(/[ \t]+\n/g, '\n').replace(/\n[ \t]+/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
  return text;
}
