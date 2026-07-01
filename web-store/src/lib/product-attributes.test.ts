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

  // Regression corpus: real (or realistic) product names that were — or plausibly
  // could be — misread by extractElectricalProductType because a keyword it looks
  // for shows up describing something else entirely. Add a new row here whenever
  // prod QA finds another one; no need to write a bespoke test each time.
  describe("known false-positive product names for electrical_product_type", () => {
    const cases: Array<[string, string]> = [
      [
        "CCTV camera describing its own cable interface (Кабель 1×RJ-45)",
        "IP-камера видеонаблюдения уличная 5 Мп, объектив 3.6 мм, ИК-подсветка, Кабель 1×RJ-45, 1920х1080, IP66",
      ],
      [
        "PC cooler with a 'Color Box' packaging note",
        "Кулер для процессора Deepcool AK400 120 мм, 4-pin PWM, Color Box",
      ],
      [
        "PC cooler with a 'Retail Box' packaging note",
        "Кулер для процессора DeepCool GAMMAXX 400 V2, Retail Box",
      ],
      [
        "TV listing its own HDMI/USB ports as 'разъемы'",
        "Телевизор Samsung UE55TU7000UXRU, 55 дюймов, разъемы 2x HDMI, 1x USB, Smart TV",
      ],
      ["Nintendo Switch game console", "Игровая консоль Nintendo Switch OLED 64GB белый"],
      [
        "Network switch (English 'Switch') is not an on/off Выключатель",
        "Неуправляемый коммутатор ORIGO Unmanaged Switch 8x1000Base-T, 2x1000Base-X SFP, metal case",
      ],
      [
        "Network switch's battery-backup connector is not a standalone Коннектор",
        "Коммутатор управляемый SNR 2+, 24 порта 10/100/1000Base-T, 4 порта 1/10G SFP+, встроенный БП ~220V AC, разъем для АКБ 12V с возможностью заряда",
      ],
      [
        "Network switch model code ending in '-Box' is not a Коробка/щит",
        "Уличный гигабитный управляемый 4 портовый PoE-коммутатор TFortis PSW-1G4F-Box ; 802.3af; 1х1000Base-X SFP, 1x10/100/1000Base-Т, 4х10/100Base-Tx RJ-45 с РоЕ по 15.4 Вт",
      ],
      [
        "Network switch described as '2-проводной' is not a Кабель",
        "Коммутатор Fanvil PN24, 24×100 Мбит/с (2-проводной), неуправляемый",
      ],
      [
        "Cable channel (кабель-канал) whose W×H dimension is not a core count",
        "Короб перфорированный кабель-канал 40х20мм, 2м, белый",
      ],
      [
        "Cable tie (стяжка кабельная) whose width×length is not a core count",
        "Стяжка кабельная 4.8х300 нейлоновая черная (уп.100шт) DKC",
      ],
      [
        "Cable lug (наконечник кабельный) whose pin size is not a core count",
        "Наконечник кабельный медный луженый, с изолирующей втулкой, 7.6 х 280 мм, 10 шт",
      ],
    ];

    it.each(cases)("%s", (_label, name) => {
      const keys = extractProductNameAttributes(name).map((attribute) => attribute.key);
      expect(keys).not.toContain("electrical_product_type");
    });
  });

  it("does not read a supported resolution as cable cores/section on a genuine HDMI cable", () => {
    const attributes = extractProductNameAttributes("Кабель HDMI 2.1, 8K 60Hz, поддержка 3840x2160, длина 2м");
    const byKey = Object.fromEntries(attributes.map((a) => [a.key, a]));
    expect(byKey.electrical_product_type).toMatchObject({ value: "Кабель" });
    expect(byKey.cable_cores).toBeUndefined();
    expect(byKey.cable_section).toBeUndefined();
  });

  it("uses the real product category to suppress electrical classification when a bare model-code name gives no textual hint", () => {
    const keys = extractProductNameAttributes(
      "DH-IPC-HFW1230SP-0360B-S5, кабель, 1920x1080, ИК 30м",
      "Камеры видеонаблюдения",
    ).map((attribute) => attribute.key);
    expect(keys).not.toContain("electrical_product_type");
  });

  it("still classifies a genuine cable product when the category is a real electrical-accessory category", () => {
    const keys = extractProductNameAttributes("Кабель ВВГнг-LS 3х2,5 ГОСТ, бухта 100 м, белый", "Кабельная продукция").map(
      (attribute) => attribute.key,
    );
    expect(keys).toContain("electrical_product_type");
  });

  it("suppresses electrical classification for ANY non-electrical real catalog category, not just camera/cooling", () => {
    const keys = extractProductNameAttributes("Ноутбук ASUS X515EA-BQ2622, кабель в комплекте, 15.6 FHD", "Ноутбуки").map(
      (attribute) => attribute.key,
    );
    expect(keys).not.toContain("electrical_product_type");
  });

  it("still recognizes a real electrical-accessory category outside camera/cooling", () => {
    const keys = extractProductNameAttributes("Розетка Legrand Valena 2К+З белый", "Розетки, выключатели и рамки").map(
      (attribute) => attribute.key,
    );
    expect(keys).toContain("electrical_product_type");
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

  it("reads '10 л, сенсор' on аэрогриль as volume, not as л.с. (power_hp)", () => {
    const byKey = Object.fromEntries(
      extractProductNameAttributes("Аэрогриль Brayer 2048BR черный, 2500 Вт, 10 л, сенсор, 10 программ").map(
        (attribute) => [attribute.key, attribute],
      ),
    );
    expect(byKey.power_hp).toBeUndefined();
    expect(byKey.volume_l).toMatchObject({ numericValue: 10, unit: "л" });
    expect(byKey.power_w).toMatchObject({ numericValue: 2500 });
  });

  it("does not read litres before an 's'-word as л.с. on other kitchen appliances", () => {
    const byKey = Object.fromEntries(
      extractProductNameAttributes("Мультиварка Redmond RMC-M90 черная, 5 л, скороварка, 45 программ").map(
        (attribute) => [attribute.key, attribute],
      ),
    );
    expect(byKey.power_hp).toBeUndefined();
    expect(byKey.volume_l).toMatchObject({ numericValue: 5, unit: "л" });
  });

  it("still extracts real л.с. on engine products", () => {
    const byKey = Object.fromEntries(
      extractProductNameAttributes("Мотоблок Patriot Победа 7 л.с. бензиновый").map((attribute) => [
        attribute.key,
        attribute,
      ]),
    );
    expect(byKey.power_hp).toMatchObject({ numericValue: 7, unit: "л.с." });
  });

  it("extracts cooktop type and burner count for a built-in induction hob (варочная панель)", () => {
    const attributes = extractProductNameAttributes("Индукционная варочная панель Gefest PVI 4234 15718000, черный, 4 конфорки, 60 см");
    const byKey = Object.fromEntries(attributes.map((attribute) => [attribute.key, attribute]));
    expect(byKey.cooktop_type).toMatchObject({ value: "Индукционная", normalizedValue: "induction" });
    expect(byKey.burner_count).toMatchObject({ normalizedValue: "4", numericValue: 4 });
    expect(byKey.width_cm).toMatchObject({ normalizedValue: "60", numericValue: 60 });
  });

  it("extracts gas cooktop type for a варочная поверхность (gate must match Cyrillic endings)", () => {
    const attributes = extractProductNameAttributes("Газовая варочная поверхность Beko HDCG 32220 FX, нержавеющая сталь");
    const byKey = Object.fromEntries(attributes.map((attribute) => [attribute.key, attribute]));
    expect(byKey.cooktop_type).toMatchObject({ value: "Газовая", normalizedValue: "gas" });
  });

  it("extracts IP rating for an electrical accessory (not just cameras)", () => {
    const attributes = extractProductNameAttributes("Выключатель влагозащищенный IP54 белый");
    const byKey = Object.fromEntries(attributes.map((attribute) => [attribute.key, attribute]));
    expect(byKey.ip_rating).toMatchObject({ value: "IP54", normalizedValue: "ip54" });
  });

  it("recognizes рамка (frame), переключатель (changeover switch) and терморегулятор as electrical types", () => {
    const frame = extractProductNameAttributes("Рамка на 3 поста (белый, basic) W0032001");
    expect(Object.fromEntries(frame.map((a) => [a.key, a])).electrical_product_type).toMatchObject({
      value: "Рамка",
      normalizedValue: "frame",
    });

    const changeover = extractProductNameAttributes("Переключатель проходной Kranz Mini OG открытой установки, IP54 белый");
    expect(Object.fromEntries(changeover.map((a) => [a.key, a])).electrical_product_type).toMatchObject({
      value: "Переключатель",
      normalizedValue: "changeover_switch",
    });

    const thermostat = extractProductNameAttributes("Терморегулятор ALFA Графит мягкое касание 16A-250V");
    expect(Object.fromEntries(thermostat.map((a) => [a.key, a])).electrical_product_type).toMatchObject({
      value: "Терморегулятор",
      normalizedValue: "thermostat",
    });
  });

  it("does not mistake an unrelated переключатель (gear shifter) or a bare рамка mention for an electrical accessory", () => {
    const gearShifter = extractProductNameAttributes("Переключатель передач Shimano Deore 9 скоростей");
    expect(Object.fromEntries(gearShifter.map((a) => [a.key, a])).electrical_product_type).toBeUndefined();

    const bareFrame = extractProductNameAttributes("Рамка для номерного знака хром");
    expect(Object.fromEntries(bareFrame.map((a) => [a.key, a])).electrical_product_type).toBeUndefined();
  });

  it("extracts mount_type and gang_count for electrical accessories", () => {
    const open = extractProductNameAttributes("Переключатель проходной Kranz Mini OG открытой установки, IP54 белый");
    expect(Object.fromEntries(open.map((a) => [a.key, a])).mount_type).toMatchObject({ value: "Открытая", normalizedValue: "surface" });

    const flush = extractProductNameAttributes("Розетка скрытой установки 2-м, белая");
    const flushByKey = Object.fromEntries(flush.map((a) => [a.key, a]));
    expect(flushByKey.mount_type).toMatchObject({ value: "Скрытая", normalizedValue: "flush" });

    const digitGang = extractProductNameAttributes("Systeme Electric ArtGallery Шампань Выключатель 4-клавишный сценарный, сх. 1");
    expect(Object.fromEntries(digitGang.map((a) => [a.key, a])).gang_count).toMatchObject({ normalizedValue: "4", numericValue: 4 });

    const wordGang = extractProductNameAttributes("Выключатель двухклавишный с самовозвратом (айвори матовый)");
    expect(Object.fromEntries(wordGang.map((a) => [a.key, a])).gang_count).toMatchObject({ normalizedValue: "2", numericValue: 2 });

    const postGang = extractProductNameAttributes("Рамка на 3 поста (белый, basic) W0032001");
    expect(Object.fromEntries(postGang.map((a) => [a.key, a])).gang_count).toMatchObject({ normalizedValue: "3", numericValue: 3 });
  });

  it("does not extract mount_type from a 2-letter abbreviation (СП/ОП) to avoid false positives", () => {
    const attributes = extractProductNameAttributes("Розетка 2-м СП Glossa с заземл. в сборе бел. SchE GSL000124");
    expect(Object.fromEntries(attributes.map((a) => [a.key, a])).mount_type).toBeUndefined();
  });

  it("recognizes additional finish colors common on electrical accessories (Мокко/Шампань/Слоновая кость/Айвори/Графит)", () => {
    const cases: Array<[string, string, string]> = [
      ["Systeme Electric ArtGallery Мокко Выключатель 1-клавишный кнопочный", "Мокко", "mocha"],
      ["Systeme Electric ArtGallery Шампань Выключатель 4-клавишный сценарный", "Шампань", "champagne"],
      ["Jasmart G-Classic Слоновая кость Рамка 2-постовая", "Слоновая кость", "ivory"],
      ["Выключатель двухклавишный с самовозвратом (айвори матовый)", "Айвори", "ivory"],
      ["Комплект механизма терморегулятора ALFA Графит мягкое касание", "Графит", "graphite"],
    ];
    for (const [name, expectedValue, expectedNormalized] of cases) {
      const byKey = Object.fromEntries(extractProductNameAttributes(name).map((a) => [a.key, a]));
      expect(byKey.color, `color for "${name}"`).toMatchObject({ value: expectedValue, normalizedValue: expectedNormalized });
    }
  });

  it("extracts port_count, poe_support and managed_type for network switches", () => {
    const unmanaged = extractProductNameAttributes(
      "Неуправляемый коммутатор Trassir TR-NS14282С-370-24POE с24 PoE портами (10/100/1000 Мбит/с Base-T PoE port)",
    );
    const unmanagedByKey = Object.fromEntries(unmanaged.map((a) => [a.key, a]));
    expect(unmanagedByKey.port_count).toMatchObject({ normalizedValue: "24", numericValue: 24 });
    expect(unmanagedByKey.poe_support).toMatchObject({ value: "Да" });
    expect(unmanagedByKey.managed_type).toMatchObject({ value: "Неуправляемый", normalizedValue: "unmanaged" });

    const managed = extractProductNameAttributes("Коммутатор Dahua DH-CS4006-4GT-60, 4×1 Гбит/с + 2×1 Гбит/с Combo, управляемый");
    expect(Object.fromEntries(managed.map((a) => [a.key, a])).managed_type).toMatchObject({ value: "Управляемый", normalizedValue: "managed" });
  });

  it("extracts bare lens focal length (no объектив/фокус keyword) for CCTV camera names", () => {
    const withRange = extractProductNameAttributes("Видеокамера IP Dahua DH-IPC-HFW3249EP-AS-LED-0360B 3.6-3.6мм цветная корп.:белый");
    expect(Object.fromEntries(withRange.map((a) => [a.key, a])).camera_lens_mm).toMatchObject({ normalizedValue: "3.6", numericValue: 3.6 });

    const bare = extractProductNameAttributes("Купольная IP-камера видеонаблюдения Hikvision DS-2CD1343G0-I 4мм");
    expect(Object.fromEntries(bare.map((a) => [a.key, a])).camera_lens_mm).toMatchObject({ normalizedValue: "4", numericValue: 4 });
  });

  it("does not mistake camera housing dimensions for a lens focal length", () => {
    const attributes = extractProductNameAttributes("Камера видеонаблюдения корпус 120х80х60 мм");
    expect(Object.fromEntries(attributes.map((a) => [a.key, a])).camera_lens_mm).toBeUndefined();
  });

  it("extracts camera_type and night_vision for CCTV cameras", () => {
    const dome = extractProductNameAttributes("Купольная IP-камера видеонаблюдения Hikvision DS-2CD1343G0-I 4мм, ИК-подсветка до 30м");
    const byKey = Object.fromEntries(dome.map((a) => [a.key, a]));
    expect(byKey.camera_type).toMatchObject({ value: "Купольная", normalizedValue: "dome" });
    expect(byKey.night_vision).toMatchObject({ value: "Да" });

    const bullet = extractProductNameAttributes("Цилиндрическая камера видеонаблюдения Dahua DH-IPC-HFW1239");
    expect(Object.fromEntries(bullet.map((a) => [a.key, a])).camera_type).toMatchObject({ value: "Цилиндрическая", normalizedValue: "bullet" });
  });

  it("extracts fan_size_mm, noise_db, rpm and has_argb for PC cooling products", () => {
    const aio = extractProductNameAttributes(
      "Водяное охлаждение для процессора Thermalright Frozen Notte 240 черный ARGB V2 (240мм, Black, ARGB/ Fans: 2x120мм, 72.37CFM, 27.7dBA, 2000RPM)",
    );
    const aioByKey = Object.fromEntries(aio.map((a) => [a.key, a]));
    expect(aioByKey.fan_size_mm).toMatchObject({ normalizedValue: "240", numericValue: 240 });
    expect(aioByKey.noise_db).toMatchObject({ normalizedValue: "27.7", numericValue: 27.7 });
    expect(aioByKey.rpm).toMatchObject({ normalizedValue: "2000", numericValue: 2000 });
    expect(aioByKey.has_argb).toMatchObject({ value: "Да" });

    const caseFan = extractProductNameAttributes("Вентилятор корпусной Noctua NF-A12x25 PWM, 120 мм, 450-2000 об/мин, 22.6 дБ, 4-pin PWM, без подсветки");
    const caseFanByKey = Object.fromEntries(caseFan.map((a) => [a.key, a]));
    expect(caseFanByKey.fan_size_mm).toMatchObject({ normalizedValue: "120", numericValue: 120 });
    expect(caseFanByKey.noise_db).toMatchObject({ normalizedValue: "22.6", numericValue: 22.6 });
    expect(caseFanByKey.rpm).toMatchObject({ normalizedValue: "2000", numericValue: 2000 });
    expect(caseFanByKey.has_argb).toBeUndefined();
  });
});
