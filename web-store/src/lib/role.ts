import { cookies } from "next/headers";
import { getCurrentUser, roleToStorefront } from "@/lib/auth";

export type StorefrontRole = "b2c" | "b2b" | "gov";

export const ROLE_PREVIEW_COOKIE = "techno_market_role_preview";
const DEFAULT_ROLE: StorefrontRole = "b2c";

function parseRole(value: string | undefined | null): StorefrontRole | null {
  if (value === "b2c" || value === "b2b" || value === "gov") return value;
  return null;
}

export async function getActiveRole(): Promise<StorefrontRole> {
  const user = await getCurrentUser();
  if (user) {
    return roleToStorefront(user.role);
  }
  const store = await cookies();
  const previewCookie = parseRole(store.get(ROLE_PREVIEW_COOKIE)?.value);
  return previewCookie ?? DEFAULT_ROLE;
}

export async function getRoleContext(): Promise<{
  role: StorefrontRole;
  isAuthenticated: boolean;
  userName: string | null;
  orgName: string | null;
  email: string | null;
}> {
  try {
    const user = await getCurrentUser();
    if (user) {
      return {
        role: roleToStorefront(user.role),
        isAuthenticated: true,
        userName: user.name,
        orgName: user.orgName,
        email: user.email,
      };
    }
    const store = await cookies();
    const previewCookie = parseRole(store.get(ROLE_PREVIEW_COOKIE)?.value);
    return {
      role: previewCookie ?? DEFAULT_ROLE,
      isAuthenticated: false,
      userName: null,
      orgName: null,
      email: null,
    };
  } catch {
    // A DB blip must not white-screen the whole site via the root layout.
    return { role: DEFAULT_ROLE, isAuthenticated: false, userName: null, orgName: null, email: null };
  }
}
