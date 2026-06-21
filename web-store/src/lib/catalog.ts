import type { Prisma } from "@prisma/client";
import { unstable_cache } from "next/cache";
import {
  buildCatalogAttributeFilterGroups,
  buildCatalogAttributeFacetProductWhere,
  buildCatalogAttributeFilterWhere,
  buildCatalogAttributeRangeFilterWhere,
  buildCatalogAttributeRangeGroups,
  catalogAttributeFacetKeys,
  catalogAttributeFilterParam,
  type CatalogAttributeFilter,
  type CatalogAttributeFilterGroup,
  type CatalogAttributeRangeFilter,
  type CatalogAttributeRangeGroup,
} from "@/lib/catalog-attribute-filters";
import {
  catalogRangeAttributeKeys,
  getCatalogAttributeDefinition,
  getCatalogAttributeFamilyForCategory,
  getCatalogAttributeKeysForCategory,
  type CatalogAttributeFamily,
} from "@/lib/catalog-attribute-registry";
import { pruneFacetValues, removeSpecDuplicatedAttributeKeys } from "@/lib/catalog-filter-relevance";
import { buildCatalogBrandFilterOptions } from "@/lib/catalog-brand-filters";
import { buildCategoryPath, buildCategoryTree, collectDescendantCategoryIds, type CategoryTreeItem, type FlatCategory } from "@/lib/catalog-tree";
import { interleaveByTopCategory } from "@/lib/catalog-interleave";
import { hasCatalogFacetContext, normalizeCatalogBrandValues, type CatalogSort } from "@/lib/catalog-query";
import {
  attachCatalogSpecFilterCounts,
  buildCatalogSpecFilterWhere,
  getCatalogSpecFilterOptions,
  type CatalogSpecFilterOption,
  type CatalogSpecFilterValue,
} from "@/lib/catalog-spec-filters";
import { prisma } from "@/lib/db";
import { isAccessoryProductName, isAccessorySearchQuery, isDegradedRetailName, normalRetailNameWhere } from "@/lib/retail-products";

const PRODUCTS_PER_PAGE = 24;
// 1 hour. Pair with cron cache warmer (scripts/warm_all.sh) every 30 min so
// every category route is always hot for the first user request.
const STOREFRONT_CACHE_SECONDS = 3600;
const PRODUCT_QUERY_CACHE_SECONDS = 600;
// "Рекомендуемые товары" on the homepage: getHomeSnapshot returns a WIDE,
// category-balanced pool (cached) instead of a frozen list of 8. The page
// (force-dynamic) rotates a random window of 8 out of this pool on every
// request, so positions and groups keep changing instead of showing the same
// products for months. Keep the pool well above the 8 shown so there's room to
// rotate, and cap per top-category so мелкая/крупная бытовая, инструмент,
// электроника и т.п. все попадают в пул.
const RECOMMENDED_POOL_SIZE = 60;
const RECOMMENDED_POOL_PER_CATEGORY = 8;

export type CatalogQuery = {
  categorySlug?: string;
  query?: string;
  brand?: string;
  brands?: string[];
  available?: boolean;
  withPhoto?: boolean;
  minPrice?: number;
  maxPrice?: number;
  page?: number;
  sort?: CatalogSort;
  specFilters?: CatalogSpecFilterValue[];
  attributeFilters?: CatalogAttributeFilter[];
  attributeRangeFilters?: CatalogAttributeRangeFilter[];
};

export function decimalToNumber(value: unknown): number {
  if (value === null || value === undefined) {
    return 0;
  }

  return Number(value);
}

export const getActiveCategories = unstable_cache(async (): Promise<FlatCategory[]> => {
  return prisma.category.findMany({
    where: {
      isActive: true,
      isVisible: true,
    },
    select: {
      id: true,
      parentId: true,
      name: true,
      slug: true,
    },
    orderBy: {
      name: "asc",
    },
  });
}, ["active-catalog-categories"], { revalidate: STOREFRONT_CACHE_SECONDS, tags: ["catalog"] });

