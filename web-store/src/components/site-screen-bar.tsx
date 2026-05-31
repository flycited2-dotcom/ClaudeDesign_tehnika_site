"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  LayoutGrid,
  GitCompare,
  ShoppingCart,
  User,
  type LucideIcon,
} from "lucide-react";

type Item = { id: string; label: string; href: string; icon?: LucideIcon; primary?: boolean };
type Entry = Item | "sep";

// `primary` items (with an icon) form the mobile bottom-nav (≤760px); the rest
// stay in the desktop pill and are reachable on mobile via the header burger-drawer.
const ITEMS: Entry[] = [
  { id: "home", label: "Главная", href: "/", icon: Home, primary: true },
  { id: "catalog", label: "Каталог", href: "/catalog", icon: LayoutGrid, primary: true },
  { id: "compare", label: "Сравнение", href: "/compare", icon: GitCompare, primary: true },
  { id: "cart", label: "Корзина", href: "/cart", icon: ShoppingCart, primary: true },
  { id: "checkout", label: "Оформление", href: "/checkout" },
  "sep",
  { id: "account", label: "Кабинет", href: "/account", icon: User, primary: true },
  { id: "b2b", label: "B2B", href: "/b2b" },
  { id: "gov", label: "Госзакупки", href: "/gov" },
  { id: "service", label: "Сервис", href: "/service" },
  "sep",
  { id: "bot", label: "Telegram-агент", href: "/bot" },
];

function isActive(id: string, pathname: string): boolean {
  switch (id) {
    case "home":
      return pathname === "/";
    case "catalog":
      return (
        pathname === "/catalog" ||
        pathname.startsWith("/catalog/") ||
        pathname.startsWith("/product/")
      );
    case "account":
      return pathname === "/account" || pathname.startsWith("/account/");
    default: {
      const item = ITEMS.find((e) => e !== "sep" && e.id === id) as Item | undefined;
      return item ? pathname === item.href : false;
    }
  }
}

export function SiteScreenBar() {
  const pathname = usePathname() ?? "/";
  return (
    <nav className="screen-bar" aria-label="Быстрая навигация">
      {ITEMS.map((entry, i) => {
        if (entry === "sep") {
          return <div key={`sep-${i}`} className="sep" aria-hidden />;
        }
        const Icon = entry.icon;
        const className = [
          isActive(entry.id, pathname) ? "active" : "",
          entry.primary ? "sb-primary" : "",
        ]
          .filter(Boolean)
          .join(" ");
        return (
          <Link key={entry.id} href={entry.href} className={className}>
            {Icon ? (
              <span className="sb-ic" aria-hidden>
                <Icon size={20} />
              </span>
            ) : null}
            {entry.label}
          </Link>
        );
      })}
    </nav>
  );
}
