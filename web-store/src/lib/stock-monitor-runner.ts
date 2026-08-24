import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { itpRpc } from "@/lib/itp/client";
import type { ItpActiveProduct } from "@/lib/itp/types";
import {
  activeProductIsAvailable,
  buildOutOfStockMessage,
  buildStockAlertMessages,
  buildStockStatusMessage,
  buildStockUnchangedMessage,
  DEFAULT_STOCK_STATUS_REPEAT_MINUTES,
  type MonitoredStock,
  parseWatchedPatterns,
  parseWatchedSkus,
  stockSnapshotHasChanged,
  type StockAlertButton,
  type StockAlertTelegramMessage,
  type StockMonitorProduct,
} from "@/lib/stock-monitor";
import { clampTelegramText, escapeTelegramHtml } from "@/lib/telegram";
import { buildStockOrderLink } from "@/lib/stock-order-link";

const MAX_MATCHED_PRODUCTS = 500;
const DEFAULT_ERROR_REPEAT_MINUTES = 60;

type StockItemState = {
  available: boolean;
  lastNotifiedAt?: string;
  price?: number;
  qty?: string;
  realQty?: number;
  nearestQty?: string;
  nearestRealQty?: number;
};

type StockMonitorState = {
  version: 1;
  lastSuccessAt?: string;
  lastErrorNotifiedAt?: string;
  lastStatusNotifiedAt?: string;
  items: Record<string, StockItemState>;
};

type ActiveProductsResponse = {
  products: ItpActiveProduct[];
  total: number;
};

function positiveNumber(value: string | undefined, fallback: number, name: string): number {
  if (!value) return fallback;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(`${name} должен быть положительным числом.`);
  }
  return parsed;
}

function monitorStatePath(): string {
  return path.resolve(process.env.STOCK_MONITOR_STATE_FILE ?? ".runtime/stock-monitor-state.json");
}

async function loadState(filePath: string): Promise<StockMonitorState> {
  try {
    const state = JSON.parse(await readFile(filePath, "utf8")) as StockMonitorState;
    if (state.version !== 1 || !state.items) throw new Error("неподдерживаемый формат");
    return state;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return { version: 1, items: {} };
    }
    throw new Error(`Не удалось прочитать состояние монитора ${filePath}: ${String(error)}`);
  }
}

async function saveState(filePath: string, state: StockMonitorState): Promise<void> {
  await mkdir(path.dirname(filePath), { recursive: true });
  const tempPath = `${filePath}.${process.pid}.tmp`;
  await writeFile(tempPath, `${JSON.stringify(state, null, 2)}\n`, "utf8");
  await rename(tempPath, filePath);
}

async function resolveWatchedProducts(skus: number[], patterns: string[]) {
  const patternFilters: Prisma.ProductWhereInput[] = [];

  for (const pattern of patterns) {
    patternFilters.push({
      OR: [
        { supplierName: { contains: pattern, mode: "insensitive" } },
        { name: { contains: pattern, mode: "insensitive" } },
        { vendor: { contains: pattern, mode: "insensitive" } },
        { part: { contains: pattern, mode: "insensitive" } },
      ],
    });
  }

  if (skus.length === 0 && patternFilters.length === 0) {
    throw new Error("Укажите STOCK_MONITOR_SKUS и/или STOCK_MONITOR_PATTERNS.");
  }

  const products = await prisma.product.findMany({
    where: {
      OR: [
        ...(skus.length > 0 ? [{ sku: { in: skus } }] : []),
        ...(patternFilters.length > 0 ? [{ isActive: true, OR: patternFilters }] : []),
      ],
    },
    orderBy: { sku: "asc" },
    take: MAX_MATCHED_PRODUCTS + 1,
    select: {
      sku: true,
      supplierName: true,
      name: true,
      vendor: true,
      part: true,
      slug: true,
    },
  });

  if (products.length > MAX_MATCHED_PRODUCTS) {
    throw new Error(
      `Шаблоны STOCK_MONITOR_PATTERNS нашли больше ${MAX_MATCHED_PRODUCTS} товаров. Уточните серию или используйте SKU.`,
    );
  }

  const bySku = new Map<number, StockMonitorProduct>(
    products.map((product) => [
      product.sku,
      {
        sku: product.sku,
        name: product.name || product.supplierName,
        vendor: product.vendor,
        part: product.part,
        slug: product.slug,
      },
    ]),
  );

  // Exact SKU monitoring still works even if today's static catalog sync has
  // not seen the product yet. The API response itself is keyed by SKU.
  for (const sku of skus) {
    if (!bySku.has(sku)) {
      bySku.set(sku, { sku, name: `Товар SKU ${sku}`, vendor: null, part: null, slug: null });
    }
  }

  if (bySku.size === 0) {
    throw new Error("Ни один товар не совпал со STOCK_MONITOR_PATTERNS. Проверьте названия серий или укажите SKU.");
  }

  return [...bySku.values()];
}

