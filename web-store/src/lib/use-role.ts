"use client";

import { useSyncExternalStore } from "react";

export type StorefrontRole = "b2c" | "b2b" | "gov";

const ROLE_KEY = "techno_market_role_v1";
const ROLE_EVENT = "role:changed";
const DEFAULT_ROLE: StorefrontRole = "b2c";

function isRole(value: string | null): value is StorefrontRole {
  return value === "b2c" || value === "b2b" || value === "gov";
}

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(ROLE_EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(ROLE_EVENT, callback);
  };
}

let cachedRaw: string | null = null;
let cachedRole: StorefrontRole = DEFAULT_ROLE;

function snapshot(): StorefrontRole {
  const raw = window.localStorage.getItem(ROLE_KEY);
  if (raw === cachedRaw) return cachedRole;
  cachedRaw = raw;
  cachedRole = isRole(raw) ? raw : DEFAULT_ROLE;
  return cachedRole;
}

function serverSnapshot(): StorefrontRole {
  return DEFAULT_ROLE;
}

export function useStorefrontRole(): StorefrontRole {
  return useSyncExternalStore(subscribe, snapshot, serverSnapshot);
}

export function setStorefrontRole(role: StorefrontRole) {
  window.localStorage.setItem(ROLE_KEY, role);
  window.dispatchEvent(new Event(ROLE_EVENT));
}

export const ROLE_LABELS: Record<StorefrontRole, string> = {
  b2c: "Розница",
  b2b: "Опт",
  gov: "Госзакупки",
};
