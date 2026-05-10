import { OrderStatus } from "@prisma/client";
import { describe, expect, it } from "vitest";
import { buildCustomerOrderSteps, orderStatusMeta } from "@/lib/order-status";

describe("orderStatusMeta", () => {
  it("returns Russian manager-facing labels for order statuses", () => {
    expect(orderStatusMeta[OrderStatus.NEW]).toMatchObject({ label: "Новая заявка", tone: "red" });
    expect(orderStatusMeta[OrderStatus.SENT_TO_SUPPLIER]).toMatchObject({ label: "Заказан у поставщика", tone: "blue" });
    expect(orderStatusMeta[OrderStatus.COMPLETED]).toMatchObject({ label: "Завершен", tone: "green" });
  });
});

describe("buildCustomerOrderSteps", () => {
  it("builds a clear customer timeline for a 7-day supplier order", () => {
    expect(buildCustomerOrderSteps()).toEqual([
      { title: "Заявка принята", description: "Мы получили состав заказа и контактные данные." },
      { title: "Менеджер подтверждает детали", description: "Проверим наличие у поставщика, актуальную цену и доставку под заказ 7 дней." },
      { title: "Согласуем оплату и получение", description: "После подтверждения менеджер подскажет удобный способ оплаты и доставки." },
    ]);
  });
});
