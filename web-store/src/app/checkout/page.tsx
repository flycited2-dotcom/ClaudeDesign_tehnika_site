import type { Metadata } from "next";
import { CheckoutClient } from "@/app/checkout/checkout-client";

export const metadata: Metadata = {
  title: "Оформление заказа",
  description: "Оставьте контакты для подтверждения заказа. Оплата при получении, доставка по Крыму, Херсонской и Запорожской областям.",
};

export default function CheckoutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">Оформление</p>
      <h1 className="mt-2 text-3xl font-black tracking-normal text-zinc-950">Контактные данные</h1>
      <p className="mb-6 mt-3 text-zinc-600">
        Оставьте контакты, и менеджер подтвердит наличие, срок доставки и итоговые детали заказа. Оплата при получении.
      </p>
      <CheckoutClient />
    </div>
  );
}
