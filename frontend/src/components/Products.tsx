import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { format } from 'date-fns';
import { api } from '../api/client';
import { Product, ProductCategory, Warehouse, PriceType, StockMovement, PriceHistory } from '../types';

const quillModules = {
  toolbar: [
    ['bold', 'italic', 'underline', 'strike'],
    [{ list: 'ordered' }, { list: 'bullet' }],
    ['link'],
    ['clean'],
  ],
};
const quillFormats = ['bold', 'italic', 'underline', 'strike', 'list', 'bullet', 'link'];

const TABS = [
  { key: 'nomenclature', label: 'Номенклатура' },
  { key: 'stock', label: 'Склад' },
  { key: 'prices', label: 'Цены' },
  { key: 'reserves', label: 'Резервы' },
];

const KIND_LABELS: Record<string, string> = { product: 'Товар', service: 'Услуга' };
const KIND_COLORS: Record<string, string> = { product: '#dbeafe', service: '#ede9fe' };

const fmtMoney = (v: number) => new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 2 }).format(v);
const inputStyle: React.CSSProperties = { padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-primary)', width: '100%', boxSizing: 'border-box' };
const btnPrimary: React.CSSProperties = { padding: '8px 16px', borderRadius: 12, border: 'none', background: '#1a1a1a', color: '#fff', fontSize: 14, fontWeight: 500, cursor: 'pointer' };
const btnGhost: React.CSSProperties = { padding: '6px 12px', borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-primary)', cursor: 'pointer', fontSize: 13 };
const thStyle: React.CSSProperties = { textAlign: 'left', padding: '10px 12px', fontSize: 12, color: 'var(--text-muted)', fontWeight: 500, borderBottom: '1px solid var(--border-color)', whiteSpace: 'nowrap' };
const tdStyle: React.CSSProperties = { padding: '10px 12px', fontSize: 14, borderBottom: '1px solid var(--border-color)' };
const overlayStyle: React.CSSProperties = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 };

interface CategoryNode { key: string; name: string; children: CategoryNode[]; products: Product[]; }

