# SplitHub Expo Mobile Client Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the dedicated SplitHub Expo application for Android and iPhone against the versioned SplitHub mobile API.

**Architecture:** Work in `C:\Users\user\Documents\GitHub\VSCode\splithub_mobile_app\mobile`. Use Expo Router JavaScript tabs, focused feature folders, React context stores, SecureStore for bearer tokens, and AsyncStorage for the read-only catalog cache and local cart. Keep UI state local unless it must survive screen changes.

**Tech Stack:** Expo SDK 56, React Native, TypeScript, Expo Router, Expo SecureStore, Expo Notifications, AsyncStorage, Jest, React Native Testing Library.

---

## File Map

### Create

- `mobile/`: Expo SDK 56 project root.
- `mobile/src/app/_layout.tsx`: provider and stack root.
- `mobile/src/app/(tabs)/_layout.tsx`: four-tab navigation.
- `mobile/src/app/(tabs)/index.tsx`: catalog route.
- `mobile/src/app/(tabs)/cart.tsx`: cart route.
- `mobile/src/app/(tabs)/orders.tsx`: orders route.
- `mobile/src/app/(tabs)/profile.tsx`: profile route.
- `mobile/src/app/product/[id].tsx`: product details.
- `mobile/src/app/order/[id].tsx`: order details.
- `mobile/src/app/auth/login.tsx`: login.
- `mobile/src/app/auth/register.tsx`: registration.
- `mobile/src/lib/api.ts`: typed bearer-token API client.
- `mobile/src/lib/token-storage.ts`: SecureStore token adapter.
- `mobile/src/lib/storage.ts`: AsyncStorage cache adapter.
- `mobile/src/lib/theme.ts`: SplitHub palette and spacing.
- `mobile/src/features/catalog/*`: catalog repository, context, filters, cards.
- `mobile/src/features/cart/*`: cart context and checkout UI.
- `mobile/src/features/session/*`: session context and forms.
- `mobile/src/features/orders/*`: order types and screens.
- `mobile/src/features/notifications/*`: registration and deep-link handler.
- `mobile/__tests__/*`: repository, reducer, API, and routing tests.

## Task 0: Scaffold Expo SDK 56

**Files:**
- Create: `mobile/*`

- [ ] **Step 1: Generate the Expo application**

Run from `C:\Users\user\Documents\GitHub\VSCode\splithub_mobile_app`:

```powershell
npx.cmd create-expo-app@latest mobile --template default@sdk-56 --yes --no-agents-md
Set-Location mobile
npx.cmd expo install expo-dev-client expo-secure-store expo-notifications expo-device expo-constants @react-native-async-storage/async-storage
npx.cmd expo install @testing-library/react-native "--" --dev
npm.cmd install --save-dev jest-expo @types/jest
```

Expected: `mobile/package.json`, `mobile/src/app`, and `mobile/package-lock.json`
exist.

- [ ] **Step 2: Add deterministic scripts**

In `mobile/package.json`, add:

```json
{
  "scripts": {
    "start": "expo start",
    "test": "jest",
    "typecheck": "tsc --noEmit",
    "doctor": "expo-doctor"
  },
  "jest": {
    "preset": "jest-expo"
  }
}
```

- [ ] **Step 3: Verify the scaffold**

Run:

```powershell
npm.cmd run typecheck
npx.cmd expo-doctor
```

Expected: both commands exit with code `0`.

- [ ] **Step 4: Commit scaffold**

```powershell
git add mobile
git commit -m "feat: scaffold SplitHub Expo application"
```

## Task 1: Add Shared Types, Secure Token Storage, And API Client

**Files:**
- Create: `mobile/src/lib/api.ts`
- Create: `mobile/src/lib/token-storage.ts`
- Create: `mobile/src/features/catalog/types.ts`
- Create: `mobile/src/features/orders/types.ts`
- Create: `mobile/__tests__/api.test.ts`

- [ ] **Step 1: Add failing API header test**

Create `mobile/__tests__/api.test.ts`:

