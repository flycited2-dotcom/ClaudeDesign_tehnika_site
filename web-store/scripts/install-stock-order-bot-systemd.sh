#!/usr/bin/env bash
set -euo pipefail

if [[ "${EUID}" -ne 0 ]]; then
  echo "Run this installer as root." >&2
  exit 1
fi

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
SERVICE_NAME="climat-simf-stock-order-bot"

install -d -m 0755 /var/log/climat-simf.ru
install -m 0644 \
  "$ROOT_DIR/deploy/${SERVICE_NAME}.service" \
  "/etc/systemd/system/${SERVICE_NAME}.service"
chmod 0755 "$ROOT_DIR/scripts/run-stock-order-bot.sh"

systemctl daemon-reload
systemctl enable --now "${SERVICE_NAME}.service"
systemctl --no-pager --full status "${SERVICE_NAME}.service"
