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
import { computeB2BPrice, getRolePricingConfig } from "@/lib/role-pricing";
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
  const pricing = getRolePricingConfig();
  const fullName = product.name ?? product.supplierName;
  // Iter 23.1: many products have a generic `name` ("Морозилка встраиваемая")
  // with the model number sitting only in `product.part`. Stitch the model into
  // the displayed title so users see what they're actually looking at.
  const baseName = fullName?.trim() ?? "";
  const partTrim = product.part?.trim() ?? "";
  const partInName = partTrim.length > 0 && baseName.toLowerCase().includes(partTrim.toLowerCase());
  const enrichedName = partTrim && !partInName ? `${baseName} ${partTrim}`.trim() : baseName;
  const name = productShortTitle(enrichedName, product.vendor, product.part, 120);
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
  // gov buys via КП — don't let gov add to cart at the (hidden) retail price
  const canBuy = canOrder && !(role === "gov" && pricing.govEnabled);

  function handleAddToCart(event: React.MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    if (canBuy) addCartItem(product.sku, quantity);
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
          {role === "b2b" && price > 0 && (
            <div className="p-role-note p-role-b2b">
              Опт от {pricing.b2bMinQuantity} шт · {formatRub(computeB2BPrice(price, pricing.b2bDiscountPercent))}
            </div>
          )}
          {role === "gov" && pricing.govEnabled && (
            <div className="p-role-note p-role-gov">КП по 44-ФЗ / 223-ФЗ — оставьте заявку</div>
          )}
          <div className="p-price-row">
            <span className="new">
              {role === "gov"
                ? "Цена по запросу"
                : price
                ? formatRub(price)
                : "Цена уточняется"}
            </span>
            {role === "b2c" && product.rrp != null && Number(product.rrp) > price && (
              <span className="old" style={{ marginLeft: 10 }}>
                {formatRub(Number(product.rrp))}
              </span>
            )}
          </div>
        </div>
      </Link>
      <div className="p-card-actions">
        <button
          type="button"
          className="btn btn-primary p-card-buy"
          data-testid="add-to-cart"
          disabled={!canBuy}
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
