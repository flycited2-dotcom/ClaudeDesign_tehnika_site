import { describe, expect, it } from "vitest";
import type { FlatCategory } from "@/lib/catalog-tree";
import { interleaveByTopCategory } from "@/lib/catalog-interleave";

// Tree:
//   tech (root) → laptops → gaming-laptops
//                 phones
//   home (root) → kitchen
//   garden (root)
const cats: FlatCategory[] = [
  { id: "tech", parentId: null, name: "Tech", slug: "tech" },
  { id: "laptops", parentId: "tech", name: "Laptops", slug: "laptops" },
  { id: "gaming", parentId: "laptops", name: "Gaming", slug: "gaming" },
  { id: "phones", parentId: "tech", name: "Phones", slug: "phones" },
  { id: "home", parentId: null, name: "Home", slug: "home" },
  { id: "kitchen", parentId: "home", name: "Kitchen", slug: "kitchen" },
  { id: "garden", parentId: null, name: "Garden", slug: "garden" },
];

type P = { id: string; categoryId: string | null };
const mk = (id: string, c: string | null): P => ({ id, categoryId: c });

describe("interleaveByTopCategory", () => {
  it("rotates across top-level categories", () => {
    const products: P[] = [
      mk("l1", "gaming"),
      mk("l2", "laptops"),
      mk("p1", "phones"),
      mk("k1", "kitchen"),
      mk("g1", "garden"),
    ];
    const out = interleaveByTopCategory(products, cats, 4);
    const tops = out.map((p) => p.id);
    // First three picks should each belong to a different top.
    expect(new Set(tops.slice(0, 3)).size).toBe(3);
  });

  it("respects maxPerCategory cap during RR phase", () => {
    const products: P[] = [
      mk("l1", "laptops"),
      mk("l2", "laptops"),
      mk("l3", "laptops"),
      mk("p1", "phones"),
      mk("k1", "kitchen"),
    ];
    // take=2 fits into "RR phase only" — no overflow needed.
    const out = interleaveByTopCategory(products, cats, 2, 1);
    expect(out.length).toBe(2);
    // One product per top-category.
    const topsSeen = new Set(out.map((p) => (p.categoryId === "kitchen" ? "home" : "tech")));
    expect(topsSeen.size).toBe(2);
  });

  it("preserves order inside a category bucket", () => {
    const products: P[] = [
      mk("a", "laptops"),
      mk("b", "phones"),
      mk("c", "laptops"),
      mk("d", "laptops"),
    ];
    const out = interleaveByTopCategory(products, cats, 4);
    const ids = out.map((p) => p.id);
    // a comes before c, c before d — within tech bucket.
    expect(ids.indexOf("a")).toBeLessThan(ids.indexOf("c"));
    expect(ids.indexOf("c")).toBeLessThan(ids.indexOf("d"));
  });

  it("appends products with unknown category at the end", () => {
    const products: P[] = [
      mk("o", null),
      mk("l", "laptops"),
      mk("p", "phones"),
    ];
    const out = interleaveByTopCategory(products, cats, 3);
    // l + p first (they have top tech, RR fills tech twice since only one top),
    // then o.
    expect(out[out.length - 1]?.id).toBe("o");
  });

  it("returns [] for empty input", () => {
    expect(interleaveByTopCategory([], cats, 10)).toEqual([]);
  });

  it("returns [] when take<=0", () => {
    expect(interleaveByTopCategory([mk("a", "laptops")], cats, 0)).toEqual([]);
  });

  it("falls back to overflow fill when cap blocks normal RR", () => {
    const products: P[] = [
      mk("l1", "laptops"),
      mk("l2", "laptops"),
      mk("k1", "kitchen"),
      mk("k2", "kitchen"),
    ];
    // 2 top-cats × max 1 = 2 items via RR, but take=4 → overflow fill.
    const out = interleaveByTopCategory(products, cats, 4, 1);
    expect(out.length).toBe(4);
  });

  it("is a permutation (no dup, no loss) when take>=length and no cap — the paginated-pool contract", () => {
    const products: P[] = [
      mk("l1", "laptops"),
      mk("l2", "laptops"),
      mk("l3", "laptops"),
      mk("p1", "phones"),
      mk("k1", "kitchen"),
      mk("g1", "garden"),
      mk("o1", null),
      mk("o2", "unknown-cat"),
    ];
    const out = interleaveByTopCategory(products, cats, products.length, Number.POSITIVE_INFINITY);
    expect(out.length).toBe(products.length);
    expect(new Set(out.map((p) => p.id)).size).toBe(products.length);
    expect(out.map((p) => p.id).sort()).toEqual(products.map((p) => p.id).sort());
  });
});
