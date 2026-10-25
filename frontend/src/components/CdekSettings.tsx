import { useEffect, useState } from 'react';
import { api } from '../api/client';

function StatusBadge({ isActive }: { isActive: boolean }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '4px 12px', borderRadius: 10, fontSize: 13, fontWeight: 600,
      background: isActive ? '#dcfce7' : '#fee2e2',
      color: isActive ? '#16a34a' : '#dc2626',
    }}>
      <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'currentColor' }} />
      {isActive ? 'Подключено' : 'Не подключено'}
    </span>
  );
}

const labelStyle: React.CSSProperties = { fontSize: 13, fontWeight: 600, marginBottom: 6, marginTop: 16, display: 'block' };
const inputStyle: React.CSSProperties = { width: '100%', padding: '10px 12px', borderRadius: 12, border: '1px solid var(--border-color, #e5e5e5)', fontSize: 14, background: 'var(--bg-input, #f9f9f9)', color: 'var(--text-primary, #1a1a1a)', boxSizing: 'border-box' };
const btnPrimary: React.CSSProperties = { padding: '10px 18px', borderRadius: 12, border: 'none', background: 'var(--accent-color, #111827)', color: '#fff', fontWeight: 600, fontSize: 14, cursor: 'pointer' };
const btnSecondary: React.CSSProperties = { ...btnPrimary, background: 'var(--bg-card, #fff)', color: 'var(--accent-color, #111827)', border: '1px solid var(--border-color, #e5e5e5)' };

interface WebhookSub {
  uuid: string;
  url?: string;
  type?: string;
}

