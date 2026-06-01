# SplitHub Mobile Release Checklist

## External Setup

- [ ] Rotate the Telegram bot token before backend deployment.
- [ ] Deploy the backend branch to a staging HTTPS host.
- [ ] Create an uncommitted `.env.local` from `.env.example` for the staging API.
- [ ] Configure Expo account and EAS project ID.
- [ ] Configure Android FCM V1 credentials.
- [ ] Configure Apple Developer account and APNs key.
- [ ] Create Google Play, RuStore, and App Store Connect applications.

## Store Assets

- [x] Replace Expo placeholder icon and splash assets with SplitHub branding.
- [ ] Capture Android and iPhone screenshots.
- [ ] Publish the reviewed privacy policy under splithub.ru.
- [ ] Confirm the support URL and support email.
- [ ] Set category, age rating, and Russian release notes.

## Artifacts

- [x] Verify Android native prebuild locally.
- [ ] Verify iOS native generation through EAS or on macOS.
- [ ] Build and record the Google Play AAB.
- [ ] Build and record the signed RuStore APK.
- [ ] Build and record the iOS archive.

## Dependency Audit

- [ ] Re-check the upstream Expo build-tooling audit before store submission.
  Expo SDK 56 currently resolves `@expo/config-plugins@56.0.8 -> xcode@3.0.1
  -> uuid@7.0.3`; `npm audit --omit=dev` reports a moderate advisory. Do not
  apply the suggested forced SDK 55 downgrade.

## Physical Device Matrix

| Date | Build | Device | OS | Install source | Catalog | Auth | Order | Pushes | Result |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
|  |  | Android with Google services |  | Internal APK |  |  |  |  |  |
|  |  | Android RuStore representative |  | RuStore APK |  |  |  |  |  |
|  |  | iPhone |  | TestFlight |  |  |  |  |  |

## Submission Record

- [ ] Record Google Play moderation ID, date, and final URL.
- [ ] Record RuStore moderation ID, date, and final URL.
- [ ] Record App Store Connect moderation ID, date, and final URL.
