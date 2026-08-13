import { b2bAssistantToken } from "@/lib/b2b-assistant-config";
import { clampTelegramText } from "@/lib/telegram";

export type TelegramUser = {
  id: number;
  is_bot?: boolean;
  first_name?: string;
  last_name?: string;
  username?: string;
};

export type TelegramChat = {
  id: number;
  type: string;
};

export type TelegramMessage = {
  message_id: number;
  chat: TelegramChat;
  from?: TelegramUser;
  text?: string;
  reply_to_message?: TelegramMessage;
};

export type TelegramCallbackQuery = {
  id: string;
  from: TelegramUser;
  message?: TelegramMessage;
  data?: string;
};

export type TelegramInlineQuery = {
  id: string;
  from: TelegramUser;
  query: string;
  offset: string;
};

export type TelegramUpdate = {
  update_id: number;
  message?: TelegramMessage;
  callback_query?: TelegramCallbackQuery;
  inline_query?: TelegramInlineQuery;
};

type TelegramApiResponse<T> = {
  ok: boolean;
  result?: T;
  description?: string;
};

export async function b2bTelegramApi<T>(
  method: string,
  payload: Record<string, unknown>,
  { timeoutMs = 20_000, signal }: { timeoutMs?: number; signal?: AbortSignal } = {},
): Promise<T> {
  const controller = new AbortController();
  const abort = () => controller.abort();
  signal?.addEventListener("abort", abort, { once: true });
  const timer = setTimeout(abort, timeoutMs);
  try {
    const response = await fetch(`https://api.telegram.org/bot${b2bAssistantToken()}/${method}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    const json = (await response.json()) as TelegramApiResponse<T>;
    if (!response.ok || !json.ok || json.result === undefined) {
      throw new Error(`Telegram ${method}: ${json.description || `HTTP ${response.status}`}`);
    }
    return json.result;
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener("abort", abort);
  }
}

export function sendB2bTelegramMessage(
  chatId: number,
  text: string,
  options: Record<string, unknown> = {},
): Promise<TelegramMessage> {
  return b2bTelegramApi<TelegramMessage>("sendMessage", {
    chat_id: chatId,
    text: clampTelegramText(text),
    parse_mode: "HTML",
    disable_web_page_preview: true,
    ...options,
  });
}

export function answerB2bCallbackQuery(id: string, text: string, showAlert = false): Promise<true> {
  return b2bTelegramApi<true>("answerCallbackQuery", {
    callback_query_id: id,
    text,
    show_alert: showAlert,
  });
}

export function delayB2bTelegram(milliseconds: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve) => {
    if (signal?.aborted) return resolve();
    const timer = setTimeout(resolve, milliseconds);
    signal?.addEventListener(
      "abort",
      () => {
        clearTimeout(timer);
        resolve();
      },
      { once: true },
    );
  });
}
