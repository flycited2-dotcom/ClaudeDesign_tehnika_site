# SplitHub Mobile Backend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a versioned mobile API, authoritative catalog validation, bearer-token authentication, push delivery, and admin notification controls to the existing SplitHub website.

**Architecture:** Work in `C:\Users\user\Documents\GitHub\splithub`. Generate `products.json` beside the existing `products.js`, read the JSON snapshot through focused PHP helpers, and expose mobile operations through `api/mobile.php`. Preserve existing website behavior while routing status changes through a shared push helper.

**Tech Stack:** PHP 8, SQLite, Python 3, Expo Push Service HTTPS API, existing HTML admin panel.

---

## File Map

### Create

- `config.example.php`: placeholder-only runtime configuration template.
- `api/lib/app_config.php`: secure runtime configuration loader.
- `products.json`: generated server-readable catalog snapshot.
- `tools/products_js_to_json.py`: one-time migration for the currently published JavaScript catalog.
- `api/mobile.php`: versioned JSON router for the mobile application.
- `api/push_receipts.php`: cron endpoint for Expo receipt processing.
- `api/lib/catalog.php`: catalog loading and authoritative cart validation.
- `api/lib/mobile_auth.php`: bearer-token issuance and authorization.
- `api/lib/order_service.php`: registered-customer order creation.
- `api/lib/manager_notify.php`: Telegram notification for a newly created mobile order.
- `api/lib/push.php`: Expo ticket creation, receipt recording, and status pushes.
- `tests/php/bootstrap.php`: isolated temporary database and catalog fixture.
- `tests/php/catalog_test.php`: generated catalog and cart validation checks.
- `tests/php/mobile_auth_test.php`: bearer-token checks.
- `tests/php/order_service_test.php`: authoritative-order checks.
- `tests/php/push_test.php`: push payload and invalid-token checks.
- `tests/php/run.php`: single backend test entrypoint.

### Modify

- `.gitignore`: keep the real runtime configuration out of Git.
- `converter/convert.py`: emit and package `products.json`.
- `converter/deploy.py`: upload both generated catalog artifacts.
- `db/init.php`: add mobile sessions, device tokens, campaigns, and deliveries.
- `send.php`: reject changed or unavailable browser cart items before sending.
- `api/admin.php`: send promotion and personal-message pushes and expose logs.
- `api/tg_poll.php`: send a status push after a Telegram-driven status update.
- `admin.html`: add notification compose and delivery-log UI.

## Task 0A: Rotate And Externalize Existing Runtime Secrets

**Files:**
- Create: `config.example.php`
- Create: `api/lib/app_config.php`
- Modify: `.gitignore`
- Modify: `send.php`
- Modify: `api/auth.php`
- Modify: `api/admin.php`
- Modify: `api/price-send.php`
- Modify: `api/tg_poll.php`
- Modify: `api/reports.php`
- Remove from Git index: `config.php`

- [ ] **Step 1: Rotate exposed credentials before any deployment**

The existing repository has a tracked `config.php` containing an active-looking
Telegram bot credential. Treat it as compromised: rotate the bot token through
BotFather, generate a new `CRON_SECRET`, and store the replacements only in a
server-side configuration file outside the public webroot. Do not print either
secret in terminal logs or commit history.

- [ ] **Step 2: Add a placeholder-only template and secure loader**

Create `config.example.php` with placeholder values only. Create
`api/lib/app_config.php`:

```php
<?php
function appConfigPath(): string {
    $path = getenv('SPLITHUB_CONFIG_PATH') ?: dirname(__DIR__, 3) . '/config.php';
    if (!is_file($path)) throw new RuntimeException('SPLITHUB_CONFIG_REQUIRED');
    return $path;
}
require_once appConfigPath();
```

- [ ] **Step 3: Route runtime configuration through the loader**

Replace direct root-level `config.php` reads in `send.php`, `api/auth.php`,
`api/admin.php`, `api/price-send.php`, `api/tg_poll.php`, and `api/reports.php`
with `api/lib/app_config.php`. In admin settings reads and writes, use
`appConfigPath()` so changes target the external file. Audit the legacy
root-level `api_admin.php`; update it only if deployment still routes to it,
otherwise remove it from the deployed artifact.

- [ ] **Step 4: Untrack the real configuration**

Run:

```powershell
git rm --cached config.php
git add .gitignore config.example.php api/lib/app_config.php send.php api
git commit -m "security: externalize runtime credentials"
```

Expected: `config.php` remains available only as an ignored local or server
file. Rotating the credential invalidates the exposed value; coordinate any
history rewrite separately if the repository has been published.

## Task 0B: Backend Runtime Prerequisite

- [ ] **Step 1: Verify PHP CLI availability**

Run:

```powershell
php --version
php -m | Select-String -Pattern 'pdo_sqlite|curl'
```

Expected: PHP 8.x and both `pdo_sqlite` and `curl`. On the current workstation
this fails because PHP CLI is not installed; install PHP CLI or use a staging
host before continuing with local tests.

## Task 1: Generate A Structured Catalog Snapshot

**Files:**
- Modify: `converter/convert.py`
- Modify: `converter/deploy.py`
- Create: `products.json`
- Create: `tools/products_js_to_json.py`
- Create: `tests/php/bootstrap.php`
- Test: `tests/php/catalog_test.php`

- [ ] **Step 1: Create the shared test bootstrap**

Create `tests/php/bootstrap.php`:

```php
<?php
function projectPath(string $path): string { return dirname(__DIR__, 2) . '/' . $path; }
function assertTrue(bool $value, string $message): void {
    if (!$value) throw new RuntimeException('FAIL: ' . $message);
    echo "PASS: $message\n";
}
function assertSame(mixed $expected, mixed $actual, string $message): void {
    assertTrue($expected === $actual, $message);
}
$tmp = sys_get_temp_dir() . '/splithub_mobile_tests.sqlite';
@unlink($tmp);
putenv('SPLITHUB_DB_PATH=' . $tmp);
putenv('SPLITHUB_PRODUCTS_PATH=' . projectPath('products.json'));
require_once projectPath('db/init.php');
```

