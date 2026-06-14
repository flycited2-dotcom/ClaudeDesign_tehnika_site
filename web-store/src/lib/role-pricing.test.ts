import { describe, expect, it } from "vitest";
import { canPlaceDirectOrder, computeB2BPrice } from "@/lib/role-pricing";

describe("canPlaceDirectOrder", () => {
  it("allows retail (b2c) to place a direct order", () => {
    expect(canPlaceDirectOrder("b2c")).toBe(true);
  });

  it("blocks b2b and gov — they order via the quote (КП) flow", () => {
    expect(canPlaceDirectOrder("b2b")).toBe(false);
    expect(canPlaceDirectOrder("gov")).toBe(false);
  });
});

describe("computeB2BPrice", () => {
  it("applies the discount and rounds to the nearest 10₽", () => {
    expect(computeB2BPrice(146600, 25)).toBe(109950);
  });

  it("returns 0 for a non-positive retail price", () => {
    expect(computeB2BPrice(0, 25)).toBe(0);
  });
});
