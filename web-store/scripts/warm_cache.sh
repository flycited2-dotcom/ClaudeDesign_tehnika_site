#!/usr/bin/env bash
# Warms Next.js unstable_cache on hot routes so cold-start does not hit users.
# Cron-friendly: silent on success, prints failing rows to stderr.
# Intended cadence: every 4 minutes (unstable_cache revalidate = 300s).
#
# Install on VPS:
#   chmod +x /var/www/climat-simf.ru/scripts/warm_cache.sh
#   ( crontab -l 2>/dev/null; echo "*/4 * * * * /var/www/climat-simf.ru/scripts/warm_cache.sh >> /var/log/climat-simf-warm.log 2>&1" ) | crontab -

set -u

BASE="${WARM_CACHE_BASE:-https://climat-simf.ru}"
TIMEOUT="${WARM_CACHE_TIMEOUT:-150}"

ROUTES=(
  "/"
  "/catalog"
  "/catalog/bytovaya-tehnika-9839"
  "/catalog/dacha-sad-i-ogorod-11038"
  "/catalog/detskie-tovary-11173"
  "/catalog/dosug-i-razvlecheniya-11714"
  "/podborki/holodilniki-no-frost"
  "/podborki/televizory-ot-55-dyuymov"
  "/podborki/noutbuki-16-gb-ram"
  "/podborki/ssd-ot-512-gb"
  "/podborki/sushilnye-mashiny-ot-8-kg"
  "/podborki/kabel-ot-25-mm2"
)

fail=0
for route in "${ROUTES[@]}"; do
  url="${BASE}${route}"
  code=$(curl -sS -o /dev/null -w "%{http_code}" --max-time "$TIMEOUT" "$url" || echo "000")
  if [[ "$code" != "200" ]]; then
    printf '[%s] WARN %s -> %s\n' "$(date -Iseconds)" "$url" "$code" >&2
    fail=$((fail + 1))
  fi
done

exit $fail
