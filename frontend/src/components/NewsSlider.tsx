import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { useRealtime } from '../hooks/useRealtime';
import { stripHtml } from '../lib/stripHtml';
import { News } from '../types';

const AUTOPLAY_MS = 6000;
const SLIDER_HEIGHT = 250;
const SWIPE_THRESHOLD = 50;

/**
 * Слайдер закреплённых на главной новостей для дашборда.
 * Одна новость — статичный блок, несколько — карусель с автопрокруткой.
 * Листание: свайп на мобильных, точки навигации под слайдером.
 * Заголовок — слева вверху, описание — слева внизу.
 */
export function NewsSlider() {
  const navigate = useNavigate();
  const [news, setNews] = useState<News[]>([]);
  const [index, setIndex] = useState(0);
  const touchStartX = useRef<number | null>(null);

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

  // Свайп для листания на мобильных устройствах
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || news.length <= 1) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(dx) > SWIPE_THRESHOLD) {
      setIndex(i => (dx < 0 ? (i + 1) % news.length : (i - 1 + news.length) % news.length));
    }
    touchStartX.current = null;
  };

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
          minHeight: SLIDER_HEIGHT,
          cursor: 'pointer',
        }}
        onClick={() => navigate(`/news/${item.id}`)}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
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
        <div style={{
          position: 'relative',
          padding: '28px 32px',
          display: 'flex',
          flexDirection: 'column',
          minHeight: SLIDER_HEIGHT,
          boxSizing: 'border-box',
        }}>
          {/* Верхний блок: категория + заголовок (слева вверху) */}
          <div>
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
            <div style={{ fontSize: 24, fontWeight: 600, color: 'var(--text-primary)' }}>
              {item.title}
            </div>
          </div>

          {/* Нижний блок: описание (слева внизу) */}
          {item.summary && (
            <div style={{
              marginTop: 'auto',
              paddingTop: 12,
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
      </div>

      {/* Точки навигации — под слайдером, между слайдером и метриками */}
      {news.length > 1 && (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: 6,
          margin: '12px 0 22px',
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
                background: i === index ? 'var(--accent-color)' : 'var(--border-color)',
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
