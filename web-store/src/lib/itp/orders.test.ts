import { afterEach, describe, expect, it, vi } from "vitest";
import { createOrUpdateTelegramItpOrder, createOrUpdateTelegramItpBatchOrder, getItpActiveProduct, type ItpRpc } from "@/lib/itp/orders";

afterEach(() => {
  delete process.env.STOCK_ORDER_LOGISTIC_CENTER_ID;
  delete process.env.STOCK_ORDER_DELIVERY_ADDRESS_ID;
});

describe("complete file orders", () => {
  function supplier({ partial = false, confirmed = false } = {}) {
    let saved: Array<{ id: number; doc_id: number; sku: number; qty: number }> = [];
    const rpcMock = vi.fn(async (payload: Record<string, unknown>) => {
      const request = payload.request as { model: string; method: string };
      if (request.model === "orders") return { success: true, data: { orders: [{ id: 77, confirmed, without_reserve: true }], total: 1 } };
      if (request.model === "order_items" && request.method === "read") return { success: true, data: { order_items: saved, total: saved.length } };
      if (request.model === "order_items" && request.method === "client_update") {
        const data = payload.data as { update: Array<{ sku: number; qty: number }> };
        saved = data.update.slice(0, partial ? 1 : undefined).map((item, index) => ({ ...item, id: index + 1, doc_id: 77 }));
        return { success: true, data: { order_items: saved, total: saved.length } };
      }
      throw new Error("Unexpected RPC request");
    });
    return { rpc: rpcMock as unknown as ItpRpc, mock: rpcMock };
  }

  const lines = [{ sku: 123, quantity: 500 }, { sku: 456, quantity: 195, supplierPrice: 10 }];

  it("creates one unreserved order with all quantities, even without prices or stock", async () => {
    const { rpc, mock } = supplier();
    const resolved = vi.fn(async () => undefined);
    const result = await createOrUpdateTelegramItpBatchOrder({ lines, withoutReserve: true, onOrderResolved: resolved, rpc });
    expect(result.items.map((item) => item.qty)).toEqual([500, 195]);
    expect(resolved).toHaveBeenCalledWith(expect.objectContaining({ id: 77 }));
    expect(mock).toHaveBeenCalledWith(expect.objectContaining({
      request: { method: "create", model: "orders", module: "platform" },
      data: [expect.objectContaining({ without_reserve: true })],
    }));
    expect(mock).toHaveBeenCalledWith(expect.objectContaining({
      data: { doc_id: 77, destroy: [], update: [
        { sku: 123, qty: 500, wish_price_comment: "Телеграм" },
        { sku: 456, qty: 195, wish_price: 10, wish_price_comment: "Телеграм" },
      ] },
    }));
    expect(mock.mock.calls.filter(([payload]) => (payload.request as { method: string }).method === "create")).toHaveLength(1);
  });

  it("reports incomplete acceptance after preserving the supplier order number", async () => {
    const { rpc } = supplier({ partial: true });
    const resolved = vi.fn(async () => undefined);
    await expect(createOrUpdateTelegramItpBatchOrder({ lines, withoutReserve: true, onOrderResolved: resolved, rpc })).rejects.toThrow("SKU: 456");
    expect(resolved).toHaveBeenCalledWith(expect.objectContaining({ id: 77 }));
  });

  it("reuses the same order on retry and refuses changing a confirmed order", async () => {
    const { rpc, mock } = supplier();
    await createOrUpdateTelegramItpBatchOrder({ lines, existingOrderId: 77, withoutReserve: true, rpc });
    expect(mock.mock.calls.some(([payload]) => (payload.request as { method: string }).method === "create")).toBe(false);
    const locked = supplier({ confirmed: true });
    await expect(createOrUpdateTelegramItpBatchOrder({ lines, existingOrderId: 77, withoutReserve: true, rpc: locked.rpc })).rejects.toThrow("подтверждён");
    expect(locked.mock.mock.calls.some(([payload]) => ["update", "client_update"].includes((payload.request as { method: string }).method))).toBe(false);
  });

  it("validates duplicate SKUs and quantities before contacting the supplier", async () => {
    const { rpc, mock } = supplier();
    await expect(createOrUpdateTelegramItpBatchOrder({ lines: [{ sku: 1, quantity: 2 }, { sku: 1, quantity: 3 }], rpc })).rejects.toThrow("повтор");
    expect(mock).not.toHaveBeenCalled();
  });
});

