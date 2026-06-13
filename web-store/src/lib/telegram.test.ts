import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  buildTelegramOrderMessage,
  clampTelegramText,
  escapeTelegramHtml,
  sendTelegramMessage,
} from "@/lib/telegram";

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

  beforeEach(() => {
    prevToken = process.env.TELEGRAM_BOT_TOKEN;
    prevChat = process.env.TELEGRAM_MANAGER_CHAT_ID;
  });

  afterEach(() => {
    if (prevToken === undefined) delete process.env.TELEGRAM_BOT_TOKEN;
    else process.env.TELEGRAM_BOT_TOKEN = prevToken;
    if (prevChat === undefined) delete process.env.TELEGRAM_MANAGER_CHAT_ID;
    else process.env.TELEGRAM_MANAGER_CHAT_ID = prevChat;
  });

  it("reports not delivered (and does not throw or hit the network) when env is unset", async () => {
    delete process.env.TELEGRAM_BOT_TOKEN;
    delete process.env.TELEGRAM_MANAGER_CHAT_ID;
    await expect(sendTelegramMessage("test")).resolves.toEqual({ delivered: false });
  });
});
