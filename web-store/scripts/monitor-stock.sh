#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
LOCK_FILE="${STOCK_MONITOR_LOCK_FILE:-/var/lock/climat-simf-stock-monitor.lock}"
MAX_RUNTIME_SECONDS="${STOCK_MONITOR_MAX_RUNTIME_SECONDS:-240}"
KILL_AFTER_SECONDS="${STOCK_MONITOR_KILL_AFTER_SECONDS:-30}"
exec 9>"$LOCK_FILE"

if ! flock -n 9; then
  exit 0
fi

cd "$ROOT_DIR"

# A supplier API, database connection or Node process can occasionally hang.
# GNU timeout terminates the run after four minutes by default and force-kills
# it after a short grace period. systemd sees the non-zero exit and restarts
# the service; the flock descriptor is released when this process exits.
if command -v timeout >/dev/null 2>&1; then
  exec timeout \
    --signal=TERM \
    --kill-after="${KILL_AFTER_SECONDS}s" \
    "${MAX_RUNTIME_SECONDS}s" \
    "$ROOT_DIR/node_modules/.bin/tsx" \
    "$ROOT_DIR/scripts/monitor-stock.ts"
fi

exec "$ROOT_DIR/node_modules/.bin/tsx" "$ROOT_DIR/scripts/monitor-stock.ts"
