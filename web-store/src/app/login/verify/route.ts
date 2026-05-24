import { NextResponse, type NextRequest } from "next/server";
import {
  consumeMagicLinkToken,
  createSession,
  findOrCreateUser,
  publicBaseUrl,
  roleToStorefront,
  setSessionCookie,
} from "@/lib/auth";

const ROLE_HOME: Record<"b2c" | "b2b" | "gov", string> = {
  b2c: "/account",
  b2b: "/b2b",
  gov: "/gov",
};

function failureRedirect(request: NextRequest, reason: string) {
  const url = new URL("/login", publicBaseUrl(request.headers));
  url.searchParams.set("error", reason);
  return NextResponse.redirect(url);
}

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");
  const next = request.nextUrl.searchParams.get("next");

  if (!token) return failureRedirect(request, "missing_token");

  const consume = await consumeMagicLinkToken(token);
  if (!consume.ok) return failureRedirect(request, consume.reason);

  const user = await findOrCreateUser(consume.email);
  const session = await createSession(user.id, {
    userAgent: request.headers.get("user-agent"),
    ip: request.headers.get("x-forwarded-for") ?? null,
  });
  await setSessionCookie(session.token, session.expiresAt);

  const target =
    typeof next === "string" && next.startsWith("/")
      ? next
      : ROLE_HOME[roleToStorefront(user.role)];

  return NextResponse.redirect(new URL(target, publicBaseUrl(request.headers)));
}
