#!/usr/bin/env bash
# Warms Next.js unstable_cache for EVERY active category, not just the top-12
# in warm_cache.sh. Pairs with STOREFRONT_CACHE_SECONDS=3600 (1h) so each
# category route is always served from cache.
# Cron-friendly: silent on success, prints failing rows to stderr.
# Intended cadence: every 30 minutes (TTL=3600s → 2× overlap).
#
# Install on VPS:
#   chmod +x /var/www/climat-simf.ru/scripts/warm_all.sh
#   ( crontab -l 2>/dev/null; echo "*/30 * * * * /var/www/climat-simf.ru/scripts/warm_all.sh >> /var/log/climat-simf-warm-all.log 2>&1" ) | crontab -

set -u

BASE="${WARM_CACHE_BASE:-https://climat-simf.ru}"
TIMEOUT="${WARM_CACHE_TIMEOUT:-150}"

# Fetch flat slug list from API.
slugs_json="$(curl -s --max-time 30 "${BASE}/api/catalog/categories/flat")"
if [ -z "${slugs_json}" ]; then
  echo "[$(date -Is)] FAIL fetch slugs: empty response" >&2
  exit 1
fi

# Parse with python (always on VPS).
slugs="$(printf '%s' "${slugs_json}" | python3 -c "
import sys, json
try:
    d = json.load(sys.stdin)
    for s in d.get('slugs', []):
        print(s)
except Exception as e:
    sys.stderr.write(f'parse error: {e}\n')
    sys.exit(1)
")"

if [ -z "${slugs}" ]; then
  echo "[$(date -Is)] FAIL: parsed slug list is empty" >&2
  exit 1
fi

count="$(printf '%s\n' "${slugs}" | grep -cv '^$')"

# Parallelize: 8 concurrent curls. Each curl logs FAIL lines to stderr only
# on non-200. Final exit code reflects whether any line failed.
PARALLEL="${WARM_CACHE_PARALLEL:-8}"
failures="$(
  printf '%s\n' "${slugs}" \
    | grep -v '^$' \
    | xargs -P "${PARALLEL}" -I {} bash -c '
        url="'"${BASE}"'/catalog/{}"
        http_code="$(curl -s -o /dev/null --max-time '"${TIMEOUT}"' -w "%{http_code}" "${url}")"
        if [ "${http_code}" != "200" ]; then
          echo "[$(date -Is)] FAIL ${http_code} ${url}" >&2
          echo 1
        fi
      ' \
    | wc -l
)"
fail="${failures:-0}"

# Also keep base catalog route warm.
http_code="$(curl -s -o /dev/null --max-time "${TIMEOUT}" -w '%{http_code}' "${BASE}/catalog")"
if [ "${http_code}" != "200" ]; then
  echo "[$(date -Is)] FAIL ${http_code} ${BASE}/catalog" >&2
  fail=$((fail + 1))
fi

if [ "${fail}" -gt 0 ]; then
  echo "[$(date -Is)] warm_all: ${fail} failures out of ${count} categories" >&2
  exit 1
fi
