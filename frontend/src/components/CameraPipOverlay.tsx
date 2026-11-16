import { useEffect, useRef, useState } from "react";
import { api } from "../api/client";
import { CameraStreamImage } from "./CameraStreamImage";
import { getPipLabel, splitPipKey } from "../pip";

const STORAGE_KEY = "camera_pip_ids";
const STORAGE_WIDTH = "camera_pip_width";
const STORAGE_PANEL_WIDTH = "camera_pip_panel_width";
const STORAGE_POS = "camera_pip_position";
const DESKTOP_MIN = 1024;
const MIN_W = 160;
const HEADER_H = 25; // заголовок окна
const GAP = 10;      // отступ между окнами
const DEFAULT_ASPECT = 16 / 9; // до загрузки первого снимка

// Панель справа (режим «В панели»)
const PANEL_MIN_W = 200;
const PANEL_MAX_W = 560;
const PANEL_DEFAULT_W = 300;
const PANEL_PADDING = 10; // внутренние отступы панели по бокам

function loadPipIds(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const ids: string[] = JSON.parse(raw);
      return Array.isArray(ids) ? ids.filter((id) => typeof id === "string") : [];
    }
  } catch {}
  return [];
}

function loadWidth(): number {
  try {
    const w = parseInt(localStorage.getItem(STORAGE_WIDTH) || "", 10);
    if (Number.isFinite(w) && w >= MIN_W) return w;
  } catch {}
  return 190;
}

function clampW(w: number): number {
  const max = Math.floor(window.innerWidth * 0.45);
  return Math.max(MIN_W, Math.min(w, max));
}

// Расположение стека окон «картинка в картинке» по правому краю
// либо отдельная панель справа на всю высоту экрана
type PipPosition = "top" | "middle" | "bottom" | "panel";

const POSITIONS: { value: PipPosition; label: string }[] = [
  { value: "top", label: "Справа вверху" },
  { value: "middle", label: "Справа по центру" },
  { value: "bottom", label: "Справа внизу" },
  { value: "panel", label: "В панели" },
];

function loadPosition(): PipPosition {
  try {
    const p = localStorage.getItem(STORAGE_POS);
    if (p === "top" || p === "middle" || p === "bottom" || p === "panel") return p;
  } catch {}
  return "top";
}

function loadPanelWidth(): number {
  try {
    const w = parseInt(localStorage.getItem(STORAGE_PANEL_WIDTH) || "", 10);
    if (Number.isFinite(w) && w >= PANEL_MIN_W) return w;
  } catch {}
  return PANEL_DEFAULT_W;
}

function clampPanelW(w: number): number {
  const max = Math.min(PANEL_MAX_W, Math.floor(window.innerWidth * 0.6));
  return Math.max(PANEL_MIN_W, Math.min(w, max));
}

