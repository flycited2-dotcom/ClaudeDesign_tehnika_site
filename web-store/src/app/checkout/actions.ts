"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { validatePersonalDataConsent } from "@/lib/checkout/validation";
import { createLocalOrder } from "@/lib/orders";

export type CheckoutState = {
  error?: string;
};

const schema = z.object({
  customerName: z.string().min(2, "Укажите имя."),
  phone: z.string().min(7, "Укажите телефон."),
  email: z.string().email("Некорректный email.").optional().or(z.literal("")),
  comment: z.string().optional(),
  cartItems: z.string().min(2, "Корзина пустая."),
});

const cartSchema = z.array(
  z.object({
    sku: z.number().int().positive(),
    quantity: z.number().int().positive(),
  }),
);

export async function createCheckoutOrder(_state: CheckoutState, formData: FormData): Promise<CheckoutState> {
  try {
    validatePersonalDataConsent(formData.get("personalDataConsent"));
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Подтвердите согласие на обработку персональных данных." };
  }

  const parsed = schema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Проверьте данные заказа." };
  }

  const parsedCart = cartSchema.safeParse(JSON.parse(parsed.data.cartItems));
  if (!parsedCart.success || !parsedCart.data.length) {
    return { error: "Корзина пустая или повреждена." };
  }

  let orderId = "";
  try {
    const order = await createLocalOrder({
      customerName: parsed.data.customerName,
      phone: parsed.data.phone,
      email: parsed.data.email || null,
      comment: parsed.data.comment || null,
      cartItems: parsedCart.data,
    });
    orderId = order.id;
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Не удалось создать заказ." };
  }

  redirect(`/order-success/${orderId}`);
}
