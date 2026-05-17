# Iter 18 — Cold-start Fix via Next 16 `'use cache'` Migration

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eliminate 17–30s cold-start on non-top-12 catalog categories by migrating all `unstable_cache` helpers + new `getCatalogPage` cache to Next 16's `'use cache'` directive.

**Architecture:** Enable `cacheComponents: true` globally → write a `productToPlain` serialization helper (Prisma Decimal/Date → plain JSON) → migrate each cached helper to `'use cache'` + `cacheLife("hours")` + `cacheTag()` → add cache to `getCatalogPage` with brand-arg normalization → remove redundant page-level `revalidate` exports → phased deploy with verify gates.

**Tech Stack:** Next.js 16.2.4 (App Router, Turbopack, `cacheComponents`), React 19, TypeScript, Prisma 6, Vitest, PostgreSQL.

**Spec:** [`docs/superpowers/specs/2026-05-17-iter18-use-cache-migration-design.md`](../specs/2026-05-17-iter18-use-cache-migration-design.md)

---

## File Structure

- **Create:** `src/lib/catalog-serialize.ts` — `productToPlain`, `categoryToPlain`, `normalizeCatalogCacheArgs` (one place for cache-key sensitivity).
- **Create:** `src/lib/catalog-serialize.test.ts` — Vitest unit tests for the helpers.
- **Modify:** `next.config.ts` — add `cacheComponents: true`.
- **Modify:** `src/lib/catalog.ts` — drop `unstable_cache` wraps on all 5 helpers, wrap each function body with `'use cache'` + `cacheLife("hours")` + `cacheTag(...)`. Add `'use cache'` to `getCatalogPage`. Apply `productToPlain` map in `getHomeSnapshot` and `getCatalogPage`. Import `cacheLife`, `cacheTag` from `next/cache`. Remove `unstable_cache` import once unused.
- **Modify:** `src/app/catalog/[slug]/page.tsx` — remove `export const revalidate = 300;`.
- **Modify:** `src/app/catalog/page.tsx` — remove `export const revalidate = 300;`.
- **Modify:** `src/app/podborki/[slug]/page.tsx` — remove `export const revalidate = 300;` (keep `dynamic = "force-dynamic"`).
- **Modify:** `web-store/HANDOFF.md` — final deploy entry.

Routes that already export `force-dynamic` (no audit needed — all stay dynamic): all `/admin/**`, `/api/**`, `/login`, `/account`, `/`. Verified in spec audit.

---

## Phase 0 — Smoke `cacheComponents: true`

### Task 0.1: Enable cacheComponents flag

**Files:**
- Modify: `next.config.ts`

- [ ] **Step 1: Edit next.config.ts**

Replace the file's contents with:

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
};

export default nextConfig;
```

- [ ] **Step 2: Lint + test + build**

Run:
```bash
cd web-store
npm run lint
npm run test
npm run build
```

Expected: lint silent, `Tests 141 passed (141)`, build prints route listing and ends with `(Dynamic) server-rendered on demand`.

If build fails with `dynamic API in cached scope` for any route — note the route, return to it in Phase 0 Task 0.2 with an explicit `export const dynamic = "force-dynamic"`. Otherwise skip Task 0.2.

- [ ] **Step 3: Local dev smoke**

Run in one terminal:
```bash
npm run dev
```

In another:
```bash
for path in / /catalog /catalog/bytovaya-tehnika-9839 /service /b2b /gov /bot /login /account; do
  printf '%-50s ' "$path"
  curl -s -o /dev/null -w '%{http_code}\n' "http://localhost:3000$path"
