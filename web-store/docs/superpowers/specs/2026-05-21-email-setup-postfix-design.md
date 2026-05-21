# Настройка почты climat-simf.ru — самостоятельный mail-сервер (Postfix) — Design

**Дата:** 2026-05-21
**Статус:** Design (ожидает ревью)
**Подход:** свой почтовый стек на VPS (Postfix + OpenDKIM + Dovecot + Roundcube), RU-фокус.

## Контекст и проблема

Сайт использует passwordless-вход по magic-link (`/login` → email со ссылкой → `/login/verify`).
Код отправки (`src/lib/mailer.ts`, nodemailer) готов, но **почты у домена нет**.

Проверка DNS (2026-05-21): `A climat-simf.ru = 212.116.115.150` (VPS), `MX` отсутствует,
`SPF` отсутствует, NS → sprinthost. На проде `sendMail` падает в console-заглушку → письма
никуда не доставляются → **вход/регистрация реально не работают.**

Провайдер — **Sprintbox** (`cp.sprintbox.ru`): VPS/облако + регистратор доменов. **Почтового
хостинга (создания ящиков) нет.** Поэтому почта поднимается своим сервером на VPS.

### Факты проверки VPS (2026-05-21)

| Проверка | Результат | Следствие |
|----------|-----------|-----------|
| Исходящий порт 25 → Mail.ru | OPEN | доставка на @mail.ru/@bk/@inbox/@list работает |
| Исходящий порт 25 → Yandex | OPEN | доставка на @yandex/@ya.ru работает |
| Исходящий порт 25 → Gmail | BLOCKED/timeout | **доставка на @gmail.com ненадёжна** |
| MTA на сервере | не установлен | ставим Postfix |
| PTR (rDNS) для IP | `box-891610.local` | **мусорный — обязательно сменить на `mail.climat-simf.ru`** |

## Цель

1. Отправка транзакционных писем (magic-link вход/регистрация) с `noreply@climat-simf.ru`.
2. Отправка информационных писем (уведомления о роли B2B/Gov) с `info@climat-simf.ru`.
3. **Приём** писем на `info@climat-simf.ru` с чтением через веб-почту (Roundcube).
4. Доставляемость в RU (Mail.ru, Yandex): корректные PTR + SPF + DKIM + DMARC.

## Архитектура

Почтовый стек на том же VPS (`212.116.115.150`), отдельно от Next.js-приложения:

```
Next.js (app) ──localhost:25──▶ Postfix ──:25──▶ MX получателя (mail.ru, yandex)
                                  │ milter
                                  ▼
                               OpenDKIM (подпись домена)

Внешний отправитель ──:25/MX──▶ Postfix ──LMTP──▶ Dovecot (Maildir info@)
                                                      ▲ IMAP
Владелец ──https──▶ nginx ──▶ Roundcube (PHP) ────────┘
```

- **Postfix** — MTA: принимает почту для домена и отправляет наружу. Релеит **только** с localhost
  (`mynetworks=127.0.0.0/8`) и по аутентифицированному submission — **не open relay**.
- **OpenDKIM** — milter, подписывает исходящие письма ключом селектора `mail`.
- **Dovecot** — IMAP + LMTP, хранит виртуальный ящик `info@` (Maildir).
- **Roundcube** — веб-почта (PHP-FPM) на `webmail.climat-simf.ru`, читает `info@` через Dovecot.

Хостнейм почтовика (HELO, PTR, A, cert) — единый: `mail.climat-simf.ru`.

### Разделение отправителей (код)

| Отправитель | Назначение | Письма |
|-------------|-----------|--------|
| `noreply@climat-simf.ru` | транзакц./auth | magic-link (вход = подтверждение регистрации) |
| `info@climat-simf.ru` | информационные | одобрение/отклонение роли B2B/Gov |

При локальном Postfix-релее **отдельная SMTP-аутентификация на каждый адрес не нужна**: приложение
релеит через localhost, DKIM подписывает домен независимо от `From`. Достаточно подставлять нужный
заголовок `From`.

### Адреса-служебки

`postmaster@` и `abuse@` → алиас на `info@` (требование RFC, влияет на репутацию). `noreply@` —
только отправка, входящие отбрасываются (discard).

## Часть 1 — Инфраструктура на VPS (исполнитель, root SSH)

Все шаги — на сервере `212.116.115.150`. Детальные команды — в плане реализации.

1. **Postfix**: установить, задать `myhostname=mail.climat-simf.ru`, виртуальные домены/ящики,
   `mynetworks=127.0.0.0/8`, TLS (см. ниже), submission (587) с SASL через Dovecot для Roundcube.
   Алиасы `postmaster@`/`abuse@` → `info@`, `noreply@` → discard.
2. **OpenDKIM**: сгенерировать пару ключей, селектор `mail`, подключить milter к Postfix.
   Сохранить публичный ключ для DNS-записи.
3. **Dovecot**: IMAP (993, SSL) + LMTP-доставка, виртуальный пользователь `info@` (Maildir),
   passwd-file аутентификация.
4. **Roundcube**: PHP-FPM + nginx-vhost `webmail.climat-simf.ru`, IMAP=localhost, SMTP=localhost submission.
5. **TLS**: certbot — сертификат на `mail.climat-simf.ru` и `webmail.climat-simf.ru`. Подключить к
   Postfix, Dovecot, nginx(roundcube).
