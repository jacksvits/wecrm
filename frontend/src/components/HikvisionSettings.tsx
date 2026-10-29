import { useEffect, useState } from "react";

// Настройки плагина «Камеры Hik-Connect». Используются и на странице
// интеграций (Settings.tsx), и на странице камер (HikvisionCameras.tsx).

export type HikvisionSettingsData = {
  login: string;
  password: string; // «••••••» = сохранён, не менять
  validateCode: string; // код верификации устройства (для зашифрованных потоков)
  apiBaseUrl: string;
  isActive: boolean;
};

export const HIKVISION_API_REGIONS = [
  { value: "https://api.hik-connect.com", label: "Международный (hik-connect.com)" },
  { value: "https://api.hik-connectru.com", label: "Россия (hik-connectru.com)" },
];

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "8px 12px",
  borderRadius: 8,
  border: "1px solid var(--border-color)",
  background: "var(--bg-input, var(--bg-card))",
  color: "var(--text-primary)",
  fontSize: 14,
  boxSizing: "border-box",
};

const btnStyle: React.CSSProperties = {
  padding: "7px 14px",
  borderRadius: 8,
  border: "1px solid var(--border-color)",
  background: "var(--bg-card)",
  color: "var(--text-primary)",
  fontSize: 13,
  cursor: "pointer",
};

const btnPrimaryStyle: React.CSSProperties = { ...btnStyle, background: "#007AFF", borderColor: "#007AFF", color: "#fff" };

async function apiFetch(path: string, options?: RequestInit) {
  const token = localStorage.getItem("token") || "";
  const res = await fetch(path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { "X-Auth-Token": token } : {}),
      ...options?.headers,
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const e: any = new Error(err.error || `HTTP ${res.status}`);
    e.status = res.status;
    throw e;
  }
  return res.json();
}

export function HikvisionSettings({ onSaved }: { onSaved?: (s: HikvisionSettingsData) => void }) {
  const [settings, setSettings] = useState<HikvisionSettingsData>({
    login: "",
    password: "",
    validateCode: "",
    apiBaseUrl: HIKVISION_API_REGIONS[0].value,
    isActive: false,
  });
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);
  const [testing, setTesting] = useState(false);
  const [testMsg, setTestMsg] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    apiFetch("/api/hikvision-plugin/settings")
      .then((s: any) =>
        setSettings({
          login: s.login || "",
          password: s.password || "",
          validateCode: s.validateCode || "",
          apiBaseUrl: s.apiBaseUrl || HIKVISION_API_REGIONS[0].value,
          isActive: !!s.isActive,
        })
      )
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  const save = async () => {
    setSaving(true);
    setSaveMsg(null);
    setTestMsg(null);
    try {
      const s: any = await apiFetch("/api/hikvision-plugin/settings", { method: "PUT", body: JSON.stringify(settings) });
      const next: HikvisionSettingsData = {
        login: s.login || "",
        password: s.password || "",
        validateCode: s.validateCode || "",
        apiBaseUrl: s.apiBaseUrl || HIKVISION_API_REGIONS[0].value,
        isActive: !!s.isActive,
      };
      setSettings(next);
      setSaveMsg("Сохранено");
      onSaved?.(next);
    } catch (e: any) {
      setSaveMsg(e.message || "Ошибка сохранения");
    } finally {
      setSaving(false);
    }
  };

  const test = async () => {
    setTesting(true);
    setTestMsg(null);
    try {
      const r: any = await apiFetch("/api/hikvision-plugin/test", { method: "POST", body: "{}" });
      setTestMsg({ ok: true, text: `Подключено. Камер в аккаунте: ${r.count}` });
    } catch (e: any) {
      setTestMsg({ ok: false, text: e.message || "Ошибка подключения" });
    } finally {
      setTesting(false);
    }
  };

  if (!loaded) return <div style={{ fontSize: 13, color: "var(--text-muted)" }}>Загрузка…</div>;

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12, marginBottom: 12 }}>
        <label style={{ fontSize: 13, color: "var(--text-muted)" }}>
          Логин аккаунта Hik-Connect
          <input
            style={{ ...inputStyle, marginTop: 4 }}
            value={settings.login}
            onChange={(e) => setSettings({ ...settings, login: e.target.value })}
            placeholder="email или телефон"
            autoComplete="off"
          />
        </label>
        <label style={{ fontSize: 13, color: "var(--text-muted)" }}>
          Пароль
          <input
            style={{ ...inputStyle, marginTop: 4 }}
            type="password"
            value={settings.password}
            onChange={(e) => setSettings({ ...settings, password: e.target.value })}
            placeholder={settings.password === "••••••" ? "сохранён (не менять)" : "пароль"}
            autoComplete="new-password"
          />
        </label>
        <label style={{ fontSize: 13, color: "var(--text-muted)" }}>
          Код верификации (если поток зашифрован)
          <input
            style={{ ...inputStyle, marginTop: 4 }}
            value={settings.validateCode}
            onChange={(e) => setSettings({ ...settings, validateCode: e.target.value.trim() })}
            placeholder="6 символов с наклейки устройства"
            autoComplete="off"
          />
        </label>
        <label style={{ fontSize: 13, color: "var(--text-muted)" }}>
          Регион облака
          <select style={{ ...inputStyle, marginTop: 4 }} value={settings.apiBaseUrl} onChange={(e) => setSettings({ ...settings, apiBaseUrl: e.target.value })}>
            {HIKVISION_API_REGIONS.map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
        </label>
      </div>
      <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, marginBottom: 12, cursor: "pointer" }}>
        <input type="checkbox" checked={settings.isActive} onChange={(e) => setSettings({ ...settings, isActive: e.target.checked })} />
        Плагин включён (вкладка «Hik-Connect» в разделе «Видеорегистратор» видна администраторам)
      </label>
      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
        <button onClick={save} disabled={saving} style={btnPrimaryStyle}>{saving ? "Сохранение…" : "Сохранить"}</button>
        <button onClick={test} disabled={testing || !settings.login} style={btnStyle}>{testing ? "Проверка…" : "Проверить подключение"}</button>
        {saveMsg && <span style={{ fontSize: 13, color: "var(--text-muted)" }}>{saveMsg}</span>}
        {testMsg && <span style={{ fontSize: 13, color: testMsg.ok ? "#2e9e5b" : "#d9534f" }}>{testMsg.text}</span>}
      </div>
    </div>
  );
}
