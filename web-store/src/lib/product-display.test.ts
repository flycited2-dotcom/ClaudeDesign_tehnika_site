import { describe, expect, it } from "vitest";
import { buildProductCardHighlights, buildProductFacts, productDescriptionText, warrantyLabel } from "@/lib/product-display";

describe("warrantyLabel", () => {
  it("hides zero warranties and formats real warranty values", () => {
    expect(warrantyLabel("0")).toBeNull();
    expect(warrantyLabel("")).toBeNull();
    expect(warrantyLabel("12")).toBe("12 мес.");
    expect(warrantyLabel("официальная гарантия")).toBe("официальная гарантия");
  });
});

describe("buildProductFacts", () => {
  it("returns all useful customer-facing facts from supplier data", () => {
    expect(
      buildProductFacts({
        sku: 123,
        categoryName: "Холодильники",
        vendor: "Samsung",
        part: "ABC-1",
        barcodes: "4601234567890, 4601234567891",
        warranty: "0",
        weight: 2.5,
        volume: 0.009044,
        multiplicity: 2,
        deliveryDays: 3,
      }),
    ).toEqual([
      { label: "SKU", value: "123" },
      { label: "Категория", value: "Холодильники" },
      { label: "Бренд", value: "Samsung" },
      { label: "Партномер", value: "ABC-1" },
      { label: "Штрихкоды", value: "4601234567890, 4601234567891" },
      { label: "Вес", value: "2.5 кг" },
      { label: "Объем упаковки", value: "0.009 м³" },
      { label: "Кратность заказа", value: "2 шт." },
      { label: "Срок поставки", value: "Под заказ 7 дней" },
    ]);
  });

  it("never exposes same-day delivery copy in public facts", () => {
    const facts = buildProductFacts({
      sku: 123,
      deliveryDays: 0,
    });

    expect(facts).toContainEqual({ label: "Срок поставки", value: "Под заказ 7 дней" });
    expect(facts.map((fact) => fact.value).join(" ")).not.toContain("день в день");
  });

  it("adds obvious extracted specs from the product title", () => {
    expect(
      buildProductFacts({
        sku: 123,
        title: "Осушитель воздуха Ballu Vector BD-30L VT белый, 30 л/сутки, 4 л",
      }),
    ).toEqual([
      { label: "SKU", value: "123" },
      { label: "Производительность", value: "30 л/сутки" },
      { label: "Объем бака", value: "4 л" },
      { label: "Срок поставки", value: "Под заказ 7 дней" },
    ]);
  });

  it("uses saved product attributes before title fallback specs", () => {
    expect(
      buildProductFacts({
        sku: 123,
        title: "Снегоуборщик Elitech ST 0762LE",
        attributes: [
          { key: "power_hp", label: "Мощность двигателя", value: "7 л.с." },
          { key: "power_source", label: "Тип питания", value: "Бензиновый" },
        ],
      }),
    ).toEqual([
      { label: "SKU", value: "123" },
      { label: "Тип питания", value: "Бензиновый" },
      { label: "Мощность двигателя", value: "7 л.с." },
      { label: "Срок поставки", value: "Под заказ 7 дней" },
    ]);
  });
});

describe("buildProductCardHighlights", () => {
  it("uses saved product attributes before title fallback specs in catalog cards", () => {
    expect(
      buildProductCardHighlights({
        title: "Сушильная машина Bosch WTN86202ME",
        warranty: "12",
        attributes: [
          { key: "drying_type", label: "Тип сушки", value: "Конденсационная" },
          { key: "load_capacity", label: "Загрузка", value: "8 кг" },
          { key: "depth_cm", label: "Глубина", value: "60 см" },
        ],
      }),
    ).toEqual(["8 кг", "Конденсационная", "60 см"]);
  });

  it("prioritizes extracted specs in catalog cards", () => {
    expect(
      buildProductCardHighlights({
        title: 'Телевизор Samsung UE55CU7100U 55" 4K UHD Smart TV',
        warranty: "12",
      }),
    ).toEqual(['55"', "4K UHD", "Гарантия 12 мес."]);
  });

  it("selects short useful facts for catalog cards", () => {
    expect(
      buildProductCardHighlights({
        warranty: "12",
        weight: 2.5,
        volume: 0.009044,
        multiplicity: 2,
      }),
    ).toEqual(["Гарантия 12 мес.", "2.5 кг", "Кратно 2 шт."]);
  });

  it("falls back to part number when physical facts are missing", () => {
    expect(buildProductCardHighlights({ part: "ABC-1" })).toEqual(["Арт. ABC-1"]);
  });
});

describe("productDescriptionText", () => {
  it("uses the real description when it exists and a retail fallback otherwise", () => {
    expect(productDescriptionText("  Подробное описание товара. ")).toBe("Подробное описание товара.");
    expect(productDescriptionText(null)).toContain("Подробное описание пока не заполнено");
  });

  it("builds a customer-facing fallback from available supplier data", () => {
    const description = productDescriptionText(null, {
      supplierName: "Холодильник Weissgauff WRK 2000",
      vendor: "Weissgauff",
      categoryName: "Холодильники",
      warranty: "12",
      deliveryDays: 2,
      multiplicity: 2,
    });

    expect(description).toContain("Холодильник Weissgauff WRK 2000");
    expect(description).toContain("Бренд: Weissgauff");
    expect(description).toContain("Категория: Холодильники");
    expect(description).toContain("Гарантия: 12 мес.");
    expect(description).toContain("Заказ кратно 2 шт.");
    expect(description).toContain("Ориентировочный срок поставки: под заказ 7 дней.");
    expect(description).not.toContain("2 дня");
    expect(description).not.toContain("день в день");
  });
});
