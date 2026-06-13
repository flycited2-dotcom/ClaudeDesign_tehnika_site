import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { clampTelegramText, sendTelegramMessage } from "@/lib/telegram";

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
