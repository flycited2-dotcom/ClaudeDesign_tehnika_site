import { describe, expect, it } from "vitest";
import { SYNC_LOCK_STALE_MS, isFreshRunningLock } from "./sync-lock";

describe("isFreshRunningLock", () => {
  it("treats a just-started run as locked", () => {
    const now = Date.parse("2026-07-01T12:00:00Z");
    expect(isFreshRunningLock(new Date(now), now)).toBe(true);
  });

  it("treats a run inside the stale window as still locked", () => {
    const now = Date.parse("2026-07-01T12:00:00Z");
    const startedAt = new Date(now - (SYNC_LOCK_STALE_MS - 1000));
    expect(isFreshRunningLock(startedAt, now)).toBe(true);
  });

  it("treats a run past the stale window as expired", () => {
    const now = Date.parse("2026-07-01T12:00:00Z");
    const startedAt = new Date(now - (SYNC_LOCK_STALE_MS + 1000));
    expect(isFreshRunningLock(startedAt, now)).toBe(false);
  });
});
