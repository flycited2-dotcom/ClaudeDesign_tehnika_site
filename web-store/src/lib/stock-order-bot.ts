import { randomBytes } from "node:crypto";
import { prisma } from "@/lib/db";
import { getItpActiveProduct } from "@/lib/itp/orders";
import type { ItpActiveProduct } from "@/lib/itp/types";
import {
  activeProductIsAvailable,
  compactStockProductName,
  supplierQtyLabel,
} from "@/lib/stock-monitor";
import { clampTelegramText, escapeTelegramHtml } from "@/lib/telegram";
import { createIdempotentTelegramStockOrder } from "@/lib/stock-order-service";

const START_CALLBACK_PREFIX = "itpo:s:";
const CONFIRM_CALLBACK_PREFIX = "itpo:c:";
const CANCEL_CALLBACK_PREFIX = "itpo:x:";
const ORDER_PROMPT_MARKER = "Оформление заказа B2B";
const DEFAULT_CONFIRM_TTL_MINUTES = 5;
const MAX_ORDER_QUANTITY = 10_000;

type TelegramUser = {
  id: number;
  is_bot?: boolean;
  first_name?: string;
  last_name?: string;
  username?: string;
};

type TelegramMessage = {
  message_id: number;
  chat: { id: number; type?: string };
  from?: TelegramUser;
  text?: string;
  reply_to_message?: TelegramMessage;
};

type TelegramCallbackQuery = {
  id: string;
  from: TelegramUser;
  message?: TelegramMessage;
  data?: string;
};

export type TelegramUpdate = {
  update_id: number;
  message?: TelegramMessage;
  callback_query?: TelegramCallbackQuery;
};

type TelegramApiResponse<T> = {
  ok: boolean;
  result?: T;
  description?: string;
};

export type StockOrderConfirmation = {
  sku: number;
  quantity: number;
  priceCents: number;
  nonce: string;
  telegramUserId: number;
  issuedAt: number;
};

function toBase36(value: number): string {
  return Math.trunc(value).toString(36);
}

function fromBase36(value: string): number {
  if (!/^[0-9a-z]+$/i.test(value)) return Number.NaN;
  return Number.parseInt(value, 36);
}

export function buildStockOrderStartCallback(sku: number): string {
  return `${START_CALLBACK_PREFIX}${sku}`;
}

export function parseStockOrderStartCallback(value: string | undefined): number | null {
  if (!value?.startsWith(START_CALLBACK_PREFIX)) return null;
  const sku = Number(value.slice(START_CALLBACK_PREFIX.length));
  return Number.isSafeInteger(sku) && sku > 0 ? sku : null;
}

export function buildStockOrderConfirmCallback(value: StockOrderConfirmation): string {
  const callback = [
    CONFIRM_CALLBACK_PREFIX.slice(0, -1),
    toBase36(value.sku),
    toBase36(value.quantity),
    toBase36(value.priceCents),
    value.nonce,
    toBase36(value.telegramUserId),
    toBase36(value.issuedAt),
  ].join(":");
  if (Buffer.byteLength(callback, "utf8") > 64) throw new Error("Telegram callback_data exceeds 64 bytes.");
  return callback;
}

export function parseStockOrderConfirmCallback(value: string | undefined): StockOrderConfirmation | null {
  if (!value?.startsWith(CONFIRM_CALLBACK_PREFIX)) return null;
  const parts = value.split(":");
  if (parts.length !== 8 || parts[0] !== "itpo" || parts[1] !== "c") return null;
  const [sku, quantity, priceCents, telegramUserId, issuedAt] = [
    fromBase36(parts[2]),
    fromBase36(parts[3]),
    fromBase36(parts[4]),
    fromBase36(parts[6]),
    fromBase36(parts[7]),
  ];
  const nonce = parts[5];
  if (
    !Number.isSafeInteger(sku) ||
    sku <= 0 ||
    !Number.isSafeInteger(quantity) ||
    quantity <= 0 ||
    !Number.isSafeInteger(priceCents) ||
    priceCents <= 0 ||
    !/^[0-9a-f]{8}$/i.test(nonce) ||
    !Number.isSafeInteger(telegramUserId) ||
    telegramUserId <= 0 ||
    !Number.isSafeInteger(issuedAt) ||
    issuedAt <= 0
  ) {
    return null;
  }
  return { sku, quantity, priceCents, nonce, telegramUserId, issuedAt };
}

