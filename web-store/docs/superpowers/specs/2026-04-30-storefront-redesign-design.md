# Storefront Redesign Design

## Goal

Turn the public БытТехОпт site from a technical implementation demo into a retail ecommerce storefront for household appliances, electronics, climate equipment, computer goods, and everyday consumer goods.

## Public Positioning

БытТехОпт is a retail online store for customers in Simferopol, Crimea, Kherson Oblast, and Zaporizhzhia Oblast. The public message is: large product selection, order through the catalog, manager confirmation, delivery across the stated regions, and payment on receipt.

Public pages must not mention supplier API details, I-T-P, PostgreSQL, VPS, PM2, Nginx, Prisma, synchronization internals, or other implementation details. Those details belong only in admin screens and internal docs.

## Brand And Contacts

- Brand name: `БытТехОпт`
- City: `Симферополь`
- Service region: `Крым, Херсонская и Запорожская области`
- Phone: `+7 978 579-29-95`
- Phone: `+7 978 599-13-69`
- Email: `zakaz@climat-simf.ru`
- Hours: `ежедневно с 8:00 до 22:00`
- Telegram: present as a customer contact channel tied to the public phone numbers. If the business provides a separate Telegram username, use that username instead.

## Homepage

The homepage should behave like a real ecommerce entry point, not a landing page for the integration. It should lead customers toward search, categories, products, and checkout.

Required sections:

1. Hero:
   - Headline: retail offer for household appliances, electronics, climate equipment, and goods for home.
   - Supporting copy: ordering from a large catalog, manager confirmation, delivery in Crimea, Kherson Oblast, and Zaporizhzhia Oblast, payment on receipt.
   - Primary CTA: `Перейти в каталог`.
   - Secondary CTA: `Как оформить заказ`.
   - Search form directly visible in the first viewport.

2. Trust strip:
   - Large assortment.
   - Manager confirms availability and delivery terms.
   - Delivery across the stated regions.
   - Payment on receipt.

3. Fast categories:
   - Household appliances.
   - Climate equipment.
   - Electronics.
   - Computer equipment.
   - Everyday goods.
   - Category cards should link into existing catalog/category routes where possible; if exact synced categories differ, use the best matching live categories.

4. Popular products:
   - Show available products with retail price and at least one image first.
   - Exclude degraded/demo merchandise from the homepage, including names containing terms like `поврежденная упаковка`, `уценка`, `витринный образец`, `б/у`, and similar.

5. How to order:
   - Choose products in the catalog.
   - Add to cart.
   - Leave contact details.
   - Manager confirms availability, delivery timing, and order details.
   - Customer pays on receipt.

6. Delivery and contacts:
   - State delivery region clearly.
   - Show both phones, email, city, and hours.

## Catalog

The catalog should stay dense and practical. It is for shopping, scanning, filtering, and repeated use.

Required behavior:

- Search by name, SKU, brand, part number, and barcode remains supported.
- Public filters: category, brand, availability.
- Product ordering should favor products with images, available stock, retail price, and normal retail names.
- Products with degraded/demo terms should not be shown on homepage product blocks. They may remain searchable in catalog unless the business creates a separate discounted goods section.
- Empty states must be customer-friendly and must not mention synchronization or admin actions.

## Product Cards

Product cards should show:

- Product image, or a polished retail fallback visual without technical wording.
- Brand/vendor when available.
- Customer-friendly stock badge.
- Product name.
- SKU.
- Price, or `Цена уточняется` when unavailable.
- Buy/add-to-cart action only when product can be ordered.

Avoid implementation copy such as `после синхронизации`.

## Product Page

The product page should focus on order confidence:

- Image gallery area.
- Brand, category, stock status, title, SKU, price.
- Add-to-cart action.
- Delivery/payment reassurance.
- Specs such as part number, warranty, weight, delivery timing where available.
- Description fallback should be customer-facing, not admin-facing.
- Ordering explanation should say that the manager confirms availability and delivery details.

## Cart And Checkout

Cart and checkout copy must be customer-facing:

- Cart empty state invites the customer back to catalog.
- Checkout explains that the manager will confirm the order and delivery.
- Payment message: customer pays on receipt.
- The checkout form must include consent to personal data processing.

## Personal Data Consent

Add a required personal data consent flow:

- Checkout form includes a required checkbox.
- Checkbox text: customer agrees to personal data processing and the privacy policy.
- Link the checkbox text to a public privacy/personal-data page.
- Order creation must fail if consent is not provided.
- The privacy page should state that submitted name, phone, email, order composition, and comment are used to process the order and contact the customer.
- The privacy page should list contacts for requests: `zakaz@climat-simf.ru` and public phones.
- Use clear Russian copy; no legal overengineering beyond a practical basic policy.

## Header And Footer

Header:

- Logo/brand: `БытТехОпт`.
- Subtitle should describe retail value, not B2B internals.
- Include search, catalog, contact cues, and cart.
- Keep admin link out of the prominent public navigation if possible; admin can remain accessible by direct URL.

Footer:

- Retail store description.
- Region, contacts, hours.
- Links: catalog, cart, checkout, privacy policy.
- No public sync/API/technical notes.

## SEO And LLM Discovery

Add or update:

- `robots.txt`: allow public pages, disallow admin routes, reference sitemap.
- `sitemap.xml`: include homepage, catalog, privacy page, and a bounded set of visible category/product URLs if practical.
- `llms.txt`: concise machine-readable description of the store, region, product categories, ordering model, contacts, and important URLs.
- Metadata for homepage and catalog should include retail keywords and region naturally:
  - household appliances
  - electronics
  - climate equipment
  - Simferopol
  - Crimea
  - Kherson Oblast
  - Zaporizhzhia Oblast

Do not keyword-stuff. The copy should be useful to humans and understandable for AI answer engines.

## Visual Direction

Use a clean, modern retail style:

- Light storefront, high contrast, clear hierarchy.
- Dense but readable catalog surfaces.
- Real product images should carry product cards.
- Cards should be functional, not decorative.
- Avoid technical-dashboard language on public pages.
- Avoid oversized marketing sections that push the catalog too far down.

## Success Criteria

- Public homepage contains no implementation/internal integration copy.
- Public header/footer/product/cart/checkout copy is customer-facing.
- Homepage product block does not show damaged-package or demo-condition goods.
- Catalog and product pages remain usable with real synced data.
- Checkout requires personal data consent before creating an order.
- `robots.txt`, sitemap, and `llms.txt` exist and are reachable.
- `npm run lint`, `npm run test`, and `npm run build` pass.
- Production deployment on `https://climat-simf.ru` shows the redesigned storefront.
