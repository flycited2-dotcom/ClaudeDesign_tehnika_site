import { clearItpSession, getItpSession } from "@/lib/itp/auth";
import type { ItpRpcRequest, ItpRpcResponse } from "@/lib/itp/types";

type Fetcher = typeof fetch;

type ItpRpcClientOptions = {
  rpcUrl: string;
  fetcher: Fetcher;
  getSession: () => Promise<string>;
  clearSession: () => Promise<void>;
};

export function shouldRefreshSession(response: ItpRpcResponse<unknown>): boolean {
  const message = response.message?.toLowerCase() ?? "";
  return response.success === false && (response.event === "1" || message.includes("auth") || message.includes("session"));
}

export function createItpRpcClient({
  rpcUrl,
  fetcher,
  getSession,
  clearSession,
}: ItpRpcClientOptions) {
  async function send<T>(
    payload: Omit<ItpRpcRequest, "session">,
    session: string,
  ): Promise<ItpRpcResponse<T>> {
    const response = await fetcher(rpcUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...payload,
        session,
      }),
    });

    return (await response.json()) as ItpRpcResponse<T>;
  }

  return {
    async rpc<T>(payload: Omit<ItpRpcRequest, "session">): Promise<ItpRpcResponse<T>> {
      const session = await getSession();
      const response = await send<T>(payload, session);

      if (shouldRefreshSession(response)) {
        await clearSession();
        const refreshedSession = await getSession();
        return send<T>(payload, refreshedSession);
      }

      return response;
    },
  };
}

export async function itpRpc<T>(payload: Omit<ItpRpcRequest, "session">): Promise<ItpRpcResponse<T>> {
  const rpcUrl = process.env.ITP_API_RPC_URL;

  if (!rpcUrl) {
    throw new Error("ITP_API_RPC_URL must be configured.");
  }

  return createItpRpcClient({
    rpcUrl,
    fetcher: fetch,
    getSession: getItpSession,
    clearSession: clearItpSession,
  }).rpc<T>(payload);
}