// Глобальный overlay «картинка в картинке» (только десктоп): маленькие окна
// камер у правого края поверх всех страниц либо отдельная панель справа.
// Расположение настраивается кнопкой ⚙: справа вверху / по центру / внизу /
// в панели. Размер окна меняется «ручкой» в левом нижнем углу —
// пропорционально картинке. Ширину панели меняет «ручка» на её левом краю,
// камеры внутри масштабируются под ширину панели. Состояние в localStorage.
export function CameraPipOverlay() {
  const [pipIds, setPipIds] = useState<string[]>(loadPipIds);
  const [cameras, setCameras] = useState<any[]>([]);
  // Локальные MJPEG-потоки — пересоздание раз в 60 с (как раньше);
  // облачные/RTSP-снапшоты — каждые 30 с (кадр закэширован на сервере,
  // повторный запрос почти бесплатный)
  const [refreshKey, setRefreshKey] = useState(0);
  const [cloudRefreshKey, setCloudRefreshKey] = useState(0);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [width, setWidth] = useState<number>(loadWidth);
  // Ширина панели (режим «В панели»)
  const [panelWidth, setPanelWidth] = useState<number>(loadPanelWidth);
  // Расположение стека окон: справа вверху / по центру / внизу / в панели
  const [position, setPosition] = useState<PipPosition>(loadPosition);
  const [posMenuOpen, setPosMenuOpen] = useState<boolean>(false);
  const [viewportH, setViewportH] = useState<number>(() => window.innerHeight);
  // Фактические пропорции снимка каждой камеры (width/height)
  const [aspects, setAspects] = useState<Record<string, number>>({});
  const [isDesktop, setIsDesktop] = useState<boolean>(
    () => typeof window !== "undefined" && window.innerWidth >= DESKTOP_MIN,
  );
  // target: "win" — «ручка» размера окна, "panel" — «ручка» ширины панели
  const dragRef = useRef<{ pointerId: number; startX: number; startW: number; target: "win" | "panel" } | null>(null);

  // Только десктоп: отслеживаем ширину окна
  useEffect(() => {
    const mq = window.matchMedia(`(min-width: ${DESKTOP_MIN}px)`);
    const onChange = () => setIsDesktop(mq.matches);
    onChange();
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  // Сохраняем размер окна
  useEffect(() => {
    try { localStorage.setItem(STORAGE_WIDTH, String(width)); } catch {}
  }, [width]);

  // Сохраняем ширину панели
  useEffect(() => {
    try { localStorage.setItem(STORAGE_PANEL_WIDTH, String(panelWidth)); } catch {}
  }, [panelWidth]);

  // Сохраняем расположение стека окон
  useEffect(() => {
    try { localStorage.setItem(STORAGE_POS, position); } catch {}
  }, [position]);

  // Отслеживаем высоту окна для позиционирования стека (центр/низ)
  useEffect(() => {
    const onResize = () => setViewportH(window.innerHeight);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const load = () => {
      api.camera.getSettings().then((list: any[]) => {
        if (!cancelled) setCameras(list);
      }).catch(() => {});
    };
    load();
    const interval = setInterval(load, 60000);
    return () => { cancelled = true; clearInterval(interval); };
  }, []);

  // Обновление снимков потока: локальные — раз в 60 с, облачные — раз в 30 с
  useEffect(() => {
    const interval = setInterval(() => setRefreshKey(Date.now()), 60000);
    const intervalCloud = setInterval(() => setCloudRefreshKey(Date.now()), 30000);
    return () => { clearInterval(interval); clearInterval(intervalCloud); };
  }, []);

  // Синхронизация состояния между вкладками и с виджетами
  useEffect(() => {
    const sync = () => setPipIds(loadPipIds());
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) sync();
      if (e.key === STORAGE_POS) setPosition(loadPosition());
      if (e.key === STORAGE_PANEL_WIDTH) setPanelWidth(loadPanelWidth());
    };
    const onToggle = (e: Event) => {
      const d = (e as CustomEvent).detail;
      const id = typeof d === "string" ? d : d?.key; // legacy: строка
      if (!id) return;
      setPipIds((prev) => {
        const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
        return next;
      });
    };
    window.addEventListener("storage", onStorage);
    window.addEventListener("camera-pip-toggle", onToggle as EventListener);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("camera-pip-toggle", onToggle as EventListener);
    };
  }, []);

  // Растяжение «ручкой» в левом нижнем углу окна: тянем влево — окно растёт
  const startResize = (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragRef.current = { pointerId: e.pointerId, startX: e.clientX, startW: width, target: "win" };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };
  // «Ручка» ширины панели на её левом краю: тянем влево — панель расширяется
  const startPanelResize = (e: React.PointerEvent) => {
    e.preventDefault();
    dragRef.current = { pointerId: e.pointerId, startX: e.clientX, startW: panelWidth, target: "panel" };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onResizeMove = (e: React.PointerEvent) => {
    const d = dragRef.current;
    if (!d || d.pointerId !== e.pointerId) return;
    const next = d.startW + (d.startX - e.clientX);
    if (d.target === "win") setWidth(clampW(next));
    else setPanelWidth(clampPanelW(next));
  };
  const endResize = (e: React.PointerEvent) => {
    if (dragRef.current?.pointerId === e.pointerId) dragRef.current = null;
  };

  const close = (id: string) => {
    setPipIds((prev) => {
      const next = prev.filter((x) => x !== id);
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  };

  // Кадр окна: локальные — живой MJPEG-поток, облачные/RTSP — снапшот по токену
  const token = localStorage.getItem("token") || "";
  const renderFrame = (w: { key: string; kind: string; id: string; label: string }, imgH: number, imgStyle: React.CSSProperties) =>
    w.kind === "local" ? (
      <CameraStreamImage
        cameraId={w.id}
        refreshKey={refreshKey}
        alt={w.label}
        onClick={() => setExpandedId(w.key)}
        onLoad={(e) => {
          const img = e.target as HTMLImageElement;
          if (img.naturalWidth > 0 && img.naturalHeight > 0) {
            const a = img.naturalWidth / img.naturalHeight;
            setAspects((prev) => (prev[w.key] === a ? prev : { ...prev, [w.key]: a }));
          }
        }}
        style={imgStyle}
      />
    ) : (
      <img
        src={
          w.kind === "tapo"
            ? `/api/tapo-plugin/snapshot/${encodeURIComponent(w.id)}?token=${encodeURIComponent(token)}&ts=${cloudRefreshKey}`
            : w.kind === "tapoc"
              ? `/api/tapo-plugin/cloud-snapshot/${encodeURIComponent(w.id)}?token=${encodeURIComponent(token)}&k=${cloudRefreshKey}`
              : `/api/hikvision-plugin/snapshot/${encodeURIComponent(w.id)}?token=${encodeURIComponent(token)}&ts=${cloudRefreshKey}`
        }
        alt={w.label}
        onLoad={(e) => {
          const img = e.target as HTMLImageElement;
          if (img.naturalWidth > 0 && img.naturalHeight > 0) {
            const a = img.naturalWidth / img.naturalHeight;
            setAspects((prev) => (prev[w.key] === a ? prev : { ...prev, [w.key]: a }));
          }
        }}
        style={imgStyle}
      />
    );

  // Меню выбора расположения (⚙): общее для режима окон и режима панели
  const renderPosMenu = () => (
    <>
      {posMenuOpen && (
        <>
          {/* Прозрачный фон для закрытия меню по клику вне его */}
          <div
            style={{ position: "fixed", inset: 0, zIndex: 2999 }}
            onClick={() => setPosMenuOpen(false)}
          />
          <div
            style={{
              position: "absolute", top: 34, right: 0, zIndex: 3000,
              background: "var(--bg-card)", border: "1px solid var(--border-color)",
              borderRadius: 10, boxShadow: "var(--shadow)", padding: 6, minWidth: 172,
            }}
          >
            <div style={{ fontSize: 11, color: "var(--text-muted)", padding: "2px 10px 6px" }}>
              Расположение окон
            </div>
            {POSITIONS.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => { setPosition(value); setPosMenuOpen(false); }}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  gap: 8, width: "100%", padding: "7px 10px", border: "none", borderRadius: 8,
                  background: position === value ? "var(--bg-hover)" : "none",
                  color: "var(--text-primary)", fontSize: 13, cursor: "pointer", textAlign: "left",
                }}
              >
                <span>{label}</span>
                <span style={{ color: "#007AFF", fontSize: 12, opacity: position === value ? 1 : 0 }}>
                  ✓
                </span>
              </button>
            ))}
          </div>
        </>
      )}
    </>
  );

  const gearButton = (
    <button
      onClick={() => setPosMenuOpen((v) => !v)}
      title="Расположение окон камер"
      style={{
        width: 28, height: 28, borderRadius: "50%",
        background: "var(--bg-card)", border: "1px solid var(--border-color)",
        boxShadow: "0 4px 14px rgba(0,0,0,0.25)", cursor: "pointer",
        color: posMenuOpen ? "#007AFF" : "var(--text-muted)",
        fontSize: 14, lineHeight: 1, display: "flex", alignItems: "center", justifyContent: "center",
        padding: 0,
      }}
    >
      ⚙
    </button>
  );

  // Окна всех вкладок видеорегистратора: локальные (поток MJPEG), Tapo RTSP,
  // Tapo-облако и Hik-Connect — снапшоты по токену, обновляются с refreshKey.
  const pipWindows = pipIds
    .map((key) => {
      const { kind, id } = splitPipKey(key);
      if (kind === "local") {
        const cam = cameras.find((c) => String(c.id) === id);
        if (!cam) return null;
        return { key, kind, id, label: cam.label || "Камера", cam };
      }
      return { key, kind, id, label: getPipLabel(key) || "Камера", cam: null as any };
    })
    .filter(Boolean) as { key: string; kind: string; id: string; label: string; cam: any }[];

  // PiP — только на десктопной версии
  if (!isDesktop || pipWindows.length === 0) return null;

  // Развёрнутый просмотр — только для локальных камер (живой MJPEG-поток)
  const expandedWin = expandedId ? pipWindows.find((w) => w.key === expandedId) : null;
  const expanded = expandedWin && expandedWin.kind === "local" ? expandedWin.cam : null;

  // ===== Режим «В панели»: камеры в отдельной панели справа на всю высоту =====
  if (position === "panel") {
    const innerW = panelWidth - PANEL_PADDING * 2;
    return (
      <>
        <div
          style={{
            position: "fixed",
            top: 0,
            right: 0,
            bottom: 0,
            width: panelWidth,
            zIndex: 2500,
            background: "var(--bg-card)",
            borderLeft: "1px solid var(--border-color)",
            boxShadow: "-8px 0 30px rgba(0,0,0,0.25)",
            display: "flex",
            flexDirection: "column",
            paddingTop: "env(safe-area-inset-top, 0px)",
            paddingBottom: "env(safe-area-inset-bottom, 0px)",
          }}
        >
          {/* Шапка панели: заголовок + настройки */}
          <div
            style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "8px 12px",
              borderBottom: "1px solid var(--border-color)",
              flexShrink: 0,
            }}
          >
            <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)" }}>
              Камеры
            </span>
            <div style={{ position: "relative" }}>
              {gearButton}
              {renderPosMenu()}
            </div>
          </div>
          {/* Список камер — скроллится при переполнении */}
          <div style={{ flex: 1, overflowY: "auto", padding: PANEL_PADDING, display: "flex", flexDirection: "column", gap: GAP }}>
            {pipWindows.map((w) => {
              const aspect = aspects[w.key] || DEFAULT_ASPECT;
              const imgH = Math.max(56, Math.round(innerW / aspect));
              return (
                <div
                  key={w.key}
                  style={{
                    width: "100%",
                    background: "var(--bg-card)",
                    border: "1px solid var(--border-color)",
                    borderRadius: 12,
                    overflow: "hidden",
                    flexShrink: 0,
                  }}
                >
                  <div
                    style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      height: HEADER_H - 1, padding: "0 8px", cursor: "pointer",
                    }}
                    onClick={() => { if (w.kind === "local") setExpandedId(w.key); }}
                    title={w.kind === "local" ? "Развернуть" : w.label}
                  >
                    <span style={{ fontSize: 11, fontWeight: 500, color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {w.label}
                    </span>
                    <button
                      onClick={(e) => { e.stopPropagation(); close(w.key); }}
                      style={{
                        background: "none", border: "none", cursor: "pointer",
                        color: "var(--text-muted)", fontSize: 13, padding: "0 2px", lineHeight: 1,
                      }}
                      title="Закрыть"
                    >
                      ✕
                    </button>
                  </div>
                  <div style={{ position: "relative" }}>
                    {renderFrame(w, imgH, { width: "100%", height: imgH, objectFit: "cover", display: "block", background: "#000", cursor: w.kind === "local" ? "pointer" : "default" })}
                  </div>
                </div>
              );
            })}
          </div>
          {/* «Ручка» ширины панели — левый край */}
          <div
            onPointerDown={startPanelResize}
            onPointerMove={onResizeMove}
            onPointerUp={endResize}
            onPointerCancel={endResize}
            title="Изменить ширину панели"
            style={{
              position: "absolute", left: -3, top: 0, bottom: 0, width: 7,
              cursor: "ew-resize", touchAction: "none", zIndex: 2,
            }}
          />
        </div>

        {/* Развёрнутый просмотр */}
        {expanded && (
          <div
            style={{
              position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
              background: "#000", zIndex: 3001,
              display: "flex", flexDirection: "column",
            }}
            onClick={() => setExpandedId(null)}
          >
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "calc(12px + env(safe-area-inset-top, 0)) 20px 12px", background: "rgba(0,0,0,0.8)",
            }}>
              <span style={{ color: "#fff", fontSize: 15, fontWeight: 500 }}>{expanded.label || "Камера"}</span>
              <button
                onClick={() => setExpandedId(null)}
                style={{ background: "none", border: "none", color: "#fff", fontSize: 20, cursor: "pointer", padding: "4px 8px" }}
              >
                ✕
              </button>
            </div>
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
              <CameraStreamImage
                cameraId={expanded.id}
                refreshKey={refreshKey}
                alt={expanded.label || "Камера"}
                style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }}
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>
        )}
      </>
    );
  }

  // ===== Режим окон поверх контента: вертикальный стек у правого края =====
  // Вертикальный стек с учётом фактической высоты каждого окна
  const stack = pipWindows.map((w) => {
    const aspect = aspects[w.key] || DEFAULT_ASPECT;
    const imgH = Math.max(56, Math.round((width - 2) / aspect));
    return { w, imgH };
  });
  const stackH = stack.reduce((sum, w) => sum + HEADER_H + w.imgH + GAP + 2, 0);
  // Начальная вертикальная координата стека в зависимости от выбранного расположения
  let topOffset = 16;
  if (position === "middle") topOffset = Math.max(16, Math.round((viewportH - stackH) / 2));
  if (position === "bottom") topOffset = Math.max(16, viewportH - stackH - 16);
  const stackStart = topOffset;
  const wins = stack.map(({ w, imgH }) => {
    const top = topOffset;
    topOffset += HEADER_H + imgH + GAP + 2;
    return { w, imgH, top };
  });
  const stackEnd = topOffset; // низ стека (с учётом GAP последнего окна)
  // Кнопка настроек: под стеком (вверху/центр) или над стеком (внизу), всегда в пределах экрана
  const btnTop = position === "bottom"
    ? Math.max(4, stackStart - 36)
    : Math.min(stackEnd + 4, viewportH - 32);

  return (
    <>
      {wins.map(({ w, imgH, top }) => (
        <div
          key={w.key}
          style={{
            position: "fixed",
            top: `calc(${top}px + env(safe-area-inset-top, 0px))`,
            right: "calc(16px + env(safe-area-inset-right, 0px))",
            width,
            zIndex: 3000,
            background: "var(--bg-card)",
            border: "1px solid var(--border-color)",
            borderRadius: 12,
            boxShadow: "0 8px 30px rgba(0,0,0,0.35)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              height: HEADER_H - 1, padding: "0 8px", cursor: "pointer",
            }}
            onClick={() => { if (w.kind === "local") setExpandedId(w.key); }}
            title={w.kind === "local" ? "Развернуть" : w.label}
          >
            <span style={{ fontSize: 11, fontWeight: 500, color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {w.label}
            </span>
            <button
              onClick={(e) => { e.stopPropagation(); close(w.key); }}
              style={{
                background: "none", border: "none", cursor: "pointer",
                color: "var(--text-muted)", fontSize: 13, padding: "0 2px", lineHeight: 1,
              }}
              title="Закрыть"
            >
              ✕
            </button>
          </div>
          <div style={{ position: "relative" }}>
            {renderFrame(w, imgH, { width: "100%", height: imgH, objectFit: "cover", display: "block", background: "#000" })}
            {/* «Ручка» изменения размера — левый нижний угол */}
            <div
              onPointerDown={startResize}
              onPointerMove={onResizeMove}
              onPointerUp={endResize}
              onPointerCancel={endResize}
              title="Изменить размер"
              style={{
                position: "absolute", left: 0, bottom: 0, width: 22, height: 22,
                cursor: "nesw-resize", touchAction: "none", zIndex: 2,
                display: "flex", alignItems: "flex-end", justifyContent: "flex-start",
                padding: "0 0 3px 3px",
                background: "linear-gradient(45deg, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0) 55%)",
                borderBottomLeftRadius: 12,
              }}
            >
              <span style={{ color: "rgba(255,255,255,0.9)", fontSize: 10, lineHeight: 1, userSelect: "none" }}>◢</span>
            </div>
          </div>
        </div>
      ))}

      {/* Кнопка настроек расположения окон — под стеком */}
      {!expanded && (
        <div
          style={{
            position: "fixed",
            top: `calc(${btnTop}px + env(safe-area-inset-top, 0px))`,
            right: "calc(16px + env(safe-area-inset-right, 0px))",
            zIndex: 3000,
          }}
        >
          {gearButton}
          {renderPosMenu()}
        </div>
      )}

      {/* Развёрнутый просмотр */}
      {expanded && (
        <div
          style={{
            position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
            background: "#000", zIndex: 3001,
            display: "flex", flexDirection: "column",
          }}
          onClick={() => setExpandedId(null)}
        >
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "calc(12px + env(safe-area-inset-top, 0)) 20px 12px", background: "rgba(0,0,0,0.8)",
          }}>
            <span style={{ color: "#fff", fontSize: 15, fontWeight: 500 }}>{expanded.label || "Камера"}</span>
            <button
              onClick={() => setExpandedId(null)}
              style={{ background: "none", border: "none", color: "#fff", fontSize: 20, cursor: "pointer", padding: "4px 8px" }}
            >
              ✕
            </button>
          </div>
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
            <CameraStreamImage
              cameraId={expanded.id}
              refreshKey={refreshKey}
              alt={expanded.label || "Камера"}
              style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </>
  );
}
