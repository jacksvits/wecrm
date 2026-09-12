import { useEffect, useState } from "react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { api } from "../api/client";
import { loadBranding } from "../lib/branding";
import { User, AutoReplyTrigger } from "../types";

// WYSIWYG-редактор — та же конфигурация, что и в остальных текстовых полях проекта
const quillModules = {
  toolbar: [
    ["bold", "italic", "underline", "strike"],
    [{ list: "ordered" }, { list: "bullet" }],
    ["link"],
    ["clean"],
  ],
};

const quillFormats = ["bold", "italic", "underline", "strike", "list", "bullet", "link"];

// Шаблоны «по умолчанию» для обработчика — подставляются кнопкой «По умолчанию»
const HANDLER_DEFAULT_GREETING = `<p>Здравствуйте, <strong>[name]</strong>.</p><p><br></p><p>Заявка № <strong>[task]</strong></p><p>Менеджера уже позвал. Ожидайте пожалуйста.</p><p>(Если это очень срочно - напишите: "срочно!")</p><p>----------------------------------------</p><p>Пока оператор подключается скажите пожалуйста:</p><ul><li>Подскажите Ваш номер телефона.</li><li>Вы обращаетесь от организации?</li></ul>`;

const HANDLER_DEFAULT_COMPLETION = `<p>Задача № <strong>[task]</strong> перешла в статус "<strong>Выполнено</strong>". </p><p>Если есть ещё вопросы, то обращайтесь иначе будет создана новая заявка.</p><p>Через 10 мин перейдёт в статус "<strong>Завершено</strong>"</p><p>----------------------------------------</p><p>Будем рады если оставите отзыв: <a href="https://yandex.ru/maps/-/CLdgeDoA" rel="noopener noreferrer" target="_blank">Yandex</a> / <a href="https://2gis.ru/reviews/70000001089480719/addReview" rel="noopener noreferrer" target="_blank">2Gis</a></p><p>Заранее благодарим! </p><p> </p>`;

const TAB_CONFIGS = [
  { key: "programs", label: "Программы", defaultPath: "/volume3/SOFT" },
  { key: "drivers", label: "Драйвера", defaultPath: "/volume3/DRIVER" },
  { key: "documents", label: "Документы", defaultPath: "/volume2/BOOK" },
  { key: "games", label: "Игры", defaultPath: "/volume3/GAME" },
];

type SystemSubTab = "design" | "storage" | "handler" | "autoreply";

