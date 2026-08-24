import { Prisma } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";

const prismaMock = vi.hoisted(() => ({
  count: vi.fn(),
  findMany: vi.fn(),
}));

vi.mock("@/lib/db", () => ({ prisma: { product: prismaMock } }));

import { type B2bAssistantProduct, searchB2bProductPage } from "@/lib/b2b-assistant-search";

function product(sku: number, overrides: Partial<B2bAssistantProduct> = {}): B2bAssistantProduct {
  return {
    id: `p-${sku}`,
    sku,
    supplierName: `Стабилизатор ExeGate ${sku}`,
    name: null,
    slug: `product-${sku}`,
    vendor: "ExeGate",
    part: `PART-${sku}`,
    barcodes: null,
    supplierPrice: new Prisma.Decimal(10_000),
    stockStatus: "available",
    nearestStockStatus: null,
    isAvailable: true,
    deliveryDays: 0,
    multiplicity: 1,
    warranty: null,
    description: null,
    updatedAt: new Date("2026-08-14T08:00:00Z"),
    category: { name: "Стабилизаторы" },
    images: [],
    ...overrides,
  };
}

describe("B2B assistant paged product search", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns a page plus the true total and has-more marker", async () => {
    const exact = product(100, { part: "AVS-8000" });
    const general = [101, 102, 103, 104].map((sku) => product(sku));
    prismaMock.count.mockResolvedValue(12);
    prismaMock.findMany.mockResolvedValueOnce([exact]).mockResolvedValueOnce(general);

    const page = await searchB2bProductPage("AVS-8000", { limit: 5 });

    expect(page).toMatchObject({ total: 12, offset: 0, hasMore: true });
    expect(page.products.map((item) => item.sku)).toEqual([100, 101, 102, 103, 104]);
    expect(prismaMock.findMany.mock.calls[1][0]).toMatchObject({ take: 500 });
  });

  it("skips the already shown exact and general results on the next page", async () => {
    const exact = product(100, { part: "AVS-8000" });
    const candidates = [101, 102, 103, 104, 105, 106, 107, 108, 109].map((sku) => product(sku));
    prismaMock.count.mockResolvedValue(12);
    prismaMock.findMany.mockResolvedValueOnce([exact]).mockResolvedValueOnce(candidates);

    const page = await searchB2bProductPage("AVS-8000", { limit: 5, offset: 5 });

    expect(page).toMatchObject({ total: 12, offset: 5, hasMore: true });
    expect(page.products.map((item) => item.sku)).toEqual([105, 106, 107, 108, 109]);
    expect(prismaMock.findMany.mock.calls[1][0]).toMatchObject({ take: 500 });
  });

  it("allows up to twenty results per page", async () => {
    prismaMock.count.mockResolvedValue(30);
    prismaMock.findMany
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce(Array.from({ length: 30 }, (_, index) => product(200 + index)));

    const page = await searchB2bProductPage("стабилизатор", { limit: 100 });

    expect(page.products).toHaveLength(20);
    expect(page.hasMore).toBe(true);
  });
});
