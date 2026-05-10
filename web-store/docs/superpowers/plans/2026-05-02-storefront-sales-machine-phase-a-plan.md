# Storefront Sales Machine Phase A Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the core storefront purchase path honest and sales-ready by showing supplier availability, 7-day under-order delivery, readable product facts, request-based checkout copy, and Telegram order notifications that match the public promise.

**Architecture:** Add one small fulfillment display helper, then reuse it from product facts, catalog cards, product page, cart, checkout, success page, and Telegram notifications. Keep the existing Prisma schema and order flow; Phase A changes presentation and customer-facing copy, not supplier sync or payment logic.

**Tech Stack:** Next.js App Router, React 19, TypeScript, Prisma, Vitest, Tailwind CSS, lucide-react.

---

## File Structure

- Create `src/lib/fulfillment.ts`: single source of truth for public stock/delivery copy.
- Create `src/lib/fulfillment.test.ts`: unit tests for supplier stock and 7-day delivery language.
- Modify `src/lib/product-display.ts`: use the fulfillment helper instead of data-derived same-day labels.
- Modify `src/lib/product-display.test.ts`: update facts and description expectations.
- Modify `src/components/stock-badge.tsx`: optionally accept custom text while preserving the existing state/tone API.
- Modify `src/components/product-card.tsx`: add supplier stock and 7-day delivery text to cards.
- Modify `src/app/product/[slug]/page.tsx`: restructure the product page into gallery, facts, and purchase panel.
- Modify `src/app/cart/cart-client.tsx`: add delivery/stock notes and request-based summary copy.
- Modify `src/app/checkout/checkout-client.tsx`: frame checkout as a request and change button copy.
- Modify `src/app/order-success/[id]/page.tsx`: repeat the 7-day manager-confirmed order model.
- Modify `src/lib/telegram.ts`: include delivery under order in Telegram messages.
- Modify `src/lib/order-notifications.test.ts`: verify notification failure remains safe and message body includes delivery copy.
- Modify `web-store/HANDOFF.md`: note Phase A completion after deployment and verification.

---

### Task 1: Centralize Fulfillment Copy

**Files:**
- Create: `src/lib/fulfillment.ts`
- Test: `src/lib/fulfillment.test.ts`

- [ ] **Step 1: Write the failing fulfillment tests**

Create `src/lib/fulfillment.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { publicFulfillmentText } from "@/lib/fulfillment";

describe("publicFulfillmentText", () => {
  it("shows supplier availability and 7-day under-order delivery for orderable products", () => {
    expect(publicFulfillmentText({ isAvailable: true })).toEqual({
      stockLabel: "В наличии у поставщика",
      stockShortLabel: "В наличии",
      deliveryLabel: "Доставка под заказ 7 дней",
      deliveryShortLabel: "Под заказ 7 дней",
      confirmationNote: "Менеджер подтвердит наличие, цену и срок перед оформлением.",
      canOrder: true,
    });
  });

  it("shows unavailable supplier copy for products that cannot be ordered", () => {
    expect(publicFulfillmentText({ isAvailable: false })).toMatchObject({
      stockLabel: "Нет в наличии у поставщика",
      stockShortLabel: "Нет в наличии",
      deliveryLabel: "Доставка под заказ 7 дней",
      deliveryShortLabel: "Под заказ 7 дней",
      canOrder: false,
    });
  });
});
```

- [ ] **Step 2: Run the failing test**

Run:

```powershell
npm.cmd test -- src/lib/fulfillment.test.ts
```

Expected: FAIL because `src/lib/fulfillment.ts` does not exist.

- [ ] **Step 3: Implement the helper**

Create `src/lib/fulfillment.ts`:

```ts
export type PublicFulfillmentInput = {
  isAvailable: boolean;
};

export type PublicFulfillmentText = {
  stockLabel: string;
  stockShortLabel: string;
  deliveryLabel: string;
  deliveryShortLabel: string;
  confirmationNote: string;
  canOrder: boolean;
};

export const PUBLIC_DELIVERY_DAYS = 7;

export function publicFulfillmentText({ isAvailable }: PublicFulfillmentInput): PublicFulfillmentText {
  return {
    stockLabel: isAvailable ? "В наличии у поставщика" : "Нет в наличии у поставщика",
    stockShortLabel: isAvailable ? "В наличии" : "Нет в наличии",
    deliveryLabel: `Доставка под заказ ${PUBLIC_DELIVERY_DAYS} дней`,
    deliveryShortLabel: `Под заказ ${PUBLIC_DELIVERY_DAYS} дней`,
    confirmationNote: "Менеджер подтвердит наличие, цену и срок перед оформлением.",
    canOrder: isAvailable,
  };
}
```

