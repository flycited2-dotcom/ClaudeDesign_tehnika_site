import type { Prisma } from "@prisma/client";
import type { CatalogSort } from "@/lib/catalog-query";

/**
 * Catalog ordering. Every sort starts with the same availability/photo tiers so
 * a listing never opens with "Фото уточняется" cards or out-of-stock goods:
 *   1. в наличии + есть фото
 *   2. в наличии, без фото
 *   3. нет в наличии (внутри — сначала с фото)
 * The chosen sort (price / date) only orders products inside each tier.
 * hasRealImage (not the unreliable supplier hasImage flag) drives the photo tier.
 */
export function catalogProductOrderBy(sort: CatalogSort = "popular"): Prisma.ProductOrderByWithRelationInput[] {
  const tiers: Prisma.ProductOrderByWithRelationInput[] = [{ isAvailable: "desc" }, { hasRealImage: "desc" }];

  if (sort === "price_asc") {
    return [...tiers, { retailPrice: { sort: "asc", nulls: "last" } }, { updatedAt: "desc" }];
  }

  if (sort === "price_desc") {
    return [...tiers, { retailPrice: { sort: "desc", nulls: "last" } }, { updatedAt: "desc" }];
  }

  if (sort === "new") {
    return [...tiers, { updatedAt: "desc" }, { retailPrice: "desc" }];
  }

  // "popular": no sales data, so freshly synced goods float up within a tier.
  return [...tiers, { updatedAt: "desc" }];
}
