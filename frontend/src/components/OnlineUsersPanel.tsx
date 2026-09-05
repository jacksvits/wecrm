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

export function OnlineUsersPanel() {
  const [users, setUsers] = useState<OnlineUser[]>([]);

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
    <div style={{ padding: 20, borderRadius: 16, border: '1px solid var(--border-color)', background: 'var(--bg-card)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>Пользователи онлайн</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#16a34a', display: 'inline-block' }} />
          <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{users.length}</span>
        </div>
      </div>

      {users.length === 0 ? (
        <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 13, padding: 16 }}>
          Нет пользователей онлайн
        </div>
      ) : (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
          {users.map(u => (
            <div key={u.id} style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 12px',
              borderRadius: 12,
              background: 'var(--bg-body)',
            }}>
              <Avatar name={u.name} avatar={u.avatar} size={28} />
              <div>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{u.name}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{u.role?.name || '—'}</div>
              </div>
              <span style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: '#16a34a',
                flexShrink: 0,
              }} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
