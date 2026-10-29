import { useCallback, useEffect, useState } from "react";
import { type TapoSettingsData } from "./TapoSettings";
import { H264Player } from "./H264Player";
import { cameraIconBtnStyle, HiddenCamerasModal, useHiddenCameras } from "./HiddenCameras";

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

const inputStyle: React.CSSProperties = {
  padding: "7px 12px",
  borderRadius: 8,
  border: "1px solid var(--border-color)",
  background: "var(--bg-card)",
  color: "var(--text-primary)",
  fontSize: 14,
  boxSizing: "border-box",
};

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

function CameraCard({ cam, token, onWatch, onHide }: { cam: TapoCamera; token: string; onWatch: () => void; onHide: (index: number) => void }) {
  const [snap, setSnap] = useState<string | null>(null);
  const [snapErr, setSnapErr] = useState(false);

  const reload = useCallback(() => {
    setSnapErr(false);
    setSnap(`/api/tapo-plugin/snapshot/${cam.index}?token=${encodeURIComponent(token)}&ts=${Date.now()}`);
  }, [cam.index, token]);

  useEffect(() => { reload(); }, [reload]);

  return (
    <div style={{ ...card, padding: 0, overflow: "hidden", display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
        <div style={{ fontWeight: 500, fontSize: 15, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={cam.name}>{cam.name}</div>
        <span style={{ display: "flex", alignItems: "center", gap: 2 }}>
          <button
            onClick={(e) => { e.stopPropagation(); reload(); }}
            title="Обновить превью"
            style={cameraIconBtnStyle}
            onMouseEnter={(e) => e.currentTarget.style.opacity = "1"}
            onMouseLeave={(e) => e.currentTarget.style.opacity = "0.5"}
          >↻</button>
          <button
            onClick={(e) => { e.stopPropagation(); onHide(cam.index); }}
            title="Скрыть камеру"
            style={cameraIconBtnStyle}
            onMouseEnter={(e) => e.currentTarget.style.opacity = "1"}
            onMouseLeave={(e) => e.currentTarget.style.opacity = "0.5"}
          >✕</button>
        </span>
      </div>
      <div style={{ position: "relative", background: "#000", aspectRatio: "16/9", cursor: "pointer", margin: "0 16px 16px", borderRadius: 10, overflow: "hidden" }} onClick={onWatch}>
        {snap && !snapErr && (
          <img src={snap} alt={cam.name} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
            onError={() => setSnapErr(true)} />
        )}
        {(!snap || snapErr) && (
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", fontSize: 13 }}>
            {snapErr ? "Превью недоступно" : "Загрузка…"}
          </div>
        )}
      </div>
    </div>
  );
}


// ==== облачные камеры (CIPC relay; камеры вне LAN сервера) ====
type CloudCamera = { deviceId: string; name: string; model: string; status?: number };

function CloudCamerasSection({ settings, lanNames, onLive, hidden, onHide }: {
  settings: TapoSettingsData | null;
  lanNames: Set<string>;
  onLive: (cam: CloudCamera) => void;
  hidden: string[];
  onHide: (deviceId: string) => void;
}) {
  const [cloudCams, setCloudCams] = useState<CloudCamera[]>([]);
  const [mfa, setMfa] = useState<{ types: number[]; code: string; mfaType: number; busy: boolean; msg: string } | null>(null);
  const [msg, setMsg] = useState("");

  const load = useCallback(async () => {
    if (!settings?.login || !settings?.password) return;
    setMsg("Загрузка облачных камер…");
    try {
      const r: any = await apiFetch("/api/tapo-plugin/cloud-cameras", {
        method: "POST",
        body: JSON.stringify({ login: settings.login, password: settings.password }),
      });
      if (r.mfa_required) {
        setMfa({ types: r.mfa_types || [2], code: "", mfaType: (r.mfa_types || [2]).includes(2) ? 2 : r.mfa_types[0], busy: false, msg: "" });
        setMsg("");
        return;
      }
      setMfa(null);
      setCloudCams(Array.isArray(r.cameras) ? r.cameras : []);
      setMsg("");
    } catch (e: any) {
      setMsg(e.message || "Ошибка загрузки облачных камер");
    }
  }, [settings]);

  useEffect(() => { load(); }, [load]);

  const sendMfa = async () => {
    if (!mfa) return;
    setMfa({ ...mfa, busy: true, msg: "" });
    try {
      const r: any = await apiFetch("/api/tapo-plugin/cloud-mfa", {
        method: "POST",
        body: JSON.stringify({ code: mfa.code, mfa_type: mfa.mfaType }),
      });
      if (r.mfa_required) { setMfa({ ...mfa, busy: false, msg: "Нужен вход заново" }); return; }
      setMfa(null);
      setCloudCams(Array.isArray(r.cameras) ? r.cameras : []);
      setMsg("");
    } catch (e: any) {
      setMfa({ ...mfa, busy: false, msg: e.message || "Ошибка подтверждения" });
    }
  };

  if (!settings?.login) return null;

  if (mfa) {
    return (
      <div style={{ ...card, marginBottom: 16 }}>
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>Подтверждение входа в облако TP-Link</div>
        <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 10 }}>
          TP-Link запросил двухфакторную проверку нового устройства.
          {mfa.types.includes(2) ? " Код придёт на email аккаунта." : " Подтвердите вход в приложении Tapo."}
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          {mfa.types.includes(2) && (
            <>
              <input style={{ ...inputStyle, width: 160 }} placeholder="Код из email" value={mfa.code}
                onChange={(e) => setMfa({ ...mfa, code: e.target.value.trim() })} />
              <button onClick={sendMfa} disabled={mfa.busy || !mfa.code} style={btnPrimaryStyle}>{mfa.busy ? "Проверка…" : "Подтвердить"}</button>
            </>
          )}
          {mfa.types.includes(1) && (
            <button onClick={async () => {
              setMfa({ ...mfa, busy: true, msg: "Отправлен запрос в приложение Tapo…" });
              try { await apiFetch("/api/tapo-plugin/cloud-mfa", { method: "POST", body: JSON.stringify({ mfa_type: 1 }) }); } catch {}
              setMfa({ ...mfa, busy: false });
            }} disabled={mfa.busy} style={btnStyle}>Запросить подтверждение в приложении</button>
          )}
        </div>
        {mfa.msg && <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 8 }}>{mfa.msg}</div>}
      </div>
    );
  }

  const visible = cloudCams.filter((c) => !lanNames.has(c.name) && !hidden.includes(`cloud:${c.deviceId}`));
  if (!visible.length && !msg) return null;

  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 8 }}>Камеры через облако TP-Link</div>
      {msg && <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 8 }}>{msg}</div>}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
        {visible.map((cam) => (
          <div key={cam.deviceId} style={{ ...card, padding: 0, overflow: "hidden", display: "flex", flexDirection: "column" }}>
            <div style={{ padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
              <div style={{ fontWeight: 500, fontSize: 15, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={cam.name}>{cam.name}</div>
              <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 12, color: "var(--text-muted)", whiteSpace: "nowrap" }}>облако</span>
                <button
                  onClick={() => onHide(cam.deviceId)}
                  title="Скрыть камеру"
                  style={cameraIconBtnStyle}
                  onMouseEnter={(e) => e.currentTarget.style.opacity = "1"}
                  onMouseLeave={(e) => e.currentTarget.style.opacity = "0.5"}
                >✕</button>
              </span>
            </div>
            <div style={{ position: "relative", background: "#000", aspectRatio: "16/9", cursor: "pointer", margin: "0 16px 16px", borderRadius: 10, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", fontSize: 13, textAlign: "center", padding: 8 }}
              onClick={() => onLive(cam)} title="Открыть трансляцию">
              Прямая трансляция через облако TP-Link (~1–2 с задержки)
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function TapoCameras() {
  const [settings, setSettings] = useState<TapoSettingsData | null>(null);
  const [cameras, setCameras] = useState<TapoCamera[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [liveCloud, setLiveCloud] = useState<CloudCamera | null>(null);
  const [liveCamera, setLiveCamera] = useState<TapoCamera | null>(null);
  const [liveStreamType, setLiveStreamType] = useState<1 | 2>(1);
  const { hidden, hide, restore, restoreAll } = useHiddenCameras("tapo");
  const [showHidden, setShowHidden] = useState(false);
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

  const visibleCameras = cameras.filter((c) => !hidden.includes(String(c.index)));
  const hiddenItems = [
    ...cameras.filter((c) => hidden.includes(String(c.index))).map((c) => ({ id: String(c.index), label: `${c.name} (${c.ip || "Tapo"})` })),
    ...hidden.filter((id) => id.startsWith("cloud:")).map((id) => ({ id, label: `Облачная камера ${id.replace("cloud:", "")}` })),
  ];

  return (
    <div style={{ padding: 20 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8, flexWrap: "wrap" }}>
        <div style={{ fontSize: 13, color: "var(--text-muted)" }}>Камеры Tapo</div>
        {settings?.isActive && (
          <button onClick={refresh} disabled={refreshing} style={{ ...btnStyle, marginLeft: "auto" }}>{refreshing ? "Обновление…" : "Обновить"}</button>
        )}
        {hidden.length > 0 && (
          <button onClick={() => setShowHidden(true)} style={btnStyle} title="Скрытые камеры">⚙️ Скрытые ({hidden.length})</button>
        )}
      </div>
      {loading && <div style={{ fontSize: 13, color: "var(--text-muted)" }}>Загрузка…</div>}
      {!loading && loadError && <div style={{ ...card, borderColor: "#d9534f", fontSize: 13 }}>{loadError}</div>}
      {!loading && !loadError && settings && !settings.isActive && (
        <div style={{ ...card, fontSize: 13, color: "var(--text-muted)" }}>Плагин выключен. Включите его в «Настройки» → «Интеграции» — тогда здесь появится сетка камер.</div>
      )}
      {!!visibleCameras.length && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
          {visibleCameras.map((cam) => (
            <CameraCard key={cam.index} cam={cam} token={token} onWatch={() => { setLiveCamera(cam); setLiveStreamType(1); }} onHide={(index) => hide(String(index))} />
          ))}
        </div>
      )}

      {settings?.isActive && (
        <CloudCamerasSection
          settings={settings}
          lanNames={new Set(cameras.map((c) => c.name))}
          onLive={(cam) => setLiveCloud(cam)}
          hidden={hidden}
          onHide={(deviceId) => hide(`cloud:${deviceId}`)}
        />
      )}

{liveCloud && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 20 }}
          onClick={() => setLiveCloud(null)}>
          <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: 12, padding: 16, width: "100%", maxWidth: 900 }}
            onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
              <div style={{ fontWeight: 600, fontSize: 16 }}>{liveCloud.name} <span style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 400 }}>через облако TP-Link</span></div>
              <button onClick={() => setLiveCloud(null)} style={btnStyle}>Закрыть</button>
            </div>
            <H264Player
              src={`/api/tapo-plugin/cloud-stream/${encodeURIComponent(liveCloud.deviceId)}`}
              mjpegFallback={`/api/tapo-plugin/cloud-stream-mjpeg/${encodeURIComponent(liveCloud.deviceId)}`}
              style={{ width: "100%", aspectRatio: "16/9", background: "#000" }}
            />
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 8 }}>
              H.264 (fMP4/MSE) через облачный ретранслятор TP-Link, задержка ~1–2 с. Камера не обязана быть в сети сервера.
            </div>
          </div>
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
      {/* Возврат скрытых камер */}
      <HiddenCamerasModal
        title="Скрытые камеры"
        items={hiddenItems}
        open={showHidden}
        onClose={() => setShowHidden(false)}
        onRestore={(id) => restore(id)}
        onRestoreAll={restoreAll}
      />
    </div>
  );
}
