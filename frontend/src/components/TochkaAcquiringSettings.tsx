import { useEffect, useState } from 'react';
import { api } from '../api/client';

// === Плагин «Эквайринг от Точки» (витрина): логин терминала + секрет подписи, платежи ===
export default function TochkaAcquiringSettings() {
  const [state, setState] = useState<any>(null);
  const [terminalKey, setTerminalKey] = useState('');
  const [password, setPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  const load = () => {
    api.tochkaAcquiring.get().then((s: any) => {
      setState(s);
      setTerminalKey(s.terminalKey || '');
    }).catch((e: any) => setMsg('Ошибка загрузки: ' + e.message));
  };

  useEffect(() => { load(); }, []);

  const toggleActive = async (checked: boolean) => {
    if (!state) return;
    setState({ ...state, isActive: checked });
    setSaving(true); setMsg('');
    try {
      const res: any = await api.tochkaAcquiring.save({ isActive: checked, terminalKey, password });
      setState((prev: any) => ({ ...prev, ...res }));
      setPassword('');
      setMsg(checked ? 'Эквайринг от Точки активирован' : 'Эквайринг от Точки деактивирован');
      setTimeout(() => setMsg(''), 4000);
    } catch (err: any) {
      setState({ ...state, isActive: !checked });
      setMsg('Ошибка: ' + err.message);
    } finally { setSaving(false); }
  };

  const saveCredentials = async () => {
    if (!state) return;
    setSaving(true); setMsg('');
    try {
      const res: any = await api.tochkaAcquiring.save({ isActive: state.isActive, terminalKey, password });
      setState((prev: any) => ({ ...prev, ...res }));
      setPassword('');
      setMsg('Данные терминала сохранены');
      setTimeout(() => setMsg(''), 4000);
    } catch (err: any) {
      setMsg('Ошибка сохранения: ' + err.message);
    } finally { setSaving(false); }
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
          checked={state?.isActive ?? false}
          onChange={(e) => toggleActive(e.target.checked)}
          disabled={!state || saving}
        />
        <span style={{ fontSize: 14, fontWeight: 500 }}>
          Активировать эквайринг от Точки (оплата заказов на витрине картой и через СБП)
        </span>
      </label>

      {/* Данные терминала */}
      <div style={{ marginBottom: 10 }}>
        <label style={labelStyle}>Логин терминала</label>
        <input
          type="text"
          value={terminalKey}
          onChange={(e) => setTerminalKey(e.target.value)}
          style={inputStyle}
          placeholder="270399294492-44530"
        />
      </div>
      <div style={{ marginBottom: 10 }}>
        <label style={labelStyle}>Секрет для подписи заказа</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={inputStyle}
          placeholder={state?.hasPassword ? '•••••••• (оставьте пустым, чтобы не менять)' : 'Секрет из личного кабинета Точки'}
        />
      </div>

      <div style={{ marginBottom: 20 }}>
        <label style={labelStyle}>URL для уведомлений банка (NotificationURL)</label>
        <input
          type="text"
          readOnly
          value={state?.webhookUrl || ''}
          style={{ ...inputStyle, color: 'var(--text-muted)' }}
          onFocus={(e) => e.target.select()}
        />
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>
          Передаётся автоматически при каждом создании платежа — регистрация в кабинете Точки не требуется
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 24 }}>
        <button
          onClick={saveCredentials}
          disabled={saving || !state}
          style={{ padding: '8px 16px', borderRadius: 10, background: '#007AFF', color: '#fff', border: 'none', cursor: saving ? 'default' : 'pointer', fontSize: 14, opacity: saving || !state ? 0.7 : 1 }}
        >
          {saving ? 'Сохранение...' : 'Сохранить'}
        </button>
        {msg && <span style={{ fontSize: 13, color: msg.startsWith('Ошибка') ? '#dc2626' : '#16a34a' }}>{msg}</span>}
      </div>

      {/* Последние платежи */}
      <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>Последние платежи</div>
      {!state?.payments?.length && <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Платежей пока не было</div>}
      {state?.payments?.map((p: any) => (
        <div
          key={p.id}
          style={{ display: 'flex', justifyContent: 'space-between', gap: 8, padding: '8px 0', borderBottom: '1px solid var(--border-color)', fontSize: 13 }}
        >
          <span style={{ color: 'var(--text-primary)' }}>Заказ №{p.saleNumber} · {p.method === 'sbp' ? 'СБП' : 'Карта'}</span>
          <span style={{ color: 'var(--text-muted)' }}>{(p.amount / 100).toLocaleString('ru-RU')} ₽</span>
          <span style={{ color: p.status === 'paid' ? '#16a34a' : p.status === 'failed' ? '#dc2626' : 'var(--text-muted)' }}>
            {p.status === 'paid' ? 'Оплачен' : p.status === 'failed' ? 'Отклонён' : 'Ожидает оплаты'}
          </span>
        </div>
      ))}
    </div>
  );
}
