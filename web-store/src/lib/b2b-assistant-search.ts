import type { Prisma } from "@prisma/client";
import { buildProductSearchTokens, productSearchTokenOr } from "@/lib/catalog";
import { prisma } from "@/lib/db";
import { normalizeSearchQuery } from "@/lib/search-vocabulary";

export const b2bAssistantProductSelect = {
  id: true,
  sku: true,
  supplierName: true,
  name: true,
  slug: true,
  vendor: true,
  part: true,
  barcodes: true,
  supplierPrice: true,
  stockStatus: true,
  nearestStockStatus: true,
  isAvailable: true,
  deliveryDays: true,
  multiplicity: true,
  warranty: true,
  description: true,
  updatedAt: true,
  category: { select: { name: true } },
  images: {
    where: { deleted: false },
    orderBy: [{ isPrimary: "desc" }, { priority: "asc" }],
    take: 1,
    select: { id: true },
  },
} satisfies Prisma.ProductSelect;

export type B2bAssistantProduct = Prisma.ProductGetPayload<{
  select: typeof b2bAssistantProductSelect;
}>;

export type B2bAssistantSearchPage = {
  query: string;
  products: B2bAssistantProduct[];
  total: number;
  offset: number;
  hasMore: boolean;
};

const MAX_RANKED_SEARCH_CANDIDATES = 500;

export function normalizeB2bSearchQuery(rawQuery: string): string | null {
  const normalized = normalizeSearchQuery(rawQuery).replace(/\s+/g, " ").trim();
  if (/^\d+$/.test(normalized)) return normalized;
  return normalized.length >= 2 ? normalized : null;
}

function normalizedValue(value: string | null | undefined): string {
  return normalizeSearchQuery(value ?? "");
}

function assistantSearchTokenOr(token: string): Prisma.ProductWhereInput {
  const productWhere = productSearchTokenOr(token);
  const productConditions = Array.isArray(productWhere.OR)
    ? productWhere.OR
    : productWhere.OR
      ? [productWhere.OR]
      : [];
  return {
    OR: [
      ...productConditions,
      { category: { is: { name: { contains: token, mode: "insensitive" } } } },
    ],
  };
}

export function rankB2bSearchProduct(product: B2bAssistantProduct, query: string): number {
  const normalizedQuery = normalizedValue(query);
  const tokens = buildProductSearchTokens(normalizedQuery);
  const name = normalizedValue(product.name || product.supplierName);
  const supplierName = normalizedValue(product.supplierName);
  const vendor = normalizedValue(product.vendor);
  const part = normalizedValue(product.part);
  const barcodes = normalizedValue(product.barcodes);
  const category = normalizedValue(product.category?.name);
  const sku = String(product.sku);
  const searchableText = [name, supplierName, category].join(" ");
  const isBareStabilizerQuery = /^(?:стабилизатор|стабилизаторы)$/.test(normalizedQuery);
  let score = 0;

  if (sku === normalizedQuery) score += 100_000;
  if (part === normalizedQuery) score += 90_000;
  if (barcodes.split(/[,;\s]+/).includes(normalizedQuery)) score += 80_000;
  if (name === normalizedQuery || supplierName === normalizedQuery) score += 50_000;
  if (name.startsWith(normalizedQuery) || supplierName.startsWith(normalizedQuery)) score += 10_000;
  if (part.includes(normalizedQuery)) score += 8_000;
  if (name.includes(normalizedQuery) || supplierName.includes(normalizedQuery)) score += 5_000;
  if (vendor === normalizedQuery) score += 4_000;
  if (category === normalizedQuery) score += 3_000;

  for (const token of tokens) {
    if (part === token) score += 2_000;
    if (name.includes(token) || supplierName.includes(token)) score += 500;
    if (vendor.includes(token) || part.includes(token) || barcodes.includes(token)) score += 250;
    if (category.includes(token)) score += 200;
  }

  // A bare Russian query for a "стабилизатор" is ambiguous: the catalog also
  // contains phone/camera gimbals. For a B2B electrical catalog, voltage
  // stabilizers are the useful default, while the other products remain
  // searchable by their model, brand and more specific wording.
  if (isBareStabilizerQuery) {
    if (searchableText.includes("стабилизатор напряжения") || searchableText.includes("напряжен")) {
      score += 20_000;
    }
    if (/(?:смартфон|телефон|селфи|монопод|gimbal|экшн.?камер|видеосъем)/.test(searchableText)) {
      score -= 20_000;
    }
  }

  if (product.isAvailable) score += 1_000;
  if (product.supplierPrice) score += 100;
  if (product.images.length > 0) score += 25;
  return score;
}

