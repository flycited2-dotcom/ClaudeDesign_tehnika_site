"use client";

import type { Product, ProductAttribute, ProductImage } from "@prisma/client";
import { ImageOff, ShoppingCart } from "lucide-react";
import Link from "next/link";
import { useRef, useState } from "react";
import { addCartItem } from "@/lib/cart-storage";
import { decimalToNumber } from "@/lib/catalog";
import { publicFulfillmentText } from "@/lib/fulfillment";
import { formatRub } from "@/lib/format";
import { productShortTitle } from "@/lib/product-display";
import { productImageSrc } from "@/lib/product-images";
import { computeB2BPrice, getRolePricingConfig } from "@/lib/role-pricing";
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
  const images = (product.images ?? [])
    .map((img) => productImageSrc(img))
    .filter((src): src is string => Boolean(src));
  const price = decimalToNumber(product.retailPrice);
  const fulfillment = publicFulfillmentText({
    isAvailable: product.isAvailable && Boolean(price),
  });
  const canOrder = fulfillment.canOrder && Boolean(price);
  const quantity = Math.max(product.multiplicity || 1, 1);
  const inStock = product.isAvailable && Boolean(price);
  const href = `/product/${product.slug}`;

  const role = useStorefrontRole();
  // Only retail (b2c) orders directly; b2b/gov request a price (КП) instead.
  const canBuy = canOrder && role === "b2c";
  const isQuoteOnly = role === "b2b" || (role === "gov" && pricing.govEnabled);

  // Свайп-карусель фото прямо в карточке листинга (как Ozon): грузится только
  // текущее фото, свайп листает, точки показывают количество. Свайп НЕ открывает
  // карточку (гасим клик-навигацию после свайпа).
  const [imgIndex, setImgIndex] = useState(0);
  const touchStartX = useRef(0);
  const swiped = useRef(false);
  const index = images.length ? Math.min(imgIndex, images.length - 1) : 0;

  function onTouchStart(event: React.TouchEvent) {
    touchStartX.current = event.touches[0]?.clientX ?? 0;
    swiped.current = false;
  }
  function onTouchMove(event: React.TouchEvent) {
    const x = event.touches[0]?.clientX ?? touchStartX.current;
    if (Math.abs(x - touchStartX.current) > 8) swiped.current = true;
  }
  function onTouchEnd(event: React.TouchEvent) {
    if (images.length < 2) return;
    const dx = (event.changedTouches[0]?.clientX ?? touchStartX.current) - touchStartX.current;
    if (dx <= -40) setImgIndex(Math.min(index + 1, images.length - 1));
    else if (dx >= 40) setImgIndex(Math.max(index - 1, 0));
  }
  function onArtClick(event: React.MouseEvent) {
    if (swiped.current) {
      event.preventDefault();
      event.stopPropagation();
      swiped.current = false;
    }
  }

  function handleAddToCart(event: React.MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    if (canBuy) addCartItem(product.sku, quantity);
  }

  return (
    <article className="p-card">
      <Link href={href} className="p-card-link" aria-label={fullName}>
        <div
          className="p-art"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          onClick={onArtClick}
        >
          <div className="p-art-img">
            {images.length ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={images[index]} alt={fullName} loading="lazy" />
            ) : (
              <div className="p-art-placeholder">
                <ImageOff size={28} aria-hidden />
                Фото уточняется
              </div>
            )}
          </div>
          {images.length > 1 && (
            <div className="p-art-dots" aria-hidden>
              {images.map((src, i) => (
                <span key={`${src}-${i}`} className={"p-art-dot" + (i === index ? " on" : "")} />
              ))}
            </div>
          )}
        </div>
        <div className="p-body">
          <div className="p-meta">{product.vendor ?? "Товар"}</div>
          <div className="p-name" title={fullName}>
            {name}
          </div>
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
              <>
                <span className="old" style={{ marginLeft: 10 }}>
                  {formatRub(Number(product.rrp))}
                </span>
                <span className="p-disc">−{Math.round((1 - price / Number(product.rrp)) * 100)}%</span>
              </>
            )}
          </div>
        </div>
      </Link>
      <div className="p-card-actions">
        {isQuoteOnly ? (
          <Link href={href} className="btn btn-primary p-card-buy">
            {role === "gov" ? "Запросить КП" : "Запросить опт-цену"}
          </Link>
        ) : (
          <button
            type="button"
            className="btn btn-primary p-card-buy"
            data-testid="add-to-cart"
            disabled={!canBuy}
            onClick={handleAddToCart}
            aria-label="В корзину"
          >
            <ShoppingCart size={15} aria-hidden />
            Купить
          </button>
        )}
      </div>
    </article>
  );
}
