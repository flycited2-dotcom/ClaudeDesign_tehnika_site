export function stockOrderTelegramChatUrl(): string | null {
  const configured = process.env.STOCK_ORDER_TELEGRAM_CHAT_URL?.trim();
  if (configured) return configured;

  const chatId = (
    process.env.STOCK_MONITOR_TELEGRAM_CHAT_ID ?? process.env.TELEGRAM_MANAGER_CHAT_ID ?? ""
  ).trim();
  const privateChatMatch = chatId.match(/^-100(\d+)$/);
  return privateChatMatch ? `https://t.me/c/${privateChatMatch[1]}/1` : null;
}
