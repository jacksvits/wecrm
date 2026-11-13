// Публичные страницы новостей для гостей: /news (список) и /news/:id (детальная).
// Чтение доступно без авторизации; лайки и комментарии — только для
// авторизованных пользователей (гостю предлагаем войти).
import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { safeHtml } from '../lib/safeHtml';
import { useBrandLogo, useBrandNewsCover } from '../lib/branding';
import { CookieConsent } from './CookieConsent';
import { usePageSeo } from '../lib/usePageTitle';
import { makeDescription } from '../lib/stripHtml';
import { applyPageMeta, restorePageMeta } from '../lib/seo';
import PublicAuthArea from './PublicAuthArea';
import { usePublicUser } from './PublicAuthArea';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import PublicNavMenu from './PublicNavMenu';
import { AdBlock } from '../types';

function stripHtml(html: string): string {
  const div = document.createElement('div');
  div.innerHTML = html;
  return div.textContent || div.innerText || '';
}

const selectStyle: React.CSSProperties = {
  padding: '8px 12px',
  borderRadius: 10,
  border: '1px solid var(--border-color)',
  background: 'var(--bg-input)',
  color: 'var(--text-primary)',
  fontSize: 13,
  maxWidth: 200,
};

function PublicNewsHeader({ query, onSearch, onSubmit, consent = true }: { query: string; onSearch: (q: string) => void; onSubmit?: (q: string) => void; consent?: boolean }) {
  const logoUrl = useBrandLogo(false);
  return (
    <header style={{
      position: 'sticky', top: 0, zIndex: 50,
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '10px 16px',
      borderBottom: '1px solid var(--border-color, #e0e0e0)',
      background: 'var(--bg-secondary, #fff)',
    }}>
      <a href="https://welans.ru" style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }} aria-label="WeLANS — на главную">
        {logoUrl
          ? <img src={logoUrl} alt="WeLANS" style={{ height: 34, maxWidth: 140, objectFit: 'contain' }} />
          : <span style={{ fontSize: 20, fontWeight: 700 }}>WeLANS</span>}
      </a>
      <input
        value={query}
        onChange={(e) => onSearch(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && onSubmit) {
            onSubmit((e.target as HTMLInputElement).value);
          }
        }}
        placeholder="Поиск по названию, описанию, темам, меткам…"
        style={{
          flex: 1, width: '100%',
          padding: '10px 14px', borderRadius: 12,
          border: '1px solid var(--border-color, #e0e0e0)',
          background: 'var(--bg-input, #f5f5f7)', color: 'var(--text-primary)',
          fontSize: 14, outline: 'none',
        }}
      />
      <PublicNavMenu />
      <PublicAuthArea />
      {consent && <CookieConsent />}
    </header>
  );
}

