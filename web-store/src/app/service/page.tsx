import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Сервис",
  description:
    "Раздел сервисного обслуживания скоро появится. Для срочных вопросов — обратный звонок в шапке сайта.",
};

export default function ServicePage() {
  return (
    <>
      <div className="bread">
        <Link href="/">Главная</Link>
        <span>›</span>
        <span>Сервис</span>
      </div>

      <div className="section-head" style={{ margin: "6px 4px 18px" }}>
        <div>
          <h2>Сервис и поддержка</h2>
          <div className="meta">Раздел в разработке</div>
        </div>
      </div>

      <section className="glass" style={{ padding: 28, borderRadius: 24 }}>
        <p style={{ fontSize: 16, lineHeight: 1.55, marginBottom: 14 }}>
          Здесь появится информация о гарантии, сервисном обслуживании и ремонте
          техники, купленной в БытТехОпт.
        </p>
        <p style={{ fontSize: 15, color: "var(--text-mute)", marginBottom: 24 }}>
          Если у вас уже есть вопрос по сервису — воспользуйтесь кнопкой
          «Обратный звонок» в шапке сайта или напишите на{" "}
          <a href="mailto:zakaz@climat-simf.ru" style={{ color: "var(--accent-2)" }}>
            zakaz@climat-simf.ru
          </a>
          . Менеджер ответит в течение рабочего дня.
        </p>
        <Link href="/" className="btn btn-primary">
          На главную
        </Link>
      </section>
    </>
  );
}
