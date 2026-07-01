import { storefront } from "@/lib/storefront";

export type BreadcrumbJsonLdItem = {
  name: string;
  url: string;
};

export type ProductJsonLdInput = {
  name: string;
  description: string;
  sku: number;
  brand?: string | null;
  mpn?: string | null;
  images: string[];
  price: number;
  isAvailable: boolean;
  stockStatus?: string | null;
  url: string;
};

// schema.org has a dedicated ItemAvailability for "some stock, but running low"
// — more accurate than collapsing everything down to the isAvailable boolean
// when we have the supplier feed's actual quantity code.
function schemaAvailability(isAvailable: boolean, stockStatus?: string | null): string {
  if (stockStatus === "low") return "https://schema.org/LimitedAvailability";
  if (stockStatus === "available" || stockStatus === "plenty") return "https://schema.org/InStock";
  // No physical stock right now — still "BackOrder" (not a flat OutOfStock) if
  // the storefront can still take the order for delivery "под заказ 7 дней".
  if (stockStatus === "out") return isAvailable ? "https://schema.org/BackOrder" : "https://schema.org/OutOfStock";
  return isAvailable ? "https://schema.org/InStock" : "https://schema.org/OutOfStock";
}

export function absoluteStorefrontUrl(path: string): string {
  const url = new URL(path, storefront.siteUrl);
  url.search = "";
  url.hash = "";
  return url.toString();
}

/**
 * Serialize JSON-LD for inline injection into a <script> tag. JSON.stringify
 * leaves `<` untouched, so a literal `</script>` (or the U+2028/U+2029 line
 * separators) inside untrusted supplier data — product name/description come
 * straight from the feed — would break out of the script element. Escape those
 * to their unicode form, which is still valid JSON-LD.
 */
export function jsonLdHtml(value: object): string {
  return JSON.stringify(value).replace(/[<\u2028\u2029]/g, (char) => {
    const code = char.charCodeAt(0);
    if (code === 0x3c) return "\\u003c";
    if (code === 0x2028) return "\\u2028";
    return "\\u2029";
  });
}

function compactJsonLd<T extends object>(value: T): T {
  return JSON.parse(JSON.stringify(value, (_key, item) => (item === null || item === undefined || item === "" ? undefined : item))) as T;
}

export function buildProductJsonLd({
  name,
  description,
  sku,
  brand,
  mpn,
  images,
  price,
  isAvailable,
  stockStatus,
  url,
}: ProductJsonLdInput) {
  return compactJsonLd({
    "@context": "https://schema.org",
    "@type": "Product",
    name,
    description,
    sku: String(sku),
    mpn: mpn ?? undefined,
    brand: brand ? { "@type": "Brand", name: brand } : undefined,
    image: images.map((image) => absoluteStorefrontUrl(image)),
    offers: price
      ? {
          "@type": "Offer",
          url: absoluteStorefrontUrl(url),
          priceCurrency: "RUB",
          price: price.toFixed(2),
          availability: schemaAvailability(isAvailable, stockStatus),
          itemCondition: "https://schema.org/NewCondition",
          seller: {
            "@type": "Organization",
            name: storefront.brand,
          },
        }
      : undefined,
  });
}

export function buildBreadcrumbJsonLd(items: BreadcrumbJsonLdItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteStorefrontUrl(item.url),
    })),
  };
}
