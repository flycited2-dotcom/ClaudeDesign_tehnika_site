import {
  b2bAssistantAllowedUserIds,
  b2bAssistantDefaultMarkupPercent,
  b2bAssistantMarkupPresets,
  b2bAssistantRoundingStep,
  b2bAssistantSearchLimit,
  b2bAssistantSiteUrl,
  b2bAssistantToken,
} from "@/lib/b2b-assistant-config";
import {
  buildClientProductCard,
  buildManagerProductCard,
  type B2bAssistantCard,
} from "@/lib/b2b-assistant-cards";
import {
  calculateClientPrice,
  createClientOfferQuery,
  parseCustomMarkupCallback,
  parseCustomMarkupPercent,
  parseClientOfferQuery,
  parseMarkupCallback,
} from "@/lib/b2b-assistant-offer";
import { createShortClientOffer, resolveShortClientOffer } from "@/lib/b2b-assistant-offer-store";
import {
  buildSearchPageCallback,
  createSearchSession,
  parseSearchPageCallback,
  resolveSearchSession,
} from "@/lib/b2b-assistant-pagination";
import {
  findB2bProductBySku,
  searchB2bProductPage,
  searchB2bProducts,
  type B2bAssistantProduct,
} from "@/lib/b2b-assistant-search";
import { readB2bAssistantOffset, saveB2bAssistantUpdateId } from "@/lib/b2b-assistant-state";
import {
  answerB2bCallbackQuery,
  b2bTelegramApi,
  delayB2bTelegram,
  sendB2bTelegramMessage,
  sendB2bTelegramPhoto,
  type TelegramCallbackQuery,
  type TelegramInlineQuery,
  type TelegramMessage,
  type TelegramUpdate,
} from "@/lib/b2b-assistant-telegram";
import { productImageSrc } from "@/lib/product-images";
import { buildStockOrderLink } from "@/lib/stock-order-link";
import { escapeTelegramHtml } from "@/lib/telegram";

const CUSTOM_MARKUP_PROMPT = "Своя наценка для SKU:";

function userIsAllowed(userId: number): boolean {
  return b2bAssistantAllowedUserIds().has(userId);
}

function formatPercent(value: number): string {
  return new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 2 }).format(value);
}

function absoluteUrl(path: string | null): string | undefined {
  if (!path) return undefined;
  return new URL(path, b2bAssistantSiteUrl()).toString();
}

function productUrl(product: B2bAssistantProduct): string {
  return `${b2bAssistantSiteUrl()}/product/${encodeURIComponent(product.slug)}`;
}

function orderUrl(product: B2bAssistantProduct): string | undefined {
  if (!product.isAvailable) return undefined;
  return buildStockOrderLink({ sku: product.sku, siteUrl: b2bAssistantSiteUrl() });
}

function inlineKeyboard(rows: B2bAssistantCard["buttonRows"]): Record<string, unknown> | undefined {
  return rows ? { inline_keyboard: rows } : undefined;
}

async function sendCard(chatId: number, card: B2bAssistantCard): Promise<void> {
  if (card.imageUrl && card.text.length <= 1_024) {
    try {
      await sendB2bTelegramPhoto({
        chatId,
        imageUrl: card.imageUrl,
        caption: card.text,
        replyMarkup: card.buttonRows ? inlineKeyboard(card.buttonRows) : undefined,
      });
      return;
    } catch (error) {
      // A broken/unsupported supplier image must never suppress search results.
      console.warn("B2B assistant photo fallback", error instanceof Error ? error.message : error);
    }
  }
  await sendB2bTelegramMessage(chatId, card.text, {
    ...(card.buttonRows ? { reply_markup: inlineKeyboard(card.buttonRows) } : {}),
  });
}

