import { useEffect, useState } from "react";
import { api } from "../api/client";

// Под-вкладка «Реквизиты» (Настройки → Системные): реквизиты организации для подстановки в документы

type Requisites = {
  fullName: string;
  inn: string;
  ogrn: string;
  bankName: string;
  bik: string;
  account: string;
  corrAccount: string;
  legalAddress: string;
  actualAddress: string;
};

const EMPTY: Requisites = {
  fullName: "",
  inn: "",
  ogrn: "",
  bankName: "",
  bik: "",
  account: "",
  corrAccount: "",
  legalAddress: "",
  actualAddress: "",
};

const FIELDS: { key: keyof Requisites; label: string; hint?: string; half?: boolean; mono?: boolean }[] = [
  { key: "fullName", label: "Полное наименование" },
  { key: "inn", label: "ИНН", half: true, mono: true },
  { key: "ogrn", label: "ОГРН / ОГРНИП", half: true, mono: true },
  { key: "bankName", label: "Наименование банка" },
  { key: "bik", label: "БИК", half: true, mono: true },
  { key: "account", label: "Расчётный счёт", half: true, mono: true },
  { key: "corrAccount", label: "Корреспондентский счёт", mono: true },
  { key: "legalAddress", label: "Юридический адрес" },
  { key: "actualAddress", label: "Физический адрес" },
];

export function RequisitesSettings() {
  const [data, setData] = useState<Requisites>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lookupLoading, setLookupLoading] = useState(false);

  useEffect(() => {
    api.requisites
      .get()
      .then((r: Record<string, string>) => setData({ ...EMPTY, ...r }))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const set = (key: keyof Requisites, value: string) => setData((d) => ({ ...d, [key]: value }));

  const save = async () => {
    setSaving(true);
    try {
      await api.requisites.save(data as unknown as Record<string, string>);
      alert("Сохранено");
    } catch (e: any) {
      alert("Ошибка: " + e.message);
    } finally {
      setSaving(false);
    }
  };

  const fillByInn = async () => {
    const inn = data.inn.replace(/\D/g, "");
    if (inn.length !== 10 && inn.length !== 12) {
      alert("Введите ИНН (10 цифр для организации, 12 для ИП)");
      return;
    }
    setLookupLoading(true);
    try {
      const r: Record<string, string> = await api.requisites.innLookup(inn);
      setData((d) => ({
        ...d,
        fullName: r.fullName || d.fullName,
        inn: r.inn || d.inn,
        ogrn: r.ogrn || d.ogrn,
        legalAddress: r.legalAddress || d.legalAddress,
      }));
      alert("Данные из ФНС получены. Проверьте их и нажмите «Сохранить»");
    } catch (e: any) {
      alert("Ошибка: " + e.message);
    } finally {
      setLookupLoading(false);
    }
  };

  if (loading) return <div style={{ padding: 20, color: "var(--text-muted)" }}>Загрузка...</div>;

  const cardStyle: React.CSSProperties = {
    marginBottom: 20,
    padding: 20,
    borderRadius: 12,
    border: "1px solid var(--border-color)",
    background: "var(--bg-card)",
  };
  const labelStyle: React.CSSProperties = {
    fontSize: 11,
    color: "var(--text-muted)",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    marginBottom: 4,
    display: "block",
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

  return (
    <div>
      <p style={{ color: "var(--text-muted)", marginBottom: 24, fontSize: 14 }}>
        Реквизиты организации подставляются в документы (оферту, счета, договоры). По ИНН можно автоматически
        получить наименование, ОГРН/ОГРНИП и юридический адрес из открытых данных ФНС. Банковские реквизиты в
        открытом доступе не публикуются — заполните их вручную.
      </p>

      <div style={cardStyle}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          {FIELDS.map((f) => (
            <div key={f.key} style={f.half ? {} : { gridColumn: "1 / -1" }}>
              <label style={labelStyle}>{f.label}</label>
              <input
                value={data[f.key]}
                onChange={(e) => set(f.key, e.target.value)}
                style={{ ...inputStyle, fontFamily: f.mono ? "ui-monospace, monospace" : undefined }}
              />
            </div>
          ))}
        </div>

        <div style={{ display: "flex", gap: 8, marginTop: 20, flexWrap: "wrap" }}>
          <button
            onClick={save}
            disabled={saving}
            style={{
              padding: "8px 16px",
              borderRadius: 10,
              background: "#007AFF",
              color: "#fff",
              border: "none",
              cursor: "pointer",
              fontSize: 14,
              opacity: saving ? 0.7 : 1,
            }}
          >
            {saving ? "Сохранение..." : "Сохранить"}
          </button>
          <button
            onClick={fillByInn}
            disabled={lookupLoading}
            title="Получить наименование, ОГРН и адрес из открытых данных ФНС по указанному ИНН"
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
            {lookupLoading ? "Запрос в ФНС..." : "Заполнить по ИНН"}
          </button>
        </div>
      </div>
    </div>
  );
}
