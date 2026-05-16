import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Telegram-агент",
  description:
    "Telegram-агент для подбора техники и оформления заказов скоро появится.",
};

export default function BotPage() {
  return (
    <>
      <div className="bread">
        <Link href="/">Главная</Link>
        <span>›</span>
        <span>Telegram-агент</span>
      </div>

      <div className="section-head" style={{ margin: "6px 4px 18px" }}>
        <div>
          <h2>Telegram-агент</h2>
          <div className="meta">Раздел в разработке</div>
        </div>
      </div>

      <section className="glass" style={{ padding: 28, borderRadius: 24 }}>
        <p style={{ fontSize: 16, lineHeight: 1.55, marginBottom: 14 }}>
          Готовим Telegram-агента: подбор техники по бюджету и сценарию, проверка
          наличия и цены, оформление заказа и коммерческих предложений прямо в
          чате.
        </p>
        <p style={{ fontSize: 15, color: "var(--text-mute)", marginBottom: 24 }}>
          Пока вы можете оформить заказ через каталог или связаться с менеджером
          через «Обратный звонок» в шапке сайта.
        </p>
        <Link href="/catalog" className="btn btn-primary">
          В каталог
        </Link>
      </section>
    </>
  );
}
