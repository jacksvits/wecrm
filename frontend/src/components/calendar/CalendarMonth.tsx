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
  /** минимальная высота ячейки дня в десктопном режиме (по умолчанию 86) */
  dayMinHeight?: number;
  /** растянуть сетку на всю высоту родителя (строки делят высоту поровну) */
  fillHeight?: boolean;
  /** акцентный цвет темы (кольцо выбранного/сегодняшнего дня), по умолчанию зелёный */
  accentColor?: string;
  /** цвет фона ячеек «через одну» (шахматный порядок) — задаётся только в виджете дашборда */
  zebraColor?: string;
  /** объёмные ячейки в стиле промоблоков витрины: без рамки, крупный радиус, цветное свечение, глянец */
  volumetric?: boolean;
  renderDay?: (dateISO: string, compact: boolean) => React.ReactNode;
}

export function CalendarMonth({ year, month, selectedDate, onDayClick, compact, dayMinHeight, fillHeight, accentColor, zebraColor, volumetric, renderDay }: Props) {
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
    <div style={fillHeight ? { display: 'flex', flexDirection: 'column', height: '100%' } : undefined}>
      {/* minmax(0, 1fr): треки сжимаются ниже ширины контента — длинные названия не ломают сетку */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gap: compact ? 2 : 4, marginBottom: 4, flexShrink: 0 }}>
        {WEEKDAYS.map((w, i) => (
          <div key={w} style={{
            textAlign: 'center', fontSize: compact ? 11 : 12, fontWeight: 600, padding: '4px 0',
            color: i >= 5 ? '#dc2626' : 'var(--text-secondary)',
          }}>{w}</div>
        ))}
      </div>
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gap: compact ? 2 : volumetric ? 6 : 4,
        // fillHeight: строки растягиваются, делив доступную высоту поровну
        ...(fillHeight ? { flex: 1, minHeight: 0, gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))` } : {}),
      }}>
        {cells.slice(0, rows * 7).map((d, i) => {
          const iso = toISODate(d);
          const other = d.getMonth() !== month - 1;
          const isToday = iso === todayISO;
          const isSelected = iso === selectedDate;
          return (
            <div
              key={iso}
              onClick={() => onDayClick(iso)}
              style={{
                minHeight: compact ? 50 : dayMinHeight ?? 86, padding: compact ? 4 : 6,
                borderRadius: volumetric ? (compact ? 10 : 14) : (compact ? 8 : 10), cursor: 'pointer',
                // Фоны «через одну»: шахматный порядок по (строка + колонка)
                background: volumetric
                  // Глянец поверх, как у промоблоков витрины
                  ? `linear-gradient(160deg, var(--cal-gloss, rgba(255,255,255,0.5)) 0%, rgba(255,255,255,0) 38%), ${isSelected ? `${accentColor ?? '#16a34a'}1F` : (zebraColor && (Math.floor(i / 7) + (i % 7)) % 2 === 0 ? zebraColor : 'var(--bg-card)')}`
                  : (isSelected
                    ? `${accentColor ?? '#16a34a'}1F`
                    : (zebraColor && (Math.floor(i / 7) + (i % 7)) % 2 === 0 ? zebraColor : 'var(--bg-card)')),
                border: volumetric ? 'none' : `1px solid ${isToday ? (accentColor ?? '#16a34a') : isSelected ? (accentColor ?? '#16a34a') : 'var(--border-color)'}`,
                // Цветное свечение промоблока; выбранный/сегодняшний день — яркое кольцо
                boxShadow: volumetric
                  ? (isSelected || isToday
                    ? `0 0 0 2px ${accentColor ?? '#16a34a'}, 0 10px 22px ${accentColor ?? '#16a34a'}45`
                    : `0 6px 16px ${accentColor ?? '#16a34a'}26, 0 2px 5px rgba(16,24,40,0.10)`)
                  : undefined,
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
