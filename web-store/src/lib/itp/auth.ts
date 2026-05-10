import type { ItpRpcResponse } from "@/lib/itp/types";

let cachedSession: string | null = null;
let loginPromise: Promise<string> | null = null;

export function buildItpLoginPayload(login: string, password: string) {
  return {
    data: {
      login,
      password,
    },
    request: {
      method: "login",
      model: "auth",
      module: "quickfox",
    },
  };
}

export async function loginItp(fetcher: typeof fetch = fetch): Promise<string> {
  const login = process.env.ITP_API_LOGIN;
  const password = process.env.ITP_API_PASSWORD;
  const rpcUrl = process.env.ITP_API_RPC_URL;

  if (!login || !password || !rpcUrl) {
    throw new Error("ITP_API_LOGIN, ITP_API_PASSWORD and ITP_API_RPC_URL must be configured.");
  }

  const response = await fetcher(rpcUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(buildItpLoginPayload(login, password)),
  });
  const json = (await response.json()) as ItpRpcResponse<unknown>;

  if (!json.success || !json.session) {
    throw new Error(`ITP login failed: ${json.message ?? "empty session"}`);
  }

  cachedSession = json.session;
  return json.session;
}

export async function getItpSession(): Promise<string> {
  if (cachedSession) {
    return cachedSession;
  }

  loginPromise ??= loginItp().finally(() => {
    loginPromise = null;
  });

  return loginPromise;
}

export async function clearItpSession(): Promise<void> {
  cachedSession = null;
}
