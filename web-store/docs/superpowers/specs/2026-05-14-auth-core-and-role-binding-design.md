# Auth core + Role binding (sub-projects A + B + admin)

## Context

В CLAUDE.md проекта зафиксирован открытый долг: «Кабинет без auth — `/account`, `/b2b`, `/gov` маркетинг-витрины без истории заказов и привязки КП к пользователю. Нужны user-схема и login-флоу (по телефону, OTP) — отдельный проект.»

Шаблон glass-дизайна (`design-template/unzipped/screen-account.jsx`, `screen-b2b.jsx`, `screen-gov.jsx`) содержит готовый визуал кабинетов с user identity, stats, KP-листами, прайс-листами, документами, менеджерами/кураторами, drag&drop ТЗ. Эти моки сейчас в проде заменены маркетинг-плейсхолдерами, потому что без auth/БД они не могут быть привязаны к конкретному юзеру.

Полный путь «как в шаблоне» = 5 независимых подпроектов: **A** Auth core, **B** Связка роли user, **C** B2C-данные, **D** B2B-данные, **E** GOV-данные. Этот spec покрывает **A + B + минимальный admin для апрува ролей**. После выполнения: вход в кабинеты работает, роль определяется по БД, есть базовый поток повышения роли до b2b/gov. Визуальное воссоздание моков заказов / КП / документов / менеджеров — следующие итерации (C/D/E).

Spec файл должен жить в проекте: `web-store/docs/superpowers/specs/2026-05-14-auth-core-and-role-binding-design.md`. Создаётся при выходе из plan mode.

## Архитектура

**Стек:** свой минимальный auth поверх Prisma + Next 16 server actions. Без NextAuth (раздут, плохо ложится на Next 16 RSC). Подписанный httpOnly cookie с session-токеном; source-of-truth — Postgres.

**Поток входа (email magic-link):**
1. `/login` (форма email) → server action `requestMagicLink(email)`: создаёт/находит `User` (роль `b2c` по умолчанию), генерит `MagicLinkToken` (TTL 15 мин), шлёт письмо со ссылкой `https://climat-simf.ru/login/verify?token=...`
2. `/login/verify?token=...` (route handler) → валидирует token (не consumed, не expired), создаёт `Session` (TTL 30 дней), ставит cookie `session_token` (httpOnly, Secure, SameSite=Lax), помечает `MagicLinkToken.consumedAt`, редирект на `?next=` или на кабинет по `user.role`
3. `/logout` (route handler) → удаляет `Session` из БД, чистит cookie, редирект `/`

**Email-доставка** через `lib/mailer.ts` — обёртка с двумя backends:
- `dev`: лог в stdout
- `prod`: SMTP через `nodemailer` (env: `SMTP_HOST/PORT/USER/PASS/FROM`). Если SMTP магазина недоступен — fallback Resend (env `RESEND_API_KEY`, 3000 emails/мес free)

**Защита роутов** через `src/middleware.ts`: проверка cookie на `/account/*`, `/admin/*`. `/b2b`, `/gov` остаются публичными (маркетинг-витрины с CTA). Анонов с защищённых роутов кидает на `/login?next=<path>`. Для server components — хелпер `getCurrentUser()` в `lib/auth.ts` (читает cookie, fetch user через Prisma, мемоизируется через React `cache()`).

## Prisma schema

Добавить в `prisma/schema.prisma`:

```prisma
enum Role {
  b2c
  b2b
  gov
}

enum RequestStatus {
  pending
  approved
  rejected
}

model User {
  id            String   @id @default(cuid())
  email         String   @unique
  name          String?
  role          Role     @default(b2c)
  phone         String?
  orgName       String?
  inn           String?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  sessions      Session[]
  roleRequests  RoleUpgradeRequest[]
}

model Session {
  id         String   @id @default(cuid())
  userId     String
  user       User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  token      String   @unique
  expiresAt  DateTime
  createdAt  DateTime @default(now())
  userAgent  String?
  ip         String?
  @@index([userId])
  @@index([expiresAt])
}

model MagicLinkToken {
  id          String    @id @default(cuid())
  email       String
  token       String    @unique
  expiresAt   DateTime
  consumedAt  DateTime?
  createdAt   DateTime  @default(now())
  @@index([email])
  @@index([expiresAt])
}

model RoleUpgradeRequest {
  id            String        @id @default(cuid())
  userId        String
  user          User          @relation(fields: [userId], references: [id], onDelete: Cascade)
  requestedRole Role
  status        RequestStatus @default(pending)
  orgName       String
  inn           String?
  contactPerson String
  phone         String
  note          String?
  reviewedBy    String?
  reviewedAt    DateTime?
  reviewNote    String?
  createdAt     DateTime      @default(now())
  @@index([status, createdAt])
}
```

Миграция: `npx prisma migrate dev --name auth_core`.

## Связка роли с UI

Текущее: `lib/use-role.ts` хранит роль в `localStorage` (`techno_market_role_v1`). Это остаётся для анонов, но для залогиненных source-of-truth — `user.role`.

**Гибридная модель:**