export function SystemSettings() {
  // По умолчанию открываем под-вкладку «Дизайн»
  const [subTab, setSubTab] = useState<SystemSubTab>("design");
  const [settings, setSettings] = useState<Record<string, { url: string; path: string }>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  // === Брендинг: иконка приложения и логотип компании ===
  const [branding, setBranding] = useState<{ iconUrl: string | null; logoUrl: string | null }>({ iconUrl: null, logoUrl: null });
  const [iconFile, setIconFile] = useState<File | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState<string | null>(null);

  // === Обработчик: авто-сообщения в обсуждение задачи ===
  const [handlerGreeting, setHandlerGreeting] = useState("");
  const [handlerCompletion, setHandlerCompletion] = useState("");
  const [handlerUserId, setHandlerUserId] = useState<string | null>(null);
  const [handlerUsers, setHandlerUsers] = useState<User[]>([]);
  const [handlerLoading, setHandlerLoading] = useState(true);
  const [handlerSaving, setHandlerSaving] = useState(false);

  // === Автоответчик: триггеры и ответы в обсуждениях задач ===
  const [arUserId, setArUserId] = useState<string | null>(null);
  const [arTriggers, setArTriggers] = useState<AutoReplyTrigger[]>([]);
  const [arUsers, setArUsers] = useState<User[]>([]);
  const [arNewWord, setArNewWord] = useState("");
  const [arNewAnswer, setArNewAnswer] = useState("");
  const [arLoading, setArLoading] = useState(true);
  const [arSaving, setArSaving] = useState(false);
  // Редактируемый триггер: id → { word, answer }
  const [arEditing, setArEditing] = useState<Record<string, { word: string; answer: string }>>({});

  useEffect(() => {
    Promise.all([api.handlerSettings.get(), api.autoReplySettings.get(), api.users.list()])
      .then(([s, ar, users]) => {
        setHandlerGreeting(s.greeting || "");
        setHandlerCompletion(s.completion || "");
        setHandlerUserId(s.userId || null);
        setHandlerUsers(users || []);
        setArUserId(ar.userId || null);
        setArTriggers(ar.triggers || []);
        setArUsers(users || []);
        setArLoading(false);
        setHandlerLoading(false);
      })
      .catch(() => {
        setArLoading(false);
        setHandlerLoading(false);
      });
  }, []);

  const saveHandler = async () => {
    setHandlerSaving(true);
    try {
      await api.handlerSettings.save({
        greeting: handlerGreeting,
        completion: handlerCompletion,
        userId: handlerUserId,
      });
      alert("Сохранено");
    } catch (e: any) {
      alert("Ошибка: " + e.message);
    } finally {
      setHandlerSaving(false);
    }
  };

  // === Автоответчик: обработчики ===
  const saveArUser = async () => {
    setArSaving(true);
    try {
      await api.autoReplySettings.saveUser(arUserId);
      alert("Сохранено");
    } catch (e: any) {
      alert("Ошибка: " + e.message);
    } finally {
      setArSaving(false);
    }
  };

  const addArTrigger = async () => {
    if (!arNewWord.trim() || !arNewAnswer.trim()) {
      alert("Заполните слово-триггер и ответ");
      return;
    }
    setArSaving(true);
    try {
      const trigger = await api.autoReplySettings.addTrigger({ word: arNewWord.trim(), answer: arNewAnswer });
      setArTriggers((prev) => [...prev, trigger]);
      setArNewWord("");
      setArNewAnswer("");
    } catch (e: any) {
      alert("Ошибка: " + e.message);
    } finally {
      setArSaving(false);
    }
  };

  const toggleArTrigger = async (t: AutoReplyTrigger) => {
    try {
      const updated = await api.autoReplySettings.updateTrigger(t.id, { isActive: !t.isActive });
      setArTriggers((prev) => prev.map((x) => (x.id === t.id ? { ...x, ...updated } : x)));
    } catch (e: any) {
      alert("Ошибка: " + e.message);
    }
  };

  const saveArTrigger = async (t: AutoReplyTrigger) => {
    const edit = arEditing[t.id];
    if (!edit) return;
    if (!edit.word.trim() || !edit.answer.trim()) {
      alert("Заполните слово-триггер и ответ");
      return;
    }
    setArSaving(true);
    try {
      const updated = await api.autoReplySettings.updateTrigger(t.id, { word: edit.word.trim(), answer: edit.answer });
      setArTriggers((prev) => prev.map((x) => (x.id === t.id ? { ...x, ...updated } : x)));
      setArEditing((prev) => {
        const next = { ...prev };
        delete next[t.id];
        return next;
      });
    } catch (e: any) {
      alert("Ошибка: " + e.message);
    } finally {
      setArSaving(false);
    }
  };

  const deleteArTrigger = async (t: AutoReplyTrigger) => {
    if (!confirm(`Удалить триггер "${t.word}"?`)) return;
    try {
      await api.autoReplySettings.deleteTrigger(t.id);
      setArTriggers((prev) => prev.filter((x) => x.id !== t.id));
    } catch (e: any) {
      alert("Ошибка: " + e.message);
    }
  };

  useEffect(() => {
    fetch("/api/branding")
      .then((r) => (r.ok ? r.json() : null))
      .then((b) => b && setBranding({ iconUrl: b.iconUrl, logoUrl: b.logoUrl }))
      .catch(() => {});
  }, []);

  const uploadBranding = async (kind: "icon" | "logo", file: File) => {
    setUploading(kind);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/branding/${kind}`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Ошибка загрузки");
      setBranding((prev) => ({ ...prev, ...(kind === "icon" ? { iconUrl: data.iconUrl } : { logoUrl: data.logoUrl }) }));
      await loadBranding(); // применить сразу: favicon, manifest PWA, логотип
      if (kind === "icon") setIconFile(null);
      else setLogoFile(null);
      alert("Сохранено");
    } catch (e: any) {
      alert("Ошибка: " + e.message);
    } finally {
      setUploading(null);
    }
  };

  useEffect(() => {
    api.files
      .tabs()
      .then((data: any[]) => {
        const map: Record<string, { url: string; path: string }> = {};
        data.forEach((t) => {
          map[t.tabKey] = { url: t.url || "", path: t.path || "" };
        });
        TAB_CONFIGS.forEach((cfg) => {
          if (!map[cfg.key]?.path) {
            map[cfg.key] = { ...(map[cfg.key] || {}), path: cfg.defaultPath };
          }
        });
        setSettings(map);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const updateField = (key: string, field: "url" | "path", value: string) => {
    setSettings((prev) => ({
      ...prev,
      [key]: { ...(prev[key] || { url: "", path: "" }), [field]: value },
    }));
  };

  const save = async (key: string) => {
    setSaving(key);
    try {
      const s = settings[key] || { url: "", path: "" };
      await api.files.updateTab(key, s.url, s.path);
      alert("Сохранено");
    } catch (e: any) {
      alert("Ошибка: " + e.message);
    } finally {
      setSaving(null);
    }
  };

  // Стиль под-вкладок — в единой стилистике с основными вкладками настроек
  const subTabStyle = (isActive: boolean): React.CSSProperties => ({
    padding: "10px 20px",
    borderRadius: 12,
    border: "none",
    background: isActive ? "var(--text-primary)" : "transparent",
    color: isActive ? "var(--bg-card)" : "var(--text-secondary)",
    fontSize: 14,
    fontWeight: 500,
    cursor: "pointer",
    transition: "all 0.2s",
  });

  // === Под-вкладка «Хранение»: пути к NFS-папкам для страницы «Файлы» ===
  const renderStorage = () => {
    if (loading) return <div style={{ padding: 20, color: "var(--text-muted)" }}>Загрузка...</div>;

    return (
      <div>
        <p style={{ color: "var(--text-muted)", marginBottom: 24, fontSize: 14 }}>
          Настройка путей к NFS-папкам для вкладок на странице «Файлы»
        </p>

        {TAB_CONFIGS.map((cfg) => (
          <div
            key={cfg.key}
            style={{
              marginBottom: 20,
              padding: 20,
              borderRadius: 12,
              border: "1px solid var(--border-color)",
              background: "var(--bg-card)",
            }}
          >
            <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>{cfg.label}</div>

            <div style={{ marginBottom: 12 }}>
              <label style={{ display: "block", marginBottom: 6, fontSize: 13, color: "var(--text-muted)" }}>
                Путь к NFS папке
              </label>
              <input
                type="text"
                value={settings[cfg.key]?.path || cfg.defaultPath}
                onChange={(e) => updateField(cfg.key, "path", e.target.value)}
                placeholder="/volume3/SOFT"
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: 10,
                  border: "1px solid var(--border-color)",
                  background: "var(--bg-color)",
                  color: "var(--text-color)",
                  fontSize: 14,
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
            </div>

            <button
              onClick={() => save(cfg.key)}
              disabled={saving === cfg.key}
              style={{
                padding: "8px 16px",
                borderRadius: 10,
                background: "#007AFF",
                color: "#fff",
                border: "none",
                cursor: "pointer",
                fontSize: 14,
                opacity: saving === cfg.key ? 0.7 : 1,
              }}
            >
              {saving === cfg.key ? "Сохранение..." : "Сохранить"}
            </button>
          </div>
        ))}
      </div>
    );
  };

  // === Под-вкладка «Дизайн»: брендинг (иконка приложения и логотип компании) ===
  const renderDesign = () => (
    <div>
      {/* Иконка приложения: PWA, favicon, уведомления */}
      <div
        style={{
          marginBottom: 20,
          padding: 20,
          borderRadius: 12,
          border: "1px solid var(--border-color)",
          background: "var(--bg-card)",
        }}
      >
        <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 6 }}>Иконка приложения</div>
        <p style={{ margin: "0 0 16px", fontSize: 13, color: "var(--text-muted)" }}>
          Используется для PWA-приложения, favicon и push-уведомлений (кнопка по центру мобильной версии)
        </p>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            marginBottom: 16,
            padding: 12,
            borderRadius: 10,
            border: "1px solid var(--border-color)",
            background: "var(--bg-color)",
          }}
        >
          <img
            src={branding.iconUrl || "/icon-192x192.png"}
            alt="Текущая иконка"
            style={{ width: 48, height: 48, objectFit: "contain", borderRadius: 8 }}
          />
          <span style={{ fontSize: 13, color: "var(--text-muted)" }}>Текущая иконка</span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setIconFile(e.target.files?.[0] || null)}
            style={{ fontSize: 13, color: "var(--text-muted)" }}
          />
          <button
            onClick={() => iconFile && uploadBranding("icon", iconFile)}
            disabled={!iconFile || uploading === "icon"}
            style={{
              padding: "8px 16px",
              borderRadius: 10,
              background: "#007AFF",
              color: "#fff",
              border: "none",
              cursor: iconFile && uploading !== "icon" ? "pointer" : "default",
              fontSize: 14,
              opacity: !iconFile || uploading === "icon" ? 0.7 : 1,
            }}
          >
            {uploading === "icon" ? "Загрузка..." : "Загрузить"}
          </button>
        </div>
      </div>

      {/* Логотип компании: страница авторизации и интерфейс */}
      <div
        style={{
          marginBottom: 20,
          padding: 20,
          borderRadius: 12,
          border: "1px solid var(--border-color)",
          background: "var(--bg-card)",
        }}
      >
        <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 6 }}>Логотип компании</div>
        <p style={{ margin: "0 0 16px", fontSize: 13, color: "var(--text-muted)" }}>
          Используется на странице авторизации и во всех местах интерфейса, где выводится логотип
        </p>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            marginBottom: 16,
            padding: 12,
            borderRadius: 10,
            border: "1px solid var(--border-color)",
            background: "var(--bg-color)",
          }}
        >
          <img
            src={branding.logoUrl || "/welans-logo.png"}
            alt="Текущий логотип"
            style={{ height: 48, maxWidth: 180, objectFit: "contain", borderRadius: 8 }}
          />
          <span style={{ fontSize: 13, color: "var(--text-muted)" }}>Текущий логотип</span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
            style={{ fontSize: 13, color: "var(--text-muted)" }}
          />
          <button
            onClick={() => logoFile && uploadBranding("logo", logoFile)}
            disabled={!logoFile || uploading === "logo"}
            style={{
              padding: "8px 16px",
              borderRadius: 10,
              background: "#007AFF",
              color: "#fff",
              border: "none",
              cursor: logoFile && uploading !== "logo" ? "pointer" : "default",
              fontSize: 14,
              opacity: !logoFile || uploading === "logo" ? 0.7 : 1,
            }}
          >
            {uploading === "logo" ? "Загрузка..." : "Загрузить"}
          </button>
        </div>
      </div>
    </div>
  );

  // === Под-вкладка «Обработчик»: авто-сообщения в обсуждение задач ===
  const renderHandler = () => {
    if (handlerLoading) return <div style={{ padding: 20, color: "var(--text-muted)" }}>Загрузка...</div>;

    return (
      <div>
        <p style={{ color: "var(--text-muted)", marginBottom: 24, fontSize: 14 }}>
          Автоматические сообщения в обсуждение задачи. Работает только для задач из каналов «MAX», «Telegram» и «ВК Группа» с включённой опцией «Автоматические ответы» в настройках соответствующего плагина (раздел «Интеграции»)
        </p>
        <p style={{ color: "var(--text-muted)", marginBottom: 24, fontSize: 13 }}>
          В тексте можно использовать переменные: <strong>[name]</strong> — имя контакта, который обратился; <strong>[task]</strong> — номер задачи
        </p>

        {/* Приветствие */}
        <div
          style={{
            marginBottom: 20,
            padding: 20,
            borderRadius: 12,
            border: "1px solid var(--border-color)",
            background: "var(--bg-card)",
          }}
        >
          <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 6 }}>Приветствие</div>
          <p style={{ margin: "0 0 16px", fontSize: 13, color: "var(--text-muted)" }}>
            Автоматически добавляется в обсуждение при создании новой задачи
          </p>
          <ReactQuill
            theme="snow"
            value={handlerGreeting}
            onChange={setHandlerGreeting}
            modules={quillModules}
            formats={quillFormats}
            placeholder="Текст приветствия..."
          />
        </div>

        {/* Завершение задачи */}
        <div
          style={{
            marginBottom: 20,
            padding: 20,
            borderRadius: 12,
            border: "1px solid var(--border-color)",
            background: "var(--bg-card)",
          }}
        >
          <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 6 }}>Завершение задачи</div>
          <p style={{ margin: "0 0 16px", fontSize: 13, color: "var(--text-muted)" }}>
            Автоматически добавляется в обсуждение, когда статус задачи меняется на «Выполнена»
          </p>
          <ReactQuill
            theme="snow"
            value={handlerCompletion}
            onChange={setHandlerCompletion}
            modules={quillModules}
            formats={quillFormats}
            placeholder="Текст сообщения о завершении..."
          />
        </div>

        {/* Пользователь, от имени которого публикуются сообщения */}
        <div
          style={{
            marginBottom: 20,
            padding: 20,
            borderRadius: 12,
            border: "1px solid var(--border-color)",
            background: "var(--bg-card)",
          }}
        >
          <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 6 }}>Публикация от имени</div>
          <p style={{ margin: "0 0 16px", fontSize: 13, color: "var(--text-muted)" }}>
            Автоматические сообщения будут добавлены в обсуждение от имени выбранного пользователя
          </p>
          <select
            value={handlerUserId || ""}
            onChange={(e) => setHandlerUserId(e.target.value || null)}
            style={{
              width: "100%",
              padding: "10px 14px",
              borderRadius: 10,
              border: "1px solid var(--border-color)",
              background: "var(--bg-color)",
              color: "var(--text-color)",
              fontSize: 14,
              outline: "none",
              boxSizing: "border-box",
            }}
          >
            <option value="">— Не выбран (сообщения отключены) —</option>
            {handlerUsers.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={saveHandler}
            disabled={handlerSaving}
            style={{
              padding: "8px 16px",
              borderRadius: 10,
              background: "#007AFF",
              color: "#fff",
              border: "none",
              cursor: "pointer",
              fontSize: 14,
              opacity: handlerSaving ? 0.7 : 1,
            }}
          >
            {handlerSaving ? "Сохранение..." : "Сохранить"}
          </button>
          <button
            onClick={() => {
              setHandlerGreeting(HANDLER_DEFAULT_GREETING);
              setHandlerCompletion(HANDLER_DEFAULT_COMPLETION);
            }}
            title="Подставить тексты-шаблоны в поля «Приветствие» и «Завершение задачи» (в базу запишется после «Сохранить»)"
            style={{
              padding: "8px 16px",
              borderRadius: 10,
              background: "transparent",
              color: "var(--text-secondary)",
              border: "1px solid var(--border-color)",
              cursor: "pointer",
              fontSize: 14,
            }}
          >
            По умолчанию
          </button>
        </div>
      </div>
    );
  };

  // === Под-вкладка «Автоответчик»: триггеры и ответы в обсуждениях задач ===
  const renderAutoReply = () => {
    if (arLoading) return <div style={{ padding: 20, color: "var(--text-muted)" }}>Загрузка...</div>;

    const cardStyle: React.CSSProperties = {
      marginBottom: 20,
      padding: 20,
      borderRadius: 12,
      border: "1px solid var(--border-color)",
      background: "var(--bg-card)",
    };
    const inputStyle: React.CSSProperties = {
      width: "100%",
      padding: "10px 14px",
      borderRadius: 10,
      border: "1px solid var(--border-color)",
      background: "var(--bg-color)",
      color: "var(--text-color)",
      fontSize: 14,
      outline: "none",
      boxSizing: "border-box",
    };
    const btnPrimary: React.CSSProperties = {
      padding: "8px 16px",
      borderRadius: 10,
      background: "#007AFF",
      color: "#fff",
      border: "none",
      cursor: "pointer",
      fontSize: 14,
      opacity: arSaving ? 0.7 : 1,
    };
    const btnGhost: React.CSSProperties = {
      padding: "8px 16px",
      borderRadius: 10,
      background: "transparent",
      color: "var(--text-secondary)",
      border: "1px solid var(--border-color)",
      cursor: "pointer",
      fontSize: 14,
    };

    return (
      <div>
        <p style={{ color: "var(--text-muted)", marginBottom: 24, fontSize: 14 }}>
          Автоматические ответы в обсуждениях задач. Если слово-триггер совпадает с текстом комментария (без учёта регистра), в обсуждение задачи добавляется указанный ответ от имени выбранного пользователя
        </p>

        {/* Пользователь, от имени которого публикуются ответы */}
        <div style={cardStyle}>
          <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 6 }}>Публикация от имени</div>
          <p style={{ margin: "0 0 16px", fontSize: 13, color: "var(--text-muted)" }}>
            Ответы по триггерам будут добавлены в обсуждение от имени выбранного пользователя
          </p>
          <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
            <select
              value={arUserId || ""}
              onChange={(e) => setArUserId(e.target.value || null)}
              style={{ ...inputStyle, width: "auto", minWidth: 280, flex: 1 }}
            >
              <option value="">— Не выбран (автоответы отключены) —</option>
              {arUsers.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
            <button onClick={saveArUser} disabled={arSaving} style={btnPrimary}>
              {arSaving ? "Сохранение..." : "Сохранить"}
            </button>
          </div>
        </div>

        {/* Добавление триггера */}
        <div style={cardStyle}>
          <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 6 }}>Добавить триггер</div>
          <p style={{ margin: "0 0 16px", fontSize: 13, color: "var(--text-muted)" }}>
            Слово-триггер — часть текста комментария, при совпадении с которой отправляется ответ
          </p>
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: "block", marginBottom: 6, fontSize: 13, color: "var(--text-muted)" }}>
              Слово-триггер
            </label>
            <input
              type="text"
              value={arNewWord}
              onChange={(e) => setArNewWord(e.target.value)}
              placeholder="например: срочно"
              style={inputStyle}
            />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: "block", marginBottom: 6, fontSize: 13, color: "var(--text-muted)" }}>
              Ответ
            </label>
            <ReactQuill
              theme="snow"
              value={arNewAnswer}
              onChange={setArNewAnswer}
              modules={quillModules}
              formats={quillFormats}
              placeholder="Текст ответа..."
            />
          </div>
          <button onClick={addArTrigger} disabled={arSaving} style={btnPrimary}>
            {arSaving ? "Сохранение..." : "Добавить"}
          </button>
        </div>

        {/* Список триггеров */}
        <div style={cardStyle}>
          <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>
            Триггеры ({arTriggers.length})
          </div>
          {arTriggers.length === 0 ? (
            <p style={{ margin: 0, fontSize: 13, color: "var(--text-muted)" }}>
              Триггеры не добавлены
            </p>
          ) : (
            arTriggers.map((t) => {
              const edit = arEditing[t.id];
              const isEditing = !!edit;
              return (
                <div
                  key={t.id}
                  style={{
                    marginBottom: 12,
                    padding: 16,
                    borderRadius: 10,
                    border: "1px solid var(--border-color)",
                    background: "var(--bg-color)",
                    opacity: t.isActive ? 1 : 0.6,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12, flexWrap: "wrap" }}>
                    {isEditing ? (
                      <input
                        type="text"
                        value={edit.word}
                        onChange={(e) => setArEditing((prev) => ({ ...prev, [t.id]: { ...edit, word: e.target.value } }))}
                        style={{ ...inputStyle, width: "auto", flex: 1, minWidth: 180 }}
                      />
                    ) : (
                      <span style={{ fontSize: 14, fontWeight: 600 }}>{t.word}</span>
                    )}
                    <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--text-muted)", cursor: "pointer" }}>
                      <input
                        type="checkbox"
                        checked={t.isActive}
                        onChange={() => toggleArTrigger(t)}
                      />
                      Активен
                    </label>
                    <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
                      {isEditing ? (
                        <>
                          <button onClick={() => saveArTrigger(t)} disabled={arSaving} style={btnPrimary}>
                            Сохранить
                          </button>
                          <button
                            onClick={() =>
                              setArEditing((prev) => {
                                const next = { ...prev };
                                delete next[t.id];
                                return next;
                              })
                            }
                            style={btnGhost}
                          >
                            Отмена
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => setArEditing((prev) => ({ ...prev, [t.id]: { word: t.word, answer: t.answer } }))}
                          style={btnGhost}
                        >
                          Изменить
                        </button>
                      )}
                      <button onClick={() => deleteArTrigger(t)} style={{ ...btnGhost, color: "#FF3B30" }}>
                        Удалить
                      </button>
                    </div>
                  </div>
                  {isEditing ? (
                    <ReactQuill
                      theme="snow"
                      value={edit.answer}
                      onChange={(val) => setArEditing((prev) => ({ ...prev, [t.id]: { ...edit, answer: val } }))}
                      modules={quillModules}
                      formats={quillFormats}
                      placeholder="Текст ответа..."
                    />
                  ) : (
                    <div
                      style={{ fontSize: 13, color: "var(--text-secondary)" }}
                      dangerouslySetInnerHTML={{ __html: t.answer }}
                    />
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    );
  };

  return (
    <div>
      <h3 style={{ margin: "0 0 20px", fontSize: 18, fontWeight: 600 }}>Системные настройки</h3>

      <div style={{ display: "flex", gap: 8, marginBottom: 24, flexWrap: "wrap" }}>
        <button style={subTabStyle(subTab === "design")} onClick={() => setSubTab("design")}>
          Дизайн
        </button>
        <button style={subTabStyle(subTab === "storage")} onClick={() => setSubTab("storage")}>
          Хранение
        </button>
        <button style={subTabStyle(subTab === "handler")} onClick={() => setSubTab("handler")}>
          Обработчик
        </button>
        <button style={subTabStyle(subTab === "autoreply")} onClick={() => setSubTab("autoreply")}>
          Автоответчик
        </button>
      </div>

      {subTab === "design" ? renderDesign() : subTab === "storage" ? renderStorage() : subTab === "handler" ? renderHandler() : renderAutoReply()}
    </div>
  );
}
