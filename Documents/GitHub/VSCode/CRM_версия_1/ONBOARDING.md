# CRM v1 — frontend prototype

Визуальный прототип CRM-системы для торговой компании (ТД Северное Сияние). Все 45 экранов из ТЗ собраны на статике, без бэкенда. Цель — утвердить визуальный язык и UX до начала разработки на стеке `Next.js + NestJS + PostgreSQL`.

## Быстрый старт

```bash
node serve.mjs                                # запускает HTTP-сервер на http://localhost:3000
node screenshot.mjs http://localhost:3000/app/dashboard-owner.html label desktop
```

Открыть в браузере [http://localhost:3000](http://localhost:3000) — сразу редирект на дашборд собственника.

**Демо-флоу** (рекомендуемый порядок для показа):
1. `/app/login.html`
2. `/app/dashboard-owner.html`
3. Переключатель ролей в topbar → `/app/dashboard-manager.html`
4. `/app/deals/kanban.html`
5. `/app/deals/card.html?id=DL-0014` (богатая сделка с просроченной задачей)
6. `/app/clients/card.html?id=CL-0001` (карточка с 8 вкладками)
7. `/app/offers/view.html?id=KP-0008` (А4-превью КП)
8. `/app/tenders/card.html?id=TN-0001` (горящий дедлайн, countdown)
9. `/app/reports/overview.html`

`Ctrl+K` / `Cmd+K` на любой странице — командная палитра поиска по всем сущностям.

## Стек и архитектура

Без сборщика, без npm-зависимостей фронта. Чистый HTML + [Tailwind CDN](https://cdn.tailwindcss.com) + ванильный JS.

- **Сервер:** [serve.mjs](serve.mjs) — статический http-сервер Node, порт 3000, корректно обрабатывает query-string.
- **Скриншоты:** [screenshot.mjs](screenshot.mjs) — Puppeteer, 3 пресета (`desktop` 1920×1080, `compact` 1366×768, `tablet` 768×1024). Chromium локально в `chromium/`.
- **Шрифты:** Google Fonts (Fraunces serif для заголовков, Inter sans для body, JetBrains Mono для сумм и ID).
- **Иконки:** [lucide](https://unpkg.com/lucide@latest) через CDN.
- **Графики:** [Chart.js v4](assets/js/chart.umd.min.js) локально (отчёты).
- **Тестов нет** — это визуальный прототип. Приёмка через скриншоты + ручной обход.

## Структура файлов

```
serve.mjs                          # dev-сервер
screenshot.mjs                     # Puppeteer-инструмент
index.html                         # redirect → /app/dashboard-owner.html

app/
  dashboard-owner.html             # ⭐ эталон визуального языка (батч 1)
  dashboard-manager.html
  login.html
  404.html
  clients/{list,card}.html         # карточка — 8 вкладок
  leads/{list,kanban}.html
  deals/{kanban,list,by-client,card}.html   # карточка — 7 вкладок + stage indicator
  tasks/{my,dept,all,kanban,calendar}.html
  offers/{list,view}.html          # view = A4-превью КП-документа
  tenders/{list,calendar,card}.html # карточка — 5 вкладок + countdown-бар
  employees/{list,card}.html       # owner-only
  settings/{funnels,offer-templates,lead-sources,site-tokens,integrations}.html
  reports/{overview,managers,tasks,leads,deals,offers,tenders,time}.html
  shell/
    sidebar.html                   # фрагмент, инжектится shell.js
    topbar.html                    # фрагмент, инжектится shell.js
    _template.html                 # канонический скелет страницы
    modals/{create-client,create-deal,create-task,create-offer,command-palette}.html

assets/
  css/
    tokens.css                     # палитра, типографика, spacing, тени — НИЧЕГО не менять без переснятия эталонов
    app.css                        # 30+ компонент-классов
  js/
    shell.js                       # инжекция оболочки, роль, модалки, popover'ы, ⌘K
    widgets.js                     # CRM.render* функции
    mock-data.js                   # все mock-сущности
    relative-date.js               # formatRelative, formatMoney
    chart.umd.min.js               # Chart.js локально

docs/superpowers/
  specs/2026-05-17-crm-frontend-prototype-design.md   # design spec
  plans/2026-05-17-crm-frontend-prototype.md          # implementation plan

crm_project_docs/                  # исходное ТЗ (10 markdown-файлов)
temporary screenshots/             # выводы screenshot.mjs (закоммичены)
chromium/                          # gitignored, локальный Chromium для Puppeteer
node_modules/                      # gitignored
```

## Визуальный язык (правила)

- **Палитра:** только переменные из [assets/css/tokens.css](assets/css/tokens.css). Никаких raw hex'ов в HTML/JS, никаких дефолтных Tailwind-цветов.
- **Запрещено** на проверке grep'ом: `transition-all`, `indigo-*`, `blue-5xx`, `blue-6xx`, `green-5xx`, `emerald-*`.
- **Цвета статусов** через семантические классы: `.badge--{success|warning|danger|info|neutral}`. Не `bg-green-500`.
- **Деньги:** всегда `CRM.formatMoney(rub)` → «1 240 000 ₽» с тонкими пробелами и `tabular-nums`.
- **Даты:** всегда `CRM.formatRelative(iso)` → «3 ч назад», «вчера в 14:22», «завтра 10:00». ISO в mock'е, относительные в UI.
- **Анимации:** только `transform` и `opacity`, easing `cubic-bezier(0.2, 0.8, 0.2, 1)`, 150–200ms.
- **Тени:** только три уровня `--shadow-sm/-md/-lg` из токенов. Никаких `shadow-md` из коробки Tailwind.
- **Шрифты:** заголовки/числа KPI — `var(--font-serif)` (Fraunces). Body — `var(--font-sans)` (Inter). Суммы/ID — `var(--font-mono)` (JetBrains Mono) с `tabular-nums`.

Полный набор правил — в [`.claude/CLAUDE.md`](.claude/CLAUDE.md) и [docs/superpowers/specs/](docs/superpowers/specs/).

## Реюзабельные компоненты

В [assets/css/app.css](assets/css/app.css):

| Класс | Назначение |
|---|---|
| `.app-shell .app-sidebar .app-main .app-topbar .app-content .app-header` | Каркас |
| `.btn .btn-{primary,secondary,ghost,icon,sm} .btn-future` | Кнопки. `.btn-future` — dashed «Этап 2» |
| `.input .input-search` | Инпуты |
| `.badge .badge--{success,warning,danger,info,neutral} .badge--flat` | Бэйджи |
| `.table-app` | Стандартная таблица (через `CRM.renderTable`) |
| `.tab-bar .tab` | Вкладки (через `CRM.renderTabs`) |
| `.kanban .kanban-col .kanban-card .is-stale` | Канбан |
| `.kpi .kpi-{label,value,delta}` | KPI-карточки |
| `.segmented` (поддерживает `<button>` и `<a>`) | Сегментированный контрол |
| `.popover .popover-item` | Поповеры |
| `.card .card-flush .card-head*` | Карточные поверхности |
| `.id-chip` | Mono-чипы для ID сущностей |
| `.row-actions` | Иконки-действия в строках (показ на hover) |
| `.entity-header* .entity-body .entity-rail` | Каркас детальной карточки (1fr 320px sticky) |
| `.kv-list .kv-grid .kv-tags` | Key-value списки |
| `.chat-feed .chat-bubble{--in,--out} .chat-meta .chat-composer` | Чат-лента в карточках |
| `.files-grid .file-card` | Файлы-плитки |
| `.timeline .timeline-dot--{info,success,warning,neutral,danger}` | Таймлайн |
| `.stage-indicator .stage-pill.is-{done,active,lost}` | Прогрессия этапов сделки |
| `.countdown .countdown.is-urgent` | Дедлайн-бар (тендеры) |
| `.kp-page .kp-*` | A4-превью КП-документа |
| `.modal-{backdrop,shell,head,body,foot,close}` | Модалки |
| `.cmdk-*` | Командная палитра |
| `.report-grid .chart-card .chart-canvas-wrap` | Сетка отчётов |

В [assets/js/widgets.js](assets/js/widgets.js):

```js
CRM.renderAvatar(name, size)
CRM.renderBadge(severity, label)
CRM.renderKpiCard({ value, label, delta, trend })
CRM.renderTable(selector, { columns, rows, empty })
CRM.renderKanban(selector, { columns, cardsByColumn, cardRenderer })
CRM.renderTabs(selector, { tabs, activeId, onChange })
CRM.renderNotifList(selector, notifications, limit)
CRM.renderProblemItem(badge, text, ts)
CRM.renderProblemCard(title, items, cap)
CRM.formatRelative(iso)
CRM.formatMoney(rub)
CRM.initials(name)
CRM.avatarColor(name)
```

## Mock-данные

[assets/js/mock-data.js](assets/js/mock-data.js) — синхронный объект `window.MOCK`:

- `users` (8): USR-001 Анна (owner), USR-002 РОП, USR-003..006 менеджеры, USR-007 тендерный спец, USR-008 закупщик.
- `clients` (24): B2B-уклон, реальные русские имена.
- `contacts` (40), `leads` (18), `deals` (22), `dealProducts`, `tasks` (35), `offers` (12 с явным `status`), `tenders` (6 или 7), `messages`, `notifications`, `workSessions`.
- `activity(entityType, entityId)` — функция, возвращает фид активности.

**Преднамеренные «проблемные» данные** для дашборда owner-а:
- 3 лида с `status: 'new'` и `createdAt` >15 мин назад → «горящие».
- 4 задачи с `status: 'overdue'`.
- 2 сделки в активных стадиях с `lastActionAt` >3 дней.
- 2 тендера с `deadlineSubmit` <48ч.

## Роль пользователя

Переключатель в topbar (`.segmented` рядом с аватаром) пишет в `localStorage.crm.role` и перезагружает страницу. По умолчанию `owner` → `/app/dashboard-owner.html`. `manager` → `/app/dashboard-manager.html`.

Влияние роли:
- Пункты меню «Сотрудники» и «Настройки» видны только owner'у (через `data-role="owner"` обёртки в [sidebar.html](app/shell/sidebar.html)).
- Карточка `tasks/my.html` и подобные фильтруют по `currentUserId` (USR-001 для owner, USR-003 для manager).

## Hash-роутинг вкладок

В карточках сущностей активная вкладка читается из `location.hash`:
- `/app/clients/card.html?id=CL-0001#tab=offers` откроет вкладку КП.
- Переключение через `CRM.renderTabs(..., onChange)` обновляет hash + переключает `display: block|none` на панелях `<section data-tab-panel="...">`.

## Запросы с query-string

Все детальные экраны принимают `?id=...`:
- `/app/clients/card.html?id=CL-0009`
- `/app/deals/card.html?id=DL-0014`
- `/app/offers/view.html?id=KP-0008`
- `/app/tenders/card.html?id=TN-0001`
- `/app/employees/card.html?id=USR-003`

Если `id` отсутствует — берётся первая сущность из соответствующей коллекции.

## Запуск модалок программно

`window.CRM.openModal('create-client' | 'create-deal' | 'create-task' | 'create-offer' | 'command-palette')`. Закрытие: `CRM.closeModal()`, ESC, клик по backdrop, или кнопка `[data-modal-close]`.

Для скриншотов модалок есть query-параметр `?_modal=NAME` — `shell.js` после boot открывает модалку с этим именем.

## Workflow проверки

1. Запустить `node serve.mjs` в фоне.
2. Открыть страницу в браузере на `http://localhost:3000/...`.
3. Для скриншотов: `node screenshot.mjs <url> <label> <desktop|compact|tablet>`. PNG → `temporary screenshots/screenshot-N-<label>-<resolution>.png` (auto-increment).
4. Перед коммитом — grep на запрещённые паттерны:
   ```bash
   grep -RnE "transition-all|indigo-|blue-5|blue-6|green-5|emerald-" app assets
   ```
   Должен быть пустой.

## Что НЕ сделано (out of scope этой итерации)

- Бэкенд, БД, реальные интеграции (Telegram/1С/SMTP/site-webhooks). Это следующий этап на стеке из ТЗ.
- Реальная авторизация — `login.html` визуальный, кнопка просто пишет `localStorage.crm.role='owner'` и редиректит.
- Сохранение из модалок — кнопка «Сохранить» закрывает модалку, ничего не пишет.
- Empty-states / skeleton-states через `?empty=1` / `?skeleton=1` — из плана, не реализовано (низкий visual ROI на этой стадии).
- Адаптация под мобильные ниже планшета — десктоп-приоритет.

## Git

Ветка с прототипом: `codex/parsing_tenders`.
Репо: `https://github.com/flycited2-dotcom/ClaudeDesign_tehnika_site`.

История ~28 коммитов от `docs: spec` до финальных `qa: final demo flow screenshots`. Стиль коммитов:
- `screen: <название>` — новый экран
- `screens: <группа>` — батч экранов
- `fix(<scope>): <что>` — багфикс
- `css:` / `mock:` / `tools:` / `refactor:` / `docs:` / `plan:` — по типу

## Главные документы

- [docs/superpowers/specs/2026-05-17-crm-frontend-prototype-design.md](docs/superpowers/specs/2026-05-17-crm-frontend-prototype-design.md) — design spec
- [docs/superpowers/plans/2026-05-17-crm-frontend-prototype.md](docs/superpowers/plans/2026-05-17-crm-frontend-prototype.md) — implementation plan (6 батчей)
- [.claude/CLAUDE.md](.claude/CLAUDE.md) — правила работы со стилем (anti-generic guardrails)
- [crm_project_docs/](crm_project_docs/) — оригинальное ТЗ (10 файлов): архитектура, роли, бизнес-процессы, схема БД, API-spec, UI/UX, роадмап, чек-лист приёмки

## Следующие шаги (если решите развивать)

1. Утвердить визуал на устройствах stakeholders (живая демо-сессия по флоу выше).
2. Если визуал ок — этап MVP: поднять Next.js + NestJS + Postgres, мигрировать дашборд+клиенты+лиды+сделки+задачи+КП на реальную архитектуру (ТЗ этапы 0–6).
3. Параллельно — интеграции (этапы 7–9): Telegram, webhook'и сайтов.
4. 1С (этап 11) — последним, как и предписано в [crm_project_docs/08_DEVELOPMENT_ROADMAP.md](crm_project_docs/08_DEVELOPMENT_ROADMAP.md).
