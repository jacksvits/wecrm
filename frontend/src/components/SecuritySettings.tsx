import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../api/client';

type AuthEvent = {
  id: string;
  tenantSlug: string;
  tenantName: string;
  login: string;
  ipAddress: string;
  device: string;
  clientType: 'mobile' | 'desktop';
  authMethod: string;
  success: boolean;
  createdAt: string;
};
type AuthEventsResponse = { items: AuthEvent[]; total: number; page: number; pageSize: number; totalPages: number };
type IpListType = 'white' | 'black';
type IpAccessRule = { id: string; ipAddress: string; listType: IpListType; createdAt: string };
type IpInfo = { ip: string; country: string | null; city: string | null; registrationCountry: string | null; organization: string | null };

const cellStyle: React.CSSProperties = { padding: '12px 14px', borderBottom: '1px solid var(--border-color)', textAlign: 'left', verticalAlign: 'middle', fontSize: 13 };
const headStyle: React.CSSProperties = { ...cellStyle, color: 'var(--text-muted)', fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap', background: 'var(--bg-secondary)' };
const inputStyle: React.CSSProperties = { width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', outline: 'none', fontFamily: 'monospace', boxSizing: 'border-box' };

function IpAccessLists() {
  const [rules, setRules] = useState<IpAccessRule[]>([]);
  const [inputs, setInputs] = useState<Record<IpListType, string>>({ white: '', black: '' });
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState<IpListType | null>(null);
  const [deletingId, setDeletingId] = useState('');
  const [error, setError] = useState('');
  const [failureThreshold, setFailureThreshold] = useState(5);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsSaved, setSettingsSaved] = useState(false);

  const load = useCallback(async () => {
    setError('');
    try {
      const result = await api.security.ipRules();
      setRules(result.items);
      setFailureThreshold(result.autoBlockThreshold);
    } catch (e: any) {
      setError(e?.message || 'Не удалось загрузить списки IP-адресов');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const saveSettings = async () => {
    if (settingsSaving) return;
    setSettingsSaving(true);
    setSettingsSaved(false);
    setError('');
    try {
      const result = await api.security.updateIpSettings(failureThreshold);
      setFailureThreshold(result.failureThreshold);
      setSettingsSaved(true);
    } catch (e: any) {
      setError(e?.message || 'Не удалось сохранить настройку автоблокировки');
    } finally {
      setSettingsSaving(false);
    }
  };

  const add = async (listType: IpListType) => {
    const ipAddress = inputs[listType].trim();
    if (!ipAddress || adding) return;
    setAdding(listType);
    setError('');
    try {
      await api.security.addIpRule(ipAddress, listType);
      setInputs((current) => ({ ...current, [listType]: '' }));
      await load();
    } catch (e: any) {
      setError(e?.message || 'Не удалось добавить IP-адрес');
    } finally {
      setAdding(null);
    }
  };

  const remove = async (id: string) => {
    setDeletingId(id);
    setError('');
    try {
      await api.security.deleteIpRule(id);
      setRules((current) => current.filter((rule) => rule.id !== id));
    } catch (e: any) {
      setError(e?.message || 'Не удалось удалить IP-адрес');
    } finally {
      setDeletingId('');
    }
  };

  const renderList = (listType: IpListType) => {
    const isBlack = listType === 'black';
    const items = rules.filter((rule) => rule.listType === listType);
    return (
      <section style={{ border: '1px solid var(--border-color)', borderRadius: 12, background: 'var(--bg-card)', padding: 16, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 5 }}>
          <h4 style={{ margin: 0, fontSize: 14 }}>{isBlack ? 'Чёрный список IP' : 'Белый список IP'}</h4>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{items.length}</span>
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.45, minHeight: 35, marginBottom: 12 }}>
          {isBlack ? 'Запрещают страницу входа и авторизацию. Можно указать IP, подсеть CIDR или диапазон. Добавление удаляет запись из белого списка.' : 'Исключают автоматическую блокировку. Можно указать IP, подсеть CIDR или диапазон. Добавление удаляет запись из чёрного списка.'}
        </div>
        <form onSubmit={(event) => { event.preventDefault(); add(listType); }} style={{ display: 'flex', gap: 8, alignItems: 'stretch' }}>
          <input
            value={inputs[listType]}
            onChange={(event) => setInputs((current) => ({ ...current, [listType]: event.target.value }))}
            placeholder="IP, 203.0.113.0/24 или 203.0.113.10-203.0.113.50"
            aria-label={`Добавить IP в ${isBlack ? 'чёрный' : 'белый'} список`}
            style={{ ...inputStyle, flex: 1, minWidth: 0 }}
          />
          <button type="submit" disabled={adding !== null || !inputs[listType].trim()} style={{ padding: '9px 14px', borderRadius: 10, border: 'none', background: 'var(--accent-color)', color: '#fff', cursor: adding || !inputs[listType].trim() ? 'default' : 'pointer', opacity: adding || !inputs[listType].trim() ? 0.55 : 1, whiteSpace: 'nowrap' }}>
            {adding === listType ? 'Добавление…' : 'Добавить'}
          </button>
        </form>
        <div style={{ marginTop: 12, maxHeight: 190, overflowY: 'auto' }}>
          {items.map((rule) => (
            <div key={rule.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, padding: '9px 0', borderTop: '1px solid var(--border-color)' }}>
              <span style={{ fontFamily: 'monospace', fontSize: 13, wordBreak: 'break-all' }}>{rule.ipAddress}</span>
              <button type="button" onClick={() => remove(rule.id)} disabled={deletingId === rule.id} title="Удалить из списка" aria-label={`Удалить ${rule.ipAddress}`} style={{ width: 30, height: 30, flex: '0 0 auto', borderRadius: 8, border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-muted)', cursor: deletingId === rule.id ? 'default' : 'pointer' }}>
                {deletingId === rule.id ? '…' : '×'}
              </button>
            </div>
          ))}
          {!loading && items.length === 0 && <div style={{ padding: '14px 0 2px', fontSize: 12, color: 'var(--text-muted)' }}>Список пуст</div>}
          {loading && <div style={{ padding: '14px 0 2px', fontSize: 12, color: 'var(--text-muted)' }}>Загрузка…</div>}
        </div>
      </section>
    );
  };

  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ marginBottom: 12 }}>
        <h3 style={{ margin: '0 0 4px', fontSize: 16 }}>Управление доступом по IP</h3>
        <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Общие списки для главного проекта и всех организаций · поддерживаются IPv4 и IPv6</div>
      </div>
      {error && <div style={{ padding: 12, marginBottom: 12, borderRadius: 10, background: '#fef2f2', color: '#b91c1c', fontSize: 13 }}>{error}</div>}
      <section style={{ border: '1px solid var(--border-color)', borderRadius: 12, background: 'var(--bg-card)', padding: 16, marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 360px' }}>
            <h4 style={{ margin: '0 0 5px', fontSize: 14 }}>Автоматическая блокировка по неудачным входам</h4>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>
              IP попадает в чёрный список после указанного числа неудачных попыток подряд. Успешный вход сбрасывает счётчик; белый список исключает автоблокировку.
            </div>
          </div>
          <form onSubmit={(event) => { event.preventDefault(); saveSettings(); }} style={{ display: 'flex', alignItems: 'end', gap: 8, flexWrap: 'wrap' }}>
            <label style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              Неудачных попыток подряд
              <input
                type="number"
                min={1}
                max={1000}
                step={1}
                value={failureThreshold}
                onChange={(event) => { setFailureThreshold(Number(event.target.value)); setSettingsSaved(false); }}
                required
                style={{ ...inputStyle, display: 'block', width: 150, marginTop: 6, fontFamily: 'inherit' }}
              />
            </label>
            <button type="submit" disabled={settingsSaving || !Number.isInteger(failureThreshold) || failureThreshold < 1 || failureThreshold > 1000} style={{ padding: '10px 14px', borderRadius: 10, border: 'none', background: 'var(--accent-color)', color: '#fff', cursor: settingsSaving ? 'default' : 'pointer', opacity: settingsSaving ? 0.6 : 1 }}>
              {settingsSaving ? 'Сохранение…' : 'Сохранить'}
            </button>
          </form>
        </div>
        {settingsSaved && <div style={{ marginTop: 10, fontSize: 12, color: '#16a34a' }}>Настройка сохранена</div>}
      </section>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 14 }}>
        {renderList('white')}
        {renderList('black')}
      </div>
    </div>
  );
}

