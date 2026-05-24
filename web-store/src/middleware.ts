import { NextResponse, type NextRequest } from "next/server";
import { USER_SESSION_COOKIE } from "@/lib/auth";

const PROTECTED_PREFIXES = ["/account"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
  if (!isProtected) {
    return NextResponse.next();
  }

  const token = request.cookies.get(USER_SESSION_COOKIE)?.value;
  if (token) {
    return NextResponse.next();
  }

  // Behind nginx request.url resolves to the internal http://localhost:3001,
  // so a redirect built from it sends the browser to localhost. Build from the
  // forwarded Host + proto instead (nginx sets both). Can't reuse lib/auth's
  // publicBaseUrl here — middleware runs in the Edge runtime and that module
  // pulls in Prisma.
  const host = request.headers.get("host");
  const proto = request.headers.get("x-forwarded-proto") ?? "https";
  const base = host ? `${proto}://${host}` : request.nextUrl.origin;
  const loginUrl = new URL("/login", base);
  loginUrl.searchParams.set("next", pathname + request.nextUrl.search);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/account/:path*"],
};