const getCategoryProductCounts = unstable_cache(async () => {
  return prisma.product.groupBy({
    by: ["categoryId"],
    where: {
      categoryId: {
        not: null,
      },
      isActive: true,
      isVisible: true,
    },
    _count: {
      _all: true,
    },
  });
}, ["catalog-category-product-counts"], { revalidate: STOREFRONT_CACHE_SECONDS, tags: ["catalog"] });

async function getCatalogCategoryTree(categories: FlatCategory[]): Promise<CategoryTreeItem[]> {
  const counts = await getCategoryProductCounts();

  return buildCategoryTree(
    categories,
    new Map(counts.flatMap((row) => (row.categoryId ? [[row.categoryId, row._count._all]] : []))),
  );
}

export const getCategoryBySlug = unstable_cache(async (slug: string): Promise<FlatCategory | null> => {
  return prisma.category.findFirst({
    where: {
      slug,
      isActive: true,
      isVisible: true,
    },
    select: {
      id: true,
      parentId: true,
      name: true,
      slug: true,
    },
  });
}, ["category-by-slug"], { revalidate: STOREFRONT_CACHE_SECONDS, tags: ["catalog"] });

export async function getCategoryPathById(categoryId: string | null | undefined): Promise<FlatCategory[]> {
  if (!categoryId) return [];

  const categories = await getActiveCategories();
  return buildCategoryPath(categories, categoryId);
}

function getExcludedCategoryIds(categories: FlatCategory[]): string[] {
  return Array.from(
    new Set(
      categories
        .filter((category) => isDegradedRetailName(category.name))
        .flatMap((category) => collectDescendantCategoryIds(categories, category.id)),
    ),
  );
}

export const getHomeSnapshot = unstable_cache(async () => {
  if (!process.env.DATABASE_URL) {
    return { categories: [], products: [] };
  }

  const allCategories = await getActiveCategories();
  const excludedCategoryIds = getExcludedCategoryIds(allCategories);
  // Keep storefront DB reads sequential: production Prisma pool is intentionally small.
  const categories = await getCatalogCategoryTree(allCategories);
  const products = await prisma.product.findMany({
    where: {
      isActive: true,
      isVisible: true,
      isAvailable: true,
      ...(excludedCategoryIds.length
        ? {
            categoryId: {
              notIn: excludedCategoryIds,
            },
          }
        : {}),
      // Mass-market band so the homepage "Популярные товары" doesn't show
      // 9-million-rouble servers or sub-1k stationery commodities.
      retailPrice: { gte: 3000, lte: 300000 },
      // Require real Image row — hasImage flag is unreliable (~3% mass-market
      // products have hasImage=true with zero ProductImage rows; without this
      // filter they bubble to the top via updatedAt and the homepage renders
      // "Фото уточняется" placeholders).
      images: { some: { deleted: false } },
      ...normalRetailNameWhere(),
    },
    include: {
      images: {
        where: {
          deleted: false,
        },
        orderBy: {
          priority: "asc",
        },
        take: 1,
      },
      attributes: {
        where: {
          source: {
            in: ["manual", "name"],
          },
        },
        orderBy: [{ key: "asc" }, { value: "asc" }],
      },
    },
    orderBy: [{ hasImage: "desc" }, { updatedAt: "desc" }],
    // Fetch a wide pool so we can rebalance across top-categories AND have
    // enough spare products for the homepage to rotate a random window out of.
    // Without rebalancing the largest category (Компьютерная техника) would
    // crowd out the page and the storefront would look like a laptop shop.
    take: 200,
  });

  // Return a wide, category-balanced POOL (not the final 8). The page rotates a
  // random window of 8 out of this on every request so the block isn't frozen.
  const pool = interleaveByTopCategory(
    products,
    allCategories,
    RECOMMENDED_POOL_SIZE,
    RECOMMENDED_POOL_PER_CATEGORY,
  );
  return { categories, products: pool };
}, ["home-snapshot"], { revalidate: STOREFRONT_CACHE_SECONDS, tags: ["catalog", "products"] });

