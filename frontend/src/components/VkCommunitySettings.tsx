import { useEffect, useState } from "react";
import { api } from "../api/client";
import { Project, User } from "../types";

interface VkCommunitySettingsData {
  id?: string;
  isActive: boolean;
  groupId: string;
  accessToken: string;
  defaultCreatorId: string | null;
  defaultProjectId: string | null;
  assigneeIds: string[];
  autoCreateContact: boolean;
  autoReply: boolean;
  callbackSecret: string;
  confirmationString: string;
  hasToken?: boolean;
  wallAccessToken: string;
  wallAppId: string;
  wallAppSecret: string;
  hasWallAppId?: boolean;
  hasWallAppSecret?: boolean;
  hasWallToken?: boolean;
}

export function VkCommunitySettings() {
  const [form, setForm] = useState<VkCommunitySettingsData>({
    isActive: true,
    groupId: "",
    accessToken: "",
    wallAccessToken: "",
    wallAppId: "",
    wallAppSecret: "",
    defaultCreatorId: null,
    defaultProjectId: null,
    assigneeIds: [],
    autoCreateContact: true,
    autoReply: false,
    callbackSecret: "",
    confirmationString: "",
  });
  const [users, setUsers] = useState<User[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [wallConnectMsg, setWallConnectMsg] = useState("");

  useEffect(() => {
    api.vkCommunitySettings.get().then((s: any) => {
      if (s) {
        setForm({
          isActive: s.isActive ?? false,
          groupId: s.groupId?.toString() || "",
          accessToken: "",
          wallAccessToken: "",
          hasWallToken: s.hasWallToken,
          wallAppId: "",
          wallAppSecret: "",
          hasWallAppId: s.hasWallAppId,
          hasWallAppSecret: s.hasWallAppSecret,
          defaultCreatorId: s.defaultCreatorId || null,
          defaultProjectId: s.defaultProjectId || null,
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
    api.projects.list().then(setProjects).catch(() => {});
  }, []);

  const connectWall = async () => {
    setWallConnectMsg("");
    try {
      const r = await fetch("/api/vk-community-settings/wall-auth-url");
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Ошибка");
      window.open(j.url, "_blank");
    } catch (e: any) { setWallConnectMsg(e.message); }
  };

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
      <label style={labelStyle}>Токен публикации на стене (пользовательский vk1.a)</label>
      <input
        style={inputStyle}
        type="password"
        value={form.wallAccessToken}
        onChange={(e) => setForm({ ...form, wallAccessToken: e.target.value })}
        placeholder={form.hasWallToken ? "Сохранён — введите новый, чтобы заменить" : "Вставьте access_token"}
      />
      <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 6, lineHeight: 1.5 }}>
        С этим токеном фото обложки прикрепляется к посту сразу (без ссылки и задержки). Как получить (один раз, без срока действия):
        1) создайте Standalone-приложение на vk.com/dev и скопируйте его ID;
        2) откройте: <code>https://oauth.vk.com/authorize?client_id=ВАШ_ID&amp;redirect_uri=https://oauth.vk.com/blank.html&amp;scope=wall,photos&amp;response_type=token&amp;v=5.199</code>;
        3) подтвердите доступ и скопируйте access_token из адресной строки. Если ВК пишет «application is disabled» — включите Standalone-платформу в разделе «Разработка» приложения.
      </div>
      <label style={labelStyle}>App ID Standalone-приложения</label>
      <input
        style={inputStyle}
        value={form.wallAppId}
        onChange={(e) => setForm({ ...form, wallAppId: e.target.value })}
        placeholder={form.hasWallAppId ? "Сохранён — введите новый, чтобы заменить" : "ID приложения vk.com/dev"}
      />
      <label style={labelStyle}>Secure key приложения</label>
      <input
        style={inputStyle}
        type="password"
        value={form.wallAppSecret}
        onChange={(e) => setForm({ ...form, wallAppSecret: e.target.value })}
        placeholder={form.hasWallAppSecret ? "Сохранён — введите новый, чтобы заменить" : "Защищённый ключ приложения"}
      />
      <button
        type="button"
        onClick={connectWall}
        disabled={loading}
        style={{...inputStyle, cursor: "pointer", background: "#0077FF", color: "#fff", border: "none", fontWeight: 500 }}
      >
        Подключить публикацию на стене (авторизация ВК)
      </button>
      {wallConnectMsg && <div style={{ fontSize: 12, color: "#dc2626", marginTop: 6 }}>{wallConnectMsg}</div>}
      <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 6, lineHeight: 1.5 }}>
        В настройках приложения ВК (Разработка) добавьте доверенный redirect URI: <code>https://welans.cc/api/vk-community-settings/wall-callback</code>.
        Затем сохраните настройки здесь и нажмите кнопку — подтвердите вход в ВК. Токен не привязан к IP (кодовый поток с Secure key) и хранится в CRM.
      </div>

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
      <label style={labelStyle}>Проект для новых задач</label>
      <select
        style={inputStyle}
        value={form.defaultProjectId || ""}
        onChange={(e) => setForm({ ...form, defaultProjectId: e.target.value || null })}
      >
        <option value="">—</option>
        {projects.map((p) => (
          <option key={p.id} value={p.id}>{p.name}</option>
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
