import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { HikvisionCameras } from "./HikvisionCameras";
import { TapoCameras } from "./TapoCameras";

// Страница «Видеорегистратор»: объединяет вкладки облачных камер «Tapo» и
// «Hik-Connect». Вкладка видна, только если соответствующий плагин включён
// (статусы /api/tapo-plugin/status и /api/hikvision-plugin/status). Активная
// вкладка хранится в URL (?tab=tapo|hik): так старые адреса /tapo-cameras и
// /hikvision-cameras редиректятся сюда без потери контекста.

type Tab = "tapo" | "hik";

function getToken() {
  return localStorage.getItem("token") || "";
}

export function VideoRecorder() {
  const [params, setParams] = useSearchParams();
  const [tapoActive, setTapoActive] = useState(false);
  const [hikActive, setHikActive] = useState(false);
  const [statusesLoaded, setStatusesLoaded] = useState(false);

  useEffect(() => {
    const headers: HeadersInit = getToken() ? { "X-Auth-Token": getToken() } : {};
    Promise.all([
      fetch("/api/tapo-plugin/status", { headers })
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null),
      fetch("/api/hikvision-plugin/status", { headers })
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null),
    ]).then(([tapo, hik]) => {
      setTapoActive(tapo?.isActive === true);
      setHikActive(hik?.isActive === true);
      setStatusesLoaded(true);
    });
  }, []);

  // Порядок вкладок — как в прежнем меню: сначала Tapo, затем Hik-Connect.
  // Если выбранная в URL вкладка недоступна (плагин выключен) — показываем
  // первую доступную.
  const requestedTab: Tab = params.get("tab") === "hik" ? "hik" : "tapo";
  const availableTabs: Tab[] = [
    ...(tapoActive ? (["tapo"] as Tab[]) : []),
    ...(hikActive ? (["hik"] as Tab[]) : []),
  ];
  const activeTab: Tab =
    availableTabs.includes(requestedTab) && availableTabs.length > 0
      ? requestedTab
      : availableTabs[0] ?? "tapo";

  const setTab = (tab: Tab) => setParams({ tab });

  const tabStyle = (isActive: boolean): React.CSSProperties => ({
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

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "16px 16px 32px" }}>
      <h1 style={{ fontSize: 22, fontWeight: 600, margin: "0 0 16px" }}>Видеорегистратор</h1>
      {statusesLoaded && availableTabs.length === 0 ? (
        <div style={{ fontSize: 14, color: "var(--text-muted)" }}>
          Ни один плагин камер не включён. Включите «Tapo» или «Hik-Connect» в разделе «Настройки» → «Интеграции».
        </div>
      ) : (
        <>
          <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
            {tapoActive && (
              <button style={tabStyle(activeTab === "tapo")} onClick={() => setTab("tapo")}>
                Tapo
              </button>
            )}
            {hikActive && (
              <button style={tabStyle(activeTab === "hik")} onClick={() => setTab("hik")}>
                Hik-Connect
              </button>
            )}
          </div>
          {activeTab === "tapo" ? <TapoCameras /> : <HikvisionCameras />}
        </>
      )}
    </div>
  );
}
