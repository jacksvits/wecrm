import { useEffect, useRef, useState } from "react";
import { api } from "../api/client";
import { useAuth } from "../hooks/useAuth";

const ALL_TABS = [
  { key: "system", label: "Система" },
  { key: "programs", label: "Программы" },
  { key: "drivers", label: "Драйвера" },
  { key: "documents", label: "Документы" },
  { key: "games", label: "Игры" },
];

const IMAGE_EXTENSIONS = new Set(["jpg", "jpeg", "png", "gif", "webp", "bmp", "ico", "svg"]);
const PDF_EXTENSION = "pdf";

// Разбор списка скрытых имён: через запятую, без пробелов и регистра
const parseHidden = (value: string): string[] =>
  value.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);

const fileExtension = (name: string) => name.split(".").pop()?.toLowerCase() || "";
const isImageFile = (name: string) => IMAGE_EXTENSIONS.has(fileExtension(name));
const isPdfFile = (name: string) => fileExtension(name) === PDF_EXTENSION;
const isPreviewableFile = (name: string) => isImageFile(name) || isPdfFile(name);
const joinPath = (folder: string, name: string) => (folder ? `${folder}/${name}` : name);

const downloadIcon = (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
    <polyline points="7 10 12 15 17 10"></polyline>
    <line x1="12" y1="15" x2="12" y2="3"></line>
  </svg>
);

const closeIcon = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
);

const folderIcon = (
  <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="#007AFF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" fill="#D8EBFF"></path>
  </svg>
);

const fileIcon = (
  <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#8A94A6" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" fill="#F1F4F8"></path>
    <polyline points="14 2 14 8 20 8"></polyline>
  </svg>
);


