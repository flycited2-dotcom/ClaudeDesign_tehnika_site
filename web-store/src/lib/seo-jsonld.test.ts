import { describe, expect, it } from "vitest";
import { absoluteStorefrontUrl, buildBreadcrumbJsonLd, buildProductJsonLd } from "@/lib/seo-jsonld";

describe("absoluteStorefrontUrl", () => {
  it("builds canonical absolute storefront URLs", () => {
    expect(absoluteStorefrontUrl("/catalog?sort=price_asc")).toBe("https://climat-simf.ru/catalog");
    expect(absoluteStorefrontUrl("/product/test-1")).toBe("https://climat-simf.ru/product/test-1");
  });
});

describe("buildProductJsonLd", () => {
  it("builds product structured data with offer and canonical URL", () => {
    expect(
      buildProductJsonLd({
        name: "Осушитель воздуха Ballu",
        description: "Осушитель воздуха для заказа.",
        sku: 11261200,
        brand: "Ballu",
        images: ["/api/product-images/1"],
        price: 19800,
        isAvailable: true,
        url: "/product/osushitel-11261200",
      }),
    ).toMatchObject({
      "@context": "https://schema.org",
      "@type": "Product",
      name: "Осушитель воздуха Ballu",
      sku: "11261200",
      brand: { "@type": "Brand", name: "Ballu" },
      image: ["https://climat-simf.ru/api/product-images/1"],
      offers: {
        "@type": "Offer",
        priceCurrency: "RUB",
        price: "19800.00",
        availability: "https://schema.org/InStock",
        url: "https://climat-simf.ru/product/osushitel-11261200",
      },
    });
  });
});

describe("buildBreadcrumbJsonLd", () => {
  it("builds breadcrumb structured data", () => {
    expect(
      buildBreadcrumbJsonLd([
        { name: "Каталог", url: "/catalog" },
        { name: "Климатическая техника", url: "/catalog/climate" },
      ]),
    ).toEqual({
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Каталог",
          item: "https://climat-simf.ru/catalog",
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "Климатическая техника",
          item: "https://climat-simf.ru/catalog/climate",
        },
      ],
    });
  });
});
