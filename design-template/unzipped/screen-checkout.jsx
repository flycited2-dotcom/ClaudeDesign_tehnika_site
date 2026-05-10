/* CHECKOUT screen */

const CheckoutScreen = ({ setScreen, role, cart }) => {
  const [delivery, setDelivery] = React.useState("courier");
  const [payment, setPayment] = React.useState(role==="b2b" ? "invoice" : "cash");
  const products = window.SHOP.PRODUCTS;
  const items = Object.entries(cart).map(([id,qty]) => {
    const p = products.find(p=>p.id===Number(id));
    return p ? {...p, qty, lineTotal: (role==="b2b"?p.b2b:p.price) * qty} : null;
  }).filter(Boolean);
  const subtotal = items.reduce((s,i)=>s+i.lineTotal,0);
  const total = subtotal + (subtotal>50000?0:990);

  return (
    <React.Fragment>
      <div className="bread">
        <a href="#" onClick={e=>{e.preventDefault();setScreen("cart")}}>Корзина</a><span>›</span>
        <span>Оформление</span>
      </div>

      <div className="section-head" style={{margin:"6px 4px 12px"}}>
        <div><h2>Оформление заказа</h2></div>
      </div>

      <div className="checkout-grid">
        <div>
          {/* 1 — DATA */}
          <div className="co-block">
            <h3><span className="num">1</span> {role==="b2b"?"Реквизиты компании":"Контактные данные"}</h3>
            {role==="b2b" || role==="gov" ? (
              <div className="co-fields">
                <input className="input full" placeholder="Название организации" defaultValue="ООО «Дельта-Сервис»" />
                <input className="input" placeholder="ИНН" defaultValue="9102228140" />
                <input className="input" placeholder="КПП" defaultValue="910201001" />
                <input className="input full" placeholder="Юридический адрес" />
                <input className="input" placeholder="Контактное лицо" defaultValue="Иванов Алексей" />
                <input className="input" placeholder="Телефон" defaultValue="+7 (978) 123-45-67" />
                <input className="input full" placeholder="E-mail" defaultValue="info@delta-service.ru" />
              </div>
            ) : (
              <div className="co-fields">
                <input className="input" placeholder="Имя" defaultValue="Алексей" />
                <input className="input" placeholder="Фамилия" defaultValue="Иванов" />
                <input className="input" placeholder="Телефон" defaultValue="+7 (978) 123-45-67" />
                <input className="input" placeholder="E-mail" defaultValue="alexey@example.ru" />
              </div>
            )}
          </div>

          {/* 2 — DELIVERY */}
          <div className="co-block">
            <h3><span className="num">2</span> Доставка</h3>
            <div className="co-radio-row">
              {[
                {id:"courier", ic:<Ico.Truck/>, nm:"Курьером по Симферополю", sub:"сегодня · 9:00–21:00", cost:"бесплатно"},
                {id:"crimea",  ic:<Ico.Map/>,   nm:"Доставка по Крыму", sub:"1–2 дня · Севастополь, Ялта, Керчь, Евпатория", cost:"от 990 ₽"},
                {id:"new",     ic:<Ico.Truck/>, nm:"Херсонская и Запорожская области", sub:"3–5 дней · собственная логистика", cost:"от 1 990 ₽"},
                {id:"pickup",  ic:<Ico.Pin/>,   nm:"Самовывоз", sub:"ул. Куйбышева 60 · через 1 час", cost:"бесплатно"},
              ].map(o => (
                <div key={o.id} className={"co-opt "+(delivery===o.id?"on":"")} onClick={()=>setDelivery(o.id)}>
                  <span className="radio"></span>
                  <div className="ic">{o.ic}</div>
                  <div><div className="nm">{o.nm}</div><div className="sub">{o.sub}</div></div>
                  <div className="cost">{o.cost}</div>
                </div>
              ))}
            </div>
            <input className="input" style={{marginTop:14}} placeholder="Адрес доставки" defaultValue="ул. Гагарина 22, кв. 14" />
          </div>

          {/* 3 — PAYMENT */}
          <div className="co-block">
            <h3><span className="num">3</span> Оплата</h3>
            <div className="co-radio-row">
              {(role==="b2b" || role==="gov" ? [
                {id:"invoice", ic:<Ico.Receipt/>, nm:"Безналичный расчёт по счёту", sub:"УПД, ЭДО, отсрочка до 30 дней", cost:""},
                {id:"contract", ic:<Ico.Doc/>, nm:"По договору поставки", sub:"индивидуальные условия с менеджером", cost:""},
              ] : [
                {id:"cash", ic:<Ico.Cash/>, nm:"Наличными при получении", sub:"оплата курьеру или в пункте выдачи", cost:""},
                {id:"card", ic:<Ico.Card/>, nm:"Картой при получении", sub:"терминал у курьера или в пункте", cost:""},
                {id:"online", ic:<Ico.Card/>, nm:"Онлайн-оплата картой", sub:"Visa, Mastercard, МИР, СБП", cost:""},
                {id:"installment", ic:<Ico.Percent/>, nm:"Рассрочка 0% на 12 месяцев", sub:"одобрение за 5 минут — Тинькофф / Альфа", cost:""},
              ]).map(o => (
                <div key={o.id} className={"co-opt "+(payment===o.id?"on":"")} onClick={()=>setPayment(o.id)}>
                  <span className="radio"></span>
                  <div className="ic">{o.ic}</div>
                  <div><div className="nm">{o.nm}</div><div className="sub">{o.sub}</div></div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <aside className="summary" style={{position:"sticky",top:120}}>
          <h4>Ваш заказ</h4>
          {items.map(i => (
            <div key={i.id} className="sum-row" style={{alignItems:"flex-start"}}>
              <span style={{maxWidth:200,fontSize:13}}>{i.name} <span style={{color:"var(--text-mute)"}}>× {i.qty}</span></span>
              <b style={{whiteSpace:"nowrap",fontSize:13}}>{fmt(i.lineTotal)}</b>
            </div>
          ))}
          <div className="sum-row" style={{borderTop:"1px dashed rgba(33,52,108,.15)",marginTop:8,paddingTop:14}}>
            <span>Товары</span><b>{fmt(subtotal)}</b>
          </div>
          <div className="sum-row"><span>Доставка</span><b>{subtotal>50000?"бесплатно":"990 ₽"}</b></div>
          <div className="sum-total"><span>Итого</span><span className="v">{fmt(total)}</span></div>
          <button className="btn btn-primary" style={{width:"100%",marginTop:18}}>
            {role==="b2b"||role==="gov"?"Сформировать счёт":"Подтвердить заказ"} <Ico.ArrowRight />
          </button>
        </aside>
      </div>
    </React.Fragment>
  );
};

window.CheckoutScreen = CheckoutScreen;