export async function findB2bProductBySku(sku: number): Promise<B2bAssistantProduct | null> {
  if (!Number.isSafeInteger(sku) || sku <= 0) return null;
  return prisma.product.findUnique({ where: { sku }, select: b2bAssistantProductSelect });
}

export async function searchB2bProductPage(
  rawQuery: string,
  { limit = 20, offset = 0 }: { limit?: number; offset?: number } = {},
): Promise<B2bAssistantSearchPage> {
  const query = normalizeB2bSearchQuery(rawQuery);
  const pageSize = Math.max(1, Math.min(Math.trunc(limit), 20));
  const safeOffset = Math.max(0, Math.min(Math.trunc(offset), 100_000));
  if (!query) return { query: "", products: [], total: 0, offset: safeOffset, hasMore: false };
  const tokens = buildProductSearchTokens(query);
  if (tokens.length === 0) return { query, products: [], total: 0, offset: safeOffset, hasMore: false };

  const numericSku = /^\d+$/.test(query) ? Number(query) : null;
  const generalWhere: Prisma.ProductWhereInput = {
    isActive: true,
    AND: tokens.map((token) => assistantSearchTokenOr(token)),
  };
  const exactMatchWhere: Prisma.ProductWhereInput = {
    OR: [
      ...(numericSku && Number.isSafeInteger(numericSku) ? [{ sku: numericSku }] : []),
      { part: { equals: query, mode: "insensitive" } },
      ...(numericSku && Number.isSafeInteger(numericSku)
        ? [{ barcodes: { contains: query, mode: "insensitive" as const } }]
        : []),
    ],
  };

  const [total, exact] = await Promise.all([
    prisma.product.count({ where: generalWhere }),
    prisma.product.findMany({
      where: { AND: [generalWhere, exactMatchWhere] },
      select: b2bAssistantProductSelect,
      take: 25,
    }),
  ]);

  const rankedExact = exact.sort(
    (left, right) => rankB2bSearchProduct(right, query) - rankB2bSearchProduct(left, query),
  );
  const products: B2bAssistantProduct[] = [];
  if (safeOffset < rankedExact.length) {
    products.push(...rankedExact.slice(safeOffset, safeOffset + pageSize));
  }

  let remaining = pageSize - products.length;
  const generalSkip = Math.max(0, safeOffset - rankedExact.length);
  const generalWhereWithoutExact: Prisma.ProductWhereInput = {
    AND: [
      generalWhere,
      ...(rankedExact.length > 0 ? [{ id: { notIn: rankedExact.map((product) => product.id) } }] : []),
    ],
  };

  if (remaining > 0 && generalSkip < MAX_RANKED_SEARCH_CANDIDATES) {
    const candidates = await prisma.product.findMany({
      where: {
        ...generalWhereWithoutExact,
      },
      select: b2bAssistantProductSelect,
      orderBy: [
        { isAvailable: "desc" },
        { hasImage: "desc" },
        { updatedAt: "desc" },
        { sku: "asc" },
      ],
      take: MAX_RANKED_SEARCH_CANDIDATES,
    });
    candidates.sort((left, right) => {
      const scoreDifference = rankB2bSearchProduct(right, query) - rankB2bSearchProduct(left, query);
      return scoreDifference || left.sku - right.sku;
    });
    const rankedSlice = candidates.slice(generalSkip, generalSkip + remaining);
    products.push(...rankedSlice);
    remaining -= rankedSlice.length;
  }

  if (remaining > 0) {
    const fallbackSkip = Math.max(generalSkip, MAX_RANKED_SEARCH_CANDIDATES);
    const fallbackProducts = await prisma.product.findMany({
      where: generalWhereWithoutExact,
      select: b2bAssistantProductSelect,
      orderBy: [
        { isAvailable: "desc" },
        { hasImage: "desc" },
        { updatedAt: "desc" },
        { sku: "asc" },
      ],
      skip: fallbackSkip,
      take: remaining,
    });
    products.push(...fallbackProducts);
  }

  return {
    query,
    products,
    total,
    offset: safeOffset,
    hasMore: safeOffset + products.length < total,
  };
}

export async function searchB2bProducts(rawQuery: string, limit = 20): Promise<B2bAssistantProduct[]> {
  return (await searchB2bProductPage(rawQuery, { limit })).products;
}
