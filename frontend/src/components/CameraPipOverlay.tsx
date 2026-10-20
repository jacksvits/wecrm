import { useEffect, useRef, useState } from "react";
import { api } from "../api/client";
import { CameraStreamImage } from "./CameraStreamImage";

const STORAGE_KEY = "camera_pip_ids";
const STORAGE_WIDTH = "camera_pip_width";
const DESKTOP_MIN = 1024;
const MIN_W = 160;
const HEADER_H = 25; // заголовок окна
const GAP = 10;      // отступ между окнами
const DEFAULT_ASPECT = 16 / 9; // до загрузки первого снимка

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

// Глобальный overlay «картинка в картинке» (только десктоп): маленькие окна
// камер в правом верхнем углу поверх всех страниц. Размер окна меняется
// «ручкой» в левом нижнем углу — пропорционально картинке (пропорции
// определяются по фактическому снимку камеры). Состояние в localStorage.
export function CameraPipOverlay() {
  const [pipIds, setPipIds] = useState<string[]>(loadPipIds);
  const [cameras, setCameras] = useState<any[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [width, setWidth] = useState<number>(loadWidth);
  // Фактические пропорции снимка каждой камеры (width/height)
  const [aspects, setAspects] = useState<Record<string, number>>({});
  const [isDesktop, setIsDesktop] = useState<boolean>(
    () => typeof window !== "undefined" && window.innerWidth >= DESKTOP_MIN,
  );
  const dragRef = useRef<{ pointerId: number; startX: number; startW: number } | null>(null);

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

  // Обновление снимков потока раз в 60 секунд
  useEffect(() => {
    const interval = setInterval(() => setRefreshKey(Date.now()), 60000);
    return () => clearInterval(interval);
  }, []);

  // Синхронизация состояния между вкладками и с виджетами
  useEffect(() => {
    const sync = () => setPipIds(loadPipIds());
    const onStorage = (e: StorageEvent) => { if (e.key === STORAGE_KEY) sync(); };
    const onToggle = (e: Event) => {
      const id = (e as CustomEvent<string>).detail;
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

  // Растяжение «ручкой» в левом нижнем углу: тянем влево — окно растёт
  const startResize = (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragRef.current = { pointerId: e.pointerId, startX: e.clientX, startW: width };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onResizeMove = (e: React.PointerEvent) => {
    const d = dragRef.current;
    if (!d || d.pointerId !== e.pointerId) return;
    setWidth(clampW(d.startW + (d.startX - e.clientX)));
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

  const pipCameras = pipIds
    .map((id) => cameras.find((c) => c.id === id))
    .filter(Boolean);

  // PiP — только на десктопной версии
  if (!isDesktop || pipCameras.length === 0) return null;

  // Вертикальный стек с учётом фактической высоты каждого окна
  let topOffset = 16;
  const wins = pipCameras.map((cam: any) => {
    const aspect = aspects[cam.id] || DEFAULT_ASPECT;
    const imgH = Math.max(56, Math.round((width - 2) / aspect));
    const top = topOffset;
    topOffset += HEADER_H + imgH + GAP + 2;
    return { cam, imgH, top };
  });

  const expanded = expandedId ? cameras.find((c) => c.id === expandedId) : null;

  return (
    <>
      {wins.map(({ cam, imgH, top }) => (
        <div
          key={cam.id}
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
            onClick={() => setExpandedId(cam.id)}
            title="Развернуть"
          >
            <span style={{ fontSize: 11, fontWeight: 500, color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {cam.label || "Камера"}
            </span>
            <button
              onClick={(e) => { e.stopPropagation(); close(cam.id); }}
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
            <CameraStreamImage
              cameraId={cam.id}
              refreshKey={refreshKey}
              alt={cam.label || "Камера"}
              onClick={() => setExpandedId(cam.id)}
              onLoad={(e) => {
                const img = e.target as HTMLImageElement;
                if (img.naturalWidth > 0 && img.naturalHeight > 0) {
                  const a = img.naturalWidth / img.naturalHeight;
                  setAspects((prev) => (prev[cam.id] === a ? prev : { ...prev, [cam.id]: a }));
                }
              }}
              style={{ width: "100%", height: imgH, objectFit: "cover", cursor: "pointer" }}
            />
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
