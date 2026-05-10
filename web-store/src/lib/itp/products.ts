import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { downloadItpStaticJson } from "@/lib/itp/staticFiles";
import type { ItpProduct } from "@/lib/itp/types";
import { productSlug } from "@/lib/slug";
import { finishSyncLog, sanitizePayload, startSyncLog } from "@/lib/sync-log";

export async function syncItpProducts() {
  const log = await startSyncLog("products");

  try {
    const products = await downloadItpStaticJson<ItpProduct[]>("/download/catalog/json/products_9.json");
    const categories = await prisma.category.findMany({
      select: {
        id: true,
        externalId: true,
      },
    });
    const categoryIds = new Map(categories.map((category) => [category.externalId, category.id]));

    await prisma.product.updateMany({
      data: {
        isActive: false,
      },
    });

    let processed = 0;
    let failed = 0;

    for (const product of products) {
      try {
        const categoryId = categoryIds.get(product.category);
        await prisma.product.upsert({
          where: {
            sku: product.sku,
          },
          create: {
            sku: product.sku,
            categoryId,
            categoryExternalId: product.category,
            supplierName: product.name,
            slug: productSlug(product.name, product.sku),
            vendor: product.vendor,
            part: product.part,
            barcodes: product.barcodes,
            rrp: product.rrp ? new Prisma.Decimal(product.rrp) : undefined,
            warranty: product.warranty,
            weight: product.weight,
            volume: product.volume,
            multiplicity: product.multiplicity || 1,
            hasImage: Boolean(product.has_image),
            isActive: true,
          },
          update: {
            categoryId,
            categoryExternalId: product.category,
            supplierName: product.name,
            vendor: product.vendor,
            part: product.part,
            barcodes: product.barcodes,
            rrp: product.rrp ? new Prisma.Decimal(product.rrp) : null,
            warranty: product.warranty,
            weight: product.weight,
            volume: product.volume,
            multiplicity: product.multiplicity || 1,
            hasImage: Boolean(product.has_image),
            isActive: true,
            sourceUpdatedAt: new Date(),
          },
        });
        processed += 1;
      } catch {
        failed += 1;
      }
    }

    await finishSyncLog(log.id, {
      status: failed ? "error" : "success",
      total: products.length,
      processed,
      failed,
      message: failed ? "Products synchronized with row-level errors." : "Products synchronized from ITP static file.",
    });

    return {
      total: products.length,
      processed,
      failed,
    };
  } catch (error) {
    await finishSyncLog(log.id, {
      status: "error",
      message: error instanceof Error ? error.message : "Unknown products sync error",
      failed: 1,
      payload: sanitizePayload(error),
    });
    throw error;
  }
}
