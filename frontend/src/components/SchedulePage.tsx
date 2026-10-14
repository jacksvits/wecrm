import { useCallback, useEffect, useMemo, useState } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { api } from '../api/client';
import { useAuth } from '../hooks/useAuth';
import { CalendarMonth, toISODate, MONTH_NAMES } from './calendar/CalendarMonth';
import { DayTimeline, minToTime, TimelineBand, TimelineColumn, TimelineItem } from './calendar/DayTimeline';
import { DayAgenda, AgendaSection } from './calendar/DayAgenda';
import { useIsMobile } from '../hooks/useIsMobile';

/**
 * Расписание (календарь): кабинеты, смены сотрудников, записи клиентов.
 * Месяц → клик по дате → временная шкала (по кабинетам / по сотрудникам).
 * Чтение — все сотрудники; изменение — только администратор.
 */

const WEEKDAY_SHORT = ['вс', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб'];
const WEEKDAY_FULL = ['воскресенье', 'понедельник', 'вторник', 'среда', 'четверг', 'пятница', 'суббота'];

const APPT_STATUS: Record<string, { label: string; color: string }> = {
  planned: { label: 'Запланирована', color: '#3b82f6' },
  arrived: { label: 'Пришёл', color: '#16a34a' },
  done: { label: 'Завершена', color: '#6b7280' },
  no_show: { label: 'Не пришёл', color: '#dc2626' },
  cancelled: { label: 'Отменена', color: '#9ca3af' },
};

const timeToMin = (t: string) => {
  const [h, m] = t.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
};

const fmtDayTitle = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  return `${d} ${MONTH_NAMES[m - 1].toLowerCase()}, ${WEEKDAY_FULL[dt.getDay()]}`;
};

const stripHtml = (html: string) => {
  const tmp = document.createElement('div');
  tmp.innerHTML = html || '';
  return tmp.textContent || '';
};

// WYSIWYG — та же конфигурация, что в остальных текстовых полях проекта
const quillModules = {
  toolbar: [
    ['bold', 'italic', 'underline', 'strike'],
    [{ list: 'ordered' }, { list: 'bullet' }],
    ['link'],
    ['clean'],
  ],
};
const quillFormats = ['bold', 'italic', 'underline', 'strike', 'list', 'bullet', 'link'];

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '8px 12px', borderRadius: 10, border: '1px solid var(--border-color)',
  fontSize: 14, outline: 'none', background: 'var(--bg-card)', color: 'var(--text-primary)', boxSizing: 'border-box',
};
const labelStyle: React.CSSProperties = {
  fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 4, display: 'block',
};
const btn = (bg: string): React.CSSProperties => ({
  padding: '8px 16px', borderRadius: 10, border: 'none', background: bg, color: '#fff',
  fontSize: 14, cursor: 'pointer', whiteSpace: 'nowrap',
});
const ghostBtn: React.CSSProperties = {
  padding: '8px 14px', borderRadius: 10, border: '1px solid var(--border-color)',
  background: 'transparent', color: 'var(--text-primary)', fontSize: 14, cursor: 'pointer', whiteSpace: 'nowrap',
};
const chip = (active: boolean): React.CSSProperties => ({
  padding: '6px 14px', borderRadius: 20, fontSize: 13, cursor: 'pointer',
  border: '1px solid var(--border-color)',
  background: active ? '#16a34a' : 'transparent',
  color: active ? '#fff' : 'var(--text-secondary)',
});

interface ApptForm {
  id?: string;
  userId: string; contactId: string | null; clientName: string; clientPhone: string;
  date: string; start: string; end: string; status: string; comment: string;
}

