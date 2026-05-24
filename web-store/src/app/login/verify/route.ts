import { NextResponse, type NextRequest } from "next/server";
import {
  consumeMagicLinkToken,
  createSession,
  findOrCreateUser,
  roleToStorefront,
  setSessionCookie,
} from "@/lib/auth";
import { storefront } from "@/lib/storefront";

const ROLE_HOME: Record<"b2c" | "b2b" | "gov", string> = {
  b2c: "/account",
  b2b: "/b2b",
  gov: "/gov",
};

// Behind nginx the app sees request.url as http://localhost:3001/... (the
// internal proxy target), so redirects built from it send the browser to
// localhost. Build from the forwarded Host + proto (nginx sets both) so the
// redirect targets the public origin instead.
function publicBaseUrl(request: NextRequest): string {
  const host = request.headers.get("host");
  const proto = request.headers.get("x-forwarded-proto") ?? "https";
  return host ? `${proto}://${host}` : storefront.siteUrl;
}

function failureRedirect(request: NextRequest, reason: string) {
  const url = new URL("/login", publicBaseUrl(request));
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

  return NextResponse.redirect(new URL(target, publicBaseUrl(request)));
}
