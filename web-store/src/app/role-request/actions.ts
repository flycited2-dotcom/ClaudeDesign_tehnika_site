"use server";

import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { storefront } from "@/lib/storefront";
import { escapeTelegramHtml as e, sendTelegramMessage, TELEGRAM_DIVIDER } from "@/lib/telegram";

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
  const roleLabel = payload.requestedRole === "b2b" ? "опт-клиента" : "госзаказчика";
  const text = [
    `🤝 <b>Заявка на статус ${roleLabel}</b>`,
    TELEGRAM_DIVIDER,
    `📧 <b>Email:</b> ${e(payload.email)}`,
    `🏢 <b>Организация:</b> ${e(payload.orgName)}`,
    payload.inn ? `🔢 <b>ИНН:</b> ${e(payload.inn)}` : null,
    `👤 <b>Контакт:</b> ${e(payload.contactPerson)}`,
    `📞 <b>Телефон:</b> ${e(payload.phone)}`,
    payload.note ? `💬 <b>Комментарий:</b> ${e(payload.note)}` : null,
    TELEGRAM_DIVIDER,
    `✅ Подтвердить: ${storefront.siteUrl}/admin/role-requests`,
  ]
    .filter(Boolean)
    .join("\n");

  // best-effort — the request is already persisted in the DB
  await sendTelegramMessage(text);
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
