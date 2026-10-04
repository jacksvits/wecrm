import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { useRealtime } from '../hooks/useRealtime';
import { stripHtml } from '../lib/stripHtml';
import { useBrandNewsCover } from '../lib/branding';
import { News } from '../types';

const CARD_HEIGHT = 270;

/**
 * Последние новости на дашборде — сетка из 3 карточек: обложка сверху,
 * под ней заголовок и краткое описание (без наложения текста на картинку),
 * кнопка «Читать» справа от заголовка.
 * Новости, уже показанные в слайдере закреплённых, не дублируются.
 * На мобильных (≤640px) сетка превращается в горизонтальный свайп-слайдер.
 */
export function NewsPromoBlocks() {
  const navigate = useNavigate();
  const [items, setItems] = useState<News[]>([]);
  const defaultCover = useBrandNewsCover();

  const load = useCallback(() => {
    // Запас новостей берём с запасом, чтобы после исключения закреплённых осталось 3
    Promise.all([api.news.pinned(), api.news.list('limit=10')])
      .then(([pinned, list]) => {
        const pinnedIds = new Set((Array.isArray(pinned) ? pinned : []).map((n: News) => n.id));
        // GET /api/news возвращает объект { news, total, pages, page } — поддерживаем и массив
        const listArr: News[] = Array.isArray(list) ? list : (list?.news || []);
        const latest = listArr
          .filter((n: News) => !pinnedIds.has(n.id))
          .slice(0, 3);
        setItems(latest);
      })
      .catch(() => {});
  }, []);

  useEffect(() => { load(); }, [load]);

  // Обновление при публикации/изменении новостей в реальном времени
  useRealtime(['news'], () => { load(); });

  if (!items.length) return null;

  return (
    /* marginBottom — небольшой отступ до блока метрик */
    <section style={{ marginTop: 16, marginBottom: 20 }}>
      <style>{`
        .news-promo-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; }
        /* Мобильная версия: сетка превращается в горизонтальный свайп-слайдер */
        @media (max-width: 640px) {
          .news-promo-grid { display: flex; overflow-x: auto; scroll-snap-type: x mandatory; -webkit-overflow-scrolling: touch; padding-bottom: 4px; }
          .news-promo-grid::-webkit-scrollbar { display: none; }
          .news-promo-card { flex: 0 0 82%; scroll-snap-align: center; }
        }
      `}</style>
      {/* Кнопка «Все новости» — слева над блоками */}
      <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: 12 }}>
        <button
          onClick={() => navigate('/news')}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 10, border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-secondary)', fontSize: 13, cursor: 'pointer' }}
        >
          Все новости →
        </button>
      </div>
      <div className="news-promo-grid">
        {items.map(n => (
          <NewsPromoCard key={n.id} news={n} defaultCover={defaultCover} onOpen={() => navigate(`/news/${n.id}`)} />
        ))}
      </div>
    </section>
  );
}

/* ---------- Карточка новости в стиле промо-блока витрины ---------- */
function NewsPromoCard({ news: n, defaultCover, onOpen }: { news: News; defaultCover?: string | null; onOpen: () => void }) {
  const [hover, setHover] = useState(false);
  const cover = n.coverImage || defaultCover;
  const summary = n.summary ? stripHtml(n.summary).slice(0, 120) : '';

  return (
    <div
      className="news-promo-card"
      onClick={onOpen}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        height: CARD_HEIGHT,
        borderRadius: 12,
        overflow: 'hidden',
        cursor: 'pointer',
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        boxShadow: hover ? '0 8px 24px rgba(0,0,0,.28)' : '0 2px 8px rgba(0,0,0,.18)',
        transform: hover ? 'scale3d(1.02, 1.02, 1.02)' : 'scale3d(1, 1, 1)',
        transition: 'transform .2s ease, box-shadow .2s ease',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Обложка сверху — без наложения текста */}
      {cover
        ? <img src={cover} alt={n.title} style={{ width: '100%', height: 164, objectFit: 'cover', display: 'block', flexShrink: 0 }} />
        : <div style={{ width: '100%', height: 164, background: 'var(--bg-hover)', flexShrink: 0 }} />}
      {/* Текст под обложкой: заголовок слева, кнопка «Читать» справа, описание ниже */}
      <div style={{ flex: 1, minHeight: 0, padding: '10px 12px 12px', display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
          <div style={{ minWidth: 0, fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.title}</div>
          {/* «Читать» — в стиле синей кнопки «В корзину» (.btn-cart) из карточки товара */}
          <span style={{
            flexShrink: 0,
            padding: '5px 12px',
            borderRadius: 10,
            fontSize: 12,
            fontWeight: 500,
            color: '#fff',
            border: '1px solid rgba(120,180,255,0.40)',
            background: 'linear-gradient(135deg, #007aff 0%, #5856d6 50%, #af52de 100%)',
            boxShadow: '0 4px 20px rgba(0,122,255,0.35), inset 0 1px 0 rgba(255,255,255,0.25)',
          }}>Читать</span>
        </div>
        {summary && <div style={{ fontSize: 12, lineHeight: 1.45, color: 'var(--text-secondary)', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{summary}</div>}
      </div>
    </div>
  );
}
