"use client";

export type StoredCartItem = {
  sku: number;
  quantity: number;
};

export const CART_STORAGE_KEY = "techno_market_cart_v1";

export function readCart(): StoredCartItem[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const parsed = JSON.parse(window.localStorage.getItem(CART_STORAGE_KEY) ?? "[]") as StoredCartItem[];
    return parsed.filter((item) => Number.isInteger(item.sku) && Number.isInteger(item.quantity) && item.quantity > 0);
  } catch {
    return [];
  }
}

export function writeCart(items: StoredCartItem[]) {
  window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  window.dispatchEvent(new Event("cart:changed"));
}

export function addCartItem(sku: number, quantity: number) {
  const cart = readCart();
  const existing = cart.find((item) => item.sku === sku);

  if (existing) {
    existing.quantity += quantity;
  } else {
    cart.push({ sku, quantity });
  }

  writeCart(cart);
}

export function clearCart() {
  writeCart([]);
}
