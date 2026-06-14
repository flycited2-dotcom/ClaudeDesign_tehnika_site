import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  buildTelegramOrderMessage,
  clampTelegramText,
  escapeTelegramHtml,
  sendTelegramMessage,
} from "@/lib/telegram";
import { getStoreSettings } from "@/lib/settings";

vi.mock("@/lib/settings", () => ({ getStoreSettings: vi.fn() }));

const mockedGetStoreSettings = vi.mocked(getStoreSettings);
const storeSettings = (telegramChatId: string) => ({
  markupPercent: 25,
  minMarkupRub: 300,
  priceMode: "formula" as const,
  orderCreateEnabled: false,
  telegramChatId,
});

describe("clampTelegramText", () => {
  it("leaves text within the limit unchanged", () => {
    expect(clampTelegramText("short")).toBe("short");
  });

  it("clamps text over 4096 chars and appends a notice", () => {
    const out = clampTelegramText("x".repeat(5000));
    expect(out.length).toBeLessThanOrEqual(4096);
    expect(out).toContain("обрезано");
  });
});

describe("escapeTelegramHtml", () => {
  it("escapes < > & so HTML parse_mode is safe", () => {
    expect(escapeTelegramHtml('a<b>&"')).toBe('a&lt;b&gt;&amp;"');
  });
});

describe("buildTelegramOrderMessage", () => {
  it("formats an order with bold, emoji and escaped user content", () => {
    const msg = buildTelegramOrderMessage({
      orderNumber: "ORD-1",
      customerName: "Иван <скидка>",
      phone: "+7 999",
      kind: "quick",
      quote: { total: 1000, items: [{ sku: 1, name: "Холодильник", quantity: 2, unitPrice: 500, total: 1000, multiplicity: 1 }] },
    });
    expect(msg).toContain("⚡ <b>Быстрый заказ</b>");
    expect(msg).toContain("<b>Имя:</b> Иван &lt;скидка&gt;"); // escaped
    expect(msg).toContain("💰 <b>Итого:");
    expect(msg).toContain("Холодильник");
    expect(msg).not.toContain("<скидка>"); // raw tag must not leak
  });
});

describe("sendTelegramMessage", () => {
  let prevToken: string | undefined;
  let prevChat: string | undefined;
  let prevFetch: typeof globalThis.fetch;

  beforeEach(() => {
    prevToken = process.env.TELEGRAM_BOT_TOKEN;
    prevChat = process.env.TELEGRAM_MANAGER_CHAT_ID;
    prevFetch = globalThis.fetch;
    mockedGetStoreSettings.mockResolvedValue(storeSettings(""));
  });

  afterEach(() => {
    if (prevToken === undefined) delete process.env.TELEGRAM_BOT_TOKEN;
    else process.env.TELEGRAM_BOT_TOKEN = prevToken;
    if (prevChat === undefined) delete process.env.TELEGRAM_MANAGER_CHAT_ID;
    else process.env.TELEGRAM_MANAGER_CHAT_ID = prevChat;
    globalThis.fetch = prevFetch;
    vi.clearAllMocks();
  });

  it("reports not delivered (and does not throw or hit the network) when env is unset", async () => {
    delete process.env.TELEGRAM_BOT_TOKEN;
    delete process.env.TELEGRAM_MANAGER_CHAT_ID;
    await expect(sendTelegramMessage("test")).resolves.toEqual({ delivered: false });
  });

  it("sends to the admin-configured chat id from settings, not only env", async () => {
    delete process.env.TELEGRAM_MANAGER_CHAT_ID; // env has no chat id
    process.env.TELEGRAM_BOT_TOKEN = "test-token";
    mockedGetStoreSettings.mockResolvedValue(storeSettings("-1009999")); // admin set the group id
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    globalThis.fetch = fetchMock as unknown as typeof globalThis.fetch;

    const result = await sendTelegramMessage("hi");

    expect(result).toEqual({ delivered: true });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const body = JSON.parse((fetchMock.mock.calls[0][1] as RequestInit).body as string);
    expect(body.chat_id).toBe("-1009999");
  });
});
