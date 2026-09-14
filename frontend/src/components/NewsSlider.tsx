import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { useRealtime } from '../hooks/useRealtime';
import { stripHtml } from '../lib/stripHtml';
import { News } from '../types';

const AUTOPLAY_MS = 6000;

/**
 * Слайдер закреплённых на главной новостей для дашборда.
 * Одна новость — статичный блок, несколько — карусель с автопрокруткой.
 * Точки навигации расположены под слайдером (между слайдером и метриками).
 */
export function NewsSlider() {
  const navigate = useNavigate();
  const [news, setNews] = useState<News[]>([]);
  const [index, setIndex] = useState(0);

  const load = useCallback(() => {
    api.news.pinned()
      .then((data) => {
        setNews(Array.isArray(data) ? data : []);
        setIndex(0);
      })
      .catch(() => {});
  }, []);

  useEffect(() => { load(); }, [load]);

  // Обновление при публикации/изменении новостей в реальном времени
  useRealtime(['news'], () => { load(); });

  // Автопрокрутка (только если новостей больше одной)
  useEffect(() => {
    if (news.length <= 1) return;
    const t = setInterval(() => setIndex(i => (i + 1) % news.length), AUTOPLAY_MS);
    return () => clearInterval(t);
  }, [news.length]);

  if (!news.length) return null;

  const item = news[index];

  return (
    <div style={{ flexShrink: 0 }}>
      {/* Карточка слайдера */}
      <div
        style={{
          position: 'relative',
          borderRadius: 16,
          overflow: 'hidden',
          border: '1px solid var(--border-color)',
          background: 'var(--bg-card)',
          boxShadow: 'var(--shadow)',
          minHeight: 210,
          cursor: 'pointer',
        }}
        onClick={() => navigate(`/news/${item.id}`)}
      >
        {item.coverImage && (
          <img
            src={item.coverImage}
            alt=""
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              opacity: 0.3,
            }}
          />
        )}
        <div style={{ position: 'relative', padding: '32px 36px' }}>
          {item.category && (
            <div style={{ marginBottom: 10 }}>
              <span style={{
                fontSize: 12,
                fontWeight: 500,
                color: item.category.color,
                background: item.category.color + '18',
                padding: '2px 8px',
                borderRadius: 10,
              }}>
                {item.category.name}
              </span>
            </div>
          )}
          <div style={{ fontSize: 24, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8 }}>
            {item.title}
          </div>
          {item.summary && (
            <div style={{
              fontSize: 14,
              color: 'var(--text-secondary)',
              lineHeight: 1.5,
              maxWidth: 720,
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}>
              {stripHtml(item.summary)}
            </div>
          )}
        </div>

        {news.length > 1 && (
          <>
            <button
              onClick={(e) => { e.stopPropagation(); setIndex((index - 1 + news.length) % news.length); }}
              style={{
                position: 'absolute',
                left: 8,
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'rgba(0,0,0,0.4)',
                color: '#fff',
                border: 'none',
                borderRadius: '50%',
                width: 32,
                height: 32,
                cursor: 'pointer',
                fontSize: 16,
                lineHeight: 1,
              }}
            >‹</button>
            <button
              onClick={(e) => { e.stopPropagation(); setIndex((index + 1) % news.length); }}
              style={{
                position: 'absolute',
                right: 8,
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'rgba(0,0,0,0.4)',
                color: '#fff',
                border: 'none',
                borderRadius: '50%',
                width: 32,
                height: 32,
                cursor: 'pointer',
                fontSize: 16,
                lineHeight: 1,
              }}
            >›</button>
          </>
        )}
      </div>

      {/* Точки навигации — под слайдером, между слайдером и метриками */}
      {news.length > 1 && (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: 6,
          margin: '6px 0 16px',
        }}>
          {news.map((n, i) => (
            <div
              key={n.id}
              onClick={() => setIndex(i)}
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                cursor: 'pointer',
                background: i === index ? '#007AFF' : 'var(--border-color)',
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
