import { useEffect, useState } from "react";
import { api } from "../api/client";
import { loadBranding } from "../lib/branding";

const TAB_CONFIGS = [
  { key: "programs", label: "Программы", defaultPath: "/volume3/SOFT" },
  { key: "drivers", label: "Драйвера", defaultPath: "/volume3/DRIVER" },
  { key: "documents", label: "Документы", defaultPath: "/volume2/BOOK" },
  { key: "games", label: "Игры", defaultPath: "/volume3/GAME" },
];

type SystemSubTab = "design" | "storage";

export function SystemSettings() {
  // По умолчанию открываем под-вкладку «Дизайн»
  const [subTab, setSubTab] = useState<SystemSubTab>("design");
  const [settings, setSettings] = useState<Record<string, { url: string; path: string }>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  // === Брендинг: иконка приложения и логотип компании ===
  const [branding, setBranding] = useState<{ iconUrl: string | null; logoUrl: string | null }>({ iconUrl: null, logoUrl: null });
  const [iconFile, setIconFile] = useState<File | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/branding")
      .then((r) => (r.ok ? r.json() : null))
      .then((b) => b && setBranding({ iconUrl: b.iconUrl, logoUrl: b.logoUrl }))
      .catch(() => {});
  }, []);

  const uploadBranding = async (kind: "icon" | "logo", file: File) => {
    setUploading(kind);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/branding/${kind}`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Ошибка загрузки");
      setBranding((prev) => ({ ...prev, ...(kind === "icon" ? { iconUrl: data.iconUrl } : { logoUrl: data.logoUrl }) }));
      await loadBranding(); // применить сразу: favicon, manifest PWA, логотип
      if (kind === "icon") setIconFile(null);
      else setLogoFile(null);
      alert("Сохранено");
    } catch (e: any) {
      alert("Ошибка: " + e.message);
    } finally {
      setUploading(null);
    }
  };

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

  // Стиль под-вкладок — в единой стилистике с основными вкладками настроек
  const subTabStyle = (isActive: boolean): React.CSSProperties => ({
    padding: "10px 20px",
    borderRadius: 12,
    border: "none",
    background: isActive ? "var(--text-primary)" : "transparent",
    color: isActive ? "var(--bg-card)" : "var(--text-secondary)",
    fontSize: 14,
    fontWeight: 500,
    cursor: "pointer",
    transition: "all 0.2s",
  });

  // === Под-вкладка «Хранение»: пути к NFS-папкам для страницы «Файлы» ===
  const renderStorage = () => {
    if (loading) return <div style={{ padding: 20, color: "var(--text-muted)" }}>Загрузка...</div>;

    return (
      <div>
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
  };

  // === Под-вкладка «Дизайн»: брендинг (иконка приложения и логотип компании) ===
  const renderDesign = () => (
    <div>
      {/* Иконка приложения: PWA, favicon, уведомления */}
      <div
        style={{
          marginBottom: 20,
          padding: 20,
          borderRadius: 12,
          border: "1px solid var(--border-color)",
          background: "var(--bg-card)",
        }}
      >
        <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 6 }}>Иконка приложения</div>
        <p style={{ margin: "0 0 16px", fontSize: 13, color: "var(--text-muted)" }}>
          Используется для PWA-приложения, favicon и push-уведомлений (кнопка по центру мобильной версии)
        </p>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            marginBottom: 16,
            padding: 12,
            borderRadius: 10,
            border: "1px solid var(--border-color)",
            background: "var(--bg-color)",
          }}
        >
          <img
            src={branding.iconUrl || "/icon-192x192.png"}
            alt="Текущая иконка"
            style={{ width: 48, height: 48, objectFit: "contain", borderRadius: 8 }}
          />
          <span style={{ fontSize: 13, color: "var(--text-muted)" }}>Текущая иконка</span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setIconFile(e.target.files?.[0] || null)}
            style={{ fontSize: 13, color: "var(--text-muted)" }}
          />
          <button
            onClick={() => iconFile && uploadBranding("icon", iconFile)}
            disabled={!iconFile || uploading === "icon"}
            style={{
              padding: "8px 16px",
              borderRadius: 10,
              background: "#007AFF",
              color: "#fff",
              border: "none",
              cursor: iconFile && uploading !== "icon" ? "pointer" : "default",
              fontSize: 14,
              opacity: !iconFile || uploading === "icon" ? 0.7 : 1,
            }}
          >
            {uploading === "icon" ? "Загрузка..." : "Загрузить"}
          </button>
        </div>
      </div>

      {/* Логотип компании: страница авторизации и интерфейс */}
      <div
        style={{
          marginBottom: 20,
          padding: 20,
          borderRadius: 12,
          border: "1px solid var(--border-color)",
          background: "var(--bg-card)",
        }}
      >
        <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 6 }}>Логотип компании</div>
        <p style={{ margin: "0 0 16px", fontSize: 13, color: "var(--text-muted)" }}>
          Используется на странице авторизации и во всех местах интерфейса, где выводится логотип
        </p>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            marginBottom: 16,
            padding: 12,
            borderRadius: 10,
            border: "1px solid var(--border-color)",
            background: "var(--bg-color)",
          }}
        >
          <img
            src={branding.logoUrl || "/welans-logo.png"}
            alt="Текущий логотип"
            style={{ height: 48, maxWidth: 180, objectFit: "contain", borderRadius: 8 }}
          />
          <span style={{ fontSize: 13, color: "var(--text-muted)" }}>Текущий логотип</span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
            style={{ fontSize: 13, color: "var(--text-muted)" }}
          />
          <button
            onClick={() => logoFile && uploadBranding("logo", logoFile)}
            disabled={!logoFile || uploading === "logo"}
            style={{
              padding: "8px 16px",
              borderRadius: 10,
              background: "#007AFF",
              color: "#fff",
              border: "none",
              cursor: logoFile && uploading !== "logo" ? "pointer" : "default",
              fontSize: 14,
              opacity: !logoFile || uploading === "logo" ? 0.7 : 1,
            }}
          >
            {uploading === "logo" ? "Загрузка..." : "Загрузить"}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div>
      <h3 style={{ margin: "0 0 20px", fontSize: 18, fontWeight: 600 }}>Системные настройки</h3>

      <div style={{ display: "flex", gap: 8, marginBottom: 24, flexWrap: "wrap" }}>
        <button style={subTabStyle(subTab === "design")} onClick={() => setSubTab("design")}>
          Дизайн
        </button>
        <button style={subTabStyle(subTab === "storage")} onClick={() => setSubTab("storage")}>
          Хранение
        </button>
      </div>

      {subTab === "design" ? renderDesign() : renderStorage()}
    </div>
  );
}
