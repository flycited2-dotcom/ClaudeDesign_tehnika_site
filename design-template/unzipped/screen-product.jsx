/* PRODUCT screen */

const ProductScreen = ({ setScreen, role, addToCart, addRecent, recent, favs, toggleFav, compare, toggleCompare, setQuickView, notifyStock, watchPrice }) => {
  const [tab, setTab] = React.useState("desc");
  const [thumb, setThumb] = React.useState(0);
  const [qty, setQty] = React.useState(1);
  const [services, setServices] = React.useState({install:true, warranty:false, mount:false});
  const product = window.SHOP.PRODUCTS[0]; // Bosch холодильник
  const specs = window.SHOP.SPECS_FULL;
  const ProductStrip = window.ProductStrip;
  const StockNotify = window.StockNotify;
  React.useEffect(() => { addRecent && addRecent(product.id); }, []);
  const all = (window.SHOP?.PRODUCTS || []).map(p => p.id);
  const relatedIds = all.filter(id => id !== product.id).slice(0, 6);
  const recentIds = (recent || []).filter(id => id !== product.id).slice(0, 6);

  // Highlights — ключевые преимущества под галереей
  const HIGHLIGHTS = [
    { ic:"snow", t:"No Frost", s:"равномерное охлаждение, не нужно размораживать" },
    { ic:"leaf", t:"A++ класс", s:"экономия до 30% электроэнергии в год" },
    { ic:"shield", t:"VitaFresh Pro", s:"продукты остаются свежими до 3× дольше" },
    { ic:"wave",  t:"42 дБ ночью", s:"работает тише обычного разговора" },
  ];

  // Комплектация
  const PACKAGE = [
    "Холодильник Bosch KGN39VL24R",
    "2 контейнера VitaFresh Pro",
    "3 стеклянные полки SafetyGlass",
    "Лоток для яиц на 12 шт",
    "Формочка для льда",
    "Инструкция и гарантийный талон",
  ];

  // Описание — длинный текст
  const DESCRIPTION = [
    "Холодильник Bosch KGN39VL24R — флагман немецкой инженерии в формате Side-by-Side. Просторные 452 литра вмещают недельный запас продуктов для семьи из 4–5 человек, а раздельные контуры охлаждения обеспечивают точную температуру и в холодильной, и в морозильной камере без пересушивания.",
    "Технология NoFrost MultiAirflow равномерно распределяет холод по всему объёму — продукты на верхней полке охлаждаются так же эффективно, как и на нижней, а лёд в морозилке больше не нарастает на стенках. Зона свежести VitaFresh Pro сохраняет витамины и текстуру овощей, фруктов, мяса и рыбы до трёх раз дольше, чем в обычном холодильнике.",
    "Сенсорный дисплей выведен на дверь — управляйте температурой, режимом «Отпуск» и Super-заморозкой одним касанием. Класс энергоэффективности A++ означает реальную экономию около 4 200 ₽ в год по сравнению с моделями класса A. Антибактериальное покрытие AntiBacteria защищает внутреннюю поверхность от размножения микроорганизмов.",
    "Уровень шума 42 дБ — это тише, чем работающий ноутбук. Холодильник смело можно ставить на кухне-студии или рядом со спальней. Гарантия 24 месяца от производителя плюс расширенная гарантия до 5 лет от БытТехОпт.",
  ];

  return (
    <React.Fragment>
      <div className="bread">
        <a href="#" onClick={e=>{e.preventDefault();setScreen("home")}}>Главная</a><span>›</span>
        <a href="#" onClick={e=>{e.preventDefault();setScreen("catalog")}}>Каталог</a><span>›</span>
        <a href="#">Крупная бытовая техника</a><span>›</span>
        <a href="#">Холодильники</a><span>›</span>
        <span>{product.brand}</span>
      </div>

      <div className="p-layout">
        <div>
          <div className="p-gallery">
            <div className="p-thumbs">
              {[
                {l:"вид"},{l:"внутри"},{l:"дверь"},{l:"полки"},{l:"дисплей"},
              ].map((t,i) => (
                <div key={i} className={"p-thumb "+(thumb===i?"on":"")} onClick={()=>setThumb(i)}>
                  <div className="p-thumb-mini"><Art.Generic kind="fridge" size={44} /></div>
                  <span className="p-thumb-l">{t.l}</span>
                </div>
              ))}
              <div className="p-thumb p-thumb-video">
                <Ico.Play />
                <span className="p-thumb-l">видео</span>
              </div>
            </div>
            <div className="p-main">
              {(() => {
                const k = product.kind;
                if (k === "fridge") return <Art.Fridge size={340} />;
                if (k === "washer") return <Art.Washer size={300} />;
                if (k === "coffee") return <Art.Coffee size={300} />;
                if (k === "ac") return <Art.AC size={340} />;
                return <Art.Fridge size={340} />;
              })()}
              <div className="p-zoom"><Ico.Search /> Кликните для увеличения</div>
            </div>
          </div>

          {/* Highlights — ключевые преимущества */}
          <div className="p-highlights">
            {HIGHLIGHTS.map((h,i)=>(
              <div key={i} className="hl-card">
                <div className={"hl-ic hl-"+h.ic}>
                  {h.ic==="snow" && <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 2v20M2 12h20M5 5l14 14M19 5L5 19"/></svg>}
                  {h.ic==="leaf" && <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 20A7 7 0 0 1 4 13c0-7 9-9 16-9 0 7-2 16-9 16M5 20l9-9"/></svg>}
                  {h.ic==="shield" && <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>}
                  {h.ic==="wave" && <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M2 12h2l3-9 4 18 4-12 3 7h4"/></svg>}
                </div>
                <div className="hl-t">{h.t}</div>
                <div className="hl-s">{h.s}</div>
              </div>
            ))}
          </div>

          <div className="tabs">
            <button className={tab==="desc"?"on":""} onClick={()=>setTab("desc")}>Описание</button>
            <button className={tab==="specs"?"on":""} onClick={()=>setTab("specs")}>Характеристики</button>
            <button className={tab==="kit"?"on":""} onClick={()=>setTab("kit")}>Комплектация</button>
            <button className={tab==="docs"?"on":""} onClick={()=>setTab("docs")}>Документы</button>
            <button className={tab==="stock"?"on":""} onClick={()=>setTab("stock")}>Наличие</button>
            <button className={tab==="reviews"?"on":""} onClick={()=>setTab("reviews")}>Отзывы · 124</button>
          </div>

          {tab==="desc" && (
            <div className="p-desc">
              {DESCRIPTION.map((p,i)=>(<p key={i}>{p}</p>))}
              <div className="p-callout">
                <div className="ic"><Ico.Truck /></div>
                <div>
                  <b>Доставка по Симферополю — сегодня бесплатно.</b>
                  <span> Закажите до 15:00 — привезём сегодня вечером. По Крыму — 1–2 дня. На материк — 3–5 дней транспортной компанией.</span>
                </div>
              </div>
            </div>
          )}

          {tab==="kit" && (
            <div className="p-kit">
              <div className="p-kit-h">В комплекте поставки:</div>
              <ul className="p-kit-list">
                {PACKAGE.map((it,i)=>(
                  <li key={i}><span className="ki-tick"><Ico.Check /></span>{it}</li>
                ))}
              </ul>
              <div className="p-kit-note">
                Габариты упаковки: <b>96 × 76 × 184 см</b> · вес брутто <b>104 кг</b><br/>
                Гарантия производителя <b>24 месяца</b> · возможна расширенная гарантия до 5 лет
              </div>
            </div>
          )}

          {tab==="specs" && (
            <div className="spec-table">
              {specs.map((row,i) =>
                row[0]==="section"
                  ? <div key={i} className="spec-section-h">{row[1]}</div>
                  : <div key={i} className="spec-row"><span className="k">{row[0]}</span><span className="v">{row[1]}</span></div>
              )}
            </div>
          )}

          {tab==="docs" && (
            <div className="docs-grid">
              {[
                {nm:"Инструкция по эксплуатации",sub:"PDF · 4.2 МБ"},
                {nm:"Декларация соответствия",sub:"PDF · 1.1 МБ"},
                {nm:"Сертификат соответствия",sub:"PDF · 0.8 МБ"},
                {nm:"Гарантийный талон",sub:"PDF · 0.4 МБ"},
                {nm:"Энергопаспорт",sub:"PDF · 0.6 МБ"},
                {nm:"Видеообзор",sub:"YouTube · 8 мин"},
                {nm:"Спецификация",sub:"XLSX · 0.3 МБ"},
                {nm:"Прайс на сервис",sub:"PDF · 0.5 МБ"},
              ].map((d,i) => (
                <div key={i} className="doc-card">
                  <div className="ic"><Ico.Doc /></div>
                  <div><div className="nm">{d.nm}</div><div className="sub">{d.sub}</div></div>
                </div>
              ))}
            </div>
          )}

          {tab==="stock" && (
            <div className="spec-table" style={{display:"block"}}>
              <div className="spec-section-h">Наличие на складах</div>
              {[
                ["Симферополь, Куйбышева 60","12 шт","сегодня"],
                ["Севастополь, ТЦ «Муссон»","4 шт","завтра"],
                ["Ялта, ул. Московская","2 шт","2 дня"],
                ["Керчь, ул. Кирова","1 шт","2 дня"],
                ["Евпатория, ул. Фрунзе","нет","под заказ, 5 дней"],
                ["Херсон","6 шт","3 дня"],
                ["Мелитополь","3 шт","3 дня"],
              ].map((r,i)=>(
                <div key={i} className="spec-row" style={{gridTemplateColumns:"1fr auto auto"}}>
                  <span className="k" style={{display:"flex",alignItems:"center",gap:8}}><Ico.Pin /> {r[0]}</span>
                  <span className="v" style={{minWidth:80}}>{r[1]}</span>
                  <span className="k" style={{minWidth:140,textAlign:"right"}}>{r[2]}</span>
                </div>
              ))}
            </div>
          )}

          {tab==="reviews" && (
            <div className="spec-table" style={{display:"block"}}>
              <div style={{display:"flex",alignItems:"center",gap:24,paddingBottom:18}}>
                <div style={{fontSize:48,fontWeight:900,letterSpacing:"-0.04em"}}>4.8</div>
                <div>
                  <div style={{color:"#FFA135",display:"flex",gap:2}}>{[1,2,3,4,5].map(i=><Ico.Star key={i}/>)}</div>
                  <div style={{fontSize:13,color:"var(--text-mute)",marginTop:4}}>На основании 124 отзывов</div>
                </div>
              </div>
              {[
                {nm:"Александр П.",t:"Отличный холодильник, работает тихо, морозит на отлично. Доставили вовремя.",d:"15.04.2026"},
                {nm:"Мария С.",t:"Купила месяц назад. Очень довольна. Большой объём, удобные полки. Энергопотребление действительно низкое.",d:"02.04.2026"},
              ].map((r,i)=>(
                <div key={i} style={{padding:"18px 0",borderTop:"1px dashed rgba(33,52,108,.12)"}}>
                  <div style={{display:"flex",justifyContent:"space-between",fontSize:14,fontWeight:700}}>
                    <span>{r.nm} <span style={{color:"#FFA135",marginLeft:8}}>{[1,2,3,4,5].map(i=><Ico.Star key={i}/>)}</span></span>
                    <span style={{color:"var(--text-mute)",fontWeight:400}}>{r.d}</span>
                  </div>
                  <p style={{marginTop:8,fontSize:14,lineHeight:1.5,color:"var(--text-2)"}}>{r.t}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* INFO */}
        <aside className="p-info">
          <div className="brand">{product.brand}</div>
          <h1>{product.name}</h1>
          <div className="rating">
            <span className="stars">{[1,2,3,4,5].map(i=><Ico.Star key={i}/>)}</span>
            <span>4.8 · 124 отзыва</span>
          </div>
          <div className="sku">Артикул: BSH-KGN39VL24R · ID 184772</div>

          <div className="price-block">
            {role==="b2b" ? (
              <React.Fragment>
                <div style={{fontSize:11,color:"var(--text-mute)",fontWeight:700,letterSpacing:".05em",textTransform:"uppercase"}}>Оптовая цена · от 5 шт</div>
                <div className="now">{fmt(product.b2b)}</div>
                <div style={{marginTop:6,fontSize:13,color:"var(--text-mute)"}}>Розница: <s>{fmt(product.price)}</s></div>
                <div className="install">Возможна отсрочка платежа · персональный менеджер</div>
              </React.Fragment>
            ) : role==="gov" ? (
              <React.Fragment>
                <div style={{fontSize:11,color:"var(--text-mute)",fontWeight:700,letterSpacing:".05em",textTransform:"uppercase"}}>Госзакупки · 44-ФЗ / 223-ФЗ</div>
                <div className="now" style={{fontSize:24}}>Цена по КП</div>
                <div className="install" style={{marginTop:8}}>Договор · УПД · ЭДО · отсрочка до 30 дней</div>
              </React.Fragment>
            ) : (
              <React.Fragment>
                <span className="now">{fmt(product.price)}</span>
                <span className="old">{fmt(product.old)}</span>
                <span className="save">−{Math.round((1-product.price/product.old)*100)}%</span>
                <div className="install">Рассрочка от <b>{fmt(Math.round(product.price/12))}</b>/мес · 12 мес без переплат</div>
              </React.Fragment>
            )}
          </div>

          <div className="actions">
            <div className="qty">
              <button onClick={()=>setQty(Math.max(1,qty-1))}>−</button>
              <span>{qty}</span>
              <button onClick={()=>setQty(qty+1)}>+</button>
            </div>
            {role==="gov" ? (
              <button className="btn btn-primary" onClick={()=>setScreen("gov")}>Запросить КП</button>
            ) : (
              <button className="btn btn-primary" onClick={()=>{addToCart(product.id);setScreen("cart")}}>В корзину</button>
            )}
            <button className="icon-btn" style={{height:54,width:54}}><Ico.Heart /></button>
          </div>

          <div className="stock-block">
            <div className="stock-row"><span>Наличие</span><span className="ok"><span style={{width:7,height:7,borderRadius:7,background:"#1ea866"}}></span> в наличии · 12 шт</span></div>
            <div className="stock-row"><span>Доставка по Симферополю</span><b>сегодня, бесплатно</b></div>
            <div className="stock-row"><span>Доставка по Крыму</span><b>1–2 дня</b></div>
            <div className="stock-row"><span>Самовывоз</span><b>через 1 час</b></div>
          </div>

          <div className="p-services">
            <div className={"svc-row "+(services.install?"on":"")} onClick={()=>setServices({...services,install:!services.install})}>
              <span className="box">{services.install && <Ico.Check />}</span>
              Установка и подключение
              <span className="price">+ 2 500 ₽</span>
            </div>
            <div className={"svc-row "+(services.warranty?"on":"")} onClick={()=>setServices({...services,warranty:!services.warranty})}>
              <span className="box">{services.warranty && <Ico.Check />}</span>
              Расширенная гарантия 3 года
              <span className="price">+ 4 990 ₽</span>
            </div>
            <div className={"svc-row "+(services.mount?"on":"")} onClick={()=>setServices({...services,mount:!services.mount})}>
              <span className="box">{services.mount && <Ico.Check />}</span>
              Утилизация старой техники
              <span className="price">бесплатно</span>
            </div>
          </div>
        </aside>
      </div>

      {/* Price-watch — для всех ролей */}
      {role !== "gov" && StockNotify && (
        <StockNotify pid={product.id} kind="price" onSubmit={watchPrice} />
      )}

      {/* С этим часто покупают */}
      {ProductStrip && (
        <ProductStrip
          title="С этим часто покупают"
          ids={relatedIds}
          onProduct={() => setScreen("product")}
          onQuick={(id) => setQuickView && setQuickView(id)}
          addToCart={addToCart}
          toggleFav={toggleFav}
          favs={favs}
          onSeeAll={() => setScreen("catalog")}
        />
      )}

      {/* Недавно просмотренные */}
      {ProductStrip && recentIds.length > 0 && (
        <ProductStrip
          title="Недавно просмотренные"
          ids={recentIds}
          onProduct={() => setScreen("product")}
          onQuick={(id) => setQuickView && setQuickView(id)}
          addToCart={addToCart}
          toggleFav={toggleFav}
          favs={favs}
        />
      )}
    </React.Fragment>
  );
};

window.ProductScreen = ProductScreen;
