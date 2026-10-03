import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { useRealtime } from '../hooks/useRealtime';
import { stripHtml } from '../lib/stripHtml';
import { useBrandNewsCover } from '../lib/branding';
import { News } from '../types';

const CARD_HEIGHT = 150;

/**
 * Последние новости на дашборде — сетка из 3 карточек в стиле промо-блока витрины:
 * обложка + тёмный градиент снизу, заголовок слева, кнопка «Читать» справа.
 * Новости, уже показанные в слайдере закреплённых, не дублируются.
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
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginTop: 16 }}>
      {items.map(n => (
        <NewsPromoCard key={n.id} news={n} defaultCover={defaultCover} onOpen={() => navigate(`/news/${n.id}`)} />
      ))}
    </div>
  );
}

/* ---------- Карточка новости в стиле промо-блока витрины ---------- */
function NewsPromoCard({ news: n, defaultCover, onOpen }: { news: News; defaultCover?: string | null; onOpen: () => void }) {
  const [hover, setHover] = useState(false);
  const cover = n.coverImage || defaultCover;
  const summary = n.summary ? stripHtml(n.summary).slice(0, 120) : '';

  return (
    <div
      onClick={onOpen}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        position: 'relative',
        height: CARD_HEIGHT,
        borderRadius: 12,
        overflow: 'hidden',
        cursor: 'pointer',
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        boxShadow: hover ? '0 8px 24px rgba(0,0,0,.28)' : '0 2px 8px rgba(0,0,0,.18)',
        transform: hover ? 'scale3d(1.02, 1.02, 1.02)' : 'scale3d(1, 1, 1)',
        transition: 'transform .2s ease, box-shadow .2s ease',
      }}
    >
      {cover
        ? <img src={cover} alt={n.title} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
        : <div style={{ position: 'absolute', inset: 0, background: 'var(--bg-hover)' }} />}
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0) 30%, rgba(0,0,0,.78) 100%)' }} />
      {/* Текст слева, кнопка справа — раскладка как в промо-блоке витрины */}
      <div style={{ position: 'absolute', left: 14, right: 14, bottom: 12, color: '#fff', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 16, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.title}</div>
          {summary && <div style={{ fontSize: 12, opacity: .85, marginTop: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{summary}</div>}
        </div>
        {/* «Читать» — в стиле синей кнопки «В корзину» (.btn-cart) из карточки товара */}
        <span style={{
          flexShrink: 0,
          padding: '6px 14px',
          borderRadius: 10,
          fontSize: 13,
          fontWeight: 500,
          color: '#fff',
          border: '1px solid rgba(120,180,255,0.40)',
          background: 'linear-gradient(135deg, #007aff 0%, #5856d6 50%, #af52de 100%)',
          boxShadow: '0 4px 20px rgba(0,122,255,0.35), inset 0 1px 0 rgba(255,255,255,0.25)',
        }}>Читать</span>
      </div>
    </div>
  );
}
