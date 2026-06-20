import { describe, expect, it } from "vitest";
import {
  buildCatalogAttributeFilterGroups,
  buildCatalogAttributeFacetProductWhere,
  buildCatalogAttributeFilterWhere,
  buildCatalogAttributeRangeGroups,
  buildCatalogAttributeRangeFilterWhere,
  normalizeCatalogAttributeFilters,
  normalizeCatalogAttributeRangeFilters,
} from "@/lib/catalog-attribute-filters";

describe("catalog attribute filters", () => {
  it("normalizes URL attribute filters and removes duplicates", () => {
    expect(normalizeCatalogAttributeFilters(["storage_type:ssd", "bad", "ram:16", "power_source:petrol", "storage_type:ssd", " : "])).toEqual([
      { key: "storage_type", normalizedValue: "ssd" },
      { key: "ram", normalizedValue: "16" },
      { key: "power_source", normalizedValue: "petrol" },
    ]);
  });

  it("builds Prisma AND conditions for selected attributes", () => {
    expect(buildCatalogAttributeFilterWhere([{ key: "storage_type", normalizedValue: "ssd" }, { key: "ram", normalizedValue: "16" }])).toEqual({
      AND: [
        {
          attributes: {
            some: {
              key: "storage_type",
              normalizedValue: "ssd",
            },
          },
        },
        {
          attributes: {
            some: {
              key: "ram",
              normalizedValue: "16",
            },
          },
        },
      ],
    });
  });

  it("normalizes numeric min/max URL filters", () => {
    expect(
      normalizeCatalogAttributeRangeFilters({
        minValues: ["ram:16", "bad", "storage_capacity:512"],
        maxValues: ["ram:64", "screen_diagonal:65", "unknown:1"],
      }),
    ).toEqual([
      { key: "ram", min: 16, max: 64 },
      { key: "storage_capacity", min: 512 },
      { key: "screen_diagonal", max: 65 },
    ]);
  });

  it("builds Prisma numeric attribute range filters", () => {
    expect(buildCatalogAttributeRangeFilterWhere([{ key: "ram", min: 16, max: 64 }])).toEqual({
      AND: [
        {
          attributes: {
            some: {
              key: "ram",
              numericValue: {
                gte: 16,
                lte: 64,
              },
            },
          },
        },
      ],
    });
  });

  it("builds numeric range groups from aggregate rows", () => {
    expect(
      buildCatalogAttributeRangeGroups([
        { key: "ram", label: "Оперативная память", min: 8, max: 64, unit: "ГБ", count: 25 },
        { key: "power_hp", label: "Мощность двигателя", min: 5, max: 18, unit: "л.с.", count: 10 },
        { key: "screen_diagonal", label: "Диагональ", min: 55, max: 55, unit: "дюйм", count: 3 },
        { key: "unknown", label: "Unknown", min: 1, max: 10, unit: null, count: 4 },
      ]),
    ).toEqual([
      { key: "ram", label: "Оперативная память", min: 8, max: 64, unit: "ГБ", count: 25 },
      { key: "power_hp", label: "Мощность двигателя", min: 5, max: 18, unit: "л.с.", count: 10 },
    ]);
  });

  it("builds facet count where using other selected attributes but not the current group", () => {
    expect(
      buildCatalogAttributeFacetProductWhere(
        {
          isActive: true,
          AND: [{ isVisible: true }],
        },
        [
          { key: "storage_type", normalizedValue: "ssd" },
          { key: "ram", normalizedValue: "16" },
        ],
        "ram",
      ),
    ).toEqual({
      isActive: true,
      AND: [
        { isVisible: true },
        {
          attributes: {
            some: {
              key: "storage_type",
              normalizedValue: "ssd",
            },
          },
        },
      ],
    });
  });

  it("drops range groups that are not allowed for the current category family", () => {
    expect(
      buildCatalogAttributeRangeGroups(
        [
          { key: "load_capacity", label: "Загрузка", min: 8, max: 10, unit: "кг", count: 12 },
          { key: "power_hp", label: "Мощность двигателя", min: 60, max: 1002, unit: "л.с.", count: 5 },
          { key: "cable_section", label: "Сечение кабеля", min: 1.5, max: 6, unit: "мм²", count: 8 },
        ],
        ["load_capacity", "color"],
      ),
    ).toEqual([{ key: "load_capacity", label: "Загрузка", min: 8, max: 10, unit: "кг", count: 12 }]);
  });

  it("builds grouped facet options from ProductAttribute counts", () => {
    expect(
      buildCatalogAttributeFilterGroups(
        [
          { key: "ram", label: "Оперативная память", value: "8 ГБ", normalizedValue: "8", numericValue: 8, unit: "ГБ", count: 4 },
          { key: "ram", label: "Оперативная память", value: "16 ГБ", normalizedValue: "16", numericValue: 16, unit: "ГБ", count: 9 },
          { key: "storage_type", label: "Тип накопителя", value: "SSD", normalizedValue: "ssd", numericValue: null, unit: null, count: 10 },
          { key: "storage_type", label: "Тип накопителя", value: "HDD", normalizedValue: "hdd", numericValue: null, unit: null, count: 2 },
          { key: "unknown", label: "Unknown", value: "x", normalizedValue: "x", numericValue: null, unit: null, count: 10 },
        ],
        [{ key: "ram", normalizedValue: "16" }],
      ),
    ).toEqual([
      {
        key: "storage_type",
        label: "Тип накопителя",
        options: [
          { value: "storage_type:hdd", label: "HDD", count: 2 },
          { value: "storage_type:ssd", label: "SSD", count: 10 },
        ],
      },
      {
        key: "ram",
        label: "Оперативная память",
        options: [
          { value: "ram:8", label: "8 ГБ", count: 4 },
          { value: "ram:16", label: "16 ГБ", count: 9 },
        ],
      },
    ]);
  });

  it("orders facet groups by marketing rank when a family is provided (B4)", () => {
    const rows = [
      { key: "width_cm", label: "Ширина", value: "60 см", normalizedValue: "60", numericValue: 60, unit: "см", count: 9 },
      { key: "total_volume_l", label: "Общий объем", value: "300 л", normalizedValue: "300", numericValue: 300, unit: "л", count: 9 },
      { key: "fridge_no_frost", label: "No Frost", value: "Да", normalizedValue: "yes", numericValue: null, unit: null, count: 9 },
      { key: "energy_class", label: "Класс энергопотребления", value: "A++", normalizedValue: "a_pp", numericValue: null, unit: null, count: 9 },
    ];
    const groups = buildCatalogAttributeFilterGroups(rows, [], undefined, "refrigeration");
    expect(groups.map((group) => group.key)).toEqual(["total_volume_l", "fridge_no_frost", "energy_class", "width_cm"]);

    // Without a family, the original registry (keyRank/declaration) order is preserved.
    const fallback = buildCatalogAttributeFilterGroups(rows);
    expect(fallback.map((group) => group.key)).toEqual(["width_cm", "energy_class", "fridge_no_frost", "total_volume_l"]);
  });

  it("orders range groups by marketing rank when a family is provided (B4)", () => {
    const rows = [
      { key: "width_cm", label: "Ширина", min: 45, max: 90, unit: "см", count: 12 },
      { key: "total_volume_l", label: "Общий объем", min: 150, max: 500, unit: "л", count: 12 },
      { key: "freezer_volume_l", label: "Объем морозильной камеры", min: 40, max: 120, unit: "л", count: 12 },
    ];
    const groups = buildCatalogAttributeRangeGroups(rows, undefined, "refrigeration");
    expect(groups.map((group) => group.key)).toEqual(["total_volume_l", "freezer_volume_l", "width_cm"]);
  });

  it("drops checkbox facet groups that are not allowed for the current category family", () => {
    expect(
      buildCatalogAttributeFilterGroups(
        [
          { key: "drying_type", label: "Тип сушки", value: "Тепловой насос", normalizedValue: "heat_pump", numericValue: null, unit: null, count: 8 },
          { key: "electrical_product_type", label: "Тип электротовара", value: "Коробка/щит", normalizedValue: "box", numericValue: null, unit: null, count: 2 },
          { key: "color", label: "Цвет", value: "Белый", normalizedValue: "white", numericValue: null, unit: null, count: 5 },
          { key: "color", label: "Цвет", value: "Серый", normalizedValue: "gray", numericValue: null, unit: null, count: 2 },
        ],
        [],
        ["drying_type", "color"],
      ),
    ).toEqual([
      {
        key: "drying_type",
        label: "Тип сушки",
        options: [{ value: "drying_type:heat_pump", label: "Тепловой насос", count: 8 }],
      },
      {
        key: "color",
        label: "Цвет",
        options: [
          { value: "color:white", label: "Белый", count: 5 },
          { value: "color:gray", label: "Серый", count: 2 },
        ],
      },
    ]);
  });
});