- [ ] **Step 4: Run the fulfillment test**

Run:

```powershell
npm.cmd test -- src/lib/fulfillment.test.ts
```

Expected: PASS, 2 tests.

- [ ] **Step 5: Commit Task 1**

Run:

```powershell
git add web-store/src/lib/fulfillment.ts web-store/src/lib/fulfillment.test.ts
git commit -m "Add public fulfillment display helper"
```

---

### Task 2: Remove Public Same-Day Delivery From Product Display

**Files:**
- Modify: `src/lib/product-display.ts`
- Test: `src/lib/product-display.test.ts`

- [ ] **Step 1: Update product display tests first**

In `src/lib/product-display.test.ts`, change the `buildProductFacts` expectation so the delivery fact ignores supplier `deliveryDays` and uses the public 7-day rule:

```ts
{ label: "Срок поставки", value: "Под заказ 7 дней" },
```

Add this test inside `describe("buildProductFacts", () => { ... })`:

```ts
it("never exposes same-day delivery copy in public facts", () => {
  const facts = buildProductFacts({
    sku: 123,
    deliveryDays: 0,
  });

  expect(facts).toContainEqual({ label: "Срок поставки", value: "Под заказ 7 дней" });
  expect(facts.map((fact) => fact.value).join(" ")).not.toContain("день в день");
});
```

In the fallback description test, change the delivery expectation to:

```ts
expect(description).toContain("Ориентировочный срок поставки: под заказ 7 дней.");
expect(description).not.toContain("2 дня");
expect(description).not.toContain("день в день");
```

- [ ] **Step 2: Run the product display tests and verify failure**

Run:

```powershell
npm.cmd test -- src/lib/product-display.test.ts
```

Expected: FAIL because `product-display.ts` still formats `deliveryDays` as supplier-provided day counts.

- [ ] **Step 3: Update product display implementation**

In `src/lib/product-display.ts`, import the helper:

```ts
import { publicFulfillmentText } from "@/lib/fulfillment";
```

Remove the old `deliveryLabel` function.

Add this local helper near the other label helpers:

```ts
function publicDeliveryShortLabel(): string {
  return publicFulfillmentText({ isAvailable: true }).deliveryShortLabel.toLowerCase();
}
```

Change the delivery fact line in `buildProductFacts` to:

```ts
pushFact(facts, "Срок поставки", publicFulfillmentText({ isAvailable: true }).deliveryShortLabel);
```

Change the description `orderNotes` delivery line to:

```ts
`Ориентировочный срок поставки: ${publicDeliveryShortLabel()}.`,
```

Keep `deliveryDays` in the input types for compatibility, but do not use it for public copy.

- [ ] **Step 4: Run product display tests**

Run:

```powershell
npm.cmd test -- src/lib/product-display.test.ts
```

Expected: PASS.

- [ ] **Step 5: Run fulfillment and product display tests together**

Run:

```powershell
npm.cmd test -- src/lib/fulfillment.test.ts src/lib/product-display.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit Task 2**

Run:

```powershell
git add web-store/src/lib/product-display.ts web-store/src/lib/product-display.test.ts
git commit -m "Use public delivery copy in product display"
```

---

### Task 3: Update Catalog Product Cards

**Files:**
- Modify: `src/components/stock-badge.tsx`
- Modify: `src/components/product-card.tsx`

- [ ] **Step 1: Make `StockBadge` accept an optional display label**

Change `src/components/stock-badge.tsx` to:

```tsx
import { stockLabel, stockTone } from "@/lib/stock";

