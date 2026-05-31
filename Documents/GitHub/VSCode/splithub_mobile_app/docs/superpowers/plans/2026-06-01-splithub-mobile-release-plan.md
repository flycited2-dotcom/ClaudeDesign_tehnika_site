# SplitHub Mobile Store Release Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Produce signed release artifacts and submit SplitHub Mobile to Google Play, RuStore, and App Store Connect.

**Architecture:** Configure EAS once for repeatable Android and iOS builds. Use the default Android AAB for Google Play, a dedicated signed APK profile for RuStore, and the iOS production build for App Store Connect. Keep credentials outside Git.

**Tech Stack:** Expo Application Services, EAS Build, EAS Submit, Google Play Console, RuStore Console, App Store Connect.

---

## Files

### Create

- `mobile/eas.json`: development, preview, production, and RuStore build profiles.
- `mobile/docs/store-listing-ru.md`: Russian store listing text.
- `mobile/docs/privacy-policy-ru.md`: privacy policy content for hosting.
- `mobile/docs/release-checklist.md`: per-store evidence checklist.

### Modify

- `mobile/app.json`: application identifiers, version, icon, splash, and iOS
  export-compliance flag.

## Task 1: Configure Identifiers And Build Profiles

**Files:**
- Modify: `mobile/app.json`
- Create: `mobile/eas.json`

- [ ] **Step 1: Configure application identity**

Set stable identifiers in `mobile/app.json`:

```json
{
  "expo": {
    "name": "SplitHub",
    "slug": "splithub",
    "version": "1.0.0",
    "scheme": "splithub",
    "ios": {
      "bundleIdentifier": "ru.splithub.mobile",
      "config": { "usesNonExemptEncryption": false }
    },
    "android": {
      "package": "ru.splithub.mobile",
      "versionCode": 1
    }
  }
}
```

- [ ] **Step 2: Add EAS profiles**

Create `mobile/eas.json`:

```json
{
  "cli": { "version": ">= 16.0.0" },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal"
    },
    "production": {
      "autoIncrement": true
    },
    "rustore": {
      "extends": "production",
      "android": { "buildType": "apk" }
    }
  },
  "submit": {
    "production": {}
  }
}
```

- [ ] **Step 3: Link the EAS project and validate configuration**

Run:

```powershell
Set-Location C:\Users\user\Documents\GitHub\VSCode\splithub_mobile_app\mobile
npx.cmd eas-cli@latest init
npx.cmd eas-cli@latest build:configure
npx.cmd expo config --type public
npx.cmd expo-doctor
```

Expected: `app.json` contains `extra.eas.projectId`, identifiers resolve to
`ru.splithub.mobile`, and Expo Doctor reports no project issues.

- [ ] **Step 4: Commit build configuration**

```powershell
git add mobile/app.json mobile/eas.json
git commit -m "build: configure SplitHub store profiles"
```

## Task 2: Prepare Store Metadata And Privacy Policy

**Files:**
- Create: `mobile/docs/store-listing-ru.md`
- Create: `mobile/docs/privacy-policy-ru.md`
- Create: `mobile/docs/release-checklist.md`

- [ ] **Step 1: Write Russian listing content**

Create `store-listing-ru.md` with:

```markdown
# SplitHub

## Краткое описание
Оптовые кондиционеры и расходники для монтажников: каталог, заказы и статусы.

## Полное описание
SplitHub помогает монтажникам и B2B-клиентам быстро проверять актуальные цены
и наличие кондиционеров, медной трубы и расходных материалов. В приложении
можно оформить заказ, следить за его статусом, повторить предыдущий заказ и
связаться с менеджером в Telegram.

## Поддержка
- Сайт: https://splithub.ru/
- Email: info@splithub.ru
```

- [ ] **Step 2: Write privacy-policy content**

Create `privacy-policy-ru.md` with a plain-language draft that identifies the
app operator and documents account data, phone number, optional Telegram
handle, order history, device push token, notification preferences, purposes,
retention, deletion-request contact, and support email. Publish the reviewed
final policy at a public HTTPS URL under `splithub.ru` before submission.

- [ ] **Step 3: Add release checklist**

Create `release-checklist.md` with checkboxes for icon, screenshots, privacy
URL, support URL, category, age rating, release notes, AAB, APK, iOS build,
moderation status, and final store links.

- [ ] **Step 4: Commit release docs**

```powershell
git add mobile/docs
git commit -m "docs: add store listing and privacy release checklist"
```

## Task 3: Build And Test Signed Artifacts

- [ ] **Step 1: Configure external credentials**

Outside Git, configure:

- Expo account and EAS project;
- Firebase Cloud Messaging V1 credentials for Android push;
- Apple Developer account and APNs key for iOS push;
- Apple App Store Connect access;
- Google Play Console application;
- RuStore Console application.

- [ ] **Step 2: Build production artifacts**

Run:

```powershell
npx.cmd eas-cli@latest build --platform android --profile production
npx.cmd eas-cli@latest build --platform android --profile rustore
npx.cmd eas-cli@latest build --platform ios --profile production
```

Expected:

- Android production build produces `.aab`.
- RuStore profile produces signed `.apk`.
- iOS production build completes successfully.

- [ ] **Step 3: Run physical-device matrix**

Test at least:

| Device | Install source | Required checks |
| --- | --- | --- |
| Android with Google services | Internal APK | Catalog, auth, order, all pushes |
| Android representative for RuStore audience | RuStore APK | Catalog, auth, order, all pushes |
| iPhone | TestFlight | Catalog, auth, order, all pushes |

Record date, build number, device model, OS version, and pass/fail result in
`mobile/docs/release-checklist.md`.

- [ ] **Step 4: Commit recorded verification**

```powershell
git add mobile/docs/release-checklist.md
git commit -m "test: record signed mobile release verification"
```

## Task 4: Submit To Stores

- [ ] **Step 1: Submit Google Play and App Store Connect builds**

Run:

```powershell
npx.cmd eas-cli@latest submit --platform android --profile production
npx.cmd eas-cli@latest submit --platform ios --profile production
```

Expected: EAS reports successful upload to the Google Play and App Store
distribution pipelines.

- [ ] **Step 2: Upload RuStore APK**

In RuStore Console:

1. Create the app version.
2. Upload the signed APK from the `rustore` EAS build.
3. Upload icon and screenshots.
4. Enter listing text, support contact, and privacy-policy URL.
5. Send the version to moderation.

- [ ] **Step 3: Complete store forms**

In Google Play Console and App Store Connect, complete listing, privacy,
content-rating, screenshots, support, and review fields. Send both releases to
moderation.

- [ ] **Step 4: Record submission evidence**

Add moderation IDs, submission dates, and eventual public store URLs to
`mobile/docs/release-checklist.md`.

- [ ] **Step 5: Commit release record**

```powershell
git add mobile/docs/release-checklist.md
git commit -m "docs: record SplitHub store submissions"
```

## Official References

- Expo Router SDK 56 quick start:
  `https://docs.expo.dev/router/introduction/`
- Expo notifications:
  `https://docs.expo.dev/push-notifications/using-fcm/`
- Expo Push Service:
  `https://docs.expo.dev/push-notifications/sending-notifications/`
- EAS Build:
  `https://docs.expo.dev/build`
- EAS APK profile:
  `https://docs.expo.dev/build-reference/apk/`
- EAS Submit:
  `https://docs.expo.dev/deploy/submit-to-app-stores/`
- RuStore publication:
  `https://www.rustore.ru/help/developers/publishing-and-verifying-apps/app-publication/setting-up-publication/instant-app-publishing`