function buildCancelCallback(nonce: string, telegramUserId: number): string {
  return `${CANCEL_CALLBACK_PREFIX}${nonce}:${toBase36(telegramUserId)}`;
}

function parseCancelCallback(value: string | undefined): { nonce: string; telegramUserId: number } | null {
  if (!value?.startsWith(CANCEL_CALLBACK_PREFIX)) return null;
  const [nonce, encodedUserId] = value.slice(CANCEL_CALLBACK_PREFIX.length).split(":");
  const telegramUserId = fromBase36(encodedUserId || "");
  if (!/^[0-9a-f]{8}$/i.test(nonce || "") || !Number.isSafeInteger(telegramUserId) || telegramUserId <= 0) {
    return null;
  }
  return { nonce, telegramUserId };
}

export function parseOrderQuantity(value: string | undefined): number | null {
  const normalized = value?.trim() ?? "";
  if (!/^\d+$/.test(normalized)) return null;
  const quantity = Number(normalized);
  return Number.isSafeInteger(quantity) && quantity > 0 && quantity <= MAX_ORDER_QUANTITY ? quantity : null;
}

function parsePromptSku(message: TelegramMessage | undefined): number | null {
  if (!message?.from?.is_bot || !message.text?.includes(ORDER_PROMPT_MARKER)) return null;
  const match = message.text.match(/SKU:\s*(\d+)/i);
  if (!match) return null;
  const sku = Number(match[1]);
  return Number.isSafeInteger(sku) && sku > 0 ? sku : null;
}

function telegramToken(): string {
  const token = process.env.STOCK_MONITOR_TELEGRAM_BOT_TOKEN ?? process.env.TELEGRAM_BOT_TOKEN;
  if (!token) throw new Error("Укажите STOCK_MONITOR_TELEGRAM_BOT_TOKEN или TELEGRAM_BOT_TOKEN.");
  return token;
}

function allowedChatId(): string {
  const chatId = process.env.STOCK_MONITOR_TELEGRAM_CHAT_ID ?? process.env.TELEGRAM_MANAGER_CHAT_ID;
  if (!chatId) throw new Error("Укажите STOCK_MONITOR_TELEGRAM_CHAT_ID или TELEGRAM_MANAGER_CHAT_ID.");
  return String(chatId);
}

function userIsAllowed(userId: number): boolean {
  const configured = (process.env.STOCK_ORDER_TELEGRAM_USER_IDS ?? "")
    .split(/[;,\s]+/)
    .map((item) => item.trim())
    .filter(Boolean);
  return configured.length === 0 || configured.includes(String(userId));
}

function confirmTtlSeconds(): number {
  const raw = process.env.STOCK_ORDER_CONFIRM_TTL_MINUTES;
  const minutes = raw ? Number(raw) : DEFAULT_CONFIRM_TTL_MINUTES;
  if (!Number.isFinite(minutes) || minutes <= 0) {
    throw new Error("STOCK_ORDER_CONFIRM_TTL_MINUTES должен быть положительным числом.");
  }
  return Math.round(minutes * 60);
}