export function StockBadge({ state, label }: { state: string; label?: string }) {
  return (
    <span className={`inline-flex w-fit items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${stockTone(state)}`}>
      {label ?? stockLabel(state)}
    </span>
  );
}
```

- [ ] **Step 2: Add public fulfillment copy to product cards**

In `src/components/product-card.tsx`, import the helper:

```ts
import { publicFulfillmentText } from "@/lib/fulfillment";
```

After `const price = decimalToNumber(product.retailPrice);`, add:

```ts
const fulfillment = publicFulfillmentText({ isAvailable: product.isAvailable && Boolean(price) });
```

Replace the existing badge call with:

```tsx
<StockBadge state={product.stockStatus} label={fulfillment.stockShortLabel} />
```

After the SKU line, add:

```tsx
<div className="mt-2 rounded-md bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-800">
  {fulfillment.deliveryShortLabel}
</div>
```

Change the add-to-cart disabled expression to:

```tsx
disabled={!fulfillment.canOrder || !price}
```

- [ ] **Step 3: Run lint for component typing**

Run:

```powershell
npm.cmd run lint
```

Expected: PASS.

- [ ] **Step 4: Commit Task 3**

Run:

```powershell
git add web-store/src/components/stock-badge.tsx web-store/src/components/product-card.tsx
git commit -m "Show supplier delivery copy on product cards"
```

---

### Task 4: Rework Product Page Into Gallery, Facts, Purchase Panel

**Files:**
- Modify: `src/app/product/[slug]/page.tsx`

- [ ] **Step 1: Import fulfillment helper**

In `src/app/product/[slug]/page.tsx`, add:

```ts
import { publicFulfillmentText } from "@/lib/fulfillment";
```

After `const price = decimalToNumber(product.retailPrice);`, add:

```ts
const fulfillment = publicFulfillmentText({ isAvailable: product.isAvailable && Boolean(price) });
```

- [ ] **Step 2: Use the public stock label in the purchase panel**

Change the existing stock badge to:

```tsx
<StockBadge state={product.stockStatus} label={fulfillment.stockLabel} />
```

Change the add-to-cart disabled expression to:

```tsx
disabled={!fulfillment.canOrder || !price}
```

- [ ] **Step 3: Replace the current two-column upper layout**

Keep `ProductGallery` on the left. Change the surrounding grid to this structure:

```tsx
<div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,0.95fr)_minmax(360px,0.75fr)_360px]">
  <ProductGallery images={galleryImages} name={name} />

  <section className="min-w-0 rounded-lg border border-zinc-200 bg-white p-6">
    <div className="flex flex-wrap gap-2">
      {product.category ? (
        <Link href={`/catalog/${product.category.slug}`} className="rounded-full bg-stone-100 px-3 py-1 text-xs font-semibold text-zinc-600">
          {product.category.name}
        </Link>
      ) : null}
      <span className="rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-800">{fulfillment.deliveryShortLabel}</span>
    </div>
    <p className="mt-5 text-sm font-semibold uppercase tracking-wide text-teal-700">{product.vendor ?? "Товар"}</p>
    <h1 className="mt-2 text-2xl font-black tracking-normal text-zinc-950 lg:text-3xl">{name}</h1>
    <p className="mt-3 text-sm leading-6 text-zinc-600">{description}</p>
    <div className="mt-5 text-sm text-zinc-500">SKU {product.sku}</div>
  </section>

  <aside className="h-fit rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
    <div className="flex flex-wrap gap-2">
      <StockBadge state={product.stockStatus} label={fulfillment.stockLabel} />
    </div>
    <div className="mt-5 text-4xl font-black text-zinc-950">{price ? formatRub(price) : "Цена уточняется"}</div>
    {product.rrp ? <div className="mt-2 text-sm text-zinc-500">РРЦ: {formatRub(decimalToNumber(product.rrp))}</div> : null}
    <div className="mt-5 rounded-md bg-emerald-50 p-3 text-sm text-emerald-900">
      <p className="font-semibold">{fulfillment.deliveryLabel}</p>
      <p className="mt-1 text-emerald-800">{fulfillment.confirmationNote}</p>
    </div>
    <div className="mt-5">
      <AddToCartButton sku={product.sku} multiplicity={product.multiplicity} disabled={!fulfillment.canOrder || !price} />
    </div>
    {product.multiplicity > 1 ? <p className="mt-3 text-sm text-amber-800">Заказ кратно {product.multiplicity} шт.</p> : null}
    <div className="mt-6 grid gap-2 text-sm text-zinc-600">
      <div className="flex gap-2 rounded-md bg-stone-50 p-3">
        <CreditCard className="size-5 shrink-0 text-teal-700" aria-hidden />
        <span>Оплата после подтверждения заказа менеджером.</span>
      </div>
      <div className="flex gap-2 rounded-md bg-stone-50 p-3">
        <Truck className="size-5 shrink-0 text-teal-700" aria-hidden />
        <span>Доставка по региону: {storefront.region}</span>
      </div>
    </div>
  </aside>