function NewsCard({ item, defaultCover, onClick }: { item: any; defaultCover: string | null; onClick: () => void }) {
  const date = item.publishedAt ? new Date(item.publishedAt) : new Date(item.createdAt);
  return (
    <div
      onClick={onClick}
      style={{
        background: 'var(--bg-secondary, var(--bg-primary))',
        border: '1px solid var(--border-color)',
        borderRadius: 16,
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'box-shadow 0.15s',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div style={{ aspectRatio: '16 / 9', overflow: 'hidden', background: '#000' }}>
        <img
          src={item.coverImage || defaultCover}
          alt=""
          loading="lazy"
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          onError={(e) => {
            if (defaultCover && (e.target as HTMLImageElement).src !== defaultCover) {
              (e.target as HTMLImageElement).src = defaultCover;
            }
          }}
        />
      </div>
      <div style={{ padding: 16, display: 'flex', flexDirection: 'column', flex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, gap: 8 }}>
          {item.category && (
            <span style={{
              fontSize: 11, fontWeight: 600,
              color: item.category.color || '#007AFF',
              background: (item.category.color || '#007AFF') + '15',
              padding: '3px 8px', borderRadius: 6,
            }}>
              {item.category.name}
              {item.subcategory && ` / ${item.subcategory.name}`}
            </span>
          )}
          <span style={{ fontSize: 11, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
            {date.toLocaleDateString('ru-RU')}
          </span>
        </div>
        <h3 style={{ margin: '0 0 8px', fontSize: 16, fontWeight: 600, lineHeight: 1.35, color: 'var(--text-color)' }}>
          {item.title}
        </h3>
        {item.summary && (
          <p style={{
            margin: '0 0 12px', fontSize: 13, lineHeight: 1.5,
            color: 'var(--text-muted)',
            display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden',
          }}>
            {stripHtml(item.summary)}
          </p>
        )}
        <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, color: 'var(--text-muted)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <span>👍 {item.likes || 0}</span>
            <span>💬 {item.commentsCount || 0}</span>
          </div>
          <span>{item.views || 0} просмотров</span>
        </div>
      </div>
    </div>
  );
}

// Модули тулбара WYSIWYG комментария — единая стилистика с CRM (NewsComments)
const COMMENT_QUILL_MODULES = {
  toolbar: [
    ['bold', 'italic', 'underline', 'strike'],
    [{ list: 'ordered' }, { list: 'bullet' }],
    ['link'],
    ['clean'],
  ],
};
// Текст без HTML-тегов (валидация непустоты)
const commentPlainText = (html: string) => html.replace(/<[^>]*>/g, '').trim();

/* ---------- Рекламные блоки по бокам карточки новости (только детальная страница) ---------- */

// Общие стили колонок: контейнер-грид и скрытие боковых колонок на узких экранах
const AD_COLUMNS_CSS = `
  /* Средняя колонка — по ширине карточки новости: реклама вплотную к тексту с обеих сторон */
  /* Вся строка (карточка новости и обе колонки рекламы) — на одной линии, отступ 8px от верха экрана */
  .news-ad-grid { display: grid; grid-template-columns: 240px auto 240px; gap: 10px; justify-content: center; margin-top: 8px; }
  .news-ad-main { width: 800px; max-width: 100%; }
  .news-ad-col { display: flex; flex-direction: column; gap: 14px; }
  .news-ad-col > .news-ad-sticky { position: sticky; top: 68px; }
  @media (max-width: 1100px) {
    .news-ad-grid { grid-template-columns: minmax(0, 1fr); }
    .news-ad-col { display: none; }
    .news-ad-main { width: auto; }
  }
`;

/** Активные рекламные блоки, разбитые по колонкам (слева/справа) */
function useAdBlocks(): { left: AdBlock[]; right: AdBlock[] } {
  const [blocks, setBlocks] = useState<AdBlock[]>([]);
  useEffect(() => {
    api.adBlocks.list().then(setBlocks).catch(() => {});
  }, []);
  return {
    left: blocks.filter(b => b.position === 'left'),
    right: blocks.filter(b => b.position === 'right'),
  };
}

/** Колонка рекламных блоков: блоки с флагом isSticky закреплены при прокрутке (top 68), остальные скроллятся с лентой */
function NewsAdColumn({ blocks }: { blocks: AdBlock[] }) {
  if (!blocks.length) return null;
  return (
    <aside className="news-ad-col">
      {blocks.map(b => {
        const inner = b.type === 'script' ? <NewsAdScript block={b} /> : <NewsAdCard block={b} />;
        return b.isSticky
          ? <div key={b.id} className="news-ad-sticky">{inner}</div>
          : <div key={b.id}>{inner}</div>;
      })}
    </aside>
  );
}

/** Блок скрипта: вставка HTML/JS, высота по содержимому.
 *  <script> из innerHTML браузер не выполняет — пересоздаём их после монтирования */
function NewsAdScript({ block }: { block: AdBlock }) {
  const ref = useRef<HTMLDivElement>(null);
  const html = block.script || '';
  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    root.querySelectorAll('script').forEach((oldScript) => {
      const s = document.createElement('script');
      Array.from(oldScript.attributes).forEach(a => s.setAttribute(a.name, a.value));
      s.textContent = oldScript.textContent || '';
      oldScript.replaceWith(s);
    });
  }, [html]);
  return (
    <div
      ref={ref}
      className="news-ad-script"
      style={{ borderRadius: 12, overflow: 'hidden', background: 'var(--bg-card)' }}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

/** Карточка рекламного блока: только картинка(ы) с ротацией и fade-анимацией */
function NewsAdCard({ block }: { block: AdBlock }) {
  const navigate = useNavigate();
  const [hover, setHover] = useState(false);
  // Три размера блока пропорционально ширине 240: 240×240, 240×320, 240×474
  const heights: Record<string, number> = { small: 240, medium: 320, big: 474 };
  // Картинки блока: JSON-массив images, fallback — одиночная imageUrl
  const images: string[] = useMemo(() => {
    let arr: string[] = [];
    try {
      const parsed = block.images ? JSON.parse(block.images) : [];
      if (Array.isArray(parsed)) arr = parsed.filter((u: any) => typeof u === 'string' && u);
    } catch { /* ignore */ }
    if (!arr.length && block.imageUrl) arr = [block.imageUrl];
    return arr;
  }, [block.images, block.imageUrl]);
  const [imgIdx, setImgIdx] = useState(0);
  // Интервал смены картинок свой у каждого блока (по умолчанию 4с)
  const intervalSec = Math.min(120, Math.max(1, Number(block.intervalSec) || 4));
  useEffect(() => {
    if (images.length < 2) return;
    const t = setInterval(() => setImgIdx(i => (i + 1) % images.length), intervalSec * 1000);
    return () => clearInterval(t);
  }, [images.length, intervalSec]);
  const open = () => {
    if (!block.linkUrl) return;
    if (/^https?:\/\//i.test(block.linkUrl)) window.open(block.linkUrl, '_blank', 'noopener');
    else navigate(block.linkUrl);
  };
  return (
    <div
      onClick={open}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        borderRadius: 12,
        overflow: 'hidden',
        cursor: block.linkUrl ? 'pointer' : 'default',
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        boxShadow: hover ? '0 8px 24px rgba(0,0,0,.28)' : '0 2px 8px rgba(0,0,0,.18)',
        transform: hover ? 'scale3d(1.02, 1.02, 1.02)' : 'scale3d(1, 1, 1)',
        transition: 'transform .2s ease, box-shadow .2s ease',
        display: 'flex',
        flexDirection: 'column',
        height: heights[block.size] ?? 240,
      }}
    >
      <div style={{ position: 'relative', flex: 1, minHeight: 0 }}>
        {images.length ? images.map((u, i) => (
          <img key={u + i} src={u} alt={block.title} loading="lazy" style={{
            position: 'absolute', inset: 0, width: '100%', height: '100%',
            objectFit: 'cover', display: 'block',
            opacity: i === imgIdx ? 1 : 0,
            transition: 'opacity .8s ease',
          }} />
        )) : <div style={{ position: 'absolute', inset: 0, background: 'var(--bg-hover)' }} />}
      </div>
    </div>
  );
}

function PublicNewsList({ consent = true }: { consent?: boolean }) {
  usePageSeo({
    title: 'WeLANS - Новости',
    description: 'Новости WeLANS — коротко о свежем: ИТ-консалтинг, инфраструктура, проекты и анонсы компании.',
    canonical: `${window.location.origin}/news`,
  });
  const navigate = useNavigate();
  const location = useLocation();
  const defaultCover = useBrandNewsCover();
  const initialQ = new URLSearchParams(location.search).get('q') ?? '';
  const [items, setItems] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [qInput, setQInput] = useState(initialQ);
  const [q, setQ] = useState(initialQ);
  const [category, setCategory] = useState('');
  const [subcategory, setSubcategory] = useState('');
  const [tag, setTag] = useState('');
  const [categories, setCategories] = useState<any[]>([]);
  const [tags, setTags] = useState<any[]>([]);
  const limit = 24;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  useEffect(() => {
    api.news.categories().then((res: any) => setCategories(Array.isArray(res) ? res : res?.categories ?? [])).catch(() => {});
    api.news.tags().then((res: any) => setTags(Array.isArray(res) ? res : res?.tags ?? [])).catch(() => {});
  }, []);

  useEffect(() => {
    const t = setTimeout(() => { setQ(qInput); setPage(1); }, 400);
    return () => clearTimeout(t);
  }, [qInput]);

  useEffect(() => {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (q) params.set('q', q);
    if (category) params.set('category', category);
    if (subcategory) params.set('subcategory', subcategory);
    if (tag) params.set('tag', tag);
    api.news.list(params.toString())
      .then((res: any) => { setItems(res.news || []); setTotal(res.total || 0); })
      .catch(() => {});
  }, [page, q, category, subcategory, tag]);

  const subcategories = categories.flatMap((c: any) => (c.subcategories ?? []).map((s: any) => ({ ...s, categoryId: c.id })));

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
      <PublicNewsHeader
        query={qInput}
        onSearch={setQInput}
        onSubmit={(value) => { setQ(value); setPage(1); }}
        consent={consent}
      />
      <div style={{ padding: '16px 24px 40px' }}>
        {/* Фильтры */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 18 }}>
          <select value={category} style={selectStyle} onChange={(e) => { setCategory(e.target.value); setSubcategory(''); setPage(1); }}>
            <option value="">Все категории</option>
            {categories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select value={subcategory} style={selectStyle} onChange={(e) => { setSubcategory(e.target.value); setPage(1); }}>
            <option value="">Все темы</option>
            {(category ? subcategories.filter((s: any) => s.categoryId === category) : subcategories)
              .map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <select value={tag} style={selectStyle} onChange={(e) => { setTag(e.target.value); setPage(1); }}>
            <option value="">Все метки</option>
            {tags.map((t: any) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>

        {/* Сетка новостей */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: 16,
        }}>
          {items.map((item) => (
            <NewsCard
              key={item.id}
              item={item}
              defaultCover={defaultCover}
              onClick={() => navigate(`/${item.slug}`)}
            />
          ))}
        </div>
        {!items.length && (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Новости не найдены</div>
        )}

        {/* Пагинация */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 24 }}>
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              style={{
                padding: '8px 14px', borderRadius: 8,
                background: 'var(--bg-hover)', border: '1px solid var(--border-color)',
                cursor: page <= 1 ? 'not-allowed' : 'pointer',
                opacity: page <= 1 ? 0.5 : 1, fontSize: 13,
                color: 'var(--text-primary)',
              }}
            >
              ← Назад
            </button>
            <span style={{ padding: '8px 14px', fontSize: 13, color: 'var(--text-muted)' }}>
              Страница {page} из {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              style={{
                padding: '8px 14px', borderRadius: 8,
                background: 'var(--bg-hover)', border: '1px solid var(--border-color)',
                cursor: page >= totalPages ? 'not-allowed' : 'pointer',
                opacity: page >= totalPages ? 0.5 : 1, fontSize: 13,
                color: 'var(--text-primary)',
              }}
            >
              Вперёд →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export function PublicNewsDetail({ id, slug, consent = true }: { id?: string; slug?: string; consent?: boolean }) {
  const navigate = useNavigate();
  const defaultCover = useBrandNewsCover();
  const [news, setNews] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [notFound, setNotFound] = useState(false);
  const [commentDraft, setCommentDraft] = useState('');
  const [commentBusy, setCommentBusy] = useState(false);
  const pubUser = usePublicUser();
  const ads = useAdBlocks();
  // Авторизован через CRM (мост auth-bridge с токеном) — комментарии доступны
  const canComment = !!pubUser;

  const submitComment = async () => {
    if (!news || commentBusy || !commentPlainText(commentDraft).trim()) return;
    setCommentBusy(true);
    try {
      await api.news.addComment(news.id, commentDraft);
      setCommentDraft('');
      const list = await api.news.comments(news.id);
      setComments(Array.isArray(list) ? list : []);
    } catch (e: any) {
      alert(e.message || 'Не удалось отправить комментарий');
    }
    setCommentBusy(false);
  };

  useEffect(() => {
    if (slug) {
      // Старые ссылки welans.ru/<slug>/ — новость ищется по WP-slug
      fetch(`/api/news/public/${encodeURIComponent(slug)}`)
        .then((r) => (r.ok ? r.json() : Promise.reject(new Error('not found'))))
        .then(setNews)
        .catch(() => setNotFound(true));
    } else if (id) {
      api.news.get(id).then(setNews).catch(() => setNotFound(true));
    }
  }, [id, slug]);

  useEffect(() => {
    if (news?.id) {
      api.news.comments(news.id)
        .then((res: any) => setComments(Array.isArray(res) ? res : res?.comments ?? []))
        .catch(() => {});
    }
  }, [news?.id]);

  // Метатеги страницы новости: title, description (из выжимки или текста),
  // canonical и Open Graph. Повторно применяем по событию 'wecrm-seo-applied' —
  // асинхронные SEO-настройки тенанта иначе перезаписали бы description.
  useEffect(() => {
    if (!news) return;
    const slug = news.slug || news.id;
    const meta = {
      title: `${news.title} — WeLANS`,
      description: makeDescription(news.summary || news.content || ''),
      canonical: `${window.location.origin}/${encodeURIComponent(slug)}/`,
      ogTitle: `${news.title} — WeLANS`,
      ogDescription: makeDescription(news.summary || news.content || ''),
      ogImage: news.coverImage || undefined,
      ogType: 'article',
    };
    const snapshot = applyPageMeta(meta);
    const apply = () => { applyPageMeta(meta); };
    window.addEventListener('wecrm-seo-applied', apply);
    return () => {
      window.removeEventListener('wecrm-seo-applied', apply as EventListener);
      restorePageMeta(snapshot);
    };
  }, [news]);

  const [searchQ, setSearchQ] = useState('');

  if (notFound) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
        <PublicNewsHeader query={searchQ} onSearch={setSearchQ} onSubmit={(v) => navigate(`/news?q=${encodeURIComponent(v)}`)} consent={consent} />
        <div style={{ padding: 60, textAlign: 'center', color: 'var(--text-muted)' }}>
          Новость не найдена. <a href="/news" style={{ color: '#005BFF' }}>Ко всем новостям</a>
        </div>
      </div>
    );
  }
  if (!news) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
        <PublicNewsHeader query={searchQ} onSearch={setSearchQ} onSubmit={(v) => navigate(`/news?q=${encodeURIComponent(v)}`)} consent={consent} />
        <div style={{ padding: 60, textAlign: 'center', color: 'var(--text-muted)' }}>Загрузка…</div>
      </div>
    );
  }

  const date = news.publishedAt ? new Date(news.publishedAt) : new Date(news.createdAt);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
      <PublicNewsHeader query={searchQ} onSearch={setSearchQ} onSubmit={(v) => navigate(`/news?q=${encodeURIComponent(v)}`)} consent={consent} />
      <div style={{ padding: '0 24px' }}>
      <style>{AD_COLUMNS_CSS}</style>
      <div className="news-ad-grid">
        <NewsAdColumn blocks={ads.left} />
        <div className="news-ad-main">
      {/* Карточка новости — та же, что в CRM (NewsDetail.tsx): рамка, фон, тень */}
      <div style={{ maxWidth: 800, margin: '0 auto 40px', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 16, padding: 24, boxShadow: 'var(--shadow)' }}>
        <button
          onClick={() => navigate('/news')}
          style={{
            padding: '6px 12px', borderRadius: 8, marginBottom: 16,
            background: 'transparent', border: '1px solid var(--border-color)',
            cursor: 'pointer', fontSize: 13, color: 'var(--text-primary)',
          }}
        >
          ← Ко всем новостям
        </button>

        {/* Блок новости — как в CRM: заголовок над обложкой, выжимка плашкой, мета под ней */}
        <h1 style={{ margin: '0 0 16px', fontSize: 24, fontWeight: 600, lineHeight: 1.3, color: 'var(--text-primary)' }}>{news.title}</h1>

        {/* Обложка */}
        {news.coverImage && (
          <div style={{ borderRadius: 14, overflow: 'hidden', margin: '0 0 14px' }}>
            <img
              src={news.coverImage}
              alt={news.title}
              style={{ width: '100%', maxHeight: 380, objectFit: 'cover', display: 'block' }}
              onError={(e) => { if (defaultCover) (e.target as HTMLImageElement).src = defaultCover; }}
            />
          </div>
        )}

        {/* Краткое описание — отдельным блоком между обложкой и полным текстом */}
        {news.summary && (
          <div style={{
            background: 'var(--bg-hover)',
            border: '1px solid var(--border-color)',
            borderRadius: 10,
            padding: '12px 14px',
            margin: '0 0 18px',
            fontSize: 14,
            lineHeight: 1.6,
            color: 'var(--text-secondary)',
          }}>
            {stripHtml(news.summary)}
          </div>
        )}

        {/* Мета: категория, дата, автор, реакции, просмотры */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center', fontSize: 13, color: 'var(--text-muted)', marginBottom: 18 }}>
          {news.category && (
            <span style={{
              fontWeight: 600, color: news.category.color || '#007AFF',
              background: (news.category.color || '#007AFF') + '15',
              padding: '3px 8px', borderRadius: 6, fontSize: 11,
            }}>
              {news.category.name}
            </span>
          )}
          <span>{date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
          {news.author?.name && <span>· {news.author.name}</span>}
          <span>· 👍 {news.likes || 0}</span>
          <span>· 👎 {news.dislikes || 0}</span>
          <span>· {news.views || 0} просмотров</span>
        </div>

        <div
          className="rich-text"
          style={{ fontSize: 15, lineHeight: 1.7, color: 'var(--text-color)' }}
          dangerouslySetInnerHTML={{ __html: safeHtml(news.content || '') }}
        />

        {news.sourceUrl && (
          <div style={{ marginTop: 24, fontSize: 13 }}>
            <a href={news.sourceUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#005BFF' }}>
              Источник: {news.sourceUrl}
            </a>
          </div>
        )}

        {/* Комментарии: чтение публичное, оставить можно только авторизованным */}
        <div style={{ marginTop: 40 }}>
          <h2 style={{ fontSize: 18, margin: '0 0 16px', color: 'var(--text-color)' }}>Комментарии ({comments.length})</h2>
          {canComment ? (
            <div style={{ marginBottom: 16 }}>
              <style>{'.ql-container { border-radius: 0 0 10px 10px; } .ql-toolbar { border-radius: 10px 10px 0 0; }'}</style>
              <ReactQuill
                theme="snow"
                value={commentDraft}
                onChange={setCommentDraft}
                placeholder="Написать комментарий…"
                modules={COMMENT_QUILL_MODULES}
                style={{ background: 'var(--bg-card)', borderRadius: 10 }}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
                <button
                  onClick={submitComment}
                  disabled={commentBusy || !commentPlainText(commentDraft).trim()}
                  style={{ padding: '10px 18px', borderRadius: 10, border: 'none', background: commentBusy || !commentPlainText(commentDraft).trim() ? '#9db8d2' : '#007AFF', color: '#fff', cursor: commentBusy ? 'wait' : 'pointer', fontWeight: 500 }}
                >
                  {commentBusy ? 'Отправка…' : 'Отправить'}
                </button>
              </div>
            </div>
          ) : (
          <div style={{
            padding: '14px 16px', marginBottom: 16, borderRadius: 12,
            border: '1px dashed var(--border-color)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap',
          }}>
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              Чтобы оставить комментарий, войдите в свою CRM
            </span>
            <a
              href="/"
              style={{
                padding: '8px 16px', borderRadius: 10,
                background: '#005BFF', color: '#fff',
                textDecoration: 'none', fontSize: 13, fontWeight: 600,
              }}
            >
              Войти
            </a>
          </div>
          )}
          {comments.length === 0 && (
            <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Комментариев пока нет</div>
          )}
          {comments.map((c: any) => (
            <div key={c.id} style={{ padding: '12px 0', borderBottom: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: 13, marginBottom: 4 }}>
                <span style={{ fontWeight: 600 }}>{c.author?.name || 'Пользователь'}</span>{' '}
                <span style={{ color: 'var(--text-muted)' }}>
                  {new Date(c.createdAt).toLocaleString('ru-RU')}
                </span>
              </div>
              <div style={{ fontSize: 14, whiteSpace: 'pre-wrap', color: 'var(--text-color)' }}>{c.text}</div>
            </div>
          ))}
        </div>
      </div>
        </div>
        <NewsAdColumn blocks={ads.right} />
      </div>
      </div>
    </div>
  );
}

/** Публичная страница новостей для гостей: /news — список, /news/:id — детальная */
export function PublicNewsPage({ consent = true }: { consent?: boolean }) {
  const { pathname } = useLocation();
  const detailMatch = pathname.match(/^\/news\/([^/]+)$/);
  if (detailMatch) {
    return <PublicNewsDetail id={detailMatch[1]} consent={consent} />;
  }
  return <PublicNewsList consent={consent} />;
}
