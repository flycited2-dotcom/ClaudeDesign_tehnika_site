import { describe, expect, it } from "vitest";
import { buildCatalogBreadcrumbItems } from "@/lib/catalog-breadcrumbs";

describe("buildCatalogBreadcrumbItems", () => {
  it("builds root-to-leaf links for catalog categories", () => {
    expect(
      buildCatalogBreadcrumbItems([
        { id: "root", parentId: null, name: "Бытовая техника", slug: "bytovaya-tehnika" },
        { id: "leaf", parentId: "root", name: "Сушильные машины", slug: "sushilnye-mashiny-18029" },
      ]),
    ).toEqual([
      { label: "Главная", href: "/" },
      { label: "Каталог", href: "/catalog" },
      { label: "Бытовая техника", href: "/catalog/bytovaya-tehnika" },
      { label: "Сушильные машины", href: "/catalog/sushilnye-mashiny-18029" },
    ]);
  });

  it("can append the current product without making it a link", () => {
    expect(buildCatalogBreadcrumbItems([], "Сушильная машина Bosch")).toEqual([
      { label: "Главная", href: "/" },
      { label: "Каталог", href: "/catalog" },
      { label: "Сушильная машина Bosch" },
    ]);
  });
});
