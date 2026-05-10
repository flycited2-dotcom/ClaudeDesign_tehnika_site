/* HOME SCREEN — соответствует визуалу-эталону */

const HomeScreen = ({ setScreen, role, addToCart, recent, favs, toggleFav, setQuickView }) => {
  const cats = window.SHOP.CATEGORIES;
  const ProductStrip = window.ProductStrip;
  const recentIds = (recent || []).slice(0, 8);

  return (
    <React.Fragment>
      {/* HERO */}
      <section className="hero">
        <div className="hero-content">
          <span className="hero-eyebrow"><Ico.Sparkle /> Весенняя коллекция · Скидки до 35%</span>
          <h1>Техника,<br/>которая<br/><span className="grad">вдохновляет</span></h1>
          <p className="hero-sub">Современные решения<br/>для вашего дома и бизнеса в Крыму</p>
          <div className="hero-actions">
            <button className="btn btn-primary btn-lg" onClick={()=>setScreen("catalog")}>В каталог <Ico.ArrowRight /></button>
            <a className="video-link" href="#"><span className="play"><Ico.Play /></span> Смотреть видео</a>
          </div>
        </div>

        <div className="hero-product">
          <div className="hero-stage">
            <Art.Fridge size={300} />
          </div>

          <div className="feature-float float-1">
            <div className="ic"><Ico.Diamond /></div>
            Премиальное<br/>качество
          </div>
          <div className="feature-float float-2">
            <div className="ic"><Ico.Shield /></div>
            Официальная<br/>гарантия
          </div>
          <div className="feature-float float-4">
            <span className="num">0%</span>
            <div>Рассрочка<br/>без переплат</div>
          </div>
        </div>
      </section>

      {/* CATEGORIES */}
      <div className="section-head">
        <div>
          <h2>Каталог по категориям</h2>
          <div className="meta">Более 8 500 моделей в наличии — от крупной техники до умного дома</div>
        </div>
        <a className="right" href="#" onClick={e=>{e.preventDefault();setScreen("catalog")}}>Все категории <Ico.ArrowRight /></a>
      </div>

      <div className="cat-grid">
        {cats.map(c => (
          <div key={c.id} className="cat-card" onClick={()=>setScreen("catalog")}>
            <div>
              <h3>{c.name.split("\n").map((l,i)=>(<React.Fragment key={i}>{l}<br/></React.Fragment>))}</h3>
              <div className="cnt">{c.count}</div>
            </div>
            <div className="cat-art" style={{fontFamily:"JetBrains Mono",fontSize:11}}>{c.art}</div>
            <div className="circle-arrow"><Ico.ArrowRight /></div>
          </div>
        ))}
      </div>

      {/* PROMO ROW */}
      <div className="promo-grid">
        <div className="promo-card promo-weekly">
          <span className="badge">Выбор недели</span>
          <h3>Кофемашина DeLonghi Dinamica Plus</h3>
          <ul className="feat-list">
            <li>Идеальный эспрессо и капучино</li>
            <li>Сенсорное управление</li>
            <li>Автоматическая очистка</li>
          </ul>
          <div className="price-row">
            <span className="price">79 990 ₽</span>
            <span className="old">94 990 ₽</span>
          </div>
          <div className="promo-cta">
            <button className="btn btn-soft btn-sm" onClick={()=>setScreen("product")}>Подробнее</button>
            <button className="cta-soft" onClick={()=>addToCart(3)}><Ico.Cart /></button>
          </div>
          <div className="weekly-art"><Art.Coffee size={210} /></div>
        </div>

        <div className="promo-card promo-smart">
          <span className="badge">Умный дом</span>
          <h3>Умный дом<br/>в одном касании</h3>
          <p style={{marginTop:18,opacity:.85,fontSize:14,lineHeight:1.5,maxWidth:280}}>Управляйте техникой со смартфона из любой точки мира</p>
          <div className="promo-cta">
            <button className="btn btn-soft btn-sm" onClick={()=>setScreen("catalog")}>Подробнее</button>
          </div>
          <div className="smart-phone">
            <div className="sp-screen">
              <div className="head"><span>Мой дом</span><span>3 устр.</span></div>
              <div className="sp-tile"></div>
              <div className="sp-tile"></div>
              <div className="sp-tile"></div>
              <div className="sp-tile"></div>
              <div className="sp-tile"></div>
              <div className="sp-tile"></div>
            </div>
          </div>
        </div>
      </div>

      {/* RECENTLY VIEWED */}
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

      {/* TRUST */}
      <div className="trust">
        <div className="trust-card">
          <div className="ic"><Ico.Truck /></div>
          <div><h4>Быстрая доставка</h4><p>Доставим заказ в кратчайшие сроки по Крыму и новым регионам</p></div>
        </div>
        <div className="trust-card">
          <div className="ic"><Ico.Shield /></div>
          <div><h4>Официальная гарантия</h4><p>Гарантия от производителя на всю представленную технику</p></div>
        </div>
        <div className="trust-card">
          <div className="ic"><Ico.Wrench /></div>
          <div><h4>Сервис и поддержка</h4><p>Профессиональная техническая поддержка и ремонт</p></div>
        </div>
        <div className="trust-card">
          <div className="ic"><Ico.Percent /></div>
          <div><h4>Выгодная рассрочка</h4><p>Покупайте сейчас — платите потом, без процентов</p></div>
        </div>
      </div>
    </React.Fragment>
  );
};

window.HomeScreen = HomeScreen;