export function SchedulePage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const isMobile = useIsMobile();
  const today = toISODate(new Date());

  const [mode, setMode] = useState<'month' | 'day'>('month');
  const [year, setYear] = useState(() => new Date().getFullYear());
  const [month, setMonth] = useState(() => new Date().getMonth() + 1);
  const [date, setDate] = useState(today);
  const [viewBy, setViewBy] = useState<'rooms' | 'employees'>('rooms');

  const [monthData, setMonthData] = useState<any>(null);
  const [dayData, setDayData] = useState<any>(null);
  const [rooms, setRooms] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [error, setError] = useState('');

  const [showRooms, setShowRooms] = useState(false);
  const [showShifts, setShowShifts] = useState(false);
  // Названия кнопок из настроек (Настройки → Расписание); по умолчанию — стандартные
  const [btnLabels, setBtnLabels] = useState({ roomsLabel: 'Кабинеты', shiftsLabel: 'Смены' });
  const [apptForm, setApptForm] = useState<ApptForm | null>(null);
  const [shiftEdit, setShiftEdit] = useState<any>(null);

  const loadRooms = useCallback(() => {
    api.schedule.rooms.list(isAdmin).then(setRooms).catch(() => {});
  }, [isAdmin]);
  useEffect(() => { loadRooms(); }, [loadRooms]);
  useEffect(() => {
    if (isAdmin) api.users.list().then((u: any[]) => setUsers(u)).catch(() => {});
  }, [isAdmin]);
  useEffect(() => {
    api.schedule.settings.get()
      .then((s) => setBtnLabels({ roomsLabel: s.roomsLabel || 'Кабинеты', shiftsLabel: s.shiftsLabel || 'Смены' }))
      .catch(() => {});
  }, []);

  const loadMonth = useCallback(() => {
    api.schedule.month(year, month).then(setMonthData).catch((e: any) => setError(e.message || 'Ошибка загрузки'));
  }, [year, month]);
  const loadDay = useCallback(() => {
    api.schedule.day(date).then(setDayData).catch((e: any) => setError(e.message || 'Ошибка загрузки'));
  }, [date]);

  useEffect(() => { if (mode === 'month') loadMonth(); }, [mode, loadMonth]);
  useEffect(() => { if (mode === 'day') loadDay(); }, [mode, loadDay]);

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
    const dt = new Date(y, m - 1, d + delta);
    openDay(toISODate(dt));
  };

  // ---------- DnD ----------
  const handleDrop = (kind: 'band' | 'item', id: string, columnId: string, startMin: number) => {
    if (!isAdmin || !dayData) return;
    if (kind === 'item') {
      const appt = dayData.appointments.find((a: any) => a.id === id);
      if (!appt) return;
      const dur = appt.endMin - appt.startMin;
      const upd: any = { startMin, endMin: startMin + dur };
      // Запись привязана к сотруднику: перенос между колонками — только в виде «по сотрудникам»
      if (viewBy === 'employees' && columnId !== appt.userId) upd.userId = columnId;
      api.schedule.appointments.update(id, upd).then(loadDay).catch((e: any) => alert(e.message || 'Ошибка'));
    } else {
      const shift = dayData.shifts.find((s: any) => s.id === id);
      if (!shift) return;
      const dur = shift.endMin - shift.startMin;
      const upd: any = { date, startMin, endMin: startMin + dur, roomId: shift.roomId };
      if (viewBy === 'rooms') upd.roomId = columnId;
      else upd.userId = columnId;
      api.schedule.shifts.update(id, upd).then(loadDay).catch((e: any) => alert(e.message || 'Ошибка'));
    }
  };

  // ---------- колонки/полосы/карточки дня ----------
  const { columns, bands, items } = useMemo(() => {
    if (!dayData) return { columns: [] as TimelineColumn[], bands: [] as TimelineBand[], items: [] as TimelineItem[] };
    const cols: TimelineColumn[] = [];
    const bnds: TimelineBand[] = [];
    const itms: TimelineItem[] = [];
    if (viewBy === 'rooms') {
      for (const r of dayData.rooms) {
        const roomShifts = dayData.shifts.filter((s: any) => s.roomId === r.id);
        cols.push({
          id: r.id, title: r.name, color: r.color,
          subtitle: roomShifts.map((s: any) => s.user?.name).filter(Boolean).join(', ') || '—',
        });
      }
      for (const s of dayData.shifts) {
        bnds.push({
          id: s.id, columnId: s.roomId, startMin: s.startMin, endMin: s.endMin,
          color: s.room?.color || '#3b82f6', label: `${s.user?.name || '—'} · ${minToTime(s.startMin)}–${minToTime(s.endMin)}`,
          conflict: s.roomConflict, draggable: isAdmin,
          onClick: isAdmin ? () => setShiftEdit(s) : undefined,
        });
      }
      const NO_ROOM = '__no_room__';
      let noRoomUsed = false;
      for (const a of dayData.appointments) {
        if (!a.roomId) noRoomUsed = true;
        itms.push({
          id: a.id, columnId: a.roomId || NO_ROOM, startMin: a.startMin, endMin: a.endMin,
          title: a.clientName, subtitle: `${a.user?.name || ''}${a.clientPhone ? ' · ' + a.clientPhone : ''}`,
          color: APPT_STATUS[a.status]?.color || '#3b82f6', conflict: a.conflict, draggable: isAdmin,
          onClick: () => openAppt(a),
        });
      }
      if (noRoomUsed) cols.push({ id: NO_ROOM, title: 'Без кабинета', subtitle: 'нет смены на это время' });
    } else {
      for (const u of dayData.users) {
        const userShift = dayData.shifts.find((s: any) => s.userId === u.id);
        cols.push({
          id: u.id, title: u.name,
          subtitle: userShift ? `${userShift.room?.name || ''} · ${minToTime(userShift.startMin)}–${minToTime(userShift.endMin)}` : 'без смены',
        });
      }
      for (const s of dayData.shifts) {
        bnds.push({
          id: s.id, columnId: s.userId, startMin: s.startMin, endMin: s.endMin,
          color: s.room?.color || '#3b82f6', label: `${s.room?.name || '—'} · ${minToTime(s.startMin)}–${minToTime(s.endMin)}`,
          conflict: s.roomConflict, draggable: isAdmin,
          onClick: isAdmin ? () => setShiftEdit(s) : undefined,
        });
      }
      for (const a of dayData.appointments) {
        itms.push({
          id: a.id, columnId: a.userId, startMin: a.startMin, endMin: a.endMin,
          title: a.clientName, subtitle: `${a.room?.name || 'без кабинета'}${a.clientPhone ? ' · ' + a.clientPhone : ''}`,
          color: APPT_STATUS[a.status]?.color || '#3b82f6', conflict: a.conflict, draggable: isAdmin,
          onClick: () => openAppt(a),
        });
      }
    }
    return { columns: cols, bands: bnds, items: itms };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dayData, viewBy, isAdmin]);

  // ---------- модалка записи ----------
  const openAppt = (a?: any) => {
    if (!a) {
      if (!isAdmin) return;
      setApptForm({
        userId: users[0]?.id || '', contactId: null, clientName: '', clientPhone: '',
        date, start: '09:00', end: '09:30', status: 'planned', comment: '',
      });
      return;
    }
    setApptForm({
      id: a.id, userId: a.userId, contactId: a.contactId, clientName: a.clientName,
      clientPhone: a.clientPhone, date: a.date,
      start: minToTime(a.startMin), end: minToTime(a.endMin), status: a.status, comment: a.comment || '',
    });
  };

  // Мобильная «повестка дня»: секция на каждого сотрудника с его записями
  const agendaSections = useMemo<AgendaSection[]>(() => {
    if (!dayData) return [];
    return dayData.users.map((u: any) => {
      const userShift = dayData.shifts.find((s: any) => s.userId === u.id);
      const userAppts = dayData.appointments
        .filter((a: any) => a.userId === u.id)
        .sort((a: any, b: any) => a.startMin - b.startMin);
      return {
        id: u.id,
        title: u.name,
        subtitle: userShift
          ? `${userShift.room?.name || 'без кабинета'} · ${minToTime(userShift.startMin)}–${minToTime(userShift.endMin)}`
          : 'без смены',
        color: userShift?.room?.color || '#3b82f6',
        items: userAppts.map((a: any) => ({
          id: a.id, startMin: a.startMin,
          time: `${minToTime(a.startMin)}–${minToTime(a.endMin)}`,
          title: a.clientName,
          subtitle: [a.room?.name ? `Кабинет: ${a.room.name}` : 'без кабинета', a.clientPhone].filter(Boolean).join(' · '),
          color: APPT_STATUS[a.status]?.color || '#3b82f6',
          conflict: a.conflict,
          onClick: () => openAppt(a),
        })),
      };
    });
  }, [dayData, date]);

  const saveAppt = async () => {
    if (!apptForm) return;
    const payload = {
      userId: apptForm.userId, contactId: apptForm.contactId || null,
      clientName: apptForm.clientName.trim(), clientPhone: apptForm.clientPhone.trim(),
      date: apptForm.date, startMin: timeToMin(apptForm.start), endMin: timeToMin(apptForm.end),
      status: apptForm.status, comment: apptForm.comment,
    };
    try {
      if (apptForm.id) await api.schedule.appointments.update(apptForm.id, payload);
      else await api.schedule.appointments.create(payload);
      setApptForm(null);
      loadDay();
    } catch (e: any) {
      alert(e.message || 'Ошибка сохранения');
    }
  };

  // ---------- рендер ----------
  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 8 }}>
        <h1 style={{ margin: 0, fontSize: 22 }}>Расписание</h1>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {isAdmin && <button style={ghostBtn} onClick={() => setShowRooms(true)}>{btnLabels.roomsLabel}</button>}
          {isAdmin && <button style={ghostBtn} onClick={() => setShowShifts(true)}>{btnLabels.shiftsLabel}</button>}
          {isAdmin && <button style={btn('#16a34a')} onClick={() => openAppt()}>+ Запись</button>}
        </div>
      </div>
      {error && <div style={{ color: '#dc2626', marginBottom: 10, fontSize: 14 }}>{error}</div>}

      {mode === 'month' && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <button style={ghostBtn} onClick={() => shiftMonth(-1)}>‹</button>
            <div style={{ fontSize: 17, fontWeight: 600, minWidth: 150, textAlign: 'center' }}>{MONTH_NAMES[month - 1]} {year}</div>
            <button style={ghostBtn} onClick={() => shiftMonth(1)}>›</button>
            <button style={{ ...ghostBtn, fontSize: 13 }} onClick={() => { const n = new Date(); setYear(n.getFullYear()); setMonth(n.getMonth() + 1); }}>Сегодня</button>
          </div>
          <CalendarMonth
            year={year} month={month} onDayClick={openDay} compact={isMobile}
            renderDay={(iso, compact) => {
              const d = monthData?.days?.[iso];
              if (!d) return null;
              const roomIds = Object.keys(d.rooms || {});
              // Мобильный вид: счётчики + точки кабинетов
              if (compact) {
                return (
                  <div style={{ display: 'flex', gap: 4, alignItems: 'center', flexWrap: 'wrap', fontSize: 11, fontWeight: 600 }}>
                    {d.appointments > 0 && <span style={{ color: '#16a34a' }}>{d.appointments} зап.</span>}
                    {d.appointments === 0 && d.shifts > 0 && <span style={{ color: 'var(--text-secondary)' }}>{d.shifts} смен.</span>}
                    {roomIds.slice(0, 3).map((rid) => {
                      const room = rooms.find((r) => r.id === rid);
                      return <span key={rid} style={{ width: 7, height: 7, borderRadius: 2, background: room?.color || '#94a3b8', display: 'inline-block' }} />;
                    })}
                  </div>
                );
              }
              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {d.shifts > 0 && <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{d.shifts} смен{ d.shifts === 1 ? 'а' : d.shifts < 5 ? 'ы' : ''}</div>}
                  {d.appointments > 0 && (
                    <div style={{ fontSize: 11, fontWeight: 600, color: '#16a34a', display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
                      {d.appointments} зап.
                      {roomIds.slice(0, 4).map((rid) => {
                        const room = rooms.find((r) => r.id === rid);
                        return <span key={rid} style={{ width: 8, height: 8, borderRadius: 2, background: room?.color || '#94a3b8', display: 'inline-block' }} />;
                      })}
                    </div>
                  )}
                </div>
              );
            }}
          />
          <div style={{ marginTop: 10, fontSize: 12, color: 'var(--text-muted)' }}>Нажмите на дату, чтобы открыть временную шкалу дня.</div>
        </div>
      )}

      {mode === 'day' && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
            <button style={ghostBtn} onClick={() => setMode('month')}>← Месяц</button>
            <button style={ghostBtn} onClick={() => shiftDay(-1)}>‹</button>
            <div style={{ fontSize: 17, fontWeight: 600 }}>{fmtDayTitle(date)}</div>
            <button style={ghostBtn} onClick={() => shiftDay(1)}>›</button>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
              <button style={chip(viewBy === 'rooms')} onClick={() => setViewBy('rooms')}>По кабинетам</button>
              <button style={chip(viewBy === 'employees')} onClick={() => setViewBy('employees')}>По сотрудникам</button>
            </div>
          </div>
          {!dayData && <div style={{ color: 'var(--text-secondary)' }}>Загрузка...</div>}
          {dayData && columns.length === 0 && (
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 12, padding: 30, textAlign: 'center', color: 'var(--text-secondary)' }}>
              На этот день смен не запланировано.{isAdmin && ` Добавьте смену через кнопку «${btnLabels.shiftsLabel}».`}
            </div>
          )}
          {dayData && columns.length > 0 && (
            isMobile
              ? <DayAgenda sections={agendaSections} />
              : <DayTimeline columns={columns} bands={bands} items={items} onDrop={handleDrop} />
          )}
          {dayData && (
            <div style={{ marginTop: 10, display: 'flex', gap: 14, flexWrap: 'wrap', fontSize: 12, color: 'var(--text-secondary)' }}>
              {Object.entries(APPT_STATUS).map(([k, v]) => (
                <span key={k} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span style={{ width: 10, height: 10, borderRadius: 3, background: v.color, display: 'inline-block' }} />
                  {v.label}
                </span>
              ))}
              <span style={{ color: '#dc2626' }}>⚠️ — пересечение времени</span>
            </div>
          )}
        </div>
      )}

      {/* ===== Модалка записи клиента ===== */}
      {apptForm && (
        <Modal title={apptForm.id ? 'Запись клиента' : 'Новая запись'} onClose={() => setApptForm(null)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {!isAdmin ? (
              <ReadonlyAppt appt={apptForm} />
            ) : (
              <>
                <div>
                  <label style={labelStyle}>Сотрудник</label>
                  <select style={inputStyle} value={apptForm.userId} onChange={(e) => setApptForm({ ...apptForm, userId: e.target.value })}>
                    {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
                  </select>
                </div>
                <ContactPicker
                  clientName={apptForm.clientName}
                  clientPhone={apptForm.clientPhone}
                  onChange={(name, phone, contactId) => setApptForm({ ...apptForm, clientName: name, clientPhone: phone, contactId })}
                />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                  <div>
                    <label style={labelStyle}>Дата</label>
                    <input type="date" style={inputStyle} value={apptForm.date} onChange={(e) => setApptForm({ ...apptForm, date: e.target.value })} />
                  </div>
                  <div>
                    <label style={labelStyle}>Начало</label>
                    <input type="time" style={inputStyle} value={apptForm.start} onChange={(e) => setApptForm({ ...apptForm, start: e.target.value })} />
                  </div>
                  <div>
                    <label style={labelStyle}>Конец</label>
                    <input type="time" style={inputStyle} value={apptForm.end} onChange={(e) => setApptForm({ ...apptForm, end: e.target.value })} />
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>Статус</label>
                  <select style={inputStyle} value={apptForm.status} onChange={(e) => setApptForm({ ...apptForm, status: e.target.value })}>
                    {Object.entries(APPT_STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Комментарий</label>
                  <ReactQuill theme="snow" value={apptForm.comment} onChange={(v) => setApptForm({ ...apptForm, comment: v })} modules={quillModules} formats={quillFormats} />
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                  <button style={btn('#16a34a')} onClick={saveAppt}>Сохранить</button>
                  {apptForm.id && (
                    <button style={btn('#dc2626')} onClick={async () => {
                      if (!confirm('Удалить запись?')) return;
                      try { await api.schedule.appointments.remove(apptForm.id!); setApptForm(null); loadDay(); }
                      catch (e: any) { alert(e.message || 'Ошибка'); }
                    }}>Удалить</button>
                  )}
                  <button style={ghostBtn} onClick={() => setApptForm(null)}>Отмена</button>
                </div>
              </>
            )}
          </div>
        </Modal>
      )}

      {/* ===== Модалка смены ===== */}
      {shiftEdit && (
        <Modal title="Смена" onClose={() => setShiftEdit(null)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {shiftEdit.generated && (
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', background: 'var(--bg-hover)', borderRadius: 8, padding: '8px 10px' }}>
                Смена создана по шаблону — изменение затронет только {fmtDayTitle(date)}.
              </div>
            )}
            <div>
              <label style={labelStyle}>Сотрудник</label>
              <select style={inputStyle} value={shiftEdit.userId} onChange={(e) => setShiftEdit({ ...shiftEdit, userId: e.target.value })}>
                {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Кабинет</label>
              <select style={inputStyle} value={shiftEdit.roomId} onChange={(e) => setShiftEdit({ ...shiftEdit, roomId: e.target.value })}>
                {(dayData?.rooms || rooms).map((r: any) => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div>
                <label style={labelStyle}>Начало</label>
                <input type="time" style={inputStyle} value={minToTime(shiftEdit.startMin)} onChange={(e) => setShiftEdit({ ...shiftEdit, startMin: timeToMin(e.target.value) })} />
              </div>
              <div>
                <label style={labelStyle}>Конец</label>
                <input type="time" style={inputStyle} value={minToTime(shiftEdit.endMin)} onChange={(e) => setShiftEdit({ ...shiftEdit, endMin: timeToMin(e.target.value) })} />
              </div>
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
              Записи клиентов этого сотрудника переедут вместе со сменой автоматически.
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button style={btn('#16a34a')} onClick={async () => {
                try {
                  await api.schedule.shifts.update(shiftEdit.id, {
                    date, userId: shiftEdit.userId, roomId: shiftEdit.roomId,
                    startMin: shiftEdit.startMin, endMin: shiftEdit.endMin,
                  });
                  setShiftEdit(null); loadDay();
                } catch (e: any) { alert(e.message || 'Ошибка'); }
              }}>Сохранить</button>
              <button style={btn('#dc2626')} onClick={async () => {
                if (!confirm('Удалить смену на этот день? Записи клиентов останутся у сотрудника без кабинета.')) return;
                try { await api.schedule.shifts.remove(shiftEdit.id); setShiftEdit(null); loadDay(); }
                catch (e: any) { alert(e.message || 'Ошибка'); }
              }}>Удалить</button>
              <button style={ghostBtn} onClick={() => setShiftEdit(null)}>Отмена</button>
            </div>
          </div>
        </Modal>
      )}

      {/* ===== Кабинеты ===== */}
      {showRooms && <RoomsModal title={btnLabels.roomsLabel} rooms={rooms} onClose={() => setShowRooms(false)} onChanged={() => { loadRooms(); loadDay(); }} />}

      {/* ===== Смены (шаблоны + разовые) ===== */}
      {showShifts && <ShiftsModal title={btnLabels.shiftsLabel} rooms={rooms} users={users} date={date} onClose={() => setShowShifts(false)} onChanged={() => { loadDay(); loadMonth(); }} />}
    </div>
  );
}

// ===================== вспомогательные компоненты =====================

function Modal({ title, onClose, children, wide }: { title: string; onClose: () => void; children: React.ReactNode; wide?: boolean }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={onClose}>
      <div style={{ background: 'var(--bg-card)', borderRadius: 16, padding: 20, width: '100%', maxWidth: wide ? 720 : 520, maxHeight: '90vh', overflow: 'auto' }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <h3 style={{ margin: 0, fontSize: 17 }}>{title}</h3>
          <button onClick={onClose} style={{ border: 'none', background: 'none', fontSize: 20, cursor: 'pointer', color: 'var(--text-secondary)' }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

/** Просмотр записи для сотрудников без прав редактирования */
function ReadonlyAppt({ appt }: { appt: ApptForm }) {
  const row = (label: string, value: React.ReactNode) => (
    <div style={{ display: 'flex', gap: 8, fontSize: 14 }}>
      <span style={{ color: 'var(--text-secondary)', minWidth: 110 }}>{label}</span>
      <span>{value}</span>
    </div>
  );
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {row('Клиент', <b>{appt.clientName}</b>)}
      {appt.clientPhone && row('Телефон', appt.clientPhone)}
      {row('Дата', fmtDayTitle(appt.date))}
      {row('Время', `${appt.start}–${appt.end}`)}
      {row('Статус', APPT_STATUS[appt.status]?.label || appt.status)}
      {appt.comment && stripHtml(appt.comment) && (
        <div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>Комментарий</div>
          <div style={{ fontSize: 14, lineHeight: 1.5 }} dangerouslySetInnerHTML={{ __html: appt.comment }} />
        </div>
      )}
    </div>
  );
}

/** Выбор клиента: поиск по контактам CRM + ручной ввод */
function ContactPicker({ clientName, clientPhone, onChange }: {
  clientName: string; clientPhone: string;
  onChange: (name: string, phone: string, contactId: string | null) => void;
}) {
  const [results, setResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    const q = clientName.trim();
    if (q.length < 2) { setResults([]); return; }
    setSearching(true);
    const t = setTimeout(() => {
      api.contacts.list(`?search=${encodeURIComponent(q)}&limit=6`)
        .then((list: any[]) => setResults(list.slice(0, 6)))
        .catch(() => setResults([]))
        .finally(() => setSearching(false));
    }, 300);
    return () => clearTimeout(t);
  }, [clientName]);

  return (
    <div style={{ position: 'relative' }}>
      <label style={labelStyle}>Клиент</label>
      <input
        style={inputStyle} value={clientName} placeholder="ФИО или название — поиск по клиентам CRM"
        onChange={(e) => onChange(e.target.value, clientPhone, null)}
      />
      {results.length > 0 && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 10,
          background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 10,
          boxShadow: '0 8px 24px rgba(0,0,0,0.15)', overflow: 'hidden',
        }}>
          {results.map((c) => (
            <div
              key={c.id}
              style={{ padding: '8px 12px', cursor: 'pointer', fontSize: 14, display: 'flex', justifyContent: 'space-between', gap: 8 }}
              onMouseDown={() => { onChange(c.name, c.phone || '', c.id); setResults([]); }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-hover)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              <span>{c.name}</span>
              <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>{c.phone || ''}</span>
            </div>
          ))}
        </div>
      )}
      {searching && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>Поиск...</div>}
      <div style={{ marginTop: 8 }}>
        <label style={labelStyle}>Телефон</label>
        <input style={inputStyle} value={clientPhone} onChange={(e) => onChange(clientName, e.target.value, null)} placeholder="+7 ..." />
      </div>
    </div>
  );
}

/** Справочник кабинетов */
function RoomsModal({ title, rooms, onClose, onChanged }: { title: string; rooms: any[]; onClose: () => void; onChanged: () => void }) {
  const [form, setForm] = useState<{ id?: string; name: string; color: string; note: string } | null>(null);
  const [error, setError] = useState('');

  const save = async () => {
    if (!form) return;
    try {
      if (form.id) await api.schedule.rooms.update(form.id, { name: form.name, color: form.color, note: form.note });
      else await api.schedule.rooms.create({ name: form.name, color: form.color, note: form.note, position: rooms.length });
      setForm(null); onChanged();
    } catch (e: any) { setError(e.message || 'Ошибка'); }
  };

  return (
    <Modal title={title} onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {rooms.filter((r) => r.isActive !== false).map((r) => (
          <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10, border: '1px solid var(--border-color)' }}>
            <span style={{ width: 16, height: 16, borderRadius: 4, background: r.color, flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 14 }}>{r.name}</div>
              {r.note && <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{r.note}</div>}
            </div>
            <button style={ghostBtn} onClick={() => setForm({ id: r.id, name: r.name, color: r.color, note: r.note || '' })}>✎</button>
            <button style={{ ...ghostBtn, color: '#dc2626' }} onClick={async () => {
              if (!confirm(`Убрать кабинет «${r.name}»? История смен сохранится.`)) return;
              try { await api.schedule.rooms.remove(r.id); onChanged(); } catch (e: any) { alert(e.message || 'Ошибка'); }
            }}>✕</button>
          </div>
        ))}
        {rooms.filter((r) => r.isActive !== false).length === 0 && (
          <div style={{ color: 'var(--text-secondary)', fontSize: 14, textAlign: 'center', padding: 12 }}>Кабинетов пока нет — добавьте первый.</div>
        )}
        {error && <div style={{ color: '#dc2626', fontSize: 13 }}>{error}</div>}
        {form ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, borderTop: '1px solid var(--border-color)', paddingTop: 12 }}>
            <div>
              <label style={labelStyle}>Название</label>
              <input style={inputStyle} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Кабинет 1" />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: 10 }}>
              <div>
                <label style={labelStyle}>Цвет</label>
                <input type="color" style={{ ...inputStyle, height: 40, padding: 2 }} value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} />
              </div>
              <div>
                <label style={labelStyle}>Примечание</label>
                <input style={inputStyle} value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} placeholder="Этаж, оборудование..." />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button style={btn('#16a34a')} onClick={save}>Сохранить</button>
              <button style={ghostBtn} onClick={() => setForm(null)}>Отмена</button>
            </div>
          </div>
        ) : (
          <button style={btn('#16a34a')} onClick={() => setForm({ name: '', color: '#3b82f6', note: '' })}>+ Добавить кабинет</button>
        )}
      </div>
    </Modal>
  );
}

