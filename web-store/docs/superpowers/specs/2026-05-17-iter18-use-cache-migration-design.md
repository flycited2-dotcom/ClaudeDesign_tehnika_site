# Iter 18 — Cold-start fix через migration на Next 16 `'use cache'`

**Дата:** 2026-05-17
**Статус:** ⚠️ **АРХИВИРОВАН 2026-05-18 — план провалился на Phase 0.** См. revision note ниже. Актуальный план: [`2026-05-18-iter18b-unstable-cache-fix.md`](../plans/2026-05-18-iter18b-unstable-cache-fix.md).
**Зависимый коммит:** `f00e270` (Iter 17 docs)

## Revision note (2026-05-18)

Phase 0 этого spec'а провалилась при первой же попытке: `cacheComponents: true` в Next 16
**несовместим** не только с `export const revalidate` (что я предвидел), но и с
`export const dynamic = "force-dynamic"`. В проекте 24 routes (admin/login/checkout/API)
с `force-dynamic` — каждый из них Next отказывается компилировать при включённом
`cacheComponents`.

Это значит migration на `'use cache'` потребовала бы ревизии всех 24 routes
(удалить `force-dynamic` + verify что Next правильно классифицирует их через usage
of `cookies()`/`headers()`/`searchParams`). Это **большая surgical работа** с риском
сломать auth/admin/checkout flows.

В оригинальном брейнсторме (2026-05-17) я рекомендовал `unstable_cache` именно
из-за минимального риска, но пользователь выбрал `'use cache'` потому что Next 16
рекомендует. Failure mode на Phase 0 подтвердил мою исходную рекомендацию.

**Решение:** switch на `unstable_cache` approach. Цель (cold-start <2 сек) сохраняется,
архитектурный риск минимизируется. Новый plan: [`2026-05-18-iter18b-unstable-cache-fix.md`](../plans/2026-05-18-iter18b-unstable-cache-fix.md).

Этот spec остаётся в репо как историческая запись + объяснение почему путь
через `'use cache'` НЕ был выбран. Содержательно секции ниже устарели.

## Цель

Закрыть долг из Iter 15C: cold-start не-топ-12 категорий — 17–30 сек на проде.
Сейчас `warm_all.sh` cron */30 пингает все 1755 категорий, но cache hit
непостоянный, потому что:

- `getCatalogPage(query)` НЕ обёрнут в `unstable_cache` — каждый запрос
  делает heavy Prisma findMany+count+facets.
- На page-level `export const revalidate = 300` стоит, но
  `await searchParams` в Next 16 автоматически делает страницу dynamic,
  ISR не работает.

**Замеры на проде (Iter 15C):**

| URL | Запрос 1 | Запрос 2 | Запрос 3 |
| --- | --- | --- | --- |
| `/catalog/umnye-chasy-12508` | 30.2 с | 26.6 с | 17.6 с |
| `/catalog/kabeli-i-perekhodniki-12041` | 21.1 с | — | — |
| `/catalog/bytovaya-tehnika-9839` (топ-12) | 2.2 с | — | — |

## Решения брейнсторма

| Вопрос | Решение |
| --- | --- |
| Скоп оптимизации | **Default popular page 1 + основные фильтры (бренд, сорт, пагинация).** Cache key = slug + page + sort + brands[]. |
| Cache primitive | **`'use cache'` directive** (Next 16 native), не `unstable_cache` (deprecated). |
| Scope migration | **Full migration**: все 5 существующих `unstable_cache` helpers + новый `getCatalogPage` + transform layer. |
| Подход внедрения | **POC-driven phased rollout** (Phase 0 → 1 → 2 → 3), не «всё сразу». |

## Архитектура

### Глобальный конфиг (Phase 0)

Включить feature flag в `next.config.ts`:

```ts
const nextConfig: NextConfig = {
  cacheComponents: true,
  // ...existing config
};
```

Это активирует `'use cache'` directive. Поведение Next меняется:
routes становятся cacheable-by-default, dynamic APIs (`cookies()`,
`headers()`, `searchParams`) триггерят dynamic explicit.

### Serialization layer

Новый файл `src/lib/catalog-serialize.ts` (~40-60 строк):

```ts
export type PlainProduct = {
  id: string;
  slug: string;
  sku: number;
  name: string | null;
  supplierName: string;
  vendor: string | null;
  part: string | null;
  retailPrice: number | null;          // Decimal → number
  // ...все scalar fields → plain TypeScript types
  isAvailable: boolean;
  hasImage: boolean;
  images: PlainImage[];
  attributes: PlainAttribute[];
  category: PlainCategory | null;
  createdAt: string;                    // Date → ISO string
  updatedAt: string;
};

export type PlainImage = { id: string; priority: number };
export type PlainAttribute = { key: string; value: string };
export type PlainCategory = { id: string; slug: string; name: string };

export function productToPlain(p: ProductWithIncludes): PlainProduct {
  return {
    ...p,
    retailPrice: p.retailPrice ? Number(p.retailPrice) : null,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
    images: p.images.map((i) => ({ id: i.id, priority: i.priority })),
    attributes: p.attributes.map((a) => ({ key: a.key, value: a.value })),
    category: p.category ? categoryToPlain(p.category) : null,
  };
}
```

