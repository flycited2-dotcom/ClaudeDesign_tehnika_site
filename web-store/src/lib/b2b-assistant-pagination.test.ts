import { beforeEach, describe, expect, it, vi } from "vitest";

const prismaMock = vi.hoisted(() => ({
  create: vi.fn(),
  findUnique: vi.fn(),
  delete: vi.fn(),
  deleteMany: vi.fn(),
}));

vi.mock("@/lib/db", () => ({ prisma: { telegramSearchSession: prismaMock } }));

import {
  buildSearchPageCallback,
  createSearchSession,
  parseSearchPageCallback,
  resolveSearchSession,
} from "@/lib/b2b-assistant-pagination";

describe("B2B assistant search pagination", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.create.mockResolvedValue({});
    prismaMock.delete.mockResolvedValue({});
    prismaMock.deleteMany.mockResolvedValue({ count: 0 });
  });

  it("round-trips a compact page callback", () => {
    const callback = buildSearchPageCallback("K7M4Q2", 125);
    expect(callback.length).toBeLessThan(64);
    expect(parseSearchPageCallback(callback)).toEqual({ code: "K7M4Q2", offset: 125 });
    expect(parseSearchPageCallback("b2ba:p:bad:1")).toBeNull();
  });

  it("stores a normalized query for one hour", async () => {
    const now = new Date("2026-08-14T08:00:00Z");
    const code = await createSearchSession({ query: "  Lenovo   IdeaPad  ", telegramUserId: 123, now });

    expect(code).toMatch(/^[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{6}$/);
    expect(prismaMock.create).toHaveBeenCalledWith({
      data: {
        code,
        query: "Lenovo IdeaPad",
        telegramUserId: "123",
        expiresAt: new Date("2026-08-14T09:00:00Z"),
      },
    });
  });

  it("allows only the session owner and rejects expiry", async () => {
    prismaMock.findUnique.mockResolvedValue({
      code: "K7M4Q2",
      query: "стабилизатор",
      telegramUserId: "123",
      expiresAt: new Date("2026-08-14T09:00:00Z"),
    });
    await expect(resolveSearchSession("K7M4Q2", 123, new Date("2026-08-14T08:30:00Z"))).resolves.toEqual({
      query: "стабилизатор",
    });
    await expect(resolveSearchSession("K7M4Q2", 999, new Date("2026-08-14T08:30:00Z"))).resolves.toEqual({
      query: null,
      reason: "forbidden",
    });
    await expect(resolveSearchSession("K7M4Q2", 123, new Date("2026-08-14T09:01:00Z"))).resolves.toEqual({
      query: null,
      reason: "expired",
    });
  });
});
