import { useEffect, useState } from "react";
import { api } from "../api/client";

// === Плагин «ВК товары»: подключение маркета, авто-синхронизация, импорт/экспорт товаров ===
// Стилистика — как у плагина «OZON Seller» (Настройки → Ozon Seller).

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

interface VkMarketForm {
  isActive: boolean;
  groupId: string;
  marketToken: string;
  marketAppId: number | null;
  marketAppSecret: string;
  autoSync: boolean;
  productsMode: 'to_vk' | 'from_vk';
  pricesMode: 'to_vk' | 'from_vk';
  stocksMode: 'to_vk';
  productsIntervalMinutes: number;
  pricesIntervalMinutes: number;
  stocksIntervalMinutes: number;
}

export function VkMarketSettings() {
  const [settings, setSettings] = useState<any>(null);
  const [form, setForm] = useState<VkMarketForm>({
    isActive: true,
    groupId: '',
    marketToken: '',
    marketAppId: null,
    marketAppSecret: '',
    autoSync: true,
    productsMode: 'to_vk',
    pricesMode: 'to_vk',
    stocksMode: 'to_vk',
    productsIntervalMinutes: 60,
    pricesIntervalMinutes: 60,
    stocksIntervalMinutes: 60,
  });
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [msg, setMsg] = useState('');
  const [isError, setIsError] = useState(false);

  const flash = (text: string, error = false) => {
    setMsg(text);
    setIsError(error);
    setTimeout(() => setMsg(''), 8000);
  };

  const load = async () => {
    try {
      const s = await api.vkMarketSettings.get();
      setSettings(s);
      if (s) {
        setForm({
          isActive: s.isActive ?? false,
          groupId: s.groupId?.toString() || '',
          marketToken: '',
          marketAppId: s.marketAppId ?? null,
          marketAppSecret: '',
          autoSync: s.autoSync ?? true,
          productsMode: s.productsMode === 'from_vk' ? 'from_vk' : 'to_vk',
          pricesMode: s.pricesMode === 'from_vk' ? 'from_vk' : 'to_vk',
          stocksMode: 'to_vk',
          productsIntervalMinutes: s.productsIntervalMinutes || 60,
          pricesIntervalMinutes: s.pricesIntervalMinutes || 60,
          stocksIntervalMinutes: s.stocksIntervalMinutes || 60,
        });
      }
    } catch (e: any) {
      flash(e.message || 'Ошибка загрузки настроек', true);
    }
  };

  useEffect(() => { load(); }, []);

  const save = async () => {
    setSaving(true);
    try {
      const payload: any = {
        isActive: form.isActive,
        groupId: Number(form.groupId) || 0,
        marketAppId: form.marketAppId,
        autoSync: form.autoSync,
        productsMode: form.productsMode,
        pricesMode: form.pricesMode,
        stocksMode: form.stocksMode,
        productsIntervalMinutes: form.productsIntervalMinutes,
        pricesIntervalMinutes: form.pricesIntervalMinutes,
        stocksIntervalMinutes: form.stocksIntervalMinutes,
      };
      if (form.marketToken) payload.marketToken = form.marketToken;
      if (form.marketAppSecret) payload.marketAppSecret = form.marketAppSecret;
      await api.vkMarketSettings.save(payload);
      flash('Сохранено');
      await load();
    } catch (e: any) {
      flash('Ошибка: ' + e.message, true);
    } finally {
      setSaving(false);
    }
  };

  const formatSummary = (s: any) => {
    if (!s) return '';
    const parts: string[] = [];
    if (s.created != null) parts.push(`создано ${s.created}`);
    if (s.linked != null) parts.push(`связано ${s.linked}`);
    if (s.updated != null) parts.push(`обновлено ${s.updated}`);
    if (s.skipped != null && s.kind === 'import') parts.push(`пропущено ${s.skipped}`);
    if (s.failed != null) parts.push(`ошибок ${s.failed}`);
    if (s.notice) parts.push(s.notice);
    if (s.errors?.length) parts.push(s.errors.slice(0, 3).join('; '));
    return parts.join(', ');
  };

  const runImport = async () => {
    setImporting(true);
    try {
      const s = await api.vkMarketSettings.import();
      flash('Импорт из ВК завершён: ' + formatSummary({ ...s, kind: 'import' }));
      await load();
    } catch (e: any) {
      flash('Ошибка импорта: ' + e.message, true);
    } finally {
      setImporting(false);
    }
  };

  const runExport = async () => {
    setExporting(true);
    try {
      const s = await api.vkMarketSettings.export();
      flash('Экспорт в ВК завершён: ' + formatSummary(s));
      await load();
    } catch (e: any) {
      flash('Ошибка экспорта: ' + e.message, true);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div style={{ maxWidth: 600, display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <StatusBadge isActive={!!settings?.isActive && !!settings?.hasMarketToken} />
      </div>

      <div>
        <label style={{ ...labelStyle, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={form.isActive}
            onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
            style={{ width: 16, height: 16 }}
          />
          Активировать синхронизацию с ВК Маркетом
        </label>
        <label style={{ ...labelStyle, marginTop: 12 }}>ID группы ВК (владелец маркета)</label>
        <input
          style={inputStyle}
          type="number"
          value={form.groupId}
          onChange={(e) => setForm({ ...form, groupId: e.target.value })}
          placeholder="Например: 123456789"
        />
        <label style={{ ...labelStyle, marginTop: 12 }}>Токен маркета (пользовательский, scope=market)</label>
        <input
          style={inputStyle}
          type="password"
          value={form.marketToken}
          onChange={(e) => setForm({ ...form, marketToken: e.target.value })}
          placeholder={settings?.hasMarketToken ? 'Сохранён — введите новый, чтобы заменить' : 'Для импорта/синхронизации товаров'}
        />
        <label style={{ ...labelStyle, marginTop: 12 }}>Приложение маркета: App ID</label>
        <input
          style={inputStyle}
          type="number"
          value={form.marketAppId ?? ''}
          onChange={(e) => setForm({ ...form, marketAppId: e.target.value ? Number(e.target.value) : null })}
          placeholder="ID standalone-приложения ВК"
        />
        <label style={{ ...labelStyle, marginTop: 12 }}>Приложение маркета: Secure key</label>
        <input
          style={inputStyle}
          type="password"
          value={form.marketAppSecret}
          onChange={(e) => setForm({ ...form, marketAppSecret: e.target.value })}
          placeholder={settings?.hasMarketApp ? 'Сохранён — введите новый, чтобы заменить' : 'Защищённый ключ приложения'}
        />
        <button
          type="button"
          onClick={async () => {
            try {
              const token = localStorage.getItem('token');
              const response = await fetch('/api/vk/market-auth', { method: 'POST', headers: { ...(token ? { 'X-Auth-Token': token } : {}) } });
              const data = await response.json();
              if (!response.ok) throw new Error(data.error || 'Не удалось начать авторизацию ВК');
              window.open(data.url, '_blank');
            } catch (e: any) { alert(e?.message || 'Не удалось начать авторизацию ВК'); }
          }}
          style={{ ...btnSecondary, width: '100%', marginTop: 12 }}
        >
          🔑 Получить токен маркета (авторизация ВК)
        </button>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>
          Перед использованием добавьте в настройках приложения ВК доверенный redirect URI: https://welans.cc/api/vk/market-callback
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
          Нужен для «Импорт из ВК / Экспорт в ВК». Флоу VK ID: токен автоматически обновляется по refresh_token
        </div>
      </div>

      <div>
        <label style={{ ...labelStyle, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={form.autoSync}
            onChange={(e) => setForm({ ...form, autoSync: e.target.checked })}
            style={{ width: 16, height: 16 }}
          />
          Авто синхронизация
        </label>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: -6 }}>
          Когда включено, товары, цены и остатки синхронизируются автоматически по расписанию (каждый блок — по своему интервалу).
          Когда выключено — только вручную, кнопками «Импорт из ВК» / «Экспорт в ВК».
        </div>
        <label style={labelStyle}>Интервалы автообновления, мин</label>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {([
            ['Товары', 'productsIntervalMinutes'],
            ['Цены', 'pricesIntervalMinutes'],
            ['Остатки', 'stocksIntervalMinutes'],
          ] as const).map(([label, field]) => (
            <label key={field} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
              {label}
              <input
                type="number"
                min={5}
                max={1440}
                value={form[field]}
                onChange={e => setForm({ ...form, [field]: Number(e.target.value) })}
                disabled={!form.autoSync}
                style={{ ...inputStyle, maxWidth: 90, opacity: form.autoSync ? 1 : 0.5 }}
              />
            </label>
          ))}
        </div>
      </div>

      <div>
        <label style={labelStyle}>Режимы синхронизации</label>
        {([
          ['Товары', 'productsMode', '«В ВК» — создавать и обновлять карточки в маркете.', '«С ВК» — импортировать карточки из маркета в CRM.'],
          ['Цены', 'pricesMode', '«В ВК» — выгружать цены из CRM (вид «ВК», иначе розничный).', '«С ВК» — читать цены из маркета и записывать в CRM в вид цен «ВК» (иначе розничный).'],
        ] as const).map(([label, field, toHint, fromHint]) => (
          <div key={field} style={{ marginTop: field === 'productsMode' ? 0 : 10 }}>
            <label style={{ ...labelStyle, marginTop: 0 }}>{label}</label>
            <select
              value={form[field]}
              onChange={(e) => setForm({ ...form, [field]: e.target.value === 'from_vk' ? 'from_vk' : 'to_vk' })}
              style={inputStyle}
            >
              <option value="to_vk">В ВК</option>
              <option value="from_vk">С ВК</option>
            </select>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
              {form[field] === 'to_vk' ? toHint : fromHint}
            </div>
          </div>
        ))}
        <div style={{ marginTop: 10 }}>
          <label style={{ ...labelStyle, marginTop: 0 }}>Остатки</label>
          <select value="to_vk" disabled style={{ ...inputStyle, opacity: 0.6 }}>
            <option value="to_vk">В ВК</option>
          </select>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
            «В ВК» — товары без складского остатка скрываются из маркета, с остатком — восстанавливаются.
            Направление «С ВК» недоступно: API ВК не возвращает остатки.
          </div>
        </div>
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
          {saving ? 'Сохранение...' : 'Сохранить'}
        </button>
        <button onClick={runImport} disabled={importing || !form.isActive} style={{ ...btnSecondary, opacity: (importing || !form.isActive) ? 0.5 : 1 }}>
          {importing ? 'Импорт...' : '⬇ Импорт из ВК'}
        </button>
        <button onClick={runExport} disabled={exporting || !form.isActive} style={{ ...btnSecondary, opacity: (exporting || !form.isActive) ? 0.5 : 1 }}>
          {exporting ? 'Экспорт...' : '⬆ Экспорт в ВК'}
        </button>
      </div>

      {settings && (
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12,
          padding: 14, borderRadius: 12, background: 'var(--bg-hover)', fontSize: 13,
        }}>
          <div>
            <div style={{ color: 'var(--text-muted)', marginBottom: 4 }}>Товаров с отметкой «ВК»</div>
            <div style={{ fontWeight: 700, fontSize: 18 }}>{settings.flagged ?? 0}</div>
          </div>
          <div>
            <div style={{ color: 'var(--text-muted)', marginBottom: 4 }}>Выгружено в ВК</div>
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
              <div style={{ fontWeight: 600 }}>{formatSummary(settings.lastSync) || '—'}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
