"use client";

import { usePathname } from "next/navigation";

/**
 * Hides storefront chrome (header / footer / bottom screen-bar) on /admin routes
 * so the admin panel renders without the customer-facing shell. Server children
 * (e.g. SiteFooter) can still be passed in — they render on the server and this
 * client gate only decides visibility from the pathname (resolved during SSR, so
 * there's no hydration flash).
 */
export function ChromeGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname?.startsWith("/admin")) return null;
  return <>{children}</>;
}
