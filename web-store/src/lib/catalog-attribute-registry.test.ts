import { describe, expect, it } from "vitest";
import {
  catalogAttributeFacetKeys,
  catalogRangeAttributeKeys,
  getCatalogAttributeDefinition,
  getCatalogAttributeFamilyForCategory,
  getCatalogAttributeKeysForCategory,
  getCatalogAttributeMarketingRank,
} from "@/lib/catalog-attribute-registry";

describe("catalog attribute registry", () => {
  it("keeps filterable keys ordered and exposes numeric range keys", () => {
    expect(catalogAttributeFacetKeys.slice(0, 4)).toEqual(["storage_type", "storage_capacity", "ram", "screen_diagonal"]);
    expect(catalogRangeAttributeKeys).toContain("storage_capacity");
    expect(catalogRangeAttributeKeys).toContain("power_hp");
    expect(catalogRangeAttributeKeys).toContain("cable_section");
  });

  it("returns UI metadata for new electrical and computer attributes", () => {
    expect(getCatalogAttributeDefinition("cable_section")).toMatchObject({
      label: "Сечение кабеля",
      valueType: "number",
      unit: "мм²",
      control: "range",
    });
    expect(getCatalogAttributeDefinition("processor_family")).toMatchObject({
      label: "Процессор",
      valueType: "enum",
      control: "checkbox",
    });
  });

  it("limits laundry categories to laundry-relevant attributes", () => {
    const keys = getCatalogAttributeKeysForCategory({ categoryName: "Сушильные машины", categorySlug: "sushilnye-mashiny-18029" });

    expect(keys).toEqual(expect.arrayContaining(["load_capacity", "drying_type", "inverter_motor", "depth_cm", "program_count", "color"]));
    expect(keys).not.toContain("power_hp");
    expect(keys).not.toContain("electrical_product_type");
    expect(keys).not.toContain("cable_section");
  });

  it("keeps electrical filters available only in electrical categories", () => {
    const keys = getCatalogAttributeKeysForCategory({ categoryName: "Кабель и провод", categorySlug: "kabel-i-provod" });

    expect(keys).toEqual(expect.arrayContaining(["electrical_product_type", "cable_section", "cable_cores", "voltage", "ip_rating"]));
    expect(keys).not.toContain("load_capacity");
    expect(keys).not.toContain("drying_type");
  });

  it("exposes mount_type and gang_count as electrical-only filters", () => {
    expect(getCatalogAttributeDefinition("mount_type")).toMatchObject({ label: "Установка", valueType: "enum", control: "checkbox" });
    expect(getCatalogAttributeDefinition("gang_count")).toMatchObject({ label: "Количество клавиш/постов", valueType: "number", control: "range", unit: "шт." });

    const electricalKeys = getCatalogAttributeKeysForCategory({ categoryName: "Розетки, выключатели и рамки" });
    expect(electricalKeys).toEqual(expect.arrayContaining(["mount_type", "gang_count", "electrical_product_type", "ip_rating"]));

    const laundryKeys = getCatalogAttributeKeysForCategory({ categoryName: "Стиральные машины" });
    expect(laundryKeys).not.toContain("mount_type");
    expect(laundryKeys).not.toContain("gang_count");
  });

  it("detects category families from transliterated slugs without short-token collisions", () => {
    const cableKeys = getCatalogAttributeKeysForCategory({
      categorySlug: "kabeli-i-provoda-dlya-stroitelstva-i-remonta-10560",
    });
    const dryerKeys = getCatalogAttributeKeysForCategory({ categorySlug: "sushilnye-mashiny-18029" });

    expect(cableKeys).toEqual(expect.arrayContaining(["electrical_product_type", "cable_section", "cable_cores"]));
    expect(cableKeys).not.toContain("screen_diagonal");
    expect(dryerKeys).toEqual(expect.arrayContaining(["load_capacity", "drying_type", "program_count"]));
    expect(dryerKeys).not.toContain("power_hp");
  });

  it("does not leak electrical or garden filters into small appliances and vacuums", () => {
    const applianceKeys = getCatalogAttributeKeysForCategory({ categorySlug: "melkaya-tehnika-dlya-doma-9907" });
    const vacuumKeys = getCatalogAttributeKeysForCategory({ categorySlug: "pylesosy-15454" });

    expect(applianceKeys).toEqual(expect.arrayContaining(["power_w", "voltage", "volume_l", "color"]));
    expect(applianceKeys).not.toContain("electrical_product_type");
    expect(applianceKeys).not.toContain("cable_section");
    expect(applianceKeys).not.toContain("power_hp");

    expect(vacuumKeys).toEqual(expect.arrayContaining(["vacuum_type", "dust_collector", "suction_power_w", "power_w", "battery_voltage"]));
    expect(vacuumKeys).not.toContain("electrical_product_type");
    expect(vacuumKeys).not.toContain("cable_section");
    expect(vacuumKeys).not.toContain("load_capacity");
  });

  it("returns refrigerator, camera, paper and tire specific filters", () => {
    expect(getCatalogAttributeKeysForCategory({ categoryName: "Холодильники", categorySlug: "holodilniki" })).toEqual(
      expect.arrayContaining(["fridge_no_frost", "total_volume_l", "freezer_position", "energy_class", "color"]),
    );
    expect(getCatalogAttributeKeysForCategory({ categoryName: "Видеокамеры", categorySlug: "videokamery" })).toEqual(
      expect.arrayContaining(["camera_lens_mm", "resolution", "interface", "ip_rating"]),
    );
    expect(getCatalogAttributeKeysForCategory({ categoryName: "Бумага офисная", categorySlug: "bumaga-ofisnaya" })).toEqual(
      expect.arrayContaining(["paper_format", "paper_density", "paper_whiteness", "sheet_count"]),
    );
    expect(getCatalogAttributeKeysForCategory({ categoryName: "Автомобильные шины", categorySlug: "avtomobilnye-shiny" })).toEqual(
      expect.arrayContaining(["tire_width", "tire_profile", "rim_diameter", "tire_season"]),
    );
  });

  describe("B2 — first-wave category → family mapping", () => {
    const cases: Array<{ family: string; categories: Array<{ name?: string; slug?: string }> }> = [
      {
        family: "refrigeration",
        categories: [
          { name: "Холодильники и морозильники", slug: "holodilniki-i-morozilniki" },
          { name: "Морозильные камеры", slug: "morozilnye-kamery-12345" },
          { name: "Холодильно-морозильные шкафы", slug: "holodilno-morozilnye-shkafy" },
        ],
      },
      {
        family: "laundry",
        categories: [
          { name: "Стиральные машины", slug: "stiralnye-mashiny-100" },
          { name: "Сушильные машины", slug: "sushilnye-mashiny-18029" },
          { name: "Стирально-сушильные машины", slug: "stiralno-sushilnye-mashiny" },
        ],
      },
      {
        family: "tv",
        categories: [
          { name: "Телевизоры", slug: "televizory-9000" },
          { name: "Телевизоры и аксессуары", slug: "tv-i-aksessuary" },
          { name: "LED-телевизоры", slug: "led-televizory" },
        ],
      },
      {
        family: "appliance",
        categories: [
          { name: "Посудомоечные машины", slug: "posudomoechnye-mashiny-700" },
          { name: "Духовые шкафы", slug: "duhovye-shkafy-800" },
          { name: "Варочные панели", slug: "varochnye-paneli-810" },
          { name: "Вытяжки кухонные", slug: "vytyazhki-kuhonnye-820" },
          { name: "Микроволновые печи (СВЧ)", slug: "mikrovolnovye-pechi-svch-830" },
          { name: "Кофемашины", slug: "kofemashiny-840" },
          { name: "Встраиваемая техника", slug: "vstraivaemaya-tehnika-850" },
        ],
      },
      {
        family: "climate",
        categories: [
          { name: "Кондиционеры сплит-системы", slug: "kondicionery-split-sistemy" },
          { name: "Осушители воздуха", slug: "osushiteli-vozduha" },
          { name: "Увлажнители воздуха", slug: "uvlazhniteli-vozduha" },
        ],
      },
      {
        family: "cleaning",
        categories: [
          { name: "Пылесосы", slug: "pylesosy-15454" },
          { name: "Роботы-пылесосы", slug: "roboty-pylesosy" },
          { name: "Пароочистители", slug: "paroochistiteli" },
        ],
      },
    ];

    for (const { family, categories } of cases) {
      for (const category of categories) {
        it(`maps ${category.name ?? category.slug} → ${family}`, () => {
          expect(
            getCatalogAttributeFamilyForCategory({ categoryName: category.name, categorySlug: category.slug }),
          ).toBe(family);
        });
      }
    }

    it("routes dishwashers to appliance, not dishes (посуд collision)", () => {
      expect(getCatalogAttributeFamilyForCategory({ categoryName: "Посудомоечные машины" })).toBe("appliance");
      // Tableware still maps to dishes.
      expect(getCatalogAttributeFamilyForCategory({ categoryName: "Посуда и кухонные принадлежности" })).toBe("dishes");
    });

    it("exposes built-in kitchen attributes for appliance categories", () => {
      const keys = getCatalogAttributeKeysForCategory({ categoryName: "Духовые шкафы", categorySlug: "duhovye-shkafy" });
      expect(keys).toEqual(expect.arrayContaining(["oven_type", "oven_volume_l", "energy_class", "installation_type", "width_cm"]));
      const hobKeys = getCatalogAttributeKeysForCategory({ categoryName: "Варочные панели" });
      expect(hobKeys).toEqual(expect.arrayContaining(["cooktop_type", "burner_count"]));
    });
  });

  it("routes routers/switches to a new network family, not electrical (провод collision guard)", () => {
    expect(
      getCatalogAttributeFamilyForCategory({
        categoryName: "Проводные роутеры (маршрутизаторы) и коммутаторы",
        categorySlug: "provodnye-routery-marshrutizatory-i-kommutatory",
      }),
    ).toBe("network");

    const keys = getCatalogAttributeKeysForCategory({ categoryName: "Проводные роутеры (маршрутизаторы) и коммутаторы" });
    expect(keys).toEqual(expect.arrayContaining(["port_count", "poe_support", "managed_type"]));
    expect(keys).not.toContain("cable_section");
    expect(keys).not.toContain("electrical_product_type");
  });

  describe("B4 — marketing order of attributes inside a family", () => {
    it("orders refrigerator attributes: volume → No Frost → energy → freezer position → sizes", () => {
      const keys = getCatalogAttributeKeysForCategory({ categoryName: "Холодильники", categorySlug: "holodilniki" });
      const indexOf = (key: string) => keys.indexOf(key);
      expect(indexOf("total_volume_l")).toBeGreaterThanOrEqual(0);
      expect(indexOf("total_volume_l")).toBeLessThan(indexOf("fridge_no_frost"));
      expect(indexOf("fridge_no_frost")).toBeLessThan(indexOf("energy_class"));
      expect(indexOf("energy_class")).toBeLessThan(indexOf("freezer_position"));
      expect(indexOf("freezer_position")).toBeLessThan(indexOf("width_cm"));
    });

    it("orders washer attributes: load → spin → narrow(width) → inverter → programs → sizes", () => {
      const keys = getCatalogAttributeKeysForCategory({ categoryName: "Стиральные машины", categorySlug: "stiralnye-mashiny" });
      const indexOf = (key: string) => keys.indexOf(key);
      expect(indexOf("load_capacity")).toBeLessThan(indexOf("spin_speed"));
      expect(indexOf("spin_speed")).toBeLessThan(indexOf("width_cm"));
      expect(indexOf("width_cm")).toBeLessThan(indexOf("inverter_motor"));
      expect(indexOf("inverter_motor")).toBeLessThan(indexOf("program_count"));
    });

    it("orders TV attributes: diagonal → resolution → Smart", () => {
      const keys = getCatalogAttributeKeysForCategory({ categoryName: "Телевизоры", categorySlug: "televizory" });
      const indexOf = (key: string) => keys.indexOf(key);
      expect(indexOf("screen_diagonal")).toBeLessThan(indexOf("resolution"));
      expect(indexOf("resolution")).toBeLessThan(indexOf("smart_tv"));
    });

    it("ranks unknown/unordered keys after prioritized ones and returns 1000 without a family", () => {
      expect(getCatalogAttributeMarketingRank("total_volume_l", "refrigeration")).toBe(0);
      expect(getCatalogAttributeMarketingRank("color", "refrigeration")).toBe(1000);
      expect(getCatalogAttributeMarketingRank("anything", null)).toBe(1000);
    });
  });

  it("exposes camera_type and night_vision for the camera family", () => {
    expect(getCatalogAttributeDefinition("camera_type")).toMatchObject({ label: "Тип камеры", valueType: "enum", control: "checkbox" });
    expect(getCatalogAttributeDefinition("night_vision")).toMatchObject({ label: "ИК-подсветка", valueType: "boolean", control: "checkbox" });
    const keys = getCatalogAttributeKeysForCategory({ categoryName: "Камеры видеонаблюдения" });
    expect(keys).toEqual(expect.arrayContaining(["camera_type", "night_vision", "camera_lens_mm", "ip_rating"]));
  });
});
