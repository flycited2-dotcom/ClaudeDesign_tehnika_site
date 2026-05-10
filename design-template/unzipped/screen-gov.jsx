/* GOV cabinet screen */

const GovScreen = ({ setScreen }) => {
  return (
    <React.Fragment>
      <div className="bread">
        <a href="#" onClick={e=>{e.preventDefault();setScreen("home")}}>Главная</a><span>›</span>
        <span>Госзаказчикам</span>
      </div>

      <div className="b2b-banner gov-banner">
        <div>
          <span className="b2b-pill"><Ico.Doc /> Госзакупки · 44-ФЗ / 223-ФЗ</span>
          <h2>Поставки для государственных<br/>и муниципальных заказчиков</h2>
          <p>Аккредитация на ЕИС, опыт исполнения 600+ контрактов, бюджетная отсрочка, поставка по ТЗ с подбором аналогов. Все документы — УПД, СФ, ЭДО.</p>
        </div>
        <button className="btn btn-soft btn-lg" style={{background:"#fff",color:"var(--accent-2)"}}>Запросить КП по ТЗ <Ico.ArrowRight /></button>
      </div>

      <div className="acc-layout">
        <AccSidebar role="gov" />

        <div className="acc-content">
          <div className="acc-card">
            <h3>Сводка по закупкам</h3>
            <div className="acc-stats">
              <div className="acc-stat"><div className="l">Активных тендеров</div><div className="v">8</div><div className="d">3 в работе</div></div>
              <div className="acc-stat"><div className="l">Подписанных контрактов</div><div className="v">5</div><div className="d">в текущем году</div></div>
              <div className="acc-stat"><div className="l">Сумма контрактов</div><div className="v">8.4 млн ₽</div><div className="d">за 2026</div></div>
              <div className="acc-stat"><div className="l">Среднее время ответа</div><div className="v">2 ч 18 мин</div><div className="d">на запрос КП</div></div>
            </div>
          </div>

          <div className="acc-card">
            <h3>Запросы коммерческих предложений</h3>
            {[
              {id:"КП-3104", subj:"Холодильное оборудование, 12 позиций · ТЗ #4521", date:"30.04.2026", st:"prog", stt:"На рассмотрении · 2 ч"},
              {id:"КП-3088", subj:"Климатические системы для офиса, 8 позиций · 44-ФЗ", date:"24.04.2026", st:"done", stt:"Контракт подписан"},
              {id:"КП-3071", subj:"Компьютерная техника для школы №14, 24 позиции", date:"18.04.2026", st:"new", stt:"Новый запрос"},
              {id:"КП-3052", subj:"Бытовая техника для общежития, 32 позиции", date:"10.04.2026", st:"done", stt:"Контракт подписан"},
            ].map(k => (
              <div key={k.id} className="kp-card">
                <div className="ic"><Ico.Doc /></div>
                <div className="info">
                  <div className="nm">{k.id} · {k.subj}</div>
                  <div className="meta">создано {k.date}</div>
                </div>
                <div style={{display:"flex",gap:10,alignItems:"center"}}>
                  <span className={"status-pill status-"+k.st}>{k.stt}</span>
                  <button className="btn btn-soft btn-sm">Открыть</button>
                </div>
              </div>
            ))}
          </div>

          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:18}}>
            <div className="acc-card">
              <h3>Документы и аккредитации</h3>
              <div style={{display:"grid",gap:10}}>
                {[
                  ["Выписка из ЕГРЮЛ","PDF · от 01.05.2026"],
                  ["Аккредитация на ЕИС","PDF · до 12.2027"],
                  ["Декларация о принадлежности к МСП","PDF · 2026"],
                  ["Реестр исполненных контрактов","XLSX · 612 записей"],
                  ["Образец УПД","PDF · шаблон"],
                  ["Договор поставки (типовой)","DOCX · редакция от 03.2026"],
                ].map((d,i)=>(
                  <div key={i} className="doc-card">
                    <div className="ic"><Ico.Doc /></div>
                    <div style={{flex:1}}><div className="nm">{d[0]}</div><div className="sub">{d[1]}</div></div>
                    <button className="btn btn-soft btn-sm">Скачать</button>
                  </div>
                ))}
              </div>
            </div>

            <div className="acc-card">
              <h3>Загрузить ТЗ</h3>
              <div style={{padding:32,borderRadius:16,border:"2px dashed rgba(79,125,255,.32)",background:"rgba(255,255,255,.4)",textAlign:"center"}}>
                <div style={{display:"grid",placeItems:"center",margin:"0 auto 14px",width:64,height:64,borderRadius:18,background:"rgba(79,125,255,.14)",color:"var(--accent-2)"}}>
                  <Ico.Doc width="28" height="28" />
                </div>
                <div style={{fontWeight:800,fontSize:15}}>Перетащите файл ТЗ сюда</div>
                <div style={{fontSize:13,color:"var(--text-mute)",marginTop:6}}>PDF, DOCX, XLSX до 20 МБ</div>
                <button className="btn btn-primary btn-sm" style={{marginTop:18}}>Выбрать файл</button>
              </div>
              <div style={{marginTop:14,padding:14,borderRadius:12,background:"rgba(255,200,87,.18)",border:"1px solid rgba(255,200,87,.35)",fontSize:13,color:"#6b4d00",lineHeight:1.5}}>
                <b>Подберём аналоги</b> по техническим характеристикам и составим коммерческое предложение в течение 4 часов.
              </div>
              <div style={{marginTop:14,display:"flex",alignItems:"center",gap:14}}>
                <div className="acc-avatar" style={{background:"linear-gradient(135deg,#FFC857,#ff9b3d)"}}>ЕС</div>
                <div>
                  <div style={{fontWeight:800,fontSize:14}}>Елена Семёнова — куратор закупок</div>
                  <div style={{fontSize:12,color:"var(--text-mute)"}}>Прямая линия: +7 (978) 555-22-11</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </React.Fragment>
  );
};

window.GovScreen = GovScreen;
