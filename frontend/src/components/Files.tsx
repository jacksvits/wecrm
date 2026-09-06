import { useEffect, useState } from "react";
import { api } from "../api/client";

const TABS = [
  { key: "programs", label: "Программы" },
  { key: "drivers", label: "Драйвера" },
  { key: "documents", label: "Документы" },
  { key: "games", label: "Игры" },
];

export function Files() {
  const [activeTab, setActiveTab] = useState("programs");
  const [settings, setSettings] = useState<Record<string, { url: string; path: string }>>({});
  const [loading, setLoading] = useState(true);
  const [files, setFiles] = useState<any[]>([]);
  const [filesLoading, setFilesLoading] = useState(false);
  const [currentFolder, setCurrentFolder] = useState("");

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

  useEffect(() => {
    loadSettings();
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

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <div style={{ marginBottom: 16 }}>
        <h2 style={{ margin: "0 0 12px", fontSize: 22, fontWeight: 600 }}>Файлы</h2>
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

          {files.length === 0 ? (
            <div style={{ padding: 40, textAlign: "center", color: "var(--text-muted)" }}>Папка пуста</div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 12 }}>
              {files.map((item: any) => (
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
    </div>
  );
}
