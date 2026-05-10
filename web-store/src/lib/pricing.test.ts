import { describe, expect, it } from "vitest";
import { calculateRetailPrice, roundRetailPrice } from "@/lib/pricing";

describe("calculateRetailPrice", () => {
  it("uses the higher value between percent markup and minimum ruble markup", () => {
    expect(
      calculateRetailPrice({
        supplierPrice: 58.21,
        markupPercent: 25,
        minMarkupRub: 300,
      }),
    ).toBe(360);
  });

  it("rounds medium prices up to the next 50 rubles", () => {
    expect(
      calculateRetailPrice({
        supplierPrice: 1210,
        markupPercent: 25,
        minMarkupRub: 300,
      }),
    ).toBe(1550);
  });

  it("uses manual price when admin overrides the formula", () => {
    expect(
      calculateRetailPrice({
        supplierPrice: 1210,
        markupPercent: 25,
        minMarkupRub: 300,
        manualPrice: 1490,
      }),
    ).toBe(1490);
  });
});

describe("roundRetailPrice", () => {
  it("rounds by price bands required by the brief", () => {
    expect(roundRetailPrice(999)).toBe(1000);
    expect(roundRetailPrice(1001)).toBe(1050);
    expect(roundRetailPrice(10001)).toBe(10100);
  });
});
