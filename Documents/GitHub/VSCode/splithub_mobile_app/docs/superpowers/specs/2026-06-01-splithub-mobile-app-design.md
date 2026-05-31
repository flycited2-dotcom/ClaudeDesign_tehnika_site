# SplitHub Mobile App Design

Date: 2026-06-01
Status: Approved product design

## Goal

Create a dedicated SplitHub mobile application for Android and iPhone based on
the existing `https://splithub.ru/` service. The first release must be ready for
Google Play, RuStore, and the Apple App Store.

The application is for installers and B2B customers who need to browse the
catalog, submit orders, follow their status, and quickly contact a manager.

## Existing Foundation

The public site already provides:

- a catalog of air conditioners, copper pipe, consumables, and semi-industrial
  equipment;
- visible prices and product availability without authentication;
- categories, filters, product cards, a price list download, and a cart;
- registration and login;
- order creation, order history, status tracking, repeat order, and
  cancellation of a new order;
- manager contacts and Telegram links;
- an admin panel where managers can change order statuses.

The mobile application must reuse the existing server data and accounts.
Customers sign in with the same credentials they already use on the site.

## First Release Scope

### Included

- a separate mobile interface implemented with React Native and Expo;
- Android and iPhone builds from one application codebase;
- an open catalog with prices and availability visible without login;
- categories, search, filters, product details, photos, and characteristics;
- cart editing and order submission;
- registration, login, profile, order history, order status, repeat order, and
  cancellation while an order is still new;
- locally cached catalog for read-only browsing when the network is unavailable;
- push notifications for order status changes, promotions, and personal
  manager messages;
- a manager-message notification action that opens Telegram;
- admin-panel actions for sending promotions and personal push messages;
- preparation for publishing in Google Play, RuStore, and the Apple App Store.

### Not Included

- an in-app manager chat;
- online payment;
- offline order submission or a background order queue;
- a separate mobile catalog database.

## Application Structure

The application uses a four-tab bottom navigation layout.

### Catalog

The catalog tab is the default screen. It provides categories, search, filters,
product cards, prices, and availability. Selecting a product opens its details,
photos, and characteristics. The screen also provides access to the price list,
contacts, and manager Telegram links.

When the server cannot be reached, the application displays the last saved
catalog and the timestamp of its most recent successful update. The offline
catalog is explicitly marked as potentially outdated.

### Cart

The cart tab allows customers to change product quantities and remove items.
Submitting an order requires a network connection. Immediately before creating
the order, the server validates product availability and current prices.

If any item changed, the application shows the affected products and returns
the customer to the cart for confirmation. It does not silently change the
order.

### Orders

The orders tab asks unauthenticated customers to sign in or register. Signed-in
customers can view order history, status, order contents, and totals. They can
repeat a previous order and cancel an order only while its status is `new`.

Opening an order-status push notification routes directly to the matching order
after authentication if required.

### Profile

The profile tab shows customer details, manager contact actions, notification
preferences, and logout. Authentication uses the same customer account as the
website.

## Architecture

### Mobile Client

Use React Native with Expo and TypeScript. The app is a dedicated mobile client,
not a WebView wrapper. It should preserve the recognizable visual identity of
`splithub.ru` while using native mobile navigation and interaction patterns.

Keep client responsibilities separated:

- API client: typed requests and authentication handling;
- catalog store: remote refresh and local read-only cache;
- cart store: local cart state and server validation results;
- session store: login state and customer profile;
- notification handler: token registration and deep-link routing;
- screens and reusable presentational components.

### Server

The existing SplitHub server remains the source of truth for products, prices,
availability, accounts, and orders. Add a versioned mobile JSON API that reuses
the current server-side business rules rather than duplicating them in the app.

The mobile API must cover:

- catalog snapshot and catalog version;
- registration, login, logout, and profile;
- create order with server-side validation;
- order history, order details, repeat-order data, and cancellation;
- register, update, and remove a device push token;
- customer notification preferences.

The server must return structured error codes for offline-like failures,
authentication expiry, validation changes, unavailable products, and general
server errors. The app maps these codes to concise Russian-language messages.

### Admin Panel

Extend the existing admin panel with:

- automatic order-status push delivery when a manager changes a status;
- promotion creation with title, body, and optional catalog/category target;
- personal manager message with customer selection, text, and Telegram action;
- send result visibility, including rejected or expired push tokens.

## Push Notifications

Use `expo-notifications` with Expo Push Service for the first release. The
server stores the Expo push token for each registered device and processes push
receipts so invalid tokens stop receiving future sends. Expo routes delivery to
FCM for Android and APNs for iOS.

Notification payloads include a type and target:

| Type | Target behavior |
| --- | --- |
| `order_status` | Open the matching order |
| `promotion` | Open the catalog or selected category |
| `manager_message` | Show the text and offer a Telegram action |

Push notification testing must use physical Android and iPhone devices.
The RuStore APK must also be tested on representative Android devices. If the
business later requires delivery on Android devices without a compatible push
channel, add a second Android push provider as a follow-up release.

## Offline Behavior

The app caches the last successfully loaded catalog snapshot locally. Offline
users can browse cached categories and product details.

The following actions require a connection:

- catalog refresh;
- registration and login;
- profile and order-history refresh;
- order creation, repeat order submission, and cancellation;
- retrieval of authoritative prices and availability.

The app must show a clear offline state instead of failing silently.

## Publication

Use Expo Application Services for repeatable Android and iOS builds.

- Submit the iOS build to App Store Connect and the Android store build to
  Google Play through EAS Submit.
- Produce a signed Android APK and upload it separately through RuStore Console.
- Prepare store metadata, icon, screenshots, privacy-policy URL, and support
  contact before moderation.

## Security And Privacy

- Use HTTPS for all requests.
- Store authentication secrets in secure device storage, not plain local
  storage.
- Keep the server authoritative for prices, availability, and order state.
- Do not place private customer data in push payloads beyond the minimum text
  needed for the notification.
- Provide logout and device-token removal.
- Document collected account and device-token data in the privacy policy.

## Verification

Before publication, verify:

1. Catalog loading, categories, search, filters, product details, and price-list
   access.
2. Open catalog visibility without authentication.
3. Cart editing, order submission, and changed-price or changed-availability
   handling.
4. Registration, login with an existing website account, profile, and logout.
5. Order history, direct opening from a notification, repeat order, and
   cancellation of a `new` order.
6. Read-only catalog cache and clear offline states.
7. All three notification types on physical Android and iPhone devices.
8. Release artifacts for Google Play, RuStore, and App Store Connect.

## Official Technical References

- Expo push notifications overview:
  `https://docs.expo.dev/push-notifications/overview/`
- Expo Push Service:
  `https://docs.expo.dev/push-notifications/sending-notifications/`
- Expo store submission:
  `https://docs.expo.dev/deploy/submit-to-app-stores/`
- RuStore application publication:
  `https://www.rustore.ru/help/developers/publishing-and-verifying-apps/app-publication/setting-up-publication/instant-app-publishing`

