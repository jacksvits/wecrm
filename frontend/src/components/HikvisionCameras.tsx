import { useCallback, useEffect, useState } from "react";
import { H264Player } from "./H264Player";
import { cameraIconBtnStyle, HiddenCamerasModal, useHiddenCameras } from "./HiddenCameras";
import { useIsDesktop, usePip } from "../pip";

// Страница «Камеры Hik-Connect» (плагин облачных камер).
// Доступна только администраторам и только при включённом плагине (роут в
// App.tsx обёрнут в RequireAdmin, пункт меню в Layout.tsx рендерится по
// /api/hikvision-plugin/status). Список камер грузится быстро (без снапшотов —
// облачный capture идёт 20–30+ с на камеру); превью подгружаются по одному
// через /api/hikvision-plugin/snapshot/:index, клик по карточке — live-поток.

type HikCamera = {
  index: number;
  name: string;
  deviceSerial: string;
  channelNo: number;
  deviceName: string;
};

const cardStyle: React.CSSProperties = {
  background: "var(--bg-card)",
  border: "1px solid var(--border-color)",
  borderRadius: 12,
  padding: 16,
};

function getToken() {
  return localStorage.getItem("token") || "";
}

async function apiFetch(path: string, options?: RequestInit) {
  const res = await fetch(path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(getToken() ? { "X-Auth-Token": getToken() } : {}),
      ...options?.headers,
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const e: any = new Error(err.error || `HTTP ${res.status}`);
    e.status = res.status;
    throw e;
  }
  return res.json();
}