async function telegramApi<T>(
  method: string,
  payload: Record<string, unknown>,
  { timeoutMs = 20_000, signal }: { timeoutMs?: number; signal?: AbortSignal } = {},
): Promise<T> {
  const controller = new AbortController();
  const abort = () => controller.abort();
  signal?.addEventListener("abort", abort, { once: true });
  const timer = setTimeout(abort, timeoutMs);
  try {
    const response = await fetch(`https://api.telegram.org/bot${telegramToken()}/${method}`, {
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

async function sendMessage(
  chatId: number,
  text: string,
  options: Record<string, unknown> = {},
): Promise<TelegramMessage> {
  return telegramApi<TelegramMessage>("sendMessage", {
    chat_id: chatId,
    text: clampTelegramText(text),
    parse_mode: "HTML",
    disable_web_page_preview: true,
    ...options,
  });
}

async function answerCallbackQuery(callbackQueryId: string, text: string, showAlert = false): Promise<void> {
  await telegramApi("answerCallbackQuery", {
    callback_query_id: callbackQueryId,
    text,
    show_alert: showAlert,
  });
}

async function removeInlineKeyboard(message: TelegramMessage | undefined): Promise<void> {
  if (!message) return;
  await telegramApi("editMessageReplyMarkup", {
    chat_id: message.chat.id,
    message_id: message.message_id,
    reply_markup: { inline_keyboard: [] },
  });
}

function userDisplayName(user: TelegramUser): string {
  const fullName = [user.first_name, user.last_name].filter(Boolean).join(" ").trim();
  return user.username ? `${fullName || user.username} @${user.username}` : fullName || `user-${user.id}`;
}

async function productDisplay(sku: number) {
  const product = await prisma.product.findUnique({
    where: { sku },
    select: { name: true, supplierName: true, part: true },
  });
  const fullName = product?.name || product?.supplierName || `Товар SKU ${sku}`;
  return {
    fullName,
    compactName: compactStockProductName(fullName, product?.part),
    part: product?.part ?? null,
  };
}

function exactAvailableQuantity(product: ItpActiveProduct): number | null {
  const values = [product.real_qty, product.nearest_logistic_center_real_qty].filter(
    (value): value is number => Number.isFinite(value) && Number(value) > 0,
  );
  return values.length > 0 ? Math.max(...values) : null;
}

function currentStockLabel(product: ItpActiveProduct): string {
  const exact = exactAvailableQuantity(product);
  if (exact !== null) return `${exact} шт.`;
  const main = supplierQtyLabel(product.qty);
  const nearest = supplierQtyLabel(product.nearest_logistic_center_qty);
  return main !== "нет" ? main : nearest;
}

function formatRub(value: number): string {
  return `${new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 2 }).format(value)} ₽`;
}

async function handleStartCallback(query: TelegramCallbackQuery, sku: number): Promise<void> {
  if (!query.message) return;
  if (!userIsAllowed(query.from.id)) {
    await answerCallbackQuery(query.id, "У вас нет доступа к оформлению заказов.", true);
    return;
  }
  await answerCallbackQuery(query.id, "Введите количество ответом на сообщение");
  const product = await productDisplay(sku);
  await sendMessage(
    query.message.chat.id,
    [
      `🛒 <b>${ORDER_PROMPT_MARKER}</b>`,
      "━━━━━━━━━━━━━━━━",
      `<b>${escapeTelegramHtml(product.compactName)}</b>`,
      `SKU: <code>${sku}</code>`,
      product.part ? `Артикул: <code>${escapeTelegramHtml(product.part)}</code>` : null,
      "",
      `<a href="tg://user?id=${query.from.id}">${escapeTelegramHtml(userDisplayName(query.from))}</a>,`,
      "Ответьте на это сообщение <b>целым количеством</b>.",
      "Например: <code>2</code>",
    ]
      .filter((line) => line !== null)
      .join("\n"),
    {
      reply_parameters: { message_id: query.message.message_id },
      reply_markup: {
        force_reply: true,
        selective: true,
        input_field_placeholder: "Введите количество, например 2",
      },
    },
  );
}

async function handleQuantityReply(message: TelegramMessage, sku: number): Promise<void> {
  if (!message.from || !userIsAllowed(message.from.id)) return;
  const quantity = parseOrderQuantity(message.text);
  if (quantity === null) {
    await sendMessage(message.chat.id, "⚠️ Введите целое количество от 1 до 10 000.", {
      reply_parameters: { message_id: message.message_id },
    });
    return;
  }

  const active = await getItpActiveProduct(sku);
  if (!active || !activeProductIsAvailable(active)) {
    await sendMessage(message.chat.id, `❌ SKU <code>${sku}</code> уже закончился у поставщика. Заказ не создан.`, {
      reply_parameters: { message_id: message.message_id },
    });
    return;
  }

  const multiplicity = Math.max(1, Number(active.multiplicity) || 1);
  if (quantity % multiplicity !== 0) {
    await sendMessage(
      message.chat.id,
      `⚠️ Этот товар заказывается с кратностью <b>${multiplicity}</b>. Введите количество, кратное ${multiplicity}.`,
      { reply_parameters: { message_id: message.message_id } },
    );
    return;
  }

  const exact = exactAvailableQuantity(active);
  if (exact !== null && quantity > exact) {
    await sendMessage(
      message.chat.id,
      `⚠️ Запрошено ${quantity} шт., а актуальный остаток — <b>${exact} шт.</b> Введите меньшее количество.`,
      { reply_parameters: { message_id: message.message_id } },
    );
    return;
  }

  if (!Number.isFinite(active.price) || active.price <= 0) {
    throw new Error(`I-T-P вернул некорректную цену для SKU ${sku}.`);
  }

  const priceCents = Math.round(active.price * 100);
  const nonce = randomBytes(4).toString("hex");
  const issuedAt = Math.floor(Date.now() / 1000);
  const product = await productDisplay(sku);
  const confirmData = buildStockOrderConfirmCallback({
    sku,
    quantity,
    priceCents,
    nonce,
    telegramUserId: message.from.id,
    issuedAt,
  });

  await sendMessage(
    message.chat.id,
    [
      "✅ <b>Проверьте заказ</b>",
      "━━━━━━━━━━━━━━━━",
      `<b>${escapeTelegramHtml(product.compactName)}</b>`,
      `SKU: <code>${sku}</code>`,
      `📦 Актуальный остаток: <b>${escapeTelegramHtml(currentStockLabel(active))}</b>`,
      `💰 Цена: <b>${formatRub(active.price)}</b>`,
      `🔢 Заказать: <b>${quantity} шт.</b>`,
      `💳 Сумма: <b>${formatRub(active.price * quantity)}</b>`,
      "",
      "Будет создан заказ B2B <b>без подтверждения отгрузки</b>.",
    ].join("\n"),
    {
      reply_parameters: { message_id: message.message_id },
      reply_markup: {
        inline_keyboard: [
          [{ text: `✅ Заказать ${quantity} шт.`, callback_data: confirmData }],
          [{ text: "✖️ Отмена", callback_data: buildCancelCallback(nonce, message.from.id) }],
        ],
      },
    },
  );
}

async function handleConfirmCallback(query: TelegramCallbackQuery, confirmation: StockOrderConfirmation): Promise<void> {
  if (!query.message) return;
  if (query.from.id !== confirmation.telegramUserId || !userIsAllowed(query.from.id)) {
    await answerCallbackQuery(query.id, "Подтвердить может только пользователь, который ввёл количество.", true);
    return;
  }

  const ageSeconds = Math.floor(Date.now() / 1000) - confirmation.issuedAt;
  if (ageSeconds > confirmTtlSeconds()) {
    await answerCallbackQuery(query.id, "Цена и остаток устарели. Нажмите «Заказать» в карточке ещё раз.", true);
    await removeInlineKeyboard(query.message).catch(() => undefined);
    return;
  }

  await answerCallbackQuery(query.id, "Создаю заказ в B2B…");
  const supplierPrice = confirmation.priceCents / 100;
  const result = await createIdempotentTelegramStockOrder({
    sku: confirmation.sku,
    quantity: confirmation.quantity,
    supplierPrice,
    nonce: confirmation.nonce,
  });
  const product = await productDisplay(confirmation.sku);
  await removeInlineKeyboard(query.message).catch(() => undefined);
  await sendMessage(
    query.message.chat.id,
    [
      "🎉 <b>Заказ создан в B2B</b>",
      "━━━━━━━━━━━━━━━━",
      `Номер: <b>№${result.order.id}</b>`,
      `<b>${escapeTelegramHtml(product.compactName)}</b>`,
      `SKU: <code>${confirmation.sku}</code>`,
      `Количество: <b>${confirmation.quantity} шт.</b>`,
      `Цена: <b>${formatRub(supplierPrice)}</b>`,
      `Сумма: <b>${formatRub(supplierPrice * confirmation.quantity)}</b>`,
      "",
      "⚠️ Заказ <b>не подтверждён на отгрузку</b>. Проверьте его в кабинете поставщика.",
      result.duplicatePrevented ? "♻️ Повторное нажатие распознано — второй заказ не создавался." : null,
    ]
      .filter((line) => line !== null)
      .join("\n"),
    {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "🌐 Открыть B2B",
              url: process.env.STOCK_MONITOR_B2B_URL ?? process.env.ITP_API_BASE_URL ?? "https://b2b.i-t-p.pro",
            },
          ],
        ],
      },
    },
  );
}

