"use client";

import { ChevronRight, Folder } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

type MenuCategory = {
  id: string;
  slug: string;
  name: string;
  productCount: number;
  hasChildren: boolean;
};

type Props = {
  /** Parent category id. `null` or `undefined` = root (top-level categories). */
  parentId?: string | null;
};

// Module-level cache survives unmount/remount of the hub between navigations,
// so drilling up/down stays instant within a session.
const HUB_CACHE = new Map<string, MenuCategory[] | "loading">();

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

    if (cached === "loading") {
      // Another mount is fetching; poll cache until it lands.
      const id = window.setInterval(() => {
        const next = HUB_CACHE.get(key);
        if (Array.isArray(next)) {
          setItems(next);
          window.clearInterval(id);
        }
      }, 80);
      return () => window.clearInterval(id);
    }

    HUB_CACHE.set(key, "loading");
    const controller = new AbortController();
    const url = key === "root"
      ? "/api/catalog/categories"
      : `/api/catalog/categories?parent=${encodeURIComponent(key)}`;
    fetch(url, { signal: controller.signal })
      .then((response) => (response.ok ? response.json() : { categories: [] }))
      .then((data: { categories?: MenuCategory[] }) => {
        const next = data.categories ?? [];
        HUB_CACHE.set(key, next);
        setItems(next);
      })
      .catch(() => {
        HUB_CACHE.delete(key); // allow retry on remount
        setItems([]);
      });
    return () => controller.abort();
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
            <Folder size={20} strokeWidth={1.75} />
          </span>
          <span className="cat-hub-body">
            <span className="cat-hub-name">{item.name}</span>
            {item.productCount > 0 && (
              <span className="cat-hub-meta">
                {item.productCount.toLocaleString("ru-RU")} товаров
              </span>
            )}
          </span>
          <ChevronRight size={18} aria-hidden className="cat-hub-chev" />
        </Link>
      ))}
    </nav>
  );
}
