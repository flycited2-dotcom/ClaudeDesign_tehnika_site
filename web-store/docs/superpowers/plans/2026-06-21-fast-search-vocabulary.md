# Fast Search Vocabulary Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (- [ ]) syntax for tracking.

**Goal:** Make whole-catalog search recognize common Russian colloquial product names and keep popular search results and suggestions warm without external services.

**Architecture:** A local vocabulary module canonicalizes aliases and provides a small cross-category seed list. Search pages and product suggestions use canonical input, so aliases share cache entries. RootLayout combines recorded search terms with the seed list for the client header, while a sequential VPS warmup script primes both search result and suggestion caches.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Prisma, Next unstable_cache, Vitest, Bash, Node fetch.

---

## File structure

| File | Responsibility |
| --- | --- |
| Create: src/lib/search-vocabulary.ts | Alias map, seed queries, canonicalization, and de-duplicated header terms. |
| Create: src/lib/search-vocabulary.test.ts | Unit coverage for aliases, models, and displayed-term merging. |
| Create: src/lib/search-suggestions.ts | Shared canonical query guard for the suggestion endpoint. |
| Create: src/lib/search-suggestions.test.ts | Unit coverage for the endpoint’s canonical input contract. |
| Modify: src/app/search/page.tsx | Use canonical input for catalog lookup while retaining the typed phrase in the UI and analytics. |
| Modify: src/app/api/search/suggest/route.ts | Use canonical input and a five-minute cache for product suggestions. |
| Modify: src/app/layout.tsx | Read recorded terms on the server and pass merged header terms to the client header. |
| Modify: src/components/site-header.tsx | Accept header terms and forward them to both desktop and mobile search controls. |
| Modify: src/components/header-search-control.tsx | Render supplied popular terms instead of a hard-coded local constant. |
| Create: src/lib/search-warmup.ts | Testable sequential requests for result and suggestion cache warming. |
| Create: src/lib/search-warmup.test.ts | Unit coverage for generated URLs and failure behavior. |
| Create: scripts/warm-search.ts | Node entry point that warms the shared seed list. |
| Create: scripts/warm_search.sh | flock-protected cron wrapper for the Node warmup entry point. |
| Modify: deploy/crontab.example | Install the search warmup every eight minutes. |

### Task 1: Local vocabulary and header-term selection

**Files:**
- Create: src/lib/search-vocabulary.ts
- Create: src/lib/search-vocabulary.test.ts

- [ ] **Step 1: Write the failing vocabulary tests**

~~~ts
import { describe, expect, it } from "vitest";
import { buildHeaderSearchQueries, normalizeSearchQuery, searchSeedQueries } from "@/lib/search-vocabulary";

describe("normalizeSearchQuery", () => {
  it("maps colloquial product aliases without changing a model", () => {
    expect(normalizeSearchQuery("  Телик   Samsung QE55C  ")).toBe("телевизор samsung qe55c");
  });

  it("leaves unknown product words and article-like fragments intact", () => {
    expect(normalizeSearchQuery("Makita DHP486Z")).toBe("makita dhp486z");
  });
});

describe("buildHeaderSearchQueries", () => {
  it("keeps recorded terms first and removes canonical duplicates from seed queries", () => {
    expect(
      buildHeaderSearchQueries([{ term: "телик" }, { term: "Bosch" }], 5),
    ).toEqual(["телик", "Bosch", ...searchSeedQueries.filter((term) => term !== "телевизор").slice(0, 3)]);
  });
});
~~~

- [ ] **Step 2: Run the test and verify it fails because the module does not exist**

Run: npm test -- src/lib/search-vocabulary.test.ts

Expected: FAIL with a module-not-found error for @/lib/search-vocabulary.

- [ ] **Step 3: Implement the smallest vocabulary module**

Create src/lib/search-vocabulary.ts with the following complete implementation. Keep the seed list at 18 wide product categories so warmup stays bounded while spanning appliance, electronics, computer, climate, tool, garden, children, auto, furniture, and cable sections.

~~~ts
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
  холодильник: "холодильник",
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
~~~

