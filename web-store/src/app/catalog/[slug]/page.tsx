import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CatalogView } from "@/app/catalog/catalog-view";
import { getCatalogPage, getCategoryBySlug } from "@/lib/catalog";
import { parseCatalogSearchParams } from "@/lib/catalog-query";
import { catalogRobotsForFilters } from "@/lib/seo-robots";
import { absoluteStorefrontUrl, buildBreadcrumbJsonLd, jsonLdHtml } from "@/lib/seo-jsonld";
import { storefront } from "@/lib/storefront";

export const revalidate = 300;

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { slug } = await params;
  const filters = parseCatalogSearchParams(await searchParams);
  const category = await getCategoryBySlug(slug);

  if (!category) {
    return {
      title: "Раздел каталога",
    };
  }

  const canonical = absoluteStorefrontUrl(`/catalog/${category.slug}`);
  return {
    title: `${category.name} купить с доставкой | ${storefront.brand}`,
    description: `${category.name} в интернет-магазине ${storefront.brand}. Доставка под заказ 7 дней по региону: ${storefront.region}.`,
    alternates: {
      canonical,
    },
    robots: catalogRobotsForFilters(filters),
    openGraph: {
      title: `${category.name} | ${storefront.brand}`,
      description: `${category.name}: цены, наличие у поставщика и доставка под заказ 7 дней.`,
      url: canonical,
      type: "website",
    },
  };
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const filters = parseCatalogSearchParams(await searchParams);
  const data = await getCatalogPage({
    categorySlug: slug,
    query: filters.query,
    brands: filters.brands,
    available: filters.onlyAvailable,
    withPhoto: filters.withPhoto,
    inStock: filters.onlyInStock,
    minPrice: filters.minPrice,
    maxPrice: filters.maxPrice,
    page: filters.page,
    sort: filters.sort,
    specFilters: filters.specFilters,
    attributeFilters: filters.attributeFilters,
    attributeRangeFilters: filters.attributeRangeFilters,
  });

  if (!data.category) {
    notFound();
  }

  const breadcrumbJsonLd = buildBreadcrumbJsonLd([
    { name: storefront.brand, url: "/" },
    { name: "Каталог", url: "/catalog" },
    ...data.categoryPath.map((category) => ({ name: category.name, url: `/catalog/${category.slug}` })),
  ]);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdHtml(breadcrumbJsonLd) }} />
      <CatalogView
        title={data.category.name}
        categoryPath={data.categoryPath}
        products={data.products}
        total={data.total}
        page={data.page}
        perPage={data.perPage}
        categories={data.categories}
        brands={data.brands}
        currentCategorySlug={data.category.slug}
        currentQuery={filters.query}
        currentBrands={filters.brands}
        onlyAvailable={filters.onlyAvailable}
        withPhoto={filters.withPhoto}
        onlyInStock={filters.onlyInStock}
        minPrice={filters.minPrice}
        maxPrice={filters.maxPrice}
        sort={filters.sort}
        currentSpecFilters={filters.specFilters}
        specFilterOptions={data.specFilterOptions}
        currentAttributeFilters={data.attributeFilters}
        attributeFilterGroups={data.attributeFilterGroups}
        currentAttributeRangeFilters={data.attributeRangeFilters}
        attributeRangeGroups={data.attributeRangeGroups}
        basePath={`/catalog/${data.category.slug}`}
      />
    </>
  );
}
