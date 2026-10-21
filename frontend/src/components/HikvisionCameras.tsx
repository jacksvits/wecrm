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

function indexOfSub(hay: Uint8Array, needle: Uint8Array, from: number): number {
  outer: for (let i = from; i + needle.length <= hay.length; i++) {
    for (let j = 0; j < needle.length; j++) if (hay[i + j] !== needle[j]) continue outer;
    return i;
  }
  return -1;
}

// Вырезаем JPEG из multipart-сегмента: пропускаем CRLF и парт-заголовки
// до маркера SOI (0xFFD8), срезаем хвостовой CRLF после EOI
function trimFrame(f: Uint8Array): Uint8Array {
  const start = f.findIndex((b, i) => b === 0xff && f[i + 1] === 0xd8);
  if (start === -1) return f;
  let end = f.length;
  while (end > start + 2 && (f[end - 1] === 0x0a || f[end - 1] === 0x0d)) end--;
  return f.slice(start, end);
}

// MJPEG-плеер: читает поток через fetch, разбирает кадры по boundary,
// следит за «замиранием» (нет кадров 10 с) и сам переподключается.
// Прямой <img src=поток> не умеет ни диагностировать обрыв, ни восстанавливаться.
function MjpegPlayer({ src, style }: { src: string; style?: React.CSSProperties }) {
  const [frameUrl, setFrameUrl] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(true);
  const [limitMsg, setLimitMsg] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let reader: ReadableStreamDefaultReader<Uint8Array> | null = null;
    let watchdog: ReturnType<typeof setInterval> | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let attempts = 0;

    const scheduleReconnect = () => {
      attempts += 1;
      reconnectTimer = setTimeout(connect, Math.min(15000, 500 * attempts));
    };

    const connect = async () => {
      if (cancelled) return;
      setConnecting(true);
      setLimitMsg(false);
      try {
        const resp = await fetch(src, { headers: { "X-Auth-Token": getToken() } });
        if (!cancelled && resp.status === 429) {
          // лимит облака (2 потока): не долбим, показываем подсказку
          setLimitMsg(true);
          setConnecting(false);
          scheduleReconnect();
          return;
        }
        if (!cancelled && (!resp.ok || !resp.body)) throw new Error(`HTTP ${resp.status}`);
        const ct = resp.headers.get("content-type") || "";
        const bm = ct.match(/boundary=([^;]+)/);
        const bBytes = new TextEncoder().encode(`--${bm ? bm[1].trim() : "hikframe"}`);

        reader = resp.body!.getReader();
        let buf = new Uint8Array(0);
        let lastFrameAt = Date.now();
        attempts = 0;

        watchdog = setInterval(() => {
          if (!cancelled && Date.now() - lastFrameAt > 10_000) {
            try { reader?.cancel(); } catch { /* ignore */ }
            scheduleReconnect();
          }
        }, 3000);

        for (;;) {
          const { done, value } = await reader.read();
          if (done || cancelled) break;
          const next = new Uint8Array(buf.length + value.length);
          next.set(buf);
          next.set(value, buf.length);
          buf = next;
          for (;;) {
            const first = indexOfSub(buf, bBytes, 0);
            if (first === -1) {
              // мусор без boundary не копим больше 512 КБ
              if (buf.length > 512 * 1024) buf = buf.slice(buf.length - bBytes.length);
              break;
            }
            const second = indexOfSub(buf, bBytes, first + bBytes.length);
            if (second === -1) {
              buf = buf.slice(first);
              break;
            }
            const frame = trimFrame(buf.slice(first + bBytes.length, second));
            if (frame.length > 100 && frame[0] === 0xff && frame[1] === 0xd8) {
              lastFrameAt = Date.now();
              if (!cancelled) {
                const url = URL.createObjectURL(new Blob([frame.buffer as ArrayBuffer], { type: "image/jpeg" }));
                setFrameUrl((old) => {
                  if (old) URL.revokeObjectURL(old);
                  return url;
                });
                setConnecting(false);
              }
            }
            buf = buf.slice(second);
          }
        }
      } catch {
        // обрыв сети / ошибка сервера — переподключимся ниже
      }
      if (!cancelled) scheduleReconnect();
    };

    connect();
    return () => {
      cancelled = true;
      if (watchdog) clearInterval(watchdog);
      if (reconnectTimer) clearTimeout(reconnectTimer);
      try { reader?.cancel(); } catch { /* ignore */ }
      setFrameUrl((old) => {
        if (old) URL.revokeObjectURL(old);
        return null;
      });
    };
  }, [src]);

  return (
    <div style={{ position: "relative", background: "#000", borderRadius: 10, overflow: "hidden", ...style }}>
      {frameUrl && (
        <img src={frameUrl} alt="live" style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }} />
      )}
      {connecting && (
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center", padding: 12, color: "rgba(255,255,255,0.8)", fontSize: 13, background: frameUrl ? "rgba(0,0,0,0.45)" : "transparent" }}>
          Подключение… пробуждение камеры через облако может занять до 15 с
        </div>
      )}
      {limitMsg && !connecting && (
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center", padding: 12, color: "#ffd479", fontSize: 13, background: "rgba(0,0,0,0.55)" }}>
          Лимит облака: не более 2 одновременных просмотров. Закройте другие окна камер и подождите ~15 с.
        </div>
      )}
    </div>
  );
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
          {/* Плеер сам следит за потоком и переподключается при обрыве */}
          <div onClick={(e) => e.stopPropagation()}>
            <MjpegPlayer
              src={`/api/hikvision-plugin/stream/${liveCamera.index}?streamType=${liveStreamType}`}
              style={{ width: "min(92vw, 1100px)", height: "min(65vh, 600px)" }}
            />
          </div>
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
