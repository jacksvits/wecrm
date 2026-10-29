import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { TapoSettings, type TapoSettingsData } from "./TapoSettings";
import { H264Player } from "./H264Player";

// Страница «Камеры Tapo» (TP-Link): сетка камер облачного аккаунта TP-Link ID
// с live-просмотром. По аналогии с HikvisionCameras: только администраторы,
// плагин должен быть включён. Видео — H.264 в fMP4 через MSE-плеер (H264Player),
// снапшоты — JPEG с камеры по RTSP.

type TapoCamera = {
  index: number;
  name: string;
  deviceId: string;
  model: string;
  ip: string;
  mac: string;
};

const card: React.CSSProperties = {
  background: "var(--bg-card)",
  border: "1px solid var(--border-color)",
  borderRadius: 12,
  padding: 16,
  color: "var(--text-primary)",
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

const btnPrimaryStyle: React.CSSProperties = { ...btnStyle, background: "#007AFF", borderColor: "#007AFF", color: "#fff" };

async function apiFetch(path: string, options?: RequestInit) {
  const token = localStorage.getItem("token") || "";
  const res = await fetch(path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { "X-Auth-Token": token } : {}),
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

function CameraCard({ cam, token, onWatch }: { cam: TapoCamera; token: string; onWatch: () => void }) {
  const [snap, setSnap] = useState<string | null>(null);
  const [snapErr, setSnapErr] = useState(false);

  const reload = useCallback(() => {
    setSnapErr(false);
    setSnap(`/api/tapo-plugin/snapshot/${cam.index}?token=${encodeURIComponent(token)}&ts=${Date.now()}`);
  }, [cam.index, token]);

  useEffect(() => { reload(); }, [reload]);

  return (
    <div style={{ ...card, padding: 0, overflow: "hidden", display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--border-color)", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
        <div style={{ fontWeight: 600, fontSize: 15, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{cam.name}</div>
        <div style={{ fontSize: 12, color: "var(--text-muted)", whiteSpace: "nowrap" }}>{cam.ip}</div>
      </div>
      <div style={{ position: "relative", background: "#000", aspectRatio: "16/9", cursor: "pointer" }} onClick={onWatch}>
        {snap && !snapErr && (
          <img src={snap} alt={cam.name} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
            onError={() => setSnapErr(true)} />
        )}
        {(!snap || snapErr) && (
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", fontSize: 13 }}>
            {snapErr ? "Превью недоступно" : "Загрузка…"}
          </div>
        )}
        <button
          onClick={(e) => { e.stopPropagation(); reload(); }}
          title="Обновить превью"
          style={{ position: "absolute", top: 8, right: 8, padding: "4px 8px", borderRadius: 8, border: "1px solid var(--border-color)", background: "rgba(0,0,0,.55)", color: "#fff", fontSize: 12, cursor: "pointer" }}
        >↻</button>
      </div>
      <div style={{ padding: "10px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{cam.model || "Tapo"}</span>
        <button onClick={onWatch} style={btnPrimaryStyle}>Смотреть</button>
      </div>
    </div>
  );
}

export function TapoCameras() {
  const navigate = useNavigate();
  const [settings, setSettings] = useState<TapoSettingsData | null>(null);
  const [cameras, setCameras] = useState<TapoCamera[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [liveCamera, setLiveCamera] = useState<TapoCamera | null>(null);
  const [liveStreamType, setLiveStreamType] = useState<1 | 2>(1);
  const token = localStorage.getItem("token") || "";

  const load = useCallback(async () => {
    setLoadError("");
    try {
      const s: any = await apiFetch("/api/tapo-plugin/settings");
      const next: TapoSettingsData = { login: s.login || "", password: s.password || "", extraCameras: s.extraCameras || "[]", isActive: !!s.isActive };
      setSettings(next);
      if (!next.isActive) {
        setCameras([]);
        return;
      }
      const cams = await apiFetch("/api/tapo-plugin/cameras");
      setCameras(Array.isArray(cams) ? cams : []);
    } catch (e: any) {
      setLoadError(e.message || "Ошибка загрузки");
      setCameras([]);
    }
  }, []);

  useEffect(() => { load().finally(() => setLoading(false)); }, [load]);

  const refresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  return (
    <div style={{ padding: 20 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8, flexWrap: "wrap" }}>
        <button onClick={() => navigate("/settings")} style={btnStyle}>← Назад</button>
        <h1 style={{ fontSize: 22, margin: 0 }}>Камеры Tapo</h1>
        {settings?.isActive && (
          <button onClick={refresh} disabled={refreshing} style={btnStyle}>{refreshing ? "Обновление…" : "Обновить"}</button>
        )}
      </div>
      <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 16 }}>
        Камеры облачного аккаунта TP-Link ID. Видео H.264 идёт напрямую с камер по RTSP — камеры должны быть в одной локальной сети с сервером wecrm.
      </div>

      <div style={{ ...card, marginBottom: 16 }}>
        <TapoSettings onSaved={() => load()} />
      </div>

      {loading && <div style={{ fontSize: 13, color: "var(--text-muted)" }}>Загрузка…</div>}
      {!loading && loadError && <div style={{ ...card, borderColor: "#d9534f", fontSize: 13 }}>{loadError}</div>}
      {!loading && !loadError && settings && !settings.isActive && (
        <div style={{ ...card, fontSize: 13, color: "var(--text-muted)" }}>Плагин выключен. Включите его в настройках выше — тогда здесь появится сетка камер.</div>
      )}
      {!loading && !loadError && settings?.isActive && !cameras.length && (
        <div style={{ ...card, fontSize: 13, color: "var(--text-muted)" }}>
          Камеры не найдены. Проверьте логин/пароль TP-Link ID и убедитесь, что камеры включены и находятся в одной локальной сети с сервером (кнопка «Проверить подключение» показывает, сколько камер видит облако).
        </div>
      )}

      {!!cameras.length && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
          {cameras.map((cam) => (
            <CameraCard key={cam.index} cam={cam} token={token} onWatch={() => { setLiveCamera(cam); setLiveStreamType(1); }} />
          ))}
        </div>
      )}

      {liveCamera && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 20 }}
          onClick={() => setLiveCamera(null)}>
          <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: 12, padding: 16, width: "100%", maxWidth: 900 }}
            onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
              <div style={{ fontWeight: 600, fontSize: 16 }}>{liveCamera.name}</div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <select value={liveStreamType} onChange={(e) => setLiveStreamType(Number(e.target.value) as 1 | 2)}
                  style={{ ...btnStyle, padding: "6px 10px" }}>
                  <option value={1}>Основной поток</option>
                  <option value={2}>Дополнительный (экономия)</option>
                </select>
                <button onClick={() => setLiveCamera(null)} style={btnStyle}>Закрыть</button>
              </div>
            </div>
            <H264Player
              src={`/api/tapo-plugin/stream/${liveCamera.index}?streamType=${liveStreamType}`}
              style={{ width: "100%", aspectRatio: "16/9", background: "#000" }}
            />
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 8 }}>
              H.264 (fMP4/MSE), прямое подключение к камере {liveCamera.ip} по RTSP. Задержка — 2–4 с (буферизация ключевых кадров).
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
