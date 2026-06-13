import { describe, expect, it } from "vitest";
import { formatRuPhone } from "@/components/phone-field";

describe("formatRuPhone", () => {
  it("always keeps a locked +7 prefix, even when empty", () => {
    expect(formatRuPhone("")).toBe("+7 ");
    expect(formatRuPhone("+7")).toBe("+7 ");
    expect(formatRuPhone("+7 ")).toBe("+7 ");
    expect(formatRuPhone("+")).toBe("+7 ");
  });

  it("groups 10 subscriber digits", () => {
    expect(formatRuPhone("+7 9991234567")).toBe("+7 999 123 45 67");
    expect(formatRuPhone("9991234567")).toBe("+7 999 123 45 67");
  });

  it("strips a pasted country code (7 or 8)", () => {
    expect(formatRuPhone("89991234567")).toBe("+7 999 123 45 67");
    expect(formatRuPhone("+79991234567")).toBe("+7 999 123 45 67");
  });

  it("caps at 10 digits", () => {
    expect(formatRuPhone("999123456789999")).toBe("+7 999 123 45 67");
  });

  it("formats partial input progressively", () => {
    expect(formatRuPhone("+7 999")).toBe("+7 999");
    expect(formatRuPhone("+7 999123")).toBe("+7 999 123");
    expect(formatRuPhone("+7 99912345")).toBe("+7 999 123 45");
  });

  it("is stable when re-applied to its own output", () => {
    const once = formatRuPhone("9991234567");
    expect(formatRuPhone(once)).toBe(once);
  });
});
