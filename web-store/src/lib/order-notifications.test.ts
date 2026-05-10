import { describe, expect, it, vi } from "vitest";
import { sendOrderNotificationSafely } from "@/lib/order-notifications";
import { buildTelegramOrderMessage } from "@/lib/telegram";

describe("sendOrderNotificationSafely", () => {
  it("does not fail checkout when Telegram notification fails", async () => {
    const result = await sendOrderNotificationSafely(
      {
        orderNumber: "ORD-1",
        customerName: "Иван",
        phone: "+79780000000",
        email: null,
        comment: null,
        quote: {
          items: [],
          total: 0,
        },
      },
      vi.fn().mockRejectedValue(new Error("telegram unavailable")),
    );

    expect(result).toEqual({ skipped: true, error: "telegram unavailable" });
  });

  it("includes the public 7-day delivery promise in Telegram order messages", () => {
    const message = buildTelegramOrderMessage({
      orderNumber: "ORD-1",
      customerName: "Иван",
      phone: "+79780000000",
      email: null,
      comment: null,
      quote: {
        items: [
          {
            sku: 1001,
            name: "Осушитель воздуха",
            quantity: 1,
            unitPrice: 19990,
            total: 19990,
          },
        ],
        total: 19990,
      },
    });

    expect(message).toContain("Доставка под заказ 7 дней");
    expect(message).toContain("Менеджер подтвердит наличие, цену и срок перед оформлением.");
    expect(message).not.toContain("день в день");
  });

  it("labels quick orders and includes the product page URL", () => {
    const message = buildTelegramOrderMessage({
      orderNumber: "ORD-QUICK",
      customerName: "Иван",
      phone: "+79780000000",
      email: null,
      comment: "Позвонить после 18:00",
      kind: "quick",
      sourceUrl: "https://climat-simf.ru/product/osushitel-11261200",
      quote: {
        items: [
          {
            sku: 11261200,
            name: "Осушитель воздуха Ballu",
            quantity: 1,
            unitPrice: 19800,
            total: 19800,
          },
        ],
        total: 19800,
      },
    });

    expect(message).toContain("Быстрый заказ ORD-QUICK");
    expect(message).toContain("Источник: карточка товара");
    expect(message).toContain("Страница: https://climat-simf.ru/product/osushitel-11261200");
    expect(message).toContain("Позвонить после 18:00");
  });
});