- [ ] **Step 2: Add a failing converter assertion**

Create the first part of `tests/php/catalog_test.php`:

```php
<?php
require_once __DIR__ . '/bootstrap.php';

$catalog = json_decode(file_get_contents(projectPath('products.json')), true);
assertTrue(is_array($catalog), 'products.json is valid JSON');
assertTrue(count($catalog) > 0, 'products.json contains products');
assertTrue(isset($catalog[0]['id'], $catalog[0]['price'], $catalog[0]['stock']), 'catalog fields exist');
```

- [ ] **Step 3: Run the check and verify it fails**

Run:

```powershell
php tests/php/catalog_test.php
```

Expected: FAIL because `products.json` does not exist.

- [ ] **Step 4: Add JSON generation beside JavaScript generation**

In `converter/convert.py`, add:

```python
    def clean_products(self):
        return [
            {k: v for k, v in product.items() if k != "_sortOrder"}
            for product in self.products
        ]

    def generate_json(self):
        return json.dumps(self.clean_products(), ensure_ascii=False, indent=2) + "\n"

    def generate_js(self):
        lines = ["var PRODUCTS = ["]
        for i, product in enumerate(self.clean_products()):
            comma = "," if i < len(self.products) - 1 else ""
            lines.append("  " + json.dumps(product, ensure_ascii=False) + comma)
        lines.append("];")
        return "\n".join(lines) + "\n"
```

In `Converter.run()`, write and copy the JSON artifact with the JavaScript
artifact:

```python
        (self.out_dir / "products.js").write_text(self.generate_js(), encoding="utf-8")
        (self.out_dir / "products.json").write_text(self.generate_json(), encoding="utf-8")
        shutil.copy2(self.out_dir / "products.js", PROJECT_DIR / "products.js")
        shutil.copy2(self.out_dir / "products.json", PROJECT_DIR / "products.json")
```

In `build_zip()`, add `products.json` from `out/` and skip the root duplicate:

```python
            products_json = self.out_dir / "products.json"
            if products_json.exists():
                zf.write(products_json, "products.json")

            # inside the PROJECT_DIR.rglob loop
            if rel in {"products.js", "products.json"}:
                continue
```

Update `converter/deploy.py` to upload both files:

```python
for filename in ("products.js", "products.json"):
    local = BASE_DIR / "out" / filename
    remote = str(Path(cfg["remote_path"]).with_name(filename))
    if not local.exists():
        raise SystemExit(f"[ERROR] {local} is missing")
    sftp.put(str(local), remote)
```

- [ ] **Step 5: Add a one-time migration for the current catalog**

Create `tools/products_js_to_json.py`:

```python
#!/usr/bin/env python3
import json
from pathlib import Path

root = Path(__file__).resolve().parents[1]
text = (root / "products.js").read_text(encoding="utf-8").strip()
prefix = "var PRODUCTS = "
if not text.startswith(prefix) or not text.endswith(";"):
    raise SystemExit("products.js wrapper is not recognized")
products = json.loads(text[len(prefix):-1])
(root / "products.json").write_text(
    json.dumps(products, ensure_ascii=False, indent=2) + "\n",
    encoding="utf-8",
)
print(f"products.json: {len(products)} products")
```

- [ ] **Step 6: Generate the initial artifact and run the catalog check**

Run:

```powershell
python tools\products_js_to_json.py
php tests/php/catalog_test.php
```

Expected: migration emits `products.json`; catalog test prints PASS lines.

- [ ] **Step 7: Commit catalog snapshot support**

```powershell
git add converter/convert.py converter/deploy.py products.json tools/products_js_to_json.py tests/php
git commit -m "feat: publish structured catalog snapshot"
```

## Task 2: Add Catalog Validation Helpers

**Files:**
- Create: `api/lib/catalog.php`
- Modify: `tests/php/catalog_test.php`

- [ ] **Step 1: Add failing validation cases**

Append to `tests/php/catalog_test.php`:

```php
require_once projectPath('api/lib/catalog.php');

$fixture = [
    ['id' => '1001', 'name' => 'Old name', 'price' => 1, 'qty' => 2],
];
$result = validateCatalogItems($fixture);
assertSame(false, $result['ok'], 'changed price requires confirmation');
assertSame('CATALOG_CHANGED', $result['code'], 'changed price code');

$result = validateCatalogItems([['id' => 'missing', 'price' => 1, 'qty' => 1]]);
assertSame('PRODUCT_UNAVAILABLE', $result['code'], 'unknown product rejected');

assertSame('EMPTY_CART', validateCatalogItems([])['code'], 'empty cart rejected');
assertSame('INVALID_QUANTITY', validateCatalogItems([['id' => '1001', 'price' => 24900, 'qty' => 0]])['code'], 'invalid quantity rejected');
```

- [ ] **Step 2: Run the test and verify it fails**

Run:

```powershell
php tests/php/catalog_test.php
```

Expected: FAIL because `api/lib/catalog.php` does not exist.

- [ ] **Step 3: Implement catalog loading and validation**

Create `api/lib/catalog.php`:

