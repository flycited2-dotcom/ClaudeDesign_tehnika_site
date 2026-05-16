import { NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { getActiveCategories } from "@/lib/catalog";
import { prisma } from "@/lib/db";
import { isDegradedRetailName } from "@/lib/retail-products";

export const dynamic = "force-dynamic";

// 1 hour. Pair with cron cache warmer (scripts/warm_all.sh).
const STOREFRONT_CACHE_SECONDS = 3600;

// Cached: ids of categories that actually have published products.
// Pinging empty categories from the warmer is wasted DB load.
const getNonEmptyCategoryIds = unstable_cache(
  async (): Promise<string[]> => {
    if (!process.env.DATABASE_URL) return [];
    const rows = await prisma.product.groupBy({
      by: ["categoryId"],
      where: { isActive: true, isVisible: true, categoryId: { not: null } },
      _count: { _all: true },
    });
    return rows.map((r) => r.categoryId).filter((id): id is string => !!id);
  },
  ["non-empty-category-ids"],
  { revalidate: STOREFRONT_CACHE_SECONDS, tags: ["catalog", "products"] },
);

/**
 * GET /api/catalog/categories/flat
 *
 * Returns slugs of active+visible categories that have published products.
 * Used by scripts/warm_all.sh cron warmer. The flat list is much smaller than
 * total category count (1755 vs 4342 at time of writing).
 */
export async function GET() {
  try {
    const [all, nonEmpty] = await Promise.all([
      getActiveCategories(),
      getNonEmptyCategoryIds(),
    ]);
    const nonEmptySet = new Set(nonEmpty);
    const slugs = all
      .filter((c) => nonEmptySet.has(c.id) && !isDegradedRetailName(c.name))
      .map((c) => c.slug);
    return NextResponse.json({ slugs });
  } catch (error) {
    console.error("[catalog/categories/flat]", error);
    return NextResponse.json({ slugs: [] }, { status: 200 });
  }
}
