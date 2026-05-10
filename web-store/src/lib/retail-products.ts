import type { Prisma } from "@prisma/client";

export const degradedRetailNameTerms = [
  "поврежденная упаковка",
  "повреждённая упаковка",
  "поврежденный товар",
  "повреждённый товар",
  "уценка",
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
