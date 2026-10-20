import { memo, useEffect, useState } from "react";


type CameraWidgetProps = {
  cam: any;
  refreshKey: number;
  onEdit: () => void;
  pipActive: boolean;
  onTogglePip: () => void;
  onFullscreen: () => void;
};

// Контент виджета камеры на странице «Директор» — вкладка «Камеры».
// Поток обновляется принудительной сменой key у <img> (refreshKey).
export const CameraWidget = memo(function CameraWidget({ cam, refreshKey, onEdit, pipActive, onTogglePip, onFullscreen }: CameraWidgetProps) {
  // PiP — только десктоп (viewport >= 1024px)
  const [isDesktop, setIsDesktop] = useState<boolean>(() => window.innerWidth >= 1024);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const onChange = () => setIsDesktop(mq.matches);
    onChange();
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  const fallbackId = `camera-fallback-${cam?.id || "none"}`;
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
        </span>
      </div>
      <div style={{ borderRadius: 10, overflow: "hidden", background: "#000", height: "calc(100% - 40px)", minHeight: 140, position: "relative" }}>
        {cam ? (
          <img
            key={`${cam.id}-${refreshKey}`}
            src={`/api/camera/stream/${cam.id}?t=${refreshKey}`}
            alt="IP-камера"
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", cursor: "pointer" }}
            onDoubleClick={onFullscreen}
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
              const el = document.getElementById(fallbackId);
              if (el) el.style.display = "flex";
            }}
          />
        ) : null}
        <div
          id={fallbackId}
          style={{
            position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
            display: cam ? "none" : "flex", alignItems: "center", justifyContent: "center",
            color: "var(--text-muted)", fontSize: 13, textAlign: "center", padding: 16,
          }}
        >
          <div>
            <div style={{ fontSize: 24, marginBottom: 8 }}>📷</div>
            Камера недоступна<br />
            <span style={{ fontSize: 11, opacity: 0.7 }}>{cam?.ip || "—"}</span>
          </div>
        </div>
      </div>
    </>
  );
});
