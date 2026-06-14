import { NextResponse, type NextRequest } from "next/server";
import { USER_SESSION_COOKIE } from "@/lib/auth";

const PROTECTED_PREFIXES = ["/account"];
// Mirrors admin-auth.ts COOKIE_NAME. Inlined because middleware runs in the Edge
// runtime and admin-auth pulls in node:crypto. This is only a coarse presence
// gate — full HMAC authorization stays in requireAdmin() per page/action.
const ADMIN_SESSION_COOKIE = "store_admin_session";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Behind nginx request.url resolves to the internal http://localhost:3001, so a
  // redirect built from it sends the browser to localhost. Build from the
  // forwarded Host + proto instead (nginx sets both). Can't reuse lib/auth's
  // publicBaseUrl here — middleware runs in the Edge runtime and that module
  // pulls in Prisma.
  const host = request.headers.get("host");
  const proto = request.headers.get("x-forwarded-proto") ?? "https";
  const base = host ? `${proto}://${host}` : request.nextUrl.origin;

  // Admin edge gate: every /admin route except the login page needs the admin
  // session cookie, so a new admin page can't be left publicly reachable.
  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    if (request.cookies.get(ADMIN_SESSION_COOKIE)?.value) {
      return NextResponse.next();
    }
    return NextResponse.redirect(new URL("/admin/login", base));
  }

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

  const loginUrl = new URL("/login", base);
  loginUrl.searchParams.set("next", pathname + request.nextUrl.search);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/account/:path*", "/admin", "/admin/:path*"],
};
