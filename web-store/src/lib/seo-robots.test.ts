import { describe, expect, it } from "vitest";
import { catalogRobotsForFilters, isIndexableCatalogFilters } from "@/lib/seo-robots";

describe("catalog robots metadata", () => {
  it("indexes clean catalog and category landing pages", () => {
    expect(isIndexableCatalogFilters({ page: 1, sort: "popular", specFilters: [] })).toBe(true);
    expect(catalogRobotsForFilters({ page: 1, sort: "popular", specFilters: [] })).toEqual({ index: true, follow: true });
  });

  it("noindexes filtered, sorted, searched, or paginated catalog URLs", () => {
    const cases = [
      { page: 2, sort: "popular", specFilters: [] },
      { page: 1, sort: "price_asc", specFilters: [] },
      { page: 1, sort: "popular", specFilters: ["tv_4k"] },
      { page: 1, sort: "popular", specFilters: [], attributeFilters: [{ key: "ram", normalizedValue: "16" }] },
      { page: 1, sort: "popular", specFilters: [], attributeRangeFilters: [{ key: "ram", min: 16 }] },
      { page: 1, sort: "popular", specFilters: [], brand: "Samsung" },
      { page: 1, sort: "popular", specFilters: [], query: "ssd" },
      { page: 1, sort: "popular", specFilters: [], onlyAvailable: true },
    ] as const;

    for (const filters of cases) {
      expect(isIndexableCatalogFilters(filters)).toBe(false);
      expect(catalogRobotsForFilters(filters)).toEqual({ index: false, follow: true });
    }
  });
});
