import type { Metadata } from "next";
import Link from "next/link";
import { storefront } from "@/lib/storefront";

export const metadata: Metadata = {
  title: "Политика обработки персональных данных",
  description:
    "Как БытТехОпт использует контактные данные покупателей для обработки заказов и связи с клиентом.",
};

export default function PrivacyPage() {
  return (
    <div style={{ maxWidth: 880, margin: "0 auto" }}>
      <div className="bread">
        <Link href="/">Главная</Link>
        <span>›</span>
        <span>Персональные данные</span>
      </div>

      <div className="section-head" style={{ margin: "6px 4px 18px" }}>
        <div>
          <h2>Политика обработки персональных данных</h2>
          <div className="meta">{storefront.brand}</div>
        </div>
      </div>

      <article
        className="glass"
        style={{ padding: 32, borderRadius: 24, display: "grid", gap: 22, lineHeight: 1.7, color: "var(--text-2)" }}
      >
        <section>
          <h3 style={{ fontSize: 18, fontWeight: 800, color: "var(--text)" }}>Какие данные мы получаем</h3>
          <p style={{ marginTop: 8 }}>
            При оформлении заказа {storefront.brand} получает имя, телефон, email при его указании, состав заказа и комментарий покупателя.
          </p>
        </section>
        <section>
          <h3 style={{ fontSize: 18, fontWeight: 800, color: "var(--text)" }}>Для чего используются данные</h3>
          <p style={{ marginTop: 8 }}>
            Данные нужны, чтобы подтвердить заказ, уточнить наличие товара, согласовать доставку по региону {storefront.region} и связаться с покупателем по его заявке.
          </p>
        </section>
        <section>
          <h3 style={{ fontSize: 18, fontWeight: 800, color: "var(--text)" }}>Передача и хранение</h3>
          <p style={{ marginTop: 8 }}>
            Мы не публикуем персональные данные покупателей и не используем их для посторонних рассылок. Доступ к заявке получает менеджер магазина, который обрабатывает заказ.
          </p>
        </section>
        <section>
          <h3 style={{ fontSize: 18, fontWeight: 800, color: "var(--text)" }}>Как отозвать согласие</h3>
          <p style={{ marginTop: 8 }}>
            Чтобы уточнить, изменить или удалить данные по заказу, напишите на{" "}
            <a href={`mailto:${storefront.email}`} style={{ fontWeight: 700, color: "var(--accent-2)" }}>
              {storefront.email}
            </a>{" "}
            или позвоните: {storefront.phones.join(", ")}.
          </p>
        </section>
      </article>

      <Link href="/catalog" className="btn btn-primary" style={{ marginTop: 20, display: "inline-flex" }}>
        Вернуться в каталог
      </Link>
    </div>
  );
}
