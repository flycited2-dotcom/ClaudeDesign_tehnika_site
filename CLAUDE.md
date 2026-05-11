# Project memory: БытТехОпт glass redesign

> Эта папка — отдельный workspace, не основной репо. Если ты Claude в новой сессии,
> прочти этот файл целиком и [`web-store/HANDOFF.md`](web-store/HANDOFF.md) перед
> любыми действиями.

## Что это

**`Сайт_дизайн_клод_прод/`** — рабочая копия интернет-магазина `БытТехОпт`
(`https://climat-simf.ru`), переработанная под **glass-дизайн** по шаблону
`БытТехОпт-prototype` (lying in `design-template/unzipped/`).

- `web-store/` — Next.js 16 + React 19 + Prisma 6 + Vitest. Это копия исходного
  проекта `Codex/Telegram_Sales_meneger/web-store`, начатая 2026-05-10 и
  переписанная под glass-визуал. **Это копия — не исходный репо.**
- `design-template/unzipped/` — JSX-исходник glass-шаблона
  («БытТехОпт-prototype»). Используется как **визуальный референс** для
  layout/CSS/иконок. Не запускается, не билдится — только читается.
- `design-template/template.zip` — оригинальный архив, из которого `unzipped/`.

## GitHub

- Репо: **`flycited2-dotcom/ClaudeDesign_tehnika_site`**
  (https://github.com/flycited2-dotcom/ClaudeDesign_tehnika_site)
- Ветка: `main` (force-pushed на старый main с merge-коммитом для исторического zip)
- Все коммиты идут сюда. Это **не** оригинальный `flycited2-dotcom/Telegram_Sales_meneger`.

## Прод

- Домен: `https://climat-simf.ru`
- VPS: `212.116.115.150` (root, пароль в env при деплое)
- App root на VPS: `/var/www/climat-simf.ru`
- PM2 process: `climat-simf-store` (port 3001, fork)
- Nginx + Let's Encrypt снаружи

## Команды

В `web-store/`:

```bash
npm run dev         # localhost:3000
npm run lint        # ESLint, должен быть чистым перед каждым коммитом
npm run test        # vitest, должно быть 122/122
npm run build       # Next.js production build — ОБЯЗАТЕЛЬНО прогонять перед deploy
                    # (build ловит RSC-границы, lint+test не ловят)
WEB_STORE_VPS_PASSWORD='...' python scripts/deploy_vps.py
                    # SSH-деплой: tar → /var/www/climat-simf.ru,
                    # backup, prisma generate, build, pm2 restart, healthcheck
```

Текущий пароль VPS прописан в `HANDOFF.md` для пуш-команды деплоя в этой сессии.
**Хранить только в env переменной**, не коммитить.

Деплой пишет backup в `/var/www/climat-simf.ru.source-backup-<timestamp>.tar.gz`.
Откат: `tar -xzf <archive> -C /var/www/climat-simf.ru`.

## Конвенции

### После каждого деплоя (обязательно)

1. Прогнать `npm run lint` + `npm run test` + `npm run build` локально.
2. Закоммитить `web-store/...` файлы с описательным сообщением (Iter N: ...).
3. `git push origin main`.
4. Запустить `python scripts/deploy_vps.py` из `web-store/`.
5. Smoke на проде: curl 5-8 ключевых роутов (`/`, `/catalog`, конкретные категории,
   `/product/<slug>`, `/cart`, `/favorites`, `/compare`, `/account`, `/b2b`, `/gov`).
6. **Дописать запись в [`web-store/HANDOFF.md`](web-store/HANDOFF.md)** —
   секция «История деплоев glass-редизайна», reverse chronological.
   Каждая запись: дата+время, commit SHA, backup timestamp, что вошло, что
   проверено, известные ограничения.
7. Коммит `docs: HANDOFF entry for <iter>` и push.

### Glass-дизайн

- Источник стилей: `web-store/src/styles/glass-template.css` — копия шаблонного
  `styles.css` (76 КБ). Менять **только при крайней необходимости**, обычно
  достаточно добавить override в `web-store/src/app/globals.css`.
- Базовые классы: `.glass`, `.glass-strong`, `.btn-primary/ghost/soft`, `.input`,
  `.p-card`, `.f-row`, `.cat-layout`, `.acc-layout`, `.b2b-banner`, `.bread`,
  `.section-head`, `.pager`, `.cat-toolbar` — все определены в template CSS.
- Дизайн-токены: `--accent`, `--accent-2`, `--text`, `--text-mute`, `--glass-bg*`,
  `--glass-stroke*`, `--shadow-*`, `--radius-*` — в `:root` шаблона.
- Шрифт: `Inter` через `next/font/google`, переменная `--font-inter`.

### Roles (b2c / b2b / gov)

- `lib/use-role.ts` — `useStorefrontRole()` хук читает localStorage,
  `setStorefrontRole()` пишет, default `b2c`.
- `lib/role-pricing.ts` — `getRolePricingConfig()` читает env-переменные
  `NEXT_PUBLIC_B2B_DISCOUNT_PERCENT` (default 10), `NEXT_PUBLIC_B2B_MIN_QTY`
  (default 5), `NEXT_PUBLIC_GOV_QUOTE_ENABLED` (default true).
- В `GlassProductCard`:
  - b2c — обычная цена + зачёркнутый RRP, если есть
  - b2b — note `Опт от N шт · <опт-цена>`, опт-цена = `retailPrice * (1 - %)` округ. до 10₽
  - gov — note «КП по 44-ФЗ / 223-ФЗ — оставьте заявку», цена скрыта («Цена по запросу»)
- На `/product/[slug]` aside содержит `ProductAsideActions` (client) с теми же
  ролевыми ценами + кнопками fav/compare + «Запросить КП».
- Кабинеты: `/account` (b2c), `/b2b`, `/gov` — каждый со своим `b2b-banner`
  (для b2b/gov) и `acc-sidebar` (`AccountShell` рендерит набор пунктов по
  `activeRole`).
- Иконка User в шапке: `Link href={role==='b2b' ? '/b2b' : role==='gov' ? '/gov' : '/account'}`.

### Telegram

- Бот для заказов: token хранится на сервере в `/var/www/climat-simf.ru/.env`
  (`TELEGRAM_BOT_TOKEN`, `TELEGRAM_MANAGER_CHAT_ID`).
- Сообщения отправляет `lib/telegram.ts` (`sendTelegramOrderNotification`) +
  inline `fetch` в `requestCallbackAction` и `requestQuoteAction`.
- 2026-05-11 токен был сменён на новый (выложен в чат в сессии, **рекомендую
  перевыпустить** через `@BotFather` `/revoke`).

### Local storage клиента

- Cart: `techno_market_cart_v1` — `cart-storage.ts` + `useCart()`
- Favorites: `techno_market_favorites_v1` — `sku-list-storage.ts` + `useFavorites()`
- Compare: `techno_market_compare_v1` — `sku-list-storage.ts` + `useCompare()` (max 4)
- Role: `techno_market_role_v1` — `use-role.ts` + `useStorefrontRole()`

## RSC / Next.js 16 — ловушки

1. **Никогда не передавать function prop** из server component в client component —
   Next.js 16 ругается `Functions cannot be passed directly to Client Components`
   и роняет страницу. Вместо функций — заранее вычисленные значения (Record,
   массив строк и т.п.). Один раз уже наступали на это в `CatalogSortSelect`
   (hotfix `0a4d6e3`).
2. **`react-hooks/set-state-in-effect`** lint-правило запрещает синхронный
   `setState` в `useEffect`. Workaround: setState внутри `setTimeout`/`then`
   callback.
3. **`npm run build` обязательно** перед деплоем — он ловит RSC-ошибки, которые
   `lint` + `test` пропускают (они проверяют отдельные модули, не сборку).
4. **Cold-start крупных категорий** (50k+ товаров) рендерится 8-11 с. Кэш
   греется через `unstable_cache` с `revalidate: 300`. На первый запрос —
   медленно. Curl-таймаут default 30 с — может казаться, что страница «не
   работает», нужно `--max-time 60`.

## Ключевые файлы (быстрый ориентир)

```
web-store/
├── src/
│   ├── app/
│   │   ├── layout.tsx                 # Inter font, SiteHeader, SiteFooter
│   │   ├── globals.css                # Tailwind + glass-template + overrides
│   │   ├── page.tsx                   # Главная: hero, категории, popular, promo, trust
│   │   ├── catalog/
│   │   │   ├── page.tsx
│   │   │   ├── [slug]/page.tsx
│   │   │   └── catalog-view.tsx       # Большой server-component-вьюер
│   │   ├── product/[slug]/page.tsx    # Карточка товара (glass aside + lightbox)
│   │   ├── cart/, checkout/
│   │   ├── favorites/, compare/       # client-side strored lists
│   │   ├── account/, b2b/, gov/       # 3 кабинета по role-spec
│   │   ├── callback/actions.ts        # server action для обратного звонка
│   │   ├── quote/actions.ts           # server action для КП
│   │   └── api/
│   │       ├── catalog/categories     # mega-menu drill-down
│   │       ├── catalog/products-by-sku
│   │       └── search/suggest         # header search dropdown
│   ├── components/
│   │   ├── site-header.tsx            # Client: topline, role-switch, search, mega-menu
│   │   ├── site-footer.tsx
│   │   ├── account-shell.tsx          # glass aside для кабинетов
│   │   ├── glass-product-card.tsx     # карточка с role-aware ценой + fav/compare
│   │   ├── product-aside-actions.tsx  # client-island на /product/[slug] aside
│   │   ├── catalog-pager.tsx          # Назад/1…N/Вперёд
│   │   ├── catalog-sort-select.tsx    # client auto-apply
│   │   ├── callback-button.tsx        # модал обратного звонка
│   │   ├── quote-request-button.tsx   # модал заявки КП
│   │   ├── product-gallery.tsx        # client с lightbox
│   │   ├── searchable-checkbox-list.tsx
│   │   ├── add-to-cart-button.tsx
│   │   ├── quick-order-form.tsx
│   │   ├── stock-badge.tsx
│   │   ├── art/fridge.tsx, art/coffee.tsx  # SVG-иллюстрации из шаблона
│   │   └── sku-list-grid.tsx          # для /favorites и /compare
│   ├── lib/
│   │   ├── use-role.ts, use-cart.ts, sku-list-storage.ts
│   │   ├── role-pricing.ts
│   │   ├── catalog.ts                 # getCatalogPage, getHomeSnapshot и т.д.
│   │   ├── catalog-breadcrumbs.ts     # truncateBreadcrumbLabel
│   │   ├── product-display.ts         # productShortTitle, buildProductFacts
│   │   └── (много прочего: fulfillment, format, telegram, seo-jsonld, …)
│   └── styles/glass-template.css      # КОПИЯ шаблонного styles.css — не редактировать
├── HANDOFF.md                          # история деплоев + статус проекта
├── AGENTS.md                           # «This is NOT the Next.js you know» — читать docs Next 16
├── prisma/schema.prisma
└── scripts/deploy_vps.py
```

## Karpathy guidelines (обязательно)

Я работаю в этом проекте по `karpathy-guidelines` skill. Главное:

- Простота важнее обширности — минимальное изменение.
- Surgical changes — трогаю только то, что нужно для задачи.
- Goal-driven — определяю критерий успеха до правок, проверяю после.
- Surface assumptions — если что-то непонятно, спрашиваю до кода.

## Известные долги (на 2026-05-11)

- Cold-start крупных категорий — нет cache warmer / ISR.
- Реальные опт-цены: схема Prisma пока без поля `wholesalePrice`. Кабинет работает
  без auth — это маркетинг-витрина + CTA.
- QA-тест `07-user-journeys.spec.ts` жалуется на CTA / анкорную навигацию на
  лендинге — пока не починено детально (нужно открыть spec и посмотреть, что
  именно ищет).
- «Смотреть видео» в hero на главной — пустой `href="#"`.
