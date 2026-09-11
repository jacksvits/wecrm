import { useEffect, useState } from "react";
import { EmailSettings } from "./EmailSettings";
import { RoleManager } from "./RoleManager";
import { TelephonySettings } from "./TelephonySettings";
import { StatusManager } from "./StatusManager";
import { MaxSettings } from "./MaxSettings";
import { TelegramSettings } from "./TelegramSettings";
import { UserList } from "./UserList";
import { VkGroupSettings } from "./VkGroupSettings";
import { ContactTypeManager } from "./ContactTypeManager";
import { SmsJournal } from "./SmsJournal";
import { YandexSettings } from "./YandexSettings";
import BegetSettings from "./BegetSettings";
import { SystemSettings } from "./SystemSettings";

type MainTab = "roles" | "statuses" | "users" | "contactTypes" | "integrations" | "system";
type PluginKey = "email" | "telephony" | "max" | "telegram" | "vk" | "sms" | "yandex" | "beget";

// Интеграции («плагины»): карточка с группой, заголовком и статусом активности
const PLUGINS: { key: PluginKey; label: string; group: string; description: string }[] = [
  { key: "email", label: "Почта", group: "Коммуникации", description: "Приём писем через IMAP и создание задач" },
  { key: "telephony", label: "Телефония", group: "Коммуникации", description: "Звонки и SMS через Novofon" },
  { key: "sms", label: "SMS журнал", group: "Коммуникации", description: "Журнал входящих и исходящих SMS" },
  { key: "max", label: "MAX", group: "Мессенджеры", description: "Уведомления в мессенджер MAX" },
  { key: "telegram", label: "Telegram", group: "Мессенджеры", description: "Уведомления и задачи из Telegram" },
  { key: "vk", label: "ВК Группа", group: "Мессенджеры", description: "Комментарии и товары ВКонтакте" },
  { key: "yandex", label: "Яндекс", group: "Сервисы", description: "API-ключ Яндекс.Карт" },
  { key: "beget", label: "Beget", group: "Хостинг", description: "Хостинг-аккаунт: тариф, баланс, домены" },
];

function PluginIcon({ pluginKey }: { pluginKey: PluginKey }) {
  const icons: Record<PluginKey, string> = {
    email: "M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z",
    telephony: "M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z",
    sms: "M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z",
    max: "M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z",
    telegram: "M12 19l9 2-9-18-9 18 9-2zm0 0v-8",
    vk: "M18 4h3v3h-3a4 4 0 00-4 4v2h4l-1 4h-3v7h-4v-7H7v-4h4v-3a6 6 0 016-6z",
    yandex: "M9 20l6-16M15 20L9 4",
    beget: "M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01",
  };
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d={icons[pluginKey]} />
    </svg>
  );
}

function renderPluginSettings(pluginKey: PluginKey) {
  switch (pluginKey) {
    case "email":
      return <EmailSettings />;
    case "telephony":
      return <TelephonySettings />;
    case "max":
      return <MaxSettings />;
    case "telegram":
      return <TelegramSettings />;
    case "vk":
      return <VkGroupSettings />;
    case "sms":
      return <SmsJournal />;
    case "yandex":
      return <YandexSettings />;
    case "beget":
      return <BegetSettings />;
    default:
      return null;
  }
}

