import { useEffect, useRef, useState } from "react";
import { api } from "../api/client";
import { closeIcon } from "./filesTheme";

// === Модальный текстовый редактор TXT (страница «Файлы») ===

interface FilesTextEditorProps {
  tab: string;
  itemPath: string;
  title: string;
  onClose: () => void;
  onSaved?: () => void;
}

export function FilesTextEditor({ tab, itemPath, title, onClose, onSaved }: FilesTextEditorProps) {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [dirty, setDirty] = useState(false);
  const savedRef = useRef(onSaved);
  savedRef.current = onSaved;

  useEffect(() => {
    api.files
      .textContent(tab, itemPath)
      .then((d: any) => setContent(String(d?.content ?? "")))
      .catch((e: any) => setError(e?.message || "Ошибка загрузки файла"))
      .finally(() => setLoading(false));
  }, [tab, itemPath]);

  const save = async () => {
    if (saving) return;
    setSaving(true);
    setError("");
    try {
      await api.files.saveText(tab, itemPath, content);
      setDirty(false);
      savedRef.current?.();
      onClose();
    } catch (e: any) {
      setError(e?.message || "Ошибка сохранения");
    } finally {
      setSaving(false);
    }
  };

  // Ctrl/Cmd+S — сохранение
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        void save();
      }
      if (e.key === "Escape" && !dirty) onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  });

  const requestClose = () => {
    if (dirty && !window.confirm("Закрыть редактор без сохранения изменений?")) return;
    onClose();
  };

  return (
    <div
      onClick={requestClose}
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 1250, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "var(--bg-card)",
          borderRadius: 16,
          border: "1px solid var(--border-color)",
          boxShadow: "0 16px 48px rgba(0,0,0,0.32)",
          width: "min(820px, calc(100vw - 32px))",
          height: "min(78vh, calc(100vh - 48px))",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* Шапка: имя файла + закрыть */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", borderBottom: "1px solid var(--border-color)", flexShrink: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 600, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={title}>
            {title}
            {dirty ? " ●" : ""}
          </div>
          <button onClick={requestClose} title="Закрыть" style={{ border: "none", background: "transparent", color: "var(--text-muted)", cursor: "pointer", padding: 4, display: "flex" }}>{closeIcon}</button>
        </div>
        {/* Область текста */}
        {loading ? (
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", fontSize: 14 }}>Загрузка файла...</div>
        ) : (
          <textarea
            autoFocus
            value={content}
            onChange={(e) => { setContent(e.target.value); setDirty(true); }}
            spellCheck={false}
            style={{
              flex: 1,
              minHeight: 0,
              resize: "none",
              border: "none",
              outline: "none",
              padding: "14px 16px",
              background: "var(--bg-input, var(--bg-hover))",
              color: "var(--text-primary)",
              fontFamily: "'SF Mono', Menlo, Consolas, 'Courier New', monospace",
              fontSize: 13,
              lineHeight: 1.55,
              whiteSpace: "pre",
              overflowWrap: "normal",
              overflowX: "auto",
            }}
          />
        )}
        {/* Подвал: ошибка, счётчик, кнопки */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 16px", borderTop: "1px solid var(--border-color)", flexShrink: 0 }}>
          <div style={{ flex: 1, fontSize: 12, color: "#FF3B30" }}>{error}</div>
          <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{content.length.toLocaleString()} симв.</div>
          <button
            onClick={requestClose}
            style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid var(--border-color)", background: "var(--bg-hover)", color: "var(--text-primary)", cursor: "pointer", fontSize: 14 }}
          >
            Закрыть
          </button>
          <button
            onClick={() => void save()}
            disabled={saving || loading || !!error && !dirty}
            style={{ padding: "8px 18px", borderRadius: 8, border: "none", background: "#007AFF", color: "#fff", cursor: "pointer", fontSize: 14, fontWeight: 500, opacity: saving ? 0.6 : 1 }}
          >
            {saving ? "Сохранение..." : "Сохранить"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default FilesTextEditor;
