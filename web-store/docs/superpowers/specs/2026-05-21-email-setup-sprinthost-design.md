# Настройка почты climat-simf.ru (Sprinthost) — Design

**Дата:** 2026-05-21
**Статус:** Design (ожидает ревью)

## Контекст и проблема

Сайт `climat-simf.ru` использует passwordless-вход по magic-link: пользователь вводит
email → создаётся `MagicLinkToken` → на email уходит ссылка `/login/verify?token=` →
создаётся `Session`. Регистрация = первый такой вход (`findOrCreateUser` авто-создаёт `User`).

Код отправки (`src/lib/mailer.ts`, nodemailer, Iter 16) **готов и протестирован**, но
**почтовой инфраструктуры у домена нет вообще**. Проверка DNS (2026-05-21):

| Запись | Значение |
|--------|----------|
| `A climat-simf.ru` | `212.116.115.150` (VPS, сайт) |
| `MX` | **отсутствует** |
| `TXT (SPF)` | **отсутствует** |
| `NS` | `ns1-4.sprinthost.ru/.net` (DNS управляется в Sprinthost) |

Итог: сайт не может ни отправлять, ни принимать почту. На проде `sendMail` сейчас
падает в `console`-заглушку (письма «уходят» в логи pm2, никуда не доставляются),
поэтому **вход/регистрация для реальных пользователей не работают**.

## Цель

1. Включить отправку транзакционных писем (magic-link вход/регистрация) с `noreply@climat-simf.ru`.
2. Включить отправку информационных писем (уведомления о статусе роли B2B/Gov) с `info@climat-simf.ru`.
3. Включить **приём** писем на `info@climat-simf.ru` (чтобы клиенты могли отвечать, а владелец читать в webmail Sprinthost).
4. Обеспечить доставляемость (SPF/DKIM/DMARC), чтобы письма не падали в спам Gmail/Yandex/Mail.ru.

## Архитектура

**Split-setup:** веб-сайт остаётся на VPS (`A` корня не трогаем), почта домена обслуживается
Sprinthost. Приложение на VPS шлёт письма через аутентифицированный SMTP Sprinthost; поскольку
письма уходят с почтовых серверов Sprinthost (которые попадают под их SPF/DKIM), доставляемость
обеспечивается без своего mail-сервера.

Лимит Sprinthost: 4000 писем/сутки, 15000/мес — для писем входа с большим запасом.

### Разделение отправителей

| Отправитель | Назначение | Письма |
|-------------|-----------|--------|
| `noreply@climat-simf.ru` | транзакционные / auth | magic-link (вход = подтверждение регистрации) |
| `info@climat-simf.ru` | информационные | одобрение/отклонение заявки на роль B2B/Gov; в будущем — рассылки |

**Решение по аутентификации SMTP:** каждый отправитель аутентифицируется **своим** ящиком
(noreply@ шлёт под noreply@, info@ — под info@). Это исключает отказ типа «From mismatch»,
который некоторые SMTP-серверы выдают, когда `From` не совпадает с залогиненным ящиком.
Креды `info@` опциональны: если не заданы, отправка с `info@` использует дефолтный
(noreply) транспорт — graceful fallback (приемлемо для одного домена).

## Часть 1 — Инфраструктура (выполняет владелец в панели Sprinthost)

Это **ручные шаги в панели Sprinthost + DNS**, их не сделать из кода. Без них код отправки
работать не будет.

1. Включить почтовый хостинг для домена `climat-simf.ru`.
2. Создать два ящика: `noreply@climat-simf.ru` и `info@climat-simf.ru`. Сохранить пароли.
3. Узнать IPv4 (и IPv6, если есть) почтового сервера Sprinthost — для A/AAAA-записей поддоменов.
4. В разделе «Подписи DKIM» сгенерировать DKIM/SPF/DMARC для домена.
5. Добавить DNS-записи (в панели Sprinthost, где лежит DNS):
   - `MX` приоритет `10` → `mail.climat-simf.ru.`
   - `A` `mail.climat-simf.ru` → IPv4 Sprinthost (+ `AAAA` если есть IPv6)
   - `A` `smtp.climat-simf.ru` → IPv4 Sprinthost (+ `AAAA`)
   - `TXT` SPF (значение из панели Sprinthost)
   - DKIM-запись (`TXT`/`CNAME` — как укажет панель)
   - `TXT` DMARC (рекомендация: `v=DMARC1; p=none; rua=mailto:info@climat-simf.ru`)
   - Корневой `A climat-simf.ru` = `212.116.115.150` **не менять**.

