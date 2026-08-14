import { Prisma } from "@prisma/client";
import { describe, expect, it } from "vitest";
import {
  type B2bAssistantProduct,
  normalizeB2bSearchQuery,
  rankB2bSearchProduct,
} from "@/lib/b2b-assistant-search";

function product(overrides: Partial<B2bAssistantProduct> = {}): B2bAssistantProduct {
  return {
    id: "p1",
    sku: 10_539_750,
    supplierName: "Стабилизатор напряжения ExeGate Master Turbo AVS-8000",
    name: null,
    slug: "exegate-avs-8000",
    vendor: "ExeGate",
    part: "EX291750RUS",
    barcodes: null,
    supplierPrice: new Prisma.Decimal(13_280.56),
    stockStatus: "low",
    nearestStockStatus: null,
    isAvailable: true,
    deliveryDays: 2,
    multiplicity: 1,
    warranty: "12",
    description: null,
    updatedAt: new Date("2026-08-13T12:00:00Z"),
    category: { name: "Стабилизаторы напряжения" },
    images: [{ id: "image-1" }],
    ...overrides,
  };
}

describe("B2B assistant search", () => {
  it("normalizes aliases and accepts an exact SKU", () => {
    expect(normalizeB2bSearchQuery("  НОУТ Lenovo  ")).toBe("ноутбук lenovo");
    expect(normalizeB2bSearchQuery("10539750")).toBe("10539750");
    expect(normalizeB2bSearchQuery("a")).toBeNull();
  });

  it("ranks exact SKU and part above a generic name match", () => {
    const exactSku = rankB2bSearchProduct(product(), "10539750");
    const exactPart = rankB2bSearchProduct(product(), "EX291750RUS");
    const generic = rankB2bSearchProduct(product(), "стабилизатор");

    expect(exactSku).toBeGreaterThan(generic);
    expect(exactPart).toBeGreaterThan(generic);
  });

  it("slightly prefers available products for otherwise equal matches", () => {
    expect(rankB2bSearchProduct(product(), "ExeGate AVS-8000")).toBeGreaterThan(
      rankB2bSearchProduct(product({ id: "p2", isAvailable: false }), "ExeGate AVS-8000"),
    );
  });

  it("puts voltage stabilizers above phone gimbals for a bare stabilizer query", () => {
    const voltage = product();
    const phoneGimbal = product({
      id: "p2",
      sku: 2,
      supplierName: "Стабилизатор для смартфона с селфи-палкой",
      category: { name: "Стабилизаторы для телефонов" },
    });

    expect(rankB2bSearchProduct(voltage, "стабилизатор")).toBeGreaterThan(
      rankB2bSearchProduct(phoneGimbal, "стабилизатор"),
    );
  });
});
