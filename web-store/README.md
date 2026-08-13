# БытТехОпт / climat-simf.ru

Next.js интернет-магазин бытовой техники, электроники и товаров для дома с интеграцией I-T-P B2B.

## Что реализовано

- публичная витрина: главная, каталог, категория, поиск, карточка товара;
- корзина в браузере с серверным пересчетом цены и кратности перед заказом;
- локальные заказы в PostgreSQL и Telegram-уведомление менеджеру;
- Prisma-модели для категорий, товаров, изображений, заказов, настроек, складов, адресов и SyncLog;
- I-T-P клиент: session cache, JSON-RPC, static JSON download, retry при auth/session ошибке;
- синхронизация категорий, товаров, цен/остатков и метаданных изображений;
- базовая админка: товары, категории, заказы, синхронизация, настройки, логи;
- deployment-шаблоны для PM2, Nginx и cron.

## Локальный запуск

```bash
npm install
cp .env.example .env
npm run prisma:generate
npm run db:push
npm run dev
```

## Production на VPS

Целевая папка: `/var/www/climat-simf.ru`.

```bash
npm ci
npm run prisma:generate
npm run db:push
npm run build
pm2 start ecosystem.config.cjs
pm2 save
```

Nginx-шаблон лежит в `deploy/nginx.climat-simf.ru.conf`. Cron-шаблон синхронизации лежит в `deploy/crontab.example`.

## Срочный мониторинг остатков I-T-P

Монитор использует существующие `ITP_API_*` и Telegram-настройки. В `.env` на VPS укажите точные SKU (надежнее всего) и/или фрагменты названий серий:

```dotenv
STOCK_MONITOR_SKUS="123456,123457"
STOCK_MONITOR_PATTERNS="Exegate серия X; Exegate модель Y"
STOCK_MONITOR_REPEAT_MINUTES="15"
STOCK_MONITOR_TELEGRAM_BOT_TOKEN="токен от BotFather"
STOCK_MONITOR_TELEGRAM_CHAT_ID="-1001234567890"
```

Проверка конфигурации и тестовое сообщение в Telegram:

```bash
npm run monitor:stock -- --dry-run
npm run monitor:stock -- --test
```

После успешного теста установите самовосстанавливающийся systemd-сервис и таймер:

```bash
sudo bash scripts/install-stock-monitor-systemd.sh
```

Таймер запускает проверку в `:00`, `:15`, `:30` и `:45` и догоняет пропущенный запуск после перезагрузки сервера. Если проверка зависает дольше четырех минут, обёртка завершает процесс; systemd повторяет неуспешный запуск через минуту (не более трех быстрых попыток за 15 минут). Следующий штатный слот остается дополнительной страховкой. Отдельный cron для монитора не нужен и удаляется установщиком.

При появлении остатка сообщение приходит на ближайшем запуске и повторяется каждые 15 минут, пока товар доступен. Заголовок и каждая доступная модель отправляются отдельными Telegram-сообщениями. Карточка содержит остаток на основном складе и исходное описание поставщика с техническими характеристиками; ближайший РЦ не показывается. Под каждой товарной карточкой расположены крупные inline-кнопки на отдельных строках: `Заказать`, `Открыть B2B` и `Карточка товара`. Состояние хранится в `.runtime/stock-monitor-state.json`; повторяющиеся ошибки Telegram сообщает не чаще одного раза в час.

### Заказ из Telegram

Кнопка `Заказать` запускает диалог: бот запрашивает количество через Force Reply, проверяет актуальный остаток и кратность, показывает цену и сумму, а затем просит отдельное подтверждение. После подтверждения API создаёт заказ B2B и добавляет товар. Заказ намеренно остаётся неподтверждённым на отгрузку — его можно проверить и подписать в кабинете поставщика.

```env
STOCK_ORDER_BOT_ENABLED="true"
STOCK_ORDER_LOGISTIC_CENTER_ID="16"
STOCK_ORDER_DELIVERY_ADDRESS_ID="221892"
STOCK_ORDER_DELIVERY_ADDRESS_LABEL="г. Симферополь, ул. Глинки 61А, оф. 70"
STOCK_ORDER_TELEGRAM_CHAT_URL="https://t.me/c/4478291004/1"
STOCK_ORDER_CONFIRM_TTL_MINUTES="5"
STOCK_ORDER_TELEGRAM_WEBHOOK_SECRET="случайная-строка"
STOCK_ORDER_LINK_SECRET="другая-случайная-строка-не-менее-32-символов"
STOCK_ORDER_LINK_TTL_MINUTES="60"
```

Установка фонового обработчика с автоматическим перезапуском:

```bash
sudo bash scripts/install-stock-order-bot-systemd.sh
```

Для production предпочтителен защищённый webhook `POST /api/telegram/stock-orders`: он обрабатывается основным Next.js-процессом под PM2 и не конфликтует с внешними polling-клиентами. `climat-simf-stock-order-bot.service` остаётся резервным long-polling вариантом и не должен работать одновременно с webhook. Уникальная метка в комментарии заказа делает повторное нажатие идемпотентным: второй заказ не создаётся.

Если Telegram не может установить входящее соединение с VPS, монитор формирует подписанную ссылку на `/stock-order/<sku>`. Она открывает мобильную форму количества во встроенном браузере Telegram. Подпись HMAC и срок действия не позволяют изменить SKU или использовать старую ссылку; nonce в ссылке защищает от двойного заказа.

## Мобильный B2B-ассистент

Отдельный Telegram-бот ищет товары по общей локальной базе сайта, показывает менеджеру закупочную цену и остаток, открывает существующую форму заказа и создаёт клиентские карточки с выбранной наценкой. Клиентская карточка не содержит поставщика, закупочную цену и внутренний SKU. Для отправки карточки прямо в выбранный чат включите inline mode нового бота через `@BotFather`.

```bash
npm run bot:b2b-assistant
sudo bash scripts/install-b2b-assistant-systemd.sh
```

Полная конфигурация и схема первого среза описаны в [`docs/B2B_TELEGRAM_ASSISTANT.md`](docs/B2B_TELEGRAM_ASSISTANT.md).

## Переменные окружения

Реальные значения хранятся только в `.env` на сервере. Не коммитить логины, пароли, Telegram token и I-T-P credentials.

На первом этапе `ITP_ORDER_CREATE_ENABLED=false`. Заказ сохраняется локально и уходит менеджеру в Telegram.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