</div>
```

- [ ] **Step 4: Replace the facts cards with a definition table**

Replace the current characteristics `dl` with:

```tsx
<dl className="mt-4 divide-y divide-zinc-100 overflow-hidden rounded-md border border-zinc-100">
  {facts.map((fact) => (
    <div key={fact.label} className="grid gap-1 px-4 py-3 text-sm sm:grid-cols-[180px_minmax(0,1fr)] sm:gap-4">
      <dt className="text-zinc-500">{fact.label}</dt>
      <dd className="break-words font-semibold text-zinc-950">{fact.value}</dd>
    </div>
  ))}
</dl>
```

- [ ] **Step 5: Update order explanation copy**

In the `Как оформляется заказ` section, use these three bullets:

```ts
[
  "Вы добавляете товар в корзину и отправляете заявку.",
  "Менеджер подтверждает наличие у поставщика, цену и доставку под заказ 7 дней.",
  "Вы оплачиваете заказ после подтверждения.",
]
```

- [ ] **Step 6: Run lint and build**

Run:

```powershell
npm.cmd run lint
npm.cmd run build
```

Expected: both PASS.

- [ ] **Step 7: Commit Task 4**

Run:

```powershell
git add web-store/src/app/product/[slug]/page.tsx
git commit -m "Rework product page purchase details"
```

---

### Task 5: Update Cart, Checkout, And Success Copy

**Files:**
- Modify: `src/app/cart/cart-client.tsx`
- Modify: `src/app/checkout/checkout-client.tsx`
- Modify: `src/app/order-success/[id]/page.tsx`

- [ ] **Step 1: Update cart copy**

In `src/app/cart/cart-client.tsx`, import:

```ts
import { publicFulfillmentText } from "@/lib/fulfillment";
```

Inside `CartClient`, after the `error` state, add:

```ts
const fulfillment = publicFulfillmentText({ isAvailable: true });
```

Inside each cart item block, below the SKU line, add:

```tsx
<p className="mt-1 text-sm text-emerald-700">
  {fulfillment.stockLabel} · {fulfillment.deliveryShortLabel}
</p>
```

Replace the summary paragraph with:

```tsx
<p className="mt-2 text-sm text-zinc-500">
  Это заявка на заказ. Менеджер подтвердит наличие у поставщика, доставку под заказ 7 дней и итоговую стоимость.
</p>
<p className="mt-2 text-sm text-zinc-500">Оплата после подтверждения заказа.</p>
```

- [ ] **Step 2: Update checkout framing**

In `src/app/checkout/checkout-client.tsx`, add this paragraph immediately after the hidden `cartItems` input:

```tsx
<div className="rounded-md bg-emerald-50 p-4 text-sm leading-6 text-emerald-900">
  После отправки заявки менеджер свяжется с вами, подтвердит наличие у поставщика, доставку под заказ 7 дней и итоговую стоимость. Оплата после подтверждения заказа.
</div>
```

Change the button text to:

```tsx
{pending ? "Отправляем заявку..." : "Отправить заявку"}
```

- [ ] **Step 3: Update order success copy**

In `src/app/order-success/[id]/page.tsx`, change the main success paragraph to:

```tsx
<p className="mt-3 text-zinc-600">
  Спасибо за заявку. Менеджер свяжется с вами, подтвердит наличие у поставщика, доставку под заказ 7 дней и детали получения.
</p>
```

Inside each order item row, change the item label to:

```tsx
<span>
  SKU {item.sku} · {item.name} x {item.quantity}
  <span className="mt-1 block text-xs text-emerald-700">Доставка под заказ 7 дней</span>
