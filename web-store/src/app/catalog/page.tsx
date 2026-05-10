import type { Metadata } from "next";
import { CatalogView } from "@/app/catalog/catalog-view";
import { getCatalogPage } from "@/lib/catalog";
import { parseCatalogSearchParams } from "@/lib/catalog-query";
import { catalogRobotsForFilters } from "@/lib/seo-robots";
import { absoluteStorefrontUrl } from "@/lib/seo-jsonld";
import { storefront } from "@/lib/storefront";

export const revalidate = 300;

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const filters = parseCatalogSearchParams(await searchParams);

  return {
    title: `Каталог техники и товаров для дома | ${storefront.brand}`,
    description:
      `Каталог бытовой техники, электроники, климатического оборудования и товаров для дома. Доставка под заказ 7 дней по региону: ${storefront.region}.`,
    robots: catalogRobotsForFilters(filters),
    alternates: {
      canonical: absoluteStorefrontUrl("/catalog"),
    },
    openGraph: {
      title: `Каталог техники и товаров для дома | ${storefront.brand}`,
      description: `Бытовая техника, электроника, климатическое оборудование и товары для дома с доставкой по региону: ${storefront.region}.`,
      url: absoluteStorefrontUrl("/catalog"),
      type: "website",
    },
  };
}

export default async function CatalogPage({ searchParams }: Props) {
  const filters = parseCatalogSearchParams(await searchParams);

  let data;
  try {
    data = await getCatalogPage({
      query: filters.query,
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
    });
  } catch {
    return (
      <CatalogView
        title="Каталог товаров"
        products={[]}
        total={0}
        page={1}
        perPage={24}
        categories={[]}
        brands={[]}
        error="Каталог временно недоступен. Позвоните нам, и менеджер поможет подобрать товар вручную."
      />
    );
  }

  return (
    <CatalogView
      title="Каталог товаров"
      products={data.products}
      total={data.total}
      page={data.page}
      perPage={data.perPage}
      categories={data.categories}
      brands={data.brands}
      currentQuery={filters.query}
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
    />
  );
}
