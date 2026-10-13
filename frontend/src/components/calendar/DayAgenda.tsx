import React from 'react';

/**
 * Мобильный вид выбранного дня (≤768px): вместо колонок временной шкалы —
 * вертикальные секции с полноширинными карточками, отсортированными по времени.
 * Ничего не обрезается и не требует горизонтальной прокрутки.
 * Общий компонент: виджет дашборда и страница «Расписание».
 */

export interface AgendaItem {
  id: string;
  time: string;        // «11:00–11:30»
  title: string;
  subtitle?: string;
  color: string;
  icon?: string;       // эмодзи типа события: 🗓 запись, 👤 смена, 📋 задача, 🔔 напоминание
  conflict?: boolean;
  startMin?: number;   // для сортировки внутри секции
  onClick?: () => void;
}

export interface AgendaSection {
  id: string;
  title: string;
  subtitle?: string;   // например «Кабинет 1 · 08:00–14:00»
  color: string;
  items: AgendaItem[];
}

export function DayAgenda({ sections, untimedRow }: {
  sections: AgendaSection[];
  untimedRow?: React.ReactNode;
}) {
  // Показываем секции с событиями; секцию сотрудника без записей — тоже (видна его смена)
  const visible = sections.filter((s) => s.items.length > 0 || s.subtitle);
  return (
    <div>
      {untimedRow}
      {visible.map((sec) => (
        <div key={sec.id} style={{ marginBottom: 16 }}>
          {sec.title ? (
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 7, flexWrap: 'wrap' }}>
              <span style={{ width: 9, height: 9, borderRadius: '50%', background: sec.color, display: 'inline-block', alignSelf: 'center' }} />
              <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>{sec.title}</span>
              {sec.subtitle && <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{sec.subtitle}</span>}
              {sec.items.length > 0 && <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>({sec.items.length})</span>}
            </div>
          ) : null}
          {sec.items.length === 0 ? (
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 6, marginLeft: 16 }}>записей нет</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
              {sec.items.slice().sort((a, b) => (a.startMin ?? 0) - (b.startMin ?? 0)).map((item) => (
                <div
                  key={item.id}
                  onClick={item.onClick}
                  style={{
                    background: 'var(--bg-card)',
                    border: `1px solid ${item.conflict ? '#dc2626' : 'var(--border-color)'}`,
                    borderLeft: `3px solid ${item.conflict ? '#dc2626' : item.color}`,
                    borderRadius: 10, padding: '10px 12px',
                    cursor: item.onClick ? 'pointer' : 'default',
                  }}
                >
                  <div style={{ display: 'flex', gap: 8, alignItems: 'baseline', flexWrap: 'wrap' }}>
                    {item.icon && <span style={{ fontSize: 13, lineHeight: 1 }}>{item.icon}</span>}
                    <span style={{ fontSize: 13, fontWeight: 700, color: item.conflict ? '#dc2626' : item.color, whiteSpace: 'nowrap' }}>
                      {item.time}
                    </span>
                    <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.35 }}>
                      {item.conflict ? '⚠️ ' : ''}{item.title}
                    </span>
                  </div>
                  {item.subtitle && (
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 3 }}>{item.subtitle}</div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
