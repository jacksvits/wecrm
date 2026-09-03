import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { api } from '../api/client';

export function Notifications() {
  const { user } = useAuth();
  const soundEnabled = (user as any)?.soundEnabled !== false;
  const [items, setItems] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const loadNotifications = () => {
    api.notifications.list(5).then((data: any) => {
      setItems(data.items || []);
      setUnreadCount(data.unreadCount || 0);
    }).catch(() => {});
  };

  useEffect(() => {
    if (!user) return;
    loadNotifications();
    const token = localStorage.getItem('token');
    const es = new EventSource('/api/notifications/stream' + (token ? '?token=' + encodeURIComponent(token) : ''));
    es.onmessage = (e) => {
      const msg = JSON.parse(e.data);
      if (msg.type === 'connected') return;
      loadNotifications();
      if (soundEnabled && msg.type === 'notification') {
        const audio = new Audio('/icq-message.mp3');
        audio.volume = 0.5;
        audio.play().catch(() => {});
      }
    };
    es.onerror = () => {};
    return () => es.close();
  }, [user]);

  // Close on click outside
  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (
        dropdownRef.current && !dropdownRef.current.contains(e.target as Node) &&
        buttonRef.current && !buttonRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  // Calculate dropdown position
  const calculatePosition = useCallback(() => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const isMobile = vw < 768;
    const dropdownWidth = 360;
    const dropdownHeight = Math.min(420, vh * 0.7);

    let style: React.CSSProperties = {
      position: 'fixed',
      zIndex: 9999,
      width: dropdownWidth,
      maxHeight: dropdownHeight,
      overflow: 'auto',
      background: 'var(--bg-card)',
      borderRadius: 16,
      boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
    };

    if (isMobile) {
      // Mobile: centered overlay
      style.left = Math.max(12, (vw - dropdownWidth) / 2);
      style.top = Math.max(12, (vh - dropdownHeight) / 2);
      style.width = Math.min(dropdownWidth, vw - 24);
    } else {
      // Desktop: sidebar mode — show to the right of the button
      const rightSpace = vw - rect.right;
      const leftSpace = rect.left;

      if (rightSpace >= dropdownWidth + 12) {
        // Enough space on the right
        style.left = rect.right + 8;
      } else if (leftSpace >= dropdownWidth + 12) {
        // Show on the left
        style.left = rect.left - dropdownWidth - 8;
      } else {
        // Fallback: align to right edge of viewport
        style.right = 12;
      }

      // Vertical positioning: prefer above if button is in bottom half
      const bottomSpace = vh - rect.bottom;
      if (rect.top > vh / 2 && rect.top >= dropdownHeight + 12) {
        // Button in bottom half, show above
        style.bottom = vh - rect.top + 8;
        style.top = 'auto';
      } else if (bottomSpace >= dropdownHeight + 12) {
        // Show below
        style.top = rect.bottom + 8;
      } else {
        // Center vertically
        style.top = Math.max(12, (vh - dropdownHeight) / 2);
      }
    }

    setDropdownStyle(style);
  }, []);

  useEffect(() => {
    if (open) {
      calculatePosition();
      window.addEventListener('resize', calculatePosition);
      window.addEventListener('scroll', calculatePosition, true);
      return () => {
        window.removeEventListener('resize', calculatePosition);
        window.removeEventListener('scroll', calculatePosition, true);
      };
    }
  }, [open, calculatePosition]);

  const markRead = (id: string) => {
    api.notifications.markRead(id).then(() => {
      setItems(prev => prev.map(n => n.id === id ? { ...n, readAt: new Date() } : n));
      setUnreadCount(c => Math.max(0, c - 1));
    }).catch(() => {});
  };

  const markAllRead = () => {
    api.notifications.markAllRead().then(() => {
      setItems(prev => prev.map(n => ({ ...n, readAt: new Date() })));
      setUnreadCount(0);
    }).catch(() => {});
  };

  if (!user) return null;

  return (
    <>
      <button
        ref={buttonRef}
        onClick={() => { if (!open) calculatePosition(); setOpen(!open); }}
        style={{ position: 'relative', background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, padding: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/>
          <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>
        </svg>
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute',
            top: 2,
            right: 2,
            background: '#dc2626',
            color: '#fff',
            borderRadius: '50%',
            width: 16,
            height: 16,
            fontSize: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 600,
          }}>{unreadCount > 9 ? '9+' : unreadCount}</span>
        )}
      </button>

      {open && (
        <div ref={dropdownRef} style={dropdownStyle}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '14px 18px',
            borderBottom: '1px solid #f0f0f0',
            position: 'sticky',
            top: 0,
            background: 'var(--bg-card)',
            borderRadius: '16px 16px 0 0',
            zIndex: 1,
          }}>
            <span style={{ fontWeight: 700, fontSize: 15 }}>Уведомления</span>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              {unreadCount > 0 && (
                <button onClick={markAllRead} style={{ background: 'none', border: 'none', color: '#007AFF', fontSize: 12, cursor: 'pointer', fontWeight: 500 }}>
                  Прочитать все
                </button>
              )}
              <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 18, cursor: 'pointer', lineHeight: 1, padding: 0 }}>✕</button>
            </div>
          </div>

          {items.length === 0 ? (
            <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>🔔</div>
              Нет уведомлений
            </div>
          ) : (
            items.map(n => (
              <div
                key={n.id}
                onClick={async () => {
                  if (!n.readAt) await api.notifications.markRead(n.id);
                  if (n.url) window.location.href = n.url;
                }}
                style={{
                  padding: '12px 18px',
                  borderBottom: '1px solid #f5f5f5',
                  cursor: 'pointer',
                  background: n.readAt ? '#fff' : '#f0f7ff',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#f9f9f9'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = n.readAt ? '#fff' : '#f0f7ff'; }}
              >
                <div style={{ fontWeight: n.readAt ? 400 : 600, fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.4 }}>{n.title}</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4, lineHeight: 1.4 }}>{n.body}</div>
                <div style={{ fontSize: 11, color: '#aaa', marginTop: 6 }}>{new Date(n.createdAt).toLocaleString('ru')}</div>
              </div>
            ))
          )}
        </div>
      )}
    </>
  );
}
