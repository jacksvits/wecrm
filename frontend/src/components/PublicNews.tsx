import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { safeHtml } from '../lib/safeHtml';
import { stripHtml } from '../lib/stripHtml';

type PublicNewsItem = {
  id: string;
  title: string;
  slug: string;
  summary?: string | null;
  content: string;
  coverImage?: string | null;
  sourceUrl?: string | null;
  publishedAt?: string | null;
  category?: { id: string; name: string; slug: string; color: string } | null;
};

export function PublicNews() {
  const location = useLocation();
  const [news, setNews] = useState<PublicNewsItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const slug = decodeURIComponent(location.pathname.replace(/^\/+|\/+$/g, ''));

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setNotFound(false);
    fetch(`/api/news/public/${encodeURIComponent(slug)}`)
      .then(async (response) => {
        if (response.status === 404) {
          if (!cancelled) setNotFound(true);
          return null;
        }
        if (!response.ok) throw new Error('Не удалось загрузить новость');
        return response.json();
      })
      .then((data) => { if (!cancelled && data) setNews(data); })
      .catch(() => { if (!cancelled) setNotFound(true); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [slug]);

  useEffect(() => {
    if (!news) return;
    const previousTitle = document.title;
    document.title = `${news.title} — WeLANS`;
    const description = stripHtml(news.summary || news.content).slice(0, 180);
    let meta = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    const oldDescription = meta?.content;
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = 'description';
      document.head.appendChild(meta);
    }
    meta.content = description;
    let canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    const oldCanonical = canonical?.href;
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.href = `${window.location.origin}/${encodeURIComponent(news.slug)}/`;
    return () => {
      document.title = previousTitle;
      if (meta) {
        if (oldDescription === undefined) meta.remove();
        else meta.content = oldDescription;
      }
      if (canonical) {
        if (oldCanonical === undefined) canonical.remove();
        else canonical.href = oldCanonical;
      }
    };
  }, [news]);

  return (
    <div style={{ minHeight: '100vh', background: '#f5f7fb', color: '#172033', fontFamily: 'Inter, system-ui, -apple-system, sans-serif' }}>
      <header style={{ background: '#fff', borderBottom: '1px solid #e4e9f2' }}>
        <div style={{ maxWidth: 940, margin: '0 auto', padding: '18px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          <a href="/" style={{ color: '#007aff', textDecoration: 'none', fontSize: 24, fontWeight: 800 }}>WeLANS</a>
          <a href="/" style={{ color: '#53627a', textDecoration: 'none', fontSize: 14 }}>На главную</a>
        </div>
      </header>
      <main style={{ maxWidth: 900, margin: '0 auto', padding: 'clamp(20px, 4vw, 42px) 16px' }}>
        {loading && <div style={{ textAlign: 'center', padding: 60, color: '#68778f' }}>Загрузка новости…</div>}
        {!loading && notFound && (
          <div style={{ background: '#fff', borderRadius: 18, padding: 40, textAlign: 'center', border: '1px solid #e4e9f2' }}>
            <h1 style={{ fontSize: 24 }}>Новость не найдена</h1>
            <p style={{ color: '#68778f' }}>Возможно, адрес изменился или запись была удалена.</p>
          </div>
        )}
        {!loading && news && (
          <article style={{ background: '#fff', borderRadius: 20, padding: 'clamp(20px, 4vw, 38px)', border: '1px solid #e4e9f2', boxShadow: '0 10px 35px rgba(30, 55, 90, .06)', overflow: 'hidden' }}>
            {news.category && (
              <div style={{ display: 'inline-block', padding: '5px 11px', borderRadius: 999, background: `${news.category.color}18`, color: news.category.color, fontSize: 13, fontWeight: 650, marginBottom: 16 }}>
                {news.category.name}
              </div>
            )}
            <h1 style={{ margin: '0 0 14px', fontSize: 'clamp(25px, 4vw, 36px)', lineHeight: 1.25, letterSpacing: '-.02em' }}>{news.title}</h1>
            {news.publishedAt && (
              <time dateTime={news.publishedAt} style={{ display: 'block', color: '#738198', fontSize: 14, marginBottom: 22 }}>
                {new Date(news.publishedAt).toLocaleString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </time>
            )}
            {news.coverImage && (
              <img src={news.coverImage} alt={news.title} style={{ display: 'block', width: '100%', maxHeight: 520, objectFit: 'cover', borderRadius: 14, marginBottom: 24 }} />
            )}
            <div className="rich-text" style={{ fontSize: 17, lineHeight: 1.75, overflowWrap: 'anywhere' }} dangerouslySetInnerHTML={{ __html: safeHtml(news.content) }} />
            {news.sourceUrl && (
              <footer style={{ marginTop: 28, paddingTop: 20, borderTop: '1px solid #e4e9f2', fontSize: 14, overflowWrap: 'anywhere' }}>
                Источник: <a href={news.sourceUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#007aff' }}>{news.sourceUrl}</a>
              </footer>
            )}
          </article>
        )}
      </main>
    </div>
  );
}
