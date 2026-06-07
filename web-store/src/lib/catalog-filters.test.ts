import { describe, expect, it } from "vitest";
import { countActiveFilters } from "@/lib/catalog-filters";

describe("countActiveFilters", () => {
  it("returns 0 for an empty params", () => {
    expect(countActiveFilters(new URLSearchParams())).toBe(0);
  });

  it("does NOT count sort even when non-default", () => {
    expect(countActiveFilters(new URLSearchParams("sort=price_asc"))).toBe(0);
  });

  it("does NOT count page or other non-filter params", () => {
    expect(countActiveFilters(new URLSearchParams("page=3&sort=new"))).toBe(0);
  });

  it("does NOT count empty or whitespace query", () => {
    expect(countActiveFilters(new URLSearchParams("q="))).toBe(0);
    expect(countActiveFilters(new URLSearchParams("q=%20%20"))).toBe(0);
  });

  it("counts each brand selection individually", () => {
    const params = new URLSearchParams();
    params.append("brand", "Bosch");
    params.append("brand", "Samsung");
    params.append("brand", "LG");
    expect(countActiveFilters(params)).toBe(3);
  });

  it("counts query, price range, availability, photo, and multi-value filters together", () => {
    const params = new URLSearchParams();
    params.set("q", "холодильник");
    params.set("minPrice", "10000");
    params.set("maxPrice", "50000");
    params.set("available", "1");
    params.set("photo", "1");
    params.append("brand", "Bosch");
    params.append("brand", "Samsung");
    params.append("spec", "no-frost");
    params.append("attr", "color:white");
    params.append("attr", "color:silver");
    params.append("attrMin", "volume:200");
    params.append("attrMax", "volume:500");
    // q(1) + minPrice(1) + maxPrice(1) + available(1) + photo(1) + brands(2) + spec(1) + attr(2) + attrMin(1) + attrMax(1) = 12
    expect(countActiveFilters(params)).toBe(12);
  });

  it("ignores whitespace-only price bounds", () => {
    expect(countActiveFilters(new URLSearchParams("minPrice=&maxPrice=   "))).toBe(0);
  });
});
