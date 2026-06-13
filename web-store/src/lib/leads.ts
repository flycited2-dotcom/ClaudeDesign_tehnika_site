import { prisma } from "@/lib/db";
import { sendTelegramMessage } from "@/lib/telegram";

export type LeadInput = {
  type: "CALLBACK" | "QUOTE";
  name: string;
  phone: string;
  email?: string | null;
  company?: string | null;
  inn?: string | null;
  scope?: string | null;
  context?: string | null;
  comment?: string | null;
  /** Pre-built message for the manager Telegram chat. */
  telegramText: string;
};

/**
 * Persist a callback/quote lead, then notify the manager on Telegram
 * best-effort. The DB row is the source of truth — if Telegram is down or not
 * configured the lead is still captured (visible in /admin/leads), so a lead is
 * never silently lost (unlike the previous Telegram-only flow). Throws only if
 * the durable write fails, which the caller surfaces as an error.
 */
export async function captureLead(input: LeadInput): Promise<{ ok: true; delivered: boolean }> {
  await prisma.lead.create({
    data: {
      type: input.type,
      name: input.name,
      phone: input.phone,
      email: input.email || null,
      company: input.company || null,
      inn: input.inn || null,
      scope: input.scope || null,
      context: input.context || null,
      comment: input.comment || null,
    },
  });

  const { delivered } = await sendTelegramMessage(input.telegramText);
  return { ok: true, delivered };
}