export default function CdekSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);

  const [form, setForm] = useState({
    isActive: false,
    environment: 'test' as 'test' | 'prod',
    account: '',
    securePassword: '',
    senderCityCode: '' as string,
    senderCompany: '',
    senderName: '',
    senderPhone: '',
    senderAddress: '',
  });
  const [webhookToken, setWebhookToken] = useState('');
  const [webhooks, setWebhooks] = useState<WebhookSub[]>([]);
  const [webhookUrl, setWebhookUrl] = useState('');
  const [webhooksLoading, setWebhooksLoading] = useState(false);

  useEffect(() => {
    load();
  }, []);

  // Любое изменение формы сбрасывает устаревший результат проверки/ошибку
  useEffect(() => {
    setTestResult(null);
    setError('');
  }, [form]);

  async function load() {
    try {
      const data = await api.cdekPlugin.get();
      setForm({
        isActive: data.isActive ?? false,
        environment: data.environment === 'prod' ? 'prod' : 'test',
        account: data.account ?? '',
        securePassword: '',
        senderCityCode: data.senderCityCode != null ? String(data.senderCityCode) : '',
        senderCompany: data.senderCompany ?? '',
        senderName: data.senderName ?? '',
        senderPhone: data.senderPhone ?? '',
        senderAddress: data.senderAddress ?? '',
      });
      setWebhookToken(data.webhookToken ?? '');
      if (data.isActive) loadWebhooks();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function loadWebhooks() {
    setWebhooksLoading(true);
    try {
      const data = await api.cdek.webhooks();
      setWebhooks(data.items ?? []);
      setWebhookUrl(data.webhookUrl ?? '');
    } catch { /* интеграция может быть не активна */ }
    finally { setWebhooksLoading(false); }
  }

  async function handleSave() {
    setSaving(true); setError(''); setSaved(false); setTestResult(null);
    try {
      await api.cdekPlugin.save({
        isActive: form.isActive,
        environment: form.environment,
        account: form.account,
        securePassword: form.securePassword,
        senderCityCode: form.senderCityCode ? Number(form.senderCityCode) : null,
        senderCompany: form.senderCompany,
        senderName: form.senderName,
        senderPhone: form.senderPhone,
        senderAddress: form.senderAddress,
      });
      setSaved(true);
      setForm(f => ({ ...f, securePassword: '' }));
      if (form.isActive) loadWebhooks();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleTest() {
    setTesting(true); setError(''); setTestResult(null);
    try {
      const res = await api.cdekPlugin.test({
        account: form.account,
        securePassword: form.securePassword,
        environment: form.environment,
      });
      setTestResult({ ok: true, message: `Соединение установлено (${res.baseUrl ?? ''})` });
    } catch (e: any) {
      setTestResult({ ok: false, message: e.data?.error ?? e.message });
    } finally {
      setTesting(false);
    }
  }

  async function handleSubscribe() {
    setWebhooksLoading(true);
    try {
      await api.cdek.subscribeWebhook();
      await loadWebhooks();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setWebhooksLoading(false);
    }
  }

  async function handleUnsubscribe(uuid: string) {
    setWebhooksLoading(true);
    try {
      await api.cdek.unsubscribeWebhook(uuid);
      await loadWebhooks();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setWebhooksLoading(false);
    }
  }

  if (loading) return <div style={{ padding: 20 }}>Загрузка…</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, flexWrap: 'wrap', gap: 8 }}>
        <h2 style={{ margin: 0, fontSize: 20 }}>CDEK (СДЭК)</h2>
        <StatusBadge isActive={form.isActive} />
      </div>
      <p style={{ margin: '0 0 8px', fontSize: 13, color: 'var(--text-secondary, #666666)' }}>
        Доставка заказов через СДЭК: калькулятор стоимости, регистрация накладных, трекинг и квитанции — в разделе «Логистика».
        Документация API: <a href="https://apidoc.cdek.ru" target="_blank" rel="noreferrer" style={{ color: 'var(--accent-color, #111827)' }}>apidoc.cdek.ru</a>
      </p>

      <label style={labelStyle}>Контур API</label>
      <select value={form.environment} onChange={e => setForm({ ...form, environment: e.target.value as 'test' | 'prod' })} style={inputStyle}>
        <option value="test">Тестовый (api.edu.cdek.ru)</option>
        <option value="prod">Боевой (api.cdek.ru)</option>
      </select>

      <label style={labelStyle}>Account (идентификатор клиента)</label>
      <input value={form.account} onChange={e => setForm({ ...form, account: e.target.value })} style={inputStyle} placeholder="Тестовый стенд (общие ключи): wqGwiQx0gg8mLtiEKsUinjVSICCjtTEP. Боевой — ваш Account из личного кабинета СДЭК (lk.cdek.ru → Интеграция)" />

      <label style={labelStyle}>Secure password (секретный ключ)</label>
      <input type="password" value={form.securePassword} onChange={e => setForm({ ...form, securePassword: e.target.value })} style={inputStyle} placeholder="Оставьте пустым, чтобы не менять сохранённый ключ" />

      <label style={labelStyle}>Город отправителя (код населённого пункта СДЭК)</label>
      <input value={form.senderCityCode} onChange={e => setForm({ ...form, senderCityCode: e.target.value.replace(/\D/g, '') })} style={inputStyle} placeholder="Например: 270 (Москва)" inputMode="numeric" />

      <label style={labelStyle}>Компания отправителя</label>
      <input value={form.senderCompany} onChange={e => setForm({ ...form, senderCompany: e.target.value })} style={inputStyle} placeholder="ИП Иванов" />

      <label style={labelStyle}>Контактное лицо отправителя</label>
      <input value={form.senderName} onChange={e => setForm({ ...form, senderName: e.target.value })} style={inputStyle} placeholder="Иван Иванов" />

      <label style={labelStyle}>Телефон отправителя</label>
      <input value={form.senderPhone} onChange={e => setForm({ ...form, senderPhone: e.target.value })} style={inputStyle} placeholder="+79001234567" />

      <label style={labelStyle}>Адрес отгрузки</label>
      <input value={form.senderAddress} onChange={e => setForm({ ...form, senderAddress: e.target.value })} style={inputStyle} placeholder="г. Москва, ул. Тверская, д. 1" />

      <label style={{ ...labelStyle, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
        <input type="checkbox" checked={form.isActive} onChange={e => setForm({ ...form, isActive: e.target.checked })} />
        Интеграция активна
      </label>

      <div style={{ display: 'flex', gap: 10, marginTop: 20, flexWrap: 'wrap' }}>
        <button onClick={handleSave} disabled={saving} style={{ ...btnPrimary, opacity: saving ? 0.6 : 1 }}>
          {saving ? 'Сохранение…' : 'Сохранить'}
        </button>
        <button onClick={handleTest} disabled={testing} style={{ ...btnSecondary, opacity: testing ? 0.6 : 1 }}>
          {testing ? 'Проверка…' : 'Проверить подключение'}
        </button>
      </div>

      {saved && <div style={{ marginTop: 12, padding: '10px 14px', borderRadius: 10, background: '#dcfce7', color: '#16a34a', fontSize: 13 }}>Настройки сохранены</div>}
      {error && <div style={{ marginTop: 12, padding: '10px 14px', borderRadius: 10, background: '#fee2e2', color: '#dc2626', fontSize: 13 }}>{error}</div>}
      {testResult && (
        <div style={{ marginTop: 12, padding: '10px 14px', borderRadius: 10, background: testResult.ok ? '#dcfce7' : '#fee2e2', color: testResult.ok ? '#16a34a' : '#dc2626', fontSize: 13 }}>
          {testResult.ok ? '✅ ' : '❌ '}{testResult.message}
        </div>
      )}

      {form.isActive && (
        <div style={{ marginTop: 28, paddingTop: 20, borderTop: '1px solid var(--border-color)' }}>
          <h3 style={{ margin: '0 0 8px', fontSize: 16 }}>Вебхуки (автообновление статусов)</h3>
          <p style={{ margin: '0 0 12px', fontSize: 13, color: 'var(--text-secondary, #666666)' }}>
            Подписка на уведомления СДЭК об изменении статуса заказа. URL уведомлений:
          </p>
          {webhookUrl && (
            <div style={{ padding: '10px 14px', borderRadius: 10, background: 'var(--bg-card, #fff)', fontSize: 12, wordBreak: 'break-all', marginBottom: 12 }}>
              {webhookUrl}
            </div>
          )}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
            <button onClick={handleSubscribe} disabled={webhooksLoading} style={{ ...btnPrimary, opacity: webhooksLoading ? 0.6 : 1 }}>
              {webhooksLoading ? 'Обработка…' : webhooks.length ? 'Обновить подписку' : 'Подписаться на статусы заказов'}
            </button>
          </div>
          {webhooks.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {webhooks.map((w) => (
                <div key={w.uuid} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 10, border: '1px solid var(--border-color, #e5e5e5)', fontSize: 13, flexWrap: 'wrap' }}>
                  <div style={{ wordBreak: 'break-all' }}>
                    <span style={{ fontWeight: 600 }}>{w.type ?? 'ORDER_STATUS'}</span>
                    <span style={{ color: 'var(--text-secondary, #666666)' }}> — {w.url}</span>
                  </div>
                  <button onClick={() => handleUnsubscribe(w.uuid)} disabled={webhooksLoading} style={{ ...btnSecondary, padding: '6px 12px', fontSize: 12 }}>Отписать</button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
