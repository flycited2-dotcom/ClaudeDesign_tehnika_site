# Iter 13 — Add bottom ScreenBar (chrome дополнение под макет «лев.html»)

**Дата:** 2026-05-16
**Статус:** Утверждён к реализации
**Контекст:** [`web-store/HANDOFF.md`](../../../HANDOFF.md) → запись «2026-05-16 — Очередь следующей сессии (Iter 13...)»
**Референс макета:** `design-template/unzipped/Магазин.html` + `chrome.jsx:213-238` (ScreenBar)

## Цель

После сверки реальных скринов макета с `chrome.jsx` (см. рерайт-сессию 2026-05-16):
**единственное расхождение макета и прода — отсутствие нижней floating-панели `ScreenBar`.**

Topline (город / «Помощь» / «Сервис» / переключатель «Розница/Опт/Госзакупки») присутствует
и в макете (`chrome.jsx:37-53`) и на проде — **не трогаем**. Header после Iter 12 содержит
hybrid role-indicator + кнопки Войти/Выйти, что является надстройкой над шаблоном
(шаблон не знает про auth) — это не противоречит макету, оставляем.

Задача итерации — добавить bottom-bar по `chrome.jsx:213-238`, адаптированный под наш Next-роутинг.

## Решения по открытым вопросам (зафиксировано 2026-05-16)

| Вопрос | Решение |
| --- | --- |
| Topline / role-switch / header | **Не трогаем.** Прежнее моё намерение «удалить topline» опровергнуто скринами и оригиналом — то была неверная интерпретация HANDOFF. |
| Пункт «Товар» в bar | **Скрыть.** В проде нет дефолтного `/product` без slug. |
| Пункты `/service` и `/bot` | **Coming-soon заглушки** (1–2 абзаца, без бизнес-логики). |
| VK в footer-socials | **Отложить.** Без реального URL — лишний `href="#"`. |

## Архитектура

Чистое дополнение, surgical. Один новый client-компонент + рендер в layout + 2 минимальные
страницы-заглушки. Существующая разметка не правится.

### Файлы

#### 1. `src/components/site-screen-bar.tsx` — НОВЫЙ (client)

`"use client"`, использует `usePathname()` из `next/navigation` и `<Link>` из `next/link`.

Массив items (10 кнопок + 2 разделителя):

| ID       | Label          | href        |
| ---      | ---            | ---         |
| home     | Главная        | `/`         |
| catalog  | Каталог        | `/catalog`  |
| compare  | Сравнение      | `/compare`  |
| cart     | Корзина        | `/cart`     |
| checkout | Оформление     | `/checkout` |
| *sep*    | —              | —           |
| account  | Кабинет        | `/account`  |
| b2b      | B2B            | `/b2b`      |
| gov      | Госзакупки     | `/gov`      |
| service  | Сервис         | `/service`  |
| *sep*    | —              | —           |
| bot      | Telegram-агент | `/bot`      |

**Активное состояние** (правила выведены из скринов — `/b2b` и `/gov` подсвечивают свои
кнопки, а не «Кабинет»):

- `pathname === '/'` → home
- `pathname === '/catalog' || pathname.startsWith('/catalog/')` → catalog
- `pathname === '/account' || pathname.startsWith('/account/')` → account
- `/product/[slug]` → подсветка соседнего `catalog` (товар приходит из каталога — наиболее
  естественная привязка для пользователя)
- Прочие — точное совпадение href

Разметка: `<nav className="screen-bar">` с `<Link className={active ? "active" : ""}>`
для каждой кнопки и `<div className="sep" />` для разделителей. CSS-классы
`.screen-bar`, `.screen-bar button`, `.screen-bar button.active`, `.screen-bar .sep`
уже существуют в `src/styles/glass-template.css` (строки 125–151). **Не плодим новые
стили.** `Link` в Next будет рендериться как `<a>`, но CSS-селектор `.screen-bar button`
работает по тегу — нужно либо переключить items на `<button onClick={router.push}>`,
либо обновить CSS на `.screen-bar a, .screen-bar button`. **Выбор:** добавить точечный
override в `globals.css`:
```css
.screen-bar a { /* копия правил .screen-bar button */ }
.screen-bar a.active { /* копия правил .screen-bar button.active */ }
```
(Это не редактирование `glass-template.css`, который CLAUDE.md просит не трогать.)