async function sendWelcome(chatId: number): Promise<void> {
  await sendB2bTelegramMessage(
    chatId,
    [
      "🤖 <b>Мобильный B2B-ассистент</b>",
      "━━━━━━━━━━━━━━━━",
      "Пришлите название, модель, артикул, штрихкод или SKU.",
      "",
      "Например:",
      "<code>ExeGate AVS-8000</code>",
      "<code>Lenovo IdeaPad 16 512</code>",
      "<code>10539750</code>",
      "",
      "Я покажу цену поставщика и остаток. Из карточки можно перейти к заказу или собрать безопасное предложение клиенту с вашей наценкой.",
    ].join("\n"),
    {
      reply_markup: {
        keyboard: [[{ text: "🔎 Поиск" }, { text: "ℹ️ Помощь" }]],
        resize_keyboard: true,
        input_field_placeholder: "Введите товар, модель или SKU",
      },
    },
  );
}

async function sendSearchPage({
  chatId,
  telegramUserId,
  query,
  offset = 0,
  sessionCode,
}: {
  chatId: number;
  telegramUserId: number;
  query: string;
  offset?: number;
  sessionCode?: string;
}): Promise<void> {
  const pageSize = b2bAssistantSearchLimit();
  const page = await searchB2bProductPage(query, { limit: pageSize, offset });
  if (page.products.length === 0) {
    await sendB2bTelegramMessage(
      chatId,
      offset === 0
        ? [
            `🔍 По запросу <b>${escapeTelegramHtml(query)}</b> ничего не найдено.`,
            "Попробуйте сократить запрос до бренда и модели или пришлите точный артикул/SKU.",
          ].join("\n")
        : "ℹ️ Больше товаров по этому запросу нет.",
    );
    return;
  }

  const rangeStart = page.offset + 1;
  const rangeEnd = page.offset + page.products.length;
  await sendB2bTelegramMessage(
    chatId,
    [
      offset === 0 ? `🔎 По запросу <b>${escapeTelegramHtml(query)}</b>` : "🔎 <b>Следующая страница</b>",
      `Найдено товаров: <b>${page.total}</b>`,
      `Показано: <b>${rangeStart}–${rangeEnd}</b>`,
    ].join("\n"),
  );
  const presets = b2bAssistantMarkupPresets();
  for (const [index, product] of page.products.entries()) {
    await sendCard(
      chatId,
      buildManagerProductCard({
        product,
        position: page.offset + index + 1,
        total: page.total,
        markupPresets: presets,
        orderUrl: orderUrl(product),
        productUrl: productUrl(product),
        imageUrl: absoluteUrl(productImageSrc(product.images[0])),
      }),
    );
  }

  if (page.hasMore) {
    const code = sessionCode ?? await createSearchSession({ query, telegramUserId });
    const nextOffset = page.offset + page.products.length;
    const nextEnd = Math.min(nextOffset + pageSize, page.total);
    await sendB2bTelegramMessage(
      chatId,
      `Показано <b>${rangeStart}–${rangeEnd}</b> из <b>${page.total}</b>.`,
      {
        reply_markup: {
          inline_keyboard: [[{
            text: `➡️ Показать ещё ${nextOffset + 1}–${nextEnd}`,
            callback_data: buildSearchPageCallback(code, nextOffset),
          }]],
        },
      },
    );
  } else if (offset > 0) {
    await sendB2bTelegramMessage(chatId, `✅ Показаны все <b>${page.total}</b> товаров.`);
  }
}

