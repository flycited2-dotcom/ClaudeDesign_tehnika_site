# Техническая архитектура CRM

## 1. Рекомендуемый стек

### Frontend

- Next.js
- React
- TypeScript
- Tailwind CSS
- Zustand или Redux Toolkit для клиентского состояния
- React Hook Form для форм

### Backend

- NestJS
- TypeScript
- REST API
- WebSocket Gateway
- Swagger/OpenAPI

### Database

- PostgreSQL
- Prisma ORM или TypeORM

### Очереди и фоновые задачи

- Redis
- BullMQ

### Хранилище файлов

- S3-совместимое хранилище

### Авторизация

- JWT access token
- refresh token
- RBAC
- audit log

### Уведомления

- WebSocket внутри CRM
- Telegram Bot API
- SMTP для email

## 2. Общая схема

Frontend обращается к Backend API. Backend работает с PostgreSQL, Redis, S3, Telegram, SMTP, сайтами и будущим модулем 1С.

Логика интеграций должна быть вынесена в отдельные сервисы, чтобы подключение 1С, Telegram, MAX, email и сайтов не ломало ядро CRM.

## 3. Модульная структура backend

Рекомендуемые NestJS-модули:

- AuthModule
- UsersModule
- RolesModule
- ClientsModule
- LeadsModule
- DealsModule
- TasksModule
- CommercialOffersModule
- NotificationsModule
- MessagesModule
- FilesModule
- WorkSessionsModule
- TendersModule
- ReportsModule
- IntegrationsModule
- TelegramModule
- EmailModule
- SitesWebhookModule
- OneCIntegrationModule
- AuditLogModule
- SettingsModule

## 4. Основные архитектурные правила

1. Бизнес-логика не должна находиться во frontend.
2. Все критичные действия должны фиксироваться в audit log.
3. Удаление важных сущностей должно быть мягким: `deleted_at`, а не физическое удаление.
4. Все интеграции должны иметь retry-механизм.
5. Все внешние ошибки должны логироваться.
6. Уведомления должны проходить через единый NotificationService.
7. Права доступа должны проверяться на backend.
8. Все API должны иметь валидацию DTO.
9. Все файлы должны храниться не в базе, а в S3.
10. Все даты хранить в UTC, отображать по локальному часовому поясу.

## 5. Архитектура уведомлений

События CRM формируют внутренние события:

- lead.created
- task.created
- task.overdue
- deal.stage_changed
- offer.created
- offer.sent
- tender.deadline_near
- user.login
- user.logout

NotificationService решает, кому и куда отправлять уведомление:

- внутри CRM;
- Telegram;
- email.

## 6. Архитектура интеграций

Все интеграции строятся через адаптеры.

Примеры:

- TelegramAdapter
- EmailAdapter
- MaxAdapter
- OneCAdapter
- SiteWebhookAdapter

Это позволит добавлять новые каналы без переписывания ядра.

## 7. Интеграция с сайтами

Сайты отправляют POST-запрос в CRM:

`POST /api/webhooks/site-leads`

CRM:

1. валидирует токен сайта;
2. проверяет данные;
3. ищет дубль по телефону/email;
4. создает лид;
5. назначает ответственного;
6. создает задачу обработки;
7. отправляет уведомление.

## 8. Интеграция с 1С

Реализуется на втором этапе.

Рекомендуемая схема:

- CRM хранит свои сделки и задачи;
- 1С хранит товары, остатки, резервы, счета, оплаты;
- обмен идет через HTTP API или промежуточный gateway;
- каждая операция имеет статус синхронизации.

Статусы синхронизации:

- pending;
- sent;
- success;
- error;
- retrying;
- cancelled.

## 9. Безопасность

Требования:

- HTTPS;
- хеширование паролей bcrypt/argon2;
- refresh token rotation;
- ограничение попыток входа;
- журнал действий;
- разграничение прав;
- защита webhook токенами;
- CORS whitelist;
- резервное копирование БД;
- контроль доступа к файлам.

## 10. Масштабирование

Система должна нормально работать на 5–6 пользователях на старте и иметь запас для расширения.

Минимальная инфраструктура:

- 2 CPU;
- 4 GB RAM;
- 50 GB SSD;
- PostgreSQL;
- Redis;
- Node.js.

Для роста можно вынести:

- PostgreSQL на отдельный сервер;
- Redis отдельно;
- файлы в S3;
- backend в Docker.