async function handleCancelCallback(
  query: TelegramCallbackQuery,
  cancellation: { nonce: string; telegramUserId: number },
): Promise<void> {
  if (query.from.id !== cancellation.telegramUserId) {
    await answerCallbackQuery(query.id, "Отменить может только пользователь, который ввёл количество.", true);
    return;
  }
  await answerCallbackQuery(query.id, "Заказ отменён");
  await removeInlineKeyboard(query.message).catch(() => undefined);
}

async function handleCallbackQuery(query: TelegramCallbackQuery): Promise<void> {
  if (!query.message || String(query.message.chat.id) !== allowedChatId()) {
    await answerCallbackQuery(query.id, "Этот чат не имеет доступа к заказам.", true).catch(() => undefined);
    return;
  }
  const startSku = parseStockOrderStartCallback(query.data);
  if (startSku !== null) return handleStartCallback(query, startSku);
  const confirmation = parseStockOrderConfirmCallback(query.data);
  if (confirmation) return handleConfirmCallback(query, confirmation);
  const cancellation = parseCancelCallback(query.data);
  if (cancellation) return handleCancelCallback(query, cancellation);
  await answerCallbackQuery(query.id, "Кнопка устарела. Дождитесь новой карточки.", true);
}

async function handleMessage(message: TelegramMessage): Promise<void> {
  if (String(message.chat.id) !== allowedChatId()) return;
  const sku = parsePromptSku(message.reply_to_message);
  if (sku !== null) await handleQuantityReply(message, sku);
}

