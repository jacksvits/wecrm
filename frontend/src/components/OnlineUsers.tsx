import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { Avatar } from './Avatar';

interface OnlineUser {
  id: string;
  name: string;
  email: string;
  avatar?: string | null;
  role?: { name: string };
  lastActiveAt: string;
}

export function OnlineUsers() {
  const [users, setUsers] = useState<OnlineUser[]>([]);
  const [open, setOpen] = useState(false);

  const loadOnline = () => {
    api.users.online().then((data: OnlineUser[]) => {
      setUsers(data);
    }).catch(() => {});
  };

  // Heartbeat every 30 seconds
  useEffect(() => {
    const heartbeat = setInterval(() => {
      api.users.heartbeat().catch(() => {});
    }, 30000);
    return () => clearInterval(heartbeat);
  }, []);

  // Load online users every 15 seconds
  useEffect(() => {
    loadOnline();
    const interval = setInterval(loadOnline, 15000);
    return () => clearInterval(interval);
  }, []);

  // Send initial heartbeat
  useEffect(() => {
    api.users.heartbeat().catch(() => {});
  }, []);

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          position: 'relative',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          fontSize: 20,
          padding: 8,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--text-secondary)',
        }}
        title="Пользователи онлайн"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
          <circle cx="9" cy="7" r="4"/>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
        </svg>
        {users.length > 0 && (
          <span style={{
            position: 'absolute',
            top: 2,
            right: 2,
            background: '#16a34a',
            color: '#fff',
            borderRadius: '50%',
            width: 16,
            height: 16,
            fontSize: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 600,
          }}>{users.length}</span>
        )}
      </button>

      {open && (
        <>
          <div
            onClick={() => setOpen(false)}
            style={{ position: 'fixed', inset: 0, zIndex: 9998 }}
          />
          <div style={{
            position: 'absolute',
            bottom: 'calc(100% + 8px)',
            left: 0,
            width: 260,
            maxHeight: 360,
            overflow: 'auto',
            background: 'var(--bg-card)',
            borderRadius: 16,
            boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
            zIndex: 9999,
            border: '1px solid var(--border-color)',
          }}>
            <div style={{
              padding: '14px 16px',
              borderBottom: '1px solid #f0f0f0',
              fontWeight: 700,
              fontSize: 14,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              position: 'sticky',
              top: 0,
              background: 'var(--bg-card)',
              borderRadius: '16px 16px 0 0',
            }}>
              <span>Онлайн ({users.length})</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#16a34a', display: 'inline-block' }} />
              </div>
            </div>

            {users.length === 0 ? (
              <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                Нет пользователей онлайн
              </div>
            ) : (
              users.map(u => (
                <div key={u.id} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '10px 16px',
                  borderBottom: '1px solid #f5f5f5',
                }}>
                  <Avatar name={u.name} avatar={u.avatar} size={32} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {u.role?.name || '—'}
                    </div>
                  </div>
                  <span style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: '#16a34a',
                    flexShrink: 0,
                  }} />
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}