describe("I-T-P orders", () => {
  it("requests a single current product by SKU", async () => {
    const rpcMock = vi.fn(async () => ({
      success: true,
      data: { products: [{ sku: 123, price: 100, qty: "*" }], total: 1 },
    }));
    const rpc = rpcMock as unknown as ItpRpc;

    const product = await getItpActiveProduct(123, rpc);

    expect(product?.sku).toBe(123);
    expect(rpcMock).toHaveBeenCalledWith(
      expect.objectContaining({ filter: [{ property: "sku", operator: "=", value: 123 }] }),
    );
  });

  it("creates an unconfirmed order, adds its item and verifies it", async () => {
    process.env.STOCK_ORDER_LOGISTIC_CENTER_ID = "16";
    process.env.STOCK_ORDER_DELIVERY_ADDRESS_ID = "221892";
    const requests: Array<Record<string, unknown>> = [];
    let itemAdded = false;
    const rpcMock = vi.fn(async (payload: Record<string, unknown>) => {
      requests.push(payload);
      const request = payload.request as { method: string; model: string };
      if (request.model === "orders" && request.method === "read") {
        return { success: true, data: { orders: [], total: 0 } };
      }
      if (request.model === "orders" && request.method === "create") {
        return {
          success: true,
          data: {
            orders: [
              {
                id: 7345000,
                status: 1,
                confirmed: false,
                logistic_center: 16,
                delivery_type: 2,
                delivery_address: 221892,
                without_reserve: false,
              },
            ],
            total: 1,
          },
        };
      }
      if (request.model === "order_items" && request.method === "client_update") {
        itemAdded = true;
        return { success: true, data: { order_items: [{ id: 99, doc_id: 7345000, sku: 123, qty: 2 }], total: 1 } };
      }
      if (request.model === "order_items" && request.method === "read") {
        return {
          success: true,
          data: { order_items: itemAdded ? [{ id: 99, doc_id: 7345000, sku: 123, qty: 2 }] : [], total: itemAdded ? 1 : 0 },
        };
      }
      throw new Error("unexpected request");
    });
    const rpc = rpcMock as unknown as ItpRpc;

    const result = await createOrUpdateTelegramItpOrder({
      sku: 123,
      quantity: 2,
      supplierPrice: 500,
      rpc,
    });

    expect(result.order.id).toBe(7345000);
    expect(result.item.qty).toBe(2);
    expect(result.created).toBe(true);
    expect(requests).toContainEqual(
      expect.objectContaining({
        request: { method: "create", model: "orders", module: "platform" },
        data: [
          expect.objectContaining({
            logistic_center: 16,
            delivery_type: 2,
            delivery_address: 221892,
            without_reserve: false,
            partner_comment: "Телеграм",
          }),
        ],
      }),
    );
    expect(requests).toContainEqual(
      expect.objectContaining({
        request: { method: "client_update", model: "order_items", module: "platform" },
        data: expect.objectContaining({
          update: [expect.objectContaining({ sku: 123, qty: 2, wish_price_comment: "Телеграм" })],
        }),
      }),
    );
  });

  it("reuses an existing order ID stored in the local idempotency table", async () => {
    const rpcMock = vi.fn(async (payload: Record<string, unknown>) => {
      const request = payload.request as { method: string; model: string };
      if (request.model === "orders") {
        return {
          success: true,
          data: {
            orders: [
              {
                id: 7345001,
                status: 1,
                confirmed: false,
                partner_comment: "Телеграм",
                without_reserve: false,
              },
            ],
            total: 1,
          },
        };
      }
      if (request.model === "order_items" && request.method === "read") {
        return { success: true, data: { order_items: [{ id: 100, doc_id: 7345001, sku: 123, qty: 2 }], total: 1 } };
      }
      throw new Error("unexpected mutation");
    });
    const rpc = rpcMock as unknown as ItpRpc;

    const result = await createOrUpdateTelegramItpOrder({
      sku: 123,
      quantity: 2,
      supplierPrice: 500,
      existingOrderId: 7345001,
      rpc,
    });

    expect(result.created).toBe(false);
    expect(result.duplicatePrevented).toBe(true);
    expect(
      rpcMock.mock.calls.some(([payload]) => (payload.request as { method: string }).method === "create"),
    ).toBe(false);
    expect(
      rpcMock.mock.calls.some(([payload]) => (payload.request as { method: string }).method === "client_update"),
    ).toBe(false);
  });
});
