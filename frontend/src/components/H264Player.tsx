import { useEffect, useRef, useState } from "react";

// H.264/HEVC live-плеер поверх fMP4 (Media Source Extensions).
// Сервисы wecrm (hikvision-stream /h264, tapo-stream) отдают поток как
// инициализирующий сегмент (ftyp+moov+avcC/hvcC) и live-фрагменты (moof+mdat);
// кодек плеер определяет из avcC/hvcC самого потока, поэтому серверу не нужен
// отдельный info-эндпоинт. Таймстампы сервер ставит по прибытию кадров —
// воспроизведение идёт в реальном времени, без накопления задержки.
// При невоспроизводимом кодеке (например HEVC без его поддержки в браузере)
// можно откатиться на MJPEG-заглушку через mjpegFallback.

type H264PlayerProps = {
  src: string;
  mjpegFallback?: string;
  style?: React.CSSProperties;
};

function getToken(): string {
  return localStorage.getItem("token") || "";
}

function readU32(buf: Uint8Array, off: number): number {
  return buf[off] * 0x1000000 + ((buf[off + 1] << 16) | (buf[off + 2] << 8) | buf[off + 3]);
}

function findBoxType(buf: Uint8Array, type: string): number {
  const t = [type.charCodeAt(0), type.charCodeAt(1), type.charCodeAt(2), type.charCodeAt(3)];
  for (let i = 0; i + 4 <= buf.length; i++) {
    if (buf[i] === t[0] && buf[i + 1] === t[1] && buf[i + 2] === t[2] && buf[i + 3] === t[3]) return i;
  }
  return -1;
}

// Кодек-строка RFC 6381 из init-сегмента (avcC/hvcC лежат в stsd → avc1/hvc1)
function parseCodecFromInit(init: Uint8Array): string | null {
  const avc = findBoxType(init, "avcC");
  if (avc >= 0 && avc + 8 <= init.length) {
    const p = avc + 4; // payload avcC: [0]=version, [1..3]=profile/compat/level
    const hex = (n: number) => n.toString(16).toUpperCase().padStart(2, "0");
    return `avc1.${hex(init[p + 1])}${hex(init[p + 2])}${hex(init[p + 3])}`;
  }
  const hvc = findBoxType(init, "hvcC");
  if (hvc >= 0 && hvc + 16 <= init.length) {
    const p = hvc + 4; // payload hvcC (ISO/IEC 14496-15)
    const b1 = init[p + 1];
    const profile = b1 & 0x1f;
    const tier = (b1 >> 5) & 1;
    const compat = readU32(init, p + 2);
    const constraint = init[p + 6];
    const level = init[p + 12];
    return `hvc1.${profile}.${compat.toString(16)}.${tier ? "H" : "L"}${level}.${constraint.toString(16).toUpperCase().padStart(2, "0")}`;
  }
  return null;
}

function concatU8(a: Uint8Array, b: Uint8Array): Uint8Array<ArrayBuffer> {
  const out = new Uint8Array(a.length + b.length);
  out.set(a, 0);
  out.set(b, a.length);
  return out;
}

function once(target: EventTarget, event: string): Promise<void> {
  return new Promise((resolve) => target.addEventListener(event, () => resolve(), { once: true }));
}