// Карточка камеры: ленивое превью-снапшот; при недоступности — заглушка.
// Двойной клик по кадру — live-трансляция в модальном окне.
function CameraCard({ cam, isDesktop, pipActive, onTogglePip, onShowHidden, onOpen, onHide }: {
  cam: HikCamera;
  isDesktop: boolean;
  pipActive: boolean;
  onTogglePip: () => void;
  onShowHidden: () => void;
  onOpen: () => void;
  onHide: (index: number) => void;
}) {
  const [previewOk, setPreviewOk] = useState(true);
  const [previewTs, setPreviewTs] = useState(0);
  return (
    <div style={{ ...cardStyle, padding: 0, overflow: "hidden", display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 500, fontSize: 15, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={cam.name}>{cam.name}</div>
          <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
            {cam.deviceName} · канал {cam.channelNo}
          </div>
        </div>
        <span style={{ display: "flex", alignItems: "center", gap: 2, flexShrink: 0 }}>
          <button
            onClick={(e) => { e.stopPropagation(); setPreviewOk(true); setPreviewTs(Date.now()); }}
            title="Обновить превью"
            style={cameraIconBtnStyle}
            onMouseEnter={(e) => e.currentTarget.style.opacity = "1"}
            onMouseLeave={(e) => e.currentTarget.style.opacity = "0.5"}
          >↻</button>
          {isDesktop && (
            <button
              onClick={(e) => { e.stopPropagation(); onTogglePip(); }}
              title={pipActive ? "Убрать «картинку в картинке»" : "Картинка в картинке"}
              style={{ ...cameraIconBtnStyle, opacity: pipActive ? 1 : 0.5, color: pipActive ? "#007AFF" : "var(--text-muted)" }}
              onMouseEnter={(e) => { if (!pipActive) e.currentTarget.style.opacity = "1"; }}
              onMouseLeave={(e) => { if (!pipActive) e.currentTarget.style.opacity = "0.5"; }}
            >⤢</button>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); onShowHidden(); }}
            title="Скрытые камеры"
            style={cameraIconBtnStyle}
            onMouseEnter={(e) => e.currentTarget.style.opacity = "1"}
            onMouseLeave={(e) => e.currentTarget.style.opacity = "0.5"}
          >⚙</button>
          <button
            onClick={(e) => { e.stopPropagation(); onHide(cam.index); }}
            title="Скрыть камеру"
            style={cameraIconBtnStyle}
            onMouseEnter={(e) => e.currentTarget.style.opacity = "1"}
            onMouseLeave={(e) => e.currentTarget.style.opacity = "0.5"}
          >✕</button>
        </span>
      </div>
      <div
        style={{ margin: "0 16px 16px", borderRadius: 10, overflow: "hidden", background: "#000", aspectRatio: "16/10", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
        onDoubleClick={onOpen}
        title="Двойной клик — live-поток"
      >
        {previewOk ? (
          <img
            src={`/api/hikvision-plugin/snapshot/${cam.index}?token=${encodeURIComponent(getToken())}${previewTs ? `&ts=${previewTs}` : ""}`}
            alt={cam.name}
            loading="lazy"
            onError={() => setPreviewOk(false)}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : (
          <div style={{ color: "var(--text-muted)", fontSize: 12, textAlign: "center" }}>
            <div style={{ fontSize: 24, marginBottom: 6 }}>📷</div>
            Нет снапшота
          </div>
        )}
      </div>
    </div>
  );
}

export function HikvisionCameras() {
  const { hidden, hide, restore, restoreAll } = useHiddenCameras("hik");
  const [showHidden, setShowHidden] = useState(false);
  const { active: pipActive, toggle: togglePip } = usePip();
  const isDesktop = useIsDesktop();
  const [isActive, setIsActive] = useState(false);
  const [hasLogin, setHasLogin] = useState(false);
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const [cameras, setCameras] = useState<HikCamera[]>([]);
  const [camerasLoading, setCamerasLoading] = useState(false);
  const [camerasError, setCamerasError] = useState<string | null>(null);
  const [liveCamera, setLiveCamera] = useState<HikCamera | null>(null);
  // 1 — основной поток. У некоторых регистраторов субпоток (2) отдаётся в облако
  // битым (HEVC без VPS, слейсы недекодируемые — Smart Codec), поэтому по
  // умолчанию основной; субпоток доступен в переключателе, если он исправен.
  const [liveStreamType, setLiveStreamType] = useState<1 | 2>(1);

  useEffect(() => {
    apiFetch("/api/hikvision-plugin/settings")
      .then((s: any) => {
        setIsActive(!!s.isActive);
        setHasLogin(!!s.login);
      })
      .catch(() => {})
      .finally(() => setSettingsLoaded(true));
  }, []);

  const loadCameras = useCallback(() => {
    setCamerasLoading(true);
    setCamerasError(null);
    apiFetch("/api/hikvision-plugin/cameras")
      .then((list: HikCamera[]) => setCameras(Array.isArray(list) ? list : []))
      .catch((e: any) => {
        setCameras([]);
        setCamerasError(e.message || "Не удалось загрузить камеры");
      })
      .finally(() => setCamerasLoading(false));
  }, []);

  // Первичная загрузка при активном плагине
  useEffect(() => {
    if (settingsLoaded && isActive && hasLogin) loadCameras();
  }, [settingsLoaded, isActive, hasLogin, loadCameras]);

  const btnStyle: React.CSSProperties = {
    padding: "7px 14px",
    borderRadius: 8,
    border: "1px solid var(--border-color)",
    background: "var(--bg-card)",
    color: "var(--text-primary)",
    fontSize: 13,
    cursor: "pointer",
  };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 8 }}>
        <div style={{ fontSize: 13, color: "var(--text-muted)" }}>Камеры Hik-Connect</div>
        <div style={{ display: "flex", gap: 8 }}>
          {isActive && hasLogin && (
            <button onClick={loadCameras} disabled={camerasLoading} style={btnStyle}>
              {camerasLoading ? "Загрузка…" : "Обновить"}
            </button>
          )}
          {hidden.length > 0 && (
            <button onClick={() => setShowHidden(true)} style={btnStyle} title="Скрытые камеры">
              ⚙️ Скрытые ({hidden.length})
            </button>
          )}
        </div>
      </div>

      {!isActive && settingsLoaded && (
        <div style={{ ...cardStyle, color: "var(--text-muted)", fontSize: 14 }}>
          Плагин выключен. Включите его в настройках выше (или в «Настройки → Интеграции → Камеры Hik-Connect») и задайте учётные данные аккаунта.
        </div>
      )}

      {isActive && camerasError && (
        <div style={{ ...cardStyle, color: "#d9534f", fontSize: 14, marginBottom: 16 }}>{camerasError}</div>
      )}

      {isActive && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
          {cameras.filter((c) => !hidden.includes(String(c.index))).map((cam) => (
            <CameraCard
              key={`${cam.deviceSerial}-${cam.channelNo}`}
              cam={cam}
              isDesktop={isDesktop}
              pipActive={pipActive(`hik:${cam.index}`)}
              onTogglePip={() => togglePip(`hik:${cam.index}`, cam.name)}
              onShowHidden={() => setShowHidden(true)}
              onOpen={() => setLiveCamera(cam)}
              onHide={(index) => hide(String(index))}
            />
          ))}
          {cameras.length === 0 && !camerasLoading && !camerasError && (
            <div style={{ ...cardStyle, color: "var(--text-muted)", fontSize: 14 }}>
              Камеры не найдены. Проверьте, что устройства привязаны к аккаунту Hik-Connect, и нажмите «Обновить».
            </div>
          )}
        </div>
      )}

      {liveCamera && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 20 }}
          onClick={() => setLiveCamera(null)}>
          <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: 12, padding: 16, width: "100%", maxWidth: 900 }}
            onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
              <div style={{ fontWeight: 600, fontSize: 16 }}>{liveCamera.name} <span style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 400 }}>через облако Hik-Connect</span></div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <select value={liveStreamType} onChange={(e) => setLiveStreamType(Number(e.target.value) as 1 | 2)}
                  style={{ ...btnStyle, padding: "6px 10px" }}>
                  <option value={1}>Основной поток</option>
                  <option value={2}>Дополнительный (экономия)</option>
                </select>
                <button onClick={() => setLiveCamera(null)} style={btnStyle}>Закрыть</button>
              </div>
            </div>
            {/* Плеер сам следит за потоком и переподключается при обрыве */}
            <H264Player
              src={`/api/hikvision-plugin/h264/${liveCamera.index}?streamType=${liveStreamType}`}
              mjpegFallback={`/api/hikvision-plugin/stream/${liveCamera.index}?streamType=${liveStreamType}`}
              style={{ width: "100%", aspectRatio: "16/9", background: "#000" }}
            />
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 8 }}>
              H.264 (fMP4/MSE) через облако Hik-Connect: пробуждение камеры обычно занимает 3–15 с.
            </div>
          </div>
        </div>
      )}
      {/* Возврат скрытых камер */}
      <HiddenCamerasModal
        title="Скрытые камеры"
        items={cameras.filter((c) => hidden.includes(String(c.index))).map((c) => ({ id: String(c.index), label: c.name }))}
        open={showHidden}
        onClose={() => setShowHidden(false)}
        onRestore={(id) => restore(id)}
        onRestoreAll={restoreAll}
      />
    </div>
  );
}