async function reportUpdateError(update: TelegramUpdate, error: unknown): Promise<void> {
  const chatId = update.callback_query?.message?.chat.id ?? update.message?.chat.id;
  if (chatId === undefined || String(chatId) !== allowedChatId()) return;
  const message = error instanceof Error ? error.message : String(error);
  await sendMessage(
    chatId,
    [
      "⚠️ <b>Заказ B2B не создан</b>",
      escapeTelegramHtml(message.slice(0, 1200)),
      "Попробуйте ещё раз. Если ошибка повторится — оформите заказ через кабинет B2B.",
    ].join("\n"),
  ).catch(() => undefined);
}

export async function processStockOrderUpdate(update: TelegramUpdate): Promise<void> {
  try {
    if (update.callback_query) await handleCallbackQuery(update.callback_query);
    else if (update.message) await handleMessage(update.message);
  } catch (error) {
    console.error("stock order update failed", update.update_id, error instanceof Error ? error.message : error);
    await reportUpdateError(update, error);
  }
}

function delay(milliseconds: number, signal?: AbortSignal): Promise<void> {
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

export async function runStockOrderBot({ signal }: { signal?: AbortSignal } = {}): Promise<void> {
  telegramToken();
  allowedChatId();
  let offset: number | undefined;
  let consecutiveFailures = 0;

  while (!signal?.aborted) {
    try {
      const updates = await telegramApi<TelegramUpdate[]>(
        "getUpdates",
        {
          ...(offset !== undefined ? { offset } : {}),
          timeout: 50,
          allowed_updates: ["message", "callback_query"],
        },
        { timeoutMs: 60_000, signal },
      );
      consecutiveFailures = 0;

      for (const update of updates) {
        try {
          await processStockOrderUpdate(update);
        } finally {
          offset = update.update_id + 1;
        }
      }
    } catch (error) {
      if (signal?.aborted) break;
      consecutiveFailures += 1;
      console.error("Telegram getUpdates failed", error instanceof Error ? error.message : error);
      if (consecutiveFailures >= 10) throw error;
      await delay(Math.min(30_000, consecutiveFailures * 3_000), signal);
    }
  }
}
