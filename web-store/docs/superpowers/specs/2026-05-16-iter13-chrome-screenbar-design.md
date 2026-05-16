# Iter 13 — Chrome refactor под макет «лев.html»

**Дата:** 2026-05-16
**Статус:** Утверждён к реализации
**Контекст:** [`web-store/HANDOFF.md`](../../../HANDOFF.md) → запись «2026-05-16 — Очередь следующей сессии (Iter 13...)»

## Цель

Привести chrome (header + новая нижняя навигация) в соответствие с актуальным макетом
«лев.html», который пользователь показал перед закрытием прошлой сессии. На макете:

1. Верхняя полоса `topline` (с городом, «Помощь» и переключателем ролей b2c/b2b/gov)
   **удалена**. Шапка начинается сразу с логотипа.
2. Добавлена плавающая нижняя glass-панель `ScreenBar` (см. `design-template/unzipped/chrome.jsx`
   строки 213–238) с навигацией по основным экранам.

## Решения по открытым вопросам (зафиксировано в брейнсторме 2026-05-16)

| Вопрос | Решение |
| --- | --- |
| Куда деть переключатель ролей анона после удаления topline | **Убрать совсем.** Аноним видит b2c-цены; для опт/гос — переход на `/b2b` или `/gov` через ScreenBar. |
| Пункты bar `/service` и `/bot` | **Coming-soon заглушки** (минимальные страницы 1–2 абзаца). |
| Пункт «Товар» в bar | **Скрыть.** В проде нет дефолтного `/product` без slug; активное состояние на `/product/[slug]` подсвечиваться не будет. |
| VK в footer-socials | **Отложить.** Без реального URL это ещё один `href="#"`; в CLAUDE.md уже висит долг убрать заглушки. |

## Архитектура

Минимальное surgical-изменение: один новый client-компонент, один блок вырезается,
две минимальные страницы-заглушки.

### Файлы

#### 1. `src/components/site-screen-bar.tsx` — НОВЫЙ (client)

`"use client"`, использует `usePathname()` из `next/navigation` и `<Link>` из `next/link`.

Массив items (9 кнопок + 2 разделителя):

| ID    | Label          | href        |
| ---   | ---            | ---         |
| home    | Главная        | `/`         |
| catalog | Каталог        | `/catalog`  |
| compare | Сравнение      | `/compare`  |
| cart    | Корзина        | `/cart`     |
| checkout| Оформление     | `/checkout` |
| *sep* | — | — |
| account | Кабинет        | `/account`  |
| b2b     | B2B            | `/b2b`      |
| gov     | Госзакупки     | `/gov`      |
| service | Сервис         | `/service`  |
| *sep* | — | — |
| bot     | Telegram-агент | `/bot`      |

**Активное состояние** определяется по `pathname`:

- `/` → home (только точное совпадение)
- `pathname === '/catalog' || pathname.startsWith('/catalog/')` → catalog
- `pathname.startsWith('/account')` → account
- Прочие — точное совпадение href

Разметка: `<nav className="screen-bar">` с `<Link className={active ? "active" : ""}>`
для каждой кнопки и `<div className="sep" />` для разделителей. CSS-классы уже
существуют в `src/styles/glass-template.css` (строки 125–151) — **не плодим новые
стили**.

#### 2. `src/app/layout.tsx` — ПРАВКА

- Импортировать `SiteScreenBar`.
- Отрендерить `<SiteScreenBar />` после `<SiteFooter />` внутри `<body>` (вне `<main>`).
- Добавить `padding-bottom: 96px` в `<body>` (через override в `globals.css`), чтобы
  fixed-bar не перекрывал нижнюю часть футера.

#### 3. `src/components/site-header.tsx` — ПРАВКА

- Вырезать весь блок `<div className="topline">…</div>` (начало ~строка 184).
- Если внутри topline жил переключатель ролей анонима — удалить вместе с
  импортами/хелперами, **которые становятся неиспользуемыми именно из-за этой правки**.
  Пре-существующий dead-code не трогаем (karpathy: surgical).
- Залогиненный role-indicator (pill «Роль · Орг» + «Выйти») и иконка User остаются
  без изменений — они живут в основной шапке, не в topline.

#### 4. `src/app/service/page.tsx` — НОВЫЙ (server)

Минимальная страница, ~30 строк. Контент:

- `<section className="glass" style={...}>` или существующий `.p-card`.
- `<h1>Сервис</h1>`
- 1-2 абзаца: «Раздел в разработке. Здесь появится информация о гарантии, ремонте
  и сервисном обслуживании. Если у вас вопрос — напишите менеджеру через кнопку
  обратного звонка в шапке.»
- `<Link href="/">Вернуться на главную</Link>`.

#### 5. `src/app/bot/page.tsx` — НОВЫЙ (server)

Аналогично `/service`. Заголовок «Telegram-агент», текст про планируемого AI-консультанта.

## Что НЕ входит в эту итерацию

- VK в footer (отложено).
- Реальный контент `/service` (политика гарантии, формы заявок).
- Реальный `/bot` Telegram-агент.
- Перенос переключателя ролей в bar или dropdown.
- Пункт «Товар» в bar.

## Verification (критерии успеха)

1. `npm run lint` — без ошибок и новых warning'ов.
2. `npm run test` — 122/122 (изменений в тестируемой логике нет; новые компоненты
   маленькие, без своих тестов — соответствует существующему стилю проекта).
3. `npm run build` — успешно (ловит RSC-границы, лишь bar — client component).
4. Локально `npm run dev`:
   - `curl -s http://localhost:3000/ | grep screen-bar` — есть.
   - `curl -s http://localhost:3000/ | grep topline` — пусто.
   - Открыть `/`, `/catalog`, `/compare`, `/cart`, `/account`, `/b2b`, `/gov`,
     `/service`, `/bot` — bar виден на каждой, активный пункт корректен.
5. Деплой: `python scripts/deploy_vps.py`, backup создан, healthcheck OK.
6. Прод-smoke: 6 ключевых роутов через curl (`/`, `/catalog`, `/account`, `/b2b`,
   `/service`, `/bot`) — 200 OK, `screen-bar` в HTML.
7. Запись в `HANDOFF.md` (Iter 13: что сделано / что не сделано / backup-timestamp).

## Риски и ловушки

- **Next.js 16 RSC-граница:** layout — server, bar — client. Связь через рендер
  `<SiteScreenBar />` напрямую (без function-prop) — безопасно. Никаких функций
  из layout в bar не передаём.
- **Overflow на мобильных:** CSS `.screen-bar` уже включает `overflow-x:auto` и
  `max-width:calc(100% - 32px)`. На узких экранах 9 пунктов прокручиваются
  горизонтально внутри bar — это поведение шаблона, не правим.
- **Footer перекрытие:** padding-bottom: 96px на body решает.
- **react-hooks/set-state-in-effect:** не используется (компонент чисто read-only
  по pathname).
