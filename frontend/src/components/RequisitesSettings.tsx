import { useEffect, useRef, useState } from "react";
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
  taxSystem: string;
  vatRate: string;
  directorName: string;
  stampUrl?: string;
  directorPosition: string;
  phone: string;
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
  taxSystem: "osno",
  vatRate: "none",
  directorName: "",
  directorPosition: "",
  phone: "",
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
  { key: "directorName", label: "Ф.И.О. руководителя", half: true },
  { key: "directorPosition", label: "Должность руководителя", half: true },
  { key: "phone", label: "Телефон организации", half: true },
];

// Системы налогообложения и ставки НДС для документов (счетов): зеркало backend/src/lib/invoice-pdf.ts
const TAX_SYSTEMS = [
  { value: "osno", label: "ОСНО" },
  { value: "usn6", label: "УСН 6%" },
  { value: "usn15", label: "УСН 15%" },
  { value: "ausn8", label: "АУСН 8%" },
  { value: "ausn22", label: "АУСН 22%" },
  { value: "psn", label: "ПСН" },
  { value: "npd4", label: "НПД 4%" },
  { value: "npd6", label: "НПД 6%" },
  { value: "esxhn", label: "ЕСХН" },
];

const VAT_RATES = [
  { value: "none", label: "без НДС" },
  { value: "5", label: "НДС 5%" },
  { value: "7", label: "НДС 7%" },
  { value: "10", label: "НДС 10%" },
  { value: "22", label: "НДС 22%" },
];

export function RequisitesSettings() {
  const [data, setData] = useState<Requisites>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [bikLoading, setBikLoading] = useState(false);
  const [stampFile, setStampFile] = useState<File | null>(null);
  const [stampPreview, setStampPreview] = useState<string | null>(null);
  const [stampSaving, setStampSaving] = useState(false);
  // Последний БИК, по которому уже выполнялся запрос (чтобы не дёргать API на повторный blur)
  const lastBikLookup = useRef<string>("");

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

  const fillByBik = async () => {
    const bik = data.bik.replace(/\D/g, "");
    if (bik.length !== 9) {
      alert("Введите БИК (9 цифр)");
      return;
    }
    setBikLoading(true);
    try {
      const r: Record<string, string> = await api.requisites.bikLookup(bik);
      setData((d) => ({ ...d, bik, bankName: r.bankName || d.bankName }));
    } catch (e: any) {
      alert("Ошибка: " + e.message);
    } finally {
      setBikLoading(false);
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

  const uploadStamp = async () => {
    if (!stampFile) {
      alert("Выберите PNG-файл штампа");
      return;
    }
    setStampSaving(true);
    try {
      const r: { stampUrl: string } = await api.requisites.uploadStamp(stampFile);
      setStampPreview(r.stampUrl);
      setStampFile(null);
      alert("Штамп загружен");
    } catch (e: any) {
      alert("Ошибка: " + e.message);
    } finally {
      setStampSaving(false);
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
  const selectStyle: React.CSSProperties = {
    ...inputStyle,
    cursor: "pointer",
  };

  return (
    <div>
      <p style={{ color: "var(--text-muted)", marginBottom: 24, fontSize: 14 }}>
        Реквизиты организации подставляются в документы (оферту, счета, договоры). По ИНН можно автоматически
        получить наименование, ОГРН/ОГРНИП и юридический адрес из открытых данных ФНС. Наименование банка
        подставляется по БИК из справочника ЦБ (автоматически при вводе или кнопкой «Заполнить по БИК»).
        Корреспондентский счёт в открытых справочниках не публикуется — заполните его вручную.
      </p>

      <div style={cardStyle}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          {FIELDS.map((f) => (
            <div key={f.key} style={f.half ? {} : { gridColumn: "1 / -1" }}>
              <label style={labelStyle}>{f.label}</label>
              <input
                value={data[f.key]}
                onChange={(e) => set(f.key, e.target.value)}
                onBlur={f.key === "bik" ? () => { const b = data.bik.replace(/\D/g, ""); if (b.length === 9 && b !== lastBikLookup.current) { lastBikLookup.current = b; fillByBik(); } } : undefined}
                style={{ ...inputStyle, fontFamily: f.mono ? "ui-monospace, monospace" : undefined }}
              />
            </div>
          ))}
          {/* Система налогообложения и ставка НДС — итоги документов (счетов) считаются по этим параметрам */}
          <div>
            <label style={labelStyle}>Система налогообложения</label>
            <select
              value={data.taxSystem}
              onChange={(e) => set("taxSystem", e.target.value)}
              style={selectStyle}
            >
              {TAX_SYSTEMS.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Ставка НДС</label>
            <select
              value={data.vatRate}
              onChange={(e) => set("vatRate", e.target.value)}
              disabled={data.taxSystem !== "osno"}
              title={data.taxSystem !== "osno" ? "НДС применяется только на ОСНО" : undefined}
              style={{ ...selectStyle, opacity: data.taxSystem !== "osno" ? 0.6 : 1, cursor: data.taxSystem !== "osno" ? "not-allowed" : "pointer" }}
            >
              {VAT_RATES.map((v) => (
                <option key={v.value} value={v.value}>{v.label}</option>
              ))}
            </select>
          </div>
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
          <button
            onClick={fillByBik}
            disabled={bikLoading}
            title="Получить наименование банка из справочника ЦБ по указанному БИК (подставляется также при уходе из поля «БИК»)"
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
            {bikLoading ? "Запрос в ЦБ..." : "Заполнить по БИК"}
          </button>
        </div>

        {/* Штамп — подписывает документы (счета), PNG с прозрачностью */}
        <div style={{ marginTop: 24, paddingTop: 16, borderTop: "1px solid var(--border-color)" }}>
          <label style={labelStyle}>Штамп (PNG)</label>
          <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
            {(stampPreview || data.stampUrl) && (
              <img
                src={stampPreview || data.stampUrl}
                alt="Штамп"
                style={{ maxWidth: 140, maxHeight: 140, objectFit: "contain", border: "1px dashed var(--border-color)", borderRadius: 8, background: "#fff" }}
              />
            )}
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <input
                type="file"
                accept="image/png"
                onChange={(e) => {
                  const f = e.target.files?.[0] || null;
                  setStampFile(f);
                  if (f) setStampPreview(URL.createObjectURL(f));
                  else setStampPreview(null);
                }}
                style={{ fontSize: 13, color: "var(--text-secondary)" }}
              />
              <button
                onClick={uploadStamp}
                disabled={stampSaving || !stampFile}
                style={{
                  padding: "8px 16px",
                  borderRadius: 10,
                  background: "transparent",
                  color: "var(--text-secondary)",
                  border: "1px solid var(--border-color)",
                  cursor: stampSaving || !stampFile ? "not-allowed" : "pointer",
                  fontSize: 14,
                  opacity: stampSaving || !stampFile ? 0.6 : 1,
                }}
              >
                {stampSaving ? "Загрузка..." : "Загрузить штамп"}
              </button>
            </div>
          </div>
          <p style={{ marginTop: 8, fontSize: 12, color: "var(--text-muted)" }}>
            PNG с прозрачным фоном. Штамп размещается на счёте поверх полей подписи руководителя.
          </p>
        </div>
      </div>
    </div>
  );
}
