import { useEffect, useState } from 'react';
import { api } from '../api/client';

// === Плагин «OZON Seller»: подключение и синхронизация каталога товаров с маркетплейсом OZON ===

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
const btnPrimary: React.CSSProperties = { padding: '8px 16px', borderRadius: 10, background: '#005BFF', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 14 };
const btnSecondary: React.CSSProperties = { padding: '8px 16px', borderRadius: 10, border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-primary)', fontSize: 14, cursor: 'pointer' };

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

export default function OzonSellerSettings() {
  const [settings, setSettings] = useState<any>(null);
  const [form, setForm] = useState({ clientId: '', apiKey: '', updateIntervalMinutes: 60 });
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [msg, setMsg] = useState('');
  const [isError, setIsError] = useState(false);

  const flash = (text: string, error = false) => {
    setMsg(text);
    setIsError(error);
    setTimeout(() => setMsg(''), 6000);
  };

  const load = async () => {
    try {
      const s = await api.ozonPlugin.get();
      setSettings(s);
      setForm({ clientId: s.clientId || '', apiKey: '', updateIntervalMinutes: s.updateIntervalMinutes || 60 });
    } catch (e: any) {
      flash(e.message || 'Ошибка загрузки настроек', true);
    }
  };

  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!form.clientId.trim()) { flash('Укажите Client-Id', true); return; }
    setSaving(true);
    try {
      const res: any = await api.ozonPlugin.save({
        clientId: form.clientId.trim(),
        apiKey: form.apiKey || undefined,
        updateIntervalMinutes: Number(form.updateIntervalMinutes) || 60,
      });
      setSettings((prev: any) => ({ ...prev, ...res }));
      flash(res.isActive
        ? 'Подключение сохранено. Связь с OZON Seller установлена.'
        : `Сохранено, но подключение не удалось: ${res.error || 'проверьте Client-Id и API-ключ'}`, !res.isActive);
      await load();
    } catch (e: any) {
      flash(e.message || 'Ошибка сохранения', true);
    } finally {
      setSaving(false);
    }
  };

  const sync = async () => {
    if (!confirm('Выгрузить все позиции с отметкой «OZON Seller» в маркетплейс OZON?')) return;
    setSyncing(true);
    try {
      const r: any = await api.ozonPlugin.sync();
      flash(`Синхронизация завершена: создано ${r.created}, обновлено ${r.updated}, ошибок ${r.failed}${r.errors?.length ? '\n' + r.errors.slice(0, 5).join('\n') : ''}`, !!r.failed);
      await load();
    } catch (e: any) {
      flash(e.message || 'Ошибка синхронизации', true);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ fontSize: 15, fontWeight: 600 }}>Подключение к OZON Seller API</div>
        <StatusBadge isActive={!!settings?.isActive} />
      </div>

      <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
        Ключи создаются в личном кабинете OZON Seller: Настройки → API-ключи. Товары выгружаются в маркетплейс только
        из карточек позиций с отметкой «OZON Seller» (Склад → Номенклатура).
      </div>

      <div>
        <label style={labelStyle}>Client-Id</label>
        <input
          value={form.clientId}
          onChange={e => setForm({ ...form, clientId: e.target.value })}
          placeholder="Например: 123456"
          style={inputStyle}
        />
      </div>

      <div>
        <label style={labelStyle}>
          API-ключ {settings?.apiKeySet && <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(установлен — оставьте пустым, чтобы не менять)</span>}
        </label>
        <input
          type="password"
          value={form.apiKey}
          onChange={e => setForm({ ...form, apiKey: e.target.value })}
          placeholder={settings?.apiKeySet ? '••••••••' : 'API-ключ из кабинета OZON Seller'}
          style={inputStyle}
        />
      </div>

      <div>
        <label style={labelStyle}>Интервал автообновления, мин</label>
        <input
          type="number"
          min={5}
          max={1440}
          value={form.updateIntervalMinutes}
          onChange={e => setForm({ ...form, updateIntervalMinutes: Number(e.target.value) })}
          style={{ ...inputStyle, maxWidth: 120 }}
        />
      </div>

      {msg && (
        <div style={{
          padding: '10px 14px', borderRadius: 10, fontSize: 13, whiteSpace: 'pre-line',
          background: isError ? '#fef2f2' : '#f0fdf4',
          color: isError ? '#dc2626' : '#16a34a',
          border: `1px solid ${isError ? '#fecaca' : '#bbf7d0'}`,
        }}>
          {msg}
        </div>
      )}

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <button onClick={save} disabled={saving} style={{ ...btnPrimary, opacity: saving ? 0.6 : 1 }}>
          {saving ? 'Сохранение...' : 'Сохранить и проверить'}
        </button>
        <button onClick={sync} disabled={syncing || !settings?.isActive} style={{ ...btnSecondary, opacity: (syncing || !settings?.isActive) ? 0.5 : 1 }}>
          {syncing ? 'Синхронизация...' : 'Синхронизировать сейчас'}
        </button>
      </div>

      {settings && (
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12,
          padding: 14, borderRadius: 12, background: 'var(--bg-hover)', fontSize: 13,
        }}>
          <div>
            <div style={{ color: 'var(--text-muted)', marginBottom: 4 }}>Товаров с отметкой «OZON»</div>
            <div style={{ fontWeight: 700, fontSize: 18 }}>{settings.flagged ?? 0}</div>
          </div>
          <div>
            <div style={{ color: 'var(--text-muted)', marginBottom: 4 }}>Выгружено в OZON</div>
            <div style={{ fontWeight: 700, fontSize: 18 }}>{settings.synced ?? 0}</div>
          </div>
          <div>
            <div style={{ color: 'var(--text-muted)', marginBottom: 4 }}>Последняя синхронизация</div>
            <div style={{ fontWeight: 600 }}>
              {settings.lastSyncAt ? new Date(settings.lastSyncAt).toLocaleString('ru-RU') : '—'}
            </div>
          </div>
          {settings.lastSync && (
            <div>
              <div style={{ color: 'var(--text-muted)', marginBottom: 4 }}>Результат</div>
              <div style={{ fontWeight: 600 }}>
                создано {settings.lastSync.created}, обновлено {settings.lastSync.updated}, ошибок {settings.lastSync.failed}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
