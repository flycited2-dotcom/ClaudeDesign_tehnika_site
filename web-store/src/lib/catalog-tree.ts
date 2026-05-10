import { isDegradedRetailName } from "@/lib/retail-products";

export type FlatCategory = {
  id: string;
  parentId: string | null;
  name: string;
  slug: string;
};

export type CategoryTreeItem = FlatCategory & {
  productCount: number;
  children: CategoryTreeItem[];
};

export function collectDescendantCategoryIds(categories: FlatCategory[], categoryId: string): string[] {
  const byParent = new Map<string, FlatCategory[]>();
  for (const category of categories) {
    if (!category.parentId) continue;
    byParent.set(category.parentId, [...(byParent.get(category.parentId) ?? []), category]);
  }

  const ids: string[] = [];
  const stack = [categoryId];
  while (stack.length) {
    const id = stack.pop();
    if (!id) continue;
    ids.push(id);
    for (const child of byParent.get(id) ?? []) {
      stack.push(child.id);
    }
  }

  return ids;
}

export function buildCategoryPath(categories: FlatCategory[], categoryId: string | null | undefined): FlatCategory[] {
  if (!categoryId) return [];

  const byId = new Map(categories.map((category) => [category.id, category]));
  const path: FlatCategory[] = [];
  const seen = new Set<string>();
  let current = byId.get(categoryId);

  while (current && !seen.has(current.id)) {
    path.push(current);
    seen.add(current.id);
    current = current.parentId ? byId.get(current.parentId) : undefined;
  }

  return path.reverse();
}

export function buildCategoryTree(categories: FlatCategory[], directProductCounts: Map<string, number>): CategoryTreeItem[] {
  const nodes = new Map<string, CategoryTreeItem>();
  const roots: CategoryTreeItem[] = [];

  for (const category of categories) {
    nodes.set(category.id, {
      ...category,
      productCount: directProductCounts.get(category.id) ?? 0,
      children: [],
    });
  }

  for (const node of nodes.values()) {
    const parent = node.parentId ? nodes.get(node.parentId) : null;
    if (parent) {
      parent.children.push(node);
    } else {
      roots.push(node);
    }
  }

  const byName = (left: CategoryTreeItem, right: CategoryTreeItem) => left.name.localeCompare(right.name, "ru");
  const rollup = (node: CategoryTreeItem): number => {
    node.children.sort(byName);
    node.productCount += node.children.reduce((sum, child) => sum + rollup(child), 0);
    node.children = node.children.filter((child) => child.productCount > 0 && !isDegradedRetailName(child.name));
    return node.productCount;
  };

  return roots
    .sort(byName)
    .filter((root) => rollup(root) > 0 && !isDegradedRetailName(root.name));
}
