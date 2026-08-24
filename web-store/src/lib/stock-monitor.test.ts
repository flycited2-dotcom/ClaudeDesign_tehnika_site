import { describe, expect, it } from "vitest";
import {
  activeProductIsAvailable,
  buildStockAlertMessages,
  buildStockProductCard,
  buildStockUnchangedMessage,
  compactStockProductName,
  parseWatchedPatterns,
  parseWatchedSkus,
  stockNotificationIsDue,
  stockSnapshotHasChanged,
  stockProductDescription,
  supplierQtyLabel,
} from "@/lib/stock-monitor";

describe("stock monitor", () => {
  it("parses and deduplicates SKU and pattern watch lists", () => {
    expect(parseWatchedSkus("101, 202;101\n303")).toEqual([101, 202, 303]);
    expect(parseWatchedPatterns("Exegate AD; exegate ad\nPower 1000")).toEqual(["exegate ad", "Power 1000"]);
    expect(() => parseWatchedSkus("101, wrong")).toThrow("wrong");
  });

  it("recognizes symbolic and numeric supplier stock", () => {
    expect(activeProductIsAvailable({ sku: 1, price: 100, qty: "0", nearest_logistic_center_qty: "**" })).toBe(true);
    expect(activeProductIsAvailable({ sku: 1, price: 100, qty: "3" })).toBe(true);
    expect(activeProductIsAvailable({ sku: 1, price: 100, qty: "0" })).toBe(false);
    expect(supplierQtyLabel("***")).toBe("много");
  });

  it("alerts on appearance and then at the configured repeat interval", () => {
    const now = new Date("2026-08-13T12:15:00.000Z");
    expect(stockNotificationIsDue({ available: true, previouslyAvailable: false, now })).toBe(true);
    expect(
      stockNotificationIsDue({
        available: true,
        previouslyAvailable: true,
        lastNotifiedAt: "2026-08-13T12:01:00.000Z",
        now,
        repeatMinutes: 15,
      }),
    ).toBe(false);
    expect(
      stockNotificationIsDue({
        available: true,
        previouslyAvailable: true,
        lastNotifiedAt: "2026-08-13T12:00:00.000Z",
        now,
        repeatMinutes: 15,
      }),
    ).toBe(true);
  });

  it("detects actual stock and price changes without repeating identical cards", () => {
    const current = {
      available: true,
      price: 12_500,
      qty: "*",
      realQty: 4,
      nearestQty: "0",
      nearestRealQty: 0,
    };
    expect(stockSnapshotHasChanged(current, undefined)).toBe(true);
    expect(stockSnapshotHasChanged(current, current)).toBe(false);
    expect(stockSnapshotHasChanged({ ...current, realQty: 3 }, current)).toBe(true);
    expect(stockSnapshotHasChanged({ ...current, price: 12_700 }, current)).toBe(true);
  });

  it("builds one compact unchanged-stock heartbeat", () => {
    const text = buildStockUnchangedMessage({
      items: [{ sku: 1, name: "AVS-1000", available: true, isRestock: false }],
      checkedAt: new Date("2026-08-14T08:00:00.000Z"),
    });
    expect(text).toContain("изменений нет");
    expect(text).toContain("1</b> из <b>1");
    expect(text).not.toContain("SKU");
  });

  it("builds a short header and a separate actionable product card", () => {
    const messages = buildStockAlertMessages({
      items: [
        {
          sku: 123,
          name: "Стабилизатор напряжения настенный ExeGate <Power>-1000 (1000ВА, много характеристик)",
          part: "EX123RUS",
          slug: "exegate-power-123",
          price: 12500,
          qty: "*",
          realQty: 4,
          nearestQty: "***",
          available: true,
          isRestock: true,
        },
      ],
      checkedAt: new Date("2026-08-13T12:00:00.000Z"),
      b2bUrl: "https://b2b.example.test",
      siteUrl: "https://shop.example.test",
    });

    expect(messages).toHaveLength(2);
    expect(messages[0].text).toContain("ПОСТУПИЛИ СТАБИЛИЗАТОРЫ");
    expect(messages[0].text).not.toContain("SKU");
    expect(messages[0].buttonRows).toBeUndefined();
    expect(messages[1].text).toContain("ExeGate &lt;Power&gt;-1000");
    expect(messages[1].text).toContain("📝 <b>Описание:</b>\n1000ВА, много характеристик");
    expect(messages[1].text).toContain("🏭 <b>Ваш склад:</b> 🟢 4 шт.");
    expect(messages[1].text).not.toContain("Открыть B2B");
    expect(messages[1].text).toContain("<b>SKU:</b> <code>123</code>");
    expect(messages[1].buttonRows).toEqual([
      [{ text: "🛒 Заказать", callback_data: "itpo:s:123" }],
      [{ text: "🌐 Открыть B2B", url: "https://b2b.example.test" }],
      [
        {
          text: "📦 Карточка товара",
          url: "https://shop.example.test/product/exegate-power-123",
        },
      ],
    ]);
  });

  it("removes a duplicate supplier part number from the compact title", () => {
    expect(
      compactStockProductName(
        "Стабилизатор напряжения ExeGate EX291729RUS Expert Turbo AST-1000 (1000ВА, характеристики)",
        "EX291729RUS",
      ),
    ).toBe("ExeGate Expert Turbo AST-1000");

    const card = buildStockProductCard({
      item: {
        sku: 10940837,
        name: "Стабилизатор напряжения ExeGate EX291729RUS Expert Turbo AST-1000 (1000ВА)",
        part: "EX291729RUS",
        price: 4000,
        qty: "*",
        nearestQty: "0",
        available: true,
        isRestock: true,
      },
    });
    expect(card.text).toContain("🏭 <b>Ваш склад:</b> 🟢 мало");
    expect(card.text).not.toContain("Ближайший РЦ");
    expect(card.text).toContain("📝 <b>Описание:</b>\n1000ВА");
    expect(card.buttonRows).toEqual([[{ text: "🛒 Заказать", callback_data: "itpo:s:10940837" }]]);
  });

  it("extracts the original supplier specification for the card description", () => {
    expect(
      stockProductDescription(
        "Стабилизатор напряжения ExeGate Master Turbo AVS-10000 (10000ВА, 100-265В, цветной дисплей, клем.колодка+евророзетка, RTL)",
      ),
    ).toBe("10000ВА, 100-265В, цветной дисплей, клем.колодка+евророзетка, RTL");
    expect(stockProductDescription("ExeGate Master Turbo AVS-10000")).toBeNull();
  });
});
