import type { Product, ProductAttribute, ProductImage } from "@prisma/client";
import Link from "next/link";
import { AddToCartButton } from "@/components/add-to-cart-button";
import { ProductImageFallback } from "@/components/product-image-fallback";
import { QuickOrderForm } from "@/components/quick-order-form";
import { StockBadge } from "@/components/stock-badge";
import { decimalToNumber } from "@/lib/catalog";
import { publicFulfillmentText } from "@/lib/fulfillment";
import { formatRub } from "@/lib/format";
import { buildProductCardHighlights } from "@/lib/product-display";
import { productImageSrc } from "@/lib/product-images";
import { absoluteStorefrontUrl } from "@/lib/seo-jsonld";

type ProductCardProduct = Product & {
  images?: ProductImage[];
  attributes?: ProductAttribute[];
};

export function ProductCard({ product }: { product: ProductCardProduct }) {
  const name = product.name ?? product.supplierName;
  const image = productImageSrc(product.images?.[0]);
  const price = decimalToNumber(product.retailPrice);
  const fulfillment = publicFulfillmentText({ isAvailable: product.isAvailable && Boolean(price) });
  const canOrder = fulfillment.canOrder && Boolean(price);
  const minimumQuantity = Math.max(product.multiplicity || 1, 1);
  const productUrl = absoluteStorefrontUrl(`/product/${product.slug}`);
  const highlights = buildProductCardHighlights({
    title: name,
    part: product.part,
    warranty: product.warranty,
    weight: product.weight,
    volume: product.volume,
    multiplicity: product.multiplicity,
    attributes: product.attributes,
  });

  return (
    <article className="group flex min-h-[380px] flex-col rounded-lg border border-zinc-200 bg-white p-2.5 shadow-sm transition hover:-translate-y-0.5 hover:border-teal-200 hover:shadow-md sm:min-h-[420px] sm:p-3">
      <Link href={`/product/${product.slug}`} className="block">
        <div className="flex aspect-[4/3] items-center justify-center overflow-hidden rounded-md bg-zinc-100 sm:aspect-square">
          {image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={image} alt={name} className="h-full w-full object-contain" />
          ) : (
            <ProductImageFallback compact />
          )}
        </div>
      </Link>
      <div className="mt-3 flex flex-1 flex-col sm:mt-4">
        <div className="flex items-start justify-between gap-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">{product.vendor ?? "Товар"}</p>
          <StockBadge state={product.stockStatus} label={fulfillment.stockShortLabel} />
        </div>
        <Link href={`/product/${product.slug}`} className="mt-2 line-clamp-3 text-sm font-semibold leading-5 text-zinc-950 hover:text-teal-800">
          {name}
        </Link>
        <div className="mt-2 text-xs text-zinc-500 sm:mt-3">SKU {product.sku}</div>
        <div className="mt-2 rounded-md bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-800">
          {fulfillment.deliveryShortLabel}
        </div>
        {highlights.length ? (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {highlights.map((highlight) => (
              <span key={highlight} className="rounded-full bg-stone-100 px-2 py-1 text-xs font-medium text-zinc-600">
                {highlight}
              </span>
            ))}
          </div>
        ) : null}
        <div className="mt-auto pt-3 sm:pt-4">
          <div className="mb-2 text-lg font-bold text-zinc-950 sm:mb-3 sm:text-xl">{price ? formatRub(price) : "Цена уточняется"}</div>
          <div className="grid gap-2">
            <AddToCartButton sku={product.sku} multiplicity={product.multiplicity} disabled={!canOrder} compact />
            <details className="rounded-lg border border-zinc-200 bg-zinc-50 p-2">
              <summary className="cursor-pointer list-none text-center text-sm font-semibold text-zinc-800 hover:text-teal-800 [&::-webkit-details-marker]:hidden">
                Быстрый заказ
              </summary>
              <div className="mt-3">
                <QuickOrderForm sku={product.sku} quantity={minimumQuantity} sourceUrl={productUrl} disabled={!canOrder} compact />
              </div>
            </details>
          </div>
        </div>
      </div>
    </article>
  );
}
