import { describe, expect, it } from "vitest";
import { extractProductNameAttributes } from "@/lib/product-attributes";

describe("extractProductNameAttributes", () => {
  it("extracts normalized climate attributes from dehumidifier names", () => {
    expect(
      extractProductNameAttributes("Осушитель воздуха Ballu Vector BD-30L VT белый, 30 л/сутки, 4 л, очистка воздуха"),
    ).toEqual([
      {
        key: "daily_capacity",
        label: "Производительность",
        value: "30 л/сутки",
        normalizedValue: "30",
        numericValue: 30,
        unit: "л/сутки",
        source: "name",
      },
      {
        key: "tank_volume",
        label: "Объем бака",
        value: "4 л",
        normalizedValue: "4",
        numericValue: 4,
        unit: "л",
        source: "name",
      },
      {
        key: "color",
        label: "Цвет",
        value: "Белый",
        normalizedValue: "white",
        numericValue: null,
        unit: null,
        source: "name",
      },
    ]);
  });

  it("extracts TV attributes including diagonal, resolution and smart tv", () => {
    expect(extractProductNameAttributes('Телевизор Samsung UE55CU7100U 55" 4K UHD Smart TV')).toEqual([
      {
        key: "screen_diagonal",
        label: "Диагональ",
        value: '55"',
        normalizedValue: "55",
        numericValue: 55,
        unit: "дюйм",
        source: "name",
      },
      {
        key: "resolution",
        label: "Разрешение",
        value: "4K UHD",
        normalizedValue: "4k_uhd",
        numericValue: null,
        unit: null,
        source: "name",
      },
      {
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

  it("extracts computer memory and storage attributes", () => {
    expect(extractProductNameAttributes("Ноутбук Lenovo IdeaPad 15, 16 ГБ RAM, SSD 512 ГБ")).toEqual([
      {
        key: "ram",
        label: "Оперативная память",
        value: "16 ГБ",
        normalizedValue: "16",
        numericValue: 16,
        unit: "ГБ",
        source: "name",
      },
      {
        key: "storage_type",
        label: "Тип накопителя",
        value: "SSD",
        normalizedValue: "ssd",
        numericValue: null,
        unit: null,
        source: "name",
      },
      {
        key: "storage_capacity",
        label: "Объем накопителя",
        value: "512 ГБ",
        normalizedValue: "512",
        numericValue: 512,
        unit: "ГБ",
        source: "name",
      },
    ]);
  });

  it("extracts garden equipment power attributes from product names", () => {
    expect(extractProductNameAttributes("Снегоуборщик бензиновый Elitech ST 0762LE 7л.с.")).toEqual([
      {
        key: "power_source",
        label: "Тип питания",
        value: "Бензиновый",
        normalizedValue: "petrol",
        numericValue: null,
        unit: null,
        source: "name",
      },
      {
        key: "power_hp",
        label: "Мощность двигателя",
        value: "7 л.с.",
        normalizedValue: "7",
        numericValue: 7,
        unit: "л.с.",
        source: "name",
      },
    ]);
  });

  it("extracts battery voltage and capacity from cordless equipment names", () => {
    expect(extractProductNameAttributes("Газонокосилка аккумуляторная Makita DLM538CT2, 36 В, 5 Ач")).toEqual([
      {
        key: "power_source",
        label: "Тип питания",
        value: "Аккумуляторный",
        normalizedValue: "battery",
        numericValue: null,
        unit: null,
        source: "name",
      },
      {
        key: "battery_voltage",
        label: "Напряжение аккумулятора",
        value: "36 В",
        normalizedValue: "36",
        numericValue: 36,
        unit: "В",
        source: "name",
      },
      {
        key: "battery_capacity",
        label: "Емкость аккумулятора",
        value: "5 Ач",
        normalizedValue: "5",
        numericValue: 5,
        unit: "Ач",
        source: "name",
      },
    ]);
  });

  it("extracts compact battery units without spaces", () => {
    expect(extractProductNameAttributes("Триммер аккумуляторный 18В 4Ач").map((attribute) => attribute.key)).toEqual([
      "power_source",
      "battery_voltage",
      "battery_capacity",
    ]);
  });

  it("extracts electrical cable attributes from product names", () => {
    expect(extractProductNameAttributes("Кабель ВВГнг-LS 3х2,5 ГОСТ, бухта 100 м, белый")).toEqual([
      {
        key: "electrical_product_type",
        label: "Тип электротовара",
        value: "Кабель",
        normalizedValue: "cable",
        numericValue: null,
        unit: null,
        source: "name",
      },
      {
        key: "cable_cores",
        label: "Количество жил",
        value: "3 жилы",
        normalizedValue: "3",
        numericValue: 3,
        unit: "жил",
        source: "name",
      },
      {
        key: "cable_section",
        label: "Сечение кабеля",
        value: "2.5 мм²",
        normalizedValue: "2.5",
        numericValue: 2.5,
        unit: "мм²",
        source: "name",
      },
      {
        key: "cable_length",
        label: "Длина",
        value: "100 м",
        normalizedValue: "100",
        numericValue: 100,
        unit: "м",
        source: "name",
      },
      {
        key: "color",
        label: "Цвет",
        value: "Белый",
        normalizedValue: "white",
        numericValue: null,
        unit: null,
        source: "name",
      },
    ]);
  });

  it("extracts processor and interface attributes from laptop names", () => {
    expect(
      extractProductNameAttributes("Ноутбук ASUS VivoBook 15 Intel Core i5-1235U, 16 ГБ RAM, SSD 512 ГБ, HDMI, Wi-Fi"),
    ).toEqual([
      {
        key: "ram",
        label: "Оперативная память",
        value: "16 ГБ",
        normalizedValue: "16",
        numericValue: 16,
        unit: "ГБ",
        source: "name",
      },
      {
        key: "storage_type",
        label: "Тип накопителя",
        value: "SSD",
        normalizedValue: "ssd",
        numericValue: null,
        unit: null,
        source: "name",
      },
      {
        key: "storage_capacity",
        label: "Объем накопителя",
        value: "512 ГБ",
        normalizedValue: "512",
        numericValue: 512,
        unit: "ГБ",
        source: "name",
      },
      {
        key: "processor_family",
        label: "Процессор",
        value: "Intel Core i5",
        normalizedValue: "intel_core_i5",
        numericValue: null,
        unit: null,
        source: "name",
      },
      {
        key: "processor_model",
        label: "Модель процессора",
        value: "Intel Core i5-1235U",
        normalizedValue: "intel_core_i5_1235u",
        numericValue: null,
        unit: null,
        source: "name",
      },
      {
        key: "interface",
        label: "Интерфейс",
        value: "HDMI",
        normalizedValue: "hdmi",
        numericValue: null,
        unit: null,
        source: "name",
      },
      {
        key: "interface",
        label: "Интерфейс",
        value: "Wi-Fi",
        normalizedValue: "wi_fi",
        numericValue: null,
        unit: null,
        source: "name",
      },
    ]);
  });

  it("does not treat appliance model codes and feature words as electrical or engine attributes", () => {
    const names = [
      "Сушильная машина Korting KD 60HP109",
      "Сушильная машина Weissgauff WD 599 DC Inverter Heat Pump UV Light кл.энер.:A+++ макс.загр.:9кг белый",
      "Сушильная машина Kuppersberg DM 611 W, отдельностоящая, тепловой насос, 8 кг, защита от сминания, белый",
    ];

    for (const name of names) {
      const keys = extractProductNameAttributes(name).map((attribute) => attribute.key);
      expect(keys).not.toContain("power_hp");
      expect(keys).not.toContain("electrical_product_type");
    }
  });

  it("extracts laundry appliance attributes from washer and dryer names", () => {
    expect(
      extractProductNameAttributes(
        "Сушильная машина Kraft KF-DM1001HPW белый, 10 кг, сушка - тепловой насос, программ - 15, 60 x 84 x 62 см, инвертор",
      ).map((attribute) => ({ key: attribute.key, value: attribute.value, normalizedValue: attribute.normalizedValue, numericValue: attribute.numericValue })),
    ).toEqual([
      { key: "load_capacity", value: "10 кг", normalizedValue: "10", numericValue: 10 },
      { key: "drying_type", value: "Тепловой насос", normalizedValue: "heat_pump", numericValue: null },
      { key: "inverter_motor", value: "Да", normalizedValue: "yes", numericValue: null },
      { key: "program_count", value: "15 программ", normalizedValue: "15", numericValue: 15 },
      { key: "width_cm", value: "60 см", normalizedValue: "60", numericValue: 60 },
      { key: "height_cm", value: "84 см", normalizedValue: "84", numericValue: 84 },
      { key: "depth_cm", value: "62 см", normalizedValue: "62", numericValue: 62 },
      { key: "color", value: "Белый", normalizedValue: "white", numericValue: null },
    ]);
  });

  it("extracts spin speed and narrow depth for a slim washing machine", () => {
    const attributes = extractProductNameAttributes(
      "Стиральная машина Bosch WHA122W1OE белый, 7 кг, 1200 об/мин, узкая, глубина 45 см",
    );
    const byKey = Object.fromEntries(attributes.map((attribute) => [attribute.key, attribute]));
    expect(byKey.load_capacity).toMatchObject({ normalizedValue: "7", numericValue: 7 });
    expect(byKey.spin_speed).toMatchObject({ value: "1200 об/мин", normalizedValue: "1200", numericValue: 1200 });
    expect(byKey.depth_cm).toMatchObject({ normalizedValue: "45", numericValue: 45 });
  });

  it("extracts explicit width for a washing machine without full dimension string", () => {
    const attributes = extractProductNameAttributes(
      "Стиральная машина Indesit IWUB 4085 серебристый, 4 кг, ширина 60 см, 800 об/мин",
    );
    const byKey = Object.fromEntries(attributes.map((attribute) => [attribute.key, attribute]));
    expect(byKey.width_cm).toMatchObject({ normalizedValue: "60", numericValue: 60 });
    expect(byKey.spin_speed).toMatchObject({ normalizedValue: "800", numericValue: 800 });
  });

  it("does not read load capacity in kg as a spin speed value", () => {
    const keys = extractProductNameAttributes("Стиральная машина LG F2J3NS0W 6.5 кг").map((attribute) => attribute.key);
    expect(keys).not.toContain("spin_speed");
  });

  it("extracts width for a built-in oven so size filters fill", () => {
    const attributes = extractProductNameAttributes(
      "Духовой шкаф Bosch HBG675BS1 электрическая, встраиваемая, 71 л, ширина 60 см, класс A",
    );
    const byKey = Object.fromEntries(attributes.map((attribute) => [attribute.key, attribute]));
    expect(byKey.installation_type).toMatchObject({ normalizedValue: "built_in" });
    expect(byKey.oven_volume_l).toMatchObject({ normalizedValue: "71", numericValue: 71 });
    expect(byKey.width_cm).toMatchObject({ normalizedValue: "60", numericValue: 60 });
    expect(byKey.oven_type).toMatchObject({ normalizedValue: "electric" });
  });

  it("does not stamp smart_tv onto non-TV products that mention smart features", () => {
    const guards = [
      "Смартфон Samsung Galaxy A55 256 ГБ",
      'Посудомоечная машина Bosch с функцией Smart, 60 см, 14 комплектов',
      "Умные смарт-весы кухонные",
    ];
    for (const name of guards) {
      const keys = extractProductNameAttributes(name).map((attribute) => attribute.key);
      expect(keys).not.toContain("smart_tv");
    }
  });

  it("tags smart_tv only for an actual television", () => {
    const keys = extractProductNameAttributes('Телевизор LG OLED55C3 55" 4K Смарт ТВ').map((attribute) => attribute.key);
    expect(keys).toContain("smart_tv");
    expect(keys).toContain("screen_diagonal");
    expect(keys).toContain("resolution");
  });

  it("extracts vacuum cordless type and suction power without unit confusion", () => {
    const attributes = extractProductNameAttributes(
      "Робот-пылесос Xiaomi аккумуляторный, контейнер, мощность всасывания 4000 Па недоступна, мощность всасывания 250 Вт, HEPA",
    );
    const byKey = Object.fromEntries(attributes.map((attribute) => [attribute.key, attribute]));
    expect(byKey.vacuum_type).toMatchObject({ normalizedValue: "robot" });
    expect(byKey.dust_collector).toMatchObject({ normalizedValue: "container" });
    expect(byKey.suction_power_w).toMatchObject({ normalizedValue: "250", numericValue: 250 });
    expect(byKey.power_source).toMatchObject({ normalizedValue: "battery" });
    expect(byKey.filter_type).toMatchObject({ normalizedValue: "hepa" });
  });

  it("does not invent attributes when the name has no recognizable pattern", () => {
    expect(extractProductNameAttributes("Подарочный набор Космос")).toEqual([]);
    expect(extractProductNameAttributes("   ")).toEqual([]);
    expect(extractProductNameAttributes(null)).toEqual([]);
  });
});
