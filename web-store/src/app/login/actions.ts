"use server";

import { headers } from "next/headers";
import { z } from "zod";
import {
  createMagicLinkToken,
  findOrCreateUser,
  isValidEmail,
  normalizeEmail,
} from "@/lib/auth";
import { buildMagicLinkEmail, sendMail } from "@/lib/mailer";
import { storefront } from "@/lib/storefront";

const schema = z.object({
  email: z.string().min(3).max(200),
  next: z.string().optional(),
});

export type RequestMagicLinkResult =
  | { ok: true; message: string }
  | { ok: false; error: string };

export async function requestMagicLinkAction(formData: FormData): Promise<RequestMagicLinkResult> {
  const parsed = schema.safeParse({
    email: String(formData.get("email") ?? ""),
    next: formData.get("next") ? String(formData.get("next")) : undefined,
  });
  if (!parsed.success) {
    return { ok: false, error: "Введите корректный email" };
  }

  const email = normalizeEmail(parsed.data.email);
  if (!isValidEmail(email)) {
    return { ok: false, error: "Введите корректный email" };
  }

  await findOrCreateUser(email);
  const { token } = await createMagicLinkToken(email);

  const headerStore = await headers();
  const host = headerStore.get("host");
  const proto = headerStore.get("x-forwarded-proto") ?? (process.env.NODE_ENV === "production" ? "https" : "http");
  const origin = host ? `${proto}://${host}` : storefront.siteUrl;

  const nextParam = parsed.data.next && parsed.data.next.startsWith("/") ? `&next=${encodeURIComponent(parsed.data.next)}` : "";
  const url = `${origin}/login/verify?token=${token}${nextParam}`;

  const mail = buildMagicLinkEmail({ url, email });
  const send = await sendMail({ to: email, subject: mail.subject, text: mail.text, html: mail.html });
  if (!send.ok) {
    return { ok: false, error: "Не удалось отправить письмо. Попробуйте позже." };
  }

  return {
    ok: true,
    message: `Ссылка для входа отправлена на ${email}. Действует 15 минут.`,
  };
}
