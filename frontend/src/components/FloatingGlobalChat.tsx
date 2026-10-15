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
  const [isOpen, setIsOpen] = useState(() => localStorage.getItem('floatingGlobalChatOpen') === 'true');

  const role = typeof user?.role === 'string' ? null : user?.role;
  const canAccessChat = role?.canAccessChat !== false;
  const isAdmin = user?.role === 'admin';
  const allowedPages = (user as any)?.allowedPages || [];
  const canAccessChatPage = isAdmin || allowedPages.includes('/chat');
  const isChatPage = location.pathname === '/chat';

  useEffect(() => {
    localStorage.setItem('floatingGlobalChatOpen', isOpen ? 'true' : 'false');
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  if (!user || !canAccessChatPage || !canAccessChat || isMobile || isChatPage) return null;

  return (
    <>
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
            border: '1px solid rgba(120,180,255,0.28)',
            borderRadius: 18,
            boxShadow: '0 28px 80px rgba(0,0,0,0.34), 0 14px 34px rgba(0,122,255,0.20), inset 0 1px 0 rgba(255,255,255,0.14)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
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