- [ ] **Step 4: Run the vocabulary test and verify it passes**

Run: npm test -- src/lib/search-vocabulary.test.ts

Expected: PASS with three tests.

- [ ] **Step 5: Commit the vocabulary unit**

~~~bash
git add src/lib/search-vocabulary.ts src/lib/search-vocabulary.test.ts
git commit -m "feat: add local search vocabulary"
~~~

### Task 2: Canonical search and cached product suggestions

**Files:**
- Create: src/lib/search-suggestions.ts
- Create: src/lib/search-suggestions.test.ts
- Modify: src/app/search/page.tsx
- Modify: src/app/api/search/suggest/route.ts

- [ ] **Step 1: Read the installed Next cache guide before adding the cache**

Run: rg --files node_modules/next/dist/docs | rg "unstable_cache|cache"

Read the matching unstable_cache reference and use its installed-version guidance. The cache callback must not read request headers, cookies, or the Request object.

- [ ] **Step 2: Write the failing canonical-input test**

~~~ts
import { describe, expect, it } from "vitest";
import { normalizeSuggestionQuery } from "@/lib/search-suggestions";

describe("normalizeSuggestionQuery", () => {
  it("uses the same canonical form as the full search", () => {
    expect(normalizeSuggestionQuery("ТВ LG OLED")).toBe("телевизор lg oled");
  });

  it("rejects a query that remains shorter than two characters", () => {
    expect(normalizeSuggestionQuery(" я ")).toBeNull();
  });
});
~~~

- [ ] **Step 3: Run the test and verify it fails because the helper is missing**

Run: npm test -- src/lib/search-suggestions.test.ts

Expected: FAIL with a module-not-found error for @/lib/search-suggestions.

- [ ] **Step 4: Implement the helper, then wire it into both search paths**

Create src/lib/search-suggestions.ts:

~~~ts
import { normalizeSearchQuery } from "@/lib/search-vocabulary";

export function normalizeSuggestionQuery(rawQuery: string): string | null {
  const query = normalizeSearchQuery(rawQuery);
  return query.length >= 2 ? query : null;
}
~~~

In src/app/search/page.tsx, retain query for the title, CatalogView currentQuery, and recordSearchTerm. Immediately add:

~~~ts
const catalogQuery = normalizeSuggestionQuery(query) ?? "";
~~~

Pass catalogQuery, rather than query, only to getCatalogPage.

In src/app/api/search/suggest/route.ts:

1. Import unstable_cache from next/cache and normalizeSuggestionQuery from the new helper.
2. Extract the current Prisma findMany and mapping code into this five-minute cache:

~~~ts
const getCachedSuggestions = unstable_cache(
  async (query: string): Promise<SuggestProduct[]> => {
    const tokens = buildProductSearchTokens(query);
    if (tokens.length === 0) return [];

    const products = await prisma.product.findMany({
      where: {
        isActive: true,
        isVisible: true,
        AND: [...tokens.map((token) => productSearchTokenOr(token)), normalRetailNameWhere()],
      },
      select: {
        id: true,
        slug: true,
        name: true,
        supplierName: true,
        vendor: true,
        retailPrice: true,
        images: {
          where: { deleted: false },
          orderBy: { priority: "asc" },
          take: 1,
          select: { id: true },
        },
      },
      orderBy: [{ hasImage: "desc" }, { isAvailable: "desc" }, { updatedAt: "desc" }],
      take: MAX_SUGGEST,
    });

    return products.map((product) => ({
      id: product.id,
      slug: product.slug,
      name: product.name ?? product.supplierName,
      vendor: product.vendor,
      price: decimalToNumber(product.retailPrice),
      image: productImageSrc(product.images[0]),
    }));
  },
  ["search-suggest"],
  { revalidate: 300, tags: ["products"] },
);
~~~

In GET, call normalizeSuggestionQuery on the trimmed q value. Return an empty array for null, preserve the existing DATABASE_URL guard and catch behavior, and return await getCachedSuggestions(query) in the success response.

- [ ] **Step 5: Run focused tests and verify the canonical cache contract**

