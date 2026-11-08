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


// === Темы иконок страницы «Файлы» ===
type FileTheme = "win7" | "macos";

const win7FolderIcon = (
  <svg width="64" height="52" viewBox="0 0 64 52">
    <defs>
      <linearGradient id="w7body" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#FFE38A" /><stop offset=".45" stopColor="#FBC93F" /><stop offset="1" stopColor="#E8A81C" />
      </linearGradient>
      <linearGradient id="w7tab" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#FBD45C" /><stop offset="1" stopColor="#EBAF24" />
      </linearGradient>
    </defs>
    <path d="M3 8a5 5 0 0 1 5-5h14l6 7h28a5 5 0 0 1 5 5v2H3V8z" fill="url(#w7tab)" stroke="#C8901A" strokeWidth="1" />
    <rect x="3" y="15" width="58" height="34" rx="5" fill="url(#w7body)" stroke="#C8901A" strokeWidth="1" />
    <rect x="6" y="18" width="52" height="12" rx="3" fill="#FFF3C4" opacity=".55" />
  </svg>
);

// Иконка файла Windows 7: белый лист + цветной значок приложения по расширению
const WIN7_FILE_BADGES: Record<string, { color: string; text: string; size?: number }> = {
  pdf: { color: "#C62828", text: "PDF", size: 8 },
  doc: { color: "#2B579A", text: "W" }, docx: { color: "#2B579A", text: "W" }, odt: { color: "#2B579A", text: "W" }, rtf: { color: "#2B579A", text: "W" },
  xls: { color: "#1D6F42", text: "X" }, xlsx: { color: "#1D6F42", text: "X" }, csv: { color: "#1D6F42", text: "X" }, ods: { color: "#1D6F42", text: "X" },
  ppt: { color: "#C43E1C", text: "P" }, pptx: { color: "#C43E1C", text: "P" },
  zip: { color: "#8D6E63", text: "ZIP", size: 8 }, rar: { color: "#8D6E63", text: "RAR", size: 8 }, "7z": { color: "#8D6E63", text: "7Z" }, tar: { color: "#8D6E63", text: "TAR", size: 8 }, gz: { color: "#8D6E63", text: "GZ" },
  mp4: { color: "#5E35B1", text: "▶" }, avi: { color: "#5E35B1", text: "▶" }, mov: { color: "#5E35B1", text: "▶" }, mkv: { color: "#5E35B1", text: "▶" }, wmv: { color: "#5E35B1", text: "▶" },
  mp3: { color: "#00838F", text: "♪" }, wav: { color: "#00838F", text: "♪" }, ogg: { color: "#00838F", text: "♪" }, flac: { color: "#00838F", text: "♪" }, m4a: { color: "#00838F", text: "♪" },
  jpg: { color: "#0277BD", text: "🖻" }, jpeg: { color: "#0277BD", text: "🖻" }, png: { color: "#0277BD", text: "🖻" }, gif: { color: "#0277BD", text: "🖻" }, bmp: { color: "#0277BD", text: "🖻" }, webp: { color: "#0277BD", text: "🖻" },
  exe: { color: "#546E7A", text: "⚙" }, msi: { color: "#546E7A", text: "⚙" },
  html: { color: "#E65100", text: "<>" }, htm: { color: "#E65100", text: "<>" },
};

const win7FileIconFor = (name: string) => {
  const badge = WIN7_FILE_BADGES[fileExtension(name)];
  return (
    <svg width="44" height="52" viewBox="0 0 44 52">
      <path d="M6 2h22l10 10v36a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z" fill="#FFFFFF" stroke="#9DB2C8" strokeWidth="1.5" />
      <path d="M28 2l10 10H30a2 2 0 0 1-2-2V2z" fill="#DCE7F2" stroke="#9DB2C8" strokeWidth="1.5" />
      <rect x="10" y="18" width="24" height="3.5" rx="1.75" fill="#C7D6E8" />
      <rect x="10" y="25" width="24" height="3.5" rx="1.75" fill="#C7D6E8" />
      {badge ? (
        <g>
          <rect x="8" y="32" width="28" height="15" rx="3.5" fill={badge.color} />
          <text x="22" y="43" textAnchor="middle" fontFamily="Segoe UI, sans-serif" fontWeight="700" fontSize={badge.size || 11} fill="#FFFFFF">{badge.text}</text>
        </g>
      ) : (
        <rect x="10" y="32" width="17" height="3.5" rx="1.75" fill="#C7D6E8" />
      )}
    </svg>
  );
};