Helper вызывается **внутри** cached fn перед return. Reverse-transform
не нужен — UI работает с number/string напрямую через существующий
`decimalToNumber()` helper, который уже принимает string.

### Migration существующих helpers

Все 5 helpers в `src/lib/catalog.ts`:

```ts
// БЫЛО:
export const getActiveCategories = unstable_cache(
  async (): Promise<FlatCategory[]> => { ... },
  ["active-catalog-categories"],
  { revalidate: STOREFRONT_CACHE_SECONDS, tags: ["catalog"] }
);

// СТАНЕТ:
import { cacheLife, cacheTag } from "next/cache";

export async function getActiveCategories(): Promise<FlatCategory[]> {
  "use cache";
  cacheLife("hours");      // 1 hour revalidate
  cacheTag("catalog");
  return prisma.category.findMany({ ... });
}
```

- `getActiveCategories`, `getCategoryProductCounts`, `getCategoryBySlug`,
  `getCatalogBrands` — scalar fields, transform не нужен.
- `getHomeSnapshot` — products с Decimal/Date, нужен `productToPlain(p)` map.
  Возвращает `{ categories, products: PlainProduct[] }`.

### Новый: `getCatalogPage` под `'use cache'`

```ts
export async function getCatalogPage(query: CatalogQuery) {
  "use cache";
  cacheLife("hours");
  cacheTag("catalog");
  cacheTag("products");

  // Нормализация args для consistent cache key:
  const normalizedBrands = (query.brands ?? [])
    .map((b) => b.trim().toLowerCase())
    .sort();

  // ...existing logic (filteredWhere, fetch, interleave, total, brands,
  // categories, facets, etc) — без изменений в логике.

  return {
    category,
    categoryPath,
    products: products.map(productToPlain),
    total,
    page,
    perPage,
    categories,
    brands: brandFilterOptions,
    // ...prefer plain types throughout
  };
}
```

Function arguments автоматически становятся cache key (по docs Next 16).
Замыкания захватываются как cache key parts тоже — нужно убедиться
что внутри `getCatalogPage` нет captured runtime-data (cookies/headers).

### Page-level cleanup

- `src/app/catalog/[slug]/page.tsx` — убрать `export const revalidate = 300`.
- `src/app/catalog/page.tsx` — то же.
- `src/app/page.tsx` (homepage) — если есть `revalidate`, убрать.
- `src/app/podborki/[slug]/page.tsx` — то же.

TTL переезжает внутрь cached fn через `cacheLife("hours")`.

### Admin/API audit

Проверить все routes на использование runtime-APIs (cookies/headers/searchParams)
и явно поставить `export const dynamic = "force-dynamic"` где нужно:

- `src/app/admin/**/*.tsx` — все admin pages.
- `src/app/login/**`, `src/app/logout/**` — auth flows.
- `src/app/api/**/*.ts` — API routes.
- `src/app/checkout/**`, `src/app/cart/**` — corner cases.

Особо проверить:
- `/api/search/suggest` — уже `dynamic = "force-dynamic"`.
- `/api/product-images/[id]` — уже `dynamic = "force-dynamic"`.
- `/api/cart/quote`, `/api/catalog/products-by-sku`, `/api/catalog/categories`,
  `/api/catalog/categories/flat` — проверить.

### Что НЕ меняем

- Admin routes (используют cookies/headers — auto-dynamic).
- Login/logout/checkout (dynamic by nature).
- Warmer scripts (продолжают работать как health-check + cache priming).
- `src/app/api/search/suggest` (tokenized, query разнообразный — не cache-friendly).
- Round-robin interleave logic из Iter 17 — она внутри `getCatalogPage`, продолжает работать.

## Phased rollout

### Phase 0 — smoke `cacheComponents: true`

- Добавить flag, ничего больше не менять.
- `npm run lint && test && build` локально.
- Если build выводит warnings/errors про "dynamic API in cached scope" —
  добавить explicit `export const dynamic = "force-dynamic"` в проблемные routes.
- ✓ verify: 141/141 тестов проходят.
- ✓ verify: `npm run dev` → все ключевые routes работают (через старые `unstable_cache`).
- Commit Phase 0.

### Phase 1 — POC: один helper

- Migrate `getCategoryBySlug` (самый простой, scalar fields, нет Decimal).
- `npm run lint && test && build`.
- ✓ verify: `/catalog/<slug>` отвечает 200, данные корректны.
- Если работает — commit и продолжаем.
- Если нет — rollback, переосмыслить.

### Phase 2 — full migration

