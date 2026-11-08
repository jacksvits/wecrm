import { useEffect, useState } from "react";
import { api } from "../api/client";
import { useAuth } from "../hooks/useAuth";

const ALL_TABS = [
  { key: "system", label: "Система" },
  { key: "programs", label: "Программы" },
  { key: "drivers", label: "Драйвера" },
  { key: "documents", label: "Документы" },
  { key: "games", label: "Игры" },
];

// Разбор списка скрытых имён: через запятую, без пробелов и регистра
const parseHidden = (value: string): string[] =>
  value.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);

export function Files() {
  const { user } = useAuth();
  const isAdmin = (user as any)?.role === "admin";
  // Вкладка «Система» (корень хранилища) — только для администраторов
  const TABS = isAdmin ? ALL_TABS : ALL_TABS.filter((t) => t.key !== "system");
  const [activeTab, setActiveTab] = useState(isAdmin ? "system" : "programs");
  const [settings, setSettings] = useState<Record<string, { url: string; path: string }>>({});
  const [loading, setLoading] = useState(true);
  const [files, setFiles] = useState<any[]>([]);
  const [filesLoading, setFilesLoading] = useState(false);
  const [currentFolder, setCurrentFolder] = useState("");
  // Скрытые файлы/папки (имена через запятую) + модальное окно настроек
  const [hiddenNames, setHiddenNames] = useState<string[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const [hiddenInput, setHiddenInput] = useState("");
  const [savingHidden, setSavingHidden] = useState(false);

  const loadSettings = async () => {
    try {
      const data = await api.files.tabs();
      const map: Record<string, { url: string; path: string }> = {};
      data.forEach((t: any) => (map[t.tabKey] = { url: t.url || "", path: t.path || "" }));
      setSettings(map);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  // Загрузка списка скрытых имён (общая настройка страницы «Файлы»)
  const loadHidden = async () => {
    try {
      const data = await api.files.hidden();
      setHiddenNames(parseHidden(data.names || ""));
      setHiddenInput(data.names || "");
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadSettings();
    loadHidden();
  }, []);

  useEffect(() => {
    setFilesLoading(true);
    api.files.browse(activeTab, currentFolder)
      .then((data: any) => setFiles(data.items || []))
      .catch(console.error)
      .finally(() => setFilesLoading(false));
  }, [activeTab, currentFolder]);

  const formatSize = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const handleItemClick = (item: any) => {
    if (item.isDirectory) {
      setCurrentFolder((prev) => (prev ? prev + "/" + item.name : item.name));
    } else {
      const filePath = currentFolder ? currentFolder + "/" + item.name : item.name;
      api.files.downloadFile(activeTab, filePath).catch((e: any) => alert("Ошибка скачивания: " + e.message));
    }
  };

  const handleDownloadFolder = (e: React.MouseEvent, item: any) => {
    e.stopPropagation();
    const folderPath = currentFolder ? currentFolder + "/" + item.name : item.name;
    api.files.downloadFolder(activeTab, folderPath).catch((e: any) => alert("Ошибка скачивания: " + e.message));
  };

  const handleBack = () => {
    if (!currentFolder) return;
    const parts = currentFolder.split("/");
    parts.pop();
    setCurrentFolder(parts.join("/"));
  };

  const tabLabel = TABS.find((t) => t.key === activeTab)?.label || "Файлы";
  // Скрытие по списку применяется во всех вкладках, включая «Система»
  const visibleFiles = files.filter((item) => !hiddenNames.includes(String(item.name).toLowerCase()));

  const handleSaveHidden = async () => {
    setSavingHidden(true);
    try {
      const data = await api.files.saveHidden(hiddenInput);
      setHiddenNames(parseHidden((data as any)?.names || ""));
      setShowSettings(false);
    } catch (e: any) {
      alert("Ошибка сохранения: " + e.message);
    } finally {
      setSavingHidden(false);
    }
  };

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <div style={{ marginBottom: 16 }}>
        <h2 style={{ margin: "0 0 12px", fontSize: 18 }}>Файлы</h2>
        <div style={{ display: "flex", gap: 8, borderBottom: "1px solid var(--border-color)" }}>
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => { setActiveTab(tab.key); setCurrentFolder(""); }}
              style={{
                padding: "10px 16px",
                border: "none",
                background: activeTab === tab.key ? "var(--bg-hover)" : "transparent",
                color: activeTab === tab.key ? "#007AFF" : "var(--text-primary)",
                borderBottom: activeTab === tab.key ? "2px solid #007AFF" : "2px solid transparent",
                cursor: "pointer",
                fontSize: 14,
                fontWeight: 500,
                borderRadius: "8px 8px 0 0",
              }}
            >
              {tab.label}
            </button>
          ))}
          {/* Кнопка настроек отображения (скрытие файлов/папок) — только для администраторов */}
          {isAdmin && (
            <button
              onClick={() => { setHiddenInput(hiddenNames.join(", ")); setShowSettings(true); }}
              title="Настройки отображения"
              style={{
                marginLeft: "auto", alignSelf: "center", padding: 6, border: "none",
                background: "transparent", color: "var(--text-muted)", cursor: "pointer",
                borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3"></circle>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
              </svg>
            </button>
          )}
        </div>
      </div>

      {loading || filesLoading ? (
        <div style={{ padding: 40, textAlign: "center", color: "var(--text-muted)" }}>Загрузка...</div>
      ) : (
        <div style={{ flex: 1, overflow: "auto" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
            {currentFolder && (
              <button
                onClick={handleBack}
                style={{
                  padding: "6px 12px", borderRadius: 8, border: "1px solid var(--border-color)",
                  background: "var(--bg-hover)", color: "var(--text-primary)", cursor: "pointer", fontSize: 13,
                }}
              >
                ← Назад
              </button>
            )}
            <div style={{ fontSize: 13, color: "var(--text-muted)" }}>
              {currentFolder ? `${tabLabel} / ` + currentFolder.replace(/\//g, " / ") : tabLabel}
            </div>
          </div>

          {visibleFiles.length === 0 ? (
            <div style={{ padding: 40, textAlign: "center", color: "var(--text-muted)" }}>Папка пуста</div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 12 }}>
              {visibleFiles.map((item: any) => (
                <div
                  key={item.name}
                  onClick={() => handleItemClick(item)}
                  style={{
                    padding: 16, borderRadius: 12, border: "1px solid var(--border-color)",
                    background: "var(--bg-color)", display: "flex", alignItems: "center", gap: 12,
                    cursor: "pointer", transition: "all 0.15s", position: "relative",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.background = "var(--bg-hover)";
                    (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
                    (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 12px rgba(0,0,0,0.08)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.background = "var(--bg-color)";
                    (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
                    (e.currentTarget as HTMLElement).style.boxShadow = "none";
                  }}
                >
                  <div style={{ fontSize: 32, flexShrink: 0 }}>{item.isDirectory ? "📁" : "📄"}</div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {item.name}
                    </div>
                    {!item.isDirectory && (
                      <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>{formatSize(item.size)}</div>
                    )}
                  </div>
                  {item.isDirectory && (
                    <button
                      onClick={(e) => handleDownloadFolder(e, item)}
                      title="Скачать папку как ZIP"
                      style={{
                        padding: "6px 8px", borderRadius: 6, border: "none", background: "#007AFF",
                        color: "#fff", cursor: "pointer", fontSize: 12, flexShrink: 0, marginLeft: 4,
                      }}
                      onMouseEnter={(e) => e.stopPropagation()}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                        <polyline points="7 10 12 15 17 10"></polyline>
                        <line x1="12" y1="15" x2="12" y2="3"></line>
                      </svg> ZIP
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Модальное окно настроек: какие файлы и папки скрывать во вкладках */}
      {showSettings && (
        <div
          onClick={() => setShowSettings(false)}
          style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000,
            display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "var(--bg-color)", borderRadius: 16, padding: 24, width: "100%", maxWidth: 480,
              border: "1px solid var(--border-color)", boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
            }}
          >
            <h3 style={{ margin: "0 0 8px", fontSize: 16 }}>Настройки отображения</h3>
            <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 12 }}>
              Имена файлов и папок через запятую, которые нужно скрывать во вкладках.
              Например: .DS_Store, Thumbs.db, backup
            </div>
            <textarea
              value={hiddenInput}
              onChange={(e) => setHiddenInput(e.target.value)}
              rows={3}
              placeholder=".DS_Store, Thumbs.db, backup"
              style={{
                width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid var(--border-color)",
                background: "var(--bg-hover)", color: "var(--text-primary)", fontSize: 14, resize: "vertical",
                boxSizing: "border-box", fontFamily: "inherit",
              }}
            />
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 16 }}>
              <button
                onClick={() => setShowSettings(false)}
                style={{
                  padding: "8px 16px", borderRadius: 8, border: "1px solid var(--border-color)",
                  background: "var(--bg-hover)", color: "var(--text-primary)", cursor: "pointer", fontSize: 14,
                }}
              >
                Отмена
              </button>
              <button
                onClick={handleSaveHidden}
                disabled={savingHidden}
                style={{
                  padding: "8px 16px", borderRadius: 8, border: "none", background: "#007AFF",
                  color: "#fff", cursor: "pointer", fontSize: 14, fontWeight: 500, opacity: savingHidden ? 0.6 : 1,
                }}
              >
                {savingHidden ? "Сохранение..." : "Сохранить"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
