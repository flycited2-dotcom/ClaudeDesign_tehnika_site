import type { ItpActiveProduct } from "@/lib/itp/types";

export const DEFAULT_STOCK_ALERT_REPEAT_MINUTES = 15;
export const DEFAULT_STOCK_STATUS_REPEAT_MINUTES = 60;

export type StockMonitorProduct = {
  sku: number;
  name: string;
  vendor?: string | null;
  part?: string | null;
  slug?: string | null;
};

export type MonitoredStock = StockMonitorProduct & {
  price?: number;
  qty?: string;
  realQty?: number;
  nearestQty?: string;
  nearestRealQty?: number;
  available: boolean;
  isRestock: boolean;
  orderUrl?: string;
};

export type StockSnapshot = Pick<
  MonitoredStock,
  "available" | "price" | "qty" | "realQty" | "nearestQty" | "nearestRealQty"
>;

export type StockAlertButton =
  | {
      text: string;
      url: string;
      callback_data?: never;
    }
  | {
      text: string;
      callback_data: string;
      url?: never;
    };

export type StockAlertTelegramMessage = {
  text: string;
  buttonRows?: StockAlertButton[][];
};

function splitWatchValues(value: string | undefined): string[] {
  return (value ?? "")
    .split(/[;,\n]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function parseWatchedSkus(value: string | undefined): number[] {
  const tokens = splitWatchValues(value);
  const skus = tokens.map((token) => Number(token));
  const invalid = tokens.filter((_, index) => !Number.isSafeInteger(skus[index]) || skus[index] <= 0);

  if (invalid.length > 0) {
    throw new Error(`Некорректные SKU в STOCK_MONITOR_SKUS: ${invalid.join(", ")}`);
  }

  return [...new Set(skus)];
}

export function parseWatchedPatterns(value: string | undefined): string[] {
  const patterns = splitWatchValues(value);
  const unique = new Map<string, string>();

  for (const pattern of patterns) {
    unique.set(pattern.toLocaleLowerCase("ru-RU"), pattern);
  }

  return [...unique.values()];
}

export function isSupplierQtyAvailable(value: string | null | undefined): boolean {
  const normalized = value?.trim();
  if (!normalized || normalized === "0") return false;
  if (normalized === "*" || normalized === "**" || normalized === "***") return true;

  const numeric = Number(normalized.replace(",", "."));
  return Number.isFinite(numeric) && numeric > 0;
}

export function supplierQtyLabel(value: string | null | undefined): string {
  const normalized = value?.trim();
  if (!normalized || normalized === "0") return "нет";
  if (normalized === "*") return "мало";
  if (normalized === "**") return "в наличии";
  if (normalized === "***") return "много";
  return isSupplierQtyAvailable(normalized) ? `${normalized} шт.` : "нет";
}

export function activeProductIsAvailable(product: ItpActiveProduct | undefined): boolean {
  return Boolean(
    product &&
      (isSupplierQtyAvailable(product.qty) || isSupplierQtyAvailable(product.nearest_logistic_center_qty)),
  );
}

export function stockNotificationIsDue({
  available,
  previouslyAvailable,
  lastNotifiedAt,
  now,
  repeatMinutes = DEFAULT_STOCK_ALERT_REPEAT_MINUTES,
}: {
  available: boolean;
  previouslyAvailable?: boolean;
  lastNotifiedAt?: string;
  now: Date;
  repeatMinutes?: number;
}): boolean {
  if (!available) return false;
  if (!previouslyAvailable || !lastNotifiedAt) return true;

  const lastNotificationTime = Date.parse(lastNotifiedAt);
  if (!Number.isFinite(lastNotificationTime)) return true;

  return now.getTime() - lastNotificationTime >= repeatMinutes * 60_000;
}

export function stockSnapshotHasChanged(
  current: StockSnapshot,
  previous: Partial<StockSnapshot> | undefined,
): boolean {
  if (!previous) return true;
  return (
    current.available !== previous.available ||
    current.qty !== previous.qty ||
    current.nearestQty !== previous.nearestQty ||
    // Older state files do not have exact quantity and price fields. Treat
    // those missing fields as an unknown baseline, persist today's values and
    // start comparing them on the following run without a one-off false alert.
    (previous.price !== undefined && current.price !== previous.price) ||
    (previous.realQty !== undefined && current.realQty !== previous.realQty) ||
    (previous.nearestRealQty !== undefined && current.nearestRealQty !== previous.nearestRealQty)
  );
}

function escapeTelegramHtml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function formatPrice(value: number | undefined): string | null {
  if (value === undefined || !Number.isFinite(value)) return null;
  return `${new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 2 }).format(value)} ₽`;
}

export function compactStockProductName(name: string, part?: string | null): string {
  let compact = name.split("(", 1)[0].trim();
  compact = compact.replace(/^(?:\(Поврежденная упаковка\)\s*)?Стабилизатор напряжения(?: настенный)?\s+/i, "");

  if (part) {
    const escapedPart = part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    compact = compact.replace(new RegExp(`\\s*${escapedPart}\\s*`, "gi"), " ");
  }

  return compact.replace(/\s+/g, " ").trim();
}

export function stockProductDescription(name: string): string | null {
  const opening = name.indexOf("(");
  const closing = name.lastIndexOf(")");
  if (opening < 0 || closing <= opening) return null;

  const description = name.slice(opening + 1, closing).replace(/\s+/g, " ").trim();
  return description || null;
}

function stockCardQty(value: string | null | undefined): string {
  const label = supplierQtyLabel(value);
  return label === "нет" ? `⚪ ${label}` : `🟢 ${label}`;
}

function stockCardQuantity(value: string | null | undefined, realValue: number | undefined): string {
  if (Number.isFinite(realValue) && realValue! > 0) return `🟢 ${realValue} шт.`;
  return stockCardQty(value);
}

export function buildStockAlertHeader(items: MonitoredStock[], checkedAt: Date): string {
  const hasRestock = items.some((item) => item.isRestock);
  const header = hasRestock
    ? "🚨 <b>ВАЖНО: ПОСТУПИЛИ СТАБИЛИЗАТОРЫ</b>"
    : "🔄 <b>ИЗМЕНИЛИСЬ ОСТАТКИ ИЛИ ЦЕНЫ</b>";

  return [
    header,
    "━━━━━━━━━━━━━━━━",
    `Доступно моделей: <b>${items.length}</b>`,
    "Каждая модель — отдельной карточкой ниже.",
    `🕐 ${escapeTelegramHtml(checkedAt.toLocaleString("ru-RU", { timeZone: "Europe/Moscow" }))} МСК`,
  ].join("\n");
}

export function buildStockProductCard({
  item,
  b2bUrl,
  siteUrl,
}: {
  item: MonitoredStock;
  b2bUrl?: string;
  siteUrl?: string;
}): StockAlertTelegramMessage {
  const e = escapeTelegramHtml;
  const name = compactStockProductName(item.name, item.part);
  const description = stockProductDescription(item.name);
  const lines = [
    `⚡ <b>${e(name)}</b>`,
    "━━━━━━━━━━━━━━━━",
    `📦 <b>SKU:</b> <code>${item.sku}</code>`,
    item.part ? `🏷 <b>Артикул:</b> <code>${e(item.part)}</code>` : null,
    formatPrice(item.price) ? `💰 <b>Цена поставщика:</b> ${formatPrice(item.price)}` : null,
    "",
    `🏭 <b>Ваш склад:</b> ${e(stockCardQuantity(item.qty, item.realQty))}`,
    description ? "" : null,
    description ? `📝 <b>Описание:</b>\n${e(description)}` : null,
  ];

  const buttonRows: StockAlertButton[][] = [];

  buttonRows.push([
    item.orderUrl
      ? { text: "🛒 Заказать", url: item.orderUrl }
      : { text: "🛒 Заказать", callback_data: `itpo:s:${item.sku}` },
  ]);

  if (b2bUrl) buttonRows.push([{ text: "🌐 Открыть B2B", url: b2bUrl }]);

  if (siteUrl && item.slug) {
    const productUrl = `${siteUrl.replace(/\/$/, "")}/product/${encodeURIComponent(item.slug)}`;
    buttonRows.push([{ text: "📦 Карточка товара", url: productUrl }]);
  }

  return {
    text: lines.filter((line) => line !== null).join("\n"),
    buttonRows: buttonRows.length > 0 ? buttonRows : undefined,
  };
}

export function buildStockAlertMessages({
  items,
  checkedAt,
  b2bUrl,
  siteUrl,
}: {
  items: MonitoredStock[];
  checkedAt: Date;
  b2bUrl?: string;
  siteUrl?: string;
}): StockAlertTelegramMessage[] {
  return [
    { text: buildStockAlertHeader(items, checkedAt) },
    ...items.map((item) => buildStockProductCard({ item, b2bUrl, siteUrl })),
  ];
}

export function buildStockStatusMessage({
  items,
  checkedAt,
}: {
  items: MonitoredStock[];
  checkedAt: Date;
}): string {
  const available = items.filter((item) => item.available);
  const lines = [
    "✅ <b>Тест монитора остатков выполнен</b>",
    `Отслеживается моделей: <b>${items.length}</b>`,
    `Сейчас в наличии: <b>${available.length}</b>`,
    `Проверено: ${escapeTelegramHtml(checkedAt.toLocaleString("ru-RU", { timeZone: "Europe/Moscow" }))} МСК`,
  ];

  return lines.join("\n");
}

export function buildStockUnchangedMessage({
  items,
  checkedAt,
}: {
  items: MonitoredStock[];
  checkedAt: Date;
}): string {
  const available = items.filter((item) => item.available);
  return [
    "✅ <b>Остатки актуальны — изменений нет</b>",
    `В наличии: <b>${available.length}</b> из <b>${items.length}</b> отслеживаемых моделей.`,
    `Проверено: ${escapeTelegramHtml(checkedAt.toLocaleString("ru-RU", { timeZone: "Europe/Moscow" }))} МСК`,
  ].join("\n");
}

export function buildOutOfStockMessage(items: MonitoredStock[], checkedAt: Date): string {
  return [
    "ℹ️ <b>Отслеживаемые стабилизаторы закончились</b>",
    ...items.map((item) => `• ${escapeTelegramHtml(item.name)} (<code>${item.sku}</code>)`),
    `Проверено: ${escapeTelegramHtml(checkedAt.toLocaleString("ru-RU", { timeZone: "Europe/Moscow" }))} МСК`,
  ].join("\n");
}
