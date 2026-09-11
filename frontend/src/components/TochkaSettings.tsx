import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { User } from '../types';

const INTERVALS = [
  { value: 5, label: '5 минут' },
  { value: 15, label: '15 минут' },
  { value: 30, label: '30 минут' },
  { value: 60, label: '1 час' },
  { value: 360, label: '6 часов' },
];

// === Плагин «Точка Банк» (Финансы): OAuth-подключение, счета, названия, порядок ===
export default function TochkaSettings() {
  const [state, setState] = useState<any>(null);
  const [msg, setMsg] = useState('');
  const [connecting, setConnecting] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [accountUsers, setAccountUsers] = useState<Record<string, string>>({});

  const load = () => {
    api.tochkaPlugin.get().then(setState).catch((e: any) => setMsg('Ошибка загрузки: ' + e.message));
  };

  useEffect(() => {
    load();
    api.users.list().then(setUsers).catch(() => {});
    const token = localStorage.getItem('token');
    fetch('/api/tochka/account-users', { headers: token ? { Authorization: `Bearer ${token}` } : {} })
      .then((r) => (r.ok ? r.json() : {}))
      .then((m) => setAccountUsers(m || {}))
      .catch(() => {});
    if (window.location.search.includes('tochka=connected')) {
      window.history.replaceState({}, '', '/settings');
      setMsg('Банк подключён');
      setTimeout(() => setMsg(''), 5000);
    }
  }, []);

  const connect = async () => {
    setConnecting(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/tochka/auth-url', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      }).then((r) => (r.ok ? r.json() : Promise.reject(new Error('Ошибка запроса'))));
      if (res.authUrl) window.location.href = res.authUrl;
    } catch (e: any) {
      setMsg('Ошибка: ' + e.message);
      setConnecting(false);
    }
  };

  const rename = async (accountId: string, name: string) => {
    try {
      const token = localStorage.getItem('token');
      await fetch('/api/tochka/account-names', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ accountId, name }),
      });
      load();
    } catch (e: any) {
      setMsg('Ошибка: ' + e.message);
    }
  };

  const move = async (accountId: string, dir: -1 | 1) => {
    const accounts: any[] = state?.accounts || [];
    const idx = accounts.findIndex((a) => a.id === accountId);
    const to = idx + dir;
    if (idx < 0 || to < 0 || to >= accounts.length) return;
    const order = accounts.map((a) => a.id);
    [order[idx], order[to]] = [order[to], order[idx]];
    try {
      const token = localStorage.getItem('token');
      await fetch('/api/tochka/account-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ order }),
      });
      load();
    } catch (e: any) {
      setMsg('Ошибка: ' + e.message);
    }
  };

  // Привязка счёта к пользователю CRM (только админ; пустой userId — отвязать)
  const linkAccount = async (accountId: string, userId: string) => {
    try {
      const token = localStorage.getItem('token');
      await fetch('/api/tochka/account-users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ accountId, userId }),
      });
      setAccountUsers((prev) => {
        const next = { ...prev };
        if (userId) next[accountId] = userId;
        else delete next[accountId];
        return next;
      });
    } catch (e: any) {
      setMsg('Ошибка: ' + e.message);
    }
  };

  const inputStyle: React.CSSProperties = {
    padding: '6px 10px',
    borderRadius: 8,
    border: '1px solid var(--border-color)',
    background: 'var(--bg-input)',
    color: 'var(--text-primary)',
    fontSize: 13,
    outline: 'none',
    width: '100%',
  };

  return (
    <div style={{ maxWidth: 640 }}>
      {/* Статус подключения */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          marginBottom: 16,
          padding: 12,
          borderRadius: 12,
          border: '1px solid var(--border-color)',
          background: 'var(--bg-input)',
        }}
      >
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '3px 10px',
            borderRadius: 999,
            fontSize: 12,
            fontWeight: 500,
            background: state?.connected ? '#dcfce7' : '#f3f4f6',
            color: state?.connected ? '#16a34a' : '#6b7280',
          }}
        >
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: state?.connected ? '#16a34a' : '#9ca3af' }} />
          {state?.connected ? 'Подключено' : 'Не подключено'}
        </span>
        {state?.connected && state?.expiresAt && (
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            Токен до {new Date(state.expiresAt).toLocaleString('ru')}
          </span>
        )}
        <div style={{ flex: 1 }} />
        {!state?.connected && (
          <button
            onClick={connect}
            disabled={connecting}
            style={{ padding: '8px 16px', borderRadius: 10, background: '#007AFF', color: '#fff', border: 'none', cursor: connecting ? 'default' : 'pointer', fontSize: 13, opacity: connecting ? 0.7 : 1 }}
          >
            {connecting ? 'Подключение...' : 'Подключить банк'}
          </button>
        )}
      </div>
      {/* Интервал обновления данных */}
      <div style={{ marginBottom: 16 }}>
        <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500 }}>Интервал обновления данных</label>
        <select
          value={state?.updateIntervalMinutes ?? 15}
          onChange={(e) => {
            const interval = Number(e.target.value);
            api.tochkaPlugin.save({ updateIntervalMinutes: interval })
              .then(() => { setState((prev: any) => ({ ...prev, updateIntervalMinutes: interval })); setMsg(`Интервал обновления: ${INTERVALS.find(i => i.value === interval)?.label}`); setTimeout(() => setMsg(''), 3000); })
              .catch((err: any) => setMsg('Ошибка: ' + err.message));
          }}
          disabled={!state}
          style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-primary)', fontSize: 13, outline: 'none' }}
        >
          {INTERVALS.map((i) => <option key={i.value} value={i.value}>{i.label}</option>)}
        </select>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>
          Данные банка кэшируются на сервере и обновляются не чаще выбранного интервала
          {state?.cachedAt ? ` · обновлено ${new Date(state.cachedAt).toLocaleTimeString('ru')}` : ''}
        </div>
      </div>

      {msg && <div style={{ fontSize: 13, color: msg.startsWith('Ошибка') ? '#dc2626' : '#16a34a', marginBottom: 12 }}>{msg}</div>}
      {state?.error && <div style={{ fontSize: 13, color: '#dc2626', marginBottom: 12 }}>Ошибка API банка: {state.error}</div>}

      {/* Счета */}
      {state?.connected && (
        <>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 6 }}>Счета</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>
            Названия и порядок счетов используются в виджетах на странице директора
          </div>
          {(state?.accounts || []).map((acc: any, idx: number, arr: any[]) => (
            <div
              key={acc.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                marginBottom: 8,
                padding: '10px 12px',
                borderRadius: 12,
                border: '1px solid var(--border-color)',
                background: 'var(--bg-input)',
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <button onClick={() => move(acc.id, -1)} disabled={idx === 0} style={{ border: 'none', background: 'transparent', cursor: idx === 0 ? 'default' : 'pointer', color: 'var(--text-muted)', fontSize: 11, padding: 0 }}>▲</button>
                <button onClick={() => move(acc.id, 1)} disabled={idx === arr.length - 1} style={{ border: 'none', background: 'transparent', cursor: idx === arr.length - 1 ? 'default' : 'pointer', color: 'var(--text-muted)', fontSize: 11, padding: 0 }}>▼</button>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <input
                  type="text"
                  defaultValue={acc.name}
                  onBlur={(e) => e.target.value !== acc.name && rename(acc.id, e.target.value)}
                  style={inputStyle}
                  placeholder="Название счёта"
                />
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>••{acc.short}</div>
                <select
                  value={accountUsers[acc.id] || ''}
                  onChange={(e) => linkAccount(acc.id, e.target.value)}
                  style={{ ...inputStyle, marginTop: 6, fontSize: 12, cursor: 'pointer' }}
                >
                  <option value=''>— не привязан к пользователю —</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
                </select>
              </div>
              <div style={{ fontSize: 15, fontWeight: 600, whiteSpace: 'nowrap' }}>
                {(acc.balance ?? 0).toLocaleString('ru-RU', { minimumFractionDigits: 2 })} ₽
              </div>
            </div>
          ))}
          <div style={{ marginTop: 10, fontSize: 15, fontWeight: 600, textAlign: 'right' }}>
            Итого: {(state?.totalBalance ?? 0).toLocaleString('ru-RU', { minimumFractionDigits: 2 })} ₽
          </div>
        </>
      )}
    </div>
  );
}
