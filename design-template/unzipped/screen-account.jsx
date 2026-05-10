/* ACCOUNT (B2C) screen */

const AccSidebar = ({ active, role }) => {
  const items = role==="b2b" ? [
    {id:"dash", nm:"Кабинет", ic:<Ico.User/>},
    {id:"orders", nm:"Заказы", ic:<Ico.Box/>, cnt:"12"},
    {id:"kp", nm:"Коммерческие предложения", ic:<Ico.Doc/>, cnt:"3"},
    {id:"prices", nm:"Прайс-листы", ic:<Ico.Receipt/>},
    {id:"manager", nm:"Личный менеджер", ic:<Ico.Headset/>},
    {id:"docs", nm:"Документы", ic:<Ico.Doc/>},
    {id:"company", nm:"Реквизиты", ic:<Ico.Building/>},
  ] : role==="gov" ? [
    {id:"dash", nm:"Кабинет", ic:<Ico.User/>},
    {id:"tenders", nm:"Тендеры и закупки", ic:<Ico.Doc/>, cnt:"8"},
    {id:"kp", nm:"Запросы КП", ic:<Ico.Receipt/>, cnt:"3"},
    {id:"contracts", nm:"Договоры", ic:<Ico.Doc/>, cnt:"5"},
    {id:"specs", nm:"Спецификации", ic:<Ico.Doc/>},
    {id:"manager", nm:"Куратор закупок", ic:<Ico.Headset/>},
    {id:"company", nm:"Организация", ic:<Ico.Building/>},
  ] : [
    {id:"dash", nm:"Кабинет", ic:<Ico.User/>},
    {id:"orders", nm:"Мои заказы", ic:<Ico.Box/>, cnt:"5"},
    {id:"favs", nm:"Избранное", ic:<Ico.Fav/>, cnt:"3"},
    {id:"compare", nm:"Сравнение", ic:<Ico.Compare/>, cnt:"2"},
    {id:"addr", nm:"Адреса доставки", ic:<Ico.Pin/>},
    {id:"settings", nm:"Настройки", ic:<Ico.Settings/>},
  ];
  return (
    <aside className="acc-sidebar">
      <div className="acc-user">
        <div className="acc-avatar">АИ</div>
        <div>
          <div className="acc-name">{role==="b2b"||role==="gov"?"ООО «Дельта-Сервис»":"Алексей Иванов"}</div>
          <div className="acc-meta">{role==="b2b"?"Опт · с 2024":role==="gov"?"Госзакупки · 44-ФЗ":"Бонусы: 4 280 ₽"}</div>
        </div>
      </div>
      <nav className="acc-nav">
        {items.map(i => (
          <a key={i.id} href="#" className={i.id==="dash"?"on":""}>{i.ic}{i.nm}{i.cnt && <span className="cnt">{i.cnt}</span>}</a>
        ))}
        <a href="#" style={{marginTop:14,color:"var(--text-mute)"}}><Ico.Logout />Выйти</a>
      </nav>
    </aside>
  );
};

const AccountScreen = ({ setScreen, role }) => {
  const orders = window.SHOP.ORDERS;
  return (
    <React.Fragment>
      <div className="bread">
        <a href="#" onClick={e=>{e.preventDefault();setScreen("home")}}>Главная</a><span>›</span>
        <span>Личный кабинет</span>
      </div>

      <div className="acc-layout">
        <AccSidebar role="b2c" />

        <div className="acc-content">
          <div className="acc-card">
            <h3>Здравствуйте, Алексей!</h3>
            <div className="acc-stats">
              <div className="acc-stat"><div className="l">Активных заказов</div><div className="v">2</div><div className="d">в доставке</div></div>
              <div className="acc-stat"><div className="l">Бонусов</div><div className="v">4 280</div><div className="d">+ 240 за месяц</div></div>
              <div className="acc-stat"><div className="l">Куплено за год</div><div className="v">232 410 ₽</div><div className="d">5 заказов</div></div>
              <div className="acc-stat"><div className="l">Уровень</div><div className="v">Серебро</div><div className="d">скидка 5%</div></div>
            </div>
          </div>

          <div className="acc-card">
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
              <h3 style={{margin:0}}>Последние заказы</h3>
              <a href="#" style={{fontSize:13,fontWeight:600,color:"var(--accent-2)",display:"flex",alignItems:"center",gap:6}}>Все заказы <Ico.ArrowRight /></a>
            </div>
            {orders.map(o => (
              <div key={o.id} className="order-row">
                <div>
                  <div className="nm">№ {o.id}</div>
                  <div className="num">{o.date} · {o.items} {o.items===1?"товар":"товаров"}</div>
                </div>
                <div style={{fontSize:13,color:"var(--text-mute)"}}>Симферополь, Гагарина 22</div>
                <span className={"status-pill status-"+o.status}>{o.statusText}</span>
                <div style={{fontWeight:900,fontSize:16,letterSpacing:"-0.02em"}}>{o.total}</div>
                <button className="btn btn-soft btn-sm">Подробнее</button>
              </div>
            ))}
          </div>

          <div className="acc-card">
            <h3>Рекомендуем</h3>
            <div className="product-grid" style={{gridTemplateColumns:"repeat(3,1fr)"}}>
              {window.SHOP.PRODUCTS.slice(2,5).map(p=>(
                <div key={p.id} className="p-card" onClick={()=>setScreen("product")}>
                  <div className="p-art">
                    <div className="p-tags">{p.tags.includes("new") && <span className="p-tag new">Новинка</span>}</div>
                    <div style={{fontFamily:"JetBrains Mono",fontSize:11,opacity:.6}}>img/{p.brand.toLowerCase()}</div>
                  </div>
                  <div className="p-body">
                    <div className="p-meta">{p.brand}</div>
                    <div className="p-name">{p.name}</div>
                    <div className="p-foot">
                      <div className="p-price"><span className="new">{fmt(p.price)}</span></div>
                      <button className="add"><Ico.Cart /></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </React.Fragment>
  );
};

window.AccountScreen = AccountScreen;
window.AccSidebar = AccSidebar;
