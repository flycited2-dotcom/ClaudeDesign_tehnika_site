type SearchTermLike = {
  term: string;
};

export const searchSeedQueries = [
  "холодильник",
  "стиральная машина",
  "посудомоечная машина",
  "телевизор",
  "смартфон",
  "ноутбук",
  "кондиционер",
  "пылесос",
  "микроволновая печь",
  "варочная панель",
  "духовой шкаф",
  "шуруповерт",
  "перфоратор",
  "газонокосилка",
  "детская коляска",
  "кабель",
  "офисное кресло",
  "шины",
] as const;

const aliases: Readonly<Record<string, string>> = {
  айфон: "iphone",
  болгарка: "ушм",
  кондер: "кондиционер",
  ноут: "ноутбук",
  посудомойка: "посудомоечная машина",
  стиралка: "стиральная машина",
  телек: "телевизор",
  телик: "телевизор",
  тв: "телевизор",
  холодос: "холодильник",
  шуруповёрт: "шуруповерт",
};

function cleanSearchTerm(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

export function normalizeSearchQuery(value: string | null | undefined): string {
  return cleanSearchTerm(value ?? "")
    .toLocaleLowerCase("ru-RU")
    .split(" ")
    .filter(Boolean)
    .map((word) => aliases[word] ?? word)
    .join(" ");
}

export function buildHeaderSearchQueries(terms: readonly SearchTermLike[], limit = 5): string[] {
  const output: string[] = [];
  const seenCanonical = new Set<string>();

  for (const candidate of [...terms.map((item) => item.term), ...searchSeedQueries]) {
    const displayTerm = cleanSearchTerm(candidate);
    const canonicalTerm = normalizeSearchQuery(displayTerm);
    if (canonicalTerm.length < 2 || seenCanonical.has(canonicalTerm)) continue;

    seenCanonical.add(canonicalTerm);
    output.push(displayTerm);
    if (output.length === limit) break;
  }

  return output;
}
