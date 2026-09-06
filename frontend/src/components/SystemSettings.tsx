import { useEffect, useState } from "react";
import { api } from "../api/client";

const TAB_CONFIGS = [
  { key: "programs", label: "Программы", defaultPath: "/volume3/SOFT" },
  { key: "drivers", label: "Драйвера", defaultPath: "/volume3/DRIVER" },
  { key: "documents", label: "Документы", defaultPath: "/volume2/BOOK" },
  { key: "games", label: "Игры", defaultPath: "/volume3/GAME" },
];

export function SystemSettings() {
  const [settings, setSettings] = useState<Record<string, { url: string; path: string }>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    api.files
      .tabs()
      .then((data: any[]) => {
        const map: Record<string, { url: string; path: string }> = {};
        data.forEach((t) => {
          map[t.tabKey] = { url: t.url || "", path: t.path || "" };
        });
        TAB_CONFIGS.forEach((cfg) => {
          if (!map[cfg.key]?.path) {
            map[cfg.key] = { ...(map[cfg.key] || {}), path: cfg.defaultPath };
          }
        });
        setSettings(map);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const updateField = (key: string, field: "url" | "path", value: string) => {
    setSettings((prev) => ({
      ...prev,
      [key]: { ...(prev[key] || { url: "", path: "" }), [field]: value },
    }));
  };

  const save = async (key: string) => {
    setSaving(key);
    try {
      const s = settings[key] || { url: "", path: "" };
      await api.files.updateTab(key, s.url, s.path);
      alert("Сохранено");
    } catch (e: any) {
      alert("Ошибка: " + e.message);
    } finally {
      setSaving(null);
    }
  };

  if (loading) return <div style={{ padding: 20, color: "var(--text-muted)" }}>Загрузка...</div>;

  return (
    <div>
      <h3 style={{ margin: "0 0 20px", fontSize: 18, fontWeight: 600 }}>Системные настройки</h3>
      <p style={{ color: "var(--text-muted)", marginBottom: 24, fontSize: 14 }}>
        Настройка путей к NFS-папкам для вкладок на странице «Файлы»
      </p>

      {TAB_CONFIGS.map((cfg) => (
        <div
          key={cfg.key}
          style={{
            marginBottom: 20,
            padding: 20,
            borderRadius: 12,
            border: "1px solid var(--border-color)",
            background: "var(--bg-card)",
          }}
        >
          <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>{cfg.label}</div>

          <div style={{ marginBottom: 12 }}>
            <label style={{ display: "block", marginBottom: 6, fontSize: 13, color: "var(--text-muted)" }}>
              Путь к NFS папке
            </label>
            <input
              type="text"
              value={settings[cfg.key]?.path || cfg.defaultPath}
              onChange={(e) => updateField(cfg.key, "path", e.target.value)}
              placeholder="/volume3/SOFT"
              style={{
                width: "100%",
                padding: "10px 14px",
                borderRadius: 10,
                border: "1px solid var(--border-color)",
                background: "var(--bg-color)",
                color: "var(--text-color)",
                fontSize: 14,
                outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>

          <button
            onClick={() => save(cfg.key)}
            disabled={saving === cfg.key}
            style={{
              padding: "8px 16px",
              borderRadius: 10,
              background: "#007AFF",
              color: "#fff",
              border: "none",
              cursor: "pointer",
              fontSize: 14,
              opacity: saving === cfg.key ? 0.7 : 1,
            }}
          >
            {saving === cfg.key ? "Сохранение..." : "Сохранить"}
          </button>
        </div>
      ))}
    </div>
  );
}