const macFolderIcon = (
  <svg width="64" height="52" viewBox="0 0 64 52">
    <defs>
      <linearGradient id="macBody" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#7FC4F5" /><stop offset="1" stopColor="#3E9BE8" />
      </linearGradient>
      <linearGradient id="macTab" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#A5D6F8" /><stop offset="1" stopColor="#6FB9EF" />
      </linearGradient>
    </defs>
    <path d="M3 9a6 6 0 0 1 6-6h13l6 7h27a6 6 0 0 1 6 6v33a6 6 0 0 1-6 6H9a6 6 0 0 1-6-6V9z" fill="url(#macTab)" />
    <path d="M3 16h58v33a6 6 0 0 1-6 6H9a6 6 0 0 1-6-6V16z" fill="url(#macBody)" />
    <rect x="3" y="16" width="58" height="3" fill="#9FD2F6" opacity=".7" />
  </svg>
);

// Иконка файла macOS: белый лист со скруглённым углом + значок типа в стиле app-icon (squircle)
const MAC_FILE_BADGES: Record<string, { color: string; color2: string; text: string; size?: number }> = {
  pdf: { color: "#FA5151", color2: "#D92B2B", text: "PDF", size: 9 },
  doc: { color: "#41A5EE", color2: "#185ABD", text: "W" }, docx: { color: "#41A5EE", color2: "#185ABD", text: "W" }, odt: { color: "#41A5EE", color2: "#185ABD", text: "W" }, rtf: { color: "#41A5EE", color2: "#185ABD", text: "W" },
  xls: { color: "#33C481", color2: "#107C41", text: "X" }, xlsx: { color: "#33C481", color2: "#107C41", text: "X" }, csv: { color: "#33C481", color2: "#107C41", text: "X" }, ods: { color: "#33C481", color2: "#107C41", text: "X" },
  ppt: { color: "#ED6C47", color2: "#C43E1C", text: "P" }, pptx: { color: "#ED6C47", color2: "#C43E1C", text: "P" },
  zip: { color: "#B08968", color2: "#8D6E63", text: "ZIP", size: 8 }, rar: { color: "#B08968", color2: "#8D6E63", text: "RAR", size: 8 }, "7z": { color: "#B08968", color2: "#8D6E63", text: "7Z" }, tar: { color: "#B08968", color2: "#8D6E63", text: "TAR", size: 8 }, gz: { color: "#B08968", color2: "#8D6E63", text: "GZ" },
  mp4: { color: "#BF8CF2", color2: "#7D3FD4", text: "▶" }, avi: { color: "#BF8CF2", color2: "#7D3FD4", text: "▶" }, mov: { color: "#BF8CF2", color2: "#7D3FD4", text: "▶" }, mkv: { color: "#BF8CF2", color2: "#7D3FD4", text: "▶" }, wmv: { color: "#BF8CF2", color2: "#7D3FD4", text: "▶" },
  mp3: { color: "#4FD1C5", color2: "#0E9384", text: "♪" }, wav: { color: "#4FD1C5", color2: "#0E9384", text: "♪" }, ogg: { color: "#4FD1C5", color2: "#0E9384", text: "♪" }, flac: { color: "#4FD1C5", color2: "#0E9384", text: "♪" }, m4a: { color: "#4FD1C5", color2: "#0E9384", text: "♪" },
  jpg: { color: "#64B5F6", color2: "#1565C0", text: "🖻" }, jpeg: { color: "#64B5F6", color2: "#1565C0", text: "🖻" }, png: { color: "#64B5F6", color2: "#1565C0", text: "🖻" }, gif: { color: "#64B5F6", color2: "#1565C0", text: "🖻" }, bmp: { color: "#64B5F6", color2: "#1565C0", text: "🖻" }, webp: { color: "#64B5F6", color2: "#1565C0", text: "🖻" },
  exe: { color: "#90A4AE", color2: "#546E7A", text: "⚙" }, msi: { color: "#90A4AE", color2: "#546E7A", text: "⚙" },
  html: { color: "#FF9F5A", color2: "#E65100", text: "<>" }, htm: { color: "#FF9F5A", color2: "#E65100", text: "<>" },
};