const getCatalogBrands = unstable_cache(async (where: Prisma.ProductWhereInput) => {
  // Fetch up to 500 vendors then sort by count desc in JS so the brand
  // filter shows the most-populated brands first instead of alphabetic.
  const rows = await prisma.product.groupBy({
    by: ["vendor"],
    where,
    _count: {
      _all: true,
    },
    orderBy: {
      vendor: "asc",
    },
    take: 500,
  });
  return rows
    .filter((row) => (row._count?._all ?? 0) > 0 && row.vendor && row.vendor.trim())
    .sort((a, b) => (b._count._all ?? 0) - (a._count._all ?? 0))
    .slice(0, 120);
}, ["catalog-brands"], { revalidate: STOREFRONT_CACHE_SECONDS, tags: ["catalog", "products"] });

function catalogProductOrderBy(sort: CatalogSort = "popular"): Prisma.ProductOrderByWithRelationInput[] {
  if (sort === "price_asc") {
    return [
      { isAvailable: "desc" },
      { retailPrice: { sort: "asc", nulls: "last" } },
      { hasImage: "desc" },
      { updatedAt: "desc" },
    ];
  }

  if (sort === "price_desc") {
    return [
      { isAvailable: "desc" },
      { retailPrice: { sort: "desc", nulls: "last" } },
      { hasImage: "desc" },
      { updatedAt: "desc" },
    ];
  }

  if (sort === "new") {
    return [{ updatedAt: "desc" }, { hasImage: "desc" }, { isAvailable: "desc" }, { retailPrice: "desc" }];
  }

  // "popular" default for retail storefront. We don't have sales data, so we
  // proxy "what a typical visitor wants to see":
  //   1. Has a real image (placeholders look broken).
  //   2. Available right now (no point teasing out-of-stock first).
  //   3. Price is in mass-market band — neither niche B2B kit priced in
  //      millions nor sub-100 ₽ stationery commodities. Prisma can't do a
  //      CASE WHEN in orderBy, so we sort by absolute distance from a
  //      target price (75 000 ₽) using raw SQL via Prisma sortOrder.
  //      But orderBy doesn't take expressions — fall back to a simple
  //      compromise: sort by updatedAt so freshly synced goods float up.
  //      Categories with extreme prices have their dedicated category pages.
  return [
    { hasImage: "desc" },
    { isAvailable: "desc" },
    { updatedAt: "desc" },
  ];
}

function toProductWhereArray(value: Prisma.ProductWhereInput["AND"]): Prisma.ProductWhereInput[] {
  if (!value) {
    return [];
  }

  return Array.isArray(value) ? value : [value];
}

const PRODUCT_SEARCH_MAX_TOKENS = 6;
const PRODUCT_SEARCH_MIN_TOKEN_LEN = 2;

/**
 * Split a user search string into searchable tokens. Each token is a word of
 * length ≥ 2 (no single-letter noise). Capped at 6 tokens — beyond that the
 * AND becomes useless and the query gets slow.
 */
export function buildProductSearchTokens(input: string): string[] {
  return input
    .trim()
    .split(/\s+/)
    .map((t) => t.trim())
    .filter((t) => t.length >= PRODUCT_SEARCH_MIN_TOKEN_LEN)
    .slice(0, PRODUCT_SEARCH_MAX_TOKENS);
}

/**
 * Build the OR clause for a single search token: match the token as a
 * substring in any of the searchable text fields, or — if the whole token is
 * numeric — also match by SKU exactly.
 */
export function productSearchTokenOr(token: string): Prisma.ProductWhereInput {
  const numericSku = Number(token);
  return {
    OR: [
      { supplierName: { contains: token, mode: "insensitive" } },
      { name: { contains: token, mode: "insensitive" } },
      { vendor: { contains: token, mode: "insensitive" } },
      { part: { contains: token, mode: "insensitive" } },
      { barcodes: { contains: token, mode: "insensitive" } },
      ...(Number.isFinite(numericSku) && Number.isInteger(numericSku)
        ? [{ sku: numericSku }]
        : []),
    ],
  };
}

function applySelectedBrands(where: Prisma.ProductWhereInput, selectedBrands: string[]) {
  if (selectedBrands.length === 1) {
    where.vendor = selectedBrands[0];
  } else if (selectedBrands.length > 1) {
    where.vendor = {
      in: selectedBrands,
    };
  }
}

