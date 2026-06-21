import { describe, expect, it } from "vitest";
import {
  degradedRetailNameTerms,
  isDegradedRetailName,
  normalRetailNameWhere,
  searchAccessoryExclusionWhere,
  searchAccessoryMarkers,
} from "@/lib/retail-products";

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

describe("searchAccessoryExclusionWhere", () => {
  it("excludes accessories/parts when searching a main product type", () => {
    const where = searchAccessoryExclusionWhere("телевизор");
    expect(where).not.toBeNull();
    expect(where?.AND).toHaveLength(searchAccessoryMarkers.length);
    // содержит исключение по маркеру «подсветк» (Светодиодная подсветка для ТВ)
    expect(JSON.stringify(where)).toContain("подсветк");
    expect(JSON.stringify(where)).toContain("салфетк");
  });

  it("does NOT filter when the user is searching for the accessory itself", () => {
    expect(searchAccessoryExclusionWhere("кронштейн для телевизора")).toBeNull();
    expect(searchAccessoryExclusionWhere("салфетки для экрана")).toBeNull();
    expect(searchAccessoryExclusionWhere("подсветка")).toBeNull();
  });

  it("returns null for empty queries", () => {
    expect(searchAccessoryExclusionWhere("")).toBeNull();
    expect(searchAccessoryExclusionWhere("   ")).toBeNull();
    expect(searchAccessoryExclusionWhere(null)).toBeNull();
  });
});
