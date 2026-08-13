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

  if (product.isAvailable) score += 1_000;
  if (product.supplierPrice) score += 100;
  if (product.images.length > 0) score += 25;
  return score;
}

export async function findB2bProductBySku(sku: number): Promise<B2bAssistantProduct | null> {
  if (!Number.isSafeInteger(sku) || sku <= 0) return null;
  return prisma.product.findUnique({ where: { sku }, select: b2bAssistantProductSelect });
}

export async function searchB2bProducts(rawQuery: string, limit = 5): Promise<B2bAssistantProduct[]> {
  const query = normalizeB2bSearchQuery(rawQuery);
  if (!query) return [];
  const tokens = buildProductSearchTokens(query);
  if (tokens.length === 0) return [];

  const numericSku = /^\d+$/.test(query) ? Number(query) : null;
  const exactWhere: Prisma.ProductWhereInput = {
    isActive: true,
    OR: [
      ...(numericSku && Number.isSafeInteger(numericSku) ? [{ sku: numericSku }] : []),
      { part: { equals: query, mode: "insensitive" } },
      { barcodes: { contains: query, mode: "insensitive" } },
    ],
  };
  const generalWhere: Prisma.ProductWhereInput = {
    isActive: true,
    AND: tokens.map((token) => assistantSearchTokenOr(token)),
  };

  const [exact, candidates] = await Promise.all([
    prisma.product.findMany({
      where: exactWhere,
      select: b2bAssistantProductSelect,
      take: Math.max(10, limit),
    }),
    prisma.product.findMany({
      where: generalWhere,
      select: b2bAssistantProductSelect,
      orderBy: [{ isAvailable: "desc" }, { hasImage: "desc" }, { updatedAt: "desc" }],
      take: Math.max(40, limit * 8),
    }),
  ]);

  const unique = new Map<string, B2bAssistantProduct>();
  for (const product of [...exact, ...candidates]) unique.set(product.id, product);

  return [...unique.values()]
    .sort((left, right) => rankB2bSearchProduct(right, query) - rankB2bSearchProduct(left, query))
    .slice(0, Math.max(1, Math.min(limit, 10)));
}
