import type { CatalogQuery } from "@/lib/catalog";

export type CatalogFilterLanding = {
  slug: string;
  title: string;
  heading: string;
  description: string;
  query: CatalogQuery;
};

const catalogFilterLandings: CatalogFilterLanding[] = [
  {
    slug: "holodilniki-no-frost",
    title: "Холодильники No Frost купить с доставкой",
    heading: "Холодильники No Frost",
    description: "Подборка холодильников с системой No Frost, доставкой под заказ 7 дней и подтверждением заказа менеджером.",
    query: {
      categorySlug: "holodilniki-9841",
      available: true,
      attributeFilters: [{ key: "fridge_no_frost", normalizedValue: "yes" }],
    },
  },
  {
    slug: "televizory-ot-55-dyuymov",
    title: "Телевизоры от 55 дюймов купить с доставкой",
    heading: "Телевизоры от 55 дюймов",
    description: "Большие телевизоры для дома и офиса: диагональ от 55 дюймов, наличие у поставщика и доставка под заказ 7 дней.",
    query: {
      categorySlug: "televizory-9758",
      available: true,
      attributeRangeFilters: [{ key: "screen_diagonal", min: 55 }],
    },
  },
  {
    slug: "noutbuki-16-gb-ram",
    title: "Ноутбуки от 16 ГБ оперативной памяти",
    heading: "Ноутбуки от 16 ГБ RAM",
    description: "Ноутбуки и компьютерная техника с оперативной памятью от 16 ГБ для работы, учебы и бизнеса.",
    query: {
      categorySlug: "noutbuki-9977",
      available: true,
      attributeRangeFilters: [{ key: "ram", min: 16 }],
    },
  },
  {
    slug: "ssd-ot-512-gb",
    title: "Техника с SSD от 512 ГБ купить с доставкой",
    heading: "SSD от 512 ГБ",
    description: "Подборка товаров с SSD-накопителем от 512 ГБ и доставкой под заказ 7 дней.",
    query: {
      categorySlug: "vnutrennie-tverdotelnye-nakopiteli-ssd-9989",
      available: true,
      attributeFilters: [{ key: "storage_type", normalizedValue: "ssd" }],
      attributeRangeFilters: [{ key: "storage_capacity", min: 512 }],
    },
  },
  {
    slug: "sushilnye-mashiny-ot-8-kg",
    title: "Сушильные машины от 8 кг купить с доставкой",
    heading: "Сушильные машины от 8 кг",
    description: "Сушильные машины с загрузкой от 8 кг, актуальной ценой и доставкой под заказ 7 дней.",
    query: {
      categorySlug: "sushilnye-mashiny-18029",
      available: true,
      attributeRangeFilters: [{ key: "load_capacity", min: 8 }],
    },
  },
  {
    slug: "kabel-ot-25-mm2",
    title: "Кабель сечением от 2.5 мм² купить с доставкой",
    heading: "Кабель от 2.5 мм²",
    description: "Кабель и провод с сечением от 2.5 мм² для ремонта, монтажа и строительства.",
    query: {
      categorySlug: "kabeli-i-provoda-dlya-stroitelstva-i-remonta-10560",
      available: true,
      attributeRangeFilters: [{ key: "cable_section", min: 2.5 }],
    },
  },
];

export function listCatalogFilterLandings(): CatalogFilterLanding[] {
  return [...catalogFilterLandings];
}

export function getCatalogFilterLanding(slug: string): CatalogFilterLanding | null {
  return catalogFilterLandings.find((landing) => landing.slug === slug) ?? null;
}
