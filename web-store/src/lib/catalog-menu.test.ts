import { describe, expect, it } from "vitest";
import { buildCatalogMenuItems, describeMenuCategory, findCategoryTreeNode, ruPlural } from "@/lib/catalog-menu";
import type { CategoryTreeItem } from "@/lib/catalog-tree";

function node(id: string, name: string, productCount: number, children: CategoryTreeItem[] = []): CategoryTreeItem {
  return { id, parentId: null, name, slug: id, productCount, children };
}

describe("ruPlural", () => {
  it("picks the right Russian form", () => {
    expect(ruPlural(1, "товар", "товара", "товаров")).toBe("товар");
    expect(ruPlural(2, "товар", "товара", "товаров")).toBe("товара");
    expect(ruPlural(5, "товар", "товара", "товаров")).toBe("товаров");
    expect(ruPlural(11, "товар", "товара", "товаров")).toBe("товаров");
    expect(ruPlural(21, "товар", "товара", "товаров")).toBe("товар");
    expect(ruPlural(112, "товар", "товара", "товаров")).toBe("товаров");
  });
});

describe("describeMenuCategory", () => {
  it("lists the three biggest children and counts the rest", () => {
    const parent = node("p", "Бытовая техника", 100, [
      node("a", "Мелкая", 5),
      node("b", "Холодильники", 50),
      node("c", "Стиральные машины", 30),
      node("d", "Плиты", 10),
      node("e", "Вытяжки", 5),
    ]);
    expect(describeMenuCategory(parent)).toBe("Холодильники, Стиральные машины, Плиты и ещё 2");
  });

  it("omits the tail when everything fits", () => {
    const parent = node("p", "X", 3, [node("a", "Один", 2), node("b", "Два", 1)]);
    expect(describeMenuCategory(parent)).toBe("Один, Два");
  });

  it("shows the product count for a leaf", () => {
    expect(describeMenuCategory(node("l", "Лист", 1234))).toBe("1 234 товара");
    expect(describeMenuCategory(node("l", "Лист", 21))).toBe("21 товар");
  });
});

describe("buildCatalogMenuItems / findCategoryTreeNode", () => {
  const tree = [node("r", "Корень", 3, [node("c", "Дочерняя", 3)])];

  it("maps nodes with hasChildren flag", () => {
    const items = buildCatalogMenuItems(tree);
    expect(items).toEqual([
      { id: "r", slug: "r", name: "Корень", productCount: 3, hasChildren: true, description: "Дочерняя" },
    ]);
  });

  it("finds nested nodes", () => {
    expect(findCategoryTreeNode(tree, "c")?.name).toBe("Дочерняя");
    expect(findCategoryTreeNode(tree, "zzz")).toBeNull();
  });
});
