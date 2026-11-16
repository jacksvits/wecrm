import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../hooks/useAuth';
import { Reminder, Role, Status, User } from '../types';
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

// Форма напоминания (создание/редактирование), onDone — после сохранения или отмены,
// onCreated — с созданным напоминанием (для баннера уведомления)
function ReminderForm({ reminderId, onDone, onCreated }: { reminderId?: string; onDone: () => void; onCreated?: (reminder: Reminder) => void }) {
  const isEdit = !!reminderId;
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
    if (isEdit && reminderId) {
      (async () => {
        setLoading(true);
        try {
          const r = await api.reminders.get(reminderId);
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
  }, [isEdit, reminderId]);

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

      if (isEdit && reminderId) {
        await api.reminders.update(reminderId, data);
      } else {
        const created = await api.reminders.create(data);
        onCreated?.(created);
      }
      onDone();
    } catch (e: any) {
      setError(e.message || 'Ошибка сохранения');
    }
    setSaving(false);
  };

  if (loading) {
    return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Загрузка...</div>;
  }

  return (
    <div>

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
          onClick={onDone}
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

// Страница редактирования напоминания
export function ReminderEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  return (
    <div style={{ maxWidth: 800 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 8 }}>
        <button
          onClick={() => navigate('/reminders')}
          style={{ background: 'none', border: 'none', color: '#007AFF', cursor: 'pointer', fontSize: 14 }}
        >
          ← Назад к напоминаниям
        </button>
        <h2 style={{ margin: 0, fontSize: 18 }}>Редактировать напоминание</h2>
      </div>
      <ReminderForm reminderId={id} onDone={() => navigate('/reminders')} />
    </div>
  );
}

// Модальное окно создания напоминания (адаптировано под мобильные: на узком экране — почти на весь экран).
// После создания показывает баннер сверху по центру: кликабельное название напоминания
// и круглый таймер 10 секунд, после которого баннер закрывается.
export function ReminderModal({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate();
  const [created, setCreated] = useState<{ id: string; title: string } | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(10);

  // Обратный отсчёт таймера баннера
  useEffect(() => {
    if (!created) return;
    if (secondsLeft <= 0) {
      onClose();
      return;
    }
    const t = setTimeout(() => setSecondsLeft(v => v - 1), 1000);
    return () => clearTimeout(t);
  }, [created, secondsLeft, onClose]);

  // Баннер уведомления о созданном напоминании
  if (created) {
    const R = 9;
    const C = 2 * Math.PI * R;
    return (
      <div
        style={{
          position: 'fixed', top: 14, left: '50%', transform: 'translateX(-50%)',
          zIndex: 300, maxWidth: 'calc(100vw - 24px)',
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '10px 14px', borderRadius: 10,
          background: 'var(--bg-card)', border: '1px solid var(--border-color)',
          boxShadow: '0 8px 30px rgba(0,0,0,0.2)',
        }}
      >
        <span style={{ fontSize: 16 }}>🔔</span>
        <div style={{ fontSize: 13, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
          Создано новое напоминание:
        </div>
        <div
          onClick={() => { onClose(); navigate(`/reminders/${created.id}/edit`); }}
          title='Открыть напоминание'
          style={{
            fontSize: 13, fontWeight: 600, color: '#007AFF', cursor: 'pointer',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 280,
          }}
        >
          {created.title}
        </div>
        {/* Круглый таймер обратного отсчёта (10 секунд) */}
        <span onClick={onClose} title='Закрыть' style={{ display: 'inline-flex', cursor: 'pointer', flexShrink: 0 }}>
        <svg width='24' height='24' viewBox='0 0 24 24'>
          <circle cx='12' cy='12' r={R} fill='none' stroke='var(--border-color)' strokeWidth='2.5' />
          <circle
            cx='12' cy='12' r={R} fill='none' stroke='#007AFF' strokeWidth='2.5'
            strokeLinecap='round' strokeDasharray={C} strokeDashoffset={C * (1 - secondsLeft / 10)}
            transform='rotate(-90 12 12)'
          />
          <text x='12' y='15.5' textAnchor='middle' fontSize='8.5' fill='var(--text-secondary)' fontFamily='inherit'>
            {secondsLeft}
          </text>
        </svg>
        </span>
      </div>
    );
  }

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 12 }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        width: '100%', maxWidth: 640, maxHeight: '92vh', display: 'flex', flexDirection: 'column',
        background: 'var(--bg-card)', borderRadius: 14, overflow: 'hidden',
        border: '1px solid var(--border-color)', boxShadow: '0 12px 40px rgba(0,0,0,0.25)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', padding: '12px 16px', borderBottom: '1px solid var(--border-color)' }}>
          <div style={{ fontSize: 15, fontWeight: 600, flex: 1 }}>Новое напоминание</div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-color)', fontSize: 18, lineHeight: 1, padding: 4 }}
            title='Закрыть'
          >
            ✕
          </button>
        </div>
        <div style={{ padding: 16, overflowY: 'auto' }}>
          <ReminderForm
            onDone={onClose}
            onCreated={r => setCreated({ id: r.id, title: r.title })}
          />
        </div>
      </div>
    </div>
  );
}
