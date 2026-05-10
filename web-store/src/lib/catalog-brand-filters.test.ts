import { describe, expect, it } from "vitest";
import { buildCatalogBrandFilterOptions } from "@/lib/catalog-brand-filters";

describe("catalog brand filters", () => {
  it("builds brand options with counts and keeps active missing brands visible", () => {
    expect(
      buildCatalogBrandFilterOptions(
        [
          { vendor: "ATLANT", count: 12 },
          { vendor: null, count: 99 },
          { vendor: "Indesit", count: 5 },
        ],
        ["ATLANT", "Bosch"],
      ),
    ).toEqual([
      { value: "ATLANT", count: 12 },
      { value: "Indesit", count: 5 },
      { value: "Bosch", count: 0 },
    ]);
  });
});