**Что владелец передаёт исполнителю для Части 3:** пароли ящиков `noreply@` и `info@`.

## Часть 2 — Код (правка `src/lib/mailer.ts`)

Минимальная, обратносовместимая правка.

### Изменения интерфейса
- В `SendArgs` добавить необязательное поле `from?: string`.
- Добавить чистые хелперы, читающие env с дефолтами:
  - `mailFromNoreply(): string` → `MAIL_FROM_NOREPLY` || `MAIL_FROM` || `"БытТехОпт <noreply@climat-simf.ru>"`
  - `mailFromInfo(): string` → `MAIL_FROM_INFO` || `mailFromNoreply()`
- В `sendMail`:
  - резолвить `from = args.from ?? mailFromNoreply()`;
  - при выборе SMTP-транспорта: если `from` соответствует `info@` и заданы `SMTP_INFO_USER`/`SMTP_INFO_PASSWORD`,
    использовать транспорт под этими кредами; иначе дефолтный транспорт (`SMTP_USER`/`SMTP_PASSWORD`).
  - Кэш транспортов — по ключу `host:port:user` (уже есть; расширить, чтобы держать оба).

### Маршрутизация в вызовах
- `src/app/login/actions.ts` (magic-link): оставить дефолт (noreply) — поведение не меняется,
  либо явно `from: mailFromNoreply()`.
- `src/app/admin/role-requests/actions.ts` (2 вызова — approved/rejected): передавать `from: mailFromInfo()`.

### Тесты (`src/lib/mailer.test.ts`)
Добавить к существующим (pure-функции):
- `mailFromNoreply()` возвращает env-значение, иначе дефолт.
- `mailFromInfo()` возвращает env-значение, иначе падает на noreply.
- (build*-тесты остаются без изменений.)

`sendMail` напрямую не тестируем (сетевой side-effect) — покрываем резолвинг `from` через хелперы.

## Часть 3 — Конфиг на VPS (исполнитель)

В `/var/www/climat-simf.ru/.env` (только env, **не коммитить**):
```
SMTP_HOST=smtp.climat-simf.ru
SMTP_PORT=465
SMTP_USER=noreply@climat-simf.ru
SMTP_PASSWORD=<пароль ящика noreply>
SMTP_INFO_USER=info@climat-simf.ru
SMTP_INFO_PASSWORD=<пароль ящика info>
MAIL_FROM_NOREPLY="БытТехОпт <noreply@climat-simf.ru>"
MAIL_FROM_INFO="БытТехОпт <info@climat-simf.ru>"
```
Затем `pm2 restart climat-simf-store`. Обновить `.env.example` в репо (без секретов).

## Часть 4 — Проверка (end-to-end)

1. **DNS:** `nslookup -type=MX climat-simf.ru` → `mail.climat-simf.ru`; `nslookup -type=TXT` → SPF присутствует.
2. **Отправка (noreply):** на проде запросить magic-link на свой Gmail/Yandex → письмо пришло (проверить «Входящие» И «Спам»).
3. **Доставляемость:** в исходниках письма заголовки `spf=pass` и `dkim=pass`.
4. **Вход:** перейти по ссылке из письма → создаётся сессия, пользователь залогинен.
5. **Отправка (info):** инициировать одобрение заявки на роль (admin) → письмо приходит с `info@`.
6. **Приём:** отправить письмо НА `info@climat-simf.ru` с внешнего ящика → оно видно в webmail Sprinthost.

## Допущения

- Регистрация = тот же magic-link; отдельного «welcome»-письма не делаем (YAGNI).
- Один SMTP-хост `smtp.climat-simf.ru` обслуживает оба ящика; каждый аутентифицируется своим логином.
- Приём почты на `info@` читается через webmail Sprinthost; сайт входящие письма не обрабатывает.

## Вне scope

- Свой mail-сервер на VPS (Postfix) — отклонён из-за риска спама с IP VPS.
- Транзакционные сервисы (Yandex 360 / Resend) — рассмотрены как альтернатива (Путь C), не выбраны.
- Парсинг/автоматизация входящих писем на стороне сайта.
- Email-рассылки/маркетинг (отдельный проект).
