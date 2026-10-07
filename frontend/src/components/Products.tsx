import { Fragment, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { format } from 'date-fns';
import { api } from '../api/client';
import { useAuth } from '../hooks/useAuth';
import { Vitrine } from './Vitrine';
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
  { key: 'vitrine', label: 'Витрина' },
  { key: 'sales', label: 'Заказы' },
  { key: 'reserves', label: 'Резервы' },
  { key: 'subscriptions', label: 'Подписки' },
  { key: 'stockgroup', label: 'Складской учёт' },
];

// Под-вкладки внутри «Складской учёт»
const STOCK_TABS = [
  { key: 'nomenclature', label: 'Номенклатура' },
  { key: 'stock', label: 'Склад' },
  { key: 'prices', label: 'Цены' },
  { key: 'stats', label: 'Статистика' },
];

const KIND_LABELS: Record<string, string> = { product: 'Товар', service: 'Услуга' };
const KIND_COLORS: Record<string, string> = { product: '#dbeafe', service: '#ede9fe' };

const fmtMoney = (v: number) => new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 2 }).format(v);
const inputStyle: React.CSSProperties = { padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-primary)', width: '100%', boxSizing: 'border-box' };
const btnPrimary: React.CSSProperties = { padding: '8px 16px', borderRadius: 12, border: 'none', background: '#1a1a1a', color: '#fff', fontSize: 14, fontWeight: 500, cursor: 'pointer' };
const btnGhost: React.CSSProperties = { padding: '6px 12px', borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-primary)', cursor: 'pointer', fontSize: 13 };
// Маленькие кнопки действий категории (✎ / ✕), видны при наведении на строку дерева
const catActionBtn: React.CSSProperties = { border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 12, color: 'var(--text-muted)', padding: '0 3px', lineHeight: '18px' };
const thStyle: React.CSSProperties = { textAlign: 'left', padding: '10px 12px', fontSize: 12, color: 'var(--text-muted)', fontWeight: 500, borderBottom: '1px solid var(--border-color)', whiteSpace: 'nowrap' };
const tdStyle: React.CSSProperties = { padding: '10px 12px', fontSize: 14, borderBottom: '1px solid var(--border-color)' };
const overlayStyle: React.CSSProperties = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 };

interface CategoryNode { key: string; name: string; children: CategoryNode[]; products: Product[]; }

