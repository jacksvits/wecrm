import { useCallback, useEffect, useState } from 'react';
import { api } from '../api/client';
import { Task } from '../types';
import { CalendarMonth, toISODate, MONTH_NAMES } from './calendar/CalendarMonth';
import { DayTimeline, TimelineItem } from './calendar/DayTimeline';

/**
 * Календарный вид задач: месяц → клик по дате → временная шкала дня.
 * Задачи размещаются по сроку (dueDate); задачи без времени — строкой «без времени».
 */

const STATUS_COLORS: Record<string, string> = {
  open: '#3b82f6',
  in_progress: '#f59e0b',
  load: '#8b5cf6',
  cancelled: '#9ca3af',
  win: '#16a34a',
};
const STATUS_LABELS: Record<string, string> = {
  open: 'Открыта',
  in_progress: 'В работе',
  load: 'Загрузка',
  cancelled: 'Отменена',
  win: 'Завершена',
};

const ghostBtn: React.CSSProperties = {
  padding: '8px 14px', borderRadius: 10, border: '1px solid var(--border-color)',
  background: 'transparent', color: 'var(--text-primary)', fontSize: 14, cursor: 'pointer',
};

// Срок задачи в проекте хранится и показывается как UTC «wall-clock»
// (форма slice(0,16), список timeZone:"UTC") — календарь извлекает дату/время так же
const taskDate = (iso: string) => iso.slice(0, 10);
const taskMin = (iso: string) => Number(iso.slice(11, 13)) * 60 + Number(iso.slice(14, 16));

interface Props {
  onOpenTask: (id: string) => void;
}

export function TaskCalendar({ onOpenTask }: Props) {
  const today = toISODate(new Date());
  const [year, setYear] = useState(() => new Date().getFullYear());
  const [month, setMonth] = useState(() => new Date().getMonth() + 1);
  const [mode, setMode] = useState<'month' | 'day'>('month');
  const [date, setDate] = useState(today);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    const from = `${year}-${String(month).padStart(2, '0')}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const to = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
    const params = new URLSearchParams({ dueFrom: from, dueTo: to, includeChildren: 'true' });
    api.tasks.list(params.toString())
      .then((list) => setTasks(Array.isArray(list) ? list : []))
      .catch(() => setTasks([]))
      .finally(() => setLoading(false));
  }, [year, month]);

  useEffect(() => { load(); }, [load]);

  const byDate = (iso: string) => tasks.filter((t) => t.dueDate && taskDate(t.dueDate) === iso);

  const openDay = (iso: string) => {
    setDate(iso);
    const [y, m] = iso.split('-').map(Number);
    setYear(y); setMonth(m);
    setMode('day');
  };

  const shiftMonth = (delta: number) => {
    const d = new Date(year, month - 1 + delta, 1);
    setYear(d.getFullYear()); setMonth(d.getMonth() + 1);
  };
  const shiftDay = (delta: number) => {
    const [y, m, d] = date.split('-').map(Number);
    openDay(toISODate(new Date(y, m - 1, d + delta)));
  };

  // ---------- месяц ----------
  const renderDay = (iso: string) => {
    const list = byDate(iso);
    if (list.length === 0) return null;
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {list.slice(0, 3).map((t) => (
          <div
            key={t.id}
            style={{
              fontSize: 11, padding: '1px 6px', borderRadius: 6, whiteSpace: 'nowrap',
              overflow: 'hidden', textOverflow: 'ellipsis',
              background: `${STATUS_COLORS[t.status] || '#3b82f6'}22`,
              borderLeft: `2px solid ${STATUS_COLORS[t.status] || '#3b82f6'}`,
              color: 'var(--text-primary)',
            }}
          >{t.title}</div>
        ))}
        {list.length > 3 && <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>+{list.length - 3} ещё</div>}
      </div>
    );
  };

  // ---------- день ----------
  const dayTasks = byDate(date);
  const timed = dayTasks.filter((t) => taskMin(t.dueDate!) !== 0);
  const untimed = dayTasks.filter((t) => taskMin(t.dueDate!) === 0);

  const items: TimelineItem[] = timed.map((t) => {
    const start = taskMin(t.dueDate!);
    const assignees = (t.assignees || []).map((a: any) => a.user?.name || a.name).filter(Boolean).join(', ');
    return {
      id: t.id, columnId: 'tasks', startMin: start, endMin: start + 30,
      title: t.title,
      subtitle: [STATUS_LABELS[t.status] || t.status, assignees].filter(Boolean).join(' · '),
      color: STATUS_COLORS[t.status] || '#3b82f6',
      onClick: () => onOpenTask(t.id),
    };
  });

  const untimedRow = untimed.length > 0 ? (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
      <span style={{ fontSize: 12, color: 'var(--text-muted)', alignSelf: 'center' }}>Без времени:</span>
      {untimed.map((t) => (
        <span
          key={t.id} onClick={() => onOpenTask(t.id)}
          style={{
            fontSize: 12, padding: '4px 10px', borderRadius: 8, cursor: 'pointer',
            background: 'var(--bg-card)', border: '1px solid var(--border-color)',
            borderLeft: `3px solid ${STATUS_COLORS[t.status] || '#3b82f6'}`,
          }}
        >{t.title}</span>
      ))}
    </div>
  ) : undefined;

  return (
    <div>
      {mode === 'month' && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <button style={ghostBtn} onClick={() => shiftMonth(-1)}>‹</button>
            <div style={{ fontSize: 16, fontWeight: 600, minWidth: 140, textAlign: 'center' }}>{MONTH_NAMES[month - 1]} {year}</div>
            <button style={ghostBtn} onClick={() => shiftMonth(1)}>›</button>
            <button style={{ ...ghostBtn, fontSize: 13 }} onClick={() => { const n = new Date(); setYear(n.getFullYear()); setMonth(n.getMonth() + 1); }}>Сегодня</button>
            {loading && <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Загрузка...</span>}
          </div>
          <CalendarMonth year={year} month={month} onDayClick={openDay} renderDay={renderDay} />
          <div style={{ marginTop: 8, fontSize: 12, color: 'var(--text-muted)' }}>Нажмите на дату, чтобы открыть временную шкалу дня.</div>
        </div>
      )}
      {mode === 'day' && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
            <button style={ghostBtn} onClick={() => setMode('month')}>← Месяц</button>
            <button style={ghostBtn} onClick={() => shiftDay(-1)}>‹</button>
            <div style={{ fontSize: 16, fontWeight: 600 }}>
              {Number(date.split('-')[2])} {MONTH_NAMES[Number(date.split('-')[1]) - 1].toLowerCase()}
            </div>
            <button style={ghostBtn} onClick={() => shiftDay(1)}>›</button>
            <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>задач: {dayTasks.length}</span>
          </div>
          {dayTasks.length === 0 ? (
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 12, padding: 30, textAlign: 'center', color: 'var(--text-secondary)' }}>
              На этот день задач нет.
            </div>
          ) : (
            <DayTimeline
              columns={[{ id: 'tasks', title: 'Задачи', subtitle: fmtDay(date) }]}
              items={items}
              untimedRow={untimedRow}
              startHour={7}
              endHour={22}
            />
          )}
        </div>
      )}
    </div>
  );
}

const fmtDay = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  return dt.toLocaleDateString('ru-RU', { weekday: 'long' });
};