async function handleMessage(message: TelegramMessage): Promise<void> {
  if (!message.from || message.from.is_bot) return;
  if (!userIsAllowed(message.from.id)) {
    await sendB2bTelegramMessage(message.chat.id, "⛔ Этот бот доступен только владельцу и разрешённым менеджерам.");
    return;
  }
  if (message.chat.type !== "private") {
    await sendB2bTelegramMessage(message.chat.id, "Для защиты закупочных цен используйте личный чат с ботом.");
    return;
  }

  const text = message.text?.trim();
  if (!text) return;
  if (["/start", "/help", "ℹ️ Помощь", "🔎 Поиск"].includes(text)) return sendWelcome(message.chat.id);
  if (text.startsWith("/")) return sendWelcome(message.chat.id);

  const customMarkupSku = parseCustomMarkupPrompt(message.reply_to_message?.text);
  if (customMarkupSku) {
    const markupPercent = parseCustomMarkupPercent(text);
    if (markupPercent === null) {
      await sendB2bTelegramMessage(
        message.chat.id,
        "⚠️ Введите процент от 0 до 1000, не добавляя знак %. Например: <code>17,5</code>",
        {
          reply_parameters: { message_id: message.message_id },
          reply_markup: {
            force_reply: true,
            selective: true,
            input_field_placeholder: "Наценка, например 17,5",
          },
        },
      );
      return;
    }
    await sendClientOffer(message.chat.id, customMarkupSku, markupPercent, message.from.id);
    return;
  }
  await sendSearchPage({ chatId: message.chat.id, telegramUserId: message.from.id, query: text });
}

function parseCustomMarkupPrompt(value: string | undefined): number | null {
  if (!value?.includes(CUSTOM_MARKUP_PROMPT)) return null;
  const match = value.match(/Своя наценка для SKU:\s*(\d+)/);
  const sku = Number(match?.[1]);
  return Number.isSafeInteger(sku) && sku > 0 ? sku : null;
}

async function sendClientOffer(
  chatId: number,
  sku: number,
  markupPercent: number,
  telegramUserId: number,
): Promise<number> {
  const product = await findB2bProductBySku(sku);
  const supplierPrice = Number(product?.supplierPrice?.toString() ?? 0);
  if (!product || !Number.isFinite(supplierPrice) || supplierPrice <= 0) {
    throw new Error("Для товара нет актуальной цены.");
  }
  const clientPrice = calculateClientPrice(supplierPrice, markupPercent, b2bAssistantRoundingStep());
  const stored = await createShortClientOffer({
    sku: product.sku,
    price: clientPrice,
    telegramUserId,
  });
  const validUntil = new Date(stored.offer.expiresAt * 1000);
  await sendCard(
    chatId,
    buildClientProductCard({
      product,
      clientPrice,
      imageUrl: absoluteUrl(productImageSrc(product.images[0])),
      validUntil,
      shareQuery: stored.code,
    }),
  );
  await sendB2bTelegramMessage(
    chatId,
    `Внутренний расчёт: закупка ${supplierPrice.toLocaleString("ru-RU")} ₽, наценка +${formatPercent(markupPercent)}%. Клиент этих данных не увидит.`,
  );
  return clientPrice;
}

async function handleMarkup(query: TelegramCallbackQuery): Promise<void> {
  if (!query.message) return;
  if (query.message.chat.type !== "private") {
    await answerB2bCallbackQuery(query.id, "Для защиты закупочных цен откройте личный чат с ботом.", true);
    return;
  }
  if (!userIsAllowed(query.from.id)) {
    await answerB2bCallbackQuery(query.id, "У вас нет доступа.", true);
    return;
  }
  const markup = parseMarkupCallback(query.data);
  if (!markup) {
    await answerB2bCallbackQuery(query.id, "Кнопка устарела.", true);
    return;
  }
  await answerB2bCallbackQuery(query.id, "Формирую карточку клиента…");
  await sendClientOffer(query.message.chat.id, markup.sku, markup.markupPercent, query.from.id);
}