export function H264Player({ src, mjpegFallback, style }: H264PlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [state, setState] = useState<"connecting" | "live" | "error">("connecting");
  const [hint, setHint] = useState("");
  const [diag, setDiag] = useState("");
  const [imgKey, setImgKey] = useState(0);

  useEffect(() => {
    const videoEl = videoRef.current;
    if (!videoEl) return;
    const video: HTMLVideoElement = videoEl;

    let cancelled = false;
    let attempts = 0;
    let ms: MediaSource | null = null;
    let sb: SourceBuffer | null = null;
    let sbFailed = false;
    let objectUrl: string | null = null;
    let ctrl: AbortController | null = null;
    let reader: ReadableStreamDefaultReader<Uint8Array> | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let watchdog: ReturnType<typeof setInterval> | null = null;
    let appendQ: Uint8Array<ArrayBuffer>[] = [];
    let initSent = false;
    let lastAdvance = Date.now();
    let fallbackUsed = false;
    let seekEdgeDone = false;

    const teardownMs = () => {
      if (objectUrl) { URL.revokeObjectURL(objectUrl); objectUrl = null; }
      ms = null; sb = null; appendQ = [];
    };

    const flushAppend = () => {
      if (!sb || sb.updating || sbFailed) return;
      const next = appendQ.shift();
      if (!next) return;
      try { sb.appendBuffer(next); } catch { sbFailed = true; handleFatal(); }
    };

    const onSbError = () => { sbFailed = true; handleFatal(); };
    const onTimeUpdate = () => { lastAdvance = Date.now(); };

    const scheduleReconnect = () => {
      if (cancelled) return;
      attempts += 1;
      if (!fallbackUsed) setState((s) => (s === "live" ? s : "error"));
      if (!hint) setHint("Поток прерван. Переподключение…");
      const delay = Math.min(15000, 500 * attempts);
      reconnectTimer = setTimeout(connect, delay);
    };

    function handleFatal() {
      if (cancelled) return;
      teardownMs();
      try { video.removeAttribute("src"); video.load(); } catch {}
      if (mjpegFallback && !fallbackUsed) {
        // HEVC-камеры Hik-Connect: браузер без HEVC — откат на MJPEG <img>
        fallbackUsed = true;
        setImgKey((k) => k + 1);
        setState("live");
        return;
      }
      scheduleReconnect();
    }

    async function connect() {
      if (cancelled) return;
      ctrl = new AbortController();
      setHint("");
      if (!fallbackUsed) setState("connecting");
      try {
        const resp = await fetch(src, { headers: { "X-Auth-Token": getToken() }, signal: ctrl.signal });
        if (cancelled) return;
        if (resp.status === 429) {
          setHint("Лимит потоков: камера или аккаунт заняты, повторите позже");
          setState("error");
          // длинный backoff, чтобы не забивать лимит повторами
          if (!cancelled) {
            attempts += 1;
            reconnectTimer = setTimeout(connect, 20000);
          }
          return;
        }
        if (!resp.ok || !resp.body) throw new Error(`HTTP ${resp.status}`);
        reader = resp.body.getReader();

        let buf: Uint8Array<ArrayBuffer> = new Uint8Array(0);
        let gotBytes = 0;
        for (;;) {
          const { done, value } = await reader.read();
          if (cancelled || done) break;
          buf = concatU8(buf, value);
          gotBytes += value.length;
          if (gotBytes % 65536 < value.length) {
            setDiag(`получено ${(gotBytes / 1024) | 0} КБ${initSent ? "" : ", init не найден"}`);
          }

          if (!initSent) {
            // init-сегмент = всё до конца moov (ftyp+moov); ждём его целиком
            let off = 0;
            let moovEnd = -1;
            while (off + 8 <= buf.length) {
              const size = readU32(buf, off);
              const type = String.fromCharCode(buf[off + 4], buf[off + 5], buf[off + 6], buf[off + 7]);
              if (size < 8 || off + size > buf.length) break;
              if (type === "moov") moovEnd = off + size;
              off += size;
            }
            if (moovEnd > 0) {
              const init = buf.slice(0, moovEnd);
              buf = buf.slice(moovEnd);
              const codec = parseCodecFromInit(init);
              const supported = codec && window.MediaSource ? MediaSource.isTypeSupported(codec) : false;
              setDiag(`init ${init.length} Б, кодек ${codec || "?"}, поддержка: ${supported}`);
              if (!codec || !window.MediaSource || !supported) {
                throw new Error(`Кодек не поддерживается браузером: ${codec || "?"} (поддержка: ${supported})`);
              }
              ms = new MediaSource();
              objectUrl = URL.createObjectURL(ms);
              video.src = objectUrl;
              await once(ms, "sourceopen");
              if (cancelled) return;
              sb = ms.addSourceBuffer(codec);
              // live-потоки несут PTS камеры/ретранслятора (не от 0):
              // после первого append и при отставании переносим currentTime
              // на live-край буфера, иначе кадры есть, а экран чёрный
              const seekToLiveEdge = () => {
                try {
                  if (!video.buffered.length) return;
                  const end = video.buffered.end(video.buffered.length - 1);
                  if (!seekEdgeDone) {
                    seekEdgeDone = true;
                    video.currentTime = end - 0.3;
                  } else if (video.currentTime < video.buffered.start(0) - 0.5 || end - video.currentTime > 30) {
                    video.currentTime = end - 0.3;
                  }
                } catch {}
              };
              sb.addEventListener("updateend", () => { flushAppend(); seekToLiveEdge(); });
              sb.addEventListener("error", onSbError);
              sb.appendBuffer(init);
              initSent = true;
              attempts = 0;
              lastAdvance = Date.now();
              setState("live");
            }
            if (buf.length > 4 * 1024 * 1024) throw new Error("init-сегмент не получен от сервиса");
            continue;
          }

          if (buf.length) {
            appendQ.push(buf);
            buf = new Uint8Array(0);
            flushAppend();
          }
        }
        if (!cancelled) scheduleReconnect();
      } catch (e: any) {
        if (cancelled || e?.name === "AbortError") return;
        setHint(e?.message || "Ошибка потока");
        setDiag(`ошибка: ${e?.name || "?"}: ${e?.message || e}`);
        console.error("[H264Player]", e);
        handleFatal();
      }
    }

    video.addEventListener("timeupdate", onTimeUpdate);
    // watchdog: видео не продвигается 15 с — пересоздаём соединение
    watchdog = setInterval(() => {
      if (cancelled || fallbackUsed || !initSent) return;
      if (Date.now() - lastAdvance > 15000) {
        lastAdvance = Date.now();
        ctrl?.abort();
        teardownMs();
        initSent = false;
        sbFailed = false;
        seekEdgeDone = false;
        connect();
      }
    }, 3000);

    connect();

    return () => {
      cancelled = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (watchdog) clearInterval(watchdog);
      video.removeEventListener("timeupdate", onTimeUpdate);
      ctrl?.abort();
      reader?.cancel().catch(() => {});
      teardownMs();
      try { video.removeAttribute("src"); video.load(); } catch {}
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src, mjpegFallback]);

  const boxStyle: React.CSSProperties = { position: "relative", background: "#000", borderRadius: 10, overflow: "hidden", ...style };
  const fallbackSrc = mjpegFallback
    ? `${mjpegFallback}${mjpegFallback.includes("?") ? "&" : "?"}token=${encodeURIComponent(getToken())}`
    : "";

  return (
    <div style={boxStyle}>
      <video ref={videoRef} muted playsInline autoPlay style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }} />
      {mjpegFallback && imgKey > 0 && (
        <img key={imgKey} src={fallbackSrc} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "contain" }} />
      )}
      {state === "connecting" && (
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6, color: "#fff", background: "rgba(0,0,0,.4)", fontSize: 14 }}>
          <div>Подключение…</div>
          {diag && <div style={{ fontSize: 11, opacity: 0.75, fontFamily: "monospace" }}>{diag}</div>}
        </div>
      )}
      {state === "error" && (
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: 12, color: "#fff", background: "rgba(0,0,0,.55)", fontSize: 14 }}>
          <div>{hint || "Ошибка потока"}</div>
          {diag && <div style={{ fontSize: 11, opacity: 0.75, marginTop: 6, fontFamily: "monospace" }}>{diag}</div>}
        </div>
      )}
    </div>
  );
}
