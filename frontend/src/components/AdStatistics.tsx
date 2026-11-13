import { useEffect, useMemo, useState } from "react";
import { api } from "../api/client";

/**
 * Виджеты вкладки «Рекламная статистика» страницы директора.
 * Каждый виджет — отдельный компонент, перемещается в общей dnd-сетке
 * директора (Director.tsx). Пока демо-данные (детерминированный
 * генератор); каждый виджет дальше настраивается отдельно
 * (источник данных, период, метрики) внутри своего блока ниже.
 */

// ---------- Генератор детерминированных демо-рядов ----------
function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1103515245 + 12345) % 2147483648;
    return s / 2147483648;
  };
}

function genSeries(seed: number, n: number, min: number, max: number): number[] {
  const r = seededRandom(seed);
  return Array.from({ length: n }, () => min + r() * (max - min));
}

// ---------- Плавная линия: Catmull-Rom -> кубические Безье ----------
type Pt = { x: number; y: number };

function smoothPath(pts: Pt[]): string {
  if (pts.length === 0) return "";
  if (pts.length < 3) return `M${pts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" L")}`;
  let d = `M${pts[0].x.toFixed(1)},${pts[0].y.toFixed(1)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] || p2;
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C${c1x.toFixed(1)},${c1y.toFixed(1)} ${c2x.toFixed(1)},${c2y.toFixed(1)} ${p2.x.toFixed(1)},${p2.y.toFixed(1)}`;
  }
  return d;
}

// ---------- SVG-графики (без внешних зависимостей) ----------
function Sparkline({ data, color, height = 36 }: { data: number[]; color: string; height?: number }) {
  const w = 100;
  const h = height;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const norm = (v: number) => (max === min ? h / 2 : h - 2 - ((v - min) / (max - min)) * (h - 4));
  const step = w / (data.length - 1);
  const pts: Pt[] = data.map((v, i) => ({ x: i * step, y: norm(v) }));
  const line = smoothPath(pts);
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{ width: "100%", height: h, display: "block", overflow: "visible" }}>
      {line && <path d={`${line} L${w},${h} L0,${h} Z`} fill={color} opacity={0.08} stroke="none" />}
      {line && <path d={line} fill="none" stroke={color} strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" />}
    </svg>
  );
}

function BarLineChart({ bars, line, height = 150 }: { bars: number[]; line: number[]; height?: number }) {
  const w = 320;
  const h = height;
  const padB = 16;
  const plotH = h - padB;
  const maxBar = Math.max(...bars) * 1.15 || 1;
  const maxLine = Math.max(...line) * 1.15 || 1;
  const step = w / bars.length;
  const bw = step * 0.55;
  const linePts: Pt[] = line.map((v, i) => ({ x: i * step + step / 2, y: plotH - (v / maxLine) * plotH }));
  const linePath = smoothPath(linePts);
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{ width: "100%", height: h, display: "block", overflow: "visible" }}>
      {bars.map((v, i) => {
        const bh = (v / maxBar) * plotH;
        return (
          <rect key={i} x={(i * step + (step - bw) / 2).toFixed(1)} y={(plotH - bh).toFixed(1)}
            width={bw.toFixed(1)} height={bh.toFixed(1)} rx={2} fill="#007AFF" opacity={0.7} />
        );
      })}
      {linePath && <path d={linePath} fill="none" stroke="#f59e0b" strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" />}
      {linePts.map((p, i) => (
        <circle key={i} cx={p.x.toFixed(1)} cy={p.y.toFixed(1)} r={1.5} fill="#f59e0b" />
      ))}
    </svg>
  );
}

function MultiLineChart({ seriesList, labels, colors, height = 150 }: {
  seriesList: number[][];
  labels: string[];
  colors: string[];
  height?: number;
}) {
  const w = 320;
  const h = height;
  const all = seriesList.flat();
  const min = Math.min(...all);
  const max = Math.max(...all);
  const range = max - min || 1;
  const n = seriesList[0]?.length || 1;
  const step = w / (n - 1);
  const norm = (v: number) => h - 4 - ((v - min) / range) * (h - 8);
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{ width: "100%", height: h, display: "block", overflow: "visible" }}>
      {seriesList.map((data, si) => {
        const pts: Pt[] = data.map((v, i) => ({ x: i * step, y: norm(v) }));
        const d = smoothPath(pts);
        return d ? (
          <path key={si} d={d} fill="none" stroke={colors[si]} strokeWidth={1.5}
            strokeLinejoin="round" strokeLinecap="round" opacity={0.9} />
        ) : null;
      })}
      <g>
        {labels.map((l, i) => (
          <g key={i} transform={`translate(${i * (w / labels.length)}, 0)`}>
            <rect width={10} height={10} fill={colors[i]} rx={2} />
            <text x={14} y={9} fontSize={9} fill="var(--text-muted)">{l}</text>
          </g>
        ))}
      </g>
    </svg>
  );
}

