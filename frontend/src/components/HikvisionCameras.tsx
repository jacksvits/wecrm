import { useCallback, useEffect, useState } from "react";

// Страница «Камеры Hik-Connect» (плагин облачных камер).
// Доступна только администраторам и только при включённом плагине (роут в
// App.tsx обёрнут в RequireAdmin, пункт меню в Layout.tsx рендерится по
// /api/hikvision-plugin/status). Потоки — MJPEG через общий ffmpeg-free
// прокси бэкенда (/api/hikvision-plugin/stream/:index), снапшоты — из
// облачного API Hik-Connect.

type HikCamera = {
  index: number;
  name: string;
  deviceSerial: string;
  channelNo: number;
  deviceName: string;
  snapshot: string | null;
};

type Settings = {
  login: string;
  password: string;
  apiBaseUrl: string;
  isActive: boolean;
};

const API_REGIONS = [
  { value: "https://api.hik-connect.com", label: "Международный (hik-connect.com)" },
  { value: "https://api.hik-connectru.com", label: "Россия (hik-connectru.com)" },
];

const cardStyle: React.CSSProperties = {
  background: "var(--bg-card)",
  border: "1px solid var(--border-color)",
  borderRadius: 12,
  padding: 16,
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "8px 12px",
  borderRadius: 8,
  border: "1px solid var(--border-color)",
  background: "var(--bg-input, var(--bg-card))",
  color: "var(--text-primary)",
  fontSize: 14,
  boxSizing: "border-box",
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

export function HikvisionCameras() {
  const [settings, setSettings] = useState<Settings>({ login: "", password: "", apiBaseUrl: API_REGIONS[0].value, isActive: false });
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);
  const [testing, setTesting] = useState(false);
  const [testMsg, setTestMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [cameras, setCameras] = useState<HikCamera[]>([]);
  const [camerasLoading, setCamerasLoading] = useState(false);
  const [camerasError, setCamerasError] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [liveCamera, setLiveCamera] = useState<HikCamera | null>(null);

  useEffect(() => {
    apiFetch("/api/hikvision-plugin/settings")
      .then((s: any) => {
        setSettings({
          login: s.login || "",
          password: s.password || "",
          apiBaseUrl: s.apiBaseUrl || API_REGIONS[0].value,
          isActive: !!s.isActive,
        });
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

  useEffect(() => {
    if (settingsLoaded && settings.isActive && settings.login) loadCameras();
  }, [settingsLoaded, settings.isActive, settings.login, loadCameras]);

  const saveSettings = async () => {
    setSaving(true);
    setSaveMsg(null);
    setTestMsg(null);
    try {
      const s: any = await apiFetch("/api/hikvision-plugin/settings", {
        method: "PUT",
        body: JSON.stringify(settings),
      });
      setSettings({ login: s.login || "", password: s.password || "", apiBaseUrl: s.apiBaseUrl || API_REGIONS[0].value, isActive: !!s.isActive });
      setSaveMsg("Сохранено");
    } catch (e: any) {
      setSaveMsg(e.message || "Ошибка сохранения");
    } finally {
      setSaving(false);
    }
  };

  const testConnection = async () => {
    setTesting(true);
    setTestMsg(null);
    try {
      const r: any = await apiFetch("/api/hikvision-plugin/test", { method: "POST", body: "{}" });
      setTestMsg({ ok: true, text: `Подключено. Камер в аккаунте: ${r.count}` });
    } catch (e: any) {
      setTestMsg({ ok: false, text: e.message || "Ошибка подключения" });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "16px 16px 32px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 8 }}>
        <h1 style={{ fontSize: 20, fontWeight: 600, margin: 0 }}>Камеры Hik-Connect</h1>
        <div style={{ display: "flex", gap: 8 }}>
          {settings.isActive && settings.login && (
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
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12, marginBottom: 12 }}>
            <label style={{ fontSize: 13, color: "var(--text-muted)" }}>
              Логин аккаунта Hik-Connect
              <input
                style={{ ...inputStyle, marginTop: 4 }}
                value={settings.login}
                onChange={(e) => setSettings({ ...settings, login: e.target.value })}
                placeholder="email или телефон"
                autoComplete="off"
              />
            </label>
            <label style={{ fontSize: 13, color: "var(--text-muted)" }}>
              Пароль
              <input
                style={{ ...inputStyle, marginTop: 4 }}
                type="password"
                value={settings.password}
                onChange={(e) => setSettings({ ...settings, password: e.target.value })}
                placeholder={settings.password === "••••••" ? "сохранён (не менять)" : "пароль"}
                autoComplete="new-password"
              />
            </label>
            <label style={{ fontSize: 13, color: "var(--text-muted)" }}>
              Регион облака
              <select
                style={{ ...inputStyle, marginTop: 4 }}
                value={settings.apiBaseUrl}
                onChange={(e) => setSettings({ ...settings, apiBaseUrl: e.target.value })}
              >
                {API_REGIONS.map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </label>
          </div>
          <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, marginBottom: 12, cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={settings.isActive}
              onChange={(e) => setSettings({ ...settings, isActive: e.target.checked })}
            />
            Плагин включён (страница «Камеры Hik-Connect» видна администраторам)
          </label>
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <button onClick={saveSettings} disabled={saving} style={btnPrimaryStyle}>
              {saving ? "Сохранение…" : "Сохранить"}
            </button>
            <button onClick={testConnection} disabled={testing || !settings.login} style={btnStyle}>
              {testing ? "Проверка…" : "Проверить подключение"}
            </button>
            {saveMsg && <span style={{ fontSize: 13, color: "var(--text-muted)" }}>{saveMsg}</span>}
            {testMsg && (
              <span style={{ fontSize: 13, color: testMsg.ok ? "#2e9e5b" : "#d9534f" }}>{testMsg.text}</span>
            )}
          </div>
        </div>
      )}

      {!settings.isActive && settingsLoaded && (
        <div style={{ ...cardStyle, color: "var(--text-muted)", fontSize: 14 }}>
          Плагин выключен. Включите его в настройках выше и задайте учётные данные аккаунта Hik-Connect.
        </div>
      )}

      {settings.isActive && camerasError && (
        <div style={{ ...cardStyle, color: "#d9534f", fontSize: 14, marginBottom: 16 }}>{camerasError}</div>
      )}

      {settings.isActive && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
          {cameras.map((cam) => (
            <div
              key={`${cam.deviceSerial}-${cam.channelNo}`}
              style={{ ...cardStyle, padding: 12, cursor: "pointer" }}
              onClick={() => setLiveCamera(cam)}
              title="Открыть live-поток"
            >
              <div style={{ borderRadius: 8, overflow: "hidden", background: "#000", aspectRatio: "16/10", display: "flex", alignItems: "center", justifyContent: "center" }}>
                {cam.snapshot ? (
                  <img
                    src={`data:image/jpeg;base64,${cam.snapshot}`}
                    alt={cam.name}
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
            src={`/api/hikvision-plugin/stream/${liveCamera.index}?token=${encodeURIComponent(getToken())}`}
            alt={liveCamera.name}
            style={{ maxWidth: "100%", maxHeight: "calc(90vh - 60px)", borderRadius: 10, background: "#000" }}
            onClick={(e) => e.stopPropagation()}
          />
          <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 12, marginTop: 10 }}>Нажмите в любое место, чтобы закрыть</div>
        </div>
      )}
    </div>
  );
}

const btnStyle: React.CSSProperties = {
  padding: "7px 14px",
  borderRadius: 8,
  border: "1px solid var(--border-color)",
  background: "var(--bg-card)",
  color: "var(--text-primary)",
  fontSize: 13,
  cursor: "pointer",
};

const btnPrimaryStyle: React.CSSProperties = {
  ...btnStyle,
  background: "#007AFF",
  borderColor: "#007AFF",
  color: "#fff",
};