#### 2. `src/app/layout.tsx` — ПРАВКА

- Импортировать `SiteScreenBar`.
- Отрендерить `<SiteScreenBar />` после `<SiteFooter />` внутри `<body>` (вне `<main>`).
- Добавить override в `globals.css`: `body { padding-bottom: 96px; }`, чтобы fixed-bar
  не перекрывал нижнюю часть футера. (Можно ограничить media-query «когда bar виден» —
  но bar виден всегда, так что unconditional padding достаточен.)

#### 3. `src/app/service/page.tsx` — НОВЫЙ (server)

Минимальная страница, ~30 строк. Структура:

- `<section className="p-card">` или `<div className="glass">` (классы из glass-template).
- `<h1>Сервис</h1>`
- 1–2 абзаца: «Раздел в разработке. Здесь появится информация о гарантии, ремонте и
  сервисном обслуживании. Если у вас вопрос — напишите менеджеру через кнопку обратного
  звонка в шапке.»
- `<Link href="/">Вернуться на главную</Link>` (стилизованный `.btn-ghost` или `.btn-primary`).
- Metadata: `title: "Сервис — БытТехОпт"`, `description: "Информация о сервисном обслуживании скоро появится."`

#### 4. `src/app/bot/page.tsx` — НОВЫЙ (server)

Аналогично `/service`. Заголовок «Telegram-агент», текст про планируемого AI-консультанта по
ассортименту и заказам в Telegram (без обещаний срока).

### Файлы, которые НЕ меняем

- `src/components/site-header.tsx` — без изменений.
- `src/styles/glass-template.css` — без изменений (по политике CLAUDE.md).
- `src/components/site-footer.tsx` — без изменений (VK отложили).
- Все existing страницы (`/catalog`, `/account`, `/b2b`, `/gov`, `/cart`, `/checkout`,
  `/compare`, `/product/[slug]`, `/`) — без правок (padding-bottom на body это покрывает).

## Verification (критерии успеха)

1. `npm run lint` — без новых ошибок/warning'ов.
2. `npm run test` — 122/122. Без изменений в тестируемой логике; новые компоненты —
   тонкие client-обёртки над Link, тесты для них не пишем (соответствует существующему стилю
   проекта, где `site-header.tsx` и `site-footer.tsx` тоже без тестов).
3. `npm run build` — успешно. Bar — client component, рендерится в server layout
   через прямую инстанциацию (без function-prop) — RSC-граница чистая.
4. `npm run dev` локально:
   - `curl -s http://localhost:3000/ | grep screen-bar` → есть.
   - В браузере на `/`, `/catalog`, `/cart`, `/account`, `/b2b`, `/gov`, `/service`, `/bot`
     bar виден, активный пункт подсвечивается синим градиентом.
   - На `/product/<slug>` активна кнопка «Каталог».
   - Topline сверху на месте, ничего не сломано.
5. Деплой: `python scripts/deploy_vps.py` (с уже исправленным `db push` step из Iter 12).
   Backup создан, healthcheck OK.
6. Прод-smoke: curl 8 ключевых роутов — все 200, `screen-bar` в HTML.
7. Запись в `HANDOFF.md` (Iter 13: что сделано, backup-timestamp, ссылка на этот спек).

## Риски и ловушки

- **CSS-селектор `.screen-bar button` vs `<a>` из Next Link.** Решение зафиксировано выше —
  override `.screen-bar a` в `globals.css`.
- **Next.js 16 RSC-граница.** Bar = client, layout = server. Прямой рендер `<SiteScreenBar />`
  без function-prop — безопасно (см. CLAUDE.md / ловушка #1).
- **Overflow на мобильных.** CSS `.screen-bar` уже включает `overflow-x:auto` и
  `max-width:calc(100% - 32px)` — горизонтальная прокрутка работает нативно. Не правим.
- **`react-hooks/set-state-in-effect`.** Не используется — компонент чисто читает pathname.
- **Footer перекрытие.** Padding-bottom 96px на body решает.

## Что НЕ входит в эту итерацию

- VK в footer (отложено до получения URL).
- Реальный контент `/service` (политика гарантии, формы заявок).
- Реальный `/bot` Telegram-агент (бизнес-логика, интеграция).
- Пункт «Товар» в bar (нет дефолтного `/product` без slug).
- Любые правки topline, role-switch, header, footer.
