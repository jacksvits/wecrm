import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { Contact, ContactAccess, ContactAccessDirection, ClientDevice, Deal, Status } from "../types";
import { Avatar } from "./Avatar";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";

// Контакт с подгруженными связями (эндпоинт GET /api/contacts/:id)
export type DiscussionContact = Contact & {
  deals?: Deal[];
  tasks?: {
    id: string;
    title: string;
    status: string;
    ticketNumber?: number | null;
    dueDate?: string | null;
    createdAt: string;
  }[];
};

type SectionKey = "tasks" | "devices" | "accesses" | "orders" | "reserves";

// Метки направлений доступов, как в ContactAccesses
const ACCESS_DIRECTIONS: { value: ContactAccessDirection; label: string }[] = [
  { value: "videoregistrator", label: "Видеорегистратор" },
  { value: "cloud", label: "Облачное хранилище" },
  { value: "remote", label: "Удалённое управление" },
  { value: "site_admin", label: "Админка сайта" },
  { value: "server", label: "Сервер" },
  { value: "account", label: "Учётная запись" },
  { value: "router", label: "Роутер" },
];

function accessDirectionLabel(value: string) {
  return ACCESS_DIRECTIONS.find((d) => d.value === value)?.label || value;
}

// Статусы резервов (совпадают с бэкендом)
const RESERVE_STATUSES: Record<string, { label: string; color: string; bg: string }> = {
  held: { label: "Отложено", color: "#b45309", bg: "#fef3c7" },
  issued: { label: "Выдано", color: "#15803d", bg: "#dcfce7" },
  paid: { label: "Оплачен", color: "#1d4ed8", bg: "#dbeafe" },
  completed: { label: "Завершён", color: "#6b21a8", bg: "#f3e8ff" },
  canceled: { label: "Отменено", color: "#b91c1c", bg: "#fee2e2" },
};

const quillModules = {
  toolbar: [
    ["bold", "italic", "underline", "strike"],
    [{ list: "ordered" }, { list: "bullet" }],
    ["link"],
    ["clean"],
  ],
};

const quillFormats = ["bold", "italic", "underline", "strike", "list", "bullet", "link"];

type EditableField = "phones" | "emails" | "address" | "notes" | null;

const SECTION_TITLES: Record<SectionKey, string> = {
  tasks: "Задачи",
  devices: "Устройства",
  accesses: "Доступы",
  orders: "Заказы",
  reserves: "Резервы",
};

function formatDate(value?: string | null) {
  if (!value) return "";
  const d = new Date(value);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// Форматирование суммы, как в остальном проекте
function formatMoney(value?: number | string | null, currency?: string) {
  if (value === undefined || value === null || value === "") return "";
  const num = Number(value);
  if (isNaN(num)) return String(value);
  const amount = num.toLocaleString("ru-RU", { maximumFractionDigits: 2 });
  return currency ? `${amount} ${currency}` : `${amount} ₽`;
}

const infoRowStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 2,
};

const infoLabelStyle: React.CSSProperties = {
  fontSize: 12,
  color: "var(--text-muted)",
};

const infoValueStyle: React.CSSProperties = {
  fontSize: 14,
  color: "var(--text-primary)",
  wordBreak: "break-word",
};

const activityRowStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  padding: "8px 10px",
  borderRadius: 10,
  background: "var(--bg-input)",
  cursor: "pointer",
  minWidth: 0,
};

