"use server";

import { z } from "zod";
import { captureLead } from "@/lib/leads";
import { escapeTelegramHtml as e, TELEGRAM_DIVIDER } from "@/lib/telegram";

export type QuoteState = {
  ok?: boolean;
  error?: string;
};

const schema = z.object({
  customerName: z.string().min(2, "Укажите имя").max(120),
  companyName: z.string().max(160).optional().default(""),
  inn: z.string().max(20).optional().default(""),
  phone: z.string().min(5, "Укажите телефон").max(40),
  email: z.string().email("Неверный email").max(160).optional().or(z.literal("")).default(""),
  comment: z.string().max(800).optional().default(""),
  context: z.string().max(400).optional().default(""),
  scope: z.enum(["b2b", "gov"]).default("gov"),
  personalDataConsent: z.string().refine(
    (value) => value === "on" || value === "true" || value === "1",
    { message: "Подтвердите согласие на обработку данных" },
  ),
});

export async function requestQuoteAction(
  _previous: QuoteState,
  formData: FormData,
): Promise<QuoteState> {
  const parsed = schema.safeParse({
    customerName: formData.get("customerName"),
    companyName: formData.get("companyName") ?? "",
    inn: formData.get("inn") ?? "",
    phone: formData.get("phone"),
    email: formData.get("email") ?? "",
    comment: formData.get("comment") ?? "",
    context: formData.get("context") ?? "",
    scope: formData.get("scope") ?? "gov",
    personalDataConsent: formData.get("personalDataConsent") ?? "",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Проверьте поля формы" };
  }

  const { customerName, companyName, inn, phone, email, comment, context, scope } = parsed.data;

  const header = scope === "b2b" ? "💼 <b>Запрос опт-цены</b>" : "📋 <b>Запрос КП (44-ФЗ / 223-ФЗ)</b>";
  const text = [
    header,
    TELEGRAM_DIVIDER,
    `👤 <b>Имя:</b> ${e(customerName)}`,
    companyName ? `🏢 <b>Организация:</b> ${e(companyName)}` : null,
    inn ? `🔢 <b>ИНН:</b> ${e(inn)}` : null,
    `📞 <b>Телефон:</b> ${e(phone)}`,
    email ? `📧 <b>Email:</b> ${e(email)}` : null,
    context ? `📦 <b>Товар/раздел:</b> ${e(context)}` : null,
    comment ? `💬 <b>Комментарий:</b> ${e(comment)}` : null,
    `🕐 ${new Date().toLocaleString("ru-RU")}`,
  ]
    .filter(Boolean)
    .join("\n");

  try {
    await captureLead({
      type: "QUOTE",
      name: customerName,
      phone,
      email: email || null,
      company: companyName || null,
      inn: inn || null,
      scope,
      context: context || null,
      comment: comment || null,
      telegramText: text,
    });
    return { ok: true };
  } catch (error) {
    console.error("[quote]", error);
    return { error: "Не удалось сохранить заявку. Позвоните нам напрямую." };
  }
}
