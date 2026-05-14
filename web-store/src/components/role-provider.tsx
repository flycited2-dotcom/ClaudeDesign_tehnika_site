"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { StorefrontRole } from "@/lib/role";

const LOCAL_STORAGE_KEY = "techno_market_role_v1";
const PREVIEW_COOKIE = "techno_market_role_preview";
const CHANGE_EVENT = "role:changed";

type RoleContextValue = {
  role: StorefrontRole;
  isAuthenticated: boolean;
  setRole: (role: StorefrontRole) => void;
  userName: string | null;
  orgName: string | null;
  email: string | null;
};

const RoleContext = createContext<RoleContextValue | null>(null);

function writePreviewCookie(role: StorefrontRole) {
  if (typeof document === "undefined") return;
  const maxAge = 60 * 60 * 24 * 180; // 180 days
  document.cookie = `${PREVIEW_COOKIE}=${role}; Path=/; Max-Age=${maxAge}; SameSite=Lax`;
}

function isStorefrontRole(value: string | null): value is StorefrontRole {
  return value === "b2c" || value === "b2b" || value === "gov";
}

export function RoleProvider({
  initialRole,
  isAuthenticated,
  userName,
  orgName,
  email,
  children,
}: {
  initialRole: StorefrontRole;
  isAuthenticated: boolean;
  userName: string | null;
  orgName: string | null;
  email: string | null;
  children: React.ReactNode;
}) {
  const [role, setRoleState] = useState<StorefrontRole>(initialRole);

  // Hydrate from localStorage on the client (anonymous preview only).
  useEffect(() => {
    if (isAuthenticated) {
      // Clear stale anon preview if user logged in
      try {
        window.localStorage.removeItem(LOCAL_STORAGE_KEY);
      } catch {
        /* ignore */
      }
      setRoleState(initialRole);
      return;
    }
    try {
      const raw = window.localStorage.getItem(LOCAL_STORAGE_KEY);
      if (isStorefrontRole(raw) && raw !== initialRole) {
        setRoleState(raw);
        writePreviewCookie(raw);
      }
    } catch {
      /* ignore */
    }
  }, [initialRole, isAuthenticated]);

  // Cross-tab sync for anon preview.
  useEffect(() => {
    if (isAuthenticated) return;
    const onChange = () => {
      try {
        const raw = window.localStorage.getItem(LOCAL_STORAGE_KEY);
        if (isStorefrontRole(raw)) setRoleState(raw);
      } catch {
        /* ignore */
      }
    };
    window.addEventListener("storage", onChange);
    window.addEventListener(CHANGE_EVENT, onChange);
    return () => {
      window.removeEventListener("storage", onChange);
      window.removeEventListener(CHANGE_EVENT, onChange);
    };
  }, [isAuthenticated]);

  const setRole = useCallback(
    (next: StorefrontRole) => {
      if (isAuthenticated) {
        // Logged-in users cannot change role from UI; this is a no-op.
        return;
      }
      try {
        window.localStorage.setItem(LOCAL_STORAGE_KEY, next);
      } catch {
        /* ignore */
      }
      writePreviewCookie(next);
      setRoleState(next);
      window.dispatchEvent(new Event(CHANGE_EVENT));
    },
    [isAuthenticated],
  );

  const value = useMemo<RoleContextValue>(
    () => ({ role, isAuthenticated, setRole, userName, orgName, email }),
    [role, isAuthenticated, setRole, userName, orgName, email],
  );

  return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>;
}

export function useRoleContext(): RoleContextValue {
  const value = useContext(RoleContext);
  if (!value) {
    throw new Error("useRoleContext must be used within RoleProvider");
  }
  return value;
}