/** Управление сменами: шаблоны по дням недели + разовые смены */
function ShiftsModal({ title, rooms, users, date, onClose, onChanged }: {
  title: string; rooms: any[]; users: any[]; date: string; onClose: () => void; onChanged: () => void;
}) {
  const [templates, setTemplates] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [tab, setTab] = useState<'templates' | 'once'>('templates');
  const [tplForm, setTplForm] = useState({ userId: users[0]?.id || '', roomId: rooms[0]?.id || '', weekdays: [] as number[], start: '08:00', end: '14:00' });
  const [onceForm, setOnceForm] = useState({ userId: users[0]?.id || '', roomId: rooms[0]?.id || '', date, start: '08:00', end: '14:00' });

  const load = useCallback(() => {
    api.schedule.templates.list().then(setTemplates).catch(() => {});
  }, []);
  useEffect(() => { load(); }, [load]);

  // Группировка шаблонов: сотрудник+кабинет+время → список дней недели
  const grouped = useMemo(() => {
    const map = new Map<string, any>();
    for (const t of templates) {
      const key = `${t.userId}|${t.roomId}|${t.startMin}|${t.endMin}`;
      if (!map.has(key)) map.set(key, { ids: [] as string[], user: t.user, room: t.room, startMin: t.startMin, endMin: t.endMin, weekdays: [] as number[] });
      const g = map.get(key)!;
      g.ids.push(t.id);
      g.weekdays.push(t.weekday);
    }
    return [...map.values()];
  }, [templates]);

  const addTemplate = async () => {
    setError('');
    if (tplForm.weekdays.length === 0) { setError('Выберите хотя бы один день недели'); return; }
    try {
      await api.schedule.templates.create({
        userId: tplForm.userId, roomId: tplForm.roomId, weekdays: tplForm.weekdays,
        startMin: timeToMin(tplForm.start), endMin: timeToMin(tplForm.end),
      });
      setTplForm({ ...tplForm, weekdays: [] });
      load(); onChanged();
    } catch (e: any) { setError(e.message || 'Ошибка'); }
  };

  const addOnce = async () => {
    setError('');
    try {
      await api.schedule.shifts.create({
        userId: onceForm.userId, roomId: onceForm.roomId, date: onceForm.date,
        startMin: timeToMin(onceForm.start), endMin: timeToMin(onceForm.end),
      });
      load(); onChanged();
    } catch (e: any) { setError(e.message || 'Ошибка'); }
  };

  const activeRooms = rooms.filter((r) => r.isActive !== false);

  return (
    <Modal title={title} onClose={onClose} wide>
      <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
        <button style={chip(tab === 'templates')} onClick={() => setTab('templates')}>Постоянные (по дням недели)</button>
        <button style={chip(tab === 'once')} onClick={() => setTab('once')}>Разовая смена</button>
      </div>
      {error && <div style={{ color: '#dc2626', fontSize: 13, marginBottom: 8 }}>{error}</div>}

      {tab === 'templates' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {grouped.map((g, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10, border: '1px solid var(--border-color)' }}>
              <span style={{ width: 14, height: 14, borderRadius: 4, background: g.room?.color || '#94a3b8', flexShrink: 0 }} />
              <div style={{ flex: 1, fontSize: 14 }}>
                <b>{g.user?.name}</b> · {g.room?.name} · {minToTime(g.startMin)}–{minToTime(g.endMin)}
                <span style={{ color: 'var(--text-secondary)' }}> · {g.weekdays.sort().map((w: number) => WEEKDAY_SHORT[w]).join(', ')}</span>
              </div>
              <button style={{ ...ghostBtn, color: '#dc2626' }} onClick={async () => {
                if (!confirm('Удалить шаблон? Смены на будущие даты исчезнут, записи клиентов останутся.')) return;
                try { for (const id of g.ids) await api.schedule.templates.remove(id); load(); onChanged(); }
                catch (e: any) { alert(e.message || 'Ошибка'); }
              }}>✕</button>
            </div>
          ))}
          {grouped.length === 0 && <div style={{ color: 'var(--text-secondary)', fontSize: 14, textAlign: 'center', padding: 8 }}>Шаблонов нет.</div>}
          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div>
                <label style={labelStyle}>Сотрудник</label>
                <select style={inputStyle} value={tplForm.userId} onChange={(e) => setTplForm({ ...tplForm, userId: e.target.value })}>
                  {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Кабинет</label>
                <select style={inputStyle} value={tplForm.roomId} onChange={(e) => setTplForm({ ...tplForm, roomId: e.target.value })}>
                  {activeRooms.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label style={labelStyle}>Дни недели</label>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {[1, 2, 3, 4, 5, 6, 0].map((w) => (
                  <button
                    key={w}
                    style={chip(tplForm.weekdays.includes(w))}
                    onClick={() => setTplForm({
                      ...tplForm,
                      weekdays: tplForm.weekdays.includes(w)
                        ? tplForm.weekdays.filter((x) => x !== w)
                        : [...tplForm.weekdays, w],
                    })}
                  >{WEEKDAY_SHORT[w]}</button>
                ))}
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div>
                <label style={labelStyle}>Начало</label>
                <input type="time" style={inputStyle} value={tplForm.start} onChange={(e) => setTplForm({ ...tplForm, start: e.target.value })} />
              </div>
              <div>
                <label style={labelStyle}>Конец</label>
                <input type="time" style={inputStyle} value={tplForm.end} onChange={(e) => setTplForm({ ...tplForm, end: e.target.value })} />
              </div>
            </div>
            <button style={btn('#16a34a')} onClick={addTemplate}>+ Добавить шаблон</button>
          </div>
        </div>
      )}

      {tab === 'once' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={labelStyle}>Сотрудник</label>
              <select style={inputStyle} value={onceForm.userId} onChange={(e) => setOnceForm({ ...onceForm, userId: e.target.value })}>
                {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Кабинет</label>
              <select style={inputStyle} value={onceForm.roomId} onChange={(e) => setOnceForm({ ...onceForm, roomId: e.target.value })}>
                {activeRooms.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
            <div>
              <label style={labelStyle}>Дата</label>
              <input type="date" style={inputStyle} value={onceForm.date} onChange={(e) => setOnceForm({ ...onceForm, date: e.target.value })} />
            </div>
            <div>
              <label style={labelStyle}>Начало</label>
              <input type="time" style={inputStyle} value={onceForm.start} onChange={(e) => setOnceForm({ ...onceForm, start: e.target.value })} />
            </div>
            <div>
              <label style={labelStyle}>Конец</label>
              <input type="time" style={inputStyle} value={onceForm.end} onChange={(e) => setOnceForm({ ...onceForm, end: e.target.value })} />
            </div>
          </div>
          <button style={btn('#16a34a')} onClick={addOnce}>+ Добавить смену</button>
        </div>
      )}
    </Modal>
  );
}
