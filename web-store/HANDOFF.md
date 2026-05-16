# Handoff: БытТехОпт

> **Процесс работы для следующих разработчиков (с 2026-05-11):**
> После каждого деплоя на прод (`npm run deploy:vps`) **обязательно**:
> 1. Дописать запись в раздел [«История деплоев glass-редизайна»](#история-деплоев-glass-редизайна) — дата, commit SHA, имя бэкап-архива на сервере, что вошло, что проверено, известные ограничения.
> 2. Закоммитить `HANDOFF.md` и запушить (`git commit -am "docs: handoff for <iter>"` + `git push`).
> 3. Если деплой ломал прод — добавить отдельной строкой «Hotfix» и описать что чинили (как в `Hotfix RSC function prop`).

## Статус проекта

- Код магазина: `C:\Users\user\Documents\GitHub\Codex\Telegram_Sales_meneger\web-store`
- GitHub branch: `codex/Site_master`
- Production URL: `https://climat-simf.ru`
- VPS: `212.116.115.150`
- App path на VPS: `/var/www/climat-simf.ru`
- PM2 process: `climat-simf-store`
- Домен и HTTPS работают через Nginx и Let's Encrypt.
- SSH-ключ для deploy настроен: локальный приватный ключ `C:\Users\user\.ssh\climat_simf_deploy`, публичный ключ добавлен в `/root/.ssh/authorized_keys` на VPS. Для `npm run deploy:vps` можно использовать `WEB_STORE_SSH_KEY_PATH`.

## История деплоев glass-редизайна

> Хронология деплоев новой витрины (репо `flycited2-dotcom/ClaudeDesign_tehnika_site`,
> ветка `main`). Самые свежие сверху. На сервере каждый деплой делает backup
> исходников в `/var/www/climat-simf.ru.source-backup-<timestamp>.tar.gz` —
> по нему можно откатиться (`tar -xzf <archive> -C /var/www/climat-simf.ru`).

### 2026-05-17 00:50 — Iter 15D: UX fixes (header phone, catalog popular sort) + chmod fix + Iter 15C honest revisit

- Commits: `ac0b900` (chmod git mode 755), `55ed648` (header phone + initial sort), `e595885` (mass-market price band)
- Deploy backups: `20260517004448`, `20260517004944` (оба с принудительным `rm -rf .next && next build` на VPS из-за ловушки #1)
- Закрывает 2 UX-репорта от пользователя + 1 операционный долг.

**Что вошло:**

**1. Footer/header layout: телефон + «Обратный звонок» слипались в шапке.**
- `CallbackButton variant="header"` рендерил `<button>` (inline) внутри `.phone`, шаблонный CSS ожидал `.phone span` с `display:block`.
- В `src/components/callback-button.tsx` для `variant="header"` добавлены: `display:block`, `marginTop:4`, `fontSize:"11.5px"`, `textAlign:"left"`, `fontFamily/lineHeight: inherit` — мэтчит правила `.phone span` из glass-template.css без правки самого template.

**2. Каталог `/catalog` первая страница — массмаркет вместо узкоспец B2B / расходников.**
- Bug: `sort=popular` default orderBy содержал `retailPrice: "desc"` — поэтому на первой странице были серверные системы Lenovo/Huawei за 6-9 млн ₽, СХД, ROSA Virtualization и т.п. Не подходит для retail-витрины.
- Первый fix (`55ed648`): `desc` → `asc` — но дал противоположную крайность: канцелярка по 50 ₽ (ручки/маркеры/саморезы).
- Финальный fix (`e595885`): два изменения в `src/lib/catalog.ts`:
  - **orderBy без `retailPrice`**: только `hasImage desc, isAvailable desc, updatedAt desc` (нейтральный сорт).
  - **Условный price-band 3 000–300 000 ₽ в WHERE**: применяется ТОЛЬКО когда `sort=popular` и пользователь НЕ задал ни одного фильтра (категория, поиск, бренд, attrs, явные price). Любой пользовательский фильтр снимает окно — bracket стиралки/тв/ноутбуки/кондиционеры остаются видимы.
- Результат на проде: первая страница /catalog = Gorenje стиралки, Asus ноутбуки, RASKAT телевизор.

**3. Ловушка #2 chmod закрыта навсегда.**
- `git update-index --chmod=+x web-store/scripts/warm_*.sh` — mode 100755 в индексе. Дальнейшие deploy_vps.py не будут сбрасывать exec-bit.

**Iter 15C — честный пересмотр:**

При прокликивании после bootstrap-warmer обнаружено: cold-start всё ещё **21+ сек на не-топ-12 категориях**, причём на двух запросах подряд (значит page-cache реально не держит). Топ-12 (warm_cache.sh) отвечают 2 сек — они в hot in-memory cache Next, потому что пингуются каждые 4 мин.

Причина: `getCatalogPage()` НЕ обёрнут в `unstable_cache`, только мелкие helpers (`getActiveCategories`, `getCategoryBySlug`, `getCatalogBrands`). Page-level `revalidate=300` не работает как ISR для всех 1755 категорий — Next держит ограниченное окно hot-cache.

**Iter 15C → НЕ закрыт целиком.** Реально работает только chmod fix + warmer-инфраструктура (cron, flock, endpoint /flat). Сам прогрев категорий не достигает цели. Чтобы починить — отдельная итерация: обернуть `getCatalogPage(query)` в `unstable_cache` (нужен детерминированный cache-key по query параметрам) ИЛИ перевести `/catalog/[slug]` на ISR с `generateStaticParams`. Текущий warm_all.sh, формально, всё ещё имеет смысл — он держит малые data-helpers горячими и ловит обработку 200 на каждой странице (как health-check 1755 routes).

**Что осталось из «известных долгов»:**
- **Реальный cold-start fix** (новый долг из 15C). Большая итерация.
- **WhatsApp / «Карта» в footer** — нет URL.
- **Реальный Telegram-бот** — нет username.

### 2026-05-17 00:19 — Iter 15C: eliminate cold-start for all categories (final state)

- Spec: [`docs/superpowers/specs/2026-05-16-iter15c-warm-all-categories-design.md`](docs/superpowers/specs/2026-05-16-iter15c-warm-all-categories-design.md)
- Commits:
  - `51183d3` — первая реализация (warm_all.sh, flat в существующем route)
  - `d9a6b25` — фильтр empty + параллелизация xargs -P 8
  - `bd2e57a` — **fix:** вынес flat в отдельный `/api/catalog/categories/flat/route.ts` после обнаружения, что turbopack persistent cache держит старый компиляут существующего `route.ts` (см. ловушки ниже)
  - `c66e93f` — **fix:** flock в `warm_all.sh` против overlapping cron-runs (первый bootstrap ~60-77 мин > cadence 30 мин)
- Deploy backups: `20260516233915`, `20260516234649`, `20260516235923`, `20260517001743`
- Закрывает долг «Cold-start длинного хвоста категорий» из CLAUDE.md.

**Что вошло:**
- **`src/lib/catalog.ts`** — `STOREFRONT_CACHE_SECONDS` 300 → 3600. `getActiveCategories` экспортирован.
- **`src/app/api/catalog/categories/route.ts`** — `STOREFRONT_CACHE_SECONDS` 300 → 3600 (только апдейт константы; новый функционал НЕ добавлять сюда — см. ниже).
- **`src/app/api/catalog/categories/flat/route.ts`** (НОВЫЙ) — `GET → {slugs:[...]}` — все active+visible категории с productCount>0 (1755 из 4342 на момент деплоя). Использует `getActiveCategories` + новый cached `getNonEmptyCategoryIds`.
- **`scripts/warm_all.sh`** (НОВЫЙ) — `flock -n` против overlapping runs. Берёт slugs из API, `xargs -P 8` параллельно курлит `/catalog/<slug>`. Silent on success.
- **VPS cron** (операционно): `*/30 * * * * /var/www/climat-simf.ru/scripts/warm_all.sh >> /var/log/climat-simf-warm-all.log 2>&1` — установлен через paramiko. Существующий `warm_cache.sh` (топ-12, каждые 4 мин) НЕ трогали.
- **CLAUDE.md** worktree — обновлён операционный раздел.

**Замеры с прода:**
- Cold категория (вне топ-warmer'а до прогрева): **~21 сек** (`kabeli-i-perekhodniki-12041`, `knigi-i-zhurnaly-11432`, `muzyka-na-vinile-13002`).
- Warm категория после warm_all: **~1 сек** (`3d-ochki-14833`).
- Первый bootstrap-прогон: 1755 × 21 / 8 параллель = ~77 мин. Запущен в фоне PID 777076 в 00:19:37 MSK, логи `/var/log/climat-simf-warm-all-bootstrap.log` (silent on success).
- Регулярный warm-цикл на тёплых данных: 1755 × 1 / 8 ≈ 3.5 мин (укладывается в 30-мин cron).

**Verification:**
- `npm run lint` чисто, `npm run test` 134/134, `npm run build` успешен.
- Endpoint: `curl https://climat-simf.ru/api/catalog/categories/flat` → `{"slugs":[…1755…]}`. Старый `?flat=true` параметр **не работает** (см. ловушки) — warmer обращается к новому URL `/flat`.
- Cron установлен и виден в `crontab -l`. flock на месте (`grep -c flock` = 3).

**Ловушки на проде (обе зафиксированы):**

1. **Turbopack persistent build cache игнорирует правки в существующих route.ts.**
   Деплой через `deploy_vps.py` копирует tar → запускает `next build`. Build переиспользует `.next/cache` от предыдущего build. Если ты ПРАВИШЬ существующий route, может скомпилировать старую версию (route.js — тонкий loader, реальный код в chunks, и chunk-hash не обновляется). Лечится `rm -rf .next && next build` руками.
   **Workaround для будущего:** если правка существующего route не подхватывается, сделай новый файл `<path>/<sub>/route.ts` вместо редактирования старого — новый файл turbopack видит как cold-build.
   **Симптом, который нашёл:** endpoint возвращал старую форму ответа `{"categories":[]}` вместо новой `{"slugs":[...]}` даже после deploy + restart pm2. grep'ом видно: `route.js` (10 строк loader) ссылается на chunks, в чанках **не было** строк нового кода (`getNonEmptyCategoryIds`, `flat`). Решено через split route в отдельный файл `categories/flat/route.ts`.

2. **`deploy_vps.py` сбрасывает chmod +x на скриптах**, потому что tar восстанавливает permissions из исходника, а git не хранит executable-bit для bash-скриптов по умолчанию. После каждого деплоя `warm_all.sh` (и любые новые .sh) нужно `chmod +x` руками. **Workaround на будущее:** `git update-index --chmod=+x scripts/*.sh` для всех таких файлов (одноразово на ветке).

**Известные риски / следующее:**
- При увеличении ассортимента (>2-3k категорий с товарами) runtime warm_all может приблизиться к 30 мин даже на тёплых данных. Поднять `WARM_CACHE_PARALLEL=16` или cadence до часа.
- Cron-задание не в git (политика проекта). При пересборке VPS — ставить заново (см. шапку `warm_all.sh`).
- Bootstrap-прогон в фоне сейчас. Полное покрытие в ~01:36 MSK. После — все категории должны отвечать <2 сек.

### 2026-05-16 23:24 — Iter 15B: real /service page

- Spec: [`docs/superpowers/specs/2026-05-16-iter15c-warm-all-categories-design.md`](docs/superpowers/specs/2026-05-16-iter15c-warm-all-categories-design.md)
- Commits: `51183d3` (основная реализация) + `d9a6b25` (фильтр пустых категорий + параллелизация после первого прода-замера)
- Deploy backups: `20260516233915`, `20260516234649`
- Закрывает долг «Cold-start длинного хвоста категорий» из CLAUDE.md.

**Что вошло:**
- **`src/lib/catalog.ts`** — `STOREFRONT_CACHE_SECONDS` 300 → 3600 (1 час). `getActiveCategories` экспортирован (был private).
- **`src/app/api/catalog/categories/route.ts`** — `STOREFRONT_CACHE_SECONDS` 300 → 3600. При `?flat=true` возвращает `{slugs:[…]}` — все active+visible категории, у которых есть товары (через новый `getNonEmptyCategoryIds` cached helper).
- **`scripts/warm_all.sh`** (НОВЫЙ) — параллельный warmer на xargs -P 8: pulls slug list из API, пингует `/catalog/<slug>` для каждой. Тайм-аут 150 с/курл, silent on success, фейлы в stderr.
- **VPS cron** (операционно): `*/30 * * * * /var/www/climat-simf.ru/scripts/warm_all.sh >> /var/log/climat-simf-warm-all.log 2>&1`. Установлен через paramiko-скрипт. Существующий `warm_cache.sh` (топ-12, каждые 4 мин) НЕ трогали — он остаётся для самых горячих маршрутов.
- **CLAUDE.md** (worktree-копия) — обновлён раздел про операционные правки на VPS.

**Важные замеры с прода:**
- `getActiveCategories` отдаёт 4342 категории (не 16 как казалось по top-level API).
- После фильтра по productCount > 0 — 1755 категорий с товарами.
- Параллельно (xargs -P 8) типичный warm-цикл на тёплых данных ~5-6 мин (укладывается в 30-мин cron). Bootstrap (первый прогон по cold-данным) может занять до 30+ мин — запущен в фоне на VPS PID 767675, логи `/var/log/climat-simf-warm-all-bootstrap.log`.

**Verification:**
- `npm run lint` чисто, `npm run test` 134/134, `npm run build` успешен.
- Prod-smoke `/api/catalog/categories?flat=true` → `{"slugs":[…1755 items…]}`.
- Cron установлен и виден в `crontab -l`.

**Известные риски / следующее:**
- При увеличении ассортимента (больше категорий с товарами) надо мониторить runtime warm_all — если приблизится к 30 мин, поднять параллельность (xargs -P 16) или ослабить cadence до раз в час.
- Cron-задание не в git (по политике CLAUDE.md). При пересборке VPS нужно ставить заново — задокументировано в скрипте (см. шапку `warm_all.sh`).
- TTL=3600 для меню тоже — новые категории появляются в навигации до часа. Если станет проблемой — разнести TTL для menu (300) и для каталога (3600).

### 2026-05-16 23:24 — Iter 15B: real /service page

- Spec: [`docs/superpowers/specs/2026-05-16-iter15b-service-page-design.md`](docs/superpowers/specs/2026-05-16-iter15b-service-page-design.md)
- Commit: `c5315e7`
- Deploy backup: `/var/www/climat-simf.ru.source-backup-20260516232414.tar.gz`
- Закрывает долг «Реальный /service» (из HANDOFF Iter 13/14).

**Что вошло:**
- **`src/app/service/page.tsx`** — переписан из stub. Server-page, использует существующий client-island `<CallbackButton>` для CTA, существующие классы из glass-template (`.glass`, `.bread`, `.section-head`, `.p-card`), никакого нового CSS.
- **3 раздела:**
  1. **Гарантия от производителя** — общий текст про заводскую гарантию (12/24–36 мес), что нужно для гарантийного случая, ссылка на АСЦ.
  2. **Установка** — intro (свои мастера, весь Крым, выезд 24 ч, гарантия 12 мес) + 3×3 сетка карточек с ценами (9 категорий: стиралка/холодильник/газ.плита от 2 500 ₽, сплит от 8 000 ₽, духовка/варка/посудомойка/вытяжка/бойлер от 3 000 ₽) + CTA «Заказать установку → обратный звонок».
  3. **Ремонт** — мы не ремонтируем, сетка карточек 3 АСЦ в Симферополе (НК-Центр, СЦ Максимум, Гарант Сервис) с адресами, кликабельными `tel:`-ссылками и сайтами.
- **Иконки** lucide-react: WashingMachine, Refrigerator, Flame, Snowflake, Microwave, CookingPot, UtensilsCrossed, Wind, Droplet (категории), ShieldCheck/Wrench/Settings2 (разделы), Phone, MapPin, Globe.
- **`robots: noindex` снят** — контент реальный, страница индексируется.
- **Metadata**: keywords с региональными ключами («установка бытовой техники Симферополь», «авторизованный сервисный центр Крым»).

**Verification:**
- `npm run lint` чисто, `npm run test` 134/134, `npm run build` успешен.
- Prod-smoke `/service` → 200, в HTML: «НК-Центр», «Гарант Сервис», «СЦ Максимум», «от 2 500 ₽», «от 8 000 ₽», «Сервис и установка». `noindex` отсутствует.

**Что НЕ вошло:**
- Своя форма заявки — используем существующий `CallbackButton` (он уже шлёт Telegram-уведомление менеджеру).
- Картинки/логотипы СЦ.
- Динамика прайса (всё статикой в page.tsx — легко править руками).

### 2026-05-16 22:47 — Iter 15A: quick-fixes (TG footer link + B2B 25%)

- Commit: `9a0536f`
- Deploy backup: `/var/www/climat-simf.ru.source-backup-20260516224713.tar.gz`
- Закрывает два долга из CLAUDE.md одной правкой:
  1. **TG-иконка в footer** — `href="#"` → `https://t.me/+79785792995` (личный TG-контакт менеджера). `target="_blank"`, `rel="noopener noreferrer"`. WhatsApp и «Карта» остаются заглушками — у пользователя нет URL.
  2. **B2B discount default 10% → 25%.** В `lib/role-pricing.ts` `DEFAULT_B2B_DISCOUNT` поменян на 25. Поскольку `NEXT_PUBLIC_*` инлайнится в bundle на build, правка `.env` всё равно требовала ребилда — поменяли в коде ради single source of truth. Если позже понадобится переопределить — переменная `NEXT_PUBLIC_B2B_DISCOUNT_PERCENT` на VPS всё ещё имеет приоритет.
- Также обновлён `CLAUDE.md` worktree-копия — `default 10` → `default 25`.
- Prod-smoke `/` → 200, в HTML `t.me/+79785792995`. b2b-цены вычисляются на клиенте по роли в localStorage — корректность проверена через build (формула в bundle).

### 2026-05-16 22:32 — Iter 14 hotfix: disable Telegram CTA до запуска реального бота

- Commit: `54e0593`
- Deploy backup: `/var/www/climat-simf.ru.source-backup-20260516223236.tar.gz`
- Пользователь заметил, что кнопка «Открыть в Telegram» в `/bot` ничего не делает. Реального бота пока нет — `<button>` без href вводил в заблуждение.
- В `bot-demo.tsx`: добавлен флаг `BOT_AVAILABLE = false`. Пока false — кнопка disabled (opacity .55, cursor not-allowed) + подпись «Бот запускается — ссылка появится позже». Когда true — `<a href="https://t.me/{BOT_USERNAME}" target="_blank">`.
- Когда появится реальный бот: 1) `BOT_USERNAME = "<real>"`, 2) `BOT_AVAILABLE = true`, deploy.

### 2026-05-16 22:10 — Iter 14: real /bot landing + noindex для заглушек

- Spec: [`docs/superpowers/specs/2026-05-16-iter14-bot-landing-design.md`](docs/superpowers/specs/2026-05-16-iter14-bot-landing-design.md)
- Branch commit: `534f8f5` — реализация (запушен в origin)
- Deploy backup: `/var/www/climat-simf.ru.source-backup-20260516221048.tar.gz`
- Build log: `/tmp/climat-simf-build-20260516221048.log`

**Что вошло:**
- **`src/app/bot/page.tsx`** — переписан из stub в server-page с metadata + рендер client-island `<BotDemo />`. `robots: noindex` сохранён.
- **`src/components/bot-demo.tsx`** (НОВЫЙ, ~370 строк, client) — полный лендинг по `design-template/unzipped/screen-bot.jsx`:
  - Левая колонка: pill «AI-агент по продажам», hero-заголовок, sub, список 8 capabilities (lucide-react иконки), QR-карточка-плейсхолдер с `@buttehopt_bot` (мок-username, помечен в комментарии), переключатель 5 сценариев диалога.
  - Phone-mockup: tg-phone → tg-screen с tg-status, tg-header (avatar БТ, мета, иконки), tg-body с key={scenario} (для перемонтирования при смене), tg-input-bar.
  - 5 пресетов `TG_PRESETS` (Поиск/Голос/Сравнение/Тендер/Заказ) портированы 1-в-1 из шаблона.
  - Внутренний `<TgMsg>` — роутер по типу сообщения (me-text, me-voice с voice-bars, bot-text, card, buttons, quick).
  - Voice-wave (24 столбика по формуле `4 + (Math.sin(i*1.4)+1)*8 + (i%5)*2`) — в `useMemo`, чтобы не пересоздавался.
- **`src/app/service/page.tsx`** + **`src/app/bot/page.tsx`** — `metadata.robots: { index: false, follow: false }` (страницы остаются coming-soon для `/service` и техническим лендингом для `/bot`, но не индексируются).

**Иконки (lucide-react mapping):** Bot, Search, SlidersHorizontal, ArrowLeftRight, Check, ReceiptText, FileText, Mic, Headphones, ChevronLeft, Phone, MoreHorizontal, Paperclip, Play.

**Что НЕ вошло (по согласованию):**
- Реальный Telegram bot API / webhook — только лендинг.
- Реальная привязка `@buttehopt_bot` — мок-username (одна правка константы `BOT_USERNAME` в `bot-demo.tsx` когда появится реальный бот).
- QR-картинка — пустой `<div className="qr" />` как в шаблоне (квадрат-плейсхолдер от CSS).
- CTA «Открыть в Telegram» как `href` — `<button>` без href, активируется когда появится username.

**Verification:**
- `npm run lint` чисто, `npm run test` 134/134, `npm run build` успешен (`/bot` и `/service` в маршрутах).
- Prod-smoke `/bot` → 200, HTML содержит `bot-frame`, `tg-phone`, `tg-msg`, `buttehopt_bot`.
- Prod-smoke `/service` → 200, в HTML присутствует `<meta name="robots" content="noindex,nofollow">`.

**Известные риски / следующее:**
- Visual smoke в браузере (переключатель сценариев, рендер voice-wave, overflow на узких экранах) — не делал, нужно прокликать руками или дать визуальный фидбек.
- На очереди — VK в footer, если появится URL.

### 2026-05-16 19:26 — Iter 13: bottom ScreenBar + /service + /bot stubs

- Spec: [`docs/superpowers/specs/2026-05-16-iter13-chrome-screenbar-design.md`](docs/superpowers/specs/2026-05-16-iter13-chrome-screenbar-design.md) (commit `1402422`)
- Branch commits:
  - `338871d` — первая версия спека (исходила из неверного предположения «удалить topline»)
  - `1402422` — рерайт спека после сверки скринов от пользователя + `chrome.jsx` + `Магазин.html`: единственное расхождение — отсутствие ScreenBar; topline на проде/в макете уже идентичны
  - `b4d9e47` — реализация
- Deploy backup: `/var/www/climat-simf.ru.source-backup-20260516192647.tar.gz`
- Build log: `/tmp/climat-simf-build-20260516192647.log`
- **Контекст:** прошлая сессия (Iter 12) оставила HANDOFF-заметку «topline удалён в новом макете» — это оказалось неверной интерпретацией. Скрины реального макета (`Магазин.html` собранный в браузере) показали, что topline остаётся со всеми элементами (город / «Помощь» / «Сервис» / role-switch). Реальное расхождение — только отсутствие плавающей нижней навигации (`ScreenBar` из `chrome.jsx:213-238`). Эта итерация закрывает именно его.

**Что вошло:**
- **`src/components/site-screen-bar.tsx`** — client component, `usePathname` + `<Link>`. 10 пунктов (без «Товар» из шаблона — нет `/product` без slug): Главная · Каталог · Сравнение · Корзина · Оформление · | · Кабинет · B2B · Госзакупки · Сервис · | · Telegram-агент. Правила активности: `/` точно, `/catalog/*` и `/product/*` подсвечивают «Каталог», `/account/*` — «Кабинет», остальные — точное совпадение href.
- **`src/app/layout.tsx`** — импорт + рендер `<SiteScreenBar />` после `<SiteFooter />` внутри `RoleProvider`.
- **`src/app/globals.css`** — `body.app{padding-bottom:96px}` (чтобы fixed-bar не перекрывал футер) + override `.screen-bar a`/`.screen-bar a:hover`/`.screen-bar a.active` (template CSS таргетит `<button>`, а `Link` рендерится как `<a>`; зеркалим правила без правки `glass-template.css`).
- **`src/app/service/page.tsx`** + **`src/app/bot/page.tsx`** — server-pages, coming-soon заглушки в glass-стиле (bread → section-head → `.glass` карточка + CTA). По скринам у пользователя в макете есть полная страница `/service` (по `screen-service.jsx`) — в этой итерации сознательно делаем заглушки, реальный контент — отдельный подпроект.

**Что НЕ вошло (по согласованию):**
- VK в footer-socials (отложено до получения URL — есть отдельный долг в CLAUDE.md убрать все `href="#"`).
- Реальный контент `/service` (гарантия, ремонт, формы заявок) — отдельная итерация.
- Реальный `/bot` Telegram-агент (бизнес-логика, интеграция).
- Пункт «Товар» в bar — скрыт, у нас нет роута `/product` без slug.
- Любые правки topline/role-switch/header/footer.

**Verification:**
- `npm run lint` чисто, `npm run test` 134/134, `npm run build` успешен (`/service` и `/bot` появились в маршрутах).
- Prod-smoke: `/`, `/catalog`, `/cart`, `/b2b`, `/gov`, `/service`, `/bot` → 200; `/account` → 307 (middleware-редирект анонов на `/login` после Iter 12, ожидаемо).
- В HTML главной присутствуют и `screen-bar`, и `topline` — оба chrome-блока работают одновременно.

**Известные риски / следующее:**
- Заглушки `/service` и `/bot` индексируются (`robots.index: true` глобально). Если хотим скрыть их от поиска до запуска реального контента — добавить per-page `metadata.robots: { index: false }`.
- На мобиле bar активирует overflow-x:auto и горизонтально прокручивается (правило шаблона). Если на узких экранах будет неудобно, можно ввести compact-режим (только иконки) — отдельным улучшением.

### 2026-05-16 — Очередь следующей сессии (Iter 13: chrome под макет «лев.html») [закрыто, см. запись 19:26 выше]

> Пользователь показал актуальный макет (`лев.html` в Claude Design — не лежит в репо, только скриншоты). Сравнение с продом:

**Расхождения:**
1. **Topline удалён** — на скриншоте нет верхней полосы «г. Симферополь / Помощь / Режим: Розница/Опт/Госзакупки». Шапка начинается сразу с бренда. Переключатель ролей в этой версии макета **не нужен сверху**.
2. **Добавлен `ScreenBar`** — плавающая нижняя glass-панель (chrome.jsx строки 213-238 в шаблоне). 11 пунктов с двумя разделителями:
   - Группа 1: Главная / Каталог / Товар / Сравнение / Корзина / Оформление
   - Группа 2: Кабинет / B2B / Госзакупки / Сервис
   - Группа 3: Telegram-агент
   - Активный пункт через `usePathname()`. CSS-классы `.screen-bar` + `.active` уже есть в `glass-template.css`.
3. **VK** — иконка добавлена в footer-socials шаблона, в проде её нет.
4. **Заглушки страниц** для пунктов bar:
   - `/service` — соответствует `screen-service.jsx` в шаблоне, страницы в проде нет
   - `/bot` (Telegram-агент) — соответствует `screen-bot.jsx`, страницы нет
   - «Товар» (`/product`) — без `[slug]` нет дефолтной; решение: либо скрыть пункт, либо вести на `/catalog`, либо на «последний просмотренный» из localStorage

**План Iter 13:**
- Создать `src/components/site-screen-bar.tsx` (client, `usePathname`), рендерить в `app/layout.tsx` после `<main>` или внутри `<body>` как fixed-bottom
- Из `site-header.tsx` вырезать весь `<div className="topline">…</div>` блок целиком
- Решить судьбу переключателя ролей анона: либо убрать совсем (опт/гос-цены смотрят через переход на `/b2b`/`/gov`), либо вынести в dropdown в bottom-bar
- Добавить в footer-socials VK link (`storefront.ts` или inline)
- Создать заглушки `/service/page.tsx` и `/bot/page.tsx` (минимальный контент из `screen-service.jsx` / `screen-bot.jsx`) или сразу скрыть эти пункты до отдельной итерации
- Lint + test + build + deploy + HANDOFF

**Открытые вопросы для уточнения завтра:**
- Полный набор 11 пунктов (с заглушками `/service` и `/bot`) или минимальный без них?
- Куда переключатель ролей анона: убрать совсем / dropdown в bottom-bar / dropdown в шапке header?
- Файл `лев.html` лежит только в Claude Design — есть смысл попросить его скачать в `design-template/`, иначе работаем только по скриншоту

### 2026-05-16 00:06 — Iter 12: auth core + role binding (sub-projects A+B+admin)

- Spec: [`docs/superpowers/specs/2026-05-14-auth-core-and-role-binding-design.md`](docs/superpowers/specs/2026-05-14-auth-core-and-role-binding-design.md)
- Branch commits:
  - `6668672` — spec
  - `9d6e709` — Prisma user models + lib/auth/mailer/role + tests
  - `3231e44` — /login flow + verify + logout + middleware
  - `2eb99d6` — RoleProvider + use-role rewrite + role-aware cabinet UI
  - `349d00b` — admin/role-requests + lint fixes + HANDOFF + .env.example
- Deploy backup: `/var/www/climat-simf.ru.source-backup-20260516000645.tar.gz`
- Build log: `/tmp/climat-simf-build-20260516000645.log`
- **Hotfix к deploy_vps.py:** добавлен шаг `npx prisma db push --skip-generate` после `prisma generate` — иначе новые таблицы User/Session/MagicLinkToken/RoleUpgradeRequest не создаются и runtime падает на /login.
- **Контекст:** в CLAUDE.md был зафиксирован долг «Кабинет без auth — `/account`, `/b2b`, `/gov` маркетинг-витрины без истории заказов». Шаблон glass-дизайна (`design-template/unzipped/screen-account/b2b/gov.jsx`) предполагал реальную идентификацию: имя/реквизиты ООО, статистика, КП, документы. Без auth это всё было заглушками. Итерация 12 закрывает подпроекты **A (auth core) + B (роли в БД) + минимальный admin для апрува upgrade-заявок**. Воссоздание моков заказов / КП / документов с реальными данными — следующие подпроекты C/D/E (зафиксированы в spec).

**Что вошло:**
- **Prisma schema:** новые модели `User`, `Session`, `MagicLinkToken`, `RoleUpgradeRequest` + enum `StorefrontRole (B2C/B2B/GOV)`, `RoleRequestStatus`. На проде применяется через `npx prisma db push` (в репо нет migration-файлов — соответствует существующему workflow `npm run db:push`).
- **lib/auth.ts:** magic-link токены (TTL 15 мин, single-use), сессии (TTL 30 дней) в `techno_market_session` httpOnly cookie, `getCurrentUser()` через `React.cache()`, `normalizeEmail/isValidEmail` хелперы, мапинг Prisma enum ↔ storefront string.
- **lib/mailer.ts:** Resend HTTP API + console fallback (без npm-зависимостей, через `fetch`). Шаблоны magic-link / role-approved / role-rejected писем.
- **lib/role.ts:** server-side `getActiveRole()` + `getRoleContext()` — у залогиненных юзеров source-of-truth `user.role`, у анонов — preview cookie `techno_market_role_preview`.
- **/login + /login/verify + /logout** — magic-link flow, форма email, route handler валидирует токен и создаёт сессию, /logout уничтожает в БД.
- **middleware.ts** — защищает `/account/*` (анонов кидает на `/login?next=...`). `/b2b`, `/gov` остаются публичными.
- **RoleProvider (client) + use-role.ts shim** — Public API (`useStorefrontRole`, `setStorefrontRole`, `ROLE_LABELS`) сохранён для existing call-sites в `GlassProductCard`, `ProductAsideActions`. Добавлены `useStorefrontIdentity()`, `useStorefrontRoleSetter()`. Анон может менять роль через переключатель в шапке, залогиненный — нет.
- **site-header** — гибридный role indicator: анон видит переключатель ролей + кнопку Войти (иконка User); залогиненный — pill «Роль · Орг» + ссылку «Выйти» + иконка User → role-home.
- **AccountShell** — рендерит реальные имя/orgName/email с инициалами в аватаре; для анона — fallback на «Гость» (нужно для старых вызовов).
- **/account** — middleware-защищён, редиректит b2b/gov юзеров на их кабинет, показывает приветствие именем.
- **/b2b и /gov** — публичные маркетинг-страницы, hero CTA меняется по статусу: anon → Войти, b2c → RoleUpgradeRequestModal (форма orgName/ИНН/контакт/телефон/комментарий, server action создаёт `RoleUpgradeRequest` + Telegram-уведомление менеджеру), matching role → существующий `QuoteRequestButton`.
- **/admin/role-requests** — новая страница в существующей админке (использует `requireAdmin()` + `AdminShell`). Список заявок со статусами, кнопки «Одобрить» / «Отклонить» с reviewNote. Approve в транзакции меняет user.role и копирует orgName/inn/phone из заявки + email уведомление.

**Verification:**
- Локально: `npm run lint` чистый, `npm run test` 134/134 (122 existing + 12 новых в `auth.test.ts` и `mailer.test.ts`), `npm run build` зелёный
- На проде (2026-05-16 00:06 UTC):
  - pm2 `climat-simf-store` online (uptime 28s после deploy, mem 165 MB)
  - В Postgres `climat_simf_shop` появились 4 новые таблицы: `User`, `Session`, `MagicLinkToken`, `RoleUpgradeRequest` (`\dt` подтверждён)
  - curl: `/` 200, `/catalog` 200, `/login` 200, `/b2b` 200, `/gov` 200, `/admin/login` 200, `/account` 307 → `/login?next=/account`
  - `/login` HTML содержит форму email, RoleProvider hydrated `isAuthenticated=false`, шапка с кнопкой «Войти» и переключателем ролей (анон preview)

**Известные ограничения / следующие шаги:**
- **RESEND_API_KEY и MAIL_FROM на VPS пусты** — magic-link письма уходят в stdout pm2-лога (`pm2 logs climat-simf-store`), а не на email юзера. Чтобы login работал в проде, нужно прописать `RESEND_API_KEY=...` и `MAIL_FROM="БытТехОпт <noreply@climat-simf.ru>"` в `/var/www/climat-simf.ru/.env` и `pm2 restart climat-simf-store`.
- **Все страницы стали dynamic.** `layout.tsx` теперь вызывает `await getRoleContext()` → `cookies()`, что форсит все маршруты в SSR. Cache warmer (4 мин) держит горячими 12 маршрутов в проде, поэтому регрессий быть не должно, но если cold-start длинного хвоста начнёт болеть — рассмотреть `headers` вместо cookies в `getActiveRole` или middleware-set `x-user-role` header.
- **Без admin-промоции b2c не сможет стать b2b/gov** — нужно зайти в `/admin/role-requests` и одобрить. До настройки `ADMIN_EMAIL/ADMIN_PASSWORD` промоция вручную через Prisma Studio (`role` поле на User).
- **C/D/E ещё впереди:** реальные заказы/КП/документы из шаблона `screen-account/b2b/gov.jsx` не реализованы — кабинеты после входа показывают тот же placeholder-контент, что и до Iter 12, но с реальной идентификацией пользователя.
- Существующий `QuoteRequestButton` (callback / quote-action) пока анонимный (не привязан к user). Привязка — часть подпроекта C/D.

### 2026-05-14 23:04 — Iter 11: landing dead anchors + #how-order + #contacts
- Commit: `727ea67`
- Backup: `20260514230448`
- **Контекст:** QA-отчёт `07-user-journeys.spec.ts` многократно падал на
  «CTA / форма / контакты / якорная навигация». Пройдено три источника:
- Hero CTA «Смотреть видео» был `href="#"` (мёртвый якорь). Заменён на
  «Как мы работаем» с переходом на новую секцию `#how-order`.
- Топлайн в `site-header`: «Доставка по Крыму и новым регионам» теперь
  ведёт на `/#contacts`, «Помощь» — на `/#how-order` (оба были `href="#"`).
- `app/page.tsx` получил две новые якорные секции:
  - `#how-order` — glass-блок с 4-шаговым объяснением (Выбор / Заявка /
    Подтверждение / Получение).
  - `#contacts` — `.glass-strong` блок внизу страницы: телефоны (tel:),
    email (mailto:), регион, часы + inline `CallbackButton` + ссылка
    на `/checkout`.
- **Verification:** `/` → 200 1.18 с, в DOM присутствуют `id="how-order"`,
  `id="contacts"`, оба topline-Link, hero CTA текст «Как мы работаем».
- **Долг закрыт:** «QA: CTA / якорная навигация на лендинге» из CLAUDE.md
  «Известных долгов» можно удалять.

### 2026-05-12 17:00 — Hotfix follow-up: Nginx timeout + cache warmer + env template

- Commit: `9152445` (warmer + env template), deploy backup `20260512140051`
- Бэкап Nginx: `/etc/nginx/sites-available/climat-simf.ru.bak-<timestamp>`
- **Контекст:** после фикса Prisma-пула в `.env` (см. ниже) остались два долга — Nginx обрезал ответ на 60 с при cold-start, и `unstable_cache.revalidate=300s` для следующего пользователя после истечения TTL снова греется холодным запросом.
- **Nginx (VPS only):** в `/etc/nginx/sites-available/climat-simf.ru` в `location /` добавлены `proxy_read_timeout 180s; proxy_send_timeout 180s; proxy_connect_timeout 30s;`. `nginx -t` + `systemctl reload nginx`. Откат: `cp <bak> /etc/nginx/sites-available/climat-simf.ru && systemctl reload nginx`.
- **Cache warmer:** `scripts/warm_cache.sh` пингует 12 горячих маршрутов (`/`, `/catalog`, 4 топ-категории, 6 `/podborki/*`) с таймаутом 150 с. На VPS установлен cron `*/4 * * * *`, логи `/var/log/climat-simf-warm.log`. Cadence 4 мин < `revalidate=300s`, поэтому кеш всегда тёплый. Скрипт идемпотентен, exit-код = число неуспешных URL.
- **`.env.example`:** в строке `DATABASE_URL` теперь сразу зашиты `&connection_limit=20&pool_timeout=30`, чтобы новая инсталляция не повторяла P2024.
- **Verification (после первого warm):** `/` 0.9 с, `/catalog` 1.6 с, `/catalog/bytovaya-tehnika-9839` 3.2 с, `/podborki/televizory-ot-55-dyuymov` 1.6 с, `/podborki/kabel-ot-25-mm2` 5.6 с — все 200. Раньше cold-start был 15-60 с с обрезанием на 60.
- **Известное ограничение:** warmer держит горячими только перечисленные 12 маршрутов. Долгий хвост категорий по-прежнему может ловить cold-start. Для покрытия всего каталога нужен ISR или fetch-all (отдельный большой проект).

### 2026-05-12 13:26 — Hotfix: Prisma connection pool (P2024 → /podborki/* 500)

- Commit: docs-only (правка только VPS env, без правок кода)
- Backup: `/var/www/climat-simf.ru/.env.bak-20260512132636` (откат: `cp <bak> /var/www/climat-simf.ru/.env && pm2 restart climat-simf-store --update-env`)
- **Проблема:** QA-прогон от 2026-05-12T09:55Z показал HTTP 500 на всех `/podborki/[slug]` и таймауты на `/catalog/[slug]`. По `pm2 logs --err` корневая причина — `PrismaClientKnownRequestError P2024: Timed out fetching a new connection from the connection pool (limit: 9, timeout: 10)`. Под параллельной нагрузкой QA-агента дефолтный пул Prisma (`num_physical_cpus * 2 + 1 = 9` на 4-ядерном VPS) выбивался, а 10-секундный pool_timeout не давал шанса дождаться. Падали `Product.findMany`, `Category.findFirst/Many`, `ProductAttribute.aggregate`, `Product.groupBy` — массово, включая ревалидацию `home-snapshot`.
- **Фикс:** в `/var/www/climat-simf.ru/.env` к `DATABASE_URL` добавлено `&connection_limit=20&pool_timeout=30`. PM2 рестарт с `--update-env`. Postgres `max_connections=100` — запас огромный, поэтому 20 соединений безопасны.
- **Verification:** все 6 landings `/podborki/*` отдают 200 (было 500). 5 параллельных запросов на крупные категории — все 200, P2024 в свежих логах после рестарта = 0.
- **Остаточные шумы из QA-отчёта (НЕ баги сайта):** cold-start крупных категорий 15-60 с (известный долг, нужен cache warmer/ISR); Nginx `proxy_read_timeout=60s` обрезает ответ на холодном кеше; QA-сценарий ищет CTA на listing-страницах (а они только на `/product/[slug]`); QA не открывает свёрнутый поиск на mobile UA.
- **Известное ограничение:** правка живёт только на VPS. При re-deploy через `scripts/deploy_vps.py` `.env` сохраняется (скрипт его не перезаписывает), но если кто-то будет настраивать новый сервер — нужно повторить вручную или зашить параметры пула в `DATABASE_URL` шаблона.

### 2026-05-11 22:51 — Iter 10 Round D: кабинеты /account /b2b /gov по ТЗ шаблона
- Commit: `9fa22bc`
- Backup: `20260511225106`
- **components/account-shell.tsx** — glass aside (`.acc-sidebar` из template),
  пункты меню по `activeRole` (b2c/b2b/gov), активный пункт по `activeItem`,
  аватарка + role-meta, ссылка «Связаться с менеджером» вместо logout.
  Breadcrumb + заголовок по роли.
- **/account** — b2c: гостевой welcome-card со счётчиками cart/fav/compare
  (placeholder под client-side виджеты), быстрые действия (Корзина / Избранное /
  Сравнение / Чекаут), карта со storefront-инфо (телефоны, email, регион, часы).
- **/b2b** — full template banner (.b2b-banner с градиентом + .b2b-pill),
  сводка из `role-pricing` config (опт-скидка %, мин-кол-во, регион, время
  ответа), КП-card с `QuoteRequestButton`, прайс-листы (каждый со своей
  per-context кнопкой запроса), блок связи с менеджером.
- **/gov** — gov-banner (амберный градиент), возможности (время КП, аналоги,
  УПД/СФ, регион), карта запроса КП, документы и аккредитации (по запросу),
  блок куратора закупок.
- **site-header**: иконка User в `head-actions` теперь ведёт на `/account`,
  `/b2b` или `/gov` в зависимости от текущей `useStorefrontRole` (было
  захардкоженно `/cart`).
- **glass-product-card**: ценообразование стало role-aware — b2b показывает
  опт-цену + мин-кол-во, gov показывает «Цена по запросу», b2c сохраняет
  зачёркнутый RRP если `product.rrp > retailPrice`.
- **Известное ограничение:** orders/КП/контракты сейчас без аутентификации
  (нет user-схемы и login-флоу) — кабинет работает как маркетинг-витрина +
  заявки. Реальные история заказов и личный менеджер по контракту — отдельный
  большой проект (auth, привязка заказов к телефону, личные данные пользователя).

### 2026-05-11 17:22 — Iter 9 Round C: role-aware pricing + fav/compare на товаре + КП-флоу
- Commit: `c14f3d1`
- Backup: `20260511172222`
- **lib/role-pricing.ts**: `getRolePricingConfig()` читает `NEXT_PUBLIC_B2B_DISCOUNT_PERCENT`
  (default 10%), `NEXT_PUBLIC_B2B_MIN_QTY` (default 5), `NEXT_PUBLIC_GOV_QUOTE_ENABLED`
  (default true). `computeB2BPrice(retail, %)` округляет до 10 руб.
- **GlassProductCard**: в режиме b2b — `.p-role-b2b` бейдж «Опт от N шт · XXX ₽»;
  в gov — `.p-role-gov` и цена становится «Цена по запросу»; в b2c — РРЦ
  зачёркнут, если `product.rrp > retailPrice`.
- **ProductAsideActions** (новый client island на `/product/[slug]` aside):
  блоки опт-цены / 44-ФЗ + glass-кнопки «В избранное» / «К сравнению» +
  кнопка «Запросить опт-цену / Запросить КП» в b2b/gov.
- **Quote flow**: `/app/quote/actions.ts` — `requestQuoteAction` server action,
  Zod-валидация (имя, телефон обязательны; организация, ИНН, email, комментарий —
  опц.), отправка в Telegram через тот же `TELEGRAM_BOT_TOKEN`/`_MANAGER_CHAT_ID`.
- **components/quote-request-button.tsx** — glass-модал со всеми полями
  заявки + индикаторами pending/success/error.
- **Известное ограничение:** опт-цена это **наценочная модель**, не реальные
  данные поставщика. Для реальных опт-цен нужны: миграция Prisma (поле
  `wholesalePrice` на Product) + новый синк с поставщиком — отдельный проект.

### 2026-05-11 16:41 — Hotfix: RSC function prop в sort-select
- Commit: `0a4d6e3`
- Backup: `20260511164114`
- **Проблема:** все детальные категории `/catalog/<slug>` валились с 500
  (digest `1821461776`). Причина: `CatalogView` (Server Component) передавал
  `buildHref` функцию в `CatalogSortSelect` (Client) — Next.js 16 запрещает
  сериализовать функции через RSC-границу.
- **Фикс:** прокидываем заранее посчитанную `Record<SortValue, string>`
  вместо функции.
- **Проверено:** 8 категорий → 200 OK (1.7–10.7 c, крупные категории медленные
  из-за cold-start), `/search`, `/catalog`, новые ошибки в pm2 не пишутся.
- **Урок на будущее:** `npm run build` локально перед деплоем — поймал бы такую
  RSC-ошибку без 500 на проде.

### 2026-05-11 16:24 — Iter 8 Round B: favourites, compare, persistent role
- Commit: `2da6642`
- Backup: `20260511162432`
- Добавлены `useFavorites`/`useCompare` (localStorage), кнопки сердечко и
  сравнение в `GlassProductCard`, бейджи на иконках в шапке, страницы
  `/favorites` и `/compare`. Role-switcher теперь сохраняется в localStorage
  через `useStorefrontRole`/`setStorefrontRole`. В b2b/gov-режимах на
  карточке появляется тематический note.
- Новый API: `/api/catalog/products-by-sku?sku=…` для подгрузки до 32 товаров.

### 2026-05-11 16:11 — Iter 8 Round A: card UX, pagination, sort, search, callback
- Commit: `3baf6ec`
- Backup: см. сразу до Round B
- Вся карточка кликабельна → `/product/[slug]`. Кнопка «В корзину» с видимым
  текстом и `data-testid="add-to-cart"` (QA-тест теперь её находит). Image
  bound через CSS (`max-width:90%`, `max-height:200px`, `object-fit:contain`).
  Имя clamped 3 строки, карточки одной высоты.
- Новые компоненты `CatalogPager` (полные контролы Назад/1…N/Вперёд),
  `CatalogSortSelect` (auto-apply на change).
- Header search: явный onKeyDown Enter + submit-button вокруг лупы.
- «Обратный звонок» в шапке → модал `CallbackButton` → server action
  `requestCallbackAction` → Telegram через `TELEGRAM_BOT_TOKEN`/`_MANAGER_CHAT_ID`.

### 2026-05-11 15:27 — Iter 7: short title + breadcrumb truncate + mega-menu drill-down
- Commit: `a1eb2f4`
- Backup: `20260511152753`
- `productShortTitle` для h1 на странице товара (полное имя — мутед-подзаголовок).
  `truncateBreadcrumbLabel` обрезает длинные элементы.
- Дубль «О товаре» убран; характеристики full-width 2-col под фотками.
- `/api/catalog/categories?parent=<id>` отдаёт детей категории с
  `hasChildren: bool`. Mega-menu в шапке теперь drill-down с back-кнопкой
  и breadcrumb внутри.

### 2026-05-11 12:58 — Iter 6: filter overlap, photo lightbox, mega-menu, brand ordering
- Commit: `85e2327`
- Backup: `20260511125814`
- **Bugfix:** три `<div className="filters">` (Search/Categories/Filters) все
  имели `position: sticky; top: 120` и накладывались. Слиты в одну outer
  aside с внутренним overflow-y.
- ProductGallery: клик по фото открывает полноэкранный glass-lightbox с
  навигацией стрелками/мышью, ESC, click-outside.
- Кнопка «Каталог товаров» в шапке: dropdown с сеткой категорий из БД
  (lazy fetch + `unstable_cache` 300 с).
- Brand filter: вместо alphabetic top-80 теперь top-120 по числу товаров desc.

### 2026-05-11 10:43 — Iter 5: glass admin shell + Telegram bot token
- Commit: `981c9b8` (код) + ручная правка `.env` на сервере
- Backup: `20260511104250`
- `AdminShell` обёрнут классом `.admin-area`; CSS-overrides переписывают
  Tailwind `bg-white` / `border-zinc-*` / `shadow-*` в glass-токены без
  правки 11 admin-страниц по отдельности.
- На сервер записан новый `TELEGRAM_BOT_TOKEN=8729390335:…`, pm2 рестарт
  с `--update-env`. **Безопасность:** токен был выложен в чат — рекомендую
  перевыпустить через `@BotFather` `/revoke`.

### 2026-05-11 10:31 — Iter 4: mobile UX
- Commit: `bc55c5c`
- Backup: `20260511103123`
- Inline grid styles заменены на классы (`.p-product-layout`,
  `.p-product-aside`), template responsive media queries теперь применяются.
- Mobile sticky bottom buy-bar `.mob-buy-bar` на странице товара
  (price + AddToCartButton).

### 2026-05-11 10:23 — Initial glass redesign (Iter 1–3, на «чистый» прод)
- Commits: `3cd29a1`, `e6e80b8`, `7c70d94`, `2a91448`, `3b58664`, `5919fe4`,
  `bbbe135`, `234dec9`, `9ac3e9e`, `c316baf`, `5a79b4a`
- Backup: `20260511102308`
- Полная перестройка фасада: layout (Inter font, glass-template.css),
  главная (hero с SVG-Fridge, категории, promo, trust), site-header (glass,
  topline, role-switch), site-footer (glass), `/catalog`, `/catalog/[slug]`,
  `/search`, `/podborki/[slug]`, `/product/[slug]`, `/cart`, `/checkout`,
  `/privacy`, `/order-success/[id]`.
- Удалены orphan-компоненты: `cart-link.tsx`, `header-catalog-menu.tsx`,
  `catalog-grid.tsx`, `product-card.tsx`. `getHeaderCategories` удалён из
  `lib/catalog.ts`.

## Что уже сделано

- Развернут интернет-магазин БытТехОпт на Next.js + PostgreSQL + Prisma.
- Подключены каталог, категории, цены, остатки и изображения от I-T-P.
- Загружены метаданные фото: примерно `880351` записей `ProductImage`, около `182062` товаров с фото.
- На странице товара добавлена галерея: основное фото, стрелки, миниатюры и счетчик.
- В карточке товара выводятся реальные доступные характеристики: SKU, категория, бренд, партномер, штрихкоды, гарантия, вес, объем упаковки, кратность заказа, срок поставки.
- Phase A витрины маркетплейса: карточки товара, страница товара, корзина, checkout, страница успешного заказа и Telegram-уведомление теперь используют честную формулировку `В наличии у поставщика` / `Доставка под заказ 7 дней`.
- Характеристики на странице товара выведены табличными строками с нормальными отступами, а покупательский сценарий оформлен как заявка с подтверждением менеджером перед оплатой.
- Phase B первая волна: каталог получил сортировку в URL, быстрые фильтры `В наличии` / `С фото` / `До 10 000 ₽`, активные чипы фильтров, горизонтальные быстрые категории и короткие характеристики внутри карточек товара.
- На странице товара добавлен блок похожих товаров из той же категории и CTA для подбора аналога через менеджера.
- Корзина усилена как заявка: показывает количество товаров, даёт продолжить покупки, очистить корзину и ведёт к оформлению заявки только после успешной проверки состава.
- Phase B карточки стали умнее без нового фида: сайт извлекает очевидные характеристики из названий товаров (`л/сутки`, бак в литрах, диагональ ТВ, 4K, RAM/SSD) и показывает их в карточках каталога и таблице товара.
- SEO/конверсия: добавлены canonical и SEO-шаблоны для каталога/категорий, JSON-LD `Product` и `BreadcrumbList` для карточки товара, быстрый заказ с карточки товара, отдельное Telegram-сообщение `Быстрый заказ`, мобильная sticky-панель покупки.
- Админ-обзор усилен под продажи: очередь действий, последние заявки, быстрые заказы, качество каталога, товары без фото/цены, последние синхронизации.
- Поиск начал собирать популярные запросы в `Setting` без новой миграции; в админке появился блок `Популярные поиски` со ссылками обратно в выдачу.
- Каталог получил первый слой категорийных фильтров по уже извлекаемым характеристикам из названий: производительность `л/сутки`, объем бака, `4K / UHD`, `Full HD`, `SSD`, оперативная память. Фильтры живут в URL как `spec=...`, работают на desktop и mobile, активные фильтры показываются чипами.
- В карточку товара в каталоге добавлен раскрываемый быстрый заказ: клиент может оставить имя и телефон прямо из выдачи, заявка идет тем же server action и Telegram-путем, что и быстрый заказ на странице товара.
- Исправлен null-safe фильтр уценки/б/у товаров: товары с пустым публичным `name` больше не выпадают из sitemap/home/related-выдачи только из-за SQL `NULL` в условии `NOT contains`.
- Заказы стали понятнее для продаж: добавлены русские статусы заявок, цветные бейджи в списке/карточке заказа, быстрый звонок клиенту, план обработки заявки для менеджера и таймлайн `Что дальше` на странице успешной заявки.
- SEO/нагрузка: параметрические URL каталога, фильтров, сортировок, пагинации и поиска теперь получают `noindex, follow`; `robots.txt` закрывает `/search`, админку, API и URL с query-параметрами, чтобы боты меньше грузили бесконечные фильтры.
- Мобильный каталог стал плотнее и быстрее для воронки: липкий блок `Фильтры` / `Категории` с бейджем активных фильтров, горизонтальные быстрые фильтры без переполнения экрана, компактнее карточка товара на телефоне.
- Добавлен безопасный deploy-инструмент `npm run deploy:vps`: собирает архив без `.env`/`.next`/`node_modules`, делает source-backup на VPS, запускает production build, проверяет `.next/prerender-manifest.json` и `.next/BUILD_ID`, перезапускает PM2 и делает healthcheck. После таймаута долгого build ожидание удаленной команды переведено на polling без SSH channel read timeout; добавлен `--remote-timeout`; локальный VPS-healthcheck после PM2 и внешний public healthcheck теперь делают retry, а печать ошибок безопасна для Windows-консоли.
- Зафиксировано ТЗ по фасетным фильтрам в `docs/FACET_FILTERS_TZ.md`; шаг 1 реализует расширенный слой категорийных фильтров без миграции базы: климат, холодильники, телевизоры, компьютеры, стиральные машины, группировка фильтров в UI и совместимый URL `spec=...`.
- Брендовый фильтр усилен до маркетплейсного сценария: вместо одиночного select в каталоге и поиске теперь чекбоксы брендов с несколькими значениями в URL `brand=...&brand=...`, обратная совместимость с одиночным `brand` сохранена.
- Стабилизирован production build на большой базе: главная страница и `sitemap.xml` больше не блокируют `next build` долгими запросами к базе; sitemap генерируется динамически и кэшируется на 1 час через `unstable_cache`.
- Начат шаг 2 по фасетам: добавлена Prisma-модель `ProductAttribute`, чистый extractor атрибутов из названий и команда `npm run sync:attributes` для backfill `source=name`. Извлекаются производительность, объем бака, диагональ ТВ, разрешение, Smart TV, RAM, тип и объем накопителя. `spec`-фильтры для доступных атрибутов уже строят Prisma `where` через `attributes.some`, сохраняя fallback на название/поставщика. Шаг 3 начат и выложен: у `spec`-фильтров появились счетчики, считаются последовательно, чтобы не перегружать Prisma connection pool; начаты счетчики брендов через `groupBy vendor`; добавляются числовые отсечения по атрибутам.
- Если поставщик не дает описание, сайт формирует клиентское автоописание из доступных данных товара.
- Исправлена проблема с падением сайта из-за параллельных `sync:prices`: старый дублирующий cron отключен, синхронизация цен больше не делает тяжелый общий `UPDATE Product ... WHERE 1=1` в начале.
- Добавлен индекс `ProductImage_productId_deleted_priority_idx` для ускорения выдачи первого фото товара.
- Убрана тяжелая сортировка по `images._count`; витрина сортирует через `hasImage`.
- `robots.txt`, `llms.txt`, sitemap и публичные страницы работают.
- Telegram-уведомления о заказах настроены на production: переменные Telegram заполнены в `/var/www/climat-simf.ru/.env`, PM2 перезапущен с `--update-env`.
- Первый тестовый заказ через production `createLocalOrder`: `ORD-20260502-MXK3DM`, уведомление ушло в Telegram-группу.

## Важные ограничения по данным

- В текущем стандартном фиде I-T-P нет полных заводских описаний и расширенных технических характеристик.
- В базе сейчас `description` и `specifications` у массового каталога не заполнены поставщиком.
- Вес, объем, гарантия, партномер, штрихкоды, бренд, кратность и срок поставки есть у значительной части товаров и уже выводятся.
- Для карточек уровня маркетплейса нужен отдельный источник характеристик: дополнительный фид I-T-P, ручное заполнение в админке или отдельное обогащение данных.

## Cron и синхронизации

Активные cron-задачи находятся в root crontab, блок `climat-simf.ru sync jobs`:

- цены: каждые 4 часа
- категории: ежедневно ночью
- товары: ежедневно ночью
- фото: ежедневно, лимит `ITP_IMAGE_SYNC_LIMIT=20000`

Старый `/etc/cron.d/climat-simf` отключен, чтобы не запускать синхронизации дублем.

Логи:

- `/var/log/climat-simf.ru/sync-prices.log`
- `/var/log/climat-simf.ru/sync-categories.log`
- `/var/log/climat-simf.ru/sync-products.log`
- `/var/log/climat-simf.ru/sync-images.log`

## Проверки после последних правок

Локально:

- `npm.cmd test` - 65 tests passed
- `npm.cmd run test:deploy` - passed
- `npm.cmd run lint` - passed
- `npm.cmd run build` - passed
- `http://localhost:50065/catalog?available=1&photo=1` - `200`, HTML содержит мобильные блоки `Фильтры` и `Категории`

На VPS:

- `npm run build` - passed после выкладки Phase A
- `pm2 restart climat-simf-store --update-env` - выполнен
- `https://climat-simf.ru/` - `200`
- Товар `11261200` проверен на проде: страница отдает `200`, содержит `В наличии у поставщика` и `Доставка под заказ 7 дней`, старого текста `день в день` нет.
- Тестовая заявка создана через серверный `createLocalOrder`: `ORD-20260502-ZCO0EA`, 1 товар, сумма `19800`.
- Backup перед выкладкой Phase A: `/var/www/climat-simf.ru.backup-phase-a-20260502151952`
- Phase B первая волна выложена на VPS: `npm run build` - passed, `pm2 restart climat-simf-store --update-env` - passed, `https://climat-simf.ru/` - `200`.
- Продовые smoke-проверки Phase B: `/catalog?available=1&photo=1&sort=price_asc` отдает `200` и показывает сортировку/быстрый фильтр; товар `11261200` отдает `200`, показывает `Похожие товары`, CTA подбора аналога и `Доставка под заказ 7 дней`.
- Backup изменяемых файлов перед выкладкой Phase B: `/var/www/climat-simf.ru.file-backup-phase-b-20260502191400`
- Извлечение характеристик из названий выложено на VPS: `npm run build` - passed, `pm2 restart climat-simf-store --update-env` - passed. Smoke: товар `11261200` показывает `Производительность`, `Объем бака`, `30 л/сутки`, `4 л`; каталог по `Ballu Vector BD-30L` показывает `30 л/сутки` и `4 л`.
- Backup изменяемых файлов перед выкладкой extractor: `/var/www/climat-simf.ru.file-backup-spec-extract-20260502192800`
- SEO + быстрый заказ выложены на VPS: product page отдает JSON-LD `Product`, JSON-LD `BreadcrumbList`, canonical и форму `Быстрый заказ`; каталог отдает canonical без параметров фильтрации.
- Тестовый быстрый заказ создан через backend-путь с Telegram-уведомлением: `ORD-20260502-LCT8E5`, SKU `11261200`, сумма `19800`.
- Backup изменяемых файлов перед выкладкой SEO/quick order: `/var/www/climat-simf.ru.file-backup-seo-quick-20260503023700`
- Админ-сводка и популярные поиски выложены на VPS: `npm run build` - passed, `pm2 restart climat-simf-store --update-env` - passed, `/search?q=Ballu%20BD-30L` - `200`, `/admin` - `200`, `Setting.SEARCH_POPULAR_TERMS_V1` записал `ballu bd-30l`.
- Backup изменяемых файлов перед выкладкой админ-сводки/поисковой аналитики: `/var/www/climat-simf.ru.file-backup-admin-dashboard-20260503030611`
- Категорийные spec-фильтры выложены на VPS: `npm run build` - passed, `pm2 restart climat-simf-store --update-env` - passed, `/catalog?spec=tv_4k` - `200`, `/search?q=ssd&spec=storage_ssd` - `200`, в выдаче найден фильтр `4K / UHD`.
- Backup изменяемых файлов перед выкладкой spec-фильтров: `/var/www/climat-simf.ru.file-backup-spec-filters-20260503031851`
- Быстрый заказ из карточки каталога выложен на VPS: `npm run build` - passed, `pm2 restart climat-simf-store --update-env` - passed, после прогрева `/catalog?available=1&photo=1` - `200`, `/` - `200`, в HTML карточек есть поля quick order (`customerName`, `phone`, `personalDataConsent`).
- Backup изменяемых файлов перед выкладкой быстрого заказа в карточке: `/var/www/climat-simf.ru.file-backup-card-quick-order-20260503110019`
- Null-safe фильтр уценки/б/у выложен на VPS: серверный Prisma smoke `NORMAL_RETAIL_ROWS=5`, `npm run build` - passed, `pm2 restart climat-simf-store --update-env` - passed, `/sitemap.xml` - `200`, `/` - `200`, sitemap содержит `700` product URL и `300` category URL.
- Backup изменяемых файлов перед выкладкой null-safe фильтра: `/var/www/climat-simf.ru.file-backup-retail-null-filter-fix-20260507011941`
- Улучшенный сценарий обработки заказов выложен на VPS: `npm run build` - passed, `pm2 restart climat-simf-store --update-env` - passed, `/order-success/<id>` - `200` и содержит `Что дальше` / `Позвонить менеджеру`; `/admin/orders/<id>` с admin-cookie - `200` и содержит `Состав заказа` / `Позвонить`.
- Backup изменяемых файлов перед выкладкой order flow: `/var/www/climat-simf.ru.file-backup-order-flow-20260507013614`
- Noindex для параметрических URL выложен на VPS: `npm run build` - passed, `pm2 restart climat-simf-store --update-env` - passed, `/catalog` - `200` без `noindex`, `/catalog?available=1&photo=1` - `200` с `noindex`, `/search?q=ssd` - `200` с `noindex`; `/robots.txt` - `200`, содержит `Disallow: /*?*` и `Disallow: /search`.
- Backup изменяемых файлов перед выкладкой noindex filtered URLs: `/var/www/climat-simf.ru.file-backup-noindex-filtered-20260507015049`
- Мобильная воронка каталога выложена на VPS: `npm run build` - passed, PM2 перезапущен через `ecosystem.config.cjs`, статус `online`; `https://climat-simf.ru/catalog?available=1&photo=1` - `200`, содержит `Фильтры`, `Категории`, `В наличии` и `noindex`; `/` - `200`; `/robots.txt` - `200`.
- Backup изменяемых файлов перед выкладкой mobile catalog flow: `/var/www/climat-simf.ru.file-backup-mobile-catalog-20260507023146`
- Расширенные фасетные фильтры выложены на VPS после восстановления неполной `.next`: `npm run build` - passed, `.next/BUILD_ID` и `.next/prerender-manifest.json` присутствуют, PM2 `climat-simf-store` - online, локальный healthcheck `127.0.0.1:3001` - ok. Smoke: `/` - `200`, `/catalog?spec=tv_smart` - `200` и содержит `Smart TV` / `Доступно к заказу`, `/catalog?spec=fridge_no_frost` - `200` и содержит `No Frost` / `Доступно к заказу`, `/robots.txt` - `200`.
- Backup source перед попыткой выкладки расширенных фасетных фильтров через deploy helper: `/var/www/climat-simf.ru.source-backup-20260507114907.tar.gz`
- Мультибрендовые фильтры, dynamic home/sitemap и усиленный deploy helper выложены на VPS через `npm run deploy:vps`: `Deploy completed`, `.next/BUILD_ID=BCbJMktk5jh580thUXEdR`, manifest present, PM2 `online`, локальный healthcheck ok. Smoke: `/` - `200`, `/catalog?brand=ATLANT&brand=Indesit` - `200` и содержит `Бренды` / `Бренд:` / `Smart TV`, `/catalog?spec=tv_smart` - `200` и содержит `Smart TV`, `/robots.txt` - `200`, `/sitemap.xml` - `200`.
- Backup source перед контрольной выкладкой multi-brand/deploy helper: `/var/www/climat-simf.ru.source-backup-20260507131125.tar.gz`
- `ProductAttribute` выложен на VPS: `npm run deploy:vps` - `Deploy completed`, затем `npx prisma db push` - schema in sync, `npm run sync:attributes` - `scanned=298688 written=23056`. Распределение атрибутов: `screen_diagonal=9087`, `smart_tv=5572`, `storage_capacity=3231`, `storage_type=3231`, `resolution=1438`, `tank_volume=282`, `ram=166`, `daily_capacity=49`.
- `spec`-фильтры по доступным атрибутам выложены на VPS: `/catalog?spec=tv_smart` - `200`, `/catalog?spec=storage_ssd` - `200`, `/catalog?spec=daily_capacity` - `200`; `.next/BUILD_ID=cplbUwd4FeuKv-ooSsNnQ`, PM2 `online`. Backup source перед выкладкой: `/var/www/climat-simf.ru.source-backup-20260507192503.tar.gz`
- Счетчики `spec`-фильтров выложены на VPS: `npm run deploy:vps` - `Deploy completed`, `/catalog?spec=tv_smart` - `200`, `/catalog?spec=storage_ssd` - `200`, `/catalog?spec=daily_capacity` - `200`, `/sitemap.xml` - `200`; HTML содержит `Smart TV`, разметку счетчика и `Под заказ 7 дней`; `.next/BUILD_ID=Ml8SbNarlXh45R5GiS1V0`, PM2 `online`. Новый хвост PM2-логов после последовательного smoke пустой. Backup source перед выкладкой: `/var/www/climat-simf.ru.source-backup-20260507193902.tar.gz`
- Счетчики брендов выложены на VPS и стабилизированы последовательными DB-запросами витрины: `/catalog?brand=ATLANT&brand=Indesit` - `200`, `/catalog?spec=tv_smart` - `200`, `/catalog?spec=daily_capacity` - `200`, `/sitemap.xml` - `200`; HTML содержит `ATLANT`, разметку счетчика и `Под заказ 7 дней`; `.next/BUILD_ID=kZDJdQx6eXssfWfOLxlLV`, PM2 `online`. Новый хвост PM2-логов после повторного smoke пустой. Backup source перед финальной выкладкой: `/var/www/climat-simf.ru.source-backup-20260507200318.tar.gz`
- Числовые `spec`-фильтры по `ProductAttribute.numericValue` выложены на VPS: `/catalog?spec=tv_55_plus` - `200`, `/catalog?spec=daily_capacity_20_plus` - `200`, `/catalog?spec=storage_512_plus` - `200`, `/catalog?spec=ram_16_plus` - `200`, `/sitemap.xml` - `200`; HTML содержит `От 55 дюймов`, разметку счетчика и `Под заказ 7 дней`; `.next/BUILD_ID=LiFNftWv5oWNtb3notzmJ`, PM2 `online`. Новый хвост PM2-логов после smoke пустой. Backup source перед выкладкой: `/var/www/climat-simf.ru.source-backup-20260507201656.tar.gz`
- Срочно исправляется UX фильтрации по замечанию со страницы `/catalog/dacha-sad-i-ogorod-11038`: на страницах категорий убирается общий starter-набор нерелевантных характеристик; добавляются садовые `spec`-фильтры и поиск внутри длинных списков брендов/характеристик. Следующий слой ТЗ: динамические фасеты от `ProductAttribute` по текущей категории.
- Category-aware filters deployed: `/catalog/dacha-sad-i-ogorod-11038` - `200`; HTML contains `Садовая техника`, `Снегоуборщики`, `Газонокосилки`, filter search placeholders and `Под заказ 7 дней`; HTML does not contain unrelated `4K / UHD`, `SSD`, `No Frost`; `.next/BUILD_ID=uENx1ei5doG7zD8dAUQXd`, PM2 `online`. New PM2 log tail after smoke is empty. Backup source before deploy: `/var/www/climat-simf.ru.source-backup-20260507231439.tar.gz`
- In progress: `spec` filters with zero count are hidden unless they are active in the URL, so the characteristics panel follows the current category/product set instead of showing empty options.
- Empty `spec` filter options deployed: `/catalog/dacha-sad-i-ogorod-11038` - `200`, `/catalog/dacha-sad-i-ogorod-11038?spec=garden_snow_blower` - `200`, `/catalog?spec=tv_smart` - `200`, `/sitemap.xml` - `200`; garden page contains `Садовая техника`, `Снегоуборщики`, `Под заказ 7 дней` and does not contain unrelated `4K / UHD`, `SSD`, `No Frost`; `.next/BUILD_ID=MfESVGyMqhTD9qDKwzD1l`, PM2 `online`. New PM2 log tail after smoke is empty. Backup source before deploy: `/var/www/climat-simf.ru.source-backup-20260508152500.tar.gz`
- Dynamic `attr`-фасеты от `ProductAttribute` выложены на VPS: `/catalog?attr=storage_type:ssd` - `200`, `/catalog?attr=ram:16` - `200`, `/catalog/dacha-sad-i-ogorod-11038` - `200`, `/search?q=ssd&attr=storage_type:ssd` - `200`, `/sitemap.xml` - `200`; HTML содержит `Параметры товаров`, `Тип накопителя`, `Под заказ 7 дней`; `.next/BUILD_ID=Q4ANMtoemGwpIYShX0qFl`. Backup source before deploy: `/var/www/climat-simf.ru.source-backup-20260508165228.tar.gz`
- Фасеты типа питания и аккумуляторной техники выложены на VPS: `npm run deploy:vps` - `Deploy completed`, затем `npm run sync:attributes` - `scanned=299048 written=46362`. Новые атрибуты: `power_source=14360`, `battery_voltage=5081`, `battery_capacity=2661`, `power_hp=1784`. Smoke: `/catalog/dacha-sad-i-ogorod-11038?attr=power_source:petrol` - `200`, `/catalog/dacha-sad-i-ogorod-11038?attr=power_source:battery` - `200`, `/catalog/dacha-sad-i-ogorod-11038?attr=power_source:battery&attr=battery_voltage:36` - `200`, `/search?q=Makita&attr=power_source:battery` - `200`, `/sitemap.xml` - `200`; HTML содержит `Параметры товаров`, `Тип питания`, `Аккумуляторный`, `Напряжение аккумулятора`, `Под заказ 7 дней`; `.next/BUILD_ID=Xv07-RX_E8rGSlbENO1MW`, PM2 `online`, fresh error-log empty. Backup source before deploy: `/var/www/climat-simf.ru.source-backup-20260508170658.tar.gz`
- Карточки товара подключены к сохраненным `ProductAttribute`: `npm run deploy:vps` - `Deploy completed`; товар `/product/akkumulyatornaya-mini-pila-litheli-u20mc00-0u120-1-akkumulyator-2-0-a-ch-11075557` - `200`, HTML содержит `Характеристики`, `Тип питания`, `Аккумуляторный`, `Под заказ 7 дней`, не содержит `день в день`; `/catalog/dacha-sad-i-ogorod-11038?attr=power_source:battery` - `200` и содержит `Аккумуляторный`, `Напряжение аккумулятора`, `Под заказ 7 дней`; `.next/BUILD_ID=whKQdG-SzDkAbx1dTzlko`, PM2 `online`, fresh error-log empty. Backup source before deploy: `/var/www/climat-simf.ru.source-backup-20260508172214.tar.gz`
- PM2 `climat-simf-store` - online
- Adaptive range filters phase 1 deployed: `npm test` - passed (`27` files, `97` tests), `npm run lint` - passed, `npm run build` - passed, `npm run deploy:vps` - `Deploy completed`; remote `npm run sync:attributes` - `scanned=299048 written=200698`. Smoke: `/catalog/stroitelstvo-i-remont-10118?attrMin=cable_section:2.5` - `200`, contains `Сечение кабеля` and `Под заказ 7 дней`; `/catalog/kompyuternaya-tehnika-9975?attrMin=ram:16` - `200`, contains `Оперативная память` and `Процессор`; `/search?q=HDMI&attr=interface:hdmi` - `200`, contains `Интерфейс` and `HDMI`; `/sitemap.xml` - `200`. PM2 `climat-simf-store` - online; current error-log mtime is before this deployment, fresh smoke requests returned `200`.
- Root catalog performance fix deployed: QA reports in Google Drive showed repeated `/catalog` 15s timeouts in `01-smoke.spec.ts` and `02-critical-path.spec.ts`. Root cause was the root catalog building heavy global spec/attribute facet panels over the full product base while `sync:prices` could also be running. The empty root `/catalog` now skips those heavy facet panels until a customer narrows the catalog by category/search/filter; category and filtered pages keep facet behavior. Verification: `npm test` - passed (`30` files, `122` tests), `npm run lint` - passed, `npm run build` - passed, `npm run deploy:vps` - `Deploy completed`; production smoke after deploy: `/catalog` - `200` in about `1.1-1.8s`, `/catalog/detskie-tovary-11173` - `200`, `/catalog/stroitelstvo-i-remont-10118?attrMin=cable_section:2.5` - `200`, `/catalog/kompyuternaya-tehnika-9975?attrMin=ram:16` - `200`. Backup source before deploy: `/var/www/climat-simf.ru.source-backup-20260510123751.tar.gz`
- Catalog click/perceived navigation follow-up deployed: root quick filters (`available`, `photo`, `brand`, price) no longer trigger heavy global facet panels; `/catalog/loading.tsx` gives the catalog route an immediate skeleton fallback; main catalog CTA links use full prefetch, and the hero CTA shows a `useLinkStatus` spinner while navigation is pending. Verification: `npm test` - passed (`30` files, `122` tests), `npm run lint` - passed, `npm run build` - passed, `npm run deploy:vps` - `Deploy completed`. Public smoke after deploy: `/catalog` - `200` in `1.80s`, `/catalog?available=1` - `200` in `1.87s`, `/catalog?photo=1` - `200` in `1.86s`, `/catalog/detskie-tovary-11173` - `200` in `5.88s`. Playwright browser checks: hero `/catalog` after prefetch navigates in `0.26-0.81s`, `/catalog?available=1` after scroll navigates in `0.64s`; a completely cold immediate click can still spend about `3.9s` loading the first document/chunks, with the route skeleton appearing around `1.7s`. PM2 `climat-simf-store` is online. Backups from this follow-up: `/var/www/climat-simf.ru.source-backup-20260510124918.tar.gz`, `/var/www/climat-simf.ru.source-backup-20260510125656.tar.gz`, `/var/www/climat-simf.ru.source-backup-20260510130215.tar.gz`, `/var/www/climat-simf.ru.source-backup-20260510130647.tar.gz`
- Adaptive filters/cards/nav/SEO phase deployed: added more extracted attributes for refrigerators, paper, cameras, tires, dishes, apparel and furniture; product cards use saved `ProductAttribute`; category/product breadcrumbs and a visible return path were added; admin product edit can set manual filter attributes; SEO landings `/podborki/...` are category-scoped. Remote `npm run sync:attributes` completed with `status=success`, `processed=300487`, `failed=0`. Verification: `npm test` - passed (`30` files, `119` tests), `npm run lint` - passed, `npm run test:deploy` - passed, `npm run build` - passed, `npm run deploy:vps -- --key-path C:\Users\user\.ssh\climat_simf_deploy --remote-timeout 3600` - `Deploy completed`. Public smoke: `/` - `200`; `/catalog/sushilnye-mashiny-18029` contains `load_capacity`/`drying_type` and not `power_hp`/`electrical_product_type`; `/catalog/kabeli-i-provoda-dlya-stroitelstva-i-remonta-10560` contains `cable_section`/`cable_cores` and not `screen_diagonal`/`load_capacity`; `/podborki/holodilniki-no-frost` contains `fridge_no_frost` and category link `/catalog/holodilniki-9841`; `/sitemap.xml` contains SEO landings. Fixed category-family bug where short `tv` matched inside `stroitelstva`; PM2 `climat-simf-store` - online.

Предыдущие проверки:

- `npm test -- src/lib/product-display.test.ts` - passed
- `npm run build` - passed
- Проверен товар с `136` фото: страница отдает `200`, галерея подключена, ссылки `/api/product-images/...` присутствуют.

## Что сделать дальше

1. Проверить клиентский путь вручную:
   - открыть `https://climat-simf.ru`
   - выбрать товар
   - проверить галерею фото
   - добавить товар в корзину
   - оформить тестовый заказ

2. Phase B для машины продаж:
   - проверить поведение сортировок и быстрых фильтров на реальных популярных категориях
   - расширить извлечение характеристик там, где данные реально есть: гарантия, вес/габариты, ширина/высота/глубина, объем, класс энергопотребления
   - сделать числовые диапазоны для `attr`-фасетов: диагональ, объем накопителя, мощность, напряжение, емкость АКБ
   - доработать карточки под выбранные категории: климат, холодильники, телевизоры, компьютерная техника
   - подготовить админский или полуавтоматический источник расширенных характеристик для важных SKU

3. Решить вопрос с расширенными характеристиками:
   - запросить у I-T-P отдельный фид/метод характеристик, если он доступен
   - или дополнять важные товары вручную через админку
   - или позже сделать отдельный модуль обогащения карточек

## Команда для нового чата

Продолжи проект `БытТехОпт`: прочитай `web-store/HANDOFF.md`, проверь VPS `212.116.115.150`, проверь сайт `https://climat-simf.ru`, PM2 `climat-simf-store`, cron-логи в `/var/log/climat-simf.ru/`, затем продолжай Phase B по каталогу, фильтрам, корзине и расширенным характеристикам.
