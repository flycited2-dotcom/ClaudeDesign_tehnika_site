"use client";

import type { Product, ProductAttribute, ProductImage } from "@prisma/client";
import { ArrowLeftRight, Heart, ShoppingCart } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { addCartItem } from "@/lib/cart-storage";
import { decimalToNumber } from "@/lib/catalog";
import { publicFulfillmentText } from "@/lib/fulfillment";
import { formatRub } from "@/lib/format";
import { buildProductCardHighlights, productShortTitle } from "@/lib/product-display";
import { productImageSrc } from "@/lib/product-images";
import {
  toggleCompare as toggleCompareStorage,
  toggleFavorite as toggleFavoriteStorage,
  useCompare,
  useFavorites,
} from "@/lib/sku-list-storage";
import { useStorefrontRole } from "@/lib/use-role";

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

  const favorites = useFavorites();
  const compare = useCompare();
  const role = useStorefrontRole();
  const isFavorite = favorites.includes(product.sku);
  const isInCompare = compare.includes(product.sku);
  const [compareError, setCompareError] = useState<string | null>(null);

  function handleAddToCart(event: React.MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    if (canOrder) addCartItem(product.sku, quantity);
  }

  function handleToggleFav(event: React.MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    toggleFavoriteStorage(product.sku);
  }

  function handleToggleCompare(event: React.MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    const result = toggleCompareStorage(product.sku);
    if (!result.ok && result.message) {
      setCompareError(result.message);
      window.setTimeout(() => setCompareError(null), 2400);
    }
  }

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
          {role === "b2b" && (
            <div className="p-role-note p-role-b2b">Опт: цена и условия по запросу</div>
          )}
          {role === "gov" && (
            <div className="p-role-note p-role-gov">КП по 44-ФЗ / 223-ФЗ — оставьте заявку</div>
          )}
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
          onClick={handleAddToCart}
          aria-label="В корзину"
        >
          <ShoppingCart size={16} aria-hidden />
          В корзину
        </button>
        <div className="p-card-secondary">
          <button
            type="button"
            className={"p-card-icon" + (isFavorite ? " on" : "")}
            onClick={handleToggleFav}
            aria-label={isFavorite ? "Убрать из избранного" : "В избранное"}
            aria-pressed={isFavorite}
            title={isFavorite ? "Убрать из избранного" : "В избранное"}
          >
            <Heart size={16} aria-hidden fill={isFavorite ? "currentColor" : "none"} />
          </button>
          <button
            type="button"
            className={"p-card-icon" + (isInCompare ? " on" : "")}
            onClick={handleToggleCompare}
            aria-label={isInCompare ? "Убрать из сравнения" : "К сравнению"}
            aria-pressed={isInCompare}
            title={isInCompare ? "Убрать из сравнения" : "К сравнению"}
          >
            <ArrowLeftRight size={16} aria-hidden />
          </button>
        </div>
      </div>
      {compareError && <div className="p-card-toast">{compareError}</div>}
    </article>
  );
}
