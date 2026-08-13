import { beforeEach, describe, expect, it, vi } from "vitest";

const prismaMock = vi.hoisted(() => ({
  create: vi.fn(),
  findUnique: vi.fn(),
  delete: vi.fn(),
  deleteMany: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  prisma: { telegramClientOffer: prismaMock },
}));

import { createShortClientOffer, resolveShortClientOffer } from "@/lib/b2b-assistant-offer-store";

describe("B2B assistant short offer store", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.B2B_ASSISTANT_OFFER_TTL_MINUTES = "60";
    prismaMock.create.mockResolvedValue({});
    prismaMock.deleteMany.mockResolvedValue({ count: 0 });
  });

  it("stores only a short opaque code with the prepared price", async () => {
    const now = new Date("2026-08-13T12:00:00Z");
    const result = await createShortClientOffer({
      sku: 10_539_750,
      price: 14_700,
      telegramUserId: 1_264_067_528,
      now,
    });

    expect(result.code).toMatch(/^[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{6}$/);
    expect(result.code).not.toContain("10539750");
    expect(prismaMock.create).toHaveBeenCalledWith({
      data: {
        code: result.code,
        sku: 10_539_750,
        priceCents: 1_470_000,
        telegramUserId: "1264067528",
        expiresAt: new Date("2026-08-13T13:00:00Z"),
      },
    });
  });

  it("resolves an active offer only for the manager who created it", async () => {
    prismaMock.findUnique.mockResolvedValue({
      code: "K7M4Q2",
      sku: 10_539_750,
      priceCents: 1_470_000,
      telegramUserId: "1264067528",
      expiresAt: new Date("2026-08-13T13:00:00Z"),
    });

    await expect(
      resolveShortClientOffer("k7m4q2", 1_264_067_528, new Date("2026-08-13T12:30:00Z")),
    ).resolves.toEqual({
      matched: true,
      offer: {
        sku: 10_539_750,
        priceCents: 1_470_000,
        expiresAt: Math.floor(new Date("2026-08-13T13:00:00Z").getTime() / 1000),
      },
    });
    await expect(
      resolveShortClientOffer("K7M4Q2", 999, new Date("2026-08-13T12:30:00Z")),
    ).resolves.toMatchObject({ matched: true, offer: null, reason: "forbidden" });
  });

  it("lets a missing code-like product model fall through to catalog search", async () => {
    prismaMock.findUnique.mockResolvedValue(null);
    await expect(resolveShortClientOffer("ABCDEF", 1_264_067_528)).resolves.toEqual({
      matched: false,
      offer: null,
      reason: "invalid",
    });
  });
});
