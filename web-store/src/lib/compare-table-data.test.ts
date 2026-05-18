import { describe, expect, it } from "vitest";
import { buildCompareRows, type CompareProduct } from "@/lib/compare-table-data";

// Minimal product factory — only fields used by buildCompareRows. Cast keeps
// the test compact; full Product has many irrelevant DB-side fields.
function mkProduct(
  overrides: Partial<{
    sku: number;
    vendor: string | null;
    part: string | null;
    isAvailable: boolean;
    retailPrice: number | null;
    warranty: number | null;
    weight: number | null;
    volume: number | null;
    attributes: Array<{ key: string; value: string }>;
  }> = {},
): CompareProduct {
  const o = {
    sku: 1,
    vendor: "Acme",
    part: "P-1",
    isAvailable: true,
    retailPrice: 1000,
    warranty: null,
    weight: null,
    volume: null,
    attributes: [],
    ...overrides,
  };
  return {
    sku: o.sku,
    vendor: o.vendor,
    part: o.part,
    isAvailable: o.isAvailable,
    retailPrice: o.retailPrice,
    warranty: o.warranty,
    weight: o.weight,
    volume: o.volume,
    attributes: o.attributes.map((a, i) => ({
      id: i + 1,
      productId: o.sku,
      source: "manual",
      ...a,
    })),
  } as unknown as CompareProduct;
}

describe("buildCompareRows", () => {
  it("returns [] for no products", () => {
    expect(buildCompareRows([])).toEqual([]);
  });

  it("single product → nothing is a difference", () => {
    const rows = buildCompareRows([
      mkProduct({ attributes: [{ key: "Цвет", value: "Чёрный" }] }),
    ]);
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.every((r) => r.hasDiff === false)).toBe(true);
  });

  it("two identical products → no row has diff", () => {
    const a = mkProduct({ attributes: [{ key: "Цвет", value: "Чёрный" }] });
    const b = mkProduct({ attributes: [{ key: "Цвет", value: "Чёрный" }] });
    const rows = buildCompareRows([a, b]);
    expect(rows.every((r) => r.hasDiff === false)).toBe(true);
  });

  it("highlights a row where attribute values differ", () => {
    const a = mkProduct({ attributes: [{ key: "Цвет", value: "Чёрный" }] });
    const b = mkProduct({ attributes: [{ key: "Цвет", value: "Серый" }] });
    const rows = buildCompareRows([a, b]);
    const color = rows.find((r) => r.label === "Цвет");
    expect(color).toBeDefined();
    expect(color!.values).toEqual(["Чёрный", "Серый"]);
    expect(color!.hasDiff).toBe(true);
  });

  it("missing attribute in one product counts as a diff", () => {
    const a = mkProduct({ attributes: [{ key: "Память", value: "512 ГБ" }] });
    const b = mkProduct({ attributes: [] });
    const rows = buildCompareRows([a, b]);
    const mem = rows.find((r) => r.label === "Память");
    expect(mem!.values).toEqual(["512 ГБ", "—"]);
    expect(mem!.hasDiff).toBe(true);
  });

  it("joins multi-value attributes deterministically", () => {
    const a = mkProduct({
      attributes: [
        { key: "Цвет", value: "Чёрный" },
        { key: "Цвет", value: "Серый" },
      ],
    });
    const b = mkProduct({
      attributes: [
        // Same set, different insertion order — must still compare equal.
        { key: "Цвет", value: "Серый" },
        { key: "Цвет", value: "Чёрный" },
      ],
    });
    const rows = buildCompareRows([a, b]);
    const color = rows.find((r) => r.label === "Цвет");
    expect(color!.values).toEqual(["Серый, Чёрный", "Серый, Чёрный"]);
    expect(color!.hasDiff).toBe(false);
  });

  it("attribute keys are sorted alphabetically (Russian)", () => {
    const a = mkProduct({
      attributes: [
        { key: "Цвет", value: "X" },
        { key: "Бренд", value: "X" },
        { key: "Память", value: "X" },
      ],
    });
    const rows = buildCompareRows([a]);
    const attrLabels = rows.map((r) => r.label);
    const brandIdx = attrLabels.indexOf("Бренд");
    const memIdx = attrLabels.indexOf("Память");
    const colorIdx = attrLabels.indexOf("Цвет");
    // After the base rows, attribute keys appear alphabetically. We compare
    // only the attribute keys (not the base "Бренд" base-row, which is also
    // labelled "Бренд" — but we want the attribute one, which is later).
    expect(memIdx).toBeGreaterThan(brandIdx);
    expect(colorIdx).toBeGreaterThan(memIdx);
  });

  it("base rows: price differs, vendor differs, availability matches", () => {
    const a = mkProduct({ vendor: "Acme", retailPrice: 1000, isAvailable: true });
    const b = mkProduct({ vendor: "Beta", retailPrice: 2000, isAvailable: true });
    const rows = buildCompareRows([a, b]);

    const vendor = rows.find((r) => r.label === "Бренд")!;
    const price = rows.find((r) => r.label === "Цена")!;
    const stock = rows.find((r) => r.label === "В наличии")!;

    expect(vendor.hasDiff).toBe(true);
    expect(price.hasDiff).toBe(true);
    expect(stock.hasDiff).toBe(false);
    expect(stock.values).toEqual(["Да", "Да"]);
  });

  it("missing numeric fields render as '—'", () => {
    const a = mkProduct({ warranty: 12 });
    const b = mkProduct({ warranty: null });
    const rows = buildCompareRows([a, b]);
    const warranty = rows.find((r) => r.label === "Гарантия")!;
    expect(warranty.values).toEqual(["12 мес", "—"]);
    expect(warranty.hasDiff).toBe(true);
  });

  it("all-missing row is NOT a diff (everyone agrees there's no value)", () => {
    const a = mkProduct({ warranty: null, weight: null });
    const b = mkProduct({ warranty: null, weight: null });
    const rows = buildCompareRows([a, b]);
    const warranty = rows.find((r) => r.label === "Гарантия")!;
    const weight = rows.find((r) => r.label === "Вес")!;
    expect(warranty.hasDiff).toBe(false);
    expect(weight.hasDiff).toBe(false);
  });
});
