import { describe, expect, it } from "vitest";
import { countActiveCatalogFilters } from "@/lib/catalog-ui";

describe("countActiveCatalogFilters", () => {
  it("counts every customer-visible catalog constraint", () => {
    expect(
      countActiveCatalogFilters({
        query: "ssd",
        brands: ["Samsung", "LG"],
        onlyAvailable: true,
        withPhoto: true,
        onlyInStock: true,
        minPrice: 1000,
        maxPrice: 5000,
        sort: "price_asc",
        specFilters: ["storage_ssd", "tv_4k"],
        attributeFilters: [{ key: "storage_type", normalizedValue: "ssd" }],
        attributeRangeFilters: [{ key: "ram", min: 16, max: 64 }],
      }),
    ).toBe(12);
  });

  it("does not count the default sort or empty values", () => {
    expect(
      countActiveCatalogFilters({
        sort: "popular",
        specFilters: [],
      }),
    ).toBe(0);
  });
});
