"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Heart,
  Home,
  GitCompare,
  ShoppingCart,
  Store,
  User,
  type LucideIcon,
} from "lucide-react";
import { useCart } from "@/lib/use-cart";
import { useFavorites, useCompare } from "@/lib/sku-list-storage";

type Item = {
  id: string;
  label: string;
  href: string;
  icon?: LucideIcon;
  primary?: boolean;
  badge?: "cart" | "favorites" | "compare";
};
type Entry = Item | "sep";

// `primary` items (with an icon) form the mobile bottom-nav (≤760px); the rest
// stay in the desktop pill and are reachable on mobile via the header burger-drawer.
// 4 primary slots (Iter 23.1): Home · Каталог · Корзина · Кабинет.
// Favorites + Compare available from header burger on mobile, desktop pill desktop-side.
const ITEMS: Entry[] = [
  { id: "home", label: "Главная", href: "/", icon: Home, primary: true },
  { id: "catalog", label: "Каталог", href: "/catalog", icon: Store, primary: true },
  { id: "favorites", label: "Избранное", href: "/favorites", icon: Heart, badge: "favorites" },
  { id: "compare", label: "Сравнение", href: "/compare", icon: GitCompare, badge: "compare" },
  { id: "cart", label: "Корзина", href: "/cart", icon: ShoppingCart, primary: true, badge: "cart" },
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
    case "favorites":
      return pathname === "/favorites" || pathname.startsWith("/favorites/");
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
  const cart = useCart();
  const favorites = useFavorites();
  const compare = useCompare();
  const counts = {
    // total item quantity, matching the header cart badge (favorites/compare are lists)
    cart: cart.reduce((sum, item) => sum + item.quantity, 0),
    favorites: favorites.length,
    compare: compare.length,
  };

  return (
    <nav className="screen-bar" aria-label="Быстрая навигация">
      {ITEMS.map((entry, i) => {
        if (entry === "sep") {
          return <div key={`sep-${i}`} className="sep" aria-hidden />;
        }
        const Icon = entry.icon;
        const active = isActive(entry.id, pathname);
        const className = [
          active ? "active" : "",
          entry.primary ? "sb-primary" : "",
        ]
          .filter(Boolean)
          .join(" ");
        const badgeCount = entry.badge ? counts[entry.badge] : 0;
        return (
          <Link
            key={entry.id}
            href={entry.href}
            className={className}
            aria-current={active ? "page" : undefined}
          >
            {Icon ? (
              <span className="sb-ic" aria-hidden>
                <Icon size={22} strokeWidth={1.75} />
                {badgeCount > 0 ? (
                  <span className="sb-badge" aria-hidden>
                    {badgeCount > 99 ? "99+" : badgeCount}
                  </span>
                ) : null}
              </span>
            ) : null}
            {entry.label}
          </Link>
        );
      })}
    </nav>
  );
}
