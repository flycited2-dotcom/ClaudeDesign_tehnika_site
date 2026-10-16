import { beforeEach, describe, expect, it, vi } from "vitest";
import { downloadPurchaseDocument, processPurchaseImport, type PurchaseImportTransport } from "@/lib/telegram-purchase-import";

const mocks = vi.hoisted(() => ({ findUnique: vi.fn(), updateMany: vi.fn(), update: vi.fn(), upsert: vi.fn(), order: vi.fn(), availability: vi.fn(), resolve: vi.fn(), csv: vi.fn() }));
vi.mock("@/lib/db", () => ({ prisma: { telegramPurchaseImport: {
  findUnique: mocks.findUnique, updateMany: mocks.updateMany, update: mocks.update, upsert: mocks.upsert,
} } }));
vi.mock("@/lib/itp/orders", () => ({ createOrUpdateTelegramItpBatchOrder: mocks.order }));
vi.mock("@/lib/purchase-import-service", () => ({ purchaseAvailability: mocks.availability, resolvePurchaseSheet: mocks.resolve, purchaseReportCsv: mocks.csv }));

const lines = [{ sku: 123, name: "Товар", quantity: 500, sourceRows: [7], notes: [] }];
let stored: {
  id: string; botKey: string; telegramUserId: string; chatId: string; status: string;
  selectedSheet: number; lines: typeof lines; supplierOrderId: number | null;
  expiresAt: Date; updatedAt: Date; fileName: string;
  sheets: Array<{ name: string; rows: unknown[]; errors: string[] }>;
};
let transport: PurchaseImportTransport;
const click = () => ({ update_id: 10, callback_query: {
  id: "callback", from: { id: 1 }, data: "buy:c:aabbccddeeff:0",
  message: { message_id: 2, chat: { id: 1, type: "private" } },
} });

beforeEach(() => {
  vi.resetAllMocks();
  vi.unstubAllGlobals();
  stored = { id: "aabbccddeeff", botKey: "stock", telegramUserId: "1", chatId: "1", status: "ready", selectedSheet: 0, lines: structuredClone(lines), supplierOrderId: null, expiresAt: new Date(Date.now() + 100_000), updatedAt: new Date(), fileName: "order.xlsx", sheets: [{ name: "Сводка", rows: [], errors: [] }, { name: "По позициям", rows: [], errors: [] }] };
  transport = { botKey: "stock", token: () => "secret-token", allowed: () => true, send: vi.fn().mockResolvedValue(undefined), answer: vi.fn().mockResolvedValue(undefined) };
  mocks.findUnique.mockImplementation(async () => structuredClone(stored));
  mocks.updateMany.mockImplementation(async ({ where, data }) => {
    if ((where.status?.in && !where.status.in.includes(stored.status)) || (where.status && typeof where.status === "string" && where.status !== stored.status) || (where.updatedAt && where.updatedAt.getTime() !== stored.updatedAt.getTime())) return { count: 0 };
    Object.assign(stored, data, { updatedAt: new Date(stored.updatedAt.getTime() + 1) });
    return { count: 1 };
  });
  mocks.update.mockImplementation(async ({ data }) => {
    Object.assign(stored, data, { updatedAt: new Date(stored.updatedAt.getTime() + 1) });
    return structuredClone(stored);
  });
  mocks.availability.mockResolvedValue({ products: [{ sku: 123, qty: "0", real_qty: 0, price: 10 }] });
  mocks.resolve.mockResolvedValue(structuredClone(lines));
  mocks.csv.mockReturnValue(Buffer.from("SKU;Количество\r\n123;500"));
  mocks.order.mockImplementation(async (input) => {
    if (!input.existingOrderId) await input.onCreateStarted();
    await input.onOrderResolved({ id: 77 });
    return { order: { id: 77 } };
  });
});