export function Products() {
  const [tab, setTab] = useState('nomenclature');
  const [products, setProducts] = useState<Product[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [priceTypes, setPriceTypes] = useState<PriceType[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [q, setQ] = useState('');
  const [whFilter, setWhFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  // свёрнутые группы: ключ "cat:<id категории>"
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  // Категории из 1С (группы и виды номенклатуры) + выбранный узел дерева
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [selCat, setSelCat] = useState<string>('all'); // 'all' | 'none' | categoryId

  const [productModal, setProductModal] = useState<Product | 'new' | null>(null);
  const [movementModal, setMovementModal] = useState<{ product: Product; type: 'income' | 'outcome' } | null>(null);
  const [historyProduct, setHistoryProduct] = useState<Product | null>(null);
  const [whModal, setWhModal] = useState<Warehouse | 'new' | null>(null);
  const [ptModal, setPtModal] = useState<PriceType | 'new' | null>(null);
  const [editingCell, setEditingCell] = useState<{ productId: string; priceTypeId: string; value: string } | null>(null);
  const [vkBusy, setVkBusy] = useState<'import' | 'sync' | null>(null);

  // Массовый выбор позиций (удаление / перенос в категорию)
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkCat, setBulkCat] = useState('');
  const [bulkBusy, setBulkBusy] = useState(false);

  const importFromVk = async () => {
    if (!confirm('Импортировать все товары маркета группы ВК в проект? Позиции с совпадающим названием будут привязаны, не продублированы.')) return;
    setVkBusy('import');
    try {
      const r = await api.products.vkImport();
      alert(`Импорт завершён: создано ${r.created}, привязано ${r.linked}, пропущено ${r.skipped}${r.errors.length ? '\nОшибки:\n' + r.errors.slice(0, 10).join('\n') : ''}`);
      await load();
    } catch (e: any) {
      alert(e.message || 'Ошибка импорта из ВК');
    } finally { setVkBusy(null); }
  };

  const syncToVk = async () => {
    if (!confirm('Выгрузить все позиции с отметкой «ВК» в маркет группы ВКонтакте?')) return;
    setVkBusy('sync');
    try {
      const r = await api.products.vkSync();
      alert(`Синхронизация завершена: создано ${r.created}, обновлено ${r.updated}, ошибок ${r.failed}${r.errors.length ? '\n' + r.errors.slice(0, 10).join('\n') : ''}`);
      await load();
    } catch (e: any) {
      alert(e.message || 'Ошибка синхронизации с ВК');
    } finally { setVkBusy(null); }
  };

  const load = async () => {
    try {
      const [p, w, t, m, c] = await Promise.all([
        api.products.list(),
        api.products.warehouses.list(),
        api.products.priceTypes.list(),
        api.products.movements(),
        api.products.categories.list(),
      ]);
      setProducts(p);
      setWarehouses(w);
      setPriceTypes(t);
      setMovements(m);
      setCategories(c);
    } catch (e: any) {
      alert(e.message || 'Ошибка загрузки');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  // Фильтр по виду: все / товары / услуги
  const [kindFilter, setKindFilter] = useState<'all' | 'product' | 'service'>('all');
  // Фильтр «В наличии»: только позиции с суммарным остатком >= 1
  const [inStockOnly, setInStockOnly] = useState(false);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    let list = products;
    if (kindFilter !== 'all') list = list.filter(p => (p.kind || 'product') === kindFilter);
    if (inStockOnly) list = list.filter(p => (p.stocks || []).reduce((sum, x) => sum + x.quantity, 0) >= 1);
    if (!s) return list;
    return list.filter(p =>
      p.name.toLowerCase().includes(s) ||
      (p.sku || '').toLowerCase().includes(s) ||
      (p.category || '').toLowerCase().includes(s) ||
      (p.subcategory || '').toLowerCase().includes(s));
  }, [products, q, kindFilter, inStockOnly]);

  const searching = q.trim().length > 0;

  // Дерево категорий 1С (группы и виды номенклатуры): дети по родителю, отсортировано
  const catChildren = useMemo(() => {
    const m = new Map<string | null, ProductCategory[]>();
    for (const c of categories) {
      const list = m.get(c.parentId ?? null) ?? [];
      list.push(c);
      m.set(c.parentId ?? null, list);
    }
    for (const list of m.values()) list.sort((a, b) => a.name.localeCompare(b.name, 'ru'));
    return m;
  }, [categories]);

  // Все id узла-потомки (выбранная категория + вложенные)
  const catDescendants = useMemo(() => {
    const m = new Map<string, string[]>();
    const walk = (id: string): string[] => {
      if (m.has(id)) return m.get(id)!;
      const ids = [id];
      for (const ch of catChildren.get(id) ?? []) ids.push(...walk(ch.id));
      m.set(id, ids);
      return ids;
    };
    for (const c of categories) walk(c.id);
    return m;
  }, [categories, catChildren]);

  // Товары выбранной категории (с вложенными)
  const visible = useMemo(() => {
    if (selCat === 'all') return filtered;
    if (selCat === 'none') return filtered.filter(p => !p.categoryId);
    const ids = new Set(catDescendants.get(selCat) ?? [selCat]);
    return filtered.filter(p => p.categoryId && ids.has(p.categoryId));
  }, [filtered, selCat, catDescendants]);

  // Количество позиций по узлам дерева (с учётом поиска/фильтров вида и наличия)
  const countByCat = useMemo(() => {
    const m = new Map<string, number>();
    const byId = new Map(categories.map(c => [c.id, c]));
    for (const p of filtered) {
      let cur = p.categoryId ? byId.get(p.categoryId) : undefined;
      const guard = new Set<string>();
      while (cur && !guard.has(cur.id)) {
        guard.add(cur.id);
        m.set(cur.id, (m.get(cur.id) ?? 0) + 1);
        cur = cur.parentId ? byId.get(cur.parentId) : undefined;
      }
    }
    return m;
  }, [filtered, categories]);

  const toggleGroup = (key: string) => setExpanded(c => ({ ...c, [key]: !c[key] }));
  const isCollapsed = (key: string) => !searching && !expanded[key];

  // Рендер узла дерева категорий (как в «Виды и свойства» 1С: папки + виды)
  const renderCatNode = (c: ProductCategory, depth: number): ReactNode => {
    const key = `cat:${c.id}`;
    const collapsed = isCollapsed(key);
    const count = countByCat.get(c.id) ?? 0;
    const selected = selCat === c.id;
    return (
      <div key={c.id}>
        <div onClick={() => setSelCat(c.id)} style={{
          display: 'flex', alignItems: 'center', gap: 4,
          padding: `5px 8px 5px ${8 + depth * 18}px`, cursor: 'pointer', fontSize: 13,
          background: selected ? 'var(--bg-hover)' : 'transparent',
          fontWeight: c.isGroup ? 600 : 400,
          color: c.isGroup ? 'var(--text-primary)' : 'var(--text-muted)',
          borderLeft: selected ? '2px solid #007AFF' : '2px solid transparent',
        }}>
          {c.isGroup ? (
            <span onClick={(e) => { e.stopPropagation(); toggleGroup(key); }}
              style={{ width: 14, fontSize: 10, color: 'var(--text-muted)', transform: collapsed ? 'rotate(-90deg)' : 'none', transition: 'transform 0.15s' }}>▾</span>
          ) : <span style={{ width: 14 }} />}
          <span>{c.name}</span>
          <span style={{ marginLeft: 'auto', color: 'var(--text-muted)', fontSize: 12 }}>{count || ''}</span>
        </div>
        {!collapsed && (catChildren.get(c.id) ?? []).map(ch => renderCatNode(ch, depth + 1))}
      </div>
    );
  };

  // Сайдбар дерева категорий — общий для вкладок «Номенклатура», «Склад» и «Цены»
  const categorySidebar = (
    <div style={{ width: 280, flexShrink: 0, background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 12, padding: '8px 0', maxHeight: 'calc(100vh - 220px)', overflow: 'auto' }}>
      <div onClick={() => setSelCat('all')} style={{ display: 'flex', padding: '6px 8px', cursor: 'pointer', fontSize: 13, fontWeight: 600, background: selCat === 'all' ? 'var(--bg-hover)' : 'transparent', borderLeft: selCat === 'all' ? '2px solid #007AFF' : '2px solid transparent' }}>
        Все позиции
        <span style={{ marginLeft: 'auto', color: 'var(--text-muted)', fontWeight: 400, fontSize: 12 }}>{filtered.length}</span>
      </div>
      {(catChildren.get(null) ?? []).map(c => renderCatNode(c, 0))}
      <div onClick={() => setSelCat('none')} style={{ display: 'flex', padding: '6px 8px', cursor: 'pointer', fontSize: 13, color: 'var(--text-muted)', background: selCat === 'none' ? 'var(--bg-hover)' : 'transparent', borderLeft: selCat === 'none' ? '2px solid #007AFF' : '2px solid transparent' }}>
        Без категории
        <span style={{ marginLeft: 'auto', fontSize: 12 }}>{filtered.filter(p => !p.categoryId).length}</span>
      </div>
    </div>
  );

  const activePriceTypes = useMemo(() => priceTypes.filter(t => t.isActive), [priceTypes]);

  const totalStock = (p: Product) => (p.stocks || []).reduce((sum, s) => sum + s.quantity, 0);
  const priceOf = (p: Product, ptId: string) => (p.prices || []).find(x => x.priceTypeId === ptId)?.price;

  const toggleSelect = (id: string) => setSelected(prev => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });

  // Плоский список категорий с отступами по глубине (как в карточке товара)
  const categoryOptions = useMemo(() => {
    const out: { id: string; label: string }[] = [];
    const walk = (parentId: string | null, depth: number) => {
      for (const c of catChildren.get(parentId) ?? []) {
        out.push({ id: c.id, label: `${'— '.repeat(depth)}${c.name}` });
        walk(c.id, depth + 1);
      }
    };
    walk(null, 0);
    return out;
  }, [catChildren]);

  const bulkDelete = async () => {
    if (!confirm(`Удалить выбранные позиции (${selected.size})?`)) return;
    setBulkBusy(true);
    try {
      await api.products.bulkDelete([...selected]);
      setSelected(new Set());
      await load();
    } catch (e: any) {
      alert(e.message || 'Ошибка удаления');
    } finally {
      setBulkBusy(false);
    }
  };

  const bulkMove = async () => {
    setBulkBusy(true);
    try {
      await api.products.bulkCategory([...selected], bulkCat || null);
      setSelected(new Set());
      setBulkCat('');
      await load();
    } catch (e: any) {
      alert(e.message || 'Ошибка переноса');
    } finally {
      setBulkBusy(false);
    }
  };

  // Рекурсивный рендер узла дерева категорий (свёрнут по умолчанию)
  const countNode = (n: CategoryNode): number => n.products.length + n.children.reduce((s, c) => s + countNode(c), 0);
  const renderNode = (node: CategoryNode, depth: number): ReactNode[] => {
    const key = `cat:${node.key}`;
    const collapsed = isCollapsed(key);
    const rows: ReactNode[] = [
      <tr key={key} style={{ background: depth === 0 ? 'var(--bg-hover)' : 'transparent', cursor: 'pointer' }} onClick={() => toggleGroup(key)}>
        <td colSpan={5 + activePriceTypes.length} style={{
          ...tdStyle,
          fontWeight: depth === 0 ? 600 : 400,
          fontSize: depth === 0 ? 14 : 13,
          paddingLeft: 12 + depth * 24,
          color: depth === 0 ? 'var(--text-primary)' : 'var(--text-muted)',
        }}>
          <span style={{ display: 'inline-block', width: 20, transition: 'transform 0.15s', transform: collapsed ? 'rotate(-90deg)' : 'rotate(0deg)' }}>▾</span>
          {node.name}
          <span style={{ color: 'var(--text-muted)', fontWeight: 400, fontSize: 12, marginLeft: 8 }}>{countNode(node)}</span>
        </td>
      </tr>,
    ];
    if (!collapsed) {
      for (const child of node.children) rows.push(...renderNode(child, depth + 1));
      rows.push(...node.products.map(p => (
        <ProductRow
          key={p.id}
          p={p}
          indent={12 + (depth + 1) * 24 + 8}
          priceTypes={activePriceTypes}
          totalStock={totalStock(p)}
          priceOf={priceOf}
          onOpen={() => setProductModal(p)}
          onDelete={async () => {
            if (!confirm(`Удалить «${p.name}»?`)) return;
            try { await api.products.delete(p.id); await load(); } catch (e: any) { alert(e.message); }
          }}
          selected={selected.has(p.id)}
          onToggle={() => toggleSelect(p.id)}
        />
      )));
    }
    return rows;
  };

  const saveCell = async () => {
    if (!editingCell) return;
    const v = Number(editingCell.value.replace(',', '.'));
    if (Number.isFinite(v) && v >= 0) {
      try {
        await api.products.setPrice(editingCell.productId, editingCell.priceTypeId, v);
        await load();
      } catch (e: any) {
        alert(e.message || 'Ошибка сохранения цены');
      }
    }
    setEditingCell(null);
  };

  const visibleMovements = useMemo(() =>
    movements.filter(m => whFilter === 'all' || m.warehouseId === whFilter).slice(0, 50),
    [movements, whFilter]);

  // товары (не услуги) для складского учёта
  const stockProducts = useMemo(() => visible.filter(p => p.kind !== 'service'), [visible]);

  if (loading) return <div style={{ padding: 24 }}>Загрузка...</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 600 }}>Товары</h2>
        {tab === 'nomenclature' && (
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={importFromVk} disabled={!!vkBusy} title="Загрузить все товары маркета группы ВК в проект"
              style={{ ...btnGhost, borderColor: '#0077FF', color: '#0077FF' }}>
              {vkBusy === 'import' ? 'Импорт...' : '↓ Импорт из ВК'}
            </button>
            <button onClick={syncToVk} disabled={!!vkBusy} title="Выгрузить позиции с отметкой «ВК» в маркет группы"
              style={{ ...btnGhost, borderColor: '#0077FF', color: '#0077FF' }}>
              {vkBusy === 'sync' ? 'Синхронизация...' : '↑ Синхронизация ВК'}
            </button>
            <button onClick={() => setProductModal('new')} style={btnPrimary}>+ Позиция</button>
          </div>
        )}
        {tab === 'stock' && (
          <button onClick={() => setWhModal('new')} style={btnPrimary}>+ Склад</button>
        )}
        {tab === 'reserves' && <ReservesTab />}
        {tab === 'prices' && (
          <button onClick={() => setPtModal('new')} style={btnPrimary}>+ Вид цены</button>
        )}
      </div>

      <div style={{ display: 'flex', gap: 8, borderBottom: '1px solid var(--border-color)', marginBottom: 16 }}>
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              padding: '10px 16px', border: 'none',
              background: tab === t.key ? 'var(--bg-hover)' : 'transparent',
              color: tab === t.key ? '#007AFF' : 'var(--text-primary)',
              borderBottom: tab === t.key ? '2px solid #007AFF' : '2px solid transparent',
              cursor: 'pointer', fontSize: 14, fontWeight: 500, borderRadius: '8px 8px 0 0',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ===== Номенклатура ===== */}
      {tab === 'nomenclature' && (
        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
          {categorySidebar}
          <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 12, flexWrap: 'wrap' }}>
            <input
              value={q}
              onChange={e => setQ(e.target.value)}
              placeholder="Поиск: название, артикул, категория"
              style={{ ...inputStyle, maxWidth: 360 }}
            />
            {/* Фильтр: все / товары / услуги */}
            <div style={{ display: 'flex', border: '1px solid var(--border-color)', borderRadius: 10, overflow: 'hidden' }}>
              {([['all', 'Все'], ['product', 'Товары'], ['service', 'Услуги']] as const).map(([val, label]) => (
                <button
                  key={val}
                  onClick={() => setKindFilter(val)}
                  style={{
                    padding: '8px 16px',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: 13,
                    background: kindFilter === val ? 'var(--accent, #007AFF)' : 'transparent',
                    color: kindFilter === val ? '#fff' : 'var(--text-primary)',
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px', borderRadius: 10, border: '1px solid var(--border-color)', fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap', userSelect: 'none' }}>
              <input type="checkbox" checked={inStockOnly} onChange={e => setInStockOnly(e.target.checked)} />
              В наличии
            </label>
          </div>

          {/* Панель массовых действий */}
          {selected.size > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, padding: '8px 12px', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 12, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 14, fontWeight: 600 }}>Выбрано: {selected.size}</span>
              <select value={bulkCat} onChange={e => setBulkCat(e.target.value)} style={{ ...inputStyle, maxWidth: 280 }}>
                <option value="">— Без категории —</option>
                {categoryOptions.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
              </select>
              <button onClick={bulkMove} disabled={bulkBusy} style={{ ...btnPrimary, opacity: bulkBusy ? 0.6 : 1 }}>Перенести</button>
              <button onClick={bulkDelete} disabled={bulkBusy} style={{ ...btnPrimary, background: '#dc2626', opacity: bulkBusy ? 0.6 : 1 }}>Удалить</button>
              <button onClick={() => { setSelected(new Set()); setBulkCat(''); }} style={btnGhost}>Снять выбор</button>
            </div>
          )}
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 12, overflow: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={thStyle}>
                    <input
                      type="checkbox"
                      style={{ width: 15, height: 15, cursor: 'pointer' }}
                      checked={visible.length > 0 && visible.every(p => selected.has(p.id))}
                      onChange={e => setSelected(e.target.checked ? new Set(visible.map(p => p.id)) : new Set())}
                    />
                  </th>
                  <th style={thStyle}>Позиция</th>
                  <th style={thStyle}>Вид</th>
                  <th style={thStyle}>Ед.</th>
                  <th style={thStyle}>Остаток</th>
                  {activePriceTypes.map(t => <th key={t.id} style={thStyle}>{t.label}</th>)}
                  <th style={thStyle}></th>
                </tr>
              </thead>
              <tbody>
                {visible.map(p => (
                  <ProductRow
                    key={p.id}
                    p={p}
                    indent={12}
                    priceTypes={activePriceTypes}
                    totalStock={totalStock(p)}
                    priceOf={priceOf}
                    onOpen={() => setProductModal(p)}
                    onDelete={async () => {
                      if (!confirm(`Удалить «${p.name}»?`)) return;
                      try { await api.products.delete(p.id); await load(); } catch (e: any) { alert(e.message); }
                    }}
                    selected={selected.has(p.id)}
                    onToggle={() => toggleSelect(p.id)}
                  />
                ))}
                {visible.length === 0 && (
                  <tr>
                    <td colSpan={5 + activePriceTypes.length} style={{ ...tdStyle, textAlign: 'center', color: 'var(--text-muted)' }}>
                      Позиции не найдены
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          </div>
        </div>
      )}

      {/* ===== Склад ===== */}
      {tab === 'stock' && (
        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
          {categorySidebar}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <button
              onClick={() => setWhFilter('all')}
              style={{ ...btnGhost, background: whFilter === 'all' ? 'var(--bg-hover)' : 'var(--bg-card)', fontWeight: whFilter === 'all' ? 600 : 400 }}
            >
              Все склады
            </button>
            {warehouses.map(w => (
              <button
                key={w.id}
                onClick={() => setWhFilter(w.id)}
                style={{ ...btnGhost, background: whFilter === w.id ? 'var(--bg-hover)' : 'var(--bg-card)', fontWeight: whFilter === w.id ? 600 : 400 }}
              >
                {w.name}
              </button>
            ))}
            <span style={{ flex: 1 }} />
            <button onClick={() => setWhModal(warehouses.find(w => w.id === whFilter) || 'new')} style={btnGhost}>
              Управление складами
            </button>
          </div>

          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 12, overflow: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={thStyle}>Товар</th>
                  <th style={thStyle}>Склад</th>
                  <th style={thStyle}>Остаток</th>
                  <th style={thStyle}>Резерв</th>
                  <th style={thStyle}>Доступно</th>
                  <th style={thStyle}>Действия</th>
                </tr>
              </thead>
              <tbody>
                {stockProducts.flatMap(p => {
                  const rows = (p.stocks || [])
                    .filter(s => whFilter === 'all' || s.warehouseId === whFilter)
                    .map(s => {
                      const wh = warehouses.find(w => w.id === s.warehouseId);
                      return (
                        <tr key={s.id}>
                          <td style={tdStyle}>
                            <div style={{ fontWeight: 500 }}>{p.name}</div>
                            {p.sku && <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{p.sku}</div>}
                          </td>
                          <td style={tdStyle}>{wh?.name || '—'}</td>
                          <td style={tdStyle}>{fmtMoney(s.quantity)} {p.unit}</td>
                          <td style={tdStyle}>{fmtMoney(s.reserved)} {p.unit}</td>
                          <td style={{ ...tdStyle, fontWeight: 600 }}>{fmtMoney(s.quantity - s.reserved)} {p.unit}</td>
                          <td style={{ ...tdStyle, whiteSpace: 'nowrap' }}>
                            <button
                              style={{ ...btnGhost, marginRight: 8, color: '#059669' }}
                              onClick={() => setMovementModal({ product: p, type: 'income' })}
                            >
                              Приход
                            </button>
                            <button
                              style={{ ...btnGhost, color: '#dc2626' }}
                              onClick={() => setMovementModal({ product: p, type: 'outcome' })}
                            >
                              Расход
                            </button>
                          </td>
                        </tr>
                      );
                    });
                  // товары без остатков тоже показываем с нулями — иначе часть каталога невидима в складской вкладке
                  if (rows.length === 0) {
                    rows.push(
                      <tr key={`${p.id}-empty`}>
                        <td style={tdStyle}>
                          <div style={{ fontWeight: 500 }}>{p.name}</div>
                          {p.sku && <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{p.sku}</div>}
                        </td>
                        <td style={tdStyle}>{whFilter === 'all' ? '—' : (warehouses.find(w => w.id === whFilter)?.name || '—')}</td>
                        <td style={tdStyle}>0 {p.unit}</td>
                        <td style={tdStyle}>0 {p.unit}</td>
                        <td style={{ ...tdStyle, fontWeight: 600 }}>0 {p.unit}</td>
                        <td style={{ ...tdStyle, whiteSpace: 'nowrap' }}>
                          <button
                            style={{ ...btnGhost, marginRight: 8, color: '#059669' }}
                            onClick={() => setMovementModal({ product: p, type: 'income' })}
                          >
                            Приход
                          </button>
                          <button
                            style={{ ...btnGhost, color: '#dc2626', opacity: 0.5, cursor: 'not-allowed' }}
                            disabled
                            title="Нет остатка для списания"
                          >
                            Расход
                          </button>
                        </td>
                      </tr>
                    );
                  }
                  return rows;
                })}
                {stockProducts.every(p => !(p.stocks || []).some(s => whFilter === 'all' || s.warehouseId === whFilter)) && (
                  <tr>
                    <td colSpan={6} style={{ ...tdStyle, textAlign: 'center', color: 'var(--text-muted)' }}>
                      Остатков нет — добавьте приход
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>История движений</h3>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 12, overflow: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={thStyle}>Дата</th>
                  <th style={thStyle}>Товар</th>
                  <th style={thStyle}>Склад</th>
                  <th style={thStyle}>Операция</th>
                  <th style={thStyle}>Кол-во</th>
                  <th style={thStyle}>Цена</th>
                  <th style={thStyle}>Комментарий</th>
                </tr>
              </thead>
              <tbody>
                {visibleMovements.map(m => (
                  <tr key={m.id}>
                    <td style={{ ...tdStyle, whiteSpace: 'nowrap' }}>{format(new Date(m.date), 'dd.MM.yyyy HH:mm')}</td>
                    <td style={tdStyle}>{m.product?.name}</td>
                    <td style={tdStyle}>{m.warehouse?.name}</td>
                    <td style={{
                      ...tdStyle,
                      color: m.type === 'income' ? '#059669' : m.type === 'outcome' ? '#dc2626' : '#d97706',
                      fontWeight: 500,
                    }}>
                      {m.type === 'income' ? 'Приход' : m.type === 'outcome' ? 'Расход' : 'Установка'}
                    </td>
                    <td style={tdStyle}>{m.type === 'outcome' ? '−' : '+'}{fmtMoney(m.quantity)}</td>
                    <td style={tdStyle}>{m.price != null ? fmtMoney(m.price) : '—'}</td>
                    <td style={tdStyle}>{m.comment || '—'}</td>
                  </tr>
                ))}
                {visibleMovements.length === 0 && (
                  <tr>
                    <td colSpan={7} style={{ ...tdStyle, textAlign: 'center', color: 'var(--text-muted)' }}>
                      Движений нет
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        </div>
      )}

      {/* ===== Цены ===== */}
      {tab === 'prices' && (
        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
          {categorySidebar}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {priceTypes.map(t => (
              <div
                key={t.id}
                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 12, background: t.color, fontSize: 14, fontWeight: 500, opacity: t.isActive ? 1 : 0.5 }}
              >
                {t.label}
                <button
                  onClick={() => setPtModal(t)}
                  style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 12, textDecoration: 'underline' }}
                >
                  изм.
                </button>
              </div>
            ))}
          </div>

          <input
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Поиск товара"
            style={{ ...inputStyle, maxWidth: 360 }}
          />

          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 12, overflow: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={thStyle}>Позиция</th>
                  {activePriceTypes.map(t => <th key={t.id} style={thStyle}>{t.label}</th>)}
                  <th style={thStyle}>История</th>
                </tr>
              </thead>
              <tbody>
                {visible.map(p => (
                  <tr key={p.id}>
                    <td style={tdStyle}>
                      <div style={{ fontWeight: 500 }}>{p.name}</div>
                      {p.sku && <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{p.sku}</div>}
                    </td>
                    {activePriceTypes.map(t => {
                      const isEditing = editingCell?.productId === p.id && editingCell?.priceTypeId === t.id;
                      const current = priceOf(p, t.id);
                      return (
                        <td key={t.id} style={tdStyle}>
                          {isEditing ? (
                            <input
                              autoFocus
                              value={editingCell!.value}
                              onChange={e => setEditingCell({ ...editingCell!, value: e.target.value })}
                              onBlur={saveCell}
                              onKeyDown={e => { if (e.key === 'Enter') saveCell(); if (e.key === 'Escape') setEditingCell(null); }}
                              style={{ ...inputStyle, width: 110 }}
                            />
                          ) : (
                            <span
                              style={{ cursor: 'pointer' }}
                              title="Нажмите для редактирования"
                              onClick={() => setEditingCell({ productId: p.id, priceTypeId: t.id, value: String(current ?? '') })}
                            >
                              {current !== undefined ? fmtMoney(current) : '—'}
                            </span>
                          )}
                        </td>
                      );
                    })}
                    <td style={tdStyle}>
                      <button style={btnGhost} onClick={() => setHistoryProduct(p)}>История</button>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={2 + activePriceTypes.length} style={{ ...tdStyle, textAlign: 'center', color: 'var(--text-muted)' }}>
                      Позиции не найдены
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        </div>
      )}

      {/* ===== Модалки ===== */}
      {productModal && (
        <ProductModal product={productModal} categories={categories}
          onClose={() => setProductModal(null)} onSaved={() => { setProductModal(null); load(); }} />
      )}
      {movementModal && (
        <MovementModal product={movementModal.product} type={movementModal.type} warehouses={warehouses}
          onClose={() => setMovementModal(null)} onSaved={() => { setMovementModal(null); load(); }} />
      )}
      {historyProduct && (
        <HistoryModal product={historyProduct} priceTypes={priceTypes} onClose={() => setHistoryProduct(null)} />
      )}
      {whModal && (
        <WarehouseModal warehouse={whModal}
          onClose={() => setWhModal(null)} onSaved={() => { setWhModal(null); load(); }} />
      )}
      {ptModal && (
        <PriceTypeModal priceType={ptModal}
          onClose={() => setPtModal(null)} onSaved={() => { setPtModal(null); load(); }} />
      )}
    </div>
  );
}

/* ---------- Строка позиции в номенклатуре ---------- */
function ProductRow({ p, indent, priceTypes, totalStock, priceOf, onOpen, onDelete, selected, onToggle }: {
  p: Product; indent: number; priceTypes: PriceType[];
  totalStock: number;
  priceOf: (p: Product, ptId: string) => number | undefined;
  onOpen: () => void; onDelete: () => void;
  selected: boolean; onToggle: () => void;
}) {
  const origin = window.location.origin;
  const mainImage = (p.images || [])[0];
  return (
    <tr style={{ opacity: p.isActive ? 1 : 0.5, cursor: 'pointer' }} onClick={onOpen}>
      <td style={{ ...tdStyle, paddingLeft: indent }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {mainImage ? (
            <img
              src={`${origin}${mainImage.url}`}
              alt={p.name}
              style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 8, border: '1px solid var(--border-color)', flexShrink: 0 }}
            />
          ) : (
            <div style={{ width: 40, height: 40, borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--bg-hover)', flexShrink: 0 }} />
          )}
          <div>
            <div style={{ fontWeight: 500 }}>{p.name}</div>
            {p.sku && <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{p.sku}</div>}
          </div>
        </div>
      </td>
      <td style={tdStyle}>
        <span style={{ padding: '2px 10px', borderRadius: 8, fontSize: 12, fontWeight: 500, background: KIND_COLORS[p.kind] || '#f0f0f0' }}>
          {KIND_LABELS[p.kind] || p.kind}
        </span>
        {p.syncToVk && (
          <span title="Синхронизируется с ВКонтакте"
            style={{ marginLeft: 6, padding: '2px 8px', borderRadius: 8, fontSize: 12, fontWeight: 600, background: '#0077FF', color: '#fff' }}>
            ВК
          </span>
        )}
        {p.onVitrine && (
          <span title="Показывается на витрине магазина"
            style={{ marginLeft: 6, padding: '2px 8px', borderRadius: 8, fontSize: 12, fontWeight: 600, background: '#16a34a', color: '#fff' }}>
            Витрина
          </span>
        )}
      </td>
      <td style={tdStyle}>{p.unit}</td>
      <td style={tdStyle}>{p.kind === 'service' ? '—' : fmtMoney(totalStock)}</td>
      {priceTypes.map(t => {
        const v = priceOf(p, t.id);
        return <td key={t.id} style={tdStyle}>{v !== undefined ? fmtMoney(v) : '—'}</td>;
      })}
      <td style={tdStyle} onClick={e => e.stopPropagation()}>
        <button style={{ ...btnGhost, color: '#dc2626' }} onClick={onDelete}>Удалить</button>
      </td>
    </tr>
  );
}

/* ---------- Модалка позиции (WYSIWYG-описание + галерея) ---------- */
function ProductModal({ product, categories, onClose, onSaved }: { product: Product | 'new'; categories: ProductCategory[]; onClose: () => void; onSaved: () => void }) {
  const isNew = product === 'new';
  const [form, setForm] = useState<{ name: string; kind: 'product' | 'service'; sku: string; unit: string; barcode: string; syncToVk: boolean; onVitrine: boolean; description: string }>({
    name: isNew ? '' : product.name,
    kind: isNew ? 'product' : product.kind,
    sku: isNew ? '' : product.sku || '',
    unit: isNew ? 'шт' : product.unit,
    barcode: isNew ? '' : product.barcode || '',
    syncToVk: isNew ? false : product.syncToVk,
    onVitrine: isNew ? false : product.onVitrine,
    description: isNew ? '' : product.description || '',
  });
  const [categoryId, setCategoryId] = useState(isNew ? '' : product.categoryId || '');
  // Опции селекта категории: группы и виды номенклатуры с отступами по глубине
  const categoryOptions = useMemo(() => {
    const byParent = new Map<string | null, ProductCategory[]>();
    for (const c of categories) {
      const list = byParent.get(c.parentId ?? null) ?? [];
      list.push(c);
      byParent.set(c.parentId ?? null, list);
    }
    for (const l of byParent.values()) l.sort((a, b) => a.name.localeCompare(b.name, 'ru'));
    const out: { id: string; label: string }[] = [];
    const walk = (parentId: string | null, depth: number) => {
      for (const c of byParent.get(parentId) ?? []) {
        out.push({ id: c.id, label: `${'— '.repeat(depth)}${c.name}` });
        walk(c.id, depth + 1);
      }
    };
    walk(null, 0);
    return out;
  }, [categories]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const origin = window.location.origin;

  const save = async () => {
    if (!form.name.trim()) { setError('Название обязательно'); return; }
    setSaving(true); setError('');
    try {
      const payload = { ...form, categoryId: categoryId || null };
      if (isNew) await api.products.create(payload);
      else await api.products.update(product.id, payload);
      onSaved();
    } catch (e: any) { setError(e.message || 'Ошибка сохранения'); }
    finally { setSaving(false); }
  };

  const remove = async () => {
    if (isNew || !confirm('Удалить позицию?')) return;
    try { await api.products.delete(product.id); onSaved(); }
    catch (e: any) { setError(e.message || 'Ошибка удаления'); }
  };

  const uploadImages = async (files: FileList | null) => {
    if (!files || isNew) return;
    setUploading(true); setError('');
    try {
      for (const file of Array.from(files)) {
        const att = await api.uploads.upload(file, 'product', product.id);
        await api.products.addImage(product.id, att.id);
      }
      onSaved();
    } catch (e: any) { setError(e.message || 'Ошибка загрузки изображений'); }
    finally { setUploading(false); if (fileInputRef.current) fileInputRef.current.value = ''; }
  };

  const removeImage = async (imageId: string) => {
    if (isNew) return;
    try { await api.products.deleteImage(product.id, imageId); onSaved(); }
    catch (e: any) { setError(e.message || 'Ошибка удаления изображения'); }
  };

  const images = isNew ? [] : (product.images || []);

  return (
    <div style={overlayStyle}>
      <div style={{ background: 'var(--bg-card)', borderRadius: 16, padding: 24, width: '100%', maxWidth: 560, maxHeight: '90vh', overflow: 'auto' }}>
        <h3 style={{ margin: '0 0 16px' }}>{isNew ? 'Новая позиция' : 'Изменить позицию'}</h3>
        {error && <div style={{ color: '#dc2626', marginBottom: 12, fontSize: 14 }}>{error}</div>}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <label style={{ fontSize: 14, fontWeight: 500 }}>Название</label>
          <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} style={inputStyle} />
          <label style={{ fontSize: 14, fontWeight: 500 }}>Вид</label>
          <select value={form.kind} onChange={e => setForm({ ...form, kind: e.target.value as 'product' | 'service' })} style={inputStyle}>
            <option value="product">Товар</option>
            <option value="service">Услуга</option>
          </select>
          <label style={{ fontSize: 14, fontWeight: 500 }}>Артикул</label>
          <input value={form.sku} onChange={e => setForm({ ...form, sku: e.target.value })} style={inputStyle} />
          <label style={{ fontSize: 14, fontWeight: 500 }}>Категория (виды номенклатуры 1С)</label>
          <select value={categoryId} onChange={e => setCategoryId(e.target.value)} style={inputStyle}>
            <option value="">— Без категории —</option>
            {categoryOptions.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
          </select>
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 14, fontWeight: 500 }}>Единица</label>
              <input value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })} style={inputStyle} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 14, fontWeight: 500 }}>Штрихкод</label>
              <input value={form.barcode} onChange={e => setForm({ ...form, barcode: e.target.value })} style={inputStyle} />
            </div>
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 500, cursor: 'pointer' }}>
            <input type="checkbox" checked={form.syncToVk} onChange={e => setForm({ ...form, syncToVk: e.target.checked })} style={{ width: 16, height: 16 }} />
            Синхронизировать с ВКонтакте
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 500, cursor: 'pointer' }}>
            <input type="checkbox" checked={form.onVitrine} onChange={e => setForm({ ...form, onVitrine: e.target.checked })} style={{ width: 16, height: 16 }} />
            На витрине
          </label>
          <label style={{ fontSize: 14, fontWeight: 500 }}>Описание</label>
          <ReactQuill theme="snow" value={form.description} onChange={v => setForm({ ...form, description: v })}
            modules={quillModules} formats={quillFormats} />

          <label style={{ fontSize: 14, fontWeight: 500 }}>Изображения</label>
          {isNew ? (
            <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Сохраните позицию, чтобы добавить изображения</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {images.length > 0 && (
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {images.map((img, idx) => (
                    <div key={img.id} style={{ position: 'relative' }}>
                      <img
                        src={`${origin}${img.url}`}
                        alt=""
                        style={{ width: 72, height: 72, objectFit: 'cover', borderRadius: 8, border: idx === 0 ? '2px solid #007AFF' : '1px solid var(--border-color)' }}
                      />
                      {idx === 0 && <div style={{ position: 'absolute', bottom: 2, left: 2, background: 'rgba(0,0,0,0.6)', color: '#fff', fontSize: 10, padding: '1px 6px', borderRadius: 6 }}>главная</div>}
                      <button
                        onClick={() => removeImage(img.id)}
                        title="Удалить"
                        style={{ position: 'absolute', top: -6, right: -6, width: 20, height: 20, borderRadius: '50%', border: 'none', background: '#dc2626', color: '#fff', fontSize: 12, cursor: 'pointer', lineHeight: 1 }}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                style={{ display: 'none' }}
                onChange={e => uploadImages(e.target.files)}
              />
              <button onClick={() => fileInputRef.current?.click()} disabled={uploading} style={{ ...btnGhost, alignSelf: 'flex-start' }}>
                {uploading ? 'Загрузка...' : '+ Добавить изображения'}
              </button>
            </div>
          )}

          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <button onClick={save} disabled={saving} style={btnPrimary}>{saving ? 'Сохранение...' : 'Сохранить'}</button>
            {!isNew && <button onClick={remove} style={{ ...btnPrimary, background: '#dc2626' }}>Удалить</button>}
            <button onClick={onClose} style={btnGhost}>Отмена</button>
          </div>
        </div>
      </div>
    </div>
  );
}
/* ---------- Модалка прихода/расхода ---------- */
function MovementModal({ product, type, warehouses, onClose, onSaved }: { product: Product; type: 'income' | 'outcome'; warehouses: Warehouse[]; onClose: () => void; onSaved: () => void }) {
  const [warehouseId, setWarehouseId] = useState(warehouses[0]?.id || '');
  const [quantity, setQuantity] = useState('1');
  const [price, setPrice] = useState('');
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true); setError('');
    try {
      await api.products.createMovement(product.id, {
        type, warehouseId, quantity: Number(quantity),
        price: price ? Number(price) : undefined, comment,
      });
      onSaved();
    } catch (e: any) { setError(e.message || 'Ошибка'); }
    finally { setSaving(false); }
  };

  return (
    <div style={overlayStyle}>
      <div style={{ background: 'var(--bg-card)', borderRadius: 16, padding: 24, width: '100%', maxWidth: 420 }}>
        <h3 style={{ margin: '0 0 16px' }}>{type === 'income' ? 'Приход' : 'Расход'}: {product.name}</h3>
        {error && <div style={{ color: '#dc2626', marginBottom: 12, fontSize: 14 }}>{error}</div>}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <label style={{ fontSize: 14, fontWeight: 500 }}>Склад</label>
          <select value={warehouseId} onChange={e => setWarehouseId(e.target.value)} style={inputStyle}>
            {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
          </select>
          <label style={{ fontSize: 14, fontWeight: 500 }}>Количество, {product.unit}</label>
          <input type="number" min="0" step="any" value={quantity} onChange={e => setQuantity(e.target.value)} style={inputStyle} />
          <label style={{ fontSize: 14, fontWeight: 500 }}>Цена операции (необязательно)</label>
          <input type="number" min="0" step="any" value={price} onChange={e => setPrice(e.target.value)} style={inputStyle} />
          <label style={{ fontSize: 14, fontWeight: 500 }}>Комментарий</label>
          <input value={comment} onChange={e => setComment(e.target.value)} style={inputStyle} />
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <button onClick={save} disabled={saving} style={btnPrimary}>{saving ? 'Сохранение...' : 'Сохранить'}</button>
            <button onClick={onClose} style={btnGhost}>Отмена</button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- Модалка истории цен ---------- */
function HistoryModal({ product, priceTypes, onClose }: { product: Product; priceTypes: PriceType[]; onClose: () => void }) {
  const [history, setHistory] = useState<PriceHistory[]>([]);
  useEffect(() => {
    api.products.priceHistory(product.id).then(setHistory).catch(() => {});
  }, [product.id]);

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={{ background: 'var(--bg-card)', borderRadius: 16, padding: 24, width: '100%', maxWidth: 560, maxHeight: '80vh', overflow: 'auto' }}
        onClick={e => e.stopPropagation()}>
        <h3 style={{ margin: '0 0 16px' }}>История цен: {product.name}</h3>
        {history.length === 0 && <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>Изменений цен не было</div>}
        {history.map(h => (
          <div key={h.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 8, padding: '8px 0', borderBottom: '1px solid var(--border-color)', fontSize: 14, flexWrap: 'wrap' }}>
            <span>{format(new Date(h.createdAt), 'dd.MM.yyyy HH:mm')}</span>
            <span style={{ fontWeight: 500 }}>{h.priceType?.label || priceTypes.find(t => t.id === h.priceTypeId)?.label}</span>
            <span>{fmtMoney(h.oldPrice)} → <b>{fmtMoney(h.newPrice)}</b></span>
            <span style={{ color: 'var(--text-muted)' }}>{h.user?.name || ''}</span>
          </div>
        ))}
        <button onClick={onClose} style={{ ...btnGhost, marginTop: 16 }}>Закрыть</button>
      </div>
    </div>
  );
}

/* ---------- Модалка склада ---------- */
function WarehouseModal({ warehouse, onClose, onSaved }: { warehouse: Warehouse | 'new'; onClose: () => void; onSaved: () => void }) {
  const isNew = warehouse === 'new';
  const [name, setName] = useState(isNew ? '' : warehouse.name);
  const [location, setLocation] = useState(isNew ? '' : warehouse.location || '');
  const [error, setError] = useState('');

  const save = async () => {
    if (!name.trim()) { setError('Название обязательно'); return; }
    try {
      if (isNew) await api.products.warehouses.create({ name, location });
      else await api.products.warehouses.update(warehouse.id, { name, location });
      onSaved();
    } catch (e: any) { setError(e.message || 'Ошибка'); }
  };

  const remove = async () => {
    if (isNew || !confirm('Удалить склад?')) return;
    try { await api.products.warehouses.delete(warehouse.id); onSaved(); }
    catch (e: any) { setError(e.message || 'Ошибка удаления'); }
  };

  return (
    <div style={overlayStyle}>
      <div style={{ background: 'var(--bg-card)', borderRadius: 16, padding: 24, width: '100%', maxWidth: 400 }}>
        <h3 style={{ margin: '0 0 16px' }}>{isNew ? 'Новый склад' : 'Изменить склад'}</h3>
        {error && <div style={{ color: '#dc2626', marginBottom: 12, fontSize: 14 }}>{error}</div>}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <label style={{ fontSize: 14, fontWeight: 500 }}>Название</label>
          <input value={name} onChange={e => setName(e.target.value)} style={inputStyle} />
          <label style={{ fontSize: 14, fontWeight: 500 }}>Расположение</label>
          <input value={location} onChange={e => setLocation(e.target.value)} style={inputStyle} />
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <button onClick={save} style={btnPrimary}>Сохранить</button>
            {!isNew && <button onClick={remove} style={{ ...btnPrimary, background: '#dc2626' }}>Удалить</button>}
            <button onClick={onClose} style={btnGhost}>Отмена</button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- Модалка вида цены ---------- */
function PriceTypeModal({ priceType, onClose, onSaved }: { priceType: PriceType | 'new'; onClose: () => void; onSaved: () => void }) {
  const isNew = priceType === 'new';
  const [name, setName] = useState(isNew ? '' : priceType.name);
  const [label, setLabel] = useState(isNew ? '' : priceType.label);
  const [color, setColor] = useState(isNew ? '#f0f0f0' : priceType.color);
  const [error, setError] = useState('');

  const save = async () => {
    try {
      if (isNew) await api.products.priceTypes.create({ name, label, color });
      else await api.products.priceTypes.update(priceType.id, { label, color });
      onSaved();
    } catch (e: any) { setError(e.message || 'Ошибка'); }
  };

  const remove = async () => {
    if (isNew || !confirm('Удалить вид цены?')) return;
    try { await api.products.priceTypes.delete(priceType.id); onSaved(); }
    catch (e: any) { setError(e.message || 'Ошибка удаления'); }
  };

  return (
    <div style={overlayStyle}>
      <div style={{ background: 'var(--bg-card)', borderRadius: 16, padding: 24, width: '100%', maxWidth: 400 }}>
        <h3 style={{ margin: '0 0 16px' }}>{isNew ? 'Новый вид цены' : 'Изменить вид цены'}</h3>
        {error && <div style={{ color: '#dc2626', marginBottom: 12, fontSize: 14 }}>{error}</div>}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {isNew && (<>
            <label style={{ fontSize: 14, fontWeight: 500 }}>Системное имя (latin)</label>
            <input value={name} onChange={e => setName(e.target.value)} style={inputStyle} placeholder="dealer, vip..." />
          </>)}
          <label style={{ fontSize: 14, fontWeight: 500 }}>Название</label>
          <input value={label} onChange={e => setLabel(e.target.value)} style={inputStyle} placeholder="Дилерская, VIP..." />
          <label style={{ fontSize: 14, fontWeight: 500 }}>Цвет</label>
          <input type="color" value={color} onChange={e => setColor(e.target.value)} style={{ width: '100%', height: 40 }} />
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <button onClick={save} style={btnPrimary}>Сохранить</button>
            {!isNew && <button onClick={remove} style={{ ...btnPrimary, background: '#dc2626' }}>Удалить</button>}
            <button onClick={onClose} style={btnGhost}>Отмена</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ReservesTab() {
  const [reserves, setReserves] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    api.reservations.list()
      .then(setReserves)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);
  const issue = async (id: string) => {
    try { await api.reservations.issue(id); setReserves(await api.reservations.list()); }
    catch (e: any) { alert(e.message || 'Ошибка выдачи'); }
  };
  const share = async (id: string) => {
    const taskId = prompt('ID задачи для отправки в обсуждение:');
    if (!taskId) return;
    try { await api.reservations.share(id, taskId); alert('Отправлено в обсуждение задачи'); }
    catch (e: any) { alert(e.message || 'Ошибка отправки'); }
  };
  if (loading) return <div style={{ padding: 16, color: 'var(--text-muted)' }}>Загрузка...</div>;
  return (
    <div>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead><tr>
          <th style={thStyle}>№</th><th style={thStyle}>Дата</th><th style={thStyle}>На чьё имя</th>
          <th style={thStyle}>Товары</th><th style={thStyle}>Сумма</th><th style={thStyle}>Статус</th><th style={thStyle}></th>
        </tr></thead>
        <tbody>
          {reserves.map((r: any) => (
            <tr key={r.id}>
              <td style={tdStyle}>РЗ-{String(r.number).padStart(6, '0')}</td>
              <td style={tdStyle}>{new Date(r.createdAt).toLocaleString('ru-RU')}</td>
              <td style={tdStyle}>{r.contact?.name}</td>
              <td style={tdStyle}>{r.items.map((i: any) => `${i.product.name} × ${i.quantity}`).join('; ')}</td>
              <td style={tdStyle}>{r.total.toFixed(2)} ₽</td>
              <td style={tdStyle}>{r.status === 'held' ? 'Отложено' : 'Выдано'}</td>
              <td style={{ ...tdStyle, whiteSpace: 'nowrap' }}>
                {r.status === 'held' && <button style={btnGhost} onClick={() => issue(r.id)}>Выдать</button>}
                <button style={{ ...btnGhost, marginLeft: 8 }} onClick={() => api.reservations.downloadPdf(r.id, r.number)}>PDF</button>
                <button style={{ ...btnGhost, marginLeft: 8 }} onClick={() => share(r.id)}>В задачу</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {!reserves.length && <div style={{ padding: 16, color: 'var(--text-muted)' }}>Резервов пока нет.</div>}
    </div>
  );
}
