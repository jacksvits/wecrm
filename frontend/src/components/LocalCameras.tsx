import { useEffect, useState } from "react";
import { CameraWidget } from "./CameraWidget";
import { CameraStreamImage } from "./CameraStreamImage";
import { HiddenCamerasModal, useHiddenCameras } from "./HiddenCameras";
import { api } from "../api/client";

// Вкладка «Локальные» страницы «Видеорегистратор»: локальные RTSP-камеры,
// ранее — вкладка «Камеры» страницы «Директор». Сетка потоков (обновление
// раз в 10 минут принудительной сменой key у <img>), добавление/редактирование/
// удаление камер, полноэкранный просмотр и «картинка в картинке» (PiP общий
// с CameraPipOverlay через localStorage camera_pip_ids).

const cardStyle: React.CSSProperties = {
  padding: 20,
  borderRadius: 16,
  background: "var(--bg-card)",
  border: "1px solid var(--border-color)",
  boxShadow: "var(--shadow)",
  minHeight: 240,
};

export function LocalCameras() {
  const { hidden, hide, restore, restoreAll } = useHiddenCameras("local");
  const [showHidden, setShowHidden] = useState(false);
  const [cameraSettingsList, setCameraSettingsList] = useState<any[]>([]);
  const [editingCameraId, setEditingCameraId] = useState<string | null>(null);
  // Камеры в режиме «картинка в картинке» (общие с CameraPipOverlay через localStorage)
  const [pipCameraIds, setPipCameraIds] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem("camera_pip_ids") || "[]"); } catch { return []; }
  });
  const [cameraDraft, setCameraDraft] = useState<any | null>(null);
  const openCameraEditor = (cam: any | null) => {
    if (cam) {
      setCameraDraft({ ...cam });
      setEditingCameraId(cam.id);
    } else {
      setCameraDraft({ label: `Видеокамера ${cameraSettingsList.length + 1}`, ip: "", port: 554, channel: "", username: "", password: "", isActive: true, isNew: true });
      setEditingCameraId("new");
    }
  };
  const toggleCameraPip = (id: string) => {
    const next = pipCameraIds.includes(id) ? pipCameraIds.filter(x => x !== id) : [...pipCameraIds, id];
    setPipCameraIds(next);
    try { localStorage.setItem("camera_pip_ids", JSON.stringify(next)); } catch {}
    window.dispatchEvent(new CustomEvent("camera-pip-toggle", { detail: id }));
  };
  const [fullscreenCamera, setFullscreenCamera] = useState<{ id: string; label: string } | null>(null);
  const [cameraRefreshKey, setCameraRefreshKey] = useState(0);

  useEffect(() => {
    api.camera.getSettings().then((list: any[]) => setCameraSettingsList(list)).catch(() => {});
  }, []);

  // Refresh camera streams every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => setCameraRefreshKey(Date.now()), 600000);
    return () => clearInterval(interval);
  }, []);

  const activeCameras = cameraSettingsList.filter((c: any) => c.isActive !== false && !hidden.includes(String(c.id)));
  const hiddenCameras = cameraSettingsList.filter((c: any) => hidden.includes(String(c.id)));

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 8 }}>
        <div style={{ fontSize: 13, color: "var(--text-muted)" }}>
          Локальные RTSP-камеры: {activeCameras.length} из {cameraSettingsList.length}
        </div>
        <button
          onClick={() => openCameraEditor(null)}
          style={{
            padding: '6px 14px', borderRadius: 10, border: '1px solid var(--border-color)',
            background: 'var(--bg-card)', color: 'var(--text-primary)', fontSize: 13,
            cursor: 'pointer', fontWeight: 500, whiteSpace: 'nowrap',
          }}
          title='Добавить камеру'
        >
          ＋ Добавить камеру
        </button>
        {hidden.length > 0 && (
          <button
            onClick={() => setShowHidden(true)}
            style={{
              padding: '6px 12px', borderRadius: 10, border: '1px solid var(--border-color)',
              background: 'var(--bg-card)', color: 'var(--text-muted)', fontSize: 13,
              cursor: 'pointer', whiteSpace: 'nowrap',
            }}
            title="Скрытые камеры"
          >
            ⚙️ Скрытые ({hidden.length})
          </button>
        )}
      </div>

      {cameraSettingsList.length === 0 ? (
        <div style={{ fontSize: 14, color: "var(--text-muted)" }}>
          Камеры не добавлены. Нажмите «＋ Добавить камеру», чтобы подключить локальную RTSP-камеру.
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 12, marginBottom: 24 }}>
          {activeCameras.map((cam: any) => (
            <div key={cam.id} style={cardStyle}>
              <CameraWidget
                cam={cam}
                refreshKey={cameraRefreshKey}
                onEdit={() => openCameraEditor(cam)}
                pipActive={pipCameraIds.includes(cam.id)}
                onTogglePip={() => toggleCameraPip(cam.id)}
                onFullscreen={() => setFullscreenCamera({ id: cam.id, label: cam.label })}
                onClose={() => hide(String(cam.id))}
              />
            </div>
          ))}
        </div>
      )}

      {/* Модальное окно настроек камеры */}
      {editingCameraId !== null && cameraDraft && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(0,0,0,0.4)", zIndex: 100,
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: "max(16px, env(safe-area-inset-top, 0)) max(16px, env(safe-area-inset-right, 0)) max(16px, env(safe-area-inset-bottom, 0)) max(16px, env(safe-area-inset-left, 0))",
        }} onClick={() => setEditingCameraId(null)}>
          <div style={{
            background: "var(--bg-card)", borderRadius: 16, padding: 24,
            width: "100%", maxWidth: 420, boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
            border: "1px solid var(--border-color)",
          }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ margin: "0 0 16px", fontSize: 16, fontWeight: 600 }}>{cameraDraft.isNew ? "Новая камера" : "Настройки камеры"}</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 4, display: "block" }}>Название виджета</label>
                <input
                  type="text"
                  value={cameraDraft.label || ""}
                  onChange={(e) => setCameraDraft((d: any) => ({ ...d, label: e.target.value }))}
                  style={{
                    width: "100%", padding: "10px 12px", borderRadius: 10,
                    border: "1px solid var(--border-color)", background: "var(--bg-input)",
                    color: "var(--text-primary)", fontSize: 14,
                  }}
                />
              </div>
              <div>
                <label style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 4, display: "block" }}>IP-адрес</label>
                <input
                  type="text"
                  value={cameraDraft.ip || ""}
                  onChange={(e) => setCameraDraft((d: any) => ({ ...d, ip: e.target.value }))}
                  style={{
                    width: "100%", padding: "10px 12px", borderRadius: 10,
                    border: "1px solid var(--border-color)", background: "var(--bg-input)",
                    color: "var(--text-primary)", fontSize: 14,
                  }}
                />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div>
                  <label style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 4, display: "block" }}>Порт RTSP</label>
                  <input
                    type="number"
                    value={cameraDraft.port || 554}
                    onChange={(e) => setCameraDraft((d: any) => ({ ...d, port: parseInt(e.target.value) || 554 }))}
                    style={{
                      width: "100%", padding: "10px 12px", borderRadius: 10,
                      border: "1px solid var(--border-color)", background: "var(--bg-input)",
                      color: "var(--text-primary)", fontSize: 14,
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 4, display: "block" }}>Канал</label>
                  <input
                    type="text"
                    value={cameraDraft.channel || ""}
                    onChange={(e) => setCameraDraft((d: any) => ({ ...d, channel: e.target.value }))}
                    style={{
                      width: "100%", padding: "10px 12px", borderRadius: 10,
                      border: "1px solid var(--border-color)", background: "var(--bg-input)",
                      color: "var(--text-primary)", fontSize: 14,
                    }}
                  />
                </div>
              </div>
              <div>
                <label style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 4, display: "block" }}>Логин</label>
                <input
                  type="text"
                  value={cameraDraft.username || ""}
                  onChange={(e) => setCameraDraft((d: any) => ({ ...d, username: e.target.value }))}
                  style={{
                    width: "100%", padding: "10px 12px", borderRadius: 10,
                    border: "1px solid var(--border-color)", background: "var(--bg-input)",
                    color: "var(--text-primary)", fontSize: 14,
                  }}
                />
              </div>
              <div>
                <label style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 4, display: "block" }}>Пароль</label>
                <input
                  type="password"
                  value={cameraDraft.password || ""}
                  onChange={(e) => setCameraDraft((d: any) => ({ ...d, password: e.target.value }))}
                  style={{
                    width: "100%", padding: "10px 12px", borderRadius: 10,
                    border: "1px solid var(--border-color)", background: "var(--bg-input)",
                    color: "var(--text-primary)", fontSize: 14,
                  }}
                />
              </div>
              <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={cameraDraft.isActive !== false}
                  onChange={(e) => setCameraDraft((d: any) => ({ ...d, isActive: e.target.checked }))}
                  style={{ width: 16, height: 16, accentColor: "#007AFF" }}
                />
                Камера активна
              </label>
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 20, justifyContent: "flex-end" }}>
              {!cameraDraft.isNew && (
                <button
                  onClick={async () => {
                    try {
                      if (!cameraDraft.id) return;
                      if (!window.confirm(`Удалить камеру «${cameraDraft.label}»?`)) return;
                      await api.camera.deleteCamera(cameraDraft.id);
                      setCameraSettingsList((list: any[]) => list.filter((c: any) => c.id !== cameraDraft.id));
                      toggleCameraPip(cameraDraft.id);
                      setPipCameraIds((prev: string[]) => {
                        const next = prev.filter((x) => x !== cameraDraft.id);
                        try { localStorage.setItem("camera_pip_ids", JSON.stringify(next)); } catch {}
                        return next;
                      });
                      setEditingCameraId(null);
                    } catch {}
                  }}
                  style={{
                    padding: "8px 16px", borderRadius: 10, border: "1px solid #dc2626",
                    background: "transparent", color: "#dc2626", fontSize: 13, cursor: "pointer", marginRight: "auto",
                  }}
                >Удалить</button>
              )}
              <button
                onClick={() => setEditingCameraId(null)}
                style={{
                  padding: "8px 16px", borderRadius: 10, border: "1px solid var(--border-color)",
                  background: "var(--bg-input)", color: "var(--text-primary)", fontSize: 13, cursor: "pointer",
                }}
              >Отмена</button>
              <button
                onClick={async () => {
                  try {
                    const { isNew, ...payload } = cameraDraft;
                    let saved: any;
                    if (isNew) {
                      saved = await api.camera.createCamera(payload);
                      const refreshed = await api.camera.getSettings();
                      setCameraSettingsList(refreshed);
                    } else {
                      saved = await api.camera.saveCamera(cameraDraft.id, payload);
                      setCameraSettingsList((list: any[]) => list.map((c: any) => (c.id === saved.id ? saved : c)));
                    }
                    setEditingCameraId(null);
                  } catch {}
                }}
                style={{
                  padding: "8px 16px", borderRadius: 10, border: "none",
                  background: "#007AFF", color: "#fff", fontSize: 13, cursor: "pointer", fontWeight: 500,
                }}
              >Сохранить</button>
            </div>
          </div>
        </div>
      )}

      {/* Полноэкранный просмотр камеры */}
      {fullscreenCamera && (
        <div
          style={{
            position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
            background: "#000", zIndex: 200,
            display: "flex", flexDirection: "column",
          }}
          onClick={() => setFullscreenCamera(null)}
        >
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "calc(12px + env(safe-area-inset-top, 0)) 20px 12px", background: "rgba(0,0,0,0.8)",
          }}>
            <span style={{ color: "#fff", fontSize: 15, fontWeight: 500 }}>{fullscreenCamera.label}</span>
            <button
              onClick={() => setFullscreenCamera(null)}
              style={{
                background: "none", border: "none", color: "#fff",
                fontSize: 20, cursor: "pointer", padding: "4px 8px",
              }}
            >
              ✕
            </button>
          </div>
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
            <CameraStreamImage
              cameraId={fullscreenCamera.id}
              refreshKey={cameraRefreshKey}
              alt={fullscreenCamera.label}
              style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}

      {/* Возврат скрытых камер */}
      <HiddenCamerasModal
        title="Скрытые камеры"
        items={hiddenCameras.map((c: any) => ({ id: String(c.id), label: c.label || c.ip || "Видеокамера" }))}
        open={showHidden}
        onClose={() => setShowHidden(false)}
        onRestore={(id) => restore(id)}
        onRestoreAll={restoreAll}
      />
    </div>
  );
}
