import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../hooks/useAuth';
import { useRealtime } from '../hooks/useRealtime';
import { Task, Reminder, Status } from '../types';
import { CalendarMonth, toISODate, MONTH_NAMES } from './calendar/CalendarMonth';
import { DayTimeline, TimelineBand, TimelineColumn, TimelineItem, minToTime } from './calendar/DayTimeline';
import { DayAgenda, AgendaSection, AgendaItem } from './calendar/DayAgenda';
import { useIsMobile } from '../hooks/useIsMobile';

/**
 * Виджет дашборда «Календарь»: задачи + напоминания + расписание на одном месяце.
 * Клик по дате — временная шкала дня внутри виджета (колонки сотрудников, «Задачи», «Напоминания»).
 * Виджет только для чтения: редактирование — в разделах «Расписание», «Задачи», «Напоминания».
 */

// Цвета статусов — как в TaskCalendar / ReminderCalendar / SchedulePage (единая стилистика)
const TASK_STATUS_COLORS: Record<string, string> = {
  open: '#3b82f6',
  in_progress: '#f59e0b',
  load: '#8b5cf6',
  cancelled: '#9ca3af',
  win: '#16a34a',
};
const TASK_STATUS_LABELS: Record<string, string> = {
  open: 'Открыта',
  in_progress: 'В работе',
  load: 'Загрузка',
  cancelled: 'Отменена',
  win: 'Завершена',
};
const APPT_STATUS_COLORS: Record<string, string> = {
  planned: '#3b82f6',
  arrived: '#16a34a',
  done: '#6b7280',
  no_show: '#dc2626',
  cancelled: '#9ca3af',
};

const ghostBtn: React.CSSProperties = {
  padding: '8px 14px', borderRadius: 10, border: '1px solid var(--border-color)',
  background: 'transparent', color: 'var(--text-primary)', fontSize: 14, cursor: 'pointer',
};

// Напоминания в проекте — локальное время (форма toISOString, список без timeZone)
const toMin = (d: Date) => d.getHours() * 60 + d.getMinutes();
// Срок задачи — UTC «wall-clock» (форма slice(0,16), список timeZone:"UTC")
const taskDate = (iso: string) => iso.slice(0, 10);
const taskMin = (iso: string) => Number(iso.slice(11, 13)) * 60 + Number(iso.slice(14, 16));

const stripHtml = (html: string) => {
  const tmp = document.createElement('div');
  tmp.innerHTML = html || '';
  return tmp.textContent || '';
};

