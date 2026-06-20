import { describe, expect, it } from "vitest";
import { buildProductAttributeRows } from "@/lib/product-attribute-backfill";

describe("buildProductAttributeRows", () => {
  it("uses public product name before supplier name and keeps product ownership fields", () => {
    expect(
      buildProductAttributeRows({
        productId: "product-1",
        name: 'Телевизор Samsung UE55CU7100U 55" 4K UHD Smart TV',
        supplierName: "Поставщик: другое название",
      }),
    ).toEqual([
      {
        productId: "product-1",
        key: "screen_diagonal",
        label: "Диагональ",
        value: '55"',
        normalizedValue: "55",
        numericValue: 55,
        unit: "дюйм",
        source: "name",
      },
      {
        productId: "product-1",
        key: "resolution",
        label: "Разрешение",
        value: "4K UHD",
        normalizedValue: "4k_uhd",
        numericValue: null,
        unit: null,
        source: "name",
      },
      {
        productId: "product-1",
        key: "smart_tv",
        label: "Smart TV",
        value: "Да",
        normalizedValue: "yes",
        numericValue: null,
        unit: null,
        source: "name",
      },
    ]);
  });

  it("falls back to supplier name when public name is empty", () => {
    expect(
      buildProductAttributeRows({
        productId: "product-2",
        name: null,
        supplierName: "Ноутбук Lenovo IdeaPad 15, 16 ГБ RAM, SSD 512 ГБ",
      }).map((row) => row.key),
    ).toEqual(["ram", "storage_type", "storage_capacity"]);
  });

  it("extracts laundry parameters for dryer filters", () => {
    expect(
      buildProductAttributeRows({
        productId: "dryer-1",
        name: "Сушильная машина Bosch WTN86202ME серый, 8 кг, сушка - конденсационная, глубина 60 см, класс энергопотребления A++",
        supplierName: null,
      }).map((row) => [row.key, row.normalizedValue]),
    ).toEqual([
      ["load_capacity", "8"],
      ["drying_type", "condensation"],
      ["depth_cm", "60"],
      ["energy_class", "a"],
      ["color", "gray"],
    ]);
  });

  it("extracts refrigerator parameters for category filters", () => {
    expect(
      buildProductAttributeRows({
        productId: "fridge-1",
        name: "Холодильник ATLANT No Frost белый, общий объем 320 л, морозильная камера снизу, 60x185x63 см, класс A+",
        supplierName: null,
      }).map((row) => [row.key, row.normalizedValue]),
    ).toEqual([
      ["fridge_no_frost", "yes"],
      ["total_volume_l", "320"],
      ["freezer_position", "bottom"],
      ["width_cm", "60"],
      ["height_cm", "185"],
      ["depth_cm", "63"],
      ["energy_class", "a"],
      ["color", "white"],
    ]);
  });

  it("extracts paper parameters for office supply filters", () => {
    expect(
      buildProductAttributeRows({
        productId: "paper-1",
        name: "Бумага офисная SvetoCopy A4, 80 г/м2, белизна 146%, 500 листов",
        supplierName: null,
      }).map((row) => [row.key, row.normalizedValue]),
    ).toEqual([
      ["paper_format", "a4"],
      ["paper_density", "80"],
      ["paper_whiteness", "146"],
      ["sheet_count", "500"],
    ]);
  });

  it("extracts camera parameters for photo and video filters", () => {
    expect(
      buildProductAttributeRows({
        productId: "camera-1",
        name: "IP видеокамера 4 Мп, объектив 2.8 мм, Wi-Fi, IP66",
        supplierName: null,
      }).map((row) => [row.key, row.normalizedValue]),
    ).toEqual([
      ["resolution", "4_mp"],
      ["camera_lens_mm", "2.8"],
      ["ip_rating", "ip66"],
      ["interface", "wi_fi"],
    ]);
  });

  it("extracts tire parameters for auto filters", () => {
    expect(
      buildProductAttributeRows({
        productId: "tire-1",
        name: "Шина зимняя Nokian 205/55 R16",
        supplierName: null,
      }).map((row) => [row.key, row.normalizedValue]),
    ).toEqual([
      ["tire_width", "205"],
      ["tire_profile", "55"],
      ["rim_diameter", "16"],
      ["tire_season", "winter"],
    ]);
  });

  it("extracts oven width from supplier name when public name is missing", () => {
    expect(
      buildProductAttributeRows({
        productId: "oven-1",
        name: null,
        supplierName: "Духовой шкаф Electrolux EOF5C70X электрическая, встраиваемая, 72 л, ширина 60 см, класс A",
      }).map((row) => [row.key, row.normalizedValue]),
    ).toEqual([
      ["installation_type", "built_in"],
      ["oven_volume_l", "72"],
      ["oven_type", "electric"],
      ["width_cm", "60"],
      ["energy_class", "a"],
      ["power_source", "electric"],
    ]);
  });

  it("extracts slim washer depth and spin speed from supplier name", () => {
    expect(
      buildProductAttributeRows({
        productId: "washer-1",
        name: null,
        supplierName: "Стиральная машина Candy CS34 1052D белый, 5 кг, 1000 об/мин, узкая, глубина 34 см",
      }).map((row) => [row.key, row.normalizedValue]),
    ).toEqual([
      ["load_capacity", "5"],
      ["spin_speed", "1000"],
      ["depth_cm", "34"],
      ["color", "white"],
    ]);
  });

  it("extracts vacuum-specific parameters without electrical fallback noise", () => {
    expect(
      buildProductAttributeRows({
        productId: "vacuum-1",
        name: "Вертикальный пылесос Samsung аккумуляторный, контейнер, мощность 600 Вт, мощность всасывания 200 Вт, HEPA, сухая уборка, 18 В",
        supplierName: null,
      }).map((row) => [row.key, row.normalizedValue]),
    ).toEqual([
      ["vacuum_type", "vertical"],
      ["dust_collector", "container"],
      ["suction_power_w", "200"],
      ["cleaning_type", "dry"],
      ["filter_type", "hepa"],
      ["power_source", "battery"],
      ["power_w", "600"],
      ["battery_voltage", "18"],
    ]);
  });
});
