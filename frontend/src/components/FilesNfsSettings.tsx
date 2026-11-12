import { useCallback, useEffect, useState } from "react";
import { api } from "../api/client";

// === Блок «NFS-папки» в настройках страницы «Файлы» (только для администраторов) ===
// Список подключённых NFS-шар (вкладок): статус монтирования, чтение/запись,
// добавление новых и редактирование/удаление существующих.

interface NfsFolder {
  id: string;
  tabKey: string;
  label: string;
  host: string;
  export: string;
  readOnly: boolean;
  status: { mounted: boolean; readable: boolean; writable: boolean; error: string };
}

const btnBase: React.CSSProperties = {
  padding: "6px 12px", borderRadius: 8, cursor: "pointer", fontSize: 13,
};
const inputStyle: React.CSSProperties = {
  width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid var(--border-color)",
  background: "var(--bg-hover)", color: "var(--text-primary)", fontSize: 14, boxSizing: "border-box",
  fontFamily: "inherit",
};

export function FilesNfsSettings({ onChanged }: { onChanged: () => void }) {
  const [folders, setFolders] = useState<NfsFolder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<NfsFolder | null>(null);
  const [label, setLabel] = useState("");
  const [host, setHost] = useState("192.168.8.3");
  const [nfsExport, setNfsExport] = useState("");
  const [readOnly, setReadOnly] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await api.files.nfsList();
      setFolders(Array.isArray(data) ? data : []);
      setError("");
    } catch (e: any) {
      setError(e?.message || "Ошибка загрузки списка папок");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const resetForm = () => {
    setShowForm(false);
    setEditing(null);
    setLabel("");
    setHost("192.168.8.3");
    setNfsExport("");
    setReadOnly(false);
  };

  const startEdit = (f: NfsFolder) => {
    setEditing(f);
    setShowForm(true);
    setLabel(f.label);
    setHost(f.host);
    setNfsExport(f.export);
    setReadOnly(f.readOnly);
    setError("");
  };

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    setError("");
    try {
      if (editing) {
        await api.files.nfsUpdate(editing.id, { label: label.trim(), host: host.trim(), export: nfsExport.trim(), readOnly });
      } else {
        await api.files.nfsCreate({ label: label.trim(), host: host.trim(), export: nfsExport.trim(), readOnly });
      }
      resetForm();
      await load();
      onChanged();
    } catch (e: any) {
      setError(e?.message || "Ошибка сохранения");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (f: NfsFolder) => {
    if (!window.confirm(`Удалить папку «${f.label}» (${f.host}:${f.export})? Вкладка исчезнет со страницы «Файлы».`)) return;
    setError("");
    try {
      await api.files.nfsRemove(f.id);
      await load();
      onChanged();
    } catch (e: any) {
      setError(e?.message || "Ошибка удаления");
    }
  };

  return (
    <div style={{ borderTop: "1px solid var(--border-color)", marginTop: 16, paddingTop: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
        <div style={{ fontSize: 13, fontWeight: 600 }}>NFS-папки</div>
        <button
          onClick={() => { setShowForm(!showForm); setEditing(null); setLabel(""); setHost("192.168.8.3"); setNfsExport(""); setReadOnly(false); setError(""); }}
          style={{ ...btnBase, marginLeft: "auto", border: "1px solid var(--border-color)", background: "var(--bg-hover)", color: "var(--text-primary)" }}
        >
          {showForm && !editing ? "Отмена" : "+ Добавить папку"}
        </button>
      </div>

      {loading ? (
        <div style={{ fontSize: 13, color: "var(--text-muted)" }}>Загрузка...</div>
      ) : folders.length === 0 && !showForm ? (
        <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 8 }}>
          NFS-папки не подключены. Добавьте первую папку — она появится вкладкой на странице «Файлы».
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 10 }}>
          {folders.map((f) => {
            const ok = f.status?.mounted && f.status?.readable;
            return (
              <div
                key={f.id}
                style={{
                  display: "flex", alignItems: "center", gap: 10, padding: "8px 10px",
                  borderRadius: 8, border: "1px solid var(--border-color)", background: "var(--bg-hover)",
                  flexWrap: "wrap",
                }}
              >
                <span
                  title={ok ? "Подключена" : "Ошибка подключения"}
                  style={{ width: 8, height: 8, borderRadius: "50%", flexShrink: 0, background: ok ? "#34C759" : "#FF3B30" }}
                />
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {f.label}
                    {f.readOnly && <span style={{ marginLeft: 6, fontSize: 11, fontWeight: 500, color: "var(--text-muted)" }}>только чтение</span>}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {f.host}:{f.export}
                    {!ok && f.status?.error ? ` — ${f.status.error}` : ""}
                  </div>
                </div>
                <button onClick={() => startEdit(f)} style={{ ...btnBase, border: "1px solid var(--border-color)", background: "transparent", color: "var(--text-primary)" }}>
                  Изменить
                </button>
                <button onClick={() => handleDelete(f)} style={{ ...btnBase, border: "1px solid rgba(255,59,48,0.35)", background: "transparent", color: "#FF3B30" }}>
                  Удалить
                </button>
              </div>
            );
          })}
        </div>
      )}

      {showForm && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8, padding: 12, borderRadius: 10, border: "1px solid var(--border-color)", background: "var(--bg-hover)", marginBottom: 8 }}>
          <div style={{ fontSize: 13, fontWeight: 600 }}>{editing ? "Изменить папку" : "Новая NFS-папка"}</div>
          <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Название вкладки (например: Музыка)" style={inputStyle} />
          <input value={host} onChange={(e) => setHost(e.target.value)} placeholder="Сервер NFS (например: 192.168.8.3)" style={inputStyle} />
          <input value={nfsExport} onChange={(e) => setNfsExport(e.target.value)} placeholder="Экспорт (например: /volume3/MUSIC)" style={inputStyle} />
          <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--text-primary)", cursor: "pointer" }}>
            <input type="checkbox" checked={readOnly} onChange={(e) => setReadOnly(e.target.checked)} />
            Только чтение
          </label>
          {error && <div style={{ fontSize: 12, color: "#FF3B30" }}>{error}</div>}
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <button onClick={resetForm} style={{ ...btnBase, border: "1px solid var(--border-color)", background: "transparent", color: "var(--text-primary)" }}>
              Отмена
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !label.trim() || !host.trim() || !nfsExport.trim()}
              style={{ ...btnBase, border: "none", background: "#007AFF", color: "#fff", fontWeight: 500, opacity: saving ? 0.6 : 1 }}
            >
              {saving ? "Сохранение..." : editing ? "Сохранить" : "Добавить"}
            </button>
          </div>
        </div>
      )}

      {!showForm && error && <div style={{ fontSize: 12, color: "#FF3B30", marginBottom: 8 }}>{error}</div>}
      <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
        Папка монтируется внутри сервера CRM и появляется новой вкладкой; время отклика зависит от NFS-сервера.
      </div>
    </div>
  );
}

export default FilesNfsSettings;
