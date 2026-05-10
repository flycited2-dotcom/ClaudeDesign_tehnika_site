// App entry — mounts everything, manages global state (cart, favs, compare, recent, toasts)

const LS_KEY = "btopt:v1";
const loadLS = () => {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || "{}"); }
  catch { return {}; }
};
const saveLS = (s) => {
  try { localStorage.setItem(LS_KEY, JSON.stringify(s)); } catch {}
};

const App = () => {
  // Import shared widgets from window (each babel script has its own scope)
  const Toast = window.Toast;
  const CompareBar = window.CompareBar;
  const QuickView = window.QuickView;
  const initial = loadLS();
  const [screen, setScreen] = React.useState("home");
  const [role, setRole] = React.useState(initial.role || "b2c");
  // Cart shape: { [productId]: qty }
  const [cart, setCart] = React.useState(initial.cart || { 1: 1, 3: 2 });
  const [favs, setFavs] = React.useState(new Set(initial.favs || [3, 6]));
  const [compare, setCompare] = React.useState(initial.compare || []); // [pid, ...] max 4
  const [recent, setRecent] = React.useState(initial.recent || []); // [pid, ...] last 12
  const [toasts, setToasts] = React.useState([]); // [{id, kind, title, sub, cta?}]
  const [quickView, setQuickView] = React.useState(null); // pid

  // persist
  React.useEffect(() => {
    saveLS({
      cart, favs: [...favs], compare, recent, role,
    });
  }, [cart, favs, compare, recent, role]);

  // ─── toast api ────────────────────────────────────────────
  const pushToast = React.useCallback((t) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, ttl: 3500, ...t }]);
    setTimeout(() => setToasts(prev => prev.filter(x => x.id !== id)), t.ttl || 3500);
  }, []);
  const dismissToast = (id) => setToasts(prev => prev.filter(x => x.id !== id));

  // ─── cart api ─────────────────────────────────────────────
  const addToCart = (id) => {
    setCart(c => ({ ...c, [id]: (c[id] || 0) + 1 }));
    const p = (window.SHOP?.PRODUCTS || []).find(x => x.id === id);
    if (p) pushToast({ kind: "cart", title: "Добавлено в корзину", sub: p.name, prodKind: p.kind, cta: { label: "Открыть", onClick: () => setScreen("cart") } });
  };
  const removeFromCart = (id) => setCart(c => { const n = { ...c }; delete n[id]; return n; });
  const setCartQty = (id, qty) => setCart(c => qty <= 0 ? (() => { const n = { ...c }; delete n[id]; return n; })() : { ...c, [id]: qty });

  // ─── favs api ─────────────────────────────────────────────
  const toggleFav = (id) => {
    setFavs(f => {
      const n = new Set(f);
      const wasIn = n.has(id);
      wasIn ? n.delete(id) : n.add(id);
      const p = (window.SHOP?.PRODUCTS || []).find(x => x.id === id);
      if (p) pushToast({
        kind: "fav",
        title: wasIn ? "Убрано из избранного" : "Добавлено в избранное",
        sub: p.name, ttl: 2200,
      });
      return n;
    });
  };

  // ─── compare api ──────────────────────────────────────────
  const toggleCompare = (id) => {
    setCompare(arr => {
      const has = arr.includes(id);
      const p = (window.SHOP?.PRODUCTS || []).find(x => x.id === id);
      if (has) {
        if (p) pushToast({ kind: "compare", title: "Убрано из сравнения", sub: p.name, ttl: 2200 });
        return arr.filter(x => x !== id);
      }
      if (arr.length >= 4) {
        pushToast({ kind: "warn", title: "В сравнении максимум 4 товара", sub: "Уберите один, чтобы добавить новый", ttl: 2800 });
        return arr;
      }
      if (p) pushToast({
        kind: "compare", title: "Добавлено в сравнение", sub: p.name, ttl: 2400,
        cta: { label: "Сравнить", onClick: () => setScreen("compare") },
      });
      return [...arr, id];
    });
  };

  // ─── recently viewed ──────────────────────────────────────
  const addRecent = React.useCallback((id) => {
    setRecent(r => [id, ...r.filter(x => x !== id)].slice(0, 12));
  }, []);

  // ─── stock-notify / price-watch ───────────────────────────
  const notifyStock = (id, email) => {
    const p = (window.SHOP?.PRODUCTS || []).find(x => x.id === id);
    pushToast({ kind: "ok", title: "Подписка оформлена", sub: `Сообщим на ${email} о поступлении ${p?.name || "товара"}`, ttl: 3500 });
  };
  const watchPrice = (id, email) => {
    const p = (window.SHOP?.PRODUCTS || []).find(x => x.id === id);
    pushToast({ kind: "ok", title: "Следим за ценой", sub: `Уведомим на ${email}, если ${p?.name || "товар"} подешевеет`, ttl: 3500 });
  };

  const cartCount = Object.values(cart).reduce((s, q) => s + q, 0);

  const ScreenComp = {
    home: window.HomeScreen,
    catalog: window.CatalogScreen,
    product: window.ProductScreen,
    cart: window.CartScreen,
    checkout: window.CheckoutScreen,
    account: window.AccountScreen,
    b2b: window.B2BScreen,
    gov: window.GovScreen,
    bot: window.ScreenBot,
    compare: window.CompareScreen,
    service: window.ServiceScreen,
  }[screen] || (() => <div style={{padding:"60px 0",textAlign:"center",color:"#888"}}>Экран не найден</div>);

  // pass-through props for every screen
  const props = {
    role, setRole,
    setScreen,
    cart, setCart, addToCart, removeFromCart, setCartQty,
    favs, toggleFav,
    compare, toggleCompare,
    recent, addRecent,
    pushToast, notifyStock, watchPrice,
    setQuickView,
  };

  return (
    <div className="app">
      <Header
        screen={screen} setScreen={setScreen}
        role={role} setRole={setRole}
        cartCount={cartCount}
        favsCount={favs.size}
        compareCount={compare.length}
      />
      <ScreenComp {...props} />
      <Footer />
      <ScreenBar screen={screen} setScreen={setScreen} role={role} />

      {/* Toast stack — bottom-right */}
      <div className="toast-stack" aria-live="polite">
        {toasts.map(t => (
          <Toast key={t.id} t={t} onClose={() => dismissToast(t.id)} />
        ))}
      </div>

      {/* Compare bar — floating bottom-left when compare > 0 */}
      {compare.length > 0 && screen !== "compare" && (
        <CompareBar
          compare={compare}
          onOpen={() => setScreen("compare")}
          onClear={() => setCompare([])}
        />
      )}

      {/* Quick View modal */}
      {quickView != null && (
        <QuickView
          pid={quickView}
          onClose={() => setQuickView(null)}
          onOpenFull={() => { setQuickView(null); setScreen("product"); }}
          {...props}
        />
      )}
    </div>
  );
};

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
