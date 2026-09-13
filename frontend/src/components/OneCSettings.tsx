import { useEffect, useState } from 'react';
import { api } from '../api/client';

// === Плагин «1С УТ 8.3»: подключение и двусторонняя синхронизация номенклатуры и контрагентов ===
export default function OneCSettings() {
  const [settings, setSettings] = useState<any>(null);
  const [form, setForm] = useState({ serviceUrl: '', login: '', password: '', syncIntervalMinutes: 15 });
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    api.oneCPlugin.get().then((s: any) => {
      setSettings(s);
      setForm({ serviceUrl: s.serviceUrl, login: s.login, password: '', syncIntervalMinutes: s.syncIntervalMinutes });
    }).catch(() => {});
  }, []);

  const flash = (text: string) => { setMsg(text); setTimeout(() => setMsg(''), 4000); };

  const toggleActive = async (checked: boolean) => {
    setSettings((prev: any) => ({ ...prev, isActive: checked }));
    try {
      const res: any = await api.oneCPlugin.save({ isActive: checked });
      setSettings((prev: any) => ({ ...prev, ...res }));
      flash(checked ? 'Интеграция с 1С УТ 8.3 активирована' : 'Интеграция с 1С УТ 8.3 деактивирована');
    } catch (err: any) {
      setSettings((prev: any) => ({ ...prev, isActive: !checked }));
      flash('Ошибка: ' + err.message);
    }
  };

  const save = async () => {
    setSaving(true);
    try {
      const res: any = await api.oneCPlugin.save({
        serviceUrl: form.serviceUrl.trim(),
        login: form.login.trim(),
        password: form.password,
        syncIntervalMinutes: Number(form.syncIntervalMinutes) || 15,
      });
      setSettings((prev: any) => ({ ...prev, ...res }));
      setForm((f) => ({ ...f, password: '' }));
      flash('Настройки сохранены');
    } catch (err: any) {
      flash('Ошибка сохранения: ' + err.message);
    } finally { setSaving(false); }
  };

  const test = async () => {
    setSaving(true);
    try {
      const r: any = await api.oneCPlugin.test({
        serviceUrl: form.serviceUrl.trim(),
        login: form.login.trim(),
        password: form.password,
      });
      flash(r.message || (r.ok ? 'Соединение установлено' : 'Нет соединения'));
    } catch (err: any) {
      flash('Ошибка: ' + err.message);
    } finally { setSaving(false); }
  };

  const syncNow = async () => {
    setSyncing(true);
    try {
      const r: any = await api.oneCPlugin.sync();
      if (r && !r.started && r.products) {
        // синхронизация выполнилась синхронно (старый бэкенд) — результат сразу
        setSettings((prev: any) => ({
          ...prev,
          lastSyncAt: r.finishedAt ?? new Date().toISOString(),
          lastSyncResult: r,
        }));
        setSyncing(false);
        flash(`Синхронизация завершена: товаров загр./выз. ${r.products.pulled}/${r.products.pushed}, контактов ${r.contacts.pulled}/${r.contacts.pushed}`);
        return;
      }
      if (r && r.error && !r.started) throw new Error(r.error);
      // фоновый режим: опрашиваем статус до смены lastSyncAt
      flash('Синхронизация запущена в фоне…');
      const startedAfter = Date.now() - 5000;
      let attempts = 0;
      const poll = setInterval(async () => {
        attempts++;
        try {
          const st: any = await api.oneCPlugin.get();
          if (st.lastSyncAt && new Date(st.lastSyncAt).getTime() > startedAfter) {
            clearInterval(poll);
            const last: any = st.lastSyncResult;
            setSettings((prev: any) => ({ ...prev, ...st }));
            setSyncing(false);
            flash(last
              ? `Синхронизация завершена: товаров загр./выз. ${last.products?.pulled ?? 0}/${last.products?.pushed ?? 0}, контактов ${last.contacts?.pulled ?? 0}/${last.contacts?.pushed ?? 0}${last.products?.errors || last.contacts?.errors ? `, ошибок: тов. ${last.products?.errors ?? 0}, конт. ${last.contacts?.errors ?? 0}` : ''}`
              : 'Синхронизация завершена');
          } else if (attempts >= 36) { // ~3 минуты
            clearInterval(poll);
            setSyncing(false);
            flash('Синхронизация выполняется дольше 3 минут — результат появится в блоке ниже');
          }
        } catch { /* опрос продолжается */ }
      }, 5000);
    } catch (err: any) {
      flash('Ошибка синхронизации: ' + err.message);
      setSyncing(false);
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
  const last: any = settings?.lastSyncResult;

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
        <span style={{ fontSize: 14, fontWeight: 500 }}>Активировать интеграцию с 1С УТ 8.3</span>
      </label>

      {/* Ссылка веб-версии 1С */}
      <div style={{ marginBottom: 14 }}>
        <label style={labelStyle}>Ссылка веб-версии 1С</label>
        <input
          type="text"
          value={form.serviceUrl}
          onChange={(e) => setForm({ ...form, serviceUrl: e.target.value })}
          style={inputStyle}
          placeholder="https://welans.org/welans/ru"
        />
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>
          Опубликованный HTTP-сервис 1С (hs/wecrm)
        </div>
      </div>

      {/* Логин и пароль */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 14 }}>
        <div style={{ flex: 1, minWidth: 200 }}>
          <label style={labelStyle}>Логин</label>
          <input
            type="text"
            value={form.login}
            onChange={(e) => setForm({ ...form, login: e.target.value })}
            style={inputStyle}
            placeholder="Пользователь 1С"
          />
        </div>
        <div style={{ flex: 1, minWidth: 200 }}>
          <label style={labelStyle}>Пароль</label>
          <input
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            style={inputStyle}
            placeholder={settings?.hasPassword ? '•••••••• (оставьте пустым, чтобы не менять)' : 'Пароль пользователя 1С'}
          />
        </div>
      </div>

      {/* Интервал синхронизации */}
      <div style={{ marginBottom: 20 }}>
        <label style={labelStyle}>Интервал синхронизации, мин</label>
        <input
          type="number"
          min={5}
          max={1440}
          value={form.syncIntervalMinutes}
          onChange={(e) => setForm({ ...form, syncIntervalMinutes: Number(e.target.value) })}
          style={{ ...inputStyle, width: 120 }}
        />
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>
          Номенклатура и контрагенты синхронизируются двусторонне с указанным интервалом
        </div>
      </div>

      {/* Кнопки */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 20 }}>
        <button
          onClick={save}
          disabled={saving || !settings}
          style={{ padding: '8px 16px', borderRadius: 10, background: '#007AFF', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 14, opacity: saving || !settings ? 0.7 : 1 }}
        >
          {saving ? 'Сохранение...' : 'Сохранить'}
        </button>
        <button
          onClick={test}
          disabled={saving || !settings}
          style={{ padding: '8px 16px', borderRadius: 10, border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-primary)', fontSize: 14, cursor: 'pointer' }}
        >
          Проверить соединение
        </button>
        <button
          onClick={syncNow}
          disabled={syncing || !settings?.isActive}
          style={{ padding: '8px 16px', borderRadius: 10, border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-primary)', fontSize: 14, cursor: 'pointer', opacity: syncing || !settings?.isActive ? 0.6 : 1 }}
        >
          {syncing ? 'Синхронизация...' : 'Синхронизировать сейчас'}
        </button>
        {msg && <span style={{ fontSize: 13, color: msg.startsWith('Ошибка') ? '#dc2626' : '#16a34a' }}>{msg}</span>}
      </div>

      {/* Результат последней синхронизации */}
      {last && (
        <div style={{ padding: 14, borderRadius: 12, border: '1px solid var(--border-color)', background: 'var(--bg-input)', fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>
            Последняя синхронизация{settings?.lastSyncAt ? `: ${new Date(settings.lastSyncAt).toLocaleString('ru-RU')}` : ''}
          </div>
          <div>Номенклатура: загружено {last.products?.pulled ?? 0}, выгружено {last.products?.pushed ?? 0}, ошибок {last.products?.errors ?? 0}</div>
          <div>Контрагенты: загружено {last.contacts?.pulled ?? 0}, выгружено {last.contacts?.pushed ?? 0}, ошибок {last.contacts?.errors ?? 0}</div>
          {last.error && <div style={{ color: '#dc2626' }}>{last.error}</div>}
        </div>
      )}
    </div>
  );
}
