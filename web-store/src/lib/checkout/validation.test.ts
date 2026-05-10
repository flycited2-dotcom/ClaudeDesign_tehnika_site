import { describe, expect, it } from "vitest";
import { buildOrderQuote, validatePersonalDataConsent } from "@/lib/checkout/validation";

describe("buildOrderQuote", () => {
  const products = [
    {
      sku: 1001,
      name: "Ноутбук Lenovo",
      price: 61000,
      multiplicity: 1,
      isAvailable: true,
    },
    {
      sku: 1002,
      name: "Кабель HDMI",
      price: 450,
      multiplicity: 3,
      isAvailable: true,
    },
  ];

  it("recalculates totals on the server from product data", () => {
    const quote = buildOrderQuote({
      cartItems: [
        { sku: 1001, quantity: 1 },
        { sku: 1002, quantity: 6 },
      ],
      products,
    });

    expect(quote.total).toBe(63700);
    expect(quote.items).toHaveLength(2);
  });

  it("rejects quantities that do not match multiplicity", () => {
    expect(() =>
      buildOrderQuote({
        cartItems: [{ sku: 1002, quantity: 2 }],
        products,
      }),
    ).toThrow("Кабель HDMI продается кратно 3 шт.");
  });
});

describe("validatePersonalDataConsent", () => {
  it("requires explicit personal data consent", () => {
    expect(() => validatePersonalDataConsent(undefined)).toThrow("Подтвердите согласие на обработку персональных данных.");
    expect(() => validatePersonalDataConsent("on")).not.toThrow();
  });
});
