import { describe, expect, it } from "vitest";
import { absoluteStorefrontUrl, buildBreadcrumbJsonLd, buildProductJsonLd, jsonLdHtml } from "@/lib/seo-jsonld";

describe("jsonLdHtml", () => {
  it("escapes < so a </script> in supplier data cannot break out of the inline script", () => {
    const html = jsonLdHtml({ name: "x</script><script>alert(1)</script>" });
    expect(html).not.toContain("</script>");
    expect(html).toContain("\\u003c/script>");
  });

  it("escapes U+2028 / U+2029 line separators but keeps normal spaces untouched", () => {
    const sep = String.fromCharCode(0x2028);
    const para = String.fromCharCode(0x2029);
    const html = jsonLdHtml({ name: `a${sep}b c${para}d` });
    expect(html).toContain("\\u2028");
    expect(html).toContain("\\u2029");
    expect(html).not.toContain(sep);
    expect(html).not.toContain(para);
    // a regular space must survive (guards against escaping the wrong char)
    expect(html).toContain("b c");
  });
});

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

  it("maps stockStatus to a more precise schema.org availability than the isAvailable boolean", () => {
    const base = {
      name: "Кабель ВВГнг",
      description: "Кабель для заказа.",
      sku: 11261996,
      images: ["/api/product-images/1"],
      price: 1200,
      isAvailable: true,
      url: "/product/kabel-11261996",
    };

    expect(buildProductJsonLd({ ...base, stockStatus: "plenty" }).offers).toMatchObject({
      availability: "https://schema.org/InStock",
    });
    expect(buildProductJsonLd({ ...base, stockStatus: "low" }).offers).toMatchObject({
      availability: "https://schema.org/LimitedAvailability",
    });
    // No physical stock right now, but still orderable ("под заказ 7 дней") —
    // schema.org's BackOrder is more accurate than a flat OutOfStock here.
    expect(buildProductJsonLd({ ...base, stockStatus: "out", isAvailable: true }).offers).toMatchObject({
      availability: "https://schema.org/BackOrder",
    });
    // No stock AND not orderable at all — genuinely out of stock.
    expect(buildProductJsonLd({ ...base, stockStatus: "out", isAvailable: false }).offers).toMatchObject({
      availability: "https://schema.org/OutOfStock",
    });
    // No stockStatus given — falls back to the isAvailable boolean as before.
    expect(buildProductJsonLd(base).offers).toMatchObject({
      availability: "https://schema.org/InStock",
    });
  });

  it("includes mpn (part number) in the offer when known", () => {
    expect(
      buildProductJsonLd({
        name: "Осушитель воздуха Ballu",
        description: "Осушитель воздуха для заказа.",
        sku: 11261200,
        images: ["/api/product-images/1"],
        price: 19800,
        isAvailable: true,
        url: "/product/osushitel-11261200",
        mpn: "BD-30L",
      }),
    ).toMatchObject({ mpn: "BD-30L" });
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
