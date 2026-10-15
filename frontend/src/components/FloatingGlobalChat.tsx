import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useIsMobile } from '../hooks/useIsMobile';
import { GlobalChat } from './GlobalChat';

const CHAT_SVG = (
  <svg width='26' height='26' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'>
    <path d='M21 11.5a8.38 8.38 0 0 1-8.5 8.5c-1.5 0-2.9-.36-4.1-1L3 20l1.1-5.4A8.5 8.5 0 1 1 21 11.5z' />
    <path d='M8.5 10.5h7' />
    <path d='M8.5 13.5h4' />
  </svg>
);

export function FloatingGlobalChat() {
  const { user } = useAuth();
  const location = useLocation();
  const isMobile = useIsMobile();
  const [isOpen, setIsOpen] = useState(false);

  const role = typeof user?.role === 'string' ? null : user?.role;
  const canAccessChat = role?.canAccessChat !== false;
  const isChatPage = location.pathname === '/chat';

  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  if (!user || !canAccessChat || isMobile || isChatPage) return null;

  return (
    <>
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          style={{ position: 'fixed', inset: 0, zIndex: 1490 }}
          aria-hidden='true'
        />
      )}

      {isOpen && (
        <section
          aria-label='Общий чат'
          style={{
            position: 'fixed',
            right: 24,
            bottom: 96,
            width: 380,
            height: 560,
            maxHeight: 'calc(100vh - 120px)',
            zIndex: 1495,
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: 16,
            boxShadow: 'var(--shadow)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <header
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
              padding: '10px 10px 10px 16px',
              borderBottom: '1px solid var(--border-color)',
              background: 'var(--bg-header)',
              flexShrink: 0,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-color)', flexShrink: 0 }}>
                {CHAT_SVG}
              </span>
              <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                Общий чат
              </span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              title='Закрыть чат'
              style={{
                width: 36,
                height: 36,
                borderRadius: 12,
                border: 'none',
                background: 'transparent',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 22,
                lineHeight: 1,
                transition: 'all 0.15s ease',
              }}
            >
              ×
            </button>
          </header>

          <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
            <GlobalChat />
          </div>
        </section>
      )}

      <button
        onClick={() => setIsOpen(prev => !prev)}
        title={isOpen ? 'Закрыть общий чат' : 'Открыть общий чат'}
        aria-expanded={isOpen}
        className='desktop-only'
        style={{
          position: 'fixed',
          right: 24,
          bottom: 24,
          width: 56,
          height: 56,
          borderRadius: '50%',
          border: '1px solid rgba(120,180,255,0.40)',
          background: 'linear-gradient(135deg, #007aff 0%, #5856d6 100%)',
          color: '#fff',
          cursor: 'pointer',
          zIndex: 1500,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 8px 24px rgba(0,122,255,0.35), inset 0 1px 0 rgba(255,255,255,0.25)',
          transition: 'transform 0.15s ease, box-shadow 0.15s ease',
        }}
      >
        {isOpen ? <span style={{ fontSize: 28, lineHeight: 1, transform: 'translateY(-1px)' }}>×</span> : CHAT_SVG}
      </button>
    </>
  );
}
