import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { api } from "../api/client";

type PeriodKey = "today" | "week" | "month" | "custom";
type IconName = "traffic" | "sources" | "depth" | "bounce" | "time" | "users" | "devices" | "geo" | "age" | "pages" | "news" | "social" | "money" | "leads" | "conversion";
type SourceName = "Метрика" | "CRM" | "Демо";

type AdStatisticsContextValue = {
  data: any | null;
  loading: boolean;
  error: string | null;
  period: PeriodKey;
  date1: string;
  date2: string;
  counter: string;
  periodLabel: string;
  selectPeriod: (period: PeriodKey) => void;
  setCustomRange: (date1: string, date2: string) => void;
  setCounter: (counter: string) => void;
  refresh: () => void;
};

const AdStatisticsContext = createContext<AdStatisticsContextValue | null>(null);
const COLORS = ["#6e5ac7", "#ee74a5", "#20ad9b", "#e5a83b", "#4c91e8", "#8b6f47", "#d56060", "#5d7f9c"];
const SHORT_MONTHS = ["янв", "фев", "мар", "апр", "мая", "июн", "июл", "авг", "сен", "окт", "ноя", "дек"];

function isoDay(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function shiftDay(value: string, days: number): string {
  const date = new Date(`${value}T12:00:00`);
  date.setDate(date.getDate() + days);
  return isoDay(date);
}

function rangeFor(period: Exclude<PeriodKey, "custom">) {
  const date2 = isoDay(new Date());
  const days = period === "today" ? 0 : period === "week" ? 6 : 29;
  return { date1: shiftDay(date2, -days), date2 };
}

function daysInclusive(date1: string, date2: string): number {
  return Math.round((new Date(`${date2}T00:00:00Z`).getTime() - new Date(`${date1}T00:00:00Z`).getTime()) / 86400000) + 1;
}

function shortDate(value: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value || "");
  if (!match) return value || "—";
  return `${Number(match[3])} ${SHORT_MONTHS[Number(match[2]) - 1]}`;
}

function formatRange(date1: string, date2: string): string {
  return date1 === date2 ? shortDate(date1) : `${shortDate(date1)} — ${shortDate(date2)}`;
}

function fmtInt(value: number): string {
  return Math.round(Number(value) || 0).toLocaleString("ru-RU");
}

function fmtDecimal(value: number, digits = 2): string {
  return (Number(value) || 0).toFixed(digits).replace(".", ",");
}

function fmtDuration(seconds: number): string {
  const value = Number(seconds) || 0;
  if (value < 60) return `${Math.round(value)} с`;
  return `${Math.floor(value / 60)}:${String(Math.round(value % 60)).padStart(2, "0")} мин`;
}

function pctDelta(current: number, previous: number): string {
  if (!previous) return "";
  const delta = ((current - previous) / previous) * 100;
  return `${delta > 0 ? "+" : ""}${delta.toFixed(1).replace(".", ",")}%`;
}

function seededRandom(seed: number) {
  let state = seed;
  return () => {
    state = (state * 1103515245 + 12345) % 2147483648;
    return state / 2147483648;
  };
}

function genSeries(seed: number, count: number, min: number, max: number): number[] {
  const random = seededRandom(seed);
  return Array.from({ length: Math.max(2, Math.min(count, 90)) }, () => min + random() * (max - min));
}

function demoDates(count: number): string[] {
  const safeCount = Math.max(2, Math.min(count, 90));
  const end = isoDay(new Date());
  return Array.from({ length: safeCount }, (_, index) => shiftDay(end, index - safeCount + 1));
}

