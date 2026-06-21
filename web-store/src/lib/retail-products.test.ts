import { describe, expect, it } from "vitest";
import {
  degradedRetailNameTerms,
  isAccessoryProductName,
  isAccessorySearchQuery,
  isDegradedRetailName,
  normalRetailNameWhere,
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

describe("accessory search filtering", () => {
  it("flags accessory/part product names", () => {
    expect(isAccessoryProductName("Светодиодная подсветка для телевизоров", null)).toBe(true);
    expect(isAccessoryProductName(null, "Салфетки Buro для экранов мониторов/плазменных")).toBe(true);
    expect(isAccessoryProductName("Кронштейн для ТВ Cablexpert", null)).toBe(true);
    expect(isAccessoryProductName("Разветвитель на 2 телевизора", null)).toBe(true);
    // настоящий телевизор — не аксессуар
    expect(isAccessoryProductName("Телевизор Samsung QE55QN80HAU", null)).toBe(false);
  });

  it("filters accessories only when the query is a main product type", () => {
    // основной тип → аксессуары вырезаем
    expect(isAccessorySearchQuery("телевизор")).toBe(false);
    expect(isAccessorySearchQuery("холодильник")).toBe(false);
    // запрос про сам аксессуар → НЕ вырезаем
    expect(isAccessorySearchQuery("кронштейн для телевизора")).toBe(true);
    expect(isAccessorySearchQuery("салфетки")).toBe(true);
    expect(isAccessorySearchQuery("")).toBe(false);
  });
});
