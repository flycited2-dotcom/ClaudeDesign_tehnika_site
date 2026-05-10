import { describe, expect, it } from "vitest";
import {
  catalogAttributeFacetKeys,
  catalogRangeAttributeKeys,
  getCatalogAttributeDefinition,
  getCatalogAttributeKeysForCategory,
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
});