function VerticalBars({ data, color = "#60a5fa", height = 150 }: { data: { label: string; value: number }[]; color?: string; height?: number }) {
  const w = 320;
  const h = height;
  const padB = 14;
  const padT = 14;
  const plotH = h - padB - padT;
  const max = Math.max(...data.map((d) => d.value)) * 1.1 || 1;
  const step = w / data.length;
  const bw = step * 0.5;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{ width: "100%", height: h, display: "block" }}>
      {data.map((d, i) => {
        const bh = (d.value / max) * plotH;
        const x = i * step + (step - bw) / 2;
        return (
          <g key={i}>
            <rect x={x.toFixed(1)} y={(padT + plotH - bh).toFixed(1)} width={bw.toFixed(1)} height={bh.toFixed(1)} rx={3} fill={color} opacity={0.85} />
            <text x={(x + bw / 2).toFixed(1)} y={(padT + plotH - bh - 3).toFixed(1)} fontSize={8} fill="var(--text-secondary)" textAnchor="middle">
              {d.value >= 1000 ? `${(d.value / 1000).toFixed(1)}k` : d.value}
            </text>
            <text x={(x + bw / 2).toFixed(1)} y={h - 3} fontSize={8} fill="var(--text-muted)" textAnchor="middle">{d.label}</text>
          </g>
        );
      })}
    </svg>
  );
}

function ProgressBar({ value, max, color = "#007AFF" }: { value: number; max: number; color?: string }) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  return (
    <div style={{ width: "100%", height: 10, borderRadius: 6, background: "var(--bg-hover)", overflow: "hidden" }}>
      <div style={{ width: `${pct}%`, height: "100%", borderRadius: 6, background: color, transition: "width 0.4s" }} />
    </div>
  );
}

// ---------- Шапка виджета ----------
function WidgetHeader({ title, badge, badgeBg, badgeColor, source = "demo" }: {
  title: string;
  badge?: string;
  badgeBg?: string;
  badgeColor?: string;
  source?: "demo" | "metrika";
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      {badge && (
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            minWidth: 20,
            height: 20,
            padding: "0 6px",
            borderRadius: 6,
            background: badgeBg || "#007AFF",
            color: badgeColor || "#fff",
            fontSize: 11,
            fontWeight: 700,
          }}
        >
          {badge}
        </span>
      )}
      <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {title}
      </span>
      <span
        title={source === "metrika" ? "Данные Яндекс Метрики" : "Демо-данные — виджет будет настроен отдельно"}
        style={{
          marginLeft: "auto",
          flexShrink: 0,
          fontSize: 10,
          padding: "2px 7px",
          borderRadius: 8,
          background: source === "metrika" ? "#dcfce7" : "#fef3c7",
          color: source === "metrika" ? "#166534" : "#92400e",
          fontWeight: 600,
        }}
      >
        {source === "metrika" ? "Метрика" : "Демо"}
      </span>
    </div>
  );
}

function KpiNumber({ value, unit, delta, color }: { value: string; unit?: string; delta?: string; color?: string }) {
  return (
    <div style={{ display: "flex", alignItems: "baseline", gap: 6, flexWrap: "wrap" }}>
      <span style={{ fontSize: 26, fontWeight: 800, color: color || "var(--text-primary)", letterSpacing: -0.5 }}>{value}</span>
      {unit && <span style={{ fontSize: 13, color: "var(--text-muted)" }}>{unit}</span>}
      {delta && (
        <span style={{ fontSize: 12, fontWeight: 600, color: delta.startsWith("+") ? "#16a34a" : "#dc2626" }}>{delta}</span>
      )}
    </div>
  );
}

// ---------- Демо-данные (заменяются реальными источниками при настройке виджетов) ----------
const DEMO_SEED = 42;

// ---------- Реальные данные Яндекс Метрики (плагин «Яндекс Метрика») ----------
// connected: null — загрузка, false — плагин не подключён (демо-фолбэк), true — есть данные
function useMetrikaSummary() {
  const [data, setData] = useState<any | null>(null);
  const [connected, setConnected] = useState<boolean | null>(null);
  useEffect(() => {
    let alive = true;
    api.yandexMetrika
      .getSummary()
      .then((d) => {
        if (!alive) return;
        setConnected(!!d);
        setData(d);
      })
      .catch(() => {
        if (alive) setConnected(false);
      });
    return () => {
      alive = false;
    };
  }, []);
  return { data, connected };
}

