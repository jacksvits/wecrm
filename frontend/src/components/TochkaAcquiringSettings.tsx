import { useEffect, useState } from 'react';
import { api } from '../api/client';

// === Плагин «Эквайринг от Точки» (витрина): активация, статус подключения, платежи ===
// Авторизация — общая OAuth «Точка Банк» (нужен scope acquiring, см. плагин «Точка Банк»).
export default function TochkaAcquiringSettings() {
  const [state, setState] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  const load = () => {
    api.tochkaAcquiring.get().then((s: any) => setState(s)).catch((e: any) => setMsg('Ошибка загрузки: ' + e.message));
  };

  useEffect(() => { load(); }, []);

  const toggleActive = async (checked: boolean) => {
    if (!state) return;
    setState({ ...state, isActive: checked });
    setSaving(true); setMsg('');
    try {
      const res: any = await api.tochkaAcquiring.save({ isActive: checked });
      setState((prev: any) => ({ ...prev, ...res }));
      setMsg(checked ? 'Эквайринг от Точки активирован' : 'Эквайринг от Точки деактивирован');
      setTimeout(() => setMsg(''), 4000);
    } catch (err: any) {
      setState({ ...state, isActive: !checked });
      setMsg('Ошибка: ' + err.message);
    } finally { setSaving(false); }
  };

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
          Активировать эквайринг от Точки (оплата заказов на витрине банковской картой, через СБП, T-Pay и «Долями»)
        </span>
      </label>

      {/* Статус подключения */}
      <div style={{ border: '1px solid var(--border-color)', borderRadius: 12, padding: 14, marginBottom: 20, fontSize: 13, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
          <span style={{ color: 'var(--text-muted)' }}>Подключение «Точка Банк» (OAuth)</span>
          <span style={{ color: state?.connected ? '#16a34a' : '#dc2626' }}>{state?.connected ? 'Подключено' : 'Не подключено'}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
          <span style={{ color: 'var(--text-muted)' }}>Клиент (customerCode)</span>
          <span style={{ color: 'var(--text-primary)' }}>{state?.customerCode || '—'}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
          <span style={{ color: 'var(--text-muted)' }}>Уведомления об оплате (webhook)</span>
          <span style={{ color: state?.webhookOk ? '#16a34a' : '#dc2626' }}>{state?.webhookOk === null ? '—' : state?.webhookOk ? 'Зарегистрирован' : 'Ошибка (нужен scope acquiring)'}</span>
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
          {state?.connected && !state?.webhookOk && (
            <>Переподключите «Точка Банк» в интеграциях — при повторной авторизации запросится разрешение «Эквайринг».</>
          )}
          {!state?.connected && (
            <>Сначала подключите плагин «Точка Банк» в этих же интеграциях.</>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 24 }}>
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
          <span style={{ color: 'var(--text-primary)' }}>Заказ №{p.saleNumber}</span>
          <span style={{ color: 'var(--text-muted)' }}>{(p.amount / 100).toLocaleString('ru-RU')} ₽</span>
          <span style={{ color: p.status === 'paid' ? '#16a34a' : p.status === 'failed' ? '#dc2626' : 'var(--text-muted)' }}>
            {p.status === 'paid' ? 'Оплачен' : p.status === 'failed' ? 'Отклонён' : 'Ожидает оплаты'}
          </span>
        </div>
      ))}
    </div>
  );
}
