import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { itpRpc } from "@/lib/itp/client";
import type { ItpActiveProduct } from "@/lib/itp/types";
import { calculateRetailPrice } from "@/lib/pricing";
import { getStoreSettings } from "@/lib/settings";
import { mapSupplierStock } from "@/lib/stock";
import { finishSyncLog, sanitizePayload, startSyncLog } from "@/lib/sync-log";

type ActiveProductsResponse = {
  products: ItpActiveProduct[];
  total: number;
};

export async function syncItpPrices() {
  const log = await startSyncLog("prices");

  try {
    const response = await itpRpc<ActiveProductsResponse>({
      request: {
        method: "get_active_products",
        model: "client_api",
        module: "platform",
      },
    });

    if (!response.success || !response.data) {
      await finishSyncLog(log.id, {
        status: "error",
        message: response.message ?? "ITP get_active_products failed.",
        commandId: response.commandid,
        failed: 1,
      });
      throw new Error(response.message ?? "ITP get_active_products failed.");
    }

    const activeProducts = response.data.products;
    const syncStartedAt = new Date();
    const settings = await getStoreSettings();
    const skus = activeProducts.map((product) => product.sku);
    const existingProducts = await prisma.product.findMany({
      where: {
        sku: {
          in: skus,
        },
      },
      select: {
        sku: true,
        manualPrice: true,
        rrp: true,
      },
    });
    const productBySku = new Map(existingProducts.map((product) => [product.sku, product]));

    let processed = 0;
    let failed = 0;

    for (const activeProduct of activeProducts) {
      const current = productBySku.get(activeProduct.sku);

      if (!current) {
        failed += 1;
        continue;
      }

      const retailPrice = calculateRetailPrice({
        supplierPrice: activeProduct.price,
        markupPercent: settings.markupPercent,
        minMarkupRub: settings.minMarkupRub,
        manualPrice: current.manualPrice ? Number(current.manualPrice) : null,
        rrp: current.rrp ? Number(current.rrp) : null,
        mode: settings.priceMode,
      });

      await prisma.product.update({
        where: {
          sku: activeProduct.sku,
        },
        data: {
          supplierPrice: new Prisma.Decimal(activeProduct.price),
          retailPrice: new Prisma.Decimal(retailPrice),
          isAvailable: true,
          stockStatus: mapSupplierStock(activeProduct.qty),
          nearestStockStatus: mapSupplierStock(activeProduct.nearest_logistic_center_qty),
          deliveryDays: activeProduct.delivery_days ?? 0,
          multiplicity: activeProduct.multiplicity || 1,
        },
      });
      processed += 1;
    }

    const unavailableProducts = await prisma.product.updateMany({
      where: {
        isAvailable: true,
        updatedAt: {
          lt: syncStartedAt,
        },
      },
      data: {
        isAvailable: false,
        stockStatus: "out",
        nearestStockStatus: null,
        deliveryDays: 0,
      },
    });

    await finishSyncLog(log.id, {
      status: "success",
      total: response.data.total,
      processed,
      failed,
      commandId: response.commandid,
      message: failed
        ? `Prices synchronized; some supplier SKUs were not present in the local catalog. Marked ${unavailableProducts.count} stale products unavailable.`
        : `Prices and stock synchronized. Marked ${unavailableProducts.count} stale products unavailable.`,
    });

    return {
      total: response.data.total,
      processed,
      failed,
    };
  } catch (error) {
    await finishSyncLog(log.id, {
      status: "error",
      message: error instanceof Error ? error.message : "Unknown prices sync error",
      failed: 1,
      payload: sanitizePayload(error),
    });
    throw error;
  }
}
