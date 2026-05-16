# Iter 15C — Eliminate cold-start for all categories

**Дата:** 2026-05-16
**Статус:** Утверждён к реализации
**Зависимый коммит:** `c5315e7` (Iter 15B)

## Проблема

В CLAUDE.md «Известные долги» зафиксировано: cold-start крупных категорий
рендерится 8–11 с, а длинный хвост категорий (за пределами топа) — 8–60 с
первый запрос. Существующий `scripts/warm_cache.sh` греет только 12 маршрутов
(4 топ-категории + главная + /catalog + 6 подборок). 12 из 16 top-level
категорий + все дочерние — холодные.

## Решение (подход D из брейнсторма)

Расширить cache warmer на все категории + увеличить TTL до 1 ч. Два cron-задания:

- Существующий `warm_cache.sh` каждые 4 мин — топ-12 hot routes (не трогаем).
- Новый `warm_all.sh` каждые 30 мин — все active categories (динамический список из API).

При TTL=3600 и cadence 30 мин — каждая категория обновляется ~2 раза за TTL,
с запасом против ошибок (failed ping, временный 500 и т.п.).

## Файлы

### 1. `src/lib/catalog.ts` — `STOREFRONT_CACHE_SECONDS = 300 → 3600`

С комментарием что значение спарено с cron-warmer.

### 2. `src/lib/catalog.ts` — `export const getActiveCategories`

Существующая cached-функция возвращает flat-список всех active+visible категорий.
Сейчас private; экспорт нужен, чтобы route мог переиспользовать тот же кэш-ключ
(`active-catalog-categories`) и не делать второй идентичный Prisma-запрос.

### 3. `src/app/api/catalog/categories/route.ts`

- `STOREFRONT_CACHE_SECONDS = 300 → 3600` (комментарий: должно совпадать с `lib/catalog`).
- При `?flat=true` → вернуть `{ slugs: [...] }` — все категории через
  `getActiveCategories()`, отфильтровать degraded retail names.
- Существующее поведение (parent= → tree) сохраняется без изменений.

### 4. `scripts/warm_all.sh` — НОВЫЙ

- `curl ${BASE}/api/catalog/categories?flat=true` → JSON → parse через python3
  (на VPS есть).
- Для каждого slug: `curl -o /dev/null --max-time 150 ${BASE}/catalog/${slug}`.
- Также пингует `${BASE}/catalog` (базовый).
- `set -u`, silent on success, failures в stderr с timestamp.
- Exit 1 если есть фейлы.
- Идемпотентен (как существующий `warm_cache.sh`).

### 5. Cron на VPS (операционное изменение, не из git)

Добавить в crontab пользователя root:
```
*/30 * * * * /var/www/climat-simf.ru/scripts/warm_all.sh >> /var/log/climat-simf-warm-all.log 2>&1
```

Существующий `warm_cache.sh` (топ-12, */4 * * * *) — НЕ трогаем.

## Verification

1. `npm run lint`, `npm run test`, `npm run build` — все чисто.
2. После deploy: `curl https://climat-simf.ru/api/catalog/categories?flat=true`
   → `{"slugs": [...16+...]}`.
3. На VPS из `web-store/scripts/`:
   ```
   bash warm_all.sh && echo OK
   ```
   → exit 0, лог без ошибок.
4. Добавить cron-задание (см. п.5 выше). Через 30 мин:
   `tail /var/log/climat-simf-warm-all.log` — нет ошибок.
5. Замер cold-start на категории вне топ-4:
   ```
   curl -o /dev/null --max-time 60 -w '%{time_total}\n' https://climat-simf.ru/catalog/<slug>
   ```
   Должно быть <2 с (тёплая). До правки те же категории давали 8–60 с.
6. HANDOFF + апдейт операционного раздела CLAUDE.md (новый cron + новый файл лога).

## Что НЕ входит

- ISR/SSG migration — не делаем.
- Изменение существующего `warm_cache.sh` — не трогаем (он отдельно греет
  hot-paths с более высокой свежестью раз в 4 мин).
- Подборки (`/podborki/*`) — все 6 уже в `warm_cache.sh`, в `warm_all.sh` не
  дублируем.
- Универсальный SSOT-файл для TTL — оставляем две константы с комментариями
  про синхронизацию. Без оверинжиниринга.

## Риски

- **DB-нагрузка раз в 30 мин**: 16+ категорий × N ms на запрос. Текущий
  Prisma pool 20 connections (см. CLAUDE.md) — с запасом.
- **Если API вернёт пустой `slugs` — warm_all.sh exit 1**, cron алертит в лог.
  В коде есть проверка на empty response.
- **Children категории**: если в DB появятся вложенные категории — endpoint
  отдаст их (через recursive `findMany` уже всех `isActive+isVisible`),
  warmer автоматически их прогреет.
