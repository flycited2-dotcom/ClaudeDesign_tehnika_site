import type { Metadata } from "next";
import type { CatalogAttributeFilter, CatalogAttributeRangeFilter } from "@/lib/catalog-attribute-filters";
import type { CatalogSort } from "@/lib/catalog-query";
import type { CatalogSpecFilterValue } from "@/lib/catalog-spec-filters";

export type CatalogRobotsFilters = {
  query?: string;
  brand?: string;
  onlyAvailable?: boolean;
  withPhoto?: boolean;
  onlyInStock?: boolean;
  minPrice?: number;
  maxPrice?: number;
  page: number;
  sort: CatalogSort;
  specFilters: readonly CatalogSpecFilterValue[];
  attributeFilters?: readonly CatalogAttributeFilter[];
  attributeRangeFilters?: readonly CatalogAttributeRangeFilter[];
};

export function isIndexableCatalogFilters(filters: CatalogRobotsFilters): boolean {
  return !(
    filters.query ||
    filters.brand ||
    filters.onlyAvailable ||
    filters.withPhoto ||
    filters.onlyInStock ||
    filters.minPrice ||
    filters.maxPrice ||
    filters.page > 1 ||
    filters.sort !== "popular" ||
    filters.specFilters.length ||
    filters.attributeFilters?.length ||
    filters.attributeRangeFilters?.length
  );
}

export function catalogRobotsForFilters(filters: CatalogRobotsFilters): Metadata["robots"] {
  return isIndexableCatalogFilters(filters) ? { index: true, follow: true } : { index: false, follow: true };
}
