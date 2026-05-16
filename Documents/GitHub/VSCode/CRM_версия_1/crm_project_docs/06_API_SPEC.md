# API CRM

## 1. Общие принципы

- Base URL: `/api`
- Формат данных: JSON
- Авторизация: Bearer JWT
- Документация: Swagger/OpenAPI
- Все ошибки возвращаются в едином формате.

## 2. Формат ошибки

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Некорректные данные",
    "details": []
  }
}
```

## 3. Auth API

### POST /auth/login

Вход в систему.

Request:

```json
{
  "email": "manager@example.com",
  "password": "password"
}
```

Response:

```json
{
  "accessToken": "jwt",
  "refreshToken": "jwt",
  "user": {
    "id": "uuid",
    "fullName": "Иван Иванов",
    "role": "manager"
  }
}
```

### POST /auth/logout

Фиксация выхода и завершение рабочей сессии.

### POST /auth/refresh

Обновление токена.

## 4. Users API

- GET /users
- GET /users/:id
- POST /users
- PATCH /users/:id
- DELETE /users/:id
- PATCH /users/:id/block
- PATCH /users/:id/unblock

## 5. Clients API

- GET /clients
- GET /clients/:id
- POST /clients
- PATCH /clients/:id
- DELETE /clients/:id
- GET /clients/:id/deals
- GET /clients/:id/tasks
- GET /clients/:id/offers
- GET /clients/:id/messages

## 6. Leads API

- GET /leads
- GET /leads/:id
- POST /leads
- PATCH /leads/:id
- POST /leads/:id/assign
- POST /leads/:id/convert-to-deal
- POST /leads/:id/close

## 7. Deals API

- GET /deals
- GET /deals/:id
- POST /deals
- PATCH /deals/:id
- POST /deals/:id/change-stage
- POST /deals/:id/close-won
- POST /deals/:id/close-lost
- GET /deals/:id/tasks
- GET /deals/:id/offers
- GET /deals/:id/messages

## 8. Tasks API

- GET /tasks
- GET /tasks/:id
- POST /tasks
- PATCH /tasks/:id
- POST /tasks/:id/start
- POST /tasks/:id/complete
- POST /tasks/:id/cancel
- POST /tasks/:id/comment

## 9. Commercial Offers API

- GET /offers
- GET /offers/:id
- POST /offers
- PATCH /offers/:id
- POST /offers/:id/generate-pdf
- POST /offers/:id/send-email
- POST /offers/:id/send-telegram
- POST /offers/:id/approve
- POST /offers/:id/reject

## 10. Tenders API

- GET /tenders
- GET /tenders/:id
- POST /tenders
- PATCH /tenders/:id
- POST /tenders/:id/change-status
- POST /tenders/:id/add-document
- GET /tenders/:id/tasks

## 11. Work Sessions API

- GET /work-sessions
- GET /work-sessions/my
- POST /work-sessions/start
- POST /work-sessions/finish
- GET /work-sessions/report

Примечание: старт сессии может происходить автоматически при login.

## 12. Notifications API

- GET /notifications
- POST /notifications/:id/read
- POST /notifications/read-all

## 13. Site Webhook API

### POST /webhooks/site-leads

Headers:

- X-Site-Token

Request:

```json
{
  "site": "splithub.ru",
  "pageUrl": "https://splithub.ru/catalog/item",
  "name": "Иван",
  "phone": "+79780000000",
  "email": "client@example.com",
  "message": "Нужен кондиционер",
  "productInterest": "MDV 09",
  "city": "Симферополь",
  "utm": {
    "source": "yandex",
    "medium": "cpc",
    "campaign": "split"
  }
}
```

Response:

```json
{
  "success": true,
  "leadId": "uuid"
}
```

## 14. Reports API

- GET /reports/dashboard-owner
- GET /reports/dashboard-manager
- GET /reports/tasks
- GET /reports/deals
- GET /reports/offers
- GET /reports/work-time
- GET /reports/leads-sources