done
```

Expected: every route returns `200` or `307` (`/account` → `/login` redirect for anon). No 500.

Kill `npm run dev` after this step.

- [ ] **Step 4: Commit**

```bash
cd ..
git add web-store/next.config.ts
git commit -m "Iter 18 Phase 0: enable cacheComponents flag (Next 16)"
```

### Task 0.2: (CONDITIONAL — only if Task 0.1 step 2 surfaced build errors)

**Skip this task entirely if Phase 0 build passed.** Run only for routes the build complained about.

- [ ] **Step 1: For each problem route, add explicit dynamic**

In each problem page/route file, at the top after imports:
```ts
export const dynamic = "force-dynamic";
```

- [ ] **Step 2: Rerun build**

```bash
cd web-store
npm run build
```

Expected: build passes.

- [ ] **Step 3: Commit**

```bash
cd ..
git add web-store/src/app
git commit -m "Iter 18 Phase 0: explicit force-dynamic for routes with runtime APIs"
```

---

## Phase 1 — POC: migrate `getCategoryBySlug`

The simplest cached helper (scalar fields, no Decimal). Proves `'use cache'` works end-to-end before touching the rest.

### Task 1.1: Migrate `getCategoryBySlug` to `'use cache'`

**Files:**
- Modify: `src/lib/catalog.ts:102-116`

- [ ] **Step 1: Add cacheLife + cacheTag to the next/cache import**

In `src/lib/catalog.ts:2`, replace:
```ts
import { unstable_cache } from "next/cache";
```
with:
```ts
import { cacheLife, cacheTag, unstable_cache } from "next/cache";
```

(Keep `unstable_cache` import — still used by 4 other helpers in this phase. Removed in Phase 2 cleanup.)

- [ ] **Step 2: Replace getCategoryBySlug body**

Find the block starting at `export const getCategoryBySlug = unstable_cache(async (slug: string): Promise<FlatCategory | null> => {` (line ~102) and ending at `}, ["category-by-slug"], { revalidate: STOREFRONT_CACHE_SECONDS, tags: ["catalog"] });` (line ~116).

Replace the entire block with:

```ts
export async function getCategoryBySlug(slug: string): Promise<FlatCategory | null> {
  "use cache";
  cacheLife("hours");
  cacheTag("catalog");
  return prisma.category.findFirst({
    where: {
      slug,
      isActive: true,
      isVisible: true,
    },
    select: {
      id: true,
      parentId: true,
      name: true,
      slug: true,
    },
  });
}
```

- [ ] **Step 3: Lint + test + build**

```bash
cd web-store
npm run lint && npm run test && npm run build
```

Expected: clean lint, 141/141 tests, build success.

- [ ] **Step 4: Local dev smoke on a category page**

```bash
npm run dev
```

In another terminal:
```bash
# First hit (cold)
curl -s -o /dev/null -w 'cold: %{time_total}s %{http_code}\n' 'http://localhost:3000/catalog/bytovaya-tehnika-9839'
# Second hit (cached)
curl -s -o /dev/null -w 'warm: %{time_total}s %{http_code}\n' 'http://localhost:3000/catalog/bytovaya-tehnika-9839'
```

Expected: both `200`, second visibly faster than first (dev mode is slow, just sanity-check it doesn't crash). Kill dev server.

- [ ] **Step 5: Commit**

```bash
cd ..
git add web-store/src/lib/catalog.ts
git commit -m "Iter 18 Phase 1: POC migrate getCategoryBySlug to 'use cache'"
```

---

## Phase 2 — Full migration

### Task 2.1: Create serialization helpers — failing tests first

**Files:**
- Test: `src/lib/catalog-serialize.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `src/lib/catalog-serialize.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { Prisma } from "@prisma/client";
import {
  categoryToPlain,
  normalizeCatalogCacheArgs,
  productToPlain,
  type ProductWithIncludes,
} from "@/lib/catalog-serialize";

describe("productToPlain", () => {
  const baseProduct = {
    id: "p1",
    sku: 123,
    slug: "test-product",
    name: null,
    supplierName: "Bosch WAJ20180ME",
    vendor: "Bosch",
    part: null,
    barcodes: null,
    categoryId: "cat1",
    retailPrice: new Prisma.Decimal("39990.50"),
    isActive: true,
    isVisible: true,
    isAvailable: true,
    hasImage: true,
    createdAt: new Date("2025-01-15T10:00:00.000Z"),
    updatedAt: new Date("2025-05-17T08:30:00.000Z"),
    images: [],
    attributes: [],
    category: null,
  } as unknown as ProductWithIncludes;

  it("converts Decimal retailPrice to number", () => {
    const plain = productToPlain(baseProduct);
    expect(typeof plain.retailPrice).toBe("number");
    expect(plain.retailPrice).toBe(39990.5);
  });

  it("preserves null retailPrice", () => {
    const p = productToPlain({ ...baseProduct, retailPrice: null } as unknown as ProductWithIncludes);
    expect(p.retailPrice).toBeNull();
  });

  it("converts Date createdAt/updatedAt to ISO strings", () => {
    const plain = productToPlain(baseProduct);
    expect(plain.createdAt).toBe("2025-01-15T10:00:00.000Z");
    expect(plain.updatedAt).toBe("2025-05-17T08:30:00.000Z");
  });

  it("flattens images to id+priority pairs", () => {
    const p = productToPlain({
      ...baseProduct,
      images: [
        { id: "img1", priority: 0, productId: "p1", deleted: false } as never,
        { id: "img2", priority: 5, productId: "p1", deleted: false } as never,
      ],
    } as unknown as ProductWithIncludes);
    expect(p.images).toEqual([
      { id: "img1", priority: 0 },
      { id: "img2", priority: 5 },
    ]);
  });

  it("flattens attributes to key+value pairs", () => {
    const p = productToPlain({
      ...baseProduct,
      attributes: [
        { key: "color", value: "white", productId: "p1", source: "manual" } as never,
      ],
    } as unknown as ProductWithIncludes);
    expect(p.attributes).toEqual([{ key: "color", value: "white" }]);
  });

  it("falls back to null for missing category", () => {
    const p = productToPlain({ ...baseProduct, category: null } as unknown as ProductWithIncludes);
    expect(p.category).toBeNull();
  });
});

describe("categoryToPlain", () => {
  it("returns id/slug/name only", () => {
    const c = categoryToPlain({
      id: "c1",
      slug: "laptops",
      name: "Ноутбуки",
      parentId: null,
      isActive: true,
      isVisible: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as never);
    expect(c).toEqual({ id: "c1", slug: "laptops", name: "Ноутбуки" });
  });
});

describe("normalizeCatalogCacheArgs", () => {
  it("lowercases and sorts brand list", () => {
    const n = normalizeCatalogCacheArgs({ brands: ["Samsung", "bosch", "LG"] });
    expect(n.brands).toEqual(["bosch", "lg", "samsung"]);
  });

  it("returns empty brands list for undefined", () => {
    const n = normalizeCatalogCacheArgs({});
    expect(n.brands).toEqual([]);
  });

  it("trims brand whitespace", () => {
    const n = normalizeCatalogCacheArgs({ brands: ["  Bosch ", "Lg "] });
    expect(n.brands).toEqual(["bosch", "lg"]);
  });

  it("drops empty brand entries", () => {
    const n = normalizeCatalogCacheArgs({ brands: ["Bosch", "", "   "] });
    expect(n.brands).toEqual(["bosch"]);
  });
});
```

