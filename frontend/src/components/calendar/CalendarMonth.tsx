import React from 'react';

/**
 * Календарная сетка месяца (пн–вс). Общий компонент: расписание, задачи, напоминания.
 * Содержимое каждой даты отдаёт родитель через renderDay.
 */

export const toISODate = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export const MONTH_NAMES = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
const WEEKDAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

interface Props {
  year: number;
  month: number; // 1..12
  selectedDate?: string;
  onDayClick: (dateISO: string) => void;
  renderDay?: (dateISO: string) => React.ReactNode;
}

export function CalendarMonth({ year, month, selectedDate, onDayClick, renderDay }: Props) {
  const todayISO = toISODate(new Date());
  // Сетка: начинаем с понедельника недели, в которую попадает 1-е число
  const first = new Date(year, month - 1, 1);
  const startOffset = (first.getDay() + 6) % 7; // пн=0 … вс=6
  const gridStart = new Date(year, month - 1, 1 - startOffset);
  const cells: Date[] = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(gridStart);
    d.setDate(gridStart.getDate() + i);
    cells.push(d);
  }
  // 5 строк достаточно, если последняя строка вся из другого месяца
  const rows = cells.slice(28).every((d) => d.getMonth() !== month - 1) ? 5 : 6;

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 4 }}>
        {WEEKDAYS.map((w, i) => (
          <div key={w} style={{
            textAlign: 'center', fontSize: 12, fontWeight: 600, padding: '4px 0',
            color: i >= 5 ? '#dc2626' : 'var(--text-secondary)',
          }}>{w}</div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
        {cells.slice(0, rows * 7).map((d) => {
          const iso = toISODate(d);
          const other = d.getMonth() !== month - 1;
          const isToday = iso === todayISO;
          const isSelected = iso === selectedDate;
          return (
            <div
              key={iso}
              onClick={() => onDayClick(iso)}
              style={{
                minHeight: 86, padding: 6, borderRadius: 10, cursor: 'pointer',
                background: isSelected ? 'rgba(22,163,74,0.12)' : 'var(--bg-card)',
                border: `1px solid ${isToday ? '#16a34a' : isSelected ? '#16a34a' : 'var(--border-color)'}`,
                opacity: other ? 0.45 : 1,
                display: 'flex', flexDirection: 'column', gap: 3,
                transition: 'border-color 0.15s',
              }}
            >
              <div style={{
                fontSize: 13, fontWeight: isToday ? 700 : 500,
                color: isToday ? '#16a34a' : 'var(--text-primary)',
              }}>
                {d.getDate()}
              </div>
              {renderDay?.(iso)}
            </div>
          );
        })}
      </div>
    </div>
  );
}
