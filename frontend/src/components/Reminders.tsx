import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../hooks/useAuth';
import { Reminder, Status } from '../types';

const REPEAT_LABELS: Record<string, string> = {
  none: 'Без повтора',
  daily: 'Каждый день',
  weekly: 'Каждую неделю',
  monthly: 'Каждый месяц',
  yearly: 'Каждый год',
};

const stripHtml = (html: string) => {
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || '';
};

const formatDate = (iso: string) =>
  new Date(iso).toLocaleString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });

export function Reminders() {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [statuses, setStatuses] = useState<Status[]>([]);
  const [search, setSearch] = useState('');
  const [statusId, setStatusId] = useState('');
  const [filter, setFilter] = useState<'active' | 'completed' | 'all'>('active');
  const [loading, setLoading] = useState(true);

  const chip = (active: boolean): React.CSSProperties => ({
    padding: '6px 14px',
    borderRadius: 12,
    border: 'none',
    background: active ? '#007AFF' : 'var(--bg-hover)',
    color: active ? '#fff' : 'var(--text-secondary)',
    fontSize: 13,
    fontWeight: 500,
    cursor: 'pointer',
  });

  const loadStatuses = useCallback(() => {
    api.statuses
      .list('reminder')
      .then(list => setStatuses(list.filter(s => s.isActive)))
      .catch(() => {});
  }, []);

  const loadReminders = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.reminders.list({
        q: search.trim() || undefined,
        statusId: statusId || undefined,
        filter,
      });
      setReminders(data || []);
    } catch (e) {
      console.error('Ошибка загрузки напоминаний:', e);
    }
    setLoading(false);
  }, [search, statusId, filter]);

  useEffect(() => { loadStatuses(); }, [loadStatuses]);
  useEffect(() => { loadReminders(); }, [loadReminders]);

  const handleComplete = async (r: Reminder) => {
    try {
      if (r.completedAt) await api.reminders.reopen(r.id);
      else await api.reminders.complete(r.id);
      loadReminders();
    } catch (err: any) {
      alert(err.message || 'Ошибка');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Удалить напоминание? Это действие нельзя отменить.')) return;
    try {
      await api.reminders.delete(id);
      setReminders(prev => prev.filter(r => r.id !== id));
    } catch (err: any) {
      alert(err.message || 'Ошибка удаления');
    }
  };

  return (
    <div>
      {/* Шапка */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 600 }}>Напоминания</h2>
        <button
          onClick={() => navigate('/reminders/new')}
          style={{ padding: '8px 16px', borderRadius: 12, border: 'none', background: '#007AFF', color: '#fff', fontSize: 14, fontWeight: 500, cursor: 'pointer' }}
        >
          + Новое напоминание
        </button>
      </div>

      {/* Поиск */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && loadReminders()}
          placeholder="Поиск по названию и тексту..."
          style={{ flex: 1, minWidth: 220, padding: '8px 14px', borderRadius: 12, border: '1px solid var(--border-color)', background: 'var(--bg-color)', color: 'var(--text-color)', fontSize: 14, outline: 'none' }}
        />
      </div>

      {/* Фильтры: состояние + статусы (как фильтры задач) */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        <button style={chip(filter === 'active')} onClick={() => setFilter('active')}>Активные</button>
        <button style={chip(filter === 'completed')} onClick={() => setFilter('completed')}>Выполненные</button>
        <button style={chip(filter === 'all')} onClick={() => setFilter('all')}>Все</button>
        {statuses.map(s => (
          <button key={s.id} style={chip(statusId === s.id)} onClick={() => setStatusId(statusId === s.id ? '' : s.id)}>
            {s.label}
          </button>
        ))}
      </div>

      {/* Список */}
      {loading ? (
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Загрузка...</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {reminders.map(r => {
            const overdue = !r.completedAt && new Date(r.remindAt) < new Date();
            const isMine = !r.userId || r.userId === currentUser?.id;
            const preview = stripHtml(r.content || '');
            const notifyText = r.notifyBeforeMin > 0
              ? (r.notifyBeforeMin % 60 === 0 ? `за ${r.notifyBeforeMin / 60} ч` : `за ${r.notifyBeforeMin} мин`)
              : null;
            return (
              <div
                key={r.id}
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 16, padding: '14px 16px', opacity: r.completedAt ? 0.65 : 1 }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  {/* Галочка выполнения */}
                  <button
                    onClick={() => handleComplete(r)}
                    title={r.completedAt ? 'Вернуть в активные' : 'Отметить выполненным'}
                    style={{
                      width: 22, height: 22, borderRadius: '50%', flexShrink: 0, marginTop: 2,
                      cursor: 'pointer', fontSize: 13, lineHeight: 1, color: '#fff',
                      border: r.completedAt ? '2px solid #16a34a' : '2px solid var(--border-color)',
                      background: r.completedAt ? '#16a34a' : 'transparent',
                    }}
                  >
                    {r.completedAt ? '✓' : ''}
                  </button>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 15, wordBreak: 'break-word', textDecoration: r.completedAt ? 'line-through' : 'none' }}>
                      {r.title}
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6, alignItems: 'center' }}>
                      <span style={{ fontSize: 12, padding: '3px 10px', borderRadius: 10, background: overdue ? '#fee2e2' : '#dbeafe', color: overdue ? '#991b1b' : '#1e40af' }}>
                        🕐 {formatDate(r.remindAt)}{overdue ? ' · просрочено' : ''}
                      </span>
                      {notifyText && (
                        <span style={{ fontSize: 12, padding: '3px 10px', borderRadius: 10, background: '#f3f4f6', color: '#4b5563' }}>🔔 {notifyText}</span>
                      )}
                      {r.repeat !== 'none' && (
                        <span style={{ fontSize: 12, padding: '3px 10px', borderRadius: 10, background: '#f3f4f6', color: '#4b5563' }}>🔁 {REPEAT_LABELS[r.repeat]}</span>
                      )}
                      {r.status && (
                        <span style={{ fontSize: 12, padding: '3px 10px', borderRadius: 10, background: r.status.color, color: r.status.textColor }}>{r.status.label}</span>
                      )}
                    </div>
                    {preview && (
                      <div style={{ marginTop: 8, fontSize: 13, color: 'var(--text-muted)' }}>{preview.slice(0, 160)}</div>
                    )}
                  </div>

                  {isMine && (
                    <div style={{ display: 'flex', gap: 6, flexShrink: 0, flexWrap: 'wrap' }}>
                      <button
                        onClick={() => navigate(`/reminders/${r.id}/edit`)}
                        style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-color)', cursor: 'pointer', fontSize: 13 }}
                      >
                        Изменить
                      </button>
                      <button
                        onClick={() => handleDelete(r.id)}
                        style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: '#dc2626', cursor: 'pointer', fontSize: 13 }}
                      >
                        Удалить
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          {reminders.length === 0 && (
            <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}>
              Напоминаний нет. Нажмите «+ Новое напоминание», чтобы создать.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
