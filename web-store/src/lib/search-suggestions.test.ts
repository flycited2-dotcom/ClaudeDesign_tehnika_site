import { describe, expect, it } from "vitest";
import { normalizeSuggestionQuery } from "@/lib/search-suggestions";

describe("normalizeSuggestionQuery", () => {
  it("uses the same canonical form as the full search", () => {
    expect(normalizeSuggestionQuery("ТВ LG OLED")).toBe("телевизор lg oled");
  });

  it("rejects a query that remains shorter than two characters", () => {
    expect(normalizeSuggestionQuery(" я ")).toBeNull();
  });
});