export function DashboardCalendar() {
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
  // Доступ к задачам — как в Dashboard: админ или раздел «/tasks» в allowedPages
  const canViewTasks = user?.role === 'admin' || ((user as any)?.allowedPages || []).includes('/tasks');
  const isMobile = useIsMobile();

  const [year, setYear] = useState(() => new Date().getFullYear());
  const [month, setMonth] = useState(() => new Date().getMonth() + 1);
  const [date, setDate] = useState(() => toISODate(new Date()));
  const [tasks, setTasks] = useState<Task[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [statuses, setStatuses] = useState<Status[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [monthData, setMonthData] = useState<any>(null); // агрегаты расписания по дням
  const [dayData, setDayData] = useState<any>(null);     // день расписания (смены + записи)
  const [loading, setLoading] = useState(false);

  // Настройка виджета (десктоп): положение временной шкалы — хранится в профиле пользователя
  const [showPosSettings, setShowPosSettings] = useState(false);
  const [savingPos, setSavingPos] = useState(false);
  const posSettingsRef = useRef<HTMLDivElement>(null);

  // Перетаскиваемая граница между календарём и временной шкалой (десктоп).
  // Размер панели шкалы в px: ширина при положении right/left, высота области
  // прокрутки при bottom. null — авто (ширина 420 / высота 72vh). Хранится в профиле,
  // как и calendarTimelinePos.
  const [timelineSize, setTimelineSize] = useState<number | null>(user?.calendarTimelineSize ?? null);
  const [draggingDivider, setDraggingDivider] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);   // контейнер календаря + шкалы
  const timelineRef = useRef<HTMLDivElement>(null);    // панель шкалы (измерение высоты при bottom)
  const dividerSizeRef = useRef<number>(0);            // актуальный размер во время перетаскивания

  // Профиль подгружается асинхронно: подхватываем сохранённый размер, когда user появился
  useEffect(() => {
    if (user?.calendarTimelineSize) setTimelineSize(user.calendarTimelineSize);
  }, [user?.calendarTimelineSize]);

  // Полноэкранный режим виджета: оверлей поверх интерфейса, выход — кнопкой или Esc
  const [fullscreen, setFullscreen] = useState(false);
  useEffect(() => {
    if (!fullscreen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setFullscreen(false); };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden'; // прокрутка страницы под оверлеем не мешает
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [fullscreen]);

  // ---------- загрузка месяца (источники независимы: сбой одного не ломает остальные) ----------
  const loadMonth = useCallback(() => {
    setLoading(true);
    const from = `${year}-${String(month).padStart(2, '0')}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const to = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
    let pending = canViewTasks ? 3 : 2;
    const done = () => { pending -= 1; if (pending <= 0) setLoading(false); };
    if (canViewTasks) {
      api.tasks.list(new URLSearchParams({ dueFrom: from, dueTo: to, includeChildren: 'true' }).toString())
        .then((list) => setTasks(Array.isArray(list) ? list : []))
        .catch(() => setTasks([]))
        .finally(done);
    }
    api.reminders.list({ from, to, filter: 'all' })
      .then((list) => setReminders(Array.isArray(list) ? list : []))
      .catch(() => setReminders([]))
      .finally(done);
    // У тенанта может не быть таблиц расписания (старая БД) — тогда блок просто пуст
    api.schedule.month(year, month)
      .then(setMonthData)
      .catch(() => setMonthData(null))
      .finally(done);
  }, [year, month, canViewTasks]);

  const loadDay = useCallback(() => {
    api.schedule.day(date).then(setDayData).catch(() => setDayData(null));
  }, [date]);

  useEffect(() => { loadMonth(); }, [loadMonth]);
  useEffect(() => { loadDay(); }, [loadDay]);
  useEffect(() => {
    if (canViewTasks) api.statuses.list('task').then(setStatuses).catch(() => {});
  }, [canViewTasks]);
  useEffect(() => {
    api.schedule.rooms.list().then(setRooms).catch(() => {});
  }, []);

  // Живое обновление при изменениях задач/напоминаний (как в Dashboard)
  useRealtime(['tasks', 'reminders'], () => { loadMonth(); });

  // Положение временной шкалы: на мобильных всегда снизу (там вместо шкалы — агенда)
  const timelinePos: 'bottom' | 'right' | 'left' =
    !isMobile && (user?.calendarTimelinePos === 'right' || user?.calendarTimelinePos === 'left')
      ? user.calendarTimelinePos
      : 'bottom';

  const setTimelinePos = async (pos: 'bottom' | 'right' | 'left') => {
    if (savingPos) return;
    setSavingPos(true);
    try {
      await api.profile.update({ calendarTimelinePos: pos });
      await refreshUser();
      setShowPosSettings(false);
    } catch {
      /* не критично: останется прежнее положение */
    } finally {
      setSavingPos(false);
    }
  };

  // Закрытие панели настройки по клику вне неё
  useEffect(() => {
    if (!showPosSettings) return;
    const onDocClick = (e: MouseEvent) => {
      if (posSettingsRef.current && !posSettingsRef.current.contains(e.target as Node)) setShowPosSettings(false);
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [showPosSettings]);

  // Перетаскивание границы между календарём и временной шкалой (десктоп).
  // Вертикальная граница меняет ширину панели шкалы (right/left), горизонтальная —
  // высоту её области прокрутки (bottom). Финальный размер сохраняется в профиль.
  const TL_SIZE_DEFAULT = 420;  // ширина панели шкалы по умолчанию (как раньше)
  const TL_MIN_SIDE = 280;      // минимальная ширина панели шкалы
  const TL_MIN_BOTTOM = 240;    // минимальная высота области прокрутки
  const startDividerDrag = (e: React.MouseEvent) => {
    if (isMobile) return;
    e.preventDefault();
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    let startSize: number;
    if (timelinePos === 'bottom') {
      const scrollEl = timelineRef.current?.querySelector('[data-tl-scroll]') as HTMLElement | null;
      startSize = timelineSize ?? scrollEl?.offsetHeight ?? 480;
    } else {
      startSize = timelineSize ?? TL_SIZE_DEFAULT;
    }
    dividerSizeRef.current = startSize;
    const startX = e.clientX;
    const startY = e.clientY;
    // Календарю остаётся минимум ~340px от ширины контейнера
    const maxSide = Math.max(TL_MIN_SIDE + 40, rect.width - 340);
    const maxBottom = Math.round(window.innerHeight * 0.85);

    const onMove = (ev: MouseEvent) => {
      let next: number;
      if (timelinePos === 'bottom') {
        next = startSize + (ev.clientY - startY);
        next = Math.max(TL_MIN_BOTTOM, Math.min(maxBottom, next));
      } else if (timelinePos === 'right') {
        next = startSize - (ev.clientX - startX);
        next = Math.max(TL_MIN_SIDE, Math.min(maxSide, next));
      } else {
        next = startSize + (ev.clientX - startX);
        next = Math.max(TL_MIN_SIDE, Math.min(maxSide, next));
      }
      dividerSizeRef.current = next;
      setTimelineSize(next);
    };
    const onUp = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      setDraggingDivider(false);
      const saved = Math.round(dividerSizeRef.current);
      setTimelineSize(saved);
      api.profile.update({ calendarTimelineSize: saved })
        .then(() => refreshUser())
        .catch(() => { /* не критично: останется локальный размер */ });
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
    document.body.style.cursor = timelinePos === 'bottom' ? 'row-resize' : 'col-resize';
    document.body.style.userSelect = 'none';
    setDraggingDivider(true);
  };

  // ---------- навигация ----------
  const openDay = (iso: string) => {
    setDate(iso);
    const [y, m] = iso.split('-').map(Number);
    setYear(y); setMonth(m);
  };
  const shiftMonth = (delta: number) => {
    const d = new Date(year, month - 1 + delta, 1);
    setYear(d.getFullYear()); setMonth(d.getMonth() + 1);
  };
  const shiftDay = (delta: number) => {
    const [y, m, d] = date.split('-').map(Number);
    openDay(toISODate(new Date(y, m - 1, d + delta)));
  };

  // ---------- данные по датам ----------
  const tasksByDate = (iso: string) => tasks.filter((t) => t.dueDate && taskDate(t.dueDate) === iso);
  const remindersByDate = (iso: string) => reminders.filter((r) => r.remindAt && toISODate(new Date(r.remindAt)) === iso);
  const taskColor = (t: Task) =>
    statuses.find((s) => s.name === t.status)?.color || TASK_STATUS_COLORS[t.status] || '#3b82f6';
  const reminderColor = (r: Reminder) => ((r as any).status?.color) || (r.completedAt ? '#9ca3af' : '#f59e0b');

  const chipStyle = (color: string, extra?: React.CSSProperties): React.CSSProperties => ({
    fontSize: 11, padding: '1px 6px', borderRadius: 6, whiteSpace: 'nowrap',
    overflow: 'hidden', textOverflow: 'ellipsis',
    background: `${color}22`, borderLeft: `2px solid ${color}`, color: 'var(--text-primary)',
    ...extra,
  });

  // ---------- месяц: метки трёх типов на каждой дате ----------
  const renderDay = (iso: string, compact: boolean) => {
    const dayTasks = tasksByDate(iso);
    const dayReminders = remindersByDate(iso);
    const sched = monthData?.days?.[iso];

    // Мобильный вид: только индикаторы «иконка + количество», названия — на шкале дня по тапу
    if (compact) {
      const ind: React.ReactNode[] = [];
      if (dayTasks.length > 0) ind.push(<span key="t" style={{ color: '#3b82f6' }}>📋{dayTasks.length}</span>);
      if (dayReminders.length > 0) ind.push(<span key="r" style={{ color: '#f59e0b' }}>🔔{dayReminders.length}</span>);
      if (sched && (sched.appointments > 0 || sched.shifts > 0)) {
        ind.push(<span key="s" style={{ color: '#16a34a' }}>🗓{sched.appointments > 0 ? sched.appointments : sched.shifts}</span>);
      }
      if (ind.length === 0) return null;
      return <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', fontSize: 11, fontWeight: 600, lineHeight: 1.25 }}>{ind}</div>;
    }

    const chips: React.ReactNode[] = [];
    for (const t of dayTasks) {
      chips.push(
        <div key={`t${t.id}`} style={chipStyle(taskColor(t))} title={`Задача: ${t.title}`}>📋 {t.title}</div>
      );
    }
    for (const r of dayReminders) {
      chips.push(
        <div
          key={`r${r.id}`}
          style={chipStyle(reminderColor(r), r.completedAt ? { textDecoration: 'line-through', opacity: 0.65 } : undefined)}
          title={`Напоминание: ${r.title}`}
        >
          🔔 {new Date(r.remindAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })} {r.title}
        </div>
      );
    }
    if (sched && (sched.appointments > 0 || sched.shifts > 0)) {
      const roomIds = Object.keys(sched.rooms || {});
      chips.push(
        <div
          key="s"
          style={{ fontSize: 11, fontWeight: 600, color: '#16a34a', display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}
          title={`Записей: ${sched.appointments}, смен: ${sched.shifts}`}
        >
          🗓 {sched.appointments > 0
            ? `${sched.appointments} зап.`
            : `${sched.shifts} смен${sched.shifts === 1 ? 'а' : sched.shifts < 5 ? 'ы' : ''}`}
          {roomIds.slice(0, 4).map((rid) => {
            const room = rooms.find((r) => r.id === rid);
            return <span key={rid} style={{ width: 8, height: 8, borderRadius: 2, background: room?.color || '#94a3b8', display: 'inline-block' }} />;
          })}
        </div>
      );
    }
    if (chips.length === 0) return null;
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {chips.slice(0, 4)}
        {chips.length > 4 && <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>+{chips.length - 4} ещё</div>}
      </div>
    );
  };

  // ---------- день: единая временная шкала ----------
  const dayTasks = tasksByDate(date);
  const dayReminders = remindersByDate(date);
  // Время 00:00 считаем «без времени» (как в TaskCalendar)
  const timedTasks = dayTasks.filter((t) => taskMin(t.dueDate!) !== 0);
  const untimedTasks = dayTasks.filter((t) => taskMin(t.dueDate!) === 0);
  const timedReminders = dayReminders.filter((r) => toMin(new Date(r.remindAt)) !== 0);
  const untimedReminders = dayReminders.filter((r) => toMin(new Date(r.remindAt)) === 0);

  const { columns, bands, items, empty } = useMemo(() => {
    const cols: TimelineColumn[] = [];
    const bnds: TimelineBand[] = [];
    const itms: TimelineItem[] = [];
    const shifts: any[] = dayData?.shifts || [];
    const appts: any[] = dayData?.appointments || [];
    // Колонки сотрудников — у кого есть смена или записи в этот день
    for (const u of dayData?.users || []) {
      const userShift = shifts.find((s: any) => s.userId === u.id);
      cols.push({
        id: u.id, title: u.name,
        subtitle: userShift
          ? `${userShift.room?.name || ''} · ${minToTime(userShift.startMin)}–${minToTime(userShift.endMin)}`
          : 'без смены',
      });
    }
    for (const s of shifts) {
      bnds.push({
        id: s.id, columnId: s.userId, startMin: s.startMin, endMin: s.endMin,
        color: s.room?.color || '#3b82f6',
        label: `${s.room?.name || '—'} · ${minToTime(s.startMin)}–${minToTime(s.endMin)}`,
        conflict: s.roomConflict,
      });
    }
    for (const a of appts) {
      itms.push({
        id: `a${a.id}`, columnId: a.userId, startMin: a.startMin, endMin: a.endMin,
        title: a.clientName,
        subtitle: `${a.room?.name || 'без кабинета'}${a.clientPhone ? ' · ' + a.clientPhone : ''}`,
        color: APPT_STATUS_COLORS[a.status] || '#3b82f6', conflict: a.conflict,
        onClick: () => navigate('/schedule'),
      });
    }
    // Колонка «Задачи»
    if (canViewTasks && timedTasks.length > 0) {
      cols.push({ id: '__tasks__', title: 'Задачи', color: '#3b82f6' });
      for (const t of timedTasks) {
        const start = taskMin(t.dueDate!);
        const assignees = (t.assignees || []).map((a: any) => a.user?.name || a.name).filter(Boolean).join(', ');
        itms.push({
          id: `t${t.id}`, columnId: '__tasks__', startMin: start, endMin: start + 30,
          title: t.title,
          subtitle: [TASK_STATUS_LABELS[t.status] || t.status, assignees].filter(Boolean).join(' · '),
          color: taskColor(t),
          onClick: () => navigate(`/tasks/${t.id}`),
        });
      }
    }
    // Колонка «Напоминания»
    if (timedReminders.length > 0) {
      cols.push({ id: '__reminders__', title: 'Напоминания', color: '#f59e0b' });
      for (const r of timedReminders) {
        const start = toMin(new Date(r.remindAt));
        const content = stripHtml((r as any).content || '');
        itms.push({
          id: `r${r.id}`, columnId: '__reminders__', startMin: start, endMin: start + 30,
          title: r.title,
          subtitle: [r.user?.name, content.slice(0, 60)].filter(Boolean).join(' · '),
          color: reminderColor(r),
          onClick: () => navigate(`/reminders/${r.id}/edit`),
        });
      }
    }
    const isEmpty = cols.length === 0 && untimedTasks.length === 0 && untimedReminders.length === 0;
    return { columns: cols, bands: bnds, items: itms, empty: isEmpty };
  }, [dayData, tasks, reminders, canViewTasks, date, navigate, statuses]);

  // Мобильная «повестка дня»: ОДИН список без заголовков секций — смены, записи,
  // задачи и напоминания вперемешку, сортировка по времени (в DayAgenda по startMin).
  // Тип события виден по иконке в карточке: 👤 смена, 🗓 запись, 📋 задача, 🔔 напоминание.
  const agendaSections = useMemo<AgendaSection[]>(() => {
    const merged: AgendaItem[] = [];
    const shifts = (dayData?.shifts || []) as any[];
    const appts = (dayData?.appointments || []) as any[];
    const users = (dayData?.users || []) as any[];
    // Смены сотрудников — показываем даже без записей (иначе «расписание не отображается»)
    for (const s of shifts) {
      const userName = users.find((u: any) => u.id === s.userId)?.name || s.user?.name || 'Сотрудник';
      merged.push({
        id: `shift_${s.id}`, startMin: s.startMin, icon: '👤',
        time: `${minToTime(s.startMin)}–${minToTime(s.endMin)}`,
        title: userName,
        subtitle: `смена · ${s.room?.name || 'без кабинета'}`,
        color: s.room?.color || '#3b82f6',
        conflict: s.roomConflict,
        onClick: () => navigate('/schedule'),
      });
    }
    for (const a of appts) {
      merged.push({
        id: `appt_${a.id}`, startMin: a.startMin, icon: '🗓',
        time: `${minToTime(a.startMin)}–${minToTime(a.endMin)}`,
        title: a.clientName,
        subtitle: [a.user?.name, a.room?.name ? `Кабинет: ${a.room.name}` : 'без кабинета', a.clientPhone].filter(Boolean).join(' · '),
        color: APPT_STATUS_COLORS[a.status] || '#3b82f6',
        conflict: a.conflict,
        onClick: () => navigate('/schedule'),
      });
    }
    if (canViewTasks) {
      for (const t of timedTasks) {
        merged.push({
          id: `task_${t.id}`, startMin: taskMin(t.dueDate!), icon: '📋',
          time: `${t.dueDate!.slice(11, 16)}–${minToTime(taskMin(t.dueDate!) + 30)}`,
          title: t.title,
          subtitle: [TASK_STATUS_LABELS[t.status] || t.status, (t.assignees || []).map((a: any) => a.user?.name || a.name).filter(Boolean).join(', ')].filter(Boolean).join(' · '),
          color: taskColor(t),
          onClick: () => navigate(`/tasks/${t.id}`),
        });
      }
    }
    for (const r of timedReminders) {
      const start = toMin(new Date(r.remindAt));
      merged.push({
        id: `rem_${r.id}`, startMin: start, icon: '🔔',
        time: `${minToTime(start)}–${minToTime(start + 30)}`,
        title: r.title,
        subtitle: [r.user?.name, stripHtml((r as any).content || '').slice(0, 80)].filter(Boolean).join(' · '),
        color: reminderColor(r),
        onClick: () => navigate(`/reminders/${r.id}/edit`),
      });
    }
    // Одна секция без заголовка — визуально единый список дня
    return merged.length > 0 ? [{ id: 'day', title: '', color: '#3b82f6', items: merged }] : [];
  }, [dayData, tasks, reminders, canViewTasks, date, navigate, statuses]);

  // Диапазон часов — по содержимому дня (по умолчанию 8–20)
  const { startHour, endHour } = useMemo(() => {
    const mins = [
      ...items.flatMap((i) => [i.startMin, i.endMin]),
      ...bands.flatMap((b) => [b.startMin, b.endMin]),
    ];
    if (mins.length === 0) return { startHour: 8, endHour: 20 };
    const start = Math.max(0, Math.min(8, Math.floor(Math.min(...mins) / 60)));
    const end = Math.min(24, Math.max(20, Math.ceil(Math.max(...mins) / 60)));
    return { startHour: start, endHour: Math.max(end, start + 2) };
  }, [items, bands]);

  // Строка «Без времени»: задачи и напоминания на 00:00
  const untimedRow = (untimedTasks.length > 0 || untimedReminders.length > 0) ? (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
      <span style={{ fontSize: 12, color: 'var(--text-muted)', alignSelf: 'center' }}>Без времени:</span>
      {untimedTasks.map((t) => (
        <span
          key={`t${t.id}`} onClick={() => navigate(`/tasks/${t.id}`)}
          style={{
            fontSize: 12, padding: '4px 10px', borderRadius: 8, cursor: 'pointer',
            background: 'var(--bg-card)', border: '1px solid var(--border-color)',
            borderLeft: `3px solid ${taskColor(t)}`,
          }}
        >📋 {t.title}</span>
      ))}
      {untimedReminders.map((r) => (
        <span
          key={`r${r.id}`} onClick={() => navigate(`/reminders/${r.id}/edit`)}
          style={{
            fontSize: 12, padding: '4px 10px', borderRadius: 8, cursor: 'pointer',
            background: 'var(--bg-card)', border: '1px solid var(--border-color)',
            borderLeft: `3px solid ${reminderColor(r)}`,
          }}
        >🔔 {r.title}</span>
      ))}
    </div>
  ) : undefined;

  const schedDayCount = (dayData?.appointments || []).length + (dayData?.shifts || []).length;

  return (
    <div style={{
      marginTop: 20, padding: 20, borderRadius: 16,
      border: '1px solid var(--border-color)', background: 'var(--bg-card)', boxShadow: 'var(--shadow)',
      ...(fullscreen
        ? {
            position: 'fixed', inset: 0, zIndex: 1000, marginTop: 0, borderRadius: 0, border: 'none',
            overflowY: 'auto', display: 'flex', flexDirection: 'column',
          }
        : {}),
    }}>
      {/* Шапка виджета */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
        <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1 }}>📅</div>
        <button style={ghostBtn} onClick={() => shiftMonth(-1)}>‹</button>
        <div style={{ fontSize: 15, fontWeight: 600, minWidth: 130, textAlign: 'center', color: 'var(--text-primary)' }}>
          {MONTH_NAMES[month - 1]} {year}
        </div>
        <button style={ghostBtn} onClick={() => shiftMonth(1)}>›</button>
        <button
          style={{ ...ghostBtn, fontSize: 13 }}
          onClick={() => { const n = new Date(); setYear(n.getFullYear()); setMonth(n.getMonth() + 1); setDate(toISODate(n)); }}
        >Сегодня</button>
        {loading && <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Загрузка...</span>}
        <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--text-muted)' }}>
          📋 — задачи · 🔔 — напоминания · 🗓 — записи расписания
        </span>
        {!isMobile && (
          <div ref={posSettingsRef} style={{ position: 'relative' }}>
            <button
              style={{ ...ghostBtn, fontSize: 13 }}
              title="Настройка виджета"
              onClick={() => setShowPosSettings((v) => !v)}
            >⚙</button>
            {showPosSettings && (
              <div style={{
                position: 'absolute', top: 'calc(100% + 6px)', right: 0, zIndex: 40,
                background: 'var(--bg-card)', border: '1px solid var(--border-color)',
                borderRadius: 12, boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
                padding: 12, minWidth: 230,
              }}>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, color: 'var(--text-primary)' }}>
                  Положение временной шкалы
                </div>
                {([['bottom', 'Снизу'], ['right', 'Справа'], ['left', 'Слева']] as const).map(([val, label]) => (
                  <label
                    key={val}
                    style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 2px', fontSize: 14, cursor: 'pointer', color: 'var(--text-primary)' }}
                  >
                    <input
                      type="radio"
                      name="dash-calendar-timeline-pos"
                      checked={timelinePos === val}
                      disabled={savingPos}
                      onChange={() => setTimelinePos(val)}
                      style={{ accentColor: '#0077ff' }}
                    />
                    {label}
                  </label>
                ))}
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8, lineHeight: 1.4 }}>
                  Границу между календарём и шкалой можно перетаскивать мышью.
                </div>
              </div>
            )}
          </div>
        )}
        {/* Справа в шапке: ⚙ (только десктоп) и «Во весь экран» */}
        <button
          style={{ ...ghostBtn, fontSize: 13 }}
          title={fullscreen ? 'Выйти из полного экрана (Esc)' : 'Развернуть виджет на весь экран'}
          onClick={() => setFullscreen((v) => !v)}
        >
          {fullscreen ? '✕ Свернуть' : '⛶ Во весь экран'}
        </button>
      </div>

      <div
        ref={containerRef}
        style={timelinePos === 'bottom'
          ? (fullscreen ? { flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' } : {})
          : {
              display: 'flex', gap: 12, alignItems: 'stretch',
              flexDirection: timelinePos === 'left' ? 'row-reverse' : 'row',
              ...(fullscreen ? { flex: 1, minHeight: 0 } : {}),
            }}
      >
        <div style={timelinePos === 'bottom'
          ? (fullscreen ? { flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' } : {})
          : { flex: 1, minWidth: 0, ...(fullscreen ? { display: 'flex', flexDirection: 'column' } : {}) }}>
          <CalendarMonth
            year={year} month={month} selectedDate={date} onDayClick={openDay}
            compact={isMobile} dayMinHeight={120}
            fillHeight={fullscreen && !isMobile}
            renderDay={renderDay}
          />
        </div>

      {/* Граница между календарём и временной шкалой: перетаскивание меняет размер панели шкалы */}
      {!isMobile && (
        <div
          onMouseDown={startDividerDrag}
          title="Потяните, чтобы изменить размер"
          style={{
            flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: timelinePos === 'bottom' ? 'row-resize' : 'col-resize',
            ...(timelinePos === 'bottom'
              ? { height: 16, margin: '4px 0' }
              : { width: 12 }),
          }}
        >
          <div style={{
            background: draggingDivider ? '#0077ff' : 'var(--border-color)',
            borderRadius: 4, transition: 'background 0.15s',
            ...(timelinePos === 'bottom' ? { height: 4, width: 56 } : { width: 4, height: 56 }),
          }} />
        </div>
      )}

      {/* Шкала выбранного дня */}
      <div
        ref={timelineRef}
        style={timelinePos === 'bottom'
          ? { marginTop: isMobile ? 16 : 0 }
          : { width: timelineSize ?? TL_SIZE_DEFAULT, flexShrink: 0, display: 'flex', flexDirection: 'column' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
          <button style={ghostBtn} onClick={() => shiftDay(-1)}>‹</button>
          <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>
            {Number(date.split('-')[2])} {MONTH_NAMES[Number(date.split('-')[1]) - 1].toLowerCase()}
          </div>
          <button style={ghostBtn} onClick={() => shiftDay(1)}>›</button>
          <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
            {[
              canViewTasks && dayTasks.length > 0 ? `задач: ${dayTasks.length}` : '',
              dayReminders.length > 0 ? `напоминаний: ${dayReminders.length}` : '',
              schedDayCount > 0 ? `расписание: ${schedDayCount}` : '',
            ].filter(Boolean).join(' · ') || 'событий нет'}
          </span>
        </div>
        {empty ? (
          <div style={{
            border: '1px solid var(--border-color)', borderRadius: 12, padding: 24,
            textAlign: 'center', color: 'var(--text-secondary)',
          }}>
            На этот день ничего не запланировано.
          </div>
        ) : isMobile ? (
          <DayAgenda sections={agendaSections} untimedRow={untimedRow} />
        ) : columns.length > 0 ? (
          <DayTimeline
            columns={columns}
            bands={bands}
            items={items}
            startHour={startHour}
            endHour={endHour}
            hourHeight={40}
            maxHeight={timelinePos === 'bottom' ? timelineSize ?? undefined : undefined}
            fillHeight // адаптивная высота: сетка помещается целиком, без прокрутки
            untimedRow={untimedRow}
          />
        ) : untimedRow}
      </div>
      </div>
    </div>
  );
}
