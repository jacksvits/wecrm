import { useEffect, useState } from "react";
import { api } from "../api/client";
import { User } from "../types";

interface VkCommunitySettingsData {
  id?: string;
  isActive: boolean;
  groupId: string;
  accessToken: string;
  defaultCreatorId: string | null;
  assigneeIds: string[];
  autoCreateContact: boolean;
  autoReply: boolean;
  callbackSecret: string;
  confirmationString: string;
  hasToken?: boolean;
}

export function VkCommunitySettings() {
  const [form, setForm] = useState<VkCommunitySettingsData>({
    isActive: true,
    groupId: "",
    accessToken: "",
    defaultCreatorId: null,
    assigneeIds: [],
    autoCreateContact: true,
    autoReply: false,
    callbackSecret: "",
    confirmationString: "",
  });
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    api.vkCommunitySettings.get().then((s: any) => {
      if (s) {
        setForm({
          isActive: s.isActive ?? false,
          groupId: s.groupId?.toString() || "",
          accessToken: "",
          defaultCreatorId: s.defaultCreatorId || null,
          assigneeIds: s.assigneeIds || [],
          autoCreateContact: s.autoCreateContact ?? true,
          autoReply: s.autoReply ?? false,
          callbackSecret: s.callbackSecret || "",
          confirmationString: s.confirmationString || "",
          hasToken: s.hasToken,
        });
      }
    }).catch(() => {});
    api.users.list().then(setUsers).catch(() => {});
  }, []);

  const save = async () => {
    setLoading(true);
    try {
      const payload: any = { ...form, groupId: Number(form.groupId) || 0 };
      await api.vkCommunitySettings.save(payload);
      setMsg("Сохранено");
      setTimeout(() => setMsg(""), 3000);
    } catch (e: any) {
      setMsg("Ошибка: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  const inputStyle: React.CSSProperties = { width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #ddd", fontSize: 14, marginTop: 4 };
  const labelStyle: React.CSSProperties = { fontSize: 13, fontWeight: 500, color: "var(--text-secondary)", marginTop: 12, display: "block" };
  const webhookUrl = `${window.location.origin}/api/vk/webhook`;

  return (
    <div style={{ maxWidth: 600 }}>
      {msg && (
        <div style={{ padding: 12, borderRadius: 8, background: msg.includes("Ошибка") ? "#fee2e2" : "#dcfce7", marginBottom: 16, fontSize: 14 }}>
          {msg}
        </div>
      )}
      <label style={labelStyle}>
        <input
          type="checkbox"
          checked={form.isActive}
          onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
          style={{ marginRight: 8 }}
        />
        Активировать интеграцию с сообществом
      </label>
      <label style={labelStyle}>ID группы ВК</label>
      <input
        style={inputStyle}
        type="number"
        value={form.groupId}
        onChange={(e) => setForm({ ...form, groupId: e.target.value })}
        placeholder="Например: 123456789"
      />
      <label style={labelStyle}>Токен сообщества (access_token)</label>
      <input
        style={inputStyle}
        type="password"
        value={form.accessToken}
        onChange={(e) => setForm({ ...form, accessToken: e.target.value })}
        placeholder={form.hasToken ? "Сохранён — введите новый, чтобы заменить" : "Введите токен"}
      />
      <label style={labelStyle}>Callback Secret (для VK Callback API)</label>
      <input
        style={inputStyle}
        type="text"
        value={form.callbackSecret}
        onChange={(e) => setForm({ ...form, callbackSecret: e.target.value })}
        placeholder="Секретный ключ из настроек Callback API ВК"
      />
      <label style={labelStyle}>Confirmation String (для VK Callback API)</label>
      <input
        style={inputStyle}
        type="text"
        value={form.confirmationString}
        onChange={(e) => setForm({ ...form, confirmationString: e.target.value })}
        placeholder="Строка подтверждения из настроек Callback API ВК"
      />
      <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 8 }}>
        URL для Callback API в настройках группы ВК: <code>{webhookUrl}</code>
      </div>
      <label style={labelStyle}>Пользователь-автор задач по умолчанию</label>
      <select
        style={inputStyle}
        value={form.defaultCreatorId || ""}
        onChange={(e) => setForm({ ...form, defaultCreatorId: e.target.value || null })}
      >
        <option value="">—</option>
        {users.map((u) => (
          <option key={u.id} value={u.id}>{u.name}</option>
        ))}
      </select>
      <label style={labelStyle}>Исполнители</label>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
        {users.map((u) => (
          <label key={u.id} style={{ fontSize: 13, display: "flex", alignItems: "center", gap: 4, cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={form.assigneeIds.includes(u.id)}
              onChange={(e) => {
                const ids = new Set(form.assigneeIds);
                if (e.target.checked) ids.add(u.id);
                else ids.delete(u.id);
                setForm({ ...form, assigneeIds: Array.from(ids) });
              }}
            />
            {u.name}
          </label>
        ))}
      </div>
      <label style={labelStyle}>
        <input
          type="checkbox"
          checked={form.autoCreateContact}
          onChange={(e) => setForm({ ...form, autoCreateContact: e.target.checked })}
          style={{ marginRight: 8 }}
        />
        Автоматически создавать контакт
      </label>
      <label style={labelStyle}>
        <input
          type="checkbox"
          checked={form.autoReply}
          onChange={(e) => setForm({ ...form, autoReply: e.target.checked })}
          style={{ marginRight: 8 }}
        />
        Автоматические ответы
      </label>
      <button
        onClick={save}
        disabled={loading}
        style={{ marginTop: 20, padding: "10px 20px", borderRadius: 8, border: "none", background: "var(--text-primary)", color: "#fff", cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1 }}
      >
        {loading ? "Сохранение..." : "Сохранить"}
      </button>
    </div>
  );
}
