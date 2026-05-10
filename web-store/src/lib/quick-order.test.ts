import { describe, expect, it } from "vitest";
import { parseQuickOrderForm } from "@/lib/quick-order";

describe("parseQuickOrderForm", () => {
  it("parses a valid quick order form", () => {
    const formData = new FormData();
    formData.set("customerName", "Иван");
    formData.set("phone", "+79780000000");
    formData.set("comment", "Позвонить после 18:00");
    formData.set("sku", "11261200");
    formData.set("quantity", "2");
    formData.set("sourceUrl", "https://climat-simf.ru/product/osushitel-11261200");
    formData.set("personalDataConsent", "on");

    expect(parseQuickOrderForm(formData)).toEqual({
      customerName: "Иван",
      phone: "+79780000000",
      comment: "Позвонить после 18:00",
      sku: 11261200,
      quantity: 2,
      sourceUrl: "https://climat-simf.ru/product/osushitel-11261200",
    });
  });

  it("requires consent and valid product data", () => {
    const formData = new FormData();
    formData.set("customerName", "Иван");
    formData.set("phone", "+79780000000");
    formData.set("sku", "bad");
    formData.set("quantity", "1");

    expect(() => parseQuickOrderForm(formData)).toThrow("Подтвердите согласие на обработку персональных данных.");
  });
});
