import { Prisma } from "@prisma/client";
import { describe, expect, it } from "vitest";
import type { B2bAssistantProduct } from "@/lib/b2b-assistant-search";
import { buildClientProductCard, buildManagerProductCard } from "@/lib/b2b-assistant-cards";

const product: B2bAssistantProduct = {
  id: "p1",
  sku: 10_539_750,
  supplierName: "Стабилизатор ExeGate Master Turbo AVS-8000 (8000ВА, дисплей, клеммная колодка)",
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
  warranty: "12 месяцев",
  description: null,
  updatedAt: new Date("2026-08-13T12:00:00Z"),
  category: { name: "Стабилизаторы" },
  images: [{ id: "img" }],
};

describe("B2B assistant cards", () => {
  it("shows internal purchase data only in the manager card", () => {
    const card = buildManagerProductCard({
      product,
      position: 1,
      total: 1,
      markupPresets: [10, 15],
      orderUrl: "https://shop.example/stock-order/10539750",
    });

    expect(card.text).toContain("Цена поставщика");
    expect(card.text).toContain("SKU:");
    expect(card.text).not.toContain("ближайший РЦ");
    expect(card.buttonRows?.flat().filter((button) => button.callback_data)).toHaveLength(3);
  });

  it("keeps the client card free of supplier price and internal SKU", () => {
    const card = buildClientProductCard({
      product,
      clientPrice: 15_300,
      shareQuery: "offer_signed",
      validUntil: new Date("2026-08-14T12:00:00Z"),
    });

    expect(card.text).toContain("Цена: 15 300");
    expect(card.text).toContain("клеммная колодка");
    expect(card.text).not.toContain("Цена поставщика");
    expect(card.text).not.toContain("10539750");
    expect(card.buttonRows?.[0]?.[0]?.switch_inline_query).toBe("offer_signed");
  });
});