async function fetchActiveProducts(skus: number[]): Promise<ItpActiveProduct[]> {
  const response = await itpRpc<ActiveProductsResponse>({
    request: {
      method: "get_active_products",
      model: "client_api",
      module: "platform",
    },
    // The unfiltered endpoint returns the supplier's entire active catalog and
    // can take minutes or hang. One filtered request keeps all watched SKUs on
    // the same supplier snapshot without making one request per item.
    filter: [{ property: "sku", operator: "IN", value: skus }],
  });

  if (!response.success || !response.data) {
    throw new Error(response.message ?? "I-T-P get_active_products вернул пустой ответ.");
  }

  return response.data.products;
}

async function sendStockMonitorTelegramMessage(
  text: string,
  buttonRows?: StockAlertButton[][],
): Promise<{ delivered: boolean }> {
  const token = process.env.STOCK_MONITOR_TELEGRAM_BOT_TOKEN ?? process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.STOCK_MONITOR_TELEGRAM_CHAT_ID ?? process.env.TELEGRAM_MANAGER_CHAT_ID;
  if (!token || !chatId) return { delivered: false };

  try {
    const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: clampTelegramText(text),
        parse_mode: "HTML",
        disable_web_page_preview: true,
        ...(buttonRows?.length
          ? {
              reply_markup: {
                inline_keyboard: buttonRows,
              },
            }
          : {}),
      }),
    });
    return { delivered: response.ok };
  } catch {
    return { delivered: false };
  }
}

async function sendStockMonitorTelegramMessages(
  messages: StockAlertTelegramMessage[],
): Promise<{ delivered: boolean }> {
  for (const message of messages) {
    const result = await sendStockMonitorTelegramMessage(message.text, message.buttonRows);
    if (!result.delivered) return result;
  }

  return { delivered: true };
}

function errorNotificationIsDue(state: StockMonitorState, now: Date): boolean {
  if (!state.lastErrorNotifiedAt) return true;
  const lastTime = Date.parse(state.lastErrorNotifiedAt);
  if (!Number.isFinite(lastTime)) return true;
  const repeatMinutes = positiveNumber(
    process.env.STOCK_MONITOR_ERROR_REPEAT_MINUTES,
    DEFAULT_ERROR_REPEAT_MINUTES,
    "STOCK_MONITOR_ERROR_REPEAT_MINUTES",
  );
  return now.getTime() - lastTime >= repeatMinutes * 60_000;
}

function statusNotificationIsDue(state: StockMonitorState, now: Date): boolean {
  if (!state.lastStatusNotifiedAt) return true;
  const lastTime = Date.parse(state.lastStatusNotifiedAt);
  if (!Number.isFinite(lastTime)) return true;
  const repeatMinutes = positiveNumber(
    process.env.STOCK_MONITOR_STATUS_REPEAT_MINUTES,
    DEFAULT_STOCK_STATUS_REPEAT_MINUTES,
    "STOCK_MONITOR_STATUS_REPEAT_MINUTES",
  );
  return now.getTime() - lastTime >= repeatMinutes * 60_000;
}

async function reportMonitorError(error: unknown, state: StockMonitorState, statePath: string, now: Date) {
  if (!errorNotificationIsDue(state, now)) return;
  const message = error instanceof Error ? error.message : String(error);
  const result = await sendStockMonitorTelegramMessage(
    [
      "⚠️ <b>Монитор остатков I-T-P не смог выполнить проверку</b>",
      escapeTelegramHtml(message.slice(0, 1200)),
      `Время: ${escapeTelegramHtml(now.toLocaleString("ru-RU", { timeZone: "Europe/Moscow" }))} МСК`,
      "Следующая попытка будет выполнена по расписанию.",
    ].join("\n"),
  );
  if (result.delivered) {
    state.lastErrorNotifiedAt = now.toISOString();
    await saveState(statePath, state);
  }
}

