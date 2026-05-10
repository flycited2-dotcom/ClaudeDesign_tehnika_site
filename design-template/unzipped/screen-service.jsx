/* SERVICE screen — установка и ремонт */

const ServiceScreen = ({ setScreen }) => {
  return (
    <React.Fragment>
      <div className="bread">
        <a href="#" onClick={e=>{e.preventDefault();setScreen("home")}}>Главная</a>
        <span>›</span>
        <span>Сервис и установка</span>
      </div>
      <div className="section-head" style={{margin:"6px 4px 18px"}}>
        <div>
          <h2>Установка и сервис</h2>
          <div className="meta">Раздел в разработке — расскажу о мастерах, прайсе и гарантиях</div>
        </div>
      </div>
    </React.Fragment>
  );
};
window.ServiceScreen = ServiceScreen;
