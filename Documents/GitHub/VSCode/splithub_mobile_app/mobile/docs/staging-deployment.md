# SplitHub Mobile Staging Deployment

Use a separate HTTPS staging host before deploying the mobile backend to
production.

## Backend

Deploy branch `codex/splithub-mobile-backend` from the SplitHub website
repository to the staging webroot.

Copy `config.example.php` to a path outside the public webroot and fill in the
runtime values there. Set `SPLITHUB_CONFIG_PATH` for PHP to that absolute path.
Do not commit the real config file.

Before deployment:

1. Rotate the Telegram bot token through BotFather.
2. Set a random `CRON_SECRET`.
3. Confirm that `products.json` is deployed next to `products.js`.
4. Keep the production site unchanged until staging smoke tests pass.

Configure a scheduled receipts request:

```text
GET https://staging.splithub.ru/api/push_receipts.php?secret=<CRON_SECRET>
```

## Mobile App

Create an uncommitted `mobile/.env.local` from `.env.example`:

```text
EXPO_PUBLIC_API_URL=https://staging.splithub.ru/api/mobile.php
```

The committed client defaults to the production API only when no local
environment override exists.

## Verification

Run the backend checks before staging deployment:

```powershell
php tests/php/run.php
python -m unittest discover -s tests -p '*_test.py' -v
powershell -ExecutionPolicy Bypass -File tests/php/mobile_api_smoke.ps1
powershell -ExecutionPolicy Bypass -File tests/php/admin_push_smoke.ps1
```

After deployment, repeat the mobile flow on physical Android and iPhone
devices using the staging API.

Run the read-only remote readiness check before installing a development
client:

```powershell
powershell -ExecutionPolicy Bypass -File tests/php/staging_readiness_smoke.ps1 `
  -BaseUrl https://staging.splithub.ru
```
