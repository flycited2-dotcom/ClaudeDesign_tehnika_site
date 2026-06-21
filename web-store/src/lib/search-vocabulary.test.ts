import { describe, expect, it } from "vitest";
import { buildHeaderSearchQueries, normalizeSearchQuery, searchSeedQueries } from "@/lib/search-vocabulary";

describe("normalizeSearchQuery", () => {
  it("maps colloquial product aliases without changing a model", () => {
    expect(normalizeSearchQuery("  Телик   Samsung QE55C  ")).toBe("телевизор samsung qe55c");
  });

  it("leaves unknown product words and article-like fragments intact", () => {
    expect(normalizeSearchQuery("Makita DHP486Z")).toBe("makita dhp486z");
  });
});

describe("buildHeaderSearchQueries", () => {
  it("keeps recorded terms first and removes canonical duplicates from seed queries", () => {
    expect(buildHeaderSearchQueries([{ term: "телик" }, { term: "Bosch" }], 5)).toEqual([
      "телик",
      "Bosch",
      ...searchSeedQueries.filter((term) => term !== "телевизор").slice(0, 3),
    ]);
  });
});
