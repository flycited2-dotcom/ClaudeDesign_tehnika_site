import { sendTelegramOrderNotification } from "@/lib/telegram";

export type OrderNotificationInput = Parameters<typeof sendTelegramOrderNotification>[0];
export type OrderNotificationSender = (input: OrderNotificationInput) => Promise<{ skipped: boolean }>;

export async function sendOrderNotificationSafely(
  input: OrderNotificationInput,
  sender: OrderNotificationSender = sendTelegramOrderNotification,
) {
  try {
    return await sender(input);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Order notification failed";
    console.error(message);
    return { skipped: true, error: message };
  }
}
