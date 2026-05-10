import { describe, expect, it } from "vitest";
import { getCatalogFilterLanding, listCatalogFilterLandings } from "@/lib/catalog-filter-landings";

describe("catalog filter landings", () => {
  it("exposes stable SEO landing pages for popular filter combinations", () => {
    expect(listCatalogFilterLandings().map((landing) => landing.slug)).toEqual([
      "holodilniki-no-frost",
      "televizory-ot-55-dyuymov",
      "noutbuki-16-gb-ram",
      "ssd-ot-512-gb",
      "sushilnye-mashiny-ot-8-kg",
      "kabel-ot-25-mm2",
    ]);
  });

  it("maps a landing page to catalog filters without query-string SEO indexing", () => {
    expect(getCatalogFilterLanding("holodilniki-no-frost")).toMatchObject({
      title: "Холодильники No Frost купить с доставкой",
      query: {
        categorySlug: "holodilniki-9841",
        available: true,
        attributeFilters: [{ key: "fridge_no_frost", normalizedValue: "yes" }],
      },
    });
  });

  it("keeps every landing scoped to a catalog category", () => {
    expect(listCatalogFilterLandings().every((landing) => landing.query.categorySlug)).toBe(true);
  });
});