6. **Firewall (Sprintbox «Файрвол» + локально)**: открыть входящие 25 (SMTP), 587 (submission),
   993 (IMAPS), 443 (webmail). Исходящий 25 уже открыт (Mail.ru/Yandex проверены).
7. **fail2ban**: джейлы для postfix/dovecot (защита от перебора/спама).

## Часть 2 — DNS (выполняет владелец, Sprintbox → DNS-записи)

| Тип | Имя | Значение |
|-----|-----|----------|
| `A` | `mail.climat-simf.ru` | `212.116.115.150` |
| `A` | `webmail.climat-simf.ru` | `212.116.115.150` |
| `MX` | `climat-simf.ru` | `10 mail.climat-simf.ru.` |
| `TXT` | `climat-simf.ru` (SPF) | `v=spf1 a mx ip4:212.116.115.150 -all` |
| `TXT` | `mail._domainkey.climat-simf.ru` (DKIM) | публичный ключ из OpenDKIM (даёт исполнитель после шага 1.2) |
| `TXT` | `_dmarc.climat-simf.ru` | `v=DMARC1; p=none; rua=mailto:info@climat-simf.ru` |

Корневой `A climat-simf.ru = 212.116.115.150` (сайт) — **не менять**.

## Часть 3 — PTR / rDNS (выполняет владелец, Sprintbox → «Боксы» → rDNS)

Сменить PTR для `212.116.115.150` с `box-891610.local` на **`mail.climat-simf.ru`**.
Критично для доставляемости. Исполнитель не имеет доступа к настройкам бокса.

## Часть 4 — Код (`src/lib/mailer.ts`)

Минимальная, обратносовместимая правка:
- В `SendArgs` добавить необязательное `from?: string`.
- Хелперы: `mailFromNoreply()` (`MAIL_FROM_NOREPLY` || `MAIL_FROM` || дефолт),
  `mailFromInfo()` (`MAIL_FROM_INFO` || `mailFromNoreply()`).
- В `sendMail`: `from = args.from ?? mailFromNoreply()`.
- **Разрешить SMTP без аутентификации для localhost-релея**: сейчас `getSmtpTransport()`
  возвращает `null`, если нет `SMTP_USER`/`SMTP_PASSWORD`. Добавить: если задан `SMTP_HOST`
  (напр. `127.0.0.1`) без user/pass — создавать транспорт без `auth`. Кэш-ключ учитывает отсутствие auth.
- Маршрутизация вызовов:
  - `src/app/login/actions.ts` (magic-link) — дефолт (noreply), поведение не меняется.
  - `src/app/admin/role-requests/actions.ts` (approved/rejected) — `from: mailFromInfo()`.
- Обновить `.env.example`.

### Тесты (`src/lib/mailer.test.ts`)
- `mailFromNoreply()` / `mailFromInfo()` — env-значение и дефолты/фоллбэк.
- (build*-тесты без изменений.)

## Часть 5 — Конфиг приложения на VPS

В `/var/www/climat-simf.ru/.env` (только env, **не коммитить**):
```
SMTP_HOST=127.0.0.1
SMTP_PORT=25
MAIL_FROM_NOREPLY="БытТехОпт <noreply@climat-simf.ru>"
MAIL_FROM_INFO="БытТехОпт <info@climat-simf.ru>"
```
(без `SMTP_USER`/`SMTP_PASSWORD` — релей через localhost). Затем `pm2 restart climat-simf-store`.

## Часть 6 — Проверка (end-to-end)

1. **DNS:** `nslookup -type=MX/TXT climat-simf.ru` — MX, SPF, DKIM, DMARC присутствуют. PTR: `host 212.116.115.150` → `mail.climat-simf.ru`.
2. **Отправка noreply:** запросить magic-link на личный **Mail.ru и Yandex** ящики → письма пришли (вкл. «Спам»).
3. **Аутентификация:** в исходниках письма `spf=pass`, `dkim=pass`, `dmarc=pass`. Контрольно — балл на mail-tester.com ≥ 8/10.
4. **Вход:** перейти по ссылке → создаётся сессия.
5. **Отправка info:** одобрить заявку на роль (admin) → письмо с `info@`.
6. **Приём info@:** отправить письмо НА `info@climat-simf.ru` извне → видно в Roundcube (`https://webmail.climat-simf.ru`).
7. **Не open-relay:** внешняя проверка (например `mxtoolbox`/ручной тест) — релей с чужого IP отклоняется.

## Риски и ограничения

- **Gmail:** исходящий порт 25 к Google заблокирован — письма на @gmail.com, скорее всего, не дойдут.
  Принято осознанно (RU-аудитория). Если позже понадобится Gmail — добавить smarthost-relay для @gmail.
- **Репутация IP/блоклисты:** новый отправитель прогревается; возможны временные попадания в спам,
  пока репутация набирается. Мониторить блоклисты (mxtoolbox).
- **Поддержка:** свой mail-сервер требует обслуживания (патчи, обновление cert, мониторинг очереди/блоклистов).
- **Безопасность:** строго не open-relay; fail2ban; только TLS-сабмишн.

## Допущения

- Регистрация = тот же magic-link; отдельного welcome-письма нет (YAGNI).
- Читаем только `info@` (полный ящик); `noreply@` — send-only, входящие отбрасываются.
- Webmail на поддомене `webmail.climat-simf.ru`.

## Вне scope

- Доставка на Gmail (нужен relay).
- Несколько пользовательских ящиков сверх `info@`.
- Антиспам-фильтрация входящих (rspamd) — можно добавить позже.
- Email-рассылки/маркетинг.
