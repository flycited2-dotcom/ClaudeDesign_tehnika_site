import type { B2bAssistantProduct } from "@/lib/b2b-assistant-search";
import { buildCustomMarkupCallback, buildMarkupCallback } from "@/lib/b2b-assistant-offer";
import { formatRub } from "@/lib/format";
import { warrantyLabel } from "@/lib/product-display";
import { stockProductDescription } from "@/lib/stock-monitor";
import { stockLabel } from "@/lib/stock";
import { escapeTelegramHtml } from "@/lib/telegram";

export type B2bAssistantButton = {
  text: string;
  url?: string;
  callback_data?: string;
  switch_inline_query?: string;
};

export type B2bAssistantCard = {
  text: string;
  imageUrl?: string;
  buttonRows?: B2bAssistantButton[][];
};

function numberValue(value: { toString(): string } | null): number | null {
  if (!value) return null;
  const number = Number(value.toString());
  return Number.isFinite(number) && number > 0 ? number : null;
}

export function b2bProductDisplayName(product: B2bAssistantProduct): string {
  return (product.name || product.supplierName).replace(/\s+/g, " ").trim();
}

function productDescription(product: B2bAssistantProduct, limit = 700): string | null {
  const description = product.description?.replace(/\s+/g, " ").trim()
    || stockProductDescription(product.supplierName);
  if (!description) return null;
  return description.length <= limit ? description : `${description.slice(0, Math.max(1, limit - 3)).trimEnd()}…`;
}

function supplierStockText(product: B2bAssistantProduct): string {
  if (!product.isAvailable) return "Нет в наличии";
  const state = product.stockStatus === "out"
    ? (product.nearestStockStatus || "available")
    : product.stockStatus;
  return stockLabel(state);
}

function formatMoscowDate(value: Date): string {
  return value.toLocaleString("ru-RU", {
    timeZone: "Europe/Moscow",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function chunkButtons(buttons: B2bAssistantButton[], size = 2): B2bAssistantButton[][] {
  const rows: B2bAssistantButton[][] = [];
  for (let index = 0; index < buttons.length; index += size) rows.push(buttons.slice(index, index + size));
  return rows;
}

export function buildManagerProductCard({
  product,
  position,
  total,
  markupPresets,
  orderUrl,
  productUrl,
  imageUrl,
}: {
  product: B2bAssistantProduct;
  position: number;
  total: number;
  markupPresets: number[];
  orderUrl?: string;
  productUrl?: string;
  imageUrl?: string;
}): B2bAssistantCard {
  const e = escapeTelegramHtml;
  const name = b2bProductDisplayName(product);
  const description = productDescription(product);
  const supplierPrice = numberValue(product.supplierPrice);
  const actions: B2bAssistantButton[][] = [];
  const mainActions: B2bAssistantButton[] = [];
  if (orderUrl && product.isAvailable) mainActions.push({ text: "🛒 Заказать", url: orderUrl });
  if (productUrl) mainActions.push({ text: "📦 Карточка товара", url: productUrl });
  if (mainActions.length > 0) actions.push(mainActions);

  if (supplierPrice) {
    actions.push(
      ...chunkButtons(
        markupPresets.map((markup) => ({
          text: `👤 Клиенту +${new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 2 }).format(markup)}%`,
          callback_data: buildMarkupCallback(product.sku, markup),
        })),
      ),
    );
    actions.push([{ text: "✏️ Своя наценка", callback_data: buildCustomMarkupCallback(product.sku) }]);
  }

  return {
    imageUrl,
    text: [
      `🔎 <b>Результат ${position} из ${total}</b>`,
      "━━━━━━━━━━━━━━━━",
      `<b>${e(name)}</b>`,
      product.category?.name ? `📁 ${e(product.category.name)}` : null,
      product.vendor ? `🏭 <b>Бренд:</b> ${e(product.vendor)}` : null,
      product.part ? `🏷 <b>Модель:</b> <code>${e(product.part)}</code>` : null,
      `📦 <b>SKU:</b> <code>${product.sku}</code>`,
      supplierPrice ? `💰 <b>Цена поставщика:</b> ${formatRub(supplierPrice)}` : "💰 Цена поставщика не указана",
      `🟢 <b>Остаток:</b> ${e(supplierStockText(product))}`,
      product.deliveryDays > 0 ? `🚚 <b>Поставка:</b> ${product.deliveryDays} дн.` : null,
      product.multiplicity > 1 ? `🔢 <b>Кратность:</b> ${product.multiplicity} шт.` : null,
      description ? "" : null,
      description ? `📝 ${e(description)}` : null,
      "",
      `🕐 Данные обновлены ${e(formatMoscowDate(product.updatedAt))} МСК`,
    ]
      .filter((line) => line !== null)
      .join("\n"),
    buttonRows: actions.length > 0 ? actions : undefined,
  };
}

export function buildClientProductCard({
  product,
  clientPrice,
  productUrl,
  imageUrl,
  validUntil,
  shareQuery,
}: {
  product: B2bAssistantProduct;
  clientPrice: number;
  productUrl?: string;
  imageUrl?: string;
  validUntil?: Date;
  shareQuery?: string;
}): B2bAssistantCard {
  const e = escapeTelegramHtml;
  const description = productDescription(product, 450);
  const warranty = warrantyLabel(product.warranty);
  const buttonRows: B2bAssistantButton[][] = [];
  if (shareQuery) buttonRows.push([{ text: "📤 Отправить клиенту", switch_inline_query: shareQuery }]);
  if (productUrl) buttonRows.push([{ text: "📦 Подробнее о товаре", url: productUrl }]);

  return {
    imageUrl,
    text: [
      `📦 <b>${e(b2bProductDisplayName(product))}</b>`,
      product.part ? `Модель: <code>${e(product.part)}</code>` : null,
      "━━━━━━━━━━━━━━━━",
      product.isAvailable ? "✅ <b>В наличии</b>" : "⚪ <b>Наличие уточняется</b>",
      product.deliveryDays > 0 ? `🚚 Срок поставки: ${product.deliveryDays} дн.` : null,
      warranty ? `🛡 Гарантия: ${e(warranty)}` : null,
      `💳 <b>Цена: ${formatRub(clientPrice)}</b>`,
      validUntil ? `🕐 Цена актуальна до ${e(formatMoscowDate(validUntil))} МСК` : null,
      description ? "" : null,
      description ? e(description) : null,
    ]
      .filter((line) => line !== null)
      .join("\n"),
    buttonRows: buttonRows.length > 0 ? buttonRows : undefined,
  };
}
