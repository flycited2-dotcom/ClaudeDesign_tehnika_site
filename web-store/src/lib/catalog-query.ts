import {
  normalizeCatalogAttributeFilters,
  normalizeCatalogAttributeRangeFilters,
  type CatalogAttributeFilter,
  type CatalogAttributeRangeFilter,
} from "@/lib/catalog-attribute-filters";
import { normalizeCatalogSpecFilterValues, type CatalogSpecFilterValue } from "@/lib/catalog-spec-filters";

export type CatalogSearchParams = Record<string, string | string[] | undefined>;

export const catalogSortValues = ["popular", "price_asc", "price_desc", "new"] as const;

export type CatalogSort = (typeof catalogSortValues)[number];

export type ParsedCatalogSearchParams = {
  query?: string;
  brand?: string;
  brands: string[];
  onlyAvailable: boolean;
  withPhoto: boolean;
  onlyInStock: boolean;
  minPrice?: number;
  maxPrice?: number;
  page: number;
  sort: CatalogSort;
  specFilters: CatalogSpecFilterValue[];
  attributeFilters: CatalogAttributeFilter[];
  attributeRangeFilters: CatalogAttributeRangeFilter[];
};

export type CatalogFacetContext = {
  categorySlug?: string;
  query?: string;
  specFilters?: unknown[];
  attributeFilters?: unknown[];
  attributeRangeFilters?: unknown[];
};

export function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function allParams(value: string | string[] | undefined): string[] {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function keyedRangeParams(params: CatalogSearchParams, prefix: "attrMin" | "attrMax"): string[] {
  const keyPrefix = `${prefix}.`;

  return Object.entries(params).flatMap(([name, value]) => {
    if (!name.startsWith(keyPrefix)) return [];

    const attributeKey = name.slice(keyPrefix.length).trim();
    if (!attributeKey) return [];

    return allParams(value)
      .map((item) => item.trim())
      .filter(Boolean)
      .map((item) => `${attributeKey}:${item}`);
  });
}

export function parsePositiveNumberParam(value: string | string[] | undefined): number | undefined {
  const raw = firstParam(value)?.trim().replace(",", ".");
  if (!raw) return undefined;

  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

function trimmedParam(value: string | string[] | undefined): string | undefined {
  const trimmed = firstParam(value)?.trim();
  return trimmed || undefined;
}

export function normalizeCatalogBrandValues(values: Array<string | null | undefined>): string[] {
  const brands: string[] = [];

  values.forEach((value) => {
    const brand = value?.trim();
    if (brand && !brands.includes(brand)) {
      brands.push(brand);
    }
  });

  return brands.slice(0, 20);
}

export function hasCatalogFacetContext(query: CatalogFacetContext): boolean {
  return Boolean(
    query.categorySlug ||
      query.query ||
      query.specFilters?.length ||
      query.attributeFilters?.length ||
      query.attributeRangeFilters?.length,
  );
}

function parseCatalogSort(value: string | string[] | undefined): CatalogSort {
  const sort = trimmedParam(value);
  return catalogSortValues.includes(sort as CatalogSort) ? (sort as CatalogSort) : "popular";
}

export function parseCatalogSearchParams(params: CatalogSearchParams): ParsedCatalogSearchParams {
  const page = Math.max(Math.floor(parsePositiveNumberParam(params.page) ?? 1), 1);
  const brands = normalizeCatalogBrandValues(allParams(params.brand));

  return {
    query: trimmedParam(params.q),
    brand: brands[0],
    brands,
    onlyAvailable: firstParam(params.available) === "1",
    withPhoto: firstParam(params.photo) === "1",
    onlyInStock: firstParam(params.stock) === "1",
    minPrice: parsePositiveNumberParam(params.minPrice),
    maxPrice: parsePositiveNumberParam(params.maxPrice),
    page,
    sort: parseCatalogSort(params.sort),
    specFilters: normalizeCatalogSpecFilterValues(allParams(params.spec)),
    attributeFilters: normalizeCatalogAttributeFilters(allParams(params.attr)),
    attributeRangeFilters: normalizeCatalogAttributeRangeFilters({
      minValues: [...allParams(params.attrMin), ...keyedRangeParams(params, "attrMin")],
      maxValues: [...allParams(params.attrMax), ...keyedRangeParams(params, "attrMax")],
    }),
  };
}