```php
<?php
function catalogPath(): string {
    return getenv('SPLITHUB_PRODUCTS_PATH') ?: dirname(__DIR__, 2) . '/products.json';
}

function loadCatalog(): array {
    $raw = @file_get_contents(catalogPath());
    $items = $raw === false ? null : json_decode($raw, true);
    if (!is_array($items)) throw new RuntimeException('Catalog snapshot is unavailable');
    return $items;
}

function catalogById(): array {
    $map = [];
    foreach (loadCatalog() as $item) $map[(string)$item['id']] = $item;
    return $map;
}

function validateCatalogItems(array $requested): array {
    if (!$requested) return ['ok' => false, 'code' => 'EMPTY_CART'];
    $catalog = catalogById();
    $items = [];
    $changes = [];
    foreach ($requested as $row) {
        $id = (string)($row['id'] ?? '');
        $qty = (int)($row['qty'] ?? 0);
        if ($qty < 1 || $qty > 999) {
            return ['ok' => false, 'code' => 'INVALID_QUANTITY', 'product_id' => $id];
        }
        $product = $catalog[$id] ?? null;
        if (!$product || ($product['stock'] ?? '') === 'out') {
            return ['ok' => false, 'code' => 'PRODUCT_UNAVAILABLE', 'product_id' => $id];
        }
        $clientPrice = (int)($row['price'] ?? 0);
        $serverPrice = (int)$product['price'];
        if ($clientPrice !== $serverPrice) {
            $changes[] = ['id' => $id, 'old_price' => $clientPrice, 'new_price' => $serverPrice];
        }
        $items[] = [
            'id' => $id,
            'name' => (string)$product['model'],
            'brand' => (string)$product['brand'],
            'price' => $serverPrice,
            'qty' => $qty,
            'group' => (string)$product['group'],
        ];
    }
    if ($changes) return ['ok' => false, 'code' => 'CATALOG_CHANGED', 'changes' => $changes, 'items' => $items];
    return ['ok' => true, 'items' => $items];
}
```

- [ ] **Step 4: Apply validation to website checkout**

In `send.php`, require the helper after `config.php` and validate before total
calculation:

```php
require_once __DIR__ . '/api/lib/catalog.php';

$validation = validateCatalogItems($items);
if (!$validation['ok']) {
    http_response_code(409);
    echo json_encode($validation, JSON_UNESCAPED_UNICODE);
    exit;
}
$items = $validation['items'];
```

- [ ] **Step 5: Run tests and syntax checks**

Run:

```powershell
php tests/php/catalog_test.php
php -l api/lib/catalog.php
php -l send.php
```

Expected: PASS and no syntax errors.

- [ ] **Step 6: Commit authoritative catalog validation**

```powershell
git add api/lib/catalog.php send.php tests/php/catalog_test.php
git commit -m "feat: validate checkout against catalog snapshot"
```

## Task 3: Add Mobile Sessions And Bearer Authentication

**Files:**
- Modify: `db/init.php`
- Create: `api/lib/mobile_auth.php`
- Create: `tests/php/mobile_auth_test.php`

- [ ] **Step 1: Add failing token lifecycle test**

Create `tests/php/mobile_auth_test.php`:

```php
<?php
require_once __DIR__ . '/bootstrap.php';
require_once projectPath('api/lib/mobile_auth.php');

$db = getDB();
$db->prepare('INSERT INTO users(name,phone,password_hash) VALUES(?,?,?)')
   ->execute(['Mobile User', '79780000001', password_hash('pass123', PASSWORD_BCRYPT)]);

$login = issueMobileToken('79780000001', 'pass123');
assertTrue(isset($login['token']), 'login returns bearer token');
assertSame(1, requireMobileUser($login['token']), 'token authorizes user');
revokeMobileToken($login['token']);
assertSame(null, findMobileUser($login['token']), 'logout revokes token');
```

- [ ] **Step 2: Run the test and verify it fails**

Run:

```powershell
php tests/php/mobile_auth_test.php
```

Expected: FAIL because the mobile tables and helper do not exist.

- [ ] **Step 3: Add incremental database tables**

In `db/init.php`, add the following `CREATE TABLE IF NOT EXISTS` statements in
the incremental migration section:

```php
$db->exec("CREATE TABLE IF NOT EXISTS mobile_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    token_hash TEXT NOT NULL UNIQUE,
    expires_at TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
)");
$db->exec("CREATE TABLE IF NOT EXISTS mobile_devices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    expo_token TEXT NOT NULL UNIQUE,
    platform TEXT NOT NULL,
    order_status_enabled INTEGER NOT NULL DEFAULT 1,
    promotions_enabled INTEGER NOT NULL DEFAULT 1,
    manager_messages_enabled INTEGER NOT NULL DEFAULT 1,
    active INTEGER NOT NULL DEFAULT 1,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
)");
```

Allow tests to use a temporary database:

```php
$dbPath = getenv('SPLITHUB_DB_PATH') ?: __DIR__ . '/splithub.sqlite';
```

- [ ] **Step 4: Implement bearer-token helper**

Create `api/lib/mobile_auth.php`:

```php
<?php
require_once __DIR__ . '/../../db/init.php';

function bearerToken(): string {
    $header = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
    return preg_match('/^Bearer\s+(.+)$/i', $header, $m) ? trim($m[1]) : '';
}

function issueMobileToken(string $phone, string $password): array {
    $db = getDB();
    $normalized = normalizePhone($phone) ?: trim($phone);
    $stmt = $db->prepare('SELECT id,name,phone,telegram,role,password_hash FROM users WHERE phone=?');
    $stmt->execute([$normalized]);
    $user = $stmt->fetch();
    if (!$user || !password_verify($password, $user['password_hash'])) {
        throw new RuntimeException('INVALID_CREDENTIALS');
    }
    $token = bin2hex(random_bytes(32));
    $hash = hash('sha256', $token);
    $db->prepare("INSERT INTO mobile_sessions(user_id,token_hash,expires_at)
                  VALUES(?,?,datetime('now','+90 days'))")->execute([(int)$user['id'], $hash]);
    unset($user['password_hash']);
    return ['token' => $token, 'user' => $user];
}

function findMobileUser(string $token): ?int {
    if ($token === '') return null;
    $stmt = getDB()->prepare("SELECT user_id FROM mobile_sessions
                              WHERE token_hash=? AND expires_at > datetime('now')");
    $stmt->execute([hash('sha256', $token)]);
    $row = $stmt->fetch();
    return $row ? (int)$row['user_id'] : null;
}

function requireMobileUser(?string $token = null): int {
    $uid = findMobileUser($token ?? bearerToken());
    if (!$uid) throw new RuntimeException('AUTH_REQUIRED');
    return $uid;
}

function revokeMobileToken(string $token): void {
    getDB()->prepare('DELETE FROM mobile_sessions WHERE token_hash=?')
           ->execute([hash('sha256', $token)]);
}
```

