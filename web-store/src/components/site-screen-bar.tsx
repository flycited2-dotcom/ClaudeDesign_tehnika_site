"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Item = { id: string; label: string; href: string };
type Entry = Item | "sep";

const ITEMS: Entry[] = [
  { id: "home", label: "Главная", href: "/" },
  { id: "catalog", label: "Каталог", href: "/catalog" },
  { id: "compare", label: "Сравнение", href: "/compare" },
  { id: "cart", label: "Корзина", href: "/cart" },
  { id: "checkout", label: "Оформление", href: "/checkout" },
  "sep",
  { id: "account", label: "Кабинет", href: "/account" },
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
      {ITEMS.map((entry, i) =>
        entry === "sep" ? (
          <div key={`sep-${i}`} className="sep" aria-hidden />
        ) : (
          <Link
            key={entry.id}
            href={entry.href}
            className={isActive(entry.id, pathname) ? "active" : ""}
          >
            {entry.label}
          </Link>
        ),
      )}
    </nav>
  );
}
