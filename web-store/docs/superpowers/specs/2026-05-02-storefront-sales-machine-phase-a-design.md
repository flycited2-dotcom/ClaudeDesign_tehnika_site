# Storefront Sales Machine Phase A Design

## Goal

Improve the public storefront so it sells honestly and clearly before we expand the catalog/filtering system.

Phase A focuses on the core purchase path:

- catalog product cards
- product page
- cart
- checkout
- Telegram order notification

The main business rule is: public pages must not promise same-day receipt. Orderable goods should be presented as available from the supplier, with delivery under order in 7 days.

## User-Facing Stock And Delivery Rules

Use one public message everywhere for orderable products:

- stock: `В наличии у поставщика`
- delivery: `Доставка под заказ 7 дней`
- confirmation note: `Менеджер подтвердит наличие, цену и срок перед оформлением.`

If a product cannot be ordered, keep it disabled and show a clear unavailable state:

- stock: `Нет в наличии у поставщика`
- action: disabled add-to-cart button

Do not show `день в день` on public product, cart, checkout, or notification surfaces.

Implementation should centralize this copy in a small display helper so the same language is reused across components.

## Product Page

The product page should become the strongest sales screen.

Desktop layout:

- left: product gallery with thumbnails and counter
- center: brand/category/SKU, product title, short customer-facing description, characteristics table
- right: purchase panel with price, supplier stock, 7-day delivery, payment note, and add-to-cart action

Mobile layout:

- title and key stock/delivery facts visible early
- gallery
- sticky or prominent purchase action
- characteristics below in a readable table

Characteristics should not appear as cramped inline text or scattered chips. Use a definition-table style:

- label column with muted text
- value column with stronger text
- clear row spacing and borders
- long values wrap cleanly

Facts to show when available:

- SKU
- category
- brand
- part number
- barcodes
- warranty
- weight
- package volume
- order multiplicity
- delivery under order: 7 days

Description fallback should stay customer-facing. It should mention the real category/brand/warranty when available and explain that the manager confirms details.

## Catalog Product Cards

Phase A does not rebuild the full filter system yet, but cards should stop feeling like raw database rows.

Each product card should show:

- image or polished fallback
- brand/vendor
- product name
- SKU
- price
- supplier stock badge
- delivery note: `Под заказ 7 дней`
- multiplicity note when relevant
- add-to-cart button only when orderable

The card should remain dense and scannable. Do not add marketplace noise such as fake ratings, fake discounts, or artificial urgency.

## Cart

Cart should explain the order model clearly.

For each item:

- name
- SKU
- quantity controls
- unit price and line total
- delivery note: `Под заказ 7 дней`
- stock note: `В наличии у поставщика`

Summary panel:

- total
- order model note: this is a request, not instant paid checkout
- payment note: payment after manager confirmation / on receipt
- checkout button text can remain `Оформить заказ`, but nearby copy should say `Отправьте заявку, менеджер подтвердит заказ.`

Quantity controls must continue to respect multiplicity.

## Checkout

Checkout should be framed as a confirmed request.

Fields stay simple:

- name
- phone
- optional email
- comment
- personal data consent

Add clear explanatory copy:

- `После отправки заявки менеджер свяжется с вами, подтвердит наличие у поставщика, срок доставки 7 дней и итоговую стоимость.`
- `Оплата после подтверждения заказа.`

Button text should become more explicit:

- `Отправить заявку`

## Telegram Notification

Telegram order notification should include the same sales facts so the manager sees what the customer was promised:

- order number
- customer name
- phone
- email if present
- comment if present
- items with SKU, name, quantity, unit price, line total
- delivery line: `Доставка под заказ 7 дней`
- total

Do not include secrets, supplier API details, or internal implementation notes.

## Data And Scope

Phase A should not require a new supplier feed.

Use existing fields:

- `stockStatus`
- `isAvailable`
- `retailPrice`
- `multiplicity`
- product facts already available in `buildProductFacts`

For public delivery wording, use the business rule `7 days` rather than relying on `deliveryDays <= 0`, because current data can make the public UI say `день в день`.

Phase A does not include:

- deep marketplace-style filters
- attribute extraction from product names
- online payment
- customer account
- CRM workflow
- supplier order automation
- new admin screens

Those belong to later phases.

## Phase B Preview

After Phase A, improve catalog discovery:

- left filter panel closer to Holodilnik/Ozon patterns
- fast category chips
- sort by price, availability, and image presence
- key characteristics inside listing cards
- category-specific filters where data supports them
- better empty and loading states

Phase B should be planned separately after Phase A is verified.

## Testing And Verification

Local verification:

- unit tests for delivery label / product display helpers
- cart quote behavior still respects availability and multiplicity
- `npm.cmd test`
- `npm.cmd run lint`
- `npm.cmd run build`

Manual verification:

- open catalog
- confirm product cards show supplier stock and 7-day delivery
- open product page
- confirm characteristics are table-like and readable
- add item to cart
- confirm cart repeats 7-day delivery and request model
- submit test order
- confirm Telegram notification contains delivery under order in 7 days

Production verification:

- deploy to `/var/www/climat-simf.ru`
- restart `pm2 restart climat-simf-store --update-env`
- verify `https://climat-simf.ru` returns 200
- place one test order
- confirm Telegram group receives the order

## Success Criteria

- No public customer-facing surface says `день в день`.
- Orderable products say `В наличии у поставщика` and `Доставка под заказ 7 дней`.
- Product characteristics are readable, aligned, and not crammed into inline text.
- Product page has a clear purchase panel with price, delivery, payment, and add-to-cart.
- Cart and checkout explain that this is a request confirmed by a manager.
- Telegram notifications include the 7-day delivery promise.
- Existing tests, lint, and build pass.
