import { extractProductNameAttributes } from "@/lib/product-attributes";

export type ProductAttributeBackfillProduct = {
  productId: string;
  name?: string | null;
  supplierName: string | null;
  categoryName?: string | null;
};

export type ProductAttributeBackfillRow = {
  productId: string;
  key: string;
  label: string;
  value: string;
  normalizedValue: string;
  numericValue: number | null;
  unit: string | null;
  source: string;
};

export function buildProductAttributeRows(product: ProductAttributeBackfillProduct): ProductAttributeBackfillRow[] {
  const title = product.name?.trim() || product.supplierName || "";

  return extractProductNameAttributes(title, product.categoryName).map((attribute) => ({
    productId: product.productId,
    key: attribute.key,
    label: attribute.label,
    value: attribute.value,
    normalizedValue: attribute.normalizedValue,
    numericValue: attribute.numericValue,
    unit: attribute.unit,
    source: attribute.source,
  }));
}
