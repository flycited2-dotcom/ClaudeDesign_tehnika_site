/**
 * One-off / re-runnable recovery of supplier images for the "gap":
 * sellable products with hasImage=true (supplier feed says it has a photo) but
 * ZERO non-deleted ProductImage rows in our DB.
 *
 * Root cause this fixes: the admin image sync (`syncItpImages`) runs full (all
 * ~210k hasImage=true products) inside a web request and exceeds the nginx
 * proxy timeout (180s) before reaching the high-SKU tail, so that tail never
 * gets images. This script targets ONLY the gap products and runs as a plain
 * background process (no web timeout). Idempotent (Prisma upsert on
 * supplierImageId). Reuses the same itpRpc + upsert shape as syncItpImages.
 *
 * Run on the VPS:
 *   cd /var/www/climat-simf.ru
 *   node --env-file=.env --import tsx ./scripts/recover-gap-images.ts
 *   # test a slice first:  GAP_LIMIT=200 node --env-file=.env --import tsx ./scripts/recover-gap-images.ts
 *
 * 2026-06-24: first run recovered images for ~19,168 sellable products
 * (gap 19,199 -> 31; sellable-with-real-image 109,820 -> 128,988).
 */
import { prisma } from "@/lib/db";
import { itpRpc } from "@/lib/itp/client";
import { sleep } from "@/lib/itp/utils";
import type { ItpProductImage } from "@/lib/itp/types";

function supplierImageUrl(path: string): string {
  const baseUrl = process.env.ITP_API_BASE_URL ?? "https://b2b.i-t-p.pro";
  const imageSize = process.env.ITP_IMAGE_SIZE ?? "large";
  return `${baseUrl}/${path.replace(/^\/+/, "")}?size=${imageSize}`;
}

async function main() {
  const LIMIT = process.env.GAP_LIMIT ? parseInt(process.env.GAP_LIMIT, 10) : null;
  const batchSize = 100;
  const t0 = Date.now();
  const gap = await prisma.product.findMany({
    where: {
      hasImage: true,
      isActive: true,
      isAvailable: true,
      retailPrice: { gt: 0 },
      images: { none: { deleted: false } },
    },
    select: { id: true, sku: true },
    orderBy: { sku: "asc" },
    ...(LIMIT ? { take: LIMIT } : {}),
  });
  console.log(`gap products to process: ${gap.length}${LIMIT ? ` (LIMIT ${LIMIT})` : " (ALL)"}`);
  let scanned = 0,
    upserted = 0,
    withImages = 0,
    noImages = 0,
    failed = 0;
  for (let i = 0; i < gap.length; i += batchSize) {
    const batch = gap.slice(i, i + batchSize);
    const idBySku = new Map(batch.map((p) => [p.sku, p.id] as const));
    let resp;
    try {
      resp = await itpRpc<{ product_images: ItpProductImage[]; total: number }>({
        request: { method: "read_new", model: "products_clients_images", module: "platform" },
        filter: [{ property: "sku", operator: "IN", value: batch.map((p) => p.sku) }],
      });
    } catch {
      failed += batch.length;
      await sleep(1000);
      continue;
    }
    scanned += batch.length;
    if (!resp.success || !resp.data) {
      failed += batch.length;
      await sleep(500);
      continue;
    }
    const imgs = resp.data.product_images ?? [];
    const got = new Set(imgs.map((x) => x.sku));
    for (const p of batch) {
      if (got.has(p.sku)) withImages++;
      else noImages++;
    }
    for (const image of imgs) {
      const productId = idBySku.get(image.sku);
      if (!productId) continue;
      await prisma.productImage.upsert({
        where: { supplierImageId: image.id },
        create: {
          supplierImageId: image.id,
          productId,
          sku: image.sku,
          supplierImageUrl: supplierImageUrl(image.url),
          priority: image.priority,
          deleted: image.deleted,
          isPrimary: image.priority <= 100,
        },
        update: {
          supplierImageUrl: supplierImageUrl(image.url),
          priority: image.priority,
          deleted: image.deleted,
          isPrimary: image.priority <= 100,
        },
      });
      upserted++;
    }
    if (scanned % 1000 === 0)
      console.log(
        `[${Math.round((Date.now() - t0) / 1000)}s] scanned=${scanned} upserted=${upserted} withImg=${withImages} noImg=${noImages} failed=${failed}`,
      );
    await sleep(300);
  }
  console.log(
    `DONE scanned=${scanned} upserted=${upserted} withImages=${withImages} noImages=${noImages} failed=${failed} elapsed=${Math.round((Date.now() - t0) / 1000)}s`,
  );
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