- [ ] **Step 5: Run tests and syntax checks**

Run:

```powershell
php tests/php/mobile_auth_test.php
php -l db/init.php
php -l api/lib/mobile_auth.php
```

Expected: PASS and no syntax errors.

- [ ] **Step 6: Commit mobile authentication**

```powershell
git add db/init.php api/lib/mobile_auth.php tests/php/mobile_auth_test.php
git commit -m "feat: add mobile bearer sessions"
```

## Task 4: Add Validated Mobile Orders

**Files:**
- Create: `api/lib/order_service.php`
- Create: `api/lib/manager_notify.php`
- Create: `api/mobile.php`
- Create: `tests/php/order_service_test.php`

- [ ] **Step 1: Add failing registered-order test**

Create `tests/php/order_service_test.php`:

```php
<?php
require_once __DIR__ . '/bootstrap.php';
require_once projectPath('api/lib/order_service.php');

$db = getDB();
$db->prepare('INSERT INTO users(name,phone,password_hash) VALUES(?,?,?)')
   ->execute(['Buyer', '79780000002', password_hash('pass123', PASSWORD_BCRYPT)]);
$uid = (int)$db->lastInsertId();

$created = createRegisteredOrder($uid, [
    ['id' => '1001', 'name' => 'ELYSIUM', 'price' => 24900, 'qty' => 2, 'group' => 'inv'],
], 'mobile test', '@buyer');

assertTrue($created['order_id'] > 0, 'order created');
assertSame(49800, $created['total'], 'server calculates total');
```

- [ ] **Step 2: Run the test and verify it fails**

Run:

```powershell
php tests/php/order_service_test.php
```

Expected: FAIL because `order_service.php` does not exist.

- [ ] **Step 3: Implement registered-order storage**

Create `api/lib/order_service.php`:

```php
<?php
require_once __DIR__ . '/../../db/init.php';

function createRegisteredOrder(int $uid, array $items, string $comment = '', string $clientTg = ''): array {
    if (!$items) throw new RuntimeException('EMPTY_CART');
    $db = getDB();
    $total = array_sum(array_map(fn($item) => (int)$item['price'] * (int)$item['qty'], $items));
    $db->beginTransaction();
    try {
        $db->prepare('INSERT INTO orders(user_id,total,bonus_earned,bonus_spent,status,comment,client_tg)
                      VALUES(?,?,0,0,"new",?,?)')->execute([$uid, $total, $comment, $clientTg]);
        $orderId = (int)$db->lastInsertId();
        $insert = $db->prepare('INSERT INTO order_items(order_id,product_name,price,qty,product_id)
                                VALUES(?,?,?,?,?)');
        foreach ($items as $item) {
            $insert->execute([$orderId, $item['name'], (int)$item['price'], (int)$item['qty'], (string)$item['id']]);
        }
        $db->commit();
        return ['order_id' => $orderId, 'total' => $total];
    } catch (Throwable $e) {
        $db->rollBack();
        throw $e;
    }
}
```

- [ ] **Step 4: Add the manager notification adapter**

Create `api/lib/manager_notify.php`:

```php
<?php
require_once __DIR__ . '/app_config.php';

function notifyManagerAboutMobileOrder(int $orderId, string $name, string $phone, array $items, int $total): void {
    if (!defined('BOT_TOKEN') || !defined('CHAT_ID') || !BOT_TOKEN || !CHAT_ID) return;
    $lines = array_map(fn($item) => sprintf('%s x %d', $item['name'], (int)$item['qty']), $items);
    $text = 'New mobile order SH-' . str_pad((string)$orderId, 5, '0', STR_PAD_LEFT)
        . "\nCustomer: $name\nPhone: $phone\n" . implode("\n", $lines) . "\nTotal: $total RUB";
    try {
        $ch = curl_init('https://api.telegram.org/bot' . BOT_TOKEN . '/sendMessage');
        curl_setopt_array($ch, [
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => json_encode(['chat_id' => CHAT_ID, 'text' => $text], JSON_UNESCAPED_UNICODE),
            CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => 10,
        ]);
        curl_exec($ch);
        curl_close($ch);
    } catch (Throwable $e) {
        error_log('Mobile order manager notification failed: ' . $e->getMessage());
    }
}
```

The Telegram call is secondary: a notification failure must not roll back an
already validated customer order.

- [ ] **Step 5: Create the versioned mobile router**

Create `api/mobile.php` with JSON response helpers and these actions:

