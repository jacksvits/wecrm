// Хештеги задач: «#309» → кликабельная ссылка на /tasks/309
// Используется везде, где выводится пользовательский текст:
// WYSIWYG-контент (rich-text HTML) и plain-text (чат, обсуждения)

import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

// # и цифры задачи; не захватывает #fff (цвета), ##309, #309abc
export const TASK_TAG_REGEX = /(^|[^#\w])#(\d{1,7})(?![\w])/g;

// Голые URL в текстовом фрагменте; не захватывает < и кавычки (атрибуты тегов)
export const PLAIN_URL_REGEX = /(https?:\/\/[^\s<>"']+)/g;

// Оборачивает голый URL в ссылку, открывающуюся в новой вкладке
function linkifyUrlSegment(text: string): string {
  return text.replace(PLAIN_URL_REGEX, (url) =>
    `<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`
  );
}

// Оборачивает #ID и голые URL в ссылку внутри текстового фрагмента
function linkifyTagSegment(text: string): string {
  const withUrls = linkifyUrlSegment(text);
  return withUrls.replace(TASK_TAG_REGEX, (m, prefix: string, id: string) =>
    `${prefix}<a href="/tasks/${id}" class="task-hashtag">#${id}</a>`
  );
}

// Парсит HTML из WYSIWYG: заменяет #ID и голые URL только в текстовых узлах,
// не трогает теги, атрибуты (style с цветами #fff) и существующие <a>
export function linkifyTaskTagsHtml(html: string): string {
  let result = '';
  let i = 0;
  let insideAnchor = false;
  while (i < html.length) {
    const lt = html.indexOf('<', i);
    if (lt === -1) {
      result += insideAnchor ? html.slice(i) : linkifyTagSegment(html.slice(i));
      break;
    }
    if (lt > i) {
      result += insideAnchor ? html.slice(i, lt) : linkifyTagSegment(html.slice(i, lt));
    }
    const gt = html.indexOf('>', lt);
    if (gt === -1) {
      result += html.slice(lt);
      break;
    }
    const tag = html.slice(lt, gt + 1);
    if (/^<\s*a[\s>]/i.test(tag)) insideAnchor = true;
    else if (/^<\s*\/\s*a\s*>/i.test(tag)) insideAnchor = false;
    result += tag;
    i = gt + 1;
  }
  return result;
}

// SPA-переход по клику на .task-hashtag (без перезагрузки страницы).
// Повесить onClick на контейнер с dangerouslySetInnerHTML.
export function useTaskHashtagClick() {
  const navigate = useNavigate();
  return useCallback((e: React.MouseEvent) => {
    const a = (e.target as HTMLElement).closest('a.task-hashtag');
    if (!a) return;
    e.preventDefault();
    e.stopPropagation();
    const href = a.getAttribute('href');
    if (href) navigate(href);
  }, [navigate]);
}
