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
