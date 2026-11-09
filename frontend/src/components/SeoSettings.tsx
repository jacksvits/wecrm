import { useEffect, useState } from "react";
import { api } from "../api/client";

// Отдельная страница «SEO» в Системных настройках: метатеги сайта.
// Обычные поля ввода (без WYSIWYG) — Title, Description, Canonical, Robots, Lang, Viewport, Keywords.
export function SeoSettings() {
  const [form, setForm] = useState({
    title: "",
    description: "",
    canonical: "",
    robots: "",
    lang: "",
    viewport: "",
    keywords: "",
    yandexMetrika: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const s = await api.seoSettings.get();
      setForm({
        title: s.title || "",
        description: s.description || "",
        canonical: s.canonical || "",
        robots: s.robots || "",
        lang: s.lang || "",
        viewport: s.viewport || "",
        keywords: s.keywords || "",
        yandexMetrika: s.yandexMetrika || "",
      });
    } catch (e) {
      console.error("Failed to load SEO settings:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMsg("");
    try {
      const res = await api.seoSettings.save(form);
      setForm({
        title: res.title || "",
        description: res.description || "",
        canonical: res.canonical || "",
        robots: res.robots || "",
        lang: res.lang || "",
        viewport: res.viewport || "",
        keywords: res.keywords || "",
        yandexMetrika: res.yandexMetrika || "",
      });
      setMsg("SEO-настройки сохранены");
      setTimeout(() => setMsg(""), 3000);
    } catch (err: any) {
      setMsg("Ошибка: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "10px 14px",
    borderRadius: 12,
    border: "1px solid var(--border-color)",
    background: "var(--bg-card)",
    color: "var(--text-primary)",
    fontSize: 14,
    outline: "none",
  };

  const field = (
    key: keyof typeof form,
    label: string,
    hint: string,
    textarea = false,
    placeholder = ""
  ) => (
    <div>
      <label style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 6, display: "block" }}>
        {label}
      </label>
      {textarea ? (
        <textarea
          value={form[key]}
          placeholder={placeholder}
          onChange={(e) => setForm({ ...form, [key]: e.target.value })}
          rows={3}
          style={{ ...inputStyle, resize: "vertical", fontFamily: "inherit", lineHeight: 1.5 }}
        />
      ) : (
        <input
          value={form[key]}
          placeholder={placeholder}
          onChange={(e) => setForm({ ...form, [key]: e.target.value })}
          style={inputStyle}
        />
      )}
      <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 6 }}>{hint}</div>
    </div>
  );

  if (loading) return <div style={{ padding: 20, color: "var(--text-muted)" }}>Загрузка...</div>;

  return (
    <div style={{ maxWidth: 640 }}>
      {msg && (
        <div
          style={{
            padding: 12,
            borderRadius: 8,
            background: msg.includes("Ошибка") ? "#fee2e2" : "#dcfce7",
            marginBottom: 16,
            fontSize: 14,
          }}
        >
          {msg}
        </div>
      )}
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {field("title", "Title", "Заголовок страницы (тег <title>). Пустое поле — значение из index.html.", false, "WeCRM")}
        {field("description", "Description", "Мета-описание страницы (meta name=\"description\").", true)}
        {field("canonical", "Canonical", "Каноническая ссылка (link rel=\"canonical\").", false, "https://welans.cc/")}
        {field("robots", "Метатег Robots", "Например: index, follow или noindex, nofollow.", false, "index, follow")}
        {field("lang", "Lang", "Язык документа (атрибут html lang).", false, "ru")}
        {field("viewport", "Viewport", "Мета- viewport. Пустое поле — значение из index.html.", false, "width=device-width, initial-scale=1.0")}
        {field("keywords", "Keywords", "Ключевые слова (meta name=\"keywords\"), через запятую.", true)}
        <div>
          <label style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 6, display: "block" }}>
            Яндекс Метрика
          </label>
          <textarea
            value={form.yandexMetrika}
            placeholder={'<!-- Yandex.Metrika counter -->\n<script type="text/javascript">\n   ...\n</script>\n<noscript>...</noscript>\n<!-- /Yandex.Metrika counter -->'}
            onChange={(e) => setForm({ ...form, yandexMetrika: e.target.value })}
            rows={8}
            style={{ ...inputStyle, resize: "vertical", fontFamily: "monospace", fontSize: 12, lineHeight: 1.5 }}
          />
          <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 6 }}>
            Вставьте код счётчика целиком, как его выдаёт Метрика. Код будет размещён на всех страницах
            в пределах тегов {"<head></head>"} как можно ближе к началу страницы: так он будет раньше
            загружаться и сможет отправить данные о просмотре в Метрику, даже если посетитель почти сразу
            же закроет страницу. Пустое поле — счётчик не подключается.
          </div>
        </div>
        <button
          type="submit"
          disabled={saving}
          style={{
            padding: "10px 20px",
            borderRadius: 12,
            border: "none",
            background: "var(--text-primary)",
            color: "var(--bg-card)",
            fontSize: 14,
            fontWeight: 500,
            cursor: saving ? "not-allowed" : "pointer",
            opacity: saving ? 0.7 : 1,
            alignSelf: "flex-start",
          }}
        >
          {saving ? "Сохранение..." : "Сохранить"}
        </button>
      </form>
    </div>
  );
}