function appendProductWhereAnd(where: Prisma.ProductWhereInput, conditions: Prisma.ProductWhereInput[]) {
  if (conditions.length) {
    where.AND = [...toProductWhereArray(where.AND), ...conditions];
  }
}

async function getCatalogSpecFilterCounts(options: CatalogSpecFilterOption[], baseWhere: Prisma.ProductWhereInput) {
  const counts = new Map<CatalogSpecFilterValue, number>();

  for (const option of options) {
    const where: Prisma.ProductWhereInput = { ...baseWhere };
    const specWhere = buildCatalogSpecFilterWhere([option.key]);
    const specAnd = toProductWhereArray(specWhere.AND);
    if (specAnd.length) {
      where.AND = [...toProductWhereArray(where.AND), ...specAnd];
    }

    counts.set(option.key, await prisma.product.count({ where }));
  }

  return counts;
}

type CatalogAttributeGroupByRow = {
  key: string;
  label: string;
  value: string;
  normalizedValue: string;
  numericValue: number | null;
  unit: string | null;
  _count: {
    _all: number;
  };
};

async function getCatalogAttributeFilterGroups(
  baseWhere: Prisma.ProductWhereInput,
  activeFilters: CatalogAttributeFilter[] = [],
  allowedKeys: string[] = catalogAttributeFacetKeys,
  family: CatalogAttributeFamily | null = null,
): Promise<CatalogAttributeFilterGroup[]> {
  const rows: CatalogAttributeGroupByRow[] = [];
  const allowedFacetKeys = catalogAttributeFacetKeys.filter((key) => allowedKeys.includes(key));

  if (!activeFilters.length) {
    rows.push(
      ...(await prisma.productAttribute.groupBy({
        by: ["key", "label", "value", "normalizedValue", "numericValue", "unit"],
        where: {
          key: {
            in: allowedFacetKeys,
          },
          product: {
            is: baseWhere,
          },
        },
        _count: {
          _all: true,
        },
      })),
    );
  } else {
    for (const facetKey of allowedFacetKeys) {
      rows.push(
        ...(await prisma.productAttribute.groupBy({
          by: ["key", "label", "value", "normalizedValue", "numericValue", "unit"],
          where: {
            key: facetKey,
            product: {
              is: buildCatalogAttributeFacetProductWhere(baseWhere, activeFilters, facetKey),
            },
          },
          _count: {
            _all: true,
          },
        })),
      );
    }
  }

  return buildCatalogAttributeFilterGroups(
    rows.map((row) => ({
      key: row.key,
      label: row.label,
      value: row.value,
      normalizedValue: row.normalizedValue,
      numericValue: row.numericValue,
      unit: row.unit,
      count: row._count._all,
    })),
    activeFilters,
    allowedKeys,
    family,
  );
}

async function getCatalogAttributeRangeGroups(baseWhere: Prisma.ProductWhereInput, allowedKeys: string[] = catalogAttributeFacetKeys, family: CatalogAttributeFamily | null = null): Promise<CatalogAttributeRangeGroup[]> {
  const rows: CatalogAttributeRangeGroup[] = [];

  for (const key of catalogRangeAttributeKeys.filter((item) => allowedKeys.includes(item))) {
    const definition = getCatalogAttributeDefinition(key);
    if (!definition) continue;

    const aggregate = await prisma.productAttribute.aggregate({
      where: {
        key,
        numericValue: {
          not: null,
        },
        product: {
          is: baseWhere,
        },
      },
      _min: {
        numericValue: true,
      },
      _max: {
        numericValue: true,
      },
      _count: {
        _all: true,
      },
    });

    if (aggregate._min.numericValue !== null && aggregate._max.numericValue !== null) {
      rows.push({
        key,
        label: definition.label,
        min: aggregate._min.numericValue,
        max: aggregate._max.numericValue,
        unit: definition.unit ?? null,
        count: aggregate._count._all,
      });
    }
  }

  return buildCatalogAttributeRangeGroups(rows, allowedKeys, family);
}

