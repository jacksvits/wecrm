import { useEffect, useMemo, useState } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { format } from 'date-fns';
import { api } from '../api/client';
import { Product, Warehouse, PriceType, StockMovement, PriceHistory } from '../types';

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
];

const fmtMoney = (v: number) => new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 2 }).format(v);
const inputStyle: React.CSSProperties = { padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-primary)', width: '100%', boxSizing: 'border-box' };
const btnPrimary: React.CSSProperties = { padding: '8px 16px', borderRadius: 12, border: 'none', background: '#1a1a1a', color: '#fff', fontSize: 14, fontWeight: 500, cursor: 'pointer' };
const btnGhost: React.CSSProperties = { padding: '6px 12px', borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-primary)', cursor: 'pointer', fontSize: 13 };
const thStyle: React.CSSProperties = { textAlign: 'left', padding: '10px 12px', fontSize: 12, color: 'var(--text-muted)', fontWeight: 500, borderBottom: '1px solid var(--border-color)', whiteSpace: 'nowrap' };
const tdStyle: React.CSSProperties = { padding: '10px 12px', fontSize: 14, borderBottom: '1px solid var(--border-color)' };
const overlayStyle: React.CSSProperties = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 };

export function Products() {
  const [tab, setTab] = useState('nomenclature');
  const [products, setProducts] = useState<Product[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [priceTypes, setPriceTypes] = useState<PriceType[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [q, setQ] = useState('');
  const [whFilter, setWhFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  const [productModal, setProductModal] = useState<Product | 'new' | null>(null);
  const [movementModal, setMovementModal] = useState<{ product: Product; type: 'income' | 'outcome' } | null>(null);
  const [historyProduct, setHistoryProduct] = useState<Product | null>(null);
  const [whModal, setWhModal] = useState<Warehouse | 'new' | null>(null);
  const [ptModal, setPtModal] = useState<PriceType | 'new' | null>(null);
  const [editingCell, setEditingCell] = useState<{ productId: string; priceTypeId: string; value: string } | null>(null);

  const load = async () => {
    try {
      const [p, w, t, m] = await Promise.all([
        api.products.list(),
        api.products.warehouses.list(),
        api.products.priceTypes.list(),
        api.products.movements(),
      ]);
      setProducts(p);
      setWarehouses(w);
      setPriceTypes(t);
      setMovements(m);
    } catch (e: any) {
      alert(e.message || 'Ошибка загрузки');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return products;
    return products.filter(p =>
      p.name.toLowerCase().includes(s) ||
      (p.sku || '').toLowerCase().includes(s) ||
      (p.category || '').toLowerCase().includes(s));
  }, [products, q]);

  const activePriceTypes = useMemo(() => priceTypes.filter(t => t.isActive), [priceTypes]);

  const totalStock = (p: Product) => (p.stocks || []).reduce((sum, s) => sum + s.quantity, 0);
  const priceOf = (p: Product, ptId: string) => (p.prices || []).find(x => x.priceTypeId === ptId)?.price;

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

  if (loading) return <div style={{ padding: 24 }}>Загрузка...</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 600 }}>Товары</h2>
        {tab === 'nomenclature' && (
          <button onClick={() => setProductModal('new')} style={btnPrimary}>+ Товар</button>
        )}
        {tab === 'stock' && (
          <button onClick={() => setWhModal('new')} style={btnPrimary}>+ Склад</button>
        )}
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
        <div>
          <input
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Поиск: название, артикул, категория"
            style={{ ...inputStyle, maxWidth: 360, marginBottom: 12 }}
          />
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 12, overflow: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={thStyle}>Товар</th>
                  <th style={thStyle}>Категория</th>
                  <th style={thStyle}>Ед.</th>
                  <th style={thStyle}>Остаток</th>
                  {activePriceTypes.map(t => <th key={t.id} style={thStyle}>{t.label}</th>)}
                  <th style={thStyle}></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => (
                  <tr
                    key={p.id}
                    style={{ opacity: p.isActive ? 1 : 0.5, cursor: 'pointer' }}
                    onClick={() => setProductModal(p)}
                  >
                    <td style={tdStyle}>
                      <div style={{ fontWeight: 500 }}>{p.name}</div>
                      {p.sku && <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{p.sku}</div>}
                    </td>
                    <td style={tdStyle}>{p.category || '—'}</td>
                    <td style={tdStyle}>{p.unit}</td>
                    <td style={tdStyle}>{fmtMoney(totalStock(p))}</td>
                    {activePriceTypes.map(t => {
                      const v = priceOf(p, t.id);
                      return <td key={t.id} style={tdStyle}>{v !== undefined ? fmtMoney(v) : '—'}</td>;
                    })}
                    <td style={tdStyle} onClick={e => e.stopPropagation()}>
                      <button
                        style={{ ...btnGhost, color: '#dc2626' }}
                        onClick={async () => {
                          if (!confirm(`Удалить товар «${p.name}»?`)) return;
                          try { await api.products.delete(p.id); await load(); } catch (e: any) { alert(e.message); }
                        }}
                      >
                        Удалить
                      </button>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={5 + activePriceTypes.length} style={{ ...tdStyle, textAlign: 'center', color: 'var(--text-muted)' }}>
                      Товары не найдены
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ===== Склад ===== */}
      {tab === 'stock' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
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
                {products.flatMap(p =>
                  (p.stocks || [])
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
                    })
                )}
                {products.every(p => !(p.stocks || []).some(s => whFilter === 'all' || s.warehouseId === whFilter)) && (
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
      )}

      {/* ===== Цены ===== */}
      {tab === 'prices' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
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
                  <th style={thStyle}>Товар</th>
                  {activePriceTypes.map(t => <th key={t.id} style={thStyle}>{t.label}</th>)}
                  <th style={thStyle}>История</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => (
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
                      Товары не найдены
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ===== Модалки ===== */}
      {productModal && (
        <ProductModal product={productModal}
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

/* ---------- Модалка товара (WYSIWYG-описание) ---------- */
function ProductModal({ product, onClose, onSaved }: { product: Product | 'new'; onClose: () => void; onSaved: () => void }) {
  const isNew = product === 'new';
  const [form, setForm] = useState({
    name: isNew ? '' : product.name,
    sku: isNew ? '' : product.sku || '',
    category: isNew ? '' : product.category || '',
    unit: isNew ? 'шт' : product.unit,
    barcode: isNew ? '' : product.barcode || '',
    description: isNew ? '' : product.description || '',
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!form.name.trim()) { setError('Название обязательно'); return; }
    setSaving(true); setError('');
    try {
      if (isNew) await api.products.create(form);
      else await api.products.update(product.id, form);
      onSaved();
    } catch (e: any) { setError(e.message || 'Ошибка сохранения'); }
    finally { setSaving(false); }
  };

  const remove = async () => {
    if (isNew || !confirm('Удалить товар?')) return;
    try { await api.products.delete(product.id); onSaved(); }
    catch (e: any) { setError(e.message || 'Ошибка удаления'); }
  };

  return (
    <div style={overlayStyle}>
      <div style={{ background: 'var(--bg-card)', borderRadius: 16, padding: 24, width: '100%', maxWidth: 560, maxHeight: '90vh', overflow: 'auto' }}>
        <h3 style={{ margin: '0 0 16px' }}>{isNew ? 'Новый товар' : 'Изменить товар'}</h3>
        {error && <div style={{ color: '#dc2626', marginBottom: 12, fontSize: 14 }}>{error}</div>}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <label style={{ fontSize: 14, fontWeight: 500 }}>Название</label>
          <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} style={inputStyle} />
          <label style={{ fontSize: 14, fontWeight: 500 }}>Артикул</label>
          <input value={form.sku} onChange={e => setForm({ ...form, sku: e.target.value })} style={inputStyle} />
          <label style={{ fontSize: 14, fontWeight: 500 }}>Категория</label>
          <input value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} style={inputStyle} />
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
          <label style={{ fontSize: 14, fontWeight: 500 }}>Описание</label>
          <ReactQuill theme="snow" value={form.description} onChange={v => setForm({ ...form, description: v })}
            modules={quillModules} formats={quillFormats} />
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
