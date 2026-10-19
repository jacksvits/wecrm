import { useEffect, useState } from "react";
import { api } from "../api/client";

interface VkAuthSettingsData {
  id?: string;
  isActive: boolean;
  appId: number | null;
  clientSecret: string;
  redirectUri: string;
  hasSecret?: boolean;
}

export function VkAuthSettings() {
  const [form, setForm] = useState<VkAuthSettingsData>({
    isActive: true,
    appId: null,
    clientSecret: "",
    redirectUri: "",
  });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    api.vkAuthSettings.get().then((s: any) => {
      if (s) {
        setForm({
          isActive: s.isActive ?? false,
          appId: s.appId ?? null,
          clientSecret: "",
          redirectUri: s.redirectUri || "",
        });
      }
    }).catch(() => {});
  }, []);

  const save = async () => {
    setLoading(true);
    try {
      const payload: any = { ...form };
      if (!payload.clientSecret) delete payload.clientSecret;
      await api.vkAuthSettings.save(payload);
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
        Активировать вход через VK ID
      </label>
      <label style={labelStyle}>App ID приложения VK ID</label>
      <input
        style={inputStyle}
        type="number"
        value={form.appId ?? ""}
        onChange={(e) => setForm({ ...form, appId: e.target.value ? Number(e.target.value) : null })}
        placeholder="Например: 54736647 (пусто — взять из настроек сервера)"
      />
      <label style={labelStyle}>Client Secret (Secure key) приложения VK ID</label>
      <input
        style={inputStyle}
        type="password"
        value={form.clientSecret}
        onChange={(e) => setForm({ ...form, clientSecret: e.target.value })}
        placeholder={form.hasSecret ? "Сохранён — введите новый, чтобы заменить" : "Введите защищённый ключ приложения"}
      />
      <label style={labelStyle}>Redirect URI</label>
      <input
        style={inputStyle}
        type="text"
        value={form.redirectUri}
        onChange={(e) => setForm({ ...form, redirectUri: e.target.value })}
        placeholder="https://welans.cc/api/vk/callback"
      />
      <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 8 }}>
        Redirect URI должен быть внесён в белый список в настройках приложения VK ID (id.vk.ru). Пустые поля App ID / Secret / Redirect URI — использовать значения из переменных окружения сервера.
      </div>
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
