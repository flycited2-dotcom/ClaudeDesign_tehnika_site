import { prisma } from "@/lib/db";
import { buildProductAttributeRows } from "@/lib/product-attribute-backfill";
import { finishSyncLog, sanitizePayload, startSyncLog } from "@/lib/sync-log";
import { notifyRevalidate } from "./notify-revalidate";

const BATCH_SIZE = Number(process.env.PRODUCT_ATTRIBUTE_BACKFILL_BATCH_SIZE ?? 500);

async function main() {
  const log = await startSyncLog("product-attributes");
  let cursor: string | undefined;
  let scanned = 0;
  let written = 0;

  try {
    console.log("product attributes backfill: deleting existing source=name rows...");
    await prisma.productAttribute.deleteMany({
      where: {
        source: "name",
      },
    });
    console.log("product attributes backfill: deleted, scanning products...");

    for (;;) {
      const products = await prisma.product.findMany({
        where: {
          isActive: true,
          isVisible: true,
        },
        select: {
          id: true,
          name: true,
          supplierName: true,
          category: { select: { name: true } },
        },
        orderBy: {
          id: "asc",
        },
        ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
        take: BATCH_SIZE,
      });

      if (!products.length) break;

      const rows = products.flatMap((product) => {
        return buildProductAttributeRows({
          productId: product.id,
          name: product.name,
          supplierName: product.supplierName,
          categoryName: product.category?.name,
        });
      });

      if (rows.length) {
        await prisma.productAttribute.createMany({
          data: rows,
          skipDuplicates: true,
        });
        written += rows.length;
      }

      scanned += products.length;
      cursor = products[products.length - 1]?.id;
      if (scanned % (BATCH_SIZE * 20) === 0) {
        console.log(`product attributes backfill progress: scanned=${scanned} written=${written}`);
      }
    }

    await finishSyncLog(log.id, {
      status: "success",
      total: scanned,
      processed: written,
      message: "Product attributes backfilled from product names.",
    });

    console.log(`product attributes backfill complete: scanned=${scanned} written=${written}`);
    await notifyRevalidate();
  } catch (error) {
    await finishSyncLog(log.id, {
      status: "error",
      total: scanned,
      processed: written,
      failed: 1,
      message: error instanceof Error ? error.message : "Unknown product attributes backfill error",
      payload: sanitizePayload(error),
    });
    throw error;
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
