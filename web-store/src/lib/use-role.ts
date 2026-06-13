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

export const ROLE_LABELS: Record<StorefrontRole, string> = {
  b2c: "Розница",
  b2b: "Опт",
  gov: "Госзакупки",
};
