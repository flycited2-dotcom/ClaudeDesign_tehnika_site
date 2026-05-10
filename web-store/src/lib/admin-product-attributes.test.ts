import { describe, expect, it } from "vitest";
import { parseManualProductAttributeLines } from "@/lib/admin-product-attributes";

describe("parseManualProductAttributeLines", () => {
  it("parses manager-friendly attribute lines by label or key", () => {
    expect(
      parseManualProductAttributeLines([
        "Тип сушки: Тепловой насос",
        "load_capacity: 9 кг",
        "No Frost: Да",
      ].join("\n")),
    ).toEqual([
      {
        key: "drying_type",
        label: "Тип сушки",
        value: "Тепловой насос",
        normalizedValue: "heat_pump",
        numericValue: null,
        unit: null,
        source: "manual",
      },
      {
        key: "load_capacity",
        label: "Загрузка",
        value: "9 кг",
        normalizedValue: "9",
        numericValue: 9,
        unit: "кг",
        source: "manual",
      },
      {
        key: "fridge_no_frost",
        label: "No Frost",
        value: "Да",
        normalizedValue: "yes",
        numericValue: null,
        unit: null,
        source: "manual",
      },
    ]);
  });

  it("ignores unknown keys and keeps the first duplicate", () => {
    expect(
      parseManualProductAttributeLines([
        "неизвестно: значение",
        "Цвет: Белый",
        "color: Серый",
      ].join("\n")),
    ).toEqual([
      {
        key: "color",
        label: "Цвет",
        value: "Белый",
        normalizedValue: "white",
        numericValue: null,
        unit: null,
        source: "manual",
      },
    ]);
  });
});
