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
  /** compact — мобильный режим (≤768px): ячейки ниже, содержимое — компактные индикаторы */
  compact?: boolean;
  renderDay?: (dateISO: string, compact: boolean) => React.ReactNode;
}

export function CalendarMonth({ year, month, selectedDate, onDayClick, compact, renderDay }: Props) {
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
      {/* minmax(0, 1fr): треки сжимаются ниже ширины контента — длинные названия не ломают сетку */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gap: compact ? 2 : 4, marginBottom: 4 }}>
        {WEEKDAYS.map((w, i) => (
          <div key={w} style={{
            textAlign: 'center', fontSize: compact ? 11 : 12, fontWeight: 600, padding: '4px 0',
            color: i >= 5 ? '#dc2626' : 'var(--text-secondary)',
          }}>{w}</div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gap: compact ? 2 : 4 }}>
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
                minHeight: compact ? 50 : 86, padding: compact ? 4 : 6, borderRadius: compact ? 8 : 10, cursor: 'pointer',
                background: isSelected ? 'rgba(22,163,74,0.12)' : 'var(--bg-card)',
                border: `1px solid ${isToday ? '#16a34a' : isSelected ? '#16a34a' : 'var(--border-color)'}`,
                opacity: other ? 0.45 : 1,
                display: 'flex', flexDirection: 'column', gap: compact ? 2 : 3,
                minWidth: 0, overflow: 'hidden', // содержимое обрезается, а не растягивает колонку
                transition: 'border-color 0.15s',
              }}
            >
              <div style={{
                fontSize: compact ? 12 : 13, fontWeight: isToday ? 700 : 500,
                color: isToday ? '#16a34a' : 'var(--text-primary)',
              }}>
                {d.getDate()}
              </div>
              {renderDay?.(iso, !!compact)}
            </div>
          );
        })}
      </div>
    </div>
  );
}