export function Products() {
  const [tab, setTab] = useState('vitrine');
  // Активная под-вкладка внутри «Складской учёт»
  const [stockTab, setStockTab] = useState('nomenclature');
  // Фактически показываемая вкладка контента
  const effectiveTab = tab === 'stockgroup' ? stockTab : tab;
  const { user } = useAuth();
  const isAdmin = (user as any)?.role === 'admin';
  // Складской учёт: администратор, менеджер или пользователь с опцией «Доступ к складскому учёту»
  const isPrivileged = ['admin', 'manager'].includes((user as any)?.role) || !!(user as any)?.stockAccess;
  // Гостевой доступ: в каталоге доступна только вкладка «Витрина»
  const isGuest = (user as any)?.isGuest === true;
  const visibleTabs = TABS.filter((t) => {
    if (isGuest) return t.key === 'vitrine';
    if (t.key === 'stockgroup') return isPrivileged;
    return true;
  });
  const [products, setProducts] = useState<Product[]>([]);
  // Все существующие теги (для автоподстановки в таблице и модалке позиции)
  const [allTags, setAllTags] = useState<string[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [priceTypes, setPriceTypes] = useState<PriceType[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [q, setQ] = useState('');
  const [whFilter, setWhFilter] = useState('all');
  // Сортировка таблицы «Склад»: текст — А→Я/Я→А, числа — по убыванию/возрастанию
  const [stockSort, setStockSort] = useState<{ key: 'name' | 'warehouse' | 'quantity' | 'reserved' | 'available'; dir: 'asc' | 'desc' } | null>(null);
// Детализация резерва: товар + склад строки таблицы «Склад», по которым кликнули в колонке «Резерв»
const [reserveDetail, setReserveDetail] = useState<{ product: Product; warehouseId: string | null } | null>(null);
  // фильтр склада для виджета «История движений» на вкладке «Статистика»
  const [statsWhFilter, setStatsWhFilter] = useState('all');
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
  // Управление категориями: модалка создания/редактирования и удаления с переносом
  const [catModal, setCatModal] = useState<{ category: ProductCategory | 'new'; parentId?: string | null } | null>(null);
  const [catDelete, setCatDelete] = useState<{ category: ProductCategory; products: number; children: number } | null>(null);
  // Строка дерева категорий под курсором (показываем кнопки ✎ / ✕)
  const [hoverCat, setHoverCat] = useState<string | null>(null);
  const [editingCell, setEditingCell] = useState<{ productId: string; priceTypeId: string; value: string; priceFrom: boolean } | null>(null);
  const [vkBusy, setVkBusy] = useState<'import' | 'sync' | null>(null);
  const [ozonBusy, setOzonBusy] = useState(false);

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

  const syncToOzon = async () => {
    if (!confirm('Выгрузить все позиции с отметкой «OZON Seller» в маркетплейс OZON?')) return;
    setOzonBusy(true);
    try {
      const r = await api.products.ozonSync();
      alert(`Синхронизация завершена: создано ${r.created}, обновлено ${r.updated}, ошибок ${r.failed}${r.errors.length ? '\n' + r.errors.slice(0, 10).join('\n') : ''}`);
      await load();
    } catch (e: any) {
      alert(e.message || 'Ошибка синхронизации с OZON');
    } finally { setOzonBusy(false); }
  };

  // Импорт из OZON: привязка товаров CRM к карточкам OZON по артикулу
  const importFromOzon = async () => {
    if (!confirm('Импортировать каталог OZON и привязать товары CRM по артикулу?')) return;
    setOzonBusy(true);
    try {
      const r = await api.ozonPlugin.import();
      alert(`Импорт завершён: привязано ${r.linked}, пропущено ${r.skipped}, создано ${r.created}, ошибок ${r.errors.length}${r.errors.length ? '\n' + r.errors.slice(0, 10).join('\n') : ''}`);
      await load();
    } catch (e: any) {
      alert(e.message || 'Ошибка импорта из OZON');
    } finally { setOzonBusy(false); }
  };

  // Переключение опции «Показывать на витрине» у вида цены
  const toggleVitrine = async (t: PriceType) => {
    try {
      await api.products.priceTypes.update(t.id, { forVitrine: !t.forVitrine });
      await load();
    } catch (e: any) { alert(e.message || 'Ошибка'); }
  };

  // Переключение признаков «Розничная» и «Использовать для безнала» у вида цены
  const togglePriceFlag = async (t: PriceType, flag: 'isRetail' | 'forCashless') => {
    try {
      await api.products.priceTypes.update(t.id, { [flag]: !t[flag] });
      await load();
    } catch (e: any) { alert(e.message || 'Ошибка'); }
  };

  const load = async () => {
    try {
      const [p, w, t, m, c, tg] = await Promise.all([
        api.products.list(),
        api.products.warehouses.list(),
        api.products.priceTypes.list(),
        api.products.movements(),
        api.products.categories.list(),
        api.products.tags(),
      ]);
      setProducts(p);
      setWarehouses(w);
      setPriceTypes(t);
      setMovements(m);
      setCategories(c);
      setAllTags(tg);
    } catch (e: any) {
      alert(e.message || 'Ошибка загрузки');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  // мобильная версия (паттерн как в Layout/ContactList): вкладки на всю ширину экрана
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Корзина витрины: счётчик из localStorage + события от Vitrine
  const [cartCount, setCartCount] = useState(0);
  useEffect(() => {
    const read = () => {
      try { setCartCount((JSON.parse(localStorage.getItem('wecrm_vitrine_cart') || '[]') as any[]).reduce((s, i) => s + i.quantity, 0)); } catch { setCartCount(0); }
    };
    read();
    window.addEventListener('wecrm:cart', read);
    return () => window.removeEventListener('wecrm:cart', read);
  }, []);
  const openCart = () => {
    setTab('vitrine');
    setTimeout(() => window.dispatchEvent(new CustomEvent('wecrm:open-cart')), 60);
  };

  // Резерв-лист витрины: счётчик из localStorage + события от Vitrine
  const [reserveCount, setReserveCount] = useState(0);
  useEffect(() => {
    const read = () => {
      try { setReserveCount((JSON.parse(localStorage.getItem('wecrm_vitrine_reserve') || '[]') as any[]).reduce((s, i) => s + i.quantity, 0)); } catch { setReserveCount(0); }
    };
    read();
    window.addEventListener('wecrm:reserve', read);
    return () => window.removeEventListener('wecrm:reserve', read);
  }, []);
  const openReserveList = () => {
    setTab('vitrine');
    setTimeout(() => window.dispatchEvent(new CustomEvent('wecrm:open-reserve')), 60);
  };

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

  // Удаление категории: сразу, если она пустая; иначе бэкенд вернёт 409 —
  // показываем модалку с выбором категории для переноса товаров
  const removeCategory = async (c: ProductCategory) => {
    try {
      await api.products.categories.delete(c.id);
      if (selCat === c.id) setSelCat('all');
      await load();
    } catch (e: any) {
      if (e.status === 409) {
        setCatDelete({ category: c, products: e.data?.products ?? 0, children: e.data?.children ?? 0 });
      } else {
        alert(e.message || 'Ошибка удаления');
      }
    }
  };

  // Рендер узла дерева категорий (как в «Виды и свойства» 1С: папки + виды)
  const renderCatNode = (c: ProductCategory, depth: number): ReactNode => {
    // Каталог во вкладке «Номенклатура» всегда развёрнут
    const collapsed = false;
    const count = countByCat.get(c.id) ?? 0;
    const selected = selCat === c.id;
    return (
      <div key={c.id} onMouseEnter={() => setHoverCat(c.id)} onMouseLeave={() => setHoverCat(h => (h === c.id ? null : h))}>
        <div onClick={() => setSelCat(c.id)} style={{
          display: 'flex', alignItems: 'center', gap: 4,
          padding: `5px 8px 5px ${8 + depth * 18}px`, cursor: 'pointer', fontSize: 13,
          background: selected ? 'var(--bg-hover)' : 'transparent',
          fontWeight: c.isGroup ? 600 : 400,
          color: c.isGroup ? 'var(--text-primary)' : 'var(--text-muted)',
          borderLeft: selected ? '2px solid #007AFF' : '2px solid transparent',
        }}>
          {c.isGroup ? (
            <span style={{ width: 14, fontSize: 10, color: 'var(--text-muted)' }}>▾</span>
          ) : <span style={{ width: 14 }} />}
          <span>{c.name}</span>
          <span style={{ marginLeft: 'auto', color: 'var(--text-muted)', fontSize: 12 }}>{count || ''}</span>
          {hoverCat === c.id && (
            <span style={{ display: 'flex', flexShrink: 0 }} onClick={e => e.stopPropagation()}>
              <button title="Добавить подкатегорию" onClick={() => setCatModal({ category: 'new', parentId: c.id })} style={catActionBtn}>＋</button>
              <button title="Переименовать / перенести" onClick={() => setCatModal({ category: c })} style={catActionBtn}>✎</button>
              <button title="Удалить" onClick={() => removeCategory(c)} style={{ ...catActionBtn, color: '#dc2626' }}>✕</button>
            </span>
          )}
        </div>
        {!collapsed && (catChildren.get(c.id) ?? []).map(ch => renderCatNode(ch, depth + 1))}
      </div>
    );
  };

  // Сайдбар дерева категорий — общий для вкладок «Номенклатура», «Склад» и «Цены»
  const categorySidebar = (
    <div style={{ width: 280, flexShrink: 0, background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 12, padding: '8px 0', maxHeight: 'calc(100vh - 220px)', overflow: 'auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '2px 8px 8px', margin: '0 0 4px', borderBottom: '1px solid var(--border-color)' }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.04em' }}>Категории</span>
        <button onClick={() => setCatModal({ category: 'new', parentId: null })} style={{ ...btnGhost, padding: '2px 10px', fontSize: 12 }}>+ Категория</button>
      </div>
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
        <td colSpan={6 + activePriceTypes.length} style={{
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
          allTags={allTags}
          onSaveTags={async (tags) => {
            try { await api.products.update(p.id, { tags }); await load(); } catch (e: any) { alert(e.message || 'Ошибка сохранения тегов'); }
          }}
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
        await api.products.setPrice(editingCell.productId, editingCell.priceTypeId, v, editingCell.priceFrom);
        await load();
      } catch (e: any) {
        alert(e.message || 'Ошибка сохранения цены');
      }
    }
    setEditingCell(null);
  };

  const visibleMovements = useMemo(() =>
    movements.filter(m => statsWhFilter === 'all' || m.warehouseId === statsWhFilter).slice(0, 50),
    [movements, statsWhFilter]);

  // Топ продаваемых товаров по расходным движениям (для виджета «Самые продаваемые»)
  const topProducts = useMemo(() => {
    const agg = new Map<string, { name: string; unit: string; qty: number; ops: number }>();
    for (const m of movements) {
      if (m.type !== 'outcome' || !m.product) continue;
      const cur = agg.get(m.product.name) || { name: m.product.name, unit: m.product.unit || '', qty: 0, ops: 0 };
      cur.qty += m.quantity;
      cur.ops += 1;
      agg.set(m.product.name, cur);
    }
    return [...agg.values()].sort((a, b) => b.qty - a.qty).slice(0, 10);
  }, [movements]);
  const topMaxQty = topProducts[0]?.qty || 1;

  // товары (не услуги) для складского учёта
  const stockProducts = useMemo(() => visible.filter(p => p.kind !== 'service'), [visible]);

  // Кликабельный заголовок таблицы «Склад»: первый клик — А→Я (текст) или по убыванию (числа),
  // повторный — в обратную сторону; клик по другой колонке начинает с её направления по умолчанию
  const stockTh = (label: string, key: 'name' | 'warehouse' | 'quantity' | 'reserved' | 'available', numeric = false) => (
    <th
      style={{ ...thStyle, cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' }}
      title="Нажмите для сортировки"
      onClick={() => setStockSort(prev => (prev && prev.key === key ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: numeric ? 'desc' : 'asc' }))}
    >
      {label}
      {stockSort?.key === key && <span style={{ marginLeft: 4, fontSize: 10 }}>{stockSort.dir === 'asc' ? '▲' : '▼'}</span>}
    </th>
  );

  // Строки таблицы «Склад» в плоском виде — сортировка применяется к ним после фильтров
  const stockRows = stockProducts.flatMap(p => {
    const list = (p.stocks || []).filter(s => whFilter === 'all' || s.warehouseId === whFilter);
    // товары без остатков тоже показываем с нулями — иначе часть каталога невидима в складской вкладке
    if (!list.length) {
      return [{ key: `${p.id}-empty`, p, wh: whFilter === 'all' ? null : warehouses.find(w => w.id === whFilter), qty: 0, res: 0, empty: true }];
    }
    return list.map(s => ({ key: s.id, p, wh: warehouses.find(w => w.id === s.warehouseId), qty: s.quantity, res: s.reserved, empty: false }));
  });
  if (stockSort) {
    const { key, dir } = stockSort;
    const mul = dir === 'asc' ? 1 : -1;
    stockRows.sort((a, b) => {
      let r = 0;
      if (key === 'name') r = (a.p.name || '').localeCompare(b.p.name || '', 'ru');
      else if (key === 'warehouse') r = (a.wh?.name || '').localeCompare(b.wh?.name || '', 'ru');
      else if (key === 'quantity') r = a.qty - b.qty;
      else if (key === 'reserved') r = a.res - b.res;
      else r = (a.qty - a.res) - (b.qty - b.res);
      return r * mul;
    });
  }

  if (loading) return <div style={{ padding: 24 }}>Загрузка...</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
        <h2 style={{ margin: 0, fontSize: 18 }}>Каталог</h2>
        <button onClick={openCart} title="Корзина"
          style={{ position: 'relative', marginLeft: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center', width: 40, height: 40, borderRadius: 12, border: '1px solid rgba(120,180,255,0.40)', background: 'linear-gradient(135deg, #007aff 0%, #5856d6 50%, #af52de 100%)', color: '#fff', cursor: 'pointer', boxShadow: '0 4px 20px rgba(0,122,255,0.35), inset 0 1px 0 rgba(255,255,255,0.25)' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
          </svg>
          {cartCount > 0 && <span style={{ position: 'absolute', top: -6, right: -6, background: '#fff', color: '#007aff', border: '1px solid rgba(120,180,255,0.40)', borderRadius: 10, fontSize: 11, padding: '1px 6px', fontWeight: 700 }}>{cartCount}</span>}
        </button>
        <button onClick={openReserveList} title="В резерве"
          style={{ position: 'relative', marginLeft: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', width: 40, height: 40, borderRadius: 12, border: '1px solid rgba(120,255,122,0.40)', background: 'linear-gradient(135deg, rgb(10,136,0) 0%, rgb(51,194,120) 50%, rgb(4,110,0) 100%)', color: '#fff', cursor: 'pointer', boxShadow: 'rgba(8,255,0,0.35) 0 4px 20px, inset 0 1px 0 rgba(255,255,255,0.25)' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path fillRule="evenodd" clipRule="evenodd" d="M17 3.8H7C5.78497 3.8 4.8 4.78497 4.8 6V15.7647C4.8 16.574 5.24438 17.318 5.95698 17.7017L10.957 20.394C11.6081 20.7446 12.3919 20.7446 13.043 20.394L18.043 17.7017C18.7556 17.318 19.2 16.574 19.2 15.7647V6C19.2 4.78497 18.215 3.8 17 3.8ZM7 2C4.79086 2 3 3.79086 3 6V15.7647C3 17.2362 3.80796 18.5889 5.1036 19.2866L10.1036 21.9789C11.2875 22.6164 12.7125 22.6164 13.8964 21.9789L18.8964 19.2866C20.192 18.5889 21 17.2362 21 15.7647V6C21 3.79086 19.2091 2 17 2H7Z" fill="currentColor"/>
            <path fillRule="evenodd" clipRule="evenodd" d="M16.7248 8.63051C17.0763 8.98198 17.0763 9.55183 16.7248 9.9033L11.7627 14.8654C11.4113 15.2169 10.8414 15.2169 10.4899 14.8654L7.81839 12.1939C7.46692 11.8424 7.46691 11.2726 7.81839 10.9211C8.16986 10.5696 8.7397 10.5696 9.09118 10.9211L11.1263 12.9562L15.4521 8.63051C15.8035 8.27904 16.3734 8.27904 16.7248 8.63051Z" fill="currentColor"/>
          </svg>
          {reserveCount > 0 && <span style={{ position: 'absolute', top: -6, right: -6, background: '#fff', color: 'rgb(10,136,0)', border: '1px solid rgba(120,255,122,0.40)', borderRadius: 10, fontSize: 11, padding: '1px 6px', fontWeight: 700 }}>{reserveCount}</span>}
        </button>
        {effectiveTab === 'nomenclature' && (
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={importFromVk} disabled={!!vkBusy} title="Загрузить все товары маркета группы ВК в проект"
              style={{ ...btnGhost, borderColor: '#0077FF', color: '#0077FF' }}>
              {vkBusy === 'import' ? 'Импорт...' : '↓ Импорт из ВК'}
            </button>
            <button onClick={syncToVk} disabled={!!vkBusy} title="Выгрузить позиции с отметкой «ВК» в маркет группы"
              style={{ ...btnGhost, borderColor: '#0077FF', color: '#0077FF' }}>
              {vkBusy === 'sync' ? 'Синхронизация...' : '↑ Синхронизация ВК'}
            </button>
            <button onClick={syncToOzon} disabled={ozonBusy} title="Выгрузить позиции с отметкой «OZON Seller» в маркетплейс OZON"
              style={{ ...btnGhost, borderColor: '#005BFF', color: '#005BFF' }}>
              {ozonBusy ? 'Синхронизация...' : '↑ Синхронизация OZON'}
            </button>
            <button onClick={importFromOzon} disabled={ozonBusy} title="Привязать товары CRM к карточкам OZON по артикулу"
              style={{ ...btnGhost, borderColor: '#005BFF', color: '#005BFF' }}>
              {ozonBusy ? 'Импорт...' : '↓ Импорт из OZON'}
            </button>
            <button onClick={() => setProductModal('new')} style={btnPrimary}>+ Позиция</button>
          </div>
        )}
        {effectiveTab === 'stock' && (
          <button onClick={() => setWhModal('new')} style={btnPrimary}>+ Склад</button>
        )}
        {effectiveTab === 'prices' && (
          <button onClick={() => setPtModal('new')} style={btnPrimary}>+ Вид цены</button>
        )}
      </div>

      <div style={{
        display: 'flex', gap: 8,
        borderBottom: '1px solid var(--border-color)',
        marginBottom: 16,
        ...(isMobile ? { margin: '0 -8px 16px', overflowX: 'auto', scrollbarWidth: 'none' } : {}),
      }}>
        {visibleTabs.map((t) => (
          <Fragment key={t.key}>
            <button
              onClick={() => setTab(t.key)}
              style={{
                padding: '10px 16px', border: 'none',
                background: tab === t.key ? 'var(--bg-hover)' : 'transparent',
                color: tab === t.key ? '#007AFF' : 'var(--text-primary)',
                borderBottom: tab === t.key ? '2px solid #007AFF' : '2px solid transparent',
                cursor: 'pointer', fontSize: 14, fontWeight: 500, borderRadius: '8px 8px 0 0',
                ...(isMobile ? { flexShrink: 0, padding: '10px 12px', whiteSpace: 'nowrap' } : {}),
              }}
            >
              {t.label}
            </button>
          </Fragment>
        ))}
      </div>

      {/* Под-вкладки «Складского учёта» */}
      {tab === 'stockgroup' && (
        <div style={{ display: 'flex', gap: 4, borderBottom: '1px solid var(--border-color)', marginBottom: 12, flexWrap: 'wrap' }}>
          {STOCK_TABS.map(st => (
            <button
              key={st.key}
              onClick={() => setStockTab(st.key)}
              style={{
                padding: '8px 14px', border: 'none',
                background: stockTab === st.key ? 'var(--bg-hover)' : 'transparent',
                color: stockTab === st.key ? '#007AFF' : 'var(--text-muted)',
                borderBottom: stockTab === st.key ? '2px solid #007AFF' : '2px solid transparent',
                cursor: 'pointer', fontSize: 13, fontWeight: 500, borderRadius: '8px 8px 0 0',
              }}
            >
              {st.label}
            </button>
          ))}
        </div>
      )}

      {/* Поиск по каталогу */}
      <div style={{ marginBottom: 12 }}>
        <input
          value={q}
          onChange={e => setQ(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') e.currentTarget.blur(); }}
          placeholder="Поиск: название, артикул, категория"
          style={{
            width: '100%',
            padding: '8px 14px',
            borderRadius: 12,
            border: '1px solid var(--border-color)',
            background: 'var(--bg-color)',
            color: 'var(--text-color)',
            fontSize: 14,
            outline: 'none',
            boxSizing: 'border-box',
          }}
        />
      </div>

      {/* ===== Витрина ===== */}
      {tab === 'vitrine' && <Vitrine search={q} />}

      {/* ===== Резервы ===== */}
      {tab === 'reserves' && <ReservesTab />}
      {tab === 'sales' && <SalesTab />}

      {/* ===== Подписки ===== */}
      {tab === 'subscriptions' && <SubscriptionsTab />}

      {/* ===== Номенклатура ===== */}
      {effectiveTab === 'nomenclature' && (
        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
          {categorySidebar}
          <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 12, flexWrap: 'wrap' }}>
  
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
                  <th style={thStyle}>Теги</th>
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
                    allTags={allTags}
                    onSaveTags={async (tags) => {
                      try { await api.products.update(p.id, { tags }); await load(); } catch (e: any) { alert(e.message || 'Ошибка сохранения тегов'); }
                    }}
                  />
                ))}
                {visible.length === 0 && (
                  <tr>
                    <td colSpan={6 + activePriceTypes.length} style={{ ...tdStyle, textAlign: 'center', color: 'var(--text-muted)' }}>
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
      {effectiveTab === 'stock' && (
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
                  {stockTh('Товар', 'name')}
                  {stockTh('Склад', 'warehouse')}
                  {stockTh('Остаток', 'quantity', true)}
                  {stockTh('Резерв', 'reserved', true)}
                  {stockTh('Доступно', 'available', true)}
                  <th style={thStyle}>Действия</th>
                </tr>
              </thead>
              <tbody>
                {stockRows.map(r => (
                  <tr key={r.key}>
                    <td style={tdStyle}>
                      <div style={{ fontWeight: 500 }}>{r.p.name}</div>
                      {r.p.sku && <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{r.p.sku}</div>}
                    </td>
                    <td style={tdStyle}>{r.wh?.name || '—'}</td>
                    <td style={tdStyle}>{fmtMoney(r.qty)} {r.p.unit}</td>
                    <td
                      style={{
                        ...tdStyle,
                        ...(r.res !== 0 && !r.empty ? { cursor: 'pointer', color: r.res < 0 ? '#dc2626' : '#d97706', fontWeight: 500 } : {}),
                      }}
                      {...(r.res !== 0 && !r.empty ? {
                        title: 'Нажмите, чтобы увидеть, кем и под каким номером зарезервировано',
                        onClick: () => setReserveDetail({ product: r.p, warehouseId: r.wh?.id || null }),
                      } : {})}
                    >
                      {fmtMoney(r.res)} {r.p.unit}
                    </td>
                    {/* Отрицательное «Доступно» = резерв превышает остаток: тоже показываем детализацию резерва */}
                    <td
                      style={{
                        ...tdStyle,
                        fontWeight: 600,
                        ...(r.qty - r.res < 0 && !r.empty ? { cursor: 'pointer', color: '#dc2626' } : {}),
                      }}
                      {...(r.qty - r.res < 0 && !r.empty ? {
                        title: 'Резерв превышает остаток — нажмите, чтобы увидеть детализацию',
                        onClick: () => setReserveDetail({ product: r.p, warehouseId: r.wh?.id || null }),
                      } : {})}
                    >
                      {fmtMoney(r.qty - r.res)} {r.p.unit}
                    </td>
                    <td style={{ ...tdStyle, whiteSpace: 'nowrap' }}>
                      <button
                        style={{ ...btnGhost, marginRight: 8, color: '#059669' }}
                        onClick={() => setMovementModal({ product: r.p, type: 'income' })}
                      >
                        Приход
                      </button>
                      <button
                        style={{ ...btnGhost, color: '#dc2626', ...(r.empty ? { opacity: 0.5, cursor: 'not-allowed' } : {}) }}
                        disabled={r.empty}
                        {...(r.empty ? { title: 'Нет остатка для списания' } : {})}
                        onClick={() => setMovementModal({ product: r.p, type: 'outcome' })}
                      >
                        Расход
                      </button>
                    </td>
                  </tr>
                ))}
                {stockRows.length === 0 && (
                  <tr>
                    <td colSpan={6} style={{ ...tdStyle, textAlign: 'center', color: 'var(--text-muted)' }}>
                      Остатков нет — добавьте приход
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        </div>
      )}

      {/* Модал детализации резерва по клику из колонки «Резерв» таблицы «Склад» */}
      {reserveDetail && (
        <ReserveDetailModal
          product={reserveDetail.product}
          warehouseId={reserveDetail.warehouseId}
          onClose={() => setReserveDetail(null)}
        />
      )}

      {/* ===== Статистика ===== */}
      {effectiveTab === 'stats' && (
        <div className='mobile-grid-1' style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(520px, 1fr))', gap: 16, alignItems: 'start' }}>
          {/* Виджет среднего размера — первая ячейка сетки статистики; рядом в будущем — виджет «Самые продаваемые» */}
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 12, overflow: 'hidden' }}>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', padding: '12px 12px 8px' }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, marginRight: 8 }}>История движений</h3>
              <button
                onClick={() => setStatsWhFilter('all')}
                style={{ ...btnGhost, background: statsWhFilter === 'all' ? 'var(--bg-hover)' : 'var(--bg-card)', fontWeight: statsWhFilter === 'all' ? 600 : 400 }}
              >
                Все склады
              </button>
              {warehouses.map(w => (
                <button
                  key={w.id}
                  onClick={() => setStatsWhFilter(w.id)}
                  style={{ ...btnGhost, background: statsWhFilter === w.id ? 'var(--bg-hover)' : 'var(--bg-card)', fontWeight: statsWhFilter === w.id ? 600 : 400 }}
                >
                  {w.name}
                </button>
              ))}
            </div>
            <div style={{ overflow: 'auto' }}>
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
          {/* Виджет среднего размера — топ продаваемых товаров по истории движений (расход) */}
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 12, overflow: 'hidden' }}>
            <div style={{ padding: '12px 12px 8px' }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Самые продаваемые</h3>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Топ-10 по расходу за всё время</div>
            </div>
            <div style={{ padding: '4px 12px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {topProducts.map((t, i) => (
                <div key={t.name} style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8, fontSize: 13 }}>
                    <span style={{ fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{i + 1}. {t.name}</span>
                    <span style={{ color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{fmtMoney(t.qty)} {t.unit}</span>
                  </div>
                  <div style={{ height: 8, borderRadius: 4, background: 'var(--bg-hover)', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${Math.round((t.qty / topMaxQty) * 100)}%`, borderRadius: 4, background: i === 0 ? '#059669' : '#3b82f6' }} />
                  </div>
                </div>
              ))}
              {topProducts.length === 0 && (
                <div style={{ fontSize: 14, color: 'var(--text-muted)', textAlign: 'center', padding: '16px 0' }}>
                  Расходных движений пока нет
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ===== Цены ===== */}
      {effectiveTab === 'prices' && (
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
                  title={t.forVitrine ? 'Показывается на витрине (нажмите, чтобы скрыть)' : 'Не показывается на витрине (нажмите, чтобы показать)'}
                  onClick={() => toggleVitrine(t)}
                  style={{ border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, padding: '2px 8px', borderRadius: 8, background: t.forVitrine ? '#16a34a' : 'rgba(0,0,0,0.12)', color: t.forVitrine ? '#fff' : 'inherit' }}
                >
                  Витрина
                </button>
                <button
                  title={t.isRetail ? 'Розничная цена (нажмите, чтобы снять)' : 'Отметить как розничную цену'}
                  onClick={() => togglePriceFlag(t, 'isRetail')}
                  style={{ border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, padding: '2px 8px', borderRadius: 8, background: t.isRetail ? '#2563eb' : 'rgba(0,0,0,0.12)', color: t.isRetail ? '#fff' : 'inherit' }}
                >
                  Розничная
                </button>
                <button
                  title={t.forCashless ? 'Используется для безнала — счёт на организацию (нажмите, чтобы снять)' : 'Использовать эту цену при оплате «Счёт на организацию»'}
                  onClick={() => togglePriceFlag(t, 'forCashless')}
                  style={{ border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, padding: '2px 8px', borderRadius: 8, background: t.forCashless ? '#7c3aed' : 'rgba(0,0,0,0.12)', color: t.forCashless ? '#fff' : 'inherit' }}
                >
                  Безнал
                </button>
                <button
                  onClick={() => setPtModal(t)}
                  style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 12, textDecoration: 'underline' }}
                >
                  изм.
                </button>
              </div>
            ))}
          </div>

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
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                              <input
                                autoFocus
                                value={editingCell!.value}
                                onChange={e => setEditingCell({ ...editingCell!, value: e.target.value })}
                                onBlur={saveCell}
                                onKeyDown={e => { if (e.key === 'Enter') saveCell(); if (e.key === 'Escape') setEditingCell(null); }}
                                style={{ ...inputStyle, width: 110 }}
                              />
                              <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: 3, whiteSpace: 'nowrap' }}>
                                <input
                                  type="checkbox"
                                  checked={editingCell!.priceFrom}
                                  // preventDefault на mousedown: иначе фокус уходит с поля цены,
                                  // срабатывает blur -> saveCell и редактор закрывается ДО переключения
                                  onMouseDown={e => e.preventDefault()}
                                  onChange={e => setEditingCell({ ...editingCell!, priceFrom: e.target.checked })}
                                />
                                от
                              </label>
                            </span>
                          ) : (
                            <span
                              style={{ cursor: 'pointer' }}
                              title="Нажмите для редактирования"
                              onClick={() => setEditingCell({
                                productId: p.id,
                                priceTypeId: t.id,
                                value: String(current ?? ''),
                                priceFrom: (p.prices || []).find((pr: any) => pr.priceTypeId === t.id)?.priceFrom ?? false,
                              })}
                            >
                              {current !== undefined ? `${(p.prices || []).find((pr: any) => pr.priceTypeId === t.id)?.priceFrom ? 'от ' : ''}${fmtMoney(current)}` : '—'}
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
      {catModal && (
        <CategoryModal modal={catModal} categories={categories}
          onClose={() => setCatModal(null)} onSaved={() => { setCatModal(null); load(); }} />
      )}
      {catDelete && (
        <CategoryDeleteModal info={catDelete} categories={categories}
          onClose={() => setCatDelete(null)} onDeleted={(id) => { if (selCat === id) setSelCat('all'); setCatDelete(null); load(); }} />
      )}
    </div>
  );
}

/* ---------- Строка позиции в номенклатуре ---------- */
function ProductRow({ p, indent, priceTypes, totalStock, priceOf, onOpen, onDelete, selected, onToggle, allTags, onSaveTags }: {
  p: Product; indent: number; priceTypes: PriceType[];
  totalStock: number;
  priceOf: (p: Product, ptId: string) => number | undefined;
  onOpen: () => void; onDelete: () => void;
  selected: boolean; onToggle: () => void;
  allTags: string[]; onSaveTags: (tags: string[]) => void;
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
      <td style={{ ...tdStyle, minWidth: 140 }} onClick={e => e.stopPropagation()}>
        <TagsCell tags={p.tags || []} suggestions={allTags} onSave={onSaveTags} />
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
        {p.syncToOzon && (p.ozonProductId ? (
          <a href={`https://www.ozon.ru/product/${p.ozonProductId}/`} target="_blank" rel="noreferrer"
            title={`Карточка в OZON Seller (product_id: ${p.ozonProductId}) — откроется страница товара, откуда можно скопировать ссылку на картинку`}
            style={{ marginLeft: 6, padding: '2px 8px', borderRadius: 8, fontSize: 12, fontWeight: 600, background: '#005BFF', color: '#fff', textDecoration: 'none' }}>
            OZON ↗
          </a>
        ) : (
          <span title="Будет выгружен в OZON Seller при синхронизации"
            style={{ marginLeft: 6, padding: '2px 8px', borderRadius: 8, fontSize: 12, fontWeight: 600, background: '#005BFF', color: '#fff' }}>
            OZON
          </span>
        ))}
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

/* ---------- Ячейка «Теги» таблицы номенклатуры: просмотр + быстрое добавление ---------- */
function TagsCell({ tags, suggestions, onSave }: { tags: string[]; suggestions: string[]; onSave: (tags: string[]) => void }) {
  const [editing, setEditing] = useState(false);
  const chipStyle: React.CSSProperties = { padding: '1px 8px', borderRadius: 10, fontSize: 11, background: 'var(--bg-hover)', color: 'var(--text-muted)', border: 'none' };
  // Все теги позиции доступны по наведению на «+N»
  const overflowTitle = tags.join(', ');
  if (editing) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 220 }}>
        <TagInput value={tags} onChange={onSave} suggestions={suggestions} />
        <button type="button" onClick={() => setEditing(false)} style={{ ...btnGhost, alignSelf: 'flex-start', fontSize: 12, padding: '3px 10px' }}>Готово</button>
      </div>
    );
  }
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, alignItems: 'center' }}>
      {tags.slice(0, 3).map(t => <span key={t} style={chipStyle}>{t}</span>)}
      {tags.length > 3 && (
        <span title={overflowTitle} style={{ ...chipStyle, cursor: 'help' }}>+{tags.length - 3}</span>
      )}
      <button type="button" onClick={() => setEditing(true)} title="Добавить тег"
        style={{ width: 20, height: 20, borderRadius: 6, border: '1px dashed var(--border-color)', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 13, lineHeight: 1, flexShrink: 0 }}>
        +
      </button>
    </div>
  );
}

/* ---------- Ввод тегов: свободный ввод + автоподстановка существующих ---------- */
function TagInput({ value, onChange, suggestions }: { value: string[]; onChange: (tags: string[]) => void; suggestions: string[] }) {
  const [input, setInput] = useState('');
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const s = input.trim().toLowerCase();
  // Автоподстановка: существующие теги, ещё не добавленные в карточку, фильтр по вводу
  const matches = useMemo(
    () => suggestions.filter(t => !value.includes(t) && (!s || t.toLowerCase().includes(s))).slice(0, 8),
    [suggestions, value, s]
  );
  // Закрытие выпадающего списка по клику вне поля
  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);
  const add = (tag: string) => {
    const t = tag.trim();
    if (t && !value.includes(t)) onChange([...value, t]);
    setInput('');
    setOpen(false);
  };
  const remove = (tag: string) => onChange(value.filter(t => t !== tag));
  return (
    <div ref={wrapRef} style={{ position: 'relative' }}>
      <div style={{ ...inputStyle, display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center', cursor: 'text', minHeight: 40, height: 'auto' }}
        onClick={() => { setOpen(true); (wrapRef.current?.querySelector('input') as HTMLInputElement | null)?.focus(); }}>
        {value.map(t => (
          <span key={t} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 8, fontSize: 12, fontWeight: 500, background: 'var(--bg-hover)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}>
            {t}
            <button type="button" onClick={(e) => { e.stopPropagation(); remove(t); }} title="Убрать тег"
              style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 13, color: 'var(--text-muted)', padding: 0, lineHeight: 1 }}>×</button>
          </span>
        ))}
        <input value={input} style={{ border: 'none', outline: 'none', background: 'transparent', color: 'var(--text-primary)', fontSize: 14, flex: 1, minWidth: 140, padding: '4px 0' }}
          placeholder={value.length ? '' : 'Введите тег и нажмите Enter'}
          onChange={e => { setInput(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onKeyDown={e => {
            if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); add(input); }
            else if (e.key === 'Backspace' && !input && value.length) remove(value[value.length - 1]);
          }} />
      </div>
      {open && matches.length > 0 && (
        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 20, background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 8, marginTop: 4, boxShadow: '0 6px 18px rgba(0,0,0,.12)', maxHeight: 180, overflowY: 'auto' }}>
          {matches.map(t => (
            <button key={t} type="button" onClick={() => add(t)}
              style={{ display: 'block', width: '100%', textAlign: 'left', border: 'none', background: 'transparent', padding: '8px 12px', cursor: 'pointer', fontSize: 13, color: 'var(--text-primary)' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
              {t}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------- Модалка позиции (WYSIWYG-описание + галерея) ---------- */
function ProductModal({ product, categories, onClose, onSaved }: { product: Product | 'new'; categories: ProductCategory[]; onClose: () => void; onSaved: () => void }) {
  const isNew = product === 'new';
  const [form, setForm] = useState<{ name: string; kind: 'product' | 'service'; sku: string; unit: string; barcode: string; weight: string; width: string; height: string; depth: string; syncToVk: boolean; syncToOzon: boolean; onVitrine: boolean; isSubscription: boolean; description: string; tags: string[] }>({
    name: isNew ? '' : product.name,
    kind: isNew ? 'product' : product.kind,
    sku: isNew ? '' : product.sku || '',
    unit: isNew ? 'шт' : product.unit,
    barcode: isNew ? '' : product.barcode || '',
    weight: isNew ? '' : (product.weight != null ? String(product.weight) : ''),
    width: isNew ? '' : (product.width != null ? String(product.width) : ''),
    height: isNew ? '' : (product.height != null ? String(product.height) : ''),
    depth: isNew ? '' : (product.depth != null ? String(product.depth) : ''),
    syncToVk: isNew ? false : product.syncToVk,
    syncToOzon: isNew ? false : product.syncToOzon,
    onVitrine: isNew ? false : product.onVitrine,
    isSubscription: isNew ? false : product.isSubscription,
    description: isNew ? '' : product.description || '',
    tags: isNew ? [] : (product.tags || []),
  });
  // Существующие теги всех карточек — для автоподстановки при вводе
  const [tagSuggestions, setTagSuggestions] = useState<string[]>([]);
  useEffect(() => {
    api.products.tags().then(setTagSuggestions).catch(() => {});
  }, []);
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
  // Загрузка изображения по внешней ссылке (например, из кабинета OZON)
  const [imageUrl, setImageUrl] = useState('');
  const [urlBusy, setUrlBusy] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const origin = window.location.origin;

  const save = async () => {
    if (!form.name.trim()) { setError('Название обязательно'); return; }
    setSaving(true); setError('');
    try {
      const num = (v: string) => (v === '' ? null : Number(v));
      const payload = { ...form, categoryId: categoryId || null, weight: num(form.weight), width: num(form.width), height: num(form.height), depth: num(form.depth) };
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

  // Скачать изображение по ссылке (например, из кабинета OZON) и прикрепить к товару
  const addImageByUrl = async () => {
    if (isNew || !imageUrl.trim()) return;
    setUrlBusy(true); setError('');
    try {
      await api.products.addImageByUrl(product.id, imageUrl.trim());
      setImageUrl('');
      onSaved();
    } catch (e: any) { setError(e.message || 'Ошибка загрузки по ссылке'); }
    finally { setUrlBusy(false); }
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
          {form.kind === 'service' && (
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 500, cursor: 'pointer' }}>
              <input type="checkbox" checked={form.isSubscription} onChange={e => setForm({ ...form, isSubscription: e.target.checked })} style={{ width: 16, height: 16 }} />
              Подписка
            </label>
          )}
          {!isNew && product.article && (
            <div>
              <label style={{ fontSize: 14, fontWeight: 500 }}>Внутренний артикул</label>
              <div style={{ ...inputStyle, background: 'var(--bg-hover)', color: 'var(--text-muted)', cursor: 'default' }}>{product.article}</div>
            </div>
          )}
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
          {form.kind === 'product' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
              <div>
                <label style={{ fontSize: 14, fontWeight: 500 }}>Вес, кг</label>
                <input type="number" step="0.001" min="0" value={form.weight} onChange={e => setForm({ ...form, weight: e.target.value })} style={inputStyle} />
              </div>
              <div>
                <label style={{ fontSize: 14, fontWeight: 500 }}>Ширина, см</label>
                <input type="number" step="0.1" min="0" value={form.width} onChange={e => setForm({ ...form, width: e.target.value })} style={inputStyle} />
              </div>
              <div>
                <label style={{ fontSize: 14, fontWeight: 500 }}>Высота, см</label>
                <input type="number" step="0.1" min="0" value={form.height} onChange={e => setForm({ ...form, height: e.target.value })} style={inputStyle} />
              </div>
              <div>
                <label style={{ fontSize: 14, fontWeight: 500 }}>Глубина, см</label>
                <input type="number" step="0.1" min="0" value={form.depth} onChange={e => setForm({ ...form, depth: e.target.value })} style={inputStyle} />
              </div>
            </div>
          )}
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 500, cursor: 'pointer' }}>
            <input type="checkbox" checked={form.syncToVk} onChange={e => setForm({ ...form, syncToVk: e.target.checked })} style={{ width: 16, height: 16 }} />
            Синхронизировать с ВКонтакте
          </label>
          {form.kind === 'product' && (
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 500, cursor: 'pointer' }}>
              <input type="checkbox" checked={form.syncToOzon} onChange={e => setForm({ ...form, syncToOzon: e.target.checked })} style={{ width: 16, height: 16 }} />
              OZON Seller
              {!isNew && product.ozonProductId && (
                <a href={`https://www.ozon.ru/product/${product.ozonProductId}/`} target="_blank" rel="noreferrer"
                  title="Открыть карточку товара в OZON"
                  style={{ marginLeft: 6, fontSize: 12, color: '#005BFF', textDecoration: 'none', fontWeight: 600 }}>
                  Открыть в OZON ↗
                </a>
              )}
            </label>
          )}
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 500, cursor: 'pointer' }}>
            <input type="checkbox" checked={form.onVitrine} onChange={e => setForm({ ...form, onVitrine: e.target.checked })} style={{ width: 16, height: 16 }} />
            На витрине
          </label>
          <label style={{ fontSize: 14, fontWeight: 500 }}>Теги</label>
          <TagInput value={form.tags} onChange={tags => setForm({ ...form, tags })} suggestions={tagSuggestions} />
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
              {!isNew && (
                <span style={{ display: 'flex', gap: 8, alignItems: 'center', alignSelf: 'flex-start', flexWrap: 'wrap' }}>
                  <input
                    value={imageUrl}
                    onChange={e => setImageUrl(e.target.value)}
                    placeholder="или URL картинки (например, из OZON)"
                    style={{ ...inputStyle, width: 280, padding: '6px 10px', fontSize: 13 }}
                  />
                  <button type="button" onClick={addImageByUrl} disabled={urlBusy || !imageUrl.trim()} style={{ ...btnGhost, opacity: (urlBusy || !imageUrl.trim()) ? 0.5 : 1 }}>
                    {urlBusy ? 'Загрузка...' : 'По ссылке'}
                  </button>
                </span>
              )}
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
  const [forVitrine, setForVitrine] = useState(isNew ? false : !!priceType.forVitrine);
  const [forVk, setForVk] = useState(isNew ? false : !!priceType.forVk);
  const [isRetail, setIsRetail] = useState(isNew ? false : !!priceType.isRetail);
  const [forCashless, setForCashless] = useState(isNew ? false : !!priceType.forCashless);
  const [error, setError] = useState('');

  const save = async () => {
    try {
      if (isNew) await api.products.priceTypes.create({ name, label, color, forVitrine, forVk, isRetail, forCashless });
      else await api.products.priceTypes.update(priceType.id, { label, color, forVitrine, forVk, isRetail, forCashless });
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
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, cursor: 'pointer' }}>
            <input type="checkbox" checked={forVitrine} onChange={e => setForVitrine(e.target.checked)} />
            Показывать на витрине
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, cursor: 'pointer' }}>
            <input type="checkbox" checked={isRetail} onChange={e => setIsRetail(e.target.checked)} />
            Розничная
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, cursor: 'pointer' }}>
            <input type="checkbox" checked={forCashless} onChange={e => setForCashless(e.target.checked)} />
            Использовать для безнала (счёт на организацию)
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, cursor: 'pointer' }}>
            <input type="checkbox" checked={forVk} onChange={e => setForVk(e.target.checked)} />
            Для ВК
          </label>
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

// Модал детализации резерва: кем и под каким номером зарезервирован товар
// (открывается по клику на количество в колонке «Резерв» таблицы «Склад»)
function ReserveDetailModal({ product, warehouseId, onClose }: { product: Product; warehouseId: string | null; onClose: () => void }) {
  const [items, setItems] = useState<any[] | null>(null);
  const [error, setError] = useState('');
  useEffect(() => {
    let cancelled = false;
    setItems(null);
    setError('');
    api.reservations.byProduct(product.id, warehouseId || undefined)
      .then((list: any[]) => { if (!cancelled) setItems(list); })
      .catch((e: any) => { if (!cancelled) setError(e.message || 'Ошибка загрузки'); });
    return () => { cancelled = true; };
  }, [product.id, warehouseId]);

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}>
      <div style={{ background: 'var(--bg-card)', borderRadius: 12, padding: 20, width: 760, maxWidth: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
        <h3 style={{ margin: '0 0 4px' }}>Резерв: {product.name}</h3>
        {product.sku && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>Артикул: {product.sku}</div>}
        {error && <div style={{ color: '#dc2626', margin: '8px 0' }}>{error}</div>}
        {!error && items === null && <div style={{ padding: '12px 0', color: 'var(--text-muted)' }}>Загрузка...</div>}
        {items !== null && items.length === 0 && (
          <div style={{ padding: '12px 0', color: 'var(--text-muted)' }}>Активных резервов по этой позиции нет.</div>
        )}
        {items !== null && items.length > 0 && (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={thStyle}>Резерв</th>
                  <th style={thStyle}>Кто зарезервировал</th>
                  <th style={thStyle}>Заказчик</th>
                  {!warehouseId && <th style={thStyle}>Склад</th>}
                  <th style={{ ...thStyle, textAlign: 'right' }}>Кол-во</th>
                  <th style={thStyle}>Дата</th>
                </tr>
              </thead>
              <tbody>
                {items.map((it: any) => (
                  <tr key={it.id}>
                    <td style={{ ...tdStyle, fontWeight: 600, whiteSpace: 'nowrap' }}>00We-{String(it.reservation.number).padStart(6, '0')}</td>
                    <td style={tdStyle}>{it.reservation.user?.name || '—'}</td>
                    <td style={tdStyle}>{it.reservation.contact?.name || '—'}</td>
                    {!warehouseId && <td style={tdStyle}>{it.reservation.warehouse?.name || '—'}</td>}
                    <td style={{ ...tdStyle, textAlign: 'right', whiteSpace: 'nowrap' }}>{fmtMoney(it.quantity)} {product.unit}</td>
                    <td style={{ ...tdStyle, whiteSpace: 'nowrap' }}>{new Date(it.reservation.createdAt).toLocaleString('ru-RU')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
          <button onClick={onClose} style={btnGhost}>Закрыть</button>
        </div>
      </div>
    </div>
  );
}

function ReservesTab() {
  const { user } = useAuth();
  // Администратор и менеджер видят все кнопки действий, остальным — только «Счёт» и «Отменить»
  const isPrivileged = ['admin', 'manager'].includes((user as any)?.role) || !!(user as any)?.stockAccess;
  // Роль «Пользователь»: резерв оформляется на себя — контакт не выбирается
  const isUserRole = (user as any)?.role === 'user';
  const [reserves, setReserves] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [contacts, setContacts] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [editRes, setEditRes] = useState<any | null>(null);
  const [editContactId, setEditContactId] = useState('');
  const [editUserId, setEditUserId] = useState('');
  const [editNumber, setEditNumber] = useState('');
  const [editUsers, setEditUsers] = useState<any[]>([]);
  // Добавление товара в резерв из модалки: поиск + выбор вида цены
  const [addQuery, setAddQuery] = useState('');
  const [addFound, setAddFound] = useState<any[]>([]);
  const [addPriceType, setAddPriceType] = useState('base');
  const [editComment, setEditComment] = useState('');
  const [editItems, setEditItems] = useState<any[]>([]);
  const [editBusy, setEditBusy] = useState(false);
  const [delFor, setDelFor] = useState<string | null>(null);
  const [expandedRes, setExpandedRes] = useState<string | null>(null);

  const load = () => api.reservations.list().then(setReserves).catch(() => {});
  useEffect(() => {
    load().finally(() => setLoading(false));
    api.contacts.list().then(setContacts).catch(() => {});
    api.products.list().then(setProducts).catch(() => {});
  }, []);

  const setStatus = async (r: any, status: string) => {
    try { await api.reservations.update(r.id, { status }); load(); }
    catch (e: any) { alert(e.message || e.error || 'Ошибка'); }
  };
  const doDelete = async (r: any) => {
    try { await api.reservations.delete(r.id); setDelFor(null); load(); }
    catch (e: any) { alert(e.message || e.error || 'Ошибка'); }
  };
  const openEdit = async (r: any) => {
    setEditRes(r);
    setEditContactId(r.contactId || '');
    setEditUserId(r.userId || '');
    setEditNumber(String(r.number || ''));
    setEditComment(r.comment || '');
    setAddQuery(''); setAddFound([]); setAddPriceType('base');
    if (isPrivileged) {
      try { setEditUsers(await api.users.list()); } catch { setEditUsers([]); }
    }
    setEditItems(r.items.map((i: any) => ({ productId: i.productId, name: i.product.name, quantity: i.quantity, price: i.price })));
  };
  // Поиск товара для добавления в резерв
  const searchAddProduct = async (q: string) => {
    setAddQuery(q);
    if (q.trim().length < 2) { setAddFound([]); return; }
    try {
      const list = await api.products.list({ q });
      setAddFound(Array.isArray(list) ? list.slice(0, 8) : []);
    } catch { setAddFound([]); }
  };

  // Виды цен товара: из объекта prices (base / безнал / кор. и т.п.)
  const priceOptions = (p: any) => {
    const pr = p?.prices || {};
    const opts: Array<{ key: string; label: string; value: number }> = [];
    if (pr.base) opts.push({ key: 'base', label: 'Базовая', value: Number(pr.base) });
    if (pr.cash) opts.push({ key: 'cash', label: 'Наличный расчёт', value: Number(pr.cash) });
    if (pr.noncash) opts.push({ key: 'noncash', label: 'Безналичный расчёт', value: Number(pr.noncash) });
    Object.entries(pr).forEach(([k, v]: [string, any]) => {
      if (!['base', 'cash', 'noncash'].includes(k) && typeof v === 'number' && v > 0) {
        opts.push({ key: k, label: k, value: Number(v) });
      }
    });
    return opts.length ? opts : [{ key: 'manual', label: 'Вручную', value: 0 }];
  };

  const addProductToEdit = (p: any) => {
    const opt = priceOptions(p).find(o => o.key === addPriceType) || priceOptions(p)[0];
    setEditItems((prev: any[]) => {
      const ex = prev.find(i => i.productId === p.id);
      if (ex) return prev.map(i => i.productId === p.id ? { ...i, quantity: (Number(i.quantity) || 0) + 1 } : i);
      return [...prev, { productId: p.id, name: p.name, quantity: 1, price: opt.value }];
    });
    setAddQuery(''); setAddFound([]);
  };

  const saveEdit = async () => {
    setEditBusy(true);
    try {
      await api.reservations.update(editRes.id, {
        ...(isPrivileged && editNumber ? { number: editNumber } : {}),
        ...(isUserRole ? {} : { contactId: editContactId }),
        ...(isPrivileged && editUserId ? { userId: editUserId } : {}),
        comment: editComment,
        items: editItems.map((i) => ({ productId: i.productId, quantity: Number(i.quantity) || 0, price: Number(i.price) || 0 })),
      });
      setEditRes(null);
      load();
    } catch (e: any) { alert(e.message || e.error || 'Ошибка'); }
    setEditBusy(false);
  };
  // Отправка резерва в обсуждение задачи со статусом «В работе» (выпадающий список вместо prompt)
  const [shareRes, setShareRes] = useState<string | null>(null);
  const [shareTasks, setShareTasks] = useState<any[]>([]);
  const [shareTaskId, setShareTaskId] = useState('');
  const [shareBusy, setShareBusy] = useState(false);

  const openShare = async (id: string) => {
    setShareRes(id);
    setShareTaskId('');
    setShareTasks([]);
    try {
      const statuses = await api.statuses.list('task');
      const inWork = statuses.find((s: any) => s.name === 'in_progress') || statuses.find((s: any) => s.label === 'В работе');
      const tasks = await api.tasks.list(inWork ? `status=${encodeURIComponent(inWork.name)}` : '');
      setShareTasks(Array.isArray(tasks) ? tasks : (tasks as any)?.tasks ?? []);
    } catch { setShareTasks([]); }
  };

  const doShare = async () => {
    if (!shareRes || !shareTaskId) return;
    setShareBusy(true);
    try {
      await api.reservations.share(shareRes, shareTaskId);
      alert('Отправлено в обсуждение задачи');
      setShareRes(null);
    } catch (e: any) { alert(e.message || 'Ошибка отправки'); }
    finally { setShareBusy(false); }
  };
  const statusLabel = (s: string) => s === 'held' ? 'Отложено' : s === 'issued' ? 'Выдано' : s === 'canceled' ? 'Отменено' : s;

  if (loading) return <div style={{ padding: 16, color: 'var(--text-muted)' }}>Загрузка...</div>;
  return (
    <div>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead><tr>
          <th style={thStyle}>№</th><th style={thStyle}>Дата</th><th style={thStyle}>Контрагент</th>
          <th style={thStyle}>Склад</th><th style={thStyle}>Сумма</th>
          <th style={thStyle}>Статус</th><th style={thStyle}>Автор</th><th style={thStyle}>Документ</th>
        </tr></thead>
        <tbody>
          {reserves.map((r: any) => (
            <Fragment key={r.id}>
              <tr>
                <td style={tdStyle}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <button
                      onClick={() => setExpandedRes(expandedRes === r.id ? null : r.id)}
                      title={expandedRes === r.id ? 'Скрыть состав' : 'Показать состав'}
                      style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 13, padding: '0 2px', lineHeight: 1 }}
                    >
                      {expandedRes === r.id ? '▾' : '▸'}
                    </button>
                    <span>00We-{String(r.number).padStart(6, '0')}</span>
                  </div>
                </td>
                <td style={tdStyle}>{new Date(r.createdAt).toLocaleString('ru-RU')}</td>
                <td style={tdStyle}>{r.contact?.name}</td>
                <td style={tdStyle}>{r.warehouse?.name || '—'}</td>
                <td style={tdStyle}>{r.total.toFixed(2)} ₽</td>
                <td style={tdStyle}>
                  {/* Статус — выпадающий список как у заказов; менять могут только admin/manager */}
                  <select
                    value={r.status}
                    disabled={!isPrivileged}
                    onChange={e => setStatus(r, e.target.value)}
                    style={{ padding: '3px 6px', borderRadius: 6, border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: r.status === 'issued' || r.status === 'paid' ? '#16a34a' : r.status === 'completed' ? '#0d9488' : r.status === 'held' ? '#d97706' : 'var(--text-muted)', fontSize: 12 }}
                  >
                    <option value="held">Отложено</option>
                    <option value="issued">Выдано</option>
                    <option value="canceled">Отменён</option>
                    <option value="paid">Оплачен</option>
                    <option value="completed">Завершён</option>
                  </select>
                </td>
                <td style={tdStyle}>{r.user?.name || '—'}</td>
                <td style={{ ...tdStyle, whiteSpace: 'nowrap' }}>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {/* Редактировать — иконка карандаша */}
                    {isPrivileged && (
                      <button title="Изменить резерв" onClick={() => openEdit(r)}
                        style={{ ...btnGhost, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '6px 8px' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <path d="M17 3a2.83 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>
                        </svg>
                      </button>
                    )}
                    {/* Счёт — только при безналичном способе оплаты (invoice) */}
                    {r.paymentMethod === 'invoice' && <button style={btnGhost} onClick={() => api.reservations.downloadPdf(r.id, r.number)}>Счёт</button>}
                    {isPrivileged && <button style={btnGhost} onClick={() => openShare(r.id)}>В задачу</button>}
                  </div>
                </td>
              </tr>
              {expandedRes === r.id && (
                <tr>
                  <td colSpan={8} style={{ ...tdStyle, background: 'var(--bg-hover)', padding: '10px 16px' }}>
                    <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Состав резерва 00We-{String(r.number).padStart(6, '0')}</div>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                      <thead>
                        <tr>
                          <th style={{ ...thStyle, textAlign: 'left' }}>Товар</th>
                          <th style={{ ...thStyle, textAlign: 'right' }}>Кол-во</th>
                          <th style={{ ...thStyle, textAlign: 'right' }}>Цена</th>
                          <th style={{ ...thStyle, textAlign: 'right' }}>Сумма</th>
                        </tr>
                      </thead>
                      <tbody>
                        {r.items.map((i: any) => (
                          <tr key={i.id}>
                            <td style={{ padding: '4px 8px 4px 0', borderTop: '1px solid var(--border-color)' }}>
                              {i.product?.name}{i.product?.sku ? ` (арт. ${i.product.sku})` : ''}
                            </td>
                            <td style={{ padding: '4px 8px', borderTop: '1px solid var(--border-color)', textAlign: 'right', whiteSpace: 'nowrap' }}>{i.quantity} {i.product?.unit || 'шт'}</td>
                            <td style={{ padding: '4px 8px', borderTop: '1px solid var(--border-color)', textAlign: 'right', whiteSpace: 'nowrap' }}>{Number(i.price).toFixed(2)} ₽</td>
                            <td style={{ padding: '4px 0 4px 8px', borderTop: '1px solid var(--border-color)', textAlign: 'right', whiteSpace: 'nowrap', fontWeight: 500 }}>{(Number(i.price) * i.quantity).toFixed(2)} ₽</td>
                          </tr>
                        ))}
                        <tr>
                          <td colSpan={3} style={{ padding: '6px 8px 0 0', textAlign: 'right', fontWeight: 600 }}>Итого:</td>
                          <td style={{ padding: '6px 0 0 8px', textAlign: 'right', fontWeight: 600, whiteSpace: 'nowrap' }}>{r.total.toFixed(2)} ₽</td>
                        </tr>
                      </tbody>
                    </table>
                  </td>
                </tr>
              )}
            </Fragment>
          ))}
        </tbody>
      </table>
      {!reserves.length && <div style={{ padding: 16, color: 'var(--text-muted)' }}>Резервов пока нет.</div>}

      {/* Модал редактирования резерва */}
      {editRes && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}>
          <div style={{ background: 'var(--bg-card)', borderRadius: 12, padding: 20, width: 560, maxWidth: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ margin: '0 0 14px' }}>Резерв 00We-{String(editRes.number).padStart(6, '0')}</h3>
            {isPrivileged && (
              <>
                <label style={{ fontSize: 13, color: 'var(--text-muted)' }}>Номер</label>
                <input value={editNumber} onChange={e => setEditNumber(e.target.value)} style={{ ...inputStyle, marginTop: 4, marginBottom: 10 }} />
              </>
            )}
            <label style={{ fontSize: 13, color: 'var(--text-muted)' }}>Заказчик</label>
            {isUserRole ? (
              <input value={user?.name || ''} readOnly style={{ ...inputStyle, marginTop: 4, marginBottom: 10, background: 'var(--bg-hover)' }} />
            ) : (
              <select value={editContactId} onChange={e => setEditContactId(e.target.value)} style={{ ...inputStyle, marginTop: 4, marginBottom: 10 }}>
                {contacts.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            )}
            {/* Смена автора резерва — только admin/manager */}
            {isPrivileged && (
              <>
                <label style={{ fontSize: 13, color: 'var(--text-muted)' }}>Автор</label>
                <select value={editUserId} onChange={e => setEditUserId(e.target.value)} style={{ ...inputStyle, marginTop: 4, marginBottom: 10 }}>
                  {editUsers.map((u: any) => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
              </>
            )}
            <label style={{ fontSize: 13, color: 'var(--text-muted)' }}>Комментарий</label>
            <input value={editComment} onChange={e => setEditComment(e.target.value)} placeholder="Комментарий" style={{ ...inputStyle, marginTop: 4, marginBottom: 12 }} />
            {editItems.map((it, idx) => (
              <div key={it.productId} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 13 }}>{it.name}</span>
                <input type="number" min={1} value={it.quantity} onChange={e => setEditItems(editItems.map((x, i) => i === idx ? { ...x, quantity: e.target.value } : x))} style={{ ...inputStyle, width: 72, flex: 'none' }} />
                <input type="number" min={0} value={it.price} onChange={e => setEditItems(editItems.map((x, i) => i === idx ? { ...x, price: e.target.value } : x))} style={{ ...inputStyle, width: 96, flex: 'none' }} />
                <button onClick={() => setEditItems(editItems.filter((_, i) => i !== idx))} style={{ ...btnGhost, flex: 'none', borderColor: '#FF3B30', color: '#FF3B30' }}>✕</button>
              </div>
            ))}
            {/* Добавление позиции: поиск товара + выбор вида цены */}
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8, flexWrap: 'wrap' }}>
              <input value={addQuery} onChange={e => searchAddProduct(e.target.value)} placeholder="Поиск товара…" style={{ ...inputStyle, flex: 2, minWidth: 200, marginBottom: 0 }} />
              <select value={addPriceType} onChange={e => setAddPriceType(e.target.value)} style={{ ...inputStyle, flex: 1, minWidth: 150, marginBottom: 0 }}>
                <option value="base">Базовая</option>
                <option value="cash">Наличный расчёт</option>
                <option value="noncash">Безналичный расчёт</option>
              </select>
            </div>
            {addFound.length > 0 && (
              <div style={{ border: '1px solid var(--border-color)', borderRadius: 8, marginBottom: 12, maxHeight: 200, overflowY: 'auto' }}>
                {addFound.map((p: any) => (
                  <div key={p.id} onClick={() => addProductToEdit(p)}
                    style={{ padding: '8px 10px', cursor: 'pointer', fontSize: 13, borderBottom: '1px solid var(--border-color)' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                    {p.name}
                    <span style={{ color: 'var(--text-muted)', marginLeft: 8 }}>
                      {(priceOptions(p).find(o => o.key === addPriceType) || priceOptions(p)[0])?.value
                        ? `${(priceOptions(p).find(o => o.key === addPriceType) || priceOptions(p)[0]).value.toFixed(2)} ₽`
                        : 'цена вручную'}
                    </span>
                  </div>
                ))}
              </div>
            )}
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => setEditRes(null)} style={btnGhost}>Отмена</button>
              <button onClick={saveEdit} disabled={editBusy} style={btnPrimary}>{editBusy ? 'Сохранение...' : 'Сохранить'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Модал отправки резерва в обсуждение задачи «В работе» */}
      {shareRes && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}>
          <div style={{ background: 'var(--bg-card)', borderRadius: 12, padding: 20, width: 480, maxWidth: '100%' }}>
            <h3 style={{ margin: '0 0 14px' }}>Отправить в обсуждение задачи</h3>
            <label style={{ fontSize: 13, color: 'var(--text-muted)' }}>Задача в работе</label>
            <select value={shareTaskId} onChange={e => setShareTaskId(e.target.value)} style={{ ...inputStyle, marginTop: 4, marginBottom: 14 }}>
              <option value="">— Выберите задачу —</option>
              {shareTasks.map((t: any) => <option key={t.id} value={t.id}>{t.ticketNumber ? `#${t.ticketNumber} ` : ''}{t.title}</option>)}
            </select>
            {!shareTasks.length && <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 14 }}>Нет задач в статусе «В работе».</div>}
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => setShareRes(null)} style={btnGhost}>Отмена</button>
              <button onClick={doShare} disabled={shareBusy || !shareTaskId} style={btnPrimary}>{shareBusy ? 'Отправка...' : 'Отправить'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Подписки: admin/manager видят все подписки всех пользователей, остальные — только свои.
// Продление подписки — кнопка «Продлить», редактирование номера и даты окончания — иконка ✎
function SubscriptionsTab() {
  const { user } = useAuth();
  const isPrivileged = ['admin', 'manager'].includes((user as any)?.role) || !!(user as any)?.stockAccess;
  const [subs, setSubs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editSub, setEditSub] = useState<any | null>(null);
  const [editNumber, setEditNumber] = useState('');
  const [editEndsAt, setEditEndsAt] = useState('');
  const [editBusy, setEditBusy] = useState(false);

  const load = () => api.subscriptions.list().then(setSubs).catch(() => {});
  useEffect(() => {
    load().finally(() => setLoading(false));
  }, []);

  const subNo = (s: any) => `We-${String(s.number).padStart(6, '0')}`;
  // Статусы: «Закончилась» бэкенд выставляет автоматически при истечении срока
  const SUBST: Record<string, { label: string; color: string }> = {
    active: { label: 'Активная', color: '#16a34a' },
    expired: { label: 'Закончилась', color: '#d97706' },
    cancelled: { label: 'Отменена', color: 'var(--text-muted)' },
  };
  const PERIOD_LBL: Record<string, string> = { month: 'мес.', quarter: 'квартал', year: 'год' };

  // Окно продления подписки: «корзина» с выбранным тарифом и онлайн-оплатой (Точка)
  const [renewSub, setRenewSub] = useState<any | null>(null);
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState('');
  const [payOk, setPayOk] = useState('');
  // Контекст активного платежа (orderId) — восстанавливается из sessionStorage
  // после возврата со страницы банка, чтобы опрос статуса продолжился
  const [payCtx, setPayCtx] = useState<{ orderId: string } | null>(() => {
    try { const o = sessionStorage.getItem('subRenewOrderId'); return o ? { orderId: o } : null; }
    catch { return null; }
  });

  // Переход к оплате: создаём платёжную ссылку Точки и уходим на страницу банка
  const payRenew = async () => {
    if (!renewSub) return;
    setPaying(true); setPayError(''); setPayOk('');
    try {
      const r: any = await api.tochkaAcquiring.paySubscription(renewSub.id);
      if (r.paymentUrl) {
        try { sessionStorage.setItem('subRenewOrderId', r.orderId); } catch { /* приватный режим */ }
        setPayCtx({ orderId: r.orderId });
        window.location.href = r.paymentUrl;
      } else setPayError('Банк не вернул ссылку на оплату');
    } catch (e: any) {
      setPayError(e.message || 'Ошибка создания платежа');
    } finally { setPaying(false); }
  };

  // Опрос статуса платежа, пока он не станет paid/failed
  useEffect(() => {
    if (!payCtx) return;
    const t = setInterval(async () => {
      try {
        const st: any = await api.tochkaAcquiring.paymentStatus(payCtx.orderId);
        if (st.status === 'paid') {
          clearInterval(t);
          try { sessionStorage.removeItem('subRenewOrderId'); } catch { /* ignore */ }
          setPayCtx(null);
          setPayOk('Оплата получена — подписка продлена');
          load();
        } else if (st.status === 'failed') {
          clearInterval(t);
          try { sessionStorage.removeItem('subRenewOrderId'); } catch { /* ignore */ }
          setPayCtx(null);
          setPayError('Платёж не прошёл — попробуйте ещё раз');
        }
      } catch { /* повторим на следующем тике */ }
    }, 5000);
    return () => clearInterval(t);
  }, [payCtx]);

  // Смена статуса — только admin/manager
  const setStatusSub = async (s: any, status: string) => {
    try { await api.subscriptions.update(s.id, { status }); load(); }
    catch (e: any) { alert(e.message || e.error || 'Ошибка'); }
  };

  const openEdit = (s: any) => {
    setEditSub(s);
    setEditNumber(String(s.number || ''));
    // datetime-local: YYYY-MM-DDTHH:mm в локальном времени
    const d = s.endsAt ? new Date(s.endsAt) : null;
    setEditEndsAt(d ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}T${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}` : '');
  };

  const saveEdit = async () => {
    setEditBusy(true);
    try {
      await api.subscriptions.update(editSub.id, {
        number: Number(editNumber),
        endsAt: editEndsAt ? new Date(editEndsAt).toISOString() : null,
      });
      setEditSub(null);
      load();
    } catch (e: any) { alert(e.message || e.error || 'Ошибка'); }
    setEditBusy(false);
  };

  if (loading) return <div style={{ padding: 16, color: 'var(--text-muted)' }}>Загрузка...</div>;
  return (
    <div>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead><tr>
          <th style={thStyle}>№</th><th style={thStyle}>Дата оформления</th><th style={thStyle}>Дата окончания</th>
          <th style={thStyle}>Тариф</th><th style={thStyle}>Сумма</th>
          <th style={thStyle}>Статус</th><th style={thStyle}>Автор</th><th style={thStyle}>Продление</th>
        </tr></thead>
        <tbody>
          {subs.map((s: any) => {
            const st = SUBST[s.status] || { label: s.status, color: 'var(--text-muted)' };
            return (
              <tr key={s.id}>
                <td style={tdStyle}>{subNo(s)}</td>
                <td style={tdStyle}>{new Date(s.createdAt).toLocaleDateString('ru-RU')}</td>
                <td style={tdStyle}>{s.activeUntil ? new Date(s.activeUntil).toLocaleDateString('ru-RU') : '—'}</td>
                <td style={tdStyle}>{s.product?.name || 'Услуга'}{s.period ? ` · ${PERIOD_LBL[s.period] || s.period}` : ''}</td>
                <td style={tdStyle}>{fmtMoney(Number(s.price || 0))} ₽</td>
                <td style={tdStyle}>
                  {/* Статус — выпадающий список как у резервов; менять могут только admin/manager */}
                  <select
                    value={s.status}
                    disabled={!isPrivileged}
                    onChange={e => setStatusSub(s, e.target.value)}
                    style={{ padding: '3px 6px', borderRadius: 6, border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: st.color, fontSize: 12 }}
                  >
                    <option value="active">Активная</option>
                    <option value="expired">Закончилась</option>
                    <option value="cancelled">Отменена</option>
                  </select>
                </td>
                <td style={tdStyle}>{s.user?.name || s.contact?.name || '—'}</td>
                <td style={{ ...tdStyle, whiteSpace: 'nowrap' }}>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    {(s.status === 'active' || s.status === 'expired') && (
                      <button title="Продлить подписку" onClick={() => { setPayError(''); setPayOk(''); setRenewSub(s); }} style={btnGhost}>Продлить</button>
                    )}
                    {/* Редактировать — иконка карандаша, как у резервов; только admin/manager */}
                    {isPrivileged && (
                      <button title="Изменить подписку" onClick={() => openEdit(s)}
                        style={{ ...btnGhost, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '6px 8px' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <path d="M17 3a2.83 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>
                        </svg>
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {!subs.length && <div style={{ padding: 16, color: 'var(--text-muted)' }}>Подписок пока нет.</div>}

      {/* Модал редактирования подписки: номер и дата окончания */}
      {editSub && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}>
          <div style={{ background: 'var(--bg-card)', borderRadius: 12, padding: 20, width: 420, maxWidth: '100%' }}>
            <h3 style={{ margin: '0 0 14px' }}>Подписка {subNo(editSub)}</h3>
            <label style={{ fontSize: 13, color: 'var(--text-muted)' }}>Номер</label>
            <input type="number" min={1} value={editNumber} onChange={e => setEditNumber(e.target.value)} style={{ ...inputStyle, marginTop: 4, marginBottom: 10 }} />
            <label style={{ fontSize: 13, color: 'var(--text-muted)' }}>Дата окончания</label>
            <input type="datetime-local" value={editEndsAt} onChange={e => setEditEndsAt(e.target.value)} style={{ ...inputStyle, marginTop: 4, marginBottom: 14 }} />
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => setEditSub(null)} style={btnGhost}>Отмена</button>
              <button onClick={saveEdit} disabled={editBusy || !editNumber} style={btnPrimary}>{editBusy ? 'Сохранение...' : 'Сохранить'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Модал продления: «корзина» с выбранным тарифом и онлайн-оплатой */}
      {renewSub && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}>
          <div style={{ background: 'var(--bg-card)', borderRadius: 12, padding: 20, width: 440, maxWidth: '100%', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ margin: 0 }}>Продление подписки {subNo(renewSub)}</h3>
              <button onClick={() => setRenewSub(null)} style={{ border: 'none', background: 'transparent', fontSize: 15, cursor: 'pointer', color: 'var(--text-muted)', padding: 4 }}>✕</button>
            </div>
            {/* Позиция «корзины» — выбранный тариф */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', border: '1px solid var(--border-color)', borderRadius: 10 }}>
              <span style={{ fontSize: 18 }}>🛒</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{renewSub.product?.name || 'Услуга'}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  Тариф: {PERIOD_LBL[renewSub.period] || renewSub.period} · 1 × {fmtMoney(Number(renewSub.price || 0))} ₽
                  {renewSub.activeUntil ? ` · действует до ${new Date(renewSub.activeUntil).toLocaleDateString('ru-RU')}` : ''}
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>
              <span>Итого к оплате</span><span>{fmtMoney(Number(renewSub.price || 0))} ₽</span>
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>После оплаты к сроку окончания добавится {PERIOD_LBL[renewSub.period] || 'период'} тарифа. Выбор карта/СБП — на странице банка.</div>
            {payError && <div style={{ color: '#dc2626', fontSize: 13 }}>{payError}</div>}
            {payOk && <div style={{ color: '#16a34a', fontSize: 13 }}>{payOk}</div>}
            <button onClick={payRenew} disabled={paying} style={{ ...btnPrimary, width: '100%', justifyContent: 'center', padding: '10px 16px', fontWeight: 600, opacity: paying ? 0.7 : 1 }}>
              {paying ? 'Создание платежа...' : 'Перейти к оплате'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Продажи (реализация) с корзины витрины; оплата — позже
function SalesTab() {
  const { user } = useAuth();
  // Только администратор и менеджер могут менять статусы заказов
  const canChangeStatus = ['admin', 'manager'].includes((user as any)?.role);
  const [sales, setSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [payingSaleId, setPayingSaleId] = useState<string | null>(null);

  // Онлайн-оплата продажи: создаём (или переиспользуем) платёжную ссылку Точки и переходим на неё
  const paySaleOnline = async (s: any) => {
    setPayingSaleId(s.id);
    try {
      const r: any = await api.tochkaAcquiring.pay(s.id, 'link');
      if (r.paymentUrl) window.open(r.paymentUrl, '_blank');
      else alert('Банк не вернул ссылку на оплату');
    } catch (e: any) {
      alert(e.message || 'Ошибка создания платежа');
    } finally {
      setPayingSaleId(null);
    }
  };
  const salesRef = useRef<any[]>([]);
  salesRef.current = sales;

  const load = () => api.sales.list().then(setSales).catch(() => {});
  useEffect(() => {
    load().finally(() => setLoading(false));
  }, []);

  // Автоопрос статуса онлайн-оплат Точки: «Новый» + способ «tochka» — сверяем с банком
  useEffect(() => {
    const check = async () => {
      let changed = false;
      for (const s of salesRef.current) {
        if (s.status === 'new' && s.paymentMethod === 'tochka') {
          try {
            const st: any = await api.tochkaAcquiring.paymentStatus(`WE-${String(s.number).padStart(9, '0')}`);
            if (st.status === 'paid' || st.status === 'failed') changed = true;
          } catch { /* повторим на следующем тике */ }
        }
      }
      if (changed) load();
    };
    check();
    const t = setInterval(check, 10000);
    return () => clearInterval(t);
  }, []);

  const changeStatus = async (s: any, status: string) => {
    if (!canChangeStatus) return;
    try {
      await api.sales.update(s.id, { status });
      await load();
    } catch (e: any) { alert(e.message || 'Ошибка смены статуса'); }
  };

  // Номер продажи = номер заказа в банке: WE- + 9 цифр
  const saleNo = (s: any) => `WE-${String(s.number).padStart(9, '0')}`;

  const statusLabel = (s: string) => s === 'new' ? 'Новый' : s === 'paid' ? 'Оплачен' : s === 'cancelled' ? 'Отменён' : s === 'refund' ? 'Возврат' : s;
  const statusColor = (s: string) => s === 'paid' ? '#16a34a' : s === 'new' ? '#d97706' : s === 'refund' ? '#7c3aed' : 'var(--text-muted)';

  if (loading) return <div style={{ padding: 16, color: 'var(--text-muted)' }}>Загрузка...</div>;
  return (
    <div>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead><tr>
          <th style={thStyle}>№</th><th style={thStyle}>Дата</th>
          {canChangeStatus && <th style={thStyle}>Контрагент</th>}
          <th style={thStyle}>Склад</th><th style={thStyle}>Сумма</th>
          <th style={thStyle}>Статус</th>
          {canChangeStatus && <th style={thStyle}>Автор</th>}
          <th style={thStyle}>Документ</th>
        </tr></thead>
        <tbody>
          {sales.map((s: any) => (
            <Fragment key={s.id}>
              <tr style={s.status === 'cancelled' || s.status === 'refund' ? { opacity: 0.55 } : undefined}>
                <td style={tdStyle}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <button
                      onClick={() => setExpanded(expanded === s.id ? null : s.id)}
                      title={expanded === s.id ? 'Скрыть состав' : 'Показать состав'}
                      style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 13, padding: '0 2px', lineHeight: 1 }}
                    >
                      {expanded === s.id ? '▾' : '▸'}
                    </button>
                    <span>{saleNo(s)}</span>
                  </div>
                </td>
                <td style={tdStyle}>{new Date(s.createdAt).toLocaleString('ru-RU')}</td>
                {canChangeStatus && <td style={tdStyle}>{s.contact?.name}</td>}
                <td style={tdStyle}>{s.warehouse?.name || '—'}</td>
                <td style={tdStyle}>{Number(s.total).toFixed(2)} ₽</td>
                <td style={{ ...tdStyle, color: statusColor(s.status), fontWeight: 600 }}>
                  <select value={s.status} disabled={!canChangeStatus || s.status === 'cancelled' || s.status === 'refund'} onChange={e => changeStatus(s, e.target.value)} style={{ padding: '3px 6px', borderRadius: 6, border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'inherit', fontSize: 12 }}>
                    <option value="new">Новый</option>
                    <option value="paid">Оплачен</option>
                    <option value="cancelled">Отменён</option>
                    <option value="refund">Возврат</option>
                  </select>
                </td>
                {canChangeStatus && <td style={tdStyle}>{s.user?.name || '—'}</td>}
                <td style={tdStyle}>
                  {s.status === 'new' && (
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn-action" style={{ padding: '4px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap' }}
                        disabled={payingSaleId === s.id}
                        onClick={() => paySaleOnline(s)}>
                        {payingSaleId === s.id ? 'Создание...' : 'Оплатить'}
                      </button>
                      <button style={{ ...btnGhost }} onClick={() => api.sales.downloadPdf(s.id, s.number)}>Счёт</button>
                    </div>
                  )}
                </td>
              </tr>
              {expanded === s.id && (
                <tr>
                  <td colSpan={canChangeStatus ? 8 : 6} style={{ ...tdStyle, background: 'var(--bg-hover)', padding: '10px 16px' }}>
                    <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Состав заказа {saleNo(s)}</div>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                      <thead>
                        <tr>
                          <th style={{ ...thStyle, textAlign: 'left' }}>Товар</th>
                          <th style={{ ...thStyle, textAlign: 'right' }}>Кол-во</th>
                          <th style={{ ...thStyle, textAlign: 'right' }}>Цена</th>
                          <th style={{ ...thStyle, textAlign: 'right' }}>Сумма</th>
                        </tr>
                      </thead>
                      <tbody>
                        {s.items.map((i: any) => (
                          <tr key={i.id}>
                            <td style={{ padding: '4px 8px 4px 0', borderTop: '1px solid var(--border-color)' }}>
                              {i.product?.name}{i.product?.sku ? ` (арт. ${i.product.sku})` : ''}
                            </td>
                            <td style={{ padding: '4px 8px', borderTop: '1px solid var(--border-color)', textAlign: 'right', whiteSpace: 'nowrap' }}>{i.quantity} {i.product?.unit || 'шт'}</td>
                            <td style={{ padding: '4px 8px', borderTop: '1px solid var(--border-color)', textAlign: 'right', whiteSpace: 'nowrap' }}>{Number(i.price).toFixed(2)} ₽</td>
                            <td style={{ padding: '4px 0 4px 8px', borderTop: '1px solid var(--border-color)', textAlign: 'right', whiteSpace: 'nowrap', fontWeight: 500 }}>{(Number(i.price) * i.quantity).toFixed(2)} ₽</td>
                          </tr>
                        ))}
                        <tr>
                          <td colSpan={3} style={{ padding: '6px 8px 0 0', textAlign: 'right', fontWeight: 600 }}>Итого:</td>
                          <td style={{ padding: '6px 0 0 8px', textAlign: 'right', fontWeight: 600, whiteSpace: 'nowrap' }}>{Number(s.total).toFixed(2)} ₽</td>
                        </tr>
                      </tbody>
                    </table>
                  </td>
                </tr>
              )}
            </Fragment>
          ))}
        </tbody>
      </table>
      {!sales.length && <div style={{ padding: 16, color: 'var(--text-muted)' }}>Заказов пока нет.</div>}
    </div>
  );
}

/* ---------- Модалка категории (создание / редактирование) ---------- */
/* ---------- Каскадный выбор категории OZON (дерево из /api/ozon-plugin/categories) ---------- */
function OzonCategoryPicker({ tree, path, onChange }: {
  tree: any[];
  path: number[];
  onChange: (id: number | null, path: number[]) => void;
}) {
  // Группы имеют description_category_id и children; конечные типы — type_id (именно он нужен для создания товара в OZON)
  const levelOptions = (idx: number): any[] => {
    let nodes = tree;
    for (let i = 0; i < idx; i++) {
      const cur = nodes.find((n) => (n.type_id ?? n.description_category_id) === path[i]);
      nodes = cur?.children || [];
    }
    return nodes;
  };
  const pick = (idx: number, val: string) => {
    const next = path.slice(0, idx);
    let id: number | null = null;
    if (val.startsWith('g:')) {
      next.push(Number(val.slice(2))); // группа — только навигация
    } else if (val !== '') {
      id = Number(val); // лист — type_id
      next.push(id);
    }
    onChange(id, next);
  };
  const levels = Math.max(path.length + (levelOptions(path.length).length > 0 ? 1 : 0), 1);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {Array.from({ length: levels }).map((_, idx) => (
        <select key={idx} value={path[idx] != null ? String(path[idx]) : ''} onChange={e => pick(idx, e.target.value)} style={inputStyle}>
          <option value="">{idx === 0 ? '— Не привязано —' : '— Выберите —'}</option>
          {levelOptions(idx).map((n: any) => (
            <option key={n.type_id ?? n.description_category_id} value={n.type_id ? String(n.type_id) : `g:${n.description_category_id}`} disabled={n.disabled}>
              {n.type_name ?? n.category_name}
            </option>
          ))}
        </select>
      ))}
    </div>
  );
}

function CategoryModal({ modal, categories, onClose, onSaved }: {
  modal: { category: ProductCategory | 'new'; parentId?: string | null };
  categories: ProductCategory[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const isNew = modal.category === 'new';
  const editing = isNew ? null : modal.category as ProductCategory;
  const [name, setName] = useState(isNew ? '' : editing!.name);
  const [isGroup, setIsGroup] = useState(isNew ? false : editing!.isGroup);
  const [parentId, setParentId] = useState<string>(isNew ? (modal.parentId || '') : (editing!.parentId || ''));
  const [error, setError] = useState('');
  // Привязка категории OZON (показываем, только если плагин подключён)
  const [ozonActive, setOzonActive] = useState(false);
  const [ozonTree, setOzonTree] = useState<any[]>([]);
  const [ozonPath, setOzonPath] = useState<number[]>([]);
  const [ozonTypeId, setOzonTypeId] = useState<number | null>(isNew ? null : (editing!.ozonTypeId ?? null));

  useEffect(() => {
    api.ozonPlugin.get().then(async (s: any) => {
      if (!s?.isActive) return;
      setOzonActive(true);
      try {
        const r = await api.ozonPlugin.categories();
        const tree = r.items || [];
        setOzonTree(tree);
        // восстанавливаем путь привязанной категории OZON — ищем лист с type_id
        const walk = (nodes: any[], trail: number[]): boolean => {
          for (const n of nodes) {
            const t = [...trail, n.type_id ?? n.description_category_id];
            if (n.type_id && n.type_id === (editing?.ozonTypeId ?? null)) { setOzonPath(t); return true; }
            if (n.children?.length && walk(n.children, t)) return true;
          }
          return false;
        };
        if (editing?.ozonTypeId) walk(tree, []);
      } catch { /* категории недоступны — оставляем пустым */ }
    }).catch(() => {});
  }, []);

  // Недопустимые родители при редактировании: сама категория и все её потомки
  const excluded = useMemo(() => {
    const set = new Set<string>();
    if (isNew || !editing) return set;
    set.add(editing.id);
    let grew = true;
    while (grew) {
      grew = false;
      for (const c of categories) {
        if (c.parentId && set.has(c.parentId) && !set.has(c.id)) { set.add(c.id); grew = true; }
      }
    }
    return set;
  }, [categories, isNew, editing]);

  // Плоский список категорий с отступами по глубине (как в карточке товара)
  const parentOptions = useMemo(() => {
    const byParent = new Map<string | null, ProductCategory[]>();
    for (const c of categories) {
      const list = byParent.get(c.parentId || null) ?? [];
      list.push(c);
      byParent.set(c.parentId || null, list);
    }
    const out: { id: string; label: string }[] = [];
    const walk = (pid: string | null, depth: number) => {
      for (const c of byParent.get(pid) ?? []) {
        if (!excluded.has(c.id)) out.push({ id: c.id, label: `${'— '.repeat(depth)}${c.name}` });
        walk(c.id, depth + 1);
      }
    };
    walk(null, 0);
    return out;
  }, [categories, excluded]);

  const save = async () => {
    if (!name.trim()) { setError('Название обязательно'); return; }
    try {
      if (isNew) await api.products.categories.create({ name, isGroup, parentId: parentId || null, ozonTypeId });
      else await api.products.categories.update(editing!.id, { name, isGroup, parentId: parentId || null, ozonTypeId });
      onSaved();
    } catch (e: any) { setError(e.message || 'Ошибка'); }
  };

  return (
    <div style={overlayStyle}>
      <div style={{ background: 'var(--bg-card)', borderRadius: 16, padding: 24, width: '100%', maxWidth: 400 }}>
        <h3 style={{ margin: '0 0 16px' }}>{isNew ? 'Новая категория' : 'Изменить категорию'}</h3>
        {error && <div style={{ color: '#dc2626', marginBottom: 12, fontSize: 14 }}>{error}</div>}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <label style={{ fontSize: 14, fontWeight: 500 }}>Название</label>
          <input value={name} onChange={e => setName(e.target.value)} style={inputStyle} placeholder="Например: Крепёж" autoFocus />
          <label style={{ fontSize: 14, fontWeight: 500 }}>Родительская категория</label>
          <select value={parentId} onChange={e => setParentId(e.target.value)} style={inputStyle}>
            <option value="">Без родительской категории</option>
            {parentOptions.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
          </select>
          <label style={{ fontSize: 14, fontWeight: 500 }}>Тип</label>
          <select value={isGroup ? 'group' : 'item'} onChange={e => setIsGroup(e.target.value === 'group')} style={inputStyle}>
            <option value="item">Вид номенклатуры</option>
            <option value="group">Папка (группа)</option>
          </select>
          {ozonActive && (
            <>
              <label style={{ fontSize: 14, fontWeight: 500 }}>
                Категория OZON{' '}
                <span style={{ fontWeight: 400, color: 'var(--text-muted)', fontSize: 12 }}>
                  (пусто — наследовать от родительской; товары попадут в OZON в эту категорию)
                </span>
              </label>
              <OzonCategoryPicker
                tree={ozonTree}
                path={ozonPath}
                onChange={(id, p) => { setOzonTypeId(id); setOzonPath(p); }}
              />
            </>
          )}
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <button onClick={save} style={btnPrimary}>Сохранить</button>
            <button onClick={onClose} style={btnGhost}>Отмена</button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- Модалка удаления категории с переносом товаров ---------- */
function CategoryDeleteModal({ info, categories, onClose, onDeleted }: {
  info: { category: ProductCategory; products: number; children: number };
  categories: ProductCategory[];
  onClose: () => void;
  onDeleted: (id: string) => void;
}) {
  const [moveTo, setMoveTo] = useState('none');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  // Варианты переноса: все категории, кроме удаляемой и её потомков
  const excluded = useMemo(() => {
    const set = new Set<string>([info.category.id]);
    let grew = true;
    while (grew) {
      grew = false;
      for (const c of categories) {
        if (c.parentId && set.has(c.parentId) && !set.has(c.id)) { set.add(c.id); grew = true; }
      }
    }
    return set;
  }, [categories, info.category.id]);

  const options = useMemo(() => {
    const byParent = new Map<string | null, ProductCategory[]>();
    for (const c of categories) {
      const list = byParent.get(c.parentId || null) ?? [];
      list.push(c);
      byParent.set(c.parentId || null, list);
    }
    const out: { id: string; label: string }[] = [];
    const walk = (pid: string | null, depth: number) => {
      for (const c of byParent.get(pid) ?? []) {
        if (!excluded.has(c.id)) out.push({ id: c.id, label: `${'— '.repeat(depth)}${c.name}` });
        walk(c.id, depth + 1);
      }
    };
    walk(null, 0);
    return out;
  }, [categories, excluded]);

  const remove = async () => {
    setBusy(true);
    setError('');
    try {
      await api.products.categories.delete(info.category.id, moveTo);
      onDeleted(info.category.id);
    } catch (e: any) {
      setError(e.message || 'Ошибка удаления');
      setBusy(false);
    }
  };

  const parts: string[] = [];
  if (info.products > 0) parts.push(`${info.products} товар(ов)`);
  if (info.children > 0) parts.push(`${info.children} подкатегорий`);

  return (
    <div style={overlayStyle}>
      <div style={{ background: 'var(--bg-card)', borderRadius: 16, padding: 24, width: '100%', maxWidth: 420 }}>
        <h3 style={{ margin: '0 0 12px' }}>Удалить категорию «{info.category.name}»?</h3>
        <div style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 12 }}>
          В категории {parts.join(' и ')}. Выберите, куда их перенести:
        </div>
        {error && <div style={{ color: '#dc2626', marginBottom: 12, fontSize: 14 }}>{error}</div>}
        <select value={moveTo} onChange={e => setMoveTo(e.target.value)} style={{ ...inputStyle, marginBottom: 16 }}>
          <option value="none">Без категории (подкатегории — на уровень выше)</option>
          {options.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
        </select>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={remove} disabled={busy} style={{ ...btnPrimary, background: '#dc2626' }}>{busy ? 'Удаление…' : 'Удалить и перенести'}</button>
          <button onClick={onClose} style={btnGhost}>Отмена</button>
        </div>
      </div>
    </div>
  );
}