export function SecuritySettings() {
  const [data, setData] = useState<AuthEventsResponse | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedIp, setSelectedIp] = useState('');
  const [ipInfo, setIpInfo] = useState<IpInfo | null>(null);
  const [ipInfoLoading, setIpInfoLoading] = useState(false);
  const [ipInfoError, setIpInfoError] = useState('');
  const infoRequest = useRef(0);

  const load = useCallback(async (targetPage: number) => {
    setLoading(true);
    setError('');
    try {
      const result = await api.security.authEvents(targetPage);
      setData(result);
      if (targetPage > result.totalPages) setPage(result.totalPages);
    } catch (e: any) {
      setError(e?.message || 'Не удалось загрузить журнал авторизаций');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(page); }, [load, page]);

  const closeIpInfo = useCallback(() => {
    infoRequest.current += 1;
    setSelectedIp('');
    setIpInfo(null);
    setIpInfoError('');
    setIpInfoLoading(false);
  }, []);

  useEffect(() => {
    if (!selectedIp) return;
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape') closeIpInfo(); };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [selectedIp, closeIpInfo]);

  const openIpInfo = async (ip: string) => {
    const request = ++infoRequest.current;
    setSelectedIp(ip);
    setIpInfo(null);
    setIpInfoError('');
    setIpInfoLoading(true);
    try {
      const result = await api.security.ipInfo(ip);
      if (infoRequest.current === request) setIpInfo(result);
    } catch (e: any) {
      if (infoRequest.current === request) setIpInfoError(e?.message || 'Не удалось получить сведения об IP-адресе');
    } finally {
      if (infoRequest.current === request) setIpInfoLoading(false);
    }
  };

  const infoRows: Array<[string, keyof IpInfo]> = [
    ['Страна', 'country'],
    ['Город', 'city'],
    ['Страна регистрации', 'registrationCountry'],
    ['Организация', 'organization'],
  ];

  return (
    <div>
      <IpAccessLists />

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 14, flexWrap: 'wrap' }}>
        <div>
          <h3 style={{ margin: '0 0 4px', fontSize: 16 }}>Авторизации пользователей</h3>
          <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Успешные и неудачные входы в главный проект и все организации · по 50 записей</div>
        </div>
        <button onClick={() => load(page)} disabled={loading} style={{ padding: '8px 14px', borderRadius: 10, border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-primary)', cursor: loading ? 'default' : 'pointer' }}>
          {loading ? 'Загрузка…' : 'Обновить'}
        </button>
      </div>
      {error && <div style={{ padding: 14, marginBottom: 12, borderRadius: 10, background: '#fef2f2', color: '#b91c1c' }}>{error}</div>}
      <div style={{ overflowX: 'auto', border: '1px solid var(--border-color)', borderRadius: 12, background: 'var(--bg-card)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 1060 }}>
          <thead><tr>
            <th style={headStyle}>Организация</th><th style={headStyle}>Логин при авторизации</th><th style={headStyle}>Результат</th><th style={headStyle}>IP-адрес</th><th style={headStyle}>Дата и время</th><th style={headStyle}>Устройство</th><th style={headStyle}>Версия</th>
          </tr></thead>
          <tbody>
            {data?.items.map((item) => <tr key={item.id}>
              <td style={cellStyle}><div style={{ fontWeight: 500 }}>{item.tenantName}</div><div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{item.tenantSlug}</div></td>
              <td style={{ ...cellStyle, wordBreak: 'break-word' }}>{item.login}</td>
              <td style={cellStyle}><span style={{ display: 'inline-block', padding: '4px 8px', borderRadius: 8, background: item.success ? '#dcfce7' : '#fee2e2', color: item.success ? '#166534' : '#b91c1c', whiteSpace: 'nowrap', fontWeight: 500 }}>{item.success ? 'Успешно' : 'Ошибка'}</span></td>
              <td style={{ ...cellStyle, whiteSpace: 'nowrap', fontFamily: 'monospace' }}>
                {item.ipAddress === 'unknown' ? item.ipAddress : <button type="button" onClick={() => openIpInfo(item.ipAddress)} title="Показать сведения об IP" style={{ padding: 0, border: 0, background: 'transparent', color: 'var(--accent-color)', font: 'inherit', cursor: 'pointer', textDecoration: 'underline', textDecorationStyle: 'dotted', textUnderlineOffset: 3 }}>{item.ipAddress}</button>}
              </td>
              <td style={{ ...cellStyle, whiteSpace: 'nowrap' }}>{new Date(item.createdAt).toLocaleString('ru-RU')}</td>
              <td style={cellStyle}>{item.device}</td>
              <td style={cellStyle}><span style={{ display: 'inline-block', padding: '4px 8px', borderRadius: 8, background: 'var(--bg-secondary)', whiteSpace: 'nowrap' }}>{item.clientType === 'mobile' ? 'Мобильная' : 'Десктопная'}</span></td>
            </tr>)}
            {!loading && data?.items.length === 0 && <tr><td colSpan={7} style={{ ...cellStyle, padding: 32, textAlign: 'center', color: 'var(--text-muted)' }}>Попыток входа пока нет. Новые записи появятся здесь автоматически.</td></tr>}
            {loading && !data && <tr><td colSpan={7} style={{ ...cellStyle, padding: 32, textAlign: 'center', color: 'var(--text-muted)' }}>Загрузка журнала…</td></tr>}
          </tbody>
        </table>
      </div>
      {data && <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginTop: 14, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Всего: {data.total} · Страница {data.page} из {data.totalPages}</span>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => setPage((value) => Math.max(1, value - 1))} disabled={page <= 1 || loading} style={{ padding: '8px 12px', borderRadius: 9, border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-primary)', cursor: page <= 1 || loading ? 'default' : 'pointer', opacity: page <= 1 ? 0.5 : 1 }}>← Назад</button>
          <button onClick={() => setPage((value) => Math.min(data.totalPages, value + 1))} disabled={page >= data.totalPages || loading} style={{ padding: '8px 12px', borderRadius: 9, border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-primary)', cursor: page >= data.totalPages || loading ? 'default' : 'pointer', opacity: page >= data.totalPages ? 0.5 : 1 }}>Вперёд →</button>
        </div>
      </div>}

      {selectedIp && <div onClick={(event) => { if (event.target === event.currentTarget) closeIpInfo(); }} style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, background: 'rgba(0,0,0,0.58)' }}>
        <div role="dialog" aria-modal="true" aria-labelledby="ip-info-title" style={{ width: '100%', maxWidth: 480, borderRadius: 16, border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-primary)', boxShadow: '0 24px 70px rgba(0,0,0,0.35)', overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '18px 20px', borderBottom: '1px solid var(--border-color)' }}>
            <div>
              <h3 id="ip-info-title" style={{ margin: '0 0 4px', fontSize: 17 }}>Информация об IP-адресе</h3>
              <div style={{ fontFamily: 'monospace', fontSize: 13, color: 'var(--accent-color)' }}>{selectedIp}</div>
            </div>
            <button type="button" onClick={closeIpInfo} aria-label="Закрыть" style={{ width: 34, height: 34, borderRadius: 9, border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-primary)', cursor: 'pointer', fontSize: 20 }}>×</button>
          </div>
          <div style={{ padding: '8px 20px 18px' }}>
            {ipInfoLoading && <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--text-muted)' }}>Получение сведений…</div>}
            {ipInfoError && <div style={{ marginTop: 12, padding: 12, borderRadius: 10, background: '#fef2f2', color: '#b91c1c', fontSize: 13 }}>{ipInfoError}</div>}
            {!ipInfoLoading && !ipInfoError && ipInfo && <>
              {infoRows.map(([label, key]) => <div key={key} style={{ display: 'grid', gridTemplateColumns: '170px 1fr', gap: 12, padding: '13px 0', borderBottom: '1px solid var(--border-color)', fontSize: 13 }}>
                <span style={{ color: 'var(--text-muted)' }}>{label}</span>
                <span style={{ fontWeight: 500, wordBreak: 'break-word' }}>{ipInfo[key] || 'Нет данных'}</span>
              </div>)}
              {!infoRows.some(([, key]) => ipInfo[key]) && <div style={{ paddingTop: 14, fontSize: 12, color: 'var(--text-muted)' }}>Публичные источники не вернули сведения для этого адреса.</div>}
            </>}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
              <button type="button" onClick={closeIpInfo} style={{ padding: '9px 16px', borderRadius: 10, border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', cursor: 'pointer' }}>Закрыть</button>
            </div>
          </div>
        </div>
      </div>}
    </div>
  );
}