- Migrate остальные 4 helpers + `getCatalogPage`.
- Добавить `catalog-serialize.ts`.
- Убрать page-level `revalidate`.
- Audit admin/api routes.
- `npm run lint && test && build`.
- ✓ verify: local dev smoke — все ключевые routes работают.
- Commit Phase 2.

### Phase 3 — prod deploy

- Push + `python scripts/deploy_vps.py`.
- На VPS вручную (по правилам из CLAUDE.md):
  ```bash
  cd /var/www/climat-simf.ru
  pm2 stop climat-simf-store
  npm install --include=dev --no-audit --no-fund
  rm -rf .next && npx next build
  pm2 restart climat-simf-store
  ```
- ✓ verify: 8 smoke-routes (`/`, `/catalog`, `/catalog/bytovaya-tehnika-9839`,
  `/service`, `/b2b`, `/gov`, `/bot`, `/login`) → 200.
- ✓ verify (главное): cold-start замеры на 3 не-топ категориях
  (`kabeli-i-perekhodniki-12041`, `knigi-i-zhurnaly-11432`,
  `muzyka-na-vinile-13002`) — **должно быть <2 сек** (было 21–26 сек).

## Success criteria (verifiable)

1. `/catalog/kabeli-i-perekhodniki-12041` cold-start <2 сек (было 21 сек).
2. `/catalog/<slug>?brand=Bosch` cold-start <2 сек после первого hit.
3. **141/141 тестов проходят.**
4. `npm run build` успешен на VPS и локально.
5. Admin `/admin/role-requests` доступен залогиненному админу.
6. Search `/search?q=indesit стиральная машина` возвращает товары (tokenized search не сломан).
7. Checkout flow работает (cart → checkout с auth-cookie).
8. `/api/catalog/categories/flat` возвращает 1755 slugs (warmer не сломан).

## Risks

| # | Риск | Severity | Mitigation |
| --- | --- | --- | --- |
| 1 | `cacheComponents: true` ломает admin/login/checkout | **Critical** | Phase 0 catches это до migration. Explicit `force-dynamic` в проблемных routes. |
| 2 | Decimal/Date serialization упустили поле | High | TypeScript строгая типизация `PlainProduct` + compile-time errors. |
| 3 | Build занимает дольше (cacheComponents prerender) | Low | Build не runtime-критичен. Если >5 мин — оптимизация SSG paths отдельно. |
| 4 | Cache key sensitivity (Bosch vs bosch) | Medium | Нормализация args в одном месте перед cache. |
| 5 | Warmer попадает на старые TTL | Low | Первый цикл после deploy всё прогреет. ~3–5 мин лаг. |
| 6 | VPS deploy traps (502 как в Iter 17) | High | Применять заученные правила (npm install + rm -rf .next + rebuild + restart). Phased deploy с verify gate. |

## Rollback

**Level 1 (locally, до prod):** git revert последнего commit'a, lint/test/build, redeploy.

**Level 2 (с prod):**
```bash
# Найти pre-Iter-18 backup:
ssh root@212.116.115.150 'ls -lt /var/www/climat-simf.ru.source-backup-*.tar.gz | head -5'
# Восстановить:
ssh root@212.116.115.150 'cd / && tar -xzf /var/www/climat-simf.ru.source-backup-<TIMESTAMP>.tar.gz'
# Rebuild:
ssh root@212.116.115.150 'cd /var/www/climat-simf.ru && rm -rf .next && npx next build && pm2 restart climat-simf-store'
```
Время rollback: ~5–7 мин.

## Что НЕ входит

- Cache для search results (tokenized query разнообразный — не cache-friendly).
- Cache для admin/login/checkout (dynamic by design).
- Cache для page 2+ с очень нишевыми фильтрами (cache miss всё равно, не стоит payload).
- Background image cache layer (отдельный долг, не связан с этим fix'ом).
- Sync-pipeline hasImage bug fix (отдельный репо, не связан).

## Зависимости

- Iter 15C (`warm_all.sh` + cron */30) — продолжает работать как cache priming.
- Iter 17 (`interleaveByTopCategory`) — продолжает работать внутри `getCatalogPage`.
- Iter 15D (`images: { some: ... }` filter + price-band) — продолжают применяться.
- Iter 15E (tokenized search) — не затрагивается, search route остаётся dynamic.

## Verification commands (cheat-sheet)

```bash
# Локально:
cd web-store
npm run lint
npm run test
npm run build

# На VPS (через paramiko):
pm2 stop climat-simf-store
npm install --include=dev --no-audit --no-fund
rm -rf .next && npx next build > /tmp/build.log 2>&1
pm2 restart climat-simf-store

# Замер cold-start (на проде):
for slug in kabeli-i-perekhodniki-12041 knigi-i-zhurnaly-11432 muzyka-na-vinile-13002; do
  curl -sk --max-time 60 -o /dev/null -w "$slug → %{time_total}s %{http_code}\n" \
    "https://climat-simf.ru/catalog/$slug"
done
```
