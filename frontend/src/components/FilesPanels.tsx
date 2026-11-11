import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "../api/client";
import {
  FILE_THEMES,
  FileTheme,
  closeIcon,
  downloadIcon,
  fileExtension,
  formatSize,
  isPreviewableFile,
  joinPath,
  shareIcon,
} from "./filesTheme";

// === Вид «Две панели» страницы «Файлы» (стиль Norton Commander/Krusader) ===
// Два независимых файловых менеджера вкладки рядом: навигация, выделение,
// копирование/перемещение между панелями, загрузка, создание папки, переименование,
// удаление. Вид доступен только администратору (переключатель скрыт от остальных),
// все операции на бэкенде дополнительно требуют роль admin.

interface PanelState {
  folder: string;
  items: any[];
  loading: boolean;
  selected: Set<string>;
}

const emptyPanel = (): PanelState => ({ folder: "", items: [], loading: true, selected: new Set() });

const DND_MIME = "application/x-wecrm-files";

interface FilesPanelsProps {
  tab: string;
  hiddenNames: string[];
  theme: FileTheme;
  onPreview: (item: any, folder: string) => void;
  onShare: (e: React.MouseEvent, item: any, folder: string) => void;
}

// Пункт контекстного меню с подсветкой при наведении
const MenuItem = ({ label, onClick, danger }: { label: string; onClick: () => void; danger?: boolean }) => {
  const [hover, setHover] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: "block",
        width: "100%",
        textAlign: "left",
        padding: "8px 12px",
        border: "none",
        background: hover ? "var(--bg-hover)" : "transparent",
        color: danger ? "#FF3B30" : "var(--text-primary)",
        fontSize: 13,
        cursor: "pointer",
        borderRadius: 7,
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </button>
  );
};

const menuDivider = <div style={{ height: 1, background: "var(--border-color)", margin: "4px 8px" }} />;