- [ ] **Step 2: Run failing test**

```bash
cd web-store
npx vitest run src/lib/catalog-serialize.test.ts
```

Expected: FAIL with "Cannot find module '@/lib/catalog-serialize'".

### Task 2.2: Implement `catalog-serialize.ts`

**Files:**
- Create: `src/lib/catalog-serialize.ts`

- [ ] **Step 1: Write the helper file**

Create `src/lib/catalog-serialize.ts`:

```ts
import type { Prisma, Product, ProductAttribute, ProductImage, Category } from "@prisma/client";

export type PlainImage = { id: string; priority: number };
export type PlainAttribute = { key: string; value: string };
export type PlainCategory = { id: string; slug: string; name: string };

export type PlainProduct = {
  id: string;
  sku: number;
  slug: string;
  name: string | null;
  supplierName: string;
  vendor: string | null;
  part: string | null;
  barcodes: string | null;
  categoryId: string | null;
  retailPrice: number | null;
  isActive: boolean;
  isVisible: boolean;
  isAvailable: boolean;
  hasImage: boolean;
  createdAt: string;
  updatedAt: string;
  images: PlainImage[];
  attributes: PlainAttribute[];
  category: PlainCategory | null;
};

export type ProductWithIncludes = Product & {
  images: ProductImage[];
  attributes: ProductAttribute[];
  category?: Category | null;
};

function decimalToNumberOrNull(value: Prisma.Decimal | null | undefined): number | null {
  if (value === null || value === undefined) return null;
  return Number(value);
}

export function categoryToPlain(c: Pick<Category, "id" | "slug" | "name">): PlainCategory {
  return { id: c.id, slug: c.slug, name: c.name };
}

export function productToPlain(p: ProductWithIncludes): PlainProduct {
  return {
    id: p.id,
    sku: p.sku,
    slug: p.slug,
    name: p.name,
    supplierName: p.supplierName,
    vendor: p.vendor,
    part: p.part,
    barcodes: p.barcodes,
    categoryId: p.categoryId,
    retailPrice: decimalToNumberOrNull(p.retailPrice),
    isActive: p.isActive,
    isVisible: p.isVisible,
    isAvailable: p.isAvailable,
    hasImage: p.hasImage,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
    images: p.images.map((i) => ({ id: i.id, priority: i.priority })),
    attributes: p.attributes.map((a) => ({ key: a.key, value: a.value })),
    category: p.category ? categoryToPlain(p.category) : null,
  };
}

/**
 * Normalize cache-key sensitive bits of CatalogQuery so e.g. `Bosch` and
 * `bosch` hash to the same `'use cache'` entry. Apply this at the START
 * of getCatalogPage, before any other logic.
 */
export function normalizeCatalogCacheArgs(input: { brands?: string[] }): {
  brands: string[];
} {
  const raw = input.brands ?? [];
  const trimmed = raw
    .map((b) => b.trim().toLowerCase())
    .filter((b) => b.length > 0);
  return { brands: trimmed.sort() };
}
```

