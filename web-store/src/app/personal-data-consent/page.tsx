import type { Metadata } from "next";
import Link from "next/link";
import { storefront } from "@/lib/storefront";

export const metadata: Metadata = {
  title: "Согласие на обработку персональных данных",
  description: "Согласие посетителя сайта БытТехОпт на обработку данных, переданных через формы.",
};

const sectionTitle = { fontSize: 18, fontWeight: 800, color: "var(--text)" } as const;
const listStyle = { margin: "8px 0 0", paddingLeft: 22 } as const;
const linkStyle = { fontWeight: 700, color: "var(--accent-2)" } as const;

export default function PersonalDataConsentPage() {
  return (
    <div style={{ maxWidth: 880, margin: "0 auto" }}>
      <div className="bread"><Link href="/">Главная</Link><span>›</span><span>Согласие на обработку данных</span></div>
      <div className="section-head" style={{ margin: "6px 4px 18px" }}>
        <div><h2>Согласие на обработку персональных данных</h2><div className="meta">Для форм сайта {storefront.brand}</div></div>
      </div>

      <article className="glass" style={{ padding: 32, borderRadius: 24, display: "grid", gap: 22, lineHeight: 1.7, color: "var(--text-2)" }}>
        <p>
          Проставляя отметку в поле согласия и отправляя форму на сайте {storefront.siteUrl}, я свободно, своей волей и в
          своём интересе даю индивидуальному предпринимателю Гуременко Антонии Николаевне согласие на обработку моих
          персональных данных на следующих условиях.
        </p>
        <section>
          <h3 style={sectionTitle}>1. Данные</h3>
          <ul style={listStyle}>
            <li>имя, телефон, email и предпочтительный способ связи;</li>
            <li>товары, содержание заявки, комментарий, адрес или ориентир доставки;</li>
            <li>название компании, ИНН, должность и другие сведения делового запроса, если они указаны;</li>
            <li>IP-адрес, браузер, устройство, дата и время обращения, идентификатор сессии.</li>
          </ul>
        </section>
        <section>
          <h3 style={sectionTitle}>2. Цели</h3>
          <ul style={listStyle}>
            <li>принять заявку и связаться со мной;</li>
            <li>уточнить наличие, цену, параметры товара, оплату и доставку;</li>
            <li>подготовить предложение, оформить и исполнить согласованный заказ;</li>
            <li>создать и защищать учётную запись, если я использую функции авторизации;</li>
            <li>рассмотреть запрос на оптовую поставку, сервис или участие в закупке.</li>
          </ul>
        </section>
        <section>
          <h3 style={sectionTitle}>3. Разрешённые действия</h3>
          <p style={{ marginTop: 8 }}>
            Я разрешаю сбор, запись, систематизацию, накопление, хранение, уточнение, извлечение, использование, передачу
            уполномоченным получателям, обезличивание, блокирование и удаление данных с автоматизацией и без неё.
          </p>
        </section>
        <section>
          <h3 style={sectionTitle}>4. Уведомления и исполнители</h3>
          <p style={{ marginTop: 8 }}>
            Я уведомлён, что для обработки обращения содержание формы может поступить менеджеру через информационную
            систему сайта, Telegram и электронную почту. Данные могут быть переданы поставщику или службе доставки только
            в объёме, необходимом для исполнения согласованного со мной заказа.
          </p>
        </section>
        <section>
          <h3 style={sectionTitle}>5. Срок и отзыв</h3>
          <p style={{ marginTop: 8 }}>
            Согласие действует до достижения целей обработки или до его отзыва, если продолжение обработки не требуется
            по закону или договору. Отозвать согласие можно письмом на{" "}
            <a href={`mailto:${storefront.email}`} style={linkStyle}>{storefront.email}</a> либо обращением по телефону{" "}
            {storefront.phones.join(", ")}. Порядок обработки и права пользователя подробнее описаны в{" "}
            <Link href="/privacy" style={linkStyle}>Политике обработки персональных данных</Link>.
          </p>
        </section>
        <p style={{ fontSize: 13, color: "var(--text-mute)" }}>Редакция от 23 августа 2026 г.</p>
      </article>
    </div>
  );
}
