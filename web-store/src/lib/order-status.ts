import { OrderStatus } from "@prisma/client";

export type OrderStatusTone = "red" | "amber" | "blue" | "green" | "zinc";

export const orderStatusMeta: Record<OrderStatus, { label: string; tone: OrderStatusTone; description: string }> = {
  [OrderStatus.NEW]: {
    label: "Новая заявка",
    tone: "red",
    description: "Нужно связаться с клиентом и подтвердить состав заказа.",
  },
  [OrderStatus.PROCESSING]: {
    label: "В работе",
    tone: "amber",
    description: "Менеджер проверяет наличие, цену и срок доставки.",
  },
  [OrderStatus.CONFIRMED]: {
    label: "Подтвержден",
    tone: "blue",
    description: "Детали согласованы с клиентом.",
  },
  [OrderStatus.SENT_TO_SUPPLIER]: {
    label: "Заказан у поставщика",
    tone: "blue",
    description: "Товар заказан у поставщика, ожидаем поставку.",
  },
  [OrderStatus.SUPPLIER_ERROR]: {
    label: "Проблема у поставщика",
    tone: "red",
    description: "Нужно предложить замену или уточнить новые условия.",
  },
  [OrderStatus.COMPLETED]: {
    label: "Завершен",
    tone: "green",
    description: "Заказ выполнен.",
  },
  [OrderStatus.CANCELLED]: {
    label: "Отменен",
    tone: "zinc",
    description: "Заказ отменен.",
  },
};

export function buildCustomerOrderSteps() {
  return [
    {
      title: "Заявка принята",
      description: "Мы получили состав заказа и контактные данные.",
    },
    {
      title: "Менеджер подтверждает детали",
      description: "Проверим наличие у поставщика, актуальную цену и доставку под заказ 7 дней.",
    },
    {
      title: "Согласуем оплату и получение",
      description: "После подтверждения менеджер подскажет удобный способ оплаты и доставки.",
    },
  ];
}
