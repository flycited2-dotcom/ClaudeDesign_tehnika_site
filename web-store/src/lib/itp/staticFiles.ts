import { getItpSession } from "@/lib/itp/auth";

export async function downloadItpStaticJson<T>(path: string): Promise<T> {
  const baseUrl = process.env.ITP_API_BASE_URL ?? "https://b2b.i-t-p.pro";
  const session = await getItpSession();
  const url = new URL(path, baseUrl);
  const response = await fetch(url, {
    headers: {
      Cookie: `session=${session}`,
    },
  });

  if (!response.ok) {
    throw new Error(`ITP static file download failed: ${response.status} ${response.statusText}`);
  }

  return (await response.json()) as T;
}
