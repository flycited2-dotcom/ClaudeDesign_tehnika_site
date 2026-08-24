#!/usr/bin/env bash
set -euo pipefail

if [[ "${EUID}" -ne 0 ]]; then
  echo "Run this installer as root." >&2
  exit 1
fi

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
SERVICE_NAME="climat-simf-stock-monitor"

install -d -m 0755 /var/log/climat-simf.ru
install -m 0644 \
  "$ROOT_DIR/deploy/${SERVICE_NAME}.service" \
  "/etc/systemd/system/${SERVICE_NAME}.service"
install -m 0644 \
  "$ROOT_DIR/deploy/${SERVICE_NAME}.timer" \
  "/etc/systemd/system/${SERVICE_NAME}.timer"

# The systemd timer replaces the old cron entry, avoiding duplicate API calls.
TEMP_CRON="$(mktemp)"
crontab -l 2>/dev/null | grep -v 'scripts/monitor-stock.sh' > "$TEMP_CRON" || true
crontab "$TEMP_CRON"
rm -f "$TEMP_CRON"

systemctl daemon-reload
systemctl enable --now "${SERVICE_NAME}.timer"
systemctl start "${SERVICE_NAME}.service"

systemctl --no-pager --full status "${SERVICE_NAME}.timer"
systemctl --no-pager --full status "${SERVICE_NAME}.service" || true
