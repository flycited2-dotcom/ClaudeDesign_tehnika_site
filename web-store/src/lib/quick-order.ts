import { z } from "zod";
import { validatePersonalDataConsent } from "@/lib/checkout/validation";

export type QuickOrderInput = {
  customerName: string;
  phone: string;
  comment?: string;
  sku: number;
  quantity: number;
  sourceUrl?: string;
};

const quickOrderSchema = z.object({
  customerName: z.string().trim().min(2, "Укажите имя."),
  phone: z.string().trim().min(7, "Укажите телефон."),
  comment: z.string().trim().optional(),
  sku: z.coerce.number().int().positive("Некорректный товар."),
  quantity: z.coerce.number().int().positive("Некорректное количество."),
  sourceUrl: z.string().trim().url().optional().or(z.literal("")),
});

export function parseQuickOrderForm(formData: FormData): QuickOrderInput {
  validatePersonalDataConsent(formData.get("personalDataConsent"));

  const parsed = quickOrderSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Проверьте данные быстрого заказа.");
  }

  return {
    customerName: parsed.data.customerName,
    phone: parsed.data.phone,
    comment: parsed.data.comment || undefined,
    sku: parsed.data.sku,
    quantity: parsed.data.quantity,
    sourceUrl: parsed.data.sourceUrl || undefined,
  };
}
