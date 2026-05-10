/* CART screen */

const CartScreen = ({ setScreen, role, cart, setCart }) => {
  const products = window.SHOP.PRODUCTS;
  const items = Object.entries(cart).map(([id,qty]) => {
    const p = products.find(p=>p.id===Number(id));
    return p ? {...p, qty, lineTotal: (role==="b2b"?p.b2b:p.price) * qty} : null;
  }).filter(Boolean);

  const subtotal = items.reduce((s,i)=>s+i.lineTotal,0);
  const discount = role==="b2b" ? 0 : Math.round(subtotal*0.05);
  const delivery = subtotal>50000 ? 0 : 990;
  const total = subtotal - discount + delivery;

  const updateQty = (id, d) => {
    const newQty = Math.max(0, (cart[id]||0)+d);
    const newCart = {...cart};
    if (newQty===0) delete newCart[id]; else newCart[id]=newQty;
    setCart(newCart);
  };

  if (items.length===0) {
    return (
      <div className="acc-card" style={{textAlign:"center",padding:"80px 32px",marginTop:24}}>
        <div style={{fontSize:64,opacity:.3,marginBottom:18,display:"flex",justifyContent:"center"}}><Ico.Cart width="64" height="64" /></div>
        <h3 style={{fontSize:24}}>Корзина пуста</h3>
        <p style={{color:"var(--text-mute)",marginTop:10,marginBottom:24}}>Перейдите в каталог и выберите технику</p>
        <button className="btn btn-primary" onClick={()=>setScreen("catalog")}>В каталог <Ico.ArrowRight /></button>
      </div>
    );
  }

  return (
    <React.Fragment>
      <div className="bread">
        <a href="#" onClick={e=>{e.preventDefault();setScreen("home")}}>Главная</a><span>›</span>
        <span>Корзина</span>
      </div>

      <div className="section-head" style={{margin:"6px 4px 12px"}}>
        <div><h2>Корзина</h2><div className="meta">{items.length} товаров</div></div>
      </div>

      <div className="cart-layout">
        <div className="cart-list">
          {items.map(it => (
            <div key={it.id} className="cart-row">
              <div className="cart-art"><span style={{fontSize:9,fontFamily:"JetBrains Mono",opacity:.5}}>{it.brand}</span></div>
              <div>
                <div className="name">{it.name}</div>
                <div className="meta">SKU · {it.brand.toUpperCase()}-{1000+it.id} · в наличии</div>
              </div>
              <div className="qty" style={{height:38}}>
                <button onClick={()=>updateQty(it.id,-1)}>−</button>
                <span>{it.qty}</span>
                <button onClick={()=>updateQty(it.id,1)}>+</button>
              </div>
              <div className="price">{fmt(it.lineTotal)}</div>
              <button className="rm" onClick={()=>updateQty(it.id,-it.qty)}><Ico.Trash /></button>
            </div>
          ))}
        </div>

        <aside className="summary">
          <h4>Ваш заказ</h4>
          <div className="sum-row"><span>Товары · {items.reduce((s,i)=>s+i.qty,0)} шт</span><b>{fmt(subtotal)}</b></div>
          {discount>0 && <div className="sum-row discount"><span>Скидка постоянного клиента · 5%</span><b>− {fmt(discount)}</b></div>}
          <div className="sum-row"><span>Доставка</span><b>{delivery===0?"бесплатно":fmt(delivery)}</b></div>

          <div className="promo-input">
            <input className="input" placeholder="Промокод" />
            <button>Применить</button>
          </div>

          <div className="sum-total"><span>К оплате</span><span className="v">{fmt(total)}</span></div>

          <button className="btn btn-primary" style={{width:"100%",marginTop:18}} onClick={()=>setScreen("checkout")}>
            Оформить заказ <Ico.ArrowRight />
          </button>

          {role==="b2b" && (
            <button className="btn btn-soft" style={{width:"100%",marginTop:10}}>Выгрузить как КП в PDF</button>
          )}

          <div style={{marginTop:18,fontSize:12,color:"var(--text-mute)",lineHeight:1.5}}>
            Нажимая «Оформить заказ», вы соглашаетесь с условиями обработки персональных данных.
          </div>
        </aside>
      </div>
    </React.Fragment>
  );
};

window.CartScreen = CartScreen;
