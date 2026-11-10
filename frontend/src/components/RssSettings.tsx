import { useEffect, useState } from "react";
import { api } from "../api/client";

// === Плагин «Парсинг RSS»: источники новостей, расписание обхода, архив old_site ===
// Стилистика — как у плагина «ВК товары» (Настройки → Интеграции).

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

interface RssSourceForm {
  id?: string;
  name: string;
  url: string;
  siteUrl: string;
  feedImage: string;
  isActive: boolean;
}

interface RssForm {
  isActive: boolean;
  autoSync: boolean;
  intervalMinutes: number;
  maxItemsPerFeed: number;
  limitPerImport: number;
  uniqueTitles: boolean;
  sources: RssSourceForm[];
}

const emptySource = (): RssSourceForm => ({ name: '', url: '', siteUrl: '', feedImage: '', isActive: true });

export function RssSettings() {
  const [settings, setSettings] = useState<any>(null);
  const [form, setForm] = useState<RssForm>({
    isActive: false,
    autoSync: true,
    intervalMinutes: 15,
    maxItemsPerFeed: 200,
    limitPerImport: 0,
    uniqueTitles: true,
    sources: [],
  });
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [msg, setMsg] = useState('');
  const [isError, setIsError] = useState(false);

  const flash = (text: string, error = false) => {
    setMsg(text);
    setIsError(error);
    setTimeout(() => setMsg(''), 10000);
  };

  const load = async () => {
    try {
      const s = await api.rssSettings.get();
      setSettings(s);
      if (s) {
        setForm({
          isActive: s.isActive ?? false,
          autoSync: s.autoSync ?? true,
          intervalMinutes: s.intervalMinutes || 15,
          maxItemsPerFeed: s.maxItemsPerFeed || 200,
          limitPerImport: s.limitPerImport || 0,
          uniqueTitles: s.uniqueTitles ?? true,
          sources: (s.sources ?? []).map((x: any) => ({
            id: x.id, name: x.name || '', url: x.url || '',
            siteUrl: x.siteUrl || '', feedImage: x.feedImage || '', isActive: x.isActive !== false,
          })),
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
      await api.rssSettings.save({
        isActive: form.isActive,
        autoSync: form.autoSync,
        intervalMinutes: Number(form.intervalMinutes) || 15,
        maxItemsPerFeed: Number(form.maxItemsPerFeed) || 200,
        limitPerImport: Number(form.limitPerImport) || 0,
        uniqueTitles: form.uniqueTitles,
        sources: form.sources.map((s) => ({
          ...(s.id ? { id: s.id } : {}),
          name: s.name.trim(),
          url: s.url.trim(),
          siteUrl: s.siteUrl.trim() || null,
          feedImage: s.feedImage.trim() || null,
          isActive: s.isActive,
        })),
      });
      flash('Сохранено');
      await load();
    } catch (e: any) {
      flash('Ошибка: ' + e.message, true);
    } finally {
      setSaving(false);
    }
  };

  const formatSyncSummary = (s: any) => {
    const parts: string[] = [];
    if (s.feeds != null) parts.push(`лент ${s.feeds}`);
    if (s.created != null) parts.push(`новых ${s.created}`);
    if (s.skipped != null) parts.push(`дублей ${s.skipped}`);
    if (s.failed) parts.push(`ошибок ${s.failed}`);
    if (s.errors?.length) parts.push(s.errors.slice(0, 3).join('; '));
    return parts.join(', ');
  };

  const runSync = async () => {
    setSyncing(true);
    try {
      const s = await api.rssSettings.sync();
      flash('Обход лент завершён: ' + formatSyncSummary(s));
      await load();
    } catch (e: any) {
      flash('Ошибка обхода лент: ' + e.message, true);
    } finally {
      setSyncing(false);
    }
  };

  const updateSource = (index: number, patch: Partial<RssSourceForm>) => {
    setForm((prev) => ({
      ...prev,
      sources: prev.sources.map((s, i) => (i === index ? { ...s, ...patch } : s)),
    }));
  };

  const hasActiveSources = form.sources.some((s) => s.isActive && s.url.trim());

  return (
    <div style={{ maxWidth: 640, display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <StatusBadge isActive={!!settings?.isActive && hasActiveSources} />
      </div>

      <div>
        <label style={{ ...labelStyle, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={form.isActive}
            onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
            style={{ width: 16, height: 16 }}
          />
          Активировать плагин «Парсинг RSS»
        </label>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>
          Новости из RSS-лент публикуются в категорию «Коротко о свежем» и дублируются в архивную базу old_site.
          Механика повторяет плагин wprss_feed старого сайта welans.ru.
        </div>
      </div>

      <div>
        <label style={labelStyle}>Источники RSS</label>
        {form.sources.map((source, index) => (
          <div
            key={index}
            style={{
              border: '1px solid var(--border-color)', borderRadius: 10,
              padding: 12, marginBottom: 10, display: 'flex', flexDirection: 'column', gap: 8,
              opacity: source.isActive ? 1 : 0.6,
            }}
          >
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input
                style={{ ...inputStyle, flex: 1 }}
                value={source.name}
                onChange={(e) => updateSource(index, { name: e.target.value })}
                placeholder="Название источника"
              />
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                <input
                  type="checkbox"
                  checked={source.isActive}
                  onChange={(e) => updateSource(index, { isActive: e.target.checked })}
                  style={{ width: 16, height: 16 }}
                />
                Активен
              </label>
              <button
                type="button"
                onClick={() => setForm((prev) => ({ ...prev, sources: prev.sources.filter((_, i) => i !== index) }))}
                style={{ ...btnSecondary, padding: '6px 10px', color: '#dc2626' }}
                title="Удалить источник"
              >
                ✕
              </button>
            </div>
            <input
              style={inputStyle}
              value={source.url}
              onChange={(e) => updateSource(index, { url: e.target.value })}
              placeholder="https://example.com/feed"
            />
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                style={inputStyle}
                value={source.siteUrl}
                onChange={(e) => updateSource(index, { siteUrl: e.target.value })}
                placeholder="Сайт источника (необязательно)"
              />
              <input
                style={inputStyle}
                value={source.feedImage}
                onChange={(e) => updateSource(index, { feedImage: e.target.value })}
                placeholder="Логотип ленты, URL (необязательно)"
              />
            </div>
          </div>
        ))}
        <button
          type="button"
          onClick={() => setForm((prev) => ({ ...prev, sources: [...prev.sources, emptySource()] }))}
          style={{ ...btnSecondary, width: '100%' }}
        >
          + Добавить источник
        </button>
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
          Когда включено, ленты обходятся автоматически по расписанию. Когда выключено — вручную, кнопкой «Получить новости».
        </div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 10 }}>
          <div style={{ flex: '1 1 140px' }}>
            <label style={labelStyle}>Интервал обхода, мин</label>
            <input
              style={inputStyle}
              type="number"
              min={5}
              max={1440}
              value={form.intervalMinutes}
              onChange={(e) => setForm({ ...form, intervalMinutes: Number(e.target.value) })}
            />
          </div>
          <div style={{ flex: '1 1 140px' }}>
            <label style={labelStyle}>Хранить items на источник</label>
            <input
              style={inputStyle}
              type="number"
              min={1}
              max={10000}
              value={form.maxItemsPerFeed}
              onChange={(e) => setForm({ ...form, maxItemsPerFeed: Number(e.target.value) })}
            />
          </div>
          <div style={{ flex: '1 1 140px' }}>
            <label style={labelStyle}>Лимит за один обход (0 — без лимита)</label>
            <input
              style={inputStyle}
              type="number"
              min={0}
              max={1000}
              value={form.limitPerImport}
              onChange={(e) => setForm({ ...form, limitPerImport: Number(e.target.value) })}
            />
          </div>
        </div>
        <label style={{ ...labelStyle, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', marginTop: 10 }}>
          <input
            type="checkbox"
            checked={form.uniqueTitles}
            onChange={(e) => setForm({ ...form, uniqueTitles: e.target.checked })}
            style={{ width: 16, height: 16 }}
          />
          Пропускать дубликаты по заголовку (unique titles)
        </label>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: -4 }}>
          Запись с заголовком, который уже встречался в любой ленте, не импортируется — как на старом сайте.
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <button type="button" onClick={save} disabled={saving} style={btnPrimary}>
          {saving ? 'Сохранение…' : 'Сохранить'}
        </button>
        <button type="button" onClick={runSync} disabled={syncing} style={btnSecondary}>
          {syncing ? 'Получение новостей…' : 'Получить новости'}
        </button>
      </div>

      {settings?.stats && (
        <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
          В архиве old_site: {settings.stats.itemsTotal} записей · В категории «Коротко о свежем»: {settings.stats.crmNews} новостей
          {settings.lastSyncAt && (
            <div>
              Последний обход: {new Date(settings.lastSyncAt).toLocaleString('ru-RU')}
              {settings.lastSync && <> — {formatSyncSummary(settings.lastSync)}</>}
            </div>
          )}
        </div>
      )}

      {msg && (
        <div style={{
          padding: '10px 14px', borderRadius: 10, fontSize: 13,
          background: isError ? '#fee2e2' : '#dcfce7',
          color: isError ? '#dc2626' : '#16a34a',
        }}>
          {msg}
        </div>
      )}
    </div>
  );
}
