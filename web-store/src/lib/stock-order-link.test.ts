import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { buildStockOrderLink, verifyStockOrderLinkToken } from "@/lib/stock-order-link";

describe("stock order link", () => {
  beforeEach(() => {
    process.env.STOCK_ORDER_LINK_SECRET = "test-secret-that-is-long-enough-for-hmac-signing";
    process.env.STOCK_ORDER_LINK_TTL_MINUTES = "60";
  });

  afterEach(() => {
    delete process.env.STOCK_ORDER_LINK_SECRET;
    delete process.env.STOCK_ORDER_LINK_TTL_MINUTES;
  });

  it("creates and verifies a time-limited signed link", () => {
    const now = new Date("2026-08-13T17:00:00.000Z");
    const url = new URL(buildStockOrderLink({ sku: 10940837, siteUrl: "https://shop.example", now }));
    const token = {
      sku: 10940837,
      expiresAt: Number(url.searchParams.get("expires")),
      nonce: url.searchParams.get("nonce") || "",
      signature: url.searchParams.get("sig") || "",
    };
    expect(verifyStockOrderLinkToken(token, new Date("2026-08-13T17:30:00.000Z"))).toEqual({ valid: true });
    expect(verifyStockOrderLinkToken(token, new Date("2026-08-13T18:01:00.000Z"))).toEqual({
      valid: false,
      reason: "expired",
    });
  });

  it("rejects a changed SKU", () => {
    const url = new URL(
      buildStockOrderLink({
        sku: 10940837,
        siteUrl: "https://shop.example",
        now: new Date("2026-08-13T17:00:00.000Z"),
      }),
    );
    expect(
      verifyStockOrderLinkToken(
        {
          sku: 10940838,
          expiresAt: Number(url.searchParams.get("expires")),
          nonce: url.searchParams.get("nonce") || "",
          signature: url.searchParams.get("sig") || "",
        },
        new Date("2026-08-13T17:30:00.000Z"),
      ),
    ).toEqual({ valid: false, reason: "invalid" });
  });

  it("keeps the default Telegram card link valid for seven days", () => {
    delete process.env.STOCK_ORDER_LINK_TTL_MINUTES;
    const createdAt = new Date("2026-08-13T17:00:00.000Z");
    const url = new URL(buildStockOrderLink({ sku: 10940837, siteUrl: "https://shop.example", now: createdAt }));
    const token = {
      sku: 10940837,
      expiresAt: Number(url.searchParams.get("expires")),
      nonce: url.searchParams.get("nonce") || "",
      signature: url.searchParams.get("sig") || "",
    };

    expect(verifyStockOrderLinkToken(token, new Date("2026-08-20T16:59:59.000Z"))).toEqual({ valid: true });
    expect(verifyStockOrderLinkToken(token, new Date("2026-08-20T17:00:01.000Z"))).toEqual({
      valid: false,
      reason: "expired",
    });
  });
});
