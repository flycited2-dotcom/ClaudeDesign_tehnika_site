import type { Metadata } from "next";
import { ArrowLeft, CheckCircle2, CreditCard, Phone, Truck } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { GlassProductCard } from "@/components/glass-product-card";
import { ProductAsideActions } from "@/components/product-aside-actions";
import { ProductBuyBlock } from "@/components/product-buy-block";
import { ProductGallery } from "@/components/product-gallery";
import { ProductMobBuyBar } from "@/components/product-mob-buy-bar";
import { RecentlyViewedStrip } from "@/components/recently-viewed-strip";
import { RecordProductView } from "@/components/record-product-view";
import { StockAlertButton } from "@/components/stock-alert-button";
import { StockBadge } from "@/components/stock-badge";
import { decimalToNumber, getCategoryPathById, getProductBySlug, getRelatedProducts } from "@/lib/catalog";
import { buildCatalogBreadcrumbItems, truncateBreadcrumbLabel } from "@/lib/catalog-breadcrumbs";
import { publicFulfillmentText } from "@/lib/fulfillment";
import { buildProductFacts, productDescriptionText, productShortTitle } from "@/lib/product-display";
import { productImageSrc } from "@/lib/product-images";
import { absoluteStorefrontUrl, buildBreadcrumbJsonLd, buildProductJsonLd, jsonLdHtml } from "@/lib/seo-jsonld";
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
  const shortTitle = productShortTitle(name, product.vendor, product.part);
  const productPath = `/product/${product.slug}`;
  const productUrl = absoluteStorefrontUrl(productPath);
  const price = decimalToNumber(product.retailPrice);
  const fulfillment = publicFulfillmentText({ isAvailable: product.isAvailable && Boolean(price) });
  const categoryName = product.category?.name ?? null;
  const categoryPath = await getCategoryPathById(product.categoryId);
  const breadcrumbs = buildCatalogBreadcrumbItems(categoryPath, shortTitle);
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
    mpn: product.part,
    images: galleryImages.map((image) => image.src),
    price,
    isAvailable: fulfillment.canOrder,
    stockStatus: product.stockStatus,
    url: productPath,
  });
  const breadcrumbJsonLd = buildBreadcrumbJsonLd([
    { name: storefront.brand, url: "/" },
    { name: "Каталог", url: "/catalog" },
    ...categoryPath.map((category) => ({ name: category.name, url: `/catalog/${category.slug}` })),
    { name, url: productPath },
  ]);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdHtml(productJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdHtml(breadcrumbJsonLd) }} />
      <RecordProductView sku={product.sku} />

      <div className="bread">
        <Link href={backHref} className="btn btn-ghost btn-sm" style={{ marginRight: 8 }}>
          <ArrowLeft size={14} aria-hidden />
          {parentCategory ? parentCategory.name : "Каталог"}
        </Link>
        {breadcrumbs.map((item, index) => {
          const label = truncateBreadcrumbLabel(item.label, index === breadcrumbs.length - 1 ? 56 : 28);
          return (
            <span
              key={`${item.href ?? item.label}-${index}`}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                maxWidth: index === breadcrumbs.length - 1 ? "min(420px, 50vw)" : "240px",
                overflow: "hidden",
                whiteSpace: "nowrap",
              }}
            >
              {index > 0 ? <span>›</span> : null}
              {item.href && index < breadcrumbs.length - 1 ? (
                <Link
                  href={item.href}
                  style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                  title={item.label}
                >
                  {label}
                </Link>
              ) : (
                <span
                  style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                  title={item.label}
                >
                  {label}
                </span>
              )}
            </span>
          );
        })}
      </div>

      <div className="p-product-layout">
        <div className="glass" style={{ padding: 16, borderRadius: 24 }}>
          <ProductGallery images={galleryImages} name={name} />
        </div>

        <section className="glass" style={{ padding: 24, borderRadius: 24, minWidth: 0 }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {product.category ? (
              <Link href={`/catalog/${product.category.slug}`} className="btn btn-soft btn-sm">
                {product.category.name}
              </Link>
            ) : null}
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                padding: "0 12px",
                height: 32,
                borderRadius: 999,
                background: "rgba(79,125,255,0.12)",
                color: "var(--accent-2)",
                fontSize: 12,
                fontWeight: 700,
              }}
            >
              {fulfillment.deliveryShortLabel}
            </span>
          </div>
          <p
            style={{
              marginTop: 18,
              fontSize: 13,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: 1,
              color: "var(--accent-2)",
            }}
          >
            {product.vendor ?? "Товар"}
          </p>
          <h1
            style={{
              marginTop: 8,
              fontSize: 24,
              fontWeight: 800,
              lineHeight: 1.3,
              letterSpacing: "-0.01em",
              color: "var(--text)",
            }}
          >
            {shortTitle}
          </h1>
          {shortTitle !== name && (
            <p
              style={{
                marginTop: 8,
                fontSize: 14,
                color: "var(--text-mute)",
                lineHeight: 1.5,
              }}
              title={name}
            >
              {name}
            </p>
          )}
          <div style={{ marginTop: 16, fontSize: 13, color: "var(--text-mute)" }}>SKU {product.sku}</div>
          <p style={{ marginTop: 16, fontSize: 14, lineHeight: 1.6, color: "var(--text-2)" }}>{description}</p>
        </section>

        <aside
          className="glass-strong p-product-aside"
          style={{ padding: 24, borderRadius: 24 }}
        >
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            <StockBadge state={product.stockStatus} label={fulfillment.stockLabel} />
          </div>
          {product.stockStatus === "out" && (
            <div style={{ marginTop: 12 }}>
              <StockAlertButton
                productContext={`${name} — SKU ${product.sku}`}
                buttonStyle={{ width: "100%", justifyContent: "center" }}
              />
            </div>
          )}
          <ProductBuyBlock
            sku={product.sku}
            price={price}
            rrp={product.rrp ? decimalToNumber(product.rrp) : null}
            multiplicity={product.multiplicity}
            canOrder={fulfillment.canOrder && Boolean(price)}
            sourceUrl={productUrl}
            deliveryLabel={fulfillment.deliveryLabel}
            confirmationNote={fulfillment.confirmationNote}
          />
          <ProductAsideActions
            sku={product.sku}
            retailPrice={price}
            productName={name}
            productHref={productPath}
          />
          <div style={{ marginTop: 20, display: "grid", gap: 8 }}>
            <div
              style={{
                display: "flex",
                gap: 10,
                padding: 12,
                borderRadius: 14,
                background: "rgba(255,255,255,0.5)",
                fontSize: 13,
                color: "var(--text-2)",
              }}
            >
              <CreditCard size={18} aria-hidden style={{ color: "var(--accent-2)", flexShrink: 0 }} />
              <span>Оплата после подтверждения заказа менеджером.</span>
            </div>
            <div
              style={{
                display: "flex",
                gap: 10,
                padding: 12,
                borderRadius: 14,
                background: "rgba(255,255,255,0.5)",
                fontSize: 13,
                color: "var(--text-2)",
              }}
            >
              <Truck size={18} aria-hidden style={{ color: "var(--accent-2)", flexShrink: 0 }} />
              <span>Доставка: {storefront.region}</span>
            </div>
          </div>
        </aside>
      </div>

      <section style={{ marginTop: 24 }} className="p-product-bottom">
        <div className="glass" style={{ padding: 24, borderRadius: 24, gridColumn: "1 / -1" }}>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: "var(--text)" }}>Характеристики</h2>
          <dl
            style={{
              marginTop: 14,
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
              columnGap: 32,
            }}
          >
            {facts.map((fact, index) => (
              <div
                key={fact.label}
                style={{
                  display: "grid",
                  gridTemplateColumns: "minmax(120px, 180px) minmax(0, 1fr)",
                  gap: 12,
                  padding: "10px 0",
                  borderTop: index === 0 ? "none" : "1px solid rgba(255,255,255,0.5)",
                  fontSize: 14,
                }}
              >
                <dt style={{ color: "var(--text-mute)" }}>{fact.label}</dt>
                <dd style={{ fontWeight: 600, color: "var(--text)", wordBreak: "break-word" }}>{fact.value}</dd>
              </div>
            ))}
          </dl>
        </div>
        <div className="glass" style={{ padding: 24, borderRadius: 24, gridColumn: "1 / -1" }}>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: "var(--text)" }}>Как оформляется заказ</h2>
          <div style={{ marginTop: 14, display: "grid", gap: 10 }}>
            {[
              "Вы добавляете товар в корзину и отправляете заявку.",
              "Менеджер подтверждает наличие у поставщика, цену и доставку под заказ 7 дней.",
              "Вы оплачиваете заказ после подтверждения.",
            ].map((item) => (
              <div key={item} style={{ display: "flex", gap: 12, fontSize: 14, color: "var(--text-2)" }}>
                <CheckCircle2 size={18} aria-hidden style={{ color: "var(--accent-2)", flexShrink: 0, marginTop: 2 }} />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="glass" style={{ marginTop: 24, padding: 24, borderRadius: 24 }}>
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-end", justifyContent: "space-between", gap: 12 }}>
          <div>
            <p
              style={{
                fontSize: 12,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: 1,
                color: "var(--accent-2)",
              }}
            >
              Можно сравнить
            </p>
            <h2 style={{ marginTop: 6, fontSize: 22, fontWeight: 800, color: "var(--text)" }}>Похожие товары</h2>
          </div>
          <Link
            href={product.category ? `/catalog/${product.category.slug}` : "/catalog"}
            className="btn btn-soft btn-sm"
          >
            Смотреть раздел
          </Link>
        </div>
        {relatedProducts.length > 0 ? (
          <div className="product-grid" style={{ marginTop: 18 }}>
            {relatedProducts.map((relatedProduct) => (
              <GlassProductCard key={relatedProduct.id} product={relatedProduct} />
            ))}
          </div>
        ) : (
          <div
            style={{
              marginTop: 18,
              padding: 18,
              borderRadius: 16,
              background: "rgba(255,255,255,0.5)",
              color: "var(--text-2)",
              fontSize: 14,
              lineHeight: 1.6,
            }}
          >
            Похожих товаров в этом разделе пока мало. Позвоните менеджеру, и мы подберем альтернативу по цене, сроку и характеристикам.
          </div>
        )}
      </section>

      <div style={{ marginTop: 24 }}>
        <RecentlyViewedStrip excludeSku={product.sku} />
      </div>

      <section
        className="glass-strong"
        style={{
          marginTop: 24,
          padding: 28,
          borderRadius: 24,
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
        }}
      >
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: "var(--text)" }}>Нужно подобрать аналог?</h2>
          <p style={{ marginTop: 8, lineHeight: 1.6, color: "var(--text-2)", fontSize: 14, maxWidth: 540 }}>
            Менеджер проверит наличие у поставщика, срок 7 дней и предложит близкие варианты по бюджету.
          </p>
        </div>
        <a href={phoneHref(storefront.phones[0])} className="btn btn-primary">
          <Phone size={16} aria-hidden />
          Позвонить
        </a>
      </section>

      <ProductMobBuyBar
        sku={product.sku}
        shortTitle={shortTitle}
        price={price}
        multiplicity={product.multiplicity}
        canOrder={fulfillment.canOrder && Boolean(price)}
        productName={name}
        productHref={productPath}
      />
    </>
  );
}