const macFileIconFor = (name: string) => {
  const ext = fileExtension(name);
  const badge = MAC_FILE_BADGES[ext];
  const gradId = `macFile-${ext || "blank"}-${Math.random().toString(36).slice(2, 8)}`;
  return (
    <svg width="42" height="52" viewBox="0 0 42 52">
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={badge ? badge.color : "#E8EBF0"} />
          <stop offset="1" stopColor={badge ? badge.color2 : "#C6CBD4"} />
        </linearGradient>
      </defs>
      <path d="M7 1h18l12 12v36a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V3a2 2 0 0 1 2-2z" fill="#FFFFFF" stroke="#C6CBD4" strokeWidth="1.5" />
      <path d="M25 1l12 12H27a2 2 0 0 1-2-2V1z" fill="#EDEFF3" stroke="#C6CBD4" strokeWidth="1.5" />
      {badge ? (
        <g>
          <rect x="8" y="15" width="26" height="26" rx="7" fill={`url(#${gradId})`} />
          <text x="21" y="32.5" textAnchor="middle" fontFamily="-apple-system, Segoe UI, sans-serif" fontWeight="700" fontSize={badge.size || 13} fill="#FFFFFF">{badge.text}</text>
        </g>
      ) : (
        <g>
          <rect x="11" y="24" width="20" height="3.5" rx="1.75" fill="#D5DAE1" />
          <rect x="11" y="31" width="20" height="3.5" rx="1.75" fill="#D5DAE1" />
          <rect x="11" y="38" width="13" height="3.5" rx="1.75" fill="#D5DAE1" />
        </g>
      )}
    </svg>
  );
};

const FILE_THEMES: Record<FileTheme, { label: string; folder: JSX.Element; fileFor: (name: string) => JSX.Element }> = {
  win7: { label: "Windows 7", folder: win7FolderIcon, fileFor: win7FileIconFor },
  macos: { label: "macOS", folder: macFolderIcon, fileFor: macFileIconFor },
};


