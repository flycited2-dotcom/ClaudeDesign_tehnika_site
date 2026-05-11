import type { FlatCategory } from "@/lib/catalog-tree";

export type CatalogBreadcrumbItem = {
  label: string;
  href?: string;
};

export function truncateBreadcrumbLabel(label: string, max = 32): string {
  if (label.length <= max) return label;
  return label.slice(0, Math.max(1, max - 1)).trimEnd() + "…";
}

export function buildCatalogBreadcrumbItems(categoryPath: FlatCategory[], currentLabel?: string | null): CatalogBreadcrumbItem[] {
  return [
    { label: "Главная", href: "/" },
    { label: "Каталог", href: "/catalog" },
    ...categoryPath.map((category) => ({
      label: category.name,
      href: `/catalog/${category.slug}`,
    })),
    ...(currentLabel ? [{ label: currentLabel }] : []),
  ];
}