function fmtInt(n: number): string {
  return Math.round(n || 0).toLocaleString("ru-RU");
}

function pctDelta(cur: number, prev: number): string {
  if (!prev) return "";
  const d = ((cur - prev) / prev) * 100;
  return `${d > 0 ? "+" : ""}${d.toFixed(1)}%`;
}

function buildDemoData(seed: number) {
  return {
    socials: [
      { label: "ВКонтакте", value: "26 472", sub: "подписчики", color: "#0077FF", spark: genSeries(seed + 1, 12, 20, 30) },
      { label: "Telegram", value: "13 911", sub: "подписчики", color: "#229ED9", spark: genSeries(seed + 2, 12, 10, 20) },
      { label: "YouTube", value: "6 524", sub: "подписчики", color: "#FF0000", spark: genSeries(seed + 3, 12, 5, 9) },
      { label: "Дзен", value: "5 093", sub: "подписчики", color: "#0ea5e9", spark: genSeries(seed + 4, 12, 3, 7) },
    ],
    expenses: genSeries(seed + 10, 30, 8, 30),
    sessions: genSeries(seed + 11, 30, 200, 480),
    conversions: genSeries(seed + 12, 30, 10, 40),
    channels: [
      { name: "Яндекс.Директ", color: "#FFCC00", kpi: "128 430", delta: "+13,4%", spark: genSeries(seed + 13, 14, 40, 100) },
      { name: "Google Ads", color: "#4285F4", kpi: "86 210", delta: "+8,2%", spark: genSeries(seed + 14, 14, 30, 80) },
      { name: "ВКонтакте", color: "#0077FF", kpi: "45 322", delta: "-2,1%", spark: genSeries(seed + 15, 14, 20, 60) },
      { name: "Telegram Ads", color: "#229ED9", kpi: "18 765", delta: "+24,9%", spark: genSeries(seed + 16, 14, 8, 40) },
    ],
    trafficSeries: [
      { label: "welans.ru", color: "#007AFF", data: genSeries(seed + 20, 30, 5, 30) },
      { label: "welans.click", color: "#10b981", data: genSeries(seed + 21, 30, 8, 35) },
      { label: "welans.cc", color: "#f59e0b", data: genSeries(seed + 22, 30, 3, 22) },
    ],
    leads: { value: 10_753, goal: 12_903, period: "за месяц" },
    cac: { value: "15 085 ₽", delta: "-29,99%", color: "#16a34a" },
    demographics: [
      { label: "18–24", value: 4300 }, { label: "25–34", value: 16200 }, { label: "35–44", value: 14800 },
      { label: "45–54", value: 8200 }, { label: "55–64", value: 3900 }, { label: "65+", value: 1700 },
    ],
  };
}

// ---------- Виджеты (каждый — отдельный блок в dnd-сетке директора) ----------
export function AdSocialWidget() {
  const demo = useMemo(() => buildDemoData(DEMO_SEED), []);
  return (
    <>
      <WidgetHeader title="Подписчики и охват" badge="S" badgeBg="#0077FF" />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        {demo.socials.map((s) => (
          <div key={s.label} style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ width: 18, height: 18, borderRadius: 5, background: s.color, flexShrink: 0 }} />
              <span style={{ fontSize: 11, color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.label}</span>
            </div>
            <div style={{ fontSize: 20, fontWeight: 800, color: "var(--text-primary)", letterSpacing: -0.5 }}>{s.value}</div>
            <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{s.sub}</div>
            <Sparkline data={s.spark} color={s.color} height={26} />
          </div>
        ))}
      </div>
    </>
  );
}

export function AdExpensesWidget() {
  const demo = useMemo(() => buildDemoData(DEMO_SEED), []);
  return (
    <>
      <WidgetHeader title="Расходы на рекламу и трафик сайта" badge="₽" badgeBg="#f59e0b" />
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", fontSize: 11, color: "var(--text-muted)" }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
          <span style={{ width: 9, height: 9, borderRadius: 2, background: "#007AFF", display: "inline-block" }} /> Расходы, тыс. ₽
        </span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
          <span style={{ width: 9, height: 9, borderRadius: 2, background: "#f59e0b", display: "inline-block" }} /> Сеансы
        </span>
        <span style={{ marginLeft: "auto" }}>последние 30 дней</span>
      </div>
      <BarLineChart bars={demo.expenses} line={demo.sessions} />
    </>
  );
}

