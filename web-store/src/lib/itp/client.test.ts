import { describe, expect, it, vi } from "vitest";
import { createItpRpcClient } from "@/lib/itp/client";

describe("createItpRpcClient", () => {
  it("adds cached session and sends JSON-RPC payload to ITP", async () => {
    const fetcher = vi.fn(async () => Response.json({ success: true, data: { ok: true } }));
    const client = createItpRpcClient({
      rpcUrl: "https://b2b.i-t-p.pro/api/2",
      fetcher,
      getSession: async () => "SESSION-1",
      clearSession: async () => undefined,
    });

    await client.rpc({
      request: {
        method: "get_active_products",
        model: "client_api",
        module: "platform",
      },
    });

    expect(fetcher).toHaveBeenCalledWith(
      "https://b2b.i-t-p.pro/api/2",
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: expect.stringContaining('"session":"SESSION-1"'),
      }),
    );
  });

  it("refreshes the session once when supplier reports auth failure", async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(Response.json({ success: false, event: "1", message: "auth error" }))
      .mockResolvedValueOnce(Response.json({ success: true, data: { ok: true } }));
    const clearSession = vi.fn(async () => undefined);
    const sessions = ["OLD", "NEW"];
    const client = createItpRpcClient({
      rpcUrl: "https://b2b.i-t-p.pro/api/2",
      fetcher,
      getSession: async () => sessions.shift() ?? "NEW",
      clearSession,
    });

    const response = await client.rpc({
      request: {
        method: "read",
        model: "products",
        module: "platform",
      },
    });

    expect(response.success).toBe(true);
    expect(clearSession).toHaveBeenCalledOnce();
    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(fetcher.mock.calls[1][1]?.body).toContain('"session":"NEW"');
  });
});
