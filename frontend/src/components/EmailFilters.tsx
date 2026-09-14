import { useEffect, useState, useCallback } from 'react';
import { api } from '../api/client';
import { EmailFilter, EmailFilterLog, Project, User } from '../types';

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
};

export function EmailFilters() {
  const [filters, setFilters] = useState<EmailFilter[]>([]);
  const [logs, setLogs] = useState<EmailFilterLog[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [message, setMessage] = useState('');

  const load = useCallback(async () => {
    try {
      const [f, l] = await Promise.all([api.emailFilters.list(), api.emailFilters.logs()]);
      setFilters(f || []);
      setLogs(l || []);
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

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.emailFilters.create({
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
        stopProcessing: form.stopProcessing,
        sortOrder: form.sortOrder,
      });
      setForm(emptyForm);
      setShowForm(false);
      setMessage('Фильтр создан');
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
          onClick={() => setShowForm(!showForm)}
          style={{ padding: '8px 16px', borderRadius: 12, border: 'none', background: '#007AFF', color: '#fff', fontSize: 14, fontWeight: 500, cursor: 'pointer' }}
        >
          {showForm ? 'Скрыть' : '+ Новый фильтр'}
        </button>
      </div>
      {message && <div style={{ marginBottom: 12, fontSize: 13, color: 'var(--text-secondary)' }}>{message}</div>}

      {showForm && (
        <form
          onSubmit={submit}
          style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12, marginBottom: 16, padding: 16, borderRadius: 12, background: 'var(--bg-hover)' }}
        >
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
            <button
              type="submit"
              style={{ padding: '8px 16px', borderRadius: 12, border: 'none', background: '#007AFF', color: '#fff', fontSize: 14, fontWeight: 500, cursor: 'pointer' }}
            >
              Создать фильтр
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

      {logs.length > 0 && (
        <>
          <h3 style={{ fontSize: 16, fontWeight: 600, margin: '20px 0 8px' }}>Журнал срабатываний</h3>
          {logs.slice(0, 20).map(l => (
            <div key={l.id} style={{ fontSize: 12, color: 'var(--text-secondary)', padding: '4px 0', borderBottom: '1px solid var(--border-color)' }}>
              {new Date(l.createdAt).toLocaleString('ru-RU')} — {l.filter?.name || 'фильтр удалён'}:{' '}
              {l.action === 'ignore' ? 'письмо проигнорировано' : 'создана задача'} · от {l.emailFrom || '?'} · «{l.subject || 'без темы'}»
            </div>
          ))}
        </>
      )}
    </div>
  );
}
