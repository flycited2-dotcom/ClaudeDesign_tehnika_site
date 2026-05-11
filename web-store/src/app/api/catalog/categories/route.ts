import { NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/db";
import { isDegradedRetailName } from "@/lib/retail-products";

export const dynamic = "force-dynamic";

const STOREFRONT_CACHE_SECONDS = 300;

const getMenuCategories = unstable_cache(
  async () => {
    if (!process.env.DATABASE_URL) {
      return [] as Array<{ id: string; slug: string; name: string; productCount: number }>;
    }

    const categories = await prisma.category.findMany({
      where: {
        isActive: true,
        isVisible: true,
        parentId: null,
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

    const counts = await prisma.product.groupBy({
      by: ["categoryId"],
      where: {
        isActive: true,
        isVisible: true,
        categoryId: { in: visible.map((category) => category.id) },
      },
      _count: { _all: true },
    });
    const countMap = new Map(counts.map((row) => [row.categoryId, row._count._all]));

    return visible.map((category) => ({
      id: category.id,
      slug: category.slug,
      name: category.name,
      productCount: countMap.get(category.id) ?? 0,
    }));
  },
  ["menu-categories"],
  { revalidate: STOREFRONT_CACHE_SECONDS, tags: ["catalog"] },
);

export async function GET() {
  try {
    const categories = await getMenuCategories();
    return NextResponse.json({ categories });
  } catch (error) {
    console.error("[catalog/categories]", error);
    return NextResponse.json({ categories: [] }, { status: 200 });
  }
}
