import { prisma } from "@/lib/db";
import { extractProductNameAttributes } from "@/lib/product-attributes";

/**
 * Read-only diagnostic combining three roadmap-brainstorm investigations:
 *
 * 1. Cross-family false positives — extractProductNameAttributes runs every
 *    looksLikeXProduct family unconditionally on every product name, each
 *    only gated by its own keyword check (the same shape of bug fixed for
 *    "electrical" in Iter 71/72). Flags products whose extracted facts
 *    contain a distinctive "type" key from two DIFFERENT families at once —
 *    a product can't genuinely be a tire AND a vacuum cleaner.
 * 2. Characteristics coverage per not-yet-audited product family (laundry,
 *    fridge, dishwasher, microwave, oven, tire, dish/apparel, vacuum, TV) —
 *    same "gap × volume" methodology as Iter 70, to find the next candidate.
 * 3. Scale of products with name = null (falls back to raw supplierName).
 *
 * Does not write anything to the database.
 * Run with: npx tsx scripts/catalog-audit-report.ts
 */

const BATCH_SIZE = Number(process.env.AUDIT_BATCH_SIZE ?? 500);

// Distinctive keys that only make sense for ONE product family — used for the
// cross-family collision check. Deliberately excludes keys shared by design
// across families (width_cm, volume_l, power_w, program_count, color, ...).
const FAMILY_BY_TYPE_KEY: Record<string, string> = {
  camera_type: "camera",
  tire_season: "tire",
  vacuum_type: "vacuum",
  fridge_no_frost: "refrigeration",
  drying_type: "laundry",
  oven_type: "oven",
  cooktop_type: "cooktop",
  paper_format: "paper",
  electrical_product_type: "electrical",
  managed_type: "network",
};

// Lightweight, approximate "is this product a plausible member of family X"
// check — NOT the real looksLikeXProduct gates (those aren't exported), just
// good enough to rank coverage gaps for scoping. Mirrors Iter 70's own
// category-selection methodology (gap × volume).
const FAMILY_CANDIDATE_PATTERN: Record<string, RegExp> = {
  laundry: /стиральн|сушильн/i,
  refrigeration: /холодильник|морозильн/i,
  dishwasher: /посудомо/i,
  microwave: /микроволнов|\bсвч\b/i,
  oven: /духов[а-яё]*\s+шкаф|духовк/i,
  tire: /(^|[^а-яё])шин[аы]?|покрыш|автошин/i,
  vacuum: /пылесос/i,
  tv: /телевизор|smart\s*tv/i,
};

const FAMILY_COVERAGE_KEY: Record<string, string> = {
  laundry: "load_capacity",
  refrigeration: "total_volume_l",
  dishwasher: "place_settings",
  microwave: "volume_l",
  oven: "oven_volume_l",
  tire: "tire_width",
  vacuum: "vacuum_type",
  tv: "resolution",
};

async function main() {
  let cursor: string | undefined;
  let scanned = 0;
  let crossFamilyFlagged = 0;
  let nullNameCount = 0;
  const candidateCounts: Record<string, number> = {};
  const coveredCounts: Record<string, number> = {};

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
      if (product.name === null) nullNameCount += 1;

      const title = product.name?.trim() || product.supplierName;
      const attributes = extractProductNameAttributes(title, product.category?.name);
      const keys = new Set(attributes.map((attribute) => attribute.key));

      const families = new Set(
        Object.entries(FAMILY_BY_TYPE_KEY)
          .filter(([key]) => keys.has(key))
          .map(([, family]) => family),
      );
      if (families.size > 1) {
        crossFamilyFlagged += 1;
        console.log(`SKU ${product.sku} (${product.category?.name ?? "без категории"}): ${title}`);
        console.log(`  - conflicting families: ${[...families].join(", ")}`);
      }

      for (const [family, pattern] of Object.entries(FAMILY_CANDIDATE_PATTERN)) {
        if (!pattern.test(title)) continue;
        candidateCounts[family] = (candidateCounts[family] ?? 0) + 1;
        if (keys.has(FAMILY_COVERAGE_KEY[family])) {
          coveredCounts[family] = (coveredCounts[family] ?? 0) + 1;
        }
      }
    }

    scanned += products.length;
    cursor = products[products.length - 1]?.id;
  }

  console.log(`\ncross-family audit complete: scanned=${scanned} flagged=${crossFamilyFlagged}`);
  console.log(`\nname IS NULL: ${nullNameCount} of ${scanned} (${((nullNameCount / scanned) * 100).toFixed(1)}%)`);
  console.log("\ncharacteristics coverage by family (candidates matched by name keyword, not real category):");
  for (const family of Object.keys(FAMILY_CANDIDATE_PATTERN)) {
    const candidates = candidateCounts[family] ?? 0;
    const covered = coveredCounts[family] ?? 0;
    const pct = candidates ? ((covered / candidates) * 100).toFixed(1) : "0.0";
    console.log(`  ${family}: ${covered}/${candidates} covered (${pct}%)`);
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
