import { useEffect, useState } from "react";
import { EmailSettings } from "./EmailSettings";
import { EmailFilters } from "./EmailFilters";
import { AccountingSettings } from "./AccountingSettings";
import { RoleManager } from "./RoleManager";
import { TelephonySettings } from "./TelephonySettings";
import { StatusManager } from "./StatusManager";
import { MaxSettings } from "./MaxSettings";
import { TelegramSettings } from "./TelegramSettings";
import { VpnSettings } from "./VpnSettings";
import { UserList } from "./UserList";
import { VkGroupSettings } from "./VkGroupSettings";
import { ContactTypeManager } from "./ContactTypeManager";
import { SmsJournal } from "./SmsJournal";
import { YandexSettings } from "./YandexSettings";
import { DgisSettings } from "./DgisSettings";
import BegetSettings from "./BegetSettings";
import PskovlineSettings from "./PskovlineSettings";
import TochkaSettings from "./TochkaSettings";
import TochkaAcquiringSettings from "./TochkaAcquiringSettings";
import OneCSettings from "./OneCSettings";
import DiadocSettings from "./DiadocSettings";
import OzonSellerSettings from "./OzonSellerSettings";
import { SystemSettings } from "./SystemSettings";

type MainTab = "roles" | "statuses" | "users" | "contactTypes" | "integrations" | "system";
type PluginKey = "email" | "telephony" | "max" | "telegram" | "vk" | "sms" | "yandex" | "dgis" | "beget" | "pskovline" | "tochka" | "tochkaAcquiring" | "onec" | "diadoc" | "ozon" | "vpn";

// Интеграции («плагины»): карточка с группой, заголовком и статусом активности
const PLUGINS: { key: PluginKey; label: string; group: string; description: string }[] = [
  { key: "email", label: "Почта", group: "Коммуникации", description: "Приём писем через IMAP и создание задач" },
  { key: "telephony", label: "Телефония", group: "Коммуникации", description: "Звонки и SMS через Novofon" },
  { key: "sms", label: "SMS журнал", group: "Коммуникации", description: "Журнал входящих и исходящих SMS" },
  { key: "max", label: "MAX", group: "Мессенджеры", description: "Уведомления в мессенджер MAX" },
  { key: "telegram", label: "Telegram", group: "Мессенджеры", description: "Уведомления и задачи из Telegram" },
  { key: "vk", label: "ВК Группа", group: "Мессенджеры", description: "Комментарии и товары ВКонтакте" },
  { key: "yandex", label: "Яндекс", group: "Сервисы", description: "API-ключ Яндекс.Карт" },
  { key: "dgis", label: "2GIS", group: "Сервисы", description: "API-ключ 2GIS (карты)" },
  { key: "beget", label: "Beget", group: "Хостинг", description: "Хостинг-аккаунт: тариф, баланс, домены" },
  { key: "pskovline", label: "Псковлайн", group: "Провайдер", description: "Баланс лицевых счетов провайдера" },
  { key: "tochka", label: "Точка Банк", group: "Финансы", description: "Счета и балансы банка (OAuth)" },
  { key: "tochkaAcquiring", label: "Эквайринг от Точки", group: "Финансы", description: "Онлайн-оплата заказов на витрине банковской картой и через СБП" },
  { key: "onec", label: "1С УТ 8.3", group: "Учётные системы", description: "Двусторонняя синхронизация номенклатуры и контрагентов" },
  { key: "diadoc", label: "Контур.Диадок", group: "Учётные системы", description: "ЭДО: получение, отправка и подписание документов" },
  { key: "ozon", label: "OZON Seller", group: "Маркетплейсы", description: "Двусторонняя синхронизация каталога товаров с маркетплейсом OZON" },
  { key: "vpn", label: "Прокси через VPN", group: "Сервисы", description: "Локальный VPN-прокси для Telegram API (sing-box)" },
];

