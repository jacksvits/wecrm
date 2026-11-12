import { useEffect, useRef, useState } from "react";
import { api } from "../api/client";
import { useAuth } from "../hooks/useAuth";
import { FilesPanels } from "./FilesPanels";
import { FilesTextEditor } from "./FilesTextEditor";
import FilesNfsSettings from "./FilesNfsSettings";
import {
  FILE_THEMES,
  FileTheme,
  closeIcon,
  downloadIcon,
  fileExtension,
  folderIcon,
  formatSize,
  iconButtonStyle,
  isImageFile,
  isPdfFile,
  isPreviewableFile,
  isTextEditableFile,
  isVideoFile,
  isAudioFile,
  joinPath,
  shareIcon,
  VIDEO_MIME,
  AUDIO_MIME,
} from "./filesTheme";

const ALL_TABS = [
  { key: "system", label: "Система", short: "Система", icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="6" rx="1.5" /><rect x="2" y="14" width="20" height="6" rx="1.5" /></svg> },
  { key: "programs", label: "Программы", short: "Прогр.", icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></svg> },
  { key: "drivers", label: "Драйвера", short: "Драйв.", icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="5" width="14" height="14" rx="2" /><path d="M9 2v3M15 2v3M9 19v3M15 19v3M2 9h3M2 15h3M19 9h3M19 15h3" /></svg> },
  { key: "documents", label: "Документы", short: "Докум.", icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /></svg> },
  { key: "games", label: "Игры", short: "Игры", icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 11h4M8 9v4M15 12h.01M17 10h.01M17.32 5H6.68a4 4 0 0 0-3.98 3.6L2 15a3 3 0 0 0 3 3c.9 0 1.7-.4 2.25-1.03L8.5 15.5h7l1.25 1.47A2.9 2.9 0 0 0 19 18a3 3 0 0 0 3-3l-.7-6.4A4 4 0 0 0 17.32 5z" /></svg> },
];

// Универсальная иконка диска для NFS-вкладок, добавленных в настройках
const DRIVE_ICON = <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="12" x2="2" y2="12" /><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" /><line x1="6" y1="16" x2="6.01" y2="16" /><line x1="10" y1="16" x2="10.01" y2="16" /></svg>;

// Разбор списка скрытых имён: через запятую, без пробелов и регистра
const parseHidden = (value: string): string[] =>
  value.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);

// Ближайший стандартный срок действия ссылки (часы) для отображения в селекте
const nearestExpiryOption = (iso: string): string => {
  const hours = Math.round((new Date(iso).getTime() - Date.now()) / 3600000);
  for (const opt of [1, 24, 168, 720]) if (Math.abs(hours - opt) <= 1) return String(opt);
  return "";
};

// === Темы иконок и базовые элементы страницы «Файлы» перенесены в filesTheme.tsx ===


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