Run: npm test -- src/lib/search-vocabulary.test.ts src/lib/search-suggestions.test.ts

Expected: PASS with five tests.

- [ ] **Step 6: Commit the canonical search integration**

~~~bash
git add src/lib/search-suggestions.ts src/lib/search-suggestions.test.ts src/app/search/page.tsx src/app/api/search/suggest/route.ts
git commit -m "feat: canonicalize and cache search suggestions"
~~~

### Task 3: Data-driven popular terms in both header search controls

**Files:**
- Modify: src/app/layout.tsx
- Modify: src/components/site-header.tsx
- Modify: src/components/header-search-control.tsx
- Modify: src/lib/search-vocabulary.test.ts

- [ ] **Step 1: Extend the existing failing vocabulary test with fallback behavior**

Add this test to the buildHeaderSearchQueries describe block:

~~~ts
it("uses seed queries when there are no recorded searches", () => {
  expect(buildHeaderSearchQueries([], 3)).toEqual(searchSeedQueries.slice(0, 3));
});
~~~

- [ ] **Step 2: Run the test and verify it passes as an established contract**

Run: npm test -- src/lib/search-vocabulary.test.ts

Expected: PASS with four tests. This passing test confirms the implementation from Task 1 already provides the fallback required by the UI.

- [ ] **Step 3: Pass the merged server list into the client header**

In src/app/layout.tsx, import getPopularSearchTerms and buildHeaderSearchQueries. Replace the standalone role call with:

~~~ts
const [roleContext, popularSearches] = await Promise.all([
  getRoleContext(),
  getPopularSearchTerms(8).catch(() => []),
]);
const headerSearchQueries = buildHeaderSearchQueries(popularSearches, 5);
~~~

Pass it through:

~~~tsx
<SiteHeader popularSearchQueries={headerSearchQueries} />
~~~

In src/components/site-header.tsx:

1. Add a SiteHeaderProps type containing popularSearchQueries: readonly string[].
2. Change the component signature to accept that prop.
3. Pass popularSearchQueries to both HeaderSearchControl instances.

In src/components/header-search-control.tsx:

1. Remove the POPULAR constant.
2. Add popularSearchQueries: readonly string[] to Props.
3. Render popularSearchQueries in the empty input state.

Do not add a client request for the terms; RootLayout already has the server-side data and the existing component remains client-side for its stateful menu and controls.

- [ ] **Step 4: Run the focused unit test**

Run: npm test -- src/lib/search-vocabulary.test.ts

Expected: PASS with four tests.

- [ ] **Step 5: Commit the header data flow**

~~~bash
git add src/app/layout.tsx src/components/site-header.tsx src/components/header-search-control.tsx src/lib/search-vocabulary.test.ts
git commit -m "feat: show live popular search terms"
~~~

### Task 4: Sequential, shared-source search cache warmup

**Files:**
- Create: src/lib/search-warmup.ts
- Create: src/lib/search-warmup.test.ts
- Create: scripts/warm-search.ts
- Create: scripts/warm_search.sh
- Modify: deploy/crontab.example

- [ ] **Step 1: Write failing warmup tests**

~~~ts
import { describe, expect, it, vi } from "vitest";
import { warmSearchQueries } from "@/lib/search-warmup";

describe("warmSearchQueries", () => {
  it("warms the result page and suggestion endpoint for every canonical query", async () => {
    const fetchImpl = vi.fn().mockResolvedValue({ ok: true, status: 200 });

    await warmSearchQueries({
      baseUrl: "https://example.test/",
      queries: ["телевизор"],
      fetchImpl,
    });

    expect(fetchImpl.mock.calls.map(([url]) => url)).toEqual([
      "https://example.test/search?q=%D1%82%D0%B5%D0%BB%D0%B5%D0%B2%D0%B8%D0%B7%D0%BE%D1%80",
      "https://example.test/api/search/suggest?q=%D1%82%D0%B5%D0%BB%D0%B5%D0%B2%D0%B8%D0%B7%D0%BE%D1%80",
    ]);
  });

  it("stops and reports the URL when a warmup request fails", async () => {
    await expect(
      warmSearchQueries({
        baseUrl: "https://example.test",
        queries: ["ноутбук"],
        fetchImpl: vi.fn().mockResolvedValue({ ok: false, status: 503 }),
      }),
    ).rejects.toThrow("503");
  });
});
~~~

