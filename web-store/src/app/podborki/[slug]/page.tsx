import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CatalogView } from "@/app/catalog/catalog-view";
import { getCatalogPage } from "@/lib/catalog";
import { getCatalogFilterLanding } from "@/lib/catalog-filter-landings";
import { absoluteStorefrontUrl } from "@/lib/seo-jsonld";
import { storefront } from "@/lib/storefront";

export const revalidate = 300;
export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const landing = getCatalogFilterLanding(slug);

  if (!landing) {
    return {
      title: "Подборка товаров",
    };
  }

  const canonical = absoluteStorefrontUrl(`/podborki/${landing.slug}`);
  return {
    title: `${landing.title} | ${storefront.brand}`,
    description: landing.description,
    alternates: {
      canonical,
    },
    robots: {
      index: true,
      follow: true,
    },
    openGraph: {
      title: `${landing.heading} | ${storefront.brand}`,
      description: landing.description,
      url: canonical,
      type: "website",
    },
  };
}

export default async function CatalogFilterLandingPage({ params }: Props) {
  const { slug } = await params;
  const landing = getCatalogFilterLanding(slug);

  if (!landing) notFound();

  const data = await getCatalogPage({
    ...landing.query,
    page: 1,
    sort: "popular",
  });
  const catalogBasePath = data.category ? `/catalog/${data.category.slug}` : "/catalog";

  return (
    <CatalogView
      title={landing.heading}
      categoryPath={data.categoryPath}
      products={data.products}
      total={data.total}
      page={data.page}
      perPage={data.perPage}
      categories={data.categories}
      brands={data.brands}
      currentCategorySlug={data.category?.slug}
      onlyAvailable={landing.query.available}
      withPhoto={landing.query.withPhoto}
      minPrice={landing.query.minPrice}
      maxPrice={landing.query.maxPrice}
      sort="popular"
      currentSpecFilters={landing.query.specFilters}
      specFilterOptions={data.specFilterOptions}
      currentAttributeFilters={data.attributeFilters}
      attributeFilterGroups={data.attributeFilterGroups}
      currentAttributeRangeFilters={data.attributeRangeFilters}
      attributeRangeGroups={data.attributeRangeGroups}
      basePath={catalogBasePath}
    />
  );
}