function FilePreviewThumb({ item, tab, filePath }: { item: any; tab: string; filePath: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [src, setSrc] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const previewable = !item.isDirectory && isPreviewableFile(item.name);

  useEffect(() => {
    if (!previewable) return;
    let cancelled = false;
    let objectUrl: string | null = null;
    const element = ref.current;
    if (!element) return;

    const load = async () => {
      try {
        const blob = await api.files.previewFile(tab, filePath, true);
        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        setSrc(objectUrl);
      } catch (e) {
        console.error("Ошибка загрузки превью:", e);
        if (!cancelled) setFailed(true);
      }
    };

    const observer = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting) {
        observer.disconnect();
        load();
      }
    }, { rootMargin: "120px" });
    observer.observe(element);

    return () => {
      cancelled = true;
      observer.disconnect();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [filePath, item.name, previewable, tab]);

  if (item.isDirectory) {
    return <div style={{ width: 72, height: 72, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>{folderIcon}</div>;
  }
  if (!previewable || failed) {
    return <div style={{ width: 72, height: 72, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>{fileIcon}</div>;
  }

  return (
    <div
      ref={ref}
      title="Открыть превью"
      style={{
        width: 72,
        height: 72,
        flexShrink: 0,
        overflow: "hidden",
        borderRadius: 10,
        border: "1px solid var(--border-color)",
        background: "var(--bg-hover)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {src ? (
        <img
          src={src}
          alt={item.name}
          style={{ width: "100%", height: "100%", objectFit: isPdfFile(item.name) ? "contain" : "cover", display: "block", background: "#fff" }}
        />
      ) : (
        <div style={{ width: "70%", height: "70%", borderRadius: 8, background: "linear-gradient(90deg, #E8EDF3, #F7F9FC, #E8EDF3)" }} />
      )}
    </div>
  );
}

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
  const [previewItem, setPreviewItem] = useState<any | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

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

  useEffect(() => {
    if (!previewItem) {
      setPreviewUrl(null);
      return;
    }
    let cancelled = false;
    let objectUrl: string | null = null;
    setPreviewLoading(true);
    api.files.previewFile(activeTab, joinPath(currentFolder, previewItem.name))
      .then((blob) => {
        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        setPreviewUrl(objectUrl);
      })
      .catch((e: any) => {
        if (cancelled) return;
        alert("Ошибка загрузки превью: " + e.message);
        setPreviewItem(null);
      })
      .finally(() => {
        if (!cancelled) setPreviewLoading(false);
      });
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [activeTab, currentFolder, previewItem]);

  useEffect(() => {
    if (!previewItem) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPreviewItem(null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [previewItem]);

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
    } else if (isPreviewableFile(item.name)) {
      setPreviewItem(item);
    } else {
      const filePath = joinPath(currentFolder, item.name);
      api.files.downloadFile(activeTab, filePath).catch((e: any) => alert("Ошибка скачивания: " + e.message));
    }
  };

  const handleDownloadFile = (e: React.MouseEvent, item: any) => {
    e.stopPropagation();
    const filePath = joinPath(currentFolder, item.name);
    api.files.downloadFile(activeTab, filePath).catch((err: any) => alert("Ошибка скачивания: " + err.message));
  };

  const handleDownloadFolder = (e: React.MouseEvent, item: any) => {
    e.stopPropagation();
    const folderPath = joinPath(currentFolder, item.name);
    api.files.downloadFolder(activeTab, folderPath).catch((err: any) => alert("Ошибка скачивания: " + err.message));
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
              onClick={() => { setActiveTab(tab.key); setCurrentFolder(""); setPreviewItem(null); }}
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
              {visibleFiles.map((item: any) => {
                const filePath = joinPath(currentFolder, item.name);
                return (
                  <div
                    key={item.name}
                    onClick={() => handleItemClick(item)}
                    style={{
                      padding: 12, borderRadius: 12, border: "1px solid var(--border-color)",
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
                    <FilePreviewThumb item={item} tab={activeTab} filePath={filePath} />
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {item.name}
                      </div>
                      <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>
                        {item.isDirectory ? "Папка" : formatSize(item.size)}
                      </div>
                    </div>
                    {item.isDirectory ? (
                      <button
                        onClick={(e) => handleDownloadFolder(e, item)}
                        title="Скачать папку как ZIP"
                        style={iconButtonStyle}
                      >
                        {downloadIcon}
                      </button>
                    ) : (
                      <button
                        onClick={(e) => handleDownloadFile(e, item)}
                        title="Скачать"
                        style={iconButtonStyle}
                      >
                        {downloadIcon}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Модальное окно просмотра изображений и PDF */}
      {previewItem && (
        <div
          onClick={() => setPreviewItem(null)}
          style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 1100,
            display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "var(--bg-color)", borderRadius: 16, width: "min(920px, calc(100vw - 32px))",
              height: "min(720px, calc(100vh - 32px))", border: "1px solid var(--border-color)",
              boxShadow: "0 12px 40px rgba(0,0,0,0.28)", display: "flex", flexDirection: "column", overflow: "hidden",
            }}
          >
            <div style={{ minHeight: 52, padding: "0 12px 0 18px", display: "flex", alignItems: "center", gap: 10, borderBottom: "1px solid var(--border-color)" }}>
              <div style={{ flex: 1, minWidth: 0, fontSize: 14, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {previewItem.name}
              </div>
              <button
                onClick={() => api.files.downloadFile(activeTab, joinPath(currentFolder, previewItem.name)).catch((e: any) => alert("Ошибка скачивания: " + e.message))}
                title="Скачать"
                style={iconButtonStyle}
              >
                {downloadIcon}
              </button>
              <button onClick={() => setPreviewItem(null)} title="Закрыть" style={{ ...iconButtonStyle, color: "var(--text-muted)" }}>
                {closeIcon}
              </button>
            </div>
            <div style={{ flex: 1, minHeight: 0, background: "var(--bg-hover)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
              {previewLoading ? (
                <div style={{ color: "var(--text-muted)", fontSize: 14 }}>Загрузка превью...</div>
              ) : previewUrl && isImageFile(previewItem.name) ? (
                <img src={previewUrl} alt={previewItem.name} style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain", borderRadius: 8, boxShadow: "0 6px 24px rgba(0,0,0,0.14)" }} />
              ) : previewUrl && isPdfFile(previewItem.name) ? (
                <iframe src={previewUrl} title={previewItem.name} style={{ width: "100%", height: "100%", border: "none", borderRadius: 8, background: "#fff" }} />
              ) : (
                <div style={{ color: "var(--text-muted)", fontSize: 14 }}>Превью недоступно</div>
              )}
            </div>
          </div>
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

const iconButtonStyle: React.CSSProperties = {
  width: 34,
  height: 34,
  padding: 0,
  borderRadius: 8,
  border: "1px solid var(--border-color)",
  background: "var(--bg-color)",
  color: "#007AFF",
  cursor: "pointer",
  flexShrink: 0,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};