- [ ] **Step 2: Run tests — expect pass**

```bash
cd web-store
npx vitest run src/lib/catalog-serialize.test.ts
```

Expected: `Tests 11 passed (11)`.

- [ ] **Step 3: Full test suite — verify nothing broke**

```bash
npm run test
```

Expected: `Tests 152 passed (152)` (141 baseline + 11 new).

- [ ] **Step 4: Commit**

```bash
cd ..
git add web-store/src/lib/catalog-serialize.ts web-store/src/lib/catalog-serialize.test.ts
git commit -m "Iter 18 Phase 2: catalog-serialize helpers + tests"
```

### Task 2.3: Migrate the remaining 4 unstable_cache helpers

**Files:**
- Modify: `src/lib/catalog.ts` — `getActiveCategories` (line ~59), `getCategoryProductCounts` (line ~77), `getHomeSnapshot` (line ~135), `getCatalogBrands` (line ~196).

- [ ] **Step 1: Replace `getActiveCategories`**

Find the existing block (starts `export const getActiveCategories = unstable_cache(async (): Promise<FlatCategory[]> => {`).

Replace with:

```ts
export async function getActiveCategories(): Promise<FlatCategory[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("catalog");
  return prisma.category.findMany({
    where: {
      isActive: true,
      isVisible: true,
    },
    select: {
      id: true,
      parentId: true,
      name: true,
      slug: true,
    },
    orderBy: {
      name: "asc",
    },
  });
}
```

- [ ] **Step 2: Replace `getCategoryProductCounts`**

Find `const getCategoryProductCounts = unstable_cache(async () => {`.

Replace with:

```ts
async function getCategoryProductCounts() {
  "use cache";
  cacheLife("hours");
  cacheTag("catalog");
  cacheTag("products");
  return prisma.product.groupBy({
    by: ["categoryId"],
    where: {
      categoryId: {
        not: null,
      },
      isActive: true,
      isVisible: true,
    },
    _count: {
      _all: true,
    },
  });
}
```

- [ ] **Step 3: Replace `getCatalogBrands`**

Find the existing block (starts `const getCatalogBrands = unstable_cache(async (where: Prisma.ProductWhereInput) => {`).

Replace with:

```ts
async function getCatalogBrands(where: Prisma.ProductWhereInput) {
  "use cache";
  cacheLife("hours");
  cacheTag("catalog");
  cacheTag("products");
  const rows = await prisma.product.groupBy({
    by: ["vendor"],
    where,
    _count: {
      _all: true,
    },
    take: 500,
  });
  return rows
    .filter((row) => (row._count?._all ?? 0) > 0 && row.vendor && row.vendor.trim())
    .sort((a, b) => (b._count._all ?? 0) - (a._count._all ?? 0))
    .slice(0, 120);
}
```

- [ ] **Step 4: Replace `getHomeSnapshot`**

Add at top of `catalog.ts` (after existing imports):
```ts
import { productToPlain } from "@/lib/catalog-serialize";
```

Find the existing block (starts `export const getHomeSnapshot = unstable_cache(async () => {`).

Replace with:

```ts
export async function getHomeSnapshot() {
  "use cache";
  cacheLife("hours");
  cacheTag("catalog");
  cacheTag("products");

  if (!process.env.DATABASE_URL) {
    return { categories: [], products: [] };
  }

  const allCategories = await getActiveCategories();
  const excludedCategoryIds = getExcludedCategoryIds(allCategories);
  const categories = await getCatalogCategoryTree(allCategories);
  const products = await prisma.product.findMany({
    where: {
      isActive: true,
      isVisible: true,
      isAvailable: true,
      ...(excludedCategoryIds.length
        ? {
            categoryId: {
              notIn: excludedCategoryIds,
            },
          }
        : {}),
      retailPrice: { gte: 3000, lte: 300000 },
      images: { some: { deleted: false } },
      ...normalRetailNameWhere(),
    },
    include: {
      images: {
        where: {
          deleted: false,
        },
        orderBy: {
          priority: "asc",
        },
        take: 1,
      },
      attributes: {
        where: {
          source: {
            in: ["manual", "name"],
          },
        },
        orderBy: [{ key: "asc" }, { value: "asc" }],
      },
    },
    orderBy: [{ hasImage: "desc" }, { updatedAt: "desc" }],
    take: 80,
  });

  const balanced = interleaveByTopCategory(products, allCategories, 8, 2);
  return { categories, products: balanced.map(productToPlain) };
}
```

