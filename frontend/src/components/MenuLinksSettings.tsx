import { useEffect, useState } from "react";
import { api } from "../api/client";

// Под-вкладка «Меню» в Системных настройках: ссылки кнопок футера страницы входа
// (Презентация, Каталог, Файлы, Новости, О компании). Обычные поля ввода URL.
export function MenuLinksSettings() {
  const [links, setLinks] = useState<{ key: string; label: string; url: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      const d = await api.menuLinks.get();
      if (Array.isArray(d) && d.length) setLinks(d);
    } catch (e: any) {
      setMsg(`Ошибка загрузки: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const save = async () => {
    setSaving(true);
    setMsg("");
    try {
      await api.menuLinks.save(links.map(l => ({ key: l.key, url: l.url })));
      setMsg("Сохранено");
    } catch (e: any) {
      setMsg(`Ошибка: ${e.message}`);
    } finally {
      setSaving(false);
    }
  };

  const inputStyle: React.CSSProperties = { width: "100%", padding: "8px 10px", border: "1px solid var(--border-color, #ddd)", borderRadius: 6, fontSize: 14, boxSizing: "border-box" };

  return (
    <div>
      <p style={{ fontSize: 13, color: "#666", marginBottom: 14 }}>
        Ссылки кнопок меню внизу страницы входа. Относительные адреса (например, /presentation) открываются в этой же вкладке, остальные — в новой.
      </p>
      {links.map(l => (
        <div key={l.key} style={{ marginBottom: 12 }}>
          <label style={{ display: "block", fontSize: 13, fontWeight: 500, marginBottom: 4 }}>{l.label}</label>
          <input
            style={inputStyle}
            value={l.url}
            onChange={e => setLinks(links.map(x => x.key === l.key ? { ...x, url: e.target.value } : x))}
            placeholder="https://…"
          />
        </div>
      ))}
      {loading && <p style={{ fontSize: 13, color: "#888" }}>Загрузка…</p>}
      <div style={{ display: "flex", gap: 10, alignItems: "center", marginTop: 10 }}>
        <button
          onClick={save}
          disabled={saving || loading}
          style={{ padding: "8px 18px", borderRadius: 6, border: "none", background: "#8BC34A", color: "#fff", cursor: "pointer", fontSize: 14 }}
        >
          {saving ? "Сохранение…" : "Сохранить"}
        </button>
        {msg && <span style={{ fontSize: 13, color: msg.startsWith("Ошибка") ? "#c00" : "#2e7d32" }}>{msg}</span>}
      </div>
    </div>
  );
}
