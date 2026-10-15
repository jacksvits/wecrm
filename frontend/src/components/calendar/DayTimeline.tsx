import React, { useLayoutEffect, useRef, useState } from 'react';

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
  maxHeight?: number;           // высота прокручиваемой области, px (по умолчанию 72vh)
  fillHeight?: boolean;         // адаптивная высота: часы растягиваются/сжимаются так, чтобы сетка полностью помещалась без прокрутки
  untimedRow?: React.ReactNode; // строка «без времени» над сеткой
  onDrop?: (kind: 'band' | 'item', id: string, columnId: string, startMin: number) => void;
}

export const minToTime = (m: number) =>
  `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;

export function DayTimeline({
  columns, bands = [], items = [],
  startHour = 8, endHour = 20, stepMin = 30, hourHeight = 48,
  maxHeight, fillHeight,
  untimedRow, onDrop,
}: Props) {
  const totalMin = (endHour - startHour) * 60;
  const scrollRef = useRef<HTMLDivElement>(null);
  const [fillHourH, setFillHourH] = useState<number | null>(null);

  // fillHeight: часы растягиваются/сжимаются так, чтобы сетка заняла всю доступную
  // высоту без пустот и без прокрутки. Защитный минимум часа — 14px (ниже скрол неизбежен).
  useLayoutEffect(() => {
    if (!fillHeight) { setFillHourH(null); return; }
    const el = scrollRef.current;
    if (!el) return;
    const totalHours = endHour - startHour;
    const compute = () => {
      // Высота ограничена либо родителем, либо maxHeight (в сочетании с maxHeight берём меньшее)
      const cap = maxHeight ? Math.min(el.clientHeight, maxHeight) : el.clientHeight;
      const available = cap - 44; // минус шапка колонок
      if (available <= 0 || totalHours <= 0) return;
      // Запас 1px: при расчёте впритык дробные доли пикселя включают скроллбар
      const next = Math.max(Math.floor(((available - 1) / totalHours) * 100) / 100, 14);
      setFillHourH((prev) => (prev !== null && Math.abs(prev - next) < 0.5 ? prev : next));
    };
    compute();
    const ro = new ResizeObserver(compute);
    ro.observe(el);
    return () => ro.disconnect();
  }, [fillHeight, maxHeight, hourHeight, startHour, endHour]);

  // Эффективная высота часа: адаптивная (fillHeight) или переданная
  const hh = fillHeight && fillHourH ? fillHourH : hourHeight;
  const gridHeight = (totalMin / 60) * hh;
  const minToY = (m: number) => ((m - startHour * 60) / 60) * hh;

  const hours: number[] = [];
  for (let h = startHour; h < endHour; h++) hours.push(h);

  // Раскладка пересекающихся карточек по «дорожкам» внутри колонки:
  // задачи на одно время делят ширину колонки поровну, а не перекрывают друг друга
  const layoutItems = (list: TimelineItem[]): { it: TimelineItem; lane: number; lanes: number }[] => {
    const sorted = [...list].sort((a, b) => a.startMin - b.startMin || a.endMin - b.endMin);
    const placed: { it: TimelineItem; lane: number; lanes: number }[] = [];
    let cluster: { it: TimelineItem; lane: number; lanes: number }[] = [];
    let clusterEnd = -1;
    const flush = () => {
      const lanes = cluster.reduce((m, p) => Math.max(m, p.lane + 1), 0);
      cluster.forEach((p) => { p.lanes = lanes; });
      placed.push(...cluster);
      cluster = [];
    };
    for (const it of sorted) {
      if (cluster.length > 0 && it.startMin >= clusterEnd) {
        flush();
        clusterEnd = -1;
      }
      const used = new Set(cluster.filter((p) => p.it.endMin > it.startMin).map((p) => p.lane));
      let lane = 0;
      while (used.has(lane)) lane++;
      cluster.push({ it, lane, lanes: 1 });
      clusterEnd = Math.max(clusterEnd, it.endMin);
    }
    flush();
    return placed;
  };

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
      let minutes = startHour * 60 + (y / hh) * 60;
      minutes = Math.round(minutes / stepMin) * stepMin;
      minutes = Math.max(startHour * 60, Math.min(endHour * 60 - stepMin, minutes));
      onDrop(kind, id, columnId, minutes);
    } catch { /* игнорируем чужой drag */ }
  };

  return (
    <div style={fillHeight ? { display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 } : undefined}>
      {untimedRow}
      <div
        ref={scrollRef}
        data-tl-scroll
        style={{
          overflowX: 'auto', overflowY: 'auto',
          ...(fillHeight ? { flex: 1, minHeight: 0 } : { maxHeight: maxHeight ?? '72vh' }),
          border: '1px solid var(--border-color)', borderRadius: 12, background: 'var(--bg-card)',
        }}
      >
        <div style={{ display: 'flex', minWidth: Math.max(560, 72 + columns.length * 170) }}>
          {/* Колонка времени */}
          <div style={{ width: 72, flexShrink: 0, position: 'sticky', left: 0, zIndex: 3, background: 'var(--bg-card)' }}>
            <div style={{ height: 44, borderBottom: '1px solid var(--border-color)' }} />
            <div style={{ position: 'relative', height: gridHeight }}>
              {hours.map((h) => (
                <div key={h} style={{
                  position: 'absolute', top: (h - startHour) * hh, left: 0, right: 0,
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
                    position: 'absolute', top: (h - startHour) * hh, left: 0, right: 0,
                    borderTop: '1px solid var(--border-color)', opacity: 0.6,
                  }} />
                ))}
                {/* Получасовые линии */}
                {stepMin <= 30 && hours.map((h) => (
                  <div key={`h${h}`} style={{
                    position: 'absolute', top: (h - startHour) * hh + hh / 2, left: 0, right: 0,
                    borderTop: '1px dashed var(--border-color)', opacity: 0.35,
                  }} />
                ))}
                {/* Фоновые полосы (смены) */}
                {bands.filter((b) => b.columnId === col.id).map((b) => {
                  // Ограничиваем границами сетки: карточка за полночь не должна расширять прокрутку
                  const top = Math.min(Math.max(0, minToY(b.startMin)), Math.max(0, gridHeight - 14));
                  const height = Math.min(Math.max(14, minToY(b.endMin) - Math.max(0, minToY(b.startMin))), Math.max(14, gridHeight - top));
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
                {layoutItems(items.filter((it) => it.columnId === col.id)).map(({ it, lane, lanes }) => {
                  // Ограничиваем границами сетки: карточка за полночь не должна расширять прокрутку
                  const top = Math.min(Math.max(0, minToY(it.startMin)), Math.max(0, gridHeight - 20));
                  const height = Math.min(Math.max(20, minToY(it.endMin) - Math.max(0, minToY(it.startMin))), Math.max(20, gridHeight - top));
                  // Одна карточка в ряду — на всю ширину; несколько — делят колонку поровну
                  const lanePos = lanes === 1
                    ? { left: 8, right: 4 }
                    : {
                        left: `calc(8px + ${(lane * 100) / lanes}% - ${(lane * 12) / lanes}px + 1px)`,
                        width: `calc(${100 / lanes}% - ${12 / lanes}px - 2px)`,
                      };
                  return (
                    <div
                      key={it.id}
                      draggable={it.draggable}
                      onDragStart={(e) => handleDragStart(e, 'item', it.id)}
                      onClick={it.onClick}
                      title={`${minToTime(it.startMin)}–${minToTime(it.endMin)} · ${it.title}${it.subtitle ? ' · ' + it.subtitle : ''}`}
                      style={{
                        position: 'absolute', top, ...lanePos, height,
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
