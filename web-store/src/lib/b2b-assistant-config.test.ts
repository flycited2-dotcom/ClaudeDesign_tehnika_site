import { describe, expect, it } from "vitest";
import {
  b2bAssistantSearchLimit,
  parseMarkupPresets,
  parseTelegramUserIds,
} from "@/lib/b2b-assistant-config";

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

  it("uses twenty search results by default and accepts no larger page", () => {
    const previous = process.env.B2B_ASSISTANT_SEARCH_LIMIT;
    delete process.env.B2B_ASSISTANT_SEARCH_LIMIT;
    expect(b2bAssistantSearchLimit()).toBe(20);
    process.env.B2B_ASSISTANT_SEARCH_LIMIT = "21";
    expect(() => b2bAssistantSearchLimit()).toThrow(/1 до 20/);
    if (previous === undefined) delete process.env.B2B_ASSISTANT_SEARCH_LIMIT;
    else process.env.B2B_ASSISTANT_SEARCH_LIMIT = previous;
  });
});
