"use client";

import { Minus, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { writeCart } from "@/lib/cart-storage";
import { publicFulfillmentText } from "@/lib/fulfillment";
import { formatRub } from "@/lib/format";
import { useCart } from "@/lib/use-cart";

type QuoteItem = {
  sku: number;
  name: string;
  quantity: number;
  unitPrice: number;
  total: number;
  multiplicity: number;
};

type Quote = {
  items: QuoteItem[];
  total: number;
};

export function CartClient() {
  const cart = useCart();
  const [quote, setQuote] = useState<Quote | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fulfillment = publicFulfillmentText({ isAvailable: true });

  useEffect(() => {
    if (!cart.length) {
      return;
    }

    fetch("/api/cart/quote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: cart }),
    })
      .then(async (response) => {
        const json = await response.json();
        if (!response.ok) throw new Error(json.error);
        return json as Quote;
      })
      .then((nextQuote) => {
        setQuote(nextQuote);
        setError(null);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Ошибка корзины");
        setQuote(null);
      });
  }, [cart]);

  const quotedBySku = useMemo(() => new Map(quote?.items.map((item) => [item.sku, item]) ?? []), [quote]);
  const totalQuantity = cart.reduce((sum, item) => sum + item.quantity, 0);

  function updateQuantity(sku: number, direction: number) {
    // Step by the product's multiplicity so quantities stay a valid multiple.
    // Stepping by 1 would make e.g. a 3-pack item land on 4 and the server quote
    // would reject the cart ("продается кратно 3 шт."), blocking checkout.
    const step = Math.max(quotedBySku.get(sku)?.multiplicity ?? 1, 1);
    const next = cart
      .map((item) =>
        item.sku === sku ? { ...item, quantity: Math.max(step, item.quantity + direction * step) } : item,
      )
      .filter((item) => item.quantity > 0);
    writeCart(next);
  }

  function removeItem(sku: number) {
    const next = cart.filter((item) => item.sku !== sku);
    writeCart(next);
  }

  function clearCart() {
    writeCart([]);
  }

  if (!cart.length) {
    return (
      <>
        <div className="bread">
          <Link href="/">Главная</Link>
          <span>›</span>
          <span>Корзина</span>
        </div>
        <div
          className="glass"
          style={{ padding: 48, textAlign: "center", borderRadius: 28, marginTop: 16 }}
        >
          <h1 style={{ fontSize: 28, fontWeight: 900, color: "var(--text)" }}>Корзина пустая</h1>
          <p style={{ marginTop: 12, color: "var(--text-mute)", maxWidth: 480, margin: "12px auto 0" }}>
            Выберите товары в каталоге, добавьте их в корзину и оставьте контакты для подтверждения заказа.
          </p>
          <Link href="/catalog" className="btn btn-primary" style={{ marginTop: 24, display: "inline-flex" }}>
            В каталог
          </Link>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="bread">
        <Link href="/">Главная</Link>
        <span>›</span>
        <span>Корзина</span>
      </div>

      <div className="cart-layout" style={{ alignItems: "start" }}>
        <section className="glass" style={{ padding: 0, borderRadius: 24, overflow: "hidden" }}>
          <div
            style={{
              padding: 24,
              borderBottom: "1px solid rgba(255,255,255,0.5)",
              display: "flex",
              flexWrap: "wrap",
              gap: 12,
              justifyContent: "space-between",
              alignItems: "flex-start",
            }}
          >
            <div>
              <h1 style={{ fontSize: 28, fontWeight: 900, color: "var(--text)" }}>Корзина</h1>
              <p style={{ marginTop: 6, color: "var(--text-mute)", fontSize: 14 }}>
                {totalQuantity.toLocaleString("ru-RU")} шт. в заявке. Менеджер подтвердит цену и срок перед оплатой.
              </p>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              <Link href="/catalog" className="btn btn-soft btn-sm">
                Продолжить покупки
              </Link>
              <button type="button" className="btn btn-ghost btn-sm" onClick={clearCart}>
                <Trash2 size={14} aria-hidden />
                Очистить
              </button>
            </div>
          </div>
          {cart.map((cartItem, index) => {
            const item = quotedBySku.get(cartItem.sku);
            return (
              <div
                key={cartItem.sku}
                className="cart-line"
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  alignItems: "center",
                  gap: 16,
                  padding: 20,
                  borderTop: index === 0 ? "none" : "1px solid rgba(255,255,255,0.5)",
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontWeight: 700, color: "var(--text)" }}>{item?.name ?? `SKU ${cartItem.sku}`}</p>
                  <p style={{ marginTop: 4, fontSize: 13, color: "var(--text-mute)" }}>SKU {cartItem.sku}</p>
                  <p style={{ marginTop: 4, fontSize: 13, color: "#0e6b3a" }}>
                    {fulfillment.stockLabel} · {fulfillment.deliveryShortLabel}
                  </p>
                </div>
                <div className="cart-line-ctl" style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  <div
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      background: "rgba(255,255,255,0.6)",
                      border: "1px solid var(--glass-stroke)",
                      borderRadius: 12,
                    }}
                  >
                    <button
                      type="button"
                      style={{ padding: 8, color: "var(--text)" }}
                      onClick={() => updateQuantity(cartItem.sku, -1)}
                      aria-label="Уменьшить"
                    >
                      <Minus size={14} aria-hidden />
                    </button>
                    <span style={{ width: 40, textAlign: "center", fontWeight: 700, fontSize: 14 }}>
                      {cartItem.quantity}
                    </span>
                    <button
                      type="button"
                      style={{ padding: 8, color: "var(--text)" }}
                      onClick={() => updateQuantity(cartItem.sku, 1)}
                      aria-label="Увеличить"
                    >
                      <Plus size={14} aria-hidden />
                    </button>
                  </div>
                  <div
                    style={{
                      width: 130,
                      textAlign: "right",
                      fontWeight: 800,
                      fontSize: 16,
                      color: "var(--text)",
                    }}
                  >
                    {item ? formatRub(item.total) : "..."}
                  </div>
                  <button
                    type="button"
                    style={{
                      padding: 8,
                      color: "var(--text-mute)",
                      borderRadius: 10,
                    }}
                    onClick={() => removeItem(cartItem.sku)}
                    aria-label="Удалить"
                  >
                    <Trash2 size={16} aria-hidden />
                  </button>
                </div>
              </div>
            );
          })}
        </section>

        <aside
          className="glass-strong"
          style={{ padding: 24, borderRadius: 24, position: "sticky", top: 100 }}
        >
          <p
            style={{
              fontSize: 12,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: 1,
              color: "var(--text-mute)",
            }}
          >
            Итого
          </p>
          <div
            style={{
              marginTop: 10,
              fontSize: 36,
              fontWeight: 900,
              letterSpacing: "-0.02em",
              color: "var(--text)",
            }}
          >
            {quote ? formatRub(quote.total) : "..."}
          </div>
          <p style={{ marginTop: 12, fontSize: 13, lineHeight: 1.5, color: "var(--text-mute)" }}>
            Это заявка на заказ. Менеджер подтвердит наличие у поставщика, доставку под заказ 7 дней и итоговую стоимость.
          </p>
          <p style={{ marginTop: 6, fontSize: 13, color: "var(--text-mute)" }}>Оплата после подтверждения заказа.</p>
          {error ? (
            <p
              style={{
                marginTop: 14,
                padding: 12,
                borderRadius: 12,
                background: "rgba(255,200,90,0.18)",
                color: "#7a4a00",
                fontSize: 13,
              }}
            >
              {error}
            </p>
          ) : null}
          {quote && !error ? (
            <Link
              href="/checkout"
              className="btn btn-primary"
              style={{ marginTop: 20, width: "100%" }}
            >
              Перейти к оформлению заявки
            </Link>
          ) : (
            <span
              className="btn btn-soft"
              style={{ marginTop: 20, width: "100%", opacity: 0.7, cursor: "default" }}
            >
              Проверяем корзину
            </span>
          )}
          <Link
            href="/catalog"
            style={{
              display: "inline-flex",
              justifyContent: "center",
              width: "100%",
              marginTop: 12,
              fontSize: 14,
              fontWeight: 700,
              color: "var(--accent-2)",
            }}
          >
            Добавить ещё товары
          </Link>
        </aside>
      </div>
    </>
  );
}
