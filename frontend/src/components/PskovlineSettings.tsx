import { useEffect, useState } from 'react';
import { api } from '../api/client';

// === Плагин Псковлайн (провайдер): мультиаккаунты + расписание обновления ===
interface AccountRow {
  id?: number;
  label: string;
  login: string;
  password: string;
  hasPassword?: boolean;
}

export default function PskovlineSettings() {
  const [settings, setSettings] = useState<{ isActive: boolean; updateTime: string; accounts: AccountRow[] } | null>(null);
  const [accounts, setAccounts] = useState<AccountRow[]>([]);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    api.pskovlinePlugin.get().then((s: any) => {
      setSettings({ isActive: s.isActive, updateTime: s.updateTime, accounts: s.accounts });
      setAccounts(s.accounts.map((a: any) => ({ id: a.id, label: a.label, login: a.login, password: '', hasPassword: a.hasPassword })));
    }).catch(() => {});
  }, []);

  const toggleActive = async (checked: boolean) => {
    if (!settings) return;
    setSettings({ ...settings, isActive: checked });
    setSaving(true);
    try {
      const res: any = await api.pskovlinePlugin.save({ isActive: checked });
      setSettings((prev: any) => ({ ...prev, ...res, accounts: prev.accounts }));
      setMsg(checked ? 'Интеграция с Псковлайн активирована' : 'Интеграция с Псковлайн деактивирована');
      setTimeout(() => setMsg(''), 3000);
    } catch (err: any) {
      setSettings({ ...settings, isActive: !checked });
      setMsg('Ошибка: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const saveUpdateTime = async (value: string) => {
    if (!settings || !/^\d{2}:\d{2}$/.test(value) || value === settings.updateTime) return;
    setSettings({ ...settings, updateTime: value });
    setSaving(true);
    try {
      const res: any = await api.pskovlinePlugin.save({ isActive: settings.isActive, updateTime: value });
      setSettings((prev: any) => ({ ...prev, ...res, accounts: prev.accounts }));
      setMsg(`Ежедневное обновление: ${value}`);
      setTimeout(() => setMsg(''), 3000);
    } catch (err: any) {
      setSettings({ ...settings, updateTime: settings.updateTime });
      setMsg('Ошибка: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const updateAccount = (idx: number, patch: Partial<AccountRow>) => {
    setAccounts((prev) => prev.map((a, i) => (i === idx ? { ...a, ...patch } : a)));
  };

  const saveAccounts = async () => {
    if (!settings) return;
    setSaving(true);
    setMsg('');
    try {
      const payload = accounts.map((a) => ({ id: a.id, label: a.label, login: a.login, password: a.password }));
      const res: any = await api.pskovlinePlugin.save({ isActive: settings.isActive, accounts: payload });
      setSettings((prev: any) => ({ ...prev, ...res }));
      setAccounts(res.accounts.map((a: any) => ({ id: a.id, label: a.label, login: a.login, password: '', hasPassword: a.hasPassword })));
      setMsg('Аккаунты сохранены');
      setTimeout(() => setMsg(''), 3000);
    } catch (err: any) {
      setMsg('Ошибка сохранения: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '8px 12px',
    borderRadius: 8,
    border: '1px solid var(--border-color)',
    background: 'var(--bg-input)',
    color: 'var(--text-primary)',
    fontSize: 13,
    outline: 'none',
  };
  const labelStyle: React.CSSProperties = { display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500 };

  return (
    <div style={{ maxWidth: 600 }}>
      {/* Активация */}
      <label style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, cursor: 'pointer' }}>
        <input
          type="checkbox"
          checked={settings?.isActive ?? false}
          onChange={(e) => toggleActive(e.target.checked)}
          disabled={!settings || saving}
        />
        <span style={{ fontSize: 14, fontWeight: 500 }}>Активировать интеграцию с Псковлайн</span>
      </label>

      {/* Время ежедневного обновления */}
      <div style={{ marginBottom: 20 }}>
        <label style={labelStyle}>Ежедневное обновление данных</label>
        <input
          type="time"
          value={settings?.updateTime ?? '08:00'}
          onChange={(e) => saveUpdateTime(e.target.value)}
          disabled={!settings || saving}
          style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-primary)', fontSize: 13, outline: 'none' }}
        />
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>
          Балансы собираются один раз в день в указанное время
        </div>
      </div>

      {/* Аккаунты-подключения */}
      <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 6 }}>Аккаунты-подключения</div>
      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>
        Каждый аккаунт — отдельный виджет на странице директора (вкладка «Бухгалтерия»)
      </div>

      {accounts.map((acc, idx) => (
        <div
          key={idx}
          style={{
            marginBottom: 12,
            padding: 14,
            borderRadius: 12,
            border: '1px solid var(--border-color)',
            background: 'var(--bg-input)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)' }}>Аккаунт {idx + 1}</span>
            <button
              onClick={() => setAccounts((prev) => prev.filter((_, i) => i !== idx))}
              style={{ padding: '4px 10px', borderRadius: 8, border: '1px solid var(--border-color)', background: 'transparent', color: '#dc2626', fontSize: 12, cursor: 'pointer' }}
            >
              Удалить
            </button>
          </div>
          <div style={{ marginBottom: 10 }}>
            <label style={labelStyle}>Название</label>
            <input type="text" value={acc.label} onChange={(e) => updateAccount(idx, { label: e.target.value })} style={inputStyle} placeholder={`Псковлайн ${idx + 1}`} />
          </div>
          <div style={{ marginBottom: 10 }}>
            <label style={labelStyle}>Логин</label>
            <input type="text" value={acc.login} onChange={(e) => updateAccount(idx, { login: e.target.value })} style={inputStyle} placeholder="Номер лицевого счёта" />
          </div>
          <div>
            <label style={labelStyle}>Пароль</label>
            <input
              type="password"
              value={acc.password}
              onChange={(e) => updateAccount(idx, { password: e.target.value })}
              style={inputStyle}
              placeholder={acc.hasPassword ? '•••••••• (оставьте пустым, чтобы не менять)' : 'Пароль личного кабинета'}
            />
          </div>
        </div>
      ))}

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <button
          onClick={() => setAccounts((prev) => [...prev, { label: `Псковлайн ${prev.length + 1}`, login: '', password: '' }])}
          style={{ padding: '8px 16px', borderRadius: 10, border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-primary)', fontSize: 14, cursor: 'pointer' }}
        >
          + Добавить аккаунт
        </button>
        <button
          onClick={saveAccounts}
          disabled={saving || !settings}
          style={{ padding: '8px 16px', borderRadius: 10, background: '#007AFF', color: '#fff', border: 'none', cursor: saving ? 'default' : 'pointer', fontSize: 14, opacity: saving || !settings ? 0.7 : 1 }}
        >
          {saving ? 'Сохранение...' : 'Сохранить аккаунты'}
        </button>
        {msg && <span style={{ fontSize: 13, color: msg.startsWith('Ошибка') ? '#dc2626' : '#16a34a' }}>{msg}</span>}
      </div>
    </div>
  );
}
