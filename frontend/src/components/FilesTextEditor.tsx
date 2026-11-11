import { useEffect, useRef, useState } from "react";
import { EditorState } from "@codemirror/state";
import { EditorView, keymap, lineNumbers, highlightActiveLine, highlightActiveLineGutter } from "@codemirror/view";
import { defaultKeymap, history, historyKeymap, indentWithTab } from "@codemirror/commands";
import { syntaxHighlighting, defaultHighlightStyle, bracketMatching } from "@codemirror/language";
import { html } from "@codemirror/lang-html";
import { xml } from "@codemirror/lang-xml";
import { css } from "@codemirror/lang-css";
import { javascript } from "@codemirror/lang-javascript";
import { json } from "@codemirror/lang-json";
import { python } from "@codemirror/lang-python";
import { cpp } from "@codemirror/lang-cpp";
import { java } from "@codemirror/lang-java";
import { php } from "@codemirror/lang-php";
import { yaml } from "@codemirror/lang-yaml";
import { api } from "../api/client";
import { closeIcon, fileExtension } from "./filesTheme";

// === Модальный текстовый редактор (страница «Файлы») ===
// Подсветка синтаксиса CodeMirror 6 в зависимости от расширения файла;
// детект кодировки — на бэкенде, при смене кодировки спрашиваем, в какой сохранить.

const languageForFile = (name: string) => {
  const ext = fileExtension(name);
  switch (ext) {
    case "html": case "htm": return html();
    case "xml": case "svg": return xml();
    case "css": return css();
    case "js": return javascript();
    case "json": return json();
    case "py": return python();
    case "cpp": case "c": return cpp();
    case "java": return java();
    case "php": return php();
    case "yaml": case "yml": return yaml();
    default: return []; // txt, bat, cmd, ps1, ini, cfg, log, csv, reg, htaccess — обычный текст
  }
};

// Предохранительная тема в цветах CRM (CSS-переменные)
const editorTheme = EditorView.theme({
  "&": { height: "100%", backgroundColor: "transparent", color: "var(--text-primary)", fontSize: "13px" },
  ".cm-scroller": { fontFamily: "'SF Mono', Menlo, Consolas, 'Courier New', monospace", lineHeight: "1.55" },
  ".cm-content": { caretColor: "#007AFF" },
  ".cm-cursor": { borderLeftColor: "#007AFF" },
  "&.cm-focused": { outline: "none" },
  ".cm-gutters": { backgroundColor: "transparent", color: "var(--text-muted)", border: "none", paddingRight: "6px" },
  ".cm-activeLine": { backgroundColor: "rgba(127,127,127,0.09)" },
  ".cm-activeLineGutter": { backgroundColor: "transparent", color: "var(--text-primary)" },
  ".cm-selectionBackground, &.cm-focused .cm-selectionBackground": { backgroundColor: "rgba(0,122,255,0.28)" },
  ".cm-selectionMatch": { backgroundColor: "rgba(127,127,127,0.15)" },
}, { dark: true });

const prettifyEncoding = (enc: string) => {
  const e = enc.toLowerCase();
  if (e === "utf-8") return "UTF-8";
  if (e === "windows-1251") return "Windows-1251";
  if (e === "koi8-r") return "KOI8-R";
  if (e === "iso-8859-5") return "ISO-8859-5";
  return e.toUpperCase();
};

interface FilesTextEditorProps {
  tab: string;
  itemPath: string;
  title: string;
  onClose: () => void;
  onSaved?: () => void;
}