describe("durable Telegram purchase imports", () => {
  it("asks for one sheet on a redelivered upload and creates nothing before confirmation", async () => {
    stored.status = "uploaded";
    await processPurchaseImport({ update_id: 10, message: { message_id: 2, chat: { id: 1 }, from: { id: 1 }, document: { file_id: "file", file_name: "order.xlsx" } } }, transport);
    expect(transport.send).toHaveBeenCalledWith(1, expect.stringContaining("Выберите один лист"), expect.objectContaining({ reply_markup: {
      inline_keyboard: [
        [{ text: "1. Сводка", callback_data: "buy:s:aabbccddeeff:0" }],
        [{ text: "2. По позициям", callback_data: "buy:s:aabbccddeeff:1" }],
      ],
    } }));
    expect(mocks.upsert).not.toHaveBeenCalled();
    expect(mocks.order).not.toHaveBeenCalled();
  });

  it("prepares only the selected sheet, sends a report and then orders its full list", async () => {
    stored.status = "uploaded";
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ ok: true, result: { message_id: 3 } })));
    const selection = click();
    selection.callback_query.data = "buy:s:aabbccddeeff:1";
    await processPurchaseImport(selection, transport);
    expect(mocks.resolve).toHaveBeenCalledWith(stored.sheets[1]);
    expect(stored).toMatchObject({ status: "ready", selectedSheet: 1 });
    expect(mocks.order).not.toHaveBeenCalled();
    expect(transport.send).toHaveBeenCalledWith(1, expect.stringContaining("500 шт."), expect.objectContaining({ reply_markup: {
      inline_keyboard: [[{ text: "Создать весь заказ B2B", callback_data: "buy:c:aabbccddeeff:1" }]],
    } }));
    selection.callback_query.data = "buy:c:aabbccddeeff:1";
    await processPurchaseImport(selection, transport);
    expect(stored.status).toBe("completed");
  });

  it("leaves invalid sheets available for correction instead of creating a partial order", async () => {
    stored.status = "uploaded";
    mocks.resolve.mockRejectedValue(new Error("Строка 7: количество неверно"));
    const selection = click();
    selection.callback_query.data = "buy:s:aabbccddeeff:0";
    await processPurchaseImport(selection, transport);
    expect(stored.status).toBe("uploaded");
    expect(mocks.order).not.toHaveBeenCalled();
  });

  it("keeps all 500 units despite zero available stock and creates without reservation", async () => {
    await processPurchaseImport(click(), transport);
    expect(mocks.order).toHaveBeenCalledWith(expect.objectContaining({ lines: [{ sku: 123, quantity: 500, supplierPrice: 10 }], withoutReserve: true }));
    expect(stored).toMatchObject({ status: "completed", supplierOrderId: 77 });
  });

  it("claims concurrent confirmations once and reuses the persisted completed order", async () => {
    await Promise.all([processPurchaseImport(click(), transport), processPurchaseImport(click(), transport)]);
    await processPurchaseImport(click(), transport);
    expect(mocks.order).toHaveBeenCalledOnce();
    expect(transport.send).toHaveBeenCalledWith(1, expect.stringContaining("уже создан"));
  });

  it("retries partial filling in the same supplier order", async () => {
    mocks.order.mockImplementationOnce(async (input) => {
      await input.onCreateStarted();
      await input.onOrderResolved({ id: 77 });
      throw new Error("Позиция не принята");
    });
    await processPurchaseImport(click(), transport);
    expect(stored).toMatchObject({ status: "order_created", supplierOrderId: 77 });
    await processPurchaseImport(click(), transport);
    expect(mocks.order.mock.calls[1][0]).toMatchObject({ existingOrderId: 77, lines: [{ sku: 123, quantity: 500, supplierPrice: 10 }] });
    expect(stored.status).toBe("completed");
  });

  it("does not create a duplicate when the supplier create response is lost", async () => {
    mocks.order.mockImplementationOnce(async (input) => {
      await input.onCreateStarted();
      throw new Error("Соединение прервано");
    });
    await processPurchaseImport(click(), transport);
    expect(stored.status).toBe("uncertain");
    await processPurchaseImport(click(), transport);
    expect(mocks.order).toHaveBeenCalledOnce();
  });

  it("keeps completion even if the Telegram acknowledgement fails", async () => {
    vi.mocked(transport.send).mockRejectedValueOnce(new Error("Telegram unavailable"));
    await processPurchaseImport(click(), transport);
    expect(stored.status).toBe("completed");
    await processPurchaseImport(click(), transport);
    expect(mocks.order).toHaveBeenCalledOnce();
  });

  it("rejects other managers, old sheet buttons and expired new orders", async () => {
    stored.telegramUserId = "2";
    await processPurchaseImport(click(), transport);
    expect(mocks.order).not.toHaveBeenCalled();
    stored.telegramUserId = "1";
    stored.selectedSheet = 1;
    await processPurchaseImport(click(), transport);
    expect(mocks.order).not.toHaveBeenCalled();
    stored.selectedSheet = 0;
    stored.expiresAt = new Date(0);
    await processPurchaseImport(click(), transport);
    expect(mocks.order).not.toHaveBeenCalled();
  });

  it("does not download files or read import state for an unauthorized sender", async () => {
    transport.allowed = () => false;
    await processPurchaseImport({ update_id: 5, message: { message_id: 6, chat: { id: 2 }, from: { id: 2 }, document: { file_id: "file", file_name: "file.xlsx" } } }, transport);
    expect(mocks.findUnique).not.toHaveBeenCalled();
    expect(mocks.order).not.toHaveBeenCalled();
  });

  it("leaves ordinary bot updates to the existing handlers", async () => {
    expect(await processPurchaseImport({ update_id: 5 }, transport)).toBe(false);
    expect(mocks.findUnique).not.toHaveBeenCalled();
  });

  it("bounds downloads even when Telegram omits file_size", async () => {
    const fetcher = vi.fn().mockResolvedValueOnce(Response.json({ ok: true, result: { file_path: "documents/file.xlsx" } })).mockResolvedValueOnce(new Response(new Uint8Array(5 * 1024 * 1024 + 1)));
    vi.stubGlobal("fetch", fetcher);
    await expect(downloadPurchaseDocument({ file_id: "file", file_name: "file.xlsx" }, "secret")).rejects.toThrow("5 МБ");
  });

  it("does not expose the Telegram token in download errors", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("https://api.telegram.org/botsecret/getFile")));
    await expect(downloadPurchaseDocument({ file_id: "file", file_name: "file.xlsx" }, "secret")).rejects.toThrow("Telegram: не удалось");
  });
});
