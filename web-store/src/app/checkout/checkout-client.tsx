"use client";

import Link from "next/link";
import { useActionState } from "react";
import { PhoneField } from "@/components/phone-field";
import { createCheckoutOrder, type CheckoutState } from "@/app/checkout/actions";
import { useCart } from "@/lib/use-cart";

const initialState: CheckoutState = {};

const labelStyle: React.CSSProperties = {
  display: "grid",
  gap: 8,
  fontSize: 14,
  fontWeight: 600,
  color: "var(--text-2)",
};

export function CheckoutClient() {
  const [state, action, pending] = useActionState(createCheckoutOrder, initialState);
  const cart = useCart();
  const cartJson = JSON.stringify(cart);

  if (!cart.length) {
    return (
      <div className="glass" style={{ padding: 48, textAlign: "center", borderRadius: 28 }}>
        <h2 style={{ fontSize: 26, fontWeight: 900, color: "var(--text)" }}>Корзина пустая</h2>
        <p style={{ marginTop: 12, color: "var(--text-mute)", maxWidth: 480, margin: "12px auto 0" }}>
          Добавьте товары в корзину, а затем оставьте контакты для подтверждения заказа.
        </p>
        <Link href="/catalog" className="btn btn-primary" style={{ marginTop: 24, display: "inline-flex" }}>
          В каталог
        </Link>
      </div>
    );
  }

  return (
    <form action={action} className="glass" style={{ padding: 28, borderRadius: 24, display: "grid", gap: 16 }}>
      <input type="hidden" name="cartItems" value={cartJson} />
      <div
        style={{
          padding: 14,
          borderRadius: 14,
          background: "rgba(34,221,136,0.10)",
          color: "#0e6b3a",
          fontSize: 13,
          lineHeight: 1.5,
        }}
      >
        После отправки заявки менеджер свяжется с вами, подтвердит наличие у поставщика, доставку под заказ 7 дней и итоговую стоимость.
        Оплата после подтверждения заказа.
      </div>
      <label style={labelStyle}>
        Имя
        <input className="input" name="customerName" required />
      </label>
      <label style={labelStyle}>
        Телефон
        <PhoneField required />
      </label>
      <label style={labelStyle}>
        Email
        <input className="input" name="email" type="email" />
      </label>
      <label style={labelStyle}>
        Комментарий
        <textarea
          name="comment"
          rows={4}
          className="input"
          style={{ height: "auto", padding: "12px 18px", lineHeight: 1.5 }}
        />
      </label>
      <label
        style={{
          display: "flex",
          gap: 10,
          padding: 12,
          borderRadius: 14,
          background: "rgba(255,255,255,0.5)",
          fontSize: 13,
          color: "var(--text-2)",
          cursor: "pointer",
        }}
      >
        <input
          name="personalDataConsent"
          required
          type="checkbox"
          style={{ marginTop: 3, accentColor: "var(--accent)" }}
        />
        <span>
          Я согласен на обработку персональных данных для оформления заказа и связи со мной.{" "}
          <Link
            href="/privacy"
            style={{ fontWeight: 700, color: "var(--accent-2)" }}
            target="_blank"
          >
            Политика обработки персональных данных
          </Link>
        </span>
      </label>
      {state.error ? (
        <p
          style={{
            padding: 12,
            borderRadius: 12,
            background: "rgba(255,90,90,0.12)",
            color: "#a33",
            fontSize: 13,
          }}
        >
          {state.error}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="btn btn-primary btn-lg"
        style={{ width: "100%", opacity: pending ? 0.7 : 1, cursor: pending ? "not-allowed" : "pointer" }}
      >
        {pending ? "Отправляем заявку..." : "Отправить заявку"}
      </button>
    </form>
  );
}