function PluginIcon({ pluginKey }: { pluginKey: PluginKey }) {
  const icons: Record<PluginKey, string> = {
    email: "M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z",
    telephony: "M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z",
    sms: "M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z",
    max: "M12.2 21.08c-1.8 0-2.64-0.26-4.09-1.31-0.92 1.18-3.83 2.11-3.96 0.53 0-1.19-0.26-2.19-0.56-3.29-0.35-1.35-0.76-2.85-0.76-5.03 0-5.2 4.27-9.11 9.32-9.11 5.06 0 9.02 4.1 9.02 9.16.17 4.98-4 9.03-8.97 9.05m0.07-13.72c-2.46-0.13-4.38 1.58-4.8 4.25-0.35 2.21 0.27 4.91 0.8 5.05 0.25 0.06 0.89-0.46 1.29-0.85a4.56 4.56 0 0 0 2.23 0.79c2.55 0.12 4.73-1.82 4.9-4.37 0.1-2.55-1.86-4.72-4.42-4.86Z",
    telegram: "M20.99 3.71C21.15 3.71 21.49 3.75 21.71 3.93A0.51 0.51 0 0 1 21.97 4.43C21.99 4.57 22.02 4.9 22 5.15C21.72 8.07 20.52 15.14 19.91 18.4C19.65 19.78 19.15 20.24 18.65 20.29C17.58 20.39 16.77 19.58 15.73 18.9C14.11 17.84 13.2 17.18 11.62 16.14C9.8 14.94 10.98 14.28 12.02 13.21C12.29 12.92 17 8.63 17.1 8.25C17.11 8.2 17.12 8.01 17.01 7.92C16.9 7.82 16.74 7.86 16.63 7.88C16.47 7.92 13.87 9.63 8.86 13.02C8.12 13.53 7.45 13.77 6.86 13.76C6.2 13.74 4.93 13.39 3.99 13.08C2.84 12.7 1.92 12.51 2 11.87C2.04 11.54 2.5 11.2 3.37 10.85C8.74 8.51 12.32 6.97 14.12 6.22C19.24 4.09 20.3 3.72 20.99 3.71Z",
    vk: "M 5.75 6.07 L 2.5 6.07 C 2.65 13.48 6.36 17.93 12.85 17.93 L 13.22 17.93 L 13.22 13.69 C 15.6 13.93 17.41 15.67 18.13 17.93 L 21.5 17.93 C 20.57 14.56 18.14 12.69 16.62 11.98 C 18.14 11.1 20.28 8.97 20.79 6.07 L 17.73 6.07 C 17.06 8.42 15.09 10.56 13.22 10.76 L 13.22 6.07 L 10.15 6.07 L 10.15 14.28 C 8.26 13.81 5.86 11.51 5.75 6.07 Z",
    yandex: "M8.67 2L2 8.67L2.83 16.48L7.83 21.48L15.65 21.48L21.48 15.65L21.48 7.83L16.48 2.83ZM9.08 6.48L15.33 6.17L15.23 17.42L13.15 17.31L13.15 7.83L9.92 9.08L12.83 13.56L10.23 17.42L7.73 17.31L9.81 13.98L7.73 11.06Z",
    dgis: "M20.25 7.14L20 7.14L20 10.25L19.71 10.29L19.71 11.11L19.43 11.14L19.14 12.25L18.86 12.29L18.86 12.54L18.57 12.57L18.57 12.82L18.29 12.86L15.11 16.29L14.86 16.29L14.86 17.11L15.39 17.11L15.43 17.39L19.39 17.39L19.43 17.11L20.25 17.11L20.25 16.86L20.54 16.82L20.54 16.29L20.82 16.25L20.82 15.71L21.11 15.68L21.11 14.86L21.39 14.82L21.39 14L21.96 13.96L21.96 10L21.39 9.96L21.11 8.29L20.82 8.25L20.82 7.71L20.57 7.71ZM8 2.29L5.71 3.71L2 8.29L2 15.68L3.43 17.96L8 21.68L15.39 21.68L17.68 19.43L11.14 19.14L11.11 17.71L16.82 12.25L17.68 8L16.54 6.86L14.57 6.86L13.11 10.29L11.39 10.25L11.39 8L13.43 5.39L17.39 5.11L18.86 5.96L19.11 5.43L15.39 2.29Z",
    beget: "M 8.47 11.38 C 8.72 10.37 8.93 9.42 9.19 8.49 C 9.22 8.36 9.42 8.24 9.57 8.18 C 11.79 7.33 14.28 8.05 15.86 10 C 18.44 13.17 17.48 18.19 13.94 19.99 C 10.97 21.51 7.39 20.06 6.11 16.75 C 5.82 16.02 5.63 15.19 5.62 14.4 C 5.58 10.52 5.6 6.64 5.6 2.76 C 5.6 2.68 5.61 2.6 5.61 2.5 C 6.28 2.5 6.92 2.5 7.62 2.5 C 7.62 2.66 7.62 2.82 7.62 2.98 C 7.62 6.71 7.62 10.44 7.62 14.17 C 7.62 15.32 7.96 16.36 8.72 17.23 C 10.26 18.99 12.72 18.97 14.24 17.19 C 15.76 15.42 15.63 12.57 13.97 10.95 C 12.53 9.54 10.39 9.54 8.95 10.95 C 8.81 11.08 8.67 11.2 8.47 11.38 Z",
    pskovline: "M12 2a10 10 0 100 20 10 10 0 000-20zM2 12h20M12 2a15 15 0 010 20M12 2a15 15 0 000 20",
    tochka: "M3 21h18M3 10h18M5 6l7-3 7 3M4 10v11M20 10v11M8 14v3M12 14v3M16 14v3",
    tochkaAcquiring: "M3 10h18M7 15h4m-8 4h18a2 2 0 002-2V7a2 2 0 00-2-2H3a2 2 0 00-2 2v10a2 2 0 002 2z",
    onec: "M9.42 11.55L9.42 12.43L9.64 12.45L9.87 13.55L10.07 13.55L10.76 14.45L11.42 14.45L11.44 14.67L21.98 14.67L21.98 13.57L11.66 13.57L11.64 13.35L11.21 13.35L11.19 13.12L10.74 12.88L10.74 11.33L10.97 11.3L11.44 10.63L12.54 10.4L12.56 10.63L13.46 10.88L13.46 11.3L13.69 11.33L13.91 11.98L15.01 11.98L14.56 10.43L14.36 10.43L13.89 9.75L13.46 9.75L13.44 9.53L12.56 9.53L12.54 9.3L12.11 9.3L12.09 9.53L10.99 9.53L10.74 9.98L10.31 9.98L10.09 10.63L9.64 10.88L9.64 11.53ZM2 9.3L2 10.4L3.35 10.43L3.35 16.7L4.67 16.7L4.67 9.3ZM7.39 11.1L7.62 13.78L8.07 14.67L10.31 16.47L21.98 16.7L21.98 15.6L11.44 15.6L9.62 14.67L9.62 14.25L8.72 13.33L8.49 11.78L9.17 9.98L10.99 8.61L13.44 8.61L14.34 9.06L15.26 9.98L15.93 11.98L17.03 11.98L16.58 9.75L15.46 8.4L15.03 8.4L14.34 7.73L12.76 7.28L10.09 7.73L8.52 8.85ZM3.57 7.28L3.57 7.48L3.35 7.51L3.35 8.38L3.55 8.38L3.57 8.61L5.37 8.63L5.37 16.7L6.47 16.7L6.47 7.28Z",
    diadoc: "M18 6v12a6 6 0 0 1-6 6H6a6 6 0 0 1-6-6V6a6 6 0 0 1 6-6h6a6 6 0 0 1 6 6zM7.59 5.32C7.83 4.53 8.56 4 9.38 4H17.13C18.16 4 19 4.84 19 5.88V18.13C19 19.16 18.16 20 17.13 20H5.55C4.29 20 3.38 18.77 3.76 17.57L7.59 5.32ZM11 7.5H15.13C15.33 7.5 15.5 7.67 15.5 7.88V15M8.59 17.38L8.08 15.74a.26.26 0 0 1 .25-.24H16.74a.26.26 0 0 1 .25.24l-.51 1.63M9 12.5H13M9.5 10.5H13",
    ozon: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10zM12 8v6M9 11h6",
    vpn: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",
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
      return (
        <>
          <EmailSettings />
          <EmailFilters />
          <AccountingSettings />
        </>
      );
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
    case "pskovline":
      return <PskovlineSettings />;
    case "tochka":
      return <TochkaSettings />;
    case "tochkaAcquiring":
      return <TochkaAcquiringSettings />;
    case "onec":
      return <OneCSettings />;
    case "diadoc":
      return <DiadocSettings />;
    case "ozon":
      return <OzonSellerSettings />;
    case "vpn":
      return <VpnSettings />;
    default:
      return null;
  }
}

export function Settings() {
  // По умолчанию открываем «Системные» настройки
  const [activeTab, setActiveTab] = useState<MainTab>("system");
  const [selectedPlugin, setSelectedPlugin] = useState<PluginKey | null>(null);
  const [pluginStatus, setPluginStatus] = useState<Record<PluginKey, boolean>>({
    email: false,
    telephony: false,
    max: false,
    telegram: false,
    vk: false,
    sms: false,
    yandex: false,
    dgis: false,
    beget: false,
    pskovline: false,
    tochka: false,
    tochkaAcquiring: false,
    onec: false,
    diadoc: false,
    ozon: false,
    vpn: false,
  });

  // Возврат из OAuth банка: сразу открываем интеграции
  useEffect(() => {
    if (window.location.search.includes("tochka=connected")) {
      setActiveTab("integrations");
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  useEffect(() => {
    if (activeTab !== "integrations") return;
    const token = localStorage.getItem("token");
    fetch("/api/integrations/status", {
      headers: token ? { 'X-Auth-Token': token as string } : undefined,
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
      headers: token ? { 'X-Auth-Token': token as string } : undefined,
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
      <h2 style={{ fontSize: 18, marginBottom: 16 }}>Настройки</h2>
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
