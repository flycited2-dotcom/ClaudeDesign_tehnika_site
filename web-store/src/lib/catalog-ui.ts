import type { CatalogSort } from "@/lib/catalog-query";
import type { CatalogAttributeFilter, CatalogAttributeRangeFilter } from "@/lib/catalog-attribute-filters";
import type { CatalogSpecFilterValue } from "@/lib/catalog-spec-filters";

export type CatalogUiFilterState = {
  query?: string;
  brand?: string;
  brands?: string[];
  onlyAvailable?: boolean;
  withPhoto?: boolean;
  onlyInStock?: boolean;
  minPrice?: number;
  maxPrice?: number;
  sort: CatalogSort;
  specFilters: CatalogSpecFilterValue[];
  attributeFilters?: CatalogAttributeFilter[];
  attributeRangeFilters?: CatalogAttributeRangeFilter[];
};

export function countActiveCatalogFilters(state: CatalogUiFilterState): number {
  let count = 0;
  const brandCount = state.brands?.length ?? (state.brand ? 1 : 0);

  if (state.query) count += 1;
  count += brandCount;
  if (state.onlyAvailable) count += 1;
  if (state.withPhoto) count += 1;
  if (state.onlyInStock) count += 1;
  if (state.minPrice || state.maxPrice) count += 1;
  if (state.sort !== "popular") count += 1;

  return count + state.specFilters.length + (state.attributeFilters?.length ?? 0) + (state.attributeRangeFilters?.length ?? 0);
}