function FilePreviewThumb({ item, tab, filePath, theme }: { item: any; tab: string; filePath: string; theme: FileTheme }) {
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
    return <div style={{ width: 72, height: 72, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>{FILE_THEMES[theme].fileFor(item.name)}</div>;
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
  const [filesTheme, setFilesTheme] = useState<FileTheme>("win7");
  const [themeInput, setThemeInput] = useState<FileTheme>("win7");
  const [viewMode, setViewMode] = useState<"icons" | "table">("icons");
  const [viewModeInput, setViewModeInput] = useState<"icons" | "table">("icons");
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
      const savedTheme: FileTheme = (data as any).theme === "macos" ? "macos" : "win7";
      setFilesTheme(savedTheme);
      setThemeInput(savedTheme);
      const savedView = (data as any).viewMode === "table" ? "table" : "icons";
      setViewMode(savedView);
      setViewModeInput(savedView);
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
      const data = await api.files.saveHidden(hiddenInput, themeInput, viewModeInput);
      setHiddenNames(parseHidden((data as any)?.names || ""));
      setFilesTheme(themeInput);
      setViewMode(viewModeInput);
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
              onClick={() => { setHiddenInput(hiddenNames.join(", ")); setThemeInput(filesTheme); setViewModeInput(viewMode); setShowSettings(true); }}
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
            viewMode === "table" ? (
            <div style={{ overflowX: "auto" }}>
              <div style={{ minWidth: 560, border: "1px solid var(--border-color)", borderRadius: 12, overflow: "hidden" }}>
                <div style={{
                  display: "grid", gridTemplateColumns: "minmax(0,1fr) 90px 90px 110px 40px",
                  padding: "10px 16px", background: "var(--bg-hover)", fontSize: 12,
                  fontWeight: 600, color: "var(--text-muted)",
                }}>
                  <div>Наименование</div>
                  <div>Размер</div>
                  <div>Расширение</div>
                  <div>Скачивания</div>
                  <div></div>
                </div>
                {visibleFiles.map((item: any) => {
                  const filePath = joinPath(currentFolder, item.name);
                  return (
                    <div
                      key={item.name}
                      onClick={() => handleItemClick(item)}
                      title={item.name}
                      style={{
                        display: "grid", gridTemplateColumns: "minmax(0,1fr) 90px 90px 110px 40px",
                        padding: "6px 16px", alignItems: "center", cursor: "pointer",
                        borderTop: "1px solid var(--border-color)", background: "var(--bg-color)",
                        fontSize: 13, transition: "background 0.15s",
                      }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--bg-hover)"; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--bg-color)"; }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                        <div style={{ width: 26, height: 26, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                          <div style={{ transform: "scale(0.42)", flexShrink: 0 }}>
                            {item.isDirectory ? FILE_THEMES[filesTheme].folder : FILE_THEMES[filesTheme].fileFor(item.name)}
                          </div>
                        </div>
                        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontWeight: 500 }}>{item.name}</span>
                      </div>
                      <div style={{ color: "var(--text-muted)", fontSize: 12 }}>{item.isDirectory ? "—" : formatSize(item.size)}</div>
                      <div style={{ color: "var(--text-muted)", fontSize: 12 }}>{item.isDirectory ? "Папка" : (fileExtension(item.name) ? fileExtension(item.name).toUpperCase() : "—")}</div>
                      <div style={{ color: "var(--text-muted)", fontSize: 12 }}>{item.downloads || 0}</div>
                      <div>
                        <button
                          onClick={(e) => item.isDirectory ? handleDownloadFolder(e, item) : handleDownloadFile(e, item)}
                          title={item.isDirectory ? "Скачать папку как ZIP" : "Скачать"}
                          style={{ ...iconButtonStyle, width: 26, height: 26, borderRadius: 7 }}
                        >
                          {downloadIcon}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, 96px)", gap: 4, justifyContent: "start" }}>
              {visibleFiles.map((item: any) => {
                const filePath = joinPath(currentFolder, item.name);
                return (
                  <div
                    key={item.name}
                    onClick={() => handleItemClick(item)}
                    title={item.name}
                    style={{
                      padding: "10px 6px 8px", borderRadius: 10, border: "none",
                      background: "transparent", display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
                      cursor: "pointer", transition: "background 0.15s", position: "relative",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.background = "var(--bg-hover)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.background = "transparent";
                    }}
                  >
                    <button
                      onClick={(e) => item.isDirectory ? handleDownloadFolder(e, item) : handleDownloadFile(e, item)}
                      title={item.isDirectory ? "Скачать папку как ZIP" : "Скачать"}
                      style={{ ...iconButtonStyle, width: 24, height: 24, borderRadius: 7, position: "absolute", top: 4, right: 4, opacity: 0.85 }}
                    >
                      {downloadIcon}
                    </button>
                    {item.isDirectory ? FILE_THEMES[filesTheme].folder : <FilePreviewThumb item={item} tab={activeTab} filePath={filePath} theme={filesTheme} />}
                    <div style={{ fontSize: 12, fontWeight: 500, textAlign: "center", width: "100%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {item.name}
                    </div>
                    {!item.isDirectory && (
                      <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: -2 }}>
                        {formatSize(item.size)}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
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
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Вид</div>
            <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
              {([["icons", "Иконки"], ["table", "Таблица"]] as const).map(([key, label]) => {
                const selected = viewModeInput === key;
                return (
                  <button
                    key={key}
                    onClick={() => setViewModeInput(key)}
                    style={{
                      flex: 1, padding: "8px 0", borderRadius: 8, cursor: "pointer", fontSize: 13,
                      fontWeight: selected ? 600 : 500,
                      border: selected ? "2px solid #007AFF" : "1px solid var(--border-color)",
                      background: selected ? "rgba(0,122,255,0.06)" : "var(--bg-hover)",
                      color: selected ? "#007AFF" : "var(--text-primary)",
                    }}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Тема иконок</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8, marginBottom: 16 }}>
              {(Object.keys(FILE_THEMES) as FileTheme[]).map((key) => {
                const selected = themeInput === key;
                return (
                  <div
                    key={key}
                    onClick={() => setThemeInput(key)}
                    style={{
                      border: selected ? "2px solid #007AFF" : "1px solid var(--border-color)",
                      borderRadius: 10, padding: "8px 4px 6px", cursor: "pointer",
                      background: selected ? "rgba(0,122,255,0.06)" : "var(--bg-hover)",
                      display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
                    }}
                  >
                    <div style={{ transform: "scale(0.62)", transformOrigin: "center", height: 38, display: "flex", alignItems: "center" }}>
                      {FILE_THEMES[key].folder}
                    </div>
                    <div style={{ fontSize: 11, fontWeight: selected ? 600 : 500, color: selected ? "#007AFF" : "var(--text-primary)", textAlign: "center" }}>
                      {FILE_THEMES[key].label}
                    </div>
                  </div>
                );
              })}
            </div>
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