export function AdChannelsWidget() {
  const demo = useMemo(() => buildDemoData(DEMO_SEED), []);
  const { data, connected } = useMetrikaSummary();

  if (connected && data?.sources?.length) {
    const total = data.sources.reduce((a: number, s: any) => a + (s.visits || 0), 0) || 1;
    const palette = ["#FFCC00", "#4285F4", "#0077FF", "#229ED9", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899"];
    return (
      <>
        <WidgetHeader title="Источники трафика" badge="▶" badgeBg="#10b981" source="metrika" />
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {data.sources.slice(0, 6).map((s: any, i: number) => {
            const share = Math.round((s.visits / total) * 100);
            const color = palette[i % palette.length];
            return (
              <div key={s.name}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                  <span style={{ width: 10, height: 10, borderRadius: 3, background: color, flexShrink: 0 }} />
                  <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.name}</span>
                  <span style={{ fontSize: 13, fontWeight: 800, color: "var(--text-primary)" }}>{fmtInt(s.visits)}</span>
                  <span style={{ fontSize: 11, color: "var(--text-muted)", minWidth: 34, textAlign: "right" }}>{share}%</span>
                </div>
                <ProgressBar value={s.visits} max={total} color={color} />
              </div>
            );
          })}
        </div>
        <div style={{ fontSize: 11, color: "var(--text-muted)" }}>за 30 дней · Яндекс Метрика</div>
      </>
    );
  }

  return (
    <>
      <WidgetHeader title="Каналы: клики" badge="▶" badgeBg="#10b981" />
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {demo.channels.map((c) => (
          <div key={c.name}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
              <span style={{ width: 10, height: 10, borderRadius: 3, background: c.color, flexShrink: 0 }} />
              <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.name}</span>
              <span style={{ fontSize: 13, fontWeight: 800, color: "var(--text-primary)" }}>{c.kpi}</span>
              <span style={{ fontSize: 11, fontWeight: 600, color: c.delta.startsWith("+") ? "#16a34a" : "#dc2626" }}>{c.delta}</span>
            </div>
            <Sparkline data={c.spark} color={c.color} height={24} />
          </div>
        ))}
      </div>
    </>
  );
}

export function AdCacWidget() {
  const demo = useMemo(() => buildDemoData(DEMO_SEED), []);
  return (
    <>
      <WidgetHeader title="Стоимость привлечения (CAC)" badge="$" badgeBg="#16a34a" />
      <KpiNumber value={demo.cac.value} delta={demo.cac.delta} />
      <div style={{ fontSize: 12, color: "var(--text-muted)" }}>за последние 30 дней</div>
    </>
  );
}

export function AdLeadsWidget() {
  const demo = useMemo(() => buildDemoData(DEMO_SEED), []);
  const leadsPct = Math.round((demo.leads.value / demo.leads.goal) * 100);
  return (
    <>
      <WidgetHeader title="Лиды за месяц" badge="◎" badgeBg="#8b5cf6" />
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 8 }}>
        <span style={{ fontSize: 30, fontWeight: 800, color: "var(--text-primary)", letterSpacing: -0.5 }}>
          {demo.leads.value.toLocaleString("ru")}
        </span>
        <span style={{ fontSize: 12, color: "var(--text-muted)", whiteSpace: "nowrap" }}>цель {demo.leads.goal.toLocaleString("ru")}</span>
      </div>
      <ProgressBar value={demo.leads.value} max={demo.leads.goal} color="#8b5cf6" />
      <div style={{ fontSize: 11, color: "var(--text-muted)" }}>выполнено {leadsPct}% плана</div>
    </>
  );
}