```php
<?php
require_once __DIR__ . '/lib/catalog.php';
require_once __DIR__ . '/lib/mobile_auth.php';
require_once __DIR__ . '/lib/order_service.php';
require_once __DIR__ . '/lib/manager_notify.php';

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }

function body(): array { return json_decode(file_get_contents('php://input'), true) ?: []; }
function ok(array $data = []): never { jsonResponse(['ok' => true] + $data); }
function fail(string $code, int $status, array $data = []): never {
    jsonResponse(['ok' => false, 'code' => $code] + $data, $status);
}

try {
    $action = $_GET['action'] ?? '';
    if ($action === 'catalog') {
        $items = loadCatalog();
        ok(['version' => hash_file('sha256', catalogPath()), 'updated_at' => gmdate(DATE_ATOM, filemtime(catalogPath())), 'products' => $items]);
    }
    if ($action === 'login') {
        $data = body();
        ok(issueMobileToken((string)($data['phone'] ?? ''), (string)($data['password'] ?? '')));
    }
    if ($action === 'profile') {
        $uid = requireMobileUser();
        $stmt = getDB()->prepare('SELECT id,name,phone,telegram,role,created_at FROM users WHERE id=?');
        $stmt->execute([$uid]);
        ok(['user' => $stmt->fetch()]);
    }
    if ($action === 'create_order') {
        $uid = requireMobileUser();
        $data = body();
        $validation = validateCatalogItems($data['items'] ?? []);
        if (!$validation['ok']) fail($validation['code'], 409, $validation);
        $created = createRegisteredOrder($uid, $validation['items'], trim($data['comment'] ?? ''), trim($data['client_tg'] ?? ''));
        $profile = getDB()->prepare('SELECT name,phone FROM users WHERE id=?');
        $profile->execute([$uid]);
        $user = $profile->fetch();
        notifyManagerAboutMobileOrder($created['order_id'], $user['name'], $user['phone'], $validation['items'], $created['total']);
        ok($created);
    }
    fail('UNKNOWN_ACTION', 404);
} catch (RuntimeException $e) {
    fail($e->getMessage(), $e->getMessage() === 'AUTH_REQUIRED' ? 401 : 422);
} catch (Throwable $e) {
    error_log('Mobile API error: ' . $e->getMessage());
    fail('SERVER_ERROR', 500);
}
```

Add these actions before the final `UNKNOWN_ACTION` response:

```php
    if ($action === 'register') {
        $data = body();
        $name = trim($data['name'] ?? '');
        $phone = normalizePhone($data['phone'] ?? '');
        $password = (string)($data['password'] ?? '');
        if ($name === '' || $phone === '' || strlen($password) < 4) fail('INVALID_REGISTRATION', 422);
        $db = getDB();
        $exists = $db->prepare('SELECT id FROM users WHERE phone=?');
        $exists->execute([$phone]);
        if ($exists->fetch()) fail('PHONE_ALREADY_REGISTERED', 409);
        $db->prepare('INSERT INTO users(name,phone,telegram,password_hash) VALUES(?,?,?,?)')
           ->execute([$name, $phone, trim($data['telegram'] ?? ''), password_hash($password, PASSWORD_BCRYPT)]);
        ok(issueMobileToken($phone, $password));
    }
    if ($action === 'logout') {
        revokeMobileToken(bearerToken());
        ok();
    }
    if ($action === 'orders') {
        $uid = requireMobileUser();
        $stmt = getDB()->prepare('SELECT id,total,status,comment,created_at FROM orders WHERE user_id=? ORDER BY id DESC');
        $stmt->execute([$uid]);
        ok(['orders' => $stmt->fetchAll()]);
    }
    if ($action === 'order') {
        $uid = requireMobileUser();
        $stmt = getDB()->prepare('SELECT id,total,status,comment,created_at FROM orders WHERE id=? AND user_id=?');
        $stmt->execute([(int)($_GET['id'] ?? 0), $uid]);
        $order = $stmt->fetch();
        if (!$order) fail('ORDER_NOT_FOUND', 404);
        $items = getDB()->prepare('SELECT product_id,product_name,price,qty FROM order_items WHERE order_id=?');
        $items->execute([(int)$order['id']]);
        $order['items'] = $items->fetchAll();
        ok(['order' => $order]);
    }
    if ($action === 'repeat_order') {
        $uid = requireMobileUser();
        $data = body();
        $items = getDB()->prepare('SELECT oi.product_id AS id,oi.qty FROM order_items oi JOIN orders o ON o.id=oi.order_id WHERE o.id=? AND o.user_id=?');
        $items->execute([(int)($data['order_id'] ?? 0), $uid]);
        ok(['items' => $items->fetchAll()]);
    }
    if ($action === 'cancel_order') {
        $uid = requireMobileUser();
        $data = body();
        $reason = trim($data['reason'] ?? '');
        if ($reason === '') fail('CANCEL_REASON_REQUIRED', 422);
        $stmt = getDB()->prepare("UPDATE orders SET status='cancelled',cancel_reason=? WHERE id=? AND user_id=? AND status='new'");
        $stmt->execute([$reason, (int)($data['order_id'] ?? 0), $uid]);
        if ($stmt->rowCount() !== 1) fail('ORDER_CANNOT_BE_CANCELLED', 409);
        ok();
    }
```

- [ ] **Step 6: Run tests and endpoint smoke checks**

Run:

```powershell
php tests/php/order_service_test.php
php -l api/lib/order_service.php
php -l api/mobile.php
php -S 127.0.0.1:8099 -t .
```

In another PowerShell session:

```powershell
Invoke-RestMethod 'http://127.0.0.1:8099/api/mobile.php?action=catalog'
```

Expected: catalog response contains `ok`, `version`, `updated_at`, and products.

- [ ] **Step 7: Commit mobile orders API**

```powershell
git add api/mobile.php api/lib/order_service.php api/lib/manager_notify.php tests/php/order_service_test.php
git commit -m "feat: add validated mobile orders api"
```

## Task 5: Register Devices And Notification Preferences

**Files:**
- Modify: `api/mobile.php`
- Create: `api/lib/push.php`
- Test: `tests/php/mobile_auth_test.php`

- [ ] **Step 1: Add failing device registration test**

Append to `tests/php/mobile_auth_test.php`:

