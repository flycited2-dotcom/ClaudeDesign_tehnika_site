# Структура базы данных CRM

## 1. Общие правила

Во всех основных таблицах должны быть поля:

- id UUID primary key;
- created_at timestamp;
- updated_at timestamp;
- deleted_at timestamp nullable;
- created_by UUID nullable;
- updated_by UUID nullable.

Удаление важных данных — мягкое через deleted_at.

## 2. users

Пользователи CRM.

Поля:

- id
- full_name
- email
- phone
- password_hash
- role_id
- status
- avatar_url
- last_login_at
- last_logout_at
- is_active
- created_at
- updated_at
- deleted_at

## 3. roles

- id
- name
- code
- description

## 4. permissions

- id
- code
- name
- description

## 5. role_permissions

- id
- role_id
- permission_id

## 6. clients

- id
- type
- status
- name
- inn
- kpp
- ogrn
- legal_address
- actual_address
- city
- source
- responsible_user_id
- comment
- created_at
- updated_at
- deleted_at

## 7. client_contacts

- id
- client_id
- contact_type: phone/email/telegram/max/whatsapp/other
- value
- is_primary
- comment

## 8. leads

- id
- source
- site
- page_url
- utm_source
- utm_medium
- utm_campaign
- utm_content
- utm_term
- name
- phone
- email
- telegram
- message
- product_interest
- city
- ip_address
- status
- responsible_user_id
- client_id nullable
- deal_id nullable
- received_at
- first_response_at
- closed_at
- close_reason

## 9. deals

- id
- deal_number
- client_id
- lead_id nullable
- direction
- pipeline
- stage
- status
- responsible_user_id
- amount
- margin
- source
- expected_close_date
- closed_at
- close_reason
- comment

## 10. deal_products

- id
- deal_id
- product_name
- sku
- quantity
- price
- cost_price nullable
- discount
- vat_rate
- total
- comment

## 11. tasks

- id
- title
- description
- creator_id
- assignee_id
- status
- priority
- deadline_at
- completed_at
- client_id nullable
- deal_id nullable
- tender_id nullable
- parent_task_id nullable

## 12. comments

- id
- entity_type: client/lead/deal/task/tender/offer
- entity_id
- user_id
- text
- created_at

## 13. files

- id
- entity_type
- entity_id
- file_name
- original_name
- mime_type
- size
- storage_path
- uploaded_by
- created_at

## 14. commercial_offers

- id
- offer_number
- client_id
- deal_id
- template_id
- sender_company_id
- status
- total_amount
- vat_amount
- total_with_vat
- valid_until
- payment_terms
- delivery_terms
- pdf_file_id
- created_by
- sent_at
- sent_channel

## 15. commercial_offer_items

- id
- offer_id
- position_number
- product_name
- sku
- quantity
- unit
- price
- discount
- vat_rate
- total

## 16. offer_templates

- id
- name
- code
- html_template
- is_active

## 17. sender_companies

- id
- name
- inn
- kpp
- ogrn
- address
- bank_details
- email
- phone
- logo_file_id
- stamp_file_id

## 18. messages

- id
- channel: telegram/email/internal/max/whatsapp
- direction: incoming/outgoing
- client_id nullable
- deal_id nullable
- lead_id nullable
- user_id nullable
- external_id nullable
- subject nullable
- body
- sent_at
- received_at
- status

## 19. notifications

- id
- user_id
- type
- title
- body
- entity_type
- entity_id
- channel
- status
- read_at
- created_at

## 20. work_sessions

- id
- user_id
- login_at
- logout_at
- ip_address
- user_agent
- device
- total_minutes
- status

## 21. tenders

- id
- tender_number
- platform
- customer_name
- nmck
- publish_date
- submission_deadline
- auction_date
- responsible_user_id
- status
- requirements
- result
- margin
- comment

## 22. tender_documents

- id
- tender_id
- file_id
- document_type
- comment

## 23. integrations

- id
- type: site/telegram/email/onec/max
- name
- status
- settings_json
- last_sync_at

## 24. integration_logs

- id
- integration_id
- direction
- operation
- status
- request_json
- response_json
- error_message
- created_at

## 25. activity_logs

- id
- user_id
- action
- entity_type
- entity_id
- old_value_json
- new_value_json
- ip_address
- user_agent
- created_at

## 26. settings

- id
- key
- value_json
- description

