// Нормализует текст/HTML входящего письма в читаемое HTML-описание задачи.
// mailparser для HTML-писем с картинками генерирует мусор вида:
//   [{ Image: alt - Контур.Диадокsource - https://... }](https://diadoc.ru)   (старый формат)
//   Контур.Диадок [https://.../logo.png]https://diadoc.ru[https://.../x.png]  (новый формат)
// Плюс в тексте остаются брайль-«пробелы» ⠀ из вёрстки рассылок и markdown-ссылки [текст](url).

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Извлекает чистый «сырой» текст письма: убираем placeholders картинок обоих форматов,
// оставляем ссылки как текст/markdown для следующего шага.
function toRawText(text: string | null | undefined, html: string | null | undefined): string {
  let s = (text || '').trim();
  // parsed.text может тащить незакрытые обёртки рассылки
  s = s.replace(/^\s*<p[^>]*>/i, '').replace(/<\/p>\s*$/i, '').trim();
  if (!s && html) {
    // Фолбэк на htmlToText: он удаляет img целиком, ссылки оставляет «текст (url)»
    const { htmlToText } = require('./html-to-text.js');
    s = htmlToText(html).trim();
  }
  return s;
}

export function normalizeEmailDescription(
  text: string | null | undefined,
  html: string | null | undefined
): string {
  const raw = toRawText(text, html);
  if (!raw) return '';

  const anchors: string[] = [];
  //  — маркер якоря (управляющий символ, не встречается в тексте писем,
  // в отличие от формата « 123 », который конфликтует с числами в тексте)
  const stash = (aHtml: string) => `${anchors.push(aHtml) - 1}`;

  let s = raw;

  // 1) placeholders картинок: { Image: alt - ...source - url } и [{ Image: ... }](href)
  s = s.replace(/\{\s*Image:[^}]*\}/g, ' ');
  // 2) markdown-ссылки [текст](url) → временный якорь (пустой label — подставляем url)
  s = s.replace(/\[([^\]]*)\]\((https?:\/\/[^)\s]+)\)/g, (_m, label: string, url: string) =>
    stash(`<a href="${url}">${escapeHtml(label.trim()) || url}</a>`)
  );
  // 3) остатки картинок в квадратных скобках: [https://.../x.png?t=...], [arrow.png]
  s = s.replace(
    /\[(https?:\/\/[^\s\]]+|[^\s\]]+?\.(?:png|jpe?g|gif|webp|svg|ico)(?:\?[^\s\]]*)?)\]/gi,
    ' '
  );
  // 4) «текст (url)» из htmlToText-фолбэка → якорь
  s = s.replace(
    /([^\s()][^()\n]*?)\s*\((https?:\/\/[^)\s]+)\)/g,
    (_m, label: string, url: string) => stash(`<a href="${url}">${escapeHtml(label.trim())}</a>`)
  );
  // 5) голые URL → якорь
  s = s.replace(/(https?:\/\/[^\s<>()\[\]]+)/g, (url: string) =>
    stash(`<a href="${url}">${url}</a>`)
  );
  // 6) брайль-«пробелы» ⠀ и остатки HTML-тегов
  s = s.replace(/[\u2800]+/g, ' ');
  s = s.replace(/<[^>]+>/g, ' ');
  // 7) экранируем весь текст и возвращаем якоря на место
  s = escapeHtml(s);
  s = s.replace(/(\d+)/g, (_m, i: string) => anchors[Number(i)]);
  // 8) схлопываем пробелы и собираем абзацы
  const paras = s
    .split(/\n{2,}/)
    .map((p) => p.replace(/[ \t]+/g, ' ').trim())
    .filter(Boolean);
  return paras.map((p) => `<p>${p.replace(/\n/g, '<br/>')}</p>`).join('');
}
