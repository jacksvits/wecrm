import { Fragment, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { CdekShipment } from '../types';

const card: React.CSSProperties = { background: 'var(--bg-card)', borderRadius: 16, padding: 20, border: '1px solid var(--border-color)' };
const inputStyle: React.CSSProperties = { width: '100%', padding: '10px 12px', borderRadius: 12, border: '1px solid var(--border-color)', fontSize: 14, background: 'var(--bg-input)', color: 'var(--text-primary)', boxSizing: 'border-box' };
const labelStyle: React.CSSProperties = { fontSize: 13, fontWeight: 600, marginBottom: 6, marginTop: 14, display: 'block' };
const btnPrimary: React.CSSProperties = { padding: '10px 18px', borderRadius: 12, border: 'none', background: 'var(--accent)', color: '#fff', fontWeight: 600, fontSize: 14, cursor: 'pointer' };
const btnSecondary: React.CSSProperties = { ...btnPrimary, background: 'var(--bg-secondary)', color: 'var(--text-primary)' };
const btnDanger: React.CSSProperties = { ...btnPrimary, background: '#dc2626' };

const STATUS_NAMES: Record<string, string> = {
  '1': 'Создан', '2': 'Удалён', '3': 'Принят в СДЭК', '4': 'Выдан на отправку',
  '5': 'В пути', '6': 'Выдан на доставку', '7': 'Вручен', '8': 'Не вручен',
  '9': 'Возвращён', '10': 'Сдан на транзит', '11': 'В пути до склада возврата',
  '12': 'Возвращён на склад отгрузки', '13': 'Возвращён в г. приёмки',
  '16': 'Возвращён отправителю', '17': 'Возвращён в СДЭК', '25': 'Зарезервирован',
  '27': 'Оформлен возврат в ИМ', '30': 'Назначен на рейс',
};

function statusStyle(code?: string | null): React.CSSProperties {
  const c = Number(code ?? 0);
  let bg = '#e2e8f0', color = '#475569';
  if (c === 7) { bg = '#dcfce7'; color = '#16a34a'; }
  else if ([8, 9, 2].includes(c)) { bg = '#fee2e2'; color = '#dc2626'; }
  else if ([3, 4, 5, 6, 10, 30, 31].includes(c)) { bg = '#dbeafe'; color = '#2563eb'; }
  else if ([11, 12, 13, 16, 17, 25].includes(c)) { bg = '#fef3c7'; color = '#b45309'; }
  return { display: 'inline-block', padding: '3px 10px', borderRadius: 8, fontSize: 12, fontWeight: 600, background: bg, color };
}

function fmtMoney(v?: number | null): string {
  if (v === undefined || v === null) return '—';
  return new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB' }).format(v);
}

function fmtDate(d?: string | Date | null): string {
  if (!d) return '—';
  return new Date(d).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

// ---------------------------------------------------------------------------
// Форма создания отправления
// ---------------------------------------------------------------------------
interface CityOption { code: number; city: string; region?: string }
interface PvzOption { code: string; name: string; address: string; workTime?: string }
interface TariffOption { tariff_code: number; status?: boolean; result?: any; tariff_name?: string }

function ShipmentForm({ onClose, onCreated, initialContactId, initialDealId }: {
  onClose: () => void;
  onCreated: (s: CdekShipment) => void;
  initialContactId?: string;
  initialDealId?: string;
}) {
  const [settings, setSettings] = useState<any>(null);
  const [contacts, setContacts] = useState<any[]>([]);
  const [deals, setDeals] = useState<any[]>([]);
  const [form, setForm] = useState({
    imNumber: `WECRM-${Date.now()}`,
    recipientName: '', recipientPhone: '', recipientEmail: '',
    toCity: '', toCityCode: null as number | null,
    deliveryMode: 'warehouse' as 'warehouse' | 'door',
    deliveryPointCode: '', toAddress: '',
    weightKg: '1', lengthCm: '', widthCm: '', heightCm: '',
    codAmount: '0', declaredValue: '0', itemName: '', comment: '',
    contactId: initialContactId ?? '', dealId: initialDealId ?? '',
  });
  const [cityOptions, setCityOptions] = useState<CityOption[]>([]);
  const [showCities, setShowCities] = useState(false);
  const [pvzList, setPvzList] = useState<PvzOption[]>([]);
  const [pvzLoading, setPvzLoading] = useState(false);
  const [tariffs, setTariffs] = useState<TariffOption[]>([]);
  const [tariffCode, setTariffCode] = useState<number | null>(null);
  const [calcLoading, setCalcLoading] = useState(false);
  const [contactQuery, setContactQuery] = useState('');
  const [dealQuery, setDealQuery] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.cdekPlugin.get().then(setSettings).catch(() => setSettings({}));
    api.contacts.list().then(list => setContacts((list ?? []).slice(0, 300))).catch(() => {});
    api.deals.list().then(list => setDeals((list ?? []).slice(0, 300))).catch(() => {});
  }, []);

  // Предзаполнение получателя из выбранного контакта
  useEffect(() => {
    if (!form.contactId) return;
    const c = contacts.find(x => x.id === form.contactId);
    if (c && !form.recipientName) setForm(f => ({ ...f, recipientName: c.name, recipientPhone: c.phone || c.phones?.[0] || '' }));
  }, [form.contactId, contacts]);

  // Подбор городов (требуется активная интеграция)
  useEffect(() => {
    const q = form.toCity.trim();
    if (q.length < 2) { setCityOptions([]); return; }
    const t = setTimeout(() => {
      api.cdek.cities(q).then(list => {
        setCityOptions((list ?? []).slice(0, 8).map((c: any) => ({ code: c.code, city: c.city, region: c.region })));
        setShowCities(true);
      }).catch(() => setCityOptions([]));
    }, 350);
    return () => clearTimeout(t);
  }, [form.toCity]);

  // Загрузка ПВЗ при выборе города и режима «до склада»
  useEffect(() => {
    if (form.deliveryMode !== 'warehouse' || !form.toCityCode) { setPvzList([]); return; }
    setPvzLoading(true);
    api.cdek.deliveryPoints(form.toCityCode)
      .then(list => setPvzList(list ?? []))
      .catch(() => setPvzList([]))
      .finally(() => setPvzLoading(false));
  }, [form.deliveryMode, form.toCityCode]);

  const filteredContacts = useMemo(() => {
    const q = contactQuery.trim().toLowerCase();
    return contacts.filter(c => !q || c.name?.toLowerCase().includes(q)).slice(0, 8);
  }, [contacts, contactQuery]);
  const filteredDeals = useMemo(() => {
    const q = dealQuery.trim().toLowerCase();
    return deals.filter(d => !q || d.name?.toLowerCase().includes(q)).slice(0, 8);
  }, [deals, dealQuery]);

  async function calcTariffs() {
    const weightGrams = Math.round(parseFloat((form.weightKg || '0').replace(',', '.')) * 1000);
    if (!form.toCityCode) { setError('Выберите город из подсказки (нужен код СДЭК)'); return; }
    if (!weightGrams || weightGrams <= 0) { setError('Укажите вес груза'); return; }
    setCalcLoading(true); setError('');
    try {
      const data = await api.cdek.calcTariffList({
        type: 1,
        from_location: settings?.senderCityCode ? { code: settings.senderCityCode } : {},
        to_location: { code: form.toCityCode },
        packages: [{
          weight: weightGrams,
          ...(Number(form.lengthCm) ? { length: Number(form.lengthCm) } : {}),
          ...(Number(form.widthCm) ? { width: Number(form.widthCm) } : {}),
          ...(Number(form.heightCm) ? { height: Number(form.heightCm) } : {}),
        }],
      });
      const list: TariffOption[] = (data?.tariff_codes ?? [])
        .filter((t: TariffOption) => t.status !== false)
        .sort((a: TariffOption, b: TariffOption) => (a.result?.total_sum ?? Infinity) - (b.result?.total_sum ?? Infinity));
      setTariffs(list);
      if (!list.length) setError('Нет доступных тарифов по заданному направлению');
    } catch (e: any) {
      setError(e.data?.error ?? e.message);
      setTariffs([]);
    } finally {
      setCalcLoading(false);
    }
  }

  async function submit() {
    const weightGrams = Math.round(parseFloat((form.weightKg || '0').replace(',', '.')) * 1000);
    if (!form.recipientName.trim()) return setError('Укажите ФИО получателя');
    if (!form.recipientPhone.trim()) return setError('Укажите телефон получателя');
    if (!form.toCityCode) return setError('Выберите город из подсказки');
    if (form.deliveryMode === 'warehouse' && !form.deliveryPointCode) return setError('Выберите пункт выдачи (ПВЗ)');
    if (form.deliveryMode === 'door' && !form.toAddress.trim()) return setError('Укажите адрес доставки');
    if (!weightGrams || weightGrams <= 0) return setError('Укажите вес груза');
    if (!tariffCode) return setError('Рассчитайте и выберите тариф доставки');
    setSubmitting(true); setError('');
    try {
      const created = await api.cdek.createShipment({
        imNumber: form.imNumber,
        tariffCode,
        deliveryMode: form.deliveryMode,
        toCity: form.toCity,
        toAddress: form.deliveryMode === 'door' ? form.toAddress : '',
        deliveryPointCode: form.deliveryMode === 'warehouse' ? form.deliveryPointCode : null,
        recipientName: form.recipientName.trim(),
        recipientPhone: form.recipientPhone.trim(),
        recipientEmail: form.recipientEmail.trim(),
        weightGrams,
        lengthCm: Number(form.lengthCm) || null,
        widthCm: Number(form.widthCm) || null,
        heightCm: Number(form.heightCm) || null,
        codAmount: Math.round(parseFloat((form.codAmount || '0').replace(',', '.')) || 0),
        declaredValue: Math.round(parseFloat((form.declaredValue || '0').replace(',', '.')) || 0),
        itemName: form.itemName.trim(),
        comment: form.comment.trim(),
        contactId: form.contactId || null,
        dealId: form.dealId || null,
      });
      onCreated(created);
      onClose();
    } catch (e: any) {
      const errMsg = e.data?.error ?? e.message;
      if (e.data?.shipment) {
        onCreated(e.data.shipment);
        onClose();
        alert(`CDEK отклонил заказ: ${errMsg}`);
      } else {
        setError(errMsg);
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}>
      <div style={{ background: 'var(--bg-card)', borderRadius: 16, padding: 24, width: '100%', maxWidth: 720, maxHeight: '92vh', overflow: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
        <h3 style={{ margin: '0 0 4px', fontSize: 18 }}>Новая отправление СДЭК</h3>
        <p style={{ margin: 0, fontSize: 12, color: 'var(--text-secondary)' }}>Номер заказа ИМ: {form.imNumber}</p>

        <h4 style={{ margin: '18px 0 0', fontSize: 14 }}>Получатель</h4>
        <label style={labelStyle}>ФИО *</label>
        <input value={form.recipientName} onChange={e => setForm({ ...form, recipientName: e.target.value })} style={inputStyle} placeholder="Иванова Анна Сергеевна" />
        <label style={labelStyle}>Телефон *</label>
        <input value={form.recipientPhone} onChange={e => setForm({ ...form, recipientPhone: e.target.value })} style={inputStyle} placeholder="+79001234567" />
        <label style={labelStyle}>Email</label>
        <input value={form.recipientEmail} onChange={e => setForm({ ...form, recipientEmail: e.target.value })} style={inputStyle} placeholder="client@example.com" />

        <h4 style={{ margin: '18px 0 0', fontSize: 14 }}>Направление</h4>
        <label style={labelStyle}>Город получателя * (выберите из подсказки)</label>
        <div style={{ position: 'relative' }}>
          <input value={form.toCity} onChange={e => setForm({ ...form, toCity: e.target.value, toCityCode: null, deliveryPointCode: '' })} style={inputStyle} placeholder="Начните вводить: Москва, Санкт-Петербург…" onBlur={() => setTimeout(() => setShowCities(false), 200)} onFocus={() => cityOptions.length && setShowCities(true)} />
          {showCities && cityOptions.length > 0 && (
            <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 10, background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 12, marginTop: 4, maxHeight: 220, overflow: 'auto', boxShadow: '0 8px 24px rgba(0,0,0,0.15)' }}>
              {cityOptions.map(c => (
                <div key={c.code} onMouseDown={() => { setForm(f => ({ ...f, toCity: c.city, toCityCode: c.code, deliveryPointCode: '' })); setShowCities(false); }}
                  style={{ padding: '10px 12px', cursor: 'pointer', fontSize: 14 }}>
                  {c.city}{c.region ? <span style={{ color: 'var(--text-secondary)', fontSize: 12 }}> — {c.region}</span> : null} <span style={{ color: 'var(--text-secondary)', fontSize: 11 }}>код {c.code}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <label style={labelStyle}>Способ доставки</label>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {([['warehouse', 'До пункта выдачи (ПВЗ)'], ['door', 'Курьером до двери']] as const).map(([v, t]) => (
            <button key={v} type="button" onClick={() => setForm({ ...form, deliveryMode: v })} style={{ ...btnSecondary, background: form.deliveryMode === v ? 'var(--accent)' : 'var(--bg-secondary)', color: form.deliveryMode === v ? '#fff' : 'var(--text-primary)' }}>{t}</button>
          ))}
        </div>
        {form.deliveryMode === 'warehouse' ? (
          <>
            <label style={labelStyle}>Пункт выдачи * {pvzLoading ? '(загрузка…)' : `(${pvzList.length})`}</label>
            <select value={form.deliveryPointCode} onChange={e => setForm({ ...form, deliveryPointCode: e.target.value })} style={inputStyle}>
              <option value="">— выберите ПВЗ —</option>
              {pvzList.map(p => <option key={p.code} value={p.code}>{p.code} — {p.address}{p.workTime ? ` (${p.workTime})` : ''}</option>)}
            </select>
          </>
        ) : (
          <>
            <label style={labelStyle}>Адрес доставки *</label>
            <input value={form.toAddress} onChange={e => setForm({ ...form, toAddress: e.target.value })} style={inputStyle} placeholder="ул. Ленина, д. 10, кв. 5" />
          </>
        )}

        <h4 style={{ margin: '18px 0 0', fontSize: 14 }}>Груз</h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 10 }}>
          <div><label style={labelStyle}>Вес, кг *</label><input value={form.weightKg} onChange={e => setForm({ ...form, weightKg: e.target.value })} style={inputStyle} inputMode="decimal" /></div>
          <div><label style={labelStyle}>Длина, см</label><input value={form.lengthCm} onChange={e => setForm({ ...form, lengthCm: e.target.value.replace(/\D/g, '') })} style={inputStyle} inputMode="numeric" /></div>
          <div><label style={labelStyle}>Ширина, см</label><input value={form.widthCm} onChange={e => setForm({ ...form, widthCm: e.target.value.replace(/\D/g, '') })} style={inputStyle} inputMode="numeric" /></div>
          <div><label style={labelStyle}>Высота, см</label><input value={form.heightCm} onChange={e => setForm({ ...form, heightCm: e.target.value.replace(/\D/g, '') })} style={inputStyle} inputMode="numeric" /></div>
        </div>
        <label style={labelStyle}>Наименование товара</label>
        <input value={form.itemName} onChange={e => setForm({ ...form, itemName: e.target.value })} style={inputStyle} placeholder="Кофе в зёрнах, 1 кг" />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10 }}>
          <div><label style={labelStyle}>Наложенный платёж, ₽</label><input value={form.codAmount} onChange={e => setForm({ ...form, codAmount: e.target.value.replace(/[^\d.,]/g, '') })} style={inputStyle} inputMode="decimal" /></div>
          <div><label style={labelStyle}>Объявленная стоимость, ₽</label><input value={form.declaredValue} onChange={e => setForm({ ...form, declaredValue: e.target.value.replace(/[^\d.,]/g, '') })} style={inputStyle} inputMode="decimal" /></div>
        </div>
        <label style={labelStyle}>Комментарий к заказу</label>
        <input value={form.comment} onChange={e => setForm({ ...form, comment: e.target.value })} style={inputStyle} placeholder="Комментарий для курьера / описание вложения" />

        <h4 style={{ margin: '18px 0 0', fontSize: 14 }}>Тариф</h4>
        <button type="button" onClick={calcTariffs} disabled={calcLoading} style={{ ...btnSecondary, marginTop: 10 }}>
          {calcLoading ? 'Расчёт…' : 'Рассчитать стоимость доставки'}
        </button>
        {tariffs.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 10 }}>
            {tariffs.slice(0, 8).map(t => (
              <label key={t.tariff_code} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10, border: `2px solid ${tariffCode === t.tariff_code ? 'var(--accent)' : 'var(--border-color)'}`, cursor: 'pointer' }}>
                <input type="radio" name="tariff" checked={tariffCode === t.tariff_code} onChange={() => setTariffCode(t.tariff_code)} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>Тариф {t.tariff_code}{t.tariff_name ? ` — ${t.tariff_name}` : ''}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                    Срок: {t.result?.period_min ?? '?'}{t.result?.period_max != null && t.result?.period_max !== t.result?.period_min ? `–${t.result.period_max}` : ''} дн.
                  </div>
                </div>
                <div style={{ fontWeight: 700 }}>{fmtMoney(t.result?.total_sum)}</div>
              </label>
            ))}
          </div>
        )}

        <h4 style={{ margin: '18px 0 0', fontSize: 14 }}>Связь с CRM (необязательно)</h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10 }}>
          <div>
            <label style={labelStyle}>Контакт</label>
            <input value={contactQuery} onChange={e => { setContactQuery(e.target.value); setForm(f => ({ ...f, contactId: '' })); }} style={inputStyle} placeholder="Поиск контакта…" />
            {contactQuery && !form.contactId && filteredContacts.length > 0 && (
              <div style={{ border: '1px solid var(--border-color)', borderRadius: 10, marginTop: 4, maxHeight: 160, overflow: 'auto' }}>
                {filteredContacts.map(c => (
                  <div key={c.id} onClick={() => { setForm(f => ({ ...f, contactId: c.id })); setContactQuery(c.name); }} style={{ padding: '8px 12px', cursor: 'pointer', fontSize: 13 }}>{c.name}</div>
                ))}
              </div>
            )}
            {form.contactId && <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>Выбран: {contacts.find(c => c.id === form.contactId)?.name ?? form.contactId} <span style={{ cursor: 'pointer', color: '#dc2626' }} onClick={() => { setForm(f => ({ ...f, contactId: '' })); setContactQuery(''); }}>✕</span></div>}
          </div>
          <div>
            <label style={labelStyle}>Сделка</label>
            <input value={dealQuery} onChange={e => { setDealQuery(e.target.value); setForm(f => ({ ...f, dealId: '' })); }} style={inputStyle} placeholder="Поиск сделки…" />
            {dealQuery && !form.dealId && filteredDeals.length > 0 && (
              <div style={{ border: '1px solid var(--border-color)', borderRadius: 10, marginTop: 4, maxHeight: 160, overflow: 'auto' }}>
                {filteredDeals.map(d => (
                  <div key={d.id} onClick={() => { setForm(f => ({ ...f, dealId: d.id })); setDealQuery(d.name); }} style={{ padding: '8px 12px', cursor: 'pointer', fontSize: 13 }}>{d.name}</div>
                ))}
              </div>
            )}
            {form.dealId && <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>Выбрана: {deals.find(d => d.id === form.dealId)?.name ?? form.dealId} <span style={{ cursor: 'pointer', color: '#dc2626' }} onClick={() => { setForm(f => ({ ...f, dealId: '' })); setDealQuery(''); }}>✕</span></div>}
          </div>
        </div>

        {error && <div style={{ marginTop: 14, padding: '10px 14px', borderRadius: 10, background: '#fee2e2', color: '#dc2626', fontSize: 13 }}>{error}</div>}

        <div style={{ display: 'flex', gap: 10, marginTop: 20, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
          <button type="button" onClick={onClose} style={btnSecondary}>Отмена</button>
          <button type="button" onClick={submit} disabled={submitting} style={{ ...btnPrimary, opacity: submitting ? 0.6 : 1 }}>{submitting ? 'Отправка в СДЭК…' : 'Создать накладную'}</button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Страница «Логистика»
// ---------------------------------------------------------------------------
export function Logistics() {
  const [shipments, setShipments] = useState<CdekShipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [pluginActive, setPluginActive] = useState<boolean | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [details, setDetails] = useState<Record<string, any>>({});
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('');

  useEffect(() => {
    load();
    api.cdekPlugin.get().then(d => setPluginActive(!!d.isActive)).catch(() => setPluginActive(false));
  }, []);

  async function load() {
    setLoading(true);
    try {
      const list = await api.cdek.shipments();
      setShipments(list ?? []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function refresh(id: string) {
    setBusyId(id);
    try {
      const updated = await api.cdek.refreshShipment(id);
      setShipments(list => list.map(s => s.id === id ? { ...s, ...updated } : s));
    } catch (e: any) {
      setError(e.data?.error ?? e.message);
    } finally {
      setBusyId(null);
    }
  }

  async function remove(s: CdekShipment) {
    if (!window.confirm(`Удалить отправление ${s.cdekNumber ?? s.imNumber}? Заказ будет аннулирован в СДЭК (если возможно).`)) return;
    setBusyId(s.id);
    try {
      await api.cdek.deleteShipment(s.id);
      setShipments(list => list.filter(x => x.id !== s.id));
    } catch (e: any) {
      setError(e.data?.error ?? e.message);
    } finally {
      setBusyId(null);
    }
  }

  async function openDetails(id: string) {
    try {
      const d = await api.cdek.shipment(id);
      setDetails(prev => ({ ...prev, [id]: d }));
    } catch { /* оставим сводку из списка */ }
  }

  const filtered = shipments.filter(s =>
    !filter || [s.imNumber, s.cdekNumber, s.recipientName, s.toCity, s.statusName].filter(Boolean).join(' ').toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 0 40px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 24 }}>Логистика</h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-secondary)' }}>Отправления СДЭК: регистрация накладных, трекинг, квитанции</p>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button onClick={load} style={btnSecondary}>Обновить</button>
          <button onClick={() => setShowForm(true)} style={btnPrimary} disabled={pluginActive === false}>Новая отправка</button>
        </div>
      </div>

      {pluginActive === false && (
        <div style={{ ...card, marginBottom: 16, background: '#fef3c7', borderColor: '#f59e0b', color: '#92400e', fontSize: 14 }}>
          Интеграция CDEK не активна. Включите её и укажите учётные данные в <Link to="/settings?tab=integrations&plugin=cdek" style={{ color: 'inherit', fontWeight: 600 }}>Настройки → Интеграции → CDEK</Link>.
        </div>
      )}
      {error && <div style={{ ...card, marginBottom: 16, background: '#fee2e2', color: '#dc2626', fontSize: 13 }}>{error} <span style={{ cursor: 'pointer', float: 'right' }} onClick={() => setError('')}>✕</span></div>}

      <div style={card}>
        <input value={filter} onChange={e => setFilter(e.target.value)} placeholder="Поиск: номер, получатель, город, статус…" style={{ ...inputStyle, marginBottom: 14, maxWidth: 420 }} />
        {loading ? (
          <div style={{ padding: 30, textAlign: 'center', color: 'var(--text-secondary)' }}>Загрузка…</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 30, textAlign: 'center', color: 'var(--text-secondary)' }}>
            {shipments.length === 0 ? 'Отправлений пока нет. Создайте первое накладную кнопкой «Новая отправка».' : 'Ничего не найдено по фильтру.'}
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr style={{ textAlign: 'left', color: 'var(--text-secondary)', fontSize: 12 }}>
                  <th style={{ padding: '8px 10px' }}>Номер</th>
                  <th style={{ padding: '8px 10px' }}>Получатель</th>
                  <th style={{ padding: '8px 10px' }}>Маршрут</th>
                  <th style={{ padding: '8px 10px' }}>Тариф</th>
                  <th style={{ padding: '8px 10px' }}>Стоимость</th>
                  <th style={{ padding: '8px 10px' }}>Статус</th>
                  <th style={{ padding: '8px 10px' }}></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(s => (
                  <Fragment key={s.id}>
                    <tr key={s.id} style={{ borderTop: '1px solid var(--border-color)', cursor: 'pointer' }}
                      onClick={() => { setExpanded(expanded === s.id ? null : s.id); openDetails(s.id); }}>
                      <td style={{ padding: '10px' }}>
                        <div style={{ fontWeight: 600 }}>{s.cdekNumber ?? '—'}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>ИМ: {s.imNumber}</div>
                      </td>
                      <td style={{ padding: '10px' }}>
                        <div>{s.recipientName}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{s.recipientPhone}</div>
                      </td>
                      <td style={{ padding: '10px' }}>
                        <div>{s.fromCity ? `${s.fromCity} → ` : ''}{s.toCity}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{s.deliveryMode === 'warehouse' ? `ПВЗ ${s.deliveryPointCode ?? ''}` : s.toAddress}</div>
                      </td>
                      <td style={{ padding: '10px' }}>{s.tariffCode}</td>
                      <td style={{ padding: '10px' }}>{fmtMoney(s.deliverySum)}</td>
                      <td style={{ padding: '10px' }}>
                        <span style={statusStyle(s.statusCode)}>{s.statusName ?? (s.statusCode ? (STATUS_NAMES[s.statusCode] ?? `Статус ${s.statusCode}`) : (s.requestState ?? 'Обработка'))}</span>
                        {s.lastError && <div style={{ fontSize: 11, color: '#dc2626', maxWidth: 220 }}>{s.lastError}</div>}
                      </td>
                      <td style={{ padding: '10px', whiteSpace: 'nowrap' }} onClick={e => e.stopPropagation()}>
                        <button title="Обновить статус" disabled={busyId === s.id} onClick={() => refresh(s.id)} style={{ ...btnSecondary, padding: '6px 10px', fontSize: 12, marginRight: 6 }}>↻</button>
                        {s.uuid && <button title="Квитанция (PDF)" onClick={() => api.cdek.label(s.id, `cdek-${s.cdekNumber ?? s.imNumber}.pdf`).catch(e => setError(e.message))} style={{ ...btnSecondary, padding: '6px 10px', fontSize: 12, marginRight: 6 }}>🏷</button>}
                        <button title="Удалить" disabled={busyId === s.id} onClick={() => remove(s)} style={{ ...btnDanger, padding: '6px 10px', fontSize: 12 }}>✕</button>
                      </td>
                    </tr>
                    {expanded === s.id && (
                      <tr>
                        <td colSpan={7} style={{ padding: '14px 10px', background: 'var(--bg-secondary)', fontSize: 13 }}>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
                            <div>
                              <div style={{ fontWeight: 600, marginBottom: 6 }}>Отправление</div>
                              <div>UUID: {s.uuid ?? '—'}</div>
                              <div>Вес: {(s.weightGrams / 1000).toLocaleString('ru-RU')} кг{s.lengthCm ? `, ${s.lengthCm}×${s.widthCm ?? '?'}×${s.heightCm ?? '?'} см` : ''}</div>
                              {s.codAmount > 0 && <div>Наложенный платёж: {fmtMoney(s.codAmount)}</div>}
                              {s.declaredValue > 0 && <div>Объявленная стоимость: {fmtMoney(s.declaredValue)}</div>}
                              {s.comment && <div>Комментарий: {s.comment}</div>}
                              {s.deal && <div>Сделка: <Link to={`/deals/${s.deal.id}`} style={{ color: 'var(--accent)' }}>{s.deal.name}</Link></div>}
                              {s.contact && <div>Контакт: <Link to={`/contacts/${s.contact.id}`} style={{ color: 'var(--accent)' }}>{s.contact.name}</Link></div>}
                              {s.cdekNumber && <div><a href={`https://www.cdek.ru/ru/tracking/?order_id=${s.cdekNumber}`} target="_blank" rel="noreferrer" style={{ color: 'var(--accent)' }}>Отследить на cdek.ru ↗</a></div>}
                            </div>
                            <div>
                              <div style={{ fontWeight: 600, marginBottom: 6 }}>История статусов</div>
                              {(details[s.id]?.statusHistory ?? []).length === 0
                                ? <div style={{ color: 'var(--text-secondary)' }}>Нет данных — нажмите «Обновить статус».</div>
                                : (
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                    {[...(details[s.id]?.statusHistory ?? [])].reverse().map((h: any, i: number) => (
                                      <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'baseline' }}>
                                        <span style={{ color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>{h.dateTime ? fmtDate(h.dateTime) : ''}</span>
                                        <span style={statusStyle(h.code)}>{h.name || (STATUS_NAMES[h.code] ?? h.code)}</span>
                                        {h.city && <span style={{ color: 'var(--text-secondary)' }}>{h.city}</span>}
                                      </div>
                                    ))}
                                  </div>
                                )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showForm && (
        <ShipmentForm
          onClose={() => setShowForm(false)}
          onCreated={(s) => { setShipments(list => [s, ...list]); load(); }}
        />
      )}
    </div>
  );
}