const getCachedCatalogProducts = unstable_cache(
  async (where: Prisma.ProductWhereInput, sort: CatalogSort | undefined, fetchSkip: number, fetchTake: number) => {
    const [rawProducts, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          category: true,
          images: {
            where: { deleted: false },
            orderBy: { priority: "asc" },
            take: 1,
          },
          attributes: {
            where: { source: { in: ["manual", "name"] } },
            orderBy: [{ key: "asc" }, { value: "asc" }],
          },
        },
        orderBy: catalogProductOrderBy(sort),
        skip: fetchSkip,
        take: fetchTake,
      }),
      prisma.product.count({ where }),
    ]);
    return { rawProducts, total };
  },
  ["catalog-page-products"],
  { revalidate: PRODUCT_QUERY_CACHE_SECONDS, tags: ["catalog", "products"] },
);

const getCachedSpecFilterCounts = unstable_cache(
  async (options: CatalogSpecFilterOption[], baseWhere: Prisma.ProductWhereInput): Promise<Record<string, number>> => {
    const counts = await getCatalogSpecFilterCounts(options, baseWhere);
    return Object.fromEntries(counts);
  },
  ["catalog-spec-filter-counts"],
  { revalidate: PRODUCT_QUERY_CACHE_SECONDS, tags: ["catalog", "products"] },
);

const getCachedAttributeFilterGroups = unstable_cache(
  getCatalogAttributeFilterGroups,
  ["catalog-attribute-filter-groups"],
  { revalidate: PRODUCT_QUERY_CACHE_SECONDS, tags: ["catalog", "products"] },
);

const getCachedAttributeRangeGroups = unstable_cache(
  getCatalogAttributeRangeGroups,
  ["catalog-attribute-range-groups"],
  { revalidate: PRODUCT_QUERY_CACHE_SECONDS, tags: ["catalog", "products"] },
);

