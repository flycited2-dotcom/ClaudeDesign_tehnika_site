import type { MetadataRoute } from "next";
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/db";
import { listCatalogFilterLandings } from "@/lib/catalog-filter-landings";
import { normalRetailNameWhere } from "@/lib/retail-products";
import { storefront } from "@/lib/storefront";

export const dynamic = "force-dynamic";

const getSitemapCatalogEntries = unstable_cache(async () => {
  const [categories, products] = await Promise.all([
    prisma.category.findMany({
      where: {
        isActive: true,
        isVisible: true,
      },
      select: {
        slug: true,
        updatedAt: true,
      },
      orderBy: {
        updatedAt: "desc",
      },
      take: 300,
    }),
    prisma.product.findMany({
      where: {
        isActive: true,
        isVisible: true,
        isAvailable: true,
        retailPrice: {
          not: null,
        },
        ...normalRetailNameWhere(),
      },
      select: {
        slug: true,
        updatedAt: true,
      },
      orderBy: [{ hasImage: "desc" }, { updatedAt: "desc" }],
      take: 700,
    }),
  ]);

  return { categories, products };
}, ["sitemap-catalog-entries"], { revalidate: 3600, tags: ["catalog", "products"] });

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: storefront.siteUrl,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${storefront.siteUrl}/catalog`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.95,
    },
    {
      url: `${storefront.siteUrl}/cart`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.4,
    },
    {
      url: `${storefront.siteUrl}/privacy`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${storefront.siteUrl}/personal-data-consent`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${storefront.siteUrl}/purchase-terms`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    ...listCatalogFilterLandings().map((landing) => ({
      url: `${storefront.siteUrl}/podborki/${landing.slug}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
  ];

  if (!process.env.DATABASE_URL) {
    return staticRoutes;
  }

  try {
    const { categories, products } = await getSitemapCatalogEntries();

    return [
      ...staticRoutes,
      ...categories.map((category) => ({
        url: `${storefront.siteUrl}/catalog/${category.slug}`,
        lastModified: category.updatedAt,
        changeFrequency: "weekly" as const,
        priority: 0.75,
      })),
      ...products.map((product) => ({
        url: `${storefront.siteUrl}/product/${product.slug}`,
        lastModified: product.updatedAt,
        changeFrequency: "weekly" as const,
        priority: 0.65,
      })),
    ];
  } catch {
    return staticRoutes;
  }
}
