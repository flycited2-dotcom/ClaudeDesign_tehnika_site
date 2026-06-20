import { describe, expect, it } from "vitest";
import {
  catalogFilterDuplicates,
  getSpecOwnedAttributeKeys,
  isSpecShortcutDuplicate,
  pruneFacetValues,
  removeSpecDuplicatedAttributeKeys,
} from "@/lib/catalog-filter-relevance";

describe("catalog filter relevance — B1 dedup", () => {
  it("hides attr facets that duplicate a boolean spec preset", () => {
    const owned = getSpecOwnedAttributeKeys();
    expect(owned.has("fridge_no_frost")).toBe(true);
    expect(owned.has("smart_tv")).toBe(true);
    expect(owned.has("inverter_motor")).toBe(true);
    // Enum/numeric duplicates stay as structural facets.
    expect(owned.has("resolution")).toBe(false);
    expect(owned.has("screen_diagonal")).toBe(false);
    expect(owned.has("width_cm")).toBe(false);
  });

  it("removes only boolean-spec-owned attr keys, preserving order and the rest", () => {
    const input = ["total_volume_l", "fridge_no_frost", "energy_class", "smart_tv", "screen_diagonal", "inverter_motor", "color"];
    expect(removeSpecDuplicatedAttributeKeys(input)).toEqual([
      "total_volume_l",
      "energy_class",
      "screen_diagonal",
      "color",
    ]);
  });

  it("is a no-op when no spec-owned key is present", () => {
    expect(removeSpecDuplicatedAttributeKeys(["load_capacity", "spin_speed", "color"])).toEqual([
      "load_capacity",
      "spin_speed",
      "color",
    ]);
  });

  it("flags enum/numeric spec presets as shortcuts but not boolean-owned ones", () => {
    expect(isSpecShortcutDuplicate("tv_4k")).toBe(true);
    expect(isSpecShortcutDuplicate("tv_55_plus")).toBe(true);
    expect(isSpecShortcutDuplicate("storage_ssd")).toBe(true);
    expect(isSpecShortcutDuplicate("washer_narrow")).toBe(true);
    // Boolean-owned presets are NOT shortcuts (they own their criterion).
    expect(isSpecShortcutDuplicate("fridge_no_frost")).toBe(false);
    expect(isSpecShortcutDuplicate("tv_smart")).toBe(false);
    // Non-duplicate presets are not shortcuts.
    expect(isSpecShortcutDuplicate("garden_trimmer")).toBe(false);
  });

  it("never marks the same attr key as both spec-owned and attr-owned", () => {
    const specKeys = new Set(catalogFilterDuplicates.filter((d) => d.ownership === "spec").map((d) => d.attrKey));
    const attrKeys = new Set(catalogFilterDuplicates.filter((d) => d.ownership === "attr").map((d) => d.attrKey));
    for (const key of specKeys) {
      expect(attrKeys.has(key)).toBe(false);
    }
  });
});

describe("catalog filter relevance — B3 pruning", () => {
  it("drops values below the default threshold (< 3)", () => {
    const values = [
      { value: "width_cm:45", count: 12 },
      { value: "width_cm:60", count: 2 },
      { value: "width_cm:90", count: 1 },
    ];
    expect(pruneFacetValues(values)).toEqual([{ value: "width_cm:45", count: 12 }]);
  });

  it("respects a custom minCount", () => {
    const values = [
      { value: "a", count: 5 },
      { value: "b", count: 4 },
    ];
    expect(pruneFacetValues(values, { minCount: 5 })).toEqual([{ value: "a", count: 5 }]);
  });

  it("keeps active values even when their count is below threshold", () => {
    const values = [
      { value: "width_cm:45", count: 12 },
      { value: "width_cm:90", count: 1 },
    ];
    expect(pruneFacetValues(values, { activeValues: ["width_cm:90"] })).toEqual([
      { value: "width_cm:45", count: 12 },
      { value: "width_cm:90", count: 1 },
    ]);
  });

  it("removes blacklisted normalized values regardless of count, unless active", () => {
    const values = [
      { value: "color:white", normalizedValue: "white", count: 20 },
      { value: "color:-", normalizedValue: "-", count: 50 },
      { value: "color:none", normalizedValue: "не указано", count: 99 },
    ];
    expect(pruneFacetValues(values)).toEqual([{ value: "color:white", normalizedValue: "white", count: 20 }]);
  });

  it("keeps a blacklisted value when it is currently selected", () => {
    const values = [{ value: "color:-", normalizedValue: "-", count: 50 }];
    expect(pruneFacetValues(values, { activeValues: ["color:-"] })).toEqual([
      { value: "color:-", normalizedValue: "-", count: 50 },
    ]);
  });

  it("accepts a custom blacklist", () => {
    const values = [
      { value: "x:good", normalizedValue: "good", count: 10 },
      { value: "x:junk", normalizedValue: "junk", count: 10 },
    ];
    expect(pruneFacetValues(values, { blacklist: ["junk"] })).toEqual([
      { value: "x:good", normalizedValue: "good", count: 10 },
    ]);
  });
});