</span>
```

- [ ] **Step 4: Run lint**

Run:

```powershell
npm.cmd run lint
```

Expected: PASS.

- [ ] **Step 5: Commit Task 5**

Run:

```powershell
git add web-store/src/app/cart/cart-client.tsx web-store/src/app/checkout/checkout-client.tsx web-store/src/app/order-success/[id]/page.tsx
git commit -m "Frame checkout as manager-confirmed request"
```

---

### Task 6: Add Delivery Promise To Telegram Notifications

**Files:**
- Modify: `src/lib/telegram.ts`
- Modify: `src/lib/order-notifications.test.ts`

- [ ] **Step 1: Extract Telegram message formatting for testability**

In `src/lib/telegram.ts`, import:

```ts
import { publicFulfillmentText } from "@/lib/fulfillment";
```

Add this exported function above `sendTelegramOrderNotification`:

```ts
export function buildTelegramOrderMessage({
  orderNumber,
  customerName,
  phone,
  email,
  comment,
  quote,
}: {
  orderNumber: string;
  customerName: string;
  phone: string;
  email?: string | null;
  comment?: string | null;
  quote: OrderQuote;
}) {
  const fulfillment = publicFulfillmentText({ isAvailable: true });
  const lines = [
    `Новый заказ ${orderNumber}`,
    `Имя: ${customerName}`,
    `Телефон: ${phone}`,
    email ? `Email: ${email}` : null,
    comment ? `Комментарий: ${comment}` : null,
    "",
    "Состав заказа:",
    ...quote.items.map(
      (item) => `- SKU ${item.sku} / ${item.name} / ${item.quantity} шт. / ${formatRub(item.unitPrice)} / ${formatRub(item.total)}`,
    ),
    "",
    fulfillment.deliveryLabel,
    fulfillment.confirmationNote,
    `Итого: ${formatRub(quote.total)}`,
    `Дата: ${new Date().toLocaleString("ru-RU")}`,
  ].filter(Boolean);

  return lines.join("\n");
}
```

Then replace the existing `lines` array and `text: lines.join("\n")` with:

```ts
text: buildTelegramOrderMessage({ orderNumber, customerName, phone, email, comment, quote }),
```

- [ ] **Step 2: Add Telegram message test**

In `src/lib/order-notifications.test.ts`, add:

```ts
import { buildTelegramOrderMessage } from "@/lib/telegram";
```

Add this test:

```ts
it("includes the public 7-day delivery promise in Telegram order messages", () => {
  const message = buildTelegramOrderMessage({
    orderNumber: "ORD-1",
    customerName: "Иван",
    phone: "+79780000000",
    email: null,
    comment: null,
    quote: {
      items: [
        {
          sku: 1001,
          name: "Осушитель воздуха",
          quantity: 1,
          unitPrice: 19990,
          total: 19990,
        },
      ],
      total: 19990,
    },
  });

  expect(message).toContain("Доставка под заказ 7 дней");
  expect(message).toContain("Менеджер подтвердит наличие, цену и срок перед оформлением.");
  expect(message).not.toContain("день в день");
});
```

- [ ] **Step 3: Run notification tests**

Run:

```powershell
npm.cmd test -- src/lib/order-notifications.test.ts
```

Expected: PASS.

- [ ] **Step 4: Commit Task 6**

Run:

```powershell
git add web-store/src/lib/telegram.ts web-store/src/lib/order-notifications.test.ts
git commit -m "Include delivery promise in order notifications"
```

---

### Task 7: Full Local Verification

**Files:**
- No source edits expected.

- [ ] **Step 1: Run all tests**

Run:

```powershell
npm.cmd test
```

Expected: PASS, including fulfillment, product display, checkout validation, and order notification tests.

- [ ] **Step 2: Run lint**

Run:

```powershell
npm.cmd run lint
```

Expected: PASS.

- [ ] **Step 3: Run production build**

Run:

```powershell
npm.cmd run build
```

Expected: PASS.

- [ ] **Step 4: Search for forbidden public same-day copy**

Run:

```powershell
Get-ChildItem -Path src -Recurse -File -Include *.ts,*.tsx | Select-String -Pattern "день в день"
```

Expected: no matches in public storefront code.

- [ ] **Step 5: Check for verification-only docs**

Run:

```powershell
git status --short -- web-store/HANDOFF.md
```

Expected: no output at this point. Leave `web-store/HANDOFF.md` for Task 8 after production verification.

```powershell
---

### Task 8: Production Deployment And Smoke Test

**Files:**
- Modify only `web-store/HANDOFF.md` after verification.

- [ ] **Step 1: Upload tracked storefront files to VPS without touching `.env`**

