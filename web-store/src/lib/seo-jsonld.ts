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
  images: string[];
  price: number;
  isAvailable: boolean;
  url: string;
};

export function absoluteStorefrontUrl(path: string): string {
  const url = new URL(path, storefront.siteUrl);
  url.search = "";
  url.hash = "";
  return url.toString();
}

function compactJsonLd<T extends object>(value: T): T {
  return JSON.parse(JSON.stringify(value, (_key, item) => (item === null || item === undefined || item === "" ? undefined : item))) as T;
}

export function buildProductJsonLd({
  name,
  description,
  sku,
  brand,
  images,
  price,
  isAvailable,
  url,
}: ProductJsonLdInput) {
  return compactJsonLd({
    "@context": "https://schema.org",
    "@type": "Product",
    name,
    description,
    sku: String(sku),
    brand: brand ? { "@type": "Brand", name: brand } : undefined,
    image: images.map((image) => absoluteStorefrontUrl(image)),
    offers: price
      ? {
          "@type": "Offer",
          url: absoluteStorefrontUrl(url),
          priceCurrency: "RUB",
          price: price.toFixed(2),
          availability: isAvailable ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
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
