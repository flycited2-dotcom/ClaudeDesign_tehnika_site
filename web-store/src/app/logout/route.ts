import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { USER_SESSION_COOKIE, clearSessionCookie, destroySessionByToken } from "@/lib/auth";

async function handle(request: NextRequest) {
  const store = await cookies();
  const token = store.get(USER_SESSION_COOKIE)?.value;
  if (token) {
    await destroySessionByToken(token);
  }
  await clearSessionCookie();
  return NextResponse.redirect(new URL("/", request.url));
}

export async function GET(request: NextRequest) {
  return handle(request);
}

export async function POST(request: NextRequest) {
  return handle(request);
}
