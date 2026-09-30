import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

/**
 * Recompute Product.hasRealImage = "has at least one non-deleted ProductImage".
 * Pass product ids to refresh just those (image sync batches); omit to refresh
 * every product whose flag is stale (one-off backfill, idempotent).
 * Returns the number of rows changed.
 */
export async function refreshHasRealImage(productIds?: string[]): Promise<number> {
  if (productIds && productIds.length === 0) return 0;

  const scope = productIds ? Prisma.sql`AND p."id" = ANY(${productIds})` : Prisma.empty;

  return prisma.$executeRaw`
    UPDATE "Product" AS p
    SET "hasRealImage" = EXISTS (
      SELECT 1 FROM "ProductImage" AS i
      WHERE i."productId" = p."id" AND i."deleted" = false
    )
    WHERE p."hasRealImage" IS DISTINCT FROM EXISTS (
      SELECT 1 FROM "ProductImage" AS i
      WHERE i."productId" = p."id" AND i."deleted" = false
    )
    ${scope}
  `;
}
