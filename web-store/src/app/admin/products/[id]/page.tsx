import { notFound } from "next/navigation";
import { AdminShell } from "@/components/admin-shell";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/db";
import { ProductEditForm } from "./product-edit-form";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function AdminProductEditPage({ params }: Props) {
  await requireAdmin();
  const { id } = await params;
  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      attributes: {
        orderBy: [{ source: "asc" }, { key: "asc" }, { value: "asc" }],
      },
    },
  });

  if (!product) notFound();

  const manualAttributesText = product.attributes
    .filter((attribute) => attribute.source === "manual")
    .map((attribute) => `${attribute.label}: ${attribute.value}`)
    .join("\n");

  const attributes = product.attributes.map((attribute) => ({
    id: `${attribute.source}-${attribute.key}-${attribute.normalizedValue}`,
    label: attribute.label,
    value: attribute.value,
    manual: attribute.source === "manual",
  }));

  return (
    <AdminShell title={`Товар SKU ${product.sku}`}>
      <ProductEditForm
        product={{
          id: product.id,
          isVisible: product.isVisible,
          name: product.name ?? "",
          manualPrice: product.manualPrice?.toString() ?? "",
          seoTitle: product.seoTitle ?? "",
          seoDescription: product.seoDescription ?? "",
          description: product.description ?? "",
        }}
        manualAttributesText={manualAttributesText}
        attributes={attributes}
      />
    </AdminShell>
  );
}
