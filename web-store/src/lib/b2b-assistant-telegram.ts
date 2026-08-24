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

function parseTelegramApiResponse<T>(
  method: string,
  response: Response,
  json: TelegramApiResponse<T>,
): T {
  if (!response.ok || !json.ok || json.result === undefined) {
    throw new Error(`Telegram ${method}: ${json.description || `HTTP ${response.status}`}`);
  }
  return json.result;
}

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
    return parseTelegramApiResponse(method, response, json);
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener("abort", abort);
  }
}

/**
 * Upload an image through our server instead of asking Telegram to download a
 * URL. The public image proxy uses chunked WebP responses, which Telegram can
 * intermittently reject with "failed to get HTTP URL content".
 */
export async function sendB2bTelegramPhoto({
  chatId,
  imageUrl,
  caption,
  replyMarkup,
}: {
  chatId: number;
  imageUrl: string;
  caption: string;
  replyMarkup?: Record<string, unknown>;
}): Promise<TelegramMessage> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 30_000);
  try {
    const imageResponse = await fetch(imageUrl, { signal: controller.signal });
    if (!imageResponse.ok) throw new Error(`Product image: HTTP ${imageResponse.status}`);
    const contentType = imageResponse.headers.get("content-type")?.split(";", 1)[0] || "image/jpeg";
    if (!contentType.startsWith("image/")) throw new Error(`Product image has invalid content type: ${contentType}`);
    const extension = contentType === "image/png" ? "png" : contentType === "image/webp" ? "webp" : "jpg";
    const form = new FormData();
    form.set("chat_id", String(chatId));
    form.set("photo", new Blob([await imageResponse.arrayBuffer()], { type: contentType }), `product.${extension}`);
    form.set("caption", caption);
    form.set("parse_mode", "HTML");
    form.set("show_caption_above_media", "true");
    if (replyMarkup) form.set("reply_markup", JSON.stringify(replyMarkup));

    const response = await fetch(`https://api.telegram.org/bot${b2bAssistantToken()}/sendPhoto`, {
      method: "POST",
      body: form,
      signal: controller.signal,
    });
    const json = (await response.json()) as TelegramApiResponse<TelegramMessage>;
    return parseTelegramApiResponse("sendPhoto", response, json);
  } finally {
    clearTimeout(timer);
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
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      signal?.removeEventListener("abort", finish);
      resolve();
    };
    const timer = setTimeout(finish, milliseconds);
    signal?.addEventListener("abort", finish, { once: true });
    if (signal?.aborted) finish();
  });
}
