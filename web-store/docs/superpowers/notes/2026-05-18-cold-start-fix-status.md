# Cold-start fix — статус и инструкции для следующей сессии

**Дата:** 2026-05-18
**Автор:** controller-сессия Iter 18 / 18B
**Контекст:** [`HANDOFF.md`](../../../HANDOFF.md) → запись «2026-05-18 — Iter 18 + Iter 18B (FAILED, prod в broken state)»

---

## ⚠️ КРИТИЧНО: первый шаг новой сессии

**Прод сейчас НЕ работает** — `/catalog/<slug>` отвечают 30–60 сек (timeout). Причина: на VPS в `.next/` сидит скомпилированный broken-wrap от Iter 18B. Revert закоммичен и запушен (`c9528f7`), `deploy_vps.py` отработал, но **Turbopack persistent cache trap (CLAUDE.md ловушка #3)** не очистился — pm2 крутит старый код.

### Что делать ПЕРВЫМ ШАГОМ (≤ 5 мин)

```bash
# Из локальной машины через python+paramiko (см. примеры в HANDOFF.md):
ssh root@212.116.115.150 -i ~/.ssh/climat_simf_deploy  # или с паролем
cd /var/www/climat-simf.ru
pm2 stop climat-simf-store
rm -rf .next
npx --yes next build
pm2 restart climat-simf-store
curl -s -o /dev/null -w '%{http_code} %{time_total}s\n' http://localhost:3001/
# Ожидание: 200 < 1 сек
```

Затем prod-smoke:

```bash
for path in / /catalog /catalog/bytovaya-tehnika-9839 /service; do
  curl -sk --max-time 30 -o /dev/null -w "$path → %{time_total}s %{http_code}\n" "https://climat-simf.ru$path"
done
```

Ожидание:
- `/` → ~0.6 сек
- `/catalog` → ~2 сек (топ-маршрут warm)
- `/catalog/bytovaya-tehnika-9839` → ~2 сек (топ-категория из warm_cache.sh)
- `/service` → ~0.5 сек

**Если ОК — прод восстановлен до pre-Iter-18 baseline. Можно работать дальше.**

---

## Что было сделано (хронологически)

### Iter 18 — `'use cache'` migration (FAILED на Phase 0)

- **Spec:** `docs/superpowers/specs/2026-05-17-iter18-use-cache-migration-design.md` — с revision note 2026-05-18 объясняющей failure.
- **Plan:** `docs/superpowers/plans/2026-05-17-iter18-use-cache-migration.md` — 15 tasks через 4 phases. Применён частично, реверт.
- **Что попробовали:** enable `cacheComponents: true` в `next.config.ts`.
- **Failure mode:** Next 16 cacheComponents несовместим **не только** с `export const revalidate` (что предвидели), но и с `export const dynamic = "force-dynamic"`. У нас 24 routes с `force-dynamic` (admin/login/checkout/api). Каждый из них Next отказывается компилировать.
- **Rollback:** `git revert 08c408c` → commit `aecd790` (запушен).
- **Lesson:** `'use cache'` migration требует ревизии ВСЕХ runtime-API routes (удалить `force-dynamic`, verify cookies/headers usage). Это большая surgical работа с риском сломать auth/admin.

### Iter 18B — `unstable_cache` wrap на `getCatalogPage` (FAILED на проде)

- **Plan:** `docs/superpowers/plans/2026-05-18-iter18b-unstable-cache-fix.md` — короткий plan, 5 tasks.
- **Spec:** оригинальный Iter 18 spec с revision note — цель та же (cold-start <2 сек).
- **Что сделано:**
  - Task 1+2: новый helper `src/lib/catalog-cache-key.ts` (`normalizeCatalogCacheArgs`) + 10 unit-тестов. Commit `<see git log>`.
  - Task 3: обернули `getCatalogPage` в `unstable_cache` через `getCatalogPageCached(cacheKey)` + `cacheKeyToQuery` reconstruction helper. Lint/test/build локально прошли 151/151. Commit `936c535` (запушен, потом revert'нут).
- **Failure mode (на проде, до revert):**

| URL | До Iter 18B (baseline) | После Iter 18B (broken) |
| --- | --- | --- |
| `/` | ~0.6 сек | ~0.6 сек (ок, getHomeSnapshot не трогали) |
| `/catalog/bytovaya-tehnika-9839` (топ, warm_cache.sh) | 2.2 сек | **30+ сек timeout** |
| Не-топ категории (`kabeli-i-perekhodniki-12041` etc) | 17–30 сек | **60+ сек timeout** |
| `/catalog` базовый | ~2 сек | **30 сек timeout** |

- **Корневая причина (гипотеза):** `getCatalogPage` возвращает **огромный JSON** (24 products со всеми includes + 120 brands + полное дерево категорий + 50+ facets + attributeFilterGroups + attributeRangeGroups). Это сотни KB. `unstable_cache` serialize/deserialize этого payload **медленнее** оригинальных Prisma queries. Замеры подтверждают: даже warm-кэш-hit отвечает дольше чем cold Prisma.
- **Rollback:** `git revert 936c535` → commit `c9528f7` (запушен 01:13 MSK 2026-05-18). `deploy_vps.py` отработан, **но force clean rebuild на VPS НЕ сделан** — прод в broken state.

---

## Open debt

### Cold-start fix (Iter 15C недозакрыт + Iter 18/18B failed)

Не-топ-12 категорий всё ещё 17–30 сек cold-start. Подходы которые **уже опробованы и не работают**:

1. ❌ `'use cache'` directive — Next 16 incompatibility с `force-dynamic`.
2. ❌ `unstable_cache` wrap всей `getCatalogPage` — payload слишком большой.
3. ✅ Существующий `warm_all.sh` cron — работает но эффект низкий (page render всё равно дорогой).

### Подходы которые НЕ были опробованы (для следующей сессии)

1. **Wrap только expensive Prisma queries отдельно**, не всю getCatalogPage. Самые дорогие — `prisma.product.findMany` (с includes) + `prisma.product.count` + facets/attribute groups. Каждая обёрнута в свой `unstable_cache` со своим key. Payload каждого entry меньше → serialize faster. Final assembly остаётся в getCatalogPage без cache.
2. **Серверный image cache** (через nginx proxy_cache /api/product-images/* в файловую систему) — снимет нагрузку на supplier I-T-P, ускорит rendering images.
3. **Pre-compute static snapshot** в БД (cron pre-aggregates per-slug payload, stored как jsonb column). Page просто читает 1 row. Очень дешёвый read.
4. **Wrap ТОЛЬКО facets/attribute groups** (они самые дорогие) — остальное оставить uncached.
5. **Optimize Prisma queries** — посмотреть EXPLAIN ANALYZE, добавить индексы, уменьшить join depth.
6. **Migration на Next 16 cacheComponents** (Iter 18 подход) — но с ревизией всех 24 `force-dynamic` routes. Большой проект.

Для выбора подхода нужен **профилирование** реального slow request:
- Какая часть getCatalogPage съедает 17 сек? Prisma findMany? facets? attribute groups?
- Подключить `console.time/timeEnd` вокруг каждого внутреннего вызова, deploy, замерить, найти hot spot.

---

## Что нужно знать про артефакты в репо

### Commits на feature branch `claude/affectionate-shamir-feac14` (последние, по времени):

```
c9528f7 Revert "Iter 18B Task 3: wrap getCatalogPage in unstable_cache..."  ← LATEST, ON PROD
936c535 Iter 18B Task 3: wrap getCatalogPage in unstable_cache...           ← REVERTED
7ebec85 docs: archive 'use cache' spec + new Iter 18B plan...
aecd790 Revert "Iter 18 Phase 0: enable cacheComponents flag (Next 16)"     ← Iter 18 revert
08c408c Iter 18 Phase 0: enable cacheComponents flag (Next 16)              ← REVERTED
5bcfe9f docs: implementation plan for Iter 18 ('use cache' migration)
64adcfa docs: spec for Iter 18 (cold-start fix via Next 16 'use cache')
f00e270 docs: HANDOFF Iter 17 + CLAUDE.md deploy trap (npm install gap)     ← BASELINE
```

### Файлы которые сохранены в репо (полезные для будущей работы):

- **`src/lib/catalog-cache-key.ts`** — `normalizeCatalogCacheArgs` helper. **Работает корректно** (10/10 тестов). Не используется после revert, но готов к re-use если попробуем подход #1 из «не опробованных» (отдельный cache на findMany/count).
- **`src/lib/catalog-cache-key.test.ts`** — 10 unit-тестов, дают 151/151 в общем suite.
- **`docs/superpowers/specs/2026-05-17-iter18-use-cache-migration-design.md`** — spec с revision note. Историческая запись, объясняет почему `'use cache'` не подходит.
- **`docs/superpowers/plans/2026-05-17-iter18-use-cache-migration.md`** — старый plan (Iter 18, 15 tasks). Не повторять.
- **`docs/superpowers/plans/2026-05-18-iter18b-unstable-cache-fix.md`** — Iter 18B plan. Тоже не повторять (failed).
- **`docs/superpowers/notes/2026-05-18-cold-start-fix-status.md`** — этот файл.

### Pre-Iter-18 backups на VPS (для emergency rollback):

```
/var/www/climat-simf.ru.source-backup-20260518004849.tar.gz  ← Iter 18B deploy (broken)
/var/www/climat-simf.ru.source-backup-20260517123512.tar.gz  ← Iter 17 (last known good)
/var/www/climat-simf.ru.source-backup-20260517015351.tar.gz  ← Iter 15E
```

Если force rebuild почему-то не починит прод, аварийный rollback:
```bash
ssh root@212.116.115.150 'cd / && tar -xzf /var/www/climat-simf.ru.source-backup-20260517123512.tar.gz && cd /var/www/climat-simf.ru && rm -rf .next && npx next build && pm2 restart climat-simf-store'
```

---

## Recommended next session sequence

1. **Force clean rebuild на VPS** (см. секцию «КРИТИЧНО» наверху). Verify прод восстановлен. ≤ 5 мин.
2. **Read this file полностью** для понимания failure modes.
3. **Profile slow getCatalogPage** — добавить timing logs, deploy, замерить на не-топ категории. Найти hot spot (Prisma findMany? facets? attribute groups?). ≤ 30 мин.
4. **На основе профайла** выбрать подход из «не опробованных» (выше). Best candidate — #1 (granular `unstable_cache` на findMany + count + facets отдельно, payloads small).
5. **Brainstorm + spec + plan** (по superpowers workflow). Не пытаться сразу wrap всю функцию — это уже провалилось.

---

## Ловушки которые мы прошли в этой сессии (зафиксированы)

1. **Subagent работает не в моём worktree** — Phase 0 implementer subagent (haiku) сделал commit `638b831` где-то ещё, в моём worktree этого коммита нет. Подтвердилось: implementer вернул test count 122 (старое) вместо 141 (моего). Уроки:
   - Subagent dispatch'и для multi-step tasks с `cd` chains — рисково.
   - Inline implementation надёжнее когда workspace specific.
   - Спецификации subagent'у должны включать абсолютные пути всех команд, не relative `cd ..`.

2. **Plan defect — нельзя предположить совместимость features.** `'use cache'` + `force-dynamic` — оказались взаимоисключающими. Spec нужно verify на минимальном POC ДО написания полного plan'а.

3. **unstable_cache не free.** Cache hit ≠ instant — serialize/deserialize большого payload может быть дороже Prisma query. Замерять, не предполагать.

4. **deploy_vps.py НЕ очищает `.next`** даже при reverts — нужен manual `rm -rf .next && next build` каждый раз когда меняется lib/ файл (известная ловушка из CLAUDE.md).
