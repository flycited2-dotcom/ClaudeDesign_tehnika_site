import { randomBytes } from "crypto";
import { cookies } from "next/headers";
import { cache } from "react";
import type { StorefrontRole as PrismaStorefrontRole, User } from "@prisma/client";
import { prisma } from "@/lib/db";

export const USER_SESSION_COOKIE = "techno_market_session";
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const MAGIC_LINK_TTL_MS = 15 * 60 * 1000;

function generateToken(): string {
  return randomBytes(32).toString("hex");
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function findOrCreateUser(email: string): Promise<User> {
  const normalized = normalizeEmail(email);
  return prisma.user.upsert({
    where: { email: normalized },
    update: {},
    create: { email: normalized },
  });
}

export async function createMagicLinkToken(email: string): Promise<{ token: string; expiresAt: Date }> {
  const normalized = normalizeEmail(email);
  const token = generateToken();
  const expiresAt = new Date(Date.now() + MAGIC_LINK_TTL_MS);
  await prisma.magicLinkToken.create({
    data: { email: normalized, token, expiresAt },
  });
  return { token, expiresAt };
}

export type MagicLinkConsumeResult =
  | { ok: true; email: string }
  | { ok: false; reason: "not_found" | "expired" | "already_used" };

export async function consumeMagicLinkToken(token: string): Promise<MagicLinkConsumeResult> {
  const record = await prisma.magicLinkToken.findUnique({ where: { token } });
  if (!record) return { ok: false, reason: "not_found" };
  if (record.consumedAt) return { ok: false, reason: "already_used" };
  if (record.expiresAt.getTime() < Date.now()) return { ok: false, reason: "expired" };

  await prisma.magicLinkToken.update({
    where: { token },
    data: { consumedAt: new Date() },
  });
  return { ok: true, email: record.email };
}

export async function createSession(
  userId: string,
  meta?: { userAgent?: string | null; ip?: string | null },
): Promise<{ token: string; expiresAt: Date }> {
  const token = generateToken();
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  await prisma.session.create({
    data: {
      userId,
      token,
      expiresAt,
      userAgent: meta?.userAgent ?? null,
      ip: meta?.ip ?? null,
    },
  });
  return { token, expiresAt };
}

export async function destroySessionByToken(token: string): Promise<void> {
  await prisma.session.deleteMany({ where: { token } });
}

export async function setSessionCookie(token: string, expiresAt: Date): Promise<void> {
  const store = await cookies();
  store.set(USER_SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const store = await cookies();
  store.delete(USER_SESSION_COOKIE);
}

async function readUserFromSessionToken(token: string | undefined): Promise<User | null> {
  if (!token) return null;
  const session = await prisma.session.findUnique({
    where: { token },
    include: { user: true },
  });
  if (!session) return null;
  if (session.expiresAt.getTime() < Date.now()) {
    await prisma.session.deleteMany({ where: { token } });
    return null;
  }
  return session.user;
}

export const getCurrentUser = cache(async (): Promise<User | null> => {
  const store = await cookies();
  const token = store.get(USER_SESSION_COOKIE)?.value;
  return readUserFromSessionToken(token);
});

export function roleToStorefront(role: PrismaStorefrontRole): "b2c" | "b2b" | "gov" {
  switch (role) {
    case "B2B":
      return "b2b";
    case "GOV":
      return "gov";
    default:
      return "b2c";
  }
}

export function storefrontToRole(role: "b2c" | "b2b" | "gov"): PrismaStorefrontRole {
  switch (role) {
    case "b2b":
      return "B2B";
    case "gov":
      return "GOV";
    default:
      return "B2C";
  }
}
