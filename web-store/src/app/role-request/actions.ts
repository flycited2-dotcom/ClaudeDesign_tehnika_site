"use server";

import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { storefront } from "@/lib/storefront";

const schema = z.object({
  requestedRole: z.enum(["b2b", "gov"]),
  orgName: z.string().min(2).max(200),
  inn: z.string().trim().max(20).optional(),
  contactPerson: z.string().min(2).max(120),
  phone: z.string().trim().min(5).max(40),
  note: z.string().trim().max(2000).optional(),
});

export type RequestRoleUpgradeResult =
  | { ok: true; message: string }
  | { ok: false; error: string };

async function notifyManagerOnTelegram(payload: {
  requestId: string;
  requestedRole: "b2b" | "gov";
  email: string;
  orgName: string;
  inn?: string | null;
  contactPerson: string;
  phone: string;
  note?: string | null;
}): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_MANAGER_CHAT_ID;
  if (!token || !chatId) return;

  const roleLabel = payload.requestedRole === "b2b" ? "опт-клиента" : "госзаказчика";
  const lines = [
    `Новая заявка на статус ${roleLabel} (${payload.requestId})`,
    `Email: ${payload.email}`,
    `Организация: ${payload.orgName}`,
    payload.inn ? `ИНН: ${payload.inn}` : null,
    `Контакт: ${payload.contactPerson}`,
    `Телефон: ${payload.phone}`,
    payload.note ? `Комментарий: ${payload.note}` : null,
    "",
    `Подтвердить: ${storefront.siteUrl}/admin/role-requests`,
  ].filter(Boolean);

  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: lines.join("\n"),
        disable_web_page_preview: true,
      }),
    });
  } catch {
    /* swallow notification errors — request is already persisted */
  }
}

export async function requestRoleUpgradeAction(formData: FormData): Promise<RequestRoleUpgradeResult> {
  const user = await getCurrentUser();
  if (!user) {
    return { ok: false, error: "Сначала войдите в кабинет." };
  }

  const parsed = schema.safeParse({
    requestedRole: String(formData.get("requestedRole") ?? ""),
    orgName: String(formData.get("orgName") ?? ""),
    inn: formData.get("inn") ? String(formData.get("inn")) : undefined,
    contactPerson: String(formData.get("contactPerson") ?? ""),
    phone: String(formData.get("phone") ?? ""),
    note: formData.get("note") ? String(formData.get("note")) : undefined,
  });

  if (!parsed.success) {
    return { ok: false, error: "Проверьте поля формы — что-то заполнено некорректно." };
  }

  const data = parsed.data;
  const requestedPrismaRole = data.requestedRole === "b2b" ? "B2B" : "GOV";

  const existing = await prisma.roleUpgradeRequest.findFirst({
    where: { userId: user.id, status: "PENDING", requestedRole: requestedPrismaRole },
  });
  if (existing) {
    return {
      ok: false,
      error: "Заявка уже отправлена и находится на рассмотрении. Менеджер свяжется с вами.",
    };
  }

  const created = await prisma.roleUpgradeRequest.create({
    data: {
      userId: user.id,
      requestedRole: requestedPrismaRole,
      orgName: data.orgName,
      inn: data.inn || null,
      contactPerson: data.contactPerson,
      phone: data.phone,
      note: data.note || null,
    },
  });

  await notifyManagerOnTelegram({
    requestId: created.id,
    requestedRole: data.requestedRole,
    email: user.email,
    orgName: data.orgName,
    inn: data.inn ?? null,
    contactPerson: data.contactPerson,
    phone: data.phone,
    note: data.note ?? null,
  });

  return {
    ok: true,
    message:
      "Заявка отправлена. Менеджер свяжется с вами в рабочее время для подтверждения реквизитов.",
  };
}
