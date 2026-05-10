import { describe, expect, it } from "vitest";
import { mapSupplierStock, stockLabel } from "@/lib/stock";

describe("mapSupplierStock", () => {
  it("maps ITP stock symbols to public stock states", () => {
    expect(mapSupplierStock("*")).toBe("low");
    expect(mapSupplierStock("**")).toBe("available");
    expect(mapSupplierStock("***")).toBe("plenty");
    expect(mapSupplierStock("0")).toBe("out");
    expect(mapSupplierStock(null)).toBe("out");
  });
});

describe("stockLabel", () => {
  it("returns customer-facing Russian labels", () => {
    expect(stockLabel("out")).toBe("Нет в наличии");
    expect(stockLabel("low")).toBe("Мало");
    expect(stockLabel("available")).toBe("В наличии");
    expect(stockLabel("plenty")).toBe("Много");
  });
});
