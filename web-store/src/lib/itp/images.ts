import { prisma } from "@/lib/db";
import { itpRpc } from "@/lib/itp/client";
import { sleep } from "@/lib/itp/utils";
import type { ItpProductImage } from "@/lib/itp/types";
import { finishSyncLog, sanitizePayload, startSyncLog, updateSyncLogProgress } from "@/lib/sync-log";

type ProductImagesResponse = {
  product_images: ItpProductImage[];
  total: number;
};

export function parseImageSyncLimit(value: string | undefined): number | null {
  const normalized = value?.trim().toLowerCase();

  if (!normalized || normalized === "all" || normalized === "0") {
    return null;
  }

  const limit = Number(normalized);
  return Number.isFinite(limit) && limit > 0 ? Math.floor(limit) : null;
}

type RetryOptions = {
  attempts?: number;
  sleepMs?: number;
};

function errorText(error: unknown): string {
  const textParts: string[] = [];
  let current: unknown = error;

  while (current && typeof current === "object") {
    const record = current as { message?: unknown; code?: unknown; cause?: unknown };
    if (typeof record.message === "string") textParts.push(record.message);
    if (typeof record.code === "string") textParts.push(record.code);
    current = record.cause;
  }

  return textParts.join(" ").toLowerCase();
}

export function isTransientImageSyncError(error: unknown): boolean {
  const text = errorText(error);
  return [
    "fetch failed",
    "etimedout",
    "econnreset",
    "econnrefused",
    "und_err",
    "timeout",
    "socket",
  ].some((term) => text.includes(term));
}

export async function runWithImageSyncRetry<T>(
  operation: () => Promise<T>,
  { attempts = 5, sleepMs = 2000 }: RetryOptions = {},
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (attempt >= attempts || !isTransientImageSyncError(error)) {
        throw error;
      }

      await sleep(sleepMs * attempt);
    }
  }

  throw lastError;
}

function supplierImageUrl(path: string): string {
  const baseUrl = process.env.ITP_API_BASE_URL ?? "https://b2b.i-t-p.pro";
  const imageSize = process.env.ITP_IMAGE_SIZE ?? "large";
  return `${baseUrl}/${path.replace(/^\/+/, "")}?size=${imageSize}`;
}

export async function syncItpImages(limit: number | null = null) {
  const log = await startSyncLog("images");

  try {
    const productWhere = {
      hasImage: true,
      isActive: true,
    };
    const availableProducts = await prisma.product.count({ where: productWhere });
    const total = limit ? Math.min(limit, availableProducts) : availableProducts;
    const batchSize = 100;
    let scanned = 0;
    let processedImages = 0;
    let failed = 0;
    let lastSku: number | undefined;

    await updateSyncLogProgress(log.id, {
      total,
      processed: 0,
      failed: 0,
      message: `Image metadata sync started for ${total} products.`,
    });

    while (scanned < total) {
      const products = await prisma.product.findMany({
        where: {
          ...productWhere,
          ...(lastSku
            ? {
                sku: {
                  gt: lastSku,
                },
              }
            : {}),
        },
        select: {
          id: true,
          sku: true,
        },
        take: Math.min(batchSize, total - scanned),
        orderBy: {
          sku: "asc",
        },
      });

      if (!products.length) {
        break;
      }

      scanned += products.length;
      lastSku = products[products.length - 1]?.sku;
      const productIdsBySku = new Map(products.map((product) => [product.sku, product.id]));

      const response = await runWithImageSyncRetry(() =>
        itpRpc<ProductImagesResponse>({
          request: {
            method: "read_new",
            model: "products_clients_images",
            module: "platform",
          },
          filter: [
            {
              property: "sku",
              operator: "IN",
              value: products.map((product) => product.sku),
            },
          ],
        }),
      );

      if (!response.success || !response.data) {
        failed += products.length;
        await sleep(500);
        continue;
      }

      for (const image of response.data.product_images) {
        const productId = productIdsBySku.get(image.sku);
        if (!productId) {
          failed += 1;
          continue;
        }

        await prisma.productImage.upsert({
          where: {
            supplierImageId: image.id,
          },
          create: {
            supplierImageId: image.id,
            productId,
            sku: image.sku,
            supplierImageUrl: supplierImageUrl(image.url),
            priority: image.priority,
            deleted: image.deleted,
            isPrimary: image.priority <= 100,
          },
          update: {
            supplierImageUrl: supplierImageUrl(image.url),
            priority: image.priority,
            deleted: image.deleted,
            isPrimary: image.priority <= 100,
          },
        });
        processedImages += 1;
      }

      if (scanned % 1000 === 0 || scanned >= total) {
        await updateSyncLogProgress(log.id, {
          total,
          processed: scanned,
          failed,
          message: `Scanned ${scanned}/${total} products, synchronized ${processedImages} image records.`,
        });
      }

      await sleep(500);
    }

    await finishSyncLog(log.id, {
      status: failed ? "error" : "success",
      total,
      processed: scanned,
      failed,
      message: `Image metadata synchronized for ${scanned} products with supplier images. Upserted ${processedImages} image records.`,
    });

    return {
      total,
      processed: processedImages,
      failed,
    };
  } catch (error) {
    await finishSyncLog(log.id, {
      status: "error",
      message: error instanceof Error ? error.message : "Unknown images sync error",
      failed: 1,
      payload: sanitizePayload(error),
    });
    throw error;
  }
}
