import { notFound } from "next/navigation";
import { VkShareCopyButton } from "@/components/vk-share-copy-button";
import {
  buildVkShareComment,
  getVkShareProduct,
} from "@/lib/vk-share-products";

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function VkPublishHelperPage({ params }: Props) {
  const { slug } = await params;
  const product = getVkShareProduct(slug);
  if (!product) notFound();

  const comment = buildVkShareComment(product);
  const productUrl = `https://climat-simf.ru/share/vk/${product.slug}`;
  const shareUrl = `https://vk.com/share.php?${new URLSearchParams({ url: productUrl })}`;

  return (
    <section style={{ maxWidth: 860, margin: "0 auto", padding: "36px 20px 72px" }}>
      <div className="glass" style={{ padding: 24, borderRadius: 28 }}>
        <h1 style={{ marginTop: 0 }}>Публикация RUCELF во ВКонтакте</h1>
        <p style={{ fontSize: 18, lineHeight: 1.6 }}>
          Нажмите кнопку ниже. Текст скопируется, затем откроется форма VK.
          В поле «Ваш комментарий» нажмите <strong>Ctrl+V</strong> — каждое УТП
          останется на отдельной строке.
        </p>
        <pre
          style={{
            whiteSpace: "pre-wrap",
            font: "inherit",
            lineHeight: 1.6,
            background: "rgba(255,255,255,.72)",
            border: "1px solid rgba(15,23,42,.12)",
            borderRadius: 18,
            padding: 20,
            margin: "24px 0",
          }}
        >
          {comment}
        </pre>
        <VkShareCopyButton comment={comment} shareUrl={shareUrl} />
      </div>
    </section>
  );
}