```php
require_once projectPath('api/lib/push.php');
upsertMobileDevice(1, 'ExponentPushToken[test-token]', 'android', [
    'order_status_enabled' => true,
    'promotions_enabled' => false,
    'manager_messages_enabled' => true,
]);
$devices = devicesForUser(1, 'manager_message');
assertSame(1, count($devices), 'enabled device selected');
assertSame(0, count(devicesForUser(1, 'promotion')), 'disabled preference respected');
```

- [ ] **Step 2: Add device helper and router actions**

Create `api/lib/push.php`:

```php
<?php
require_once __DIR__ . '/../../db/init.php';

function upsertMobileDevice(int $uid, string $expoToken, string $platform, array $prefs): void {
    if (!preg_match('/^(Exponent|Expo)PushToken\[.+\]$/', $expoToken)) {
        throw new RuntimeException('INVALID_EXPO_PUSH_TOKEN');
    }
    getDB()->prepare("INSERT INTO mobile_devices(
        user_id,expo_token,platform,order_status_enabled,promotions_enabled,manager_messages_enabled,active,updated_at
    ) VALUES(?,?,?,?,?,?,1,CURRENT_TIMESTAMP)
    ON CONFLICT(expo_token) DO UPDATE SET user_id=excluded.user_id,platform=excluded.platform,
        order_status_enabled=excluded.order_status_enabled,promotions_enabled=excluded.promotions_enabled,
        manager_messages_enabled=excluded.manager_messages_enabled,active=1,updated_at=CURRENT_TIMESTAMP")
      ->execute([$uid, $expoToken, $platform,
          !empty($prefs['order_status_enabled']) ? 1 : 0,
          !empty($prefs['promotions_enabled']) ? 1 : 0,
          !empty($prefs['manager_messages_enabled']) ? 1 : 0]);
}

function devicesForUser(int $uid, string $type): array {
    $column = [
        'order_status' => 'order_status_enabled',
        'promotion' => 'promotions_enabled',
        'manager_message' => 'manager_messages_enabled',
    ][$type];
    $stmt = getDB()->prepare("SELECT * FROM mobile_devices WHERE user_id=? AND active=1 AND $column=1");
    $stmt->execute([$uid]);
    return $stmt->fetchAll();
}
```

Require `api/lib/push.php` at the top of `api/mobile.php`, then add these
actions before the final `UNKNOWN_ACTION` response:

```php
    if ($action === 'register_device' || $action === 'notification_preferences') {
        $uid = requireMobileUser();
        $data = body();
        upsertMobileDevice($uid, (string)($data['expo_token'] ?? ''), (string)($data['platform'] ?? ''), $data);
        ok();
    }
    if ($action === 'remove_device') {
        $uid = requireMobileUser();
        $data = body();
        getDB()->prepare('DELETE FROM mobile_devices WHERE user_id=? AND expo_token=?')
               ->execute([$uid, (string)($data['expo_token'] ?? '')]);
        ok();
    }
```

Both Expo token formats, `ExponentPushToken[...]` and `ExpoPushToken[...]`, are
accepted.

- [ ] **Step 3: Run tests and commit**

Run:

```powershell
php tests/php/mobile_auth_test.php
php -l api/lib/push.php
php -l api/mobile.php
```

Expected: PASS and no syntax errors.

```powershell
git add api/mobile.php api/lib/push.php tests/php/mobile_auth_test.php
git commit -m "feat: add mobile device notification preferences"
```

## Task 6: Send Push Tickets And Process Receipts

**Files:**
- Modify: `db/init.php`
- Modify: `api/lib/push.php`
- Create: `api/push_receipts.php`
- Create: `tests/php/push_test.php`

- [ ] **Step 1: Add delivery tables**

Append incremental migrations in `db/init.php`:

```php
$db->exec("CREATE TABLE IF NOT EXISTS push_campaigns (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    target_json TEXT NOT NULL DEFAULT '{}',
    user_id INTEGER,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
)");
$db->exec("CREATE TABLE IF NOT EXISTS push_deliveries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    campaign_id INTEGER,
    device_id INTEGER NOT NULL,
    expo_ticket_id TEXT,
    status TEXT NOT NULL DEFAULT 'queued',
    error TEXT DEFAULT '',
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (campaign_id) REFERENCES push_campaigns(id),
    FOREIGN KEY (device_id) REFERENCES mobile_devices(id)
)");
```

- [ ] **Step 2: Add failing payload test**

Create `tests/php/push_test.php`:

```php
<?php
require_once __DIR__ . '/bootstrap.php';
require_once projectPath('api/lib/push.php');

$payload = buildPushPayload('ExponentPushToken[test]', 'order_status', 'Order updated', 'SH-00001', ['order_id' => 1]);
assertSame('ExponentPushToken[test]', $payload['to'], 'token mapped');
assertSame('order_status', $payload['data']['type'], 'type mapped');
assertSame(1, $payload['data']['order_id'], 'target mapped');
```

- [ ] **Step 3: Implement Expo payloads and delivery recording**

Add to `api/lib/push.php`:

