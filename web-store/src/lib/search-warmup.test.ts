import { describe, expect, it, vi } from "vitest";
import { warmSearchQueries } from "@/lib/search-warmup";

describe("warmSearchQueries", () => {
  it("warms the result page and suggestion endpoint for every canonical query", async () => {
    const fetchImpl = vi.fn().mockResolvedValue({ ok: true, status: 200 });

    await warmSearchQueries({
      baseUrl: "https://example.test/",
      queries: ["телевизор"],
      fetchImpl,
    });

    expect(fetchImpl.mock.calls.map(([url]) => url)).toEqual([
      "https://example.test/search?q=%D1%82%D0%B5%D0%BB%D0%B5%D0%B2%D0%B8%D0%B7%D0%BE%D1%80",
      "https://example.test/api/search/suggest?q=%D1%82%D0%B5%D0%BB%D0%B5%D0%B2%D0%B8%D0%B7%D0%BE%D1%80",
    ]);
  });

  it("stops and reports the URL when a warmup request fails", async () => {
    await expect(
      warmSearchQueries({
        baseUrl: "https://example.test",
        queries: ["ноутбук"],
        fetchImpl: vi.fn().mockResolvedValue({ ok: false, status: 503 }),
      }),
    ).rejects.toThrow("503");
  });
});
