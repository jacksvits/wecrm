import { useCallback, useEffect, useState } from 'react';
import { api } from '../api/client';
import { Reminder } from '../types';
import { CalendarMonth, toISODate, MONTH_NAMES } from './calendar/CalendarMonth';
import { DayTimeline, TimelineItem } from './calendar/DayTimeline';

/**
 * Календарный вид напоминаний: месяц → клик по дате → временная шкала дня.
 * Напоминания размещаются по времени remindAt.
 */

const ghostBtn: React.CSSProperties = {
  padding: '8px 14px', borderRadius: 10, border: '1px solid var(--border-color)',
  background: 'transparent', color: 'var(--text-primary)', fontSize: 14, cursor: 'pointer',
};

const stripHtml = (html: string) => {
  const tmp = document.createElement('div');
  tmp.innerHTML = html || '';
  return tmp.textContent || '';
};

interface Props {
  onOpen: (id: string) => void;
}

export function ReminderCalendar({ onOpen }: Props) {
  const today = toISODate(new Date());
  const [year, setYear] = useState(() => new Date().getFullYear());
  const [month, setMonth] = useState(() => new Date().getMonth() + 1);
  const [mode, setMode] = useState<'month' | 'day'>('month');
  const [date, setDate] = useState(today);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    const from = `${year}-${String(month).padStart(2, '0')}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const to = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
    api.reminders.list({ from, to, filter: 'all' })
      .then((list) => setReminders(Array.isArray(list) ? list : []))
      .catch(() => setReminders([]))
      .finally(() => setLoading(false));
  }, [year, month]);

  useEffect(() => { load(); }, [load]);

  const byDate = (iso: string) => reminders.filter((r) => r.remindAt && toISODate(new Date(r.remindAt)) === iso);

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

  const colorOf = (r: Reminder) => ((r as any).status?.color) || (r.completedAt ? '#9ca3af' : '#f59e0b');

  const renderDay = (iso: string) => {
    const list = byDate(iso);
    if (list.length === 0) return null;
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {list.slice(0, 3).map((r) => (
          <div
            key={r.id}
            style={{
              fontSize: 11, padding: '1px 6px', borderRadius: 6, whiteSpace: 'nowrap',
              overflow: 'hidden', textOverflow: 'ellipsis',
              background: `${colorOf(r)}22`,
              borderLeft: `2px solid ${colorOf(r)}`,
              color: 'var(--text-primary)',
              textDecoration: r.completedAt ? 'line-through' : 'none',
              opacity: r.completedAt ? 0.65 : 1,
            }}
          >{new Date(r.remindAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })} {r.title}</div>
        ))}
        {list.length > 3 && <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>+{list.length - 3} ещё</div>}
      </div>
    );
  };

  const dayList = byDate(date);
  const items: TimelineItem[] = dayList.map((r) => {
    const d = new Date(r.remindAt);
    const start = d.getHours() * 60 + d.getMinutes();
    const content = stripHtml((r as any).content || '');
    return {
      id: r.id, columnId: 'reminders', startMin: start, endMin: start + 30,
      title: r.title,
      subtitle: [r.user?.name, content.slice(0, 60)].filter(Boolean).join(' · '),
      color: colorOf(r),
      onClick: () => onOpen(r.id),
    };
  });

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
            <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>напоминаний: {dayList.length}</span>
          </div>
          {dayList.length === 0 ? (
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 12, padding: 30, textAlign: 'center', color: 'var(--text-secondary)' }}>
              На этот день напоминаний нет.
            </div>
          ) : (
            <DayTimeline
              columns={[{ id: 'reminders', title: 'Напоминания', subtitle: new Date(date).toLocaleDateString('ru-RU', { weekday: 'long' }) }]}
              items={items}
              startHour={7}
              endHour={22}
            />
          )}
        </div>
      )}
    </div>
  );
}
