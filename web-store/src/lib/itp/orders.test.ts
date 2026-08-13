import { afterEach, describe, expect, it, vi } from "vitest";
import { createOrUpdateTelegramItpOrder, getItpActiveProduct } from "@/lib/itp/orders";

afterEach(() => {
  delete process.env.STOCK_ORDER_LOGISTIC_CENTER_ID;
  delete process.env.STOCK_ORDER_DELIVERY_ADDRESS_ID;
});

describe("I-T-P orders", () => {
  it("requests a single current product by SKU", async () => {
    const rpc = vi.fn(async () => ({
      success: true,
      data: { products: [{ sku: 123, price: 100, qty: "*" }], total: 1 },
    }));

    const product = await getItpActiveProduct(123, rpc);

    expect(product?.sku).toBe(123);
    expect(rpc).toHaveBeenCalledWith(
      expect.objectContaining({ filter: [{ property: "sku", operator: "=", value: 123 }] }),
    );
  });

  it("creates an unconfirmed order, adds its item and verifies it", async () => {
    process.env.STOCK_ORDER_LOGISTIC_CENTER_ID = "16";
    process.env.STOCK_ORDER_DELIVERY_ADDRESS_ID = "221892";
    const requests: Array<Record<string, unknown>> = [];
    let itemAdded = false;
    const rpc = vi.fn(async (payload: Record<string, unknown>) => {
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
    const rpc = vi.fn(async (payload: Record<string, unknown>) => {
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

    const result = await createOrUpdateTelegramItpOrder({
      sku: 123,
      quantity: 2,
      supplierPrice: 500,
      existingOrderId: 7345001,
      rpc,
    });

    expect(result.created).toBe(false);
    expect(result.duplicatePrevented).toBe(true);
    expect(rpc.mock.calls.some(([payload]) => payload.request.method === "create")).toBe(false);
    expect(rpc.mock.calls.some(([payload]) => payload.request.method === "client_update")).toBe(false);
  });
});
