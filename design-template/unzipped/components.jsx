/* Shared widgets: Toast, CompareBar, QuickView, EmptyState, Skeleton, MobileMenu */

/* ─── Toast ─────────────────────────────────────────────── */
const Toast = ({ t, onClose }) => {
  const ic = {
    cart:   <Ico.Cart />,
    fav:    <Ico.Heart />,
    compare:<Ico.Compare />,
    ok:     <Ico.Check />,
    warn:   <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 9v4M12 17h.01M10.3 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/></svg>,
  }[t.kind] || <Ico.Check />;
  return (
    <div className={"toast toast-" + (t.kind || "ok")}>
      {t.kind === "cart" && t.prodKind ? (
        <div className="toast-thumb"><Art.Generic kind={t.prodKind} size={44} /></div>
      ) : (
        <div className="toast-ic">{ic}</div>
      )}
      <div className="toast-body">
        <div className="toast-title">{t.title}</div>
        {t.sub && <div className="toast-sub">{t.sub}</div>}
      </div>
      {t.cta && (
        <button className="toast-cta" onClick={() => { t.cta.onClick(); onClose(); }}>
          {t.cta.label} <Ico.ArrowRight />
        </button>
      )}
      <button className="toast-x" onClick={onClose} aria-label="Закрыть">×</button>
    </div>
  );
};

/* ─── Compare floating bar ─────────────────────────────── */
const CompareBar = ({ compare, onOpen, onClear }) => {
  const items = compare.map(id => (window.SHOP?.PRODUCTS || []).find(p => p.id === id)).filter(Boolean);
  return (
    <div className="cmp-bar">
      <div className="cmp-bar-h">
        <Ico.Compare /> Сравнение · {items.length}
      </div>
      <div className="cmp-bar-thumbs">
        {items.map(p => (
          <div key={p.id} className="cmp-thumb">
            <Art.Generic kind={p.kind || "fridge"} size={32} />
          </div>
        ))}
        {[...Array(Math.max(0, 2 - items.length))].map((_, i) => (
          <div key={"e" + i} className="cmp-thumb cmp-thumb-empty" />
        ))}
      </div>
      <button className="cmp-bar-go" onClick={onOpen}>Сравнить <Ico.ArrowRight /></button>
      <button className="cmp-bar-x" onClick={onClear} aria-label="Очистить">×</button>
    </div>
  );
};