export function FilesPanels({ tab, hiddenNames, theme, onPreview, onShare }: FilesPanelsProps) {
  const [panels, setPanels] = useState<PanelState[]>([emptyPanel(), emptyPanel()]);
  const [activePanel, setActivePanel] = useState(0);
  // Модальные окна операций (создание папки / переименование)
  const [mkdirPanel, setMkdirPanel] = useState<number | null>(null);
  const [mkdirName, setMkdirName] = useState("");
  const [renameTarget, setRenameTarget] = useState<{ panel: number; item: any } | null>(null);
  const [renameValue, setRenameValue] = useState("");
  // Контекстное меню (правый клик): item === null — клик по пустому месту панели
  const [menu, setMenu] = useState<{ x: number; y: number; panel: number; item: any | null } | null>(null);
  const [txtPanel, setTxtPanel] = useState<number | null>(null);
  const [txtName, setTxtName] = useState("Новый документ.txt");
  const menuRef = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const uploadInputRef = useRef<HTMLInputElement>(null);

  // Закрытие контекстного меню: клик вне его или Escape
  useEffect(() => {
    if (!menu) return;
    const close = (e: MouseEvent) => {
      if (menuRef.current && menuRef.current.contains(e.target as Node)) return;
      setMenu(null);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenu(null);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", onKey);
    };
  }, [menu]);

  const loadPanel = useCallback((idx: number, folder: string) => {
    setPanels((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], folder, loading: true, selected: new Set() };
      return next;
    });
    api.files
      .browse(tab, folder)
      .then((data: any) => {
        const items = (data.items || []).filter((it: any) => !hiddenNames.includes(String(it.name).toLowerCase()));
        setPanels((prev) => {
          const next = [...prev];
          if (next[idx].folder !== folder) return prev;
          next[idx] = { ...next[idx], items, loading: false };
          return next;
        });
      })
      .catch((e: any) => {
        console.error(e);
        setPanels((prev) => {
          const next = [...prev];
          next[idx] = { ...next[idx], loading: false, items: [] };
          return next;
        });
      });
  }, [tab, hiddenNames]);

  // Смена вкладки — обе панели возвращаются в корень вкладки
  useEffect(() => {
    setPanels([emptyPanel(), emptyPanel()]);
    loadPanel(0, "");
    loadPanel(1, "");
    setActivePanel(0);
  }, [loadPanel]);

  const reloadPanel = (idx: number) => loadPanel(idx, panels[idx].folder);
  const reloadBoth = () => {
    reloadPanel(0);
    reloadPanel(1);
  };

  const patchPanel = (idx: number, patch: Partial<PanelState>) =>
    setPanels((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], ...patch };
      return next;
    });

  const enterFolder = (idx: number, name: string) => loadPanel(idx, joinPath(panels[idx].folder, name));

  const goUp = (idx: number) => {
    const folder = panels[idx].folder;
    if (!folder) return;
    const parts = folder.split("/");
    parts.pop();
    loadPanel(idx, parts.join("/"));
  };

  const handleRowClick = (idx: number, item: any, e: React.MouseEvent) => {
    setActivePanel(idx);
    const selected = new Set(panels[idx].selected);
    if (e.ctrlKey || e.metaKey) {
      if (selected.has(item.name)) selected.delete(item.name);
      else selected.add(item.name);
    } else {
      selected.clear();
      selected.add(item.name);
    }
    patchPanel(idx, { selected });
  };

  const handleRowDoubleClick = (idx: number, item: any) => {
    if (item.isDirectory) {
      enterFolder(idx, item.name);
    } else if (isPreviewableFile(item.name)) {
      onPreview(item, panels[idx].folder);
    } else {
      api.files
        .downloadFile(tab, joinPath(panels[idx].folder, item.name))
        .catch((err: any) => alert("Ошибка скачивания: " + err.message));
    }
  };

  const selectedItems = (idx: number) => panels[idx].items.filter((it) => panels[idx].selected.has(it.name));

  // === Операции над выделенным (активная панель) ===

  const runOp = async (fn: () => Promise<void>) => {
    if (busy) return;
    setBusy(true);
    try {
      await fn();
    } catch (e: any) {
      alert("Ошибка: " + (e?.message || e));
    } finally {
      setBusy(false);
    }
  };

  const handleMkdir = () =>
    runOp(async () => {
      if (mkdirPanel === null) return;
      const name = mkdirName.trim();
      if (!name) return;
      await api.files.mkdir(tab, panels[mkdirPanel].folder, name);
      setMkdirPanel(null);
      setMkdirName("");
      reloadPanel(mkdirPanel);
    });

  const handleRename = () =>
    runOp(async () => {
      if (!renameTarget) return;
      const newName = renameValue.trim();
      if (!newName || newName === renameTarget.item.name) {
        setRenameTarget(null);
        return;
      }
      await api.files.rename(tab, joinPath(panels[renameTarget.panel].folder, renameTarget.item.name), newName);
      setRenameTarget(null);
      reloadPanel(renameTarget.panel);
    });

  const handleDelete = () =>
    runOp(async () => {
      const items = selectedItems(activePanel);
      if (!items.length) return;
      const names = items.map((it) => it.name).join(", ");
      if (!window.confirm(`Удалить ${items.length > 1 ? `выбранные объекты (${items.length})` : `«${names}»`}?\nОперацию нельзя отменить.`)) return;
      for (const it of items) {
        await api.files.deleteItem(tab, joinPath(panels[activePanel].folder, it.name));
      }
      reloadPanel(activePanel);
    });

  const transferTo = (targetIdx: number, mode: "copy" | "move") =>
    runOp(async () => {
      const srcIdx = targetIdx === 0 ? 1 : 0;
      const items = selectedItems(srcIdx);
      if (!items.length) return;
      const destFolder = panels[targetIdx].folder;
      for (const it of items) {
        const from = joinPath(panels[srcIdx].folder, it.name);
        if (mode === "copy") await api.files.copy(tab, from, destFolder);
        else await api.files.move(tab, from, destFolder);
      }
      reloadBoth();
    });

  const handleDownloadSelected = () => {
    const items = selectedItems(activePanel);
    if (!items.length) return;
    items.forEach((it) => {
      const p = joinPath(panels[activePanel].folder, it.name);
      const req = it.isDirectory ? api.files.downloadFolder(tab, p) : api.files.downloadFile(tab, p);
      req.catch((err: any) => alert("Ошибка скачивания: " + err.message));
    });
  };

  const handleShareSelected = () => {
    const items = selectedItems(activePanel);
    if (items.length !== 1) return;
    onShare({ stopPropagation: () => {} } as any, items[0], panels[activePanel].folder);
  };

  // === Контекстное меню (правый клик) ===

  const openItemMenu = (idx: number, item: any, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setActivePanel(idx);
    // Клик по невыделенному объекту переносит выделение на него
    if (!panels[idx].selected.has(item.name)) patchPanel(idx, { selected: new Set([item.name]) });
    setMenu({ x: e.clientX, y: e.clientY, panel: idx, item });
  };

  const openSpaceMenu = (idx: number, e: React.MouseEvent) => {
    e.preventDefault();
    setActivePanel(idx);
    setMenu({ x: e.clientX, y: e.clientY, panel: idx, item: null });
  };

  const menuRun = (fn: () => void | Promise<void>) => {
    setMenu(null);
    void runOp(async () => { await fn(); });
  };

  const handleCreateTxt = () =>
    runOp(async () => {
      if (txtPanel === null) return;
      const name = txtName.trim();
      if (!name) return;
      await api.files.createFile(tab, panels[txtPanel].folder, name);
      setTxtPanel(null);
      reloadPanel(txtPanel);
    });

  const handleUploadClick = () => {
    if (uploadInputRef.current) uploadInputRef.current.value = "";
    uploadInputRef.current?.click();
  };

  const handleUploadFiles = async (files: FileList | null) => {
    if (!files || !files.length || uploading) return;
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append("files", file);
        await api.files.upload(tab, panels[activePanel].folder, formData);
      }
      reloadPanel(activePanel);
    } catch (e: any) {
      alert("Ошибка загрузки: " + (e?.message || e));
    } finally {
      setUploading(false);
    }
  };

  // === Drag && drop между панелями: без модификатора — перемещение, с Ctrl/Alt — копирование ===

  const handleDragStart = (idx: number, item: any, e: React.DragEvent) => {
    const selected = panels[idx].selected.has(item.name)
      ? Array.from(panels[idx].selected)
      : [item.name];
    e.dataTransfer.setData(DND_MIME, JSON.stringify({ from: idx, names: selected }));
    e.dataTransfer.effectAllowed = "copyMove";
  };

  const handleDrop = (idx: number, e: React.DragEvent) => {
    e.preventDefault();
    const raw = e.dataTransfer.getData(DND_MIME);
    if (!raw) return;
    let payload: { from: number; names: string[] };
    try {
      payload = JSON.parse(raw);
    } catch {
      return;
    }
    const mode = e.ctrlKey || e.altKey ? "copy" : "move";
    const srcIdx = payload.from;
    const destFolder = panels[idx].folder;
    runOp(async () => {
      for (const name of payload.names) {
        const from = joinPath(panels[srcIdx].folder, name);
        if (from === joinPath(destFolder, name)) continue;
        if (mode === "copy") await api.files.copy(tab, from, destFolder);
        else await api.files.move(tab, from, destFolder);
      }
      reloadBoth();
    });
  };

  const actionButton = (label: string, onClick: () => void, opts?: { disabled?: boolean; title?: string }) => ({
    onClick,
    disabled: busy || uploading || opts?.disabled,
    title: opts?.title,
  });

  const activeSelected = selectedItems(activePanel);
  const otherIdx = activePanel === 0 ? 1 : 0;

  const breadcrumb = (idx: number) => {
    const folder = panels[idx].folder;
    const parts = folder ? folder.split("/") : [];
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 4, minWidth: 0, flex: 1, fontSize: 12, overflow: "hidden" }}>
        <button
          onClick={(e) => { e.stopPropagation(); setActivePanel(idx); loadPanel(idx, ""); }}
          style={{ border: "none", background: "transparent", color: parts.length ? "#007AFF" : "var(--text-primary)", cursor: "pointer", fontSize: 12, fontWeight: 600, padding: "2px 4px", borderRadius: 6, flexShrink: 0 }}
        >
          Корень
        </button>
        {parts.map((part, i) => (
          <span key={i} style={{ display: "flex", alignItems: "center", gap: 4, minWidth: 0 }}>
            <span style={{ color: "var(--text-muted)", flexShrink: 0 }}>/</span>
            <button
              onClick={(e) => { e.stopPropagation(); setActivePanel(idx); loadPanel(idx, parts.slice(0, i + 1).join("/")); }}
              style={{ border: "none", background: "transparent", color: i === parts.length - 1 ? "var(--text-primary)" : "#007AFF", cursor: "pointer", fontSize: 12, fontWeight: i === parts.length - 1 ? 600 : 500, padding: "2px 4px", borderRadius: 6, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 140 }}
              title={part}
            >
              {part}
            </button>
          </span>
        ))}
      </div>
    );
  };

  const renderPanel = (idx: number) => {
    const panel = panels[idx];
    const isActive = activePanel === idx;
    return (
      <div
        key={idx}
        onClick={() => setActivePanel(idx)}
        onContextMenu={(e) => openSpaceMenu(idx, e)}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => handleDrop(idx, e)}
        style={{
          flex: 1,
          minWidth: 0,
          display: "flex",
          flexDirection: "column",
          borderRadius: 12,
          border: "1px solid var(--border-color)",
          background: "var(--bg-card)",
          overflow: "hidden",
          boxShadow: isActive ? "inset 0 0 0 1.5px #007AFF" : "none",
        }}
      >
        {/* Шапка панели: назад, хлебные крошки, обновить */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 10px", borderBottom: "1px solid var(--border-color)", background: "var(--bg-hover)" }}>
          <button
            onClick={(e) => { e.stopPropagation(); setActivePanel(idx); goUp(idx); }}
            disabled={!panel.folder}
            title="Наверх"
            style={{ border: "none", background: "transparent", color: panel.folder ? "#007AFF" : "var(--text-muted)", cursor: panel.folder ? "pointer" : "default", padding: 4, borderRadius: 6, display: "flex", flexShrink: 0, opacity: panel.folder ? 1 : 0.4 }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5" /><polyline points="12 19 5 12 12 5" /></svg>
          </button>
          {breadcrumb(idx)}
          <button
            onClick={(e) => { e.stopPropagation(); setActivePanel(idx); reloadPanel(idx); }}
            title="Обновить"
            style={{ border: "none", background: "transparent", color: "var(--text-muted)", cursor: "pointer", padding: 4, borderRadius: 6, display: "flex", flexShrink: 0 }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" /><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" /></svg>
          </button>
        </div>
        {/* Список объектов */}
        <div style={{ flex: 1, minHeight: 0, overflowY: "auto" }}>
          {panel.loading ? (
            <div style={{ padding: 24, textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>Загрузка...</div>
          ) : panel.items.length === 0 ? (
            <div style={{ padding: 24, textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>Папка пуста</div>
          ) : (
            panel.items.map((item: any) => {
              const isSelected = panel.selected.has(item.name);
              return (
                <div
                  key={item.name}
                  draggable
                  onDragStart={(e) => handleDragStart(idx, item, e)}
                  onClick={(e) => handleRowClick(idx, item, e)}
                  onContextMenu={(e) => openItemMenu(idx, item, e)}
                  onDoubleClick={() => handleRowDoubleClick(idx, item)}
                  title={item.name}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "30px minmax(0,1fr) 84px",
                    alignItems: "center",
                    gap: 8,
                    padding: "5px 10px",
                    cursor: "default",
                    userSelect: "none",
                    fontSize: 13,
                    background: isSelected ? "rgba(0,122,255,0.14)" : "transparent",
                    boxShadow: isSelected ? "inset 3px 0 0 #007AFF" : "none",
                  }}
                >
                  <div style={{ width: 26, height: 26, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                    <div style={{ transform: "scale(0.42)", flexShrink: 0 }}>
                      {item.isDirectory ? FILE_THEMES[theme].folder : FILE_THEMES[theme].fileFor(item.name)}
                    </div>
                  </div>
                  <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontWeight: isSelected ? 600 : 500 }}>{item.name}</div>
                  <div style={{ color: "var(--text-muted)", fontSize: 12, textAlign: "right" }}>{item.isDirectory ? "Папка" : formatSize(item.size)}</div>
                </div>
              );
            })
          )}
        </div>
        {/* Подвал панели: счётчик выделенных */}
        <div style={{ padding: "5px 10px", borderTop: "1px solid var(--border-color)", fontSize: 11, color: "var(--text-muted)", background: "var(--bg-hover)", display: "flex", justifyContent: "space-between" }}>
          <span>{panel.items.length} объектов</span>
          <span>{panel.selected.size ? `выделено: ${panel.selected.size}` : "\u00A0"}</span>
        </div>
      </div>
    );
  };

  const barButtonStyle = (enabled: boolean): React.CSSProperties => ({
    padding: "7px 12px",
    borderRadius: 8,
    border: "1px solid var(--border-color)",
    background: "var(--bg-card)",
    color: enabled ? "var(--text-primary)" : "var(--text-muted)",
    fontSize: 13,
    fontWeight: 500,
    cursor: enabled ? "pointer" : "default",
    opacity: enabled ? 1 : 0.55,
    display: "flex",
    alignItems: "center",
    gap: 6,
    flexShrink: 0,
  });

  const barBtn = (label: string, opts: { disabled?: boolean; title?: string; onClick: () => void; accent?: boolean }) => (
    <button
      onClick={opts.onClick}
      disabled={opts.disabled || busy || uploading}
      title={opts.title}
      style={{
        ...barButtonStyle(!opts.disabled),
        background: opts.accent ? "#007AFF" : "var(--bg-card)",
        color: opts.accent ? "#fff" : !opts.disabled ? "var(--text-primary)" : "var(--text-muted)",
        border: opts.accent ? "1px solid #007AFF" : "1px solid var(--border-color)",
      }}
    >
      {label}
    </button>
  );

  return (
    <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ flex: 1, minHeight: 0, display: "flex", gap: 8 }}>
        {renderPanel(0)}
        {renderPanel(1)}
      </div>

      {/* Панель действий: операции как у Krusader — применяются к активной панели */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          flexWrap: "wrap",
          flexShrink: 0,
          padding: "8px 10px",
          borderRadius: 12,
          border: "1px solid var(--border-color)",
          background: "var(--bg-hover)",
        }}
      >
        {barBtn("Создать папку", { onClick: () => { setMkdirName(""); setMkdirPanel(activePanel); }, title: "Создать папку в активной панели" })}
        <input ref={uploadInputRef} type="file" multiple style={{ display: "none" }} onChange={(e) => handleUploadFiles(e.target.files)} />
        {barBtn(uploading ? "Загрузка..." : "Загрузить", { onClick: handleUploadClick, disabled: uploading, title: "Загрузить файлы в активную панель" })}
        <div style={{ width: 1, height: 22, background: "var(--border-color)", flexShrink: 0 }} />
        {barBtn("Копировать →", { onClick: () => transferTo(otherIdx, "copy"), disabled: !activeSelected.length, title: `Скопировать выделенное в панель ${otherIdx + 1}` })}
        {barBtn("Переместить →", { onClick: () => transferTo(otherIdx, "move"), disabled: !activeSelected.length, title: `Переместить выделенное в панель ${otherIdx + 1}` })}
        <div style={{ width: 1, height: 22, background: "var(--border-color)", flexShrink: 0 }} />
        {barBtn("Переименовать", { onClick: () => { const it = activeSelected[0]; setRenameValue(it.name); setRenameTarget({ panel: activePanel, item: it }); }, disabled: activeSelected.length !== 1 })}
        {barBtn("Удалить", { onClick: handleDelete, disabled: !activeSelected.length })}
        <div style={{ width: 1, height: 22, background: "var(--border-color)", flexShrink: 0 }} />
        {barBtn("Скачать", { onClick: handleDownloadSelected, disabled: !activeSelected.length })}
        {barBtn("Поделиться", { onClick: handleShareSelected, disabled: activeSelected.length !== 1 })}
        <div style={{ marginLeft: "auto", fontSize: 12, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 6 }}>
          {shareIcon}
          <span>Активна панель {activePanel + 1} · Ctrl+клик — несколько объектов · перетаскивание между панелями</span>
        </div>
      </div>

      {/* Контекстное меню (правый клик) */}
      {menu && (() => {
        const { x, y, panel, item } = menu;
        const folder = panels[panel].folder;
        const itemPath = item ? joinPath(folder, item.name) : "";
        const isZip = !!item && !item.isDirectory && fileExtension(item.name) === "zip";
        const MENU_W = 230;
        const estH = (item ? (item.isDirectory ? 6 : 7) : 3) * 36 + 12;
        const left = Math.min(x, window.innerWidth - MENU_W - 8);
        const top = Math.min(y, window.innerHeight - estH - 8);
        return (
          <div
            ref={menuRef}
            style={{
              position: "fixed",
              left,
              top,
              width: MENU_W,
              zIndex: 1300,
              background: "var(--bg-card)",
              border: "1px solid var(--border-color)",
              borderRadius: 10,
              boxShadow: "0 10px 32px rgba(0,0,0,0.25)",
              padding: 4,
            }}
          >
            {item ? (
              <>
                <MenuItem
                  label="Скачать"
                  onClick={() =>
                    menuRun(() =>
                      (item.isDirectory ? api.files.downloadFolder(tab, itemPath) : api.files.downloadFile(tab, itemPath)).catch(
                        (err: any) => alert("Ошибка скачивания: " + err.message)
                      )
                    )
                  }
                />
                <MenuItem
                  label="Сжать в ZIP"
                  onClick={() =>
                    menuRun(async () => {
                      await api.files.zip(tab, itemPath);
                      reloadPanel(panel);
                    })
                  }
                />
                {isZip && (
                  <MenuItem
                    label="Распаковать ZIP"
                    onClick={() =>
                      menuRun(async () => {
                        await api.files.unzip(tab, itemPath);
                        reloadPanel(panel);
                      })
                    }
                  />
                )}
                <MenuItem
                  label="Поделиться"
                  onClick={() => {
                    setMenu(null);
                    onShare({ stopPropagation: () => {} } as any, item, folder);
                  }}
                />
                {menuDivider}
                <MenuItem
                  label="Переименовать"
                  onClick={() => {
                    setMenu(null);
                    setRenameValue(item.name);
                    setRenameTarget({ panel, item });
                  }}
                />
                <MenuItem
                  label="Удалить"
                  danger
                  onClick={() =>
                    menuRun(async () => {
                      if (!window.confirm(`Удалить «${item.name}»?\nОперацию нельзя отменить.`)) return;
                      await api.files.deleteItem(tab, itemPath);
                      reloadPanel(panel);
                    })
                  }
                />
              </>
            ) : (
              <>
                <MenuItem
                  label="Загрузить"
                  onClick={() => {
                    setMenu(null);
                    if (uploadInputRef.current) uploadInputRef.current.value = "";
                    uploadInputRef.current?.click();
                  }}
                />
                <MenuItem
                  label="Создать папку"
                  onClick={() => {
                    setMenu(null);
                    setMkdirName("");
                    setMkdirPanel(panel);
                  }}
                />
                <MenuItem
                  label="Создать TXT"
                  onClick={() => {
                    setMenu(null);
                    setTxtName("Новый документ.txt");
                    setTxtPanel(panel);
                  }}
                />
              </>
            )}
          </div>
        );
      })()}

      {/* Модальное окно: создать папку */}
      {mkdirPanel !== null && (
        <div
          onClick={() => setMkdirPanel(null)}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1200, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ background: "var(--bg-card)", borderRadius: 16, width: "min(400px, calc(100vw - 32px))", border: "1px solid var(--border-color)", boxShadow: "0 12px 40px rgba(0,0,0,0.28)", padding: 20 }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
              <div style={{ fontSize: 16, fontWeight: 600, flex: 1 }}>Создать папку</div>
              <button onClick={() => setMkdirPanel(null)} title="Закрыть" style={{ border: "none", background: "transparent", color: "var(--text-muted)", cursor: "pointer", padding: 4, display: "flex" }}>{closeIcon}</button>
            </div>
            <input
              autoFocus
              value={mkdirName}
              onChange={(e) => setMkdirName(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleMkdir(); if (e.key === "Escape") setMkdirPanel(null); }}
              placeholder="Имя папки"
              style={{ width: "100%", boxSizing: "border-box", padding: "10px 12px", borderRadius: 10, border: "1px solid var(--border-color)", background: "var(--bg-input)", color: "var(--text-primary)", fontSize: 14 }}
            />
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 16 }}>
              <button onClick={() => setMkdirPanel(null)} style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid var(--border-color)", background: "var(--bg-hover)", color: "var(--text-primary)", cursor: "pointer", fontSize: 14 }}>Отмена</button>
              <button onClick={handleMkdir} disabled={busy || !mkdirName.trim()} style={{ padding: "8px 16px", borderRadius: 8, border: "none", background: "#007AFF", color: "#fff", cursor: "pointer", fontSize: 14, fontWeight: 500, opacity: busy || !mkdirName.trim() ? 0.6 : 1 }}>Создать</button>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно: переименовать */}
      {renameTarget && (
        <div
          onClick={() => setRenameTarget(null)}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1200, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ background: "var(--bg-card)", borderRadius: 16, width: "min(400px, calc(100vw - 32px))", border: "1px solid var(--border-color)", boxShadow: "0 12px 40px rgba(0,0,0,0.28)", padding: 20 }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
              <div style={{ fontSize: 16, fontWeight: 600, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={renameTarget.item.name}>Переименовать: {renameTarget.item.name}</div>
              <button onClick={() => setRenameTarget(null)} title="Закрыть" style={{ border: "none", background: "transparent", color: "var(--text-muted)", cursor: "pointer", padding: 4, display: "flex" }}>{closeIcon}</button>
            </div>
            <input
              autoFocus
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleRename(); if (e.key === "Escape") setRenameTarget(null); }}
              style={{ width: "100%", boxSizing: "border-box", padding: "10px 12px", borderRadius: 10, border: "1px solid var(--border-color)", background: "var(--bg-input)", color: "var(--text-primary)", fontSize: 14 }}
            />
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 16 }}>
              <button onClick={() => setRenameTarget(null)} style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid var(--border-color)", background: "var(--bg-hover)", color: "var(--text-primary)", cursor: "pointer", fontSize: 14 }}>Отмена</button>
              <button onClick={handleRename} disabled={busy || !renameValue.trim()} style={{ padding: "8px 16px", borderRadius: 8, border: "none", background: "#007AFF", color: "#fff", cursor: "pointer", fontSize: 14, fontWeight: 500, opacity: busy || !renameValue.trim() ? 0.6 : 1 }}>Сохранить</button>
            </div>
          </div>
        </div>
      )}
      {/* Модальное окно: создать TXT-файл */}
      {txtPanel !== null && (
        <div
          onClick={() => setTxtPanel(null)}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1200, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ background: "var(--bg-card)", borderRadius: 16, width: "min(400px, calc(100vw - 32px))", border: "1px solid var(--border-color)", boxShadow: "0 12px 40px rgba(0,0,0,0.28)", padding: 20 }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
              <div style={{ fontSize: 16, fontWeight: 600, flex: 1 }}>Создать TXT-файл</div>
              <button onClick={() => setTxtPanel(null)} title="Закрыть" style={{ border: "none", background: "transparent", color: "var(--text-muted)", cursor: "pointer", padding: 4, display: "flex" }}>{closeIcon}</button>
            </div>
            <input
              autoFocus
              value={txtName}
              onChange={(e) => setTxtName(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleCreateTxt(); if (e.key === "Escape") setTxtPanel(null); }}
              placeholder="Имя файла"
              style={{ width: "100%", boxSizing: "border-box", padding: "10px 12px", borderRadius: 10, border: "1px solid var(--border-color)", background: "var(--bg-input)", color: "var(--text-primary)", fontSize: 14 }}
            />
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 16 }}>
              <button onClick={() => setTxtPanel(null)} style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid var(--border-color)", background: "var(--bg-hover)", color: "var(--text-primary)", cursor: "pointer", fontSize: 14 }}>Отмена</button>
              <button onClick={handleCreateTxt} disabled={busy || !txtName.trim()} style={{ padding: "8px 16px", borderRadius: 8, border: "none", background: "#007AFF", color: "#fff", cursor: "pointer", fontSize: 14, fontWeight: 500, opacity: busy || !txtName.trim() ? 0.6 : 1 }}>Создать</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default FilesPanels;
