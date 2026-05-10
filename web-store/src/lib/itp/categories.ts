import { prisma } from "@/lib/db";
import { downloadItpStaticJson } from "@/lib/itp/staticFiles";
import type { ItpCategory } from "@/lib/itp/types";
import { categorySlug } from "@/lib/slug";
import { finishSyncLog, sanitizePayload, startSyncLog } from "@/lib/sync-log";

type FlatCategory = ItpCategory & {
  parentExternalId: number | null;
};

function flattenCategories(categories: ItpCategory[], parentExternalId: number | null = null): FlatCategory[] {
  return categories.flatMap((category) => [
    {
      ...category,
      parentExternalId,
    },
    ...flattenCategories(category.childrens ?? [], category.id),
  ]);
}

export async function syncItpCategories() {
  const log = await startSyncLog("categories");

  try {
    const tree = await downloadItpStaticJson<ItpCategory[]>("/download/catalog/json/catalog_tree_9.json");
    const categories = flattenCategories(tree);
    const localIds = new Map<number, string>();

    await prisma.category.updateMany({
      data: {
        isActive: false,
      },
    });

    for (const category of categories) {
      const parentId = category.parentExternalId ? localIds.get(category.parentExternalId) : null;
      const row = await prisma.category.upsert({
        where: {
          externalId: category.id,
        },
        create: {
          externalId: category.id,
          parentId,
          name: category.name,
          slug: categorySlug(category.name, category.id),
          isLeaf: category.leaf,
          isActive: true,
        },
        update: {
          parentId,
          name: category.name,
          isLeaf: category.leaf,
          isActive: true,
        },
      });

      localIds.set(category.id, row.id);
    }

    await finishSyncLog(log.id, {
      status: "success",
      total: categories.length,
      processed: categories.length,
      message: "Categories synchronized from ITP static file.",
    });

    return {
      total: categories.length,
      processed: categories.length,
    };
  } catch (error) {
    await finishSyncLog(log.id, {
      status: "error",
      message: error instanceof Error ? error.message : "Unknown categories sync error",
      failed: 1,
      payload: sanitizePayload(error),
    });
    throw error;
  }
}
