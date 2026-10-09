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
};

// Базовый заголовок вкладки с учётом SEO-настроек (используется в appBadge.ts)
declare global {
  interface Window {
    __SEO_BASE_TITLE__?: string;
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
