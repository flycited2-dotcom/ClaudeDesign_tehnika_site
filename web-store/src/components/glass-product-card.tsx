"use client";

import type { Product, ProductAttribute, ProductImage } from "@prisma/client";
import { ShoppingCart } from "lucide-react";
import Link from "next/link";
import { addCartItem } from "@/lib/cart-storage";
import { decimalToNumber } from "@/lib/catalog";
import { publicFulfillmentText } from "@/lib/fulfillment";
import { formatRub } from "@/lib/format";
import { buildProductCardHighlights } from "@/lib/product-display";
import { productImageSrc } from "@/lib/product-images";

type GlassProductCardProduct = Product & {
  images?: ProductImage[];
  attributes?: ProductAttribute[];
};

export function GlassProductCard({ product }: { product: GlassProductCardProduct }) {
  const name = product.name ?? product.supplierName;
  const image = productImageSrc(product.images?.[0]);
  const price = decimalToNumber(product.retailPrice);
  const fulfillment = publicFulfillmentText({
    isAvailable: product.isAvailable && Boolean(price),
  });
  const canOrder = fulfillment.canOrder && Boolean(price);
  const quantity = Math.max(product.multiplicity || 1, 1);
  const highlights = buildProductCardHighlights({
    title: name,
    part: product.part,
    warranty: product.warranty,
    weight: product.weight,
    volume: product.volume,
    multiplicity: product.multiplicity,
    attributes: product.attributes,
  }).slice(0, 3);
  const inStock = product.isAvailable && Boolean(price);

  return (
    <article className="p-card">
      <Link href={`/product/${product.slug}`} className="p-art" aria-label={name}>
        <div className="p-art-img">
          {image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={image} alt={name} loading="lazy" />
          ) : (
            <div
              style={{
                width: "100%",
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--text-soft)",
                fontSize: 13,
              }}
            >
              Фото уточняется
            </div>
          )}
        </div>
      </Link>
      <div className="p-body">
        <div className="p-meta">{product.vendor ?? "Товар"}</div>
        <Link href={`/product/${product.slug}`} className="p-name">
          {name}
        </Link>
        {highlights.length > 0 && (
          <div className="p-specs">
            {highlights.map((spec) => (
              <span key={spec} className="p-spec">
                {spec}
              </span>
            ))}
          </div>
        )}
        <div className={"p-stock " + (inStock ? "" : "low")}>
          <span className="dot" />
          {fulfillment.stockShortLabel}
        </div>
        <div className="p-foot">
          <div className="p-price">
            <span className="new">{price ? formatRub(price) : "Цена уточняется"}</span>
          </div>
          <button
            type="button"
            className="add"
            disabled={!canOrder}
            onClick={() => {
              if (canOrder) addCartItem(product.sku, quantity);
            }}
            aria-label="В корзину"
          >
            <ShoppingCart size={18} aria-hidden />
          </button>
        </div>
      </div>
    </article>
  );
}