export async function runStockMonitor({
  testMode = false,
  dryRun = false,
}: { testMode?: boolean; dryRun?: boolean } = {}) {
  const statePath = monitorStatePath();
  const state = await loadState(statePath);
  const now = new Date();

  try {
    const skus = parseWatchedSkus(process.env.STOCK_MONITOR_SKUS);
    const patterns = parseWatchedPatterns(process.env.STOCK_MONITOR_PATTERNS);
    const watchedProducts = await resolveWatchedProducts(skus, patterns);
    const activeProducts = await fetchActiveProducts(watchedProducts.map((product) => product.sku));
    const activeBySku = new Map(activeProducts.map((product) => [product.sku, product]));
    const siteUrl = process.env.SITE_URL;
    const orderLinksEnabled = Boolean(siteUrl && process.env.STOCK_ORDER_LINK_SECRET);
    const monitored: MonitoredStock[] = watchedProducts.map((product) => {
      const active = activeBySku.get(product.sku);
      const previous = state.items[String(product.sku)];
      const available = activeProductIsAvailable(active);
      return {
        ...product,
        price: active?.price,
        qty: active?.qty,
        realQty: active?.real_qty,
        nearestQty: active?.nearest_logistic_center_qty,
        nearestRealQty: active?.nearest_logistic_center_real_qty,
        available,
        isRestock: available && previous?.available !== true,
        orderUrl: orderLinksEnabled ? buildStockOrderLink({ sku: product.sku, siteUrl: siteUrl!, now }) : undefined,
      };
    });
    const changed = monitored.filter((item) => {
      const previous = state.items[String(item.sku)];
      return stockSnapshotHasChanged(item, previous);
    });
    const due = changed.filter((item) => item.available);
    const becameUnavailable = monitored.filter(
      (item) => !item.available && state.items[String(item.sku)]?.available === true,
    );

    for (const item of monitored) {
      const key = String(item.sku);
      state.items[key] = {
        ...state.items[key],
        available: item.available,
        price: item.price,
        qty: item.qty,
        realQty: item.realQty,
        nearestQty: item.nearestQty,
        nearestRealQty: item.nearestRealQty,
      };
    }

    const alertItems = testMode
      ? monitored.filter((item) => item.available).map((item) => ({ ...item, isRestock: true }))
      : due;

    if (alertItems.length > 0 && !dryRun) {
      const result = await sendStockMonitorTelegramMessages(
        buildStockAlertMessages({
          items: alertItems,
          checkedAt: now,
          b2bUrl: process.env.STOCK_MONITOR_B2B_URL ?? process.env.ITP_API_BASE_URL,
          siteUrl,
        }),
      );
      if (!result.delivered) {
        throw new Error("Telegram не принял уведомление. Проверьте TELEGRAM_BOT_TOKEN и TELEGRAM_MANAGER_CHAT_ID.");
      }
      for (const item of alertItems) state.items[String(item.sku)].lastNotifiedAt = now.toISOString();
    }

    if (
      becameUnavailable.length > 0 &&
      process.env.STOCK_MONITOR_NOTIFY_OUT_OF_STOCK !== "false" &&
      !dryRun
    ) {
      const result = await sendStockMonitorTelegramMessage(buildOutOfStockMessage(becameUnavailable, now));
      if (!result.delivered) {
        throw new Error("Telegram не принял уведомление об окончании остатков.");
      }
    }

    if (!testMode && changed.length === 0 && statusNotificationIsDue(state, now) && !dryRun) {
      const result = await sendStockMonitorTelegramMessage(buildStockUnchangedMessage({ items: monitored, checkedAt: now }));
      if (!result.delivered) {
        throw new Error("Telegram не принял краткий статус актуальности остатков.");
      }
      state.lastStatusNotifiedAt = now.toISOString();
    }

    if (testMode && alertItems.length === 0 && !dryRun) {
      const result = await sendStockMonitorTelegramMessage(buildStockStatusMessage({ items: monitored, checkedAt: now }));
      if (!result.delivered) {
        throw new Error("Тестовое Telegram-сообщение не доставлено.");
      }
    }

    if (!dryRun) {
      state.lastSuccessAt = now.toISOString();
      state.lastErrorNotifiedAt = undefined;
      await saveState(statePath, state);
    }

    return {
      checked: monitored.length,
      available: monitored.filter((item) => item.available).length,
      notified: alertItems.length,
      changed: changed.length,
      testMode,
      dryRun,
      availableSkus: monitored.filter((item) => item.available).map((item) => item.sku),
    };
  } catch (error) {
    if (!dryRun) {
      await reportMonitorError(error, state, statePath, now).catch(() => undefined);
    }
    throw error;
  }
}
