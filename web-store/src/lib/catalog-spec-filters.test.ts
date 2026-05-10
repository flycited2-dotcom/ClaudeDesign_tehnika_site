import { describe, expect, it } from "vitest";
import {
  attachCatalogSpecFilterCounts,
  buildCatalogSpecFilterWhere,
  getCatalogSpecFilterOptions,
  normalizeCatalogSpecFilterValues,
} from "@/lib/catalog-spec-filters";

describe("catalog spec filters", () => {
  it("keeps only known spec filters in stable order", () => {
    expect(normalizeCatalogSpecFilterValues(["tv_4k", "unknown", "storage_ssd", "tv_4k", "fridge_no_frost"])).toEqual([
      "tv_4k",
      "storage_ssd",
      "fridge_no_frost",
    ]);
  });

  it("returns category-relevant filters and keeps active filters visible", () => {
    expect(getCatalogSpecFilterOptions({ categoryName: "Телевизоры", activeFilters: ["storage_ssd"] })).toEqual([
      { key: "tv_4k", label: "4K / UHD", groupLabel: "Телевизоры" },
      { key: "tv_full_hd", label: "Full HD", groupLabel: "Телевизоры" },
      { key: "tv_smart", label: "Smart TV", groupLabel: "Телевизоры" },
      { key: "tv_55_plus", label: "От 55 дюймов", groupLabel: "Телевизоры" },
      { key: "tv_65_plus", label: "От 65 дюймов", groupLabel: "Телевизоры" },
      { key: "storage_ssd", label: "SSD", groupLabel: "Компьютеры" },
    ]);
  });

  it("returns a balanced starter set when no category is selected", () => {
    expect(getCatalogSpecFilterOptions({})).toEqual([
      { key: "tv_4k", label: "4K / UHD", groupLabel: "Телевизоры" },
      { key: "tv_smart", label: "Smart TV", groupLabel: "Телевизоры" },
      { key: "storage_ssd", label: "SSD", groupLabel: "Компьютеры" },
      { key: "fridge_no_frost", label: "No Frost", groupLabel: "Холодильники" },
      { key: "ac_inverter", label: "Инверторные", groupLabel: "Климат" },
      { key: "washer_narrow", label: "Узкие", groupLabel: "Стиральные машины" },
    ]);
  });

  it("does not show unrelated starter filters for categories without spec matches", () => {
    expect(getCatalogSpecFilterOptions({ categoryName: "Книги" })).toEqual([]);
  });

  it("returns garden filters for dacha and garden categories", () => {
    expect(getCatalogSpecFilterOptions({ categoryName: "Дача, сад и огород" })).toEqual([
      { key: "garden_snow_blower", label: "Снегоуборщики", groupLabel: "Садовая техника" },
      { key: "garden_lawn_mower", label: "Газонокосилки", groupLabel: "Садовая техника" },
      { key: "garden_motoblock", label: "Мотоблоки", groupLabel: "Садовая техника" },
      { key: "garden_trimmer", label: "Триммеры", groupLabel: "Садовая техника" },
      { key: "garden_petrol", label: "Бензиновые", groupLabel: "Садовая техника" },
      { key: "garden_battery", label: "Аккумуляторные", groupLabel: "Садовая техника" },
    ]);
  });

  it("returns richer appliance filters for refrigerator categories", () => {
    expect(getCatalogSpecFilterOptions({ categoryName: "Холодильники и морозильники" })).toEqual([
      { key: "fridge_no_frost", label: "No Frost", groupLabel: "Холодильники" },
      { key: "fridge_two_chamber", label: "Двухкамерные", groupLabel: "Холодильники" },
      { key: "freezer", label: "Морозильники", groupLabel: "Холодильники" },
    ]);
  });

  it("returns climate filters for air conditioner categories", () => {
    expect(getCatalogSpecFilterOptions({ categoryName: "Кондиционеры сплит-системы" })).toEqual([
      { key: "ac_split_system", label: "Сплит-системы", groupLabel: "Климат" },
      { key: "ac_inverter", label: "Инверторные", groupLabel: "Климат" },
    ]);
  });

  it("returns air treatment filters for humidifier and dehumidifier categories", () => {
    expect(getCatalogSpecFilterOptions({ categoryName: "Осушители и увлажнители воздуха" })).toEqual([
      { key: "air_purification", label: "Очистка воздуха", groupLabel: "Климат" },
      { key: "daily_capacity", label: "Производительность, л/сутки", groupLabel: "Климат" },
      { key: "daily_capacity_20_plus", label: "От 20 л/сутки", groupLabel: "Климат" },
      { key: "daily_capacity_50_plus", label: "От 50 л/сутки", groupLabel: "Климат" },
      { key: "tank_volume", label: "Объем бака, л", groupLabel: "Климат" },
      { key: "tank_volume_3_plus", label: "Бак от 3 л", groupLabel: "Климат" },
    ]);
  });

  it("builds AND search conditions for selected spec filters", () => {
    const where = buildCatalogSpecFilterWhere(["tv_4k", "storage_ssd", "fridge_no_frost"]);

    expect(where.AND).toHaveLength(3);
    expect(where.AND).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          OR: expect.arrayContaining([
            {
              attributes: {
                some: {
                  key: "resolution",
                  normalizedValue: {
                    in: ["4k", "4k_uhd"],
                  },
                },
              },
            },
            { name: { contains: "4k", mode: "insensitive" } },
            { supplierName: { contains: "4k", mode: "insensitive" } },
          ]),
        }),
        expect.objectContaining({
          OR: expect.arrayContaining([
            {
              attributes: {
                some: {
                  key: "storage_type",
                  normalizedValue: "ssd",
                },
              },
            },
            { name: { contains: "ssd", mode: "insensitive" } },
            { supplierName: { contains: "ssd", mode: "insensitive" } },
          ]),
        }),
        expect.objectContaining({
          OR: expect.arrayContaining([
            { name: { contains: "no frost", mode: "insensitive" } },
            { supplierName: { contains: "no frost", mode: "insensitive" } },
          ]),
        }),
      ]),
    );
  });

  it("builds numeric attribute conditions for richer spec filters", () => {
    const where = buildCatalogSpecFilterWhere(["tv_55_plus", "storage_512_plus", "daily_capacity_20_plus"]);

    expect(where.AND).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          OR: expect.arrayContaining([
            {
              attributes: {
                some: {
                  key: "screen_diagonal",
                  numericValue: {
                    gte: 55,
                  },
                },
              },
            },
          ]),
        }),
        expect.objectContaining({
          OR: expect.arrayContaining([
            {
              attributes: {
                some: {
                  key: "storage_capacity",
                  numericValue: {
                    gte: 512,
                  },
                },
              },
            },
          ]),
        }),
        expect.objectContaining({
          OR: expect.arrayContaining([
            {
              attributes: {
                some: {
                  key: "daily_capacity",
                  numericValue: {
                    gte: 20,
                  },
                },
              },
            },
          ]),
        }),
      ]),
    );
  });

  it("builds search conditions for garden spec filters", () => {
    const where = buildCatalogSpecFilterWhere(["garden_snow_blower", "garden_battery"]);

    expect(where.AND).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          OR: expect.arrayContaining([
            { name: { contains: "снегоубор", mode: "insensitive" } },
            { supplierName: { contains: "снегоубор", mode: "insensitive" } },
          ]),
        }),
        expect.objectContaining({
          OR: expect.arrayContaining([
            { name: { contains: "аккумулятор", mode: "insensitive" } },
            { supplierName: { contains: "аккумулятор", mode: "insensitive" } },
          ]),
        }),
      ]),
    );
  });

  it("attaches counts to visible spec filter options", () => {
    const options = getCatalogSpecFilterOptions({ categoryName: "Телевизоры" });

    expect(attachCatalogSpecFilterCounts(options, new Map([["tv_smart", 42]]))).toEqual([
      { key: "tv_smart", label: "Smart TV", groupLabel: "Телевизоры", count: 42 },
    ]);
  });

  it("keeps active spec filters visible even when their current count is zero", () => {
    const options = getCatalogSpecFilterOptions({ categoryName: "Телевизоры" });

    expect(attachCatalogSpecFilterCounts(options, new Map([["tv_smart", 42]]), ["tv_4k"])).toEqual([
      { key: "tv_4k", label: "4K / UHD", groupLabel: "Телевизоры", count: 0 },
      { key: "tv_smart", label: "Smart TV", groupLabel: "Телевизоры", count: 42 },
    ]);
  });
});
