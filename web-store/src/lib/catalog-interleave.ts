import { buildCategoryPath, type FlatCategory } from "@/lib/catalog-tree";

/**
 * Round-robin a flat product list across top-level categories.
 *
 * Why: when we sort by hasImage/updatedAt the largest top-category (e.g.
 * Компьютерная техника, 16k mass-market products) crowds out everyone else
 * and the storefront looks like a laptop shop. This helper rebalances so the
 * visible list cycles through different top-level categories.
 *
 * Behavior:
 * - Preserves caller order WITHIN a category (call site already sorted).
 * - Caps at `maxPerCategory` per top-category. Default `Infinity` = soft RR.
 * - Stops at `take` items.
 * - Products whose category can't be resolved (null / unknown) are appended
 *   at the end so we never silently drop rows.
 */
export function interleaveByTopCategory<T extends { categoryId: string | null }>(
  products: T[],
  allCategories: FlatCategory[],
  take: number,
  maxPerCategory: number = Number.POSITIVE_INFINITY,
): T[] {
  if (products.length === 0 || take <= 0) return [];

  // Group by top-level category id; preserve incoming order inside each bucket.
  const buckets = new Map<string, T[]>();
  const orphans: T[] = [];

  for (const product of products) {
    const topId = resolveTopCategoryId(allCategories, product.categoryId);
    if (!topId) {
      orphans.push(product);
      continue;
    }
    const bucket = buckets.get(topId);
    if (bucket) bucket.push(product);
    else buckets.set(topId, [product]);
  }

  if (buckets.size === 0) return orphans.slice(0, take);

  // Round-robin pull one from each non-empty bucket, repeat until `take`.
  const order = Array.from(buckets.keys());
  const taken = new Map<string, number>();
  const out: T[] = [];

  let progress = true;
  while (out.length < take && progress) {
    progress = false;
    for (const id of order) {
      if (out.length >= take) break;
      const bucket = buckets.get(id);
      if (!bucket || bucket.length === 0) continue;
      const already = taken.get(id) ?? 0;
      if (already >= maxPerCategory) continue;
      out.push(bucket.shift()!);
      taken.set(id, already + 1);
      progress = true;
    }
  }

  // Fill remaining slots from orphans, then anything still left in buckets
  // (only when maxPerCategory was hit on every bucket but take wasn't met).
  if (out.length < take) {
    for (const item of orphans) {
      if (out.length >= take) break;
      out.push(item);
    }
  }
  if (out.length < take) {
    for (const bucket of buckets.values()) {
      for (const item of bucket) {
        if (out.length >= take) break;
        out.push(item);
      }
      if (out.length >= take) break;
    }
  }

  return out;
}

function resolveTopCategoryId(
  allCategories: FlatCategory[],
  categoryId: string | null,
): string | null {
  if (!categoryId) return null;
  const path = buildCategoryPath(allCategories, categoryId);
  return path[0]?.id ?? null;
}