- [ ] **Step 2: Run the warmup test and verify it fails because the module is absent**

Run: npm test -- src/lib/search-warmup.test.ts

Expected: FAIL with a module-not-found error for @/lib/search-warmup.

- [ ] **Step 3: Implement the testable warmup and cron entry points**

Create src/lib/search-warmup.ts:

~~~ts
type FetchLike = (input: string) => Promise<{ ok: boolean; status: number }>;

type WarmSearchOptions = {
  baseUrl: string;
  queries: readonly string[];
  fetchImpl?: FetchLike;
};

export async function warmSearchQueries({
  baseUrl,
  queries,
  fetchImpl = fetch,
}: WarmSearchOptions): Promise<void> {
  const base = baseUrl.replace(/\/+$/, "");

  for (const query of queries) {
    for (const pathname of ["/search", "/api/search/suggest"]) {
      const url = new URL(pathname, base);
      url.searchParams.set("q", query);
      const response = await fetchImpl(url.toString());
      if (!response.ok) {
        throw new Error("[warm-search] " + response.status + " " + url.toString());
      }
    }
  }
}
~~~

Create scripts/warm-search.ts:

~~~ts
import { searchSeedQueries } from "../src/lib/search-vocabulary";
import { warmSearchQueries } from "../src/lib/search-warmup";

async function main() {
  await warmSearchQueries({
    baseUrl: process.env.WARM_CACHE_BASE ?? "https://climat-simf.ru",
    queries: searchSeedQueries,
  });
}

void main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
~~~

Create scripts/warm_search.sh:

~~~bash
#!/usr/bin/env bash
set -u

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
LOCK_FILE="/var/lock/climat-simf-warm-search.lock"
exec 9>"$LOCK_FILE"

if ! flock -n 9; then
  exit 0
fi

exec "$ROOT_DIR/node_modules/.bin/tsx" "$ROOT_DIR/scripts/warm-search.ts"
~~~

Append this line to deploy/crontab.example:

~~~cron
*/8 * * * * /var/www/climat-simf.ru/scripts/warm_search.sh >> /var/log/climat-simf-warm-search.log 2>&1
~~~

Set the shell script executable with git update-index --chmod=+x scripts/warm_search.sh.

- [ ] **Step 4: Run the focused tests and syntax check**

Run: npm test -- src/lib/search-warmup.test.ts

Expected: PASS with two tests.

Run: bash -n scripts/warm_search.sh

Expected: no output and exit code 0.

- [ ] **Step 5: Commit the warmup**

~~~bash
git add src/lib/search-warmup.ts src/lib/search-warmup.test.ts scripts/warm-search.ts scripts/warm_search.sh deploy/crontab.example
git commit -m "feat: warm popular search queries"
~~~

### Task 5: Full verification and handoff

**Files:**
- Verify only: all files from Tasks 1–4

- [ ] **Step 1: Run the full unit suite**

Run: npm test

Expected: every Vitest test passes.

- [ ] **Step 2: Run static checks**

Run: npm run lint

Expected: exit code 0 with no ESLint errors.

Run: npm run build

Expected: Next.js production build completes successfully.

- [ ] **Step 3: Inspect the final patch**

Run: git diff HEAD~4..HEAD --check

Expected: no whitespace errors.

Run: git status --short

Expected: no unexpected files. The only permitted pending file is this implementation plan if it has not been committed separately.

- [ ] **Step 4: Record production activation**

After deployment, install the crontab.example warm-search line on the VPS and make scripts/warm_search.sh executable. Verify one dry run with WARM_CACHE_BASE=https://climat-simf.ru scripts/warm_search.sh, then inspect /var/log/climat-simf-warm-search.log for an empty success run.