export function Settings() {
  const [activeTab, setActiveTab] = useState<MainTab>("roles");
  const [selectedPlugin, setSelectedPlugin] = useState<PluginKey | null>(null);
  const [pluginStatus, setPluginStatus] = useState<Record<PluginKey, boolean>>({
    email: false,
    telephony: false,
    max: false,
    telegram: false,
    vk: false,
    sms: false,
    yandex: false,
    beget: false,
  });

  useEffect(() => {
    if (activeTab !== "integrations") return;
    const token = localStorage.getItem("token");
    fetch("/api/integrations/status", {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((s) => s && setPluginStatus((prev) => ({ ...prev, ...s })))
      .catch(() => {});
  }, [activeTab]);

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

  const renderContent = () => {
    switch (activeTab) {
      case "roles":
        return <RoleManager />;
      case "statuses":
        return <StatusManager />;
      case "users":
        return <UserList />;
      case "contactTypes":
        return <ContactTypeManager />;
      case "integrations":
        return renderIntegrations();
      case "system":
        return <SystemSettings />;
      default:
        return null;
    }
  };

  // Закрытие модального окна плагина: обновляем статусы (могли измениться в настройках)
  const closePluginModal = () => {
    setSelectedPlugin(null);
    const token = localStorage.getItem("token");
    fetch("/api/integrations/status", {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((s) => s && setPluginStatus((prev) => ({ ...prev, ...s })))
      .catch(() => {});
  };

  const renderIntegrations = () => {
    // Группировка карточек по группам (сохраняя порядок объявления)
    const groups: { name: string; plugins: typeof PLUGINS }[] = [];
    PLUGINS.forEach((p) => {
      const g = groups.find((x) => x.name === p.group);
      if (g) g.plugins.push(p);
      else groups.push({ name: p.group, plugins: [p] });
    });

    const selected = selectedPlugin ? PLUGINS.find((p) => p.key === selectedPlugin) : null;

    return (
      <div>
        {groups.map((group) => (
          <div key={group.name} style={{ marginBottom: 24 }}>
            <div
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: "var(--text-muted)",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                marginBottom: 10,
              }}
            >
              {group.name}
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
                gap: 12,
              }}
            >
              {group.plugins.map((plugin) => {
                const isActive = pluginStatus[plugin.key];
                return (
                  <button
                    key={plugin.key}
                    onClick={() => setSelectedPlugin(plugin.key)}
                    style={{
                      textAlign: "left",
                      padding: 16,
                      borderRadius: 12,
                      border: "1px solid var(--border-color)",
                      background: "var(--bg-card)",
                      cursor: "pointer",
                      transition: "all 0.2s",
                      display: "flex",
                      flexDirection: "column",
                      gap: 10,
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ color: "var(--text-muted)", display: "flex", flexShrink: 0 }}>
                        <PluginIcon pluginKey={plugin.key} />
                      </span>
                      <span style={{ fontSize: 15, fontWeight: 600, color: "var(--text-primary)", flex: 1 }}>
                        {plugin.label}
                      </span>
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 6,
                          padding: "3px 10px",
                          borderRadius: 999,
                          fontSize: 12,
                          fontWeight: 500,
                          background: isActive ? "#dcfce7" : "#f3f4f6",
                          color: isActive ? "#16a34a" : "#6b7280",
                          flexShrink: 0,
                        }}
                      >
                        <span
                          style={{
                            width: 7,
                            height: 7,
                            borderRadius: "50%",
                            background: isActive ? "#16a34a" : "#9ca3af",
                            flexShrink: 0,
                          }}
                        />
                        {isActive ? "Активен" : "Не активен"}
                      </span>
                    </div>
                    <span style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.4 }}>
                      {plugin.description}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        {/* Модальное окно настроек плагина */}
        {selected && (
          <div
            onClick={closePluginModal}
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 1000,
              background: "rgba(0, 0, 0, 0.45)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 20,
            }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                width: "100%",
                maxWidth: 720,
                maxHeight: "85vh",
                display: "flex",
                flexDirection: "column",
                borderRadius: 16,
                background: "var(--bg-card)",
                border: "1px solid var(--border-color)",
                boxShadow: "0 20px 60px rgba(0, 0, 0, 0.25)",
                overflow: "hidden",
              }}
            >
              {/* Шапка модального окна */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "16px 20px",
                  borderBottom: "1px solid var(--border-color)",
                  flexShrink: 0,
                }}
              >
                <span style={{ color: "var(--text-muted)", display: "flex" }}>
                  <PluginIcon pluginKey={selected.key} />
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 16, fontWeight: 600, color: "var(--text-primary)" }}>
                    {selected.label}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{selected.group}</div>
                </div>
                <button
                  onClick={closePluginModal}
                  title="Закрыть"
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    border: "none",
                    background: "transparent",
                    color: "var(--text-muted)",
                    fontSize: 20,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  ×
                </button>
              </div>
              {/* Тело модального окна */}
              <div style={{ padding: 20, overflowY: "auto" }}>
                {renderPluginSettings(selected.key)}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div>
      <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 16 }}>Настройки</h2>
      <div style={{ display: "flex", gap: 8, marginBottom: 24, flexWrap: "wrap" }}>
        <button style={tabStyle(activeTab === "system")} onClick={() => setActiveTab("system")}>
          Системные
        </button>
        <button style={tabStyle(activeTab === "roles")} onClick={() => setActiveTab("roles")}>
          Права доступа
        </button>
        <button style={tabStyle(activeTab === "statuses")} onClick={() => setActiveTab("statuses")}>
          Статусы
        </button>
        <button style={tabStyle(activeTab === "users")} onClick={() => setActiveTab("users")}>
          Пользователи
        </button>
        <button style={tabStyle(activeTab === "contactTypes")} onClick={() => setActiveTab("contactTypes")}>
          Типы контактов
        </button>
        <button style={tabStyle(activeTab === "integrations")} onClick={() => setActiveTab("integrations")}>
          Интеграции
        </button>
      </div>
      {renderContent()}
    </div>
  );
}
