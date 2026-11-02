import { readFile, writeFile, mkdir, access } from "node:fs/promises";
import { CATEGORY_ART_BY_SLUG } from "../src/lib/category-art";
import generatedCategoryArt from "../src/lib/generated-category-art.json";
import { buildCategoryTree, type FlatCategory, type CategoryTreeItem } from "../src/lib/catalog-tree";

type CountRow = { categoryId: string | null; _count: { _all: number } };
type Snapshot = {
  categories: FlatCategory[];
  counts: CountRow[];
  availablePhotos: CountRow[];
  allPhotos: CountRow[];
};

async function main() {
  const snapshot: Snapshot = JSON.parse(await readFile(
    process.argv[2] ?? "output/category-art/database-snapshot.json", "utf8",
  ));
  const counts = (rows: CountRow[]) => new Map(rows.flatMap((row) =>
    row.categoryId ? [[row.categoryId, row._count._all] as const] : []));
  const tree = buildCategoryTree(snapshot.categories, counts(snapshot.counts));
  const available = counts(snapshot.availablePhotos);
  const all = counts(snapshot.allPhotos);
  const generated: Record<string, string> = generatedCategoryArt;
  const categories: object[] = [];
  const missingArt: string[] = [];
  async function walk(node: CategoryTreeItem, parents: string[]): Promise<{ available: number; all: number }> {
    const path = [...parents, node.name];
    let availableCount = available.get(node.id) ?? 0;
    let allCount = all.get(node.id) ?? 0;
    for (const child of node.children) {
      const total = await walk(child, path);
      availableCount += total.available;
      allCount += total.all;
    }
    const art = CATEGORY_ART_BY_SLUG[node.slug] ?? null;
    const representativeChildren = [...node.children].sort((a, b) => b.productCount - a.productCount).slice(0, 5);
    if (art) {
      try { await access(`public${art}`); }
      catch { missingArt.push(art); }
    }
    categories.push({ id: node.id, slug: node.slug, name: node.name, path,
      depth: parents.length, leaf: node.children.length === 0, productCount: node.productCount,
      art, availablePhotoProducts: availableCount, allPhotoProducts: allCount,
      status: generated[node.slug] ? "illustration" : "needs-generation",
      photoAvailability: availableCount ? "available" : allCount ? "unavailable" : null,
      outputPath: `public/static/category-cards/${node.slug}.webp`,
      prompt: `Use case: product-mockup. Asset: catalog category illustration. Category: ${path.join(" > ")}. ` +
        (node.children.length ? `Represent this group with 2–3 recognizable objects from: ${representativeChildren.map((c) => c.name).join(", ")}. `
          : `Show a recognizable representative object of ${node.name}. `) +
        "Photorealistic premium studio product render, centered three-quarter view, entire objects visible with margins, " +
        "soft diffuse lighting, subtle cool blue and warm peach reflections matching a light glassmorphism storefront. " +
        "True transparent background. No words, logos, brands, watermarks, people or unrelated objects.",
    });
    return { available: availableCount, all: allCount };
  }
  for (const root of tree) await walk(root, []);
  const rows = categories as { status: string; depth: number; path: string[]; name: string; slug: string }[];
  rows.sort((a, b) => a.depth - b.depth || a.path.join(" / ").localeCompare(b.path.join(" / "), "ru"));
  const summary = Object.fromEntries(["illustration", "needs-generation"]
    .map((status) => [status, rows.filter((row) => row.status === status).length]));
  const report = { generatedAt: new Date().toISOString(), complete: true,
    activeCategories: snapshot.categories.length, storefrontCategories: rows.length, supplierPhotosExcluded: true,
    maxDepth: Math.max(...rows.map((row) => row.depth)), summary, missingArt,
    coverageComplete: summary["needs-generation"] === 0 && missingArt.length === 0, categories: rows };
  await mkdir("output/category-art", { recursive: true });
  await writeFile("output/category-art/manifest.json", JSON.stringify(report, null, 2));
  const gaps = rows.filter((row) => row.status === "needs-generation");
  await writeFile("output/category-art/coverage.md", `# Изображения каталога\n\n` +
    `Активных категорий: ${report.activeCategories}. В дереве витрины: ${rows.length}. Уровней: ${report.maxDepth + 1}.\n\n` +
    Object.entries(summary).map(([status, count]) => `- ${status}: ${count}`).join("\n") +
    `\n\n## Категории без изображения по текущему правилу\n\n` +
    gaps.map((row) => `- ${row.path.join(" → ")} (${row.slug}; ${row.status})`).join("\n") + "\n");
  console.log(JSON.stringify({ ...report, categories: undefined }, null, 2));
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
