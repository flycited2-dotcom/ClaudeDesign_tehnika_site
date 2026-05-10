import type { Prisma } from "@prisma/client";

export const catalogSpecFilterValues = [
  "ac_split_system",
  "ac_inverter",
  "air_purification",
  "daily_capacity",
  "daily_capacity_20_plus",
  "daily_capacity_50_plus",
  "tank_volume",
  "tank_volume_3_plus",
  "fridge_no_frost",
  "fridge_two_chamber",
  "freezer",
  "tv_4k",
  "tv_full_hd",
  "tv_smart",
  "tv_55_plus",
  "tv_65_plus",
  "storage_ssd",
  "storage_512_plus",
  "computer_ram",
  "ram_16_plus",
  "garden_snow_blower",
  "garden_lawn_mower",
  "garden_motoblock",
  "garden_trimmer",
  "garden_petrol",
  "garden_battery",
  "laptop",
  "gaming",
  "washer_narrow",
  "washer_inverter",
  "washer_front_load",
] as const;

export type CatalogSpecFilterValue = (typeof catalogSpecFilterValues)[number];

export type CatalogSpecFilterOption = {
  key: CatalogSpecFilterValue;
  label: string;
  groupLabel: string;
  count?: number;
};

type CatalogSpecFilterDefinition = CatalogSpecFilterOption & {
  categoryHints: string[];
  searchTerms: string[];
  attributeFilters?: Prisma.ProductWhereInput[];
};

