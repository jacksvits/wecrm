import { useCallback, useEffect, useState } from "react";
import { HikvisionSettings, type HikvisionSettingsData } from "./HikvisionSettings";

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

// Карточка камеры: ленивое превью-снапшот; при недоступности — заглушка
function CameraCard({ cam, onOpen }: { cam: HikCamera; onOpen: () => void }) {
  const [previewOk, setPreviewOk] = useState(true);
  return (
    <div
      style={{ ...cardStyle, padding: 12, cursor: "pointer" }}
      onClick={onOpen}
      title="Открыть live-поток"
    >
      <div style={{ borderRadius: 8, overflow: "hidden", background: "#000", aspectRatio: "16/10", display: "flex", alignItems: "center", justifyContent: "center" }}>
        {previewOk ? (
          <img
            src={`/api/hikvision-plugin/snapshot/${cam.index}?token=${encodeURIComponent(getToken())}`}
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
      <div style={{ fontSize: 14, fontWeight: 500, marginTop: 10 }}>{cam.name}</div>
      <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
        {cam.deviceName} · канал {cam.channelNo}
      </div>
    </div>
  );
}

export function HikvisionCameras() {
  const [isActive, setIsActive] = useState(false);
  const [hasLogin, setHasLogin] = useState(false);
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [cameras, setCameras] = useState<HikCamera[]>([]);
  const [camerasLoading, setCamerasLoading] = useState(false);
  const [camerasError, setCamerasError] = useState<string | null>(null);
  const [liveCamera, setLiveCamera] = useState<HikCamera | null>(null);
  // 1 — основной поток (макс. качество), 2 — дополнительный (быстрее просыпается,
  // меньше тратит трафик relay — рекомендуется для предпросмотра)
  const [liveStreamType, setLiveStreamType] = useState<1 | 2>(2);

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

  const onSettingsSaved = (s: HikvisionSettingsData) => {
    setIsActive(s.isActive);
    setHasLogin(!!s.login);
    // Список камер при включении плагина или смене логина перечитываем
    if (s.isActive && s.login) loadCameras();
    else setCameras([]);
  };

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
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "16px 16px 32px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 8 }}>
        <h1 style={{ fontSize: 20, fontWeight: 600, margin: 0 }}>Камеры Hik-Connect</h1>
        <div style={{ display: "flex", gap: 8 }}>
          {isActive && hasLogin && (
            <button onClick={loadCameras} disabled={camerasLoading} style={btnStyle}>
              {camerasLoading ? "Загрузка…" : "Обновить"}
            </button>
          )}
          <button onClick={() => setShowSettings((v) => !v)} style={btnStyle}>
            {showSettings ? "Скрыть настройки" : "Настройки"}
          </button>
        </div>
      </div>

      {showSettings && (
        <div style={{ ...cardStyle, marginBottom: 16 }}>
          <HikvisionSettings onSaved={onSettingsSaved} />
        </div>
      )}

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
          {cameras.map((cam) => (
            <CameraCard key={`${cam.deviceSerial}-${cam.channelNo}`} cam={cam} onOpen={() => setLiveCamera(cam)} />
          ))}
          {cameras.length === 0 && !camerasLoading && !camerasError && (
            <div style={{ ...cardStyle, color: "var(--text-muted)", fontSize: 14 }}>
              Камеры не найдены. Проверьте, что устройства привязаны к аккаунту Hik-Connect, и нажмите «Обновить».
            </div>
          )}
        </div>
      )}

      {liveCamera && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.92)", zIndex: 3000, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 16 }}
          onClick={() => setLiveCamera(null)}
        >
          <div style={{ color: "#fff", fontSize: 15, fontWeight: 500, marginBottom: 10, textAlign: "center" }}>
            {liveCamera.name} — live
          </div>
          {/* Поток идёт через токен в query: authMiddleware принимает ?token= */}
          <img
            src={`/api/hikvision-plugin/stream/${liveCamera.index}?streamType=${liveStreamType}&token=${encodeURIComponent(getToken())}`}
            alt={liveCamera.name}
            style={{ maxWidth: "100%", maxHeight: "calc(85vh - 90px)", borderRadius: 10, background: "#000" }}
            onClick={(e) => e.stopPropagation()}
          />
          <div
            style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 12, flexWrap: "wrap", justifyContent: "center" }}
            onClick={(e) => e.stopPropagation()}
          >
            <label style={{ color: "rgba(255,255,255,0.85)", fontSize: 13, display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
              Поток:
              <select
                value={liveStreamType}
                onChange={(e) => setLiveStreamType(Number(e.target.value) as 1 | 2)}
                style={{ padding: "4px 8px", borderRadius: 6, border: "1px solid rgba(255,255,255,0.3)", background: "#1c1c1e", color: "#fff", fontSize: 13 }}
              >
                <option value={2}>Дополнительный (быстрее)</option>
                <option value={1}>Основной (качество)</option>
              </select>
            </label>
            <span style={{ color: "rgba(255,255,255,0.55)", fontSize: 12 }}>
              Подключение через облако: пробуждение камеры обычно занимает 3–15 с. Нажмите в любое место, чтобы закрыть.
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
