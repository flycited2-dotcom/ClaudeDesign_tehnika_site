import { describe, expect, it } from "vitest";
import {
  buildStockOrderConfirmCallback,
  buildStockOrderStartCallback,
  parseOrderQuantity,
  parseStockOrderConfirmCallback,
  parseStockOrderStartCallback,
} from "@/lib/stock-order-bot";

describe("stock order bot", () => {
  it("encodes and parses the product start button", () => {
    expect(buildStockOrderStartCallback(10940837)).toBe("itpo:s:10940837");
    expect(parseStockOrderStartCallback("itpo:s:10940837")).toBe(10940837);
    expect(parseStockOrderStartCallback("itpo:s:nope")).toBeNull();
  });

  it("keeps confirmation callback below Telegram's 64-byte limit", () => {
    const value = {
      sku: 10940837,
      quantity: 15,
      priceCents: 123456789,
      nonce: "a1b2c3d4",
      telegramUserId: 1234567890,
      issuedAt: 1786636800,
    };
    const callback = buildStockOrderConfirmCallback(value);
    expect(Buffer.byteLength(callback, "utf8")).toBeLessThanOrEqual(64);
    expect(parseStockOrderConfirmCallback(callback)).toEqual(value);
  });

  it("accepts only safe positive integer quantities", () => {
    expect(parseOrderQuantity(" 25 ")).toBe(25);
    expect(parseOrderQuantity("0")).toBeNull();
    expect(parseOrderQuantity("1.5")).toBeNull();
    expect(parseOrderQuantity("10001")).toBeNull();
  });
});
