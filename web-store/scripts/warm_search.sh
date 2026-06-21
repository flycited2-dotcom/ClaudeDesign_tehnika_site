#!/usr/bin/env bash
set -u

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
LOCK_FILE="/var/lock/climat-simf-warm-search.lock"
exec 9>"$LOCK_FILE"

if ! flock -n 9; then
  exit 0
fi

exec "$ROOT_DIR/node_modules/.bin/tsx" "$ROOT_DIR/scripts/warm-search.ts"