```ts
import { buildHeaders } from '../src/lib/api';

test('adds bearer token when present', () => {
  expect(buildHeaders('secret')).toEqual({
    Accept: 'application/json',
    'Content-Type': 'application/json',
    Authorization: 'Bearer secret',
  });
});
```

- [ ] **Step 2: Run the test and verify it fails**

Run:

```powershell
npm.cmd test -- --runInBand __tests__/api.test.ts
```

Expected: FAIL because `src/lib/api.ts` does not exist.

- [ ] **Step 3: Implement types and API client**

Create `mobile/src/features/catalog/types.ts`:

```ts
export type Product = {
  id: string;
  sku: string;
  brand: string;
  model: string;
  group: string;
  price: number;
  stock: string;
  stockLabel: string;
  descShort: string;
  benefits: string[];
  photo: string;
};

export type CatalogSnapshot = {
  version: string;
  updated_at: string;
  products: Product[];
};
```

Create `mobile/src/lib/token-storage.ts`:

```ts
import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'splithub.mobile-token';
export const tokenStorage = {
  get: () => SecureStore.getItemAsync(TOKEN_KEY),
  set: (token: string) => SecureStore.setItemAsync(TOKEN_KEY, token),
  clear: () => SecureStore.deleteItemAsync(TOKEN_KEY),
};
```

Create `mobile/src/lib/api.ts`:

```ts
import { tokenStorage } from './token-storage';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'https://splithub.ru/api/mobile.php';

export function buildHeaders(token?: string | null) {
  return {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function api<T>(
  action: string,
  init: RequestInit = {},
  query: Record<string, string> = {},
): Promise<T> {
  const token = await tokenStorage.get();
  const params = new URLSearchParams({ action, ...query });
  const response = await fetch(`${API_URL}?${params}`, {
    ...init,
    headers: { ...buildHeaders(token), ...init.headers },
  });
  const data = await response.json();
  if (!response.ok || data.ok === false) throw Object.assign(new Error(data.code ?? 'REQUEST_FAILED'), { data });
  return data as T;
}
```

- [ ] **Step 4: Run tests and typecheck**

Run:

```powershell
npm.cmd test -- --runInBand __tests__/api.test.ts
npm.cmd run typecheck
```

Expected: PASS and no TypeScript errors.

- [ ] **Step 5: Commit API foundation**

```powershell
git add mobile/src mobile/__tests__
git commit -m "feat: add typed mobile api client"
```

## Task 2: Add Catalog Cache And Repository

**Files:**
- Create: `mobile/src/lib/storage.ts`
- Create: `mobile/src/features/catalog/catalog-repository.ts`
- Create: `mobile/src/features/catalog/catalog-context.tsx`
- Create: `mobile/__tests__/catalog-repository.test.ts`

- [ ] **Step 1: Add failing cache fallback test**

Create `mobile/__tests__/catalog-repository.test.ts`:

```ts
import { loadCatalog } from '../src/features/catalog/catalog-repository';

test('returns cached snapshot when network fails', async () => {
  const cached = { version: 'cached', updated_at: '2026-06-01T00:00:00Z', products: [] };
  const result = await loadCatalog({
    fetchRemote: async () => { throw new Error('offline'); },
    readCache: async () => cached,
    writeCache: async () => undefined,
  });
  expect(result).toEqual({ snapshot: cached, offline: true });
});
```

- [ ] **Step 2: Implement repository and storage adapter**

Create `mobile/src/lib/storage.ts`:

```ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { CatalogSnapshot } from '../features/catalog/types';

const CATALOG_KEY = 'splithub.catalog-cache';
export const catalogStorage = {
  read: async () => {
    const raw = await AsyncStorage.getItem(CATALOG_KEY);
    return raw ? JSON.parse(raw) as CatalogSnapshot : null;
  },
  write: (snapshot: CatalogSnapshot) => AsyncStorage.setItem(CATALOG_KEY, JSON.stringify(snapshot)),
};
```

Create `mobile/src/features/catalog/catalog-repository.ts`:

