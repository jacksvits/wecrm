import { useEffect, useState } from "react";
import { api } from "../api/client";

interface VkMarketSettingsData {
  id?: string;
  isActive: boolean;
  groupId: string;
  marketToken: string;
  marketAppId: number | null;
  marketAppSecret: string;
  hasMarketToken?: boolean;
  hasMarketApp?: boolean;
}

export function VkMarketSettings() {
  const [form, setForm] = useState<VkMarketSettingsData>({
    isActive: true,
    groupId: "",
    marketToken: "",
    marketAppId: null,
    marketAppSecret: "",
  });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    api.vkMarketSettings.get().then((s: any) => {
      if (s) {
        setForm({
          isActive: s.isActive ?? false,
          groupId: s.groupId?.toString() || "",
          marketToken: "",
          marketAppId: s.marketAppId ?? null,
          marketAppSecret: "",
          hasMarketToken: s.hasMarketToken,
          hasMarketApp: s.hasMarketApp,
        });
      }
    }).catch(() => {});
  }, []);

  const save = async () => {
    setLoading(true);
    try {
      const payload: any = { ...form, groupId: Number(form.groupId) || 0 };
      if (!payload.marketToken) delete payload.marketToken;
      if (!payload.marketAppSecret) delete payload.marketAppSecret;
      await api.vkMarketSettings.save(payload);
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
        Активировать синхронизацию с ВК Маркетом
      </label>
      <label style={labelStyle}>ID группы ВК (владелец маркета)</label>
      <input
        style={inputStyle}
        type="number"
        value={form.groupId}
        onChange={(e) => setForm({ ...form, groupId: e.target.value })}
        placeholder="Например: 123456789"
      />
      <label style={labelStyle}>Токен маркета (пользовательский, scope=market)</label>
      <input
        style={inputStyle}
        type="password"
        value={form.marketToken}
        onChange={(e) => setForm({ ...form, marketToken: e.target.value })}
        placeholder={form.hasMarketToken ? "Сохранён — введите новый, чтобы заменить" : "Для импорта/синхронизации товаров"}
      />
      <label style={labelStyle}>Приложение маркета: App ID</label>
      <input
        style={inputStyle}
        type="number"
        value={form.marketAppId ?? ""}
        onChange={(e) => setForm({ ...form, marketAppId: e.target.value ? Number(e.target.value) : null })}
        placeholder="ID standalone-приложения ВК"
      />
      <label style={labelStyle}>Приложение маркета: Secure key</label>
      <input
        style={inputStyle}
        type="password"
        value={form.marketAppSecret}
        onChange={(e) => setForm({ ...form, marketAppSecret: e.target.value })}
        placeholder={form.hasMarketApp ? "Сохранён — введите новый, чтобы заменить" : "Защищённый ключ приложения"}
      />
      <button
        type="button"
        onClick={() => window.open("/api/vk/market-auth", "_blank")}
        style={{ ...inputStyle, cursor: "pointer", background: "var(--bg-hover)", fontWeight: 500 }}
      >
        🔑 Получить токен маркета (авторизация ВК)
      </button>
      <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
        Перед использованием добавьте в настройках приложения ВК доверенный redirect URI: https://welans.cc/api/vk/market-callback
      </div>
      <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: -6 }}>
        Нужен для «Товары → Импорт из ВК / Синхронизация ВК». Флоу VK ID: токен автоматически обновляется по refresh_token
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
