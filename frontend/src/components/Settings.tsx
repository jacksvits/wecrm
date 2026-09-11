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
import { SystemSettings } from "./SystemSettings";

type MainTab = "roles" | "statuses" | "users" | "contactTypes" | "integrations" | "system";
type PluginKey = "email" | "telephony" | "max" | "telegram" | "vk" | "sms" | "yandex";

// Интеграции («плагины»): карточка с заголовком и статусом активности
const PLUGINS: { key: PluginKey; label: string; description: string }[] = [
  { key: "email", label: "Почта", description: "Приём писем через IMAP и создание задач" },
  { key: "telephony", label: "Телефония", description: "Звонки и SMS через Novofon" },
  { key: "max", label: "MAX", description: "Уведомления в мессенджер MAX" },
  { key: "telegram", label: "Telegram", description: "Уведомления и задачи из Telegram" },
  { key: "vk", label: "ВК Группа", description: "Комментарии и товары ВКонтакте" },
  { key: "sms", label: "SMS журнал", description: "Журнал входящих и исходящих SMS" },
  { key: "yandex", label: "Яндекс", description: "API-ключ Яндекс.Карт" },
];

export function Settings() {
  const [activeTab, setActiveTab] = useState<MainTab>("roles");
  const [selectedPlugin, setSelectedPlugin] = useState<PluginKey>("email");
  const [pluginStatus, setPluginStatus] = useState<Record<PluginKey, boolean>>({
    email: false,
    telephony: false,
    max: false,
    telegram: false,
    vk: false,
    sms: false,
    yandex: false,
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

  const renderIntegrations = () => {
    return (
      <div>
        {/* Сетка карточек плагинов */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
            gap: 12,
            marginBottom: 24,
          }}
        >
          {PLUGINS.map((plugin) => {
            const isActive = pluginStatus[plugin.key];
            const isSelected = selectedPlugin === plugin.key;
            return (
              <button
                key={plugin.key}
                onClick={() => setSelectedPlugin(plugin.key)}
                style={{
                  textAlign: "left",
                  padding: 16,
                  borderRadius: 12,
                  border: isSelected ? "2px solid var(--text-primary)" : "1px solid var(--border-color)",
                  background: "var(--bg-card)",
                  cursor: "pointer",
                  transition: "all 0.2s",
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                  <span style={{ fontSize: 15, fontWeight: 600, color: "var(--text-primary)" }}>
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

        {/* Настройки выбранного плагина */}
        {selectedPlugin === "email" && <EmailSettings />}
        {selectedPlugin === "telephony" && <TelephonySettings />}
        {selectedPlugin === "max" && <MaxSettings />}
        {selectedPlugin === "telegram" && <TelegramSettings />}
        {selectedPlugin === "vk" && <VkGroupSettings />}
        {selectedPlugin === "sms" && <SmsJournal />}
        {selectedPlugin === "yandex" && <YandexSettings />}
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
