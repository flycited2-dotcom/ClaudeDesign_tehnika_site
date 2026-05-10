"use client";

import { useSyncExternalStore } from "react";
import { CART_STORAGE_KEY, readCart, type StoredCartItem } from "@/lib/cart-storage";

const EMPTY_CART: StoredCartItem[] = [];
let cachedRaw = "";
let cachedCart: StoredCartItem[] = EMPTY_CART;

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener("cart:changed", callback);

  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener("cart:changed", callback);
  };
}

function getSnapshot() {
  const raw = window.localStorage.getItem(CART_STORAGE_KEY) ?? "[]";

  if (raw === cachedRaw) {
    return cachedCart;
  }

  cachedRaw = raw;
  cachedCart = readCart();
  return cachedCart;
}

function getServerSnapshot() {
  return EMPTY_CART;
}

export function useCart() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
