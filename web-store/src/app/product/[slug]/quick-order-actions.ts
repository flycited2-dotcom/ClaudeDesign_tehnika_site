"use server";

import { redirect } from "next/navigation";
import { createLocalOrder } from "@/lib/orders";
import { parseQuickOrderForm } from "@/lib/quick-order";

export type QuickOrderState = {
  error?: string;
};

export async function createQuickOrder(_state: QuickOrderState, formData: FormData): Promise<QuickOrderState> {
  let input;
  try {
    input = parseQuickOrderForm(formData);
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Проверьте данные быстрого заказа." };
  }

  let orderId = "";
  try {
    const comment = ["Быстрый заказ с карточки товара.", input.comment ? `Комментарий клиента: ${input.comment}` : null].filter(Boolean).join("\n");
    const order = await createLocalOrder({
      customerName: input.customerName,
      phone: input.phone,
      email: null,
      comment,
      cartItems: [{ sku: input.sku, quantity: input.quantity }],
      notificationKind: "quick",
      sourceUrl: input.sourceUrl,
    });
    orderId = order.id;
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Не удалось отправить быстрый заказ." };
  }

  redirect(`/order-success/${orderId}`);
}