| Состояние | Источник роли | Можно переключить через UI? |
|-----------|---------------|------------------------------|
| Аноним | localStorage (как сейчас) | Да — для предпросмотра цен |
| Залогинен | `user.role` из БД | Нет — только админ-апрув |

**Server-side resolution** — новый `lib/role.ts`:
- `getActiveRole()`: если `getCurrentUser()` → `user.role`; иначе cookie `storefront_role` (anon preview) или дефолт `b2c`
- Server components используют `getActiveRole()` напрямую
- Client components получают role через React context. Провайдер в `app/layout.tsx` инициализируется значением из `getActiveRole()` на сервере. При логине context перезаписывается серверным значением и localStorage чистится.

**Шапка (`site-header.tsx`):**
- Анон: переключатель ролей как сейчас + кнопка «Войти» вместо иконки User
- Залогинен b2c: индикатор «Розница» (не-кликабельный pill) + иконка User → `/account` + мини-ссылка «Стать опт-клиентом» → `/b2b`
- Залогинен b2b: индикатор «Опт · ООО ...» + User → `/b2b`
- Залогинен gov: индикатор «Госзаказчик · ООО ...» + User → `/gov`

`AccountShell` показывает реальные `user.name`, `user.orgName`, `user.email` вместо «Гость».

## Запрос на повышение роли

На `/b2b` (публичная маркетинг-витрина):
- Анон → CTA «Запросить опт-аккаунт» открывает модал «Сначала войдите» с ссылкой на `/login?next=/b2b`
- b2c → модал `RoleUpgradeRequestModal` (форма: orgName, ИНН, контактное лицо, телефон, комментарий). Server action `requestRoleUpgrade({ requestedRole: 'b2b', ... })` создаёт `RoleUpgradeRequest` + шлёт Telegram-уведомление менеджеру через `lib/telegram.ts`
- b2b → текущий кабинет (маркетинговое содержимое, к которому в C/D/E прирастёт реальный data layer)

Аналогично `/gov` для `requestedRole: 'gov'`.

## Admin для апрува ролей

Минимальный шлюз. **Отдельная** auth-схема от user-сессий — никакой user не имеет доступа к `/admin` даже с ролью; только владелец `ADMIN_TOKEN` (env).

- `/admin/login` — форма с полем «токен». При совпадении с `env.ADMIN_TOKEN` ставит cookie `admin_session` (httpOnly, 24h, отдельный от `session_token`), редирект на `/admin`
- `/admin` (защищён middleware) — список pending `RoleUpgradeRequest` (newest first), для каждого: email юзера, requestedRole, orgName, ИНН, контакт, телефон, комментарий + 3 кнопки: «Одобрить», «Отклонить», «Открыть детали»
- Server action `approveRoleUpgrade(requestId, reviewNote?)`:
  1. Транзакция: `user.role = requestedRole`; `user.orgName/inn/phone` копируются из запроса; `request.status = approved`; `reviewedBy/At` заполняются
  2. Email юзеру: «Ваш статус опт-клиента одобрен — теперь вы видите опт-цены»
  3. Telegram-уведомление менеджеру
- Server action `rejectRoleUpgrade(requestId, reviewNote)`: статус rejected + email юзеру с причиной; роль не меняется

## Файлы

| Файл | Тип | Изменение |
|------|-----|-----------|
| `prisma/schema.prisma` | edit | + 4 модели + 2 enum + миграция `auth_core` |
| `src/lib/auth.ts` | new | `getCurrentUser()` cached, `createSession`, `destroySession`, `getSessionFromCookie`, константы cookie |
| `src/lib/mailer.ts` | new | nodemailer-обёртка, dev/prod backends |
| `src/lib/role.ts` | new | `getActiveRole()` server-side |
| `src/lib/use-role.ts` | edit | рефактор: читать через context, localStorage только для анонов |
| `src/components/role-provider.tsx` | new | React context-провайдер с серверной инициализацией |
| `src/app/login/page.tsx` | new | форма email + server action |
| `src/app/login/actions.ts` | new | `requestMagicLink` server action |
| `src/app/login/verify/route.ts` | new | route handler валидирует token, ставит cookie |
| `src/app/logout/route.ts` | new | destroy session, redirect `/` |
| `src/app/admin/login/page.tsx` | new | форма admin token |
| `src/app/admin/login/actions.ts` | new | `adminLogin` server action |
| `src/app/admin/page.tsx` | new | список pending RoleUpgradeRequest |
| `src/app/admin/actions.ts` | new | `approveRoleUpgrade`, `rejectRoleUpgrade` |
| `src/app/b2b/page.tsx` | edit | + кнопка «Запросить опт-статус» (для b2c юзеров) |
| `src/app/gov/page.tsx` | edit | + кнопка «Запросить гос-статус» (для b2c юзеров) |
| `src/app/account/page.tsx` | edit | приветствие именем юзера; middleware редиректит анонов |
| `src/components/site-header.tsx` | edit | гибридный role indicator + кнопка «Войти» |
| `src/components/account-shell.tsx` | edit | имя/реквизиты юзера из props/server |
| `src/components/role-upgrade-request-modal.tsx` | new | client-модал для b2b/gov upgrade |
| `src/app/api/role-upgrade/actions.ts` | new | `requestRoleUpgrade` server action |
| `src/middleware.ts` | new | защита `/account/*`, `/admin/*` |
| `.env.example` | edit | + `SMTP_HOST/PORT/USER/PASS/FROM`, `ADMIN_TOKEN`, `SESSION_SECRET`, опц. `RESEND_API_KEY` |
| `prisma/migrations/<timestamp>_auth_core/migration.sql` | new | от `prisma migrate dev` |

