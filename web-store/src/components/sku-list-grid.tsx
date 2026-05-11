"use client";

import type { Product, ProductAttribute, ProductImage } from "@prisma/client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { GlassProductCard } from "@/components/glass-product-card";

type ProductWithMedia = Product & {
  images?: ProductImage[];
  attributes?: ProductAttribute[];
};

export function SkuListGrid({
  skus,
  emptyTitle,
  emptySubtitle,
  emptyCtaLabel,
  emptyCtaHref,
}: {
  skus: number[];
  emptyTitle: string;
  emptySubtitle: string;
  emptyCtaLabel: string;
  emptyCtaHref: string;
}) {
  const [products, setProducts] = useState<ProductWithMedia[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const skuKey = skus.join(",");

  useEffect(() => {
    const controller = new AbortController();
    if (skuKey.length === 0) {
      const timer = window.setTimeout(() => {
        setProducts([]);
        setError(null);
      }, 0);
      return () => {
        window.clearTimeout(timer);
        controller.abort();
      };
    }
    fetch(`/api/catalog/products-by-sku?sku=${encodeURIComponent(skuKey)}`, { signal: controller.signal })
      .then((response) => (response.ok ? response.json() : Promise.reject(response)))
      .then((data: { products?: ProductWithMedia[] }) => {
        setProducts(data.products ?? []);
        setError(null);
      })
      .catch((err) => {
        if (err?.name === "AbortError") return;
        console.error(err);
        setError("Не удалось загрузить товары. Попробуйте позже.");
      });

    return () => {
      controller.abort();
    };
  }, [skuKey]);

  if (skus.length === 0) {
    return (
      <div className="glass" style={{ padding: 48, textAlign: "center", borderRadius: 28 }}>
        <h1 style={{ fontSize: 28, fontWeight: 900, color: "var(--text)" }}>{emptyTitle}</h1>
        <p
          style={{
            marginTop: 12,
            color: "var(--text-mute)",
            maxWidth: 540,
            margin: "12px auto 0",
            lineHeight: 1.5,
          }}
        >
          {emptySubtitle}
        </p>
        <Link href={emptyCtaHref} className="btn btn-primary" style={{ marginTop: 24, display: "inline-flex" }}>
          {emptyCtaLabel}
        </Link>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass" style={{ padding: 24, borderRadius: 18, color: "var(--text-2)" }}>
        {error}
      </div>
    );
  }

  if (products === null) {
    return (
      <div className="glass" style={{ padding: 24, borderRadius: 18, color: "var(--text-mute)" }}>
        Загружаем товары…
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="glass" style={{ padding: 24, borderRadius: 18, color: "var(--text-2)" }}>
        Товары из списка больше недоступны.
      </div>
    );
  }

  return (
    <div className="product-grid">
      {products.map((product) => (
        <GlassProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
