"use client";

import Link from "next/link";
import { useActionState } from "react";
import { createQuickOrder, type QuickOrderState } from "@/app/product/[slug]/quick-order-actions";

const initialState: QuickOrderState = {};

export function QuickOrderForm({
  sku,
  quantity,
  sourceUrl,
  disabled,
  compact = false,
}: {
  sku: number;
  quantity: number;
  sourceUrl: string;
  disabled?: boolean;
  compact?: boolean;
}) {
  const [state, action, pending] = useActionState(createQuickOrder, initialState);

  return (
    <form action={action} className={compact ? "grid gap-2" : "mt-5 grid gap-3 rounded-lg border border-zinc-200 bg-white p-4"}>
      <input type="hidden" name="sku" value={sku} />
      <input type="hidden" name="quantity" value={quantity} />
      <input type="hidden" name="sourceUrl" value={sourceUrl} />
      {!compact ? (
        <div>
          <p className="text-sm font-bold text-zinc-950">Быстрый заказ</p>
          <p className="mt-1 text-xs leading-5 text-zinc-500">Оставьте телефон, менеджер подтвердит наличие, цену и доставку 7 дней.</p>
        </div>
      ) : null}
      <div className={compact ? "grid gap-2 sm:grid-cols-2" : "grid gap-2"}>
        <input
          name="customerName"
          required
          placeholder="Имя"
          className="h-10 rounded-lg border border-zinc-200 px-3 text-sm text-zinc-950"
        />
        <input
          name="phone"
          required
          placeholder="Телефон"
          className="h-10 rounded-lg border border-zinc-200 px-3 text-sm text-zinc-950"
        />
      </div>
      {!compact ? (
        <textarea name="comment" rows={2} placeholder="Комментарий" className="rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-950" />
      ) : null}
      <label className="flex gap-2 text-xs leading-5 text-zinc-600">
        <input name="personalDataConsent" required type="checkbox" className="mt-1 size-4 shrink-0 accent-teal-700" />
        <span>
          Согласен на обработку данных.{" "}
          <Link href="/privacy" target="_blank" className="font-semibold text-teal-800">
            Политика
          </Link>
        </span>
      </label>
      {state.error ? <p className="rounded-md bg-red-50 p-2 text-xs text-red-700">{state.error}</p> : null}
      <button
        disabled={disabled || pending}
        className="h-10 rounded-lg bg-zinc-950 px-4 text-sm font-semibold text-white hover:bg-teal-800 disabled:cursor-not-allowed disabled:bg-zinc-300 disabled:text-zinc-500"
      >
        {pending ? "Отправляем..." : "Быстрый заказ"}
      </button>
    </form>
  );
}