export function AdStatisticsProvider({ enabled, children }: { enabled: boolean; children: ReactNode }) {
  const initial = useMemo(() => rangeFor("month"), []);
  const [period, setPeriod] = useState<PeriodKey>("month");
  const [date1, setDate1] = useState(initial.date1);
  const [date2, setDate2] = useState(initial.date2);
  const [counter, setCounter] = useState("all");
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [requestVersion, setRequestVersion] = useState(0);
  const refreshRequested = useRef(false);

  useEffect(() => {
    if (!enabled) return;
    let alive = true;
    const bypassCache = refreshRequested.current;
    refreshRequested.current = false;
    setLoading(true);
    setError(null);
    api.yandexMetrika.getSummary({ date1, date2, counter, refresh: bypassCache })
      .then((result: any) => {
        if (!alive) return;
        if (result) {
          setData(result);
          setError(null);
        } else {
          setData(null);
          setError("Не удалось получить данные Яндекс Метрики. Проверьте подключение плагина.");
        }
      })
      .catch(() => {
        if (!alive) return;
        setData(null);
        setError("Не удалось получить данные Яндекс Метрики. Проверьте подключение плагина.");
      })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [enabled, date1, date2, counter, requestVersion]);

  const selectPeriod = useCallback((next: PeriodKey) => {
    setPeriod(next);
    if (next !== "custom") {
      const range = rangeFor(next);
      setDate1(range.date1);
      setDate2(range.date2);
    }
  }, []);

  const setCustomRange = useCallback((nextDate1: string, nextDate2: string) => {
    setPeriod("custom");
    setDate1(nextDate1);
    setDate2(nextDate2);
  }, []);

  const value: AdStatisticsContextValue = {
    data,
    loading,
    error,
    period,
    date1,
    date2,
    counter,
    periodLabel: formatRange(date1, date2),
    selectPeriod,
    setCustomRange,
    setCounter,
    refresh: () => {
      refreshRequested.current = true;
      setRequestVersion((version) => version + 1);
    },
  };

  return <AdStatisticsContext.Provider value={value}>{children}</AdStatisticsContext.Provider>;
}

function useAdStatistics(): AdStatisticsContextValue {
  const context = useContext(AdStatisticsContext);
  if (!context) throw new Error("AdStatisticsProvider is required");
  return context;
}

export function AdPeriodToolbar() {
  const { data, loading, period, date1, date2, counter, periodLabel, selectPeriod, setCustomRange, setCounter, refresh } = useAdStatistics();
  const [draftDate1, setDraftDate1] = useState(date1);
  const [draftDate2, setDraftDate2] = useState(date2);
  const [dateError, setDateError] = useState("");
  const today = isoDay(new Date());

  useEffect(() => {
    setDraftDate1(date1);
    setDraftDate2(date2);
    setDateError("");
  }, [date1, date2]);

  const applyCustom = () => {
    if (!draftDate1 || !draftDate2) return setDateError("Укажите обе даты");
    if (draftDate1 > draftDate2) return setDateError("Начало периода позже его окончания");
    if (draftDate2 > today) return setDateError("Дата окончания не может быть в будущем");
    if (daysInclusive(draftDate1, draftDate2) > 366) return setDateError("Максимальный период — 366 дней");
    setDateError("");
    setCustomRange(draftDate1, draftDate2);
  };

  return (
    <section className="ad-period-panel" aria-label="Период и источник данных">
      <div className="ad-period-main">
        <div className="ad-period-buttons" role="group" aria-label="Период статистики">
          {([
            ["today", "Сегодня"],
            ["week", "Неделя"],
            ["month", "Месяц"],
            ["custom", "Произвольно"],
          ] as [PeriodKey, string][]).map(([key, label]) => (
            <button key={key} type="button" className={`ad-period-button ${period === key ? "is-active" : ""}`} aria-pressed={period === key} onClick={() => selectPeriod(key)}>
              {label}
            </button>
          ))}
        </div>
        <label className="ad-counter-select">
          <span className="ad-field-label">Счётчик</span>
          <select value={counter} onChange={(event) => setCounter(event.target.value)} disabled={loading && !data}>
            <option value="all">Все счётчики</option>
            {(data?.counters || []).map((id: string) => <option key={id} value={id}>Счётчик {id}</option>)}
          </select>
        </label>
        <button type="button" className="ad-refresh-button" onClick={refresh} disabled={loading}>
          <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6v5h-5" /><path d="M4 18v-5h5" /><path d="M18.5 9A7 7 0 0 0 6 6.5L4 11" /><path d="M5.5 15A7 7 0 0 0 18 17.5l2-4.5" /></svg>
          {loading ? "Обновление…" : "Обновить"}
        </button>
      </div>
      {period === "custom" && (
        <div className="ad-custom-range">
          <label><span className="ad-field-label">Начало периода</span><input type="date" value={draftDate1} max={today} onChange={(event) => setDraftDate1(event.target.value)} /></label>
          <span className="ad-range-separator">—</span>
          <label><span className="ad-field-label">Конец периода</span><input type="date" value={draftDate2} max={today} onChange={(event) => setDraftDate2(event.target.value)} /></label>
          <button type="button" className="ad-apply-button" onClick={applyCustom}>Применить</button>
          {dateError && <span className="ad-form-error" role="alert">{dateError}</span>}
        </div>
      )}
      <div className="ad-period-meta" aria-live="polite">
        <span className="ad-data-source"><span className={`ad-live-dot ${loading ? "is-loading" : ""}`} />{periodLabel}</span>
        <span>{data?.period ? `Сравнение: ${formatRange(data.period.prevDate1, data.period.prevDate2)}` : "Сравнение с предыдущим аналогичным периодом"}</span>
      </div>
    </section>
  );
}

function AdIcon({ name }: { name: IconName }) {
  const paths: Record<IconName, ReactNode> = {
    traffic: <><path d="m4 18 5-6 4 3 7-9" /><path d="M15 6h5v5" /></>,
    sources: <><path d="M4 7h16" /><path d="M4 12h10" /><path d="M4 17h13" /><circle cx="18" cy="12" r="2" /></>,
    depth: <><path d="M12 3v18" /><path d="m7 8 5-5 5 5" /><path d="m7 16 5 5 5-5" /></>,
    bounce: <><path d="M5 17c4-1 3-10 8-10 3 0 3 5 6 5" /><path d="m16 9 3 3-3 3" /></>,
    time: <><circle cx="12" cy="13" r="8" /><path d="M12 9v5l3 2" /><path d="M9 2h6" /></>,
    users: <><circle cx="9" cy="8" r="3" /><path d="M3 20c0-4 2-7 6-7s6 3 6 7" /><path d="M16 5c3 0 4 4 2 6" /><path d="M17 13c3 1 4 3 4 6" /></>,
    devices: <><rect x="3" y="4" width="14" height="11" rx="2" /><path d="M8 20h5M10 15v5" /><rect x="17" y="8" width="4" height="10" rx="1" /></>,
    geo: <><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18" /></>,
    age: <><circle cx="8" cy="8" r="3" /><circle cx="17" cy="10" r="2" /><path d="M2 20c0-4 2-7 6-7s6 3 6 7M15 15c3 0 5 2 5 5" /></>,
    pages: <><rect x="5" y="3" width="14" height="18" rx="2" /><path d="M9 8h6M9 12h6M9 16h4" /></>,
    news: <><path d="M5 4h14v16H5z" /><path d="M8 8h8M8 12h8M8 16h5" /></>,
    social: <><circle cx="7" cy="12" r="3" /><circle cx="17" cy="6" r="3" /><circle cx="17" cy="18" r="3" /><path d="m10 10 4-2M10 14l4 2" /></>,
    money: <><circle cx="12" cy="12" r="9" /><path d="M15 8c-4-2-7 1-4 3s5 0 4 3-4 3-7 1M12 5v14" /></>,
    leads: <><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1" /></>,
    conversion: <><path d="M4 5h16l-6 7v6l-4 2v-8z" /></>,
  };
  return <svg className="ad-widget-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}

function WidgetFrame({ title, icon, source = "Метрика", footer, children }: { title: string; icon: IconName; source?: SourceName; footer?: string; children: ReactNode }) {
  return (
    <div className="ad-widget-content">
      <div className="ad-widget-header">
        <AdIcon name={icon} />
        <span className="ad-widget-title">{title}</span>
        <span className={`ad-source-badge ${source === "Демо" ? "is-demo" : source === "CRM" ? "is-crm" : ""}`}>{source}</span>
      </div>
      <div className="ad-widget-body">{children}</div>
      {footer && <div className="ad-widget-footer"><span>{footer}</span><span>{source === "Демо" ? "Демонстрационные данные" : source === "CRM" ? "Данные CRM" : "Яндекс Метрика"}</span></div>}
    </div>
  );
}

function WidgetState({ loading, error, emptyText, onRetry }: { loading?: boolean; error?: boolean; emptyText?: string; onRetry?: () => void }) {
  return (
    <div className="ad-widget-state" role={error ? "alert" : "status"}>
      <span>{loading ? "Загружаем данные…" : error ? "Данные временно недоступны" : emptyText || "За выбранный период данных нет"}</span>
      {error && onRetry && <button type="button" onClick={onRetry}>Повторить</button>}
    </div>
  );
}

function RealWidget({ title, icon, isEmpty, emptyText, children }: { title: string; icon: IconName; isEmpty?: (data: any) => boolean; emptyText?: string; children: (data: any) => ReactNode }) {
  const { data, loading, error, periodLabel, refresh } = useAdStatistics();
  let content: ReactNode;
  if (loading && !data) content = <WidgetState loading />;
  else if (!data) content = <WidgetState error onRetry={refresh} />;
  else if (isEmpty?.(data)) content = <WidgetState emptyText={emptyText} />;
  else content = children(data);
  return <WidgetFrame title={title} icon={icon} footer={periodLabel}>{content}{error && data && <span className="ad-inline-warning">Показаны предыдущие загруженные данные</span>}</WidgetFrame>;
}

function Segmented({ label, value, options, onChange }: { label: string; value: string; options: { value: string; label: string }[]; onChange: (value: string) => void }) {
  return (
    <div className="ad-segmented" role="group" aria-label={label}>
      {options.map((option) => <button key={option.value} type="button" className={value === option.value ? "is-active" : ""} aria-pressed={value === option.value} onClick={() => onChange(option.value)}>{option.label}</button>)}
    </div>
  );
}

type Pt = { x: number; y: number };
function smoothPath(points: Pt[]): string {
  if (!points.length) return "";
  if (points.length < 3) return `M${points.map((point) => `${point.x.toFixed(1)},${point.y.toFixed(1)}`).join(" L")}`;
  let path = `M${points[0].x.toFixed(1)},${points[0].y.toFixed(1)}`;
  for (let index = 0; index < points.length - 1; index++) {
    const p0 = points[index - 1] || points[index];
    const p1 = points[index];
    const p2 = points[index + 1];
    const p3 = points[index + 2] || p2;
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;
    path += ` C${c1x.toFixed(1)},${c1y.toFixed(1)} ${c2x.toFixed(1)},${c2y.toFixed(1)} ${p2.x.toFixed(1)},${p2.y.toFixed(1)}`;
  }
  return path;
}

function Sparkline({ data, color }: { data: number[]; color: string }) {
  const gradientId = `spark-${useId().replace(/:/g, "")}`;
  const values = data.length > 1 ? data : [data[0] || 0, data[0] || 0];
  const width = 420;
  const height = 76;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const points = values.map((value, index) => ({ x: index / (values.length - 1) * width, y: height - 5 - (value - min) / range * (height - 12) }));
  const line = smoothPath(points);
  const last = points[points.length - 1];
  return (
    <div className="ad-sparkline">
      <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" aria-hidden="true">
        <defs><linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={color} stopOpacity={0.22} /><stop offset="100%" stopColor={color} stopOpacity={0} /></linearGradient></defs>
        {line && <path d={`${line} L${width},${height} L0,${height} Z`} fill={`url(#${gradientId})`} />}
        {line && <path d={line} fill="none" stroke={color} strokeWidth={2.1} strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />}
        {last && <circle cx={last.x} cy={last.y} r={3} fill={color} />}
      </svg>
    </div>
  );
}

function dateTicks(dates: string[], count = 6): string[] {
  if (!dates.length) return [];
  const ticks = Math.min(count, dates.length);
  const indexes = Array.from({ length: ticks }, (_, index) => Math.round(index * (dates.length - 1) / Math.max(ticks - 1, 1)));
  return [...new Set(indexes)].map((index) => shortDate(dates[index]));
}

function LineChart({ seriesList, dates, colors, area = false, ticks = 6 }: { seriesList: number[][]; dates: string[]; colors: string[]; area?: boolean; ticks?: number }) {
  const gradientId = `chart-${useId().replace(/:/g, "")}`;
  const safeSeries = seriesList.map((series) => series.length > 1 ? series : [series[0] || 0, series[0] || 0]);
  const max = Math.max(...safeSeries.flat(), 0) * 1.08 || 1;
  const width = 800;
  const height = 230;
  const top = 8;
  const bottom = 8;
  const plotHeight = height - top - bottom;
  const labels = Array.from({ length: 5 }, (_, index) => fmtInt(max * (1 - index / 4)));
  return (
    <div className="ad-line-chart">
      <div className="ad-chart-main">
        <div className="ad-y-labels">{labels.map((label, index) => <span key={index}>{label}</span>)}</div>
        <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" role="img" aria-label="Динамика показателей за выбранный период">
          <defs><linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={colors[0] || COLORS[0]} stopOpacity={0.24} /><stop offset="100%" stopColor={colors[0] || COLORS[0]} stopOpacity={0.02} /></linearGradient></defs>
          {labels.map((_, index) => { const y = top + index * plotHeight / 4; return <line key={index} x1={0} y1={y} x2={width} y2={y} className="ad-chart-grid" />; })}
          {safeSeries.map((series, seriesIndex) => {
            const points = series.map((value, index) => ({ x: index / Math.max(series.length - 1, 1) * width, y: top + (1 - value / max) * plotHeight }));
            const line = smoothPath(points);
            if (!line) return null;
            return <g key={seriesIndex}>{area && seriesIndex === 0 && <path d={`${line} L${width},${height - bottom} L0,${height - bottom} Z`} fill={`url(#${gradientId})`} />}<path d={line} fill="none" stroke={colors[seriesIndex]} strokeWidth={seriesIndex === 0 ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" /></g>;
          })}
        </svg>
      </div>
      <div className="ad-chart-x-labels">{dateTicks(dates, ticks).map((label, index) => <span key={`${label}-${index}`}>{label}</span>)}</div>
    </div>
  );
}

function GroupedBars({ dates, series }: { dates: string[]; series: { name: string; values: number[]; color: string }[] }) {
  const width = 800;
  const height = 220;
  const bottom = 20;
  const plotHeight = height - bottom;
  const max = Math.max(...series.flatMap((item) => item.values), 0) * 1.12 || 1;
  const step = width / Math.max(dates.length, 1);
  const groupWidth = step * 0.7;
  const barWidth = groupWidth / Math.max(series.length, 1);
  return (
    <div className="ad-grouped-chart">
      <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" role="img" aria-label="Посещаемость по дням">
        {dates.map((date, index) => {
          const day = new Date(`${date}T12:00:00`).getDay();
          return (day === 0 || day === 6) ? <rect key={`band-${date}`} x={index * step} y={0} width={step} height={plotHeight} fill="#6e5ac7" opacity={0.035} /> : null;
        })}
        {dates.map((date, dateIndex) => <g key={date}>{series.map((item, seriesIndex) => {
          const value = item.values[dateIndex] || 0;
          const barHeight = value / max * plotHeight;
          return <rect key={item.name} x={dateIndex * step + (step - groupWidth) / 2 + seriesIndex * barWidth} y={plotHeight - barHeight} width={Math.max(barWidth - 1, 0.8)} height={barHeight} rx={2} fill={item.color} opacity={0.9} />;
        })}</g>)}
        {dates.map((date, index) => index % Math.ceil(dates.length / 6) === 0 ? <text key={`label-${date}`} x={index * step + step / 2} y={height - 3} fontSize={22} fill="#788395" textAnchor="middle">{date.slice(8, 10)}.{date.slice(5, 7)}</text> : null)}
      </svg>
    </div>
  );
}

function ProgressBar({ value, max, color }: { value: number; max: number; color: string }) {
  const percent = Math.max(0, Math.min(100, max ? value / max * 100 : 0));
  return <div className="ad-progress-track"><div style={{ width: `${percent}%`, background: color }} /></div>;
}

function Legend({ items, hidden, onToggle }: { items: { name: string; value: number; color: string }[]; hidden?: Set<string>; onToggle?: (name: string) => void }) {
  return (
    <div className="ad-chart-legend">
      {items.map((item) => {
        const inactive = hidden?.has(item.name);
        const content = <><span className="ad-legend-dot" style={{ background: item.color }} /><span className="ad-legend-name" title={item.name}>{item.name}</span><strong>{fmtInt(item.value)}</strong></>;
        return onToggle ? <button type="button" key={item.name} className={`ad-legend-item ${inactive ? "is-inactive" : ""}`} aria-pressed={!inactive} onClick={() => onToggle(item.name)} title={inactive ? "Показать источник" : "Скрыть источник"}>{content}</button> : <div key={item.name} className="ad-legend-item">{content}</div>;
      })}
    </div>
  );
}

function RankList({ rows, selected, onSelect }: { rows: { name: string; value: number }[]; selected?: string; onSelect?: (name: string) => void }) {
  const total = rows.reduce((sum, row) => sum + row.value, 0) || 1;
  return (
    <div className="ad-rank-list">
      {rows.map((row, index) => (
        <button type="button" key={row.name} className={`ad-rank-row ${selected === row.name ? "is-selected" : ""}`} onClick={() => onSelect?.(selected === row.name ? "" : row.name)} aria-pressed={selected === row.name}>
          <span className="ad-rank-heading"><span className="ad-rank-color" style={{ background: COLORS[index % COLORS.length] }} /><span className="ad-rank-name" title={row.name}>{row.name}</span><strong>{fmtInt(row.value)}</strong><span className="ad-rank-share">{fmtDecimal(row.value / total * 100, 1)}%</span></span>
          <ProgressBar value={row.value} max={total} color={COLORS[index % COLORS.length]} />
        </button>
      ))}
    </div>
  );
}

function ReportTable({ rows, leftHeader, metricLabel = "Просмотры" }: { rows: { label: string; value: number }[]; leftHeader: string; metricLabel?: string }) {
  const [query, setQuery] = useState("");
  const [top, setTop] = useState("10");
  const [selected, setSelected] = useState("");
  const filtered = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("ru-RU");
    return rows.filter((row) => !normalized || row.label.toLocaleLowerCase("ru-RU").includes(normalized));
  }, [rows, query]);
  const visible = filtered.slice(0, Number(top));
  const selectedRow = rows.find((row) => row.label === selected);
  const total = rows.reduce((sum, row) => sum + row.value, 0) || 1;
  return (
    <div className="ad-report-table">
      <div className="ad-table-controls">
        <label className="ad-search-field"><span className="ad-field-label">Поиск</span><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Найти в списке…" /></label>
        <Segmented label="Количество строк" value={top} onChange={setTop} options={[{ value: "10", label: "Топ-10" }, { value: "25", label: "Топ-25" }]} />
      </div>
      <div className="ad-table-head"><span>{leftHeader}</span><span>{metricLabel}</span></div>
      <div className="ad-table-rows">
        {visible.map((row, index) => (
          <button type="button" key={`${row.label}-${index}`} className={`ad-table-row ${selected === row.label ? "is-selected" : ""}`} onClick={() => setSelected(selected === row.label ? "" : row.label)} aria-pressed={selected === row.label}>
            <span className="ad-table-index">{index + 1}</span><span className="ad-table-label" title={row.label}>{row.label}</span><strong>{fmtInt(row.value)}</strong>
          </button>
        ))}
        {!visible.length && <WidgetState emptyText={query ? "Ничего не найдено. Измените поисковый запрос." : "За выбранный период данных нет"} />}
      </div>
      {selectedRow && <div className="ad-selection-detail"><span>Выбрано</span><strong title={selectedRow.label}>{selectedRow.label}</strong><span>{fmtInt(selectedRow.value)} · {fmtDecimal(selectedRow.value / total * 100, 1)}% списка</span></div>}
    </div>
  );
}

function AgeBars({ rows, selected, onSelect }: { rows: { label: string; visits: number }[]; selected: string; onSelect: (label: string) => void }) {
  const max = Math.max(...rows.map((row) => row.visits), 0) || 1;
  return (
    <div className="ad-age-bars" role="group" aria-label="Возрастные группы">
      {rows.map((row, index) => (
        <button type="button" key={row.label} className={selected === row.label ? "is-selected" : ""} onClick={() => onSelect(selected === row.label ? "" : row.label)} aria-pressed={selected === row.label}>
          <span className="ad-age-value">{fmtInt(row.visits)}</span>
          <span className="ad-age-track"><span style={{ height: `${Math.max(4, row.visits / max * 100)}%`, background: COLORS[index % COLORS.length] }} /></span>
          <span className="ad-age-label">{row.label}</span>
        </button>
      ))}
    </div>
  );
}

export function AdSocialWidget() {
  const { periodLabel, date1, date2 } = useAdStatistics();
  const [metric, setMetric] = useState("followers");
  const days = daysInclusive(date1, date2);
  const socials = [
    { name: "ВКонтакте", followers: 26472, reach: 94120, color: "#4c91e8" },
    { name: "Telegram", followers: 13911, reach: 68740, color: "#20ad9b" },
    { name: "YouTube", followers: 6524, reach: 43680, color: "#d56060" },
    { name: "Дзен", followers: 5093, reach: 32750, color: "#e5a83b" },
  ];
  return (
    <WidgetFrame title="Подписчики и охват" icon="social" source="Демо" footer={`${periodLabel} · соцсети`}>
      <Segmented label="Показатель соцсетей" value={metric} onChange={setMetric} options={[{ value: "followers", label: "Подписчики" }, { value: "reach", label: "Охват" }]} />
      <div className="ad-social-grid">{socials.map((social, index) => {
        const value = metric === "followers" ? social.followers : social.reach;
        return <div className="ad-social-item" key={social.name}><span className="ad-social-name"><i style={{ background: social.color }} />{social.name}</span><strong>{fmtInt(value)}</strong><span>{metric === "followers" ? "подписчиков" : "охват"}</span><Sparkline data={genSeries(42 + index, days, value * 0.7, value)} color={social.color} /></div>;
      })}</div>
    </WidgetFrame>
  );
}

export function AdExpensesWidget() {
  const { periodLabel, date1, date2 } = useAdStatistics();
  const [metric, setMetric] = useState("both");
  const days = daysInclusive(date1, date2);
  const dates = demoDates(days);
  const expenses = genSeries(52, days, 8, 30);
  const sessions = genSeries(53, days, 200, 480);
  const series = metric === "expenses" ? [expenses] : metric === "traffic" ? [sessions] : [expenses, sessions];
  const colors = metric === "expenses" ? ["#6e5ac7"] : metric === "traffic" ? ["#20ad9b"] : ["#6e5ac7", "#20ad9b"];
  return (
    <WidgetFrame title="Расходы и трафик" icon="money" source="Демо" footer={`${periodLabel} · рекламные кабинеты`}>
      <Segmented label="Показатель расходов и трафика" value={metric} onChange={setMetric} options={[{ value: "both", label: "Вместе" }, { value: "expenses", label: "Расходы" }, { value: "traffic", label: "Трафик" }]} />
      <div className="ad-demo-kpis"><div><span>Расходы</span><strong>{fmtInt(expenses.reduce((sum, value) => sum + value, 0))} тыс. ₽</strong></div><div><span>Сеансы</span><strong>{fmtInt(sessions.reduce((sum, value) => sum + value, 0))}</strong></div></div>
      <LineChart seriesList={series} dates={dates} colors={colors} area={metric !== "both"} ticks={5} />
    </WidgetFrame>
  );
}

export function AdChannelsWidget() {
  const [top, setTop] = useState("5");
  const [selected, setSelected] = useState("");
  return (
    <RealWidget title="Каналы и источники" icon="sources" isEmpty={(data) => !data.sources?.length}>
      {(data) => {
        const rows = data.sources.slice(0, Number(top)).map((row: any) => ({ name: row.name, value: row.visits }));
        const selectedRow = rows.find((row: { name: string; value: number }) => row.name === selected);
        return <><Segmented label="Количество источников" value={top} onChange={setTop} options={[{ value: "5", label: "Топ-5" }, { value: "10", label: "Топ-10" }]} /><RankList rows={rows} selected={selected} onSelect={setSelected} />{selectedRow && <div className="ad-selection-detail"><span>Выбран источник</span><strong>{selectedRow.name}</strong><span>{fmtInt(selectedRow.value)} визитов</span></div>}</>;
      }}
    </RealWidget>
  );
}

export function AdCacWidget() {
  const { periodLabel, date1, date2 } = useAdStatistics();
  const [metric, setMetric] = useState("cac");
  const values: Record<string, { value: string; label: string; delta: string }> = {
    cac: { value: "15 085 ₽", label: "стоимость привлечения клиента", delta: "−29,9%" },
    lead: { value: "1 402 ₽", label: "стоимость лида", delta: "−12,4%" },
  };
  const current = values[metric];
  return (
    <WidgetFrame title="Стоимость привлечения" icon="money" source="Демо" footer={periodLabel}>
      <Segmented label="Метрика стоимости" value={metric} onChange={setMetric} options={[{ value: "cac", label: "CAC" }, { value: "lead", label: "Цена лида" }]} />
      <div className="ad-kpi-panel"><span className="ad-kpi-value">{current.value}</span><span className="ad-delta is-good">{current.delta}</span><span className="ad-kpi-caption">{current.label}</span></div>
      <Sparkline data={genSeries(61, daysInclusive(date1, date2), 30, 80)} color="#6e5ac7" />
    </WidgetFrame>
  );
}

export function AdLeadsWidget() {
  const { periodLabel } = useAdStatistics();
  const [status, setStatus] = useState("all");
  const values: Record<string, number> = { all: 10753, active: 4820, won: 3186 };
  const value = values[status];
  const goal = 12903;
  return (
    <WidgetFrame title="Лиды" icon="leads" source="Демо" footer={`${periodLabel} · план ${fmtInt(goal)}`}>
      <Segmented label="Статус лидов" value={status} onChange={setStatus} options={[{ value: "all", label: "Все" }, { value: "active", label: "В работе" }, { value: "won", label: "Закрыты" }]} />
      <div className="ad-kpi-panel"><span className="ad-kpi-value">{fmtInt(value)}</span><span className="ad-kpi-caption">{fmtDecimal(value / goal * 100, 1)}% от плана</span></div>
      <ProgressBar value={value} max={goal} color="#6e5ac7" />
    </WidgetFrame>
  );
}

export function AdDomainsWidget() {
  const [metric, setMetric] = useState("visits");
  return (
    <RealWidget title="Трафик сайта" icon="traffic" isEmpty={(data) => !data.summary}>
      {(data) => {
        const stats = [
          { key: "visits", label: "Визиты", color: "#4c91e8" },
          { key: "users", label: "Посетители", color: "#e5a83b" },
          { key: "pageviews", label: "Просмотры", color: "#20ad9b" },
        ];
        const active = stats.find((stat) => stat.key === metric) || stats[0];
        const daily = data.daily || [];
        return <>
          <div className="ad-traffic-stats">{stats.map((stat) => {
            const value = data.summary[stat.key] || 0;
            const previous = data.summary[`${stat.key}Prev`] || 0;
            const delta = pctDelta(value, previous);
            return <button type="button" key={stat.key} className={`ad-traffic-stat ${metric === stat.key ? "is-active" : ""}`} onClick={() => setMetric(stat.key)} aria-pressed={metric === stat.key}><strong style={{ color: stat.color }}>{fmtInt(value)}</strong><span>{stat.label}{delta && <b className={delta.startsWith("+") ? "is-good" : "is-bad"}>{delta}</b>}</span></button>;
          })}</div>
          <LineChart seriesList={[daily.map((row: any) => row[metric] || 0)]} dates={daily.map((row: any) => row.date)} colors={[active.color]} area />
          {data.perCounter?.length > 1 && <div className="ad-counter-list">{data.perCounter.map((row: any) => <div key={row.name}><span>Счётчик {row.name}</span><strong>{fmtInt(row.visits)}</strong></div>)}</div>}
          <div className="ad-chart-caption">На графике: {active.label.toLocaleLowerCase("ru-RU")} по дням</div>
        </>;
      }}
    </RealWidget>
  );
}

export function AdConversionsWidget() {
  const { periodLabel, date1, date2 } = useAdStatistics();
  const [metric, setMetric] = useState("rate");
  const config: Record<string, { value: string; label: string; color: string }> = {
    rate: { value: "4,8%", label: "конверсия визита в целевое действие", color: "#ee74a5" },
    goals: { value: "12 842", label: "целевых действий", color: "#6e5ac7" },
    visits: { value: "267 542", label: "визитов с целевыми действиями", color: "#20ad9b" },
  };
  const current = config[metric];
  return (
    <WidgetFrame title="Конверсии сайта" icon="conversion" source="Демо" footer={periodLabel}>
      <Segmented label="Показатель конверсий" value={metric} onChange={setMetric} options={[{ value: "rate", label: "CR" }, { value: "goals", label: "Цели" }, { value: "visits", label: "Визиты" }]} />
      <div className="ad-kpi-panel"><span className="ad-kpi-value" style={{ color: current.color }}>{current.value}</span><span className="ad-delta is-good">+0,6 п.п.</span><span className="ad-kpi-caption">{current.label}</span></div>
      <Sparkline data={genSeries(54, daysInclusive(date1, date2), 10, 40)} color={current.color} />
    </WidgetFrame>
  );
}

export function AdDemographicsWidget() {
  const [selected, setSelected] = useState("");
  return (
    <RealWidget title="Возраст аудитории" icon="age" isEmpty={(data) => !data.ages?.length} emptyText="Метрика не вернула возрастные группы за этот период">
      {(data) => {
        const total = data.ages.reduce((sum: number, row: any) => sum + row.visits, 0) || 1;
        const selectedRow = data.ages.find((row: any) => row.label === selected);
        return <><AgeBars rows={data.ages} selected={selected} onSelect={setSelected} /><div className="ad-selection-detail"><span>{selectedRow ? `Возраст ${selectedRow.label}` : "Вся аудитория"}</span><strong>{fmtInt(selectedRow?.visits ?? total)}</strong><span>{selectedRow ? `${fmtDecimal(selectedRow.visits / total * 100, 1)}% визитов` : "Выберите группу для детализации"}</span></div></>;
      }}
    </RealWidget>
  );
}

export function AdGeoWidget() {
  const [view, setView] = useState("countries");
  const [top, setTop] = useState("5");
  const [selected, setSelected] = useState("");
  return (
    <RealWidget title="География аудитории" icon="geo" isEmpty={(data) => !data.geo?.length && !data.cities?.length}>
      {(data) => {
        const source = view === "countries" ? data.geo || [] : data.cities || [];
        const rows = source.slice(0, Number(top)).map((row: any) => ({ name: row.name, value: row.visits }));
        return <><div className="ad-widget-options"><Segmented label="Уровень географии" value={view} onChange={(value) => { setView(value); setSelected(""); }} options={[{ value: "countries", label: "Страны" }, { value: "cities", label: "Города" }]} /><Segmented label="Количество строк географии" value={top} onChange={setTop} options={[{ value: "5", label: "Топ-5" }, { value: "10", label: "Топ-10" }]} /></div>{rows.length ? <RankList rows={rows} selected={selected} onSelect={setSelected} /> : <WidgetState emptyText="Нет данных по городам за выбранный период" />}{selected && <div className="ad-selection-detail"><span>Выбрано</span><strong>{selected}</strong></div>}</>;
      }}
    </RealWidget>
  );
}

function EngagementWidget({ title, icon, valueKey, format, color, invert = false }: { title: string; icon: IconName; valueKey: string; format: (value: number) => string; color: string; invert?: boolean }) {
  const [view, setView] = useState("current");
  return (
    <RealWidget title={title} icon={icon} isEmpty={(data) => !data.summary}>
      {(data) => {
        const current = view === "current";
        const value = data.summary[current ? valueKey : `${valueKey}Prev`] || 0;
        const delta = current ? pctDelta(value, data.summary[`${valueKey}Prev`] || 0) : "";
        const good = invert ? delta.startsWith("-") : delta.startsWith("+");
        const spark = (data.daily || []).map((row: any) => row[valueKey] || 0);
        return <><Segmented label={`${title}: период`} value={view} onChange={setView} options={[{ value: "current", label: "Текущий" }, { value: "previous", label: "Прошлый" }]} /><div className="ad-kpi-panel"><span className="ad-kpi-value">{format(value)}</span>{delta && <span className={`ad-delta ${good ? "is-good" : "is-bad"}`}>{delta.startsWith("-") ? "▼" : "▲"} {delta.replace(/^[-+]/, "")}</span>}<span className="ad-kpi-caption">{current ? "к предыдущему периоду" : "предыдущий аналогичный период"}</span></div>{current ? <Sparkline data={spark.length ? spark : [value]} color={color} /> : <div className="ad-previous-note">Вернитесь к текущему периоду, чтобы увидеть дневную динамику.</div>}</>;
      }}
    </RealWidget>
  );
}

export function AdDurationWidget() {
  return <EngagementWidget title="Время на сайте" icon="time" valueKey="avgSessionDuration" format={fmtDuration} color="#6e5ac7" />;
}

export function AdDepthWidget() {
  return <EngagementWidget title="Глубина просмотра" icon="depth" valueKey="pageDepth" format={(value) => fmtDecimal(value)} color="#ee74a5" />;
}

export function AdBounceWidget() {
  return <EngagementWidget title="Отказы" icon="bounce" valueKey="bounceRate" format={(value) => `${fmtDecimal(value)}%`} color="#20ad9b" invert />;
}

export function AdAttendanceWidget() {
  const [enabled, setEnabled] = useState<Set<string>>(() => new Set(["visits", "users", "pageviews"]));
  const metrics = [
    { key: "visits", name: "Визиты", color: COLORS[0] },
    { key: "users", name: "Посетители", color: COLORS[1] },
    { key: "pageviews", name: "Просмотры", color: COLORS[2] },
  ];
  const toggle = (key: string) => setEnabled((previous) => {
    const next = new Set(previous);
    if (next.has(key)) next.delete(key); else next.add(key);
    return next;
  });
  return (
    <RealWidget title="Посещаемость сайта" icon="users" isEmpty={(data) => !data.daily?.length}>
      {(data) => {
        const active = metrics.filter((metric) => enabled.has(metric.key));
        const series = active.map((metric) => ({ name: metric.name, color: metric.color, values: data.daily.map((row: any) => row[metric.key] || 0) }));
        return <>
          <div className="ad-metric-toggles" role="group" aria-label="Метрики посещаемости">{metrics.map((metric) => <button type="button" key={metric.key} className={enabled.has(metric.key) ? "is-active" : ""} aria-pressed={enabled.has(metric.key)} onClick={() => toggle(metric.key)}><i style={{ background: metric.color }} />{metric.name}<strong>{fmtInt(data.daily.reduce((sum: number, row: any) => sum + (row[metric.key] || 0), 0))}</strong></button>)}</div>
          {series.length ? <GroupedBars dates={data.daily.map((row: any) => row.date)} series={series} /> : <div className="ad-widget-state"><span>Все метрики скрыты</span><button type="button" onClick={() => setEnabled(new Set(metrics.map((metric) => metric.key)))}>Показать все</button></div>}
        </>;
      }}
    </RealWidget>
  );
}

export function AdSourcesDailyWidget() {
  const [top, setTop] = useState("5");
  const [hidden, setHidden] = useState<Set<string>>(() => new Set());
  const toggle = (name: string) => setHidden((previous) => {
    const next = new Set(previous);
    if (next.has(name)) next.delete(name); else next.add(name);
    return next;
  });
  return (
    <RealWidget title="Источники трафика" icon="sources" isEmpty={(data) => !data.sourcesDaily?.series?.length}>
      {(data) => {
        const all = data.sourcesDaily.series.slice(0, Number(top)).map((row: any, index: number) => ({ ...row, color: COLORS[index % COLORS.length] }));
        const active = all.filter((row: any) => !hidden.has(row.name));
        const items = all.map((row: any) => ({ name: row.name, value: row.values.reduce((sum: number, value: number) => sum + value, 0), color: row.color }));
        const total = items.filter((item: { name: string }) => !hidden.has(item.name)).reduce((sum: number, item: { value: number }) => sum + item.value, 0);
        const delta = data.summary ? pctDelta(data.summary.visits, data.summary.visitsPrev) : "";
        return <>
          <div className="ad-widget-options"><Segmented label="Количество источников на графике" value={top} onChange={setTop} options={[{ value: "5", label: "Топ-5" }, { value: "10", label: "Топ-10" }]} />{hidden.size > 0 && <button type="button" className="ad-reset-button" onClick={() => setHidden(new Set())}>Показать все</button>}</div>
          <div className="ad-sources-summary"><strong>{fmtInt(total)}</strong><span>визитов у видимых источников</span>{delta && <span className={`ad-delta ${delta.startsWith("+") ? "is-good" : "is-bad"}`}>{delta}</span>}</div>
          {active.length ? <LineChart seriesList={active.map((row: any) => row.values)} dates={data.sourcesDaily.dates || []} colors={active.map((row: any) => row.color)} ticks={5} /> : <WidgetState emptyText="Все источники скрыты. Нажмите «Показать все»." />}
          <Legend items={items} hidden={hidden} onToggle={toggle} />
        </>;
      }}
    </RealWidget>
  );
}

export function AdPagesWidget() {
  return <RealWidget title="Просмотры URL" icon="pages" isEmpty={(data) => !data.pages?.length}>{(data) => <ReportTable rows={data.pages.map((row: any) => ({ label: row.url, value: row.views }))} leftHeader="Адрес страницы" />}</RealWidget>;
}

export function AdTitlesWidget() {
  return <RealWidget title="Заголовки страниц" icon="pages" isEmpty={(data) => !data.titles?.length}>{(data) => <ReportTable rows={data.titles.map((row: any) => ({ label: row.title, value: row.views }))} leftHeader="Заголовок страницы" />}</RealWidget>;
}

export function AdDevicesWidget() {
  const [selected, setSelected] = useState("");
  return (
    <RealWidget title="Устройства" icon="devices" isEmpty={(data) => !data.devices?.length} emptyText="Нет данных об устройствах за выбранный период">
      {(data) => {
        const rows = data.devices.map((row: any) => ({ name: row.name, value: row.visits }));
        const total = rows.reduce((sum: number, row: { value: number }) => sum + row.value, 0) || 1;
        const selectedRow = rows.find((row: { name: string }) => row.name === selected);
        return <><div className="ad-kpi-panel ad-kpi-panel-compact"><span className="ad-kpi-value">{fmtInt(selectedRow?.value ?? total)}</span><span className="ad-kpi-caption">{selectedRow ? `${selectedRow.name} · ${fmtDecimal(selectedRow.value / total * 100, 1)}%` : "визитов со всех устройств"}</span></div><RankList rows={rows} selected={selected} onSelect={setSelected} /></>;
      }}
    </RealWidget>
  );
}

export function AdNewVisitorsWidget() {
  const [view, setView] = useState("all");
  return (
    <RealWidget title="Новые и вернувшиеся" icon="users" isEmpty={(data) => !data.newVisitors?.length} emptyText="Нет данных о типе посетителя за выбранный период">
      {(data) => {
        const totals: Record<string, number> = { new: 0, returning: 0, unknown: 0 };
        data.newVisitors.forEach((row: any) => { totals[row.key || "unknown"] = (totals[row.key || "unknown"] || 0) + row.visits; });
        const total = totals.new + totals.returning + totals.unknown;
        const value = view === "all" ? total : totals[view] || 0;
        const label = view === "new" ? "новых посетителей" : view === "returning" ? "вернувшихся посетителей" : "визитов за период";
        const rows = [{ name: "Новые", value: totals.new }, { name: "Вернувшиеся", value: totals.returning }];
        return <><Segmented label="Тип посетителей" value={view} onChange={setView} options={[{ value: "all", label: "Все" }, { value: "new", label: "Новые" }, { value: "returning", label: "Вернувшиеся" }]} /><div className="ad-kpi-panel ad-kpi-panel-compact"><span className="ad-kpi-value">{fmtInt(value)}</span><span className="ad-kpi-caption">{label}{view !== "all" && total ? ` · ${fmtDecimal(value / total * 100, 1)}%` : ""}</span></div><RankList rows={rows} selected={view === "all" ? "" : view === "new" ? "Новые" : "Вернувшиеся"} onSelect={(name) => setView(!name ? "all" : name === "Новые" ? "new" : "returning")} />{totals.unknown > 0 && <div className="ad-chart-caption">Не определено Метрикой: {fmtInt(totals.unknown)} визитов</div>}</>;
      }}
    </RealWidget>
  );
}

export function AdLandingPagesWidget() {
  return <RealWidget title="Страницы входа" icon="pages" isEmpty={(data) => !data.landingPages?.length} emptyText="Нет данных о страницах входа за выбранный период">{(data) => <ReportTable rows={data.landingPages.map((row: any) => ({ label: row.url, value: row.visits }))} leftHeader="Первая страница визита" metricLabel="Визиты" />}</RealWidget>;
}

export function AdNewsViewsWidget() {
  const { period, date1, date2, periodLabel } = useAdStatistics();
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [version, setVersion] = useState(0);
  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(false);
    const fallbackPeriod = period === "today" ? "today" : period === "week" ? "7d" : "month";
    api.news.newsViewsTop(fallbackPeriod, date1, date2)
      .then((result: any) => { if (alive) setRows(Array.isArray(result) ? result : []); })
      .catch(() => { if (alive) { setRows([]); setError(true); } })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [period, date1, date2, version]);
  return (
    <WidgetFrame title="Просмотры новостей" icon="news" source="CRM" footer={`${periodLabel} · журнал просмотров`}>
      {loading ? <WidgetState loading /> : error ? <WidgetState error onRetry={() => setVersion((value) => value + 1)} /> : <ReportTable rows={rows.map((row) => ({ label: row.title, value: row.views }))} leftHeader="Новость" />}
    </WidgetFrame>
  );
}
