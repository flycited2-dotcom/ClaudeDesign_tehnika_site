import { describe, expect, it } from "vitest";
import { buildSearchTermCounts, normalizeSearchTerm, parseSearchTermCounts } from "@/lib/search-analytics";

describe("search analytics", () => {
  it("normalizes search terms for stable grouping", () => {
    expect(normalizeSearchTerm("  Ballu   BD-30L  ")).toBe("ballu bd-30l");
    expect(normalizeSearchTerm("а")).toBeNull();
    expect(normalizeSearchTerm(" \n\t ")).toBeNull();
  });

  it("increments existing terms and keeps the most popular first", () => {
    const now = new Date("2026-05-03T10:00:00Z");
    const current = JSON.stringify([
      { term: "телевизор", count: 2, lastSeenAt: "2026-05-02T10:00:00.000Z" },
      { term: "кондиционер", count: 5, lastSeenAt: "2026-05-01T10:00:00.000Z" },
    ]);

    expect(buildSearchTermCounts(current, " Телевизор ", now, 10)).toEqual([
      { term: "кондиционер", count: 5, lastSeenAt: "2026-05-01T10:00:00.000Z" },
      { term: "телевизор", count: 3, lastSeenAt: "2026-05-03T10:00:00.000Z" },
    ]);
  });

  it("drops invalid persisted data and limits stored terms", () => {
    const now = new Date("2026-05-03T10:00:00Z");

    expect(buildSearchTermCounts("not json", "Холодильник", now, 1)).toEqual([
      { term: "холодильник", count: 1, lastSeenAt: "2026-05-03T10:00:00.000Z" },
    ]);
    expect(parseSearchTermCounts("[{}]")).toEqual([]);
  });
});
