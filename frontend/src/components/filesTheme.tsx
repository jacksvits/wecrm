import React from "react";

// === Общие иконки, темы и хелперы страницы «Файлы» ===
// Используются компонентами Files (виды «таблица»/«иконки») и FilesPanels (вид «Две панели»)

export const IMAGE_EXTENSIONS = new Set(["jpg", "jpeg", "png", "gif", "webp", "bmp", "ico", "svg"]);
export const PDF_EXTENSION = "pdf";

export const fileExtension = (name: string) => name.split(".").pop()?.toLowerCase() || "";
export const isImageFile = (name: string) => IMAGE_EXTENSIONS.has(fileExtension(name));
export const isPdfFile = (name: string) => fileExtension(name) === PDF_EXTENSION;
export const isPreviewableFile = (name: string) => isImageFile(name) || isPdfFile(name);

// Расширения, открываемые в текстовом редакторе (без .svg — он открывается как картинка)
export const TEXT_EDITABLE_EXTENSIONS = new Set([
  "txt", "html", "htm", "xml", "css",
  "js", "py", "cpp", "c", "java", "json", "bat", "cmd", "ps1", "php",
  "ini", "cfg", "log", "csv", "reg", "yaml", "yml", "htaccess",
]);
export const isTextEditableFile = (name: string) => TEXT_EDITABLE_EXTENSIONS.has(fileExtension(name));

// Видео-файлы: открываются в модальном плеере
export const VIDEO_EXTENSIONS = new Set(["mp4", "m4v", "webm", "mov", "ogv", "avi", "mkv", "wmv"]);
export const VIDEO_MIME: Record<string, string> = {
  mp4: "video/mp4", m4v: "video/mp4", webm: "video/webm", mov: "video/quicktime",
  ogv: "video/ogg", avi: "video/x-msvideo", mkv: "video/x-matroska", wmv: "video/x-ms-wmv",
};
export const isVideoFile = (name: string) => VIDEO_EXTENSIONS.has(fileExtension(name));
export const joinPath = (folder: string, name: string) => (folder ? `${folder}/${name}` : name);

export const formatSize = (bytes: number) => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

export const downloadIcon = (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
    <polyline points="7 10 12 15 17 10"></polyline>
    <line x1="12" y1="15" x2="12" y2="3"></line>
  </svg>
);

export const shareIcon = (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="18" cy="5" r="3"></circle>
    <circle cx="6" cy="12" r="3"></circle>
    <circle cx="18" cy="19" r="3"></circle>
    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
  </svg>
);

export const closeIcon = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
);

export const folderIcon = (
  <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="#007AFF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" fill="#D8EBFF"></path>
  </svg>
);

// === Темы иконок страницы «Файлы» ===
export type FileTheme = "win7" | "macos";

// Папка Windows 7 — в цвете акцента системы (--accent-color), градиенты-шейдеры поверх для объёма
const win7FolderIcon = (
  <svg width="64" height="52" viewBox="0 0 64 52">
    <defs>
      <linearGradient id="w7bodyShade" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#FFFFFF" stopOpacity="0.35" /><stop offset=".45" stopColor="#FFFFFF" stopOpacity="0.05" /><stop offset="1" stopColor="#000000" stopOpacity="0.18" />
      </linearGradient>
      <linearGradient id="w7tabShade" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#FFFFFF" stopOpacity="0.45" /><stop offset="1" stopColor="#FFFFFF" stopOpacity="0.1" />
      </linearGradient>
    </defs>
    <path d="M3 8a5 5 0 0 1 5-5h14l6 7h28a5 5 0 0 1 5 5v2H3V8z" fill="var(--accent-color)" stroke="var(--accent-color)" strokeWidth="1" />
    <path d="M3 8a5 5 0 0 1 5-5h14l6 7h28a5 5 0 0 1 5 5v2H3V8z" fill="url(#w7tabShade)" />
    <rect x="3" y="15" width="58" height="34" rx="5" fill="var(--accent-color)" stroke="var(--accent-color)" strokeWidth="1" />
    <rect x="3" y="15" width="58" height="34" rx="5" fill="url(#w7bodyShade)" />
    <rect x="6" y="18" width="52" height="12" rx="3" fill="#FFFFFF" opacity=".3" />
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

export const FILE_THEMES: Record<FileTheme, { label: string; folder: JSX.Element; fileFor: (name: string) => JSX.Element }> = {
  win7: { label: "Windows 7", folder: win7FolderIcon, fileFor: win7FileIconFor },
  macos: { label: "macOS", folder: macFolderIcon, fileFor: macFileIconFor },
};

export const iconButtonStyle: React.CSSProperties = {
  width: 34,
  height: 34,
  padding: 0,
  borderRadius: 8,
  border: "1px solid var(--border-color)",
  background: "var(--bg-card)",
  color: "#007AFF",
  cursor: "pointer",
  flexShrink: 0,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};