const specFilterDefinitions: CatalogSpecFilterDefinition[] = [
  {
    key: "ac_split_system",
    label: "Сплит-системы",
    groupLabel: "Климат",
    categoryHints: ["кондиционер", "сплит", "климат"],
    searchTerms: ["сплит", "split"],
  },
  {
    key: "ac_inverter",
    label: "Инверторные",
    groupLabel: "Климат",
    categoryHints: ["кондиционер", "сплит", "климат"],
    searchTerms: ["инвертор", "inverter"],
  },
  {
    key: "air_purification",
    label: "Очистка воздуха",
    groupLabel: "Климат",
    categoryHints: ["климат", "воздух", "очистител", "увлажнител", "осушител"],
    searchTerms: ["очист", "фильтр", "иониз"],
  },
  {
    key: "daily_capacity",
    label: "Производительность, л/сутки",
    groupLabel: "Климат",
    categoryHints: ["осушител", "климат", "воздух"],
    searchTerms: ["л/сут", "л / сут"],
    attributeFilters: [
      {
        attributes: {
          some: {
            key: "daily_capacity",
          },
        },
      },
    ],
  },
  {
    key: "daily_capacity_20_plus",
    label: "От 20 л/сутки",
    groupLabel: "Климат",
    categoryHints: ["осушител", "климат", "воздух"],
    searchTerms: [],
    attributeFilters: [
      {
        attributes: {
          some: {
            key: "daily_capacity",
            numericValue: {
              gte: 20,
            },
          },
        },
      },
    ],
  },
  {
    key: "daily_capacity_50_plus",
    label: "От 50 л/сутки",
    groupLabel: "Климат",
    categoryHints: ["осушител", "климат", "воздух"],
    searchTerms: [],
    attributeFilters: [
      {
        attributes: {
          some: {
            key: "daily_capacity",
            numericValue: {
              gte: 50,
            },
          },
        },
      },
    ],
  },
  {
    key: "tank_volume",
    label: "Объем бака, л",
    groupLabel: "Климат",
    categoryHints: ["осушител", "увлажнител", "мойк", "воздух"],
    searchTerms: ["бак", "резервуар"],
    attributeFilters: [
      {
        attributes: {
          some: {
            key: "tank_volume",
          },
        },
      },
    ],
  },
  {
    key: "tank_volume_3_plus",
    label: "Бак от 3 л",
    groupLabel: "Климат",
    categoryHints: ["осушител", "увлажнител", "мойк", "воздух"],
    searchTerms: [],
    attributeFilters: [
      {
        attributes: {
          some: {
            key: "tank_volume",
            numericValue: {
              gte: 3,
            },
          },
        },
      },
    ],
  },
  {
    key: "fridge_no_frost",
    label: "No Frost",
    groupLabel: "Холодильники",
    categoryHints: ["холодильник", "морозильник"],
    searchTerms: ["no frost", "nofrost", "ноу фрост"],
  },
  {
    key: "fridge_two_chamber",
    label: "Двухкамерные",
    groupLabel: "Холодильники",
    categoryHints: ["холодильник"],
    searchTerms: ["двухкамер", "2-камер", "2 камер"],
  },
  {
    key: "freezer",
    label: "Морозильники",
    groupLabel: "Холодильники",
    categoryHints: ["холодильник", "морозильник"],
    searchTerms: ["морозиль", "freezer"],
  },
  {
    key: "tv_4k",
    label: "4K / UHD",
    groupLabel: "Телевизоры",
    categoryHints: ["телевиз", "тв", "видеотехника"],
    searchTerms: ["4k", "4 k", "uhd"],
    attributeFilters: [
      {
        attributes: {
          some: {
            key: "resolution",
            normalizedValue: {
              in: ["4k", "4k_uhd"],
            },
          },
        },
      },
    ],
  },
  {
    key: "tv_full_hd",
    label: "Full HD",
    groupLabel: "Телевизоры",
    categoryHints: ["телевиз", "тв", "видеотехника"],
    searchTerms: ["full hd", "fhd"],
    attributeFilters: [
      {
        attributes: {
          some: {
            key: "resolution",
            normalizedValue: "full_hd",
          },
        },
      },
    ],
  },
  {
    key: "tv_smart",
    label: "Smart TV",
    groupLabel: "Телевизоры",
    categoryHints: ["телевиз", "тв", "видеотехника"],
    searchTerms: ["smart", "смарт"],
    attributeFilters: [
      {
        attributes: {
          some: {
            key: "smart_tv",
            normalizedValue: "yes",
          },
        },
      },
    ],
  },
  {
    key: "tv_55_plus",
    label: "От 55 дюймов",
    groupLabel: "Телевизоры",
    categoryHints: ["телевиз", "тв", "видеотехника"],
    searchTerms: [],
    attributeFilters: [
      {
        attributes: {
          some: {
            key: "screen_diagonal",
            numericValue: {
              gte: 55,
            },
          },
        },
      },
    ],
  },
  {
    key: "tv_65_plus",
    label: "От 65 дюймов",
    groupLabel: "Телевизоры",
    categoryHints: ["телевиз", "тв", "видеотехника"],
    searchTerms: [],
    attributeFilters: [
      {
        attributes: {
          some: {
            key: "screen_diagonal",
            numericValue: {
              gte: 65,
            },
          },
        },
      },
    ],
  },
  {
    key: "storage_ssd",
    label: "SSD",
    groupLabel: "Компьютеры",
    categoryHints: ["ноутбук", "компьют", "моноблок", "пк", "накопител"],
    searchTerms: ["ssd"],
    attributeFilters: [
      {
        attributes: {
          some: {
            key: "storage_type",
            normalizedValue: "ssd",
          },
        },
      },
    ],
  },
  {
    key: "storage_512_plus",
    label: "Накопитель от 512 ГБ",
    groupLabel: "Компьютеры",
    categoryHints: ["ноутбук", "компьют", "моноблок", "пк", "накопител"],
    searchTerms: [],
    attributeFilters: [
      {
        attributes: {
          some: {
            key: "storage_capacity",
            numericValue: {
              gte: 512,
            },
          },
        },
      },
    ],
  },
  {
    key: "computer_ram",
    label: "Оперативная память",
    groupLabel: "Компьютеры",
    categoryHints: ["ноутбук", "компьют", "моноблок", "пк", "планшет"],
    searchTerms: ["ram", "оператив"],
    attributeFilters: [
      {
        attributes: {
          some: {
            key: "ram",
          },
        },
      },
    ],
  },
  {
    key: "ram_16_plus",
    label: "RAM от 16 ГБ",
    groupLabel: "Компьютеры",
    categoryHints: ["ноутбук", "компьют", "моноблок", "пк", "планшет"],
    searchTerms: [],
    attributeFilters: [
      {
        attributes: {
          some: {
            key: "ram",
            numericValue: {
              gte: 16,
            },
          },
        },
      },
    ],
  },
  {
    key: "garden_snow_blower",
    label: "Снегоуборщики",
    groupLabel: "Садовая техника",
    categoryHints: ["дача", "сад", "огород", "садовая", "снегоубор"],
    searchTerms: ["снегоубор", "snow"],
  },
  {
    key: "garden_lawn_mower",
    label: "Газонокосилки",
    groupLabel: "Садовая техника",
    categoryHints: ["дача", "сад", "огород", "садовая", "газонокос"],
    searchTerms: ["газонокос", "lawn"],
  },
  {
    key: "garden_motoblock",
    label: "Мотоблоки",
    groupLabel: "Садовая техника",
    categoryHints: ["дача", "сад", "огород", "садовая", "мотоблок"],
    searchTerms: ["мотоблок"],
  },
  {
    key: "garden_trimmer",
    label: "Триммеры",
    groupLabel: "Садовая техника",
    categoryHints: ["дача", "сад", "огород", "садовая", "триммер"],
    searchTerms: ["триммер", "коса"],
  },
  {
    key: "garden_petrol",
    label: "Бензиновые",
    groupLabel: "Садовая техника",
    categoryHints: ["дача", "сад", "огород", "садовая", "бензин"],
    searchTerms: ["бензин"],
  },
  {
    key: "garden_battery",
    label: "Аккумуляторные",
    groupLabel: "Садовая техника",
    categoryHints: ["дача", "сад", "огород", "садовая", "аккумулятор"],
    searchTerms: ["аккумулятор", "акб"],
  },
  {
    key: "laptop",
    label: "Ноутбуки",
    groupLabel: "Компьютеры",
    categoryHints: ["ноутбук", "компьют", "планшет"],
    searchTerms: ["ноутбук", "laptop"],
  },
  {
    key: "gaming",
    label: "Игровые",
    groupLabel: "Компьютеры",
    categoryHints: ["ноутбук", "компьют", "пк", "приставк"],
    searchTerms: ["игров", "gaming", "game"],
  },
  {
    key: "washer_narrow",
    label: "Узкие",
    groupLabel: "Стиральные машины",
    categoryHints: ["стираль", "сушиль"],
    searchTerms: ["узк", "slim"],
  },
  {
    key: "washer_inverter",
    label: "Инверторные",
    groupLabel: "Стиральные машины",
    categoryHints: ["стираль", "сушиль"],
    searchTerms: ["инвертор", "inverter"],
  },
  {
    key: "washer_front_load",
    label: "Фронтальная загрузка",
    groupLabel: "Стиральные машины",
    categoryHints: ["стираль", "сушиль"],
    searchTerms: ["фронтал", "front"],
  },
];