- [ ] **Step 5: Lint + test + build**

```bash
cd web-store
npm run lint && npm run test && npm run build
```

Expected: clean lint, 152/152 tests, build success.

If build complains about Decimal-typed downstream usage of `getHomeSnapshot().products` — note the file/line, return in Step 6.

- [ ] **Step 6: (CONDITIONAL) Fix downstream consumers of `getHomeSnapshot`**

If Step 5 surfaced TypeScript errors in `src/app/page.tsx` or similar consumers (the `products` array now has `PlainProduct` instead of Prisma `Product`):

```bash
grep -rn "getHomeSnapshot\(" web-store/src
```

For each consumer file, change `retailPrice.toNumber()` or `retailPrice instanceof Prisma.Decimal` usages to direct number access (it's already `number | null`).

Then rerun `npm run build`.

- [ ] **Step 7: Commit**

```bash
cd ..
git add web-store/src/lib/catalog.ts web-store/src/app
git commit -m "Iter 18 Phase 2: migrate 4 catalog helpers to 'use cache' + Plain transform in getHomeSnapshot"
```

### Task 2.4: Migrate `getCatalogPage` + brand normalization

**Files:**
- Modify: `src/lib/catalog.ts` — `getCatalogPage` (line ~445 onward, ~250 lines).

- [ ] **Step 1: Add normalization import**

At top of `catalog.ts`, find the line:
```ts
import { productToPlain } from "@/lib/catalog-serialize";
```
Replace with:
```ts
import { normalizeCatalogCacheArgs, productToPlain } from "@/lib/catalog-serialize";
```

- [ ] **Step 2: Wrap getCatalogPage with 'use cache'**

Find the function signature (line ~445):
```ts
export async function getCatalogPage(query: CatalogQuery) {
```

Immediately after the opening brace, add:
```ts
  "use cache";
  cacheLife("hours");
  cacheTag("catalog");
  cacheTag("products");

  // Normalize cache-sensitive args so Bosch and bosch hash to the same entry.
  const normalizedBrandsForCache = normalizeCatalogCacheArgs({
    brands: [...(query.brands ?? []), query.brand].filter((b): b is string => !!b),
  }).brands;
  query = { ...query, brands: normalizedBrandsForCache, brand: undefined };
```

- [ ] **Step 3: Apply productToPlain to returned products**

Inside `getCatalogPage`, find the final `return { category, categoryPath, products, total, page, perPage, ... }` block (line ~614).

Wrap the `products` value:
```ts
return {
  category,
  categoryPath,
  products: products.map(productToPlain),
  total,
  page,
  perPage: PRODUCTS_PER_PAGE,
  // ...rest unchanged
};
```

- [ ] **Step 4: Lint + test + build**

```bash
cd web-store
npm run lint && npm run test && npm run build
```

Expected: clean lint, 152/152 tests, build success.

If build complains about `await searchParams` inside cache scope — recheck that `getCatalogPage` is called from page.tsx **outside** of any `'use cache'` block (page.tsx itself remains uncached, only data fns are cached). Reading `await searchParams` happens in page, then plain `query` object is passed in.

- [ ] **Step 5: (CONDITIONAL) Fix downstream consumers of `getCatalogPage`**

`getCatalogPage().products` is now `PlainProduct[]`. Run:
```bash
grep -rn "products\[" web-store/src/app/catalog/catalog-view.tsx
```

If the view does `product.retailPrice.toNumber()` or treats it as Decimal, switch to direct number/null access via the existing `decimalToNumber` helper (already handles string and number).

Rerun `npm run build`.

- [ ] **Step 6: Commit**

```bash
cd ..
git add web-store/src/lib/catalog.ts web-store/src/app
git commit -m "Iter 18 Phase 2: migrate getCatalogPage to 'use cache' + brand-arg normalization"
```

### Task 2.5: Drop redundant page-level `revalidate`

**Files:**
- Modify: `src/app/catalog/[slug]/page.tsx:10`
- Modify: `src/app/catalog/page.tsx:9`
- Modify: `src/app/podborki/[slug]/page.tsx:9`

- [ ] **Step 1: Remove from `catalog/[slug]/page.tsx`**

Delete line 10:
```ts
export const revalidate = 300;
```

- [ ] **Step 2: Remove from `catalog/page.tsx`**

Delete line 9:
```ts
export const revalidate = 300;
```

- [ ] **Step 3: Remove from `podborki/[slug]/page.tsx`**

Delete line 9 (keep `export const dynamic = "force-dynamic";` on the next line):
```ts
export const revalidate = 300;
```

- [ ] **Step 4: Lint + test + build**

```bash
cd web-store
npm run lint && npm run test && npm run build
```

Expected: clean lint, 152/152 tests, build success.

- [ ] **Step 5: Commit**

```bash
cd ..
git add web-store/src/app/catalog web-store/src/app/podborki
git commit -m "Iter 18 Phase 2: drop redundant page-level revalidate (managed by cacheLife now)"
```

### Task 2.6: Cleanup `unstable_cache` import

**Files:**
- Modify: `src/lib/catalog.ts:2`

- [ ] **Step 1: Verify no remaining usage**

```bash
cd web-store
grep -c "unstable_cache" src/lib/catalog.ts
```

Expected: `1` (just the import). If higher, find the leftover and migrate.

- [ ] **Step 2: Remove unstable_cache from the import**

In `src/lib/catalog.ts:2`, change:
```ts
import { cacheLife, cacheTag, unstable_cache } from "next/cache";
```
to:
```ts
import { cacheLife, cacheTag } from "next/cache";
```

- [ ] **Step 3: Lint + test + build**

```bash
npm run lint && npm run test && npm run build
```

Expected: clean lint, 152/152 tests, build success.

- [ ] **Step 4: Commit**

```bash
cd ..
git add web-store/src/lib/catalog.ts
git commit -m "Iter 18 Phase 2: drop unstable_cache import from catalog.ts"
```

### Task 2.7: Local dev smoke — measure cold→warm delta

**Files:** none changed; verification only.

- [ ] **Step 1: Start dev server**

```bash
cd web-store
npm run dev
```

Wait for `Ready in <Xms>`.

- [ ] **Step 2: Measure cold→warm on 3 categories**

In another terminal:
```bash
for slug in bytovaya-tehnika-9839 umnye-chasy-12508 muzyka-na-vinile-13002; do
  echo "=== /catalog/$slug ==="
  curl -s -o /dev/null -w 'attempt1: %{time_total}s\n' "http://localhost:3000/catalog/$slug"
  curl -s -o /dev/null -w 'attempt2: %{time_total}s\n' "http://localhost:3000/catalog/$slug"
  curl -s -o /dev/null -w 'attempt3: %{time_total}s\n' "http://localhost:3000/catalog/$slug"
done
```

Expected: attempt1 may be slow (dev mode + cold DB), attempt2/3 visibly faster (cache hit). Exact thresholds are validated on prod, this is just sanity-check that cache works at all.

- [ ] **Step 3: Smoke the 8 key routes**

```bash
for path in / /catalog /catalog/bytovaya-tehnika-9839 /service /b2b /gov /bot /login; do
  printf '%-50s ' "$path"
  curl -s -o /dev/null -w '%{http_code}\n' "http://localhost:3000$path"
done
```

Expected: all `200`.

- [ ] **Step 4: Kill dev server**

Ctrl-C the `npm run dev` terminal.

---

## Phase 3 — Prod deploy

### Task 3.1: Push branch + run deploy_vps.py

**Files:** none changed; deployment only.

- [ ] **Step 1: Push**

```bash
git push origin claude/affectionate-shamir-feac14
```

- [ ] **Step 2: Deploy**

```bash
cd web-store
WEB_STORE_VPS_PASSWORD='tRu741mAz' python scripts/deploy_vps.py
```

Expected: prints `Deploy completed.` and a backup timestamp. Note the timestamp — needed for rollback.

### Task 3.2: VPS clean rebuild + restart

The deploy script does its own build, but two known VPS traps require explicit follow-up:
1. `deploy_vps.py` doesn't run `npm install` → new deps missing on VPS.
2. Turbopack persistent cache may serve stale chunks for modified files.

(Both documented in `CLAUDE.md` "RSC / Next.js 16 — ловушки".)

- [ ] **Step 1: SSH and force clean rebuild**

```bash
cd ..
python <<'PY'
import paramiko, sys, time
sys.stdout.reconfigure(encoding="utf-8", errors="replace")
c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect("212.116.115.150", username="root", password="tRu741mAz", timeout=30)
def run(cmd, t=900):
    _, stdout, _ = c.exec_command(cmd, timeout=t)
    return stdout.read().decode("utf-8", errors="replace").rstrip()
print("stop:", run("pm2 stop climat-simf-store 2>&1 | tail -1 | tr -cd '\\11\\12\\40-\\176'"))
print("npm install:", run("cd /var/www/climat-simf.ru && npm install --include=dev --no-audit --no-fund 2>&1 | tail -3"))
print("build:", run("cd /var/www/climat-simf.ru && rm -rf .next && npx next build > /tmp/iter18-build.log 2>&1; echo EXIT=$?"))
print("build tail:", run("tail -5 /tmp/iter18-build.log | tr -cd '\\11\\12\\40-\\176'"))
print("restart:", run("pm2 restart climat-simf-store 2>&1 | tail -1 | tr -cd '\\11\\12\\40-\\176'"))
time.sleep(8)
print("hc:", run("curl -s -o /dev/null -w '%{http_code}' http://localhost:3001/"))
c.close()
PY
```

Expected: EXIT=0, hc=200.

If hc != 200, check `/root/.pm2/logs/climat-simf-store-error-0.log` (via ssh) and stop — DO NOT proceed until app is healthy.

### Task 3.3: Prod smoke — 8 routes

- [ ] **Step 1: Hit each route**

```bash
for path in / /catalog /catalog/bytovaya-tehnika-9839 /service /b2b /gov /bot /login; do
  printf '%-50s ' "$path"
  curl -sk --max-time 30 -o /dev/null -w '%{http_code} %{time_total}s\n' "https://climat-simf.ru$path"
done
```

Expected: every route returns `200` (or `307` for routes with auth redirects).

If any 500: rollback (Task 3.6).

### Task 3.4: Prod cold-start measurement — the main success criterion

- [ ] **Step 1: Wait one warm_all cycle (≤30 min)**

The warmer fires `*/30`. Either wait for the next tick or run it manually:

```bash
python <<'PY'
import paramiko
c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect("212.116.115.150", username="root", password="tRu741mAz", timeout=30)
_, stdout, _ = c.exec_command("/var/www/climat-simf.ru/scripts/warm_all.sh", timeout=3600)
print("warm_all exit:", stdout.channel.recv_exit_status())
c.close()
PY
```

Expected: exit 0 after a few minutes (warm data — should be fast now).

- [ ] **Step 2: Measure cold-start on 3 non-top-12 categories**

```bash
for slug in kabeli-i-perekhodniki-12041 knigi-i-zhurnaly-11432 muzyka-na-vinile-13002; do
  printf '%-45s ' "$slug"
  curl -sk --max-time 60 -o /dev/null -w '%{time_total}s %{http_code}\n' "https://climat-simf.ru/catalog/$slug"
done
```

**Success criterion:** every `time_total` < **2.0 sec**. If any exceeds 2 sec on warm data, the cache isn't actually hitting — debug via Step 3.

If pass: proceed to Task 3.5.

- [ ] **Step 3: (CONDITIONAL — only on failure) Inspect cache behavior**

Enable cache debug:
```bash
python <<'PY'
import paramiko, time
c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect("212.116.115.150", username="root", password="tRu741mAz", timeout=30)
_, so, _ = c.exec_command("pm2 set climat-simf-store:NEXT_PRIVATE_DEBUG_CACHE 1 && pm2 restart climat-simf-store", timeout=60)
print(so.read().decode("utf-8", errors="replace"))
time.sleep(5)
_, so, _ = c.exec_command("curl -sk --max-time 60 -o /dev/null -w '%{time_total}\\n' https://climat-simf.ru/catalog/kabeli-i-perekhodniki-12041; tail -40 /root/.pm2/logs/climat-simf-store-out-0.log | grep -i cache | tail -20", timeout=120)
print(so.read().decode("utf-8", errors="replace"))
c.close()
PY
```

Look for cache hit/miss logs. Most likely cause if all-miss: cache-key includes something runtime-changing (a closure capture). Fix in catalog.ts and redeploy.

After debugging: `pm2 unset climat-simf-store:NEXT_PRIVATE_DEBUG_CACHE && pm2 restart climat-simf-store`.

### Task 3.5: HANDOFF entry

**Files:**
- Modify: `web-store/HANDOFF.md`

- [ ] **Step 1: Prepend new entry**

Open `web-store/HANDOFF.md` and insert directly before the "2026-05-17 12:36 — Iter 17" entry:

```markdown
### 2026-05-17 <HH:MM> — Iter 18: cold-start fix via Next 16 'use cache' migration

- Spec: [`docs/superpowers/specs/2026-05-17-iter18-use-cache-migration-design.md`](docs/superpowers/specs/2026-05-17-iter18-use-cache-migration-design.md)
- Commits: <list each commit SHA from Phases 0-2>
- Deploy backup: `/var/www/climat-simf.ru.source-backup-<TIMESTAMP>.tar.gz`
- Closes the 17-30s cold-start debt from Iter 15C.

**Что вошло:**
- `next.config.ts`: `cacheComponents: true` (Next 16 feature flag).
- НОВЫЙ `src/lib/catalog-serialize.ts`: `productToPlain`, `categoryToPlain`, `normalizeCatalogCacheArgs`. 11 unit-тестов.
- `src/lib/catalog.ts`: все 5 cached helpers (`getActiveCategories`, `getCategoryProductCounts`, `getCategoryBySlug`, `getCatalogBrands`, `getHomeSnapshot`) + `getCatalogPage` migrated с `unstable_cache` на `'use cache'` directive + `cacheLife("hours")` + `cacheTag`. Brand-arg normalization для consistent cache key.
- Page-level `revalidate = 300` убран из `/catalog`, `/catalog/[slug]`, `/podborki/[slug]` (TTL теперь в cached fn).

**Verification:**
- 152/152 тестов (141 baseline + 11 новых для serialize helpers).
- `npm run build` успешен.
- Prod cold-start на non-top-12 (`kabeli-i-perekhodniki-12041`, `knigi-i-zhurnaly-11432`, `muzyka-na-vinile-13002`): **<2 сек** (было 21-26 сек).
- 8 smoke-routes 200.

**Rollback (если нужно):**
```bash
ssh root@212.116.115.150 'cd / && tar -xzf /var/www/climat-simf.ru.source-backup-<PRE_ITER18_TIMESTAMP>.tar.gz && cd /var/www/climat-simf.ru && rm -rf .next && npx next build && pm2 restart climat-simf-store'
```
```

Fill in: `<HH:MM>`, `<list each commit SHA>`, `<TIMESTAMP>` from Task 3.1 Step 2, `<PRE_ITER18_TIMESTAMP>` from the previous backup.

- [ ] **Step 2: Commit + push**

```bash
cd ..
git add web-store/HANDOFF.md
git commit -m "docs: HANDOFF entry for Iter 18 (cold-start fix deployed)"
git push origin claude/affectionate-shamir-feac14
```

### Task 3.6: (CONDITIONAL — only on failure) Rollback

Skip if Task 3.4 passed.

- [ ] **Step 1: Find pre-Iter-18 backup**

```bash
python <<'PY'
import paramiko
c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect("212.116.115.150", username="root", password="tRu741mAz", timeout=30)
_, so, _ = c.exec_command("ls -lt /var/www/climat-simf.ru.source-backup-*.tar.gz | head -5", timeout=30)
print(so.read().decode("utf-8", errors="replace"))
c.close()
PY
```

Pick the most recent backup that pre-dates Task 3.1's deploy timestamp.

- [ ] **Step 2: Restore + rebuild + restart**

```bash
python <<'PY'
import paramiko, time
c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect("212.116.115.150", username="root", password="tRu741mAz", timeout=30)
def run(cmd, t=900):
    _, so, _ = c.exec_command(cmd, timeout=t)
    return so.read().decode("utf-8", errors="replace").rstrip()
ts = "<PRE_ITER18_TIMESTAMP>"   # ← fill in from Step 1
print(run(f"pm2 stop climat-simf-store && cd / && tar -xzf /var/www/climat-simf.ru.source-backup-{ts}.tar.gz"))
print(run("cd /var/www/climat-simf.ru && npm install --include=dev --no-audit --no-fund 2>&1 | tail -2"))
print(run("cd /var/www/climat-simf.ru && rm -rf .next && npx next build > /tmp/rollback.log 2>&1; echo EXIT=$?"))
print(run("pm2 restart climat-simf-store"))
time.sleep(8)
print("hc:", run("curl -s -o /dev/null -w '%{http_code}' http://localhost:3001/"))
c.close()
PY
```

Expected: hc=200.

- [ ] **Step 3: Document rollback**

Add a note to `HANDOFF.md`:
```markdown
### 2026-05-17 <HH:MM> — Iter 18 ROLLBACK
- Reason: <one-line summary, e.g. "Cold-start measurement still >5s after cache migration, investigation pending">
- Restored backup: `/var/www/climat-simf.ru.source-backup-<PRE_ITER18_TIMESTAMP>.tar.gz`
- Branch state: code from Phases 0-2 stays in feature branch for diagnosis. NOT reverted in git.
```

Commit + push.

---

## Final tally

After Phase 3 (success path):
- 9 commits on feature branch (1 spec + 8 implementation/docs).
- Production runs Iter 18 with cold-start <2s on non-top-12 categories.
- 152/152 tests green.
- HANDOFF up to date.

On rollback path: code stays in feature branch for diagnostic; production reverted to pre-Iter-18 backup; HANDOFF logs the rollback reason.