export async function getCatalogPage(query: CatalogQuery) {
  const page = Math.max(query.page ?? 1, 1);
  const selectedBrands = normalizeCatalogBrandValues([...(query.brands ?? []), query.brand]);
  const allCategories = await getActiveCategories();
  const excludedCategoryIds = getExcludedCategoryIds(allCategories);
  const excludedCategoryIdSet = new Set(excludedCategoryIds);
  const baseWhere: Prisma.ProductWhereInput = {
    isActive: true,
    isVisible: true,
  };

  let category: FlatCategory | null = null;
  let categoryPath: FlatCategory[] = [];
  if (query.categorySlug) {
    category = allCategories.find((item) => item.slug === query.categorySlug) ?? null;

    if (category) {
      categoryPath = buildCategoryPath(allCategories, category.id);
      const categoryIds = collectDescendantCategoryIds(allCategories, category.id).filter((id) => !excludedCategoryIdSet.has(id));
      baseWhere.categoryId = {
        in: categoryIds.length ? categoryIds : ["__empty_category__"],
      };
    }
  } else if (excludedCategoryIds.length) {
    baseWhere.categoryId = {
      notIn: excludedCategoryIds,
    };
  }

  const attributeFamily = getCatalogAttributeFamilyForCategory({
    categoryName: category?.name,
    categorySlug: category?.slug,
  });
  // Drop attr-keys that duplicate a boolean "quick pick" spec preset (No Frost,
  // Smart TV, инвертор) — that criterion lives in the Быстрые подборки, not as a
  // second structural facet (B1, dedup).
  const allowedAttributeKeys = removeSpecDuplicatedAttributeKeys(
    getCatalogAttributeKeysForCategory({
      categoryName: category?.name,
      categorySlug: category?.slug,
    }),
  );
  const shouldBuildFacetPanels = hasCatalogFacetContext(query);
  // Текстовый поиск (/search?q=) даёт разнородную выдачу (телевизоры + запчасти +
  // аксессуары) → параметрические фасеты и spec-подборки по ней бессмысленны, а
  // считаются дорого: Seq Scan по 54k для частых слов × N запросов (фасеты + 6
  // spec-counts) = 60-90с cold-start. Для текстового поиска фасеты по атрибутам и
  // spec-подборки НЕ строим — остаются бренд/цена/наличие. Категории (без q)
  // строят фасеты как раньше.
  const isTextSearch = Boolean(query.query && query.query.trim());
  const visibleAttributeKeys = shouldBuildFacetPanels && !isTextSearch ? allowedAttributeKeys : [];
  const allowedAttributeKeySet = new Set(allowedAttributeKeys);
  const activeAttributeFilters = (query.attributeFilters ?? []).filter((filter) => allowedAttributeKeySet.has(filter.key));
  const activeAttributeRangeFilters = (query.attributeRangeFilters ?? []).filter((filter) => allowedAttributeKeySet.has(filter.key));

  const filteredWhere: Prisma.ProductWhereInput = { ...baseWhere };
  if (query.query) {
    const tokens = buildProductSearchTokens(query.query);
    if (tokens.length > 0) {
      // AND of (OR across fields) for each token — finds products that
      // contain every word, in any order, across name/supplierName/vendor/etc.
      // Example: "indesit стиральная" matches "Стиральная машина Indesit IWSB...".
      // ВАЖНО: degraded-исключение (уценка/б/у/поврежденный) НЕ здесь, а в
      // in-memory пост-фильтре ниже. normalRetailNameWhere = 9 терминов × NOT LIKE
      // по supplierName+name = 18 негаций, которые рушат trigram и превращают
      // каждый search-запрос (findMany/count/brand) из ~1с в ~5с (Seq Scan) →
      // ~13с cold для частых слов. Негация по тексту в search WHERE — та же
      // ловушка, что и аксессуарный NOT LIKE.
      filteredWhere.AND = [
        ...toProductWhereArray(filteredWhere.AND),
        ...tokens.map((token) => productSearchTokenOr(token)),
      ];
    }
  }

  if (query.available) {
    filteredWhere.isAvailable = true;
  }

  if (query.withPhoto) {
    filteredWhere.hasImage = true;
  }

  if (query.minPrice || query.maxPrice) {
    const priceFilter: Prisma.DecimalFilter = {};
    if (query.minPrice) priceFilter.gte = query.minPrice;
    if (query.maxPrice) priceFilter.lte = query.maxPrice;
    filteredWhere.retailPrice = priceFilter;
  }

  // True only on the bare /catalog root: no category, no search, no brand, no
  // attribute filters, default popular sort. Used for both the mass-market
  // price band below and the top-category interleave during fetch.
  const isDefaultPopularRoot =
    !query.categorySlug &&
    !query.query &&
    !selectedBrands.length &&
    !activeAttributeFilters.length &&
    !activeAttributeRangeFilters.length &&
    (query.sort ?? "popular") === "popular" &&
    !query.minPrice &&
    !query.maxPrice;

  if (isDefaultPopularRoot && !filteredWhere.retailPrice) {
    // Default mass-market price band on /catalog root with no filters.
    // Hides niche B2B gear (servers, storage, virtualization) priced in
    // millions and sub-1 000 ₽ commodity stationery from the first page.
    // Кофемашины, ТВ, стиралки, холодильники, кондиционеры — все в этом
    // диапазоне. Любой явный фильтр пользователя снимает это окно.
    filteredWhere.retailPrice = { gte: 3000, lte: 300000 };
    // Also require a REAL image record (not just hasImage flag — sync sets
    // hasImage=true on ~3% of products that have no actual Image rows; without
    // this filter they bubble to the top via updatedAt and the page renders
    // 24 "Фото уточняется" placeholders. Real images: ~53.6k in this band,
    // plenty for browsing.
    filteredWhere.images = { some: { deleted: false } };
  }

  const specFilterOptions =
    shouldBuildFacetPanels && !isTextSearch
      ? getCatalogSpecFilterOptions({
          categoryName: category?.name,
          activeFilters: query.specFilters,
        })
      : [];

  const specWhere = buildCatalogSpecFilterWhere(query.specFilters ?? []);
  const specAnd = toProductWhereArray(specWhere.AND);
  const attributeWhere = buildCatalogAttributeFilterWhere(activeAttributeFilters);
  const attributeAnd = toProductWhereArray(attributeWhere.AND);
  const attributeRangeWhere = buildCatalogAttributeRangeFilterWhere(activeAttributeRangeFilters);
  const attributeRangeAnd = toProductWhereArray(attributeRangeWhere.AND);

  const specCountBaseWhere: Prisma.ProductWhereInput = { ...filteredWhere };
  appendProductWhereAnd(specCountBaseWhere, attributeAnd);
  appendProductWhereAnd(specCountBaseWhere, attributeRangeAnd);
  applySelectedBrands(specCountBaseWhere, selectedBrands);

  appendProductWhereAnd(filteredWhere, specAnd);

  const attributeFacetBaseWhere: Prisma.ProductWhereInput = { ...filteredWhere };
  appendProductWhereAnd(attributeFacetBaseWhere, attributeRangeAnd);
  applySelectedBrands(attributeFacetBaseWhere, selectedBrands);

  const attributeRangeFacetBaseWhere: Prisma.ProductWhereInput = { ...filteredWhere };
  appendProductWhereAnd(attributeRangeFacetBaseWhere, attributeAnd);
  applySelectedBrands(attributeRangeFacetBaseWhere, selectedBrands);

  appendProductWhereAnd(filteredWhere, attributeAnd);
  appendProductWhereAnd(filteredWhere, attributeRangeAnd);

  const brandWhere: Prisma.ProductWhereInput = {
    ...filteredWhere,
    vendor: {
      not: null,
    },
  };

  applySelectedBrands(filteredWhere, selectedBrands);

  // Bare /catalog root: round-robin the first POPULAR_POOL_PAGES pages across
  // top-level categories so the storefront isn't dominated by one category
  // (Компьютерная техника has 16k mass-market vs everyone else < 10k).
  //
  // We fetch ONE shared pool (same cache key for every page in the window),
  // round-robin REORDER all of it into a stable order, then slice the page
  // window from that order. This avoids the old bug where only page 1 was
  // interleaved while page 2+ offset-paged the raw order — products that the
  // page-1 interleave pulled forward reappeared on later pages, and products it
  // skipped were never shown. Page POPULAR_POOL_PAGES+1 continues from raw
  // offset == pool size, so the boundary neither duplicates nor skips.
  const POPULAR_POOL_PAGES = 5;
  const usePool = isDefaultPopularRoot && page <= POPULAR_POOL_PAGES;
  const fetchTake = usePool ? PRODUCTS_PER_PAGE * POPULAR_POOL_PAGES : PRODUCTS_PER_PAGE;
  const fetchSkip = usePool ? 0 : (page - 1) * PRODUCTS_PER_PAGE;

  const { rawProducts, total } = await getCachedCatalogProducts(filteredWhere, query.sort, fetchSkip, fetchTake);
  const productsBase = usePool
    ? interleaveByTopCategory(
        rawProducts,
        allCategories,
        rawProducts.length,
        Number.POSITIVE_INFINITY,
      ).slice((page - 1) * PRODUCTS_PER_PAGE, page * PRODUCTS_PER_PAGE)
    : rawProducts;
  // Поиск: in-memory пост-фильтр (НЕ в SQL WHERE — там NOT LIKE рушат trigram и
  // дают ~13с cold). Убираем degraded (уценка/б/у/поврежденный) всегда; аксессуары
  // «X для <тип>» — только когда ищут основной тип, а не сам аксессуар.
  const filterAccessories = Boolean(query.query) && !isAccessorySearchQuery(query.query);
  const products = query.query
    ? productsBase.filter(
        (product) =>
          !isDegradedRetailName(product.supplierName) &&
          !isDegradedRetailName(product.name) &&
          !(filterAccessories && isAccessoryProductName(product.name, product.supplierName)),
      )
    : productsBase;
  const categories = await getCatalogCategoryTree(allCategories);
  const brands = await getCatalogBrands(brandWhere);
  const specFilterCountsRecord = specFilterOptions.length
    ? await getCachedSpecFilterCounts(specFilterOptions, specCountBaseWhere)
    : {};
  const specFilterCounts = new Map(Object.entries(specFilterCountsRecord)) as Map<CatalogSpecFilterValue, number>;
  // Drop facet values below the count threshold and obvious junk (B3), keeping
  // any value the user already selected. Then drop groups left empty.
  const activeAttributeFilterValues = activeAttributeFilters.map(catalogAttributeFilterParam);
  const attributeFilterGroups = (
    visibleAttributeKeys.length
      ? await getCachedAttributeFilterGroups(attributeFacetBaseWhere, activeAttributeFilters, visibleAttributeKeys, attributeFamily)
      : []
  )
    .map((group) => ({
      ...group,
      options: pruneFacetValues(group.options, { minCount: 3, activeValues: activeAttributeFilterValues }),
    }))
    .filter((group) => group.options.length > 0);
  const attributeRangeGroups = visibleAttributeKeys.length
    ? await getCachedAttributeRangeGroups(attributeRangeFacetBaseWhere, visibleAttributeKeys, attributeFamily)
    : [];

  return {
    category,
    categoryPath,
    products,
    total,
    page,
    perPage: PRODUCTS_PER_PAGE,
    categories,
    brands: buildCatalogBrandFilterOptions(
      brands.map((row) => ({ vendor: row.vendor, count: row._count._all })),
      selectedBrands,
    ),
    specFilterOptions: attachCatalogSpecFilterCounts(specFilterOptions, specFilterCounts, query.specFilters),
    attributeFilterGroups,
    attributeRangeGroups,
    attributeFilters: activeAttributeFilters,
    attributeRangeFilters: activeAttributeRangeFilters,
  };
}

