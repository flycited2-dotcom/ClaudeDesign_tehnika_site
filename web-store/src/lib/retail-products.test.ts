import { describe, expect, it } from "vitest";
import { degradedRetailNameTerms, isDegradedRetailName, normalRetailNameWhere } from "@/lib/retail-products";

describe("isDegradedRetailName", () => {
  it("detects damaged-package and demo-condition goods", () => {
    expect(isDegradedRetailName("Поврежденная упаковка клавиатура Defender")).toBe(true);
    expect(isDegradedRetailName("(Поврежденный товар) Холодильник Weissgauff")).toBe(true);
    expect(isDegradedRetailName("Уценка: холодильник")).toBe(true);
    expect(isDegradedRetailName("Витринный образец телевизор")).toBe(true);
    expect(isDegradedRetailName("Смартфон Samsung Galaxy")).toBe(false);
  });
});

describe("normalRetailNameWhere", () => {
  it("keeps products with empty public names while excluding degraded terms", () => {
    expect(normalRetailNameWhere()).toEqual({
      AND: degradedRetailNameTerms.map((term) => ({
        AND: [
          { NOT: { supplierName: { contains: term, mode: "insensitive" } } },
          {
            OR: [{ name: null }, { NOT: { name: { contains: term, mode: "insensitive" } } }],
          },
        ],
      })),
    });
  });
});