export function AdDomainsWidget() {
  const demo = useMemo(() => buildDemoData(DEMO_SEED), []);
  const { data, connected } = useMetrikaSummary();

  if (connected && data?.summary && data?.daily?.length) {
    const s = data.summary;
    const visits = data.daily.map((d: any) => d.visits);
    return (
      <>
        <WidgetHeader title="Трафик сайта" badge="⌁" badgeBg="#0ea5e9" source="metrika" />
        <div style={{ display: "flex", gap: 18, flexWrap: "wrap" }}>
          {[
            { label: "визиты", cur: s.visits, prev: s.visitsPrev, color: "#007AFF" },
            { label: "просмотры", cur: s.pageviews, prev: s.pageviewsPrev, color: "#10b981" },
            { label: "посетители", cur: s.users, prev: s.usersPrev, color: "#f59e0b" },
          ].map((k) => {
            const delta = pctDelta(k.cur, k.prev);
            return (
              <div key={k.label} style={{ display: "flex", flexDirection: "column", gap: 1 }}>
                <span style={{ fontSize: 20, fontWeight: 800, color: k.color, letterSpacing: -0.5 }}>{fmtInt(k.cur)}</span>
                <span style={{ fontSize: 11, color: "var(--text-muted)", display: "flex", gap: 4, alignItems: "center" }}>
                  {k.label}
                  {delta && (
                    <span style={{ fontWeight: 600, color: delta.startsWith("+") ? "#16a34a" : "#dc2626" }}>{delta}</span>
                  )}
                </span>
              </div>
            );
          })}
        </div>
        <Sparkline data={visits} color="#007AFF" height={56} />
        {data.perCounter?.length > 1 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {data.perCounter.map((c: any) => (
              <div key={c.name} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12 }}>
                <span style={{ color: "var(--text-primary)", fontWeight: 600, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>счётчик {c.name}</span>
                <span style={{ color: "var(--text-secondary)" }}>{fmtInt(c.visits)} визитов</span>
              </div>
            ))}
          </div>
        )}
        <div style={{ fontSize: 11, color: "var(--text-muted)" }}>за 30 дней · Яндекс Метрика</div>
      </>
    );
  }

  return (
    <>
      <WidgetHeader title="Посещаемость по доменам" badge="⌁" badgeBg="#0ea5e9" />
      <MultiLineChart
        seriesList={demo.trafficSeries.map((t) => t.data)}
        labels={demo.trafficSeries.map((t) => t.label)}
        colors={demo.trafficSeries.map((t) => t.color)}
      />
      <div style={{ fontSize: 11, color: "var(--text-muted)" }}>последние 30 дней · демо</div>
    </>
  );
}

export function AdConversionsWidget() {
  const demo = useMemo(() => buildDemoData(DEMO_SEED), []);
  return (
    <>
      <WidgetHeader title="Конверсии сайта" badge="C" badgeBg="#ec4899" />
      <KpiNumber value="4,8%" unit="CR" delta="+0,6 п.п." color="#ec4899" />
      <Sparkline data={demo.conversions} color="#ec4899" height={40} />
      <div style={{ fontSize: 11, color: "var(--text-muted)" }}>целевые действия / сеансы · демо</div>
    </>
  );
}

export function AdDemographicsWidget() {
  const demo = useMemo(() => buildDemoData(DEMO_SEED), []);
  const { data, connected } = useMetrikaSummary();

  if (connected && data?.ages?.length) {
    return (
      <>
        <WidgetHeader title="Возраст аудитории" badge="👥" badgeBg="#64748b" source="metrika" />
        <VerticalBars data={data.ages.map((a: any) => ({ label: a.label, value: a.visits }))} />
        <div style={{ fontSize: 11, color: "var(--text-muted)" }}>визиты за 30 дней · Яндекс Метрика</div>
      </>
    );
  }

  return (
    <>
      <WidgetHeader title="Возраст аудитории" badge="👥" badgeBg="#64748b" />
      <VerticalBars data={demo.demographics} />
      <div style={{ fontSize: 11, color: "var(--text-muted)" }}>по данным рекламных кабинетов · демо</div>
    </>
  );
}

export function AdGeoWidget() {
  const { data, connected } = useMetrikaSummary();

  if (connected && data?.geo?.length) {
    const max = Math.max(...data.geo.map((g: any) => g.visits)) || 1;
    return (
      <>
        <WidgetHeader title="География аудитории" badge="🌐" badgeBg="#0ea5e9" source="metrika" />
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {data.geo.slice(0, 7).map((g: any) => (
            <div key={g.name}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{g.name}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-primary)" }}>{fmtInt(g.visits)}</span>
              </div>
              <ProgressBar value={g.visits} max={max} color="#0ea5e9" />
            </div>
          ))}
        </div>
        <div style={{ fontSize: 11, color: "var(--text-muted)" }}>визиты за 30 дней · Яндекс Метрика</div>
      </>
    );
  }

  return (
    <>
      <WidgetHeader title="География аудитории" badge="🌐" badgeBg="#0ea5e9" />
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {[
          { name: "Россия", visits: 8120 },
          { name: "Беларусь", visits: 640 },
          { name: "Казахстан", visits: 410 },
          { name: "Украина", visits: 230 },
          { name: "Германия", visits: 95 },
        ].map((g) => {
          const max = 8120;
          return (
            <div key={g.name}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{g.name}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-primary)" }}>{fmtInt(g.visits)}</span>
              </div>
              <ProgressBar value={g.visits} max={max} color="#0ea5e9" />
            </div>
          );
        })}
      </div>
      <div style={{ fontSize: 11, color: "var(--text-muted)" }}>демо</div>
    </>
  );
}
