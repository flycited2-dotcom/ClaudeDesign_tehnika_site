"use client";

import { useCart } from "@/lib/use-cart";
import { useCompare, useFavorites } from "@/lib/sku-list-storage";

/**
 * Live value for the /account stat cards. The page is a server component and
 * the cart/favorites/compare live in localStorage, so the counts must come from
 * a client island (previously the cards were hard-coded "…" and never filled).
 */
export function AccountStatValue({ kind }: { kind: "cart" | "favorites" | "compare" }) {
  const cart = useCart();
  const favorites = useFavorites();
  const compare = useCompare();

  const value =
    kind === "cart"
      ? cart.reduce((sum, item) => sum + item.quantity, 0)
      : kind === "favorites"
        ? favorites.length
        : compare.length;

  return <>{value.toLocaleString("ru-RU")}</>;
}
