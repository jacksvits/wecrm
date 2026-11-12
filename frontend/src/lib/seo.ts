// Применение SEO-метатегов из настроек (Системные настройки → SEO) к <head> документа.
// Значения из index.html служат fallback: подменяются только непустые поля.
// Чтение публичное — метатеги применяются и на странице входа, и для поисковых роботов.

type SeoData = {
  title?: string;
  description?: string;
  canonical?: string;
  robots?: string;
  lang?: string;
  viewport?: string;
  keywords?: string;
  yandexMetrika?: string;
};

// Базовый заголовок вкладки с учётом SEO-настроек (используется в appBadge.ts)
declare global {
  interface Window {
    __SEO_BASE_TITLE__?: string;
  }
}

// Базовый заголовок вкладки без префикса счётчика уведомлений.
// Приоритет: SEO-заголовок из настроек тенанта (если initSeo уже применил его),
// иначе текущий document.title без префикса "(N) ", иначе дефолт из index.html.
// Функция (а не константа): модули-потребители могут загружаться раньше initSeo(),
// поэтому значение нужно вычислять на момент каждого вызова.
export function seoBaseTitle(): string {
  const seo = window.__SEO_BASE_TITLE__;
  if (seo) return seo;
  return (document.title || "WeCRM").replace(/^\(\d+\)\s+/, "") || "WeCRM";
}

// Вставка кода счётчика Яндекс Метрики: скрипты — в начало <head>, чтобы счётчик
// загружался раньше и успевал отправить просмотр даже при быстром закрытии страницы.
// Скрипты пересоздаются программно — вставленные через innerHTML не выполняются.
function injectYandexMetrika(code: string) {
  if (!code.trim()) return;
  if (document.querySelector("script[data-ym-counter]")) return; // защита от повторной вставки
  const tpl = document.createElement("template");
  tpl.innerHTML = code;
  for (const node of Array.from(tpl.content.childNodes)) {
    if (node.nodeType !== Node.ELEMENT_NODE) continue;
    const el = node as HTMLElement;
    if (el.tagName === "SCRIPT") {
      const s = document.createElement("script");
      for (const a of Array.from(el.attributes)) s.setAttribute(a.name, a.value);
      s.text = el.textContent || "";
      s.setAttribute("data-ym-counter", "1");
      document.head.insertBefore(s, document.head.firstChild);
    } else {
      // <noscript> и прочая разметка — в начало <body> (если уже есть), иначе в <head>
      const target = document.body || document.head;
      target.insertBefore(el.cloneNode(true), target.firstChild);
    }
  }
}

function setMeta(attr: "name", key: string, content: string) {
  if (!content) return;
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function applySeo(s: SeoData) {
  if (s.title) {
    document.title = s.title;
    window.__SEO_BASE_TITLE__ = s.title;
  }
  if (s.lang) document.documentElement.lang = s.lang;
  setMeta("name", "description", s.description || "");
  setMeta("name", "keywords", s.keywords || "");
  setMeta("name", "robots", s.robots || "");
  if (s.viewport) {
    const el = document.head.querySelector<HTMLMetaElement>('meta[name="viewport"]');
    if (el) el.setAttribute("content", s.viewport);
  }
  if (s.canonical) {
    let link = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!link) {
      link = document.createElement("link");
      link.setAttribute("rel", "canonical");
      document.head.appendChild(link);
    }
    link.setAttribute("href", s.canonical);
  }
  if (s.yandexMetrika) injectYandexMetrika(s.yandexMetrika);
  // Публичные страницы повторно ставят свой title по этому событию (usePageTitle)
  window.dispatchEvent(new Event('wecrm-seo-applied'));
}


// ---- Метатеги отдельных публичных страниц (новости, витрина, файлы) ----
// Отличие от applySeo (глобальные настройки тенанта): задаёт title/description/canonical
// конкретной страницы. Повторное применение — по событию 'wecrm-seo-applied' (см. usePageSeo).

export type PageMeta = {
  title?: string;
  description?: string;
  canonical?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogType?: string;
};

function setPropertyMeta(property: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[property="${property}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute('property', property);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

// Применяет метатеги страницы; возвращает снимок предыдущих значений для восстановления
export function applyPageMeta(m: PageMeta) {
  const snapshot = {
    title: document.title,
    description: document.head.querySelector<HTMLMetaElement>('meta[name="description"]')?.content ?? null,
    canonical: document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')?.getAttribute('href') ?? null,
    ogTitle: document.head.querySelector<HTMLMetaElement>('meta[property="og:title"]')?.content ?? null,
    ogDescription: document.head.querySelector<HTMLMetaElement>('meta[property="og:description"]')?.content ?? null,
    ogImage: document.head.querySelector<HTMLMetaElement>('meta[property="og:image"]')?.content ?? null,
    ogType: document.head.querySelector<HTMLMetaElement>('meta[property="og:type"]')?.content ?? null,
  };
  if (m.title) document.title = m.title;
  if (m.description) setMeta('name', 'description', m.description);
  if (m.canonical) {
    let link = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!link) {
      link = document.createElement('link');
      link.setAttribute('rel', 'canonical');
      document.head.appendChild(link);
    }
    link.setAttribute('href', m.canonical);
  }
  if (m.ogTitle) setPropertyMeta('og:title', m.ogTitle);
  if (m.ogDescription) setPropertyMeta('og:description', m.ogDescription);
  if (m.ogImage) setPropertyMeta('og:image', m.ogImage);
  if (m.ogType) setPropertyMeta('og:type', m.ogType);
  return snapshot;
}

type PageMetaSnapshot = ReturnType<typeof applyPageMeta>;

// Восстановление значений, снятых applyPageMeta (null — метатега не было, удаляем)
export function restorePageMeta(snapshot: PageMetaSnapshot) {
  document.title = snapshot.title;
  const setOrRemove = (selector: string, attr: string, value: string | null) => {
    const el = document.head.querySelector<HTMLElement>(selector);
    if (value === null) el?.remove();
    else if (el) el.setAttribute(attr, value);
  };
  setOrRemove('meta[name="description"]', 'content', snapshot.description);
  setOrRemove('link[rel="canonical"]', 'href', snapshot.canonical);
  setOrRemove('meta[property="og:title"]', 'content', snapshot.ogTitle);
  setOrRemove('meta[property="og:description"]', 'content', snapshot.ogDescription);
  setOrRemove('meta[property="og:image"]', 'content', snapshot.ogImage);
  setOrRemove('meta[property="og:type"]', 'content', snapshot.ogType);
}

// Запускается до первого рендера в main.tsx; ошибки сети игнорируем —
// останутся дефолтные метатеги из index.html
export function initSeo() {
  fetch("/api/seo-settings")
    .then((r) => (r.ok ? r.json() : null))
    .then((s: SeoData | null) => {
      if (s) applySeo(s);
    })
    .catch(() => {});
}
