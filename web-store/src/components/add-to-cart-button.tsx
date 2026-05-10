"use client";

import { ShoppingCart } from "lucide-react";
import { useState } from "react";
import { addCartItem } from "@/lib/cart-storage";

export function AddToCartButton({
  sku,
  multiplicity,
  disabled,
  compact = false,
}: {
  sku: number;
  multiplicity: number;
  disabled?: boolean;
  compact?: boolean;
}) {
  const [added, setAdded] = useState(false);
  const quantity = Math.max(multiplicity || 1, 1);

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => {
        addCartItem(sku, quantity);
        setAdded(true);
        window.setTimeout(() => setAdded(false), 1600);
      }}
      className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-teal-700 px-4 text-sm font-semibold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:bg-zinc-300 disabled:text-zinc-500"
    >
      <ShoppingCart className="size-4" aria-hidden />
      {compact ? (added ? "В корзине" : "Купить") : added ? "Добавлено" : `В корзину${quantity > 1 ? ` x${quantity}` : ""}`}
    </button>
  );
}
