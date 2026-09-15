import { useEffect, useState, useCallback } from 'react';
import { api } from '../api/client';
import { EmailFilter, EmailParseRule, Project, User } from '../types';

const inputStyle: React.CSSProperties = {
  padding: '8px 14px', borderRadius: 12, border: '1px solid var(--border-color)',
  background: 'var(--bg-color)', color: 'var(--text-color)', fontSize: 14, outline: 'none', width: '100%',
};
const labelStyle: React.CSSProperties = { display: 'block', fontSize: 13, color: 'var(--text-secondary)', marginBottom: 4 };

const emptyForm = {
  name: '', fromContains: '', toContains: '', subjectContains: '', bodyContains: '',
  hasAttachments: '' as '' | 'yes' | 'no',
  createTask: true, projectId: '', assigneeIds: [] as string[],
  priority: '', status: '', markRead: '' as '' | 'yes' | 'no',
  moveToFolder: '', stopProcessing: true, sortOrder: 0,
  parseRules: [] as EmailParseRule[],
};

const PARSE_FIELD_LABELS: Record<EmailParseRule['field'], string> = {
  title: 'Тема задачи',
  description: 'Описание',
  address: 'Адрес',
  priority: 'Приоритет',
  discussion: 'Сообщение в обсуждение',
  status: 'Статус',
};

