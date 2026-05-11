"use client";

import type { Product, ProductAttribute, ProductImage } from "@prisma/client";
import { ShoppingCart } from "lucide-react";
import Link from "next/link";
import { addCartItem } from "@/lib/cart-storage";
import { decimalToNumber } from "@/lib/catalog";
import { publicFulfillmentText } from "@/lib/fulfillment";
import { formatRub } from "@/lib/format";
import { buildProductCardHighlights, productShortTitle } from "@/lib/product-display";
import { productImageSrc } from "@/lib/product-images";

type GlassProductCardProduct = Product & {
  images?: ProductImage[];
  attributes?: ProductAttribute[];
};

export function GlassProductCard({ product }: { product: GlassProductCardProduct }) {
  const fullName = product.name ?? product.supplierName;
  const name = productShortTitle(fullName, product.vendor, product.part, 100);
  const image = productImageSrc(product.images?.[0]);
  const price = decimalToNumber(product.retailPrice);
  const fulfillment = publicFulfillmentText({
    isAvailable: product.isAvailable && Boolean(price),
  });
  const canOrder = fulfillment.canOrder && Boolean(price);
  const quantity = Math.max(product.multiplicity || 1, 1);
  const highlights = buildProductCardHighlights({
    title: fullName,
    part: product.part,
    warranty: product.warranty,
    weight: product.weight,
    volume: product.volume,
    multiplicity: product.multiplicity,
    attributes: product.attributes,
  }).slice(0, 3);
  const inStock = product.isAvailable && Boolean(price);
  const href = `/product/${product.slug}`;

  return (
    <article className="p-card">
      <Link href={href} className="p-card-link" aria-label={fullName}>
        <div className="p-art">
          <div className="p-art-img">
            {image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={image} alt={fullName} loading="lazy" />
            ) : (
              <div className="p-art-placeholder">Фото уточняется</div>
            )}
          </div>
        </div>
        <div className="p-body">
          <div className="p-meta">{product.vendor ?? "Товар"}</div>
          <div className="p-name" title={fullName}>
            {name}
          </div>
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
          <div className="p-price-row">
            <span className="new">{price ? formatRub(price) : "Цена уточняется"}</span>
          </div>
        </div>
      </Link>
      <div className="p-card-actions">
        <button
          type="button"
          className="btn btn-primary p-card-buy"
          data-testid="add-to-cart"
          disabled={!canOrder}
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            if (canOrder) addCartItem(product.sku, quantity);
          }}
          aria-label="В корзину"
        >
          <ShoppingCart size={16} aria-hidden />
          В корзину
        </button>
      </div>
    </article>
  );
}
