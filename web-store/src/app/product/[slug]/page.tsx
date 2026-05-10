import type { Metadata } from "next";
import { ArrowLeft, CheckCircle2, CreditCard, Phone, Truck } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AddToCartButton } from "@/components/add-to-cart-button";
import { ProductCard } from "@/components/product-card";
import { ProductGallery } from "@/components/product-gallery";
import { QuickOrderForm } from "@/components/quick-order-form";
import { StockBadge } from "@/components/stock-badge";
import { decimalToNumber, getCategoryPathById, getProductBySlug, getRelatedProducts } from "@/lib/catalog";
import { buildCatalogBreadcrumbItems } from "@/lib/catalog-breadcrumbs";
import { publicFulfillmentText } from "@/lib/fulfillment";
import { formatRub } from "@/lib/format";
import { buildProductFacts, productDescriptionText } from "@/lib/product-display";
import { productImageSrc } from "@/lib/product-images";
import { absoluteStorefrontUrl, buildBreadcrumbJsonLd, buildProductJsonLd } from "@/lib/seo-jsonld";
import { phoneHref, storefront } from "@/lib/storefront";

export const revalidate = 300;

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    return {
      title: "Товар не найден",
    };
  }

  const name = product.name ?? product.supplierName;
  const canonicalUrl = absoluteStorefrontUrl(`/product/${product.slug}`);
  return {
    title: product.seoTitle ?? name,
    description:
      product.seoDescription ??
      `${name} в интернет-магазине ${storefront.brand}. Доставка по региону: ${storefront.region}. Оплата при получении.`,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: product.seoTitle ?? name,
      description: product.seoDescription ?? `${name} в интернет-магазине ${storefront.brand}.`,
      url: canonicalUrl,
      type: "website",
    },
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  const relatedProducts = await getRelatedProducts({
    productId: product.id,
    categoryId: product.categoryId,
    take: 4,
  });
  const name = product.name ?? product.supplierName;
  const productPath = `/product/${product.slug}`;
  const productUrl = absoluteStorefrontUrl(productPath);
  const price = decimalToNumber(product.retailPrice);
  const fulfillment = publicFulfillmentText({ isAvailable: product.isAvailable && Boolean(price) });
  const categoryName = product.category?.name ?? null;
  const categoryPath = await getCategoryPathById(product.categoryId);
  const breadcrumbs = buildCatalogBreadcrumbItems(categoryPath, name);
  const parentCategory = categoryPath.at(-1);
  const backHref = parentCategory ? `/catalog/${parentCategory.slug}` : "/catalog";
  const galleryImages = product.images.flatMap((image) => {
    const src = productImageSrc(image);
    return src ? [{ id: image.id, src, alt: name }] : [];
  });
  const facts = buildProductFacts({
    sku: product.sku,
    title: name,
    categoryName,
    vendor: product.vendor,
    part: product.part,
    barcodes: product.barcodes,
    warranty: product.warranty,
    weight: product.weight,
    volume: product.volume,
    deliveryDays: product.deliveryDays,
    multiplicity: product.multiplicity,
    attributes: product.attributes,
  });
  const description = productDescriptionText(product.description, {
    supplierName: product.supplierName,
    name: product.name,
    categoryName,
    vendor: product.vendor,
    warranty: product.warranty,
    deliveryDays: product.deliveryDays,
    multiplicity: product.multiplicity,
  });
  const productJsonLd = buildProductJsonLd({
    name,
    description,
    sku: product.sku,
    brand: product.vendor,
    images: galleryImages.map((image) => image.src),
    price,
    isAvailable: fulfillment.canOrder,
    url: productPath,
  });
  const breadcrumbJsonLd = buildBreadcrumbJsonLd([
    { name: storefront.brand, url: "/" },
    { name: "Каталог", url: "/catalog" },
    ...categoryPath.map((category) => ({ name: category.name, url: `/catalog/${category.slug}` })),
    { name, url: productPath },
  ]);
  const minimumQuantity = Math.max(product.multiplicity || 1, 1);

  return (
    <div className="mx-auto max-w-7xl px-4 pb-40 pt-8 sm:px-6 lg:px-8 lg:pb-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <div className="grid gap-3">
        <Link href={backHref} className="inline-flex w-fit items-center gap-1 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-zinc-700 hover:border-teal-200 hover:text-teal-800">
          <ArrowLeft className="size-4" aria-hidden />
          {parentCategory ? `Вернуться в ${parentCategory.name}` : "Вернуться в каталог"}
        </Link>
        <nav className="flex flex-wrap items-center gap-2 text-sm text-zinc-500" aria-label="Хлебные крошки">
          {breadcrumbs.map((item, index) => (
            <span key={`${item.href ?? item.label}-${index}`} className="inline-flex min-w-0 items-center gap-2">
              {index > 0 ? <span className="text-zinc-300">/</span> : null}
              {item.href && index < breadcrumbs.length - 1 ? (
                <Link href={item.href} className="truncate font-semibold text-zinc-700 hover:text-teal-800">
                  {item.label}
                </Link>
              ) : (
                <span className="line-clamp-1 font-semibold text-zinc-950">{item.label}</span>
              )}
            </span>
          ))}
        </nav>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,0.95fr)_minmax(360px,0.75fr)_360px]">
        <ProductGallery images={galleryImages} name={name} />

        <section className="min-w-0 rounded-lg border border-zinc-200 bg-white p-6">
          <div className="flex flex-wrap gap-2">
            {product.category ? (
              <Link href={`/catalog/${product.category.slug}`} className="rounded-full bg-stone-100 px-3 py-1 text-xs font-semibold text-zinc-600">
                {product.category.name}
              </Link>
            ) : null}
            <span className="rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-800">{fulfillment.deliveryShortLabel}</span>
          </div>
          <p className="mt-5 text-sm font-semibold uppercase tracking-wide text-teal-700">{product.vendor ?? "Товар"}</p>
          <h1 className="mt-2 text-2xl font-black tracking-normal text-zinc-950 lg:text-3xl">{name}</h1>
          <p className="mt-3 text-sm leading-6 text-zinc-600">{description}</p>
          <div className="mt-5 text-sm text-zinc-500">SKU {product.sku}</div>
        </section>

        <aside className="h-fit rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap gap-2">
            <StockBadge state={product.stockStatus} label={fulfillment.stockLabel} />
          </div>
          <div className="mt-5 text-4xl font-black text-zinc-950">{price ? formatRub(price) : "Цена уточняется"}</div>
          {product.rrp ? <div className="mt-2 text-sm text-zinc-500">РРЦ: {formatRub(decimalToNumber(product.rrp))}</div> : null}
          <div className="mt-5 rounded-md bg-emerald-50 p-3 text-sm text-emerald-900">
            <p className="font-semibold">{fulfillment.deliveryLabel}</p>
            <p className="mt-1 text-emerald-800">{fulfillment.confirmationNote}</p>
          </div>
          <div className="mt-5">
            <AddToCartButton sku={product.sku} multiplicity={product.multiplicity} disabled={!fulfillment.canOrder || !price} />
          </div>
          <QuickOrderForm sku={product.sku} quantity={minimumQuantity} sourceUrl={productUrl} disabled={!fulfillment.canOrder || !price} />
          {product.multiplicity > 1 ? <p className="mt-3 text-sm text-amber-800">Заказ кратно {product.multiplicity} шт.</p> : null}
          <div className="mt-6 grid gap-2 text-sm text-zinc-600">
            <div className="flex gap-2 rounded-md bg-stone-50 p-3">
              <CreditCard className="size-5 shrink-0 text-teal-700" aria-hidden />
              <span>Оплата после подтверждения заказа менеджером.</span>
            </div>
            <div className="flex gap-2 rounded-md bg-stone-50 p-3">
              <Truck className="size-5 shrink-0 text-teal-700" aria-hidden />
              <span>Доставка по региону: {storefront.region}</span>
            </div>
          </div>
        </aside>
      </div>

      <section className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-zinc-200 bg-white p-6">
          <h2 className="text-xl font-bold text-zinc-950">О товаре</h2>
          <p className="mt-3 leading-7 text-zinc-600">{description}</p>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white p-6">
          <h2 className="text-xl font-bold text-zinc-950">Характеристики</h2>
          <dl className="mt-4 divide-y divide-zinc-100 overflow-hidden rounded-md border border-zinc-100">
            {facts.map((fact) => (
              <div key={fact.label} className="grid gap-1 px-4 py-3 text-sm sm:grid-cols-[180px_minmax(0,1fr)] sm:gap-4">
                <dt className="text-zinc-500">{fact.label}</dt>
                <dd className="break-words font-semibold text-zinc-950">{fact.value}</dd>
              </div>
            ))}
          </dl>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white p-6">
          <h2 className="text-xl font-bold text-zinc-950">Как оформляется заказ</h2>
          <div className="mt-4 space-y-3 text-sm text-zinc-600">
            {[
              "Вы добавляете товар в корзину и отправляете заявку.",
              "Менеджер подтверждает наличие у поставщика, цену и доставку под заказ 7 дней.",
              "Вы оплачиваете заказ после подтверждения.",
            ].map((item) => (
              <div key={item} className="flex gap-3">
                <CheckCircle2 className="size-5 shrink-0 text-teal-700" aria-hidden />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mt-8 rounded-lg border border-zinc-200 bg-white p-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">Можно сравнить</p>
            <h2 className="mt-2 text-xl font-bold text-zinc-950">Похожие товары</h2>
          </div>
          <Link href={product.category ? `/catalog/${product.category.slug}` : "/catalog"} className="text-sm font-semibold text-teal-800 hover:text-teal-950">
            Смотреть раздел
          </Link>
        </div>
        {relatedProducts.length ? (
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {relatedProducts.map((relatedProduct) => (
              <ProductCard key={relatedProduct.id} product={relatedProduct} />
            ))}
          </div>
        ) : (
          <div className="mt-5 rounded-lg bg-stone-50 p-5 text-sm text-zinc-600">
            Похожих товаров в этом разделе пока мало. Позвоните менеджеру, и мы подберем альтернативу по цене, сроку и характеристикам.
          </div>
        )}
      </section>

      <section className="mt-8 flex flex-wrap items-center justify-between gap-4 rounded-lg border border-teal-100 bg-teal-50 p-6">
        <div>
          <h2 className="text-xl font-bold text-zinc-950">Нужно подобрать аналог?</h2>
          <p className="mt-2 text-sm leading-6 text-zinc-700">
            Менеджер проверит наличие у поставщика, срок 7 дней и предложит близкие варианты по бюджету.
          </p>
        </div>
        <a
          href={phoneHref(storefront.phones[0])}
          className="inline-flex h-11 items-center gap-2 rounded-lg bg-zinc-950 px-5 text-sm font-semibold text-white hover:bg-teal-800"
        >
          <Phone className="size-4" aria-hidden />
          Позвонить
        </a>
      </section>
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-zinc-200 bg-white/95 p-3 shadow-2xl backdrop-blur lg:hidden">
        <div className="mx-auto grid max-w-7xl gap-2">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-zinc-950">{name}</p>
              <p className="text-sm font-bold text-zinc-950">{price ? formatRub(price) : "Цена уточняется"}</p>
            </div>
            <AddToCartButton sku={product.sku} multiplicity={product.multiplicity} disabled={!fulfillment.canOrder || !price} compact />
          </div>
          <details className="rounded-lg border border-zinc-200 bg-zinc-50 p-3">
            <summary className="cursor-pointer list-none text-sm font-semibold text-zinc-800 [&::-webkit-details-marker]:hidden">
              Быстрый заказ
            </summary>
            <div className="mt-3">
              <QuickOrderForm sku={product.sku} quantity={minimumQuantity} sourceUrl={productUrl} disabled={!fulfillment.canOrder || !price} compact />
            </div>
          </details>
        </div>
      </div>
    </div>
  );
}
