/* CATALOG screen */

const CatalogScreen = ({ setScreen, role, addToCart }) => {
  const [view, setView] = React.useState("grid");
  const [activeCat, setActiveCat] = React.useState("all");
  const [favs, setFavs] = React.useState(new Set([3,6]));
  const F = window.SHOP.FILTERS;
  const products = window.SHOP.PRODUCTS;
  const filtered = activeCat==="all" ? products : products.filter(p=>p.cat===activeCat);

  const toggleFav = (id) => {
    setFavs(f => { const n = new Set(f); n.has(id) ? n.delete(id) : n.add(id); return n; });
  };

  return (
    <React.Fragment>
      <div className="bread">
        <a href="#" onClick={e=>{e.preventDefault();setScreen("home")}}>Главная</a>
        <span>›</span>
        <span>Каталог товаров</span>
      </div>

      <div className="section-head" style={{margin:"6px 4px 18px"}}>
        <div>
          <h2>Каталог</h2>
          <div className="meta">{filtered.length} моделей · обновлено сегодня</div>
        </div>
      </div>

      <div className="cat-layout">
        {/* FILTERS */}
        <aside className="filters">
          <h4>Категория</h4>
          <div className="f-section" style={{paddingTop:0,borderTop:0}}>
            <div className={"f-row " + (activeCat==="all"?"on":"")} onClick={()=>setActiveCat("all")}>
              <span className="box">{activeCat==="all" && <Ico.Check />}</span>
              Все товары <span className="cnt">{products.length}</span>
            </div>
            {window.SHOP.CATEGORIES.map(c => (
              <div key={c.id} className={"f-row " + (activeCat===c.id?"on":"")} onClick={()=>setActiveCat(c.id)}>
                <span className="box">{activeCat===c.id && <Ico.Check />}</span>
                {c.name.replace("\n"," ")} <span className="cnt">{products.filter(p=>p.cat===c.id).length}</span>
              </div>
            ))}
          </div>

          <div className="f-section">
            <h4>Бренд</h4>
            {F.brands.map((b,i) => (
              <div key={i} className={"f-row " + (b.on?"on":"")}>
                <span className="box">{b.on && <Ico.Check />}</span>
                {b.name} <span className="cnt">{b.count}</span>
              </div>
            ))}
          </div>

          <div className="f-section">
            <h4>Цена, ₽</h4>
            <div className="range-row">
              <input className="input" placeholder="от 0" defaultValue="10 000" />
              <input className="input" placeholder="до 500 000" defaultValue="200 000" />
            </div>
          </div>

          <div className="f-section">
            <h4>Наличие</h4>
            <div className="f-row on">
              <span className="box"><Ico.Check /></span>
              В наличии <span className="cnt">428</span>
            </div>
            <div className="f-row">
              <span className="box"></span>
              Под заказ <span className="cnt">62</span>
            </div>
          </div>

          {role==="b2b" && (
            <div className="f-section">
              <h4>Опт</h4>
              <div className="f-row on">
                <span className="box"><Ico.Check /></span>Показывать оптовые цены
              </div>
              <div className="f-row">
                <span className="box"></span>Только со склада в РФ
              </div>
            </div>
          )}

          <button className="btn btn-soft" style={{width:"100%",marginTop:14,height:42}}>Сбросить фильтры</button>
        </aside>

        {/* RESULTS */}
        <div>
          <div className="cat-toolbar">
            <div className="left">
              Найдено <b>{filtered.length}</b> товаров
            </div>
            <div className="left">
              <span className="sort">Сначала популярные <Ico.ChevronDown /></span>
              <div className="view-toggle">
                <button className={view==="grid"?"on":""} onClick={()=>setView("grid")}>Сетка</button>
                <button className={view==="list"?"on":""} onClick={()=>setView("list")}>Список</button>
              </div>
            </div>
          </div>

          <div className="product-grid">
            {filtered.map(p => (
              <div key={p.id} className="p-card" onClick={()=>setScreen("product")}>
                <div className="p-art">
                  <div className="p-tags">
                    {p.tags.includes("hot") && <span className="p-tag hot">Хит</span>}
                    {p.tags.includes("new") && <span className="p-tag new">Новинка</span>}
                    {p.tags.includes("sale") && <span className="p-tag sale">−{Math.round((1-p.price/p.old)*100)}%</span>}
                  </div>
                  <button className="p-fav" onClick={e=>{e.stopPropagation();toggleFav(p.id)}} style={favs.has(p.id)?{color:"#ff5757"}:{}}>
                    <Ico.Heart fill={favs.has(p.id)?"#ff5757":"none"} />
                  </button>
                  <div className="p-art-img">
                    <Art.Generic kind={p.kind || "fridge"} size={120} />
                  </div>
                </div>
                <div className="p-body">
                  <div className="p-meta">{p.brand}</div>
                  <div className="p-name">{p.name}</div>
                  <div className="p-specs">
                    {p.specs.map((s,i)=> <span key={i} className="p-spec">{s}</span>)}
                  </div>
                  <div className={"p-stock "+(p.stock==="low"?"low":"")}>
                    <span className="dot"></span>
                    {p.stock==="high"?"В наличии · 12 шт":"Осталось мало · 2 шт"}
                  </div>

                  {role==="b2b" && (
                    <div className="b2b-price">
                      <span>Опт от 5 шт</span><span>{fmt(p.b2b)}</span>
                    </div>
                  )}
                  {role==="gov" && (
                    <div className="b2b-locked">
                      <Ico.Doc /> КП по запросу · 44-ФЗ / 223-ФЗ
                    </div>
                  )}

                  <div className="p-foot">
                    <div className="p-price">
                      <span className="new">{fmt(p.price)}</span>
                      {p.old && <span className="old">{fmt(p.old)}</span>}
                    </div>
                    <button className="add" onClick={e=>{e.stopPropagation();addToCart(p.id)}}><Ico.Cart /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="pager">
            <button>‹</button>
            <button className="on">1</button>
            <button>2</button>
            <button>3</button>
            <button>…</button>
            <button>12</button>
            <button>›</button>
          </div>
        </div>
      </div>
    </React.Fragment>
  );
};

window.CatalogScreen = CatalogScreen;
