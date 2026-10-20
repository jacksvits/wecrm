import { useEffect, useRef, useState } from "react";

// Пауза перед автопереподключением после обрыва потока
const RETRY_DELAY_MS = 10_000;

type CameraStreamImageProps = {
  cameraId: string;
  // Внешний «тик» для принудительного пересоздания потока (как раньше refreshKey)
  refreshKey?: number | string;
  alt?: string;
  style?: React.CSSProperties;
  onLoad?: (e: React.SyntheticEvent<HTMLImageElement>) => void;
  onClick?: (e: React.MouseEvent<HTMLImageElement>) => void;
  onDoubleClick?: (e: React.MouseEvent<HTMLImageElement>) => void;
  // Подсказка под плейсхолдером при недоступности (например, IP камеры)
  hint?: string;
};

// <img> для MJPEG-потока камеры с автопереподключением. Раньше при обрыке
// потока картинка либо скрывалась навсегда, либо оставалась висеть на
// последнем кадре. Теперь: onError -> плейсхолдер + повторная попытка
// через 10 с (бесконечно, с пересозданием URL).
export function CameraStreamImage({ cameraId, refreshKey = 0, alt = "IP-камера", style, onLoad, onClick, onDoubleClick, hint }: CameraStreamImageProps) {
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const retryTimer = useRef<number | null>(null);

  useEffect(() => () => {
    if (retryTimer.current !== null) window.clearTimeout(retryTimer.current);
  }, []);

  // Внешний refreshKey сбрасывает ошибку — виджет сам решил пересоздать поток
  useEffect(() => {
    setFailed(false);
  }, [refreshKey, cameraId]);

  const handleError = () => {
    if (retryTimer.current !== null) return;
    setFailed(true);
    retryTimer.current = window.setTimeout(() => {
      retryTimer.current = null;
      setFailed(false);
      setAttempt((a) => a + 1);
    }, RETRY_DELAY_MS);
  };

  if (failed) {
    return (
      <div
        style={{
          width: "100%", height: "100%", minHeight: 80,
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "var(--text-muted)", fontSize: 13, textAlign: "center", padding: 12,
          background: "#000",
        }}
      >
        <div>
          <div style={{ fontSize: 24, marginBottom: 8 }}>📷</div>
          Камера недоступна<br />
          <span style={{ fontSize: 11, opacity: 0.7 }}>Переподключение…{hint ? ` ${hint}` : ""}</span>
        </div>
      </div>
    );
  }

  return (
    <img
      key={`${cameraId}-${refreshKey}-${attempt}`}
      src={`/api/camera/stream/${cameraId}?t=${refreshKey}-${attempt}`}
      alt={alt}
      style={{ display: "block", ...style }}
      onLoad={onLoad}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      onError={handleError}
    />
  );
}
