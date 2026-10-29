import { useEffect, useState } from "react";

// Настройки плагина «Камеры Tapo» (TP-Link). Используются и на странице
// интеграций (Settings.tsx), и на странице камер (TapoCameras.tsx).
// Достаточно логина/пароля облачного аккаунта TP-Link ID: список камер
// берётся из облака, видео идёт по RTSP напрямую из LAN сервера (камеры
// должны быть в одной локальной сети с сервером wecrm).

export type TapoSettingsData = {
  login: string;
  password: string;
  isActive: boolean;
};

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

export function TapoSettings({ onSaved }: { onSaved?: (s: TapoSettingsData) => void }) {
  const [settings, setSettings] = useState<TapoSettingsData>({ login: "", password: "", isActive: false });
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);
  const [testing, setTesting] = useState(false);
  const [testMsg, setTestMsg] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    apiFetch("/api/tapo-plugin/settings")
      .then((s: any) => setSettings({ login: s.login || "", password: s.password || "", isActive: !!s.isActive }))
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  const save = async () => {
    setSaving(true);
    setSaveMsg(null);
    setTestMsg(null);
    try {
      const s: any = await apiFetch("/api/tapo-plugin/settings", { method: "PUT", body: JSON.stringify(settings) });
      const next: TapoSettingsData = { login: s.login || "", password: s.password || "", isActive: !!s.isActive };
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
      const r: any = await apiFetch("/api/tapo-plugin/test", {
        method: "POST",
        body: JSON.stringify({ login: settings.login, password: settings.password }),
      });
      setTestMsg({ ok: true, text: `Подключено. Камер в аккаунте: ${Array.isArray(r.cameras) ? r.cameras.length : 0}` });
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
          Логин TP-Link ID (email)
          <input
            style={{ ...inputStyle, marginTop: 4 }}
            value={settings.login}
            onChange={(e) => setSettings({ ...settings, login: e.target.value.trim() })}
            placeholder="email аккаунта TP-Link"
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
            placeholder="пароль аккаунта TP-Link"
            autoComplete="new-password"
          />
        </label>
      </div>
      <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, marginBottom: 12, cursor: "pointer" }}>
        <input type="checkbox" checked={settings.isActive} onChange={(e) => setSettings({ ...settings, isActive: e.target.checked })} />
        Плагин включён (страница «Камеры Tapo» видна администраторам)
      </label>
      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
        <button onClick={save} disabled={saving} style={btnPrimaryStyle}>{saving ? "Сохранение…" : "Сохранить"}</button>
        <button onClick={test} disabled={testing || !settings.login || !settings.password} style={btnStyle}>{testing ? "Проверка…" : "Проверить подключение"}</button>
        {saveMsg && <span style={{ fontSize: 13, color: "var(--text-muted)" }}>{saveMsg}</span>}
        {testMsg && <span style={{ fontSize: 13, color: testMsg.ok ? "#2e9e5b" : "#d9534f" }}>{testMsg.text}</span>}
      </div>
    </div>
  );
}
