import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getVkShareProduct,
  getVkShareProductSlugs,
} from "@/lib/vk-share-products";

type Props = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return getVkShareProductSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = getVkShareProduct(slug);
  if (!product) return { title: "Товар не найден" };

  const url = `https://climat-simf.ru/share/vk/${product.slug}`;
  return {
    title: { absolute: `${product.title} — ${product.price}` },
    description: product.description,
    alternates: { canonical: url },
    robots: { index: false, follow: true },
    openGraph: {
      title: `${product.title} — ${product.price}`,
      description: product.description,
      url,
      siteName: "БытТехОпт",
      locale: "ru_RU",
      type: "website",
      images: [
        {
          url: product.imageUrl,
          width: 1254,
          height: 1254,
          alt: product.title,
          type: "image/png",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${product.title} — ${product.price}`,
      description: product.description,
      images: [product.imageUrl],
    },
  };
}

export default async function VkShareProductPage({ params }: Props) {
  const { slug } = await params;
  const product = getVkShareProduct(slug);
  if (!product) notFound();

  return (
    <section style={{ maxWidth: 1120, margin: "0 auto", padding: "36px 20px 72px" }}>
      <div className="glass" style={{ padding: 24, borderRadius: 28 }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: 32,
            alignItems: "start",
          }}
        >
          <Image
            src={product.imageUrl}
            alt={product.title}
            width={1254}
            height={1254}
            priority
            style={{ width: "100%", height: "auto", borderRadius: 22 }}
          />
          <div>
            <p style={{ margin: "0 0 8px", color: "#2563eb", fontWeight: 800 }}>
              В наличии у поставщика — подтвердим перед заказом
            </p>
            <h1 style={{ margin: "0 0 16px", fontSize: "clamp(28px, 4vw, 46px)" }}>
              {product.title}
            </h1>
            <p style={{ margin: "0 0 20px", fontSize: 32, fontWeight: 900 }}>
              {product.price}
            </p>
            <p style={{ fontSize: 18, lineHeight: 1.6 }}>{product.description}</p>
            <ul style={{ display: "grid", gap: 10, paddingLeft: 22, lineHeight: 1.5 }}>
              {product.highlights.map((item) => <li key={item}>{item}</li>)}
            </ul>
            <p style={{ marginTop: 22, fontWeight: 700, lineHeight: 1.5 }}>{product.cta}</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 24 }}>
              <Link className="btn btn-primary" href={`/share/vk/${product.slug}/publish`}>
                Открыть предпросмотр VK
              </Link>
              <Link className="btn btn-primary" href="tel:+79785792995">Позвонить</Link>
              <Link className="btn btn-ghost" href="/checkout">Оставить заявку</Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