**Не трогаем:** `lib/role-pricing.ts`, `glass-product-card.tsx`, `product-aside-actions.tsx` (только через context), cart/fav/compare в localStorage, существующие Telegram-флоу callback/quote, `glass-template.css`.

## Существующие утилиты для переиспользования

- `lib/telegram.ts` — `sendTelegramOrderNotification` + inline fetch (как в `requestCallbackAction`, `requestQuoteAction`) → переиспользовать для уведомлений об одобрении ролей
- `lib/use-role.ts` (`useStorefrontRole`, `setStorefrontRole`, `ROLE_LABELS`) — оставить публичный API, поменять реализацию на context-based
- `lib/role-pricing.ts` (`getRolePricingConfig`) — без изменений, читает env как сейчас
- `components/account-shell.tsx` — `itemsByRole`, `titleByRole` уже описывают все 3 sidebar — расширить только user identity
- `lib/storefront.ts` (`storefront.phones`, `storefront.email`, `storefront.hours`) — переиспользовать для шаблонов писем и admin UI

## Verification

После реализации запустить и подтвердить выводы:

1. **Auth flow end-to-end (dev mode)**
   ```bash
   npm run dev
   curl -i http://localhost:3000/account              # 307 → /login?next=/account
   # POST email на /login → в stdout логе видим magic-link
   # GET ссылки → set-cookie session_token; redirect /account; видно имя юзера
   curl -b "session_token=..." http://localhost:3000/account   # 200
   # GET /logout → cookie очищен; redirect /
   ```

2. **Role gating**
   - В Prisma Studio (`npx prisma studio`) у юзера `role=b2c` → на `/b2b` видно «Запросить опт-статус» + индикатор «Розница» в шапке
   - Вручную в БД меняем `role=b2b` → reload `/b2b` → видно b2b-кабинет; шапка «Опт»
   - Анон-предпросмотр через переключатель ролей продолжает менять цены на каталоге

3. **Admin flow**
   - GET `/admin` без cookie → redirect `/admin/login`
   - POST `ADMIN_TOKEN` → cookie; видим список pending
   - Approve → проверить в БД: `user.role`, `user.orgName/inn/phone`, `request.status=approved`, `request.reviewedAt`; в stdout логе видим email

4. **Тесты (vitest)**
   - `lib/auth.test.ts`: createSession ставит cookie; getCurrentUser читает; expired session → null; consumed magic-link отвергается; double-consume отвергается
   - `lib/role.test.ts`: для anon — cookie/default; для залогиненного — user.role игнорируя cookie
   - `app/login/actions.test.ts`: новый email → создаёт юзера; повторный → не дублирует; email отправлен
   - `app/admin/actions.test.ts`: approve в транзакции меняет роль и копирует поля; reject не меняет роль; запрос без admin-cookie отвергается
   
   Цель: ≥ существующих 122 тестов + ~10-15 новых, всё зелёное.

5. **Build + lint + smoke**
   - `npm run lint` чистый
   - `npm run test` зелёный
   - `npm run build` без RSC-ошибок (особо проверить: не передаём function props из server в client в `RoleProvider`)
   - Smoke маршруты после деплоя: `/`, `/catalog`, `/login`, `/account` (redirect), `/b2b`, `/gov`, `/admin/login`

6. **Деплой** по существующему регламенту CLAUDE.md (lint → test → build → commit «Iter 12: auth core + role binding» → push → `python scripts/deploy_vps.py` → curl smoke → запись в `HANDOFF.md`).

## Out of scope (следующие подпроекты)

- **C — B2C-данные:** Prisma `Order`, `Address`, `BonusBalance`; история заказов на `/account` с `order-row`; «Рекомендуем»; адреса доставки; настройки профиля. Воссоздание моков из `screen-account.jsx`.
- **D — B2B-данные:** Prisma `Organization`, `OrganizationMember`, `QuoteRequest`, `PriceList`, `Manager`; реальные КП и status pills (KP_LIST); прайс-листы (XLSX/PDF) с upload в S3-совместимое хранилище; кредитный лимит; персональный менеджер на user. Воссоздание моков из `screen-b2b.jsx`.
- **E — GOV-данные:** Prisma `GovOrganization`, `TenderRequest`, `Contract`, `AccreditationDoc`; drag&drop ТЗ с upload; реестр контрактов; куратор. Воссоздание моков из `screen-gov.jsx`.
- Регистрация по телефону / SMS / Telegram-OTP
- Password-based auth
- Multi-user organization (user ↔ many orgs)
- Миграция localStorage cart/fav/compare в БД
- Полноценная админка (поиск/редактирование произвольных полей, audit log)
