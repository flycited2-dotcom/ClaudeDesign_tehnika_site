"use server";

import { z } from "zod";

export type CallbackState = {
  ok?: boolean;
  error?: string;
};

const callbackSchema = z.object({
  customerName: z.string().min(2, "Укажите имя").max(120),
  phone: z.string().min(5, "Укажите телефон").max(40),
  comment: z.string().max(500).optional(),
  personalDataConsent: z.string().refine((value) => value === "on" || value === "true" || value === "1", {
    message: "Подтвердите согласие на обработку данных",
  }),
});

export async function requestCallbackAction(
  _prevState: CallbackState,
  formData: FormData,
): Promise<CallbackState> {
  const parsed = callbackSchema.safeParse({
    customerName: formData.get("customerName"),
    phone: formData.get("phone"),
    comment: formData.get("comment") ?? undefined,
    personalDataConsent: formData.get("personalDataConsent") ?? "",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Проверьте поля формы" };
  }

  const { customerName, phone, comment } = parsed.data;
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_MANAGER_CHAT_ID;

  const text = [
    "Запрос обратного звонка",
    `Имя: ${customerName}`,
    `Телефон: ${phone}`,
    comment ? `Комментарий: ${comment}` : null,
    `Дата: ${new Date().toLocaleString("ru-RU")}`,
  ]
    .filter(Boolean)
    .join("\n");

  if (!token || !chatId) {
    console.log("[callback]", text);
    return { ok: true };
  }

  try {
    const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        disable_web_page_preview: true,
      }),
    });
    if (!response.ok) {
      console.error("[callback] telegram failed", response.status);
      return { error: "Не удалось отправить заявку. Позвоните нам напрямую." };
    }
    return { ok: true };
  } catch (error) {
    console.error("[callback]", error);
    return { error: "Не удалось отправить заявку. Позвоните нам напрямую." };
  }
}
