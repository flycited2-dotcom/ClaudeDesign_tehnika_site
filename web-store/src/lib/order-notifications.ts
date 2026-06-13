import { buildOrderEmail, mailFromNoreply, orderNotificationRecipient, sendMail } from "@/lib/mailer";
import { sendTelegramOrderNotification } from "@/lib/telegram";

export type OrderNotificationInput = Parameters<typeof sendTelegramOrderNotification>[0];
export type OrderNotificationSender = (input: OrderNotificationInput) => Promise<{ skipped: boolean }>;

async function sendOrderEmailSafely(input: OrderNotificationInput) {
  try {
    const mail = buildOrderEmail(input);
    await sendMail({
      from: mailFromNoreply(),
      to: orderNotificationRecipient(),
      subject: mail.subject,
      text: mail.text,
      html: mail.html,
    });
  } catch (error) {
    console.error("[order-email]", error instanceof Error ? error.message : error);
  }
}

export async function sendOrderNotificationSafely(
  input: OrderNotificationInput,
  sender: OrderNotificationSender = sendTelegramOrderNotification,
) {
  // Both channels are best-effort and independent; the order is already in the DB.
  let result: { skipped: boolean; error?: string };
  try {
    result = await sender(input);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Order notification failed";
    console.error(message);
    result = { skipped: true, error: message };
  }

  await sendOrderEmailSafely(input);
  return result;
}
