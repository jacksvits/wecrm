import { useEffect, useState } from "react";

// === Окно прогресса переносов файлов (копирование/перемещение между панелями) ===
// Показывает активные и завершённые задания: прогресс-бар по байтам,
// счётчик файлов и оценка оставшегося времени.

export interface TransferJobUI {
  id: string;
  mode: "copy" | "move";
  name: string;
  status: "running" | "done" | "error";
  totalBytes: number;
  copiedBytes: number;
  totalFiles: number;
  filesDone: number;
  error: string;
  startedAt: number;
}

const fmtBytes = (n: number) => {
  if (!n) return "0 Б";
  const units = ["Б", "КБ", "МБ", "ГБ", "ТБ"];
  const i = Math.min(units.length - 1, Math.floor(Math.log(n) / Math.log(1024)));
  return `${(n / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
};

const fmtEta = (ms: number) => {
  if (!isFinite(ms) || ms <= 0) return "";
  const s = Math.ceil(ms / 1000);
  if (s < 60) return `~${s} с`;
  const m = Math.floor(s / 60);
  return `~${m} мин ${s % 60} с`;
};

export function FilesTransferProgress({ jobs, onClose }: { jobs: TransferJobUI[]; onClose: () => void }) {
  const [, force] = useState(0);
  // Тикаем раз в секунду для обновления ETA
  useEffect(() => {
    if (!jobs.some((j) => j.status === "running")) return;
    const t = setInterval(() => force((x) => x + 1), 1000);
    return () => clearInterval(t);
  }, [jobs]);

  if (!jobs.length) return null;
  const hasRunning = jobs.some((j) => j.status === "running");

  return (
    <div style={{ position: "fixed", right: 16, bottom: 16, zIndex: 1300, width: "min(420px, calc(100vw - 32px))" }}>
      <div
        style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border-color)",
          borderRadius: 14,
          boxShadow: "0 12px 40px rgba(0,0,0,0.3)",
          padding: 14,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", marginBottom: 10 }}>
          <div style={{ fontSize: 14, fontWeight: 600, flex: 1 }}>
            {hasRunning ? "Перенос файлов…" : "Перенос завершён"}
          </div>
          {!hasRunning && (
            <button
              onClick={onClose}
              style={{ border: "none", background: "transparent", color: "var(--text-muted)", cursor: "pointer", fontSize: 13, padding: "2px 6px" }}
            >
              Закрыть
            </button>
          )}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {jobs.map((j) => {
            const percent = j.totalBytes > 0 ? Math.min(100, Math.round((j.copiedBytes / j.totalBytes) * 100)) : j.status !== "running" ? 100 : 0;
            const elapsed = Date.now() - j.startedAt;
            const eta = j.status === "running" && percent > 2 && percent < 100 ? fmtEta((elapsed * (100 - percent)) / percent) : "";
            return (
              <div key={j.id}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, marginBottom: 5 }}>
                  <span style={{ color: j.status === "error" ? "#FF3B30" : "var(--text-primary)", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }} title={j.name}>
                    {j.mode === "move" ? "Перемещение" : "Копирование"}: {j.name}
                  </span>
                  <span style={{ color: "var(--text-muted)", fontSize: 12, whiteSpace: "nowrap" }}>
                    {j.status === "running" ? `${percent}%${eta ? `, осталось ${eta}` : ""}` : j.status === "done" ? "✓ готово" : "ошибка"}
                  </span>
                </div>
                <div style={{ height: 8, borderRadius: 4, background: "var(--bg-hover)", overflow: "hidden" }}>
                  <div
                    style={{
                      height: "100%",
                      width: `${percent}%`,
                      borderRadius: 4,
                      background: j.status === "error" ? "#FF3B30" : "#007AFF",
                      transition: "width 0.5s ease",
                    }}
                  />
                </div>
                <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>
                  {j.status === "error"
                    ? j.error || "Ошибка переноса"
                    : `${fmtBytes(j.copiedBytes)} / ${fmtBytes(j.totalBytes)} · файлов: ${j.filesDone}${j.totalFiles ? ` / ${j.totalFiles}` : ""}`}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default FilesTransferProgress;
