/* COMPARE screen — параллельное сравнение характеристик */

const CompareScreen = ({ setScreen, compare, toggleCompare, addToCart }) => {
  const products = window.SHOP.PRODUCTS.filter(p => compare.includes(p.id));
  const [showDiffOnly, setShowDiffOnly] = React.useState(false);

  const SPEC_ROWS = [
    { k: "Цена",                v: p => fmt(p.price) },
    { k: "Бренд",               v: p => p.brand },
    { k: "Тип",                 v: p => ({fridge:"Холодильник",washer:"Стиральная машина",coffee:"Кофемашина",ac:"Кондиционер",tv:"Телевизор",dishw:"Посудомоечная"}[p.kind] || "—") },
    { k: "Объём / Загрузка",    v: p => p.kind==="fridge" ? "452 л" : p.kind==="washer" ? "8 кг" : p.kind==="ac" ? "30 м²" : "—" },
    { k: "Класс энергии",       v: p => "A++" },
    { k: "Уровень шума",        v: p => p.kind==="washer" ? "52 дБ / 72 дБ" : p.kind==="fridge" ? "42 дБ" : p.kind==="ac" ? "26 дБ" : "—" },
    { k: "Габариты",            v: p => p.kind==="fridge" ? "60×65×203 см" : p.kind==="washer" ? "60×55×85 см" : p.kind==="ac" ? "84×30×19 см" : "—" },
    { k: "Гарантия",            v: p => "24 месяца" },
    { k: "Рейтинг",             v: p => `★ ${(p.rating || 4.7).toFixed(1)} · ${p.reviews || 124} отз.` },
    { k: "Наличие",             v: p => p.stock > 0 ? "в наличии" : "под заказ" },
  ];

  const isDiff = (row) => {
    if (products.length < 2) return false;
    const vals = products.map(row.v);
    return new Set(vals).size > 1;
  };

  if (products.length === 0) {
    return (
      <React.Fragment>
        <div className="bread">
          <a href="#" onClick={e=>{e.preventDefault();setScreen("home")}}>Главная</a>
          <span>›</span>
          <span>Сравнение</span>
        </div>
        <window.EmptyState
          icon="compare"
          title="В сравнении пока пусто"
          sub="Добавьте товары из каталога — мы сопоставим их характеристики бок о бок"
          cta="Перейти в каталог"
          onCta={() => setScreen("catalog")}
        />
      </React.Fragment>
    );
  }

  return (
    <React.Fragment>
      <div className="bread">
        <a href="#" onClick={e=>{e.preventDefault();setScreen("home")}}>Главная</a>
        <span>›</span>
        <span>Сравнение</span>
      </div>

      <div className="section-head" style={{margin:"6px 4px 18px"}}>
        <div>
          <h2>Сравнение товаров</h2>
          <div className="meta">{products.length} {products.length===1?"товар":products.length<5?"товара":"товаров"} в сравнении</div>
        </div>
        <div style={{display:"flex",gap:10,alignItems:"center"}}>
          <label className="cmp-toggle">
            <input type="checkbox" checked={showDiffOnly} onChange={e=>setShowDiffOnly(e.target.checked)} />
            <span className="sw"><span className="dot"></span></span>
            Только различия
          </label>
        </div>
      </div>

      <div className="cmp-grid" style={{gridTemplateColumns:`200px repeat(${products.length}, minmax(0, 1fr))`}}>
        {/* HEADER ROW */}
        <div className="cmp-corner"></div>
        {products.map(p => (
          <div key={p.id} className="cmp-col-head">
            <button className="cmp-col-x" onClick={()=>toggleCompare(p.id)} aria-label="Убрать">×</button>
            <div className="cmp-col-art">
              {(()=>{
                const k = p.kind;
                if (k === "fridge") return <Art.Fridge size={140} />;
                if (k === "washer") return <Art.Washer size={130} />;
                if (k === "coffee") return <Art.Coffee size={130} />;
                if (k === "ac") return <Art.AC size={140} />;
                return <Art.Generic kind={k || "fridge"} size={130} />;
              })()}
            </div>
            <div className="cmp-col-brand">{p.brand}</div>
            <div className="cmp-col-name">{p.name}</div>
            <div className="cmp-col-rating">
              <span className="stars">{[1,2,3,4,5].map(i=><Ico.Star key={i}/>)}</span>
              <span>{(p.rating || 4.7).toFixed(1)}</span>
            </div>
            <button className="btn btn-primary cmp-col-cta" onClick={()=>addToCart(p.id)}>В корзину</button>
            <button className="btn btn-ghost cmp-col-cta" onClick={()=>setScreen("product")}>Подробнее</button>
          </div>
        ))}

        {/* SPEC ROWS */}
        {SPEC_ROWS.filter(row => !showDiffOnly || isDiff(row)).map((row, i) => (
          <React.Fragment key={i}>
            <div className={"cmp-row-k " + (isDiff(row) ? "diff" : "")}>{row.k}</div>
            {products.map(p => (
              <div key={p.id} className={"cmp-row-v " + (isDiff(row) ? "diff" : "")}>{row.v(p)}</div>
            ))}
          </React.Fragment>
        ))}
      </div>

      {products.length < 4 && (
        <button className="cmp-add-more" onClick={()=>setScreen("catalog")}>
          <Ico.Plus /> Добавить ещё товар к сравнению
        </button>
      )}
    </React.Fragment>
  );
};

window.CompareScreen = CompareScreen;
