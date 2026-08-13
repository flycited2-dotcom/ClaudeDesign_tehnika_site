import { afterEach, describe, expect, it } from "vitest";
import { stockOrderTelegramChatUrl } from "@/lib/telegram-chat-link";

afterEach(() => {
  delete process.env.STOCK_ORDER_TELEGRAM_CHAT_URL;
  delete process.env.STOCK_MONITOR_TELEGRAM_CHAT_ID;
  delete process.env.TELEGRAM_MANAGER_CHAT_ID;
});

describe("Telegram stock chat link", () => {
  it("prefers the explicitly configured chat URL", () => {
    process.env.STOCK_ORDER_TELEGRAM_CHAT_URL = "https://t.me/c/4478291004/1";
    process.env.STOCK_MONITOR_TELEGRAM_CHAT_ID = "-1000000000000";
    expect(stockOrderTelegramChatUrl()).toBe("https://t.me/c/4478291004/1");
  });

  it("derives a private supergroup link from its -100 chat ID", () => {
    process.env.STOCK_MONITOR_TELEGRAM_CHAT_ID = "-1004478291004";
    expect(stockOrderTelegramChatUrl()).toBe("https://t.me/c/4478291004/1");
  });
});
