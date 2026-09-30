import { describe, expect, it } from "vitest";
import { catalogProductOrderBy } from "@/lib/catalog-order";
import type { CatalogSort } from "@/lib/catalog-query";

describe("catalogProductOrderBy", () => {
  const sorts: CatalogSort[] = ["popular", "price_asc", "price_desc", "new"];

  it.each(sorts)("%s starts with availability then real-photo tiers", (sort) => {
    const order = catalogProductOrderBy(sort);
    expect(order[0]).toEqual({ isAvailable: "desc" });
    expect(order[1]).toEqual({ hasRealImage: "desc" });
  });

  it("defaults to popular", () => {
    expect(catalogProductOrderBy()).toEqual(catalogProductOrderBy("popular"));
  });

  it("orders by the chosen sort only after the tiers", () => {
    expect(catalogProductOrderBy("price_asc")[2]).toEqual({ retailPrice: { sort: "asc", nulls: "last" } });
    expect(catalogProductOrderBy("price_desc")[2]).toEqual({ retailPrice: { sort: "desc", nulls: "last" } });
    expect(catalogProductOrderBy("new")[2]).toEqual({ updatedAt: "desc" });
    expect(catalogProductOrderBy("popular")[2]).toEqual({ updatedAt: "desc" });
  });

  it("never uses the unreliable hasImage flag", () => {
    for (const sort of sorts) {
      expect(JSON.stringify(catalogProductOrderBy(sort))).not.toContain('"hasImage"');
    }
  });
});
