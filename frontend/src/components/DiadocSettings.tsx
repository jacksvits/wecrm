import { useEffect, useState } from 'react';
import { api } from '../api/client';

// === Плагин «Контур.Диадок»: ЭДО — получение, отправка и подписание документов ===
type DocTab = 'inbound' | 'outbound' | 'requireSignature';

const TABS: { key: DocTab; label: string }[] = [
  { key: 'inbound', label: 'Входящие' },
  { key: 'outbound', label: 'Исходящие' },
  { key: 'requireSignature', label: 'На подписание' },
];

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
const btnPrimary: React.CSSProperties = { padding: '8px 16px', borderRadius: 10, background: '#007AFF', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 14 };
const btnSecondary: React.CSSProperties = { padding: '8px 16px', borderRadius: 10, border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-primary)', fontSize: 14, cursor: 'pointer' };
const btnSmall: React.CSSProperties = { padding: '4px 10px', borderRadius: 8, border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-primary)', fontSize: 12, cursor: 'pointer' };

interface SignState {
  messageId: string;
  entityId: string;
  title: string;
  confirmRequired: boolean;
  code: string;
  busy: boolean;
}

export default function DiadocSettings() {
  const [settings, setSettings] = useState<any>(null);
  const [form, setForm] = useState({ apiKey: '', login: '', password: '', updateIntervalMinutes: 15 });
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [msg, setMsg] = useState('');

  const [activeTab, setActiveTab] = useState<DocTab>('inbound');
  const [docs, setDocs] = useState<any[]>([]);
  const [docsLoading, setDocsLoading] = useState(false);
  const [docsError, setDocsError] = useState('');
  const [sign, setSign] = useState<SignState | null>(null);

  const [counteragents, setCounteragents] = useState<any[]>([]);
  const [sendFileName, setSendFileName] = useState('');
  const [sendContent, setSendContent] = useState('');
  const [sendTarget, setSendTarget] = useState(''); // boxId из списка контрагентов
  const [sendInn, setSendInn] = useState('');
  const [sendKpp, setSendKpp] = useState('');
  const [sending, setSending] = useState(false);

  const flash = (text: string) => { setMsg(text); setTimeout(() => setMsg(''), 5000); };

  useEffect(() => {
    api.diadocPlugin.get().then((s: any) => {
      setSettings(s);
      setForm({ apiKey: s.apiKey || '', login: s.login || '', password: '', updateIntervalMinutes: s.updateIntervalMinutes || 15 });
      if (s.isActive && s.boxId) {
        loadDocs('inbound');
        api.diadocPlugin.counteragents().then((r: any) => setCounteragents(r.items || [])).catch(() => {});
      }
    }).catch(() => {});
  }, []);

  const connected = !!settings?.isActive;

  const loadDocs = async (tab: DocTab) => {
    setDocsLoading(true);
    setDocsError('');
    try {
      const r: any = await api.diadocPlugin.documents(tab);
      setDocs(r.items || []);
    } catch (err: any) {
      setDocs([]);
      setDocsError(err.message);
    } finally {
      setDocsLoading(false);
    }
  };

  const switchTab = (tab: DocTab) => {
    setActiveTab(tab);
    setSign(null);
    loadDocs(tab);
  };

  const save = async () => {
    setSaving(true);
    try {
      const res: any = await api.diadocPlugin.save({
        apiKey: form.apiKey.trim(),
        login: form.login.trim(),
        password: form.password,
        updateIntervalMinutes: Number(form.updateIntervalMinutes) || 15,
      });
      setSettings((prev: any) => ({ ...prev, ...res }));
      setForm((f) => ({ ...f, password: '' }));
      flash(res.isActive ? 'Настройки сохранены, подключение активно' : `Настройки сохранены, но подключиться не удалось: ${res.error || 'проверьте данные'}`);
      if (res.isActive && res.boxId) loadDocs(activeTab);
    } catch (err: any) {
      flash('Ошибка сохранения: ' + err.message);
    } finally { setSaving(false); }
  };

  const test = async () => {
    setTesting(true);
    try {
      const r: any = await api.diadocPlugin.test({
        apiKey: form.apiKey.trim(),
        login: form.login.trim(),
        password: form.password,
      });
      flash(r.ok ? `Подключение успешно. Доступно ящиков: ${(r.boxes || []).length}` : 'Ошибка подключения: ' + r.message);
    } catch (err: any) {
      flash('Ошибка подключения: ' + err.message);
    } finally { setTesting(false); }
  };

  const selectBox = async (boxId: string) => {
    try {
      const res: any = await api.diadocPlugin.selectBox(boxId);
      setSettings((prev: any) => ({ ...prev, boxId: res.boxId, boxName: res.boxName }));
      flash(`Ящик выбран: ${res.boxName || res.boxId}`);
      loadDocs(activeTab);
    } catch (err: any) {
      flash('Ошибка выбора ящика: ' + err.message);
    }
  };

  const download = (d: any) => {
    api.diadocPlugin.downloadDocument(d.messageId, d.entityId, d.fileName || `document-${d.entityId}`)
      .catch((err: any) => flash('Ошибка скачивания: ' + err.message));
  };

  const startSign = (d: any) => {
    setSign({ messageId: d.messageId, entityId: d.entityId, title: d.title || d.fileName, confirmRequired: false, code: '', busy: false });
  };

  const doSign = async () => {
    if (!sign) return;
    setSign({ ...sign, busy: true });
    try {
      const r: any = await api.diadocPlugin.sign({ messageId: sign.messageId, entityId: sign.entityId, confirmCode: sign.code || undefined });
      if (r.confirmationRequired) {
        setSign({ ...sign, confirmRequired: true, busy: false });
        flash('На телефон отправлен код подтверждения подписания');
      } else {
        setSign(null);
        flash('Документ подписан');
        loadDocs(activeTab);
      }
    } catch (err: any) {
      setSign({ ...sign, busy: false });
      flash('Ошибка подписания: ' + err.message);
    }
  };

  const pickFile = (file: File | null) => {
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { flash('Ошибка: файл больше 10 МБ'); return; }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result || '');
      setSendContent(dataUrl.slice(dataUrl.indexOf(',') + 1));
      setSendFileName(file.name);
    };
    reader.readAsDataURL(file);
  };

  const send = async () => {
    if (!sendContent || !sendFileName) { flash('Ошибка: выберите файл'); return; }
    setSending(true);
    try {
      const payload: any = { fileName: sendFileName, contentBase64: sendContent };
      if (sendTarget) payload.toBoxId = sendTarget;
      else { payload.inn = sendInn.trim(); payload.kpp = sendKpp.trim(); }
      await api.diadocPlugin.send(payload);
      flash('Документ отправлен');
      setSendFileName(''); setSendContent('');
      if (activeTab === 'outbound') loadDocs('outbound');
    } catch (err: any) {
      flash('Ошибка отправки: ' + err.message);
    } finally { setSending(false); }
  };

  const counterparty = (d: any) => (d.direction === 'Outbound' ? d.recipientTitle : d.senderTitle) || '';

  return (
    <div style={{ maxWidth: 640 }}>
      {/* Статус подключения */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <span style={{ width: 7, height: 7, borderRadius: '50%', background: connected ? '#16a34a' : '#9ca3af' }} />
        <span style={{ fontSize: 13, fontWeight: 500, color: connected ? '#16a34a' : '#6b7280' }}>
          {connected ? `Подключено${settings.boxName ? ` — ${settings.boxName}` : ''}` : 'Не подключено'}
        </span>
      </div>
      {settings?.error && <div style={{ fontSize: 13, color: '#dc2626', marginBottom: 12 }}>Ошибка API Диадока: {settings.error}</div>}

      {/* Подключение */}
      <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 10 }}>Подключение</div>
      <div style={{ marginBottom: 10 }}>
        <label style={labelStyle}>API-ключ разработчика</label>
        <input type="text" value={form.apiKey} onChange={(e) => setForm({ ...form, apiKey: e.target.value })} style={inputStyle} placeholder="XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX" />
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>
          Ключ получает разработчик интеграции на{' '}
          <a href="https://developer.kontur.ru/diadoc" target="_blank" rel="noreferrer" style={{ color: '#007AFF' }}>developer.kontur.ru/diadoc</a>
          {' '}в разделе «Ключи API»
        </div>
      </div>
      <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
        <div style={{ flex: 1 }}>
          <label style={labelStyle}>Логин</label>
          <input type="text" value={form.login} onChange={(e) => setForm({ ...form, login: e.target.value })} style={inputStyle} placeholder="Логин Диадока" />
        </div>
        <div style={{ flex: 1 }}>
          <label style={labelStyle}>Пароль</label>
          <input
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            style={inputStyle}
            placeholder={settings?.passwordSet ? '•••••••• (оставьте пустым, чтобы не менять)' : 'Пароль Диадока'}
          />
        </div>
      </div>
      <div style={{ marginBottom: 14 }}>
        <label style={labelStyle}>Интервал обновления данных (минут)</label>
        <input
          type="number" min={1} max={1440}
          value={form.updateIntervalMinutes}
          onChange={(e) => setForm({ ...form, updateIntervalMinutes: Number(e.target.value) })}
          style={{ ...inputStyle, width: 120 }}
        />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 20 }}>
        <button onClick={save} disabled={saving || !settings} style={{ ...btnPrimary, opacity: saving || !settings ? 0.7 : 1 }}>
          {saving ? 'Сохранение...' : 'Сохранить'}
        </button>
        <button onClick={test} disabled={testing || !settings} style={{ ...btnSecondary, opacity: testing || !settings ? 0.7 : 1 }}>
          {testing ? 'Проверка...' : 'Проверить подключение'}
        </button>
        {msg && <span style={{ fontSize: 13, color: msg.startsWith('Ошибка') ? '#dc2626' : '#16a34a' }}>{msg}</span>}
      </div>

      {/* Выбор ящика */}
      {connected && (settings?.boxes?.length || 0) > 0 && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 10 }}>Ящик организации</div>
          <select value={settings?.boxId || ''} onChange={(e) => e.target.value && selectBox(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
            {!settings?.boxId && <option value="">— выберите ящик —</option>}
            {(settings.boxes || []).map((b: any) => (
              <option key={b.boxId} value={b.boxId}>{b.title} (ИНН {b.inn}{b.kpp ? `, КПП ${b.kpp}` : ''})</option>
            ))}
          </select>
        </div>
      )}

      {connected && settings?.boxId && (
        <>
          {/* Документы */}
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 10 }}>Документы</div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
            {TABS.map((t) => {
              const count = settings?.counts?.[t.key === 'requireSignature' ? 'requireSignature' : t.key];
              const active = activeTab === t.key;
              return (
                <button
                  key={t.key}
                  onClick={() => switchTab(t.key)}
                  style={{
                    padding: '6px 14px', borderRadius: 10, fontSize: 13, cursor: 'pointer',
                    border: '1px solid var(--border-color)',
                    background: active ? 'var(--text-primary)' : 'transparent',
                    color: active ? 'var(--bg-card)' : 'var(--text-secondary)',
                    fontWeight: active ? 600 : 400,
                  }}
                >
                  {t.label}{typeof count === 'number' ? ` (${count})` : ''}
                </button>
              );
            })}
            <button onClick={() => loadDocs(activeTab)} disabled={docsLoading} style={{ ...btnSmall, marginLeft: 'auto' }}>
              {docsLoading ? 'Загрузка...' : 'Обновить'}
            </button>
          </div>
          {docsError && <div style={{ fontSize: 13, color: '#dc2626', marginBottom: 10 }}>{docsError}</div>}

          {/* Панель подтверждения подписания */}
          {sign && (
            <div style={{ marginBottom: 12, padding: 14, borderRadius: 12, border: '1px solid var(--border-color)', background: 'var(--bg-input)' }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Подписать документ облачной подписью?</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 10 }}>{sign.title}</div>
              {sign.confirmRequired && (
                <div style={{ marginBottom: 10 }}>
                  <label style={labelStyle}>Код подтверждения из SMS</label>
                  <input type="text" value={sign.code} onChange={(e) => setSign({ ...sign, code: e.target.value })} style={{ ...inputStyle, width: 200 }} placeholder="XXXXXX" />
                </div>
              )}
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={doSign} disabled={sign.busy || (sign.confirmRequired && !sign.code.trim())} style={{ ...btnPrimary, fontSize: 13, opacity: sign.busy ? 0.7 : 1 }}>
                  {sign.busy ? 'Подписание...' : sign.confirmRequired ? 'Подтвердить код' : 'Подписать'}
                </button>
                <button onClick={() => setSign(null)} disabled={sign.busy} style={{ ...btnSmall, fontSize: 13 }}>Отмена</button>
              </div>
            </div>
          )}

          <div style={{ border: '1px solid var(--border-color)', borderRadius: 12, overflow: 'hidden', marginBottom: 20 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: 'var(--bg-input)' }}>
                  {['Дата', 'Номер', 'Контрагент', 'Документ', 'Сумма', 'Статус', ''].map((h) => (
                    <th key={h} style={{ textAlign: 'left', padding: '8px 10px', fontWeight: 600, color: 'var(--text-muted)', fontSize: 12, whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {docs.length === 0 && !docsLoading && (
                  <tr><td colSpan={7} style={{ padding: 16, textAlign: 'center', color: 'var(--text-muted)' }}>Документов нет</td></tr>
                )}
                {docs.map((d) => (
                  <tr key={d.documentId} style={{ borderTop: '1px solid var(--border-color)', opacity: d.isRead ? 1 : undefined }}>
                    <td style={{ padding: '8px 10px', whiteSpace: 'nowrap' }}>{d.docDate}</td>
                    <td style={{ padding: '8px 10px' }}>{d.docNumber}</td>
                    <td style={{ padding: '8px 10px', maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={counterparty(d)}>{counterparty(d)}</td>
                    <td style={{ padding: '8px 10px', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: d.isRead ? 400 : 600 }} title={d.title || d.fileName}>
                      {d.title || d.fileName}{d.isTest ? ' (тест)' : ''}
                    </td>
                    <td style={{ padding: '8px 10px', whiteSpace: 'nowrap' }}>{d.total}</td>
                    <td style={{ padding: '8px 10px', maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={d.status}>{d.status}</td>
                    <td style={{ padding: '8px 10px', whiteSpace: 'nowrap' }}>
                      <button onClick={() => download(d)} style={btnSmall}>Скачать</button>
                      {d.requiresSignature && (
                        <button onClick={() => startSign(d)} style={{ ...btnSmall, marginLeft: 6, color: '#007AFF', borderColor: '#007AFF' }}>Подписать</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Отправка документа */}
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 10 }}>Отправить документ</div>
          <div style={{ padding: 14, borderRadius: 12, border: '1px solid var(--border-color)', background: 'var(--bg-input)', marginBottom: 8 }}>
            <div style={{ marginBottom: 10 }}>
              <label style={labelStyle}>Файл (неформализованный документ, до 10 МБ)</label>
              <input type="file" onChange={(e) => pickFile(e.target.files?.[0] || null)} style={{ fontSize: 13, color: 'var(--text-primary)' }} />
              {sendFileName && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>Выбран: {sendFileName}</div>}
            </div>
            {counteragents.length > 0 && (
              <div style={{ marginBottom: 10 }}>
                <label style={labelStyle}>Контрагент</label>
                <select value={sendTarget} onChange={(e) => setSendTarget(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
                  <option value="">— вручную по ИНН/КПП —</option>
                  {counteragents.map((c: any, i: number) => (
                    <option key={c.boxId || i} value={c.boxId}>{c.fullName} (ИНН {c.inn}{c.kpp ? `, КПП ${c.kpp}` : ''})</option>
                  ))}
                </select>
              </div>
            )}
            {!sendTarget && (
              <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>ИНН получателя</label>
                  <input type="text" value={sendInn} onChange={(e) => setSendInn(e.target.value)} style={inputStyle} placeholder="7707083893" />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>КПП получателя</label>
                  <input type="text" value={sendKpp} onChange={(e) => setSendKpp(e.target.value)} style={inputStyle} placeholder="770701001" />
                </div>
              </div>
            )}
            <button onClick={send} disabled={sending || !sendContent} style={{ ...btnPrimary, fontSize: 13, opacity: sending || !sendContent ? 0.7 : 1 }}>
              {sending ? 'Отправка...' : 'Отправить'}
            </button>
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            Подписание доступно для облачных сертификатов Контура. Для отправки по ИНН контрагент должен быть в списке контрагентов ящика в Диадоке.
          </div>
        </>
      )}
    </div>
  );
}