export function FilesTextEditor({ tab, itemPath, title, onClose, onSaved }: FilesTextEditorProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [dirty, setDirty] = useState(false);
  const [charCount, setCharCount] = useState(0);
  const [encoding, setEncoding] = useState("utf-8");
  const [encDialog, setEncDialog] = useState(false);
  const hostRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const savedRef = useRef(onSaved);
  savedRef.current = onSaved;

  useEffect(() => {
    let view: EditorView | null = null;
    api.files
      .textContent(tab, itemPath)
      .then((d: any) => {
        const text = String(d?.content ?? "");
        setEncoding(String(d?.encoding || "utf-8").toLowerCase());
        setCharCount(text.length);
        if (!hostRef.current) return;
        view = new EditorView({
          state: EditorState.create({
            doc: text,
            extensions: [
              lineNumbers(),
              highlightActiveLine(),
              highlightActiveLineGutter(),
              history(),
              bracketMatching(),
              keymap.of([...defaultKeymap, ...historyKeymap, indentWithTab]),
              syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
              editorTheme,
              languageForFile(title),
              EditorView.updateListener.of((u) => {
                if (u.docChanged) {
                  setDirty(true);
                  setCharCount(u.state.doc.length);
                }
              }),
            ],
          }),
          parent: hostRef.current!,
        });
        viewRef.current = view;
      })
      .catch((e: any) => setError(e?.message || "Ошибка загрузки файла"))
      .finally(() => setLoading(false));
    return () => { view?.destroy(); viewRef.current = null; };
  }, [tab, itemPath, title]);

  const doSave = async (targetEncoding: string) => {
    if (saving) return;
    setSaving(true);
    setError("");
    try {
      await api.files.saveText(tab, itemPath, viewRef.current?.state.doc.toString() ?? "", targetEncoding);
      setDirty(false);
      savedRef.current?.();
      onClose();
    } catch (e: any) {
      setError(e?.message || "Ошибка сохранения");
    } finally {
      setSaving(false);
    }
  };

  const requestSave = () => {
    // Кодировка отличалась от UTF-8 — спрашиваем, в какой сохранить
    if (encoding !== "utf-8") setEncDialog(true);
    else void doSave("utf-8");
  };

  // Ctrl/Cmd+S — сохранение
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        requestSave();
      }
      if (e.key === "Escape" && !dirty && !encDialog) onClose();
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
          width: "min(860px, calc(100vw - 32px))",
          height: "min(80vh, calc(100vh - 48px))",
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
        {/* Область редактирования */}
        {loading ? (
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", fontSize: 14 }}>Загрузка файла...</div>
        ) : error && !viewRef.current ? (
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "#FF3B30", fontSize: 14, padding: 20, textAlign: "center" }}>{error}</div>
        ) : (
          <div ref={hostRef} style={{ flex: 1, minHeight: 0, overflow: "hidden" }} />
        )}
        {/* Подвал: ошибка, кодировка, счётчик, кнопки */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 16px", borderTop: "1px solid var(--border-color)", flexShrink: 0, flexWrap: "wrap" }}>
          <div style={{ flex: 1, fontSize: 12, color: "#FF3B30", minWidth: 120 }}>{error}</div>
          <div style={{ fontSize: 12, color: "var(--text-muted)", whiteSpace: "nowrap" }}>
            Кодировка: <span style={{ color: "var(--text-primary)", fontWeight: 500 }}>{prettifyEncoding(encoding)}</span>
          </div>
          <div style={{ fontSize: 12, color: "var(--text-muted)", whiteSpace: "nowrap" }}>{charCount.toLocaleString()} симв.</div>
          <button
            onClick={requestClose}
            style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid var(--border-color)", background: "var(--bg-hover)", color: "var(--text-primary)", cursor: "pointer", fontSize: 14 }}
          >
            Закрыть
          </button>
          <button
            onClick={requestSave}
            disabled={saving || loading}
            style={{ padding: "8px 18px", borderRadius: 8, border: "none", background: "#007AFF", color: "#fff", cursor: "pointer", fontSize: 14, fontWeight: 500, opacity: saving ? 0.6 : 1 }}
          >
            {saving ? "Сохранение..." : "Сохранить"}
          </button>
        </div>
      </div>

      {/* Диалог выбора кодировки сохранения (исходная отличалась от UTF-8) */}
      {encDialog && (
        <div
          onClick={() => setEncDialog(false)}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1260, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ background: "var(--bg-card)", borderRadius: 16, width: "min(430px, calc(100vw - 32px))", border: "1px solid var(--border-color)", boxShadow: "0 12px 40px rgba(0,0,0,0.28)", padding: 20 }}
          >
            <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>В какой кодировке сохранить?</div>
            <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 18 }}>
              Файл был в кодировке {prettifyEncoding(encoding)}. Содержимое редактировалось как UTF-8 — выберите целевую кодировку.
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <button
                onClick={() => { setEncDialog(false); void doSave(encoding); }}
                style={{ padding: "10px 14px", borderRadius: 8, border: "1px solid var(--border-color)", background: "var(--bg-hover)", color: "var(--text-primary)", cursor: "pointer", fontSize: 14, textAlign: "left" }}
              >
                Сохранить в исходной ({prettifyEncoding(encoding)})
              </button>
              <button
                onClick={() => { setEncDialog(false); void doSave("utf-8"); }}
                style={{ padding: "10px 14px", borderRadius: 8, border: "none", background: "#007AFF", color: "#fff", cursor: "pointer", fontSize: 14, fontWeight: 500, textAlign: "left" }}
              >
                Сохранить в UTF-8
              </button>
              <button
                onClick={() => setEncDialog(false)}
                style={{ padding: "8px 14px", borderRadius: 8, border: "none", background: "transparent", color: "var(--text-muted)", cursor: "pointer", fontSize: 13, textAlign: "left" }}
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default FilesTextEditor;
