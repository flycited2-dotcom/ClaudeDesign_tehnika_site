import type { Metadata } from "next";
import Link from "next/link";
import { storefront } from "@/lib/storefront";

export const metadata: Metadata = {
  title: "Политика обработки персональных данных",
  description: "Как БытТехОпт использует контактные данные покупателей для обработки заказов и связи с клиентом.",
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">Персональные данные</p>
      <h1 className="mt-2 text-3xl font-black tracking-normal text-zinc-950">Политика обработки персональных данных</h1>
      <div className="mt-6 space-y-6 rounded-lg border border-zinc-200 bg-white p-6 leading-7 text-zinc-700 shadow-sm">
        <section>
          <h2 className="text-xl font-bold text-zinc-950">Какие данные мы получаем</h2>
          <p className="mt-2">
            При оформлении заказа {storefront.brand} получает имя, телефон, email при его указании, состав заказа и комментарий покупателя.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-zinc-950">Для чего используются данные</h2>
          <p className="mt-2">
            Данные нужны, чтобы подтвердить заказ, уточнить наличие товара, согласовать доставку по региону {storefront.region} и связаться с покупателем по его заявке.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-zinc-950">Передача и хранение</h2>
          <p className="mt-2">
            Мы не публикуем персональные данные покупателей и не используем их для посторонних рассылок. Доступ к заявке получает менеджер магазина, который обрабатывает заказ.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-zinc-950">Как отозвать согласие</h2>
          <p className="mt-2">
            Чтобы уточнить, изменить или удалить данные по заказу, напишите на{" "}
            <a href={`mailto:${storefront.email}`} className="font-semibold text-teal-800 hover:text-teal-950">
              {storefront.email}
            </a>{" "}
            или позвоните: {storefront.phones.join(", ")}.
          </p>
        </section>
      </div>
      <Link href="/catalog" className="mt-6 inline-flex h-11 items-center rounded-lg bg-teal-700 px-5 text-sm font-semibold text-white hover:bg-teal-800">
        Вернуться в каталог
      </Link>
    </div>
  );
}
