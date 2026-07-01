"use client";

import type { Product, ProductAttribute, ProductImage } from "@prisma/client";
import { useEffect, useState } from "react";
import { GlassProductCard } from "@/components/glass-product-card";
import { useRecentlyViewed } from "@/lib/sku-list-storage";

type ProductWithMedia = Product & {
  images?: ProductImage[];
  attributes?: ProductAttribute[];
};

/** "Вы недавно смотрели" — renders nothing until there's real history (client-only, localStorage). */
export function RecentlyViewedStrip({ excludeSku }: { excludeSku?: number }) {
  const recent = useRecentlyViewed().filter((sku) => sku !== excludeSku);
  const [products, setProducts] = useState<ProductWithMedia[]>([]);
  const skuKey = recent.slice(0, 8).join(",");

  useEffect(() => {
    if (!skuKey) {
      const timer = window.setTimeout(() => setProducts([]), 0);
      return () => window.clearTimeout(timer);
    }
    const controller = new AbortController();
    fetch(`/api/catalog/products-by-sku?sku=${encodeURIComponent(skuKey)}`, { signal: controller.signal })
      .then((response) => (response.ok ? response.json() : Promise.reject(response)))
      .then((data: { products?: ProductWithMedia[] }) => {
        // Keep the "most recently viewed first" order — the API doesn't
        // guarantee it back in the SKU list's order.
        const bySku = new Map((data.products ?? []).map((product) => [product.sku, product]));
        setProducts(skuKey.split(",").map((sku) => bySku.get(Number(sku))).filter((p): p is ProductWithMedia => Boolean(p)));
      })
      .catch((error) => {
        if (error?.name === "AbortError") return;
        console.error(error);
      });

    return () => controller.abort();
  }, [skuKey]);

  if (products.length === 0) return null;

  return (
    <>
      <div className="section-head">
        <div>
          <h2>Вы недавно смотрели</h2>
        </div>
      </div>
      <div className="product-grid">
        {products.map((product) => (
          <GlassProductCard key={product.id} product={product} />
        ))}
      </div>
    </>
  );
}
