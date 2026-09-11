import { useEffect, useState } from 'react';
import { api } from '../api/client';

// === Плагин Beget (хостинг): настройки доступа + данные аккаунта ===
export default function BegetSettings() {
  const [settings, setSettings] = useState<{ login: string; hasPassword: boolean; isActive: boolean; isPartner: boolean } | null>(null);
  const [account, setAccount] = useState<any>(null);
  const [form, setForm] = useState({ login: '', password: '' });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    api.begetSettings.get().then((s: any) => {
      setSettings(s);
      setForm((f) => ({ ...f, login: s.login || '' }));
    }).catch(() => {});
    api.beget.account().then(setAccount).catch(() => setAccount(null));
  }, []);

  const toggleActive = async (checked: boolean) => {
    if (!settings) return;
    setSettings({ ...settings, isActive: checked });
    setSaving(true);
    try {
      const res: any = await api.begetSettings.save({ isActive: checked });
      setSettings(res);
      setMsg(checked ? 'Интеграция с Beget активирована' : 'Интеграция с Beget деактивирована');
      setTimeout(() => setMsg(''), 3000);
    } catch (err: any) {
      setSettings({ ...settings, isActive: !checked });
      setMsg('Ошибка: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const togglePartner = async (checked: boolean) => {
    if (!settings) return;
    setSettings({ ...settings, isPartner: checked });
    setSaving(true);
    try {
      const res: any = await api.begetSettings.save({ isActive: settings.isActive, isPartner: checked });
      setSettings(res);
      setMsg(checked ? 'Партнёрский кабинет включён' : 'Партнёрский кабинет выключен');
      setTimeout(() => setMsg(''), 3000);
    } catch (err: any) {
      setSettings({ ...settings, isPartner: !checked });
      setMsg('Ошибка: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMsg('');
    try {
      const payload: any = { isActive: settings?.isActive ?? false };
      if (form.login) payload.login = form.login;
      if (form.password) payload.password = form.password;
      const res: any = await api.begetSettings.save(payload);
      setSettings(res);
      setForm((f) => ({ login: res.login || '', password: '' }));
      setMsg('Настройки сохранены');
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
  const cellLabel: React.CSSProperties = { fontSize: 11, color: 'var(--text-muted)' };
  const cellValue: React.CSSProperties = { fontSize: 14, fontWeight: 500 };

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
        <span style={{ fontSize: 14, fontWeight: 500 }}>Активировать интеграцию с Beget</span>
      </label>

      {/* Партнёрский кабинет: виджет «Бегет-Партнёр» на странице директора */}
      <label
        style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6, cursor: settings?.isActive ? 'pointer' : 'default', opacity: settings?.isActive ? 1 : 0.5 }}
        title={settings?.isActive ? '' : 'Доступно при активной интеграции'}
      >
        <input
          type="checkbox"
          checked={settings?.isPartner ?? false}
          onChange={(e) => togglePartner(e.target.checked)}
          disabled={!settings || saving || !settings.isActive}
        />
        <span style={{ fontSize: 14, fontWeight: 500 }}>Партнёр</span>
      </label>
      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 20 }}>
        Показывать виджет «Бегет-Партнёр» на странице директора и собирать партнёрские данные
      </div>

      {/* Учётные данные */}
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>Логин</label>
          <input
            type="text"
            value={form.login}
            onChange={(e) => setForm({ ...form, login: e.target.value })}
            style={inputStyle}
            placeholder="Логин личного кабинета Beget"
          />
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>Пароль</label>
          <input
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            style={inputStyle}
            placeholder={settings?.hasPassword ? '•••••••• (оставьте пустым, чтобы не менять)' : 'Пароль личного кабинета Beget'}
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            type="submit"
            disabled={saving}
            style={{
              padding: '8px 16px',
              borderRadius: 10,
              background: '#007AFF',
              color: '#fff',
              border: 'none',
              cursor: saving ? 'default' : 'pointer',
              fontSize: 14,
              opacity: saving ? 0.7 : 1,
            }}
          >
            {saving ? 'Сохранение...' : 'Сохранить'}
          </button>
          {msg && <span style={{ fontSize: 13, color: msg.startsWith('Ошибка') ? '#dc2626' : '#16a34a' }}>{msg}</span>}
        </div>
      </form>

      {/* Данные аккаунта (из парсера) */}
      <div
        style={{
          marginTop: 24,
          padding: 16,
          borderRadius: 12,
          border: '1px solid var(--border-color)',
          background: 'var(--bg-input)',
        }}
      >
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Данные аккаунта</div>
        {account ? (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div><div style={cellLabel}>Логин</div><div style={cellValue}>{account.login || '—'}</div></div>
              <div><div style={cellLabel}>Тариф</div><div style={cellValue}>{account.plan_name || '—'}</div></div>
              <div><div style={cellLabel}>Баланс</div><div style={cellValue}>{account.user_balance || 0} ₽</div></div>
              <div>
                <div style={cellLabel}>Дней до блокировки</div>
                <div style={{ ...cellValue, color: (account.user_days_to_block || 0) < 7 ? '#dc2626' : 'inherit' }}>
                  {account.user_days_to_block || 0}
                </div>
              </div>
              <div><div style={cellLabel}>Диск</div><div style={cellValue}>{Math.round((account.user_quota || 0) / 1024)} / {Math.round((account.plan_quota || 0) / 1024)} МБ</div></div>
              <div><div style={cellLabel}>Сайтов</div><div style={cellValue}>{account.user_sites || 0} / {account.plan_site || 0}</div></div>
              <div><div style={cellLabel}>Сервер</div><div style={cellValue}>{account.server_name || '—'}</div></div>
              <div><div style={cellLabel}>Доменов</div><div style={cellValue}>{account.user_domains || 0}</div></div>
              <div><div style={cellLabel}>Обновлено</div><div style={cellValue}>{account.updated_at ? new Date(account.updated_at).toLocaleString('ru') : '—'}</div></div>
            </div>
            {account.error && (
              <div style={{ marginTop: 12, fontSize: 12, color: '#dc2626' }}>Ошибка парсера: {account.error}</div>
            )}
          </>
        ) : (
          <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Данные ещё не собраны парсером (запуск по расписанию)</div>
        )}
      </div>
    </div>
  );
}
