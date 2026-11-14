import { useEffect, useState } from "react";

// Общий редактор списка пунктов меню (Настройки → Системные → Авторизация / Шапка).
// Единая стилистика обеих вкладок: название, URL, активность, порядок, добавление/удаление.
export type MenuLinkItem = { key: string; title: string; url: string; isActive: boolean; sortOrder: number };

export function MenuLinksEditor({ description, load, save }: {
  description: string;
  load: () => Promise<MenuLinkItem[]>;
  save: (items: MenuLinkItem[]) => Promise<any>;
}) {
  const [items, setItems] = useState<MenuLinkItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => { load().then(d => { if (Array.isArray(d)) setItems(d); }).catch((e: any) => setMsg(`Ошибка загрузки: ${e.message}`)).finally(() => setLoading(false)); }, []);

  const update = (key: string, patch: Partial<MenuLinkItem>) =>
    setItems(items.map(x => x.key === key ? { ...x, ...patch } : x));

  const move = (index: number, dir: -1 | 1) => {
    const j = index + dir;
    if (j < 0 || j >= items.length) return;
    const next = [...items];
    [next[index], next[j]] = [next[j], next[index]];
    setItems(next.map((x, i) => ({ ...x, sortOrder: i })));
  };

  const remove = (key: string) => setItems(items.filter(x => x.key !== key));

  const add = () => {
    const maxOrder = items.reduce((m, x) => Math.max(m, x.sortOrder), -1);
    const key = `item${Date.now().toString(36)}`;
    setItems([...items, { key, title: "Новый пункт", url: "/", isActive: true, sortOrder: maxOrder + 1 }]);
  };

  const onSave = async () => {
    setSaving(true);
    setMsg("");
    try {
      await save(items);
      setMsg("Сохранено");
    } catch (e: any) {
      setMsg(`Ошибка: ${e.message}`);
    } finally {
      setSaving(false);
    }
  };

  const inputStyle: React.CSSProperties = { width: "100%", padding: "8px 10px", border: "1px solid var(--border-color, #ddd)", borderRadius: 6, fontSize: 14, boxSizing: "border-box" };
  const iconBtn: React.CSSProperties = { padding: "6px 9px", borderRadius: 6, border: "1px solid var(--border-color, #ddd)", background: "var(--bg-hover, #f2f2f2)", cursor: "pointer", fontSize: 13, color: "var(--text-primary)" };

  return (
    <div>
      <p style={{ fontSize: 13, color: "#666", marginBottom: 14 }}>{description}</p>
      {loading && <p style={{ fontSize: 13, color: "#888" }}>Загрузка…</p>}
      {items.map((l, index) => (
        <div key={l.key} style={{ border: "1px solid var(--border-color, #e0e0e0)", borderRadius: 10, padding: 12, marginBottom: 10, opacity: l.isActive ? 1 : 0.6 }}>
          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, whiteSpace: "nowrap" }}>
              <input type="checkbox" checked={l.isActive} onChange={e => update(l.key, { isActive: e.target.checked })} />
              Активен
            </label>
            <div style={{ flex: 1, display: "flex", gap: 6, minWidth: 160 }}>
              <input style={{ ...inputStyle, flex: 2 }} value={l.title} placeholder="Название" onChange={e => update(l.key, { title: e.target.value })} />
              <input style={{ ...inputStyle, flex: 3 }} value={l.url} placeholder="https://… или /path" onChange={e => update(l.key, { url: e.target.value })} />
            </div>
            <div style={{ display: "flex", gap: 4 }}>
              <button style={iconBtn} onClick={() => move(index, -1)} disabled={index === 0} title="Выше">↑</button>
              <button style={iconBtn} onClick={() => move(index, 1)} disabled={index === items.length - 1} title="Ниже">↓</button>
              <button style={{ ...iconBtn, color: "#c00" }} onClick={() => remove(l.key)} title="Удалить пункт">✕</button>
            </div>
          </div>
        </div>
      ))}
      <div style={{ display: "flex", gap: 10, alignItems: "center", marginTop: 12, flexWrap: "wrap" }}>
        <button onClick={add} style={{ ...iconBtn, padding: "8px 14px" }}>＋ Добавить пункт</button>
        <button
          onClick={onSave}
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
