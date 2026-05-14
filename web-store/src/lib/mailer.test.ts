import { describe, expect, it } from "vitest";
import {
  buildMagicLinkEmail,
  buildRoleApprovedEmail,
  buildRoleRejectedEmail,
} from "@/lib/mailer";

describe("buildMagicLinkEmail", () => {
  it("embeds the verification URL and the email", () => {
    const { subject, text, html } = buildMagicLinkEmail({
      url: "https://example.com/login/verify?token=abc",
      email: "user@example.com",
    });
    expect(subject).toContain("Вход в личный кабинет");
    expect(text).toContain("https://example.com/login/verify?token=abc");
    expect(text).toContain("user@example.com");
    expect(html).toContain("https://example.com/login/verify?token=abc");
  });

  it("mentions the 15-minute TTL", () => {
    const { text } = buildMagicLinkEmail({ url: "https://x", email: "a@b.co" });
    expect(text).toMatch(/15 минут/);
  });
});

describe("buildRoleApprovedEmail", () => {
  it("uses opt label for b2b", () => {
    const { subject, text } = buildRoleApprovedEmail({ role: "b2b", orgName: "ООО Тест" });
    expect(subject).toContain("опт-клиента");
    expect(text).toContain("«ООО Тест»");
  });

  it("uses gov label for gov", () => {
    const { subject } = buildRoleApprovedEmail({ role: "gov", orgName: "Школа №14" });
    expect(subject).toContain("госзаказчика");
  });
});

describe("buildRoleRejectedEmail", () => {
  it("includes the rejection note when provided", () => {
    const { text } = buildRoleRejectedEmail({
      role: "b2b",
      orgName: "ООО Тест",
      note: "Не подтверждены реквизиты",
    });
    expect(text).toContain("Не подтверждены реквизиты");
  });

  it("falls back to manager-contact line when no note", () => {
    const { text } = buildRoleRejectedEmail({ role: "gov", orgName: "ООО Тест" });
    expect(text).toMatch(/менеджер/i);
  });
});
