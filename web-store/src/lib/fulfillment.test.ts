import { describe, expect, it } from "vitest";
import { publicFulfillmentText } from "@/lib/fulfillment";

describe("publicFulfillmentText", () => {
  it("shows supplier availability and 7-day under-order delivery for orderable products", () => {
    expect(publicFulfillmentText({ isAvailable: true })).toEqual({
      stockLabel: "В наличии у поставщика",
      stockShortLabel: "В наличии",
      deliveryLabel: "Доставка под заказ 7 дней",
      deliveryShortLabel: "Под заказ 7 дней",
      confirmationNote: "Менеджер подтвердит наличие, цену и срок перед оформлением.",
      canOrder: true,
    });
  });

  it("shows unavailable supplier copy for products that cannot be ordered", () => {
    expect(publicFulfillmentText({ isAvailable: false })).toMatchObject({
      stockLabel: "Нет в наличии у поставщика",
      stockShortLabel: "Нет в наличии",
      deliveryLabel: "Доставка под заказ 7 дней",
      deliveryShortLabel: "Под заказ 7 дней",
      canOrder: false,
    });
  });
});
