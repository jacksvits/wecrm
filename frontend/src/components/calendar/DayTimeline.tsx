import React from 'react';

/**
 * Временная шкала дня: колонки × время. Общий компонент.
 * bands — фоновые полосы (смены), items — карточки (записи/задачи/напоминания).
 * Перетаскивание (HTML5 DnD): бросок в колонку → onDrop(id, kind, columnId, startMin),
 * минута вычисляется из позиции курсора, шаг привязки — stepMin.
 */

export interface TimelineColumn {
  id: string;
  title: string;
  subtitle?: string;
  color?: string;
}

export interface TimelineBand {
  id: string;
  columnId: string;
  startMin: number;
  endMin: number;
  color: string;       // цвет полосы (с прозрачностью задаётся рендером)
  label: string;
  conflict?: boolean;
  draggable?: boolean;
  onClick?: () => void;
}

export interface TimelineItem {
  id: string;
  columnId: string;
  startMin: number;
  endMin: number;
  title: string;
  subtitle?: string;
  color?: string;      // цвет левой кромки
  background?: string;
  conflict?: boolean;
  draggable?: boolean;
  onClick?: () => void;
}

interface Props {
  columns: TimelineColumn[];
  bands?: TimelineBand[];
  items?: TimelineItem[];
  startHour?: number;
  endHour?: number;
  stepMin?: number;
  hourHeight?: number;
  untimedRow?: React.ReactNode; // строка «без времени» над сеткой
  onDrop?: (kind: 'band' | 'item', id: string, columnId: string, startMin: number) => void;
}