async function handleCustomMarkup(query: TelegramCallbackQuery, sku: number): Promise<void> {
  if (!query.message) return;
  if (query.message.chat.type !== "private") {
    await answerB2bCallbackQuery(query.id, "Для защиты закупочных цен откройте личный чат с ботом.", true);
    return;
  }
  if (!userIsAllowed(query.from.id)) {
    await answerB2bCallbackQuery(query.id, "У вас нет доступа.", true);
    return;
  }
  await answerB2bCallbackQuery(query.id, "Введите свою наценку");
  await sendB2bTelegramMessage(
    query.message.chat.id,
    [
      `✏️ <b>${CUSTOM_MARKUP_PROMPT} ${sku}</b>`,
      "Введите процент ответом на это сообщение, без знака %.",
      "Например: <code>17,5</code>",
    ].join("\n"),
    {
      reply_markup: {
        force_reply: true,
        selective: true,
        input_field_placeholder: "Наценка, например 17,5",
      },
    },
  );
}

async function handleSearchPage(query: TelegramCallbackQuery): Promise<void> {
  if (!query.message || query.message.chat.type !== "private") {
    await answerB2bCallbackQuery(query.id, "Откройте личный чат с ботом.", true);
    return;
  }
  if (!userIsAllowed(query.from.id)) {
    await answerB2bCallbackQuery(query.id, "У вас нет доступа.", true);
    return;
  }
  const pagination = parseSearchPageCallback(query.data);
  if (!pagination) {
    await answerB2bCallbackQuery(query.id, "Кнопка устарела.", true);
    return;
  }
  const session = await resolveSearchSession(pagination.code, query.from.id);
  if (!session.query) {
    const message = session.reason === "expired"
      ? "Поиск устарел. Отправьте запрос боту ещё раз."
      : "Поисковая сессия недоступна.";
    await answerB2bCallbackQuery(query.id, message, true);
    return;
  }

  await answerB2bCallbackQuery(query.id, "Загружаю следующие товары…");
  await sendSearchPage({
    chatId: query.message.chat.id,
    telegramUserId: query.from.id,
    query: session.query,
    offset: pagination.offset,
    sessionCode: pagination.code,
  });
  await b2bTelegramApi("editMessageReplyMarkup", {
    chat_id: query.message.chat.id,
    message_id: query.message.message_id,
    reply_markup: { inline_keyboard: [] },
  }).catch(() => undefined);
}

async function handleCallbackQuery(query: TelegramCallbackQuery): Promise<void> {
  if (parseSearchPageCallback(query.data)) return handleSearchPage(query);
  const customSku = parseCustomMarkupCallback(query.data);
  if (customSku) return handleCustomMarkup(query, customSku);
  if (parseMarkupCallback(query.data)) return handleMarkup(query);
  await answerB2bCallbackQuery(query.id, "Кнопка устарела.", true);
}

function inlineArticle(product: B2bAssistantProduct, clientPrice: number, offerQuery: string, expiresAt: number) {
  const card = buildClientProductCard({
    product,
    clientPrice,
    validUntil: new Date(expiresAt * 1000),
  });
  const shared = {
    id: offerQuery.slice(0, 64),
    title: product.name || product.supplierName,
    description: `${clientPrice.toLocaleString("ru-RU")} ₽ · ${product.isAvailable ? "в наличии" : "наличие уточняется"}`,
  };
  return {
    type: "article",
    ...shared,
    input_message_content: {
      message_text: card.text,
      parse_mode: "HTML",
      disable_web_page_preview: true,
    },
  };
}

