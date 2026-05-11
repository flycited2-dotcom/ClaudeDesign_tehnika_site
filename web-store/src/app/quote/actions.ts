"use server";

import { z } from "zod";

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

  const header = scope === "b2b" ? "Запрос опт-цены" : "Запрос КП (44-ФЗ / 223-ФЗ)";
  const text = [
    header,
    `Имя: ${customerName}`,
    companyName ? `Организация: ${companyName}` : null,
    inn ? `ИНН: ${inn}` : null,
    `Телефон: ${phone}`,
    email ? `Email: ${email}` : null,
    context ? `Товар/раздел: ${context}` : null,
    comment ? `Комментарий: ${comment}` : null,
    `Дата: ${new Date().toLocaleString("ru-RU")}`,
  ]
    .filter(Boolean)
    .join("\n");

  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_MANAGER_CHAT_ID;

  if (!token || !chatId) {
    console.log("[quote]", text);
    return { ok: true };
  }

  try {
    const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text, disable_web_page_preview: true }),
    });
    if (!response.ok) {
      console.error("[quote] telegram failed", response.status);
      return { error: "Не удалось отправить заявку. Позвоните нам напрямую." };
    }
    return { ok: true };
  } catch (error) {
    console.error("[quote]", error);
    return { error: "Не удалось отправить заявку. Позвоните нам напрямую." };
  }
}
