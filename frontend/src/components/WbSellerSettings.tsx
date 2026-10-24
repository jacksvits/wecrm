import { useEffect, useState } from 'react';
import { api } from '../api/client';

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

const labelStyle: React.CSSProperties = { fontSize: 13, fontWeight: 600, marginBottom: 6, marginTop: 16, display: 'block' };
const inputStyle: React.CSSProperties = { width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid var(--border, #d1d5db)', background: '#fff', fontSize: 14 };
const btnPrimary: React.CSSProperties = { padding: '10px 16px', borderRadius: 10, border: 'none', background: 'var(--accent, #111827)', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer' };
const btnOutline: React.CSSProperties = { ...btnPrimary, background: 'transparent', color: 'var(--accent, #111827)', border: '1px solid var(--border, #d1d5db)' };

export default function WbSellerSettings() {
  const [form, setForm] = useState({
    apiKey: '',
    autoSync: true,
    // Режимы синхронизации (направление) для товаров, цен и остатков
    productsMode: 'from_wb' as 'to_wb' | 'from_wb',
    pricesMode: 'from_wb' as 'to_wb' | 'from_wb',
    stocksMode: 'from_wb' as 'to_wb' | 'from_wb',
    // Расписание: независимые интервалы товаров/цен/остатков (минуты)
    productsIntervalMinutes: 60, pricesIntervalMinutes: 60, stocksIntervalMinutes: 60,
    // Предмет WB по умолчанию (для создания карточек «В WB»)
    defaultSubjectId: null as number | null,
    // Целевой склад CRM для остатков из кабинета (NULL — первый активный)
    stockWarehouseId: null as string | null,
  });
  // Склады CRM — для выбора целевого склада остатков из кабинета WB
  const [warehouses, setWarehouses] = useState<any[]>([]);
  // Дерево предметов WB (категорий) — для выбора предмета по умолчанию
  const [subjects, setSubjects] = useState<any[]>([]);
  const [subjectsLoaded, setSubjectsLoaded] = useState(false);
  const [active, setActive] = useState(false);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [testing, setTesting] = useState(false);
  const [stats, setStats] = useState<any>(null);

  const flash = (text: string, isErr = false) => { setMsg(isErr ? '' : text); setErr(isErr ? text : ''); setTimeout(() => { setMsg(''); setErr(''); }, 20000); };

  useEffect(() => { load(); }, []);

  // Список складов CRM для селекта «Склад для остатков из WB»
  useEffect(() => {
    api.products.warehouses.list()
      .then((list: any[]) => setWarehouses((list || []).filter((w: any) => w.isActive)))
      .catch(() => {});
  }, []);

  const load = async () => {
    try {
      const s = await api.wbPlugin.get();
      setActive(!!s.isActive);
      setStats(s);
      setForm({
        apiKey: '',
        autoSync: s.autoSync ?? true,
        productsMode: s.productsMode === 'to_wb' ? 'to_wb' : 'from_wb',
        pricesMode: s.pricesMode === 'to_wb' ? 'to_wb' : 'from_wb',
        stocksMode: s.stocksMode === 'to_wb' ? 'to_wb' : 'from_wb',
        productsIntervalMinutes: s.productsIntervalMinutes || 60,
        pricesIntervalMinutes: s.pricesIntervalMinutes || 60,
        stocksIntervalMinutes: s.stocksIntervalMinutes || 60,
        defaultSubjectId: s.defaultSubjectId ?? null,
        stockWarehouseId: s.stockWarehouseId ?? null,
      });
    } catch (e: any) { flash(e.message || 'Ошибка загрузки', true); }
  };

  // Дерево предметов WB — грузим лениво, при первом раскрытии блока «В WB»
  const loadSubjects = async () => {
    if (subjectsLoaded || subjects.length) return;
    try {
      const list = await api.wbPlugin.subjects();
      setSubjects(Array.isArray(list) ? list : []);
      setSubjectsLoaded(true);
    } catch (e: any) { flash(e.message || 'Не удалось загрузить предметы WB', true); }
  };

  const save = async () => {
    setSaving(true);
    try {
      const r: any = await api.wbPlugin.save({
        apiKey: form.apiKey || undefined,
        autoSync: form.autoSync,
        defaultSubjectId: form.defaultSubjectId,
        productsMode: form.productsMode,
        pricesMode: form.pricesMode,
        stocksMode: form.stocksMode,
        productsIntervalMinutes: form.productsIntervalMinutes,
        pricesIntervalMinutes: form.pricesIntervalMinutes,
        stocksIntervalMinutes: form.stocksIntervalMinutes,
        stockWarehouseId: form.stockWarehouseId,
      });
      setActive(!!r.isActive);
      setForm({ ...form, apiKey: '' });
      flash('Настройки сохранены');
      await load();
    } catch (e: any) { flash(e.message || 'Ошибка сохранения', true); }
    finally { setSaving(false); }
  };

  const test = async () => {
    setTesting(true);
    try {
      await save();
      const r: any = await api.wbPlugin.test();
      flash(`Подключение успешно. Складов WB: ${(r.warehouses || []).length}${(r.warehouses || []).length ? ' — ' + r.warehouses.map((w: any) => w.name || w.id).join(', ') : ''}`);
    } catch (e: any) { flash(e.message || 'Ошибка подключения', true); }
    finally { setTesting(false); }
  };

  const sync = async () => {
    if (!confirm('Запустить полную синхронизацию с WB Seller (товары, цены и остатки — по настроенным режимам)?')) return;
    setSyncing(true);
    try {
      const r: any = await api.wbPlugin.sync();
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
    } catch (e: any) { flash(e.message || 'Ошибка синхронизации', true); }
    finally { setSyncing(false); }
  };

  const doImport = async () => {
    if (!confirm('Импортировать каталог WB в номенклатуру CRM? Новые карточки станут позициями, существующие — привяжутся по артикулу.')) return;
    setImporting(true);
    try {
      const r: any = await api.wbPlugin.import();
      flash(`Импорт завершён: создано ${r.created}, привязано ${r.linked}, пропущено ${r.skipped}${r.errors?.length ? '\n' + r.errors.slice(0, 5).join('\n') : ''}`, !!r.errors?.length);
      await load();
    } catch (e: any) { flash(e.message || 'Ошибка импорта', true); }
    finally { setImporting(false); }
  };

  return (
    <div style={{ maxWidth: 560 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>WB Seller</h2>
        <StatusBadge isActive={active} />
      </div>
      <p style={{ margin: '0 0 8px', color: 'var(--text-muted, #6b7280)', fontSize: 13 }}>
        Интеграция с маркетплейсом Wildberries: карточки, цены и остатки синхронизируются по настроенным режимам
        («В WB» — из CRM в кабинет, «С WB» — из кабинета в складской учёт CRM).
      </p>

      <label style={labelStyle}>API-ключ WB</label>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <input
          type="password"
          value={form.apiKey}
          onChange={e => setForm({ ...form, apiKey: e.target.value })}
          placeholder={stats?.apiKeySet ? '•••••••• (установлен)' : 'Ключ из раздела «Настройки → API» кабинета WB'}
          style={{ ...inputStyle, flex: 1, minWidth: 220 }}
        />
        <button onClick={test} disabled={testing || saving} style={{ ...btnOutline, opacity: testing || saving ? 0.6 : 1 }}>
          {testing ? 'Проверка…' : 'Проверить подключение'}
        </button>
      </div>

      <div style={{ marginTop: 16 }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={form.autoSync}
            onChange={e => setForm({ ...form, autoSync: e.target.checked })}
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
          ['Товары', 'productsMode', '«В WB» — создавать карточки в кабинете (нужен предмет по умолчанию) и привязывать существующие.', '«С WB» — импортировать карточки из кабинета в номенклатуру CRM.'],
          ['Цены', 'pricesMode', '«В WB» — выгружать цены из CRM (вид «WB», иначе розничный).', '«С WB» — читать цены из кабинета и записывать в CRM в вид цен «WB» (иначе розничный).'],
          ['Остатки', 'stocksMode', '«В WB» — выгружать остатки складского учёта в кабинет.', '«С WB» — читать остатки из кабинета и записывать в складской учёт CRM.'],
        ] as const).map(([label, field, toHint, fromHint]) => (
          <div key={field} style={{ marginTop: field === 'productsMode' ? 0 : 10 }}>
            <label style={{ ...labelStyle, marginTop: 0 }}>{label}</label>
            <select
              value={form[field]}
              onChange={e => setForm({ ...form, [field]: e.target.value === 'to_wb' ? 'to_wb' : 'from_wb' })}
              style={inputStyle}
            >
              <option value="to_wb">В WB</option>
              <option value="from_wb">С WB</option>
            </select>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
              {form[field] === 'to_wb' ? toHint : fromHint}
            </div>
          </div>
        ))}
        {form.productsMode === 'to_wb' && (
          <>
            <label style={{ ...labelStyle, marginTop: 10 }}>Предмет WB по умолчанию</label>
            <select
              value={form.defaultSubjectId ?? ''}
              onFocus={loadSubjects}
              onChange={e => setForm({ ...form, defaultSubjectId: e.target.value ? Number(e.target.value) : null })}
              style={inputStyle}
            >
              <option value="">— не выбран (создание карточек недоступно) —</option>
              {subjects.flatMap((parent: any) => {
                const children = (parent.children || []).map((c: any) => (
                  <option key={c.subjectId} value={c.subjectId}>{parent.subjectName} → {c.subjectName}</option>
                ));
                return children.length ? children : [<option key={parent.subjectId} value={parent.subjectId}>{parent.subjectName}</option>];
              })}
            </select>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
              Категория WB для новых карточек. Обязательные характеристики, которые невозможно заполнить из карточки CRM
              (например, бренд), перечислятся в ошибке синхронизации — их нужно будет заполнить вручную в кабинете WB.
            </div>
          </>
        )}
        {form.stocksMode === 'from_wb' && (
          <>
            <label style={{ ...labelStyle, marginTop: 10 }}>Склад для остатков из WB</label>
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
              Остатки из кабинета WB будут записываться на выбранный склад складского учёта.
            </div>
          </>
        )}
      </div>

      {msg && (
        <div style={{
          padding: '10px 14px', borderRadius: 10, fontSize: 13, whiteSpace: 'pre-line',
          background: 'rgba(34,197,94,0.12)', color: '#166534', border: '1px solid rgba(34,197,94,0.3)',
        }}>{msg}</div>
      )}
      {err && (
        <div style={{
          padding: '10px 14px', borderRadius: 10, fontSize: 13, whiteSpace: 'pre-line',
          background: 'rgba(239,68,68,0.12)', color: '#991b1b', border: '1px solid rgba(239,68,68,0.3)',
        }}>{err}</div>
      )}

      <div style={{ display: 'flex', gap: 8, marginTop: 16, flexWrap: 'wrap' }}>
        <button onClick={save} disabled={saving} style={{ ...btnPrimary, opacity: saving ? 0.6 : 1 }}>
          {saving ? 'Сохранение…' : 'Сохранить'}
        </button>
        <button onClick={sync} disabled={syncing || !active} style={{ ...btnOutline, opacity: syncing || !active ? 0.6 : 1 }}>
          {syncing ? 'Синхронизация…' : 'Синхронизировать сейчас'}
        </button>
        <button onClick={doImport} disabled={importing || !active} style={{ ...btnOutline, opacity: importing || !active ? 0.6 : 1 }}>
          {importing ? 'Импорт…' : 'Импортировать каталог'}
        </button>
      </div>

      {stats && (
        <div style={{
          marginTop: 20, padding: 14, borderRadius: 12, fontSize: 13,
          background: 'var(--surface, #f9fafb)', border: '1px solid var(--border, #e5e7eb)',
        }}>
          <div style={{ fontWeight: 700, marginBottom: 6 }}>Информация</div>
          <div>Товаров с отметкой «WB»: {stats.flaggedProducts ?? 0}</div>
          <div>Привязано карточек WB: {stats.syncedProducts ?? 0}</div>
          {stats.lastSyncAt && <div>Последняя синхронизация: {new Date(stats.lastSyncAt).toLocaleString('ru-RU')}</div>}
          {stats.lastSync && <div style={{ whiteSpace: 'pre-line', marginTop: 4 }}>Итог: {typeof stats.lastSync === 'string' ? stats.lastSync : JSON.stringify(stats.lastSync, null, 1)}</div>}
        </div>
      )}
    </div>
  );
}