const specFilterByKey = new Map(specFilterDefinitions.map((definition) => [definition.key, definition]));
const defaultSpecFilterValues: CatalogSpecFilterValue[] = [
  "tv_4k",
  "tv_smart",
  "storage_ssd",
  "fridge_no_frost",
  "ac_inverter",
  "washer_narrow",
];

export function isCatalogSpecFilterValue(value: string): value is CatalogSpecFilterValue {
  return specFilterByKey.has(value as CatalogSpecFilterValue);
}

export function normalizeCatalogSpecFilterValues(values: Array<string | null | undefined>): CatalogSpecFilterValue[] {
  const normalized: CatalogSpecFilterValue[] = [];

  for (const value of values) {
    if (value && isCatalogSpecFilterValue(value) && !normalized.includes(value)) {
      normalized.push(value);
    }
  }

  return normalized;
}

export function getCatalogSpecFilterOptions({
  categoryName,
  activeFilters = [],
}: {
  categoryName?: string | null;
  activeFilters?: CatalogSpecFilterValue[];
}): CatalogSpecFilterOption[] {
  const normalizedCategory = categoryName?.toLocaleLowerCase("ru-RU") ?? "";
  const active = new Set(activeFilters);
  const matchesCategory = (definition: CatalogSpecFilterDefinition) => {
    return normalizedCategory ? definition.categoryHints.some((hint) => normalizedCategory.includes(hint)) : false;
  };

  const options = specFilterDefinitions.filter((definition) => matchesCategory(definition) || active.has(definition.key));
  const visibleOptions = options.length || normalizedCategory
    ? options
    : defaultSpecFilterValues.flatMap((value) => {
        const definition = specFilterByKey.get(value);
        return definition ? [definition] : [];
      });

  return visibleOptions.map(({ key, label, groupLabel }) => ({ key, label, groupLabel }));
}

export function getCatalogSpecFilterLabel(value: CatalogSpecFilterValue): string {
  return specFilterByKey.get(value)?.label ?? value;
}

export function attachCatalogSpecFilterCounts(
  options: CatalogSpecFilterOption[],
  counts: Map<CatalogSpecFilterValue, number>,
  activeFilters: CatalogSpecFilterValue[] = [],
): CatalogSpecFilterOption[] {
  const active = new Set(activeFilters);

  return options.map((option) => ({
    ...option,
    count: counts.get(option.key) ?? 0,
  })).filter((option) => option.count > 0 || active.has(option.key));
}

export function buildCatalogSpecFilterWhere(values: CatalogSpecFilterValue[]): Prisma.ProductWhereInput {
  const filters = normalizeCatalogSpecFilterValues(values);
  if (!filters.length) {
    return {};
  }

  return {
    AND: filters.flatMap((value) => {
      const definition = specFilterByKey.get(value);
      if (!definition) return [];

      return [
        {
          OR: [
            ...(definition.attributeFilters ?? []),
            ...definition.searchTerms.flatMap((term) => [
              { name: { contains: term, mode: "insensitive" as const } },
              { supplierName: { contains: term, mode: "insensitive" as const } },
            ]),
          ],
        },
      ];
    }),
  };
}
