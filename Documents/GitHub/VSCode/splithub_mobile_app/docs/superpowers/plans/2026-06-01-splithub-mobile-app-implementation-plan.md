# SplitHub Mobile App Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver a dedicated SplitHub Android and iPhone application with an open catalog, authenticated orders, offline catalog browsing, push notifications, admin push controls, and release artifacts for Google Play, RuStore, and App Store Connect.

**Architecture:** The work is split into three independently verifiable plans because the approved design spans two repositories and store operations. The existing website repository remains the source of truth for catalog, users, and orders. The new Expo application consumes a versioned bearer-token mobile API and stores only a read-only catalog cache and local cart state.

**Tech Stack:** PHP 8 with SQLite, Python catalog converter, Expo SDK 56, React Native, TypeScript, Expo Router, Expo SecureStore, AsyncStorage, Expo Notifications, Jest, React Native Testing Library, EAS Build, EAS Submit.

---

## Repositories

| Responsibility | Path |
| --- | --- |
| Mobile app, plans, and release docs | `C:\Users\user\Documents\GitHub\VSCode\splithub_mobile_app` |
| Existing website, API, admin panel, and catalog converter | `C:\Users\user\Documents\GitHub\splithub` |

The mobile workspace intentionally starts with documentation only. The website
repository is currently clean on branch `main`.

## Scope Decomposition

Implement the approved design in this order:

1. [Backend and admin plan](./2026-06-01-splithub-mobile-backend-plan.md)
2. [Expo mobile client plan](./2026-06-01-splithub-mobile-client-plan.md)
3. [Store release plan](./2026-06-01-splithub-mobile-release-plan.md)

Before mobile Task 9, complete release Task 1 so the development builds have
stable application identifiers, `mobile/eas.json`, and an EAS `projectId`.

Each plan has its own verification boundary:

- Backend: staging API responses, authoritative order validation, and recorded
  push delivery attempts.
- Mobile client: automated TypeScript tests plus development builds exercised
  against staging.
- Release: signed artifacts, physical-device smoke tests, and store submission
  records.

## Execution Notes

- Use an isolated Git worktree before implementation in each repository.
- The current Windows workstation has Node.js and `npm.cmd`, but `php` and
  Docker are not available on `PATH` as of 2026-06-01. Install PHP CLI before
  running backend tests locally, or run those checks on a staging host with PHP
  8 and SQLite enabled.
- Use `npm.cmd` and `npx.cmd` in PowerShell because the local execution policy
  blocks `npm.ps1`.
- Keep production credentials out of Git. Expo credentials, Apple credentials,
  Firebase credentials, RuStore credentials, Telegram bot tokens, and cron
  secrets are configured outside committed files.
- Complete backend Task 0A first. The current website repository contains a
  tracked Telegram credential, so rotate it and externalize runtime
  configuration before deploying any mobile API changes.
- Do not deploy backend changes directly to production before the staging
  verification task passes.

## Milestones

### Milestone 1: Mobile API Contract

Complete backend Tasks 1-5. Success means the app can load a catalog snapshot,
authenticate an existing customer, create a validated order, read order
history, and update notification preferences against staging.

### Milestone 2: Customer App Core

Complete mobile Tasks 1-7. Success means a tester can browse the catalog, work
offline with a cached snapshot, add products to the cart, sign in, submit an
order, inspect history, repeat an order, and cancel a `new` order.

### Milestone 3: Notifications And Admin

Complete backend Tasks 6-8 and mobile Task 8. Success means all three push types
are delivered to physical Android and iPhone devices and route to the correct
screen or Telegram action.

### Milestone 4: Publication

Complete the release plan. Success means an AAB is submitted to Google Play, an
APK is uploaded to RuStore, and an iOS build is submitted to App Store Connect.

## Final Cross-Plan Verification

- [ ] Run backend PHP tests from `C:\Users\user\Documents\GitHub\splithub`.

```powershell
php tests/php/run.php
```

Expected: every test prints `PASS`, and the command exits with code `0`.

- [ ] Run mobile automated checks from
  `C:\Users\user\Documents\GitHub\VSCode\splithub_mobile_app\mobile`.

```powershell
npm.cmd test -- --runInBand
npx.cmd expo-doctor
```

Expected: Jest exits with code `0`; Expo Doctor reports no project issues.

- [ ] Complete the physical-device matrix in the release plan.

- [ ] Commit the verified implementation in each repository with repository-
  local commit messages.
