import { useCallback, useState } from "react";

// Скрытые камеры страницы «Видеорегистратор». Списки скрытых камер хранятся
// в localStorage по вкладкам (vr_hidden_<tab>: local — локальные RTSP, tapo —
// Tapo, hik — Hik-Connect), чтобы скрытие переживало обновление страницы.
// Возврат скрытых камер — через окно настроек (кнопка ⚙️ в шапке вкладки).

const storageKey = (tab: string) => `vr_hidden_${tab}`;

export function loadHiddenCameras(tab: string): string[] {
  try {
    const raw = JSON.parse(localStorage.getItem(storageKey(tab)) || "[]");
    return Array.isArray(raw) ? raw.map(String) : [];
  } catch {
    return [];
  }
}

export function saveHiddenCameras(tab: string, ids: string[]) {
  try { localStorage.setItem(storageKey(tab), JSON.stringify(ids)); } catch {}
}

export function useHiddenCameras(tab: string) {
  const [hidden, setHidden] = useState<string[]>(() => loadHiddenCameras(tab));

  const hide = useCallback((id: string) => {
    setHidden((prev) => {
      if (prev.includes(id)) return prev;
      const next = [...prev, id];
      saveHiddenCameras(tab, next);
      return next;
    });
  }, [tab]);

  const restore = useCallback((id: string) => {
    setHidden((prev) => {
      const next = prev.filter((x) => x !== id);
      saveHiddenCameras(tab, next);
      return next;
    });
  }, [tab]);

  const restoreAll = useCallback(() => {
    setHidden(() => {
      saveHiddenCameras(tab, []);
      return [];
    });
  }, [tab]);

  return { hidden, hide, restore, restoreAll };
}

// Стиль маленьких иконок-кнопок в шапке карточки камеры (как в CameraWidget).
export const cameraIconBtnStyle: React.CSSProperties = {
  background: "none", border: "none", cursor: "pointer",
  padding: 2, opacity: 0.5, transition: "opacity 0.15s",
  color: "var(--text-muted)", fontSize: 14,
};

// Модальное окно со списком скрытых камер: вернуть одну или все.
export function HiddenCamerasModal({ title, items, open, onClose, onRestore, onRestoreAll }: {
  title: string;
  items: { id: string; label: string }[];
  open: boolean;
  onClose: () => void;
  onRestore: (id: string) => void;
  onRestoreAll: () => void;
}) {
  if (!open) return null;
  return (
    <div style={{
      position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
      background: "rgba(0,0,0,0.4)", zIndex: 300,
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "max(16px, env(safe-area-inset-top, 0)) max(16px, env(safe-area-inset-right, 0)) max(16px, env(safe-area-inset-bottom, 0)) max(16px, env(safe-area-inset-left, 0))",
    }} onClick={onClose}>
      <div style={{
        background: "var(--bg-card)", borderRadius: 16, padding: 24,
        width: "100%", maxWidth: 420, boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
        border: "1px solid var(--border-color)",
      }} onClick={(e) => e.stopPropagation()}>
        <h3 style={{ margin: "0 0 16px", fontSize: 16, fontWeight: 600 }}>{title}</h3>
        {items.length === 0 ? (
          <div style={{ fontSize: 13, color: "var(--text-muted)" }}>Скрытых камер нет.</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {items.map((item) => (
              <div key={item.id} style={{
                display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8,
                padding: "8px 12px", borderRadius: 10,
                border: "1px solid var(--border-color)", background: "var(--bg-input)",
              }}>
                <span style={{ fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.label}</span>
                <button
                  onClick={() => onRestore(item.id)}
                  style={{
                    padding: "4px 12px", borderRadius: 8, border: "1px solid var(--border-color)",
                    background: "var(--bg-card)", color: "var(--text-primary)", fontSize: 12,
                    cursor: "pointer", whiteSpace: "nowrap",
                  }}
                >Вернуть</button>
              </div>
            ))}
          </div>
        )}
        <div style={{ display: "flex", gap: 10, marginTop: 20, justifyContent: "flex-end" }}>
          {items.length > 1 && (
            <button
              onClick={onRestoreAll}
              style={{
                padding: "8px 16px", borderRadius: 10, border: "1px solid var(--border-color)",
                background: "var(--bg-input)", color: "var(--text-primary)", fontSize: 13,
                cursor: "pointer", marginRight: "auto",
              }}
            >Вернуть все</button>
          )}
          <button
            onClick={onClose}
            style={{
              padding: "8px 16px", borderRadius: 10, border: "1px solid var(--border-color)",
              background: "var(--bg-input)", color: "var(--text-primary)", fontSize: 13,
              cursor: "pointer",
            }}
          >Закрыть</button>
        </div>
      </div>
    </div>
  );
}
