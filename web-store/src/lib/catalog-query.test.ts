import { describe, expect, it } from "vitest";
import { hasCatalogFacetContext, parseCatalogSearchParams, parsePositiveNumberParam } from "@/lib/catalog-query";

describe("parsePositiveNumberParam", () => {
  it("keeps positive numeric values and discards invalid values", () => {
    expect(parsePositiveNumberParam("12990")).toBe(12990);
    expect(parsePositiveNumberParam("12,5")).toBe(12.5);
    expect(parsePositiveNumberParam("0")).toBeUndefined();
    expect(parsePositiveNumberParam("-1")).toBeUndefined();
    expect(parsePositiveNumberParam("text")).toBeUndefined();
  });
});

describe("parseCatalogSearchParams", () => {
  it("normalizes catalog filters from URL search params", () => {
    expect(
      parseCatalogSearchParams({
        q: " холодильник ",
        brand: ["ATLANT", "Indesit", "ATLANT", " "],
        available: "1",
        photo: "1",
        stock: "1",
        minPrice: "10000",
        maxPrice: "50000",
        page: "3",
        sort: "price_asc",
        spec: ["tv_4k", "unknown", "storage_ssd"],
        attr: ["storage_type:ssd", "ram:16", "bad"],
        attrMin: ["ram:16", "storage_capacity:512"],
        attrMax: ["ram:64"],
      }),
    ).toEqual({
      query: "холодильник",
      brand: "ATLANT",
      brands: ["ATLANT", "Indesit"],
      onlyAvailable: true,
      withPhoto: true,
      onlyInStock: true,
      minPrice: 10000,
      maxPrice: 50000,
      page: 3,
      sort: "price_asc",
      specFilters: ["tv_4k", "storage_ssd"],
      attributeFilters: [
        { key: "storage_type", normalizedValue: "ssd" },
        { key: "ram", normalizedValue: "16" },
      ],
      attributeRangeFilters: [
        { key: "ram", min: 16, max: 64 },
        { key: "storage_capacity", min: 512 },
      ],
    });
  });

  it("uses safe defaults for empty filters and bad page values", () => {
    expect(parseCatalogSearchParams({ q: " ", page: "-4", minPrice: "bad", sort: "unknown" })).toEqual({
      query: undefined,
      brand: undefined,
      brands: [],
      onlyAvailable: false,
      withPhoto: false,
      onlyInStock: false,
      minPrice: undefined,
      maxPrice: undefined,
      page: 1,
      sort: "popular",
      specFilters: [],
      attributeFilters: [],
      attributeRangeFilters: [],
    });
  });

  it("parses touch-friendly keyed range form fields", () => {
    expect(
      parseCatalogSearchParams({
        "attrMin.ram": "16",
        "attrMax.ram": "64",
        "attrMin.storage_capacity": "512",
      }).attributeRangeFilters,
    ).toEqual([
      { key: "ram", min: 16, max: 64 },
      { key: "storage_capacity", min: 512 },
    ]);
  });
});

describe("hasCatalogFacetContext", () => {
  it("keeps the root catalog lightweight until the customer narrows the catalog", () => {
    expect(hasCatalogFacetContext({})).toBe(false);
    expect(
      hasCatalogFacetContext({
        page: 2,
        sort: "price_asc",
        available: true,
        withPhoto: true,
        brands: ["ATLANT"],
        minPrice: 1000,
        maxPrice: 5000,
      }),
    ).toBe(false);
    expect(hasCatalogFacetContext({ categorySlug: "bytovaya-tehnika-9839" })).toBe(true);
    expect(hasCatalogFacetContext({ query: "ssd" })).toBe(true);
    expect(hasCatalogFacetContext({ specFilters: ["storage_ssd"] })).toBe(true);
    expect(hasCatalogFacetContext({ attributeRangeFilters: [{ key: "ram", min: 16 }] })).toBe(true);
  });
});
