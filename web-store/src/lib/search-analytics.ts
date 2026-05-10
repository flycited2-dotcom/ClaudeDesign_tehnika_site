import { prisma } from "@/lib/db";

export type PopularSearchTerm = {
  term: string;
  count: number;
  lastSeenAt: string;
};

export const SEARCH_ANALYTICS_SETTING_KEY = "SEARCH_POPULAR_TERMS_V1";

const DEFAULT_STORE_LIMIT = 50;

export function normalizeSearchTerm(term: string | null | undefined): string | null {
  const normalized = (term ?? "").replace(/\s+/g, " ").trim().toLocaleLowerCase("ru-RU");
  if (normalized.length < 2) {
    return null;
  }

  return normalized.slice(0, 120);
}

export function parseSearchTermCounts(rawValue: string | null | undefined): PopularSearchTerm[] {
  if (!rawValue) {
    return [];
  }

  try {
    const parsed = JSON.parse(rawValue) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .flatMap((item): PopularSearchTerm[] => {
        if (!item || typeof item !== "object") {
          return [];
        }

        const row = item as Record<string, unknown>;
        const term = typeof row.term === "string" ? normalizeSearchTerm(row.term) : null;
        const count = typeof row.count === "number" && Number.isFinite(row.count) ? Math.max(1, Math.floor(row.count)) : 0;
        const lastSeenAt = typeof row.lastSeenAt === "string" ? row.lastSeenAt : "";
        const lastSeenDate = new Date(lastSeenAt);

        if (!term || !count || Number.isNaN(lastSeenDate.getTime())) {
          return [];
        }

        return [{ term, count, lastSeenAt: lastSeenDate.toISOString() }];
      })
      .sort(sortPopularTerms);
  } catch {
    return [];
  }
}

export function buildSearchTermCounts(
  rawValue: string | null | undefined,
  rawTerm: string,
  now = new Date(),
  limit = DEFAULT_STORE_LIMIT,
): PopularSearchTerm[] {
  const term = normalizeSearchTerm(rawTerm);
  const terms = parseSearchTermCounts(rawValue);
  if (!term) {
    return terms.slice(0, limit);
  }

  const current = terms.find((item) => item.term === term);
  if (current) {
    current.count += 1;
    current.lastSeenAt = now.toISOString();
  } else {
    terms.push({ term, count: 1, lastSeenAt: now.toISOString() });
  }

  return terms.sort(sortPopularTerms).slice(0, limit);
}

export async function recordSearchTerm(rawTerm: string): Promise<void> {
  if (!normalizeSearchTerm(rawTerm)) {
    return;
  }

  const current = await prisma.setting.findUnique({
    where: { key: SEARCH_ANALYTICS_SETTING_KEY },
    select: { value: true },
  });
  const nextTerms = buildSearchTermCounts(current?.value, rawTerm, new Date(), DEFAULT_STORE_LIMIT);

  await prisma.setting.upsert({
    where: { key: SEARCH_ANALYTICS_SETTING_KEY },
    create: { key: SEARCH_ANALYTICS_SETTING_KEY, value: JSON.stringify(nextTerms) },
    update: { value: JSON.stringify(nextTerms) },
  });
}

export async function getPopularSearchTerms(limit = 10): Promise<PopularSearchTerm[]> {
  const current = await prisma.setting.findUnique({
    where: { key: SEARCH_ANALYTICS_SETTING_KEY },
    select: { value: true },
  });

  return parseSearchTermCounts(current?.value).slice(0, limit);
}

function sortPopularTerms(a: PopularSearchTerm, b: PopularSearchTerm): number {
  if (b.count !== a.count) {
    return b.count - a.count;
  }

  const recency = new Date(b.lastSeenAt).getTime() - new Date(a.lastSeenAt).getTime();
  if (recency !== 0) {
    return recency;
  }

  return a.term.localeCompare(b.term, "ru-RU");
}
