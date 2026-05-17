import { describe, expect, it } from "vitest";
import { normalizeCatalogCacheArgs } from "@/lib/catalog-cache-key";

describe("normalizeCatalogCacheArgs", () => {
  it("returns empty/default values for empty input", () => {
    const k = normalizeCatalogCacheArgs({});
    expect(k.brands).toEqual([]);
    expect(k.specFilters).toEqual([]);
    expect(k.attributeFilters).toEqual([]);
    expect(k.attributeRangeFilters).toEqual([]);
    expect(k.categorySlug).toBeNull();
    expect(k.query).toBeNull();
    expect(k.available).toBe(false);
    expect(k.withPhoto).toBe(false);
    expect(k.minPrice).toBeNull();
    expect(k.maxPrice).toBeNull();
    expect(k.page).toBe(1);
    expect(k.sort).toBeNull();
  });

  it("lowercases, trims and sorts brand list, drops empties and dedupes", () => {
    const k = normalizeCatalogCacheArgs({
      brands: ["Samsung", "bosch", "LG", "", "  ", " Xiaomi ", "BOSCH"],
    });
    expect(k.brands).toEqual(["bosch", "lg", "samsung", "xiaomi"]);
  });

  it("merges legacy single `brand` into the brands list", () => {
    const k = normalizeCatalogCacheArgs({
      brand: "Bosch",
      brands: ["Samsung"],
    });
    expect(k.brands).toEqual(["bosch", "samsung"]);
  });

  it("ignores undefined brand", () => {
    const k = normalizeCatalogCacheArgs({ brands: ["Bosch"], brand: undefined });
    expect(k.brands).toEqual(["bosch"]);
  });

  it("preserves page, sort, slug, query, available, withPhoto, prices", () => {
    const k = normalizeCatalogCacheArgs({
      categorySlug: "noutbuki",
      page: 3,
      sort: "price_asc",
      query: "Bosch",
      available: true,
      withPhoto: true,
      minPrice: 1000,
      maxPrice: 50000,
    });
    expect(k.categorySlug).toBe("noutbuki");
    expect(k.page).toBe(3);
    expect(k.sort).toBe("price_asc");
    expect(k.query).toBe("Bosch");
    expect(k.available).toBe(true);
    expect(k.withPhoto).toBe(true);
    expect(k.minPrice).toBe(1000);
    expect(k.maxPrice).toBe(50000);
  });

  it("sorts specFilters (string literals) alphabetically", () => {
    const k = normalizeCatalogCacheArgs({
      specFilters: ["washer_front_load", "laptop", "gaming"],
    });
    expect(k.specFilters).toEqual(["gaming", "laptop", "washer_front_load"]);
  });

  it("sorts attributeFilters by key, then normalizedValue", () => {
    const k = normalizeCatalogCacheArgs({
      attributeFilters: [
        { key: "color", normalizedValue: "white" },
        { key: "color", normalizedValue: "black" },
        { key: "brand", normalizedValue: "bosch" },
      ],
    });
    expect(k.attributeFilters).toEqual([
      { key: "brand", normalizedValue: "bosch" },
      { key: "color", normalizedValue: "black" },
      { key: "color", normalizedValue: "white" },
    ]);
  });

  it("sorts attributeRangeFilters by key", () => {
    const k = normalizeCatalogCacheArgs({
      attributeRangeFilters: [
        { key: "ram", min: 16, max: 64 },
        { key: "battery", min: 5000 },
      ],
    });
    expect(k.attributeRangeFilters).toEqual([
      { key: "battery", min: 5000 },
      { key: "ram", min: 16, max: 64 },
    ]);
  });

  it("produces equal JSON for equivalent inputs (case + order insensitive)", () => {
    const a = normalizeCatalogCacheArgs({ brands: ["Bosch", "samsung"] });
    const b = normalizeCatalogCacheArgs({ brands: ["BOSCH", "Samsung"] });
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });

  it("normalizes page=0 or negative to 1", () => {
    expect(normalizeCatalogCacheArgs({ page: 0 }).page).toBe(1);
    expect(normalizeCatalogCacheArgs({ page: -5 }).page).toBe(1);
  });
});
