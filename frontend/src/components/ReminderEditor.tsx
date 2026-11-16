import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../hooks/useAuth';
import { Role, Status, User } from '../types';
import ReactQuill from './LazyQuill' ;

const quillModules = {
  toolbar: [
    ['bold', 'italic', 'underline', 'strike'],
    [{ list: 'ordered' }, { list: 'bullet' }],
    ['link'],
    ['clean'],
  ],
};

const quillFormats = ['bold', 'italic', 'underline', 'strike', 'list', 'bullet', 'link'];

const REPEAT_OPTIONS = [
  { value: 'none', label: 'Без повтора' },
  { value: 'daily', label: 'Каждый день' },
  { value: 'weekly', label: 'Каждую неделю' },
  { value: 'monthly', label: 'Каждый месяц' },
  { value: 'yearly', label: 'Каждый год' },
];

const pad = (n: number) => String(n).padStart(2, '0');
const toLocalInput = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
const toLocalDate = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export function ReminderEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;
  const { user: currentUser } = useAuth();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [remindAt, setRemindAt] = useState(() => {
    const d = new Date(Date.now() + 3600_000);
    d.setMinutes(0, 0, 0);
    return toLocalInput(d);
  });
  const [notifyValue, setNotifyValue] = useState(15);
  const [notifyUnit, setNotifyUnit] = useState<'min' | 'hour'>('min');
  const [repeat, setRepeat] = useState<'none' | 'daily' | 'weekly' | 'monthly' | 'yearly'>('none');
  const [repeatEndAt, setRepeatEndAt] = useState('');
  const [statusId, setStatusId] = useState('');
  const [statuses, setStatuses] = useState<Status[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [recipientIds, setRecipientIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(isEdit);
  const [error, setError] = useState('');

  // Списки получателей напоминания: сотрудники и прочие пользователи.
  // Системные обработчики не предлагаются ни в одном из списков.
  useEffect(() => {
    api.users.list().then(list => setUsers(list.filter(u =>
      u.id !== currentUser?.id && (u.role as Role | undefined)?.isSystemHandler !== true
    ))).catch(() => {});
  }, [currentUser?.id]);

  const employeeUsers = users.filter(u => (u.role as Role | undefined)?.isEmployee === true);
  const regularUsers = users.filter(u => (u.role as Role | undefined)?.isEmployee !== true);

  const [empQuery, setEmpQuery] = useState('');
  const [usrQuery, setUsrQuery] = useState('');
  const [empOpen, setEmpOpen] = useState(false);
  const [usrOpen, setUsrOpen] = useState(false);

  // Поиск получателя по имени, email или логину (без уже выбранных)
  const pickerOptions = (list: User[], query: string) => {
    const q = query.trim().toLowerCase();
    return list
      .filter(u => !recipientIds.includes(u.id) && (
        !q ||
        u.name.toLowerCase().includes(q) ||
        (u.email || '').toLowerCase().includes(q) ||
        (u.username || '').toLowerCase().includes(q)
      ))
      .slice(0, 8);
  };

  // Поле выбора получателей: выбранные — чипами внутри строки ввода,
  // поиск — по имени/email, выбор — из выпадающего списка
  const renderPicker = (title: string, list: User[], query: string, setQuery: (v: string) => void, open: boolean, setOpen: (v: boolean) => void) => {
    const selected = list.filter(u => recipientIds.includes(u.id));
    const options = pickerOptions(list, query);
    return (
      <div style={{ marginBottom: 16, position: 'relative' }}>
        <label style={labelStyle}>{title}</label>
        <div style={{
          display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center',
          padding: '6px 8px', borderRadius: 10, minHeight: 42,
          border: '1px solid var(--border-color)', background: 'var(--bg-color)',
        }}>
          {selected.map(u => (
            <span
              key={u.id}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 10px', borderRadius: 12, fontSize: 13, background: '#007AFF', color: '#fff' }}
            >
              {u.name}
              <span
                onClick={() => setRecipientIds(prev => prev.filter(x => x !== u.id))}
                style={{ cursor: 'pointer', opacity: 0.8 }}
                title='Убрать'
              >
                ✕
              </span>
            </span>
          ))}
          <input
            value={query}
            placeholder={selected.length > 0 ? '' : 'Начните вводить имя или email…'}
            onChange={e => { setQuery(e.target.value); setOpen(true); }}
            onFocus={() => setOpen(true)}
            onBlur={() => setTimeout(() => setOpen(false), 150)}
            style={{ flex: 1, minWidth: 150, border: 'none', outline: 'none', background: 'transparent', color: 'var(--text-color)', fontSize: 14, padding: '4px 2px' }}
          />
        </div>
        {open && options.length > 0 && (
          <div style={{
            position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0,
            background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 12,
            maxHeight: 220, overflow: 'auto', zIndex: 300, boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
          }}>
            {options.map(u => (
              <div
                key={u.id}
                onMouseDown={() => { setRecipientIds(prev => [...prev, u.id]); setQuery(''); }}
                style={{ padding: '8px 10px', cursor: 'pointer', fontSize: 13, borderBottom: '1px solid var(--border-color)' }}
              >
                <div style={{ fontWeight: 500 }}>{u.name}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{u.email}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 14px', borderRadius: 10,
    border: '1px solid var(--border-color)', background: 'var(--bg-color)',
    color: 'var(--text-color)', fontSize: 15, outline: 'none',
  };
  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6, color: 'var(--text-muted)',
  };

  useEffect(() => {
    api.statuses
      .list('reminder')
      .then(list => {
        const active = list.filter(s => s.isActive);
        setStatuses(active);
        const def = list.find(s => s.isDefault && s.isActive) || active[0];
        if (def) setStatusId(def.id);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (isEdit && id) {
      (async () => {
        setLoading(true);
        try {
          const r = await api.reminders.get(id);
          setTitle(r.title || '');
          setContent(r.content || '');
          setRemindAt(toLocalInput(new Date(r.remindAt)));
          const min = r.notifyBeforeMin || 0;
          if (min > 0 && min % 60 === 0) {
            setNotifyValue(min / 60);
            setNotifyUnit('hour');
          } else {
            setNotifyValue(min);
            setNotifyUnit('min');
          }
          setRepeat(r.repeat || 'none');
          setRepeatEndAt(r.repeatEndAt ? toLocalDate(new Date(r.repeatEndAt)) : '');
          if (r.statusId) setStatusId(r.statusId);
          setRecipientIds(r.sharedWith?.map(s => s.userId) || []);
        } catch (e: any) {
          setError('Не удалось загрузить напоминание');
        }
        setLoading(false);
      })();
    }
  }, [id]);

  const handleSave = async () => {
    if (!title.trim()) {
      setError('Введите заголовок');
      return;
    }
    if (!remindAt) {
      setError('Укажите дату и время напоминания');
      return;
    }
    setError('');
    setSaving(true);

    try {
      const notifyBeforeMin = notifyUnit === 'hour' ? notifyValue * 60 : notifyValue;
      const data = {
        title: title.trim(),
        content: content.trim(),
        remindAt: new Date(remindAt).toISOString(),
        notifyBeforeMin,
        repeat,
        repeatEndAt: repeat !== 'none' && repeatEndAt ? new Date(repeatEndAt + 'T23:59:59').toISOString() : null,
        statusId: statusId || null,
        recipientIds,
      };

      if (isEdit && id) {
        await api.reminders.update(id, data);
      } else {
        await api.reminders.create(data);
      }
      navigate('/reminders');
    } catch (e: any) {
      setError(e.message || 'Ошибка сохранения');
    }
    setSaving(false);
  };

  if (loading) {
    return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Загрузка...</div>;
  }

  return (
    <div style={{ maxWidth: 800 }}>
      {/* Шапка */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 8 }}>
        <button
          onClick={() => navigate('/reminders')}
          style={{ background: 'none', border: 'none', color: '#007AFF', cursor: 'pointer', fontSize: 14 }}
        >
          ← Назад к напоминаниям
        </button>
        <h2 style={{ margin: 0, fontSize: 18 }}>
          {isEdit ? 'Редактировать напоминание' : 'Новое напоминание'}
        </h2>
      </div>

      {/* Ошибка */}
      {error && (
        <div style={{ padding: '12px 16px', borderRadius: 10, background: '#fee2e2', color: '#dc2626', marginBottom: 16, fontSize: 14 }}>
          {error}
        </div>
      )}

      {/* Заголовок */}
      <div style={{ marginBottom: 16 }}>
        <label style={labelStyle}>Заголовок *</label>
        <input
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Название напоминания"
          style={inputStyle}
        />
      </div>

      {/* Дата и время */}
      <div style={{ marginBottom: 16 }}>
        <label style={labelStyle}>Дата и время напоминания *</label>
        <input
          type="datetime-local"
          value={remindAt}
          onChange={e => setRemindAt(e.target.value)}
          style={inputStyle}
        />
      </div>

      {/* Напомнить за + Повтор */}
      <div style={{ marginBottom: 16, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 200 }}>
          <label style={labelStyle}>Напомнить за</label>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              type="number"
              min={0}
              value={notifyValue}
              onChange={e => setNotifyValue(Math.max(0, Number(e.target.value)))}
              style={{ ...inputStyle, width: 100 }}
            />
            <select
              value={notifyUnit}
              onChange={e => setNotifyUnit(e.target.value as 'min' | 'hour')}
              style={{ ...inputStyle, flex: 1 }}
            >
              <option value="min">минут</option>
              <option value="hour">часов</option>
            </select>
          </div>
        </div>
        <div style={{ flex: 1, minWidth: 200 }}>
          <label style={labelStyle}>Повтор</label>
          <select value={repeat} onChange={e => setRepeat(e.target.value as 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly')} style={inputStyle}>
            {REPEAT_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Повторять до */}
      {repeat !== 'none' && (
        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>Повторять до (необязательно)</label>
          <input
            type="date"
            value={repeatEndAt}
            onChange={e => setRepeatEndAt(e.target.value)}
            style={inputStyle}
          />
        </div>
      )}

      {/* Статус */}
      <div style={{ marginBottom: 16 }}>
        <label style={labelStyle}>Статус</label>
        <select value={statusId} onChange={e => setStatusId(e.target.value)} style={inputStyle}>
          {statuses.map(s => (
            <option key={s.id} value={s.id}>{s.label}</option>
          ))}
        </select>
      </div>

      {/* Поделиться с сотрудниками */}
      {employeeUsers.length > 0 && renderPicker('Поделиться с сотрудниками', employeeUsers, empQuery, setEmpQuery, empOpen, setEmpOpen)}

      {/* Поделиться с пользователями (все, кроме сотрудников и системных обработчиков) */}
      {regularUsers.length > 0 && renderPicker('Поделиться с пользователями', regularUsers, usrQuery, setUsrQuery, usrOpen, setUsrOpen)}

      {/* Текст (WYSIWYG) */}
      <div style={{ marginBottom: 24 }}>
        <label style={labelStyle}>Текст напоминания</label>
        <ReactQuill
          theme="snow"
          value={content}
          onChange={setContent}
          placeholder="Введите текст напоминания..."
          modules={quillModules}
          formats={quillFormats}
          style={{ borderRadius: 10, border: '1px solid var(--border-color)', background: 'var(--bg-color)', minHeight: 200 }}
        />
      </div>

      {/* Кнопки */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            padding: '10px 24px', borderRadius: 10, background: '#007AFF', color: '#fff',
            border: 'none', cursor: saving ? 'not-allowed' : 'pointer',
            fontSize: 14, fontWeight: 500, opacity: saving ? 0.6 : 1,
          }}
        >
          {saving ? 'Сохранение...' : (isEdit ? 'Сохранить' : 'Создать напоминание')}
        </button>
        <button
          onClick={() => navigate('/reminders')}
          disabled={saving}
          style={{
            padding: '10px 24px', borderRadius: 10, background: 'var(--bg-hover)',
            color: 'var(--text-color)', border: '1px solid var(--border-color)', cursor: 'pointer', fontSize: 14,
          }}
        >
          Отмена
        </button>
      </div>
    </div>
  );
}