```php
function buildPushPayload(string $token, string $type, string $title, string $body, array $target): array {
    return ['to' => $token, 'sound' => 'default', 'title' => $title, 'body' => $body, 'data' => ['type' => $type] + $target];
}

function sendExpoBatch(array $messages): array {
    if (!$messages) return [];
    $ch = curl_init('https://exp.host/--/api/v2/push/send');
    curl_setopt_array($ch, [
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => json_encode($messages, JSON_UNESCAPED_UNICODE),
        CURLOPT_HTTPHEADER => ['Content-Type: application/json', 'Accept: application/json'],
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 15,
    ]);
    $response = curl_exec($ch);
    $status = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    if ($status < 200 || $status >= 300) throw new RuntimeException('EXPO_PUSH_HTTP_' . $status);
    return json_decode((string)$response, true)['data'] ?? [];
}

function sendUserPush(int $uid, string $type, string $title, string $body, array $target = []): int {
    $db = getDB();
    $db->prepare('INSERT INTO push_campaigns(type,title,body,target_json,user_id) VALUES(?,?,?,?,?)')
       ->execute([$type, $title, $body, json_encode($target, JSON_UNESCAPED_UNICODE), $uid]);
    $campaignId = (int)$db->lastInsertId();
    $devices = devicesForUser($uid, $type);
    $tickets = sendExpoBatch(array_map(fn($d) => buildPushPayload($d['expo_token'], $type, $title, $body, $target), $devices));
    foreach ($devices as $index => $device) {
        $ticket = $tickets[$index] ?? [];
        $db->prepare('INSERT INTO push_deliveries(campaign_id,device_id,expo_ticket_id,status,error) VALUES(?,?,?,?,?)')
           ->execute([$campaignId, (int)$device['id'], $ticket['id'] ?? null, $ticket['status'] ?? 'error', $ticket['message'] ?? '']);
    }
    return $campaignId;
}
```

- [ ] **Step 4: Add receipt cron endpoint**

Create `api/push_receipts.php`:

```php
<?php
require_once __DIR__ . '/lib/app_config.php';
require_once __DIR__ . '/lib/push.php';

header('Content-Type: application/json; charset=utf-8');
$provided = (string)($_GET['secret'] ?? '');
if (!defined('CRON_SECRET') || CRON_SECRET === '' || !hash_equals((string)CRON_SECRET, $provided)) {
    jsonResponse(['ok' => false, 'error' => 'forbidden'], 403);
}

$db = getDB();
$rows = $db->query("SELECT id,device_id,expo_ticket_id FROM push_deliveries
                    WHERE status='ok' AND expo_ticket_id IS NOT NULL LIMIT 100")->fetchAll();
if (!$rows) jsonResponse(['ok' => true, 'processed' => 0]);

$ticketIds = array_column($rows, 'expo_ticket_id');
$ch = curl_init('https://exp.host/--/api/v2/push/getReceipts');
curl_setopt_array($ch, [
    CURLOPT_POST => true,
    CURLOPT_POSTFIELDS => json_encode(['ids' => $ticketIds]),
    CURLOPT_HTTPHEADER => ['Content-Type: application/json', 'Accept: application/json'],
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_TIMEOUT => 15,
]);
$response = curl_exec($ch);
$status = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);
if ($status < 200 || $status >= 300) jsonResponse(['ok' => false, 'error' => 'expo receipt request failed'], 502);

$receipts = json_decode((string)$response, true)['data'] ?? [];
$update = $db->prepare('UPDATE push_deliveries SET status=?,error=?,updated_at=CURRENT_TIMESTAMP WHERE id=?');
$disable = $db->prepare('UPDATE mobile_devices SET active=0,updated_at=CURRENT_TIMESTAMP WHERE id=?');
$processed = 0;
foreach ($rows as $row) {
    $receipt = $receipts[$row['expo_ticket_id']] ?? null;
    if (!$receipt) continue;
    $error = (string)($receipt['details']['error'] ?? $receipt['message'] ?? '');
    $update->execute([($receipt['status'] ?? '') === 'ok' ? 'delivered' : 'error', $error, (int)$row['id']]);
    if ($error === 'DeviceNotRegistered') $disable->execute([(int)$row['device_id']]);
    $processed++;
}
jsonResponse(['ok' => true, 'processed' => $processed]);
```

- [ ] **Step 5: Run tests and commit**

Run:

```powershell
php tests/php/push_test.php
php -l api/lib/push.php
php -l api/push_receipts.php
```

Expected: PASS and no syntax errors.

```powershell
git add db/init.php api/lib/push.php api/push_receipts.php tests/php/push_test.php
git commit -m "feat: deliver and reconcile expo push notifications"
```

## Task 7: Trigger Status Pushes From Existing Manager Paths

**Files:**
- Modify: `api/lib/push.php`
- Modify: `api/admin.php`
- Modify: `api/tg_poll.php`

- [ ] **Step 1: Add status helper**

Add to `api/lib/push.php`:

```php
function sendOrderStatusPush(int $orderId, string $status): void {
    $stmt = getDB()->prepare('SELECT user_id FROM orders WHERE id=?');
    $stmt->execute([$orderId]);
    $order = $stmt->fetch();
    if (!$order) return;
    $labels = [
        'new' => 'New',
        'confirmed' => 'Confirmed',
        'in_progress' => 'In progress',
        'shipped' => 'Shipped',
        'completed' => 'Completed',
        'cancelled' => 'Cancelled',
    ];
    try {
        sendUserPush((int)$order['user_id'], 'order_status', 'Order status changed', $labels[$status] ?? $status, ['order_id' => $orderId]);
    } catch (Throwable $e) {
        error_log('Order status push failed: ' . $e->getMessage());
    }
}
```

A transient Expo failure must not turn a successfully persisted status change
into an admin or Telegram API error.

- [ ] **Step 2: Call status helper after successful updates**

Require `api/lib/push.php` in `api/admin.php` and `api/tg_poll.php`. After each
single-order status update, call:

```php
sendOrderStatusPush($orderId, $status);
```

For `bulk_status`, call the helper once per updated ID:

```php
foreach ($ids as $orderId) sendOrderStatusPush($orderId, $status);
```

- [ ] **Step 3: Lint and commit**

Run:

```powershell
php -l api/admin.php
php -l api/tg_poll.php
php -l api/lib/push.php
```

Expected: no syntax errors.

```powershell
git add api/admin.php api/tg_poll.php api/lib/push.php
git commit -m "feat: notify customers when order status changes"
```

## Task 8: Add Admin Promotion And Personal Message Controls

