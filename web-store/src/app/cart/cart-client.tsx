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

  function updateQuantity(sku: number, delta: number) {
    const next = cart
      .map((item) => (item.sku === sku ? { ...item, quantity: Math.max(1, item.quantity + delta) } : item))
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
      <div className="rounded-lg border border-dashed border-zinc-300 bg-white p-10 text-center">
        <h1 className="text-2xl font-black text-zinc-950">Корзина пустая</h1>
        <p className="mt-2 text-zinc-500">Выберите товары в каталоге, добавьте их в корзину и оставьте контакты для подтверждения заказа.</p>
        <Link href="/catalog" className="mt-6 inline-flex h-11 items-center rounded-lg bg-teal-700 px-5 text-sm font-semibold text-white hover:bg-teal-800">
          В каталог
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <section className="rounded-lg border border-zinc-200 bg-white">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-100 p-4">
          <div>
            <h1 className="text-2xl font-black text-zinc-950">Корзина</h1>
            <p className="mt-1 text-sm text-zinc-500">
              {totalQuantity.toLocaleString("ru-RU")} шт. в заявке. Менеджер подтвердит цену и срок перед оплатой.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/catalog" className="inline-flex h-10 items-center rounded-lg border border-zinc-200 px-4 text-sm font-semibold hover:bg-zinc-50">
              Продолжить покупки
            </Link>
            <button
              className="inline-flex h-10 items-center rounded-lg border border-red-100 px-4 text-sm font-semibold text-red-700 hover:bg-red-50"
              onClick={clearCart}
            >
              Очистить корзину
            </button>
          </div>
        </div>
        {cart.map((cartItem) => {
          const item = quotedBySku.get(cartItem.sku);
          return (
            <div key={cartItem.sku} className="flex flex-wrap items-center gap-4 border-b border-zinc-100 p-4 last:border-b-0">
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-zinc-950">{item?.name ?? `SKU ${cartItem.sku}`}</p>
                <p className="mt-1 text-sm text-zinc-500">SKU {cartItem.sku}</p>
                <p className="mt-1 text-sm text-emerald-700">
                  {fulfillment.stockLabel} · {fulfillment.deliveryShortLabel}
                </p>
              </div>
              <div className="flex items-center rounded-lg border border-zinc-200">
                <button className="p-2 hover:bg-zinc-50" onClick={() => updateQuantity(cartItem.sku, -1)} aria-label="Уменьшить">
                  <Minus className="size-4" />
                </button>
                <span className="w-12 text-center text-sm font-semibold">{cartItem.quantity}</span>
                <button className="p-2 hover:bg-zinc-50" onClick={() => updateQuantity(cartItem.sku, 1)} aria-label="Увеличить">
                  <Plus className="size-4" />
                </button>
              </div>
              <div className="w-32 text-right font-bold text-zinc-950">{item ? formatRub(item.total) : "..."}</div>
              <button className="rounded-lg p-2 text-zinc-400 hover:bg-red-50 hover:text-red-600" onClick={() => removeItem(cartItem.sku)} aria-label="Удалить">
                <Trash2 className="size-4" />
              </button>
            </div>
          );
        })}
      </section>

      <aside className="h-fit rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
        <p className="text-sm font-bold uppercase tracking-wide text-zinc-500">Итого</p>
        <div className="mt-3 text-3xl font-black text-zinc-950">{quote ? formatRub(quote.total) : "..."}</div>
        <p className="mt-2 text-sm text-zinc-500">
          Это заявка на заказ. Менеджер подтвердит наличие у поставщика, доставку под заказ 7 дней и итоговую стоимость.
        </p>
        <p className="mt-2 text-sm text-zinc-500">Оплата после подтверждения заказа.</p>
        {error ? <p className="mt-3 rounded-md bg-amber-50 p-3 text-sm text-amber-900">{error}</p> : null}
        {quote && !error ? (
          <Link
            href="/checkout"
            className="mt-5 inline-flex h-11 w-full items-center justify-center rounded-lg bg-zinc-950 text-sm font-semibold text-white hover:bg-teal-800"
          >
            Перейти к оформлению заявки
          </Link>
        ) : (
          <span className="mt-5 inline-flex h-11 w-full items-center justify-center rounded-lg bg-zinc-200 text-sm font-semibold text-zinc-500">
            Проверяем корзину
          </span>
        )}
        <Link href="/catalog" className="mt-3 inline-flex w-full justify-center text-sm font-semibold text-teal-800 hover:text-teal-950">
          Добавить ещё товары
        </Link>
      </aside>
    </div>
  );
}