/* ─── Quick View modal ─────────────────────────────────── */
const QuickView = ({ pid, onClose, onOpenFull, addToCart, toggleFav, favs, toggleCompare, compare }) => {
  const products = window.SHOP?.PRODUCTS || [];
  const p = products.find(x => x.id === pid) || products[0];
  if (!p) return null;
  const inFav = favs && favs.has(p.id);
  const inCmp = compare && compare.includes(p.id);
  const Art_ = window.Art;
  React.useEffect(() => {
    const onKey = e => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, []);
  return (
    <div className="qv-backdrop" onClick={onClose}>
      <div className="qv-modal" onClick={e => e.stopPropagation()}>
        <button className="qv-close" onClick={onClose} aria-label="Закрыть">×</button>
        <div className="qv-art">
          {(() => {
            const k = p.kind;
            if (k === "fridge") return <Art_.Fridge size={280} />;
            if (k === "washer") return <Art_.Washer size={260} />;
            if (k === "coffee") return <Art_.Coffee size={260} />;
            if (k === "ac") return <Art_.AC size={280} />;
            return <Art_.Generic kind={k || "fridge"} size={260} />;
          })()}
        </div>
        <div className="qv-body">
          <div className="qv-brand">{p.brand}</div>
          <h3 className="qv-name">{p.name}</h3>
          <div className="qv-rating">
            <span className="stars">{[1,2,3,4,5].map(i => <Ico.Star key={i} />)}</span>
            <span>{(p.rating || 4.7).toFixed(1)} · {p.reviews || 124} отзыва</span>
          </div>
          <ul className="qv-feat">
            {(p.tags || ["No Frost","A++","VitaFresh"]).slice(0,3).map((t,i) => (
              <li key={i}><Ico.Check /> {t}</li>
            ))}
          </ul>
          <div className="qv-price">
            <span className="now">{(p.price).toLocaleString("ru-RU").replace(/,/g," ")} ₽</span>
            {p.old && <span className="old">{p.old.toLocaleString("ru-RU").replace(/,/g," ")} ₽</span>}
          </div>
          <div className="qv-actions">
            <button className="btn btn-primary" onClick={() => { addToCart(p.id); onClose(); }}>В корзину</button>
            <button className="btn btn-ghost" onClick={onOpenFull}>Подробнее</button>
            <button className={"qv-icon " + (inFav ? "on" : "")} onClick={() => toggleFav(p.id)} aria-label="В избранное"><Ico.Heart /></button>
            <button className={"qv-icon " + (inCmp ? "on" : "")} onClick={() => toggleCompare(p.id)} aria-label="К сравнению"><Ico.Compare /></button>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ─── Empty state ─────────────────────────────────────── */
const EmptyState = ({ icon = "box", title, sub, cta, onCta }) => {
  const ill = {
    cart: (
      <svg width="120" height="120" viewBox="0 0 120 120" fill="none">
        <circle cx="60" cy="60" r="56" fill="url(#es-grad)" opacity=".45"/>
        <defs><linearGradient id="es-grad" x1="0" y1="0" x2="120" y2="120"><stop stopColor="#dee9ff"/><stop offset="1" stopColor="#fff0e5"/></linearGradient></defs>
        <path d="M30 38h12l8 38h36l8-26H46" stroke="#426dff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
        <circle cx="54" cy="86" r="5" fill="#426dff"/><circle cx="82" cy="86" r="5" fill="#426dff"/>
      </svg>
    ),
    fav: (
      <svg width="120" height="120" viewBox="0 0 120 120" fill="none">
        <circle cx="60" cy="60" r="56" fill="url(#es-grad2)" opacity=".45"/>
        <defs><linearGradient id="es-grad2" x1="0" y1="0" x2="120" y2="120"><stop stopColor="#ffe0d4"/><stop offset="1" stopColor="#dee9ff"/></linearGradient></defs>
        <path d="M60 86 36 60a14 14 0 0 1 24-12 14 14 0 0 1 24 12L60 86z" stroke="#FF7A4A" strokeWidth="3" fill="rgba(255,122,74,.12)" strokeLinejoin="round"/>
      </svg>
    ),
    box: (
      <svg width="120" height="120" viewBox="0 0 120 120" fill="none">
        <circle cx="60" cy="60" r="56" fill="url(#es-grad3)" opacity=".4"/>
        <defs><linearGradient id="es-grad3" x1="0" y1="0" x2="120" y2="120"><stop stopColor="#e3edff"/><stop offset="1" stopColor="#f5e9ff"/></linearGradient></defs>
        <path d="M30 44 60 30l30 14v32L60 90 30 76V44z" stroke="#426dff" strokeWidth="3" fill="rgba(66,109,255,.06)" strokeLinejoin="round"/>
        <path d="M30 44 60 58l30-14M60 58v32" stroke="#426dff" strokeWidth="3" strokeLinejoin="round"/>
      </svg>
    ),
    compare: (
      <svg width="120" height="120" viewBox="0 0 120 120" fill="none">
        <circle cx="60" cy="60" r="56" fill="url(#es-grad4)" opacity=".4"/>
        <defs><linearGradient id="es-grad4" x1="0" y1="0" x2="120" y2="120"><stop stopColor="#dee9ff"/><stop offset="1" stopColor="#e8d9ff"/></linearGradient></defs>
        <rect x="32" y="40" width="22" height="40" rx="3" stroke="#426dff" strokeWidth="3" fill="rgba(66,109,255,.06)"/>
        <rect x="66" y="32" width="22" height="48" rx="3" stroke="#8D75FF" strokeWidth="3" fill="rgba(141,117,255,.06)"/>
        <path d="M28 86h64" stroke="#426dff" strokeWidth="3" strokeLinecap="round"/>
      </svg>
    ),
  }[icon] || null;
  return (
    <div className="empty-state">
      <div className="empty-ill">{ill}</div>
      <h3 className="empty-t">{title}</h3>
      {sub && <p className="empty-s">{sub}</p>}
      {cta && <button className="btn btn-primary" onClick={onCta}>{cta}</button>}
    </div>
  );
};

/* ─── Skeleton block ───────────────────────────────────── */
const Skeleton = ({ w = "100%", h = 16, r = 8, style = {} }) => (
  <span className="sk" style={{ width: w, height: h, borderRadius: r, display: "block", ...style }} />
);

window.Toast = Toast;
window.CompareBar = CompareBar;
window.QuickView = QuickView;
window.EmptyState = EmptyState;
window.Skeleton = Skeleton;

/* ─── Product strip (Recently viewed / Related) ──────── */
const ProductStrip = ({ title, ids = [], onProduct, onQuick, addToCart, toggleFav, favs, onSeeAll }) => {
  const products = ids.map(id => (window.SHOP?.PRODUCTS || []).find(p => p.id === id)).filter(Boolean);
  if (products.length === 0) return null;
  return (
    <div className="strip">
      <div className="strip-head">
        <h3 className="strip-t">{title}</h3>
        {onSeeAll && <button className="strip-all" onClick={onSeeAll}>Смотреть все <Ico.ArrowRight /></button>}
      </div>
      <div className="strip-rail">
        {products.map(p => (
          <div key={p.id} className="strip-card" onClick={() => onProduct && onProduct(p.id)}>
            <button
              className={"strip-fav " + (favs && favs.has(p.id) ? "on" : "")}
              onClick={e => { e.stopPropagation(); toggleFav && toggleFav(p.id); }}
              aria-label="В избранное"
            ><Ico.Heart /></button>
            <div className="strip-art">
              {(() => {
                const k = p.kind;
                if (k === "fridge") return <Art.Fridge size={130} />;
                if (k === "washer") return <Art.Washer size={120} />;
                if (k === "coffee") return <Art.Coffee size={120} />;
                if (k === "ac") return <Art.AC size={130} />;
                return <Art.Generic kind={k || "fridge"} size={120} />;
              })()}
            </div>
            <div className="strip-brand">{p.brand}</div>
            <div className="strip-name">{p.name}</div>
            <div className="strip-row">
              <span className="strip-price">{(p.price).toLocaleString("ru-RU").replace(/,/g," ")} ₽</span>
              <button
                className="strip-cart"
                onClick={e => { e.stopPropagation(); addToCart && addToCart(p.id); }}
                aria-label="В корзину"
              ><Ico.Cart /></button>
            </div>
            {onQuick && (
              <button className="strip-quick" onClick={e => { e.stopPropagation(); onQuick(p.id); }}>
                Быстрый просмотр
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
window.ProductStrip = ProductStrip;

/* ─── Stock-notify panel (price-watch / out-of-stock) ─── */
const StockNotify = ({ pid, kind = "stock", onSubmit }) => {
  const [email, setEmail] = React.useState("");
  const [done, setDone] = React.useState(false);
  if (done) {
    return (
      <div className="sn-panel sn-done">
        <span className="sn-ic"><Ico.Check /></span>
        Готово — сообщим на <b>{email}</b>
      </div>
    );
  }
  const lab = kind === "price" ? "Следить за ценой" : "Сообщить о поступлении";
  const sub = kind === "price"
    ? "Напишем на email, как только цена снизится"
    : "Напишем сразу, как только товар появится на складе";
  return (
    <div className="sn-panel">
      <div className="sn-head">
        <span className={"sn-ic sn-ic-" + kind}>{kind === "price" ? <Ico.Star /> : <Ico.Mail />}</span>
        <div>
          <div className="sn-t">{lab}</div>
          <div className="sn-s">{sub}</div>
        </div>
      </div>
      <form className="sn-form" onSubmit={e => { e.preventDefault(); if (email.includes("@")) { onSubmit && onSubmit(pid, email); setDone(true); } }}>
        <input type="email" placeholder="ваш@email.ru" value={email} onChange={e => setEmail(e.target.value)} required />
        <button type="submit">Подписаться</button>
      </form>
    </div>
  );
};
window.StockNotify = StockNotify;
