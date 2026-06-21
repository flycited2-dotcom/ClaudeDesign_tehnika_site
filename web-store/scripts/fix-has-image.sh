#!/usr/bin/env bash
# Синхронизирует Product.hasImage с реальным наличием ProductImage. Sync-pipeline
# выставляет hasImage=true по supplier API даже без фактических фото (~16k лжецов),
# и они всплывают первыми как заглушки в листинге. Этот скрипт чинит флаг → сортировка
# hasImage desc ставит товары с реальными фото первыми. Запускается по cron после синков.
set -u
ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
DBURL=$(grep -E '^DATABASE_URL=' "$ROOT_DIR/.env" | head -1 | cut -d= -f2- | tr -d '"' | sed 's/?.*//')
psql "$DBURL" -c "UPDATE \"Product\" p SET \"hasImage\" = EXISTS(SELECT 1 FROM \"ProductImage\" i WHERE i.\"productId\"=p.id AND i.deleted=false) WHERE \"hasImage\" <> EXISTS(SELECT 1 FROM \"ProductImage\" i WHERE i.\"productId\"=p.id AND i.deleted=false);"