```ts
import { api } from '../../lib/api';
import { catalogStorage } from '../../lib/storage';
import type { CatalogSnapshot } from './types';

type Deps = {
  fetchRemote: () => Promise<CatalogSnapshot>;
  readCache: () => Promise<CatalogSnapshot | null>;
  writeCache: (snapshot: CatalogSnapshot) => Promise<unknown>;
};

export async function loadCatalog(deps: Deps = {
  fetchRemote: () => api<CatalogSnapshot>('catalog'),
  readCache: catalogStorage.read,
  writeCache: catalogStorage.write,
}) {
  try {
    const snapshot = await deps.fetchRemote();
    await deps.writeCache(snapshot);
    return { snapshot, offline: false };
  } catch (error) {
    const snapshot = await deps.readCache();
    if (!snapshot) throw error;
    return { snapshot, offline: true };
  }
}
```

Create `catalog-context.tsx` with `snapshot`, `loading`, `offline`, `error`, and
`refresh()` state. Call `refresh()` once on provider mount.

- [ ] **Step 3: Run tests and commit**

Run:

```powershell
npm.cmd test -- --runInBand __tests__/catalog-repository.test.ts
npm.cmd run typecheck
```

Expected: PASS and no TypeScript errors.

```powershell
git add mobile/src mobile/__tests__
git commit -m "feat: cache catalog for offline browsing"
```

## Task 3: Build Catalog Navigation, Search, Filters, And Product Details

**Files:**
- Create: `mobile/src/lib/theme.ts`
- Create: `mobile/src/features/catalog/filter-products.ts`
- Create: `mobile/src/features/catalog/ProductCard.tsx`
- Create: `mobile/src/app/(tabs)/index.tsx`
- Create: `mobile/src/app/product/[id].tsx`
- Create: `mobile/__tests__/filter-products.test.ts`

- [ ] **Step 1: Add failing filter test**

Create `mobile/__tests__/filter-products.test.ts`:

```ts
import { filterProducts } from '../src/features/catalog/filter-products';

const products = [
  { id: '1', brand: 'ULTIMA', model: 'ELYSIUM 09', group: 'inv' },
  { id: '2', brand: 'MIDEA', model: 'BREEZE 12', group: 'onoff' },
] as never[];

test('filters by search and category', () => {
  expect(filterProducts(products, 'ely', 'inv').map(x => x.id)).toEqual(['1']);
});
```

- [ ] **Step 2: Implement pure filtering**

Create `mobile/src/features/catalog/filter-products.ts`:

```ts
import type { Product } from './types';

export function filterProducts(products: Product[], search: string, group: string) {
  const needle = search.trim().toLocaleLowerCase('ru');
  return products.filter(product =>
    (!group || product.group === group) &&
    (!needle || `${product.brand} ${product.model}`.toLocaleLowerCase('ru').includes(needle))
  );
}
```

- [ ] **Step 3: Implement catalog screens**

Build `ProductCard.tsx`, `(tabs)/index.tsx`, and `product/[id].tsx` with:

- amber SplitHub accent `#F59E0B`;
- offline banner showing `snapshot.updated_at`;
- horizontal category chips for `inv`, `onoff`, `truba`, `rashod`, and
  semi-industrial groups;
- search input;
- two-column product grid;
- product details with image URL
  `https://splithub.ru/assets/img/products/${product.photo}`;
- add-to-cart button stub wired in Task 4.

- [ ] **Step 4: Run tests and commit**

Run:

```powershell
npm.cmd test -- --runInBand __tests__/filter-products.test.ts
npm.cmd run typecheck
```

Expected: PASS and no TypeScript errors.

```powershell
git add mobile/src mobile/__tests__
git commit -m "feat: add searchable SplitHub catalog screens"
```

## Task 4: Add Persistent Cart And Validated Checkout

**Files:**
- Create: `mobile/src/features/cart/cart-reducer.ts`
- Create: `mobile/src/features/cart/cart-context.tsx`
- Create: `mobile/src/app/(tabs)/cart.tsx`
- Create: `mobile/__tests__/cart-reducer.test.ts`