export async function getRelatedProducts({
  productId,
  categoryId,
  take = 4,
}: {
  productId: string;
  categoryId?: string | null;
  take?: number;
}) {
  if (!categoryId) return [];

  return prisma.product.findMany({
    where: {
      id: {
        not: productId,
      },
      categoryId,
      isActive: true,
      isVisible: true,
      isAvailable: true,
      retailPrice: {
        not: null,
      },
      // Recommended/related products must have a REAL image — a card without a
      // photo is useless here (owner: "выбрал iPhone и 4 рекомендованных тоже
      // без фото"). hasImage flag lies on ~3%, so require an actual Image row.
      images: {
        some: {
          deleted: false,
        },
      },
      ...normalRetailNameWhere(),
    },
    include: {
      images: {
        where: {
          deleted: false,
        },
        orderBy: {
          priority: "asc",
        },
        take: 1,
      },
      attributes: {
        where: {
          source: {
            in: ["manual", "name"],
          },
        },
        orderBy: [{ key: "asc" }, { value: "asc" }],
      },
    },
    orderBy: [{ hasImage: "desc" }, { updatedAt: "desc" }],
    take,
  });
}

export async function getProductBySlug(slug: string) {
  return prisma.product.findFirst({
    where: {
      slug,
      isActive: true,
      isVisible: true,
    },
    include: {
      category: true,
      images: {
        where: {
          deleted: false,
        },
        orderBy: {
          priority: "asc",
        },
      },
      attributes: {
        where: {
          source: {
            in: ["manual", "name"],
          },
        },
        orderBy: [{ key: "asc" }, { value: "asc" }],
      },
    },
  });
}

export async function getProductsForQuote(skus: number[]) {
  const products = await prisma.product.findMany({
    where: {
      sku: {
        in: skus,
      },
      isActive: true,
      isVisible: true,
    },
    select: {
      id: true,
      sku: true,
      slug: true,
      supplierName: true,
      name: true,
      retailPrice: true,
      supplierPrice: true,
      multiplicity: true,
      isAvailable: true,
    },
  });

  return products.map((product) => ({
    productId: product.id,
    sku: product.sku,
    slug: product.slug,
    name: product.name ?? product.supplierName,
    price: decimalToNumber(product.retailPrice),
    supplierPrice: product.supplierPrice ? decimalToNumber(product.supplierPrice) : null,
    multiplicity: product.multiplicity,
    // Boolean(Decimal(0)) is true, so a 0 ₽ product would be orderable via the
    // API while the UI shows "Цена уточняется". Gate on the numeric price > 0.
    isAvailable: product.isAvailable && decimalToNumber(product.retailPrice) > 0,
  }));
}
