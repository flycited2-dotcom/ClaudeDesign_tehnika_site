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
      className={"btn btn-primary" + (compact ? " btn-sm" : "")}
      style={{
        width: "100%",
        opacity: disabled ? 0.5 : 1,
        cursor: disabled ? "not-allowed" : "pointer",
      }}
    >
      <ShoppingCart size={compact ? 14 : 16} aria-hidden />
      {compact
        ? added
          ? "В корзине"
          : "Купить"
        : added
        ? "Добавлено"
        : `В корзину${quantity > 1 ? ` × ${quantity}` : ""}`}
    </button>
  );
}
