import DOMPurify from 'dompurify';

/** Единая очистка WYSIWYG/HTML перед dangerouslySetInnerHTML. */
export function safeHtml(value: unknown): string {
  return DOMPurify.sanitize(String(value ?? ''), {
    USE_PROFILES: { html: true },
    FORBID_TAGS: ['style', 'iframe', 'object', 'embed', 'form', 'input', 'button'],
    FORBID_ATTR: ['srcset'],
  });
}
