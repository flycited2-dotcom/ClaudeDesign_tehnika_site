import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const COOKIE_NAME = "store_admin_session";
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

function secret(): string {
  return process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_PASSWORD || "change-me-before-production";
}

export function createAdminToken(email: string, issuedAt = Date.now()): string {
  const payload = `${email}:${issuedAt}`;
  const signature = createHmac("sha256", secret()).update(payload).digest("hex");
  return `${payload}:${signature}`;
}

export function verifyAdminToken(token: string | undefined): boolean {
  if (!token) {
    return false;
  }

  const parts = token.split(":");
  if (parts.length !== 3) {
    return false;
  }

  const [email, issuedAtText, signature] = parts;
  if (email !== process.env.ADMIN_EMAIL) {
    return false;
  }

  const issuedAt = Number(issuedAtText);
  if (!Number.isFinite(issuedAt) || Date.now() - issuedAt > SESSION_TTL_MS) {
    return false;
  }

  const expected = createHmac("sha256", secret()).update(`${email}:${issuedAtText}`).digest("hex");
  return timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}

export async function getAdminSession(): Promise<boolean> {
  const cookieStore = await cookies();
  return verifyAdminToken(cookieStore.get(COOKIE_NAME)?.value);
}

export async function requireAdmin(): Promise<void> {
  if (!(await getAdminSession())) {
    redirect("/admin/login");
  }
}

export async function loginAdmin(email: string, password: string): Promise<boolean> {
  if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD) {
    return false;
  }

  if (email !== process.env.ADMIN_EMAIL || password !== process.env.ADMIN_PASSWORD) {
    return false;
  }

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, createAdminToken(email), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_MS / 1000,
  });

  return true;
}

export async function logoutAdmin(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}
