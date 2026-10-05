import { useEffect, useMemo, useState } from 'react';
import { api } from '../api/client';
import { useAuth } from '../hooks/useAuth';
import { Product, ProductCategory, PromoBlock } from '../types';

const fmtMoney = (v: number) => new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 2 }).format(v);
const fmtQty = (v: number) => new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 2 }).format(v);

interface VitrineCard {
  product: Product;
  price: any;
  inStock: number;
  image: any;
}

export function Vitrine({ search = '' }: { search?: string }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  const [inStockOnly, setInStockOnly] = useState(true);
  const [catalogOpen, setCatalogOpen] = useState(false);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [contacts, setContacts] = useState<any[]>([]);
  // Подробная информация о товаре (открывается по нажатию на карточку)
  const [details, setDetails] = useState<Product | null>(null);
  const [detailsImage, setDetailsImage] = useState(0);
  // Корзина (localStorage) — оформление продажи/реализации
  const [cart, setCart] = useState<any[]>(() => {
    try { return JSON.parse(localStorage.getItem('wecrm_vitrine_cart') || '[]'); } catch { return []; }
  });
  const [cartOpen, setCartOpen] = useState(false);
  const [saleComment, setSaleComment] = useState('');
  // Способ оплаты: 'cash' — наличными, 'card' — банковской картой, 'invoice' — счёт на организацию (безнал)
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'invoice' | 'tochka'>('cash');
  // Подписка на услугу: панель оформления подписочной заявки
  const [subscribeProduct, setSubscribeProduct] = useState<Product | null>(null);
  const [subscribePeriod, setSubscribePeriod] = useState<'month' | 'year'>('month');
  const [subscribeComment, setSubscribeComment] = useState('');
  const [savingSubscribe, setSavingSubscribe] = useState(false);
  const [subscribeError, setSubscribeError] = useState('');
  const [subscribeOk, setSubscribeOk] = useState('');
  const [savingSale, setSavingSale] = useState(false);
  const [saleError, setSaleError] = useState('');
  const [saleOk, setSaleOk] = useState('');
  // Онлайн-оплата через «Эквайринг от Точки»: активность плагина, экран оплаты заказа
  const [tochkaActive, setTochkaActive] = useState(false);
  const [paySale, setPaySale] = useState<any | null>(null);
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState('');
  const [payOrderId, setPayOrderId] = useState('');

  useEffect(() => {
    try { localStorage.setItem('wecrm_vitrine_cart', JSON.stringify(cart)); } catch { /* ignore */ }
    try { window.dispatchEvent(new CustomEvent('wecrm:cart')); } catch { /* ignore */ }
  }, [cart]);

  // Открытие корзины по событию из шапки страницы «Товары»
  useEffect(() => {
    const h = () => { setSaleOk(''); setCartOpen(true); };
    window.addEventListener('wecrm:open-cart', h);
    return () => window.removeEventListener('wecrm:open-cart', h);
  }, []);
  const [contactId, setContactId] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saveOk, setSaveOk] = useState('');
  // Резерв-лист (аналог корзины): позиции для резервирования, хранится в localStorage
  const [reserveList, setReserveList] = useState<any[]>(() => {
    try { return JSON.parse(localStorage.getItem('wecrm_vitrine_reserve') || '[]'); } catch { return []; }
  });
  const [reserveOpen, setReserveOpen] = useState(false);

  useEffect(() => {
    try { localStorage.setItem('wecrm_vitrine_reserve', JSON.stringify(reserveList)); } catch { /* ignore */ }
    try { window.dispatchEvent(new CustomEvent('wecrm:reserve')); } catch { /* ignore */ }
  }, [reserveList]);

  // Открытие резерв-листа по событию из шапки страницы «Товары»
  useEffect(() => {
    const h = () => { setSaveError(''); setSaveOk(''); setReserveOpen(true); };
    window.addEventListener('wecrm:open-reserve', h);
    return () => window.removeEventListener('wecrm:open-reserve', h);
  }, []);

  const { user } = useAuth();
  // Роль «Пользователь»: резерв оформляется на себя — контакт не выбирается
  const isUserRole = (user as any)?.role === 'user';

  useEffect(() => {
    api.products.vitrine()
      .then(setProducts)
      .catch((e: any) => setError(e.message || 'Ошибка загрузки витрины'))
      .finally(() => setLoading(false));
    api.contacts.list().then(setContacts).catch(() => {});
    api.tochkaAcquiring.get().then((s: any) => setTochkaActive(!!s.isActive)).catch(() => {});
    api.products.vitrineCategories()
      .then((cats) => {
        setCategories(cats);
        setExpanded(new Set(cats.map((c) => c.id))); // дерево раскрыто по умолчанию
      })
      .catch(() => {});
  }, []);

  const origin = window.location.origin;

  const cards = useMemo<VitrineCard[]>(() => products.map((p) => {
    // Нулевая цена = не выводить: сначала показываем самую минимальную цену
    const visiblePrices = (p.prices || []).filter((x: any) => Number(x.price) > 0)
      .sort((a: any, b: any) => Number(a.price) - Number(b.price));
    const flaggedPrices = visiblePrices.filter((x: any) => x.priceType?.forVitrine);
    const price = (flaggedPrices.length ? flaggedPrices : visiblePrices)[0] as any;
    const inStock = (p.stocks || []).reduce((s, x) => s + Math.max(x.quantity - (x.reserved || 0), 0), 0);
    return { product: p, price, inStock, image: (p.images || [])[0] as any };
  }), [products]);

  const freeQty = (p: Product) =>
    (p.stocks || []).reduce((s, x) => s + Math.max(x.quantity - (x.reserved || 0), 0), 0);

  // ===== Каталог: дерево категорий и фильтрация витрины =====
  const childrenOf = (parentId: string | null) =>
    categories.filter((c) => (c.parentId ?? null) === parentId);

  const collectSubtree = (id: string): Set<string> => {
    const ids = new Set<string>([id]);
    const stack = [id];
    while (stack.length) {
      const cur = stack.pop()!;
      for (const ch of categories) {
        if (ch.parentId === cur && !ids.has(ch.id)) { ids.add(ch.id); stack.push(ch.id); }
      }
    }
    return ids;
  };

  const countInCategory = (id: string) => {
    const ids = collectSubtree(id);
    return cards.filter((c) => c.product.categoryId && ids.has(c.product.categoryId)).length;
  };

  const filteredCards = useMemo(() => {
    let list = cards;
    if (activeCategoryId) {
      const ids = collectSubtree(activeCategoryId);
      list = list.filter((c) => c.product.categoryId && ids.has(c.product.categoryId));
    }
    // Услуги не зависят от остатков — фильтр «В наличии» их не скрывает
    if (inStockOnly) list = list.filter((c) => c.inStock || c.product.kind === 'service');
    const s = search.trim().toLowerCase();
    if (s) {
      list = list.filter((c) =>
        c.product.name.toLowerCase().includes(s) ||
        (c.product.sku || '').toLowerCase().includes(s) ||
        (c.product.category || '').toLowerCase().includes(s) ||
        (c.product.subcategory || '').toLowerCase().includes(s));
    }
    return list;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cards, activeCategoryId, inStockOnly, categories, search]);

  const toggleExpand = (id: string) => {
    const next = new Set(expanded);
    if (next.has(id)) next.delete(id); else next.add(id);
    setExpanded(next);
  };

  const renderTree = (parentId: string | null, depth: number): any => (
    <ul className="vitrine-cat-list" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
      {childrenOf(parentId).map((c) => {
        const kids = childrenOf(c.id);
        const open = expanded.has(c.id);
        const active = activeCategoryId === c.id;
        return (
          <li key={c.id}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 2, paddingLeft: depth * 14 }}>
              {kids.length > 0 ? (
                <button className="vitrine-cat-toggle" onClick={() => toggleExpand(c.id)}
                  style={{ width: 20, flexShrink: 0, border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 12, padding: '6px 0' }}>
                  {open ? '▾' : '▸'}
                </button>
              ) : <span style={{ width: 20, flexShrink: 0 }} />}
              <button className="vitrine-cat-btn" onClick={() => { setActiveCategoryId(active ? null : c.id); setCatalogOpen(false); }}
                style={{ flex: 1, textAlign: 'left', border: 'none', background: active ? 'var(--bg-hover)' : 'transparent', color: active ? '#007AFF' : 'var(--text-primary)', borderRadius: 8, padding: '6px 8px', cursor: 'pointer', fontSize: 13, fontWeight: active ? 600 : 400, display: 'flex', justifyContent: 'space-between', gap: 6, whiteSpace: 'nowrap', overflow: 'hidden' }}>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.name}</span>
                <span style={{ color: 'var(--text-muted)', fontSize: 12, flexShrink: 0 }}>{countInCategory(c.id)}</span>
              </button>
            </div>
            {open && kids.length > 0 && renderTree(c.id, depth + 1)}
          </li>
        );
      })}
    </ul>
  );

  const addToReserve = (p: Product) => {
    // Нулевая цена не участвует: берём самую минимальную ненулевую цену
    const visiblePrices = (p.prices || []).filter((x: any) => Number(x.price) > 0)
      .sort((a: any, b: any) => Number(a.price) - Number(b.price));
    const flaggedPrices = visiblePrices.filter((x: any) => x.priceType?.forVitrine);
    const priceObj = (flaggedPrices.length ? flaggedPrices : visiblePrices)[0] as any;
    const maxQty = freeQty(p);
    setReserveList(prev => {
      const ex = prev.find(i => i.productId === p.id);
      if (ex) return prev.map(i => (i.productId === p.id ? { ...i, quantity: Math.min(i.quantity + 1, i.maxQty) } : i));
      return [...prev, { productId: p.id, name: p.name, unit: p.unit, imageUrl: p.images?.[0]?.url || '', price: priceObj?.price ?? 0, quantity: 1, maxQty }];
    });
  };

  const openDetails = (p: Product) => {
    setDetailsImage(0);
    setDetails(p);
  };

  const addToCart = (p: Product) => {
    // Нулевая цена не участвует: берём самую минимальную ненулевую цену
    const visiblePrices = (p.prices || []).filter((x: any) => Number(x.price) > 0)
      .sort((a: any, b: any) => Number(a.price) - Number(b.price));
    const flaggedPrices = visiblePrices.filter((x: any) => x.priceType?.forVitrine);
    const priceObj = (flaggedPrices.length ? flaggedPrices : visiblePrices)[0] as any;
    // Услуги не ограничены остатком — количество в корзине любое
    const maxQty = p.kind === 'service' ? Number.MAX_SAFE_INTEGER : freeQty(p);
    setCart(prev => {
      const ex = prev.find(i => i.productId === p.id);
      if (ex) return prev.map(i => (i.productId === p.id ? { ...i, quantity: Math.min(i.quantity + 1, i.maxQty) } : i));
      return [...prev, { productId: p.id, name: p.name, unit: p.unit, imageUrl: p.images?.[0]?.url || '', price: priceObj?.price ?? 0, quantity: 1, maxQty }];
    });
  };


  // Безналичная цена товара: минимальная ненулевая цена с признаком «Использовать для безнала».
  // Если такой цены нет — null (остаётся обычная цена).
  const cashlessPriceOf = (productId: string): number | null => {
    const p = products.find((x: any) => x.id === productId);
    const cl = p?.prices?.filter((x: any) => x.priceType?.forCashless && Number(x.price) > 0).sort((a: any, b: any) => Number(a.price) - Number(b.price))[0];
    return cl ? Number(cl.price) : null;
  };
  // Эффективная цена позиции с учётом способа оплаты
  const effPrice = (it: { productId: string; price: number }): number =>
    paymentMethod === 'invoice' ? (cashlessPriceOf(it.productId) ?? it.price) : it.price;

  const cartTotal = cart.reduce((s, i) => s + effPrice(i) * i.quantity, 0);

  const checkout = async () => {
    if (!contactId) { setSaleError('Выберите контрагента'); return; }
    if (!cart.length) { setSaleError('Корзина пуста'); return; }
    setSavingSale(true); setSaleError('');
    try {
      const s: any = await api.sales.create({
        contactId,
        comment: saleComment,
        paymentMethod: paymentMethod === 'tochka' ? 'card' : paymentMethod,
        items: cart.map(i => ({ productId: i.productId, quantity: i.quantity, price: effPrice(i) })),
      });
      if (paymentMethod === 'tochka') {
        // Заказ создан — дальше кнопка онлайн-оплаты (карта/СБП выбор на странице банка)
        setPaySale(s); setPayError('');
        setSaleOk(`Заказ №${s.number} создан на сумму ${s.total} ₽. Оплатите его ниже.`);
        setCart([]);
        setSaleComment('');
      } else {
        setSaleOk(`Заказ №${s.number} создан на сумму ${s.total} ₽`);
        setCart([]);
        setSaleComment('');
      }
    } catch (e: any) {
      setSaleError(e.message || 'Ошибка создания заказа');
    } finally {
      setSavingSale(false);
    }
  };

  // Цена подписки за период: самая минимальная ненулевая цена для витрины, иначе — минимальная ненулевая
  const subscribePrice = (p: Product) => {
    const visiblePrices = (p.prices || []).filter((x: any) => Number(x.price) > 0)
      .sort((a: any, b: any) => Number(a.price) - Number(b.price));
    const flaggedPrices = visiblePrices.filter((x: any) => x.priceType?.forVitrine);
    return Number((flaggedPrices.length ? flaggedPrices : visiblePrices)[0]?.price ?? 0);
  };


  const openSubscribe = (p: Product) => {
    setSubscribeProduct(p);
    setSubscribePeriod('month');
    setSubscribeComment('');
    setSubscribeError('');
    setSubscribeOk('');
  };

  const submitSubscribe = async () => {
    if (!subscribeProduct) return;
    if (!isUserRole && !contactId) { setSubscribeError('Выберите контрагента'); return; }
    setSavingSubscribe(true); setSubscribeError('');
    try {
      const s: any = await api.subscriptions.create({
        productId: subscribeProduct.id,
        ...(isUserRole ? {} : { contactId }),
        period: subscribePeriod,
        comment: subscribeComment,
      });
      setSubscribeOk(`Заявка на подписку №${s.number} оформлена`);
      setSubscribeComment('');
    } catch (e: any) {
      setSubscribeError(e.message || 'Ошибка оформления подписки');
    } finally {
      setSavingSubscribe(false);
    }
  };

  // Оплата онлайн: создаём платёжную ссылку Точки и переходим на неё
  // (выбор карта/СБП/T-Pay/«Долями» — на странице банка)
  const payOnline = async () => {
    if (!paySale) return;
    setPaying(true); setPayError('');
    try {
      const r: any = await api.tochkaAcquiring.pay(paySale.id, 'link');
      if (r.paymentUrl) window.location.href = r.paymentUrl;
      else setPayError('Банк не вернул ссылку на оплату');
    } catch (e: any) {
      setPayError(e.message || 'Ошибка создания платежа');
    } finally { setPaying(false); }
  };

  // После возврата со страницы банка опрашиваем статус, пока заказ не станет оплаченным
  useEffect(() => {
    if (!paySale) return;
    const t = setInterval(async () => {
      try {
        const st: any = await api.tochkaAcquiring.paymentStatus(`WE-${String(paySale.number).padStart(9, '0')}`);
        if (st.status === 'paid') {
          clearInterval(t);
          setSaleOk(`Заказ №${paySale.number} оплачен`);
          setPaySale(null); setPayOrderId('');
        }
      } catch { /* повторим на следующем тике */ }
    }, 5000);
    return () => clearInterval(t);
  }, [paySale]);

  const reserveTotal = reserveList.reduce((s, i) => s + effPrice(i) * i.quantity, 0);

  const saveReserve = async () => {
    if (!isUserRole && !contactId) { setSaveError('Выберите заказчика'); return; }
    if (!reserveList.length) { setSaveError('Нет позиций'); return; }
    setSaving(true); setSaveError('');
    try {
      const r: any = await api.reservations.create({
        ...(isUserRole ? {} : { contactId }),
        paymentMethod,
        items: reserveList.map((i) => ({ productId: i.productId, quantity: i.quantity, price: effPrice(i) })),
      });
      setSaveOk(`Резерв №${r.number} создан`);
      setReserveList([]);
      setTimeout(() => setReserveOpen(false), 1200);
    } catch (e: any) {
      setSaveError(e.message || 'Ошибка создания резерва');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div style={{ padding: 24, color: 'var(--text-muted)' }}>Загрузка витрины...</div>;
  if (error) return <div style={{ padding: 24, color: '#ef4444' }}>{error}</div>;
  if (!cards.length && !reserveList.length) {
    return (
      <div style={{ padding: 24, color: 'var(--text-muted)' }}>
        На витрине пока нет товаров. Отметьте позиции признаком «На витрине» в разделе «Номенклатура».
      </div>
    );
  }

  return (
    <>
      <style>{`
        .vitrine-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 16px; padding: 4px 2px; flex: 1; min-height: 0; overflow-y: auto; -webkit-overflow-scrolling: touch; justify-items: stretch; align-content: start; }
        .vitrine-grid > div { height: max-content; }
        .vitrine-name { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; width: 100%; min-height: 2.7em; }
        @media (max-width: 640px) {
          .vitrine-grid { grid-template-columns: repeat(2, 1fr); gap: 10px; }
          .vitrine-card-body { padding: 10px !important; gap: 4px !important; }
          .vitrine-name { font-size: 13px !important; }
          .vitrine-price { font-size: 14px !important; }
          .vitrine-btn { padding: 9px 10px !important; font-size: 13px !important; width: 100%; }
        }
        @media (max-width: 400px) { .vitrine-grid { grid-template-columns: 1fr; } }
        .vitrine-catalog-head { display: none; }
        .vitrine-catalog-toggle { display: none; }
        @media (max-width: 640px) {
          .vitrine-layout { flex-direction: column !important; gap: 10px !important; }
          .vitrine-catalog { display: none !important; }
          .vitrine-catalog.open { display: block !important; position: fixed; top: calc(56px + env(safe-area-inset-top, 0px)); left: 0; right: 0; width: auto !important; max-height: 65vh; overflow-y: auto; background: var(--bg-card); border-bottom: 1px solid var(--border-color); border-radius: 0 0 16px 16px; box-shadow: 0 10px 28px rgba(0,0,0,.18); z-index: 60; padding: 12px; animation: vitrineDrop .18s ease-out; -webkit-overflow-scrolling: touch; }
          .vitrine-catalog.open .vitrine-catalog-head { display: flex; width: 100%; }
          .vitrine-catalog-toggle { display: flex !important; align-items: center; justify-content: center; position: fixed; top: calc(56px + env(safe-area-inset-top, 0px)); left: 50%; transform: translateX(-50%); z-index: 61; width: 58px; height: 27px; padding: 0; border-radius: 0 0 13px 13px; border: 1px solid var(--border-color); border-top: none; background: var(--bg-card); color: var(--text-primary); cursor: pointer; box-shadow: 0 4px 10px rgba(0,0,0,.14); }
          @keyframes vitrineDrop { from { transform: translateY(-100%); } to { transform: translateY(0); } }
        }
        .vitrine-card { transition: box-shadow .15s ease, transform .15s ease; }
        .vitrine-card:hover { box-shadow: 0 6px 18px rgba(0,0,0,.10); transform: translateY(-2px); }
        .btn-reserve { display: inline-flex; align-items: center; gap: 8px; padding: 8px 16px; border: 1px solid rgba(120, 255, 122, 0.4); border-radius: 10px; background: linear-gradient(135deg, rgb(10, 136, 0) 0%, rgb(51, 194, 120) 50%, rgb(4, 110, 0) 100%); color: #ffffff; font: 500 14px/1.4 system-ui, sans-serif; cursor: pointer; box-shadow: rgba(8, 255, 0, 0.35) 0 4px 20px, rgba(255, 255, 255, 0.25) 0 1px 0 inset; transition: opacity .15s ease-out, transform .15s ease-out; }
        .btn-reserve:hover { opacity: .9; }
        .btn-reserve:active { transform: scale(.97); }
        .btn-reserve:disabled { opacity: .4; cursor: default; box-shadow: none; }
        .btn-reserve:focus-visible { outline: 2px solid rgb(51, 194, 120); outline-offset: 2px; }
        .btn-cart { display: inline-flex; align-items: center; justify-content: center; padding: 8px; border: 1px solid rgba(120,180,255,0.40); border-radius: 10px; background: linear-gradient(135deg, #007aff 0%, #5856d6 50%, #af52de 100%); color: #ffffff; cursor: pointer; box-shadow: 0 4px 20px rgba(0,122,255,0.35), inset 0 1px 0 rgba(255,255,255,0.25); transition: opacity .15s ease-out, transform .15s ease-out; }
        .btn-cart:hover { opacity: .9; }
        .btn-cart:active { transform: scale(.97); }
        .btn-cart:disabled { opacity: .4; cursor: default; box-shadow: none; }
        .btn-cart:focus-visible { outline: 2px solid #007aff; outline-offset: 2px; }
        @media (max-width: 640px) { .btn-reserve span { display: none; } .btn-reserve { flex: 1; justify-content: center; padding: 8px; } .btn-cart { flex: 1; } }
        .vitrine-cart { width: 380px; }
        @media (max-width: 640px) {
          .vitrine-cart-overlay { align-items: flex-end !important; padding: 0 !important; }
          .vitrine-cart { width: 100% !important; height: auto !important; max-height: 92vh !important; border-radius: 16px 16px 0 0 !important; border-left: none !important; border-top: 1px solid var(--border-color); box-shadow: 0 -8px 24px rgba(0,0,0,.15) !important; }
        }
        .vitrine-details-grid { display: grid; grid-template-columns: minmax(220px, 320px) 1fr; gap: 20px; }
        @media (max-width: 640px) {
          .vitrine-details-grid { grid-template-columns: 1fr; gap: 14px; }
        }
        @media (max-width: 640px) {
          .reserve-overlay { align-items: flex-end !important; padding: 0 !important; }
          .reserve-modal { max-width: 100% !important; border-radius: 16px 16px 0 0 !important; max-height: 92vh !important; }
          .vitrine-details-overlay { align-items: flex-end !important; padding: 0 !important; }
          .vitrine-details-modal { max-width: 100% !important; border-radius: 16px 16px 0 0 !important; max-height: 92vh !important; }
        }
      `}</style>
      <div className="vitrine-layout" style={{ display: 'flex', gap: 16, flex: 1, minHeight: 0 }}>
        <aside className={'vitrine-catalog' + (catalogOpen ? ' open' : '')} style={{ width: 240, flexShrink: 0, overflowY: 'auto', paddingRight: 4 }}>
          <div className="vitrine-catalog-head" style={{ justifyContent: 'space-between', alignItems: 'center', padding: '2px 2px 8px' }}>
            <strong style={{ fontSize: 14 }}>Каталог</strong>
            <button type="button" onClick={() => setCatalogOpen(false)} style={{ border: 'none', background: 'transparent', fontSize: 15, cursor: 'pointer', color: 'var(--text-muted)', padding: 4 }}>✕</button>
          </div>
          <button className="vitrine-cat-btn" onClick={() => { setActiveCategoryId(null); setCatalogOpen(false); }}
            style={{ width: '100%', textAlign: 'left', border: 'none', background: !activeCategoryId ? 'var(--bg-hover)' : 'transparent', color: !activeCategoryId ? '#007AFF' : 'var(--text-primary)', borderRadius: 8, padding: '6px 8px', cursor: 'pointer', fontSize: 13, fontWeight: !activeCategoryId ? 600 : 400, display: 'flex', justifyContent: 'space-between', gap: 6, marginBottom: 4 }}>
            <span>Каталог</span>
            <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>{cards.length}</span>
          </button>
          {renderTree(null, 0)}
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px', borderRadius: 10, border: '1px solid var(--border-color)', fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap', userSelect: 'none', marginTop: 4 }}>
            <input type="checkbox" checked={inStockOnly} onChange={e => setInStockOnly(e.target.checked)} />
            В наличии
          </label>
        </aside>
        {!activeCategoryId && !search.trim() ? (
          <PromoMosaic onOpenCategory={(id) => setActiveCategoryId(id)} />
        ) : (
        <div className="vitrine-grid">
          {activeCategoryId && (
            // Кнопка «Назад» — возврат на общий вид «Каталог»
            <div style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <button type="button" onClick={() => setActiveCategoryId(null)}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-primary)', cursor: 'pointer', fontSize: 13 }}>
                <span aria-hidden="true">←</span> Назад
              </button>
              <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
                {categories.find(c => c.id === activeCategoryId)?.name || ''}
              </span>
            </div>
          )}
          {filteredCards.length === 0 && (
            <div style={{ gridColumn: '1 / -1', padding: 24, textAlign: 'center', color: 'var(--text-muted)' }}>
              По запросу «{search.trim()}» ничего не найдено
            </div>
          )}
          {filteredCards.map(({ product: p, price, inStock, image }) => (
          <div key={p.id} className="vitrine-card" onClick={() => openDetails(p)}
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 12, overflow: 'hidden', display: 'flex', flexDirection: 'column', cursor: 'pointer' }}>
            <div style={{ position: 'relative', width: '100%', paddingTop: '100%', background: 'var(--bg-hover)' }}>
              {image ? (
                <img src={`${origin}${image.url}`} alt={p.name} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <span style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40, color: 'var(--text-muted)' }}>📦</span>
              )}
            </div>
            <div className="vitrine-card-body" style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
              <div className="vitrine-name" style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.35 }}>{p.name}</div>
              <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
                <div className="vitrine-price" style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>
                  {price && Number(price.price) > 0 ? `${price.priceFrom ? 'от ' : ''}${fmtMoney(price.price)} ₽` : 'Договорная'}
                </div>
                {p.kind !== 'service' && (
                  <div style={{ fontSize: 12, fontWeight: 500, color: inStock > 0 ? '#16a34a' : 'var(--text-muted)' }}>
                    {inStock > 0 ? `В наличии: ${fmtQty(inStock)} ${p.unit}` : 'Нет в наличии'}
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                {p.kind === 'service' && p.isSubscription ? (
                  <button type="button" className="btn-reserve" style={{ flex: 1, justifyContent: 'center' }}
                    title="Оформить подписку" aria-label="Подписаться"
                    onClick={(e) => { e.stopPropagation(); openSubscribe(p); }}>
                    Подписаться
                  </button>
                ) : (
                  // Единственная кнопка в карточке (услуга без подписки) — с текстом и во всю ширину;
                  // у товаров рядом есть «В резерв» — оставляем компактной, только с иконкой
                  <button type="button" className="btn-cart" disabled={p.kind !== 'service' && inStock <= 0} title="В корзину" aria-label="В корзину"
                    style={p.kind === 'service' ? { flex: 1, gap: 8 } : undefined}
                    onClick={(e) => { e.stopPropagation(); addToCart(p); }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
                      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
                    </svg>
                    {p.kind === 'service' && <span>В корзину</span>}
                  </button>
                )}
                {p.kind !== 'service' && (
                  <button type="button" className="btn-reserve" disabled={inStock <= 0} style={{ flex: 1, justifyContent: 'center' }}
                    onClick={(e) => { e.stopPropagation(); addToReserve(p); }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                      <path fillRule="evenodd" clipRule="evenodd" d="M17 3.8H7C5.78497 3.8 4.8 4.78497 4.8 6V15.7647C4.8 16.574 5.24438 17.318 5.95698 17.7017L10.957 20.394C11.6081 20.7446 12.3919 20.7446 13.043 20.394L18.043 17.7017C18.7556 17.318 19.2 16.574 19.2 15.7647V6C19.2 4.78497 18.215 3.8 17 3.8ZM7 2C4.79086 2 3 3.79086 3 6V15.7647C3 17.2362 3.80796 18.5889 5.1036 19.2866L10.1036 21.9789C11.2875 22.6164 12.7125 22.6164 13.8964 21.9789L18.8964 19.2866C20.192 18.5889 21 17.2362 21 15.7647V6C21 3.79086 19.2091 2 17 2H7Z" fill="currentColor"/>
                      <path fillRule="evenodd" clipRule="evenodd" d="M16.7248 8.63051C17.0763 8.98198 17.0763 9.55183 16.7248 9.9033L11.7627 14.8654C11.4113 15.2169 10.8414 15.2169 10.4899 14.8654L7.81839 12.1939C7.46692 11.8424 7.46691 11.2726 7.81839 10.9211C8.16986 10.5696 8.7397 10.5696 9.09118 10.9211L11.1263 12.9562L15.4521 8.63051C15.8035 8.27904 16.3734 8.27904 16.7248 8.63051Z" fill="currentColor"/>
                    </svg>
                    <span>В резерв</span>
                  </button>
                )}
              </div>
            </div>
          </div>
          ))}
          {!filteredCards.length && (
            <div style={{ gridColumn: '1 / -1', padding: 24, color: 'var(--text-muted)' }}>В этой категории пока нет товаров на витрине.</div>
          )}
        </div>
        )}

      </div>

      <button type="button" className="vitrine-catalog-toggle" onClick={() => setCatalogOpen(o => !o)} aria-label={catalogOpen ? 'Скрыть каталог' : 'Показать каталог'}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" style={{ transform: catalogOpen ? 'rotate(180deg)' : 'none', transition: 'transform .18s ease' }}>
          <polyline points="5 10 12 16 19 10" />
          <polyline points="5 5 12 11 19 5" />
        </svg>
      </button>

      {details && (() => {
        const d = details;
        const dImages = d.images || [];
        const dImage = dImages[detailsImage] || dImages[0];
        // На витрине показываем только цены с включённой опцией «на витрине»;
        // если ни одна не отмечена — показываем все (обратная совместимость)
        const dPricesFlagged = (d.prices || []).filter((x: any) => x.priceType?.forVitrine);
        // Нулевая цена = не выводить её у карточки; сначала — самая минимальная цена
        const dPrices = (dPricesFlagged.length ? dPricesFlagged : (d.prices || []))
          .filter((x: any) => Number(x.price) > 0)
          .sort((a: any, b: any) => Number(a.price) - Number(b.price));
        const dMainPrice = dPrices[0];
        const dInStock = (d.stocks || []).reduce((s, x) => s + Math.max(x.quantity - (x.reserved || 0), 0), 0);
        const dCategory = categories.find((c) => c.id === d.categoryId);
        return (
          <div className="vitrine-details-overlay reserve-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
            onClick={() => setDetails(null)}>
            <div className="vitrine-details-modal" style={{ background: 'var(--bg-card)', borderRadius: 14, padding: 20, width: '100%', maxWidth: 720, maxHeight: '90vh', overflowY: 'auto', border: '1px solid var(--border-color)' }}
              onClick={(e) => e.stopPropagation()}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 14 }}>
                <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.3 }}>{d.name}</div>
                <button type="button" onClick={() => setDetails(null)}
                  style={{ border: 'none', background: 'transparent', fontSize: 15, cursor: 'pointer', color: 'var(--text-muted)', padding: 4, flexShrink: 0 }}>✕</button>
              </div>
              <div className="vitrine-details-grid">
                <div>
                  <div style={{ position: 'relative', width: '100%', paddingTop: '100%', background: 'var(--bg-hover)', borderRadius: 12, overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                    {dImage ? (
                      <img src={`${origin}${dImage.url}`} alt={d.name} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <span style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 48, color: 'var(--text-muted)' }}>📦</span>
                    )}
                  </div>
                  {dImages.length > 1 && (
                    <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                      {dImages.map((img: any, i: number) => (
                        <button key={img.id} type="button" onClick={() => setDetailsImage(i)}
                          style={{ width: 52, height: 52, padding: 0, borderRadius: 8, overflow: 'hidden', cursor: 'pointer', border: i === detailsImage ? '2px solid #007AFF' : '1px solid var(--border-color)', background: 'var(--bg-hover)' }}>
                          <img src={`${origin}${img.url}`} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, minWidth: 0 }}>
                  {(d.sku || d.barcode || dCategory) && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 13, color: 'var(--text-muted)' }}>
                      {d.sku && <div>Артикул: <span style={{ color: 'var(--text-primary)' }}>{d.sku}</span></div>}
                      {d.barcode && <div>Штрихкод: <span style={{ color: 'var(--text-primary)' }}>{d.barcode}</span></div>}
                      {dCategory && <div>Категория: <span style={{ color: 'var(--text-primary)' }}>{dCategory.name}</span></div>}
                    </div>
                  )}
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)' }}>
                      {dMainPrice ? `${dMainPrice.priceFrom ? 'от ' : ''}${fmtMoney(dMainPrice.price)} ₽` : 'Договорная'}
                    </span>
                    {d.kind !== 'service' && (
                      <span style={{ fontSize: 13, fontWeight: 500, color: dInStock > 0 ? '#16a34a' : 'var(--text-muted)' }}>
                        {dInStock > 0 ? `В наличии: ${fmtQty(dInStock)} ${d.unit}` : 'Нет в наличии'}
                      </span>
                    )}
                  </div>
                  {dPrices.length > 1 && (
                    <div style={{ border: '1px solid var(--border-color)', borderRadius: 10, overflow: 'hidden' }}>
                      {dPrices.map((pr: any) => (
                        <div key={pr.priceTypeId} style={{ display: 'flex', justifyContent: 'space-between', gap: 8, padding: '7px 12px', fontSize: 13, borderBottom: '1px solid var(--border-color)' }}>
                          <span style={{ color: 'var(--text-muted)' }}>{pr.priceType?.label || 'Цена'}</span>
                          <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{pr.priceFrom ? 'от ' : ''}{fmtMoney(pr.price)} ₽</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {(d.stocks || []).length > 0 && d.kind !== 'service' && (
                    <div style={{ border: '1px solid var(--border-color)', borderRadius: 10, overflow: 'hidden' }}>
                      {(d.stocks || []).map((s: any) => (
                        <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 8, padding: '7px 12px', fontSize: 13, borderBottom: '1px solid var(--border-color)' }}>
                          <span style={{ color: 'var(--text-muted)' }}>{s.warehouse?.name || 'Склад'}</span>
                          <span style={{ color: 'var(--text-primary)' }}>
                            доступно <b>{fmtQty(Math.max(s.quantity - (s.reserved || 0), 0))}</b> {d.unit}
                            {(s.reserved || 0) > 0 && <span style={{ color: 'var(--text-muted)' }}> (всего {fmtQty(s.quantity)}, резерв {fmtQty(s.reserved)})</span>}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                  {d.description && (
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>Описание</div>
                      <div className="rich-text" style={{ fontSize: 14, color: 'var(--text-primary)' }} dangerouslySetInnerHTML={{ __html: d.description }} />
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: 8, marginTop: 'auto', paddingTop: 4 }}>
                    <button style={{ padding: '8px 16px', borderRadius: 12, border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-primary)', cursor: 'pointer', fontSize: 14 }}
                      onClick={() => setDetails(null)}>Закрыть</button>
                    {d.kind !== 'service' && (
                      <button type="button" className="btn-action" style={{ flex: 1, justifyContent: 'center', borderRadius: 12, padding: '10px 16px', fontWeight: 600 }}
                        disabled={dInStock <= 0}
                        onClick={() => { addToReserve(d); setDetails(null); setReserveOpen(true); }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                          <path d="M9 12l2 2 4-4"/>
                        </svg>
                        В резерв
                      </button>
                    )}
                    {d.kind === 'service' && d.isSubscription ? (
                      <button type="button" className="btn-action" style={{ flex: 1, justifyContent: 'center' }}
                        onClick={() => { openSubscribe(d); setDetails(null); }}>
                        Подписаться
                      </button>
                    ) : (
                      <button type="button" className="btn-action-cart" style={{ flex: 1, justifyContent: 'center', borderRadius: 12, padding: '10px 16px', fontWeight: 600 }}
                        disabled={d.kind !== 'service' && dInStock <= 0}
                        onClick={() => { addToCart(d); setDetails(null); setCartOpen(true); }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <circle cx="9" cy="21" r="1"/>
                          <circle cx="20" cy="21" r="1"/>
                          <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
                        </svg>
                        В корзину
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {cartOpen && (
        <div className="vitrine-cart-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 210, display: 'flex', justifyContent: 'flex-end' }} onClick={() => setCartOpen(false)}>
          <div className="vitrine-cart" style={{ height: '100%', background: 'var(--bg-card)', borderLeft: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', boxShadow: '-8px 0 24px rgba(0,0,0,.15)' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderBottom: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>Корзина</div>
              <button type="button" onClick={() => setCartOpen(false)} style={{ border: 'none', background: 'transparent', fontSize: 15, cursor: 'pointer', color: 'var(--text-muted)', padding: 4 }}>✕</button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '10px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {!cart.length && !saleOk && <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>Корзина пуста. Добавьте товары с витрины.</div>}
              {cart.map(i => (
                <div key={i.productId} style={{ display: 'flex', gap: 10, alignItems: 'center', border: '1px solid var(--border-color)', borderRadius: 12, padding: 8 }}>
                  <div style={{ width: 48, height: 48, borderRadius: 8, overflow: 'hidden', background: 'var(--bg-hover)', flexShrink: 0, position: 'relative' }}>
                    {i.imageUrl ? <img src={`${origin}${i.imageUrl}`} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>📦</span>}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{i.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{fmtMoney(effPrice(i))} ₽ × {fmtQty(i.quantity)} {i.unit} = <b style={{ color: 'var(--text-primary)' }}>{fmtMoney(effPrice(i) * i.quantity)} ₽</b></div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                      <button type="button" onClick={() => setCart(prev => prev.map(x => (x.productId === i.productId ? { ...x, quantity: Math.max(1, x.quantity - 1) } : x)))} style={{ width: 24, height: 24, borderRadius: 6, border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-primary)', cursor: 'pointer' }}>−</button>
                      <span style={{ fontSize: 13, minWidth: 24, textAlign: 'center', color: 'var(--text-primary)' }}>{fmtQty(i.quantity)}</span>
                      <button type="button" onClick={() => setCart(prev => prev.map(x => (x.productId === i.productId ? { ...x, quantity: Math.min(x.maxQty, x.quantity + 1) } : x)))} style={{ width: 24, height: 24, borderRadius: 6, border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-primary)', cursor: 'pointer' }}>+</button>
                      {i.maxQty !== Number.MAX_SAFE_INTEGER && <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>доступно {fmtQty(i.maxQty)}</span>}
                    </div>
                  </div>
                  <button type="button" onClick={() => setCart(prev => prev.filter(x => x.productId !== i.productId))} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 14, padding: 4 }}>✕</button>
                </div>
              ))}
            </div>
            <div style={{ borderTop: '1px solid var(--border-color)', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>
                <span>Итого</span><span>{fmtMoney(cartTotal)} ₽</span>
              </div>
              <select value={contactId} onChange={e => setContactId(e.target.value)} style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-primary)', fontSize: 14 }}>
                <option value="">— Контрагент —</option>
                {contacts.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
<div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Способ оплаты</span>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {([
                    ['cash', 'Наличными'],
                    ['card', 'Банковской картой'],
                    ['invoice', 'Счёт на организацию'],
                    ...(tochkaActive ? [['tochka', 'Онлайн (карта/СБП)'] as const] : []),
                  ] as const).map(([val, lbl]) => (
                    <button key={val} type="button" onClick={() => setPaymentMethod(val)} style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid var(--border-color)', background: paymentMethod === val ? '#1a1a1a' : 'var(--bg-card)', color: paymentMethod === val ? '#fff' : 'var(--text-primary)', fontSize: 12, fontWeight: paymentMethod === val ? 600 : 400, cursor: 'pointer' }}>
                      {lbl}
                    </button>
                  ))}
                </div>
                {paymentMethod === 'invoice' && <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Цены пересчитаны по тарифу «Использовать для безнала».</span>}
              </div>
              <input value={saleComment} onChange={e => setSaleComment(e.target.value)} placeholder="Комментарий" style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-primary)', fontSize: 14 }} />
              {saleError && <div style={{ color: '#ef4444', fontSize: 13 }}>{saleError}</div>}
              {saleOk && <div style={{ color: '#16a34a', fontSize: 13 }}>{saleOk}</div>}
              {tochkaActive && paymentMethod === 'tochka' && !paySale && (
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  После создания заказа выберите оплату картой (переход на страницу банка) или по QR-коду СБП
                </div>
              )}
              {paySale && (
                <div style={{ border: '1px solid var(--border-color)', borderRadius: 12, padding: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                    Оплата заказа №{paySale.number} — {fmtMoney(paySale.total)} ₽
                  </div>
                  <button type="button" onClick={payOnline} disabled={paying}
                    style={{ padding: '10px 8px', borderRadius: 10, border: 'none', background: '#1a1a1a', color: '#fff', fontSize: 13, fontWeight: 600, cursor: paying ? 'default' : 'pointer', opacity: paying ? 0.7 : 1 }}>
                    {paying ? 'Создание платежа...' : 'Перейти к оплате (карта / СБП / T-Pay / «Долями»)'}
                  </button>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    Оплата на защищённой странице банка Точка. После оплаты вы вернётесь в витрину, статус заказа обновится автоматически.
                  </div>
                  {payError && <div style={{ fontSize: 12, color: '#dc2626' }}>{payError}</div>}
                  <button type="button" onClick={() => { setPaySale(null); }} style={{ border: 'none', background: 'transparent', color: 'var(--text-muted)', fontSize: 12, cursor: 'pointer' }}>
                    Закрыть (оплатить позже из списка продаж)
                  </button>
                </div>
              )}
              <button disabled={savingSale || !cart.length} onClick={checkout} style={{ padding: '10px 16px', borderRadius: 12, border: 'none', background: savingSale || !cart.length ? 'var(--bg-hover)' : '#1a1a1a', color: savingSale || !cart.length ? 'var(--text-muted)' : '#fff', fontSize: 14, fontWeight: 600, cursor: savingSale || !cart.length ? 'not-allowed' : 'pointer' }}>
                {savingSale ? 'Оформление...' : 'Оформить заказ'}
              </button>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Оплата (интернет-эквайринг) будет доступна позже.</div>
            </div>
          </div>
        </div>
      )}

      {subscribeProduct && (
        <div className="vitrine-cart-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 210, display: 'flex', justifyContent: 'flex-end' }} onClick={() => { setSubscribeOk(''); setSubscribeProduct(null); }}>
          <div className="vitrine-cart" style={{ height: '100%', background: 'var(--bg-card)', borderLeft: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', boxShadow: '-8px 0 24px rgba(0,0,0,.15)' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderBottom: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>Оформление подписки</div>
              <button type="button" onClick={() => { setSubscribeOk(''); setSubscribeProduct(null); }} style={{ border: 'none', background: 'transparent', fontSize: 15, cursor: 'pointer', color: 'var(--text-muted)', padding: 4 }}>✕</button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              {subscribeOk ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'flex-start' }}>
                  <div style={{ color: '#16a34a', fontSize: 14 }}>{subscribeOk}</div>
                  <button type="button" onClick={() => { setSubscribeOk(''); setSubscribeProduct(null); }} style={{ padding: '10px 16px', borderRadius: 12, border: 'none', background: '#1a1a1a', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                    Закрыть
                  </button>
                </div>
              ) : (<>
              <div style={{ border: '1px solid var(--border-color)', borderRadius: 12, padding: 10 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{subscribeProduct.name}</div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
                  {subscribePrice(subscribeProduct) > 0 ? `${fmtMoney(subscribePrice(subscribeProduct))} ₽ за период` : 'Цена по запросу'}
                </div>
              </div>
              <label style={{ fontSize: 13, color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: 4 }}>
                Период оплаты
                <select value={subscribePeriod} onChange={e => setSubscribePeriod(e.target.value as any)} style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-primary)', fontSize: 14 }}>
                  <option value="month">Месяц</option>
                  <option value="year">Год</option>
                </select>
              </label>
              {!isUserRole && (
                <select value={contactId} onChange={e => setContactId(e.target.value)} style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-primary)', fontSize: 14 }}>
                  <option value="">— Контрагент —</option>
                  {contacts.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              )}
              <input value={subscribeComment} onChange={e => setSubscribeComment(e.target.value)} placeholder="Комментарий" style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-primary)', fontSize: 14 }} />
              {subscribeError && <div style={{ color: '#ef4444', fontSize: 13 }}>{subscribeError}</div>}
              {subscribeOk && <div style={{ color: '#16a34a', fontSize: 13 }}>{subscribeOk}</div>}
              <button disabled={savingSubscribe} onClick={submitSubscribe} style={{ padding: '10px 16px', borderRadius: 12, border: 'none', background: savingSubscribe ? 'var(--bg-hover)' : '#1a1a1a', color: savingSubscribe ? 'var(--text-muted)' : '#fff', fontSize: 14, fontWeight: 600, cursor: savingSubscribe ? 'not-allowed' : 'pointer' }}>
                {savingSubscribe ? 'Оформление...' : 'Оформить подписку'}
              </button>
              </>)}
            </div>
          </div>
        </div>
      )}

      {reserveOpen && (
        <div className="vitrine-cart-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 210, display: 'flex', justifyContent: 'flex-end' }} onClick={() => setReserveOpen(false)}>
          <div className="vitrine-cart" style={{ height: '100%', background: 'var(--bg-card)', borderLeft: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', boxShadow: '-8px 0 24px rgba(0,0,0,.15)' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderBottom: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>В резерве</div>
              <button type="button" onClick={() => setReserveOpen(false)} style={{ border: 'none', background: 'transparent', fontSize: 15, cursor: 'pointer', color: 'var(--text-muted)', padding: 4 }}>✕</button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '10px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {!reserveList.length && !saveOk && <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>Список резерва пуст. Добавьте товары с витрины кнопкой «В резерв».</div>}
              {reserveList.map(i => (
                <div key={i.productId} style={{ display: 'flex', gap: 10, alignItems: 'center', border: '1px solid var(--border-color)', borderRadius: 12, padding: 8 }}>
                  <div style={{ width: 48, height: 48, borderRadius: 8, overflow: 'hidden', background: 'var(--bg-hover)', flexShrink: 0, position: 'relative' }}>
                    {i.imageUrl ? <img src={`${origin}${i.imageUrl}`} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>📦</span>}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{i.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{fmtMoney(effPrice(i))} ₽ × {fmtQty(i.quantity)} {i.unit} = <b style={{ color: 'var(--text-primary)' }}>{fmtMoney(effPrice(i) * i.quantity)} ₽</b></div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                      <button type="button" onClick={() => setReserveList(prev => prev.map(x => (x.productId === i.productId ? { ...x, quantity: Math.max(1, x.quantity - 1) } : x)))} style={{ width: 24, height: 24, borderRadius: 6, border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-primary)', cursor: 'pointer' }}>−</button>
                      <span style={{ fontSize: 13, minWidth: 24, textAlign: 'center', color: 'var(--text-primary)' }}>{fmtQty(i.quantity)}</span>
                      <button type="button" onClick={() => setReserveList(prev => prev.map(x => (x.productId === i.productId ? { ...x, quantity: Math.min(x.maxQty, x.quantity + 1) } : x)))} style={{ width: 24, height: 24, borderRadius: 6, border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-primary)', cursor: 'pointer' }}>+</button>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>доступно {fmtQty(i.maxQty)}</span>
                    </div>
                  </div>
                  <button type="button" onClick={() => setReserveList(prev => prev.filter(x => x.productId !== i.productId))} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 14, padding: 4 }}>✕</button>
                </div>
              ))}
            </div>
            <div style={{ borderTop: '1px solid var(--border-color)', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>
                <span>Итого</span><span>{fmtMoney(reserveTotal)} ₽</span>
              </div>
<div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Способ оплаты</span>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {([
                    ['cash', 'Наличными'],
                    ['card', 'Банковской картой'],
                    ['invoice', 'Счёт на организацию'],
                    ...(tochkaActive ? [['tochka', 'Онлайн (карта/СБП)'] as const] : []),
                  ] as const).map(([val, lbl]) => (
                    <button key={val} type="button" onClick={() => setPaymentMethod(val)} style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid var(--border-color)', background: paymentMethod === val ? '#1a1a1a' : 'var(--bg-card)', color: paymentMethod === val ? '#fff' : 'var(--text-primary)', fontSize: 12, fontWeight: paymentMethod === val ? 600 : 400, cursor: 'pointer' }}>
                      {lbl}
                    </button>
                  ))}
                </div>
                {paymentMethod === 'invoice' && <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Цены пересчитаны по тарифу «Использовать для безнала».</span>}
              </div>
              <label style={{ fontSize: 12, color: 'var(--text-muted)' }}>Заказчик</label>
              {isUserRole ? (
                <input value={user?.name || ''} readOnly style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--bg-hover)', color: 'var(--text-primary)', fontSize: 14 }} />
              ) : (
                <select value={contactId} onChange={e => setContactId(e.target.value)} style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-primary)', fontSize: 14 }}>
                  <option value="">— выберите контакт или организацию —</option>
                  {contacts.map((c: any) => <option key={c.id} value={c.id}>{c.name}{c.kind === 'organization' ? ' (организация)' : ''}</option>)}
                </select>
              )}
              {saveError && <div style={{ color: '#ef4444', fontSize: 13 }}>{saveError}</div>}
              {saveOk && <div style={{ color: '#16a34a', fontSize: 13 }}>{saveOk}</div>}
              <button type="button" className="btn-reserve" disabled={saving || !reserveList.length} onClick={saveReserve}
                style={{ justifyContent: 'center', width: '100%', padding: '10px 16px', fontSize: 14, fontWeight: 600 }}>
                {saving ? 'Сохранение...' : 'Создать резерв'}
              </button>
            </div>
          </div>
        </div>
      )}

    </>
  );
}


/* ---------- Промо-карточка с интерактивным 3D-наклоном за курсором ---------- */
const TILT_MAX = 8; // максимальный угол наклона, градусы

function PromoBlockCard({ block: b, spanStyle, onOpen }: { block: PromoBlock; spanStyle: React.CSSProperties; onOpen: () => void }) {
  const [tilt, setTilt] = useState({ rx: 0, ry: 0, gx: 50, gy: 50, hover: false });

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;   // 0..1 слева направо
    const py = (e.clientY - r.top) / r.height;   // 0..1 сверху вниз
    setTilt({
      ry: (px - 0.5) * 2 * TILT_MAX,
      rx: (0.5 - py) * 2 * TILT_MAX,
      gx: px * 100,
      gy: py * 100,
      hover: true,
    });
  };

  const onLeave = () => setTilt({ rx: 0, ry: 0, gx: 50, gy: 50, hover: false });

  // Тень усиливается и смещается по направлению наклона — эффект «парения» над сеткой
  const shadow = tilt.hover
    ? `0 ${18 + Math.abs(tilt.rx)}px ${42 + Math.abs(tilt.ry)}px rgba(0,0,0,.45), 0 4px 12px rgba(0,0,0,.3)`
    : '0 2px 8px rgba(0,0,0,.18)';

  return (
    <div
      onClick={onOpen}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      style={{
        ...spanStyle,
        position: 'relative',
        borderRadius: 12,
        overflow: 'hidden',
        cursor: b.categoryId ? 'pointer' : 'default',
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        transformStyle: 'preserve-3d',
        willChange: 'transform',
        zIndex: tilt.hover ? 2 : 1,
        boxShadow: shadow,
        transform: tilt.hover
          ? `perspective(800px) rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg) scale3d(1.03, 1.03, 1.03)`
          : 'perspective(800px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)',
        transition: tilt.hover ? 'transform .12s ease-out, box-shadow .12s ease-out' : 'transform .5s ease, box-shadow .5s ease',
      }}
    >
      {b.imageUrl
        ? <img src={b.imageUrl} alt={b.title} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
        : <div style={{ position: 'absolute', inset: 0, background: 'var(--bg-hover)' }} />}
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0) 30%, rgba(0,0,0,.78) 100%)' }} />
      {/* Блик, следующий за курсором — усиливает ощущение объёма */}
      <div style={{
        position: 'absolute', inset: 0,
        background: `radial-gradient(circle at ${tilt.gx}% ${tilt.gy}%, rgba(255,255,255,.18), rgba(255,255,255,0) 55%)`,
        opacity: tilt.hover ? 1 : 0,
        transition: tilt.hover ? 'opacity .12s ease-out' : 'opacity .5s ease',
        pointerEvents: 'none',
      }} />
      {/* Текст слева, кнопка справа (flex-раскладка нижнего оверлея) */}
      <div style={{ position: 'absolute', left: 16, right: 16, bottom: 14, color: '#fff', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 18, fontWeight: 700 }}>{b.title}</div>
          {b.subtitle && <div style={{ fontSize: 13, opacity: .85, marginTop: 4 }}>{b.subtitle}</div>}
        </div>
        {/* Стиль кнопки: green — как «В резерв» (.btn-reserve), blue — как «В корзину» (.btn-cart) */}
        <button type="button" onClick={(e) => { e.stopPropagation(); onOpen(); }}
          className={b.buttonStyle === 'green' ? 'btn-reserve' : 'btn-cart'}
          style={{ flexShrink: 0, padding: '6px 14px', borderRadius: 8, fontSize: 13 }}>
          {b.buttonText || 'Подробнее'}
        </button>
      </div>
    </div>
  );
}

/* ---------- Промо-мозаика раздела «Каталог» ---------- */
function PromoMosaic({ onOpenCategory }: { onOpenCategory: (id: string) => void }) {
  const [blocks, setBlocks] = useState<PromoBlock[]>([]);

  useEffect(() => {
    api.promoBlocks.list().then(setBlocks).catch(() => setBlocks([]));
  }, []);

  // Размеры блоков в сетке: big = 2×2, wide = 2×1, square = 1×1
  const span = (f: string): React.CSSProperties =>
    f === 'big' ? { gridColumn: 'span 2', gridRow: 'span 2' } : f === 'wide' ? { gridColumn: 'span 2' } : {};

  const open = (b: PromoBlock) => { if (b.categoryId) onOpenCategory(b.categoryId); };

  return (
    <div style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gridAutoRows: '170px', gap: 16, padding: '2px' }}>
        {blocks.map(b => (
          <PromoBlockCard key={b.id} block={b} spanStyle={span(b.format)} onOpen={() => open(b)} />
        ))}
      </div>
      {!blocks.length && (
        <div style={{ padding: 24, color: 'var(--text-muted)', fontSize: 14 }}>
          Промо-блоки не добавлены — настройте их в «Системных настройках».
        </div>
      )}
    </div>
  );
}