const activityTextStyle: React.CSSProperties = {
  fontSize: 13,
  color: "var(--text-primary)",
  flex: 1,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

const activityMetaStyle: React.CSSProperties = {
  fontSize: 12,
  color: "var(--text-muted)",
  flexShrink: 0,
};

const editInputStyle: React.CSSProperties = {
  padding: "8px 12px",
  borderRadius: 10,
  border: "1px solid var(--border-color)",
  background: "var(--bg-input)",
  color: "var(--text-primary)",
  fontSize: 14,
  fontFamily: "inherit",
  outline: "none",
  width: "100%",
  boxSizing: "border-box",
};

const actionButtonStyle: React.CSSProperties = {
  padding: "6px 12px",
  borderRadius: 10,
  border: "1px solid var(--border-color)",
  background: "var(--bg-input)",
  color: "var(--text-primary)",
  fontSize: 13,
  cursor: "pointer",
};

const primaryButtonStyle: React.CSSProperties = {
  padding: "6px 12px",
  borderRadius: 10,
  border: "none",
  background: "var(--text-primary)",
  color: "var(--bg-card)",
  fontSize: 13,
  cursor: "pointer",
};

// Кнопка-иконка «изменить» (карандаш), как табы в TaskDetail
function EditButton({ onClick, title }: { onClick: () => void; title: string }) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        background: "none",
        border: "none",
        cursor: "pointer",
        padding: 2,
        lineHeight: 1,
        color: "var(--text-muted)",
        display: "inline-flex",
        alignItems: "center",
        flexShrink: 0,
      }}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
      </svg>
    </button>
  );
}

