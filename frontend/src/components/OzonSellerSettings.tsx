import { useEffect, useState } from 'react';
import { api } from '../api/client';

// === Плагин «OZON Seller»: подключение и синхронизация каталога товаров с маркетплейсом OZON ===

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px 12px',
  borderRadius: 8,
  border: '1px solid var(--border-color)',
  background: 'var(--bg-input)',
  color: 'var(--text-primary)',
  fontSize: 13,
  outline: 'none',
};
const labelStyle: React.CSSProperties = { display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500 };
const btnPrimary: React.CSSProperties = { padding: '8px 16px', borderRadius: 10, background: '#005BFF', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 14 };
const btnSecondary: React.CSSProperties = { padding: '8px 16px', borderRadius: 10, border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-primary)', fontSize: 14, cursor: 'pointer' };

function StatusBadge({ isActive }: { isActive: boolean }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '4px 12px', borderRadius: 10, fontSize: 13, fontWeight: 600,
      background: isActive ? '#dcfce7' : '#fee2e2',
      color: isActive ? '#16a34a' : '#dc2626',
    }}>
      <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'currentColor' }} />
      {isActive ? 'Подключено' : 'Не подключено'}
    </span>
  );
}

export default function OzonSellerSettings() {
  const [settings, setSettings] = useState<any>(null);
  const [form, setForm] = useState({
    clientId: '', apiKey: '',
    defaultTypeId: null as number | null, autoSync: true,
    // Режимы синхронизации (направление) для товаров, цен и остатков
    productsMode: 'to_ozon' as 'to_ozon' | 'from_ozon',
    pricesMode: 'to_ozon' as 'to_ozon' | 'from_ozon',
    stocksMode: 'to_ozon' as 'to_ozon' | 'from_ozon',
    // Расписание: независимые интервалы товаров/цен/остатков (минуты)
    productsIntervalMinutes: 60, pricesIntervalMinutes: 60, stocksIntervalMinutes: 60,
    // Целевой склад CRM для остатков из кабинета (NULL — первый активный)
    stockWarehouseId: null as string | null,
  });
  // Склады CRM — для выбора целевого склада остатков из кабинета OZON
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [msg, setMsg] = useState('');
  const [isError, setIsError] = useState(false);
  // Дерево категорий OZON (категория → подкатегория → тип) — для выбора defaultTypeId
  const [catTree, setCatTree] = useState<any[]>([]);
  const [catPath, setCatPath] = useState<number[]>([]); // выбранные description_category_id по уровням

  const flash = (text: string, error = false) => {
    setMsg(text);
    setIsError(error);
    setTimeout(() => setMsg(''), 6000);
  };

  const load = async () => {
    try {
      const s = await api.ozonPlugin.get();
      setSettings(s);
      setForm({
        clientId: s.clientId || '', apiKey: '',
        defaultTypeId: s.defaultTypeId ?? null, autoSync: s.autoSync ?? true,
        productsMode: s.productsMode === 'from_ozon' ? 'from_ozon' : 'to_ozon',
        pricesMode: s.pricesMode === 'from_ozon' ? 'from_ozon' : 'to_ozon',
        stocksMode: s.stocksMode === 'from_ozon' ? 'from_ozon' : 'to_ozon',
        productsIntervalMinutes: s.productsIntervalMinutes || 60,
        pricesIntervalMinutes: s.pricesIntervalMinutes || 60,
        stocksIntervalMinutes: s.stocksIntervalMinutes || 60,
        stockWarehouseId: s.stockWarehouseId ?? null,
      });
    } catch (e: any) {
      flash(e.message || 'Ошибка загрузки настроек', true);
    }
  };

  useEffect(() => { load(); }, []);

  // Список складов CRM для селекта «Склад для остатков из OZON»
  useEffect(() => {
    api.products.warehouses.list()
      .then((list: any[]) => setWarehouses((list || []).filter((w: any) => w.isActive)))
      .catch(() => {});
  }, []);

  // Дерево категорий OZON: грузим только когда плагин подключён (нужен API-ключ)
  useEffect(() => {
    if (!settings?.isActive) return;
    api.ozonPlugin.categories().then((r: any) => {
      const tree = r.items || [];
      setCatTree(tree);
      // восстанавливаем путь уже сохранённой категории — ищем лист с type_id
      if (settings?.defaultTypeId) {
        const walk = (nodes: any[], trail: number[]): boolean => {
          for (const n of nodes) {
            const t = [...trail, n.type_id ?? n.description_category_id];
            if (n.type_id && n.type_id === settings.defaultTypeId) { setCatPath(t); return true; }
            if (n.children?.length && walk(n.children, t)) return true;
          }
          return false;
        };
        walk(tree, []);
      }
    }).catch(() => {});
  }, [settings?.isActive]);

  // Варианты селекта уровня idx: дети узла, выбранного на предыдущем уровне (корень — всё дерево).
  // Группы имеют description_category_id и children; конечные типы — type_id (именно он нужен для создания товара в OZON).
  const catLevelOptions = (idx: number): any[] => {
    let nodes = catTree;
    for (let i = 0; i < idx; i++) {
      const cur = nodes.find((n) => (n.type_id ?? n.description_category_id) === catPath[i]);
      nodes = cur?.children || [];
    }
    return nodes;
  };

  const pickCatLevel = (idx: number, raw: string) => {
    const next = catPath.slice(0, idx);
    let leafId: number | null = null;
    if (raw.startsWith('g:')) {
      next.push(Number(raw.slice(2))); // группа — только навигация, не значение
    } else if (raw !== '') {
      leafId = Number(raw); // лист — type_id
      next.push(leafId);
    }
    setCatPath(next);
    setForm({ ...form, defaultTypeId: leafId });
  };

  const save = async () => {
    if (!form.clientId.trim()) { flash('Укажите Client-Id', true); return; }
    setSaving(true);
    try {
      const res: any = await api.ozonPlugin.save({
        clientId: form.clientId.trim(),
        apiKey: form.apiKey || undefined,
        autoSync: form.autoSync,
        defaultTypeId: form.defaultTypeId,
        productsMode: form.productsMode,
        pricesMode: form.pricesMode,
        stocksMode: form.stocksMode,
        productsIntervalMinutes: form.productsIntervalMinutes,
        pricesIntervalMinutes: form.pricesIntervalMinutes,
        stocksIntervalMinutes: form.stocksIntervalMinutes,
        stockWarehouseId: form.stockWarehouseId,
      });
      setSettings((prev: any) => ({ ...prev, ...res }));
      flash(res.isActive
        ? 'Подключение сохранено. Связь с OZON Seller установлена.'
        : `Сохранено, но подключение не удалось: ${res.error || 'проверьте Client-Id и API-ключ'}`, !res.isActive);
      await load();
    } catch (e: any) {
      flash(e.message || 'Ошибка сохранения', true);
    } finally {
      setSaving(false);
    }
  };

  const sync = async () => {
    if (!confirm('Запустить полную синхронизацию с OZON Seller (товары, цены и остатки — по настроенным режимам)?')) return;
    setSyncing(true);
    try {
      const r: any = await api.ozonPlugin.sync();
      // Итог по блокам: товары / цены / остатки, каждый — в своём направлении (режимы из настроек)
      const block = (name: string, s: any) => {
        if (!s) return `${name}: —`;
        if (s.error) return `${name}: ошибка — ${s.error}`;
        const parts: string[] = [];
        if (s.created != null) parts.push(`создано ${s.created}`);
        if (s.linked != null) parts.push(`привязано ${s.linked}`);
        if (s.updated != null) parts.push(`обновлено ${s.updated}`);
        if (s.skipped != null) parts.push(`без изменений ${s.skipped}`);
        if (s.failed != null) parts.push(`ошибок ${s.failed}`);
        return `${name}: ${parts.join(', ') || 'ok'}`;
      };
      const lines = [block('Товары', r.products), block('Цены', r.prices), block('Остатки', r.stocks)];
      const anyError = [r.products, r.prices, r.stocks].some((s: any) => s?.error || s?.failed > 0);
      const firstErrors = [r.products, r.prices, r.stocks].flatMap((s: any) => s?.errors || []).slice(0, 5);
      flash(lines.join('\n') + (firstErrors.length ? '\n' + firstErrors.join('\n') : ''), anyError);
      await load();
    } catch (e: any) {
      flash(e.message || 'Ошибка синхронизации', true);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ fontSize: 15, fontWeight: 600 }}>Подключение к OZON Seller API</div>
        <StatusBadge isActive={!!settings?.isActive} />
      </div>

      <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
        Ключи создаются в личном кабинете OZON Seller: Настройки → API-ключи. Товары выгружаются в маркетплейс только
        из карточек позиций с отметкой «OZON Seller» (Склад → Номенклатура).
      </div>

      <div>
        <label style={labelStyle}>Client-Id</label>
        <input
          value={form.clientId}
          onChange={e => setForm({ ...form, clientId: e.target.value })}
          placeholder="Например: 123456"
          style={inputStyle}
        />
      </div>

      <div>
        <label style={labelStyle}>
          API-ключ {settings?.apiKeySet && <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(установлен — оставьте пустым, чтобы не менять)</span>}
        </label>
        <input
          type="password"
          value={form.apiKey}
          onChange={e => setForm({ ...form, apiKey: e.target.value })}
          placeholder={settings?.apiKeySet ? '••••••••' : 'API-ключ из кабинета OZON Seller'}
          style={inputStyle}
        />
      </div>

      <div>
        <label style={labelStyle}>
          Категория OZON по умолчанию <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(обязательна для создания новых товаров)</span>
        </label>
        {!settings?.isActive ? (
          <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Сначала подключите интеграцию — категории загружаются из OZON</div>
        ) : catTree.length === 0 ? (
          <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Загрузка категорий...</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {catPath.map((sel, idx) => (
              <select
                key={idx}
                value={String(sel)}
                onChange={e => pickCatLevel(idx, e.target.value)}
                style={inputStyle}
              >
                <option value="">— Выберите —</option>
                {catLevelOptions(idx).map((n: any) => (
                  <option key={n.type_id ?? n.description_category_id} value={n.type_id ? String(n.type_id) : `g:${n.description_category_id}`} disabled={n.disabled}>
                    {n.type_name ?? n.category_name}
                  </option>
                ))}
              </select>
            ))}
            {catLevelOptions(catPath.length).length > 0 && (
              <select
                value=""
                onChange={e => pickCatLevel(catPath.length, e.target.value)}
                style={inputStyle}
              >
                <option value="">— Выберите —</option>
                {catLevelOptions(catPath.length).map((n: any) => (
                  <option key={n.type_id ?? n.description_category_id} value={n.type_id ? String(n.type_id) : `g:${n.description_category_id}`} disabled={n.disabled}>
                    {n.type_name ?? n.category_name}
                  </option>
                ))}
              </select>
            )}
          </div>
        )}
      </div>

      <div>
        <label style={{ ...labelStyle, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={form.autoSync}
            onChange={e => setForm({ ...form, autoSync: e.target.checked })}
            style={{ width: 16, height: 16 }}
          />
          Авто синхронизация
        </label>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: -6 }}>
          Когда включено, товары, цены и остатки синхронизируются автоматически по расписанию (каждый блок — по своему интервалу).
          Когда выключено — только вручную, кнопкой «Синхронизировать сейчас».
        </div>
        <label style={labelStyle}>Интервалы автообновления, мин</label>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {([
            ['Товары', 'productsIntervalMinutes'],
            ['Цены', 'pricesIntervalMinutes'],
            ['Остатки', 'stocksIntervalMinutes'],
          ] as const).map(([label, field]) => (
            <label key={field} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
              {label}
              <input
                type="number"
                min={5}
                max={1440}
                value={form[field]}
                onChange={e => setForm({ ...form, [field]: Number(e.target.value) })}
                disabled={!form.autoSync}
                style={{ ...inputStyle, maxWidth: 90, opacity: form.autoSync ? 1 : 0.5 }}
              />
            </label>
          ))}
        </div>
      </div>

      <div>
        <label style={labelStyle}>Режимы синхронизации</label>
        {([
          ['Товары', 'productsMode', '«В Озон» — создавать и обновлять карточки в кабинете.', '«С Озона» — импортировать карточки из кабинета в CRM.'],
          ['Цены', 'pricesMode', '«В Озон» — выгружать цены из CRM (вид «Ozon», иначе розничный).', '«С Озона» — читать цены из кабинета и записывать в CRM в вид цен «Ozon» (иначе розничный).'],
          ['Остатки', 'stocksMode', '«В Озон» — выгружать остатки складского учёта в кабинет.', '«С Озона» — читать остатки из кабинета и записывать в складской учёт CRM.'],
        ] as const).map(([label, field, toHint, fromHint]) => (
          <div key={field} style={{ marginTop: field === 'productsMode' ? 0 : 10 }}>
            <label style={{ ...labelStyle, marginTop: 0 }}>{label}</label>
            <select
              value={form[field]}
              onChange={e => setForm({ ...form, [field]: e.target.value === 'from_ozon' ? 'from_ozon' : 'to_ozon' })}
              style={inputStyle}
            >
              <option value="to_ozon">В Озон</option>
              <option value="from_ozon">С Озона</option>
            </select>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
              {form[field] === 'to_ozon' ? toHint : fromHint}
            </div>
          </div>
        ))}
        {form.stocksMode === 'from_ozon' && (
          <>
            <label style={{ ...labelStyle, marginTop: 10 }}>Склад для остатков из OZON</label>
            <select
              value={form.stockWarehouseId ?? ''}
              onChange={e => setForm({ ...form, stockWarehouseId: e.target.value || null })}
              style={inputStyle}
            >
              <option value="">Первый активный склад (по умолчанию)</option>
              {warehouses.map((w: any) => (
                <option key={w.id} value={w.id}>{w.name}</option>
              ))}
            </select>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
              Остатки из кабинета OZON будут записываться на выбранный склад складского учёта.
            </div>
          </>
        )}
      </div>

      {msg && (
        <div style={{
          padding: '10px 14px', borderRadius: 10, fontSize: 13, whiteSpace: 'pre-line',
          background: isError ? '#fef2f2' : '#f0fdf4',
          color: isError ? '#dc2626' : '#16a34a',
          border: `1px solid ${isError ? '#fecaca' : '#bbf7d0'}`,
        }}>
          {msg}
        </div>
      )}

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <button onClick={save} disabled={saving} style={{ ...btnPrimary, opacity: saving ? 0.6 : 1 }}>
          {saving ? 'Сохранение...' : 'Сохранить и проверить'}
        </button>
        <button onClick={sync} disabled={syncing || !settings?.isActive} style={{ ...btnSecondary, opacity: (syncing || !settings?.isActive) ? 0.5 : 1 }}>
          {syncing ? 'Синхронизация...' : 'Синхронизировать сейчас'}
        </button>
      </div>

      {settings && (
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12,
          padding: 14, borderRadius: 12, background: 'var(--bg-hover)', fontSize: 13,
        }}>
          <div>
            <div style={{ color: 'var(--text-muted)', marginBottom: 4 }}>Товаров с отметкой «OZON»</div>
            <div style={{ fontWeight: 700, fontSize: 18 }}>{settings.flagged ?? 0}</div>
          </div>
          <div>
            <div style={{ color: 'var(--text-muted)', marginBottom: 4 }}>Выгружено в OZON</div>
            <div style={{ fontWeight: 700, fontSize: 18 }}>{settings.synced ?? 0}</div>
          </div>
          <div>
            <div style={{ color: 'var(--text-muted)', marginBottom: 4 }}>Последняя синхронизация</div>
            <div style={{ fontWeight: 600 }}>
              {settings.lastSyncAt ? new Date(settings.lastSyncAt).toLocaleString('ru-RU') : '—'}
            </div>
          </div>
          {settings.lastSync && (
            <div>
              <div style={{ color: 'var(--text-muted)', marginBottom: 4 }}>Результат</div>
              <div style={{ fontWeight: 600 }}>
                создано {settings.lastSync.created}, обновлено {settings.lastSync.updated}, ошибок {settings.lastSync.failed}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
