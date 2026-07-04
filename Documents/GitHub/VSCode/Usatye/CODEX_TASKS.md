# Задание для Codex: код-ревью, тестирование и доработка Partner Money CRM

Дата постановки: 2026-07-04. Ветка: `codex/parsing_tenders`. Package: `ru.partnercrm`.
Стек: Kotlin + Jetpack Compose + Room, minSdk 26. Контекст проекта — см. `HANDOFF.md`.

Это мини-CRM для учёта партнёров и денежных сделок (входящая сумма → процент → к возврату →
профит). Последняя доработка (2026-06-13) разделила профит на «Заработано»/«Ожидается», добавила
отчёты по периодам, настройки и бэкап/восстановление JSON. Юнит-тесты (`./gradlew test`) зелёные,
но покрывают только доменную логику — UI, сценарий backup/restore и релизная сборка ни разу не
проверялись end-to-end.

Ниже — три обязательных блока работы: код-ревью, тестирование, и топ-10 улучшений. Каждый пункт
даёт файл и что именно проверить/исправить — не изобретай абстрактные улучшения, работай с этим
списком.

## 1. Обязательное код-ревью

Пройди по каждому пункту, подтверди или опровергни находку с указанием файл:строка, и если
подтверждается — почини в рамках соответствующей задачи из раздела 3.

- **Синхронный Room на главном потоке.** `app/src/main/java/ru/partnercrm/PartnerMoneyApplication.kt:20`
  вызывает `.allowMainThreadQueries()` на билдере Room, а
  `app/src/main/java/ru/partnercrm/data/repository/RoomCrmRepository.kt` оборачивает 18 методов в
  `runBlocking {}`. Это значит, что каждое открытие экрана/сохранение сделки блокирует UI-поток —
  прямой риск ANR.
- **Стратегия миграций БД.** `app/src/main/java/ru/partnercrm/data/db/AppDatabase.kt`: `version = 2`,
  `exportSchema = false`. Единственная миграция — `MIGRATION_1_2` в
  `PartnerMoneyApplication.kt:49-56`. `fallbackToDestructiveMigration()` не вызывается — значит
  следующее повышение версии без миграции уронит приложение с `IllegalStateException` при открытии
  БД (а не молча удалит данные — но и краш на старте не лучше).
- **Три разные формулы профита.** Сверь `domain/dashboard/DashboardCalculator.kt` (`realizedProfit`),
  `repairFullyPaidActiveDeals()` в `data/repository/InMemoryCrmRepository.kt` и
  `data/repository/RoomCrmRepository.kt`, и `domain/calculator/MoneyCalculator.kt` — все три места
  считают профит по-разному (по проценту vs `amountIn - paidOutAmount`).
- **Атомарность массовых операций.** `RoomCrmRepository.kt`: `replaceAll()` (используется при
  restore бэкапа) и `recordPayout()`, когда платёж затрагивает несколько сделок — ни один не
  обёрнут в `@Transaction`. Частичный сбой посреди операции оставит БД в неконсистентном состоянии.
- **BackupSerializer.kt** (`data/backup/BackupSerializer.kt`): при `restore()` не читает и не
  проверяет поле `version` — при изменении схемы бэкапа импорт либо упадёт, либо тихо испортит
  данные. Тестов на этот файл нет вообще.
- **EntityMappers.kt** (`data/db/EntityMappers.kt`): `enum.valueOf(...)` вызывается без
  `runCatching`/fallback — если в БД окажется "грязное" значение статуса или типа расчёта, маппинг
  упадёт с исключением.
- **Индекс `DealEntity`.** В `data/db/DealEntity.kt` есть отдельные индексы на `partnerId` и
  `status`, но нет составного `(partnerId, status)`, хотя именно по обоим полям фильтрует
  `recordPayout()`.

## 2. Требования по тестированию

- Прогнать и приложить полный вывод: `./gradlew test` и `./gradlew assembleDebug`.
- Добавить недостающие unit-тесты:
  - `BackupSerializer`: export/import round-trip, повреждённый JSON, несовпадение/отсутствие
    `version`.
  - `EntityMappers`: невалидное enum-значение из БД (симулировать "грязные" данные).
- Добавить `app/src/androidTest` (сейчас этой папки нет вообще — инструментальных/Compose UI-тестов
  нет ни одного) минимум для:
  - полного прохождения формы сделки (`AddDealDialog`);
  - сценария backup → restore через системный file picker — по `HANDOFF.md` это единственное, что
    осталось не проверено кликом на устройстве;
  - переключения вкладок и back-навигации (ручной `tabHistory` стек в `PartnerMoneyApp.kt`).