export const minToTime = (m: number) =>
  `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;

export function DayTimeline({
  columns, bands = [], items = [],
  startHour = 8, endHour = 20, stepMin = 30, hourHeight = 48,
  untimedRow, onDrop,
}: Props) {
  const totalMin = (endHour - startHour) * 60;
  const gridHeight = (totalMin / 60) * hourHeight;
  const minToY = (m: number) => ((m - startHour * 60) / 60) * hourHeight;

  const hours: number[] = [];
  for (let h = startHour; h < endHour; h++) hours.push(h);

  const handleDragStart = (e: React.DragEvent, kind: 'band' | 'item', id: string) => {
    e.dataTransfer.setData('text/plain', JSON.stringify({ kind, id }));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDrop = (e: React.DragEvent, columnId: string) => {
    e.preventDefault();
    if (!onDrop) return;
    try {
      const { kind, id } = JSON.parse(e.dataTransfer.getData('text/plain'));
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const y = e.clientY - rect.top;
      let minutes = startHour * 60 + (y / hourHeight) * 60;
      minutes = Math.round(minutes / stepMin) * stepMin;
      minutes = Math.max(startHour * 60, Math.min(endHour * 60 - stepMin, minutes));
      onDrop(kind, id, columnId, minutes);
    } catch { /* игнорируем чужой drag */ }
  };

  return (
    <div>
      {untimedRow}
      <div style={{ overflowX: 'auto', overflowY: 'auto', maxHeight: '72vh', border: '1px solid var(--border-color)', borderRadius: 12, background: 'var(--bg-card)' }}>
        <div style={{ display: 'flex', minWidth: Math.max(560, 72 + columns.length * 170) }}>
          {/* Колонка времени */}
          <div style={{ width: 72, flexShrink: 0, position: 'sticky', left: 0, zIndex: 3, background: 'var(--bg-card)' }}>
            <div style={{ height: 44, borderBottom: '1px solid var(--border-color)' }} />
            <div style={{ position: 'relative', height: gridHeight }}>
              {hours.map((h) => (
                <div key={h} style={{
                  position: 'absolute', top: (h - startHour) * hourHeight, left: 0, right: 0,
                  fontSize: 11, color: 'var(--text-muted)', textAlign: 'right', paddingRight: 8,
                  transform: 'translateY(-50%)',
                }}>{minToTime(h * 60)}</div>
              ))}
            </div>
          </div>
          {/* Колонки */}
          {columns.map((col) => (
            <div key={col.id} style={{ flex: 1, minWidth: 160, borderLeft: '1px solid var(--border-color)' }}>
              <div style={{
                height: 44, borderBottom: '1px solid var(--border-color)', padding: '4px 8px',
                position: 'sticky', top: 0, zIndex: 2, background: 'var(--bg-card)',
                display: 'flex', flexDirection: 'column', justifyContent: 'center',
              }}>
                <div style={{ fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                  {col.color && <span style={{ width: 10, height: 10, borderRadius: 3, background: col.color, flexShrink: 0 }} />}
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{col.title}</span>
                </div>
                {col.subtitle && <div style={{ fontSize: 11, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{col.subtitle}</div>}
              </div>
              <div
                style={{ position: 'relative', height: gridHeight }}
                onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; }}
                onDrop={(e) => handleDrop(e, col.id)}
              >
                {/* Часовые линии */}
                {hours.map((h) => (
                  <div key={h} style={{
                    position: 'absolute', top: (h - startHour) * hourHeight, left: 0, right: 0,
                    borderTop: '1px solid var(--border-color)', opacity: 0.6,
                  }} />
                ))}
                {/* Получасовые линии */}
                {stepMin <= 30 && hours.map((h) => (
                  <div key={`h${h}`} style={{
                    position: 'absolute', top: (h - startHour) * hourHeight + hourHeight / 2, left: 0, right: 0,
                    borderTop: '1px dashed var(--border-color)', opacity: 0.35,
                  }} />
                ))}
                {/* Фоновые полосы (смены) */}
                {bands.filter((b) => b.columnId === col.id).map((b) => {
                  const top = Math.max(0, minToY(b.startMin));
                  const height = Math.max(14, minToY(b.endMin) - top);
                  return (
                    <div
                      key={b.id}
                      draggable={b.draggable}
                      onDragStart={(e) => handleDragStart(e, 'band', b.id)}
                      onClick={b.onClick}
                      title={`${b.label} · ${minToTime(b.startMin)}–${minToTime(b.endMin)}${b.conflict ? ' · конфликт кабинета' : ''}`}
                      style={{
                        position: 'absolute', top, left: 2, right: 2, height,
                        background: `${b.color}22`, borderLeft: `3px solid ${b.color}`,
                        border: b.conflict ? '1px solid #dc2626' : undefined,
                        borderLeftWidth: 3, borderLeftColor: b.conflict ? '#dc2626' : b.color,
                        borderLeftStyle: 'solid',
                        borderRadius: 6, padding: '2px 6px', fontSize: 11, color: 'var(--text-primary)',
                        cursor: b.draggable ? 'grab' : b.onClick ? 'pointer' : 'default',
                        overflow: 'hidden', zIndex: 1,
                      }}
                    >
                      {b.conflict && '⚠️ '}{b.label}
                    </div>
                  );
                })}
                {/* Карточки (записи) */}
                {items.filter((it) => it.columnId === col.id).map((it) => {
                  const top = Math.max(0, minToY(it.startMin));
                  const height = Math.max(20, minToY(it.endMin) - top);
                  return (
                    <div
                      key={it.id}
                      draggable={it.draggable}
                      onDragStart={(e) => handleDragStart(e, 'item', it.id)}
                      onClick={it.onClick}
                      style={{
                        position: 'absolute', top, left: 8, right: 4, height,
                        background: it.background || 'var(--bg-secondary, rgba(127,127,127,0.12))',
                        borderLeft: `3px solid ${it.conflict ? '#dc2626' : it.color || '#3b82f6'}`,
                        borderRadius: 6, padding: '2px 6px', fontSize: 12,
                        cursor: it.draggable ? 'grab' : it.onClick ? 'pointer' : 'default',
                        overflow: 'hidden', zIndex: 2, color: 'var(--text-primary)',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.08)',
                      }}
                    >
                      <div style={{ fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {it.conflict && '⚠️ '}{minToTime(it.startMin)}–{minToTime(it.endMin)} · {it.title}
                      </div>
                      {it.subtitle && height >= 34 && (
                        <div style={{ fontSize: 11, color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{it.subtitle}</div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