export function EmailFilters() {
  const [filters, setFilters] = useState<EmailFilter[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [message, setMessage] = useState('');

  const load = useCallback(async () => {
    try {
      const f = await api.emailFilters.list();
      setFilters(f || []);
    } catch (e: any) {
      setMessage('Ошибка загрузки фильтров: ' + e.message);
    }
  }, []);

  useEffect(() => {
    load();
    api.projects.list().then(setProjects).catch(() => {});
    api.users.list().then(setUsers).catch(() => {});
  }, [load]);

  const toggle = async (f: EmailFilter) => {
    try {
      await api.emailFilters.update(f.id, { isActive: !f.isActive });
      load();
    } catch (e: any) {
      setMessage(e.message);
    }
  };

  const remove = async (f: EmailFilter) => {
    if (!window.confirm(`Удалить фильтр "${f.name}"?`)) return;
    try {
      await api.emailFilters.delete(f.id);
      load();
    } catch (e: any) {
      setMessage(e.message);
    }
  };

  const startEdit = (f: EmailFilter) => {
    setForm({
      name: f.name,
      fromContains: f.fromContains || '',
      toContains: f.toContains || '',
      subjectContains: f.subjectContains || '',
      bodyContains: f.bodyContains || '',
      hasAttachments: f.hasAttachments === null || f.hasAttachments === undefined ? '' : f.hasAttachments ? 'yes' : 'no',
      createTask: f.createTask,
      projectId: f.projectId || '',
      assigneeIds: f.assigneeIds || [],
      priority: f.priority || '',
      status: f.status || '',
      markRead: f.markRead === null || f.markRead === undefined ? '' : f.markRead ? 'yes' : 'no',
      moveToFolder: f.moveToFolder || '',
      stopProcessing: f.stopProcessing,
      sortOrder: f.sortOrder,
      parseRules: (f.parseRules as EmailParseRule[]) || [],
    });
    setEditingId(f.id);
    setShowForm(true);
    setMessage('');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(false);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      name: form.name,
      fromContains: form.fromContains || null,
      toContains: form.toContains || null,
      subjectContains: form.subjectContains || null,
      bodyContains: form.bodyContains || null,
      hasAttachments: form.hasAttachments === '' ? null : form.hasAttachments === 'yes',
      createTask: form.createTask,
      projectId: form.projectId || null,
      assigneeIds: form.assigneeIds,
      priority: form.priority || null,
      status: form.status || null,
      markRead: form.markRead === '' ? null : form.markRead === 'yes',
      moveToFolder: form.moveToFolder || null,
      parseRules: form.parseRules.filter(r => r.pattern.trim()).length
        ? form.parseRules.filter(r => r.pattern.trim())
        : null,
      stopProcessing: form.stopProcessing,
      sortOrder: form.sortOrder,
    };
    try {
      if (editingId) {
        await api.emailFilters.update(editingId, data);
        setMessage('Фильтр обновлён');
      } else {
        await api.emailFilters.create(data);
        setMessage('Фильтр создан');
      }
      setForm(emptyForm);
      setEditingId(null);
      setShowForm(false);
      load();
    } catch (err: any) {
      setMessage('Ошибка: ' + err.message);
    }
  };

  const actionsSummary = (f: EmailFilter) => {
    const parts: string[] = [];
    if (!f.createTask) parts.push('не создавать задачу');
    else {
      if (f.project) parts.push(`проект: ${f.project.name}`);
      if (f.assigneeIds.length) parts.push(`исполнителей: ${f.assigneeIds.length}`);
      if (f.priority) parts.push(`приоритет: ${f.priority}`);
      if (f.status) parts.push(`статус: ${f.status}`);
    }
    if (f.markRead === true) parts.push('прочитанным');
    if (f.markRead === false) parts.push('непрочитанным');
    if (f.moveToFolder) parts.push(`папка: ${f.moveToFolder}`);
    if (f.parseRules?.length) {
      parts.push(`парсинг: ${f.parseRules.map(r => PARSE_FIELD_LABELS[r.field] || r.field).join(', ')}`);
    }
    return parts.join(' · ') || 'без действий';
  };

  const conditionsSummary = (f: EmailFilter) => {
    const parts: string[] = [];
    if (f.fromContains) parts.push(`от: ${f.fromContains}`);
    if (f.toContains) parts.push(`кому: ${f.toContains}`);
    if (f.subjectContains) parts.push(`тема: ${f.subjectContains}`);
    if (f.bodyContains) parts.push(`текст: ${f.bodyContains}`);
    if (f.hasAttachments !== null && f.hasAttachments !== undefined) parts.push(f.hasAttachments ? 'с вложениями' : 'без вложений');
    return parts.join(' · ');
  };

  return (
    <div style={{ marginTop: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
        <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>Фильтры писем</h3>
        <button
          onClick={() => (showForm ? cancelEdit() : setShowForm(true))}
          style={{ padding: '8px 16px', borderRadius: 12, border: 'none', background: '#007AFF', color: '#fff', fontSize: 14, fontWeight: 500, cursor: 'pointer' }}
        >
          {showForm ? (editingId ? 'Отмена' : 'Скрыть') : '+ Новый фильтр'}
        </button>
      </div>
      {message && <div style={{ marginBottom: 12, fontSize: 13, color: 'var(--text-secondary)' }}>{message}</div>}

      {showForm && (
        <form
          onSubmit={submit}
          style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12, marginBottom: 16, padding: 16, borderRadius: 12, background: 'var(--bg-hover)' }}
        >
          {editingId && (
            <div style={{ gridColumn: '1 / -1', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>
              Редактирование фильтра «{filters.find(f => f.id === editingId)?.name || ''}»
            </div>
          )}
          <div>
            <label style={labelStyle}>Название *</label>
            <input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Отправитель содержит</label>
            <input value={form.fromContains} onChange={e => setForm({ ...form, fromContains: e.target.value })} placeholder="email или домен" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Получатель содержит</label>
            <input value={form.toContains} onChange={e => setForm({ ...form, toContains: e.target.value })} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Тема содержит</label>
            <input value={form.subjectContains} onChange={e => setForm({ ...form, subjectContains: e.target.value })} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Текст письма содержит</label>
            <input value={form.bodyContains} onChange={e => setForm({ ...form, bodyContains: e.target.value })} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Вложения</label>
            <select value={form.hasAttachments} onChange={e => setForm({ ...form, hasAttachments: e.target.value as any })} style={inputStyle}>
              <option value="">Не важно</option>
              <option value="yes">Есть</option>
              <option value="no">Нет</option>
            </select>
          </div>
          <div>
            <label style={labelStyle}>Проект</label>
            <select value={form.projectId} onChange={e => setForm({ ...form, projectId: e.target.value })} style={inputStyle}>
              <option value="">—</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Исполнители (Ctrl — несколько)</label>
            <select
              multiple
              value={form.assigneeIds}
              onChange={e => setForm({ ...form, assigneeIds: Array.from(e.target.selectedOptions, o => o.value) })}
              style={{ ...inputStyle, minHeight: 80 }}
            >
              {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Приоритет</label>
            <select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })} style={inputStyle}>
              <option value="">По умолчанию</option>
              <option value="low">Низкий</option>
              <option value="medium">Средний</option>
              <option value="high">Высокий</option>
              <option value="urgent">Срочный</option>
            </select>
          </div>
          <div>
            <label style={labelStyle}>Прочитанность на сервере</label>
            <select value={form.markRead} onChange={e => setForm({ ...form, markRead: e.target.value as any })} style={inputStyle}>
              <option value="">Не менять</option>
              <option value="yes">Прочитанным</option>
              <option value="no">Непрочитанным</option>
            </select>
          </div>
          <div>
            <label style={labelStyle}>Переместить в IMAP-папку</label>
            <input value={form.moveToFolder} onChange={e => setForm({ ...form, moveToFolder: e.target.value })} placeholder="напр. INBOX/Обработано" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Порядок применения</label>
            <input type="number" value={form.sortOrder} onChange={e => setForm({ ...form, sortOrder: +e.target.value || 0 })} style={inputStyle} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, justifyContent: 'center' }}>
            <label style={{ fontSize: 13, display: 'flex', gap: 6, alignItems: 'center' }}>
              <input type="checkbox" checked={form.createTask} onChange={e => setForm({ ...form, createTask: e.target.checked })} />
              Создавать задачу
            </label>
            <label style={{ fontSize: 13, display: 'flex', gap: 6, alignItems: 'center' }}>
              <input type="checkbox" checked={form.stopProcessing} onChange={e => setForm({ ...form, stopProcessing: e.target.checked })} />
              Остановить обработку (не применять фильтры ниже)
            </label>
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={labelStyle}>Парсинг текста письма (шаблон → поле задачи)</label>
            {form.parseRules.map((rule, idx) => (
              <div key={idx} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                <select
                  value={rule.mode || 'regex'}
                  onChange={e => setForm({ ...form, parseRules: form.parseRules.map((r, i) => i === idx ? { ...r, mode: e.target.value as EmailParseRule['mode'] } : r) })}
                  title="Режим извлечения"
                  style={{ ...inputStyle, width: 190 }}
                >
                  <option value="regex">Регулярное выражение</option>
                  <option value="toEol">От слова до конца строки</option>
                  <option value="toWord">От слова до слова</option>
                </select>
                <input
                  value={rule.pattern}
                  onChange={e => setForm({ ...form, parseRules: form.parseRules.map((r, i) => i === idx ? { ...r, pattern: e.target.value } : r) })}
                  placeholder={rule.mode === 'toEol' ? 'напр. Адрес объекта:' : rule.mode === 'toWord' ? 'начальное слово' : 'напр. Адрес:\\s*(.+)'}
                  style={{ ...inputStyle, flex: 2, minWidth: 180 }}
                />
                {(rule.mode || 'regex') === 'toWord' && (
                  <>
                    <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>до</span>
                    <input
                      value={rule.pattern2 || ''}
                      onChange={e => setForm({ ...form, parseRules: form.parseRules.map((r, i) => i === idx ? { ...r, pattern2: e.target.value } : r) })}
                      placeholder="конечное слово"
                      style={{ ...inputStyle, flex: 1, minWidth: 120 }}
                    />
                  </>
                )}
                {(rule.mode || 'regex') === 'regex' && (
                  <input
                    type="number" min={0} max={9} value={rule.group ?? 1}
                    onChange={e => setForm({ ...form, parseRules: form.parseRules.map((r, i) => i === idx ? { ...r, group: +e.target.value || 0 } : r) })}
                    title="Номер группы захвата"
                    style={{ ...inputStyle, width: 70 }}
                  />
                )}
                <select
                  value={rule.field}
                  onChange={e => setForm({ ...form, parseRules: form.parseRules.map((r, i) => i === idx ? { ...r, field: e.target.value as EmailParseRule['field'] } : r) })}
                  style={{ ...inputStyle, flex: 1, minWidth: 130 }}
                >
                  {(Object.keys(PARSE_FIELD_LABELS) as EmailParseRule['field'][]).map(f => (
                    <option key={f} value={f}>{PARSE_FIELD_LABELS[f]}</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, parseRules: form.parseRules.filter((_, i) => i !== idx) })}
                  style={{ padding: '6px 12px', borderRadius: 10, border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-color)', fontSize: 13, cursor: 'pointer' }}
                >
                  Удалить
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => setForm({ ...form, parseRules: [...form.parseRules, { pattern: '', mode: 'toEol', field: 'address', group: 1 }] })}
              style={{ padding: '6px 12px', borderRadius: 10, border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-color)', fontSize: 13, cursor: 'pointer' }}
            >
              + Правило парсинга
            </button>
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <button
              type="submit"
              style={{ padding: '8px 16px', borderRadius: 12, border: 'none', background: '#007AFF', color: '#fff', fontSize: 14, fontWeight: 500, cursor: 'pointer' }}
            >
              {editingId ? 'Сохранить изменения' : 'Создать фильтр'}
            </button>
          </div>
        </form>
      )}

      {filters.length === 0 && (
        <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Фильтров нет — все письма обрабатываются по умолчанию.</div>
      )}

      {filters.map(f => (
        <div
          key={f.id}
          style={{ padding: '10px 14px', borderRadius: 12, background: 'var(--bg-hover)', marginBottom: 8, display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}
        >
          <div style={{ flex: 1, minWidth: 220 }}>
            <div style={{ fontWeight: 600, fontSize: 14 }}>
              {f.name} {!f.isActive && <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>(выключен)</span>}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Если: {conditionsSummary(f)}</div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>То: {actionsSummary(f)}</div>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              onClick={() => startEdit(f)}
              style={{ padding: '6px 12px', borderRadius: 10, border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-color)', fontSize: 13, cursor: 'pointer' }}
            >
              Редактировать
            </button>
            <button
              onClick={() => toggle(f)}
              style={{ padding: '6px 12px', borderRadius: 10, border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-color)', fontSize: 13, cursor: 'pointer' }}
            >
              {f.isActive ? 'Выключить' : 'Включить'}
            </button>
            <button
              onClick={() => remove(f)}
              style={{ padding: '6px 12px', borderRadius: 10, border: 'none', background: '#ef4444', color: '#fff', fontSize: 13, cursor: 'pointer' }}
            >
              Удалить
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