- [ ] **Step 1: Add failing cart reducer test**

Create `mobile/__tests__/cart-reducer.test.ts`:

```ts
import { cartReducer } from '../src/features/cart/cart-reducer';

test('increments an existing cart product', () => {
  const state = [{ id: '1001', name: 'ELYSIUM', price: 24900, qty: 1 }];
  expect(cartReducer(state, { type: 'add', item: state[0] })[0].qty).toBe(2);
});
```

- [ ] **Step 2: Implement reducer and persisted cart context**

Create `mobile/src/features/cart/cart-reducer.ts`:

```ts
export type CartItem = { id: string; name: string; price: number; qty: number };
export type CartAction =
  | { type: 'add'; item: CartItem }
  | { type: 'setQty'; id: string; qty: number }
  | { type: 'clear' };

export function cartReducer(state: CartItem[], action: CartAction): CartItem[] {
  if (action.type === 'clear') return [];
  if (action.type === 'setQty') return state.map(x => x.id === action.id ? { ...x, qty: action.qty } : x).filter(x => x.qty > 0);
  const found = state.find(x => x.id === action.item.id);
  return found
    ? state.map(x => x.id === action.item.id ? { ...x, qty: x.qty + 1 } : x)
    : [...state, { ...action.item, qty: 1 }];
}
```

Create `cart-context.tsx` using `useReducer`, persist the state under
`splithub.cart`, and expose `checkout()`:

```ts
await api<{ order_id: number; total: number }>('create_order', {
  method: 'POST',
  body: JSON.stringify({ items }),
});
```

If API error data contains `code === 'CATALOG_CHANGED'` or
`code === 'PRODUCT_UNAVAILABLE'`, keep the cart and render a confirmation
message rather than clearing it.

- [ ] **Step 3: Build cart screen**

Create `(tabs)/cart.tsx` with quantity controls, total, online-required checkout
button, changed-item warning, and a sign-in link when the API returns
`AUTH_REQUIRED`.

- [ ] **Step 4: Run tests and commit**

Run:

```powershell
npm.cmd test -- --runInBand __tests__/cart-reducer.test.ts
npm.cmd run typecheck
```

Expected: PASS and no TypeScript errors.

```powershell
git add mobile/src mobile/__tests__
git commit -m "feat: add cart and validated checkout"
```

## Task 5: Add Shared Session, Login, Registration, And Profile

**Files:**
- Create: `mobile/src/features/session/session-context.tsx`
- Create: `mobile/src/app/auth/login.tsx`
- Create: `mobile/src/app/auth/register.tsx`
- Create: `mobile/src/app/(tabs)/profile.tsx`
- Modify: `mobile/src/app/_layout.tsx`

- [ ] **Step 1: Implement session context**

Create `session-context.tsx` exposing `user`, `loading`, `login`, `register`,
`refreshProfile`, and `logout`. The login flow must store the token before
refreshing the profile:

```ts
const result = await api<{ token: string; user: User }>('login', {
  method: 'POST',
  body: JSON.stringify({ phone, password }),
});
await tokenStorage.set(result.token);
setUser(result.user);
```

Logout calls the API, then clears SecureStore even if the request fails:

```ts
try { await api('logout', { method: 'POST' }); }
finally { await tokenStorage.clear(); setUser(null); }
```

- [ ] **Step 2: Build auth and profile routes**

Create form routes for existing website credentials and registration fields:
name, phone, password, and optional Telegram. Create the profile route with
customer details, notification settings area, manager Telegram link,
and logout.

- [ ] **Step 3: Mount providers**

In `src/app/_layout.tsx`, wrap the router stack:

```tsx
<SessionProvider>
  <CatalogProvider>
    <CartProvider>
      <Stack />
    </CartProvider>
  </CatalogProvider>
</SessionProvider>
```

- [ ] **Step 4: Run typecheck and commit**

Run:

```powershell
npm.cmd run typecheck
```

Expected: no TypeScript errors.

```powershell
git add mobile/src
git commit -m "feat: add shared customer session"
```

## Task 6: Add Order History, Details, Repeat, And Cancel

