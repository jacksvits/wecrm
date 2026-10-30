import { memo, useEffect, useState } from "react";
import { CameraStreamImage } from "./CameraStreamImage";


type CameraWidgetProps = {
  cam: any;
  refreshKey: number | string;
  onRefresh: () => void;
  onEdit: () => void;
  pipActive: boolean;
  onTogglePip: () => void;
  onFullscreen: () => void;
  onClose: () => void;
};

// Контент виджета камеры на странице «Директор» — вкладка «Камеры».
// Поток обновляется принудительной сменой key у <img> (refreshKey).
// Двойной клик по кадру — модальный просмотр; ↻ — обновить кадр.
export const CameraWidget = memo(function CameraWidget({ cam, refreshKey, onRefresh, onEdit, pipActive, onTogglePip, onFullscreen, onClose }: CameraWidgetProps) {
  // PiP — только десктоп (viewport >= 1024px)
  const [isDesktop, setIsDesktop] = useState<boolean>(() => window.innerWidth >= 1024);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const onChange = () => setIsDesktop(mq.matches);
    onChange();
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const iconBtn: React.CSSProperties = {
    background: "none", border: "none", cursor: "pointer",
    padding: 2, opacity: 0.5, transition: "opacity 0.15s",
    color: "var(--text-muted)", fontSize: 14,
  };
  return (
    <>
      <div style={{ fontSize: 15, fontWeight: 500, marginBottom: 12, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span>{cam?.label || "Видеокамера"}</span>
        <span style={{ display: "flex", alignItems: "center", gap: 2 }}>
          <button
            onClick={(e) => { e.stopPropagation(); onRefresh(); }}
            style={iconBtn}
            onMouseEnter={(e) => e.currentTarget.style.opacity = "1"}
            onMouseLeave={(e) => e.currentTarget.style.opacity = "0.5"}
            title="Обновить кадр"
          >
            ↻
          </button>
          {isDesktop && (
          <button
            onClick={(e) => { e.stopPropagation(); onTogglePip(); }}
            style={{ ...iconBtn, opacity: pipActive ? 1 : 0.5, color: pipActive ? "#007AFF" : "var(--text-muted)" }}
            onMouseEnter={(e) => { if (!pipActive) e.currentTarget.style.opacity = "1"; }}
            onMouseLeave={(e) => { if (!pipActive) e.currentTarget.style.opacity = "0.5"; }}
            title={pipActive ? "Убрать «картинку в картинке»" : "Картинка в картинке"}
          >
            ⤢
          </button>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(); }}
            style={iconBtn}
            onMouseEnter={(e) => e.currentTarget.style.opacity = "1"}
            onMouseLeave={(e) => e.currentTarget.style.opacity = "0.5"}
            title="Настройки камеры"
          >
            ⚙️
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onClose(); }}
            style={iconBtn}
            onMouseEnter={(e) => e.currentTarget.style.opacity = "1"}
            onMouseLeave={(e) => e.currentTarget.style.opacity = "0.5"}
            title="Скрыть камеру"
          >
            ✕
          </button>
        </span>
      </div>
      <div style={{ borderRadius: 10, overflow: "hidden", background: "#000", height: "calc(100% - 40px)", minHeight: 140, position: "relative" }}>
        {cam ? (
          <CameraStreamImage
            cameraId={cam.id}
            refreshKey={refreshKey}
            alt="IP-камера"
            hint={cam?.ip}
            style={{ width: "100%", height: "100%", objectFit: "cover", cursor: "pointer" }}
            onDoubleClick={onFullscreen}
          />
        ) : (
          <div
            style={{
              position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "var(--text-muted)", fontSize: 13, textAlign: "center", padding: 16,
            }}
          >
            <div>
              <div style={{ fontSize: 24, marginBottom: 8 }}>📷</div>
              Камера недоступна<br />
              <span style={{ fontSize: 11, opacity: 0.7 }}>{cam?.ip || "—"}</span>
            </div>
          </div>
        )}
      </div>
    </>
  );
});