async function handleInlineQuery(query: TelegramInlineQuery): Promise<void> {
  if (!userIsAllowed(query.from.id)) {
    await b2bTelegramApi<true>("answerInlineQuery", {
      inline_query_id: query.id,
      results: [],
      cache_time: 1,
      is_personal: true,
    });
    return;
  }

  const inlineText = query.query.trim();
  const storedOffer = await resolveShortClientOffer(inlineText, query.from.id);
  if (storedOffer.matched) {
    const product = storedOffer.offer ? await findB2bProductBySku(storedOffer.offer.sku) : null;
    const results = product && storedOffer.offer
      ? [inlineArticle(product, storedOffer.offer.priceCents / 100, inlineText, storedOffer.offer.expiresAt)]
      : [];
    await b2bTelegramApi<true>("answerInlineQuery", {
      inline_query_id: query.id,
      results,
      cache_time: 1,
      is_personal: true,
    });
    return;
  }

  // Compatibility for client cards created before short server-side codes.
  const parsedOffer = parseClientOfferQuery(inlineText);
  if (parsedOffer.offer) {
    const product = await findB2bProductBySku(parsedOffer.offer.sku);
    const results = product
      ? [inlineArticle(product, parsedOffer.offer.priceCents / 100, inlineText, parsedOffer.offer.expiresAt)]
      : [];
    await b2bTelegramApi<true>("answerInlineQuery", {
      inline_query_id: query.id,
      results,
      cache_time: 1,
      is_personal: true,
    });
    return;
  }

  const products = query.query.trim()
    ? await searchB2bProducts(query.query, b2bAssistantSearchLimit())
    : [];
  const markup = b2bAssistantDefaultMarkupPercent();
  const results = products.flatMap((product) => {
    const supplierPrice = Number(product.supplierPrice?.toString() ?? 0);
    if (!Number.isFinite(supplierPrice) || supplierPrice <= 0) return [];
    const clientPrice = calculateClientPrice(supplierPrice, markup, b2bAssistantRoundingStep());
    const offerQuery = createClientOfferQuery({ sku: product.sku, price: clientPrice });
    const offer = parseClientOfferQuery(offerQuery).offer;
    return offer ? [inlineArticle(product, clientPrice, offerQuery, offer.expiresAt)] : [];
  });
  await b2bTelegramApi<true>("answerInlineQuery", {
    inline_query_id: query.id,
    results,
    cache_time: 1,
    is_personal: true,
  });
}

export async function processB2bAssistantUpdate(update: TelegramUpdate): Promise<void> {
  if (update.inline_query) await handleInlineQuery(update.inline_query);
  else if (update.callback_query) await handleCallbackQuery(update.callback_query);
  else if (update.message) await handleMessage(update.message);
}

export async function runB2bAssistantBot({ signal }: { signal?: AbortSignal } = {}): Promise<void> {
  b2bAssistantToken();
  b2bAssistantAllowedUserIds();
  b2bAssistantSiteUrl();
  let offset = await readB2bAssistantOffset();
  let consecutiveFailures = 0;

  await b2bTelegramApi<true>("deleteWebhook", { drop_pending_updates: false });
  await b2bTelegramApi<true>("setMyCommands", {
    commands: [
      { command: "start", description: "Открыть B2B-ассистента" },
      { command: "search", description: "Найти товар" },
      { command: "help", description: "Показать подсказку" },
    ],
    scope: { type: "all_private_chats" },
  });

  while (!signal?.aborted) {
    try {
      const updates = await b2bTelegramApi<TelegramUpdate[]>(
        "getUpdates",
        {
          ...(offset !== undefined ? { offset } : {}),
          timeout: 50,
          allowed_updates: ["message", "callback_query", "inline_query"],
        },
        { timeoutMs: 60_000, signal },
      );
      consecutiveFailures = 0;
      for (const update of updates) {
        try {
          await processB2bAssistantUpdate(update);
        } catch (error) {
          console.error("B2B assistant update failed", update.update_id, error instanceof Error ? error.message : error);
          const chatId = update.message?.chat.id ?? update.callback_query?.message?.chat.id;
          if (chatId) {
            await sendB2bTelegramMessage(chatId, "⚠️ Не удалось обработать запрос. Попробуйте ещё раз.").catch(() => undefined);
          }
        } finally {
          offset = update.update_id + 1;
          await saveB2bAssistantUpdateId(update.update_id);
        }
      }
    } catch (error) {
      if (signal?.aborted) break;
      consecutiveFailures += 1;
      console.error("B2B assistant polling failed", error instanceof Error ? error.message : error);
      if (consecutiveFailures >= 10) throw error;
      await delayB2bTelegram(Math.min(30_000, consecutiveFailures * 3_000), signal);
    }
  }
}
