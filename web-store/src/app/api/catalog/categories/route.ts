import { NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { getActiveCategories } from "@/lib/catalog";
import { prisma } from "@/lib/db";
import { isDegradedRetailName } from "@/lib/retail-products";

export const dynamic = "force-dynamic";

// Keep in sync with STOREFRONT_CACHE_SECONDS in @/lib/catalog (1 hour, paired
// with the cron warmer at scripts/warm_all.sh).
const STOREFRONT_CACHE_SECONDS = 3600;

type MenuCategory = {
  id: string;
  slug: string;
  name: string;
  productCount: number;
  hasChildren: boolean;
};

const getNonEmptyCategoryIds = unstable_cache(
  async (): Promise<Set<string>> => {
    if (!process.env.DATABASE_URL) return new Set();
    const rows = await prisma.product.groupBy({
      by: ["categoryId"],
      where: { isActive: true, isVisible: true, categoryId: { not: null } },
      _count: { _all: true },
    });
    return new Set(rows.map((r) => r.categoryId).filter((id): id is string => !!id));
  },
  ["non-empty-category-ids"],
  { revalidate: STOREFRONT_CACHE_SECONDS, tags: ["catalog", "products"] },
);

const getMenuCategoriesForParent = unstable_cache(
  async (parentKey: string): Promise<MenuCategory[]> => {
    if (!process.env.DATABASE_URL) {
      return [];
    }

    const parentId = parentKey === "root" ? null : parentKey;
    const categories = await prisma.category.findMany({
      where: {
        isActive: true,
        isVisible: true,
        parentId,
      },
      select: {
        id: true,
        name: true,
        slug: true,
      },
      orderBy: {
        name: "asc",
      },
    });
    const visible = categories.filter((category) => !isDegradedRetailName(category.name));
    const ids = visible.map((category) => category.id);
    if (ids.length === 0) return [];

    const [productCounts, childCategoryRows] = await Promise.all([
      prisma.product.groupBy({
        by: ["categoryId"],
        where: {
          isActive: true,
          isVisible: true,
          categoryId: { in: ids },
        },
        _count: { _all: true },
      }),
      prisma.category.findMany({
        where: {
          isActive: true,
          isVisible: true,
          parentId: { in: ids },
        },
        select: { parentId: true },
      }),
    ]);

    const countMap = new Map(productCounts.map((row) => [row.categoryId, row._count._all]));
    const childMap = new Map<string, boolean>();
    for (const row of childCategoryRows) {
      if (row.parentId) childMap.set(row.parentId, true);
    }

    return visible.map((category) => ({
      id: category.id,
      slug: category.slug,
      name: category.name,
      productCount: countMap.get(category.id) ?? 0,
      hasChildren: childMap.get(category.id) ?? false,
    }));
  },
  ["menu-categories-parent"],
  { revalidate: STOREFRONT_CACHE_SECONDS, tags: ["catalog"] },
);

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    // flat=true: return slugs of active+visible categories that actually have
    // products (productCount > 0). Used by the cron cache warmer — pinging
    // empty categories is wasted DB load. There are ~4300 categories in DB
    // total; non-empty subset is much smaller.
    if (searchParams.get("flat") === "true") {
      const [all, counts] = await Promise.all([
        getActiveCategories(),
        getNonEmptyCategoryIds(),
      ]);
      const slugs = all
        .filter((c) => counts.has(c.id) && !isDegradedRetailName(c.name))
        .map((c) => c.slug);
      return NextResponse.json({ slugs });
    }

    const parent = searchParams.get("parent")?.trim() || "root";
    const categories = await getMenuCategoriesForParent(parent);
    return NextResponse.json({ categories });
  } catch (error) {
    console.error("[catalog/categories]", error);
    return NextResponse.json({ categories: [] }, { status: 200 });
  }
}