From the repository root, run this PowerShell command. Enter the VPS password when prompted; do not paste it into the command or commit it.

```powershell
@'
import getpass
import os
import posixpath
import subprocess
from pathlib import Path

import paramiko

repo = Path.cwd()
local_root = repo / "web-store"
remote_root = "/var/www/climat-simf.ru"
host = "212.116.115.150"
username = "root"
password = getpass.getpass("VPS password: ")

tracked = subprocess.check_output(["git", "ls-files", "web-store"], text=True, encoding="utf-8").splitlines()
files = [
    Path(path)
    for path in tracked
    if path.startswith("web-store/")
    and not path.endswith("/HANDOFF.md")
    and ".superpowers/" not in path.replace("\\", "/")
]

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(hostname=host, username=username, password=password, timeout=12, banner_timeout=12, auth_timeout=12)
sftp = client.open_sftp()

for relative in files:
    local_path = repo / relative
    remote_path = posixpath.join(remote_root, *relative.parts[1:])
    remote_dir = posixpath.dirname(remote_path)
    client.exec_command(f"mkdir -p {remote_dir!r}")[1].channel.recv_exit_status()
    sftp.put(str(local_path), remote_path)

sftp.close()
stdin, stdout, stderr = client.exec_command("cd /var/www/climat-simf.ru && test -f .env && echo ENV_OK && node -v && npm -v", timeout=30)
print(stdout.read().decode("utf-8", "replace").strip())
err = stderr.read().decode("utf-8", "replace").strip()
if err:
    print(err)
client.close()
'@ | python -
```

Expected output includes `ENV_OK`, a Node version, and an npm version.

- [ ] **Step 2: Build on VPS**

Run on VPS in `/var/www/climat-simf.ru`:

```bash
npm run build
```

Expected: build completes successfully.

- [ ] **Step 3: Restart PM2**

Run on VPS:

```bash
pm2 restart climat-simf-store --update-env
pm2 status climat-simf-store --no-color
```

Expected: `climat-simf-store` is `online`.

- [ ] **Step 4: Verify public site**

Run:

```bash
curl -I -L --max-time 20 https://climat-simf.ru/
```

Expected: `HTTP/1.1 200 OK`.

- [ ] **Step 5: Place one test order**

Use SKU `11261200` if it is still available; otherwise pick the first product returned by this read-only production query:

```bash
cd /var/www/climat-simf.ru && node - <<'NODE'
const fs = require('fs');
for (const line of fs.readFileSync('.env','utf8').split(/\r?\n/)) {
  const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
  if (!match) continue;
  let value = match[2];
  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1);
  process.env[match[1]] = value;
}
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
(async () => {
  const product = await prisma.product.findFirst({
    where: { isActive: true, isVisible: true, isAvailable: true, retailPrice: { not: null } },
    orderBy: [{ hasImage: 'desc' }, { updatedAt: 'desc' }],
    select: { sku: true, name: true, supplierName: true, slug: true },
  });
  console.log(JSON.stringify(product, null, 2));
})().finally(() => prisma.$disconnect());
NODE
```

Confirm:

- catalog card shows `Под заказ 7 дней`
- product page shows `В наличии у поставщика`
- product page shows `Доставка под заказ 7 дней`
- cart repeats the 7-day delivery model
- checkout button says `Отправить заявку`
- Telegram group receives the order with `Доставка под заказ 7 дней`

- [ ] **Step 6: Update handoff**

Add a short note to `web-store/HANDOFF.md`:

```md
- Phase A sales-machine storefront copy deployed: public stock/delivery now says `В наличии у поставщика` and `Доставка под заказ 7 дней`; product page, cart, checkout, success page, and Telegram notification verified with a test order.
```

- [ ] **Step 7: Commit handoff update**

Run:

```powershell
git add web-store/HANDOFF.md
git commit -m "Update handoff after storefront phase A"
```

---

## Self-Review Notes

- Spec coverage: stock/delivery copy is covered by Tasks 1-2; product page by Task 4; catalog cards by Task 3; cart/checkout/success by Task 5; Telegram by Task 6; local and production verification by Tasks 7-8.
- Scope control: Phase B catalog filtering is intentionally excluded from implementation tasks and remains a separate future plan.
- Type consistency: `publicFulfillmentText` returns the exact labels used by all UI and Telegram tasks.
