import { useEffect, useState } from "react";
import { api } from "../api/client";

/**
 * Настройки плагина «Яндекс Метрика» (Настройки → Интеграции).
 * Нужны: номер счётчика (из Метрики) и OAuth-токен с правом metrika:read.
 */
export function YandexMetrikaSettings() {
  const [counterId, setCounterId] = useState("");
  const [token, setToken] = useState("");
  const [savedToken, setSavedToken] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const s = await api.yandexMetrika.getSettings();
      if (s) {
        setCounterId(s.counterId || "");
        setSavedToken(!!s.hasToken);
        setIsActive(!!s.isActive);
      }
    } catch (e) {
      console.error("Failed to load Yandex Metrika settings:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMsg("");
    try {
      const payload: { counterId?: string; token?: string; isActive: boolean } = { isActive };
      if (counterId.trim()) payload.counterId = counterId.trim();
      if (token.trim()) payload.token = token.trim();
      const res = await api.yandexMetrika.saveSettings(payload);
      setSavedToken(!!res?.hasToken);
      if (token.trim()) setToken("");
      setMsg("Настройки Яндекс Метрики сохранены");
      setTimeout(() => setMsg(""), 4000);
    } catch (err: any) {
      setMsg("Ошибка: " + (err?.message || err));
    } finally {
      setSaving(false);
    }
  };

  const testConnection = async () => {
    setSaving(true);
    setMsg("");
    try {
      await api.yandexMetrika.saveSettings({ counterId: counterId.trim(), isActive });
      if (token.trim()) await api.yandexMetrika.saveSettings({ token: token.trim(), isActive });
      const st = await api.yandexMetrika.getStatus();
      setMsg(`Подключение успешно: счётчик ${st?.counterId}, визитов сегодня — ${st?.visitsToday}`);
    } catch (err: any) {
      setMsg("Ошибка подключения: " + (err?.message || err));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div style={{ padding: 20, color: "var(--text-muted)" }}>Загрузка...</div>;

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 8,
    border: "1px solid var(--border-color)",
    background: "var(--bg-input)",
    color: "var(--text-primary)",
    fontSize: 14,
    outline: "none",
  };

  return (
    <div style={{ maxWidth: 640 }}>
      {msg && (
        <div
          style={{
            padding: 12,
            borderRadius: 8,
            background: msg.includes("Ошибка") ? "#fee2e2" : "#dcfce7",
            color: msg.includes("Ошибка") ? "#991b1b" : "#166534",
            marginBottom: 16,
            fontSize: 14,
          }}
        >
          {msg}
        </div>
      )}
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div>
          <label style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 6, display: "block" }}>
            Номер счётчика
          </label>
          <input
            type="text"
            placeholder="например, 88761909 (несколько — через запятую)"
            value={counterId}
            onChange={(e) => setCounterId(e.target.value)}
            style={inputStyle}
          />
          <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>
            Указан в шапке metrika.yandex.ru или в настройках счётчика (Информер → «Номер счётчика»).
          </div>
        </div>
        <div>
          <label style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 6, display: "block" }}>
            OAuth-токен
          </label>
          <input
            type="password"
            placeholder={savedToken ? "•••••••• (уже сохранён)" : "Введите токен"}
            value={token}
            onChange={(e) => setToken(e.target.value)}
            style={inputStyle}
          />
          <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>
            Выпускается на{" "}
            <a href="https://oauth.yandex.ru" target="_blank" rel="noreferrer" style={{ color: "var(--accent)" }}>
              oauth.yandex.ru
            </a>{" "}
            (Яндекс ID → «Сервисы и токены») с правом «Яндекс Метрика — чтение данных (metrika:read)».
            Токен виден только администраторам и не передаётся в браузер — статистика идёт через сервер CRM.
          </div>
        </div>
        <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, color: "var(--text-primary)", cursor: "pointer" }}>
          <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
          Плагин активен
        </label>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button
            type="submit"
            disabled={saving}
            style={{
              padding: "10px 20px",
              borderRadius: 8,
              border: "none",
              background: "var(--accent)",
              color: "#fff",
              fontSize: 14,
              fontWeight: 600,
              cursor: saving ? "default" : "pointer",
              opacity: saving ? 0.7 : 1,
            }}
          >
            {saving ? "Сохранение..." : "Сохранить"}
          </button>
          <button
            type="button"
            onClick={testConnection}
            disabled={saving}
            style={{
              padding: "10px 20px",
              borderRadius: 8,
              border: "1px solid var(--border-color)",
              background: "var(--bg-input)",
              color: "var(--text-secondary)",
              fontSize: 14,
              cursor: saving ? "default" : "pointer",
              opacity: saving ? 0.7 : 1,
            }}
          >
            Проверить подключение
          </button>
        </div>
      </form>
    </div>
  );
}