**Files:**
- Create: `mobile/src/features/orders/types.ts`
- Create: `mobile/src/features/orders/orders-repository.ts`
- Create: `mobile/src/app/(tabs)/orders.tsx`
- Create: `mobile/src/app/order/[id].tsx`
- Create: `mobile/__tests__/orders-repository.test.ts`

- [ ] **Step 1: Add repository request tests**

Create `mobile/__tests__/orders-repository.test.ts`:

```ts
import { orderDetailsQuery } from '../src/features/orders/orders-repository';

test('builds order detail query', () => {
  expect(orderDetailsQuery(42)).toEqual({ id: '42' });
});
```

- [ ] **Step 2: Implement repository**

Create `orders-repository.ts`:

```ts
import { api } from '../../lib/api';

export const orderDetailsQuery = (id: number) => ({ id: String(id) });
export const listOrders = () => api<{ orders: Order[] }>('orders');
export const loadOrder = (id: number) => api<{ order: Order }>('order', {}, orderDetailsQuery(id));
export const repeatOrder = (id: number) => api<{ items: { id: string; qty: number }[] }>('repeat_order', {
  method: 'POST', body: JSON.stringify({ order_id: id }),
});
export const cancelOrder = (id: number, reason: string) => api('cancel_order', {
  method: 'POST', body: JSON.stringify({ order_id: id, reason }),
});
```

- [ ] **Step 3: Build order screens**

Create the orders tab and details route. Show unauthenticated call-to-action
instead of loading orders. For signed-in users, show statuses, totals, line
items, repeat action, and cancel action only when `status === 'new'`.

- [ ] **Step 4: Run tests and commit**

Run:

```powershell
npm.cmd test -- --runInBand __tests__/orders-repository.test.ts
npm.cmd run typecheck
```

Expected: PASS and no TypeScript errors.

```powershell
git add mobile/src mobile/__tests__
git commit -m "feat: add customer order tracking"
```

## Task 7: Add Four-Tab Navigation And Contact Actions

**Files:**
- Create: `mobile/src/app/(tabs)/_layout.tsx`
- Modify: `mobile/src/app/(tabs)/profile.tsx`

- [ ] **Step 1: Configure stable JavaScript tabs**

Create `(tabs)/_layout.tsx`:

```tsx
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Tabs } from 'expo-router';

export default function TabLayout() {
  return (
    <Tabs screenOptions={{ tabBarActiveTintColor: '#F59E0B', headerShown: false }}>
      <Tabs.Screen name="index" options={{ title: 'Catalog', tabBarIcon: p => <MaterialIcons name="grid-view" {...p} /> }} />
      <Tabs.Screen name="cart" options={{ title: 'Cart', tabBarIcon: p => <MaterialIcons name="shopping-cart" {...p} /> }} />
      <Tabs.Screen name="orders" options={{ title: 'Orders', tabBarIcon: p => <MaterialIcons name="receipt-long" {...p} /> }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarIcon: p => <MaterialIcons name="person" {...p} /> }} />
    </Tabs>
  );
}
```

- [ ] **Step 2: Add contact and price-list actions**

Use `Linking.openURL()` for:

```ts
await Linking.openURL('https://t.me/Byttehnikaopt');
await Linking.openURL('tel:+79785991369');
await Linking.openURL('https://splithub.ru/');
```

The website URL opens the existing price-list flow until a dedicated download
endpoint is added.

- [ ] **Step 3: Verify navigation manually and commit**

Run:

```powershell
npx.cmd expo start
```

Expected: all four tabs render and product detail navigation works.

```powershell
git add mobile/src
git commit -m "feat: add SplitHub app navigation and contacts"
```

## Task 8: Register Push Tokens And Route Notification Taps

**Files:**
- Create: `mobile/src/features/notifications/register-device.ts`
- Create: `mobile/src/features/notifications/notification-router.ts`
- Create: `mobile/__tests__/notification-router.test.ts`
- Modify: `mobile/src/app/_layout.tsx`
- Modify: `mobile/src/app/(tabs)/profile.tsx`
- Modify: `mobile/app.json`

