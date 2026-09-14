// Очистка HTML-разметки из WYSIWYG-содержимого (текст без тегов вроде <p>)
export function stripHtml(html: string) {
  const div = document.createElement('div');
  div.innerHTML = html;
  return (div.textContent || '').trim();
}
