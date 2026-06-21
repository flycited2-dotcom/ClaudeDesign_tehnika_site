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
 * Ищет ли пользователь сам аксессуар (запрос содержит маркер) — тогда вырезать
 * аксессуары НЕ нужно.
 */
export function isAccessorySearchQuery(query: string | null | undefined): boolean {
  const q = (query ?? "").toLocaleLowerCase("ru-RU");
  return searchAccessoryMarkers.some((marker) => q.includes(marker));
}

/**
 * Является ли товар аксессуаром/запчастью по названию (маркер в name или
 * supplierName).
 *
 * ВАЖНО: применяется ПОСТ-фильтром в приложении, НЕ в SQL WHERE. `NOT LIKE` по
 * 16 маркерам сводит на нет trigram-индекс поиска (негация → Seq Scan) и
 * возвращает 90с cold-start; in-memory фильтр на странице результатов дёшев и
 * сохраняет быстрый поиск.
 */
export function isAccessoryProductName(name: string | null | undefined, supplierName: string | null | undefined): boolean {
  const text = `${name ?? ""} ${supplierName ?? ""}`.toLocaleLowerCase("ru-RU");
  return searchAccessoryMarkers.some((marker) => text.includes(marker));
}