- Добавить `app/proguard-rules.pro` (сейчас отсутствует) и собрать `./gradlew assembleRelease` с
  минификацией; вручную проверить экспорт/импорт бэкапа на минифицированной сборке — риск, что
  `BackupSerializer` использует reflection-подобную (де)сериализацию, которую R8 может сломать.
- Добавить статический анализ (detekt или ktlint — сейчас нет ни того, ни другого) и
  GitHub Actions workflow, гоняющий `./gradlew test assembleDebug lint` на каждый push/PR — сейчас
  CI отсутствует полностью.

## 3. Топ-10 улучшений логики и дизайна (по приоритету)

1. **[Критично, логика]** Убрать `allowMainThreadQueries()` и все `runBlocking` — перевести
   `CrmRepository` на suspend/Flow API, DB-операции выполнять на `Dispatchers.IO`.
2. **[Критично, логика]** Ввести явную стратегию миграций Room: включить `exportSchema = true`
   (хранить json-схемы в репозитории), писать `Migration` под каждое будущее изменение версии —
   чтобы апдейт приложения не крашился на старте.
3. **[Критично, логика]** Свести три формулы расчёта профита к единой
   `Deal.realizedProfit()` / `Deal.expectedProfit()` с тестами на все комбинации
   DISCOUNT/INTEREST и частичных выплат.
4. **[Важно, логика]** Обернуть `replaceAll()` (restore бэкапа) и multi-deal `recordPayout()` в
   `@Transaction`, чтобы исключить частично применённые операции.
5. **[Важно, логика]** `BackupSerializer`: валидировать `version` при restore, покрыть тестами
   самый рискованный по пользовательским данным путь в приложении.
6. **[Важно, дизайн]** Разбить монолитный `app/src/main/java/ru/partnercrm/ui/PartnerMoneyApp.kt`
   (2341 строка, корневой composable — 545 строк, 14 state-переменных в одном месте) на отдельные
   экраны/файлы с `NavHost` вместо ручного управления `tabHistory` — улучшит производительность
   recomposition и поддерживаемость.
7. **[Важно, дизайн]** Добавить тёмную тему (`darkColorScheme` / dynamic color на Android 12+) —
   сейчас в `PartnerMoneyApp.kt:114` определена только `lightColorScheme`.
8. **[Важно, accessibility]** Добавить `contentDescription` интерактивным элементам — сейчас во
   всём файле ровно 1 вхождение (только нижняя навигация) на ~237 Icon/Text-элементов. Приложением
   сейчас нельзя пользоваться с TalkBack.
9. **[Средне, дизайн]** Вынести ~218 захардкоженных русских строк в `strings.xml` и
   централизовать `statusLabel()`/`statusColor()`/`dealFilterLabel()` (дублируются) и цветовую
   палитру (`Color(0xFF1E6B5C)` и аналоги повторяются 15–50 раз по файлу) в единые
   `AppTheme`/`AppStrings`.
10. **[Средне, логика/UX]** Централизовать валидацию форм — `AddPartnerDialog`, `AddDealDialog`,
    `AddPayoutDialog` дублируют похожие правила проверки — в общий `FormValidator`, и добавить
    live-валидацию по мере ввода вместо ошибок только при попытке сохранения.

## 4. Бэклог (не входит в топ-10, но стоит зафиксировать и по возможности сделать)

- Составной индекс `(partnerId, status)` в `DealEntity.kt`.
- `enum.valueOf()` без fallback в `EntityMappers.kt` (см. пункт код-ревью выше).
- Захардкоженное окно `DUE_SOON = 3 дня` в статус-резолвере — вынести в настройки приложения.
- Дублирование `remainingToReturn()` (`ExcelExporter.kt` vs `DashboardCalculator.kt`) — вынести в
  extension-функцию `Deal.remainingToReturn()`.
- Progress indicators и retry-кнопки при экспорте/восстановлении Excel/JSON.
- Адаптивная разметка для планшетов/широких экранов (сейчас все размеры — фиксированные `dp`).

## Как сдавать работу

- Для каждого пункта раздела 1 — явно написать: подтверждено / не подтверждено, и почему.
- Для каждого пункта из топ-10 — что изменено, какие тесты добавлены/обновлены, вывод
  `./gradlew test` до и после.
- Не добавлять функциональность и абстракции сверх того, что перечислено выше.