export function Files({ publicMode = false }: { publicMode?: boolean }) {
  const { user } = useAuth();
  const isAdmin = (user as any)?.role === "admin";
  // Вкладка «Система» (корень хранилища) — только для администраторов
  // Вкладки приходят с бэкенда (NFS-папки + «Система» для админа);
  // ALL_TABS — только источник иконок/подписей для известных ключей
  const [tabList, setTabList] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState(isAdmin ? "system" : "");
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
  // Вид (иконки/таблица/две панели) — личная настройка пользователя, хранится в localStorage.
  // По умолчанию: мобильная версия — таблица, десктопная — иконки.
  // Вид «Две панели» — только для администраторов: несохранённое значение игнорируем.
  const viewPrefKey = `filesViewMode_${(user as any)?.id || "anon"}`;
  const [viewMode, setViewModeState] = useState<"icons" | "table" | "panels">(() => {
    const saved = localStorage.getItem(viewPrefKey);
    if (saved === "table" || saved === "icons") return saved;
    if (saved === "panels" && isAdmin && !publicMode) return "panels";
    // В публичном режиме (welans.click) вид по умолчанию — таблица
    if (publicMode) return "table";
    return window.innerWidth < 768 ? "table" : "icons";
  });
  const setViewMode = (mode: "icons" | "table" | "panels") => {
    setViewModeState(mode);
    try { localStorage.setItem(viewPrefKey, mode); } catch {}
  };
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [savingHidden, setSavingHidden] = useState(false);
  const [previewItem, setPreviewItem] = useState<any | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  // Папка объекта превью: в обычных видах — текущая папка, в виде «Две панели» — папка панели
  const [previewFolder, setPreviewFolder] = useState("");
  // Изображения папки превью для слайдера (переход ‹ › между картинками)
  const [previewList, setPreviewList] = useState<any[]>([]);
  const previewImages = previewList.filter((it: any) => isImageFile(it.name));
  const previewIndex = previewItem ? previewImages.findIndex((it: any) => it.name === previewItem.name) : -1;
  const previewNavigate = (dir: 1 | -1) => {
    if (previewImages.length < 2) return;
    const idx = previewIndex >= 0 ? previewIndex : 0;
    setPreviewItem(previewImages[(idx + dir + previewImages.length) % previewImages.length]);
  };
  // Открытый TXT-редактор (виды «Иконки»/«Таблица»)
  const [txtEditor, setTxtEditor] = useState<{ item: any; folder: string } | null>(null);
  // Видеоплеер: открытый видеофайл (blob грузится через /preview)
  const [videoItem, setVideoItem] = useState<{ item: any; folder: string } | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoLoading, setVideoLoading] = useState(false);
  const [videoError, setVideoError] = useState("");
  // Аудиоплеер: открытый аудиофайл
  const [audioItem, setAudioItem] = useState<{ item: any; folder: string } | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioLoading, setAudioLoading] = useState(false);
  const [audioError, setAudioError] = useState("");

  const loadSettings = async () => {
    try {
      const data = await api.files.tabs();
      const map: Record<string, { url: string; path: string }> = {};
      data.forEach((t: any) => (map[t.tabKey] = { url: t.url || "", path: t.path || "" }));
      setSettings(map);
      const tabs = data.map((t: any) => {
        const known = ALL_TABS.find((k) => k.key === t.tabKey);
        const label = t.label || known?.label || t.tabKey;
        const short = known?.short || (label.length > 6 ? label.slice(0, 5) + "…" : label);
        return { key: t.tabKey, label, short, icon: known?.icon || DRIVE_ICON };
      });
      setTabList(tabs);
      setActiveTab((prev) => (prev && tabs.some((t: any) => t.key === prev) ? prev : tabs[0]?.key || ""));
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
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadSettings();
    loadHidden();
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    if (!activeTab) return;
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
    api.files.previewFile(activeTab, joinPath(previewFolder, previewItem.name))
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
  }, [activeTab, previewFolder, previewItem]);

  useEffect(() => {
    if (!previewItem) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPreviewItem(null);
      // Слайдер: стрелки листают изображения папки
      if (isImageFile(previewItem.name) && previewImages.length > 1) {
        if (e.key === "ArrowRight") previewNavigate(1);
        if (e.key === "ArrowLeft") previewNavigate(-1);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });

  // Загрузка видео для плеера: blob через /preview с корректным MIME
  useEffect(() => {
    if (!videoItem) {
      setVideoUrl(null);
      return;
    }
    let url: string | null = null;
    let cancelled = false;
    setVideoLoading(true);
    setVideoError("");
    api.files
      .previewFile(activeTab, joinPath(videoItem.folder, videoItem.item.name))
      .then((blob: Blob) => {
        if (cancelled) return;
        const ext = fileExtension(videoItem.item.name);
        const typed = blob.type && blob.type !== "application/octet-stream" ? blob : new Blob([blob], { type: VIDEO_MIME[ext] || "video/mp4" });
        url = URL.createObjectURL(typed);
        setVideoUrl(url);
      })
      .catch((e: any) => { if (!cancelled) setVideoError(e?.message || "Ошибка загрузки видео"); })
      .finally(() => { if (!cancelled) setVideoLoading(false); });
    return () => { cancelled = true; if (url) URL.revokeObjectURL(url); };
  }, [videoItem, activeTab]);

  useEffect(() => {
    if (!videoItem) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setVideoItem(null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });

  // Загрузка аудио для плеера
  useEffect(() => {
    if (!audioItem) {
      setAudioUrl(null);
      return;
    }
    let url: string | null = null;
    let cancelled = false;
    setAudioLoading(true);
    setAudioError("");
    api.files
      .previewFile(activeTab, joinPath(audioItem.folder, audioItem.item.name))
      .then((blob: Blob) => {
        if (cancelled) return;
        const ext = fileExtension(audioItem.item.name);
        const typed = blob.type && blob.type !== "application/octet-stream" ? blob : new Blob([blob], { type: AUDIO_MIME[ext] || "audio/mpeg" });
        url = URL.createObjectURL(typed);
        setAudioUrl(url);
      })
      .catch((e: any) => { if (!cancelled) setAudioError(e?.message || "Ошибка загрузки аудио"); })
      .finally(() => { if (!cancelled) setAudioLoading(false); });
    return () => { cancelled = true; if (url) URL.revokeObjectURL(url); };
  }, [audioItem, activeTab]);

  useEffect(() => {
    if (!audioItem) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setAudioItem(null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });

  // formatSize импортируется из filesTheme.tsx

  const handleItemClick = (item: any) => {
    if (item.isDirectory) {
      setCurrentFolder((prev) => (prev ? prev + "/" + item.name : item.name));
    } else if (isTextEditableFile(item.name)) {
      setTxtEditor({ item, folder: currentFolder });
    } else if (isVideoFile(item.name)) {
      setVideoItem({ item, folder: currentFolder });
    } else if (isAudioFile(item.name)) {
      setAudioItem({ item, folder: currentFolder });
    } else if (isPreviewableFile(item.name)) {
      setPreviewFolder(currentFolder);
      setPreviewList(visibleFiles.filter((f: any) => isImageFile(f.name)));
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

  // === Публичная ссылка «Поделиться» ===
  const [shareItem, setShareItem] = useState<any | null>(null);
  const [shareInfo, setShareInfo] = useState<{ id: string; url: string; expiresAt: string | null } | null>(null);
  const [shareBusy, setShareBusy] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  // Выбранный срок действия: "" = без ограничения, иначе — часы
  const [shareExpiry, setShareExpiry] = useState("");

  const copyShareUrl = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = url;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setShareCopied(true);
    setTimeout(() => setShareCopied(false), 2000);
  };

  // По клику: открываем окно, ищем активную ссылку на объект, при отсутствии —
  // создаём без ограничения срока и сразу копируем в буфер обмена.
  // baseFolder — папка объекта: в виде «Две панели» передаётся папка панели.
  const openShare = async (e: React.MouseEvent, item: any, baseFolder?: string) => {
    e.stopPropagation();
    const base = baseFolder !== undefined ? baseFolder : currentFolder;
    const p = joinPath(base, item.name);
    setShareItem({ ...item, filePath: p });
    setShareInfo(null);
    setShareCopied(false);
    setShareExpiry("");
    setShareBusy(true);
    try {
      let info: any = await api.files.getShare(activeTab, p);
      if (!info) info = await api.files.createShare(activeTab, p, !!item.isDirectory, null);
      setShareInfo(info);
      setShareExpiry(info.expiresAt ? nearestExpiryOption(info.expiresAt) : "");
      copyShareUrl(info.url);
    } catch (err: any) {
      alert("Ошибка создания ссылки: " + (err?.message || err));
      setShareItem(null);
    } finally {
      setShareBusy(false);
    }
  };

  const changeShareExpiry = async (value: string) => {
    if (!shareInfo) return;
    setShareExpiry(value);
    setShareBusy(true);
    try {
      const info: any = await api.files.updateShare(shareInfo.id, value ? Number(value) : null);
      setShareInfo(info);
    } catch (err: any) {
      alert("Ошибка сохранения: " + (err?.message || err));
    } finally {
      setShareBusy(false);
    }
  };

  const revokeShare = async () => {
    if (!shareInfo) return;
    setShareBusy(true);
    try {
      await api.files.deleteShare(shareInfo.id);
      setShareItem(null);
      setShareInfo(null);
    } catch (err: any) {
      alert("Ошибка отключения доступа: " + (err?.message || err));
    } finally {
      setShareBusy(false);
    }
  };

  const handleBack = () => {
    if (!currentFolder) return;
    const parts = currentFolder.split("/");
    parts.pop();
    setCurrentFolder(parts.join("/"));
  };

  const tabLabel = tabList.find((t) => t.key === activeTab)?.label || "Файлы";
  // Скрытие по списку применяется во всех вкладках, включая «Система»
  const visibleFiles = files.filter((item) => !hiddenNames.includes(String(item.name).toLowerCase()));

  const handleSaveHidden = async () => {
    setSavingHidden(true);
    try {
      // «Две панели» — личная настройка, в глобальный вид по умолчанию не сохраняем
      const data = await api.files.saveHidden(hiddenInput, themeInput, viewMode === "panels" ? "icons" : viewMode);
      setHiddenNames(parseHidden((data as any)?.names || ""));
      setFilesTheme(themeInput);
      setShowSettings(false);
    } catch (e: any) {
      alert("Ошибка сохранения: " + e.message);
    } finally {
      setSavingHidden(false);
    }
  };

  // На мобильном в публичном режиме — компактная таблица без колонок «Расширение» и «Скачивания»,
  // чтобы страница помещалась на экран телефона без горизонтальной прокрутки
  const compactTable = publicMode && isMobile;
  const tableGridCols = compactTable ? "minmax(0,1fr) 70px 34px" : "minmax(0,1fr) 90px 90px 110px 40px";

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <div style={{ marginBottom: 16 }}>
        {!publicMode && <h2 style={{ margin: "0 0 12px", fontSize: 18 }}>Файлы</h2>}
        <div style={{ display: "flex", gap: isMobile ? 2 : 8, borderBottom: "1px solid var(--border-color)" }}>
          {tabList.map((tab) => (
            <button
              key={tab.key}
              onClick={() => { setActiveTab(tab.key); setCurrentFolder(""); setPreviewItem(null); }}
              title={isMobile ? tab.label : undefined}
              style={{
                padding: isMobile ? "8px 10px 6px" : "10px 16px",
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
              {isMobile ? (
                <span style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                  {tab.icon}
                  <span style={{ fontSize: 9, lineHeight: 1 }}>{tab.short}</span>
                </span>
              ) : (
                tab.label
              )}
            </button>
          ))}
          {/* Переключатель вида (иконки/таблица) — личная настройка, виден всем */}
          <div style={{ marginLeft: "auto", alignSelf: "center", display: "inline-flex", background: "var(--bg-hover)", borderRadius: 9, padding: 2, gap: 2, flexShrink: 0 }}>
            <button
              onClick={() => setViewMode("icons")}
              title="Вид: иконки"
              style={{
                border: "none", cursor: "pointer", padding: isMobile ? "5px 7px" : "5px 9px", borderRadius: 7, display: "flex",
                background: viewMode === "icons" ? "var(--bg-card)" : "transparent",
                color: viewMode === "icons" ? "#007AFF" : "var(--text-muted)",
                boxShadow: viewMode === "icons" ? "0 1px 3px rgba(0,0,0,0.15)" : "none",
              }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></svg>
            </button>
            <button
              onClick={() => setViewMode("table")}
              title="Вид: таблица"
              style={{
                border: "none", cursor: "pointer", padding: isMobile ? "5px 7px" : "5px 9px", borderRadius: 7, display: "flex",
                background: viewMode === "table" ? "var(--bg-card)" : "transparent",
                color: viewMode === "table" ? "#007AFF" : "var(--text-muted)",
                boxShadow: viewMode === "table" ? "0 1px 3px rgba(0,0,0,0.15)" : "none",
              }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>
            {/* Вид «Две панели» — только для администраторов */}
            {isAdmin && !publicMode && (
              <button
                onClick={() => setViewMode("panels")}
                title="Вид: две панели"
                style={{
                  border: "none", cursor: "pointer", padding: isMobile ? "5px 7px" : "5px 9px", borderRadius: 7, display: "flex",
                  background: viewMode === "panels" ? "var(--bg-card)" : "transparent",
                  color: viewMode === "panels" ? "#007AFF" : "var(--text-muted)",
                  boxShadow: viewMode === "panels" ? "0 1px 3px rgba(0,0,0,0.15)" : "none",
                }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <rect x="3" y="4" width="8" height="16" rx="1.5" />
                  <rect x="13" y="4" width="8" height="16" rx="1.5" />
                </svg>
              </button>
            )}
          </div>
          {/* Кнопка настроек отображения (скрытие файлов/папок) — только для администраторов */}
          {isAdmin && (
            <button
              onClick={() => { setHiddenInput(hiddenNames.join(", ")); setThemeInput(filesTheme); setShowSettings(true); }}
              title="Настройки отображения"
              style={{
                alignSelf: "center", padding: 6, border: "none", flexShrink: 0,
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
        <div style={viewMode === "panels" ? { flex: 1, minHeight: 0, display: "flex", flexDirection: "column", overflow: "hidden" } : { flex: 1, overflow: "auto" }}>
          {/* Строка навигации: в «Две панели» не нужна (своя у каждой панели), в «Иконки»/«Таблица» — только кнопка «Назад», чип-путь не выводим */}
          {viewMode !== "panels" && currentFolder && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
            <button
              onClick={handleBack}
              style={{
                padding: "6px 12px", borderRadius: 8, border: "1px solid var(--border-color)",
                background: "var(--bg-hover)", color: "var(--text-primary)", cursor: "pointer", fontSize: 13,
              }}
            >
              ← Назад
            </button>
          </div>
          )}

          {visibleFiles.length === 0 && viewMode !== "panels" ? (
            <div style={{ padding: 40, textAlign: "center", color: "var(--text-muted)" }}>Папка пуста</div>
          ) : viewMode === "panels" ? (
            <FilesPanels
              tab={activeTab}
              hiddenNames={hiddenNames}
              theme={filesTheme}
              onPreview={(item, folder, list) => { setPreviewFolder(folder); setPreviewList(list || []); setPreviewItem(item); }}
              onShare={(e, item, folder) => { openShare(e, item, folder); }}
              onVideo={(item, folder) => setVideoItem({ item, folder })}
              onAudio={(item, folder) => setAudioItem({ item, folder })}
            />
          ) : viewMode === "table" ? (
            <div style={{ overflowX: compactTable ? "hidden" : "auto" }}>
              <div style={{ minWidth: compactTable ? 0 : 560, border: "1px solid var(--border-color)", borderRadius: 12, overflow: "hidden" }}>
                <div style={{
                  display: "grid", gridTemplateColumns: tableGridCols,
                  padding: compactTable ? "8px 12px" : "10px 16px", background: "var(--bg-hover)", fontSize: 12,
                  fontWeight: 600, color: "var(--text-muted)",
                }}>
                  <div>Наименование</div>
                  <div>Размер</div>
                  {!compactTable && <div>Расширение</div>}
                  {!compactTable && <div>Скачивания</div>}
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
                        display: "grid", gridTemplateColumns: tableGridCols,
                        padding: compactTable ? "6px 12px" : "6px 16px", alignItems: "center", cursor: "pointer",
                        borderTop: "1px solid var(--border-color)", background: "var(--bg-card)",
                        fontSize: 13, transition: "background 0.15s",
                      }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--bg-hover)"; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--bg-card)"; }}
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
                      {!compactTable && <div style={{ color: "var(--text-muted)", fontSize: 12 }}>{item.isDirectory ? "Папка" : (fileExtension(item.name) ? fileExtension(item.name).toUpperCase() : "—")}</div>}
                      {!compactTable && <div style={{ color: "var(--text-muted)", fontSize: 12 }}>{item.downloads || 0}</div>}
                      <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                        <button
                          onClick={(e) => openShare(e, item)}
                          title="Поделиться"
                          style={{ ...iconButtonStyle, width: 26, height: 26, borderRadius: 7 }}
                        >
                          {shareIcon}
                        </button>
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
                      onClick={(e) => openShare(e, item)}
                      title="Поделиться"
                      style={{ ...iconButtonStyle, width: 24, height: 24, borderRadius: 7, position: "absolute", top: 4, right: 32, opacity: 0.85 }}
                    >
                      {shareIcon}
                    </button>
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
          )}
        </div>
      )}

      {/* Модальное окно «Поделиться»: ссылка уже скопирована в буфер при открытии */}
      {shareItem && (
        <div
          onClick={() => setShareItem(null)}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 1200, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ background: "var(--bg-card)", borderRadius: 16, width: "min(480px, calc(100vw - 32px))", border: "1px solid var(--border-color)", boxShadow: "0 12px 40px rgba(0,0,0,0.28)", padding: 20 }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
              <div style={{ color: "#007AFF", display: "flex", flexShrink: 0 }}>{shareIcon}</div>
              <div style={{ fontSize: 16, fontWeight: 600, flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={shareItem.name}>
                Поделиться: {shareItem.name}
              </div>
              <button onClick={() => setShareItem(null)} title="Закрыть" style={{ ...iconButtonStyle, width: 28, height: 28, borderRadius: 8, color: "var(--text-muted)" }}>{closeIcon}</button>
            </div>
            {shareBusy && !shareInfo ? (
              <div style={{ padding: "24px 0", textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>Создание ссылки…</div>
            ) : shareInfo ? (
              <>
                <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
                  <input
                    readOnly
                    value={shareInfo.url}
                    onFocus={(e) => (e.target as HTMLInputElement).select()}
                    style={{ flex: 1, minWidth: 0, padding: "9px 12px", borderRadius: 10, border: "1px solid var(--border-color)", background: "var(--bg-input)", color: "var(--text-primary)", fontSize: 13 }}
                  />
                  <button
                    onClick={() => copyShareUrl(shareInfo.url)}
                    disabled={shareBusy}
                    style={{ padding: "9px 16px", borderRadius: 10, border: "none", background: shareCopied ? "#34C759" : "#007AFF", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", flexShrink: 0 }}
                  >
                    {shareCopied ? "Скопировано" : "Копировать"}
                  </button>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
                  <label style={{ fontSize: 13, color: "var(--text-muted)" }}>Срок действия:</label>
                  <select
                    value={shareExpiry}
                    onChange={(e) => changeShareExpiry(e.target.value)}
                    disabled={shareBusy}
                    style={{ padding: "7px 10px", borderRadius: 8, border: "1px solid var(--border-color)", background: "var(--bg-input)", color: "var(--text-primary)", fontSize: 13 }}
                  >
                    <option value="">Без ограничения</option>
                    <option value="1">1 час</option>
                    <option value="24">1 день</option>
                    <option value="168">7 дней</option>
                    <option value="720">30 дней</option>
                  </select>
                  {shareInfo.expiresAt && (
                    <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
                      до {new Date(shareInfo.expiresAt).toLocaleString("ru-RU")}
                    </span>
                  )}
                </div>
                {user ? (
                  <div style={{ display: "flex", justifyContent: "flex-end" }}>
                    <button
                      onClick={revokeShare}
                      disabled={shareBusy}
                      style={{ padding: "8px 14px", borderRadius: 10, border: "1px solid #FF3B30", background: "transparent", color: "#FF3B30", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
                    >
                      Отключить доступ
                    </button>
                  </div>
                ) : (
                  <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                    Отключить доступ к ссылке может только авторизованный пользователь CRM. Ограничьте ссылку сроком действия.
                  </div>
                )}
              </>
            ) : null}
          </div>
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
              background: "var(--bg-card)", borderRadius: 16, width: "min(920px, calc(100vw - 32px))",
              height: "min(720px, calc(100vh - 32px))", border: "1px solid var(--border-color)",
              boxShadow: "0 12px 40px rgba(0,0,0,0.28)", display: "flex", flexDirection: "column", overflow: "hidden",
            }}
          >
            <div style={{ minHeight: 52, padding: "0 12px 0 18px", display: "flex", alignItems: "center", gap: 10, borderBottom: "1px solid var(--border-color)" }}>
              <div style={{ flex: 1, minWidth: 0, fontSize: 14, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {previewItem.name}
              </div>
              {isImageFile(previewItem.name) && previewImages.length > 1 && (
                <div style={{ fontSize: 12, color: "var(--text-muted)", flexShrink: 0 }}>
                  {(previewIndex >= 0 ? previewIndex + 1 : 1)} из {previewImages.length}
                </div>
              )}
              <button
                onClick={() => api.files.downloadFile(activeTab, joinPath(previewFolder, previewItem.name)).catch((e: any) => alert("Ошибка скачивания: " + e.message))}
                title="Скачать"
                style={iconButtonStyle}
              >
                {downloadIcon}
              </button>
              <button onClick={() => setPreviewItem(null)} title="Закрыть" style={{ ...iconButtonStyle, color: "var(--text-muted)" }}>
                {closeIcon}
              </button>
            </div>
            <div style={{ flex: 1, minHeight: 0, background: "var(--bg-hover)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16, position: "relative" }}>
              {/* Слайдер: стрелки перехода между изображениями папки */}
              {isImageFile(previewItem.name) && previewImages.length > 1 && (
                <>
                  <button
                    onClick={(e) => { e.stopPropagation(); previewNavigate(-1); }}
                    title="Предыдущая (←)"
                    style={{
                      position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)",
                      width: 44, height: 44, borderRadius: "50%", border: "1px solid var(--border-color)",
                      background: "var(--bg-card)", color: "#007AFF", cursor: "pointer", zIndex: 2,
                      display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 14px rgba(0,0,0,0.12)",
                    }}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); previewNavigate(1); }}
                    title="Следующая (→)"
                    style={{
                      position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)",
                      width: 44, height: 44, borderRadius: "50%", border: "1px solid var(--border-color)",
                      background: "var(--bg-card)", color: "#007AFF", cursor: "pointer", zIndex: 2,
                      display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 14px rgba(0,0,0,0.12)",
                    }}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
                  </button>
                </>
              )}
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
              background: "var(--bg-card)", borderRadius: 16, padding: 24, width: "100%", maxWidth: 480,
              border: "1px solid var(--border-color)", boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
            }}
          >
            <h3 style={{ margin: "0 0 8px", fontSize: 16 }}>Настройки отображения</h3>
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
            {isAdmin && !publicMode && <FilesNfsSettings onChanged={loadSettings} />}
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

      {/* TXT-редактор (виды «Иконки»/«Таблица») */}
      {txtEditor && (
        <FilesTextEditor
          tab={activeTab}
          itemPath={joinPath(txtEditor.folder, txtEditor.item.name)}
          title={txtEditor.item.name}
          onClose={() => setTxtEditor(null)}
        />
      )}

      {/* Модальный видеоплеер */}
      {videoItem && (
        <div
          onClick={() => setVideoItem(null)}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.88)", zIndex: 1240, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "min(1100px, 100%)",
              maxWidth: "calc(100vw - 40px)",
              background: "#0b0b0f",
              borderRadius: 14,
              overflow: "hidden",
              border: "1px solid var(--border-color)",
              boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderBottom: "1px solid rgba(255,255,255,0.08)", flexShrink: 0 }}>
              <div style={{ flex: 1, minWidth: 0, fontSize: 14, fontWeight: 600, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {videoItem.item.name}
              </div>
              <button
                onClick={() => api.files.downloadFile(activeTab, joinPath(videoItem.folder, videoItem.item.name)).catch((e: any) => alert("Ошибка скачивания: " + e.message))}
                title="Скачать"
                style={{ width: 36, height: 36, borderRadius: 8, border: "1px solid rgba(255,255,255,0.15)", background: "transparent", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
              >
                {downloadIcon}
              </button>
              <button
                onClick={() => setVideoItem(null)}
                title="Закрыть"
                style={{ width: 36, height: 36, borderRadius: 8, border: "1px solid rgba(255,255,255,0.15)", background: "transparent", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
              >
                {closeIcon}
              </button>
            </div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", background: "#000", minHeight: 300 }}>
              {videoLoading ? (
                <div style={{ padding: 60, color: "rgba(255,255,255,0.6)", fontSize: 14 }}>Загрузка видео...</div>
              ) : videoError ? (
                <div style={{ padding: 40, textAlign: "center", color: "rgba(255,255,255,0.85)", fontSize: 14, display: "flex", flexDirection: "column", gap: 14, alignItems: "center" }}>
                  <div>{videoError}</div>
                  <button
                    onClick={() => api.files.downloadFile(activeTab, joinPath(videoItem.folder, videoItem.item.name)).catch((e: any) => alert("Ошибка скачивания: " + e.message))}
                    style={{ padding: "8px 18px", borderRadius: 8, border: "none", background: "#007AFF", color: "#fff", cursor: "pointer", fontSize: 14, fontWeight: 500 }}
                  >
                    Скачать файл
                  </button>
                </div>
              ) : (
                <video
                  src={videoUrl || undefined}
                  controls
                  autoPlay
                  style={{ width: "100%", maxHeight: "calc(100vh - 190px)", display: "block", background: "#000" }}
                  onError={() => setVideoError("Браузер не может воспроизвести этот формат. Скачайте файл для просмотра в плеере.")}
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Модальный аудиоплеер */}
      {audioItem && (
        <div
          onClick={() => setAudioItem(null)}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 1245, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "min(560px, calc(100vw - 40px))",
              background: "var(--bg-card)",
              borderRadius: 14,
              overflow: "hidden",
              border: "1px solid var(--border-color)",
              boxShadow: "0 20px 60px rgba(0,0,0,0.45)",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderBottom: "1px solid var(--border-color)", flexShrink: 0 }}>
              <div style={{ flex: 1, minWidth: 0, fontSize: 14, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {audioItem.item.name}
              </div>
              <button
                onClick={() => api.files.downloadFile(activeTab, joinPath(audioItem.folder, audioItem.item.name)).catch((e: any) => alert("Ошибка скачивания: " + e.message))}
                title="Скачать"
                style={{ ...iconButtonStyle, width: 36, height: 36 }}
              >
                {downloadIcon}
              </button>
              <button
                onClick={() => setAudioItem(null)}
                title="Закрыть"
                style={{ ...iconButtonStyle, width: 36, height: 36, color: "var(--text-muted)" }}
              >
                {closeIcon}
              </button>
            </div>
            <div style={{ padding: "18px 16px", display: "flex", alignItems: "center", justifyContent: "center", minHeight: 96 }}>
              {audioLoading ? (
                <div style={{ color: "var(--text-muted)", fontSize: 14 }}>Загрузка аудио...</div>
              ) : audioError ? (
                <div style={{ textAlign: "center", fontSize: 14, display: "flex", flexDirection: "column", gap: 12, alignItems: "center" }}>
                  <div>{audioError}</div>
                  <button
                    onClick={() => api.files.downloadFile(activeTab, joinPath(audioItem.folder, audioItem.item.name)).catch((e: any) => alert("Ошибка скачивания: " + e.message))}
                    style={{ padding: "8px 18px", borderRadius: 8, border: "none", background: "#007AFF", color: "#fff", cursor: "pointer", fontSize: 14, fontWeight: 500 }}
                  >
                    Скачать файл
                  </button>
                </div>
              ) : (
                <audio
                  src={audioUrl || undefined}
                  controls
                  autoPlay
                  style={{ width: "100%", display: "block" }}
                  onError={() => setAudioError("Браузер не может воспроизвести этот формат. Скачайте файл для прослушивания.")}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

