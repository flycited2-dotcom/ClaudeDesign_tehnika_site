import type { Prisma } from "@prisma/client";

export const degradedRetailNameTerms = [
  "поврежденная упаковка",
  "повреждённая упаковка",
  "поврежденный товар",
  "повреждённый товар",
  "уценка",
  "дисконт",
  "витринный образец",
  "б/у",
  "некондиция",
];

export function isDegradedRetailName(name: string | null | undefined): boolean {
  const normalized = (name ?? "").toLocaleLowerCase("ru-RU");
  return degradedRetailNameTerms.some((term) => normalized.includes(term));
}

export function normalRetailNameWhere(): Prisma.ProductWhereInput {
  return {
    AND: degradedRetailNameTerms.map((term) => ({
      AND: [
        { NOT: { supplierName: { contains: term, mode: "insensitive" } } },
        {
          OR: [{ name: null }, { NOT: { name: { contains: term, mode: "insensitive" } } }],
        },
      ],
    })),
  };
}

// B (Iter 64): аксессуары/запчасти «X для телевизора» (подсветка, салфетки,
// кронштейн, разветвитель…) содержат название типа и всплывают в поиске
// основного товара, засоряя выдачу. Маркеры — слова, по которым товар
// распознаётся как аксессуар/запчасть/расходник.
export const searchAccessoryMarkers = [
  "подсветк",
  "салфетк",
  "кронштейн",
  "разветвитель",
  "держатель",
  "чехол",
  "пульт ду",
  "шлейф",
  "матрица для",
  "инвертор для",
  "блок питания для",
  "переходник",
  "удлинитель",
  "запчаст",
  "насадк",
  "мешк для",
];

/**
 * Если пользователь ищет ОСНОВНОЙ тип товара (запрос не содержит маркер
 * аксессуара), вырезаем из выдачи товары-аксессуары/запчасти, чтобы они не
 * вытесняли реальные товары. Если же запрос сам про аксессуар («салфетки»,
 * «кронштейн») — возвращаем null (ничего не фильтруем).
 */
export function searchAccessoryExclusionWhere(query: string | null | undefined): Prisma.ProductWhereInput | null {
  const q = (query ?? "").toLocaleLowerCase("ru-RU");
  if (!q.trim()) return null;
  if (searchAccessoryMarkers.some((marker) => q.includes(marker))) return null;

  return {
    AND: searchAccessoryMarkers.map((term) => ({
      AND: [
        { NOT: { supplierName: { contains: term, mode: "insensitive" } } },
        {
          OR: [{ name: null }, { NOT: { name: { contains: term, mode: "insensitive" } } }],
        },
      ],
    })),
  };
}
