import { useNavigate } from "react-router-dom";
import { Contact, Deal } from "../types";
import { Avatar } from "./Avatar";

// Контакт с подгруженными связями (эндпоинт GET /api/contacts/:id)
export type DiscussionContact = Contact & {
  deals?: Deal[];
  tasks?: {
    id: string;
    title: string;
    status: string;
    dueDate?: string | null;
    createdAt: string;
  }[];
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

// Форматирование суммы сделки, как в остальном проекте
function formatMoney(value?: number, currency?: string) {
  if (value === undefined || value === null) return "";
  const amount = Number(value).toLocaleString("ru-RU", {
    maximumFractionDigits: 0,
  });
  return currency ? `${amount} ${currency}` : amount;
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

const sectionTitleStyle: React.CSSProperties = {
  fontSize: 14,
  fontWeight: 600,
  color: "var(--text-primary)",
  marginBottom: 8,
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

export function TaskDiscussionContact({
  contact,
}: {
  contact: DiscussionContact | null;
}) {
  const navigate = useNavigate();

  // Контакт не привязан к задаче — показываем пустое состояние
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
          height: "calc(100vh - 280px)",
          minHeight: 400,
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
  const infoFields: { label: string; value?: string | null }[] = [
    { label: "Телефон", value: phones.join(", ") || null },
    { label: "Email", value: emails.join(", ") || null },
    {
      label: "Организация",
      value: contact.organization?.name || null,
    },
    { label: "Должность", value: contact.position || null },
    { label: "Адрес", value: contact.address || null },
    {
      label: "Последняя активность",
      value: formatDate(contact.lastActivityTime) || null,
    },
  ].filter((f) => Boolean(f.value));

  const tasks = contact.tasks?.slice(0, 8) || [];
  const deals = contact.deals?.slice(0, 8) || [];

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
        height: "calc(100vh - 280px)",
        minHeight: 400,
        overflow: "hidden",
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
            {contact.type || (contact.kind === "organization" ? "Организация" : "Контакт")}
          </span>
        </div>
        <button
          onClick={() => navigate(`/contacts/${contact.id}`)}
          title="Открыть карточку контакта"
          style={{
            padding: "6px 12px",
            borderRadius: 10,
            border: "1px solid var(--border-color)",
            background: "var(--bg-input)",
            color: "var(--text-primary)",
            fontSize: 13,
            cursor: "pointer",
            flexShrink: 0,
          }}
        >
          Открыть
        </button>
      </div>

      {/* Поля контакта */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 10,
          padding: "12px 0",
          flexShrink: 0,
        }}
      >
        {infoFields.map((field) => (
          <div key={field.label} style={infoRowStyle}>
            <span style={infoLabelStyle}>{field.label}</span>
            <span style={infoValueStyle}>{field.value}</span>
          </div>
        ))}
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
      </div>

      {/* Активность: задачи и сделки контакта */}
      <div
        className="no-scrollbar"
        style={{
          flex: 1,
          overflowY: "auto",
          borderTop: "1px solid var(--border-color)",
          paddingTop: 12,
          display: "flex",
          flexDirection: "column",
          gap: 16,
        }}
      >
        <div>
          <div style={sectionTitleStyle}>
            Задачи ({contact._count?.tasks ?? tasks.length})
          </div>
          {tasks.length === 0 ? (
            <div style={{ fontSize: 13, color: "var(--text-muted)" }}>
              Задач нет
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {tasks.map((t) => (
                <div
                  key={t.id}
                  onClick={() => navigate(`/tasks/${t.id}`)}
                  style={activityRowStyle}
                  title={t.title}
                >
                  <span style={activityTextStyle}>{t.title}</span>
                  <span style={activityMetaStyle}>
                    {formatDate(t.dueDate) || formatDate(t.createdAt)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {deals.length > 0 && (
          <div>
            <div style={sectionTitleStyle}>
              Сделки ({contact._count?.deals ?? deals.length})
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {deals.map((d) => (
                <div
                  key={d.id}
                  onClick={() => navigate(`/deals?deal=${d.id}`)}
                  style={activityRowStyle}
                  title={d.title}
                >
                  <span style={activityTextStyle}>{d.title}</span>
                  <span style={activityMetaStyle}>
                    {formatMoney(d.value, d.currency)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
