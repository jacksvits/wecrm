import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "../api/client";

const STORAGE_KEY = "camera_pip_ids";

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

// Глобальный overlay «картинка в картинке»: маленькие окна камер
// закреплены в правом верхнем углу поверх всех страниц. Состояние
// сохраняется в localStorage и переживает переходы между страницами
// и перезагрузку. Переключение — кнопкой ⤢ на виджете камеры (Director)
// или событием window "camera-pip-toggle".
export function CameraPipOverlay() {
  const [pipIds, setPipIds] = useState<string[]>(loadPipIds);
  const [cameras, setCameras] = useState<any[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const listRef = useRef<any[]>([]);

  useEffect(() => {
    let cancelled = false;
    const load = () => {
      api.camera.getSettings().then((list: any[]) => {
        if (!cancelled) {
          listRef.current = list;
          setCameras(list);
        }
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

  const close = useCallback((id: string) => {
    setPipIds((prev) => {
      const next = prev.filter((x) => x !== id);
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  }, []);

  const pipCameras = pipIds
    .map((id) => cameras.find((c) => c.id === id))
    .filter(Boolean);

  if (pipCameras.length === 0) return null;

  const expanded = expandedId ? cameras.find((c) => c.id === expandedId) : null;

  return (
    <>
      {pipCameras.map((cam: any, idx: number) => (
        <div
          key={cam.id}
          style={{
            position: "fixed",
            top: `calc(16px + env(safe-area-inset-top, 0px) + ${idx * 132}px)`,
            right: "calc(16px + env(safe-area-inset-right, 0px))",
            width: 190,
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
              padding: "4px 8px", cursor: "pointer",
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
          <img
            key={`${cam.id}-${refreshKey}`}
            src={`/api/camera/stream/${cam.id}?t=${refreshKey}`}
            alt={cam.label || "Камера"}
            onClick={() => setExpandedId(cam.id)}
            style={{ width: "100%", height: 100, objectFit: "cover", display: "block", cursor: "pointer" }}
          />
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
            <img
              src={`/api/camera/stream/${expanded.id}?t=${refreshKey}`}
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