export function TaskDiscussionContact({
  contact,
  onUpdate,
  maxHeight,
}: {
  contact: DiscussionContact | null;
  onUpdate?: (updated: DiscussionContact) => void;
  // Ограничение высоты карточки (используется на мобильных)
  maxHeight?: string;
}) {
  const navigate = useNavigate();
  const { user } = useAuth();
  // Права на вкладку «Доступы» (настраиваются в роли: чтение/редактирование/удаление),
  // так же, как в ContactDetail и на бэкенде (routes/contact-accesses)
  const canReadAccesses = user?.role === "admin" || user?.canReadContactAccesses !== false;
  const canEditAccesses = user?.role === "admin" || user?.canEditContactAccesses === true;
  const [editingField, setEditingField] = useState<EditableField>(null);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState("");
  const [activeSection, setActiveSection] = useState<SectionKey>("tasks");
  // Данные вкладок подгружаются лениво (при первом открытии вкладки)
  const [devices, setDevices] = useState<ClientDevice[] | null>(null);
  const [accesses, setAccesses] = useState<ContactAccess[] | null>(null);
  const [statuses, setStatuses] = useState<Status[]>([]);
  const [orders, setOrders] = useState<any[] | null>(null);
  const [reserves, setReserves] = useState<any[] | null>(null);
  const [expandedReserveId, setExpandedReserveId] = useState<string | null>(null);
  // Форма добавления доступа (вкладка «Доступы»)
  const [addingAccess, setAddingAccess] = useState(false);
  const [accessDirection, setAccessDirection] = useState<ContactAccessDirection>("videoregistrator");
  const [accessDescription, setAccessDescription] = useState("");
  const [accessComment, setAccessComment] = useState("");
  const [accessUrl, setAccessUrl] = useState("");
  const [accessLogin, setAccessLogin] = useState("");
  const [accessPassword, setAccessPassword] = useState("");
  const [accessSaving, setAccessSaving] = useState(false);
  const [accessError, setAccessError] = useState("");

  // Смена контакта — сброс вкладок и кэша
  useEffect(() => {
    setActiveSection("tasks");
    setDevices(null);
    setAccesses(null);
    setOrders(null);
    setReserves(null);
    setEditingField(null);
    setEditError("");
    resetAccessForm();
    setAccessSaving(false);
  }, [contact?.id]);

  // Статусы задач — для подписи/цвета чипа в списке (как в TaskDetail)
  useEffect(() => {
    api.statuses
      .list("task")
      .then(setStatuses)
      .catch(() => {});
  }, []);

  const loadDevices = async () => {
    if (devices !== null || !contact) return;
    try {
      const list = await api.clientDevices.list(contact.id);
      setDevices(list);
    } catch {
      setDevices([]);
    }
  };

  const loadAccesses = async () => {
    if (accesses !== null || !contact) return;
    try {
      const list = await api.contactAccesses.list(contact.id);
      setAccesses(list);
    } catch {
      setAccesses([]);
    }
  };

  // Принудительная перезагрузка списка доступов (после добавления)
  const reloadAccesses = async () => {
    if (!contact) return;
    try {
      const list = await api.contactAccesses.list(contact.id);
      setAccesses(list);
    } catch {
      // Оставляем текущий список при ошибке
    }
  };

  const resetAccessForm = () => {
    setAddingAccess(false);
    setAccessDirection("videoregistrator");
    setAccessDescription("");
    setAccessComment("");
    setAccessUrl("");
    setAccessLogin("");
    setAccessPassword("");
    setAccessError("");
  };

  const saveAccess = async () => {
    if (!contact || accessSaving) return;
    setAccessSaving(true);
    setAccessError("");
    try {
      await api.contactAccesses.create({
        contactId: contact.id,
        direction: accessDirection,
        description: accessDescription.trim() || null,
        comment: accessComment.trim() || null,
        url: accessUrl.trim() || null,
        login: accessLogin.trim() || null,
        password: accessPassword || null,
      });
      resetAccessForm();
      await reloadAccesses();
    } catch (err: any) {
      setAccessError(err.message || "Ошибка сохранения");
    } finally {
      setAccessSaving(false);
    }
  };

  // Пользователь системы, соответствующий контакту: у резервов/заказов
  // может быть другой получатель (например, организация), но автор совпадает
  const isContactAuthor = (u: any) => {
    if (!u || !contact) return false;
    const contactEmails = [contact.email, ...(contact.emails || [])]
      .map((e) => (e || "").trim().toLowerCase())
      .filter(Boolean);
    const userEmail = typeof u.email === "string" ? u.email.trim().toLowerCase() : "";
    const sameName =
      typeof u.name === "string" &&
      u.name.trim().toLowerCase() === contact.name.trim().toLowerCase();
    return (userEmail && contactEmails.includes(userEmail)) || sameName;
  };

  const loadOrders = async () => {
    if (orders !== null || !contact) return;
    try {
      const list = await api.sales.list();
      setOrders(
        list.filter((s: any) => s.contactId === contact.id || isContactAuthor(s.user)),
      );
    } catch {
      setOrders([]);
    }
  };

  const loadReserves = async () => {
    if (reserves !== null || !contact) return;
    try {
      const list = await api.reservations.list();
      setReserves(
        list.filter((r: any) => r.contactId === contact.id || isContactAuthor(r.user)),
      );
    } catch {
      setReserves([]);
    }
  };

  const switchSection = (key: SectionKey) => {
    setActiveSection(key);
    if (key === "devices") loadDevices();
    if (key === "accesses") loadAccesses();
    if (key === "orders") loadOrders();
    if (key === "reserves") loadReserves();
  };

  if (!contact) {
    return (
      <div
        style={{
          padding: 24,
          borderRadius: 16,
          border: "1px solid var(--border-color)",
          background: "var(--bg-card)",
          boxShadow: "var(--shadow)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          height: "100%",
          minHeight: 300,
          boxSizing: "border-box",
          color: "var(--text-muted)",
          fontSize: 14,
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text-secondary)" }}>
          Контакт не привязан
        </div>
        <div>
          Привяжите контакт к задаче на вкладке «Задача», и здесь появится
          информация о нём.
        </div>
      </div>
    );
  }

  const phones = contact.phones?.length
    ? contact.phones
    : contact.phone
      ? [contact.phone]
      : [];
  const emails = contact.emails?.length
    ? contact.emails
    : contact.email
      ? [contact.email]
      : [];

  const startEdit = (field: Exclude<EditableField, null>) => {
    setEditError("");
    if (field === "phones") setDraft(phones.join(", "));
    else if (field === "emails") setDraft(emails.join(", "));
    else if (field === "address") setDraft(contact.address || "");
    else if (field === "notes") setDraft(contact.notes || "");
    setEditingField(field);
  };

  const cancelEdit = () => {
    setEditingField(null);
    setDraft("");
    setEditError("");
  };

  const saveField = async () => {
    if (!editingField || saving) return;
    setSaving(true);
    setEditError("");
    try {
      let payload: Record<string, unknown> = {};
      if (editingField === "phones") {
        payload = {
          phones: draft
            .split(",")
            .map((p) => p.trim())
            .filter(Boolean),
        };
      } else if (editingField === "emails") {
        payload = {
          emails: draft
            .split(",")
            .map((e) => e.trim())
            .filter(Boolean),
        };
      } else if (editingField === "address") {
        payload = { address: draft.trim() || null };
      } else if (editingField === "notes") {
        payload = { notes: draft };
      }
      const updated = (await api.contacts.update(contact.id, payload)) as DiscussionContact;
      // Сохраняем связанные данные (задачи/сделки), которых нет в ответе PATCH
      onUpdate?.({ ...contact, ...updated, tasks: contact.tasks, deals: contact.deals });
      setEditingField(null);
      setDraft("");
    } catch (err: any) {
      setEditError(err.message || "Ошибка сохранения");
    } finally {
      setSaving(false);
    }
  };

  // Редактируемое текстовое поле (телефон / email / адрес)
  const renderEditableField = (
    field: Exclude<EditableField, "notes" | null>,
    label: string,
    value: string,
  ) => (
    <div style={infoRowStyle}>
      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
        <span style={infoLabelStyle}>{label}</span>
        <EditButton onClick={() => startEdit(field)} title={`Изменить: ${label}`} />
      </div>
      {editingField === field ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <input
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") saveField();
              if (e.key === "Escape") cancelEdit();
            }}
            style={editInputStyle}
          />
          <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
            <button onClick={cancelEdit} disabled={saving} style={actionButtonStyle}>
              Отмена
            </button>
            <button onClick={saveField} disabled={saving} style={primaryButtonStyle}>
              {saving ? "Сохранение..." : "Сохранить"}
            </button>
          </div>
        </div>
      ) : (
        <span style={infoValueStyle}>{value || "—"}</span>
      )}
    </div>
  );

  // Полный список: контейнер вкладки сам скроллится (overflowY: auto),
  // счётчик вкладки при этом совпадает с показанными строками
  const tasks = contact.tasks || [];
  const isHtml = (text: string) => /<[a-z][\s\S]*>/i.test(text);

  // Счётчики для вкладок
  const sectionCounts: Record<SectionKey, string> = {
    tasks: String(contact._count?.tasks ?? tasks.length),
    devices:
      devices !== null
        ? String(devices.length)
        : (contact as any).devicesTotal !== undefined
          ? String((contact as any).devicesTotal)
          : contact._count?.devices !== undefined
            ? String(contact._count.devices)
            : "",
    accesses: accesses !== null ? String(accesses.length) : contact._count?.accesses !== undefined ? String(contact._count.accesses) : "",
    orders: orders !== null ? String(orders.length) : "",
    reserves: reserves !== null ? String(reserves.length) : "",
  };

  const sectionTabStyle = (active: boolean): React.CSSProperties => ({
    display: "inline-flex",
    alignItems: "center",
    gap: 4,
    padding: "5px 12px",
    borderRadius: 20,
    border: active ? "none" : "1px solid var(--border-color)",
    background: active ? "var(--text-primary)" : "var(--bg-input)",
    color: active ? "var(--bg-card)" : "var(--text-secondary)",
    fontSize: 13,
    cursor: "pointer",
    whiteSpace: "nowrap",
    flexShrink: 0,
  });

  return (
    <div
      style={{
        padding: 24,
        borderRadius: 16,
        border: "1px solid var(--border-color)",
        background: "var(--bg-card)",
        boxShadow: "var(--shadow)",
        display: "flex",
        flexDirection: "column",
        height: "100%",
        minHeight: 300,
        boxSizing: "border-box",
        overflow: "hidden",
        ...(maxHeight ? { maxHeight } : {}),
      }}
    >
      {/* Шапка карточки контакта */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          paddingBottom: 14,
          borderBottom: "1px solid var(--border-color)",
          flexShrink: 0,
        }}
      >
        <Avatar
          name={contact.name}
          avatar={contact.avatarUrl}
          size={40}
        />
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 2,
            minWidth: 0,
            flex: 1,
          }}
        >
          <span
            style={{
              fontSize: 16,
              fontWeight: 600,
              color: "var(--text-primary)",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {contact.name}
          </span>
          <span style={{ fontSize: 13, color: "var(--text-muted)" }}>
            {[contact.organization?.name, contact.position]
              .filter(Boolean)
              .join(" · ") ||
              contact.type ||
              (contact.kind === "organization" ? "Организация" : "Контакт")}
          </span>
        </div>
        <button
          onClick={() => navigate(`/contacts/${contact.id}`)}
          title="Открыть карточку контакта"
          style={actionButtonStyle}
        >
          Открыть
        </button>
      </div>

      {/* Поля контакта (телефон / email / адрес редактируемые) */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 10,
          padding: "12px 0",
          flexShrink: 0,
        }}
      >
        {renderEditableField("phones", "Телефон", phones.join(", "))}
        {renderEditableField("emails", "Email", emails.join(", "))}
        {renderEditableField("address", "Адрес", contact.address || "")}
        {contact.lastActivityTime && (
          <div style={infoRowStyle}>
            <span style={infoLabelStyle}>Последняя активность</span>
            <span style={infoValueStyle}>{formatDate(contact.lastActivityTime)}</span>
          </div>
        )}
        {contact.tags && contact.tags.length > 0 && (
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 6,
              alignItems: "center",
            }}
          >
            <span style={infoLabelStyle}>Теги</span>
            {contact.tags.map((tag) => (
              <span
                key={tag}
                style={{
                  fontSize: 12,
                  padding: "2px 10px",
                  borderRadius: 10,
                  background: "var(--bg-input)",
                  border: "1px solid var(--border-color)",
                  color: "var(--text-secondary)",
                }}
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Комментарий (WYSIWYG) */}
        <div style={infoRowStyle}>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <span style={infoLabelStyle}>Комментарий</span>
            {editingField !== "notes" && (
              <EditButton onClick={() => startEdit("notes")} title="Изменить: комментарий" />
            )}
          </div>
          {editingField === "notes" ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <div style={{ background: "var(--bg-input)", borderRadius: 10 }}>
                <ReactQuill
                  theme="snow"
                  value={draft}
                  onChange={setDraft}
                  modules={quillModules}
                  formats={quillFormats}
                />
              </div>
              <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                <button onClick={cancelEdit} disabled={saving} style={actionButtonStyle}>
                  Отмена
                </button>
                <button onClick={saveField} disabled={saving} style={primaryButtonStyle}>
                  {saving ? "Сохранение..." : "Сохранить"}
                </button>
              </div>
            </div>
          ) : contact.notes ? (
            isHtml(contact.notes) ? (
              <div
                className="rich-text"
                style={{ fontSize: 14, color: "var(--text-primary)", wordBreak: "break-word" }}
                dangerouslySetInnerHTML={{ __html: contact.notes }}
              />
            ) : (
              <span style={infoValueStyle}>{contact.notes}</span>
            )
          ) : (
            <span style={{ ...infoValueStyle, color: "var(--text-muted)" }}>—</span>
          )}
        </div>

        {editError && (
          <div style={{ fontSize: 12, color: "#dc2626" }}>{editError}</div>
        )}
      </div>

      {/* Вкладки активности контакта */}
      <div
        style={{
          display: "flex",
          gap: 6,
          overflowX: "auto",
          paddingBottom: 10,
          borderBottom: "1px solid var(--border-color)",
          flexShrink: 0,
        }}
        className="no-scrollbar"
      >
        {(Object.keys(SECTION_TITLES) as SectionKey[])
          .filter((key) => key !== "accesses" || canReadAccesses)
          .map((key) => (
          <button
            key={key}
            onClick={() => switchSection(key)}
            style={sectionTabStyle(activeSection === key)}
          >
            {SECTION_TITLES[key]}
            {sectionCounts[key] !== "" && (
              <span style={{ fontSize: 11, opacity: 0.8 }}>({sectionCounts[key]})</span>
            )}
          </button>
          ))}
      </div>

      {/* Содержимое активной вкладки */}
      <div
        className="no-scrollbar"
        style={{
          flex: 1,
          overflowY: "auto",
          paddingTop: 12,
          display: "flex",
          flexDirection: "column",
          gap: 6,
        }}
      >
        {activeSection === "tasks" &&
          (tasks.length === 0 ? (
            <div style={{ fontSize: 13, color: "var(--text-muted)" }}>Задач нет</div>
          ) : (
            tasks.map((t) => {
              const tStatus = statuses.find((s) => s.name === t.status);
              return (
                <div
                  key={t.id}
                  onClick={() => navigate(`/tasks/${t.id}`)}
                  style={activityRowStyle}
                  title={t.title}
                >
                  {t.ticketNumber != null && (
                    <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", flexShrink: 0 }}>
                      #{t.ticketNumber}
                    </span>
                  )}
                  <span style={activityTextStyle}>{t.title}</span>
                  <span
                    style={{
                      padding: "2px 6px",
                      borderRadius: 8,
                      fontSize: 10,
                      background: tStatus?.color || "#f0f0f0",
                      color: tStatus?.textColor || "#666",
                      flexShrink: 0,
                    }}
                  >
                    {tStatus?.label || t.status}
                  </span>
                  <span style={activityMetaStyle}>
                    {formatDate(t.dueDate) || formatDate(t.createdAt)}
                  </span>
                </div>
              );
            })
          ))}

        {activeSection === "devices" &&
          (devices === null ? (
            <div style={{ fontSize: 13, color: "var(--text-muted)" }}>Загрузка...</div>
          ) : devices.length === 0 ? (
            <div style={{ fontSize: 13, color: "var(--text-muted)" }}>Устройств нет</div>
          ) : (
            devices.map((d) => (
              <div
                key={d.id}
                onClick={() => navigate(`/contacts/${contact.id}`)}
                style={activityRowStyle}
                title={d.hostname}
              >
                <span
                  title={d.isOnline ? "Включено" : "Выключено"}
                  style={{
                    display: "inline-block",
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    background: d.isOnline ? "#2e7d32" : "#bdbdbd",
                    flexShrink: 0,
                  }}
                />
                <span
                  style={{
                    ...activityTextStyle,
                    display: "flex",
                    flexDirection: "column",
                    gap: 2,
                    whiteSpace: "normal",
                  }}
                >
                  <span style={{ fontWeight: 500 }}>
                    {d.hostname}
                    {d.username ? ` · ${d.username}` : ""}
                  </span>
                  <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
                    {[d.osCaption, d.ipAddress].filter(Boolean).join(" · ") || "—"}
                  </span>
                </span>
                <span style={{ ...activityMetaStyle, color: d.isOnline ? "#2e7d32" : undefined }}>
                  {d.isOnline
                    ? "Включено"
                    : d.lastSeenAt
                      ? `Выключено · было ${formatDate(d.lastSeenAt)}`
                      : "Выключено"}
                </span>
              </div>
            ))
          ))}

        {activeSection === "accesses" && canEditAccesses && !addingAccess && (
          <button
            onClick={() => {
              setAccessError("");
              setAddingAccess(true);
            }}
            style={{
              ...actionButtonStyle,
              alignSelf: "flex-start",
              color: "#1565c0",
              border: "1px dashed var(--border-color)",
              background: "transparent",
            }}
          >
            + Добавить
          </button>
        )}

        {activeSection === "accesses" && addingAccess && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 8,
              padding: 12,
              borderRadius: 10,
              border: "1px solid var(--border-color)",
              background: "var(--bg-input)",
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>
              Новый доступ
            </div>
            <select
              value={accessDirection}
              onChange={(e) => setAccessDirection(e.target.value as ContactAccessDirection)}
              style={{ ...editInputStyle, cursor: "pointer" }}
            >
              {ACCESS_DIRECTIONS.map((d) => (
                <option key={d.value} value={d.value}>
                  {d.label}
                </option>
              ))}
            </select>
            <div>
              <span style={infoLabelStyle}>Описание</span>
              <div style={{ background: "var(--bg-card)", borderRadius: 10 }}>
                <ReactQuill
                  theme="snow"
                  value={accessDescription}
                  onChange={setAccessDescription}
                  modules={quillModules}
                  formats={quillFormats}
                />
              </div>
            </div>
            <div>
              <span style={infoLabelStyle}>Комментарий</span>
              <div style={{ background: "var(--bg-card)", borderRadius: 10 }}>
                <ReactQuill
                  theme="snow"
                  value={accessComment}
                  onChange={setAccessComment}
                  modules={quillModules}
                  formats={quillFormats}
                />
              </div>
            </div>
            <input
              value={accessUrl}
              onChange={(e) => setAccessUrl(e.target.value)}
              placeholder="Ссылка (https://...)"
              style={editInputStyle}
            />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <input
                value={accessLogin}
                onChange={(e) => setAccessLogin(e.target.value)}
                placeholder="Логин"
                style={editInputStyle}
              />
              <input
                value={accessPassword}
                onChange={(e) => setAccessPassword(e.target.value)}
                placeholder="Пароль"
                style={editInputStyle}
              />
            </div>
            {accessError && (
              <div style={{ fontSize: 12, color: "#dc2626" }}>{accessError}</div>
            )}
            <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
              <button onClick={resetAccessForm} disabled={accessSaving} style={actionButtonStyle}>
                Отмена
              </button>
              <button onClick={saveAccess} disabled={accessSaving} style={primaryButtonStyle}>
                {accessSaving ? "Сохранение..." : "Сохранить"}
              </button>
            </div>
          </div>
        )}

        {activeSection === "accesses" &&
          (accesses === null ? (
            <div style={{ fontSize: 13, color: "var(--text-muted)" }}>Загрузка...</div>
          ) : accesses.length === 0 && !addingAccess ? (
            <div style={{ fontSize: 13, color: "var(--text-muted)" }}>Доступов нет</div>
          ) : accesses.length === 0 ? null : (
            accesses.map((a) => (
              <div
                key={a.id}
                onClick={() => navigate(`/contacts/${contact.id}`)}
                style={activityRowStyle}
                title={a.description || accessDirectionLabel(a.direction)}
              >
                <span
                  style={{
                    ...activityTextStyle,
                    display: "flex",
                    flexDirection: "column",
                    gap: 2,
                    whiteSpace: "normal",
                  }}
                >
                  <span style={{ fontWeight: 500 }}>
                    {accessDirectionLabel(a.direction)}
                    {a.description ? ` — ${a.description}` : ""}
                  </span>
                  {a.login && (
                    <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
                      {a.login}
                      {a.password ? " · " + a.password : ""}
                    </span>
                  )}
                </span>
                <span style={activityMetaStyle}>{formatDate(a.updatedAt)}</span>
              </div>
            ))
          ))}

        {activeSection === "orders" &&
          (orders === null ? (
            <div style={{ fontSize: 13, color: "var(--text-muted)" }}>Загрузка...</div>
          ) : orders.length === 0 ? (
            <div style={{ fontSize: 13, color: "var(--text-muted)" }}>Заказов нет</div>
          ) : (
            orders.map((s) => (
              <div
                key={s.id}
                style={{ ...activityRowStyle, cursor: "default" }}
                title={s.comment || `Заказ №${s.number}`}
              >
                <span style={activityTextStyle}>
                  Заказ №{s.number}
                  {s.warehouse?.name ? ` · ${s.warehouse.name}` : ""}
                </span>
                <span style={activityMetaStyle}>
                  {formatMoney(s.total)}
                  {s.createdAt ? ` · ${formatDate(s.createdAt)}` : ""}
                </span>
              </div>
            ))
          ))}

        {activeSection === "reserves" &&
          (reserves === null ? (
            <div style={{ fontSize: 13, color: "var(--text-muted)" }}>Загрузка...</div>
          ) : reserves.length === 0 ? (
            <div style={{ fontSize: 13, color: "var(--text-muted)" }}>Резервов нет</div>
          ) : (
            reserves.map((r) => {
              const status = RESERVE_STATUSES[r.status] || null;
              const expanded = expandedReserveId === r.id;
              return (
                <div
                  key={r.id}
                  style={{ display: "flex", flexDirection: "column", gap: 6 }}
                >
                  <div
                    onClick={() => setExpandedReserveId(expanded ? null : r.id)}
                    style={{ ...activityRowStyle, cursor: "pointer" }}
                    title={r.comment || `Резерв №${r.number}`}
                  >
                    <span
                      style={{
                        fontSize: 12,
                        color: "var(--text-muted)",
                        flexShrink: 0,
                        transition: "transform 0.15s",
                        transform: expanded ? "rotate(90deg)" : "none",
                        display: "inline-block",
                      }}
                    >
                      ▸
                    </span>
                    <span style={{ ...activityTextStyle, display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>
                        Резерв №{r.number}
                        {r.warehouse?.name ? ` · ${r.warehouse.name}` : ""}
                      </span>
                      {status && (
                        <span
                          style={{
                            fontSize: 11,
                            padding: "1px 8px",
                            borderRadius: 8,
                            background: status.bg,
                            color: status.color,
                            flexShrink: 0,
                          }}
                        >
                          {status.label}
                        </span>
                      )}
                    </span>
                    <span style={activityMetaStyle}>
                      {formatMoney(r.total)}
                      {r.createdAt ? ` · ${formatDate(r.createdAt)}` : ""}
                    </span>
                  </div>
                  {expanded && (
                    <div
                      style={{
                        marginLeft: 20,
                        display: "flex",
                        flexDirection: "column",
                        gap: 4,
                        paddingBottom: 4,
                      }}
                    >
                      {r.items && r.items.length > 0 ? (
                        r.items.map((it: any) => (
                          <div
                            key={it.id}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 8,
                              fontSize: 13,
                              color: "var(--text-primary)",
                              minWidth: 0,
                            }}
                          >
                            <span
                              style={{
                                flex: 1,
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                              title={it.product?.name}
                            >
                              {it.product?.name || "Товар"}
                            </span>
                            <span style={{ color: "var(--text-muted)", flexShrink: 0 }}>
                              {Number(it.quantity)} шт × {formatMoney(it.price)} ={" "}
                              {formatMoney(Number(it.quantity) * Number(it.price))}
                            </span>
                          </div>
                        ))
                      ) : (
                        <div style={{ fontSize: 13, color: "var(--text-muted)" }}>
                          Позиции не указаны
                        </div>
                      )}
                      {r.issuedAt && (
                        <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                          Выдан: {formatDate(r.issuedAt)}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          ))}
      </div>
    </div>
  );
}
