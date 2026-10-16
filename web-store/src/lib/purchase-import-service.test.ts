import { beforeEach, describe, expect, it, vi } from "vitest";
import { purchaseAvailability, purchaseReportCsv, resolvePurchaseSheet } from "@/lib/purchase-import-service";

const mocks = vi.hoisted(() => ({ findMany: vi.fn(), active: vi.fn() }));
vi.mock("@/lib/db", () => ({ prisma: { product: { findMany: mocks.findMany } } }));
vi.mock("@/lib/itp/orders", () => ({ getItpActiveProducts: mocks.active }));
beforeEach(() => vi.resetAllMocks());

describe("purchase identity and advisory availability", () => {
  it("preserves unavailable/not-yet-synced supplier SKUs and combines only selected rows", async () => {
    const lines = await resolvePurchaseSheet({ name: "Заказ", errors: [], rows: [
      { row: 2, supplierSku: 123, name: "Принтер", quantity: 300 },
      { row: 3, supplierSku: 123, name: "Принтер", quantity: 200 },
    ] });
    expect(lines[0]).toMatchObject({ sku: 123, quantity: 500 });
    expect(mocks.findMany).not.toHaveBeenCalled();
    mocks.active.mockRejectedValue(new Error("auth failed"));
    expect(await purchaseAvailability(lines)).toMatchObject({ products: [], error: expect.stringContaining("недоступна") });
    expect(lines[0].quantity).toBe(500);
  });

  it("requires a unique exact identity, even if a similar-name candidate is available", async () => {
    mocks.findMany.mockResolvedValue([{ sku: 1 }, { sku: 2 }]);
    await expect(resolvePurchaseSheet({ name: "Заказ", errors: [], rows: [
      { row: 2, article: "AB-10", name: "Кабель", brand: "Brand", quantity: 10 },
    ] })).rejects.toThrow("неоднозначный");
    expect(mocks.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { vendor: { equals: "Brand", mode: "insensitive" }, OR: [{ part: { equals: "AB-10", mode: "insensitive" } }] },
    }));
  });

  it("blocks a sheet with any invalid row rather than ordering a subset", async () => {
    await expect(resolvePurchaseSheet({ name: "Заказ", rows: [], errors: ["Строка 3: ошибка"] })).rejects.toThrow("Строка 3");
  });

  it("keeps stock stars as labels, leaves unknown counts blank and escapes CSV formulas", () => {
    const csv = purchaseReportCsv([
      { sku: 123, name: "=HYPERLINK(1)", quantity: 500, sourceRows: [7], notes: ["@note"] },
    ], [{ sku: 123, qty: "***", price: 10, real_qty: 2 }]).toString("utf8");
    expect(csv).toContain('"500";"10,00";"5000,00";"много";"2"');
    expect(csv).toContain("'=HYPERLINK");
    expect(csv).toContain("'@note");
  });
});
