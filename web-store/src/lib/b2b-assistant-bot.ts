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
import {
  findB2bProductBySku,
  searchB2bProducts,
  type B2bAssistantProduct,
} from "@/lib/b2b-assistant-search";
import { readB2bAssistantOffset, saveB2bAssistantUpdateId } from "@/lib/b2b-assistant-state";
import {
  answerB2bCallbackQuery,
  b2bTelegramApi,
  delayB2bTelegram,
  sendB2bTelegramMessage,
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
    await b2bTelegramApi("sendPhoto", {
      chat_id: chatId,
      photo: card.imageUrl,
      caption: card.text,
      parse_mode: "HTML",
      show_caption_above_media: true,
      ...(card.buttonRows ? { reply_markup: inlineKeyboard(card.buttonRows) } : {}),
    });
    return;
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

async function handleSearch(chatId: number, query: string): Promise<void> {
  const products = await searchB2bProducts(query, b2bAssistantSearchLimit());
  if (products.length === 0) {
    await sendB2bTelegramMessage(
      chatId,
      [
        `🔍 По запросу <b>${escapeTelegramHtml(query)}</b> ничего не найдено.`,
        "Попробуйте сократить запрос до бренда и модели или пришлите точный артикул/SKU.",
      ].join("\n"),
    );
    return;
  }

  await sendB2bTelegramMessage(
    chatId,
    `🔎 По запросу <b>${escapeTelegramHtml(query)}</b> найдено: <b>${products.length}</b>`,
  );
  const presets = b2bAssistantMarkupPresets();
  for (const [index, product] of products.entries()) {
    await sendCard(
      chatId,
      buildManagerProductCard({
        product,
        position: index + 1,
        total: products.length,
        markupPresets: presets,
        orderUrl: orderUrl(product),
        productUrl: productUrl(product),
        imageUrl: absoluteUrl(productImageSrc(product.images[0])),
      }),
    );
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
    await sendClientOffer(message.chat.id, customMarkupSku, markupPercent);
    return;
  }
  await handleSearch(message.chat.id, text);
}

function parseCustomMarkupPrompt(value: string | undefined): number | null {
  if (!value?.includes(CUSTOM_MARKUP_PROMPT)) return null;
  const match = value.match(/Своя наценка для SKU:\s*(\d+)/);
  const sku = Number(match?.[1]);
  return Number.isSafeInteger(sku) && sku > 0 ? sku : null;
}

async function sendClientOffer(chatId: number, sku: number, markupPercent: number): Promise<number> {
  const product = await findB2bProductBySku(sku);
  const supplierPrice = Number(product?.supplierPrice?.toString() ?? 0);
  if (!product || !Number.isFinite(supplierPrice) || supplierPrice <= 0) {
    throw new Error("Для товара нет актуальной цены.");
  }
  const clientPrice = calculateClientPrice(supplierPrice, markupPercent, b2bAssistantRoundingStep());
  const shareQuery = createClientOfferQuery({ sku: product.sku, price: clientPrice });
  const parsed = parseClientOfferQuery(shareQuery);
  const validUntil = parsed.offer ? new Date(parsed.offer.expiresAt * 1000) : undefined;
  await sendCard(
    chatId,
    buildClientProductCard({
      product,
      clientPrice,
      imageUrl: absoluteUrl(productImageSrc(product.images[0])),
      validUntil,
      shareQuery,
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
  await sendClientOffer(query.message.chat.id, markup.sku, markup.markupPercent);
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

async function handleCallbackQuery(query: TelegramCallbackQuery): Promise<void> {
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
  const imageUrl = absoluteUrl(productImageSrc(product.images[0]));
  const shared = {
    id: offerQuery.slice(0, 64),
    title: product.name || product.supplierName,
    description: `${clientPrice.toLocaleString("ru-RU")} ₽ · ${product.isAvailable ? "в наличии" : "наличие уточняется"}`,
  };
  if (imageUrl && card.text.length <= 1_024) {
    return {
      type: "photo",
      ...shared,
      photo_url: imageUrl,
      thumbnail_url: imageUrl,
      caption: card.text,
      parse_mode: "HTML",
      show_caption_above_media: true,
    };
  }
  return {
    type: "article",
    ...shared,
    thumbnail_url: imageUrl,
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

  const parsedOffer = parseClientOfferQuery(query.query.trim());
  if (parsedOffer.offer) {
    const product = await findB2bProductBySku(parsedOffer.offer.sku);
    const results = product
      ? [inlineArticle(product, parsedOffer.offer.priceCents / 100, query.query.trim(), parsedOffer.offer.expiresAt)]
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
