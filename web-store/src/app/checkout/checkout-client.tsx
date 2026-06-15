"use client";

import Link from "next/link";
import { useActionState, useEffect, useState } from "react";
import { PhoneField } from "@/components/phone-field";
import { createCheckoutOrder, type CheckoutState } from "@/app/checkout/actions";
import { formatRub } from "@/lib/format";
import { useCart } from "@/lib/use-cart";

type QuoteItem = {
  sku: number;
  name: string;
  quantity: number;
  unitPrice: number;
  total: number;
  multiplicity: number;
  slug?: string;
};

type Quote = { items: QuoteItem[]; total: number };

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
  const [quote, setQuote] = useState<Quote | null>(null);

  useEffect(() => {
    if (!cart.length) return;
    let cancelled = false;
    fetch("/api/cart/quote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: cartJson,
    })
      .then(async (response) => {
        const json = await response.json();
        if (!response.ok) throw new Error(json.error);
        return json as Quote;
      })
      .then((next) => {
        if (!cancelled) setQuote(next);
      })
      .catch(() => {
        if (!cancelled) setQuote(null);
      });
    return () => {
      cancelled = true;
    };
  }, [cartJson, cart.length]);

  if (!cart.length) {
    return (
      <div className="glass" style={{ maxWidth: 720, padding: 48, textAlign: "center", borderRadius: 28 }}>
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
    <div className="checkout-grid">
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

      <aside
        className="glass-strong"
        style={{ padding: 24, borderRadius: 24, position: "sticky", top: 100, height: "fit-content" }}
      >
        <p style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, color: "var(--text-mute)" }}>
          Ваш заказ
        </p>
        <div style={{ marginTop: 14, display: "grid", gap: 12 }}>
          {cart.map((cartItem) => {
            const item = quote?.items.find((q) => q.sku === cartItem.sku);
            return (
              <div key={cartItem.sku} style={{ display: "flex", justifyContent: "space-between", gap: 12, fontSize: 14 }}>
                <span style={{ color: "var(--text-2)", minWidth: 0 }}>
                  {item?.name ?? `SKU ${cartItem.sku}`}
                  <span style={{ color: "var(--text-mute)" }}> × {cartItem.quantity}</span>
                </span>
                <strong style={{ color: "var(--text)", whiteSpace: "nowrap" }}>{item ? formatRub(item.total) : "…"}</strong>
              </div>
            );
          })}
        </div>
        <div
          style={{
            marginTop: 16,
            paddingTop: 14,
            borderTop: "1px solid var(--glass-stroke)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
          }}
        >
          <span style={{ fontWeight: 700, color: "var(--text-2)" }}>Итого</span>
          <span style={{ fontSize: 26, fontWeight: 900, color: "var(--text)" }}>{quote ? formatRub(quote.total) : "…"}</span>
        </div>
        <p style={{ marginTop: 12, fontSize: 13, lineHeight: 1.5, color: "var(--text-mute)" }}>
          Это заявка. Итоговую стоимость и срок подтвердит менеджер. Оплата после подтверждения заказа.
        </p>
      </aside>
    </div>
  );
}
