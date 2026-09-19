import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { AccountingRule, Contact } from '../types';
import { DOC_TYPE_LABELS, DIRECTION_LABELS, inputStyle, btnPrimary, btnSecondary, btnSmall } from './accounting/shared';

// Настройки модуля «Бухгалтерия по почте»: второй IMAP-ящик + правила классификации
export function AccountingSettings() {
  const [form, setForm] = useState({
    imapHost: '',
    imapPort: 993,
    imapUser: '',
    imapPass: '',
    checkIntervalMs: 60000,
    processedFolder: '',
    isActive: true,
    secure: true,
    rejectUnauthorized: false,
    requireTLS: true,
  });
  const [hasSettings, setHasSettings] = useState(false);
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [message, setMessage] = useState('');

  const [rules, setRules] = useState<AccountingRule[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [editingRule, setEditingRule] = useState<AccountingRule | null>(null);
  const [showRuleForm, setShowRuleForm] = useState(false);
  const [ruleForm, setRuleForm] = useState({
    name: '',
    fromContains: '',
    subjectContains: '',
    bodyContains: '',
    hasAttachments: '' as '' | 'yes' | 'no',
    docType: 'other',
    direction: 'incoming',
    contactId: '',
    stopProcessing: true,
    isActive: true,
    sortOrder: 0,
  });

  useEffect(() => {
    loadSettings();
    loadRules();
    api.contacts.list().then(setContacts).catch(() => {});
  }, []);

  const loadSettings = async () => {
    try {
      const data = await api.accounting.getSettings();
      if (data) {
        setHasSettings(true);
        setForm({
          imapHost: data.imapHost || '',
          imapPort: data.imapPort || 993,
          imapUser: data.imapUser || '',
          imapPass: data.imapPass || '',
          checkIntervalMs: data.checkIntervalMs || 60000,
          processedFolder: data.processedFolder || '',
          isActive: data.isActive,
          secure: data.secure,
          rejectUnauthorized: data.rejectUnauthorized,
          requireTLS: data.requireTLS,
        });
      }
    } catch (err: any) {
      setMessage('Ошибка загрузки настроек: ' + err.message);
    }
  };

  const loadRules = async () => {
    try {
      setRules(await api.accounting.rules.list());
    } catch (err: any) {
      setMessage('Ошибка загрузки правил: ' + err.message);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      await api.accounting.saveSettings({
        ...form,
        processedFolder: form.processedFolder || null,
      });
      setMessage('Настройки сохранены');
      await loadSettings();
    } catch (err: any) {
      setMessage('Ошибка сохранения: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleTest = async () => {
    setTesting(true);
    setMessage('');
    try {
      // Перед проверкой сохраняем текущие значения, чтобы тест шёл по актуальным данным
      await api.accounting.saveSettings({ ...form, processedFolder: form.processedFolder || null });
      const res = await api.accounting.testSettings();
      setMessage(res.ok ? 'Подключение успешно' : 'Ошибка подключения: ' + (res.error || 'неизвестная ошибка'));
    } catch (err: any) {
      setMessage('Ошибка подключения: ' + err.message);
    } finally {
      setTesting(false);
    }
  };

  const openRuleForm = (rule?: AccountingRule) => {
    if (rule) {
      setEditingRule(rule);
      setRuleForm({
        name: rule.name || '',
        fromContains: rule.fromContains || '',
        subjectContains: rule.subjectContains || '',
        bodyContains: rule.bodyContains || '',
        hasAttachments: rule.hasAttachments === true ? 'yes' : rule.hasAttachments === false ? 'no' : '',
        docType: rule.docType || 'other',
        direction: rule.direction || 'incoming',
        contactId: rule.contactId || '',
        stopProcessing: rule.stopProcessing,
        isActive: rule.isActive,
        sortOrder: rule.sortOrder || 0,
      });
    } else {
      setEditingRule(null);
      setRuleForm({
        name: '',
        fromContains: '',
        subjectContains: '',
        bodyContains: '',
        hasAttachments: '',
        docType: 'other',
        direction: 'incoming',
        contactId: '',
        stopProcessing: true,
        isActive: true,
        sortOrder: (rules[rules.length - 1]?.sortOrder || 0) + 1,
      });
    }
    setShowRuleForm(true);
  };

  const handleRuleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ruleForm.name.trim()) {
      alert('Укажите название правила');
      return;
    }
    try {
      const payload: any = {
        name: ruleForm.name.trim(),
        fromContains: ruleForm.fromContains || null,
        subjectContains: ruleForm.subjectContains || null,
        bodyContains: ruleForm.bodyContains || null,
        hasAttachments: ruleForm.hasAttachments === '' ? null : ruleForm.hasAttachments === 'yes',
        docType: ruleForm.docType,
        direction: ruleForm.direction,
        contactId: ruleForm.contactId || null,
        stopProcessing: ruleForm.stopProcessing,
        isActive: ruleForm.isActive,
        sortOrder: ruleForm.sortOrder,
      };
      if (editingRule) await api.accounting.rules.update(editingRule.id, payload);
      else await api.accounting.rules.create(payload);
      setShowRuleForm(false);
      await loadRules();
    } catch (err: any) {
      alert(err.message || 'Ошибка сохранения правила');
    }
  };

  const handleRuleDelete = async (id: string) => {
    if (!confirm('Удалить правило?')) return;
    try {
      await api.accounting.rules.delete(id);
      await loadRules();
    } catch (err: any) {
      alert(err.message || 'Ошибка удаления');
    }
  };

  const checkbox = (label: string, key: 'isActive' | 'secure' | 'rejectUnauthorized' | 'requireTLS') => (
    <label key={key} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-secondary)', cursor: 'pointer' }}>
      <input type="checkbox" checked={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.checked })} />
      {label}
    </label>
  );

  return (
    <div style={{ marginTop: 24, paddingTop: 24, borderTop: '1px solid var(--border-color)' }}>
      <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 4, color: 'var(--text-primary)' }}>Почта бухгалтерии</h3>
      <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
        Отдельный IMAP-ящик: письма автоматически превращаются в финансовые документы по правилам классификации.
      </p>

      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 560 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 10 }}>
          <label style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            IMAP-сервер
            <input value={form.imapHost} onChange={(e) => setForm({ ...form, imapHost: e.target.value })} required style={{ ...inputStyle, marginTop: 4 }} />
          </label>
          <label style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            Порт
            <input type="number" value={form.imapPort} onChange={(e) => setForm({ ...form, imapPort: parseInt(e.target.value) || 993 })} style={{ ...inputStyle, marginTop: 4 }} />
          </label>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <label style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            Логин
            <input value={form.imapUser} onChange={(e) => setForm({ ...form, imapUser: e.target.value })} required style={{ ...inputStyle, marginTop: 4 }} />
          </label>
          <label style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            Пароль
            <input type="password" value={form.imapPass} onChange={(e) => setForm({ ...form, imapPass: e.target.value })} required={!hasSettings} style={{ ...inputStyle, marginTop: 4 }} />
          </label>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <label style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            Интервал проверки, мс
            <input type="number" value={form.checkIntervalMs} onChange={(e) => setForm({ ...form, checkIntervalMs: parseInt(e.target.value) || 60000 })} style={{ ...inputStyle, marginTop: 4 }} />
          </label>
          <label style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            Папка для обработанных
            <input value={form.processedFolder} onChange={(e) => setForm({ ...form, processedFolder: e.target.value })} placeholder="Например, Processed" style={{ ...inputStyle, marginTop: 4 }} />
          </label>
        </div>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          {checkbox('Активен', 'isActive')}
          {checkbox('SSL/TLS (secure)', 'secure')}
          {checkbox('requireTLS', 'requireTLS')}
          {checkbox('Проверять сертификат', 'rejectUnauthorized')}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button type="submit" disabled={loading} style={btnPrimary}>
            {loading ? 'Сохранение...' : 'Сохранить'}
          </button>
          <button type="button" onClick={handleTest} disabled={testing} style={btnSecondary}>
            {testing ? 'Проверка...' : 'Проверить подключение'}
          </button>
        </div>
        {message && <div style={{ fontSize: 13, color: message.startsWith('Ошибка') ? '#dc2626' : '#166534' }}>{message}</div>}
      </form>

      {/* Правила классификации */}
      <div style={{ marginTop: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, maxWidth: 720 }}>
          <h4 style={{ fontSize: 14, fontWeight: 600, margin: 0, color: 'var(--text-primary)' }}>Правила классификации ({rules.length})</h4>
          <button onClick={() => openRuleForm()} style={btnSmall}>
            + Правило
          </button>
        </div>

        {rules.length === 0 ? (
          <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            Правил нет — все письма будут классифицироваться автоматически (эвристика по тексту).
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 720 }}>
            {rules.map((r) => (
              <div
                key={r.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '10px 12px',
                  borderRadius: 10,
                  background: 'var(--bg-input)',
                  opacity: r.isActive ? 1 : 0.55,
                  flexWrap: 'wrap',
                }}
              >
                <div style={{ flex: 1, minWidth: 180 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>
                    {r.sortOrder}. {r.name}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                    {[
                      r.fromContains ? `от: ${r.fromContains}` : null,
                      r.subjectContains ? `тема: ${r.subjectContains}` : null,
                      r.bodyContains ? `текст: ${r.bodyContains}` : null,
                      r.hasAttachments === true ? 'с вложениями' : r.hasAttachments === false ? 'без вложений' : null,
                    ]
                      .filter(Boolean)
                      .join(' · ') || 'без условий'}
                    {' → '}
                    {DOC_TYPE_LABELS[r.docType] || r.docType} / {DIRECTION_LABELS[r.direction] || r.direction}
                    {r.contact ? ` · ${r.contact.name}` : ''}
                    {r.stopProcessing ? ' · стоп' : ''}
                  </div>
                </div>
                <button onClick={() => openRuleForm(r)} style={btnSmall}>
                  ✏️
                </button>
                <button onClick={() => handleRuleDelete(r.id)} style={{ ...btnSmall, color: '#dc2626' }}>
                  🗑
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Форма правила */}
        {showRuleForm && (
          <form
            onSubmit={handleRuleSave}
            style={{
              marginTop: 12,
              padding: 16,
              borderRadius: 12,
              background: 'var(--bg-input)',
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
              maxWidth: 720,
            }}
          >
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
              {editingRule ? 'Редактировать правило' : 'Новое правило'}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10 }}>
              <label style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                Название
                <input value={ruleForm.name} onChange={(e) => setRuleForm({ ...ruleForm, name: e.target.value })} required style={{ ...inputStyle, marginTop: 4 }} />
              </label>
              <label style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                Порядок
                <input type="number" value={ruleForm.sortOrder} onChange={(e) => setRuleForm({ ...ruleForm, sortOrder: parseInt(e.target.value) || 0 })} style={{ ...inputStyle, marginTop: 4 }} />
              </label>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10 }}>
              <label style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                Отправитель содержит
                <input value={ruleForm.fromContains} onChange={(e) => setRuleForm({ ...ruleForm, fromContains: e.target.value })} style={{ ...inputStyle, marginTop: 4 }} />
              </label>
              <label style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                Тема содержит
                <input value={ruleForm.subjectContains} onChange={(e) => setRuleForm({ ...ruleForm, subjectContains: e.target.value })} style={{ ...inputStyle, marginTop: 4 }} />
              </label>
              <label style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                Текст содержит
                <input value={ruleForm.bodyContains} onChange={(e) => setRuleForm({ ...ruleForm, bodyContains: e.target.value })} style={{ ...inputStyle, marginTop: 4 }} />
              </label>
              <label style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                Вложения
                <select value={ruleForm.hasAttachments} onChange={(e) => setRuleForm({ ...ruleForm, hasAttachments: e.target.value as any })} style={{ ...inputStyle, marginTop: 4 }}>
                  <option value="">Не важно</option>
                  <option value="yes">Есть</option>
                  <option value="no">Нет</option>
                </select>
              </label>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10 }}>
              <label style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                Тип документа
                <select value={ruleForm.docType} onChange={(e) => setRuleForm({ ...ruleForm, docType: e.target.value })} style={{ ...inputStyle, marginTop: 4 }}>
                  {Object.entries(DOC_TYPE_LABELS).map(([v, l]) => (
                    <option key={v} value={v}>{l}</option>
                  ))}
                </select>
              </label>
              <label style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                Направление
                <select value={ruleForm.direction} onChange={(e) => setRuleForm({ ...ruleForm, direction: e.target.value })} style={{ ...inputStyle, marginTop: 4 }}>
                  {Object.entries(DIRECTION_LABELS).map(([v, l]) => (
                    <option key={v} value={v}>{l}</option>
                  ))}
                </select>
              </label>
              <label style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                Контакт
                <select value={ruleForm.contactId} onChange={(e) => setRuleForm({ ...ruleForm, contactId: e.target.value })} style={{ ...inputStyle, marginTop: 4 }}>
                  <option value="">— не выбран —</option>
                  {contacts.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}{c.company ? ` (${c.company})` : ''}</option>
                  ))}
                </select>
              </label>
            </div>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-secondary)', cursor: 'pointer' }}>
                <input type="checkbox" checked={ruleForm.isActive} onChange={(e) => setRuleForm({ ...ruleForm, isActive: e.target.checked })} />
                Активно
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-secondary)', cursor: 'pointer' }}>
                <input type="checkbox" checked={ruleForm.stopProcessing} onChange={(e) => setRuleForm({ ...ruleForm, stopProcessing: e.target.checked })} />
                Остановить обработку после срабатывания
              </label>
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => setShowRuleForm(false)} style={btnSecondary}>
                Отмена
              </button>
              <button type="submit" style={btnPrimary}>
                Сохранить
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
