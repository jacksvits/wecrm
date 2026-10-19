import { useState } from "react";
import { useNavigate } from "react-router-dom";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { Contact, Deal } from "../types";
import { Avatar } from "./Avatar";
import { api } from "../api/client";

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
}: {
  contact: DiscussionContact | null;
  onUpdate?: (updated: DiscussionContact) => void;
}) {
  const navigate = useNavigate();
  const [editingField, setEditingField] = useState<EditableField>(null);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState("");

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

  const tasks = contact.tasks?.slice(0, 8) || [];
  const deals = contact.deals?.slice(0, 8) || [];
  const isHtml = (text: string) => /<[a-z][\s\S]*>/i.test(text);

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
        {contact.organization && (
          <div style={infoRowStyle}>
            <span style={infoLabelStyle}>Организация</span>
            <span style={infoValueStyle}>{contact.organization.name}</span>
          </div>
        )}
        {contact.position && (
          <div style={infoRowStyle}>
            <span style={infoLabelStyle}>Должность</span>
            <span style={infoValueStyle}>{contact.position}</span>
          </div>
        )}
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
          <div style={{ fontSize: 12, color: "var(--color-danger, #dc2626)" }}>{editError}</div>
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
