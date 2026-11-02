"use client";

import { ChevronRight, Folder } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ruPlural, type CatalogMenuItem } from "@/lib/catalog-menu";

type MenuCategory = CatalogMenuItem;

type Props = {
  /** Parent category id. `null` or `undefined` = root (top-level categories). */
  parentId?: string | null;
};

// Module-level cache survives unmount/remount of the hub between navigations,
// so drilling up/down stays instant within a session.
const HUB_CACHE = new Map<string, MenuCategory[]>();
const HUB_REQUESTS = new Map<string, Promise<MenuCategory[]>>();

function cacheKey(parentId?: string | null): string {
  return parentId ?? "root";
}

export function MobileCatalogHub({ parentId }: Props) {
  const key = cacheKey(parentId);
  // Read cache during render so a warm cache renders synchronously on mount,
  // avoiding a flash of skeleton.
  const initial = HUB_CACHE.get(key);
  const [items, setItems] = useState<MenuCategory[] | "loading" | undefined>(
    Array.isArray(initial) ? initial : undefined,
  );

  useEffect(() => {
    const cached = HUB_CACHE.get(key);
    if (Array.isArray(cached)) {
      // Already fetched (key changed mid-life or another mount filled it).
      // Defer setState past the effect — Next 16 `react-hooks/set-state-in-effect`.
      const t = window.setTimeout(() => setItems(cached), 0);
      return () => window.clearTimeout(t);
    }

    const url = key === "root"
      ? "/api/catalog/menu"
      : `/api/catalog/menu?parent=${encodeURIComponent(key)}`;
    let request = HUB_REQUESTS.get(key);
    if (!request) {
      request = fetch(url)
        .then((response) => {
          if (!response.ok) throw new Error("Category images unavailable");
          return response.json();
        })
        .then((data: { categories?: MenuCategory[] }) => {
          const next = data.categories ?? [];
          HUB_CACHE.set(key, next);
          return next;
        })
        .finally(() => HUB_REQUESTS.delete(key));
      HUB_REQUESTS.set(key, request);
    }
    // A shared request can finish after navigation or Strict Mode remounting.
    // Keep its cache result; only the current subscriber updates its state.
    let active = true;
    request.then((next) => { if (active) setItems(next); })
      .catch(() => { if (active) setItems([]); });
    return () => { active = false; };
  }, [key]);

  if (items === undefined || items === "loading") {
    return (
      <div className="cat-hub" aria-busy>
        <div className="cat-hub-skel" />
        <div className="cat-hub-skel" />
        <div className="cat-hub-skel" />
        <div className="cat-hub-skel" />
      </div>
    );
  }

  if (items.length === 0) {
    // No children to drill into — parent falls back to the product list below.
    return null;
  }

  return (
    <nav className="cat-hub" aria-label="Категории каталога">
      {items.map((item) => (
        <Link key={item.id} href={`/catalog/${item.slug}`} className="cat-hub-tile">
          <span className="cat-hub-ic" aria-hidden>
            {item.image?.startsWith("/static/category-cards/") ? (
              <Image src={item.image} alt="" fill sizes="(max-width: 760px) 64px, 220px" />
            ) : (
              <Folder size={20} strokeWidth={1.75} />
            )}
          </span>
          <span className="cat-hub-body">
            <span className="cat-hub-name">{item.name}</span>
            {item.productCount > 0 && (
              <span className="cat-hub-meta">
                {item.productCount.toLocaleString("ru-RU")} {ruPlural(item.productCount, "товар", "товара", "товаров")}
              </span>
            )}
          </span>
          <ChevronRight size={18} aria-hidden className="cat-hub-chev" />
        </Link>
      ))}
    </nav>
  );
}
