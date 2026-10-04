import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { useRealtime } from '../hooks/useRealtime';
import { stripHtml } from '../lib/stripHtml';
import { useBrandNewsCover } from '../lib/branding';
import { News } from '../types';

const AUTOPLAY_MS = 6000;
const SLIDER_HEIGHT = 250;
const SWIPE_THRESHOLD = 50;

/**
 * Слайдер закреплённых на главной новостей для дашборда.
 * Одна новость — статичный блок, несколько — карусель с автопрокруткой.
 * Листание: свайп на мобильных, точки навигации под слайдером.
 * Обложка — сверху, под ней категория, заголовок и описание (без наложения текста на картинку).
 */
export function NewsSlider() {
  const navigate = useNavigate();
  const [news, setNews] = useState<News[]>([]);
  const [index, setIndex] = useState(0);
  const [slideDir, setSlideDir] = useState<'left' | 'right'>('left');
  const defaultCover = useBrandNewsCover();
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

  // Переход к слайду с анимацией по направлению
  const goTo = useCallback((next: number, dir: 'left' | 'right') => {
    setSlideDir(dir);
    setIndex(next);
  }, []);

  // Автопрокрутка (только если новостей больше одной)
  useEffect(() => {
    if (news.length <= 1) return;
    const t = setInterval(() => goTo((index + 1) % news.length, 'left'), AUTOPLAY_MS);
    return () => clearInterval(t);
  }, [news.length, index, goTo]);

  // Свайп для листания на мобильных устройствах
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || news.length <= 1) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(dx) > SWIPE_THRESHOLD) {
      if (dx < 0) goTo((index + 1) % news.length, 'left');
      else goTo((index - 1 + news.length) % news.length, 'right');
    }
    touchStartX.current = null;
  };

  if (!news.length) return null;

  const item = news[index];
  const cover = item.coverImage || defaultCover;

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
        {/* Обложка — сверху, без наложения текста */}
        {cover && (
          <img
            src={cover}
            alt=""
            style={{
              width: '100%',
              height: 120,
              objectFit: 'cover',
              display: 'block',
            }}
          />
        )}
        <div
          key={item.id}
          className={slideDir === 'left' ? 'news-slide-l' : 'news-slide-r'}
          style={{
            position: 'relative',
            padding: '16px 24px 20px',
            display: 'flex',
            flexDirection: 'column',
            minHeight: cover ? SLIDER_HEIGHT - 120 : SLIDER_HEIGHT,
            boxSizing: 'border-box',
          }}
        >
          {/* Категория + заголовок */}
          <div>
            {item.category && (
              <div style={{ marginBottom: 8 }}>
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
            <div style={{ fontSize: 20, fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.3 }}>
              {item.title}
            </div>
          </div>

          {/* Краткое описание — под картинкой, внизу блока */}
          {item.summary && (
            <div style={{
              marginTop: 'auto',
              paddingTop: 10,
              fontSize: 14,
              color: 'var(--text-secondary)',
              lineHeight: 1.5,
              maxWidth: 720,
              display: '-webkit-box',
              WebkitLineClamp: 2,
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
              onClick={() => goTo(i, i > index ? 'left' : i < index ? 'right' : slideDir)}
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
