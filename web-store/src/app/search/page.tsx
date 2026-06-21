import type { Metadata } from "next";
import { CatalogView } from "@/app/catalog/catalog-view";
import { getCatalogPage } from "@/lib/catalog";
import { parseCatalogSearchParams } from "@/lib/catalog-query";
import { recordSearchTerm } from "@/lib/search-analytics";
import { normalizeSuggestionQuery } from "@/lib/search-suggestions";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Поиск товаров",
  description: "Поиск бытовой техники, электроники, климатического оборудования и товаров для дома в БытТехОпт.",
  robots: {
    index: false,
    follow: true,
  },
};

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function SearchPage({ searchParams }: Props) {
  const filters = parseCatalogSearchParams(await searchParams);
  const query = filters.query ?? "";
  const catalogQuery = normalizeSuggestionQuery(query) ?? "";
  const shouldRecordSearch = filters.page === 1 && query.trim().length > 0;
  let data;
  try {
    [data] = await Promise.all([
      getCatalogPage({
        query: catalogQuery,
        brands: filters.brands,
        available: filters.onlyAvailable,
        withPhoto: filters.withPhoto,
        minPrice: filters.minPrice,
        maxPrice: filters.maxPrice,
        page: filters.page,
        sort: filters.sort,
        specFilters: filters.specFilters,
        attributeFilters: filters.attributeFilters,
        attributeRangeFilters: filters.attributeRangeFilters,
      }),
      shouldRecordSearch ? recordSearchTerm(query).catch(() => undefined) : Promise.resolve(),
    ]);
  } catch {
    return (
      <CatalogView
        title={query ? `Поиск: ${query}` : "Поиск товаров"}
        products={[]}
        total={0}
        page={1}
        perPage={24}
        categories={[]}
        brands={[]}
        currentQuery={query}
        currentBrands={filters.brands}
        onlyAvailable={filters.onlyAvailable}
        withPhoto={filters.withPhoto}
        minPrice={filters.minPrice}
        maxPrice={filters.maxPrice}
        sort={filters.sort}
        currentSpecFilters={filters.specFilters}
        currentAttributeFilters={filters.attributeFilters}
        currentAttributeRangeFilters={filters.attributeRangeFilters}
        basePath="/search"
        error="Поиск временно недоступен. Позвоните нам, и менеджер поможет подобрать товар вручную."
      />
    );
  }

  return (
    <CatalogView
      title={query ? `Поиск: ${query}` : "Поиск товаров"}
      products={data.products}
      total={data.total}
      page={data.page}
      perPage={data.perPage}
      categories={data.categories}
      brands={data.brands}
      currentQuery={query}
      currentBrands={filters.brands}
      onlyAvailable={filters.onlyAvailable}
      withPhoto={filters.withPhoto}
      minPrice={filters.minPrice}
      maxPrice={filters.maxPrice}
      sort={filters.sort}
      currentSpecFilters={filters.specFilters}
      specFilterOptions={data.specFilterOptions}
      currentAttributeFilters={data.attributeFilters}
      attributeFilterGroups={data.attributeFilterGroups}
      currentAttributeRangeFilters={data.attributeRangeFilters}
      attributeRangeGroups={data.attributeRangeGroups}
      basePath="/search"
    />
  );
}
