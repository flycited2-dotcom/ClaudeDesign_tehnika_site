import { describe, expect, it } from "vitest";
import { parseMarkupPresets, parseTelegramUserIds } from "@/lib/b2b-assistant-config";

describe("B2B assistant config", () => {
  it("parses and deduplicates Telegram user ids", () => {
    expect(parseTelegramUserIds("123, 456;123")).toEqual([123, 456]);
    expect(() => parseTelegramUserIds("123,nope")).toThrow(/Telegram ID/);
  });

  it("uses safe markup presets", () => {
    expect(parseMarkupPresets(undefined)).toEqual([10, 15, 20, 25]);
    expect(parseMarkupPresets("12.5, 20, 12.5")).toEqual([12.5, 20]);
    expect(() => parseMarkupPresets("-1")).toThrow(/наценку/);
  });
});
