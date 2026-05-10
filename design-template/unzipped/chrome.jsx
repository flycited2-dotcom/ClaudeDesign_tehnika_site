/* Header, footer, screen-bar */

const fmt = (n) => n.toLocaleString("ru-RU").replace(/,/g, " ") + " ₽";

const Header = ({ screen, setScreen, role, setRole, cartCount, favsCount = 0, compareCount = 0 }) => {
  const [searchOpen, setSearchOpen] = React.useState(false);
  const [q, setQ] = React.useState("");
  const [mobOpen, setMobOpen] = React.useState(false);
  const searchRef = React.useRef(null);
  const products = (window.SHOP?.PRODUCTS) || [];
  const cats = (window.SHOP?.CATEGORIES) || [];

  React.useEffect(() => {
    if (!searchOpen) return;
    const onClick = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) setSearchOpen(false);
    };
    const onKey = (e) => e.key === "Escape" && setSearchOpen(false);
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onClick); document.removeEventListener("keydown", onKey); };
  }, [searchOpen]);

  const matches = (() => {
    if (!q.trim()) return [];
    const ql = q.toLowerCase();
    return products.filter(p =>
      (p.name && p.name.toLowerCase().includes(ql)) ||
      (p.brand && p.brand.toLowerCase().includes(ql))
    ).slice(0, 6);
  })();

  const popular = ["холодильник", "стиральная машина", "Bosch", "до 50 000 ₽", "встраиваемая"];

  return (
    <React.Fragment>
      <div className="topline">
        <div className="tl-l">
          <span><span className="pulse"></span>г. Симферополь</span>
          <a href="#"></a>
          <a href="#">Доставка по Крыму и новым регионам</a>
        </div>
        <div className="tl-r">
          <a href="#">Помощь</a>
          <a href="#" onClick={(e)=>{e.preventDefault();setScreen("service");}}>Сервис</a>
          <span>Режим:</span>
          <div className="role-switch">
            <button className={role === "b2c" ? "on" : ""} onClick={() => setRole("b2c")}>Розница</button>
            <button className={role === "b2b" ? "on" : ""} onClick={() => setRole("b2b")}>Опт</button>
            <button className={role === "gov" ? "on" : ""} onClick={() => setRole("gov")}>Госзакупки</button>
          </div>
        </div>
      </div>

      <div className="header glass">
        <a className="brand" onClick={(e) => { e.preventDefault(); setScreen("home"); }} href="#">
          <div className="brand-mark">
            <svg viewBox="0 0 40 40" width="28" height="28" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="9" y="6" width="22" height="28" rx="5" stroke="#fff" strokeWidth="2.4"/>
              <path d="M9 16h22" stroke="#fff" strokeWidth="2.4" strokeLinecap="round"/>
              <rect x="25.6" y="9.5" width="2.4" height="4.5" rx="1.2" fill="#fff"/>
              <rect x="25.6" y="19" width="2.4" height="11" rx="1.2" fill="#fff"/>
              <circle cx="13" cy="28" r="1.7" fill="#FFD56B"/>
            </svg>
          </div>
          <div className="brand-name">
            <span className="nm">Быт<b>Тех</b>Опт</span>
            <span className="tg"></span>
          </div>
        </a>
        <button className="cat-btn" onClick={() => setScreen("catalog")}>
          <Ico.Box />
          Каталог товаров
          <Ico.ChevronDown />
        </button>

        {/* SEARCH */}
        <div className="hdr-search-wrap" ref={searchRef}>
          <div className={"hdr-search " + (searchOpen ? "open" : "")} onClick={() => { setSearchOpen(true); }}>
            <Ico.Search />
            <input
              placeholder="Холодильник, Bosch, до 50 000 ₽…"
              value={q}
              onChange={e => setQ(e.target.value)}
              onFocus={() => setSearchOpen(true)}
            />
            {q && <button className="hdr-search-clear" onClick={(e)=>{e.stopPropagation();setQ("");}} aria-label="Очистить">×</button>}
          </div>
          {searchOpen && (
            <div className="hdr-suggest">
              {!q.trim() ? (
                <React.Fragment>
                  <div className="sg-h">Популярные запросы</div>
                  <div className="sg-tags">
                    {popular.map((p,i) => (
                      <button key={i} className="sg-tag" onClick={()=>setQ(p)}>{p}</button>
                    ))}
                  </div>
                  <div className="sg-h">Категории</div>
                  <div className="sg-cats">
                    {cats.slice(0,6).map(c => (
                      <button key={c.id} className="sg-cat" onClick={()=>{setSearchOpen(false);setScreen("catalog");}}>
                        <span className="sg-cat-ic">{c.icon ? React.createElement(c.icon) : <Ico.Box />}</span>
                        {c.name.replace("\n"," ")}
                      </button>
                    ))}
                  </div>
                </React.Fragment>
              ) : matches.length > 0 ? (
                <React.Fragment>
                  <div className="sg-h">Найдено {matches.length}</div>
                  {matches.map(p => (
                    <button key={p.id} className="sg-item" onClick={()=>{setSearchOpen(false);setScreen("product");}}>
                      <span className="sg-item-art"><Art.Generic kind={p.kind || "fridge"} size={36} /></span>
                      <span className="sg-item-body">
                        <span className="sg-item-brand">{p.brand}</span>
                        <span className="sg-item-name">{p.name}</span>
                      </span>
                      <span className="sg-item-price">{fmt(p.price)}</span>
                    </button>
                  ))}
                  <button className="sg-all" onClick={()=>{setSearchOpen(false);setScreen("catalog");}}>
                    Показать все результаты <Ico.ArrowRight />
                  </button>
                </React.Fragment>
              ) : (
                <div className="sg-empty">
                  Ничего не нашли по «{q}»<br/>
                  <small>Попробуйте короче — например, «Bosch» или «холодильник»</small>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="head-actions">
          <button className="icon-btn" title="Избранное" onClick={()=>setScreen("account")}>
            <Ico.Heart />{favsCount > 0 && <span className="badge">{favsCount}</span>}
          </button>
          <button className="icon-btn" title="Сравнение" onClick={()=>setScreen("compare")}>
            <Ico.Compare />{compareCount > 0 && <span className="badge">{compareCount}</span>}
          </button>
          <button className="icon-btn" title="Корзина" onClick={() => setScreen("cart")}>
            <Ico.Cart />{cartCount > 0 && <span className="badge">{cartCount}</span>}
          </button>
          <button className="icon-btn" title="Кабинет" onClick={() => setScreen("account")}><Ico.User /></button>
          <button className="icon-btn hdr-burger" title="Меню" onClick={()=>setMobOpen(true)}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M3 6h18M3 12h18M3 18h18"/></svg>
          </button>
        </div>
        <div className="phone">
          +7 (978) 123-45-67
          <span>Обратный звонок →</span>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobOpen && (
        <div className="mob-drawer" onClick={()=>setMobOpen(false)}>
          <div className="mob-panel" onClick={e=>e.stopPropagation()}>
            <div className="mob-head">
              <span style={{fontWeight:800,fontSize:18}}>Меню</span>
              <button className="mob-close" onClick={()=>setMobOpen(false)} aria-label="Закрыть">×</button>
            </div>
            <button className="mob-item" onClick={()=>{setScreen("catalog");setMobOpen(false);}}><Ico.Box /> Каталог товаров</button>
            <button className="mob-item" onClick={()=>{setScreen("compare");setMobOpen(false);}}><Ico.Compare /> Сравнение {compareCount>0 && <span className="mob-cnt">{compareCount}</span>}</button>
            <button className="mob-item" onClick={()=>{setScreen("account");setMobOpen(false);}}><Ico.Heart /> Избранное {favsCount>0 && <span className="mob-cnt">{favsCount}</span>}</button>
            <button className="mob-item" onClick={()=>{setScreen("cart");setMobOpen(false);}}><Ico.Cart /> Корзина {cartCount>0 && <span className="mob-cnt">{cartCount}</span>}</button>
            <button className="mob-item" onClick={()=>{setScreen("account");setMobOpen(false);}}><Ico.User /> Кабинет</button>
            <div className="mob-sep"></div>
            <button className="mob-item" onClick={()=>{setScreen("service");setMobOpen(false);}}>Сервис и установка</button>
            <button className="mob-item">Доставка</button>
            <button className="mob-item">Акции</button>
            <button className="mob-item" onClick={()=>{setScreen(role==="gov"?"gov":role==="b2b"?"b2b":"account");setMobOpen(false);}}>{role==="gov"?"Госзаказчикам":role==="b2b"?"Оптовикам":"О компании"}</button>
            <button className="mob-item" onClick={()=>{setScreen("bot");setMobOpen(false);}}>Telegram-агент</button>
            <div className="mob-phone">
              <Ico.Phone /> +7 (978) 123-45-67
            </div>
          </div>
        </div>
      )}
    </React.Fragment>);};

const Footer = () =>
<React.Fragment>
    <div className="footer-sub">
      <div className="sub-title">
        <div className="ic"><Ico.Mail /></div>
        <div>
          <div>Будьте в курсе новинок</div>
          <div style={{ fontWeight: 500, color: "var(--text-mute)", fontSize: 13, marginTop: 4 }}>и эксклюзивных предложений</div>
        </div>
      </div>
      <form className="email-form" onSubmit={(e) => e.preventDefault()}>
        <input placeholder="Ваш e-mail" />
        <button type="submit">Подписаться</button>
      </form>
      <div className="socials">
        <a className="social" title="Telegram"><Ico.Telegram /></a>
        <a className="social" title="WhatsApp"><Ico.Whatsapp /></a>
        <a className="social" title="VK"><Ico.Vk /></a>
        <a className="social" title="Карта"><Ico.Map /></a>
      </div>
    </div>

    <div className="footer-bottom">
      <span>© 2026 БытТехОпт. ИНН 9102228140 · ОГРН 1149102018830</span>
      <span>Все цены указаны в рублях. Не является публичной офертой.</span>
    </div>
  </React.Fragment>;


const ScreenBar = ({ screen, setScreen, role }) => {
  const items = [
  { id: "home", lab: "Главная" },
  { id: "catalog", lab: "Каталог" },
  { id: "product", lab: "Товар" },
  { id: "compare", lab: "Сравнение" },
  { id: "cart", lab: "Корзина" },
  { id: "checkout", lab: "Оформление" },
  "sep",
  { id: "account", lab: "Кабинет" },
  { id: "b2b", lab: "B2B" },
  { id: "gov", lab: "Госзакупки" },
  { id: "service", lab: "Сервис" },
  "sep",
  { id: "bot", lab: "Telegram-агент" }];

  return (
    <div className="screen-bar">
      {items.map((it, i) => it === "sep" ? <div key={i} className="sep" /> :
      <button key={it.id} className={screen === it.id ? "active" : ""} onClick={() => setScreen(it.id)}>
          {it.lab}
        </button>
      )}
    </div>);

};

Object.assign(window, { Header, Footer, ScreenBar, fmt });
