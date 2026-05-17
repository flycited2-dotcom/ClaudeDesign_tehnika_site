import type { CatalogQuery } from "@/lib/catalog";
import type {
  CatalogAttributeFilter,
  CatalogAttributeRangeFilter,
} from "@/lib/catalog-attribute-filters";
import type { CatalogSort } from "@/lib/catalog-query";
import type { CatalogSpecFilterValue } from "@/lib/catalog-spec-filters";

export type NormalizedCatalogCacheKey = {
  categorySlug: string | null;
  query: string | null;
  brands: string[];
  available: boolean;
  withPhoto: boolean;
  minPrice: number | null;
  maxPrice: number | null;
  page: number;
  sort: CatalogSort | null;
  specFilters: CatalogSpecFilterValue[];
  attributeFilters: CatalogAttributeFilter[];
  attributeRangeFilters: CatalogAttributeRangeFilter[];
};

/**
 * Normalize CatalogQuery into a stable shape for `unstable_cache` keys.
 *
 * `unstable_cache` JSON-stringifies function args to build its key, so
 * any non-deterministic field (different case, array order, presence
 * of `undefined`) would produce a different cache entry for the same
 * logical query. This helper canonicalizes the query so equivalent
 * user requests hit the same cache entry.
 */
export function normalizeCatalogCacheArgs(
  query: Partial<CatalogQuery>,
): NormalizedCatalogCacheKey {
  // Merge `brand` (legacy single value) into `brands` list, lowercase,
  // trim, drop empties, dedupe, sort.
  const rawBrands = [...(query.brands ?? []), query.brand];
  const brandSet = new Set<string>();
  for (const b of rawBrands) {
    if (!b) continue;
    const trimmed = b.trim().toLowerCase();
    if (trimmed.length > 0) brandSet.add(trimmed);
  }
  const brands = Array.from(brandSet).sort();

  // specFilters are string literals (CatalogSpecFilterValue) — simple sort.
  const specFilters = [...(query.specFilters ?? [])].sort();

  // attributeFilters by key, then normalizedValue.
  const attributeFilters = [...(query.attributeFilters ?? [])].sort((a, b) =>
    a.key === b.key
      ? a.normalizedValue.localeCompare(b.normalizedValue)
      : a.key.localeCompare(b.key),
  );

  // attributeRangeFilters by key.
  const attributeRangeFilters = [...(query.attributeRangeFilters ?? [])].sort(
    (a, b) => a.key.localeCompare(b.key),
  );

  return {
    categorySlug: query.categorySlug ?? null,
    query: query.query ?? null,
    brands,
    available: query.available ?? false,
    withPhoto: query.withPhoto ?? false,
    minPrice: query.minPrice ?? null,
    maxPrice: query.maxPrice ?? null,
    page: Math.max(query.page ?? 1, 1),
    sort: query.sort ?? null,
    specFilters,
    attributeFilters,
    attributeRangeFilters,
  };
}
