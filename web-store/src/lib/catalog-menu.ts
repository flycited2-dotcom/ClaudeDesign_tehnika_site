import type { CategoryTreeItem } from "@/lib/catalog-tree";

export type CatalogMenuItem = {
  id: string;
  slug: string;
  name: string;
  productCount: number;
  hasChildren: boolean;
  description: string;
  image: string | null;
};

const MENU_DESCRIPTION_CHILDREN = 3;
const RU_NUMBER = new Intl.NumberFormat("ru-RU");

export function ruPlural(count: number, one: string, few: string, many: string): string {
  const n = Math.abs(count) % 100;
  const last = n % 10;
  if (n > 10 && n < 20) return many;
  if (last > 1 && last < 5) return few;
  if (last === 1) return one;
  return many;
}

/**
 * Short card description: the biggest subcategories ("Холодильники, Морозильные
 * камеры, Винные шкафы и ещё 9"), or the product count for a leaf category.
 */
export function describeMenuCategory(node: Pick<CategoryTreeItem, "productCount" | "children">): string {
  if (node.children.length === 0) {
    return `${RU_NUMBER.format(node.productCount)} ${ruPlural(node.productCount, "товар", "товара", "товаров")}`;
  }

  const biggest = [...node.children].sort((a, b) => b.productCount - a.productCount);
  const shown = biggest.slice(0, MENU_DESCRIPTION_CHILDREN).map((child) => child.name);
  const rest = biggest.length - shown.length;
  return rest > 0 ? `${shown.join(", ")} и ещё ${rest}` : shown.join(", ");
}

export function findCategoryTreeNode(nodes: CategoryTreeItem[], id: string): CategoryTreeItem | null {
  for (const node of nodes) {
    if (node.id === id) return node;
    const nested = findCategoryTreeNode(node.children, id);
    if (nested) return nested;
  }
  return null;
}

export function buildCatalogMenuItems(nodes: CategoryTreeItem[]): Omit<CatalogMenuItem, "image">[] {
  return nodes.map((node) => ({
    id: node.id,
    slug: node.slug,
    name: node.name,
    productCount: node.productCount,
    hasChildren: node.children.length > 0,
    description: describeMenuCategory(node),
  }));
}
