import { normalizeSearchQuery } from "@/lib/search-vocabulary";

export function normalizeSuggestionQuery(rawQuery: string): string | null {
  const query = normalizeSearchQuery(rawQuery);
  return query.length >= 2 ? query : null;
}