- [ ] **Step 1: Add failing notification target tests**

Create `mobile/__tests__/notification-router.test.ts`:

```ts
import { notificationTarget } from '../src/features/notifications/notification-router';

test('routes order status notification to order details', () => {
  expect(notificationTarget({ type: 'order_status', order_id: 42 })).toBe('/order/42');
});

test('routes promotion to catalog', () => {
  expect(notificationTarget({ type: 'promotion', category: 'inv' })).toBe('/?category=inv');
});
```

- [ ] **Step 2: Implement route mapping**

Create `notification-router.ts`:

```ts
export function notificationTarget(data: Record<string, unknown>) {
  if (data.type === 'order_status' && data.order_id) return `/order/${data.order_id}`;
  if (data.type === 'promotion') return `/?category=${encodeURIComponent(String(data.category ?? ''))}`;
  if (data.type === 'manager_message') return String(data.telegram_url ?? 'https://t.me/Byttehnikaopt');
  return '/';
}
```

- [ ] **Step 3: Register a physical device**

Create `register-device.ts` using the EAS project ID:

```ts
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { api } from '../../lib/api';

export async function registerDevice(preferences: Record<string, boolean>) {
  if (!Device.isDevice) return;
  const permission = await Notifications.requestPermissionsAsync();
  if (permission.status !== 'granted') return;
  const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
  if (!projectId) throw new Error('EAS_PROJECT_ID_REQUIRED');
  const expoToken = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
  await api('register_device', {
    method: 'POST',
    body: JSON.stringify({ expo_token: expoToken, platform: Platform.OS, ...preferences }),
  });
}
```

POST the token, platform, and the three boolean preferences to
`register_device`. Do not attempt remote push registration on simulators or
emulators.

In `app.json`, add:

```json
{
  "expo": {
    "plugins": ["expo-router", "expo-notifications", "expo-secure-store"]
  }
}
```

- [ ] **Step 4: Handle notification taps**

In `_layout.tsx`, register
`Notifications.addNotificationResponseReceivedListener`. Route in-app targets
with `router.push()` and manager messages with `Linking.openURL()`.

- [ ] **Step 5: Add profile preferences**

Add switches for order status, promotions, and manager messages. On change,
POST the complete preference set to `notification_preferences`.

- [ ] **Step 6: Run tests and commit**

Run:

```powershell
npm.cmd test -- --runInBand __tests__/notification-router.test.ts
npm.cmd run typecheck
```

Expected: PASS and no TypeScript errors.

```powershell
git add mobile/src mobile/app.json mobile/__tests__
git commit -m "feat: register devices and route push notifications"
```

## Task 9: Run Mobile Verification And Build Development Artifacts

Complete release-plan Task 1 first so `mobile/eas.json`, application
identifiers, and `extra.eas.projectId` exist before development builds.

- [ ] **Step 1: Run automated checks**

Run:

```powershell
npm.cmd test -- --runInBand
npm.cmd run typecheck
npx.cmd expo-doctor
```

Expected: all commands exit with code `0`.

- [ ] **Step 2: Configure staging API**

Create an uncommitted `.env.local`:

```text
EXPO_PUBLIC_API_URL=https://staging.splithub.ru/api/mobile.php
```

- [ ] **Step 3: Build development clients**

Run:

```powershell
npx.cmd eas-cli@latest build --platform android --profile development
npx.cmd eas-cli@latest build --platform ios --profile development
```

Expected: EAS produces installable development builds.

- [ ] **Step 4: Perform staging smoke test**

On physical Android and iPhone devices:

1. Browse open catalog while signed out.
2. Load cached catalog with connectivity disabled.
3. Sign in with an existing website account.
4. Submit an order.
5. Change its status through staging admin and tap the push notification.
6. Send a promotion and verify catalog routing.
7. Send a manager message and verify Telegram routing.

- [ ] **Step 5: Commit verification fixes**

```powershell
git add mobile
git commit -m "test: verify SplitHub mobile staging flow"
```
