import { htmlToText } from './html-to-text.js';

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
  // 3) «текст [url]» (рендер ссылок mailparser/html-to-text) → якорь;
  //    URL картинок (*.png и т.п.) не трогаем — их по-прежнему удаляет следующий шаг
  s = s.replace(
    /([^\s\[\]()][^\[\]\n]*?)\s*\[(https?:\/\/[^\s\]]+)\]/g,
    (_m, label: string, url: string) =>
      /\.(png|jpe?g|gif|webp|svg|ico)(\?|#|$)/i.test(url)
        ? `${label} [${url}]`
        : stash(`<a href="${url}">${escapeHtml(label.trim()) || url}</a>`)
  );
  // 4) остатки картинок в квадратных скобках: [https://.../x.png?t=...], [arrow.png]
  s = s.replace(
    /\[(https?:\/\/[^\s\]]+|[^\s\]]+?\.(?:png|jpe?g|gif|webp|svg|ico)(?:\?[^\s\]]*)?)\]/gi,
    ' '
  );
  // 5) «текст (url)» из htmlToText-фолбэка → якорь
  s = s.replace(
    /([^\s()][^()\n]*?)\s*\((https?:\/\/[^)\s]+)\)/g,
    (_m, label: string, url: string) => stash(`<a href="${url}">${escapeHtml(label.trim())}</a>`)
  );
  // 6) голые URL → якорь
  s = s.replace(/(https?:\/\/[^\s<>()\[\]]+)/g, (url: string) =>
    stash(`<a href="${url}">${url}</a>`)
  );
  // 6) брайль-«пробелы» ⠀ и остатки HTML-тегов
  s = s.replace(/[\u2800]+/g, ' ');
  s = s.replace(/<[^>]+>/g, ' ');
  // 7) экранируем весь текст и возвращаем якоря на место
  s = escapeHtml(s);
  s = s.replace(/(\d+)/g, (_m, i: string) => anchors[Number(i)]);
  // 9) схлопываем пробелы и собираем абзацы
  const paras = s
    .split(/\n{2,}/)
    .map((p) => p.replace(/[ \t]+/g, ' ').trim())
    .filter(Boolean);
  return paras.map((p) => `<p>${p.replace(/\n/g, '<br/>')}</p>`).join('');
}

// ---------------------------------------------------------------------------
// HTML-конвейер: описание задачи сохраняет структуру письма (ссылки, картинки,
// таблицы, списки) вместо сведения к plain-text. HTML санитизируется белым
// списком тегов перед сохранением — фронтенд выводит описание через
// dangerouslySetInnerHTML.

import sanitizeHtml from 'sanitize-html';

export interface EmailImageResolver {
  // по contentId (cid) инлайн-картинки возвращает публичный URL сохранённого файла
  (cid: string): string | null;
}

export function normalizeEmailDescriptionHtml(
  html: string | null | undefined,
  resolveCid: EmailImageResolver
): string {
  if (!html || !html.trim()) return '';

  return sanitizeHtml(html, {
    allowedTags: [
      'a', 'img', 'p', 'br', 'div', 'span', 'hr',
      'strong', 'b', 'em', 'i', 'u', 's', 'strike',
      'ul', 'ol', 'li', 'blockquote', 'pre', 'code',
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'table', 'thead', 'tbody', 'tfoot', 'tr', 'td', 'th',
    ],
    allowedAttributes: {
      a: ['href'],
      img: ['src', 'alt', 'width', 'height'],
      td: ['colspan', 'rowspan'],
      th: ['colspan', 'rowspan'],
    },
    allowedSchemes: ['http', 'https', 'mailto'],
    allowedSchemesByTag: { img: ['http', 'https', 'cid'] },
    transformTags: {
      a: (tagName, attribs) => ({
        tagName,
        attribs: { ...attribs, target: '_blank', rel: 'noopener noreferrer' },
      }),
      img: (tagName, attribs) => {
        const src = attribs.src || '';
        // инлайн-картинки письма: cid:xxx → URL сохранённого вложения
        const cidMatch = /^cid:([^?]+)$/i.exec(src);
        if (cidMatch) {
          const resolved = resolveCid(decodeURIComponent(cidMatch[1]));
          return resolved
            ? { tagName, attribs: { ...attribs, src: resolved } }
            : { tagName, attribs: { ...attribs, src: '' } };
        }
        return { tagName, attribs };
      },
    },
    // внешние картинки-трекеры с чужих доменов не подгружаем: оставляем только
    // cid (подменённые выше) и относительные/своего бэкенда URL
    exclusiveFilter: (frame) => {
      if (frame.tag !== 'img') return false;
      const src = frame.attribs.src || '';
      if (!src) return true; // неразрешённый cid — выкидываем картинку целиком
      if (/^https?:\/\//i.test(src)) return true; // внешние URL — только трекеры/баннеры рассылок
      return false;
    },
    disallowedTagsMode: 'discard',
  });
}
