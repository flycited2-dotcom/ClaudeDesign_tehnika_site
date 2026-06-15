import type { Metadata } from "next";
import Link from "next/link";
import { CheckoutClient } from "@/app/checkout/checkout-client";

export const metadata: Metadata = {
  title: "Оформление заказа",
  description:
    "Оставьте контакты для подтверждения заказа. Оплата после подтверждения, доставка под заказ по Крыму, Херсонской и Запорожской областям.",
};

export default function CheckoutPage() {
  return (
    <>
      <div className="bread">
        <Link href="/">Главная</Link>
        <span>›</span>
        <Link href="/cart">Корзина</Link>
        <span>›</span>
        <span>Оформление</span>
      </div>
      <div className="section-head" style={{ margin: "6px 4px 18px" }}>
        <div>
          <h2>Оформление заказа</h2>
          <div className="meta">
            Оставьте контакты, и менеджер подтвердит наличие, срок доставки и итоговые детали заказа. Оплата после подтверждения заказа.
          </div>
        </div>
      </div>
      <CheckoutClient />
    </>
  );
}
