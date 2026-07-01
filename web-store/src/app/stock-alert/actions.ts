"use server";

import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { captureLead } from "@/lib/leads";
import { escapeTelegramHtml as e, TELEGRAM_DIVIDER } from "@/lib/telegram";

export type StockAlertState = {
  ok?: boolean;
  error?: string;
};

const schema = z.object({
  customerName: z.string().min(2, "Укажите имя").max(120),
  phone: z.string().min(5, "Укажите телефон").max(40),
  productContext: z.string().max(400),
  personalDataConsent: z.string().refine(
    (value) => value === "on" || value === "true" || value === "1",
    { message: "Подтвердите согласие на обработку данных" },
  ),
});

export async function requestStockAlertAction(
  _previous: StockAlertState,
  formData: FormData,
): Promise<StockAlertState> {
  const parsed = schema.safeParse({
    customerName: formData.get("customerName"),
    phone: formData.get("phone"),
    productContext: formData.get("productContext") ?? "",
    personalDataConsent: formData.get("personalDataConsent") ?? "",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Проверьте поля формы" };
  }

  const { customerName, phone, productContext } = parsed.data;

  const text = [
    "🔔 <b>Уведомить о поступлении</b>",
    TELEGRAM_DIVIDER,
    `👤 <b>Имя:</b> ${e(customerName)}`,
    `📞 <b>Телефон:</b> ${e(phone)}`,
    `📦 <b>Товар:</b> ${e(productContext)}`,
    `🕐 ${new Date().toLocaleString("ru-RU")}`,
  ].join("\n");

  try {
    const user = await getCurrentUser();
    await captureLead({
      type: "STOCK_ALERT",
      name: customerName,
      phone,
      context: productContext,
      userId: user?.id ?? null,
      telegramText: text,
    });
    return { ok: true };
  } catch (error) {
    console.error("[stock-alert]", error);
    return { error: "Не удалось сохранить заявку. Позвоните нам напрямую." };
  }
}
