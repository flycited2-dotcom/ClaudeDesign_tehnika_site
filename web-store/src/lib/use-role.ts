"use client";

import { useRoleContext } from "@/components/role-provider";

export type StorefrontRole = "b2c" | "b2b" | "gov";

export function useStorefrontRole(): StorefrontRole {
  return useRoleContext().role;
}

export function useStorefrontRoleSetter() {
  const { setRole, isAuthenticated } = useRoleContext();
  return { setRole, isAuthenticated };
}

export function useStorefrontIdentity(): {
  isAuthenticated: boolean;
  userName: string | null;
  orgName: string | null;
  email: string | null;
} {
  const ctx = useRoleContext();
  return {
    isAuthenticated: ctx.isAuthenticated,
    userName: ctx.userName,
    orgName: ctx.orgName,
    email: ctx.email,
  };
}

/**
 * Imperative setter retained for back-compat with existing call sites.
 * For logged-in users this is a no-op; the source of truth is user.role in DB.
 * Prefer useStorefrontRoleSetter() in new code.
 */
export function setStorefrontRole(_role: StorefrontRole) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem("techno_market_role_v1", _role);
    document.cookie = `techno_market_role_preview=${_role}; Path=/; Max-Age=${60 * 60 * 24 * 180}; SameSite=Lax`;
    window.dispatchEvent(new Event("role:changed"));
  } catch {
    /* ignore */
  }
}

export const ROLE_LABELS: Record<StorefrontRole, string> = {
  b2c: "Розница",
  b2b: "Опт",
  gov: "Госзакупки",
};
