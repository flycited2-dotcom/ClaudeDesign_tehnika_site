import { describe, expect, it } from "vitest";
import { buildCategoryPath, buildCategoryTree, collectDescendantCategoryIds } from "@/lib/catalog-tree";

const categories = [
  { id: "root", parentId: null, name: "Компьютерная техника", slug: "computers" },
  { id: "laptops", parentId: "root", name: "Ноутбуки", slug: "laptops" },
  { id: "gaming", parentId: "laptops", name: "Игровые ноутбуки", slug: "gaming-laptops" },
  { id: "empty", parentId: null, name: "Пустой раздел", slug: "empty" },
  { id: "discount", parentId: null, name: "Уценка", slug: "discount" },
];

describe("collectDescendantCategoryIds", () => {
  it("includes a parent category and every nested child category", () => {
    expect(collectDescendantCategoryIds(categories, "root")).toEqual(["root", "laptops", "gaming"]);
  });
});

describe("buildCategoryTree", () => {
  it("rolls child product counts up to parents and hides empty/degraded roots", () => {
    const tree = buildCategoryTree(
      categories,
      new Map([
        ["gaming", 7],
        ["discount", 3],
      ]),
    );

    expect(tree).toHaveLength(1);
    expect(tree[0]).toMatchObject({
      id: "root",
      productCount: 7,
      children: [
        {
          id: "laptops",
          productCount: 7,
          children: [
            {
              id: "gaming",
              productCount: 7,
            },
          ],
        },
      ],
    });
  });
});

describe("buildCategoryPath", () => {
  it("returns a root-to-leaf category path for breadcrumbs", () => {
    expect(buildCategoryPath(categories, "gaming").map((category) => category.slug)).toEqual(["computers", "laptops", "gaming-laptops"]);
  });
});