**Files:**
- Modify: `api/admin.php`
- Modify: `admin.html`

- [ ] **Step 1: Add admin API actions**

Require `api/lib/push.php` after the existing database bootstrap, then add
these authenticated actions in `api/admin.php`:

```php
case 'push_promotion':
    $raw = json_decode(file_get_contents('php://input'), true) ?: [];
    $title = trim($raw['title'] ?? '');
    $body = trim($raw['body'] ?? '');
    if ($title === '' || $body === '') jsonResponse(['ok'=>false,'error'=>'title and body required'], 422);
    $target = ['category' => trim($raw['category'] ?? '')];
    $users = $db->query('SELECT DISTINCT user_id FROM mobile_devices WHERE active=1 AND promotions_enabled=1')->fetchAll();
    foreach ($users as $user) sendUserPush((int)$user['user_id'], 'promotion', $title, $body, $target);
    jsonResponse(['ok'=>true,'users'=>count($users)]);
    break;

case 'push_manager_message':
    $raw = json_decode(file_get_contents('php://input'), true) ?: [];
    $uid = (int)($raw['user_id'] ?? 0);
    $body = trim($raw['body'] ?? '');
    if (!$uid || $body === '') jsonResponse(['ok'=>false,'error'=>'user_id and body required'], 422);
    sendUserPush($uid, 'manager_message', 'Message from SplitHub manager', $body, ['telegram_url'=>'https://t.me/Byttehnikaopt']);
    jsonResponse(['ok'=>true]);
    break;

case 'push_log':
    $rows = $db->query('SELECT * FROM push_campaigns ORDER BY id DESC LIMIT 100')->fetchAll();
    jsonResponse(['ok'=>true,'campaigns'=>$rows]);
    break;
```

- [ ] **Step 2: Add an admin Notifications tab**

In `admin.html`, add a `notifications` tab after `promo`, a pane containing:

```html
<div class="tab-pane" id="pane-notifications">
  <div class="promo-form">
    <h4>Promotion push</h4>
    <input class="form-inp" id="pushPromoTitle" placeholder="Title">
    <textarea class="note-area" id="pushPromoBody" placeholder="Promotion text"></textarea>
    <input class="form-inp" id="pushPromoCategory" placeholder="Catalog category">
    <button class="form-btn" onclick="sendPromotionPush()">Send promotion</button>
  </div>
  <div class="promo-form">
    <h4>Personal manager message</h4>
    <input class="form-inp" id="pushUserId" type="number" placeholder="Customer ID">
    <textarea class="note-area" id="pushManagerBody" placeholder="Message text"></textarea>
    <button class="form-btn" onclick="sendManagerPush()">Send message</button>
  </div>
  <div id="pushLog"></div>
</div>
```

Add `notifications` to `_tabNames`, call `loadPushLog()` when that tab is
selected, and add:

```js
function postAdmin(action, payload) {
  return fetch(api('admin.php?action=' + action), {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify(payload)
  }).then(r => r.json());
}

async function sendPromotionPush() {
  const result = await postAdmin('push_promotion', {
    title: document.getElementById('pushPromoTitle').value,
    body: document.getElementById('pushPromoBody').value,
    category: document.getElementById('pushPromoCategory').value
  });
  if (!result.ok) return alert(result.error || 'Push failed');
  await loadPushLog();
}

async function sendManagerPush() {
  const result = await postAdmin('push_manager_message', {
    user_id: Number(document.getElementById('pushUserId').value),
    body: document.getElementById('pushManagerBody').value
  });
  if (!result.ok) return alert(result.error || 'Push failed');
  await loadPushLog();
}

async function loadPushLog() {
  const result = await fetch(api('admin.php?action=push_log')).then(r => r.json());
  document.getElementById('pushLog').innerHTML = (result.campaigns || [])
    .map(row => `<div class="order-row">${row.type}: ${row.title}</div>`)
    .join('');
}
```

- [ ] **Step 3: Verify admin UI against staging**

Open `admin.html`, sign in as admin, send one test promotion and one personal
message to a staging customer, and confirm both campaigns appear in the log.

- [ ] **Step 4: Commit admin controls**

```powershell
git add api/admin.php admin.html
git commit -m "feat: add admin push notification controls"
```

## Task 9: Add Unified Test Runner And Stage The Backend

**Files:**
- Verify: `tests/php/bootstrap.php`
- Create: `tests/php/run.php`

- [ ] **Step 1: Verify the isolated test bootstrap and add the runner**

Confirm `tests/php/bootstrap.php` still contains the isolated temporary database
setup added in Task 1. Create `tests/php/run.php`:

```php
<?php
$tests = ['catalog_test.php', 'mobile_auth_test.php', 'order_service_test.php', 'push_test.php'];
foreach ($tests as $test) require __DIR__ . '/' . $test;
echo "PASS: backend suite\n";
```

- [ ] **Step 2: Run full backend verification**

Run:

```powershell
php tests/php/run.php
Get-ChildItem -Recurse -Filter *.php | ForEach-Object { php -l $_.FullName }
```

Expected: every test passes and every PHP file reports no syntax errors.

- [ ] **Step 3: Deploy to staging and smoke test**

Deploy to a staging host, then run:

```powershell
Invoke-RestMethod 'https://staging.splithub.ru/api/mobile.php?action=catalog'
```

Expected: HTTP 200 with `ok: true`, a version hash, a timestamp, and products.

- [ ] **Step 4: Configure staging receipt cron**

Configure:

```text
curl -s "https://staging.splithub.ru/api/push_receipts.php?secret=$SPLITHUB_STAGING_CRON_SECRET"
```

Run once per minute on staging. Confirm invalid test tokens are deactivated.

- [ ] **Step 5: Commit test runner**

```powershell
git add tests/php
git commit -m "test: add mobile backend verification suite"
```
