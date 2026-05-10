/* B2B cabinet screen */

const B2BScreen = ({ setScreen }) => {
  const KPs = window.SHOP.KP_LIST;
  return (
    <React.Fragment>
      <div className="bread">
        <a href="#" onClick={e=>{e.preventDefault();setScreen("home")}}>Главная</a><span>›</span>
        <span>Оптовикам</span>
      </div>

      <div className="b2b-banner">
        <div>
          <span className="b2b-pill"><Ico.Building /> B2B · Оптовое направление</span>
          <h2>Опт для бизнеса:<br/>цены, отсрочка, личный менеджер</h2>
          <p>Скрытые оптовые цены, доступ к прайс-листам, формирование КП за минуты, отсрочка платежа до 30 дней. Персональный менеджер на всех этапах сделки.</p>
        </div>
        <button className="btn btn-soft btn-lg" style={{background:"#fff",color:"var(--accent-2)"}}>Заявка на оптовый аккаунт <Ico.ArrowRight /></button>
      </div>

      <div className="acc-layout">
        <AccSidebar role="b2b" />

        <div className="acc-content">
          <div className="acc-card">
            <h3>Сводка</h3>
            <div className="acc-stats">
              <div className="acc-stat"><div className="l">Открытые КП</div><div className="v">3</div><div className="d">2 на согласовании</div></div>
              <div className="acc-stat"><div className="l">Заказов в работе</div><div className="v">12</div><div className="d">4 готовы к отгрузке</div></div>
              <div className="acc-stat"><div className="l">Оборот за квартал</div><div className="v">2.4 млн ₽</div><div className="d">+ 18% к Q1</div></div>
              <div className="acc-stat"><div className="l">Кредитный лимит</div><div className="v">500 000 ₽</div><div className="d">отсрочка 30 дней</div></div>
            </div>
          </div>

          <div className="acc-card">
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
              <h3 style={{margin:0}}>Коммерческие предложения</h3>
              <button className="btn btn-primary btn-sm">+ Новое КП</button>
            </div>
            {KPs.map(k => (
              <div key={k.id} className="kp-card">
                <div className="ic"><Ico.Doc /></div>
                <div className="info">
                  <div className="nm">{k.id} · {k.subj}</div>
                  <div className="meta">создано {k.date}</div>
                </div>
                <div style={{display:"flex",gap:10,alignItems:"center"}}>
                  <span className={"status-pill status-"+k.status}>{k.statusText}</span>
                  <button className="btn btn-soft btn-sm">Открыть</button>
                </div>
              </div>
            ))}
          </div>

          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:18}}>
            <div className="acc-card">
              <h3>Прайс-листы</h3>
              <div style={{display:"grid",gap:10}}>
                {[
                  {nm:"Полный прайс · май 2026", sub:"XLSX · 8 540 позиций · обновлён вчера"},
                  {nm:"Климатика · оптовый", sub:"PDF · 640 позиций"},
                  {nm:"Крупная БТ · опт от 5 шт", sub:"XLSX · 1 240 позиций"},
                  {nm:"Компьютеры · корпоративный", sub:"PDF · 1 540 позиций"},
                ].map((d,i) => (
                  <div key={i} className="doc-card">
                    <div className="ic"><Ico.Doc /></div>
                    <div style={{flex:1}}><div className="nm">{d.nm}</div><div className="sub">{d.sub}</div></div>
                    <button className="btn btn-soft btn-sm">Скачать</button>
                  </div>
                ))}
              </div>
            </div>

            <div className="acc-card">
              <h3>Ваш персональный менеджер</h3>
              <div style={{display:"flex",alignItems:"center",gap:18,padding:"14px 0"}}>
                <div className="acc-avatar" style={{width:64,height:64,fontSize:22}}>МК</div>
                <div>
                  <div style={{fontWeight:800,fontSize:17}}>Максим Кравцов</div>
                  <div style={{fontSize:13,color:"var(--text-mute)",marginTop:4}}>B2B-направление · с 2022 года</div>
                  <div style={{display:"flex",gap:10,marginTop:12}}>
                    <button className="btn btn-soft btn-sm"><Ico.Phone /> Позвонить</button>
                    <button className="btn btn-soft btn-sm"><Ico.Telegram /> Написать</button>
                  </div>
                </div>
              </div>
              <div style={{marginTop:8,padding:14,borderRadius:12,background:"rgba(79,125,255,.1)",border:"1px solid rgba(79,125,255,.22)",fontSize:13,color:"var(--text-2)",lineHeight:1.5}}>
                Среднее время ответа: <b>14 минут</b>. Помогу собрать спецификацию, согласовать сроки, оформить отгрузку с отсрочкой.
              </div>
            </div>
          </div>
        </div>
      </div>
    </React.Fragment>
  );
};

window.B2BScreen = B2BScreen;
