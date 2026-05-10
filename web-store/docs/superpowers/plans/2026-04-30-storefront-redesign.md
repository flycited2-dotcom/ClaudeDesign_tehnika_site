# Storefront Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert the public БытТехОпт site into a customer-facing retail storefront with cleaned copy, better catalog ordering, consent for personal data, and SEO/LLM discovery files.

**Architecture:** Keep the existing Next.js App Router structure and Prisma-backed catalog. Add small pure helpers for storefront constants and retail-safe product filtering, then reuse those helpers in server pages and tests.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Prisma, Vitest, Tailwind CSS, lucide-react.

---

## File Structure

- Create `src/lib/storefront.ts`: public brand/contact constants and customer-facing copy shared across header, footer, pages, SEO, and LLM text.
- Create `src/lib/retail-products.ts`: pure helper for degraded/demo product name detection and reusable Prisma filters.
- Create `src/lib/retail-products.test.ts`: TDD coverage for degraded/demo name filtering.
- Modify `src/lib/checkout/validation.ts`: add pure `validatePersonalDataConsent` helper.
- Modify `src/lib/checkout/validation.test.ts`: TDD coverage for required consent.
- Modify `src/app/checkout/actions.ts`: require `personalDataConsent` in submitted form data.
- Modify `src/app/checkout/checkout-client.tsx`: add required consent checkbox and customer-facing checkout copy.
- Modify `src/app/page.tsx`: replace technical homepage with retail storefront sections.
- Modify `src/lib/catalog.ts`: use retail-safe homepage filters and stronger product ordering.
- Modify `src/components/site-header.tsx`, `src/components/site-footer.tsx`, `src/components/product-card.tsx`, `src/components/catalog-grid.tsx`: replace public technical wording with retail wording.
- Modify `src/app/product/[slug]/page.tsx`, `src/app/catalog/page.tsx`, `src/app/search/page.tsx`, `src/app/cart/cart-client.tsx`, `src/app/order-success/[id]/page.tsx`: update public copy and metadata where useful.
- Create `src/app/privacy/page.tsx`: personal data processing policy page.
- Create `src/app/robots.ts`: allow public pages, disallow admin, reference sitemap.
- Create `src/app/sitemap.ts`: homepage, catalog, privacy, bounded categories/products.
- Create `src/app/llms.txt/route.ts`: machine-readable store summary for LLM discovery.

---

### Task 1: Retail Product Filtering Helper

**Files:**
- Create: `src/lib/retail-products.ts`
- Create: `src/lib/retail-products.test.ts`
- Modify: `src/lib/catalog.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from "vitest";
import { isDegradedRetailName } from "@/lib/retail-products";

describe("isDegradedRetailName", () => {
  it("detects damaged-package and demo-condition goods", () => {
    expect(isDegradedRetailName("Поврежденная упаковка клавиатура Defender")).toBe(true);
    expect(isDegradedRetailName("Уценка: холодильник")).toBe(true);
    expect(isDegradedRetailName("Витринный образец телевизор")).toBe(true);
    expect(isDegradedRetailName("Смартфон Samsung Galaxy")).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm.cmd test -- src/lib/retail-products.test.ts`

Expected: FAIL because `src/lib/retail-products.ts` does not exist.

- [ ] **Step 3: Implement helper and catalog usage**

```ts
import type { Prisma } from "@prisma/client";

export const degradedRetailNameTerms = [
  "поврежденная упаковка",
  "повреждённая упаковка",
  "уценка",
  "витринный образец",
  "б/у",
  "бу ",
  "некондиция",
];

export function isDegradedRetailName(name: string | null | undefined): boolean {
  const normalized = (name ?? "").toLocaleLowerCase("ru-RU");
  return degradedRetailNameTerms.some((term) => normalized.includes(term));
}

export function normalRetailNameWhere(): Prisma.ProductWhereInput {
  return {
    NOT: degradedRetailNameTerms.map((term) => ({
      OR: [
        { name: { contains: term, mode: "insensitive" } },
        { supplierName: { contains: term, mode: "insensitive" } },
      ],
    })),
  };
}
```

Use `normalRetailNameWhere()` in homepage product query and keep catalog ordering favoring images, availability, and prices.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm.cmd test -- src/lib/retail-products.test.ts`

Expected: PASS.

### Task 2: Personal Data Consent

**Files:**
- Modify: `src/lib/checkout/validation.ts`
- Modify: `src/lib/checkout/validation.test.ts`
- Modify: `src/app/checkout/actions.ts`
- Modify: `src/app/checkout/checkout-client.tsx`
- Create: `src/app/privacy/page.tsx`

- [ ] **Step 1: Write the failing test**

Add to `src/lib/checkout/validation.test.ts`:

```ts
import { validatePersonalDataConsent } from "@/lib/checkout/validation";

