import { useEffect, useState } from "react";
import { api } from "../api/client";
import { useAuth } from "../hooks/useAuth";
import { useCall } from "../context/CallContext";
import { WebCall } from "../types";
import { Avatar } from "./Avatar";

// История аудио/видеозвонков текущего пользователя (оба направления).
// Повторный звонок — кнопками 📞/🎥 прямо из строки истории.

function formatDuration(sec: number) {
  if (!sec) return "";
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return m ? `${m} мин ${s} сек` : `${s} сек`;
}

export function CallHistory() {
  const { user: currentUser } = useAuth();
  const { startCall } = useCall();
  const [calls, setCalls] = useState<WebCall[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    api.calls
      .list(100)
      .then(setCalls)
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const statusMeta: Record<string, { icon: string; color: string; label: string }> = {
    ended: { icon: "✓", color: "#2e7d32", label: "Состоялся" },
    missed: { icon: "↷", color: "#c62828", label: "Пропущенный" },
    rejected: { icon: "✕", color: "#c62828", label: "Отклонён" },
    cancelled: { icon: "◌", color: "var(--text-muted)", label: "Отменён" },
    busy: { icon: "⚡", color: "#ef6c00", label: "Занято" },
    ringing: { icon: "…", color: "var(--text-muted)", label: "Вызов" },
    ongoing: { icon: "●", color: "#2e7d32", label: "Идёт" },
  };

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
          flexWrap: "wrap",
          gap: 8,
        }}
      >
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 600, color: "var(--text-primary)" }}>
          Звонки
        </h2>
        <button
          onClick={load}
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border-color)",
            borderRadius: 10,
            padding: "8px 14px",
            fontSize: 13,
            cursor: "pointer",
            color: "var(--text-secondary)",
          }}
        >
          Обновить
        </button>
      </div>

      {loading && (
        <div style={{ textAlign: "center", padding: 40, color: "var(--text-muted)" }}>Загрузка…</div>
      )}

      {!loading && calls.length === 0 && (
        <div style={{ textAlign: "center", padding: 40, color: "var(--text-muted)", fontSize: 14 }}>
          Звонков пока не было
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {calls.map((call) => {
          const outgoing = call.callerId === currentUser?.id;
          const peer = outgoing ? call.callee : call.caller;
          const meta = statusMeta[call.status] || statusMeta.ended;
          return (
            <div
              key={call.id}
              style={{
                background: "var(--bg-card)",
                border: "1px solid var(--border-color)",
                borderRadius: 16,
                padding: "12px 16px",
                display: "flex",
                alignItems: "center",
                gap: 12,
                boxShadow: "var(--shadow)",
              }}
            >
              <span title={meta.label} style={{ fontSize: 14, color: meta.color, width: 18, textAlign: "center" }}>
                {meta.icon}
              </span>
              <span style={{ fontSize: 14, color: "var(--text-muted)", width: 16, textAlign: "center" }}>
                {outgoing ? "↗" : "↙"}
              </span>
              <Avatar name={peer?.name || "?"} avatar={peer?.avatar} size={36} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 500,
                    color: "var(--text-primary)",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {peer?.name || "Пользователь"}
                </div>
                <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                  {new Date(call.createdAt).toLocaleString("ru")}
                  {call.type === "video" ? " · видео" : ""}
                  {call.status === "ended" && call.duration ? ` · ${formatDuration(call.duration)}` : ""}
                  {` · ${meta.label.toLowerCase()}`}
                </div>
              </div>
              {peer && peer.id !== currentUser?.id && (
                <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                  <button
                    onClick={() => startCall({ id: peer.id, name: peer.name, avatar: peer.avatar }, "audio")}
                    style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: 14, padding: 4 }}
                    title="Позвонить"
                  >
                    📞
                  </button>
                  <button
                    onClick={() => startCall({ id: peer.id, name: peer.name, avatar: peer.avatar }, "video")}
                    style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: 14, padding: 4 }}
                    title="Видеозвонок"
                  >
                    🎥
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
