# Iter 18B — Cold-start Fix via `unstable_cache` Wrap on `getCatalogPage`

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eliminate 17–30s cold-start on non-top-12 catalog categories by wrapping `getCatalogPage(query)` in `unstable_cache` with a deterministic cache key — without touching `next.config.ts`, page-level `revalidate`, or any admin/api routes.

**Architecture:** Add one helper for cache-key normalization (`brands` lowercased + sorted), then wrap the entire `getCatalogPage` function in `unstable_cache` keyed on a stable JSON of the query. TTL = 3600s (matches existing `STOREFRONT_CACHE_SECONDS`, paired with existing `warm_all.sh` cron */30). Reuses the proven pattern already in use by 5 other helpers in `catalog.ts` (incl. `getHomeSnapshot` which returns Prisma Decimal — confirmed working).

**Tech Stack:** Next.js 16.2.4 (App Router, Turbopack), `next/cache` `unstable_cache`, Prisma 6, Vitest.

**Spec:** [`docs/superpowers/specs/2026-05-17-iter18-use-cache-migration-design.md`](../specs/2026-05-17-iter18-use-cache-migration-design.md) — see "Revision note (2026-05-18)" for why we pivoted from `'use cache'` to `unstable_cache`.

**Why this plan is shorter than the original (15 → 5 tasks):**
- No `cacheComponents: true` flag (incompatible with existing `force-dynamic` routes).
- No serialization layer (`unstable_cache` works with Prisma Decimal already — proven by `getHomeSnapshot`).
- No migration of existing 5 helpers (they already use `unstable_cache` correctly).
- No page-level `revalidate` cleanup (`unstable_cache` lives inside data fns, page-level config untouched).
- No admin/api audit (we don't touch global config, nothing changes for them).

---

## File Structure

- **Create:** `src/lib/catalog-cache-key.ts` — `normalizeCatalogCacheArgs(query)` returns a plain object suitable for deterministic JSON-stringification into a cache key.
- **Create:** `src/lib/catalog-cache-key.test.ts` — Vitest unit tests for the normalizer.
- **Modify:** `src/lib/catalog.ts` — wrap `getCatalogPage(query)` body in `unstable_cache`. Use `normalizeCatalogCacheArgs(query)` to build cache key parts. Tag `["catalog", "products"]`. Revalidate `STOREFRONT_CACHE_SECONDS` (already 3600).
- **Modify:** `web-store/HANDOFF.md` — final deploy entry.

Files explicitly NOT touched: `next.config.ts`, all `src/app/**/page.tsx`, all `src/app/api/**/route.ts`, all admin routes, `src/lib/catalog-serialize.ts` (doesn't exist, not needed).

---

## Task 1: Cache-key normalization helper — failing tests first

**Files:**
- Test: `src/lib/catalog-cache-key.test.ts`

- [ ] **Step 1: Write failing tests**

Create `src/lib/catalog-cache-key.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { normalizeCatalogCacheArgs } from "@/lib/catalog-cache-key";

describe("normalizeCatalogCacheArgs", () => {
  it("returns empty arrays/null for empty input", () => {
    const k = normalizeCatalogCacheArgs({});
    expect(k.brands).toEqual([]);
    expect(k.specFilters).toEqual([]);
    expect(k.attributeFilters).toEqual([]);
    expect(k.attributeRangeFilters).toEqual([]);
  });

  it("lowercases and sorts brand list, drops empties", () => {
    const k = normalizeCatalogCacheArgs({
      brands: ["Samsung", "bosch", "LG", "", "  ", " Xiaomi "],
    });
    expect(k.brands).toEqual(["bosch", "lg", "samsung", "xiaomi"]);
  });

  it("merges legacy single brand into brands list", () => {
    const k = normalizeCatalogCacheArgs({
      brand: "Bosch",
      brands: ["Samsung"],
    });
    expect(k.brands).toEqual(["bosch", "samsung"]);
  });

  it("ignores undefined brand", () => {
    const k = normalizeCatalogCacheArgs({ brands: ["Bosch"], brand: undefined });
    expect(k.brands).toEqual(["bosch"]);
  });

  it("preserves page, sort, slug, query, available, withPhoto, prices", () => {
    const k = normalizeCatalogCacheArgs({
      categorySlug: "ноутбуки",
      page: 3,
      sort: "price_asc",
      query: "Bosch",
      available: true,
      withPhoto: true,
      minPrice: 1000,
      maxPrice: 50000,
    });
    expect(k.categorySlug).toBe("ноутбуки");
    expect(k.page).toBe(3);
    expect(k.sort).toBe("price_asc");
    expect(k.query).toBe("Bosch");
    expect(k.available).toBe(true);
    expect(k.withPhoto).toBe(true);
    expect(k.minPrice).toBe(1000);
    expect(k.maxPrice).toBe(50000);
  });

  it("sorts specFilters by key for stability", () => {
    const k = normalizeCatalogCacheArgs({
      specFilters: [
        { key: "color", value: "white" },
        { key: "brand", value: "bosch" },
      ],
    });
    expect(k.specFilters).toEqual([
      { key: "brand", value: "bosch" },
      { key: "color", value: "white" },
    ]);
  });

  it("produces equal JSON for equivalent inputs (case + order insensitive)", () => {
    const a = normalizeCatalogCacheArgs({ brands: ["Bosch", "samsung"] });
    const b = normalizeCatalogCacheArgs({ brands: ["BOSCH", "Samsung"] });
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });
});
```

- [ ] **Step 2: Run failing test**

```bash
cd web-store
npx vitest run src/lib/catalog-cache-key.test.ts
```

Expected: FAIL — "Cannot find module '@/lib/catalog-cache-key'".

## Task 2: Implement `catalog-cache-key.ts`

**Files:**
- Create: `src/lib/catalog-cache-key.ts`

- [ ] **Step 1: Write the helper**

Create `src/lib/catalog-cache-key.ts`:

```ts
import type { CatalogQuery } from "@/lib/catalog";
import type {
  CatalogAttributeFilter,
  CatalogAttributeRangeFilter,
  CatalogSort,
  CatalogSpecFilterValue,
} from "@/lib/catalog-spec-filters";

export type NormalizedCatalogCacheKey = {
  categorySlug: string | null;
  query: string | null;
  brands: string[];
  available: boolean;
  withPhoto: boolean;
  minPrice: number | null;
  maxPrice: number | null;
  page: number;
  sort: CatalogSort | null;
  specFilters: CatalogSpecFilterValue[];
  attributeFilters: CatalogAttributeFilter[];
  attributeRangeFilters: CatalogAttributeRangeFilter[];
};

/**
 * Normalize CatalogQuery into a stable shape for cache keys.
 *
 * `unstable_cache` JSON-stringifies the function args to build its key, so any
 * non-deterministic field (different case, different array order, presence of
 * undefined) produces a different cache entry. This helper canonicalizes the
 * query so equivalent user requests hit the same cache entry.
 */
export function normalizeCatalogCacheArgs(
  query: Partial<CatalogQuery>,
): NormalizedCatalogCacheKey {
  // Merge `brand` (legacy single value) into `brands` list, lowercase, trim,
  // drop empties, dedupe, sort.
  const rawBrands = [...(query.brands ?? []), query.brand];
  const brandSet = new Set<string>();
  for (const b of rawBrands) {
    if (!b) continue;
    const trimmed = b.trim().toLowerCase();
    if (trimmed.length > 0) brandSet.add(trimmed);
  }
  const brands = Array.from(brandSet).sort();

  const specFilters = [...(query.specFilters ?? [])].sort((a, b) =>
    a.key === b.key ? a.value.localeCompare(b.value) : a.key.localeCompare(b.key),
  );

  const attributeFilters = [...(query.attributeFilters ?? [])].sort((a, b) =>
    a.key === b.key ? a.value.localeCompare(b.value) : a.key.localeCompare(b.key),
  );

  const attributeRangeFilters = [...(query.attributeRangeFilters ?? [])].sort(
    (a, b) => a.key.localeCompare(b.key),
  );

  return {
    categorySlug: query.categorySlug ?? null,
    query: query.query ?? null,
    brands,
    available: query.available ?? false,
    withPhoto: query.withPhoto ?? false,
    minPrice: query.minPrice ?? null,
    maxPrice: query.maxPrice ?? null,
    page: Math.max(query.page ?? 1, 1),
    sort: query.sort ?? null,
    specFilters,
    attributeFilters,
    attributeRangeFilters,
  };
}
```

- [ ] **Step 2: Run tests — expect pass**

```bash
cd web-store
npx vitest run src/lib/catalog-cache-key.test.ts
```

Expected: `Tests 7 passed (7)`.

- [ ] **Step 3: Full test suite — verify nothing broke**

```bash
npm run test
```

Expected: `Tests 148 passed (148)` (141 baseline + 7 new).

- [ ] **Step 4: Commit**

```bash
cd ..
git add web-store/src/lib/catalog-cache-key.ts web-store/src/lib/catalog-cache-key.test.ts
git commit -m "Iter 18B: catalog-cache-key normalization helper + tests"
```

## Task 3: Wrap `getCatalogPage` in `unstable_cache`

**Files:**
- Modify: `src/lib/catalog.ts` — wrap `getCatalogPage` (line ~445).

- [ ] **Step 1: Add normalizer import**

In `src/lib/catalog.ts` near the existing imports, add:

```ts
import { normalizeCatalogCacheArgs } from "@/lib/catalog-cache-key";
```

- [ ] **Step 2: Refactor `getCatalogPage` into cached form**

Find the current function signature (line ~445):

```ts
export async function getCatalogPage(query: CatalogQuery) {
```

Rename the existing function body to internal (and keep type same):

Replace the line with:
```ts
export async function getCatalogPage(query: CatalogQuery) {
  const cacheKey = normalizeCatalogCacheArgs(query);
  return getCatalogPageCached(cacheKey, query);
}

const getCatalogPageCached = unstable_cache(
  async (_cacheKey: unknown, query: CatalogQuery) => {
    return getCatalogPageImpl(query);
  },
  ["catalog-page"],
  { revalidate: STOREFRONT_CACHE_SECONDS, tags: ["catalog", "products"] },
);

async function getCatalogPageImpl(query: CatalogQuery) {
```

(Note: the `_cacheKey` first arg is what `unstable_cache` JSON-stringifies into its key. Passing the normalized object guarantees deterministic keys; the second `query` arg is the original used by the impl. `unstable_cache` will include BOTH args in the cache key — but since `_cacheKey` is normalized from `query`, the impl reads from `query` and gets identical behavior across equivalent inputs.)

**Important:** the rest of the existing function body (everything inside the old `getCatalogPage`) is now the body of `getCatalogPageImpl`. Do NOT change any logic — only rename/wrap.

- [ ] **Step 3: Verify the closing brace is correct**

The function structure should look like:

```ts
async function getCatalogPageImpl(query: CatalogQuery) {
  const page = Math.max(query.page ?? 1, 1);
  // ...existing 250 lines of logic unchanged...
  return {
    category,
    categoryPath,
    products,
    total,
    // ...
  };
}  // ← this closing brace was the original getCatalogPage's brace
```

- [ ] **Step 4: Lint + test + build**

```bash
cd web-store
npm run lint && npm run test && npm run build
```

Expected: lint clean, 148/148 tests, build success.

If build complains about caching args or `unknown` type — the second arg `query: CatalogQuery` is passed-through, not used for key (only impl reads from it). Add `/* eslint-disable-next-line @typescript-eslint/no-unused-vars */` above the `_cacheKey` param if needed.

- [ ] **Step 5: Local dev smoke**

```bash
npm run dev
```

In another shell:
```bash
sleep 8
for slug in bytovaya-tehnika-9839 umnye-chasy-12508; do
  echo "=== /catalog/$slug ==="
  curl -s -o /dev/null -w 'attempt1: %{time_total}s\n' "http://localhost:3000/catalog/$slug"
  curl -s -o /dev/null -w 'attempt2: %{time_total}s\n' "http://localhost:3000/catalog/$slug"
done
```

Expected: attempt2 < attempt1 (cache hit). Even in dev (slow) the second should be visibly faster — measurable evidence cache works.

Kill `npm run dev`.

- [ ] **Step 6: Commit**

```bash
cd ..
git add web-store/src/lib/catalog.ts
git commit -m "Iter 18B: wrap getCatalogPage in unstable_cache with normalized brand key"
```

## Task 4: Deploy + prod cold-start measurement

**Files:** none changed; deployment + verification only.

- [ ] **Step 1: Push branch**

```bash
git push origin claude/affectionate-shamir-feac14
```

- [ ] **Step 2: Deploy via deploy_vps.py**

```bash
cd web-store
WEB_STORE_VPS_PASSWORD='tRu741mAz' python scripts/deploy_vps.py
```

Expected: `Deploy completed.` + backup timestamp. Note the timestamp.

- [ ] **Step 3: VPS clean rebuild + restart**

Apply CLAUDE.md trap workarounds (npm install gap + turbopack cache stale):

```bash
cd ..
python <<'PY'
import paramiko, sys, time
sys.stdout.reconfigure(encoding="utf-8", errors="replace")
c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect("212.116.115.150", username="root", password="tRu741mAz", timeout=30)
def run(cmd, t=900):
    _, so, _ = c.exec_command(cmd, timeout=t)
    return so.read().decode("utf-8", errors="replace").rstrip()
print("stop:", run("pm2 stop climat-simf-store 2>&1 | tail -1 | tr -cd '\\11\\12\\40-\\176'"))
print("npm install:", run("cd /var/www/climat-simf.ru && npm install --include=dev --no-audit --no-fund 2>&1 | tail -3"))
print("build:", run("cd /var/www/climat-simf.ru && rm -rf .next && npx next build > /tmp/iter18b-build.log 2>&1; echo EXIT=$?"))
print("tail:", run("tail -5 /tmp/iter18b-build.log | tr -cd '\\11\\12\\40-\\176'"))
print("restart:", run("pm2 restart climat-simf-store 2>&1 | tail -1 | tr -cd '\\11\\12\\40-\\176'"))
time.sleep(8)
print("hc:", run("curl -s -o /dev/null -w '%{http_code}' http://localhost:3001/"))
c.close()
PY
```

Expected: EXIT=0, hc=200.

If hc != 200: stop, inspect `/root/.pm2/logs/climat-simf-store-error-0.log` via ssh, do NOT proceed.

- [ ] **Step 4: Prod smoke 8 routes**

```bash
for path in / /catalog /catalog/bytovaya-tehnika-9839 /service /b2b /gov /bot /login; do
  printf '%-50s ' "$path"
  curl -sk --max-time 30 -o /dev/null -w '%{http_code} %{time_total}s\n' "https://climat-simf.ru$path"
done
```

Expected: all `200`. If any 500 — rollback (see end of plan).

- [ ] **Step 5: Trigger warm_all manually to populate cache**

```bash
python <<'PY'
import paramiko
c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect("212.116.115.150", username="root", password="tRu741mAz", timeout=30)
_, so, _ = c.exec_command("/var/www/climat-simf.ru/scripts/warm_all.sh", timeout=3600)
print("warm_all exit:", so.channel.recv_exit_status())
c.close()
PY
```

Expected: exit 0. May take a few minutes on cold data.

- [ ] **Step 6: Cold-start measurement on 3 non-top-12 categories**

```bash
for slug in kabeli-i-perekhodniki-12041 knigi-i-zhurnaly-11432 muzyka-na-vinile-13002; do
  printf '%-45s ' "$slug"
  curl -sk --max-time 60 -o /dev/null -w '%{time_total}s %{http_code}\n' "https://climat-simf.ru/catalog/$slug"
done
```

**Success criterion:** every `time_total` < **2.0 sec**. If any exceeds — debug (see CONDITIONAL below).

- [ ] **Step 7: (CONDITIONAL) Debug if measurement fails**

Likely causes if all 3 are still slow:
1. Cache key collision (different query forms produce different keys for same data) — verify by adding `console.log` in `getCatalogPage` showing cache key, redeploy, check pm2 logs.
2. unstable_cache value too large (Next has internal size limits) — log entry size.
3. `_cacheKey` arg not actually being part of key — Next semantics confusion.

If unfixable in 30 min — rollback via `git revert <Task 3 commit>`, redeploy, re-evaluate approach.

## Task 5: HANDOFF entry

**Files:**
- Modify: `web-store/HANDOFF.md`

- [ ] **Step 1: Insert new entry at the top of "История деплоев glass-редизайна"**

Open `web-store/HANDOFF.md` and prepend (right above the existing top entry):

```markdown
### 2026-05-18 <HH:MM> — Iter 18B: cold-start fix via unstable_cache wrap on getCatalogPage

- Spec: [`docs/superpowers/specs/2026-05-17-iter18-use-cache-migration-design.md`](docs/superpowers/specs/2026-05-17-iter18-use-cache-migration-design.md) (revised 2026-05-18 — switched from `'use cache'` to `unstable_cache`)
- Plan: [`docs/superpowers/plans/2026-05-18-iter18b-unstable-cache-fix.md`](docs/superpowers/plans/2026-05-18-iter18b-unstable-cache-fix.md)
- Commits: <list each commit SHA from Tasks 1-3>
- Deploy backup: `/var/www/climat-simf.ru.source-backup-<TIMESTAMP>.tar.gz`
- Closes the 17-30s cold-start debt from Iter 15C.

**Что вошло:**
- НОВЫЙ `src/lib/catalog-cache-key.ts`: `normalizeCatalogCacheArgs(query)` — детерминированный cache key (lowercase brands + sort, sorted filters). 7 unit-тестов.
- `src/lib/catalog.ts`: `getCatalogPage(query)` теперь обёрнут в `unstable_cache` через `getCatalogPageCached` wrapper. TTL=`STOREFRONT_CACHE_SECONDS` (3600), tags `["catalog", "products"]`. Внутренняя логика (`getCatalogPageImpl`) не меняется — surgical wrap.

**Что НЕ вошло (по revision spec'а 2026-05-18):**
- `'use cache'` directive (Next 16 native) — abandoned: `cacheComponents: true` несовместим со всеми 24 `force-dynamic` routes в проекте.
- Migration существующих 5 helpers (`getActiveCategories`, etc) — они и так используют `unstable_cache` корректно.
- Page-level `revalidate` cleanup — не нужен.

**Verification:**
- 148/148 тестов (141 baseline + 7 новых для cache-key).
- `npm run build` успешен.
- Prod cold-start на non-top-12 (`kabeli-i-perekhodniki-12041`, `knigi-i-zhurnaly-11432`, `muzyka-na-vinile-13002`): **<2 сек** (было 21-26 сек).
- 8 smoke-routes 200.

**Известный риск:**
- `unstable_cache` deprecated в Next 16, но всё ещё работает. Если в будущем Next уберёт API — нужна полная migration на `'use cache'` (что требует ревизии всех `force-dynamic` routes — см. archived Iter 18 spec).

**Rollback (если нужно):**
```bash
ssh root@212.116.115.150 'cd / && tar -xzf /var/www/climat-simf.ru.source-backup-<PRE_ITER18B_TIMESTAMP>.tar.gz && cd /var/www/climat-simf.ru && rm -rf .next && npx next build && pm2 restart climat-simf-store'
```
```

Fill in: `<HH:MM>`, `<list each commit SHA>`, `<TIMESTAMP>`, `<PRE_ITER18B_TIMESTAMP>` (use deploy backup timestamp from before this iteration, e.g. `20260517123512`).

- [ ] **Step 2: Commit + push**

```bash
cd ..
git add web-store/HANDOFF.md
git commit -m "docs: HANDOFF entry for Iter 18B (cold-start fix deployed)"
git push origin claude/affectionate-shamir-feac14
```

---

## Final tally (success path)

- 4 commits on feature branch (1 normalizer+tests, 1 wrap, 1 HANDOFF, 1 spec revision already done before this plan started).
- Production runs Iter 18B with cold-start <2s on non-top-12 categories.
- 148/148 tests green.
- HANDOFF up to date.

## Rollback (if Task 4 Step 6 fails)

```bash
ssh root@212.116.115.150 'ls -lt /var/www/climat-simf.ru.source-backup-*.tar.gz | head -5'
# Pick the most recent backup pre-dating this deploy:
ssh root@212.116.115.150 'cd / && tar -xzf /var/www/climat-simf.ru.source-backup-<PRE>.tar.gz && cd /var/www/climat-simf.ru && rm -rf .next && npx next build && pm2 restart climat-simf-store'
```

Then `git revert <Task 3 commit>` + `git push` to keep repo in sync with prod.
