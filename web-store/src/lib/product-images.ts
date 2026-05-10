import type { ProductImage } from "@prisma/client";

const defaultSupplierImageHost = "b2b.i-t-p.pro";

function configuredSupplierImageHost(): string {
  try {
    return new URL(process.env.ITP_API_BASE_URL ?? `https://${defaultSupplierImageHost}`).hostname;
  } catch {
    return defaultSupplierImageHost;
  }
}

export function productImageSrc(image: Pick<ProductImage, "id"> | null | undefined): string | null {
  return image ? `/api/product-images/${encodeURIComponent(image.id)}` : null;
}

export function isAllowedSupplierImageUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol) && url.hostname === configuredSupplierImageHost();
  } catch {
    return false;
  }
}
