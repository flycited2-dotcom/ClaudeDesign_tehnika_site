import { prisma } from "@/lib/db";
import { extractProductNameAttributes } from "@/lib/product-attributes";

/**
 * Read-only diagnostic — prints products where extractProductNameAttributes
 * tagged an electrical_product_type alongside facts from an unrelated
 * category (camera/cooling), or produced a cable size close to the
 * plausibility ceiling. Does not write anything to the database.
 *
 * Run with: npx tsx scripts/audit-electrical-false-positives.ts
 */

const BATCH_SIZE = Number(process.env.AUDIT_BATCH_SIZE ?? 500);

const CAMERA_KEYS = new Set(["camera_lens_mm", "camera_type", "night_vision"]);
const COOLING_KEYS = new Set(["fan_size_mm", "rpm", "has_argb"]);
const CABLE_CORES_WARN_THRESHOLD = 40;
const CABLE_SECTION_WARN_THRESHOLD = 200;

async function main() {
  let cursor: string | undefined;
  let scanned = 0;
  let flagged = 0;

  for (;;) {
    const products = await prisma.product.findMany({
      where: {
        isActive: true,
        isVisible: true,
      },
      select: {
        id: true,
        sku: true,
        name: true,
        supplierName: true,
        category: { select: { name: true } },
      },
      orderBy: {
        id: "asc",
      },
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      take: BATCH_SIZE,
    });

    if (!products.length) break;

    for (const product of products) {
      const title = product.name?.trim() || product.supplierName;
      const attributes = extractProductNameAttributes(title, product.category?.name);
      const keys = new Set(attributes.map((attribute) => attribute.key));
      if (!keys.has("electrical_product_type")) continue;

      const reasons: string[] = [];
      if (attributes.some((attribute) => CAMERA_KEYS.has(attribute.key))) {
        reasons.push("electrical_product_type + camera-specific fact on the same product");
      }
      if (attributes.some((attribute) => COOLING_KEYS.has(attribute.key))) {
        reasons.push("electrical_product_type + cooling-specific fact on the same product");
      }
      const cores = attributes.find((attribute) => attribute.key === "cable_cores")?.numericValue;
      if (cores !== null && cores !== undefined && cores >= CABLE_CORES_WARN_THRESHOLD) {
        reasons.push(`cable_cores=${cores} is close to the plausibility ceiling — verify manually`);
      }
      const section = attributes.find((attribute) => attribute.key === "cable_section")?.numericValue;
      if (section !== null && section !== undefined && section >= CABLE_SECTION_WARN_THRESHOLD) {
        reasons.push(`cable_section=${section} is close to the plausibility ceiling — verify manually`);
      }

      if (reasons.length) {
        flagged += 1;
        console.log(`SKU ${product.sku} (${product.category?.name ?? "без категории"}): ${title}`);
        for (const reason of reasons) {
          console.log(`  - ${reason}`);
        }
      }
    }

    scanned += products.length;
    cursor = products[products.length - 1]?.id;
  }

  console.log(`audit complete: scanned=${scanned} flagged=${flagged}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
