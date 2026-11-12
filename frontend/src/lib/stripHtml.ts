// Очистка HTML-разметки из WYSIWYG-содержимого (текст без тегов вроде <p>)
export function stripHtml(html: string) {
  const div = document.createElement('div');
  div.innerHTML = html;
  return (div.textContent || '').trim();
}

// Description для метатегов: текст без HTML, обрезка по границе слова
// (~150-160 символов — рекомендация поисковиков) с многоточием
export function makeDescription(html: string, max = 160) {
  const text = stripHtml(html).replace(/\s+/g, ' ').trim();
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  const lastSpace = cut.lastIndexOf(' ');
  return `${cut.slice(0, lastSpace > 60 ? lastSpace : max).trimEnd()}…`;
}
