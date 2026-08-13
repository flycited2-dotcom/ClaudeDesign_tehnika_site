import { afterEach, describe, expect, it } from "vitest";
import {
  buildMarkupCallback,
  buildCustomMarkupCallback,
  calculateClientPrice,
  createClientOfferQuery,
  parseClientOfferQuery,
  parseMarkupCallback,
  parseCustomMarkupCallback,
  parseCustomMarkupPercent,
} from "@/lib/b2b-assistant-offer";

const secret = "test-secret-with-at-least-thirty-two-characters";

describe("B2B assistant client offers", () => {
  const previousTtl = process.env.B2B_ASSISTANT_OFFER_TTL_MINUTES;

  afterEach(() => {
    if (previousTtl === undefined) delete process.env.B2B_ASSISTANT_OFFER_TTL_MINUTES;
    else process.env.B2B_ASSISTANT_OFFER_TTL_MINUTES = previousTtl;
  });

  it("calculates markup and rounds a client price upwards", () => {
    expect(calculateClientPrice(10_001, 15, 100)).toBe(11_600);
    expect(calculateClientPrice(1_000, 0, 100)).toBe(1_000);
  });

  it("round-trips compact markup callbacks", () => {
    const callback = buildMarkupCallback(10_539_750, 17.5);
    expect(Buffer.byteLength(callback)).toBeLessThanOrEqual(64);
    expect(parseMarkupCallback(callback)).toEqual({ sku: 10_539_750, markupPercent: 17.5 });
  });

  it("parses custom markup callbacks and human-entered percentages", () => {
    const callback = buildCustomMarkupCallback(10_539_750);
    expect(parseCustomMarkupCallback(callback)).toBe(10_539_750);
    expect(parseCustomMarkupPercent("17,5")).toBe(17.5);
    expect(parseCustomMarkupPercent("-5")).toBeNull();
  });

  it("signs an inline offer without exposing the supplier price", () => {
    process.env.B2B_ASSISTANT_OFFER_TTL_MINUTES = "60";
    const now = new Date("2026-08-13T12:00:00Z");
    const query = createClientOfferQuery({ sku: 10_539_750, price: 14_900, now, secret });

    expect(query).toMatch(/^offer_/);
    expect(query).not.toContain("supplier");
    expect(parseClientOfferQuery(query, { now: new Date("2026-08-13T12:30:00Z"), secret }).offer).toEqual({
      sku: 10_539_750,
      priceCents: 1_490_000,
      expiresAt: Math.floor(new Date("2026-08-13T13:00:00Z").getTime() / 1000),
    });
  });

  it("rejects tampered and expired offers", () => {
    process.env.B2B_ASSISTANT_OFFER_TTL_MINUTES = "1";
    const now = new Date("2026-08-13T12:00:00Z");
    const query = createClientOfferQuery({ sku: 1, price: 100, now, secret });

    expect(parseClientOfferQuery(`${query}x`, { now, secret })).toEqual({ offer: null, reason: "invalid" });
    expect(parseClientOfferQuery(query, { now: new Date("2026-08-13T12:02:00Z"), secret })).toEqual({
      offer: null,
      reason: "expired",
    });
  });
});
