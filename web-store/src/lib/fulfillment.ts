export type PublicFulfillmentInput = {
  isAvailable: boolean;
};

export type PublicFulfillmentText = {
  stockLabel: string;
  stockShortLabel: string;
  deliveryLabel: string;
  deliveryShortLabel: string;
  confirmationNote: string;
  canOrder: boolean;
};

export const PUBLIC_DELIVERY_DAYS = 7;

export function publicFulfillmentText({ isAvailable }: PublicFulfillmentInput): PublicFulfillmentText {
  return {
    stockLabel: isAvailable ? "В наличии у поставщика" : "Нет в наличии у поставщика",
    stockShortLabel: isAvailable ? "В наличии" : "Нет в наличии",
    deliveryLabel: `Доставка под заказ ${PUBLIC_DELIVERY_DAYS} дней`,
    deliveryShortLabel: `Под заказ ${PUBLIC_DELIVERY_DAYS} дней`,
    confirmationNote: "Менеджер подтвердит наличие, цену и срок перед оформлением.",
    canOrder: isAvailable,
  };
}