describe("validatePersonalDataConsent", () => {
  it("requires explicit personal data consent", () => {
    expect(() => validatePersonalDataConsent(undefined)).toThrow("Подтвердите согласие на обработку персональных данных.");
    expect(() => validatePersonalDataConsent("on")).not.toThrow();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm.cmd test -- src/lib/checkout/validation.test.ts`

Expected: FAIL because `validatePersonalDataConsent` is not exported.

- [ ] **Step 3: Implement consent validation and form checkbox**

```ts
export function validatePersonalDataConsent(value: FormDataEntryValue | null | undefined): void {
  if (value !== "on") {
    throw new Error("Подтвердите согласие на обработку персональных данных.");
  }
}
```

Call it in `createCheckoutOrder` before order creation. Add a required checkbox in checkout linking to `/privacy`. Create a simple Russian privacy policy page with contacts and processing purpose.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm.cmd test -- src/lib/checkout/validation.test.ts`

Expected: PASS.

### Task 3: Public Storefront Copy And Layout

**Files:**
- Create: `src/lib/storefront.ts`
- Modify: `src/app/layout.tsx`
- Modify: `src/app/page.tsx`
- Modify: `src/components/site-header.tsx`
- Modify: `src/components/site-footer.tsx`
- Modify: `src/components/product-card.tsx`
- Modify: `src/components/catalog-grid.tsx`
- Modify: `src/app/product/[slug]/page.tsx`
- Modify: `src/app/cart/cart-client.tsx`
- Modify: `src/app/checkout/page.tsx`
- Modify: `src/app/order-success/[id]/page.tsx`

- [ ] **Step 1: Add shared storefront constants**

```ts
export const storefront = {
  brand: "БытТехОпт",
  city: "Симферополь",
  region: "Крым, Херсонская и Запорожская области",
  phones: ["+7 978 579-29-95", "+7 978 599-13-69"],
  email: "zakaz@climat-simf.ru",
  hours: "ежедневно с 8:00 до 22:00",
  siteUrl: "https://climat-simf.ru",
};
```

- [ ] **Step 2: Rewrite public pages**

Replace public-facing implementation copy with retail copy from the approved spec. Keep admin pages unchanged.

- [ ] **Step 3: Verify no public technical copy remains**

Run:

```powershell
Get-ChildItem -Path src\app,src\components -Recurse -File -Include *.tsx,*.ts |
  Where-Object { $_.FullName -notmatch '\\admin\\|\\api\\' } |
  Select-String -Pattern 'I-T-P|PostgreSQL|Prisma|PM2|Nginx|VPS|синхронизац|админк' -CaseSensitive:$false
```

Expected: no public matches except imports or admin-only files.

### Task 4: SEO And LLM Discovery

**Files:**
- Create: `src/app/robots.ts`
- Create: `src/app/sitemap.ts`
- Create: `src/app/llms.txt/route.ts`
- Modify: `src/app/catalog/page.tsx`
- Modify: `src/app/catalog/[slug]/page.tsx`
- Modify: `src/app/product/[slug]/page.tsx`

- [ ] **Step 1: Add robots, sitemap, and LLM route**

Use Next.js metadata file conventions:

```ts
import type { MetadataRoute } from "next";
import { storefront } from "@/lib/storefront";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/admin/"] },
    sitemap: `${storefront.siteUrl}/sitemap.xml`,
    host: storefront.siteUrl,
  };
}
```

Sitemap should include static routes plus bounded visible categories/products. `llms.txt` should return text/plain.

- [ ] **Step 2: Add metadata**

Add customer-facing metadata for homepage, catalog, category, product, and privacy pages.

- [ ] **Step 3: Verify routes after build/dev server**

Check `/robots.txt`, `/sitemap.xml`, and `/llms.txt` return successful responses.

### Task 5: Verification, Commit, Deploy

**Files:**
- All changed implementation files.

- [ ] **Step 1: Run full local verification**

Run:

```powershell
npm.cmd test
npm.cmd run lint
npm.cmd run build
```

Expected: all exit with code 0.

- [ ] **Step 2: Start or reuse local dev server and visually inspect**

Open homepage, catalog, product page, checkout, privacy, robots, sitemap, and llms routes.

- [ ] **Step 3: Commit and push**

Stage only `web-store` implementation files. Do not stage unrelated root Python/doc changes.

- [ ] **Step 4: Deploy to VPS**

Upload changed `web-store` files to `/var/www/climat-simf.ru`, run `npm run build`, restart PM2 process `climat-simf-store`, verify Nginx serves public routes with HTTP 200.
