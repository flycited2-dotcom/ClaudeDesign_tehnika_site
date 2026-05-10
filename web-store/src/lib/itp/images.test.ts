import { describe, expect, it } from "vitest";
import { isTransientImageSyncError, parseImageSyncLimit, runWithImageSyncRetry } from "@/lib/itp/images";

describe("parseImageSyncLimit", () => {
  it("uses null for full image sync and positive numbers for capped syncs", () => {
    expect(parseImageSyncLimit(undefined)).toBeNull();
    expect(parseImageSyncLimit("all")).toBeNull();
    expect(parseImageSyncLimit("0")).toBeNull();
    expect(parseImageSyncLimit("250")).toBe(250);
  });

  it("falls back to full sync for invalid values", () => {
    expect(parseImageSyncLimit("not-a-number")).toBeNull();
    expect(parseImageSyncLimit("-5")).toBeNull();
  });
});

describe("isTransientImageSyncError", () => {
  it("detects supplier network timeouts as retryable", () => {
    const error = Object.assign(new Error("fetch failed"), {
      cause: Object.assign(new Error("read ETIMEDOUT"), { code: "ETIMEDOUT" }),
    });

    expect(isTransientImageSyncError(error)).toBe(true);
    expect(isTransientImageSyncError(new Error("Invalid API request"))).toBe(false);
  });
});

describe("runWithImageSyncRetry", () => {
  it("retries transient failures before succeeding", async () => {
    let attempts = 0;
    const result = await runWithImageSyncRetry(
      async () => {
        attempts += 1;
        if (attempts < 3) {
          throw Object.assign(new Error("fetch failed"), { code: "ETIMEDOUT" });
        }

        return "ok";
      },
      { attempts: 3, sleepMs: 0 },
    );

    expect(result).toBe("ok");
    expect(attempts).toBe(3);
  });
});
