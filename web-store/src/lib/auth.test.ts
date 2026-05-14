import { describe, expect, it } from "vitest";
import { isValidEmail, normalizeEmail, roleToStorefront, storefrontToRole } from "@/lib/auth";

describe("normalizeEmail", () => {
  it("lowercases and trims", () => {
    expect(normalizeEmail("  Foo@Example.COM ")).toBe("foo@example.com");
  });
});

describe("isValidEmail", () => {
  it("accepts well-formed emails", () => {
    expect(isValidEmail("a@b.co")).toBe(true);
    expect(isValidEmail("user.name+tag@example.org")).toBe(true);
  });

  it("rejects malformed emails", () => {
    expect(isValidEmail("noatsign")).toBe(false);
    expect(isValidEmail("a@b")).toBe(false);
    expect(isValidEmail("a @b.co")).toBe(false);
    expect(isValidEmail("")).toBe(false);
  });
});

describe("role mapping", () => {
  it("converts prisma role to storefront role", () => {
    expect(roleToStorefront("B2C")).toBe("b2c");
    expect(roleToStorefront("B2B")).toBe("b2b");
    expect(roleToStorefront("GOV")).toBe("gov");
  });

  it("converts storefront role to prisma role", () => {
    expect(storefrontToRole("b2c")).toBe("B2C");
    expect(storefrontToRole("b2b")).toBe("B2B");
    expect(storefrontToRole("gov")).toBe("GOV");
  });

  it("round-trips for each role", () => {
    for (const role of ["b2c", "b2b", "gov"] as const) {
      expect(roleToStorefront(storefrontToRole(role))).toBe(role);
    }
  });
});
