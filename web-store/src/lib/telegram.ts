import type { OrderQuote } from "@/lib/checkout/validation";
import { publicFulfillmentText } from "@/lib/fulfillment";
import { formatRub } from "@/lib/format";
import { getStoreSettings } from "@/lib/settings";

/**
 * Manager chat id, sourced from the admin settings (DB) with an env fallback.
 * /admin/settings is the source of truth, so the owner can point notifications
 * at a group chat without a redeploy. Never throws — if the DB is unreachable we
 * fall back to the env var so notifications still go out.
 */
async function resolveManagerChatId(): Promise<string> {
  try {
    return (await getStoreSettings()).telegramChatId;
  } catch {
    return process.env.TELEGRAM_MANAGER_CHAT_ID ?? "";
  }
}

// Telegram's sendMessage rejects text over 4096 chars with HTTP 400 — a large
// order (50+ line items) would otherwise lose its notification entirely. Clamp
// so the notification always goes through; the full record lives in the admin.
const TELEGRAM_MAX_LENGTH = 4096;

export function clampTelegramText(text: string): string {
  if (text.length <= TELEGRAM_MAX_LENGTH) return text;
  const notice = "\n…(сообщение обрезано — полная заявка в админке)";
  const budget = TELEGRAM_MAX_LENGTH - notice.length;
  const slice = text.slice(0, budget);
  // Cut at a line boundary so we don't truncate inside an HTML tag (which would
  // make Telegram reject the whole message).
  const lastNewline = slice.lastIndexOf("\n");
  const safe = lastNewline > budget * 0.5 ? slice.slice(0, lastNewline) : slice;
  return safe + notice;
}

/** Escape user-supplied text for Telegram HTML parse_mode. */
export function escapeTelegramHtml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export const TELEGRAM_DIVIDER = "➖➖➖➖➖➖➖➖➖➖";

/**
 * Best-effort plain-text notification to the manager chat. Returns whether the
 * message was actually delivered so callers can decide on fallbacks. Never
 * throws — a notification failure must not break the action that triggered it.
 */
export async function sendTelegramMessage(text: string): Promise<{ delivered: boolean }> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = await resolveManagerChatId();
  if (!token || !chatId) return { delivered: false };

  try {
    const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: clampTelegramText(text),
        parse_mode: "HTML",
        disable_web_page_preview: true,
      }),
    });
    return { delivered: response.ok };
  } catch {
    return { delivered: false };
  }
}

export function buildTelegramOrderMessage({
  orderNumber,
  customerName,
  phone,
  email,
  comment,
  kind = "order",
  sourceUrl,
  quote,
}: {
  orderNumber: string;
  customerName: string;
  phone: string;
  email?: string | null;
  comment?: string | null;
  kind?: "order" | "quick";
  sourceUrl?: string | null;
  quote: OrderQuote;
}) {
  const fulfillment = publicFulfillmentText({ isAvailable: true });
  const e = escapeTelegramHtml;
  const header = kind === "quick" ? "⚡ <b>Быстрый заказ</b>" : "🛒 <b>Новый заказ</b>";
  const lines = [
    `${header}  <code>${e(orderNumber)}</code>`,
    TELEGRAM_DIVIDER,
    `👤 <b>Имя:</b> ${e(customerName)}`,
    `📞 <b>Телефон:</b> ${e(phone)}`,
    email ? `📧 <b>Email:</b> ${e(email)}` : null,
    comment ? `💬 <b>Комментарий:</b> ${e(comment)}` : null,
    sourceUrl ? `🔗 ${e(sourceUrl)}` : null,
    TELEGRAM_DIVIDER,
    "📦 <b>Состав заказа:</b>",
    ...quote.items.map(
      (item) =>
        `• ${e(item.name)}\n    ${item.quantity} шт × ${formatRub(item.unitPrice)} = <b>${formatRub(item.total)}</b>  <i>(SKU ${item.sku})</i>`,
    ),
    TELEGRAM_DIVIDER,
    `💰 <b>Итого: ${formatRub(quote.total)}</b>`,
    `🚚 ${e(fulfillment.deliveryLabel)}`,
    `🕐 ${e(new Date().toLocaleString("ru-RU"))}`,
  ].filter(Boolean);

  return lines.join("\n");
}

export async function sendTelegramOrderNotification({
  orderNumber,
  customerName,
  phone,
  email,
  comment,
  kind,
  sourceUrl,
  quote,
}: {
  orderNumber: string;
  customerName: string;
  phone: string;
  email?: string | null;
  comment?: string | null;
  kind?: "order" | "quick";
  sourceUrl?: string | null;
  quote: OrderQuote;
}) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = await resolveManagerChatId();

  if (!token || !chatId) {
    return { skipped: true };
  }

  const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      chat_id: chatId,
      text: clampTelegramText(
        buildTelegramOrderMessage({ orderNumber, customerName, phone, email, comment, kind, sourceUrl, quote }),
      ),
      parse_mode: "HTML",
      disable_web_page_preview: true,
    }),
  });

  if (!response.ok) {
    throw new Error(`Telegram notification failed: ${response.status}`);
  }

  return { skipped: false };
}
