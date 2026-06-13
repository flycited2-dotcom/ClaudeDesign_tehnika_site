import type { OrderQuote } from "@/lib/checkout/validation";
import { publicFulfillmentText } from "@/lib/fulfillment";
import { formatRub } from "@/lib/format";

// Telegram's sendMessage rejects text over 4096 chars with HTTP 400 — a large
// order (50+ line items) would otherwise lose its notification entirely. Clamp
// so the notification always goes through; the full record lives in the admin.
const TELEGRAM_MAX_LENGTH = 4096;

export function clampTelegramText(text: string): string {
  if (text.length <= TELEGRAM_MAX_LENGTH) return text;
  const notice = "\n…(сообщение обрезано — полная заявка в админке)";
  return text.slice(0, TELEGRAM_MAX_LENGTH - notice.length) + notice;
}

/**
 * Best-effort plain-text notification to the manager chat. Returns whether the
 * message was actually delivered so callers can decide on fallbacks. Never
 * throws — a notification failure must not break the action that triggered it.
 */
export async function sendTelegramMessage(text: string): Promise<{ delivered: boolean }> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_MANAGER_CHAT_ID;
  if (!token || !chatId) return { delivered: false };

  try {
    const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text: clampTelegramText(text), disable_web_page_preview: true }),
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
  const lines = [
    kind === "quick" ? `Быстрый заказ ${orderNumber}` : `Новый заказ ${orderNumber}`,
    `Имя: ${customerName}`,
    `Телефон: ${phone}`,
    email ? `Email: ${email}` : null,
    comment ? `Комментарий: ${comment}` : null,
    kind === "quick" ? "Источник: карточка товара" : null,
    sourceUrl ? `Страница: ${sourceUrl}` : null,
    "",
    "Состав заказа:",
    ...quote.items.map(
      (item) => `- SKU ${item.sku} / ${item.name} / ${item.quantity} шт. / ${formatRub(item.unitPrice)} / ${formatRub(item.total)}`,
    ),
    "",
    fulfillment.deliveryLabel,
    fulfillment.confirmationNote,
    `Итого: ${formatRub(quote.total)}`,
    `Дата: ${new Date().toLocaleString("ru-RU")}`,
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
  const chatId = process.env.TELEGRAM_MANAGER_CHAT_ID;

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
      disable_web_page_preview: true,
    }),
  });

  if (!response.ok) {
    throw new Error(`Telegram notification failed: ${response.status}`);
  }

  return { skipped: false };
}
