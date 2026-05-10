"use client";

import Link from "next/link";
import { useActionState } from "react";
import { createCheckoutOrder, type CheckoutState } from "@/app/checkout/actions";
import { useCart } from "@/lib/use-cart";

const initialState: CheckoutState = {};

export function CheckoutClient() {
  const [state, action, pending] = useActionState(createCheckoutOrder, initialState);
  const cart = useCart();
  const cartJson = JSON.stringify(cart);

  if (!cart.length) {
    return (
      <div className="rounded-lg border border-dashed border-zinc-300 bg-white p-10 text-center">
        <h2 className="text-2xl font-black text-zinc-950">Корзина пустая</h2>
        <p className="mt-2 text-zinc-500">Добавьте товары в корзину, а затем оставьте контакты для подтверждения заказа.</p>
        <Link href="/catalog" className="mt-6 inline-flex h-11 items-center rounded-lg bg-teal-700 px-5 text-sm font-semibold text-white hover:bg-teal-800">
          В каталог
        </Link>
      </div>
    );
  }

  return (
    <form action={action} className="grid gap-4 rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
      <input type="hidden" name="cartItems" value={cartJson} />
      <div className="rounded-md bg-emerald-50 p-4 text-sm leading-6 text-emerald-900">
        После отправки заявки менеджер свяжется с вами, подтвердит наличие у поставщика, доставку под заказ 7 дней и итоговую стоимость.
        Оплата после подтверждения заказа.
      </div>
      <label className="grid gap-2 text-sm font-medium text-zinc-700">
        Имя
        <input name="customerName" required className="h-11 rounded-lg border border-zinc-200 px-3 text-zinc-950" />
      </label>
      <label className="grid gap-2 text-sm font-medium text-zinc-700">
        Телефон
        <input name="phone" required className="h-11 rounded-lg border border-zinc-200 px-3 text-zinc-950" />
      </label>
      <label className="grid gap-2 text-sm font-medium text-zinc-700">
        Email
        <input name="email" type="email" className="h-11 rounded-lg border border-zinc-200 px-3 text-zinc-950" />
      </label>
      <label className="grid gap-2 text-sm font-medium text-zinc-700">
        Комментарий
        <textarea name="comment" rows={4} className="rounded-lg border border-zinc-200 px-3 py-2 text-zinc-950" />
      </label>
      <label className="flex gap-3 rounded-md bg-stone-50 p-3 text-sm text-zinc-700">
        <input name="personalDataConsent" required type="checkbox" className="mt-1 size-4 shrink-0 accent-teal-700" />
        <span>
          Я согласен на обработку персональных данных для оформления заказа и связи со мной.{" "}
          <Link href="/privacy" className="font-semibold text-teal-800 hover:text-teal-950" target="_blank">
            Политика обработки персональных данных
          </Link>
        </span>
      </label>
      {state.error ? <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">{state.error}</p> : null}
      <button disabled={pending} className="h-12 rounded-lg bg-teal-700 text-sm font-bold text-white hover:bg-teal-800 disabled:bg-zinc-300">
        {pending ? "Отправляем заявку..." : "Отправить заявку"}
      </button>
    </form>
  );
}
